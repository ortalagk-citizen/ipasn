import React, { useEffect, useRef, useState } from 'react';
import * as echarts from 'echarts';
import 'echarts-liquidfill';
import { ASNRecord } from '../types';
import { 
  BarChart3, 
  Sparkles, 
  Award, 
  Users, 
  CheckCircle2, 
  TrendingUp, 
  ChevronDown,
  UserCheck,
  UserX,
  FileEdit,
  ArrowRight,
  ShieldCheck,
  Zap,
  Info
} from 'lucide-react';

interface Menu2DashboardProps {
  asnList: ASNRecord[];
  selectedNip: string;
  onSelectNip: (nip: string) => void;
  onNavigateToInput: (nip: string) => void;
}

export const Menu2Dashboard: React.FC<Menu2DashboardProps> = ({
  asnList,
  selectedNip,
  onSelectNip,
  onNavigateToInput,
}) => {
  const filledList = asnList.filter((a) => a.status === 'Sudah');
  
  // Find current selected ASN
  const selectedASN = asnList.find((a) => a.nip === selectedNip);
  // An ASN is considered "existing/filled" ONLY if they exist and have status 'Sudah' and totalIP > 0
  const isFilledASN = selectedASN && selectedASN.status === 'Sudah' && selectedASN.totalIP > 0;
  
  // Fallback: if no ASN explicitly selected, pick first filled if any, or null
  const currentASN = isFilledASN 
    ? selectedASN 
    : (filledList.length > 0 ? filledList[0] : (selectedASN || null));

  const hasActiveFilledData = currentASN && currentASN.status === 'Sudah' && currentASN.totalIP > 0;

  const liquidRef = useRef<HTMLDivElement | null>(null);
  const polarRef = useRef<HTMLDivElement | null>(null);
  const barUnitRef = useRef<HTMLDivElement | null>(null);

  // Macro Statistics
  const totalPegawai = asnList.length;
  const sudahMengisi = filledList.length;
  const belumMengisi = Math.max(0, totalPegawai - sudahMengisi);
  const persentasePengisian = totalPegawai > 0 ? Math.round((sudahMengisi / totalPegawai) * 100) : 0;
  
  const rataRataKeseluruhan =
    sudahMengisi > 0
      ? (filledList.reduce((acc, curr) => acc + curr.totalIP, 0) / sudahMengisi).toFixed(1)
      : '0.0';

  const skorTertinggi =
    sudahMengisi > 0 ? Math.max(...filledList.map((a) => a.totalIP)) : 0;

  // Aggregate IP per Unit Kerja for Graphic 3
  const unitKerjaMap: { [key: string]: { total: number; sumIP: number; countIP: number } } = {};
  asnList.forEach((asn) => {
    if (!unitKerjaMap[asn.unitKerja]) {
      unitKerjaMap[asn.unitKerja] = { total: 0, sumIP: 0, countIP: 0 };
    }
    unitKerjaMap[asn.unitKerja].total += 1;
    if (asn.status === 'Sudah' && asn.totalIP > 0) {
      unitKerjaMap[asn.unitKerja].sumIP += asn.totalIP;
      unitKerjaMap[asn.unitKerja].countIP += 1;
    }
  });

  const unitLabels = Object.keys(unitKerjaMap);
  const unitScores = unitLabels.map((u) => {
    const item = unitKerjaMap[u];
    return item.countIP > 0 ? Number((item.sumIP / item.countIP).toFixed(1)) : 0;
  });

  // Chart 1: Liquid Fill Gauge
  useEffect(() => {
    if (!liquidRef.current) return;
    const chart = echarts.init(liquidRef.current);

    const score = hasActiveFilledData ? currentASN.totalIP : 0;
    const normalized = Math.min(1, Math.max(0, score / 100));

    // Choose color scheme based on score
    const waveColor1 = score >= 85 ? '#006640' : score >= 70 ? '#0284c7' : score > 0 ? '#d97706' : '#94a3b8';
    const waveColor2 = score >= 85 ? '#059669' : score >= 70 ? '#38bdf8' : score > 0 ? '#f59e0b' : '#cbd5e1';
    const waveColor3 = score > 0 ? '#D4AF37' : '#e2e8f0';

    const option: any = {
      series: [
        {
          type: 'liquidFill',
          data: score > 0 ? [normalized, normalized * 0.95, normalized * 0.88] : [0.08, 0.05],
          radius: '86%',
          center: ['50%', '50%'],
          color: [waveColor1, waveColor2, waveColor3],
          amplitude: score > 0 ? 8 : 4,
          waveLength: '80%',
          outline: {
            show: true,
            borderDistance: 5,
            itemStyle: {
              borderColor: score > 0 ? '#D4AF37' : '#cbd5e1',
              borderWidth: 3,
              shadowBlur: score > 0 ? 16 : 4,
              shadowColor: score > 0 ? 'rgba(212, 175, 55, 0.45)' : 'rgba(0,0,0,0.05)',
            },
          },
          backgroundStyle: {
            color: 'rgba(255, 255, 255, 0.95)',
          },
          label: {
            show: true,
            formatter: () => {
              if (score > 0) {
                return `{score|${score}}\n{sub|Skor IP ASN}`;
              }
              return `{score|0}\n{sub|Belum Ada Data}`;
            },
            rich: {
              score: {
                fontSize: 42,
                fontWeight: '900',
                color: score > 0 ? '#004d30' : '#64748b',
                fontFamily: 'sans-serif',
              },
              sub: {
                fontSize: 12,
                fontWeight: '600',
                color: '#64748b',
                padding: [4, 0, 0, 0],
              },
            },
          },
        },
      ],
    };

    chart.setOption(option);

    const handleResize = () => chart.resize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.dispose();
    };
  }, [currentASN, hasActiveFilledData]);

  // Chart 2: Radial Polar Bar Chart (Cincin Progres Melingkar)
  useEffect(() => {
    if (!polarRef.current) return;
    const chart = echarts.init(polarRef.current);

    const kualifikasiPct = hasActiveFilledData ? Math.round((currentASN.kualifikasi / 25) * 100) : 0;
    const kompetensiPct = hasActiveFilledData ? Math.round((currentASN.kompetensi / 40) * 100) : 0;
    const kinerjaPct = hasActiveFilledData ? Math.round((currentASN.kinerja / 30) * 100) : 0;
    const disiplinPct = hasActiveFilledData ? Math.round((currentASN.disiplin / 5) * 100) : 0;

    const option: echarts.EChartsOption = {
      tooltip: {
        trigger: 'item',
        formatter: (params: any) => {
          return `<div style="font-size:12px; font-weight:bold; padding:2px;">
            ${params.name}: ${params.value}%
          </div>`;
        },
      },
      polar: {
        radius: ['20%', '82%'],
      },
      angleAxis: {
        max: 100,
        startAngle: 90,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { show: false },
        splitLine: { show: false },
      },
      radiusAxis: {
        type: 'category',
        data: [
          hasActiveFilledData ? `Disiplin (${currentASN.disiplin}/5)` : 'Disiplin (0/5)',
          hasActiveFilledData ? `Kinerja (${currentASN.kinerja}/30)` : 'Kinerja (0/30)',
          hasActiveFilledData ? `Kompetensi (${currentASN.kompetensi}/40)` : 'Kompetensi (0/40)',
          hasActiveFilledData ? `Kualifikasi (${currentASN.kualifikasi}/25)` : 'Kualifikasi (0/25)',
        ],
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: {
          color: '#1e293b',
          fontWeight: 600,
          fontSize: 11,
          margin: 8,
        },
      },
      series: [
        {
          type: 'bar',
          coordinateSystem: 'polar',
          data: [
            {
              value: disiplinPct,
              name: 'Disiplin',
              itemStyle: {
                color: new echarts.graphic.LinearGradient(0, 0, 1, 1, [
                  { offset: 0, color: '#10b981' },
                  { offset: 1, color: '#047857' },
                ]),
              },
            },
            {
              value: kinerjaPct,
              name: 'Kinerja',
              itemStyle: {
                color: new echarts.graphic.LinearGradient(0, 0, 1, 1, [
                  { offset: 0, color: '#059669' },
                  { offset: 1, color: '#006640' },
                ]),
              },
            },
            {
              value: kompetensiPct,
              name: 'Kompetensi',
              itemStyle: {
                color: new echarts.graphic.LinearGradient(0, 0, 1, 1, [
                  { offset: 0, color: '#f59e0b' },
                  { offset: 1, color: '#D4AF37' },
                ]),
              },
            },
            {
              value: kualifikasiPct,
              name: 'Kualifikasi',
              itemStyle: {
                color: new echarts.graphic.LinearGradient(0, 0, 1, 1, [
                  { offset: 0, color: '#D4AF37' },
                  { offset: 1, color: '#b45309' },
                ]),
              },
            },
          ],
          roundCap: true,
          barWidth: 12,
          showBackground: true,
          backgroundStyle: {
            color: 'rgba(226, 232, 240, 0.45)',
          },
        },
      ],
    };

    chart.setOption(option);

    const handleResize = () => chart.resize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.dispose();
    };
  }, [currentASN, hasActiveFilledData]);

  // Chart 3: Glowing Gradient Bar Chart
  useEffect(() => {
    if (!barUnitRef.current) return;
    const chart = echarts.init(barUnitRef.current);

    const option: echarts.EChartsOption = {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params: any) => {
          const item = params[0];
          return `<div style="padding:4px 6px;">
            <div style="font-weight:bold; color:#0f172a; margin-bottom:2px;">${item.name}</div>
            <div style="color:#006640; font-weight:700;">Rata-rata IP: ${item.value} / 100</div>
          </div>`;
        },
      },
      grid: {
        left: '2%',
        right: '2%',
        bottom: '22%',
        top: '12%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: unitLabels,
        axisLabel: {
          rotate: 35,
          interval: 0,
          color: '#334155',
          fontSize: 10,
          fontWeight: 500,
          margin: 12,
        },
        axisLine: { lineStyle: { color: '#cbd5e1' } },
        axisTick: { show: false },
      },
      yAxis: {
        type: 'value',
        min: 0,
        max: 100,
        axisLabel: { color: '#64748b', fontSize: 11 },
        splitLine: { lineStyle: { type: 'dashed', color: '#e2e8f0' } },
      },
      series: [
        {
          name: 'Rata-rata IP ASN',
          type: 'bar',
          barWidth: '42%',
          data: unitScores,
          itemStyle: {
            borderRadius: [8, 8, 0, 0],
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#D4AF37' },
              { offset: 0.5, color: '#059669' },
              { offset: 1, color: '#006640' },
            ]),
            shadowColor: 'rgba(212, 175, 55, 0.4)',
            shadowBlur: 8,
          },
        },
      ],
    };

    chart.setOption(option);

    const handleResize = () => chart.resize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.dispose();
    };
  }, [unitLabels, unitScores]);

  const getKategoriBadge = (score: number) => {
    if (score >= 91) return { label: 'Sangat Tinggi', color: 'bg-emerald-700 text-amber-200 border-amber-300' };
    if (score >= 81) return { label: 'Tinggi', color: 'bg-emerald-600 text-white border-emerald-400' };
    if (score >= 71) return { label: 'Sedang', color: 'bg-amber-500 text-white border-amber-300' };
    if (score >= 61) return { label: 'Rendah', color: 'bg-orange-500 text-white border-orange-300' };
    if (score > 0) return { label: 'Sangat Rendah', color: 'bg-rose-500 text-white border-rose-300' };
    return { label: 'Belum Ada Nilai', color: 'bg-slate-200 text-slate-700 border-slate-300' };
  };

  const currentKategori = hasActiveFilledData ? getKategoriBadge(currentASN.totalIP) : null;

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12 animate-in fade-in duration-300">
      {/* ============================================================== */}
      {/* TOP HEADER: SELEKSI PEGAWAI & KONTROL (REDESIGNED LUXURY)      */}
      {/* ============================================================== */}
      <div className="relative overflow-hidden rounded-[26px] border border-white/90 bg-gradient-to-r from-emerald-50/90 via-white/80 to-amber-50/80 p-5 sm:p-6 shadow-xl shadow-emerald-950/5 backdrop-blur-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#006640] to-[#024B30] text-amber-300 flex items-center justify-center shadow-md shadow-emerald-900/20 ring-2 ring-amber-300/40">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-slate-900 tracking-tight">
                  Dashboard Visualisasi 3D (ECharts)
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                  Infografis WebGL
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Eksplorasi visual interaktif penilaian IP ASN Kankemenag Kab. Gunungkidul
              </p>
            </div>
          </div>

          {/* ASN Picker & Action */}
          <div className="flex flex-wrap items-center gap-2.5">
            <label htmlFor="asn-picker-db" className="text-xs font-bold text-slate-700 whitespace-nowrap">
              Pilih Pegawai:
            </label>
            <div className="relative min-w-[240px] sm:min-w-[280px]">
              <select
                id="asn-picker-db"
                value={currentASN?.nip || ''}
                onChange={(e) => onSelectNip(e.target.value)}
                className="w-full glass-input px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-800 appearance-none pr-8 cursor-pointer focus:outline-hidden border-emerald-600/30 shadow-xs"
              >
                <option value="" disabled>-- Pilih Pegawai --</option>
                {filledList.length > 0 && (
                  <optgroup label="✓ Pegawai Sudah Mengisi">
                    {filledList.map((asn) => (
                      <option key={asn.nip} value={asn.nip}>
                        ✓ {asn.nama} ({asn.totalIP} Poin)
                      </option>
                    ))}
                  </optgroup>
                )}
                <optgroup label="⏳ Pegawai Terdaftar Lainnya">
                  {asnList.filter((a) => a.status === 'Belum').slice(0, 30).map((asn) => (
                    <option key={asn.nip} value={asn.nip}>
                      ⏳ {asn.nama} (Belum Mengisi)
                    </option>
                  ))}
                </optgroup>
              </select>
              <ChevronDown className="w-4 h-4 text-emerald-700 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {hasActiveFilledData && currentASN && (
              <button
                onClick={() => onNavigateToInput(currentASN.nip)}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-[#006640] hover:from-emerald-700 hover:to-[#005032] text-white text-xs font-bold shadow-md shadow-emerald-950/10 transition-all cursor-pointer"
              >
                Ubah Data
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 4 KPI CARDS: BAGIAN 2 (REDESIGNED ULTRA-PREMIUM APPLE/FINTECH)  */}
      {/* ============================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Rata-rata IP Kankemenag */}
        <div className="relative overflow-hidden rounded-[24px] border border-emerald-900/10 bg-gradient-to-br from-emerald-900 via-[#006640] to-[#024B30] p-5 text-white shadow-xl shadow-emerald-950/15">
          <div className="absolute -right-6 -bottom-6 w-28 h-28 bg-[#D4AF37]/20 rounded-full blur-2xl pointer-events-none"></div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-200">
              Rata-rata IP Kankemenag
            </span>
            <div className="w-9 h-9 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-amber-300">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>

          <div className="mt-4 flex items-baseline space-x-2.5">
            <span className="text-3xl sm:text-4xl font-black font-sans text-white tracking-tight">
              {rataRataKeseluruhan}
            </span>
            <span className="text-xs text-emerald-200/80 font-medium font-mono">/ 100</span>
          </div>

          <div className="mt-2.5 flex items-center gap-2">
            {sudahMengisi > 0 ? (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-amber-400 text-emerald-950 shadow-xs">
                Kategori {Number(rataRataKeseluruhan) >= 81 ? 'Tinggi' : 'Sedang'}
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-white/20 text-emerald-100 border border-white/20">
                Menunggu Isian Data
              </span>
            )}
            <span className="text-[11px] text-emerald-200/70">Standar BKN RI</span>
          </div>
        </div>

        {/* KPI 2: Total ASN Terdaftar */}
        <div className="relative overflow-hidden rounded-[24px] border border-white/90 bg-gradient-to-br from-white/90 via-slate-50/80 to-emerald-50/60 p-5 shadow-lg shadow-emerald-950/5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Total ASN Terdaftar
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-100/90 border border-emerald-300/40 flex items-center justify-center text-[#006640]">
              <Users className="w-4 h-4" />
            </div>
          </div>

          <div className="mt-4 flex items-baseline space-x-2">
            <span className="text-3xl sm:text-4xl font-black font-sans text-slate-900 tracking-tight">
              {totalPegawai.toLocaleString('id-ID')}
            </span>
            <span className="text-xs font-semibold text-slate-500">Pegawai</span>
          </div>

          <div className="mt-2.5 flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-md bg-emerald-100/80 text-emerald-900 font-bold text-[10px]">
              Tabel DATA_ASN
            </span>
            <span className="text-[11px] text-slate-500">Kantor & Seluruh Satker</span>
          </div>
        </div>

        {/* KPI 3: Partisipasi Pengisian */}
        <div className="relative overflow-hidden rounded-[24px] border border-white/90 bg-gradient-to-br from-white/90 via-amber-50/40 to-emerald-50/50 p-5 shadow-lg shadow-emerald-950/5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Partisipasi Pengisian
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-100/90 border border-amber-300/40 flex items-center justify-center text-amber-700">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>

          <div className="mt-4 flex items-baseline space-x-2">
            <span className="text-3xl sm:text-4xl font-black font-sans text-emerald-800 tracking-tight">
              {persentasePengisian}%
            </span>
            <span className="text-xs font-bold text-slate-600">
              ({sudahMengisi} dari {totalPegawai})
            </span>
          </div>

          {/* Mini Progress Bar with Gradient */}
          <div className="w-full bg-slate-200/80 h-2 rounded-full mt-2.5 overflow-hidden">
            <div
              className="bg-gradient-to-r from-amber-400 via-emerald-500 to-[#006640] h-full rounded-full transition-all duration-700"
              style={{ width: `${Math.max(2, persentasePengisian)}%` }}
            ></div>
          </div>
        </div>

        {/* KPI 4: Skor Tertinggi */}
        <div className="relative overflow-hidden rounded-[24px] border border-amber-200/80 bg-gradient-to-br from-amber-50/80 via-white/90 to-amber-100/50 p-5 shadow-lg shadow-amber-950/5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-900">
              Skor IP Tertinggi
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-200/80 border border-amber-300 flex items-center justify-center text-amber-900">
              <Award className="w-4 h-4" />
            </div>
          </div>

          <div className="mt-4 flex items-baseline space-x-2">
            <span className="text-3xl sm:text-4xl font-black font-sans text-amber-700 tracking-tight">
              {skorTertinggi}
            </span>
            <span className="text-xs font-semibold text-slate-500">Poin</span>
          </div>

          <div className="mt-2.5 flex items-center gap-1.5 text-[11px] text-amber-900/80 font-medium">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>Capaian Maksimal Kankemenag GK</span>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 2 CHARTS: LIQUID FILL GAUGE & RADIAL POLAR BAR CHART            */}
      {/* ============================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* GRAFIK 1: Liquid Fill Gauge (5 Cols) */}
        <div className="lg:col-span-5 glass-card rounded-[28px] p-6 sm:p-7 shadow-xl border border-white/80 flex flex-col justify-between relative">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#006640]"></span>
                <h3 className="font-extrabold text-slate-900 text-sm">
                  Grafik 1: Skor Personal IP ASN (Liquid Gauge)
                </h3>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#D4AF37] bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                3D Liquid Fill
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Indikator gelombang dinamis tingkat profesionalitas pegawai
            </p>
          </div>

          {/* Liquid Fill Canvas */}
          <div className="relative my-3 flex items-center justify-center">
            <div
              ref={liquidRef}
              style={{ width: '280px', height: '280px' }}
              className="mx-auto"
            ></div>
          </div>

          {/* ============================================================== */}
          {/* USER INSTRUCTION: "pada bagian nomor 1 jangan tampilkan nama jika belum ada" */}
          {/* ============================================================== */}
          {hasActiveFilledData && currentASN ? (
            /* HANYA TAMPILKAN KARTU PROFIL JIKA PEGAWAI SUDAH MENGISI / ADA DATA */
            <div className="p-4 bg-gradient-to-r from-emerald-50/80 via-white to-amber-50/80 rounded-2xl border border-emerald-900/10 flex items-center justify-between shadow-xs">
              <div>
                <div className="text-sm font-black text-slate-900">{currentASN.nama}</div>
                <div className="text-xs text-slate-500 font-mono">NIP: {currentASN.nip}</div>
                <div className="text-xs text-emerald-800 font-bold mt-0.5">{currentASN.unitKerja}</div>
              </div>
              {currentKategori && (
                <div className="text-right">
                  <span
                    className={`inline-block px-3 py-1 text-xs font-black rounded-full border shadow-xs ${currentKategori.color}`}
                  >
                    {currentKategori.label}
                  </span>
                </div>
              )}
            </div>
          ) : (
            /* JIKA BELUM ADA DATA PEGAWAI TERISI: JANGAN TAMPILKAN NAMA / NIP ORANG LAIN */
            <div className="p-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50/80 text-center space-y-2">
              <div className="inline-flex p-2 rounded-xl bg-amber-100 text-amber-800 mx-auto">
                <Info className="w-4 h-4 text-amber-700" />
              </div>
              <div>
                <h4 className="text-xs font-extrabold text-slate-800">
                  Belum Ada Pegawai Terpilih
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5 max-w-xs mx-auto">
                  Pilih pegawai yang telah dinilai dari menu pilihan di atas, atau masukkan nilai baru melalui Menu 1.
                </p>
              </div>
              <button
                onClick={() => onNavigateToInput('')}
                className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#006640] to-[#024B30] text-white text-xs font-bold hover:shadow-md transition-all cursor-pointer"
              >
                <span>Input Nilai Pegawai Sekarang</span>
                <ArrowRight className="w-3.5 h-3.5 text-amber-300" />
              </button>
            </div>
          )}
        </div>

        {/* GRAFIK 2: Radial Polar Bar Chart (7 Cols) */}
        <div className="lg:col-span-7 glass-card rounded-[28px] p-6 sm:p-7 shadow-xl border border-white/80 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#D4AF37]"></span>
                <h3 className="font-extrabold text-slate-900 text-sm">
                  Grafik 2: Rincian 4 Komponen (Radial Polar Bar)
                </h3>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                Cincin Progres
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Persentase pencapaian maksimal 4 dimensi penilaian (Kualifikasi, Kompetensi, Kinerja, Disiplin)
            </p>
          </div>

          {/* Polar Chart Canvas */}
          <div className="relative my-2">
            <div
              ref={polarRef}
              style={{ width: '100%', height: '280px' }}
            ></div>
          </div>

          {/* 4 Components Breakdown Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 border-t border-slate-200/60">
            <div className="p-2.5 rounded-xl bg-amber-50/80 border border-amber-200 text-center">
              <span className="text-[10px] font-bold uppercase text-amber-900 block">Kualifikasi</span>
              <span className="text-base font-extrabold text-[#D4AF37] font-mono">
                {hasActiveFilledData && currentASN ? currentASN.kualifikasi : 0}
              </span>
              <span className="text-[10px] text-slate-500 font-mono"> / 25</span>
            </div>
            <div className="p-2.5 rounded-xl bg-amber-50/80 border border-amber-200 text-center">
              <span className="text-[10px] font-bold uppercase text-amber-900 block">Kompetensi</span>
              <span className="text-base font-extrabold text-[#D4AF37] font-mono">
                {hasActiveFilledData && currentASN ? currentASN.kompetensi : 0}
              </span>
              <span className="text-[10px] text-slate-500 font-mono"> / 40</span>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-50/80 border border-emerald-200 text-center">
              <span className="text-[10px] font-bold uppercase text-emerald-900 block">Kinerja</span>
              <span className="text-base font-extrabold text-[#006640] font-mono">
                {hasActiveFilledData && currentASN ? currentASN.kinerja : 0}
              </span>
              <span className="text-[10px] text-slate-500 font-mono"> / 30</span>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-50/80 border border-emerald-200 text-center">
              <span className="text-[10px] font-bold uppercase text-emerald-900 block">Disiplin</span>
              <span className="text-base font-extrabold text-[#006640] font-mono">
                {hasActiveFilledData && currentASN ? currentASN.disiplin : 0}
              </span>
              <span className="text-[10px] text-slate-500 font-mono"> / 5</span>
            </div>
          </div>
        </div>
      </div>

      {/* GRAFIK 3: Glowing Gradient Bar Chart Rata-rata IP per Unit Kerja */}
      <div className="glass-card rounded-[28px] p-6 sm:p-7 shadow-xl border border-white/80">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-amber-400 to-emerald-600"></span>
              <h3 className="font-extrabold text-slate-900 text-base">
                Grafik 3: Rata-rata Nilai IP per Unit Kerja (Glowing Gradient Bar)
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Perbandingan performa indeks profesionalitas antar satuan kerja Kankemenag Kab. Gunungkidul
            </p>
          </div>
          <div className="flex items-center space-x-2 text-xs">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-900 border border-amber-300 font-bold">
              <span className="w-2 h-2 rounded-full bg-[#D4AF37]"></span>
              Gradasi Emas ke Hijau
            </span>
          </div>
        </div>

        {/* Bar chart container */}
        <div className="w-full">
          <div
            ref={barUnitRef}
            style={{ width: '100%', height: '380px' }}
          ></div>
        </div>
      </div>
    </div>
  );
};
