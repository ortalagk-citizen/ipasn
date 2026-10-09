import React from 'react';
import { ASNRecord } from '../types';
import { AlertTriangle, CheckCircle2, X, Zap, Link2, FileImage } from 'lucide-react';
import { SHEET_NAME } from '../services/sheetsService';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  record: ASNRecord;
  isUpdate: boolean;
  isSaving: boolean;
  uploadStatusText?: string;
  selectedFile?: File | null;
  linkBukti?: string;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  record,
  isUpdate,
  isSaving,
  uploadStatusText = 'Mengunggah file ke server...',
  selectedFile,
  linkBukti,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-emerald-950/45 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-lg glass-card rounded-2xl p-6 sm:p-7 shadow-2xl border border-white/80 bg-white/95 relative animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        <button
          onClick={onClose}
          disabled={isSaving}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-start space-x-3.5 mb-4">
          <div className="p-3 bg-amber-100 text-amber-800 rounded-xl ring-1 ring-amber-300">
            <AlertTriangle className="w-6 h-6 text-amber-700" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              {isUpdate ? 'Konfirmasi Pembaruan Data IP ASN' : 'Konfirmasi Penyimpanan Data IP ASN'}
            </h3>
            <p className="text-xs text-slate-600 mt-0.5">
              Mohon periksa rincian nilai & bukti dukung sebelum dikirim ke server Webhook Google Sheets.
            </p>
          </div>
        </div>

        {/* ASN Profile Summary Card */}
        <div className="p-4 bg-gradient-to-br from-emerald-50/70 to-amber-50/60 rounded-xl border border-emerald-900/10 mb-4 space-y-2">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[11px] font-bold tracking-wider uppercase text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">
                {record.unitKerja}
              </span>
              <h4 className="text-base font-extrabold text-slate-900 mt-1">{record.nama}</h4>
              <p className="text-xs font-mono text-slate-600">NIP: {record.nip}</p>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-500 font-medium">Total Skor</span>
              <div className="text-2xl font-black text-[#006640]">
                {record.totalIP}
                <span className="text-xs font-normal text-slate-500"> / 100</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2 pt-2 border-t border-emerald-900/10 text-center">
            <div className="p-1.5 bg-white/80 rounded-lg border border-slate-200">
              <div className="text-[10px] text-slate-500">Kualifikasi</div>
              <div className="text-sm font-bold text-slate-800">{record.kualifikasi}<span className="text-[10px] text-slate-400">/25</span></div>
            </div>
            <div className="p-1.5 bg-white/80 rounded-lg border border-slate-200">
              <div className="text-[10px] text-slate-500">Kompetensi</div>
              <div className="text-sm font-bold text-slate-800">{record.kompetensi}<span className="text-[10px] text-slate-400">/40</span></div>
            </div>
            <div className="p-1.5 bg-white/80 rounded-lg border border-slate-200">
              <div className="text-[10px] text-slate-500">Kinerja</div>
              <div className="text-sm font-bold text-slate-800">{record.kinerja}<span className="text-[10px] text-slate-400">/30</span></div>
            </div>
            <div className="p-1.5 bg-white/80 rounded-lg border border-slate-200">
              <div className="text-[10px] text-slate-500">Disiplin</div>
              <div className="text-sm font-bold text-slate-800">{record.disiplin}<span className="text-[10px] text-slate-400">/5</span></div>
            </div>
          </div>
        </div>

        {/* Bukti Dukung Information */}
        {(linkBukti || selectedFile) && (
          <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-xs space-y-1.5 mb-4">
            <span className="font-bold text-amber-950 block">Bukti Dukung yang Dilampirkan:</span>
            {linkBukti && (
              <div className="flex items-center gap-1.5 text-slate-700 truncate">
                <Link2 className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                <span className="truncate font-mono text-[11px]">{linkBukti}</span>
              </div>
            )}
            {selectedFile && (
              <div className="flex items-center gap-1.5 text-slate-700">
                <FileImage className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                <span className="font-medium text-[11px] truncate">{selectedFile.name}</span>
                <span className="text-[10px] text-slate-500 font-mono">
                  ({(selectedFile.size / 1024).toFixed(1)} KB)
                </span>
              </div>
            )}
          </div>
        )}

        {/* Destination & Integration target notice */}
        <div className="flex items-start space-x-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 mb-5">
          <Zap className="w-4 h-4 text-amber-500 shrink-0 mt-0.5 fill-amber-500" />
          <div>
            <span className="font-semibold text-slate-800">Koneksi Otomatis: </span>
            <span>
              Data akan dikirim ke <strong>Webhook Google Apps Script</strong> untuk memperbarui lembar <strong className="text-emerald-800">"{SHEET_NAME}"</strong> dan disimpan di memori aplikasi secara otomatis tanpa perlu login Google.
            </span>
          </div>
        </div>

        {/* UI Loading Text saat mengunggah file ke server */}
        {isSaving && (
          <div className="p-3.5 mb-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-950 flex items-center space-x-3 animate-pulse">
            <span className="w-5 h-5 border-2 border-emerald-700 border-t-transparent rounded-full animate-spin shrink-0"></span>
            <div>
              <p className="text-xs font-bold text-emerald-900">{uploadStatusText}</p>
              <p className="text-[11px] text-emerald-700">Mohon tunggu, proses transmisi data sedang berlangsung.</p>
            </div>
          </div>
        )}

        {/* Buttons */}
        <div className="flex items-center justify-end space-x-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isSaving}
            className="flex items-center space-x-2 px-5 py-2 text-sm font-bold text-white bg-gradient-to-r from-[#006640] to-[#024B30] hover:from-[#005233] hover:to-[#013824] rounded-xl shadow-md shadow-emerald-950/20 ring-1 ring-amber-300/40 transition-all cursor-pointer disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                <span>{uploadStatusText}</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 text-amber-300" />
                <span>{isUpdate ? 'Ya, Perbarui Data' : 'Ya, Kirim & Simpan'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
