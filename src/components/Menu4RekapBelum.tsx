import React, { useState, useMemo, useEffect } from 'react';
import { ASNRecord, UnitKerjaRekap } from '../types';
import { 
  Users, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  Search, 
  Filter, 
  Copy, 
  Building, 
  Check, 
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  X,
  FileSpreadsheet
} from 'lucide-react';

interface Menu4RekapBelumProps {
  asnList: ASNRecord[];
  onNavigateToInputWithNip: (nip: string) => void;
}

export const Menu4RekapBelum: React.FC<Menu4RekapBelumProps> = ({
  asnList,
  onNavigateToInputWithNip,
}) => {
  const [selectedUnitFilter, setSelectedUnitFilter] = useState('Semua');
  const [searchBelum, setSearchBelum] = useState('');
  const [copiedNip, setCopiedNip] = useState<string | null>(null);

  // Pilihan tampilan Bagian B: 25, 50, 100, dan Semua
  const [pageSize, setPageSize] = useState<number | 'all'>(25);
  const [currentPage, setCurrentPage] = useState(1);

  // Bagian A: Hitung Rekap per Unit Kerja
  const rekapPerUnit = useMemo((): UnitKerjaRekap[] => {
    const map: { [key: string]: { total: number; sudah: number; belum: number; sumIP: number } } = {};

    asnList.forEach((asn) => {
      const u = asn.unitKerja;
      if (!map[u]) {
        map[u] = { total: 0, sudah: 0, belum: 0, sumIP: 0 };
      }
      map[u].total += 1;
      if (asn.status === 'Sudah') {
        map[u].sudah += 1;
        map[u].sumIP += asn.totalIP;
      } else {
        map[u].belum += 1;
      }
    });

    return Object.keys(map)
      .map((u) => {
        const item = map[u];
        const persentase = item.total > 0 ? Math.round((item.sudah / item.total) * 100) : 0;
        const rataRataIP = item.sudah > 0 ? Number((item.sumIP / item.sudah).toFixed(1)) : 0;
        return {
          unitKerja: u,
          total: item.total,
          sudah: item.sudah,
          belum: item.belum,
          persentase,
          rataRataIP,
        };
      })
      .sort((a, b) => b.total - a.total);
  }, [asnList]);

  // Total Macro
  const totalPegawaiAll = asnList.length;
  const totalSudahAll = asnList.filter((a) => a.status === 'Sudah').length;
  const totalBelumAll = totalPegawaiAll - totalSudahAll;
  const persentaseAll = totalPegawaiAll > 0 ? Math.round((totalSudahAll / totalPegawaiAll) * 100) : 0;

  // Bagian B: Pegawai yang BELUM mengisi (Full Dataset Filter)
  const fullBelumList = useMemo(() => {
    return asnList.filter((a) => a.status === 'Belum');
  }, [asnList]);

  const filteredBelumList = useMemo(() => {
    const cleanSearch = searchBelum.trim().toLowerCase();
    return fullBelumList
      .filter((a) => {
        if (!cleanSearch) return true;
        return (
          a.nama.toLowerCase().includes(cleanSearch) ||
          a.nip.includes(cleanSearch) ||
          a.jabatan.toLowerCase().includes(cleanSearch) ||
          (a.golongan && a.golongan.toLowerCase().includes(cleanSearch)) ||
          a.unitKerja.toLowerCase().includes(cleanSearch)
        );
      })
      .filter((a) => selectedUnitFilter === 'Semua' || a.unitKerja === selectedUnitFilter);
  }, [fullBelumList, selectedUnitFilter, searchBelum]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchBelum, selectedUnitFilter, pageSize]);

  // Total pages
  const totalItems = filteredBelumList.length;
  const totalPages = pageSize === 'all' ? 1 : Math.ceil(totalItems / pageSize) || 1;

  // Paginated Slice
  const paginatedBelumList = useMemo(() => {
    if (pageSize === 'all') return filteredBelumList;
    const start = (currentPage - 1) * pageSize;
    return filteredBelumList.slice(start, start + pageSize);
  }, [filteredBelumList, currentPage, pageSize]);

  const handleCopyNip = (nip: string) => {
    navigator.clipboard.writeText(nip);
    setCopiedNip(nip);
    setTimeout(() => setCopiedNip(null), 2000);
  };

  const handleCopyAllBelumText = () => {
    const text = filteredBelumList
      .slice(0, 100)
      .map((p, i) => `${i + 1}. ${p.nama} (${p.nip}) - ${p.unitKerja}`)
      .join('\n');
    navigator.clipboard.writeText(
      `Daftar Pegawai Belum Mengisi IP ASN Kankemenag Kab. Gunungkidul:\n\n${text}`
    );
    alert('Daftar pegawai belum mengisi berhasil disalin ke clipboard!');
  };

  const startRecord = pageSize === 'all' ? (totalItems > 0 ? 1 : 0) : (currentPage - 1) * pageSize + 1;
  const endRecord = pageSize === 'all' ? totalItems : Math.min(currentPage * pageSize, totalItems);

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-[28px] border border-white/80 bg-gradient-to-r from-emerald-900 via-[#006640] to-[#024B30] p-6 sm:p-8 text-white shadow-xl shadow-emerald-950/20">
        <div className="absolute -left-10 -bottom-10 w-64 h-64 bg-[#D4AF37]/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-amber-300/30 text-amber-200 text-xs font-semibold mb-3">
            <Users className="w-3.5 h-3.5 text-amber-300" />
            <span>Rekapitulasi Partisipasi Satuan Kerja</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Rekap Unit Kerja & Daftar Belum Mengisi
          </h2>
          <p className="mt-2 text-sm text-emerald-100/90 leading-relaxed">
            Pantau progres penyelesaian pengukuran IP ASN per satuan kerja. Telusuri daftar pegawai yang belum mengisi dalam bentuk tabel lengkap dengan fitur pencarian dan paginasi.
          </p>
        </div>
      </div>

      {/* ========================================================= */}
      {/* BAGIAN A: TABEL REKAP JUMLAH PEGAWAI PER UNIT KERJA       */}
      {/* ========================================================= */}
      <div className="glass-card rounded-[24px] p-6 sm:p-7 shadow-xl border border-white/80 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200/70">
          <div>
            <div className="flex items-center space-x-2">
              <span className="p-1.5 rounded-lg bg-emerald-100 text-[#006640]">
                <Building className="w-4 h-4" />
              </span>
              <h3 className="text-lg font-black text-slate-900">
                Bagian A: Rekapitulasi ASN per Unit Kerja
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Rincian jumlah total, sudah mengisi, belum mengisi, dan capaian persentase
            </p>
          </div>

          <div className="flex items-center space-x-2 text-xs">
            <span className="px-3 py-1 bg-emerald-100 text-emerald-900 font-bold rounded-lg border border-emerald-300">
              Total Sudah: {totalSudahAll}
            </span>
            <span className="px-3 py-1 bg-rose-100 text-rose-900 font-bold rounded-lg border border-rose-300">
              Total Belum: {totalBelumAll}
            </span>
          </div>
        </div>

        {/* Tabel Rekap Unit Kerja */}
        <div className="overflow-x-auto rounded-2xl border border-slate-200/80 shadow-xs">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gradient-to-r from-emerald-900 to-[#006640] text-white text-xs font-bold uppercase tracking-wider">
                <th className="py-3 px-4 text-center w-12">No</th>
                <th className="py-3 px-4">Unit Kerja / Satuan Kerja</th>
                <th className="py-3 px-4 text-center">Total Pegawai</th>
                <th className="py-3 px-4 text-center">Sudah Mengisi</th>
                <th className="py-3 px-4 text-center">Belum Mengisi</th>
                <th className="py-3 px-4 text-center w-48">Progres Capaian</th>
                <th className="py-3 px-4 text-right">Rata-rata IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs sm:text-sm text-slate-700">
              {rekapPerUnit.map((item, index) => (
                <tr
                  key={item.unitKerja}
                  className="hover:bg-emerald-50/50 transition-colors"
                >
                  <td className="py-3 px-4 text-center font-bold text-slate-500 font-mono">
                    {index + 1}
                  </td>
                  <td className="py-3 px-4 font-bold text-slate-900">
                    {item.unitKerja}
                  </td>
                  <td className="py-3 px-4 text-center font-mono font-bold text-slate-800">
                    {item.total}
                  </td>
                  <td className="py-3 px-4 text-center font-mono font-bold text-emerald-700">
                    <span className="bg-emerald-100 px-2.5 py-0.5 rounded-md">
                      {item.sudah}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center font-mono font-bold text-rose-700">
                    <span className="bg-rose-100 px-2.5 py-0.5 rounded-md">
                      {item.belum}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-2">
                      <div className="flex-1 bg-slate-200 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            item.persentase >= 80
                              ? 'bg-emerald-600'
                              : item.persentase >= 50
                              ? 'bg-amber-500'
                              : 'bg-rose-500'
                          }`}
                          style={{ width: `${item.persentase}%` }}
                        ></div>
                      </div>
                      <span className="font-mono text-xs font-bold text-slate-700 w-10 text-right">
                        {item.persentase}%
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-[#006640]">
                    {item.rataRataIP > 0 ? item.rataRataIP : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-gradient-to-r from-emerald-100 via-amber-50 to-emerald-100 font-extrabold text-slate-900 text-xs sm:text-sm border-t-2 border-emerald-700">
                <td className="py-3.5 px-4 text-center">Σ</td>
                <td className="py-3.5 px-4 font-black">
                  TOTAL KANKEMENAG KAB. GUNUNGKIDUL
                </td>
                <td className="py-3.5 px-4 text-center font-mono text-base font-black">
                  {totalPegawaiAll}
                </td>
                <td className="py-3.5 px-4 text-center font-mono text-base font-black text-emerald-800">
                  {totalSudahAll}
                </td>
                <td className="py-3.5 px-4 text-center font-mono text-base font-black text-rose-800">
                  {totalBelumAll}
                </td>
                <td className="py-3.5 px-4">
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 bg-slate-300 h-2.5 rounded-full overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-[#D4AF37] to-[#006640] h-full rounded-full"
                        style={{ width: `${persentaseAll}%` }}
                      ></div>
                    </div>
                    <span className="font-mono text-xs font-black text-emerald-950 w-10 text-right">
                      {persentaseAll}%
                    </span>
                  </div>
                </td>
                <td className="py-3.5 px-4 text-right font-mono text-base font-black text-[#006640]">
                  {(
                    asnList
                      .filter((a) => a.status === 'Sudah')
                      .reduce((acc, c) => acc + c.totalIP, 0) / (totalSudahAll || 1)
                  ).toFixed(1)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* BAGIAN B: TABEL DAFTAR PEGAWAI BELUM MENGISI (DENGAN CARI, SCROLL & LIMIT) */}
      {/* ========================================================================= */}
      <div className="glass-card rounded-[24px] p-6 sm:p-7 shadow-xl border border-white/80 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/70">
          <div>
            <div className="flex items-center space-x-2">
              <span className="p-1.5 rounded-lg bg-amber-100 text-amber-800">
                <Clock className="w-4 h-4 text-[#D4AF37]" />
              </span>
              <h3 className="text-lg font-black text-slate-900">
                Bagian B: Tabel Daftar Pegawai Belum Mengisi
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Gunakan fitur cari dan filter, atau klik tombol "Isi Sekarang" untuk memasukkan penilaian
            </p>
          </div>

          <button
            onClick={handleCopyAllBelumText}
            className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer self-start sm:self-auto"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Salin Format WhatsApp</span>
          </button>
        </div>

        {/* Filter, Search & View Controls Bar */}
        <div className="glass-card rounded-2xl p-4 sm:p-5 shadow-sm border border-slate-200/80 flex flex-col lg:flex-row items-center justify-between gap-3">
          {/* FITUR CARI */}
          <div className="relative w-full lg:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchBelum}
              onChange={(e) => setSearchBelum(e.target.value)}
              placeholder="Cari nama, NIP, jabatan..."
              className="w-full glass-input pl-10 pr-9 py-2.5 rounded-xl text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-hidden"
            />
            {searchBelum && (
              <button
                onClick={() => setSearchBelum('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                title="Hapus pencarian"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-between lg:justify-end">
            {/* Filter Unit Kerja */}
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-slate-500 shrink-0" />
              <select
                value={selectedUnitFilter}
                onChange={(e) => setSelectedUnitFilter(e.target.value)}
                className="glass-input px-3 py-2 rounded-xl text-xs font-semibold text-slate-800 focus:outline-hidden cursor-pointer"
              >
                <option value="Semua">Semua Unit Kerja</option>
                {rekapPerUnit.map((u) => (
                  <option key={u.unitKerja} value={u.unitKerja}>
                    {u.unitKerja} ({u.belum} belum)
                  </option>
                ))}
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

        {/* TABEL DAFTAR PEGAWAI BELUM MENGISI */}
        <div className="glass-card rounded-2xl shadow-xl border border-white/80 overflow-hidden">
          {/* Scrollable Container with Smooth Scrollbar & Sticky Header */}
          <div className="max-h-[640px] overflow-y-auto overflow-x-auto scrollbar-thin scrollbar-thumb-emerald-600/40 scrollbar-track-slate-100">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 z-10 shadow-sm">
                <tr className="bg-gradient-to-r from-emerald-900 to-[#006640] text-white text-xs font-bold uppercase tracking-wider">
                  <th className="py-3.5 px-4 text-center w-14">No</th>
                  <th className="py-3.5 px-4">NIP</th>
                  <th className="py-3.5 px-4">Nama Lengkap Pegawai</th>
                  <th className="py-3.5 px-4">Jabatan</th>
                  <th className="py-3.5 px-4">Unit Kerja</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/70 text-xs sm:text-sm text-slate-700">
                {paginatedBelumList.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      Tidak ada data pegawai belum mengisi yang sesuai dengan kriteria pencarian.
                    </td>
                  </tr>
                ) : (
                  paginatedBelumList.map((asn, index) => {
                    const actualNo =
                      pageSize === 'all'
                        ? index + 1
                        : (currentPage - 1) * pageSize + index + 1;

                    return (
                      <tr
                        key={asn.nip}
                        className="hover:bg-amber-50/40 transition-colors"
                      >
                        {/* No */}
                        <td className="py-3 px-4 text-center font-bold">
                          <span className="w-6 h-6 inline-flex items-center justify-center rounded-full bg-slate-100 text-slate-700 text-xs font-mono">
                            {actualNo}
                          </span>
                        </td>

                        {/* NIP */}
                        <td className="py-3 px-4 font-mono text-xs text-slate-600 font-medium select-all">
                          <div className="flex items-center space-x-1.5">
                            <span>{asn.nip}</span>
                            <button
                              onClick={() => handleCopyNip(asn.nip)}
                              title="Salin NIP"
                              className="text-slate-400 hover:text-slate-600 p-0.5"
                            >
                              {copiedNip === asn.nip ? (
                                <Check className="w-3 h-3 text-emerald-600" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        </td>

                        {/* Nama & Golongan */}
                        <td className="py-3 px-4">
                          <div className="font-extrabold text-slate-900 flex items-center gap-1.5">
                            {asn.nama}
                            {asn.golongan && (
                              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 font-mono">
                                {asn.golongan}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Jabatan */}
                        <td className="py-3 px-4 text-slate-600 text-xs">
                          <span className="line-clamp-1">{asn.jabatan}</span>
                        </td>

                        {/* Unit Kerja */}
                        <td className="py-3 px-4 font-semibold text-emerald-900 text-xs">
                          {asn.unitKerja}
                        </td>

                        {/* Status */}
                        <td className="py-3 px-4 text-center">
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded-full">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                            Belum Mengisi
                          </span>
                        </td>

                        {/* Aksi: Isi Sekarang */}
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => onNavigateToInputWithNip(asn.nip)}
                            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#006640] to-[#024B30] hover:from-[#005233] hover:to-[#013b26] text-white text-xs font-bold shadow-xs ring-1 ring-amber-300/40 transition-all cursor-pointer"
                            title={`Isi penilaian IP ASN untuk ${asn.nama}`}
                          >
                            <span>Isi Sekarang</span>
                            <ArrowRight className="w-3.5 h-3.5 text-amber-300" />
                          </button>
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
              <b>{totalItems}</b> pegawai belum mengisi
              {searchBelum && ` (disaring dari ${totalBelumAll} pegawai)`}
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
    </div>
  );
};
