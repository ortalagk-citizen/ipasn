import React, { useState, useEffect } from 'react';
import { 
  X, 
  ExternalLink, 
  RefreshCw, 
  CheckCircle, 
  Zap, 
  Copy, 
  Check, 
  Link2,
  Lock,
  Unlock,
  KeyRound,
  ShieldAlert,
  ShieldCheck,
  Eye,
  EyeOff,
  AlertTriangle
} from 'lucide-react';
import { 
  SPREADSHEET_ID, 
  SHEET_NAME, 
  SyncStatus, 
  getWebhookUrl, 
  setWebhookUrl,
  DEFAULT_WEBHOOK_URL 
} from '../services/sheetsService';

interface SheetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSync: () => void;
  isSyncing: boolean;
  syncStatus: SyncStatus;
}

export const SheetsModal: React.FC<SheetsModalProps> = ({
  isOpen,
  onClose,
  onSync,
  isSyncing,
  syncStatus,
}) => {
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(false);
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string>('');

  const [currentUrl, setCurrentUrl] = useState(getWebhookUrl());
  const [isCopied, setIsCopied] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Sync currentUrl whenever modal is opened
  useEffect(() => {
    if (isOpen) {
      setCurrentUrl(getWebhookUrl());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleClose = () => {
    // Reset admin authentication and clear inputs upon closing for security
    setIsAdminAuthenticated(false);
    setPasswordInput('');
    setAuthError('');
    setShowPassword(false);
    onClose();
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput.trim() === 'pr4k0m') {
      setIsAdminAuthenticated(true);
      setAuthError('');
      setPasswordInput('');
    } else {
      setAuthError('Kata sandi salah. Akses ke halaman koneksi ditolak.');
    }
  };

  const handleLockAgain = () => {
    setIsAdminAuthenticated(false);
    setPasswordInput('');
    setAuthError('');
  };

  const sheetsUrl = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/edit`;

  const handleCopy = () => {
    navigator.clipboard.writeText(currentUrl);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleSaveWebhook = () => {
    setWebhookUrl(currentUrl.trim());
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleResetDefault = () => {
    setCurrentUrl(DEFAULT_WEBHOOK_URL);
    setWebhookUrl(DEFAULT_WEBHOOK_URL);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-emerald-950/45 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-xl glass-card rounded-2xl p-6 sm:p-7 shadow-2xl border border-white/80 bg-white/95 relative animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          title="Tutup Modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* ============================================================== */}
        {/* VIEW 1: LOCKED STATE (ADMIN PASSWORD REQUIRED)                 */}
        {/* ============================================================== */}
        {!isAdminAuthenticated ? (
          <div className="py-2 animate-in fade-in duration-200">
            <div className="flex items-center space-x-3.5 mb-5">
              <div className="p-3 bg-emerald-100 text-[#006640] rounded-2xl ring-2 ring-emerald-500/20 shadow-xs">
                <Lock className="w-6 h-6 text-[#006640]" />
              </div>
              <div>
                <h3 className="text-lg font-black tracking-tight text-slate-900">
                  Akses Khusus Administrator
                </h3>
                <p className="text-xs font-medium text-slate-500">
                  Konfigurasi Koneksi & Database SI-IPASN
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200/90 text-amber-900 mb-5 text-xs flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold">Otorisasi Dibutuhkan</p>
                <p className="text-amber-800 leading-relaxed">
                  Halaman koneksi database dan webhook Google Sheets ini hanya dapat diakses oleh Administrator yang berwenang. Silakan masukkan kata sandi Anda.
                </p>
              </div>
            </div>

            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Kata Sandi Admin
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={passwordInput}
                    onChange={(e) => {
                      setPasswordInput(e.target.value);
                      if (authError) setAuthError('');
                    }}
                    placeholder="Masukkan kata sandi admin..."
                    autoFocus
                    className="w-full pl-10 pr-10 py-3 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm font-medium focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all placeholder:text-slate-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                    title={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {authError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2 animate-in fade-in duration-150">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span className="font-semibold">{authError}</span>
                </div>
              )}

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-bold transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#006640] to-[#014d31] hover:from-[#005233] hover:to-[#013b26] text-white text-xs font-bold shadow-md shadow-emerald-950/20 transition-all cursor-pointer"
                >
                  <Unlock className="w-3.5 h-3.5 text-amber-300" />
                  <span>Buka Akses Koneksi</span>
                </button>
              </div>
            </form>
          </div>
        ) : (
          /* ============================================================== */
          /* VIEW 2: UNLOCKED STATE (AUTHENTICATED AS ADMIN)                 */
          /* ============================================================== */
          <div className="animate-in fade-in duration-200">
            <div className="flex items-center justify-between mb-5 pr-8">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-amber-100 text-amber-800 rounded-xl ring-1 ring-amber-300">
                  <Zap className="w-6 h-6 text-amber-600 fill-amber-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Koneksi Webhook Google Sheets (Bebas Login)
                  </h3>
                  <p className="text-xs text-slate-500">
                    SI-IPASN Kankemenag Kab. Gunungkidul
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleLockAgain}
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-700 border border-slate-200 transition-colors cursor-pointer"
                title="Kunci kembali akses koneksi"
              >
                <Lock className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Kunci Akses</span>
              </button>
            </div>

            {/* Status Card */}
            <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200/80 mb-4 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-bold text-emerald-900">
                  Koneksi Database Aktif Secara Otomatis
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-100/90 px-2 py-0.5 rounded-full border border-emerald-300">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  Admin
                </span>
                <span className="text-[11px] font-semibold text-emerald-700 bg-white px-2 py-0.5 rounded-full border border-emerald-200">
                  Tanpa Login Google
                </span>
              </div>
            </div>

            {/* Connection detail list */}
            <div className="space-y-3 mb-5 text-xs">
              {/* Webhook Endpoint */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                    <Link2 className="w-3.5 h-3.5 text-amber-600" />
                    URL Webhook Google Apps Script
                  </span>
                  <div className="flex items-center space-x-1">
                    <button
                      type="button"
                      onClick={handleCopy}
                      className="p-1 text-slate-500 hover:text-slate-800 rounded transition-colors cursor-pointer"
                      title="Salin URL"
                    >
                      {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
                <textarea
                  rows={2}
                  value={currentUrl}
                  onChange={(e) => setCurrentUrl(e.target.value)}
                  className="w-full font-mono text-[11px] text-slate-800 bg-white p-2 rounded-lg border border-slate-300 focus:outline-hidden focus:border-emerald-600 break-all select-all resize-none"
                />
                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={handleResetDefault}
                    className="text-[11px] text-slate-500 hover:text-slate-700 underline cursor-pointer"
                  >
                    Reset ke Webhook Default
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveWebhook}
                    className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-md text-[11px] font-bold cursor-pointer transition-colors"
                  >
                    {saveSuccess ? 'Tersimpan!' : 'Simpan URL'}
                  </button>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 font-medium">Spreadsheet Target</span>
                  <a
                    href={sheetsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-1 underline"
                  >
                    Buka di Google Sheets <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <div className="font-mono text-[11px] text-slate-700 bg-white p-1.5 rounded border border-slate-200 break-all">
                  {SPREADSHEET_ID}
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between">
                <span className="text-slate-600 font-medium">Nama Lembar / Sheet</span>
                <span className="font-mono font-bold text-emerald-800 bg-emerald-100/80 px-2.5 py-1 rounded-md">
                  {SHEET_NAME}
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between">
                <span className="text-slate-600 font-medium">Terakhir Disegarkan</span>
                <span className="text-slate-700 font-semibold font-mono">
                  {syncStatus.lastSynced || 'Baru saja'}
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between">
                <span className="text-slate-600 font-medium">Total Pegawai Termuat dari Sheet</span>
                <span className="font-bold text-slate-900 bg-white px-2.5 py-0.5 rounded border border-slate-200">
                  {syncStatus.rowCount} ASN
                </span>
              </div>

              {/* Endpoint Documentation for Admin */}
              <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-200 space-y-2">
                <span className="font-bold text-emerald-950 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-600" />
                  Spesifikasi API Endpoint Webhook:
                </span>
                <div className="space-y-1 font-mono text-[10px] text-slate-700">
                  <div className="p-1.5 bg-white rounded border border-emerald-100">
                    <span className="font-bold text-emerald-800">GET ?action=cari_nip&nip=123</span>
                    <p className="font-sans text-[11px] text-slate-500 mt-0.5">Mencari data & nilaiLama.link_bukti untuk auto-fill</p>
                  </div>
                  <div className="p-1.5 bg-white rounded border border-emerald-100">
                    <span className="font-bold text-emerald-800">POST action: 'simpan_atau_update'</span>
                    <p className="font-sans text-[11px] text-slate-500 mt-0.5">Payload: nip, kualifikasi, kompetensi, kinerja, disiplin, link_bukti</p>
                  </div>
                  <div className="p-1.5 bg-white rounded border border-emerald-100">
                    <span className="font-bold text-emerald-800">GET ?action=get_dashboard</span>
                    <p className="font-sans text-[11px] text-slate-500 mt-0.5">Mengambil ringkasan data statistik dan rekapitulasi</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Action button */}
            <div className="flex gap-2.5">
              <button
                onClick={() => {
                  onSync();
                  handleClose();
                }}
                disabled={isSyncing}
                className="flex-1 flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#006640] to-[#024B30] text-white text-xs font-semibold hover:from-[#005233] hover:to-[#013824] transition-all shadow-md cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'Menyinkronkan...' : 'Segarkan Data Sekarang'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
