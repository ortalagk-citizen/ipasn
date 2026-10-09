import React from 'react';
import { KemenagLogo } from './KemenagLogo';
import { BarChart3, ChevronRight, Zap, CheckCircle2 } from 'lucide-react';
import { SPREADSHEET_ID } from '../services/sheetsService';

interface HeroBannerProps {
  onGoToDashboard: () => void;
  currentStep: 1 | 2 | 3;
  onSelectStep: (step: 1 | 2 | 3) => void;
  hasSearchedASN: boolean;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({
  onGoToDashboard,
  currentStep,
  onSelectStep,
  hasSearchedASN,
}) => {
  const shortSheetId = `${SPREADSHEET_ID.slice(0, 7)}...${SPREADSHEET_ID.slice(-3)}`;

  return (
    <div className="space-y-4">
      {/* Main Hero Card (Matches and elevates the reference design) */}
      <div className="relative overflow-hidden rounded-[28px] border border-white/80 bg-gradient-to-r from-sky-50/80 via-emerald-50/60 to-amber-100/75 p-6 sm:p-8 shadow-xl shadow-emerald-950/5 backdrop-blur-xl">
        {/* Ambient glowing radial lights */}
        <div className="absolute top-0 right-1/4 w-80 h-80 bg-amber-200/30 rounded-full blur-3xl pointer-events-none -z-0"></div>
        <div className="absolute -bottom-10 left-10 w-64 h-64 bg-emerald-200/30 rounded-full blur-3xl pointer-events-none -z-0"></div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Left section: Logo + Headings */}
          <div className="flex items-start sm:items-center gap-5 sm:gap-6">
            {/* Official Kemenag Logo */}
            <div className="shrink-0 p-1.5 bg-white/70 rounded-2xl shadow-sm border border-emerald-900/10">
              <KemenagLogo size={82} />
            </div>

            {/* Content text */}
            <div className="space-y-2">
              {/* Badges Row */}
              <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold">
                {/* Badge 1: Kemenag RI */}
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#004d30] text-emerald-100 shadow-xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  Kementerian Agama Republik Indonesia
                </span>

                {/* Badge 2: Kankemenag Kab. Gunungkidul */}
                <span className="inline-flex items-center px-3 py-1 rounded-full bg-sky-100/90 text-sky-900 border border-sky-200 shadow-xs">
                  Kankemenag Kab. Gunungkidul
                </span>

                {/* Badge 3: Spreadsheet ID */}
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-100/90 text-amber-900 border border-amber-300 font-mono shadow-xs">
                  Spreadsheet: {shortSheetId}
                </span>
              </div>

              {/* Huge Title */}
              <div>
                <h1 className="text-3xl sm:text-4xl md:text-[42px] font-black tracking-tight text-slate-900 leading-none">
                  SI–IPASN <span className="text-[#006640]">Gunungkidul</span>
                </h1>
                <p className="mt-1.5 text-sm sm:text-base font-bold text-slate-700 flex items-center gap-1.5">
                  Sistem Informasi Indeks Profesionalitas ASN
                  <span className="w-2 h-2 rounded-full bg-orange-500 inline-block"></span>
                </p>
              </div>
            </div>
          </div>

          {/* Right Action: Glowing 3D Dashboard Button */}
          <div className="self-start lg:self-center shrink-0">
            <button
              onClick={onGoToDashboard}
              className="group relative flex items-center space-x-3.5 px-7 py-4 rounded-2xl bg-gradient-to-r from-orange-500 via-amber-600 to-[#006640] hover:from-orange-600 hover:via-emerald-700 hover:to-[#005032] text-white font-extrabold text-sm sm:text-base shadow-xl shadow-emerald-950/20 ring-2 ring-white/60 transition-all duration-300 transform hover:-translate-y-0.5 hover:shadow-2xl active:translate-y-0 cursor-pointer"
            >
              <div className="p-2 rounded-xl bg-white/20 backdrop-blur-md">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <div className="text-left leading-tight">
                <span className="block text-white text-base font-black tracking-wide">
                  Dashboard
                </span>
                <span className="block text-amber-200 text-xs font-bold tracking-widest uppercase">
                  3D WebGL
                </span>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Guided 3-Stage Progress Cards (Interactive Stepper) */}
      <div className="rounded-[24px] border border-white/80 bg-white/70 p-3 sm:p-4 shadow-lg shadow-emerald-950/5 backdrop-blur-md">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* TAHAP 1 */}
          <button
            type="button"
            onClick={() => onSelectStep(1)}
            className={`flex items-center justify-between p-3.5 sm:p-4 rounded-2xl transition-all cursor-pointer text-left ${
              currentStep === 1
                ? 'bg-white border-2 border-emerald-500 shadow-md ring-2 ring-emerald-500/10'
                : 'bg-white/60 border border-slate-200 hover:bg-white hover:border-slate-300'
            }`}
          >
            <div className="flex items-center space-x-3.5">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-base shadow-xs ${
                  currentStep === 1
                    ? 'bg-[#006640] text-white'
                    : 'bg-slate-100 text-slate-700'
                }`}
              >
                1
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800">
                    TAHAP 1
                  </span>
                  {currentStep === 1 && (
                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800">
                      Aktif
                    </span>
                  )}
                </div>
                <div className="text-sm font-extrabold text-slate-900">
                  Pencarian NIP
                </div>
                <div className="text-[11px] text-slate-500 font-medium">
                  Verifikasi 18 digit
                </div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-emerald-600" />
          </button>

          {/* TAHAP 2 */}
          <button
            type="button"
            onClick={() => {
              if (hasSearchedASN) onSelectStep(2);
              else onSelectStep(1);
            }}
            className={`flex items-center justify-between p-3.5 sm:p-4 rounded-2xl transition-all cursor-pointer text-left ${
              currentStep === 2
                ? 'bg-white border-2 border-emerald-500 shadow-md ring-2 ring-emerald-500/10'
                : 'bg-white/60 border border-slate-200 hover:bg-white hover:border-slate-300'
            }`}
          >
            <div className="flex items-center space-x-3.5">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-base shadow-xs ${
                  currentStep === 2
                    ? 'bg-[#006640] text-white'
                    : 'bg-slate-100 text-slate-700'
                }`}
              >
                2
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                    TAHAP 2
                  </span>
                  {currentStep === 2 && (
                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800">
                      Aktif
                    </span>
                  )}
                </div>
                <div className="text-sm font-extrabold text-slate-900">
                  Profil & Komponen
                </div>
                <div className="text-[11px] text-slate-500 font-medium">
                  Input 4 dimensi IP
                </div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-emerald-600" />
          </button>

          {/* TAHAP 3 */}
          <button
            type="button"
            onClick={onGoToDashboard}
            className={`flex items-center justify-between p-3.5 sm:p-4 rounded-2xl transition-all cursor-pointer text-left ${
              currentStep === 3
                ? 'bg-white border-2 border-emerald-500 shadow-md ring-2 ring-emerald-500/10'
                : 'bg-emerald-50/50 border border-emerald-300 hover:bg-emerald-50 hover:border-emerald-400'
            }`}
          >
            <div className="flex items-center space-x-3.5">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-base bg-[#006640] text-amber-200 shadow-xs">
                3
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-900">
                    TAHAP 3
                  </span>
                  <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    Aktif
                  </span>
                </div>
                <div className="text-sm font-extrabold text-slate-900">
                  Dashboard 3D
                </div>
                <div className="text-[11px] text-slate-500 font-medium">
                  Infografis WebGL
                </div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-emerald-600" />
          </button>
        </div>
      </div>
    </div>
  );
};
