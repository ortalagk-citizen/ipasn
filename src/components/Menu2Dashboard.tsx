import React, { useEffect, useRef, useState, useMemo } from 'react';
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
  Info,
  ListOrdered,
  LayoutGrid,
  Layers,
  Building2,
  Filter,
  SlidersHorizontal
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

  // View modes and filters for Graphic 3 (Alternative visualizations for many units)
  const [chartViewMode, setChartViewMode] = useState<'leaderboard' | 'treemap' | 'cluster'>('leaderboard');
  const [limitMode, setLimitMode] = useState<'top10' | 'bottom10' | 'all'>('top10');
  const [clusterFilter, setClusterFilter] = useState<'all' | 'kantor' | 'kua' | 'madrasah'>('all');

  // Macro Statistics
  const totalPegawai = asnList.length;
  const sudahMengisi = filledList.length;
  const persentasePengisian = totalPegawai > 0 ? Math.round((sudahMengisi / totalPegawai) * 100) : 0;
  
  const rataRataKeseluruhan =
    sudahMengisi > 0
      ? (filledList.reduce((acc, curr) => acc + curr.totalIP, 0) / sudahMengisi).toFixed(1)
      : '0.0';

  const skorTertinggi =
    sudahMengisi > 0 ? Math.max(...filledList.map((a) => a.totalIP)) : 0;

  // Helper untuk menentukan kluster satuan kerja di Kankemenag Kab. Gunungkidul
  const getClusterType = (name: string): 'kantor' | 'kua' | 'madrasah' => {
    const lower = name.toLowerCase();
    if (lower.includes('kua') || lower.includes('kecamatan')) return 'kua';
    if (lower.includes('man') || lower.includes('mts') || lower.includes('min') || lower.includes('madrasah') || lower.includes('ra ')) return 'madrasah';
    return 'kantor';
  };

  // Aggregate IP per Unit Kerja
  const unitStats = useMemo(() => {
    const map: { [key: string]: { total: number; sumIP: number; countIP: number } } = {};
    asnList.forEach((asn) => {
      if (!map[asn.unitKerja]) {
        map[asn.unitKerja] = { total: 0, sumIP: 0, countIP: 0 };
      }
      map[asn.unitKerja].total += 1;
      if (asn.status === 'Sudah' && asn.totalIP > 0) {
        map[asn.unitKerja].sumIP += asn.totalIP;
        map[asn.unitKerja].countIP += 1;
      }
    });

    return Object.keys(map).map((name) => {
      const item = map[name];
      const avg = item.countIP > 0 ? Number((item.sumIP / item.countIP).toFixed(1)) : 0;
      const pct = item.total > 0 ? Math.round((item.countIP / item.total) * 100) : 0;
      return {
        unitKerja: name,
        total: item.total,
        countIP: item.countIP,
        sumIP: item.sumIP,
        avgIP: avg,
        persentase: pct,
        cluster: getClusterType(name),
      };
    });
  }, [asnList]);

  // Aggregate by 3 main clusters for Mode 3
  const clusterStats = useMemo(() => {
    const groups: { [key in 'kantor' | 'kua' | 'madrasah']: { title: string; total: number; countIP: number; sumIP: number } } = {
      kantor: { title: 'Kantor Induk (Subbag TU & Seksi)', total: 0, countIP: 0, sumIP: 0 },
      kua: { title: 'KUA Kecamatan (18 Satker)', total: 0, countIP: 0, sumIP: 0 },
      madrasah: { title: 'Madrasah Negeri & Swasta', total: 0, countIP: 0, sumIP: 0 },
    };

    unitStats.forEach((u) => {
      groups[u.cluster].total += u.total;
      groups[u.cluster].countIP += u.countIP;
      groups[u.cluster].sumIP += u.sumIP;
    });

    return Object.entries(groups).map(([key, g]) => ({
      key,
      title: g.title,
      total: g.total,
      countIP: g.countIP,
      avgIP: g.countIP > 0 ? Number((g.sumIP / g.countIP).toFixed(1)) : 0,
      persentase: g.total > 0 ? Math.round((g.countIP / g.total) * 100) : 0,
    }));
  }, [unitStats]);

  // Filtered and Sorted for Leaderboard Bar Chart
  const filteredUnitStats = useMemo(() => {
    let result = [...unitStats];

    if (clusterFilter !== 'all') {
      result = result.filter((u) => u.cluster === clusterFilter);
    }

    // Sort descending by avgIP, then by persentase
    result.sort((a, b) => b.avgIP - a.avgIP || b.persentase - a.persentase);

    if (limitMode === 'top10') {
      return result.slice(0, 10);
    }
    if (limitMode === 'bottom10') {
      return [...result].reverse().slice(0, 10).reverse();
    }
    return result;
  }, [unitStats, clusterFilter, limitMode]);

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
                lineHeight: 22,
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

  // Chart 3: REVOLUTIONARY MULTI-VIEW VISUALIZATION (Solusi Elegan & Menarik untuk Banyak Satuan Kerja)
  useEffect(() => {
    if (!barUnitRef.current) return;
    const chart = echarts.init(barUnitRef.current);

    let option: echarts.EChartsOption = {};

    if (chartViewMode === 'leaderboard') {
      // MODE 1: HORIZONTAL LEADERBOARD BAR CHART
      // Nama satker di sumbu Y horizontal sehingga TERBACA 100% TANPA BERTUMPUKAN!
      const yLabels = filteredUnitStats.map((u, idx) => {
        let medal = '';
        if (limitMode === 'top10') {
          if (idx === 0) medal = '🥇 ';
          else if (idx === 1) medal = '🥈 ';
          else if (idx === 2) medal = '🥉 ';
        }
        const cleanName = u.unitKerja.length > 25 ? `${u.unitKerja.slice(0, 24)}…` : u.unitKerja;
        return `${medal}${cleanName}`;
      });

      const scores = filteredUnitStats.map((u) => u.avgIP);

      option = {
        tooltip: {
          trigger: 'axis',
          axisPointer: { type: 'shadow' },
          formatter: (params: any) => {
            const item = params[0];
            const stat = filteredUnitStats[item.dataIndex];
            if (!stat) return '';
            return `<div style="padding:6px 8px; font-family:sans-serif;">
              <div style="font-weight:800; font-size:13px; color:#0f172a; margin-bottom:4px;">${stat.unitKerja}</div>
              <div style="color:#006640; font-weight:800; font-size:13px;">Rata-rata IP: ${stat.avgIP} / 100</div>
              <div style="color:#64748b; font-size:11px; margin-top:2px;">Partisipasi: ${stat.persentase}% (${stat.countIP} dari ${stat.total} ASN)</div>
            </div>`;
          },
        },
        grid: {
          left: '3%',
          right: '8%',
          bottom: limitMode === 'all' ? '12%' : '4%',
          top: '4%',
          containLabel: true,
        },
        xAxis: {
          type: 'value',
          min: 0,
          max: 100,
          axisLabel: { color: '#64748b', fontSize: 11 },
          splitLine: { lineStyle: { type: 'dashed', color: '#e2e8f0' } },
        },
        yAxis: {
          type: 'category',
          inverse: true, // Urutan 1 teratas
          data: yLabels,
          axisLabel: {
            color: '#1e293b',
            fontSize: 11,
            fontWeight: 600,
            margin: 12,
          },
          axisLine: { lineStyle: { color: '#cbd5e1' } },
          axisTick: { show: false },
        },
        dataZoom:
          limitMode === 'all' && filteredUnitStats.length > 10
            ? [
                {
                  type: 'slider',
                  yAxisIndex: 0,
                  width: 14,
                  right: 8,
                  start: 0,
                  end: Math.min(100, Math.max(25, (12 / filteredUnitStats.length) * 100)),
                  borderColor: 'transparent',
                  fillerColor: 'rgba(0, 102, 64, 0.25)',
                  backgroundColor: 'rgba(241, 245, 249, 0.8)',
                  handleSize: 14,
                  handleStyle: { color: '#006640' },
                },
                {
                  type: 'inside',
                  yAxisIndex: 0,
                  zoomOnMouseWheel: true,
                  moveOnMouseMove: true,
                },
              ]
            : [],
        series: [
          {
            name: 'Rata-rata IP ASN',
            type: 'bar',
            barWidth: limitMode === 'all' ? 14 : 20,
            data: scores,
            itemStyle: {
              borderRadius: [0, 8, 8, 0],
              color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
                { offset: 0, color: '#D4AF37' },
                { offset: 0.6, color: '#059669' },
                { offset: 1, color: '#006640' },
              ]),
              shadowColor: 'rgba(0, 102, 64, 0.25)',
              shadowBlur: 6,
            },
            label: {
              show: true,
              position: 'right',
              formatter: (params: any) => `${params.value}`,
              color: '#006640',
              fontWeight: 800,
              fontSize: 11,
            },
          },
        ],
      };
    } else if (chartViewMode === 'treemap') {
      // MODE 2: LUXURY TREEMAP HEATMAP (Ukuran blok = total pegawai, Warna = Skor IP)
      const getColor = (score: number) => {
        if (score >= 90) return '#006640';
        if (score >= 80) return '#059669';
        if (score >= 70) return '#10b981';
        if (score >= 60) return '#d97706';
        if (score > 0) return '#ea580c';
        return '#94a3b8';
      };

      const treemapData = unitStats.map((u) => ({
        name: u.unitKerja,
        value: u.total,
        score: u.avgIP,
        sudah: u.countIP,
        persen: u.persentase,
        itemStyle: {
          color: getColor(u.avgIP),
          borderColor: '#ffffff',
          borderWidth: 2,
          borderRadius: 6,
        },
      }));

      option = {
        tooltip: {
          formatter: (info: any) => {
            const val = info.data;
            if (!val) return '';
            return `<div style="padding:6px 8px; font-family:sans-serif;">
              <div style="font-weight:800; font-size:13px; color:#0f172a; margin-bottom:4px;">${info.name}</div>
              <div style="color:#006640; font-weight:800; font-size:13px;">Rata-rata IP: ${val.score} / 100</div>
              <div style="color:#64748b; font-size:11px; margin-top:2px;">Total Pegawai: ${val.value} ASN (${val.sudah} sudah mengisi)</div>
              <div style="color:#0284c7; font-size:11px;">Tingkat Partisipasi: ${val.persen}%</div>
            </div>`;
          },
        },
        series: [
          {
            type: 'treemap',
            name: 'Satuan Kerja',
            data: treemapData,
            leafDepth: 1,
            roam: false,
            breadcrumb: { show: false },
            label: {
              show: true,
              formatter: (params: any) => {
                const name = params.name.length > 20 ? `${params.name.slice(0, 18)}…` : params.name;
                return `${name}\n${params.data.score} Poin (${params.value} ASN)`;
              },
              fontSize: 11,
              fontWeight: 700,
              color: '#ffffff',
            },
          },
        ],
      };
    } else if (chartViewMode === 'cluster') {
      // MODE 3: RINGKASAN KLUSTER SATUAN KERJA (Perbandingan Luas & Lapang)
      const names = clusterStats.map((c) => c.title);
      const scores = clusterStats.map((c) => c.avgIP);

      option = {
        tooltip: {
          trigger: 'axis',
          axisPointer: { type: 'shadow' },
          formatter: (params: any) => {
            const item = params[0];
            const stat = clusterStats[item.dataIndex];
            if (!stat) return '';
            return `<div style="padding:6px 8px; font-family:sans-serif;">
              <div style="font-weight:800; font-size:13px; color:#0f172a; margin-bottom:4px;">${stat.title}</div>
              <div style="color:#006640; font-weight:800; font-size:13px;">Rata-rata IP: ${stat.avgIP} / 100</div>
              <div style="color:#64748b; font-size:11px; margin-top:2px;">Total Pegawai: ${stat.total} ASN (${stat.countIP} sudah mengisi)</div>
              <div style="color:#0284c7; font-size:11px;">Partisipasi: ${stat.persentase}%</div>
            </div>`;
          },
        },
        grid: {
          left: '3%',
          right: '5%',
          bottom: '8%',
          top: '12%',
          containLabel: true,
        },
        xAxis: {
          type: 'category',
          data: names,
          axisLabel: {
            color: '#1e293b',
            fontSize: 12,
            fontWeight: 700,
            interval: 0,
            lineHeight: 16,
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
            name: 'Rata-rata IP Kluster',
            type: 'bar',
            barWidth: '40%',
            data: scores,
            itemStyle: {
              borderRadius: [12, 12, 0, 0],
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: '#D4AF37' },
                { offset: 0.5, color: '#059669' },
                { offset: 1, color: '#006640' },
              ]),
              shadowColor: 'rgba(212, 175, 55, 0.4)',
              shadowBlur: 10,
            },
            label: {
              show: true,
              position: 'top',
              formatter: '{c} Poin',
              fontWeight: 800,
              fontSize: 13,
              color: '#006640',
            },
          },
        ],
      };
    }

    chart.setOption(option, true);

    const handleResize = () => chart.resize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.dispose();
    };
  }, [chartViewMode, limitMode, clusterFilter, filteredUnitStats, unitStats, clusterStats]);

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
      {/* SELECTOR PEGAWAI HERO CARD                                     */}
      {/* ============================================================== */}
      <div className="glass-card rounded-[28px] p-6 sm:p-7 shadow-xl border border-white/80 bg-gradient-to-r from-emerald-50/70 via-white/80 to-amber-50/70">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-1.5">
            <div className="flex items-center space-x-2">
              <span className="p-1.5 rounded-lg bg-[#006640] text-amber-300">
                <BarChart3 className="w-4 h-4" />
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-900">
                Visual Analytics Engine • ECharts 3D
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Dashboard Visual IP ASN
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              Monitoring capaian Indeks Profesionalitas ASN & Satuan Kerja Kankemenag Kab. Gunungkidul
            </p>
          </div>

          {/* ASN Picker Dropdown */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            <div className="relative min-w-[280px]">
              <select
                value={currentASN?.nip || ''}
                onChange={(e) => onSelectNip(e.target.value)}
                className="w-full glass-input px-4 py-2.5 pr-10 rounded-xl text-xs sm:text-sm font-bold text-slate-900 appearance-none cursor-pointer focus:outline-hidden"
              >
                {!currentASN && (
                  <option value="">-- Pilih Pegawai untuk Melihat Skor --</option>
                )}
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
      {/* 4 KPI CARDS: ULTRA-PREMIUM APPLE/FINTECH                       */}
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
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* GRAFIK 1: Liquid Fill Gauge (5 Cols) */}
        <div className="lg:col-span-5 glass-card rounded-[28px] p-6 sm:p-7 shadow-xl border border-white/80 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#006640]"></span>
                <h3 className="font-extrabold text-slate-900 text-sm">
                  Grafik 1: Skor Personal IP ASN (Liquid Gauge)
                </h3>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-300">
                Fluid 3D Wave
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Visualisasi ketinggian gelombang cairan dinamis berdasarkan total skor indeks profesionalitas
            </p>
          </div>

          {/* Liquid Gauge Canvas */}
          <div className="relative my-2 flex items-center justify-center">
            <div
              ref={liquidRef}
              style={{ width: '100%', height: '280px' }}
            ></div>
          </div>

          {/* Active Employee Mini Card */}
          {hasActiveFilledData && currentASN ? (
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-50 to-amber-50 border border-emerald-900/10 flex items-center justify-between">
              <div className="space-y-0.5 truncate">
                <div className="flex items-center space-x-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-emerald-700" />
                  <span className="text-xs font-extrabold text-slate-900 truncate">
                    {currentASN.nama}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 font-mono">NIP: {currentASN.nip}</div>
                <div className="text-[11px] text-emerald-800 font-medium truncate">
                  {currentASN.unitKerja}
                </div>
              </div>
              {currentKategori && (
                <div className="text-right shrink-0">
                  <span
                    className={`inline-block px-2.5 py-1 rounded-xl text-[10px] font-extrabold uppercase border shadow-2xs ${currentKategori.color}`}
                  >
                    {currentKategori.label}
                  </span>
                </div>
              )}
            </div>
          ) : (
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

      {/* ============================================================== */}
      {/* GRAFIK 3: ALTERNATIF ELEGAN & MENARIK UNTUK BANYAK UNIT KERJA   */}
      {/* ============================================================== */}
      <div className="glass-card rounded-[28px] p-6 sm:p-7 shadow-xl border border-white/80 space-y-5">
        {/* Header with Title and Mode Switcher */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-3 border-b border-slate-200/60">
          <div>
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-amber-400 to-emerald-600"></span>
              <h3 className="font-extrabold text-slate-900 text-base">
                Grafik 3: Analisis Performa IP per Satuan Kerja
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Visualisasi komparatif yang rapi, elegan, dan mudah dibaca tanpa penumpukan label
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200 shrink-0 overflow-x-auto scrollbar-none">
            <button
              onClick={() => setChartViewMode('leaderboard')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                chartViewMode === 'leaderboard'
                  ? 'bg-gradient-to-r from-[#006640] to-emerald-700 text-white shadow-sm ring-1 ring-amber-300/40'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <ListOrdered className="w-3.5 h-3.5 text-amber-300" />
              <span>Peringkat Horizontal</span>
            </button>

            <button
              onClick={() => setChartViewMode('treemap')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                chartViewMode === 'treemap'
                  ? 'bg-gradient-to-r from-[#006640] to-emerald-700 text-white shadow-sm ring-1 ring-amber-300/40'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5 text-amber-300" />
              <span>Treemap Heatmap</span>
            </button>

            <button
              onClick={() => setChartViewMode('cluster')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                chartViewMode === 'cluster'
                  ? 'bg-gradient-to-r from-[#006640] to-emerald-700 text-white shadow-sm ring-1 ring-amber-300/40'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-amber-300" />
              <span>Per Kluster Satker</span>
            </button>
          </div>
        </div>

        {/* Filter Controls Bar (Khusus saat di mode Peringkat Horizontal) */}
        {chartViewMode === 'leaderboard' && (
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-slate-50/90 border border-slate-200/80 text-xs">
            {/* Limit selector */}
            <div className="flex items-center space-x-1.5">
              <span className="text-slate-500 font-semibold flex items-center gap-1">
                <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-700" />
                Tampilan:
              </span>
              <div className="inline-flex rounded-xl bg-white p-0.5 border border-slate-200">
                <button
                  onClick={() => setLimitMode('top10')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                    limitMode === 'top10'
                      ? 'bg-[#006640] text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Top 10 Terbaik
                </button>
                <button
                  onClick={() => setLimitMode('bottom10')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                    limitMode === 'bottom10'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  10 Perlu Pembinaan
                </button>
                <button
                  onClick={() => setLimitMode('all')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                    limitMode === 'all'
                      ? 'bg-[#006640] text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Semua ({unitStats.length} Unit)
                </button>
              </div>
            </div>

            {/* Kluster Satker Filter */}
            <div className="flex items-center space-x-2">
              <span className="text-slate-500 font-semibold flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-amber-600" />
                Kluster:
              </span>
              <select
                value={clusterFilter}
                onChange={(e: any) => setClusterFilter(e.target.value)}
                className="bg-white px-3 py-1 rounded-xl border border-slate-200 text-slate-800 font-bold focus:outline-hidden cursor-pointer"
              >
                <option value="all">Semua Kategori Satker</option>
                <option value="kantor">Kantor Induk (Subbag & Seksi)</option>
                <option value="kua">KUA Kecamatan</option>
                <option value="madrasah">Madrasah Negeri & Swasta</option>
              </select>
            </div>
          </div>
        )}

        {/* Chart Canvas */}
        <div className="w-full">
          <div
            ref={barUnitRef}
            style={{
              width: '100%',
              height:
                chartViewMode === 'leaderboard'
                  ? limitMode === 'all'
                    ? '520px'
                    : '430px'
                  : chartViewMode === 'treemap'
                  ? '440px'
                  : '380px',
            }}
          ></div>
        </div>

        {/* Footer Insights for Mode 3 (Per Kluster Satker) */}
        {chartViewMode === 'cluster' && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-200/60">
            {clusterStats.map((c) => (
              <div
                key={c.key}
                className="p-3.5 rounded-2xl bg-gradient-to-br from-white/90 to-slate-50 border border-slate-200/80 space-y-1.5"
              >
                <span className="text-xs font-bold text-slate-800 line-clamp-1">{c.title}</span>
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-black text-[#006640] font-sans">{c.avgIP}</span>
                  <span className="text-xs font-bold text-slate-500 font-mono">
                    Partisipasi: {c.persentase}%
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 flex justify-between">
                  <span>Total ASN: {c.total}</span>
                  <span>Sudah: {c.countIP}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Legend Indicator info */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200/60 text-[11px] text-slate-500">
          <div className="flex items-center space-x-3">
            <span className="font-semibold text-slate-700">Petunjuk Warna:</span>
            <span className="inline-flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#006640]"></span> ≥ 85 (Sangat Tinggi / Tinggi)
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#10b981]"></span> 70 - 84 (Sedang)
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#D4AF37]"></span> &lt; 70 (Perlu Peningkatan)
            </span>
          </div>
          <span className="text-slate-400 font-mono">
            *Dianalisis dari seluruh data riil pegawai Kankemenag Kab. Gunungkidul
          </span>
        </div>
      </div>
    </div>
  );
};
