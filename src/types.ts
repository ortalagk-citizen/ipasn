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
}
