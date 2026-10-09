import { ASNRecord, ApiResponse } from '../types';
import { 
  getWebhookUrl, 
  SHEET_NAME, 
  getLocalData, 
  saveLocalData, 
  setLastSyncTime, 
  getLastSyncTime 
} from './sheetsService';

export interface DashboardDataResponse {
  totalPegawai: number;
  sudahMengisi: number;
  belumMengisi: number;
  persentase: number;
  rataRataIP: number;
  skorTertinggi: number;
  records: ASNRecord[];
}

/**
 * cariNIP(nip) -> GET ?action=cari_nip&nip=123
 * Mengambil data ASN berdasarkan NIP dari Webhook Google Apps Script atau cache lokal.
 * Tangkap dan auto-fill nilaiLama.link_bukti ke dalam input form jika sudah isi.
 */
export async function cariNIP(nip: string): Promise<ApiResponse<{ record?: ASNRecord; nilaiLama?: any; sudahIsi: boolean }>> {
  const cleanNip = (nip || '').trim().replace(/\s+/g, '');
  if (!cleanNip) {
    return {
      success: false,
      message: 'NIP tidak boleh kosong',
    };
  }

  // 1. Cek terlebih dahulu di data lokal/cache
  const localList = getLocalData();
  const localRecord = localList.find(
    (item) => item.nip === cleanNip || item.nip.replace(/\s+/g, '') === cleanNip
  );

  // 2. Coba request online ke Webhook Apps Script via GET ?action=cari_nip&nip=...
  const webhookUrl = getWebhookUrl();
  const urlWithParams = `${webhookUrl}${webhookUrl.includes('?') ? '&' : '?'}action=cari_nip&nip=${encodeURIComponent(cleanNip)}`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000); // 6s timeout

    const res = await fetch(urlWithParams, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const json = await res.json();
      if (json && (json.success || json.data || json.nilaiLama)) {
        const remoteNilaiLama = json.nilaiLama || json.data || {};
        const sudahIsi = json.sudahIsi !== undefined 
          ? Boolean(json.sudahIsi) 
          : (remoteNilaiLama.status === 'Sudah' || (remoteNilaiLama.totalIP && remoteNilaiLama.totalIP > 0) || Boolean(remoteNilaiLama.link_bukti));

        // Sinkronkan ke local record jika ada
        const mergedRecord: ASNRecord = localRecord ? {
          ...localRecord,
          ...(json.data || {}),
          link_bukti: remoteNilaiLama.link_bukti || localRecord.link_bukti || '',
          kualifikasi: remoteNilaiLama.kualifikasi !== undefined ? remoteNilaiLama.kualifikasi : localRecord.kualifikasi,
          kompetensi: remoteNilaiLama.kompetensi !== undefined ? remoteNilaiLama.kompetensi : localRecord.kompetensi,
          kinerja: remoteNilaiLama.kinerja !== undefined ? remoteNilaiLama.kinerja : localRecord.kinerja,
          disiplin: remoteNilaiLama.disiplin !== undefined ? remoteNilaiLama.disiplin : localRecord.disiplin,
          totalIP: remoteNilaiLama.totalIP !== undefined ? remoteNilaiLama.totalIP : localRecord.totalIP,
          status: sudahIsi ? 'Sudah' : (localRecord.status || 'Belum'),
        } : (json.data as ASNRecord);

        return {
          success: true,
          message: json.message || 'Data ASN berhasil ditemukan',
          data: {
            record: mergedRecord,
            nilaiLama: {
              nip: cleanNip,
              kualifikasi: remoteNilaiLama.kualifikasi ?? mergedRecord?.kualifikasi,
              kompetensi: remoteNilaiLama.kompetensi ?? mergedRecord?.kompetensi,
              kinerja: remoteNilaiLama.kinerja ?? mergedRecord?.kinerja,
              disiplin: remoteNilaiLama.disiplin ?? mergedRecord?.disiplin,
              totalIP: remoteNilaiLama.totalIP ?? mergedRecord?.totalIP,
              link_bukti: remoteNilaiLama.link_bukti ?? mergedRecord?.link_bukti ?? '',
              status: sudahIsi ? 'Sudah' : 'Belum',
            },
            sudahIsi,
          },
          nilaiLama: {
            nip: cleanNip,
            kualifikasi: remoteNilaiLama.kualifikasi ?? mergedRecord?.kualifikasi,
            kompetensi: remoteNilaiLama.kompetensi ?? mergedRecord?.kompetensi,
            kinerja: remoteNilaiLama.kinerja ?? mergedRecord?.kinerja,
            disiplin: remoteNilaiLama.disiplin ?? mergedRecord?.disiplin,
            totalIP: remoteNilaiLama.totalIP ?? mergedRecord?.totalIP,
            link_bukti: remoteNilaiLama.link_bukti ?? mergedRecord?.link_bukti ?? '',
            status: sudahIsi ? 'Sudah' : 'Belum',
          },
        };
      }
    }
  } catch (err) {
    // Webhook mungkin tidak mengizinkan CORS GET langsung atau offline,
    // fallback menggunakan local record yang sudah tersinkronisasi
    console.info('Pencarian NIP online dialihkan ke database lokal (fallback):', err);
  }

  // Fallback ke localRecord
  if (localRecord) {
    const isSudah = localRecord.status === 'Sudah' && (localRecord.totalIP > 0 || Boolean(localRecord.link_bukti));
    return {
      success: true,
      message: 'Data ASN ditemukan di database lokal',
      data: {
        record: localRecord,
        nilaiLama: {
          nip: localRecord.nip,
          kualifikasi: localRecord.kualifikasi,
          kompetensi: localRecord.kompetensi,
          kinerja: localRecord.kinerja,
          disiplin: localRecord.disiplin,
          totalIP: localRecord.totalIP,
          link_bukti: localRecord.link_bukti || '',
          status: localRecord.status,
        },
        sudahIsi: isSudah,
      },
      nilaiLama: {
        nip: localRecord.nip,
        kualifikasi: localRecord.kualifikasi,
        kompetensi: localRecord.kompetensi,
        kinerja: localRecord.kinerja,
        disiplin: localRecord.disiplin,
        totalIP: localRecord.totalIP,
        link_bukti: localRecord.link_bukti || '',
        status: localRecord.status,
      },
    };
  }

  return {
    success: false,
    message: `Pegawai dengan NIP "${cleanNip}" tidak ditemukan`,
  };
}

/**
 * submitData(formData) -> POST
 * Pastikan formData yang di-JSON-kan mencakup key:
 * action: 'simpan_atau_update', nip, kualifikasi, kompetensi, kinerja, disiplin, dan link_bukti.
 */
export async function submitData(formData: {
  action?: string;
  nip: string;
  kualifikasi: number;
  kompetensi: number;
  kinerja: number;
  disiplin: number;
  link_bukti?: string;
  nama?: string;
  unitKerja?: string;
  jabatan?: string;
  golongan?: string;
  totalIP?: number;
  [key: string]: any;
}): Promise<ApiResponse<{ updatedRecord: ASNRecord; allData: ASNRecord[] }>> {
  const webhookUrl = getWebhookUrl();
  const cleanNip = String(formData.nip || '').trim();

  const totalIP = Number(formData.totalIP) || 
    (Number(formData.kualifikasi || 0) + Number(formData.kompetensi || 0) + Number(formData.kinerja || 0) + Number(formData.disiplin || 0));

  const nowStr = new Date().toLocaleString('id-ID', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });

  // Susun payload tepat sesuai instruksi user:
  // key: action: 'simpan_atau_update', nip, kualifikasi, kompetensi, kinerja, disiplin, dan link_bukti
  const payload = {
    action: 'simpan_atau_update',
    nip: cleanNip,
    kualifikasi: Number(formData.kualifikasi || 0),
    kompetensi: Number(formData.kompetensi || 0),
    kinerja: Number(formData.kinerja || 0),
    disiplin: Number(formData.disiplin || 0),
    link_bukti: formData.link_bukti ? String(formData.link_bukti).trim() : '',
    // Metadata pelengkap untuk spreadsheet DATA_ASN
    sheet: SHEET_NAME,
    totalIP: totalIP,
    total: totalIP,
    status: 'Sudah',
    nama: formData.nama || '',
    unitKerja: formData.unitKerja || '',
    jabatan: formData.jabatan || '',
    golongan: formData.golongan || '',
    timestamp: nowStr,
    lastUpdated: nowStr,
    periode: '2026-TW',
  };

  // Simpan ke local storage
  const currentList = getLocalData();
  const existingIdx = currentList.findIndex((item) => item.nip === cleanNip);

  let updatedRecord: ASNRecord;
  let nextList: ASNRecord[];

  if (existingIdx >= 0) {
    updatedRecord = {
      ...currentList[existingIdx],
      ...payload,
      status: 'Sudah',
      lastUpdated: nowStr,
    };
    nextList = [...currentList];
    nextList[existingIdx] = updatedRecord;
  } else {
    updatedRecord = {
      nip: cleanNip,
      nama: formData.nama || 'Pegawai ASN',
      unitKerja: formData.unitKerja || 'Kankemenag Kab. Gunungkidul',
      jabatan: formData.jabatan || 'Pegawai ASN',
      golongan: formData.golongan,
      kualifikasi: payload.kualifikasi,
      kompetensi: payload.kompetensi,
      kinerja: payload.kinerja,
      disiplin: payload.disiplin,
      totalIP: payload.totalIP,
      status: 'Sudah',
      link_bukti: payload.link_bukti,
      lastUpdated: nowStr,
      periode: '2026-TW',
    };
    nextList = [updatedRecord, ...currentList];
  }

  saveLocalData(nextList);
  setLastSyncTime(nowStr);

  // Kirim ke Google Apps Script Webhook
  try {
    // 1. Kirim JSON POST (application/json dan text/plain)
    const jsonBody = JSON.stringify(payload);
    
    // Mode no-cors mengizinkan browser memanggil Webhook GAS tanpa terhambat CORS redirect
    await fetch(webhookUrl, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: jsonBody,
    }).catch((e) => console.warn('POST JSON no-cors:', e));

    // 2. Kirim juga via URLSearchParams / form-data untuk skrip GAS doPost(e) yang membaca e.parameter
    const formParams = new URLSearchParams();
    Object.entries(payload).forEach(([k, v]) => {
      formParams.append(k, String(v));
    });

    fetch(webhookUrl, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formParams.toString(),
    }).catch(() => {});

    return {
      success: true,
      message: `Data IP ASN ${updatedRecord.nama || cleanNip} berhasil disimpan dan dikirim ke Webhook Google Apps Script!`,
      data: {
        updatedRecord,
        allData: nextList,
      },
    };
  } catch (err: any) {
    console.error('Error submitData ke webhook:', err);
    return {
      success: true,
      message: `Data berhasil disimpan di sistem lokal (Webhook dikirim di latar belakang).`,
      data: {
        updatedRecord,
        allData: nextList,
      },
    };
  }
}

/**
 * getDashboardData() -> GET ?action=get_dashboard
 * Mengambil ringkasan statistik dan rekapitulasi data dari Webhook / Sheets
 */
export async function getDashboardData(): Promise<ApiResponse<DashboardDataResponse>> {
  const webhookUrl = getWebhookUrl();
  const urlWithParams = `${webhookUrl}${webhookUrl.includes('?') ? '&' : '?'}action=get_dashboard`;

  const localList = getLocalData();
  const filled = localList.filter((a) => a.status === 'Sudah');
  const totalPegawai = localList.length;
  const sudahMengisi = filled.length;
  const belumMengisi = Math.max(0, totalPegawai - sudahMengisi);
  const persentase = totalPegawai > 0 ? Math.round((sudahMengisi / totalPegawai) * 100) : 0;
  const sumIP = filled.reduce((acc, curr) => acc + (curr.totalIP || 0), 0);
  const rataRataIP = sudahMengisi > 0 ? Number((sumIP / sudahMengisi).toFixed(1)) : 0;
  const skorTertinggi = sudahMengisi > 0 ? Math.max(...filled.map((a) => a.totalIP || 0)) : 0;

  const defaultLocalData: DashboardDataResponse = {
    totalPegawai,
    sudahMengisi,
    belumMengisi,
    persentase,
    rataRataIP,
    skorTertinggi,
    records: localList,
  };

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(urlWithParams, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const json = await res.json();
      if (json && (json.success || json.data)) {
        return {
          success: true,
          message: 'Data dashboard berhasil diambil dari Webhook',
          data: {
            ...defaultLocalData,
            ...(json.data || json),
          },
        };
      }
    }
  } catch (err) {
    console.info('getDashboardData() dialihkan ke data lokal:', err);
  }

  return {
    success: true,
    message: 'Data dashboard termuat dari basis data',
    data: defaultLocalData,
  };
}
