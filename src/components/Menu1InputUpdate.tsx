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
  BadgeAlert,
  Link2,
  ExternalLink,
  Upload,
  Image as ImageIcon,
  Trash2,
  FileCheck
} from 'lucide-react';
import { ConfirmationModal } from './ConfirmationModal';
import { HeroBanner } from './HeroBanner';
import { cariNIP } from '../services/sheetsService';

interface Menu1InputUpdateProps {
  asnList: ASNRecord[];
  onSaveRecord: (
    record: ASNRecord,
    file?: File | null,
    linkBukti?: string,
    onProgress?: (msg: string) => void
  ) => Promise<boolean>;
  onNavigateToDashboard: (nip: string) => void;
  onRecordFound?: (record: ASNRecord) => void;
  preselectedNip?: string;
}

export const Menu1InputUpdate: React.FC<Menu1InputUpdateProps> = ({
  asnList,
  onSaveRecord,
  onNavigateToDashboard,
  onRecordFound,
  preselectedNip,
}) => {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [searchNip, setSearchNip] = useState(preselectedNip || '');
  const [searchedRecord, setSearchedRecord] = useState<ASNRecord | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Form states (4 Komponen Utama)
  const [kualifikasi, setKualifikasi] = useState<number>(15);
  const [kompetensi, setKompetensi] = useState<number>(30);
  const [kinerja, setKinerja] = useState<number>(25);
  const [disiplin, setDisiplin] = useState<number>(5);

  // Bukti Dukung SIASN
  const [linkBukti, setLinkBukti] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);

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
  const [uploadStatusText, setUploadStatusText] = useState('Mengunggah file ke server...');

  // Auto trigger search if preselectedNip is passed
  useEffect(() => {
    if (preselectedNip) {
      setSearchNip(preselectedNip);
      handleSearch(preselectedNip);
      setCurrentStep(2);
    }
  }, [preselectedNip]);

  /**
   * 3. INTEGRASI API: cariNIP(nip) -> GET ?action=cari_nip&nip=123
   */
  const handleSearch = async (nipToSearch = searchNip) => {
    const cleanNip = nipToSearch.trim();
    if (!cleanNip) {
      setSearchError('Silakan masukkan NIP pegawai terlebih dahulu.');
      setSearchedRecord(null);
      setHasSearched(false);
      setCurrentStep(1);
      return;
    }

    setIsSearching(true);
    setSearchError(null);

    try {
      // Panggil fungsi API cariNIP
      const result = await cariNIP(cleanNip);
      setHasSearched(true);

      if (result.success && result.data) {
        const found = result.data;
        setSearchedRecord(found);
        setSearchError(null);
        setCurrentStep(2);

        // Beritahukan ke App agar daftar in-memory dan dashboard ikut terupdate seketika
        if (onRecordFound) {
          onRecordFound(found);
        }

        // Pre-fill data
        const isAlreadyFilled = found.status === 'Sudah' || found.totalIP > 0 || (found.kualifikasi + found.kompetensi + found.kinerja + found.disiplin) > 0;
        if (isAlreadyFilled) {
          setKualifikasi(found.kualifikasi);
          setKompetensi(found.kompetensi);
          setKinerja(found.kinerja);
          setDisiplin(found.disiplin);
          setLinkBukti(found.link_bukti || '');

          // Sesuaikan preset pilihan UI agar serasi dengan nilai yang ada
          if (found.kualifikasi === 25) setPendidikanPreset('S3');
          else if (found.kualifikasi === 20) setPendidikanPreset('S2');
          else if (found.kualifikasi === 15) setPendidikanPreset('S1');
          else if (found.kualifikasi === 10) setPendidikanPreset('D3');
          else if (found.kualifikasi === 5) setPendidikanPreset('SMA');

          if (found.kinerja === 30) setSkpPreset('Sangat Baik');
          else if (found.kinerja === 25) setSkpPreset('Baik');
          else if (found.kinerja === 15) setSkpPreset('Butuh Perbaikan');
          else if (found.kinerja === 10) setSkpPreset('Kurang');

          if (found.disiplin === 5) setDisiplinPreset('Tidak Ada');
          else if (found.disiplin === 3) setDisiplinPreset('Ringan');
          else if (found.disiplin === 2) setDisiplinPreset('Sedang');
          else if (found.disiplin === 1) setDisiplinPreset('Berat');
        } else {
          // Default untuk isian baru
          setKualifikasi(15);
          setKompetensi(30);
          setKinerja(25);
          setDisiplin(5);
          setPendidikanPreset('S1');
          setSkpPreset('Baik');
          setDisiplinPreset('Tidak Ada');
          setLinkBukti(found.link_bukti || '');
        }
        setSelectedFile(null);
        setFilePreview(null);
      } else {
        setSearchedRecord(null);
        setSearchError(result.message || `Pegawai dengan NIP "${cleanNip}" tidak ditemukan dalam database.`);
        setCurrentStep(1);
      }
    } catch (e) {
      setSearchError('Gagal melakukan pencarian NIP, silakan periksa koneksi Anda.');
      setCurrentStep(1);
    } finally {
      setIsSearching(false);
    }
  };

  // Handler pemilihan file gambar bukti dukung
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validasi tipe file
      if (!file.type.startsWith('image/')) {
        alert('Mohon pilih file gambar (PNG, JPG, JPEG, WebP)');
        return;
      }
      setSelectedFile(file);
      // Gunakan FileReader untuk membaca preview lokal instan
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setFilePreview(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
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

  const handleToggleKompetensi = (key: string, points: number) => {
    const nextChecks = { ...kompetensiChecks, [key]: !kompetensiChecks[key] };
    setKompetensiChecks(nextChecks);

    let calculated = 0;
    if (nextChecks.struktural) calculated += 15;
    if (nextChecks.fungsional) calculated += 15;
    if (nextChecks.teknis) calculated += 15;
    if (nextChecks.workshop) calculated += 10;
    setKompetensi(Math.min(40, calculated));
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

  /**
   * 3. INTEGRASI API: submitData()
   * Membaca file gambar dengan FileReader menjadi string Base64, mengirim ke Apps Script dengan text/plain
   */
  const handleConfirmSave = async () => {
    if (!searchedRecord) return;
    setIsSaving(true);
    setUploadStatusText('Mengunggah file ke server...');

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
      link_bukti: linkBukti.trim(),
      file_name: selectedFile ? selectedFile.name : searchedRecord.file_name,
    };

    const ok = await onSaveRecord(
      recordToSave,
      selectedFile,
      linkBukti.trim(),
      (msg) => setUploadStatusText(msg)
    );

    setIsSaving(false);
    setShowConfirmModal(false);

    if (ok) {
      // Langsung arahkan ke Menu 2 (Dashboard) setelah submit/update sukses
      onNavigateToDashboard(recordToSave.nip);
    }
  };

  // Quick picker sample NIPs from the dataset
  const sampleBelumNips = asnList.filter((a) => a.status === 'Belum').slice(0, 3);
  const sampleSudahNips = asnList.filter((a) => a.status === 'Sudah').slice(0, 3);

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12 animate-in fade-in duration-300">
      {/* 1. HERO BANNER & 3-STAGE PROGRESS */}
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
              <h3 
                style={{ fontSize: '18px' }}
                className="font-extrabold text-slate-900"
              >
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
              style={{ fontSize: '18px' }}
              className="w-full glass-input px-4 py-3.5 rounded-xl text-slate-900 font-mono placeholder:text-slate-400 focus:outline-hidden"
            />
            {searchNip && (
              <button
                type="button"
                onClick={() => {
                  setSearchNip('');
                  setSearchedRecord(null);
                  setHasSearched(false);
                  setCurrentStep(1);
                  setSelectedFile(null);
                  setFilePreview(null);
                }}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 hover:text-slate-700 px-1 py-0.5 cursor-pointer"
              >
                Reset
              </button>
            )}
          </div>
          <button
            type="submit"
            disabled={isSearching}
            style={{ fontSize: '22px' }}
            className="flex items-center justify-center space-x-2 px-7 py-3.5 rounded-xl bg-gradient-to-r from-[#006640] to-[#014d31] hover:from-[#005233] hover:to-[#013b26] text-white font-bold shadow-md shadow-emerald-950/20 ring-1 ring-amber-300/40 transition-all cursor-pointer disabled:opacity-50"
          >
            {isSearching ? (
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <Search className="w-5 h-5 text-amber-300" />
            )}
            <span>{isSearching ? 'Mencari...' : 'Cari NIP'}</span>
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
                className={`w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-xl shadow-md ${
                  searchedRecord.status === 'Sudah'
                    ? 'bg-gradient-to-br from-[#006640] to-emerald-700 text-amber-300 ring-2 ring-emerald-300'
                    : 'bg-gradient-to-br from-amber-500 to-orange-600 text-white ring-2 ring-amber-300'
                }`}
              >
                {searchedRecord.status === 'Sudah' ? (
                  <UserCheck className="w-7 h-7" />
                ) : (
                  <BadgeAlert className="w-7 h-7" />
                )}
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold ${
                      searchedRecord.status === 'Sudah'
                        ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                        : 'bg-amber-100 text-amber-900 border border-amber-300'
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        searchedRecord.status === 'Sudah' ? 'bg-emerald-600' : 'bg-amber-600'
                      }`}
                    ></span>
                    {searchedRecord.status === 'Sudah' ? 'SUDAH MENGISI' : 'BELUM MENGISI'}
                  </span>
                  <span className="text-xs text-slate-500 font-mono">NIP: {searchedRecord.nip}</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900">{searchedRecord.nama}</h3>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
                  <span className="flex items-center gap-1 font-medium">
                    <Building className="w-3.5 h-3.5 text-[#006640]" />
                    {searchedRecord.unitKerja}
                  </span>
                  <span>•</span>
                  <span className="font-semibold text-slate-700">{searchedRecord.jabatan}</span>
                </div>
              </div>
            </div>

            {/* Right Status Badge */}
            <div className="flex md:flex-col items-center md:items-end justify-between border-t md:border-t-0 pt-3 md:pt-0 border-slate-200">
              <div className="text-left md:text-right">
                <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                  Status Isian
                </div>
                <div
                  className={`text-base font-extrabold ${
                    searchedRecord.status === 'Sudah' ? 'text-emerald-800' : 'text-amber-800'
                  }`}
                >
                  {searchedRecord.status === 'Sudah'
                    ? `Skor Terakhir: ${searchedRecord.totalIP} Poin`
                    : 'Silakan Lengkapi Nilai'}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCurrentStep(3)}
                className="mt-1 flex items-center space-x-1 text-xs font-bold text-[#006640] hover:text-emerald-800 underline cursor-pointer"
              >
                <span>{searchedRecord.status === 'Sudah' ? 'Ganti Nilai & Bukti' : 'Mulai Pengisian'}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Rincian Verifikasi Nilai Server Bila Sudah Mengisi */}
          {searchedRecord.status === 'Sudah' && (
            <div className="mt-4 pt-3.5 border-t border-emerald-200/70 flex flex-wrap items-center justify-between gap-3 text-xs bg-emerald-50/60 p-3 rounded-xl border">
              <div className="flex items-center space-x-2 text-emerald-950 font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  Data pegawai ini <strong>sudah tercatat mengisi</strong> di server. Anda dapat memperbarui nilai atau mengubah bukti dukung di bawah.
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2.5 font-mono text-[11px] text-emerald-900 bg-white/90 px-3 py-1 rounded-lg border border-emerald-300">
                <span>Kualifikasi: <strong>{searchedRecord.kualifikasi}</strong>/25</span>
                <span>•</span>
                <span>Kompetensi: <strong>{searchedRecord.kompetensi}</strong>/40</span>
                <span>•</span>
                <span>Kinerja: <strong>{searchedRecord.kinerja}</strong>/30</span>
                <span>•</span>
                <span>Disiplin: <strong>{searchedRecord.disiplin}</strong>/5</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 4. FORMULIR PENILAIAN 4 KOMPONEN & BUKTI DUKUNG (TAHAP 3) */}
      {searchedRecord && (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                <span>Tahap 3: Instrumen IP ASN & Bukti Dukung</span>
                <Sparkles className="w-5 h-5 text-amber-500" />
              </h3>
              <p className="text-xs text-slate-500">
                Lengkapi 4 parameter penilaian dan lampirkan bukti screenshot SIASN BKN
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setKualifikasi(25);
                  setKompetensi(40);
                  setKinerja(30);
                  setDisiplin(5);
                }}
                className="text-xs font-bold text-emerald-800 hover:text-emerald-950 bg-emerald-100/80 px-3 py-1.5 rounded-xl border border-emerald-300 transition-colors cursor-pointer"
              >
                Set Nilai Maksimal (100)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* 1. KUALIFIKASI (Maks 25) */}
            <div className="glass-card rounded-[22px] p-6 shadow-md border border-white/80 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200/60">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2.5 bg-emerald-100 text-[#006640] rounded-xl">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">1. Kualifikasi Pendidikan</h4>
                    <p className="text-xs text-slate-500">Pendidikan formal terakhir yang diakui</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 rounded-lg text-xs font-bold font-mono">
                  Maks. 25
                </span>
              </div>

              {/* Pendidikan Presets */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'S3 / Doktor', val: 'S3', score: 25 },
                  { label: 'S2 / Magister', val: 'S2', score: 20 },
                  { label: 'S1 / D-IV', val: 'S1', score: 15 },
                  { label: 'D-III', val: 'D3', score: 10 },
                  { label: 'D-I / D-II', val: 'D1-D2', score: 5 },
                  { label: 'SMA / MA', val: 'SMA', score: 5 },
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
                  <span className="text-slate-600 font-medium">Penyesuaian Nilai Manual</span>
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
                    <p className="text-xs text-slate-500">Diklat struktural, fungsional, dan teknis</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 bg-amber-50 text-amber-800 rounded-lg text-xs font-bold font-mono">
                  Maks. 40
                </span>
              </div>

              {/* Kompetensi Checklist */}
              <div className="space-y-2 text-xs">
                {[
                  { key: 'fungsional', label: 'Diklat Fungsional / Sertifikasi Profesi', pts: 15 },
                  { key: 'teknis', label: 'Diklat Teknis (minimal 20 JP per tahun)', pts: 15 },
                  { key: 'struktural', label: 'Diklat Kepemimpinan (Pim II/III/IV)', pts: 15 },
                  { key: 'workshop', label: 'Seminar / Workshop / Bimtek Mandiri', pts: 10 },
                ].map((item) => (
                  <label
                    key={item.key}
                    className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition-all ${
                      kompetensiChecks[item.key]
                        ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950 font-semibold'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5">
                      <input
                        type="checkbox"
                        checked={kompetensiChecks[item.key]}
                        onChange={() => handleToggleKompetensi(item.key, item.pts)}
                        className="rounded-md text-[#006640] focus:ring-[#006640] w-4 h-4 cursor-pointer"
                      />
                      <span>{item.label}</span>
                    </div>
                    <span className="font-mono text-[11px] font-bold text-slate-500">+{item.pts}</span>
                  </label>
                ))}
              </div>

              {/* Custom Score Slider */}
              <div className="pt-2">
                <div className="flex justify-between items-center text-xs mb-1">
                  <span className="text-slate-600 font-medium">Penyesuaian Nilai Kompetensi</span>
                  <span className="font-bold font-mono text-emerald-800 text-sm bg-emerald-100 px-2.5 py-0.5 rounded-lg">
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
                  className="w-full accent-[#006640] cursor-pointer"
                />
              </div>
            </div>

            {/* 3. KINERJA (Maks 30) */}
            <div className="glass-card rounded-[22px] p-6 shadow-md border border-white/80 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200/60">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2.5 bg-emerald-100 text-[#006640] rounded-xl">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">3. Kinerja (SKP Tahunan)</h4>
                    <p className="text-xs text-slate-500">Hasil Penilaian Kinerja Pegawai periode berjalan</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 rounded-lg text-xs font-bold font-mono">
                  Maks. 30
                </span>
              </div>

              {/* SKP Presets */}
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'Sangat Baik', val: 'Sangat Baik', score: 30 },
                  { label: 'Baik', val: 'Baik', score: 25 },
                  { label: 'Butuh Perbaikan', val: 'Perbaikan', score: 15 },
                  { label: 'Kurang / Sangat Kurang', val: 'Kurang', score: 5 },
                ].map((item) => (
                  <button
                    key={item.val}
                    type="button"
                    onClick={() => handleSKPChange(item.val, item.score)}
                    className={`p-2.5 rounded-xl text-xs font-medium text-center transition-all cursor-pointer ${
                      kinerja === item.score && skpPreset === item.val
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

          {/* 5. BUKTI DUKUNG SIASN (URL GOOGLE DRIVE & UPLOAD GAMBAR SCREENSHOT) */}
          <div className="glass-card rounded-[24px] p-6 sm:p-7 shadow-lg border border-white/80 space-y-5 bg-gradient-to-br from-white/95 via-emerald-50/20 to-amber-50/20">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200/60">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-gradient-to-br from-sky-500 to-emerald-600 text-white rounded-2xl shadow-sm">
                  <Link2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-900 text-base">
                    5. Bukti Dukung IP ASN (Screenshot SIASN BKN)
                  </h4>
                  <p className="text-xs text-slate-500">
                    Lampirkan tautan Google Drive dan/atau unggah file screenshot pendukung
                  </p>
                </div>
              </div>
              <span className="px-3 py-1 bg-sky-100 text-sky-900 rounded-full text-xs font-bold font-mono border border-sky-300">
                Verifikasi SIASN
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Bagian A: Input Link Bukti Dukung (URL/Tautan screenshot dari SIASN) */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-800 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <ExternalLink className="w-3.5 h-3.5 text-emerald-700" />
                    Link Bukti Dukung (URL/Tautan Google Drive)
                  </span>
                  {linkBukti && (
                    <a
                      href={linkBukti}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-700 hover:text-emerald-900 underline text-[11px] font-semibold"
                    >
                      Buka Tautan
                    </a>
                  )}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Link2 className="w-4 h-4 text-emerald-600" />
                  </div>
                  {/* Gunakan tag <input type="url"> dengan pesan placeholder "Masukkan link Google Drive screenshot SIASN" */}
                  <input
                    type="url"
                    value={linkBukti}
                    onChange={(e) => setLinkBukti(e.target.value)}
                    placeholder="Masukkan link Google Drive screenshot SIASN"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs sm:text-sm font-medium focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all placeholder:text-slate-400 shadow-2xs"
                  />
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  💡 <em>Masukkan URL berkas screenshot yang disimpan di Google Drive pegawai (pastikan akses tautan terbuka).</em>
                </p>
              </div>

              {/* Bagian B: Unggah File Gambar Screenshot SIASN (FileReader -> Base64) */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-800 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-amber-700" />
                    Unggah Berkas Gambar Screenshot SIASN
                  </span>
                  <span className="text-[11px] text-slate-500 font-normal">PNG, JPG, JPEG</span>
                </label>

                {!selectedFile ? (
                  <label className="flex flex-col items-center justify-center p-5 rounded-2xl border-2 border-dashed border-emerald-300 hover:border-emerald-500 bg-white/80 hover:bg-emerald-50/40 transition-all cursor-pointer group">
                    <div className="p-2.5 rounded-xl bg-emerald-100 text-[#006640] group-hover:scale-110 transition-transform mb-2">
                      <Upload className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold text-slate-800">
                      Klik untuk Pilih File Gambar Screenshot
                    </span>
                    <span className="text-[11px] text-slate-500 mt-0.5">
                      Ukuran disarankan &lt; 2 MB untuk transmisi cepat
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                ) : (
                  <div className="p-3 bg-white rounded-2xl border border-emerald-300 shadow-xs flex items-center justify-between gap-3">
                    <div className="flex items-center space-x-3 truncate">
                      {filePreview ? (
                        <img
                          src={filePreview}
                          alt="Pratinjau Screenshot SIASN"
                          className="w-12 h-12 object-cover rounded-xl border border-slate-200 shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-800 shrink-0">
                          <FileCheck className="w-6 h-6" />
                        </div>
                      )}
                      <div className="truncate">
                        <p className="text-xs font-bold text-slate-900 truncate">
                          {selectedFile.name}
                        </p>
                        <p className="text-[11px] text-slate-500 font-mono">
                          {(selectedFile.size / 1024).toFixed(1)} KB • {selectedFile.type || 'image/png'}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveFile}
                      className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-colors shrink-0 cursor-pointer"
                      title="Hapus file terpilih"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
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
                  setSelectedFile(null);
                  setFilePreview(null);
                }}
                className="px-4 py-3 rounded-xl border border-slate-300 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Batal
              </button>

              <button
                type="submit"
                disabled={isSaving}
                className={`flex-1 sm:flex-initial flex items-center justify-center space-x-2 px-8 py-3.5 rounded-xl font-bold text-sm text-white shadow-lg shadow-emerald-950/20 ring-1 ring-amber-300/50 transition-all cursor-pointer ${
                  searchedRecord.status === 'Sudah'
                    ? 'bg-gradient-to-r from-amber-600 via-amber-700 to-emerald-800 hover:from-amber-700 hover:to-emerald-900'
                    : 'bg-gradient-to-r from-[#006640] via-[#024B30] to-[#013824] hover:from-[#005233] hover:to-[#012f1f]'
                }`}
              >
                {isSaving ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    <span>{uploadStatusText}</span>
                  </>
                ) : searchedRecord.status === 'Sudah' ? (
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
          uploadStatusText={uploadStatusText}
          selectedFile={selectedFile}
          linkBukti={linkBukti}
        />
      )}
    </div>
  );
};
