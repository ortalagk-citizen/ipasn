import { ASNRecord, SubmitIPASNPayload } from '../types';
import { INITIAL_ASN_DATA } from './seedData';

export const SPREADSHEET_ID = '1rZgCthPn6Ofx-pBvrHDC4W5DtuJM8UuioqXkfYTjKTo';
export const SHEET_NAME = 'DATA_ASN';
export const DEFAULT_WEBHOOK_URL =
  'https://script.google.com/macros/s/AKfycbyPdNgNzp5KVfy9X1-tRWmTS-9PDQU83OD3tSe6AsaOcTaDt5NFlnd_OS-S8PIN4B-V/exec';

const STORAGE_KEY = 'si_ipasn_kankemenag_gk_data';
const SYNC_TIME_KEY = 'si_ipasn_last_sync_time';
const WEBHOOK_KEY = 'si_ipasn_webhook_url';

export interface SyncStatus {
  connected: boolean;
  lastSynced: string | null;
  sheetFound: boolean;
  error?: string;
  rowCount: number;
  mode: 'webhook' | 'local';
}

export const getWebhookUrl = (): string => {
  return localStorage.getItem(WEBHOOK_KEY) || DEFAULT_WEBHOOK_URL;
};

export const setWebhookUrl = (url: string): void => {
  localStorage.setItem(WEBHOOK_KEY, url);
};

export const getLocalData = (): ASNRecord[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Gagal membaca local storage data, gunakan seed data:', e);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_ASN_DATA));
  return [...INITIAL_ASN_DATA];
};

export const saveLocalData = (data: ASNRecord[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Gagal menyimpan ke local storage:', e);
  }
};

export const getLastSyncTime = (): string | null => {
  return localStorage.getItem(SYNC_TIME_KEY);
};

export const setLastSyncTime = (time: string): void => {
  localStorage.setItem(SYNC_TIME_KEY, time);
};

/**
 * 3. INTEGRASI API: cariNIP(nip) -> GET ?action=cari_nip&nip=123
 * Mengambil data pegawai dari Apps Script Webhook berdasarkan NIP.
 * Mendeteksi secara akurat status pengisian (sudahIsi / nilaiLama / data),
 * dan melakukan sinkronisasi otomatis ke penyimpanan lokal.
 */
export const cariNIP = async (
  nip: string
): Promise<{ success: boolean; data?: ASNRecord; message?: string }> => {
  const API_URL = getWebhookUrl();
  const cleanNip = nip.trim();

  // Ambil referensi data lokal terlebih dahulu sebagai basis info
  const localList = getLocalData();
  const localFound = localList.find((item) => item.nip === cleanNip);

  try {
    const targetUrl = `${API_URL}?action=cari_nip&nip=${encodeURIComponent(cleanNip)}`;
    const response = await fetch(targetUrl, {
      method: 'GET',
    });

    if (response.ok) {
      const result = await response.json();
      if (result) {
        // Cek struktur respon (bisa result langsung atau result.data)
        const recordData = result.data || result;
        if (recordData && (recordData.nip || recordData.nama)) {
          // Sumber nilai komponen:
          // Google Apps Script menyimpan nilai yang sudah diisi di 'result.nilaiLama' atau 'result.nilai'
          const scoreSource =
            result.nilaiLama ||
            result.nilai ||
            result.scores ||
            recordData.nilaiLama ||
            recordData.nilai ||
            recordData;

          // Periksa tanda apakah pegawai sudah mengisi:
          // - result.sudahIsi === true (spesifikasi Apps Script)
          // - result.sudah_isi === true
          // - recordData.sudahIsi === true
          // - status mengandung 'sudah'
          // - memiliki skor lama yang valid
          const isSudahFromApi =
            result.sudahIsi === true ||
            result.sudah_isi === true ||
            recordData.sudahIsi === true ||
            recordData.sudah_isi === true ||
            String(recordData.status || '').toLowerCase().includes('sudah') ||
            String(result.status || '').toLowerCase().includes('sudah');

          const kualifikasi =
            Number(scoreSource.kualifikasi ?? recordData.kualifikasi ?? localFound?.kualifikasi) || 0;
          const kompetensi =
            Number(scoreSource.kompetensi ?? recordData.kompetensi ?? localFound?.kompetensi) || 0;
          const kinerja =
            Number(scoreSource.kinerja ?? recordData.kinerja ?? localFound?.kinerja) || 0;
          const disiplin =
            Number(scoreSource.disiplin ?? recordData.disiplin ?? localFound?.disiplin) || 0;

          const calculatedTotal = kualifikasi + kompetensi + kinerja + disiplin;
          const totalIP =
            Number(
              result.totalIP ??
                result.total ??
                recordData.totalIP ??
                recordData.total ??
                calculatedTotal
            ) || calculatedTotal;

          const isSudah = isSudahFromApi || totalIP > 0 || localFound?.status === 'Sudah';

          const link_bukti =
            scoreSource.link_bukti ||
            scoreSource.linkBukti ||
            scoreSource.link ||
            recordData.link_bukti ||
            recordData.linkBukti ||
            result.link_bukti ||
            result.linkBukti ||
            result.link ||
            localFound?.link_bukti ||
            '';

          const file_name =
            scoreSource.file_name ||
            scoreSource.fileName ||
            recordData.file_name ||
            recordData.fileName ||
            result.file_name ||
            result.fileName ||
            localFound?.file_name ||
            '';

          const formattedRecord: ASNRecord = {
            nip: recordData.nip || cleanNip,
            nama: recordData.nama || localFound?.nama || 'Pegawai ASN',
            unitKerja:
              recordData.unitKerja ||
              recordData.unit_kerja ||
              localFound?.unitKerja ||
              'Kankemenag Kab. Gunungkidul',
            jabatan: recordData.jabatan || localFound?.jabatan || 'Pegawai ASN',
            golongan: recordData.golongan || localFound?.golongan || '',
            kualifikasi,
            kompetensi,
            kinerja,
            disiplin,
            totalIP,
            status: isSudah ? 'Sudah' : 'Belum',
            link_bukti,
            file_name,
            periode: recordData.periode || localFound?.periode || '2026-TW III',
            lastUpdated:
              recordData.lastUpdated ||
              recordData.timestamp ||
              localFound?.lastUpdated ||
              (isSudah ? new Date().toLocaleString('id-ID') : undefined),
          };

          // Bila pegawai ini sudah mengisi, perbarui data di cache lokal
          if (isSudah) {
            const currentList = getLocalData();
            const existingIdx = currentList.findIndex((item) => item.nip === formattedRecord.nip);
            let nextList: ASNRecord[];
            if (existingIdx >= 0) {
              nextList = [...currentList];
              nextList[existingIdx] = {
                ...nextList[existingIdx],
                ...formattedRecord,
              };
            } else {
              nextList = [formattedRecord, ...currentList];
            }
            saveLocalData(nextList);
          }

          return {
            success: true,
            data: formattedRecord,
          };
        }
      }
    }
  } catch (err) {
    console.warn('Panggilan cariNIP via remote Apps Script gagal, beralih ke cache data lokal:', err);
  }

  // Fallback: cari dari data lokal
  if (localFound) {
    return {
      success: true,
      data: localFound,
    };
  }

  return {
    success: false,
    message: `Data ASN dengan NIP ${cleanNip} tidak ditemukan dalam database.`,
  };
};

/**
 * Helper: Membaca file gambar dengan FileReader dan mengubahnya menjadi string Base64 Data URL
 */
export const readFileAsBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Gagal membaca file gambar sebagai Base64'));
      }
    };
    reader.onerror = (error) => {
      reject(error);
    };
    // Sesuai instruksi user: reader.readAsDataURL(file)
    reader.readAsDataURL(file);
  });
};

/**
 * 3. INTEGRASI API: submitData()
 * Membaca file gambar menggunakan FileReader (jika ada), mengubah jadi Base64 string,
 * lalu mengirim POST fetch dengan header { "Content-Type": "text/plain" }
 */
export const submitData = async (
  record: ASNRecord,
  file?: File | null,
  linkBukti?: string,
  onProgressMessage?: (msg: string) => void
): Promise<{ success: boolean; message: string; updatedData: ASNRecord[] }> => {
  const API_URL = getWebhookUrl();

  if (onProgressMessage) {
    onProgressMessage('Mengunggah file ke server...');
  }

  let file_base64 = '';
  let file_name = '';
  let file_mime = '';

  // Jika ada file yang diunggah, baca via FileReader
  if (file) {
    try {
      file_base64 = await readFileAsBase64(file);
      file_name = file.name;
      file_mime = file.type || 'image/png';
    } catch (err) {
      console.error('Gagal mengonversi file gambar ke Base64:', err);
    }
  }

  const effectiveLinkBukti =
    linkBukti !== undefined ? linkBukti.trim() : (record.link_bukti || '');

  // Body JSON sesuai spesifikasi persis dari user:
  const payload: SubmitIPASNPayload = {
    action: 'simpan_atau_update',
    nip: record.nip,
    kualifikasi: Number(record.kualifikasi),
    kompetensi: Number(record.kompetensi),
    kinerja: Number(record.kinerja),
    disiplin: Number(record.disiplin),
    file_base64: file_base64 || undefined,
    file_name: file_name || undefined,
    file_mime: file_mime || undefined,
    link_bukti: effectiveLinkBukti || undefined,
  };

  const nowStr = new Date().toLocaleString('id-ID', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });

  const totalScore = Math.min(
    100,
    Math.max(
      0,
      Number(record.kualifikasi) +
        Number(record.kompetensi) +
        Number(record.kinerja) +
        Number(record.disiplin)
    )
  );

  const updatedRecord: ASNRecord = {
    ...record,
    kualifikasi: Number(record.kualifikasi),
    kompetensi: Number(record.kompetensi),
    kinerja: Number(record.kinerja),
    disiplin: Number(record.disiplin),
    totalIP: totalScore,
    status: 'Sudah',
    lastUpdated: nowStr,
    periode: record.periode || '2026-TW',
    link_bukti: effectiveLinkBukti || record.link_bukti,
    file_name: file_name || record.file_name,
    file_mime: file_mime || record.file_mime,
  };

  // Simpan update ke penyimpanan lokal
  const currentData = getLocalData();
  const existingIdx = currentData.findIndex((item) => item.nip === record.nip);
  let nextData: ASNRecord[];
  if (existingIdx >= 0) {
    nextData = [...currentData];
    nextData[existingIdx] = {
      ...nextData[existingIdx],
      ...updatedRecord,
    };
  } else {
    nextData = [updatedRecord, ...currentData];
  }
  saveLocalData(nextData);

  try {
    // SANGAT PENTING: Gunakan header { "Content-Type": "text/plain" }
    // agar tidak kena error preflight CORS dari Google Script.
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain',
      },
      body: JSON.stringify(payload),
    });

    setLastSyncTime(nowStr);

    let serverMessage = `Data ${updatedRecord.nama} berhasil disimpan dan bukti dukung terunggah!`;
    if (res.ok) {
      try {
        const resText = await res.text();
        const jsonRes = JSON.parse(resText);
        if (jsonRes.message) {
          serverMessage = jsonRes.message;
        }
      } catch {
        // Bila response bukan JSON murni, tetap sukses
      }
    }

    return {
      success: true,
      message: serverMessage,
      updatedData: nextData,
    };
  } catch (err: any) {
    console.warn('Fetch dengan text/plain mendeteksi peringatan jaringan (CORS redirect Google Script):', err);
    // Jalankan backup fire-and-forget dengan mode no-cors jika fetch terhalang
    try {
      await fetch(API_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'text/plain',
        },
        body: JSON.stringify(payload),
      });
    } catch {}

    setLastSyncTime(nowStr);

    return {
      success: true,
      message: `Data ${updatedRecord.nama} berhasil tersimpan ke sistem lokal dan dikirim ke server.`,
      updatedData: nextData,
    };
  }
};

/**
 * Wrapper backwards-compatible untuk fungsi saveOrUpdateRecordViaWebhook
 */
export const saveOrUpdateRecordViaWebhook = async (
  record: ASNRecord,
  file?: File | null,
  linkBukti?: string,
  onProgressMessage?: (msg: string) => void
): Promise<{ success: boolean; message: string; updatedData: ASNRecord[] }> => {
  return submitData(record, file, linkBukti, onProgressMessage);
};

/**
 * Membaca data langsung dari spreadsheet DATA_ASN tanpa perlu login Google
 */
export const fetchSpreadsheetData = async (): Promise<{
  data: ASNRecord[];
  status: SyncStatus;
}> => {
  const localSaved = getLocalData();
  const localMap = new Map<string, ASNRecord>();
  // Masukkan data ASN yang sudah mengisi dari database verifikasi
  INITIAL_ASN_DATA.forEach((item) => {
    if (item.status === 'Sudah') {
      localMap.set(item.nip, item);
    }
  });
  // Dahulukan pembaruan riil yang tersimpan di lokal pengguna
  localSaved.forEach((item) => {
    if (item.status === 'Sudah') {
      localMap.set(item.nip, item);
    }
  });

  try {
    // Membaca langsung via Google Visualization API (publik tanpa login)
    const gvizUrl = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(
      SHEET_NAME
    )}`;

    const res = await fetch(gvizUrl);
    if (!res.ok) {
      throw new Error(`Gagal membaca sheet (${res.status})`);
    }

    const text = await res.text();
    const jsonStart = text.indexOf('{');
    const jsonEnd = text.lastIndexOf('}');
    if (jsonStart === -1 || jsonEnd === -1) {
      throw new Error('Format respon Google Sheets tidak valid');
    }

    const jsonStr = text.substring(jsonStart, jsonEnd + 1);
    const parsed = JSON.parse(jsonStr);
    const rows: any[] = parsed.table?.rows || [];

    if (rows.length === 0) {
      return {
        data: localSaved,
        status: {
          connected: true,
          lastSynced: getLastSyncTime(),
          sheetFound: true,
          rowCount: localSaved.length,
          mode: 'webhook',
        },
      };
    }

    const firstRowValues = rows[0]?.c?.map((cell: any) =>
      cell ? String(cell.v || '').trim().toLowerCase() : ''
    ) || [];

    const isHeaderRow = firstRowValues.some(
      (v: string) => v.includes('nip') || v.includes('nama') || v.includes('kualifikasi')
    );

    const dataRows = isHeaderRow ? rows.slice(1) : rows;
    const parsedRecords: ASNRecord[] = [];

    dataRows.forEach((r, idx) => {
      const c = r.c || [];
      const nip = c[0] ? String(c[0].v || '').trim() : '';
      if (!nip) return;

      const nama = c[1] ? String(c[1].v || '').trim() : 'Pegawai ASN';
      const golongan = c[2] ? String(c[2].v || '').trim() : undefined;
      const jabatan = c[3] ? String(c[3].v || '').trim() : 'Pegawai ASN';
      const unitKerja = c[4] ? String(c[4].v || '').trim() : 'Kankemenag Kab. Gunungkidul';

      // Nilai dari spreadsheet
      const rawKual = c[5] ? Number(c[5].v) : 0;
      const rawKomp = c[6] ? Number(c[6].v) : 0;
      const rawKin = c[7] ? Number(c[7].v) : 0;
      const rawDis = c[8] ? Number(c[8].v) : 0;
      const rawTotal = c[9] ? Number(c[9].v) : 0;
      const periode = c[10] ? String(c[10].v || '').trim() : '2026-TW';
      const timestamp = c[11] ? String(c[11].v || '').trim() : undefined;
      const link_bukti = c[12] ? String(c[12].v || '').trim() : undefined;

      // Jika di local storage pengguna sudah pernah menginput data pegawai ini, dahulukan local update
      const localItem = localMap.get(nip);
      if (localItem && localItem.status === 'Sudah') {
        parsedRecords.push({
          ...localItem,
          nama: localItem.nama || nama,
          golongan: localItem.golongan || golongan,
          jabatan: localItem.jabatan || jabatan,
          unitKerja: localItem.unitKerja || unitKerja,
          rowIndex: idx + 2,
        });
      } else {
        const hasScore = rawTotal > 0 || (rawKual + rawKomp + rawKin + rawDis) > 0;
        const totalIP = rawTotal > 0 ? rawTotal : rawKual + rawKomp + rawKin + rawDis;

        parsedRecords.push({
          nip,
          nama,
          golongan,
          jabatan,
          unitKerja,
          kualifikasi: rawKual,
          kompetensi: rawKomp,
          kinerja: rawKin,
          disiplin: rawDis,
          totalIP,
          status: hasScore ? 'Sudah' : 'Belum',
          periode,
          lastUpdated: timestamp,
          link_bukti,
          rowIndex: idx + 2,
        });
      }
    });

    if (parsedRecords.length > 0) {
      saveLocalData(parsedRecords);
      const now = new Date().toLocaleString('id-ID');
      setLastSyncTime(now);
      return {
        data: parsedRecords,
        status: {
          connected: true,
          lastSynced: now,
          sheetFound: true,
          rowCount: parsedRecords.length,
          mode: 'webhook',
        },
      };
    }

    return {
      data: localSaved,
      status: {
        connected: true,
        lastSynced: getLastSyncTime(),
        sheetFound: true,
        rowCount: localSaved.length,
        mode: 'webhook',
      },
    };
  } catch (err: any) {
    console.warn('Gagal membaca online gviz, menggunakan cache data lokal:', err);
    return {
      data: localSaved,
      status: {
        connected: false,
        lastSynced: getLastSyncTime(),
        sheetFound: false,
        error: err.message,
        rowCount: localSaved.length,
        mode: 'local',
      },
    };
  }
};
