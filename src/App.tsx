import React, { useState, useEffect } from 'react';
import { ActiveMenu, ASNRecord } from './types';
import { Navbar } from './components/Navbar';
import { Menu1InputUpdate } from './components/Menu1InputUpdate';
import { Menu2Dashboard } from './components/Menu2Dashboard';
import { Menu3Daftar } from './components/Menu3Daftar';
import { Menu4RekapBelum } from './components/Menu4RekapBelum';
import { SheetsModal } from './components/SheetsModal';
import { KemenagLogo } from './components/KemenagLogo';
import { 
  fetchSpreadsheetData, 
  submitData,
  saveOrUpdateRecordViaWebhook, 
  SyncStatus,
  SPREADSHEET_ID,
  SHEET_NAME 
} from './services/sheetsService';
import { CheckCircle2, AlertCircle, Zap, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [activeMenu, setActiveMenu] = useState<ActiveMenu>('input');
  const [asnList, setAsnList] = useState<ASNRecord[]>([]);
  const [selectedNip, setSelectedNip] = useState<string>('');
  const [preselectedInputNip, setPreselectedInputNip] = useState<string>('');
  
  // Database Webhook & Sync state
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [showSheetsModal, setShowSheetsModal] = useState<boolean>(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    connected: true,
    lastSynced: null,
    sheetFound: true,
    rowCount: 0,
    mode: 'webhook',
  });

  // Toast Notification state
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // 1. Initial Load: Auto connect to Google Sheets & Webhook without login
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsSyncing(true);
    try {
      const res = await fetchSpreadsheetData();
      setAsnList(res.data);
      setSyncStatus(res.status);

      // Only set selected NIP if an actual filled ASN is found, otherwise keep empty
      // so that Menu 2 doesn't display a random person's name when not filled yet
      const firstFilled = res.data.find((a) => a.status === 'Sudah' && a.totalIP > 0);
      if (firstFilled && !selectedNip) {
        setSelectedNip(firstFilled.nip);
      }
    } catch (err: any) {
      console.error('Error loading data:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  // Sync / Refresh button clicked
  const handleManualSync = async () => {
    setIsSyncing(true);
    showToast('Sedang menyinkronkan data dengan Google Sheets (DATA_ASN)...');
    await loadData();
    showToast('Sinkronisasi data selesai!');
  };

  // Save/Update ASN record via Webhook with file upload and link bukti
  const handleSaveRecord = async (
    record: ASNRecord,
    file?: File | null,
    linkBukti?: string,
    onProgress?: (msg: string) => void
  ): Promise<boolean> => {
    const res = await submitData(record, file, linkBukti, onProgress);
    setAsnList(res.updatedData);
    setSelectedNip(record.nip);
    showToast(res.message, res.success ? 'success' : 'error');
    return res.success;
  };

  // Navigate to Dashboard with specific ASN
  const handleNavigateToDashboard = (nip: string) => {
    if (nip) {
      setSelectedNip(nip);
    }
    setActiveMenu('dashboard');
  };

  // Navigate to Input with specific ASN (from Rekap Belum or Daftar)
  const handleNavigateToInput = (nip: string) => {
    setPreselectedInputNip(nip);
    setActiveMenu('input');
  };

  // Callback when searching NIP discovers an existing/updated record from server
  const handleRecordFound = (foundRecord: ASNRecord) => {
    setAsnList((prev) => {
      const idx = prev.findIndex((a) => a.nip === foundRecord.nip);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], ...foundRecord };
        return next;
      }
      return [foundRecord, ...prev];
    });
    if (foundRecord.status === 'Sudah' && foundRecord.totalIP > 0) {
      setSelectedNip(foundRecord.nip);
    }
  };

  const totalSudah = asnList.filter((a) => a.status === 'Sudah' && a.totalIP > 0).length;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-emerald-50/50 via-amber-50/25 to-emerald-100/40 text-slate-800 font-sans selection:bg-emerald-200 selection:text-emerald-950">
      {/* Toast Notification with Motion */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="fixed top-20 right-5 z-50 pointer-events-none"
          >
            <div
              className={`flex items-center space-x-3 px-4 py-3 rounded-2xl shadow-2xl border backdrop-blur-md pointer-events-auto ${
                toast.type === 'success'
                  ? 'bg-emerald-900/90 text-white border-emerald-500/80 ring-1 ring-amber-300/40'
                  : 'bg-rose-900/90 text-white border-rose-500/80'
              }`}
            >
              {toast.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-amber-300 shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-300 shrink-0" />
              )}
              <span className="text-xs sm:text-sm font-semibold">{toast.message}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Navbar */}
      <Navbar
        activeMenu={activeMenu}
        setActiveMenu={(menu) => {
          setPreselectedInputNip('');
          setActiveMenu(menu);
        }}
        isSyncing={isSyncing}
        onSync={handleManualSync}
        onOpenSheetsModal={() => setShowSheetsModal(true)}
        sheetConnected={syncStatus.connected}
        totalSudah={totalSudah}
        totalASN={asnList.length}
      />

      {/* Main Content Area with Fluid Framer-Motion Transitions */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeMenu}
            initial={{ opacity: 0, y: 18, filter: 'blur(3px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -14, filter: 'blur(2px)' }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="w-full"
          >
            {activeMenu === 'input' && (
              <Menu1InputUpdate
                asnList={asnList}
                onSaveRecord={handleSaveRecord}
                onNavigateToDashboard={handleNavigateToDashboard}
                onRecordFound={handleRecordFound}
                preselectedNip={preselectedInputNip}
              />
            )}

            {activeMenu === 'dashboard' && (
              <Menu2Dashboard
                asnList={asnList}
                selectedNip={selectedNip}
                onSelectNip={setSelectedNip}
                onNavigateToInput={handleNavigateToInput}
              />
            )}

            {activeMenu === 'daftar' && (
              <Menu3Daftar
                asnList={asnList}
                onViewInDashboard={handleNavigateToDashboard}
                onEditInInput={handleNavigateToInput}
              />
            )}

            {activeMenu === 'rekap' && (
              <Menu4RekapBelum
                asnList={asnList}
                onNavigateToInputWithNip={handleNavigateToInput}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="w-full glass-nav border-t border-emerald-900/10 py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center space-x-2.5">
            <KemenagLogo size={24} />
            <div>
              <span className="font-bold text-slate-800">
                IP-ASN Kankemenag Kab. Gunungkidul
              </span>{' '}
              — Kantor Kementerian Agama Kabupaten Gunungkidul
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowSheetsModal(true)}
              className="text-emerald-800 hover:text-emerald-950 font-medium flex items-center gap-1 hover:underline cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              Webhook Aktif ({SHEET_NAME}) <ExternalLink className="w-3 h-3" />
            </button>
            <span>•</span>
            <span className="font-semibold text-slate-600">Tahun Anggaran 2026</span>
          </div>
        </div>
      </footer>

      {/* Webhook & Sheets Integration Detail Modal */}
      <SheetsModal
        isOpen={showSheetsModal}
        onClose={() => setShowSheetsModal(false)}
        onSync={handleManualSync}
        isSyncing={isSyncing}
        syncStatus={syncStatus}
      />
    </div>
  );
}
