export interface ASNRecord {
  nip: string;
  nama: string;
  unitKerja: string;
  jabatan: string;
  golongan?: string;
  kualifikasi: number; // maks 25
  kompetensi: number;  // maks 40
  kinerja: number;     // maks 30
  disiplin: number;    // maks 5
  totalIP: number;     // maks 100
  status: 'Sudah' | 'Belum';
  lastUpdated?: string;
  periode?: string;
  rowIndex?: number;   // row in Google Sheets (1-based)
  catatan?: string;
  kualifikasiDetail?: string;
  kompetensiDetail?: string;
  kinerjaDetail?: string;
  disiplinDetail?: string;
  link_bukti?: string;
  file_name?: string;
  file_mime?: string;
  file_base64?: string;
}

export interface UnitKerjaRekap {
  unitKerja: string;
  total: number;
  sudah: number;
  belum: number;
  persentase: number;
  rataRataIP: number;
}

export type ActiveMenu = 'input' | 'dashboard' | 'daftar' | 'rekap';

export interface FormIPASN {
  nip: string;
  nama: string;
  unitKerja: string;
  jabatan: string;
  kualifikasi: number;
  kompetensi: number;
  kinerja: number;
  disiplin: number;
  kualifikasiOpsi?: string;
  kompetensiOpsi?: string[];
  kinerjaOpsi?: string;
  disiplinOpsi?: string;
  link_bukti?: string;
}

export interface SubmitIPASNPayload {
  action: 'simpan_atau_update';
  nip: string;
  kualifikasi: number;
  kompetensi: number;
  kinerja: number;
  disiplin: number;
  file_base64?: string;
  file_name?: string;
  file_mime?: string;
  link_bukti?: string;
}
