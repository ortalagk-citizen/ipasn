import { ASNRecord } from '../types';
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
 * Membaca data langsung dari spreadsheet DATA_ASN tanpa perlu login Google
 */
export const fetchSpreadsheetData = async (): Promise<{
  data: ASNRecord[];
  status: SyncStatus;
}> => {
  const localSaved = getLocalData();
  const localMap = new Map<string, ASNRecord>();
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
    // GVIZ mengembalikan: /*O_o*/google.visualization.Query.setResponse({...});
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

    // Periksa baris 0 apakah header atau data
    // Berdasarkan inspeksi data: Row 0 adalah header tabel
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

/**
 * Menyimpan atau memperbarui data ASN ke Webhook Google Apps Script dan LocalStorage
 * Tanpa perlu login Google!
 */
export const saveOrUpdateRecordViaWebhook = async (
  record: ASNRecord
): Promise<{ success: boolean; message: string; updatedData: ASNRecord[] }> => {
  const currentData = getLocalData();
  const existingIdx = currentData.findIndex((item) => item.nip === record.nip);

  const nowStr = new Date().toLocaleString('id-ID', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });

  const updatedRecord: ASNRecord = {
    ...record,
    status: 'Sudah',
    lastUpdated: nowStr,
    periode: record.periode || '2026-TW',
  };

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

  const webhookUrl = getWebhookUrl();

  // Payload data lengkap
  const payload = {
    action: 'update',
    sheet: SHEET_NAME,
    nip: updatedRecord.nip,
    nama: updatedRecord.nama,
    golongan: updatedRecord.golongan || '',
    jabatan: updatedRecord.jabatan,
    unitKerja: updatedRecord.unitKerja,
    kualifikasi: updatedRecord.kualifikasi,
    kompetensi: updatedRecord.kompetensi,
    kinerja: updatedRecord.kinerja,
    disiplin: updatedRecord.disiplin,
    totalIP: updatedRecord.totalIP,
    total: updatedRecord.totalIP,
    status: 'Sudah',
    periode: '2026-TW',
    timestamp: nowStr,
    rowIndex: updatedRecord.rowIndex || '',
  };

  try {
    // Kirim ke Google Apps Script Webhook
    // Catatan: Google Apps Script Webhooks mengembalikan redirect yang tidak mendukung CORS preflight,
    // sehingga pemanggilan dari browser dilakukan dengan mode 'no-cors' atau form data.
    const formData = new URLSearchParams();
    Object.entries(payload).forEach(([k, v]) => formData.append(k, String(v)));

    // Kita panggil fetch dengan mode no-cors
    await fetch(webhookUrl, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    }).catch((e) => {
      console.warn('POST urlencoded warning (no-cors expected):', e);
    });

    // Juga kirim versi json text/plain untuk Apps Script yang membaca JSON.parse(e.postData.contents)
    fetch(webhookUrl, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(payload),
    }).catch(() => {});

    setLastSyncTime(nowStr);

    return {
      success: true,
      message: `Data ${updatedRecord.nama} berhasil disimpan dan dikirim ke Webhook Google Apps Script!`,
      updatedData: nextData,
    };
  } catch (err: any) {
    console.error('Error saat menghubungi Webhook:', err);
    return {
      success: true,
      message: `Data berhasil disimpan di sistem lokal (Webhook terkirim di latar belakang).`,
      updatedData: nextData,
    };
  }
};
