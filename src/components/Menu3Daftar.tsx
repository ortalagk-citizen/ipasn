import React, { useState, useMemo, useEffect } from 'react';
import { ASNRecord } from '../types';
import { 
  ClipboardList, 
  Search, 
  Filter, 
  Download, 
  Printer, 
  Eye, 
  Edit3, 
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  X,
  Building,
  CheckCircle2,
  TrendingUp,
  Sparkles,
  Award,
  Users
} from 'lucide-react';

interface Menu3DaftarProps {
  asnList: ASNRecord[];
  onViewInDashboard: (nip: string) => void;
  onEditInInput: (nip: string) => void;
}

export const Menu3Daftar: React.FC<Menu3DaftarProps> = ({
  asnList,
  onViewInDashboard,
  onEditInInput,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUnit, setSelectedUnit] = useState('Semua');
  const [sortBy, setSortBy] = useState<'score-desc' | 'score-asc' | 'name-asc'>('score-desc');
  
  // Pilihan tampilan: 25, 50, 100, dan Semua
  const [pageSize, setPageSize] = useState<number | 'all'>(25);
  const [currentPage, setCurrentPage] = useState(1);

  // Filter ONLY ASN who "Sudah Mengisi"
  const filledList = useMemo(() => {
    return asnList.filter((asn) => asn.status === 'Sudah');
  }, [asnList]);

  const sortedAndFiltered = useMemo(() => {
    return filledList
      .filter((asn) => {
        const cleanSearch = searchTerm.trim().toLowerCase();
        if (!cleanSearch) return true;
        const matchesSearch =
          asn.nama.toLowerCase().includes(cleanSearch) ||
          asn.nip.includes(cleanSearch) ||
          asn.jabatan.toLowerCase().includes(cleanSearch) ||
          (asn.golongan && asn.golongan.toLowerCase().includes(cleanSearch)) ||
          asn.unitKerja.toLowerCase().includes(cleanSearch);
        const matchesUnit = selectedUnit === 'Semua' || asn.unitKerja === selectedUnit;
        return matchesSearch && matchesUnit;
      })
      .filter((asn) => selectedUnit === 'Semua' || asn.unitKerja === selectedUnit)
      .sort((a, b) => {
        if (sortBy === 'score-desc') return b.totalIP - a.totalIP;
        if (sortBy === 'score-asc') return a.totalIP - b.totalIP;
        return a.nama.localeCompare(b.nama);
      });
  }, [filledList, searchTerm, selectedUnit, sortBy]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedUnit, sortBy, pageSize]);

  // Total pages
  const totalItems = sortedAndFiltered.length;
  const totalPages = pageSize === 'all' ? 1 : Math.ceil(totalItems / pageSize) || 1;

  // Paginated slice
  const paginatedList = useMemo(() => {
    if (pageSize === 'all') return sortedAndFiltered;
    const start = (currentPage - 1) * pageSize;
    return sortedAndFiltered.slice(start, start + pageSize);
  }, [sortedAndFiltered, currentPage, pageSize]);

  // List of all unit kerja
  const unitOptions = useMemo(() => {
    const units = Array.from(new Set(filledList.map((a) => a.unitKerja)));
    return ['Semua', ...units];
  }, [filledList]);

  const getKategoriBadge = (score: number) => {
    if (score >= 91)
      return {
        label: 'Sangat Tinggi',
        classes: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      };
    if (score >= 81)
      return {
        label: 'Tinggi',
        classes: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      };
    if (score >= 71)
      return {
        label: 'Sedang',
        classes: 'bg-amber-100 text-amber-800 border-amber-300',
      };
    if (score >= 61)
      return {
        label: 'Rendah',
        classes: 'bg-orange-100 text-orange-800 border-orange-300',
      };
    return {
      label: 'Sangat Rendah',
      classes: 'bg-rose-100 text-rose-800 border-rose-300',
    };
  };

  // Export to CSV
  const handleExportCSV = () => {
    const headers = [
      'No',
      'NIP',
      'Nama',
      'Golongan',
      'Jabatan',
      'Unit Kerja',
      'Kualifikasi',
      'Kompetensi',
      'Kinerja',
      'Disiplin',
      'Total IP',
      'Kategori',
    ];
    const rows = sortedAndFiltered.map((item, index) => [
      index + 1,
      `'${item.nip}`,
      `"${item.nama}"`,
      `"${item.golongan || ''}"`,
      `"${item.jabatan}"`,
      `"${item.unitKerja}"`,
      item.kualifikasi,
      item.kompetensi,
      item.kinerja,
      item.disiplin,
      item.totalIP,
      getKategoriBadge(item.totalIP).label,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `Daftar_IP_ASN_Kankemenag_Gunungkidul_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Summary Metrics
  const totalSudah = filledList.length;
  const rataRata =
    totalSudah > 0
      ? (filledList.reduce((acc, curr) => acc + curr.totalIP, 0) / totalSudah).toFixed(1)
      : '0.0';

  const sangatTinggiCount = filledList.filter((a) => a.totalIP >= 91).length;
  const tinggiCount = filledList.filter((a) => a.totalIP >= 81 && a.totalIP < 91).length;

  const startRecord = pageSize === 'all' ? (totalItems > 0 ? 1 : 0) : (currentPage - 1) * pageSize + 1;
  const endRecord = pageSize === 'all' ? totalItems : Math.min(currentPage * pageSize, totalItems);

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-[28px] border border-white/80 bg-gradient-to-r from-emerald-900 via-[#006640] to-[#024B30] p-6 sm:p-8 text-white shadow-xl shadow-emerald-950/20">
        <div className="absolute -right-8 -top-8 w-60 h-60 bg-[#D4AF37]/25 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-amber-300/30 text-amber-200 text-xs font-semibold mb-3">
              <ClipboardList className="w-3.5 h-3.5 text-amber-300" />
              <span>Rekapitulasi Data ASN Terverifikasi 2026</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Daftar Pegawai (Sudah Mengisi)
            </h2>
            <p className="mt-1 text-sm text-emerald-100/90 max-w-2xl leading-relaxed">
              Daftar lengkap pegawai Kantor Kementerian Agama Kabupaten Gunungkidul yang telah melengkapi pengisian 4 instrumen Indeks Profesionalitas ASN.
            </p>
          </div>

          <div className="flex items-center space-x-2.5">
            <button
              onClick={handleExportCSV}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs border border-white/20 backdrop-blur-md transition-all shadow-xs cursor-pointer"
            >
              <Download className="w-4 h-4 text-amber-300" />
              <span>Ekspor CSV</span>
            </button>
            <button
              onClick={() => window.print()}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-emerald-950 font-bold text-xs shadow-md transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Rekap</span>
            </button>
          </div>
        </div>
      </div>

      {/* Summary KPI Badges (Redesigned Luxury Apple/Fintech) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Sudah Mengisi */}
        <div className="relative overflow-hidden rounded-[24px] border border-emerald-900/15 bg-gradient-to-br from-emerald-900 via-[#006640] to-[#024B30] p-5 text-white shadow-xl shadow-emerald-950/15">
          <div className="absolute -right-6 -bottom-6 w-28 h-28 bg-[#D4AF37]/20 rounded-full blur-2xl pointer-events-none"></div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-200">
              Total Sudah Mengisi
            </span>
            <div className="w-9 h-9 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-amber-300">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline space-x-2">
            <span className="text-3xl sm:text-4xl font-black font-sans text-white tracking-tight">
              {totalSudah.toLocaleString('id-ID')}
            </span>
            <span className="text-xs font-semibold text-emerald-200/80">Pegawai</span>
          </div>
          <div className="mt-2.5 flex items-center gap-1.5 text-[11px] text-emerald-200/80">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            <span>Instrumen IP ASN Terverifikasi</span>
          </div>
        </div>

        {/* Card 2: Rata-rata Skor IP */}
        <div className="relative overflow-hidden rounded-[24px] border border-amber-200/80 bg-gradient-to-br from-amber-50/90 via-white/90 to-amber-100/50 p-5 shadow-lg shadow-amber-950/5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-900">
              Rata-rata Skor IP
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-200/80 border border-amber-300 flex items-center justify-center text-amber-900">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline space-x-2">
            <span className="text-3xl sm:text-4xl font-black font-sans text-amber-700 tracking-tight">
              {rataRata}
            </span>
            <span className="text-xs font-semibold text-slate-500 font-mono">/ 100</span>
          </div>
          <div className="mt-2.5 flex items-center gap-1.5 text-[11px] text-amber-900/80 font-medium">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>{totalSudah > 0 ? 'Indeks Rata-rata Terdata' : 'Menunggu Isian Data'}</span>
          </div>
        </div>

        {/* Card 3: Kategori Sangat Tinggi */}
        <div className="relative overflow-hidden rounded-[24px] border border-emerald-300/80 bg-gradient-to-br from-emerald-50/90 via-white/95 to-emerald-100/40 p-5 shadow-lg shadow-emerald-950/5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-900">
              Kategori Sangat Tinggi
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-800">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline space-x-2">
            <span className="text-3xl sm:text-4xl font-black font-sans text-[#006640] tracking-tight">
              {sangatTinggiCount}
            </span>
            <span className="text-xs font-semibold text-slate-500">Pegawai</span>
          </div>
          <div className="mt-2.5 flex items-center gap-1.5 text-[11px] text-emerald-800 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
            <span>Rentang Nilai 91 - 100 Poin</span>
          </div>
        </div>

        {/* Card 4: Kategori Tinggi */}
        <div className="relative overflow-hidden rounded-[24px] border border-slate-200/90 bg-gradient-to-br from-white/90 via-slate-50/80 to-emerald-50/40 p-5 shadow-lg shadow-emerald-950/5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Kategori Tinggi
            </span>
            <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-300 flex items-center justify-center text-slate-700">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline space-x-2">
            <span className="text-3xl sm:text-4xl font-black font-sans text-slate-800 tracking-tight">
              {tinggiCount}
            </span>
            <span className="text-xs font-semibold text-slate-500">Pegawai</span>
          </div>
          <div className="mt-2.5 flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Rentang Nilai 81 - 90.9 Poin</span>
          </div>
        </div>
      </div>

      {/* Filter, Search & View Controls Bar */}
      <div className="glass-card rounded-2xl p-4 sm:p-5 shadow-md border border-white/80 flex flex-col lg:flex-row items-center justify-between gap-3">
        {/* FITUR CARI */}
        <div className="relative w-full lg:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari Nama, NIP, Golongan, Jabatan..."
            className="w-full glass-input pl-10 pr-9 py-2.5 rounded-xl text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-hidden"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              title="Hapus pencarian"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-between lg:justify-end">
          {/* Unit Kerja Filter */}
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-emerald-800 shrink-0" />
            <select
              value={selectedUnit}
              onChange={(e) => setSelectedUnit(e.target.value)}
              className="glass-input px-3 py-2 rounded-xl text-xs font-semibold text-slate-800 focus:outline-hidden cursor-pointer"
            >
              <option value="Semua">Semua Unit Kerja</option>
              {unitOptions
                .filter((u) => u !== 'Semua')
                .map((unit) => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                ))}
            </select>
          </div>

          {/* Sort By Filter */}
          <div className="flex items-center space-x-2">
            <ArrowUpDown className="w-4 h-4 text-slate-500 shrink-0" />
            <select
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              className="glass-input px-3 py-2 rounded-xl text-xs font-semibold text-slate-800 focus:outline-hidden cursor-pointer"
            >
              <option value="score-desc">Nilai IP Tertinggi</option>
              <option value="score-asc">Nilai IP Terendah</option>
              <option value="name-asc">Nama Pegawai (A-Z)</option>
            </select>
          </div>

          {/* PILIHAN TAMPILAN: 25, 50, 100, Semua */}
          <div className="flex items-center space-x-2 bg-slate-100/80 px-2.5 py-1.5 rounded-xl border border-slate-200">
            <span className="text-xs font-semibold text-slate-600 whitespace-nowrap">
              Tampilkan:
            </span>
            <select
              value={pageSize === 'all' ? 'all' : String(pageSize)}
              onChange={(e) => {
                const val = e.target.value;
                setPageSize(val === 'all' ? 'all' : Number(val));
              }}
              className="bg-white px-2.5 py-1 rounded-lg text-xs font-bold text-emerald-950 border border-slate-300 focus:outline-hidden cursor-pointer"
            >
              <option value="25">25</option>
              <option value="50">50</option>
              <option value="100">100</option>
              <option value="all">Semua ({totalItems})</option>
            </select>
          </div>
        </div>
      </div>

      {/* Modern Data Table with Scroll Bar & Sticky Header */}
      <div className="glass-card rounded-2xl shadow-xl border border-white/80 overflow-hidden">
        {/* Table Container with Smooth Vertical & Horizontal Scrollbar */}
        <div className="max-h-[640px] overflow-y-auto overflow-x-auto scrollbar-thin scrollbar-thumb-emerald-600/40 scrollbar-track-slate-100">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 z-10 shadow-sm">
              <tr className="bg-gradient-to-r from-emerald-900 to-[#006640] text-white text-xs font-bold uppercase tracking-wider">
                <th className="py-3.5 px-4 text-center w-14">No</th>
                <th className="py-3.5 px-4">NIP</th>
                <th className="py-3.5 px-4">Nama Lengkap & Jabatan</th>
                <th className="py-3.5 px-4">Unit Kerja</th>
                <th className="py-3.5 px-4 text-center">Rincian Komponen</th>
                <th className="py-3.5 px-4 text-right">Total IP</th>
                <th className="py-3.5 px-4 text-center">Kategori</th>
                <th className="py-3.5 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/70 text-xs sm:text-sm text-slate-700">
              {paginatedList.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    Tidak ada data pegawai yang sesuai dengan kriteria pencarian.
                  </td>
                </tr>
              ) : (
                paginatedList.map((record, index) => {
                  const actualNo =
                    pageSize === 'all'
                      ? index + 1
                      : (currentPage - 1) * pageSize + index + 1;
                  const kategori = getKategoriBadge(record.totalIP);

                  return (
                    <tr
                      key={record.nip}
                      className="hover:bg-emerald-50/50 transition-colors"
                    >
                      {/* No */}
                      <td className="py-3 px-4 text-center font-bold">
                        <span className="w-6 h-6 inline-flex items-center justify-center rounded-full bg-slate-100 text-slate-700 text-xs font-mono">
                          {actualNo}
                        </span>
                      </td>

                      {/* NIP */}
                      <td className="py-3 px-4 font-mono text-xs text-slate-600 font-medium select-all">
                        {record.nip}
                      </td>

                      {/* Nama, Golongan & Jabatan */}
                      <td className="py-3 px-4">
                        <div className="font-extrabold text-slate-900 flex items-center gap-1.5">
                          {record.nama}
                          {record.golongan && (
                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 font-mono">
                              {record.golongan}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 line-clamp-1">{record.jabatan}</div>
                      </td>

                      {/* Unit Kerja */}
                      <td className="py-3 px-4 font-medium text-emerald-900">
                        {record.unitKerja}
                      </td>

                      {/* Rincian Komponen */}
                      <td className="py-3 px-4 text-center">
                        <div className="inline-flex items-center space-x-1 font-mono text-[11px] bg-slate-100 px-2 py-1 rounded-md text-slate-700">
                          <span title="Kualifikasi">K:{record.kualifikasi}</span>
                          <span>|</span>
                          <span title="Kompetensi">Komp:{record.kompetensi}</span>
                          <span>|</span>
                          <span title="Kinerja">Kin:{record.kinerja}</span>
                          <span>|</span>
                          <span title="Disiplin">D:{record.disiplin}</span>
                        </div>
                      </td>

                      {/* Total IP */}
                      <td className="py-3 px-4 text-right">
                        <span className="text-base font-black text-[#006640] font-sans">
                          {record.totalIP}
                        </span>
                        <span className="text-[11px] text-slate-400 font-normal"> / 100</span>
                      </td>

                      {/* Kategori */}
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${kategori.classes}`}
                        >
                          {kategori.label}
                        </span>
                      </td>

                      {/* Aksi */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center space-x-1.5">
                          <button
                            onClick={() => onViewInDashboard(record.nip)}
                            title="Tampilkan di Dashboard Visual 3D"
                            className="p-1.5 text-emerald-700 hover:text-white hover:bg-[#006640] rounded-lg transition-colors cursor-pointer"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onEditInInput(record.nip)}
                            title="Ubah / Perbarui Data Ini"
                            className="p-1.5 text-amber-700 hover:text-white hover:bg-amber-600 rounded-lg transition-colors cursor-pointer"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info & Pagination Controls */}
        <div className="p-4 bg-slate-50/90 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
          <div>
            Menampilkan <b>{startRecord}</b> - <b>{endRecord}</b> dari{' '}
            <b>{totalItems}</b> pegawai
            {searchTerm && ` (disaring dari ${totalSudah} pegawai)`}
          </div>

          {/* Pagination Buttons (if not 'all') */}
          {pageSize !== 'all' && totalPages > 1 && (
            <div className="flex items-center space-x-1.5">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                title="Halaman Pertama"
              >
                <ChevronsLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                title="Sebelumnya"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="px-3 py-1 font-bold text-emerald-950 bg-white rounded-lg border border-slate-300 font-mono">
                {currentPage} / {totalPages}
              </span>

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                title="Berikutnya"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                title="Halaman Terakhir"
              >
                <ChevronsRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
