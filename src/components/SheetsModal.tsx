import React, { useState } from 'react';
import { 
  X, 
  ExternalLink, 
  RefreshCw, 
  CheckCircle, 
  Zap, 
  Copy, 
  Check, 
  FileSpreadsheet,
  Link2
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
  const [currentUrl, setCurrentUrl] = useState(getWebhookUrl());
  const [isCopied, setIsCopied] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  if (!isOpen) return null;

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-emerald-950/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-xl glass-card rounded-2xl p-6 sm:p-7 shadow-2xl border border-white/80 bg-white/95 relative animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3 mb-5">
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

        {/* Status Card */}
        <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200/80 mb-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-bold text-emerald-900">
              Koneksi Database Aktif Secara Otomatis
            </span>
          </div>
          <span className="text-[11px] font-semibold text-emerald-700 bg-white px-2 py-0.5 rounded-full border border-emerald-200">
            Tanpa Login Google
          </span>
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
                  className="p-1 text-slate-500 hover:text-slate-800 rounded transition-colors"
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
        </div>

        {/* Action button */}
        <div className="flex gap-2.5">
          <button
            onClick={() => {
              onSync();
              onClose();
            }}
            disabled={isSyncing}
            className="flex-1 flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#006640] to-[#024B30] text-white text-xs font-semibold hover:from-[#005233] hover:to-[#013824] transition-all shadow-md cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Menyinkronkan...' : 'Segarkan Data Sekarang'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
