import React, { useState, useEffect } from 'react';
import { ASNRecord } from '../types';
import { 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  GraduationCap, 
  Award, 
  TrendingUp, 
  ShieldAlert, 
  Save, 
  RefreshCw,
  ChevronRight,
  UserCheck,
  Building,
  BadgeAlert
} from 'lucide-react';
import { ConfirmationModal } from './ConfirmationModal';
import { HeroBanner } from './HeroBanner';

interface Menu1InputUpdateProps {
  asnList: ASNRecord[];
  onSaveRecord: (record: ASNRecord) => Promise<boolean>;
  onNavigateToDashboard: (nip: string) => void;
  preselectedNip?: string;
}

export const Menu1InputUpdate: React.FC<Menu1InputUpdateProps> = ({
  asnList,
  onSaveRecord,
  onNavigateToDashboard,
  preselectedNip,
}) => {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [searchNip, setSearchNip] = useState(preselectedNip || '');
  const [searchedRecord, setSearchedRecord] = useState<ASNRecord | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  // Form states
  const [kualifikasi, setKualifikasi] = useState<number>(15);
  const [kompetensi, setKompetensi] = useState<number>(30);
  const [kinerja, setKinerja] = useState<number>(25);
  const [disiplin, setDisiplin] = useState<number>(5);

  // Helpers for friendly select presets
  const [pendidikanPreset, setPendidikanPreset] = useState<string>('S1');
  const [skpPreset, setSkpPreset] = useState<string>('Baik');
  const [disiplinPreset, setDisiplinPreset] = useState<string>('Tidak Ada');
  const [kompetensiChecks, setKompetensiChecks] = useState<{ [key: string]: boolean }>({
    struktural: false,
    fungsional: true,
    teknis: true,
    workshop: false,
  });

  // Modal & Save states
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Auto trigger search if preselectedNip is passed
  useEffect(() => {
    if (preselectedNip) {
      setSearchNip(preselectedNip);
      handleSearch(preselectedNip);
      setCurrentStep(2);
    }
  }, [preselectedNip]);

  const handleSearch = (nipToSearch = searchNip) => {
    const cleanNip = nipToSearch.trim();
    if (!cleanNip) {
      setSearchError('Silakan masukkan NIP pegawai terlebih dahulu.');
      setSearchedRecord(null);
      setHasSearched(false);
      setCurrentStep(1);
      return;
    }

    const found = asnList.find(
      (item) => item.nip === cleanNip || item.nip.replace(/\s+/g, '') === cleanNip.replace(/\s+/g, '')
    );

    setHasSearched(true);
    if (found) {
      setSearchedRecord(found);
      setSearchError(null);
      setCurrentStep(2);

      // Populate form with existing values or defaults
      if (found.status === 'Sudah') {
        setKualifikasi(found.kualifikasi);
        setKompetensi(found.kompetensi);
        setKinerja(found.kinerja);
        setDisiplin(found.disiplin);
      } else {
        // Defaults for new assessment
        setKualifikasi(15);
        setKompetensi(30);
        setKinerja(25);
        setDisiplin(5);
        setPendidikanPreset('S1');
        setSkpPreset('Baik');
        setDisiplinPreset('Tidak Ada');
      }
    } else {
      setSearchedRecord(null);
      setSearchError(`Pegawai dengan NIP "${cleanNip}" tidak ditemukan dalam basis data.`);
      setCurrentStep(1);
    }
  };

  // Preset Handlers
  const handlePendidikanChange = (val: string, score: number) => {
    setPendidikanPreset(val);
    setKualifikasi(score);
  };

  const handleSKPChange = (val: string, score: number) => {
    setSkpPreset(val);
    setKinerja(score);
  };

  const handleDisiplinChange = (val: string, score: number) => {
    setDisiplinPreset(val);
    setDisiplin(score);
  };

  const handleKompetensiCheckChange = (key: string, checked: boolean, valScore: number) => {
    const updated = { ...kompetensiChecks, [key]: checked };
    setKompetensiChecks(updated);

    let total = 0;
    if (updated.struktural) total += 15;
    if (updated.fungsional) total += 15;
    if (updated.teknis) total += 15;
    if (updated.workshop) total += 10;
    setKompetensi(Math.min(40, total));
  };

  const totalIP = Math.min(100, Math.max(0, kualifikasi + kompetensi + kinerja + disiplin));

  const getKategoriIP = (score: number) => {
    if (score >= 91) return { label: 'Sangat Tinggi', color: 'bg-emerald-600 text-white', ring: 'ring-emerald-500' };
    if (score >= 81) return { label: 'Tinggi', color: 'bg-emerald-500 text-white', ring: 'ring-emerald-400' };
    if (score >= 71) return { label: 'Sedang', color: 'bg-amber-500 text-white', ring: 'ring-amber-400' };
    if (score >= 61) return { label: 'Rendah', color: 'bg-orange-500 text-white', ring: 'ring-orange-400' };
    return { label: 'Sangat Rendah', color: 'bg-rose-500 text-white', ring: 'ring-rose-400' };
  };

  const kategori = getKategoriIP(totalIP);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchedRecord) return;
    setShowConfirmModal(true);
  };

  const handleConfirmSave = async () => {
    if (!searchedRecord) return;
    setIsSaving(true);

    const recordToSave: ASNRecord = {
      ...searchedRecord,
      kualifikasi,
      kompetensi,
      kinerja,
      disiplin,
      totalIP,
      status: 'Sudah',
      kualifikasiDetail: `Pendidikan: ${pendidikanPreset} (${kualifikasi})`,
      kinerjaDetail: `SKP: ${skpPreset} (${kinerja})`,
      disiplinDetail: `Hukuman Disiplin: ${disiplinPreset} (${disiplin})`,
    };

    const ok = await onSaveRecord(recordToSave);
    setIsSaving(false);
    setShowConfirmModal(false);

    if (ok) {
      // Direct navigation to Menu 2 (Dashboard) as required
      onNavigateToDashboard(recordToSave.nip);
    }
  };

  // Quick picker sample NIPs from the real 1,061 pegawai dataset
  const sampleBelumNips = asnList.filter((a) => a.status === 'Belum').slice(0, 3);
  const sampleSudahNips = asnList.filter((a) => a.status === 'Sudah').slice(0, 3);

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12 animate-in fade-in duration-300">
      {/* 1. HERO BANNER & 3-STAGE PROGRESS (Matches attached image) */}
      <HeroBanner
        onGoToDashboard={() => onNavigateToDashboard(searchedRecord?.nip || '')}
        currentStep={currentStep}
        onSelectStep={(step) => setCurrentStep(step)}
        hasSearchedASN={!!searchedRecord}
      />

      {/* 2. CARD PENCARIAN NIP (TAHAP 1) */}
      <div className="glass-card rounded-[24px] p-6 sm:p-7 shadow-lg border border-white/80">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-[#006640] flex items-center justify-center font-bold">
              <Search className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">
                Tahap 1: Pencarian Data ASN
              </h3>
              <p className="text-xs text-slate-500">
                Masukkan 18 digit NIP pegawai untuk memeriksa status pengisian
              </p>
            </div>
          </div>
          <span className="hidden sm:inline-block px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200">
            {asnList.length.toLocaleString('id-ID')} ASN Terdata
          </span>
        </div>

        {/* Search Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSearch();
          }}
          className="flex flex-col sm:flex-row gap-3"
        >
          <div className="relative flex-1">
            <input
              type="text"
              value={searchNip}
              onChange={(e) => {
                setSearchNip(e.target.value);
                setSearchError(null);
              }}
              placeholder="Contoh NIP: 197301011998031015"
              className="w-full glass-input px-4 py-3.5 rounded-xl text-slate-900 font-mono text-sm placeholder:text-slate-400 focus:outline-hidden"
            />
            {searchNip && (
              <button
                type="button"
                onClick={() => {
                  setSearchNip('');
                  setSearchedRecord(null);
                  setHasSearched(false);
                  setCurrentStep(1);
                }}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 hover:text-slate-700 px-1 py-0.5"
              >
                Reset
              </button>
            )}
          </div>
          <button
            type="submit"
            className="flex items-center justify-center space-x-2 px-7 py-3.5 rounded-xl bg-gradient-to-r from-[#006640] to-[#014d31] hover:from-[#005233] hover:to-[#013b26] text-white font-bold text-sm shadow-md shadow-emerald-950/20 ring-1 ring-amber-300/40 transition-all cursor-pointer"
          >
            <Search className="w-4 h-4 text-amber-300" />
            <span>Cari NIP</span>
          </button>
        </form>

        {/* Quick Suggestion Chips */}
        <div className="mt-4 pt-3 border-t border-slate-200/60 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-slate-500 font-medium">Contoh NIP Cepat:</span>
          {sampleBelumNips.map((item) => (
            <button
              key={item.nip}
              type="button"
              onClick={() => {
                setSearchNip(item.nip);
                handleSearch(item.nip);
              }}
              className="font-mono text-[11px] px-2.5 py-1 rounded-lg bg-white border border-rose-200 text-slate-700 hover:border-emerald-600 hover:text-emerald-800 transition-colors cursor-pointer"
            >
              {item.nip} ({item.nama.split(' ')[0]})
            </button>
          ))}
          {sampleSudahNips.map((item) => (
            <button
              key={item.nip}
              type="button"
              onClick={() => {
                setSearchNip(item.nip);
                handleSearch(item.nip);
              }}
              className="font-mono text-[11px] px-2.5 py-1 rounded-lg bg-white border border-emerald-200 text-slate-700 hover:border-emerald-600 hover:text-emerald-800 transition-colors cursor-pointer"
            >
              {item.nip} ({item.nama.split(' ')[0]}) ✓
            </button>
          ))}
        </div>

        {/* Error message */}
        {searchError && (
          <div className="mt-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center space-x-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{searchError}</span>
          </div>
        )}
      </div>

      {/* 3. PROFIL PEGAWAI TERPILIH (TAHAP 2) */}
      {searchedRecord && (
        <div
          className={`glass-card rounded-[24px] p-6 sm:p-7 shadow-lg border transition-all animate-in fade-in ${
            searchedRecord.status === 'Sudah'
              ? 'border-emerald-500/40 bg-gradient-to-br from-emerald-50/50 via-white/80 to-amber-50/40'
              : 'border-amber-500/40 bg-gradient-to-br from-amber-50/50 via-white/80 to-white/90'
          }`}
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div className="flex items-start space-x-4">
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-black shadow-sm ${
                  searchedRecord.status === 'Sudah'
                    ? 'bg-gradient-to-br from-[#006640] to-[#024B30] text-amber-200 ring-2 ring-emerald-300'
                    : 'bg-amber-500 text-white ring-2 ring-amber-300'
                }`}
              >
                {searchedRecord.nama.charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-xl font-black text-slate-900">{searchedRecord.nama}</h3>
                  {searchedRecord.golongan && (
                    <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-300 font-mono">
                      Gol. {searchedRecord.golongan}
                    </span>
                  )}
                  <span
                    className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${
                      searchedRecord.status === 'Sudah'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-amber-100 text-amber-800 border border-amber-300'
                    }`}
                  >
                    {searchedRecord.status === 'Sudah' ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Sudah Mengisi (Tersedia Fitur Update)
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                        Belum Mengisi
                      </>
                    )}
                  </span>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
                  <span className="font-mono font-medium">NIP: {searchedRecord.nip}</span>
                  <span>•</span>
                  <span className="font-semibold text-emerald-900">{searchedRecord.unitKerja}</span>
                </div>
                <p className="text-xs text-slate-500 mt-1 line-clamp-1">{searchedRecord.jabatan}</p>
                {searchedRecord.lastUpdated && (
                  <p className="text-[11px] text-slate-400 mt-1 font-mono">
                    Terakhir diperbarui: {searchedRecord.lastUpdated}
                  </p>
                )}
              </div>
            </div>

            {/* Score pill if already submitted */}
            {searchedRecord.status === 'Sudah' && (
              <div className="flex items-center space-x-3.5 bg-white/90 p-3.5 rounded-2xl border border-emerald-200/80 shadow-xs">
                <div className="text-right">
                  <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                    Nilai Tersimpan
                  </div>
                  <div className="text-2xl font-black text-[#006640]">
                    {searchedRecord.totalIP}
                    <span className="text-xs font-medium text-slate-400"> / 100</span>
                  </div>
                </div>
                <div className="text-left text-[11px] text-slate-600 pl-3.5 border-l border-slate-200 space-y-0.5">
                  <div>Kualifikasi: <strong>{searchedRecord.kualifikasi}</strong></div>
                  <div>Kompetensi: <strong>{searchedRecord.kompetensi}</strong></div>
                  <div>Kinerja: <strong>{searchedRecord.kinerja}</strong> | Disiplin: <strong>{searchedRecord.disiplin}</strong></div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. FORM INPUT & UPDATE 4 KOMPONEN */}
      {searchedRecord && (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 1. KUALIFIKASI (Maks 25) */}
            <div className="glass-card rounded-[22px] p-6 shadow-md border border-white/80 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200/60">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2.5 bg-emerald-100 text-emerald-800 rounded-xl">
                    <GraduationCap className="w-5 h-5 text-[#006640]" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">1. Kualifikasi Pendidikan</h4>
                    <p className="text-xs text-slate-500">Ijazah pendidikan formal terakhir yang diakui</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 rounded-lg text-xs font-bold font-mono">
                  Maks. 25
                </span>
              </div>

              {/* Education Presets */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'S3 (Doktor)', val: 'S3', score: 25 },
                  { label: 'S2 (Magister)', val: 'S2', score: 20 },
                  { label: 'S1 / D-IV', val: 'S1', score: 15 },
                  { label: 'D-III', val: 'D3', score: 10 },
                  { label: 'D-I / D-II', val: 'D1/D2', score: 5 },
                  { label: 'SMA / SMK', val: 'SMA', score: 5 },
                ].map((item) => (
                  <button
                    key={item.val}
                    type="button"
                    onClick={() => handlePendidikanChange(item.val, item.score)}
                    className={`p-2 rounded-xl text-xs font-medium text-center transition-all cursor-pointer ${
                      kualifikasi === item.score && pendidikanPreset === item.val
                        ? 'bg-[#006640] text-white shadow-xs font-bold ring-1 ring-amber-300'
                        : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    <div>{item.label}</div>
                    <div className="text-[10px] opacity-80 font-mono mt-0.5">{item.score} poin</div>
                  </button>
                ))}
              </div>

              {/* Custom Score Slider */}
              <div className="pt-2">
                <div className="flex justify-between items-center text-xs mb-1">
                  <span className="text-slate-600 font-medium">Penyesuaian Nilai Kualifikasi</span>
                  <span className="font-bold font-mono text-emerald-800 text-sm bg-emerald-100 px-2.5 py-0.5 rounded-lg">
                    {kualifikasi} / 25
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="25"
                  step="1"
                  value={kualifikasi}
                  onChange={(e) => setKualifikasi(Number(e.target.value))}
                  className="w-full accent-[#006640] cursor-pointer"
                />
              </div>
            </div>

            {/* 2. KOMPETENSI (Maks 40) */}
            <div className="glass-card rounded-[22px] p-6 shadow-md border border-white/80 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200/60">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2.5 bg-amber-100 text-amber-800 rounded-xl">
                    <Award className="w-5 h-5 text-[#D4AF37]" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">2. Pengembangan Kompetensi</h4>
                    <p className="text-xs text-slate-500">Riwayat diklat kepemimpinan, fungsional/teknis & workshop</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 bg-amber-50 text-amber-800 rounded-lg text-xs font-bold font-mono">
                  Maks. 40
                </span>
              </div>

              {/* Checklist items */}
              <div className="space-y-2">
                {[
                  {
                    id: 'struktural',
                    label: 'Pelatihan Struktural / Kepemimpinan (PKA/PKP/PKN)',
                    points: 15,
                  },
                  {
                    id: 'fungsional',
                    label: 'Pelatihan Fungsional Sesuai Jenjang Jabatan',
                    points: 15,
                  },
                  {
                    id: 'teknis',
                    label: 'Pelatihan Teknis Bidang Tugas (≥20 JP)',
                    points: 15,
                  },
                  {
                    id: 'workshop',
                    label: 'Seminar / Webinar / Workshop / Bimbingan Teknis',
                    points: 10,
                  },
                ].map((item) => (
                  <label
                    key={item.id}
                    className={`flex items-center justify-between p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                      kompetensiChecks[item.id]
                        ? 'bg-amber-50/80 border-amber-300 text-slate-900 font-medium'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5">
                      <input
                        type="checkbox"
                        checked={!!kompetensiChecks[item.id]}
                        onChange={(e) =>
                          handleKompetensiCheckChange(item.id, e.target.checked, item.points)
                        }
                        className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4 accent-[#D4AF37]"
                      />
                      <span>{item.label}</span>
                    </div>
                    <span className="font-mono font-bold text-amber-800 text-[11px] bg-amber-100 px-1.5 py-0.5 rounded">
                      +{item.points}
                    </span>
                  </label>
                ))}
              </div>

              {/* Custom Score Slider */}
              <div className="pt-1">
                <div className="flex justify-between items-center text-xs mb-1">
                  <span className="text-slate-600 font-medium">Total Nilai Kompetensi</span>
                  <span className="font-bold font-mono text-amber-800 text-sm bg-amber-100 px-2.5 py-0.5 rounded-lg">
                    {kompetensi} / 40
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="40"
                  step="1"
                  value={kompetensi}
                  onChange={(e) => setKompetensi(Number(e.target.value))}
                  className="w-full accent-[#D4AF37] cursor-pointer"
                />
              </div>
            </div>

            {/* 3. KINERJA (Maks 30) */}
            <div className="glass-card rounded-[22px] p-6 shadow-md border border-white/80 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200/60">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2.5 bg-emerald-100 text-emerald-800 rounded-xl">
                    <TrendingUp className="w-5 h-5 text-[#006640]" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">3. Penilaian Kinerja (SKP)</h4>
                    <p className="text-xs text-slate-500">Predikat hasil evaluasi kinerja periodik tahun terakhir</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 rounded-lg text-xs font-bold font-mono">
                  Maks. 30
                </span>
              </div>

              {/* SKP Presets */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  { label: 'Sangat Baik', score: 30 },
                  { label: 'Baik', score: 25 },
                  { label: 'Butuh Perbaikan', score: 15 },
                  { label: 'Kurang', score: 10 },
                  { label: 'Sangat Kurang', score: 5 },
                ].map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => handleSKPChange(item.label, item.score)}
                    className={`p-2 rounded-xl text-xs font-medium text-center transition-all cursor-pointer ${
                      kinerja === item.score && skpPreset === item.label
                        ? 'bg-[#006640] text-white shadow-xs font-bold ring-1 ring-amber-300'
                        : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    <div>{item.label}</div>
                    <div className="text-[10px] opacity-80 font-mono mt-0.5">{item.score} poin</div>
                  </button>
                ))}
              </div>

              {/* Custom Score Slider */}
              <div className="pt-2">
                <div className="flex justify-between items-center text-xs mb-1">
                  <span className="text-slate-600 font-medium">Penyesuaian Nilai Kinerja</span>
                  <span className="font-bold font-mono text-emerald-800 text-sm bg-emerald-100 px-2.5 py-0.5 rounded-lg">
                    {kinerja} / 30
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="30"
                  step="1"
                  value={kinerja}
                  onChange={(e) => setKinerja(Number(e.target.value))}
                  className="w-full accent-[#006640] cursor-pointer"
                />
              </div>
            </div>

            {/* 4. DISIPLIN (Maks 5) */}
            <div className="glass-card rounded-[22px] p-6 shadow-md border border-white/80 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200/60">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2.5 bg-amber-100 text-amber-800 rounded-xl">
                    <ShieldAlert className="w-5 h-5 text-[#D4AF37]" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">4. Hukuman Disiplin</h4>
                    <p className="text-xs text-slate-500">Catatan penjatuhan hukuman disiplin ASN</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 bg-amber-50 text-amber-800 rounded-lg text-xs font-bold font-mono">
                  Maks. 5
                </span>
              </div>

              {/* Disiplin Presets */}
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'Tidak Pernah Dijatuhi HD', val: 'Tidak Ada', score: 5 },
                  { label: 'HD Tingkat Ringan', val: 'Ringan', score: 3 },
                  { label: 'HD Tingkat Sedang', val: 'Sedang', score: 2 },
                  { label: 'HD Tingkat Berat', val: 'Berat', score: 0 },
                ].map((item) => (
                  <button
                    key={item.val}
                    type="button"
                    onClick={() => handleDisiplinChange(item.val, item.score)}
                    className={`p-2.5 rounded-xl text-xs font-medium text-center transition-all cursor-pointer ${
                      disiplin === item.score && disiplinPreset === item.val
                        ? 'bg-[#006640] text-white shadow-xs font-bold ring-1 ring-amber-300'
                        : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    <div>{item.label}</div>
                    <div className="text-[10px] opacity-80 font-mono mt-0.5">{item.score} poin</div>
                  </button>
                ))}
              </div>

              {/* Custom Score Slider */}
              <div className="pt-2">
                <div className="flex justify-between items-center text-xs mb-1">
                  <span className="text-slate-600 font-medium">Penyesuaian Nilai Disiplin</span>
                  <span className="font-bold font-mono text-emerald-800 text-sm bg-emerald-100 px-2.5 py-0.5 rounded-lg">
                    {disiplin} / 5
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="5"
                  step="1"
                  value={disiplin}
                  onChange={(e) => setDisiplin(Number(e.target.value))}
                  className="w-full accent-[#006640] cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Sticky Total Score & Submission Bar */}
          <div className="glass-card rounded-[24px] p-5 sm:p-6 shadow-xl border border-white/80 bg-white/95 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-4 w-full sm:w-auto">
              <div className="p-3.5 bg-gradient-to-br from-emerald-100 to-amber-100 rounded-2xl border border-amber-300/40">
                <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                  Total Skor IP ASN
                </div>
                <div className="text-3xl font-black text-[#006640] font-sans">
                  {totalIP}
                  <span className="text-xs font-medium text-slate-500 ml-1">/ 100</span>
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500 font-medium">Kategori Kelayakan:</div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`px-3 py-1 text-xs font-bold rounded-full ${kategori.color}`}>
                    {kategori.label}
                  </span>
                  <span className="text-xs text-slate-600 font-mono">
                    ({kualifikasi} + {kompetensi} + {kinerja} + {disiplin})
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => {
                  setSearchedRecord(null);
                  setSearchNip('');
                  setHasSearched(false);
                  setCurrentStep(1);
                }}
                className="px-4 py-3 rounded-xl border border-slate-300 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Batal
              </button>

              <button
                type="submit"
                className={`flex-1 sm:flex-initial flex items-center justify-center space-x-2 px-8 py-3.5 rounded-xl font-bold text-sm text-white shadow-lg shadow-emerald-950/20 ring-1 ring-amber-300/50 transition-all cursor-pointer ${
                  searchedRecord.status === 'Sudah'
                    ? 'bg-gradient-to-r from-amber-600 via-amber-700 to-emerald-800 hover:from-amber-700 hover:to-emerald-900'
                    : 'bg-gradient-to-r from-[#006640] via-[#024B30] to-[#013824] hover:from-[#005233] hover:to-[#012f1f]'
                }`}
              >
                {searchedRecord.status === 'Sudah' ? (
                  <>
                    <RefreshCw className="w-4 h-4 text-amber-300" />
                    <span>Update Data (Ganti Isian)</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 text-amber-300" />
                    <span>Simpan & Masuk Dashboard</span>
                  </>
                )}
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Confirmation Dialog before mutating */}
      {searchedRecord && (
        <ConfirmationModal
          isOpen={showConfirmModal}
          onClose={() => setShowConfirmModal(false)}
          onConfirm={handleConfirmSave}
          record={{
            ...searchedRecord,
            kualifikasi,
            kompetensi,
            kinerja,
            disiplin,
            totalIP,
          }}
          isUpdate={searchedRecord.status === 'Sudah'}
          isSaving={isSaving}
        />
      )}
    </div>
  );
};
