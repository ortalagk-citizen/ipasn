import React from 'react';
import { ActiveMenu } from '../types';
import { 
  FileEdit, 
  BarChart3, 
  ClipboardList, 
  Users, 
  RefreshCw, 
  Zap, 
  Building2,
  Settings
} from 'lucide-react';

interface NavbarProps {
  activeMenu: ActiveMenu;
  setActiveMenu: (menu: ActiveMenu) => void;
  isSyncing: boolean;
  onSync: () => void;
  onOpenSheetsModal: () => void;
  sheetConnected: boolean;
  totalSudah: number;
  totalASN: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeMenu,
  setActiveMenu,
  isSyncing,
  onSync,
  onOpenSheetsModal,
  sheetConnected,
  totalSudah,
  totalASN,
}) => {
  const navItems: { id: ActiveMenu; label: string; icon: React.ReactNode; badge?: string }[] = [
    {
      id: 'input',
      label: 'Beranda (Input & Update)',
      icon: <FileEdit className="w-4 h-4" />,
    },
    {
      id: 'dashboard',
      label: 'Dashboard Visual 3D',
      icon: <BarChart3 className="w-4 h-4" />,
      badge: 'WebGL',
    },
    {
      id: 'daftar',
      label: 'Daftar IP ASN (Sudah Mengisi)',
      icon: <ClipboardList className="w-4 h-4" />,
      badge: `${totalSudah}`,
    },
    {
      id: 'rekap',
      label: 'Rekap & Belum Mengisi',
      icon: <Users className="w-4 h-4" />,
      badge: `${Math.max(0, totalASN - totalSudah)}`,
    },
  ];

  return (
    <header className="sticky top-0 z-40 w-full glass-nav backdrop-blur-xl border-b border-white/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top bar with branding and database webhook status */}
        <div className="flex items-center justify-between py-3 border-b border-emerald-900/10">
          <div className="flex items-center space-x-3.5">
            {/* Logo Kemenag Shield */}
            <div className="relative flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br from-[#006640] to-[#024B30] text-amber-300 shadow-md shadow-emerald-900/20 ring-2 ring-[#D4AF37]/50">
              <svg
                viewBox="0 0 48 48"
                className="w-7 h-7 fill-current drop-shadow"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle cx="24" cy="24" r="22" fill="#006640" stroke="#D4AF37" strokeWidth="2" />
                <path d="M24 8L30 18H18L24 8Z" fill="#D4AF37" />
                <circle cx="24" cy="26" r="8" fill="none" stroke="#D4AF37" strokeWidth="2.5" />
                <path
                  d="M16 38L24 33L32 38"
                  stroke="#D4AF37"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                <circle cx="24" cy="26" r="3" fill="#D4AF37" />
              </svg>
              <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-amber-400 rounded-full border-2 border-white flex items-center justify-center">
                <span className="w-1.5 h-1.5 bg-[#006640] rounded-full"></span>
              </div>
            </div>

            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-lg font-black tracking-tight text-emerald-950 font-sans">
                  IP-ASN Gunungkidul
                </h1>
                <span className="px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase bg-gradient-to-r from-amber-200 to-amber-300 text-amber-950 rounded-full border border-amber-400/60 shadow-xs">
                  IKHLAS BERAMAL
                </span>
              </div>
              <p className="text-xs font-semibold text-emerald-800/80 flex items-center gap-1">
                <Building2 className="w-3 h-3 text-[#D4AF37]" />
                Kankemenag Kab. Gunungkidul
              </p>
            </div>
          </div>

          {/* Right Action: Webhook Database Status & Refresh */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Google Sheets Webhook Status Pill */}
            <button
              onClick={onOpenSheetsModal}
              title="Status Integrasi Webhook Database Google Sheets"
              className="flex items-center space-x-2 px-3 py-1.5 text-xs font-medium rounded-xl glass-card border border-emerald-600/30 text-emerald-950 hover:border-emerald-600/60 hover:bg-emerald-50/70 transition-all shadow-xs cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <div className="flex items-center gap-1.5">
                <span className="hidden sm:inline font-semibold">Webhook:</span>
                <span className="inline-flex items-center gap-1 font-bold text-emerald-700">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  {sheetConnected ? 'Aktif' : 'Tersambung'}
                </span>
                <span className="hidden md:inline text-[11px] font-mono text-slate-500 bg-emerald-100/60 px-1.5 py-0.2 rounded">
                  DATA_ASN
                </span>
              </div>
            </button>

            {/* Sync / Refresh Button */}
            <button
              onClick={onSync}
              disabled={isSyncing}
              title="Segarkan data dari Google Sheets (DATA_ASN)"
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl glass-card border border-emerald-600/20 text-emerald-800 hover:text-emerald-950 hover:bg-emerald-50 transition-all cursor-pointer ${
                isSyncing ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-emerald-600' : ''}`} />
              <span className="hidden sm:inline text-xs font-semibold">
                {isSyncing ? 'Menyinkronkan...' : 'Segarkan'}
              </span>
            </button>

            {/* Quick settings icon */}
            <button
              onClick={onOpenSheetsModal}
              title="Pengaturan Webhook & Spreadsheet"
              className="p-2 rounded-xl text-slate-500 hover:text-emerald-800 hover:bg-emerald-50 transition-colors cursor-pointer"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs (Single Page Navigation tanpa reload) */}
        <div className="flex items-center space-x-1 sm:space-x-2 py-2.5 overflow-x-auto scrollbar-none">
          {navItems.map((item) => {
            const isActive = activeMenu === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveMenu(item.id)}
                className={`relative flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-[#006640] to-[#014d31] text-white shadow-md shadow-emerald-950/20 ring-1 ring-amber-300/40'
                    : 'text-slate-600 hover:text-emerald-900 hover:bg-emerald-500/10'
                }`}
              >
                <span className={isActive ? 'text-amber-300' : 'text-slate-500'}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
                {item.badge && (
                  <span
                    className={`ml-1 text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                      isActive
                        ? 'bg-amber-400 text-emerald-950'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
                {isActive && (
                  <span className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 w-8 h-1 bg-[#D4AF37] rounded-full shadow-xs"></span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
