import React, { useState, useMemo, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';
import { CategoryItem, DrilldownRow } from '../data/categories';
import { SupermarketData, OFFICIAL_STORE_NAMES, formatVND } from '../data/supermarkets';
import { 
  OFFICIAL_STORE_CATEGORY_TARGETS, 
  OFFICIAL_CATEGORY_TOTAL_TARGETS, 
  GRAND_TOTAL_CATEGORY_TARGET,
  DAILY_WEIGHTS_31_DAYS,
  getCumulativeWeight,
  getCategoryCumulativeTarget,
  getStoreCategoryCumulativeTarget 
} from '../data/categoryTargetsData';
import { Chart, registerables } from 'chart.js';
import { 
  ShoppingBag, 
  TrendingUp, 
  Calendar, 
  Layers, 
  Search, 
  Filter, 
  ArrowUpRight, 
  ArrowDownRight, 
  CheckCircle2, 
  AlertTriangle,
  Download,
  CalendarDays,
  Target,
  FileSpreadsheet,
  Store,
  Sparkles
} from 'lucide-react';

Chart.register(...registerables);

interface CategoryReportTabProps {
  categories: CategoryItem[];
  stores: SupermarketData[];
  novDaysElapsed: number;
  onDaysElapsedChange: (days: number) => void;
}

export const CategoryReportTab: React.FC<CategoryReportTabProps> = ({
  categories,
  stores,
  novDaysElapsed,
  onDaysElapsedChange
}) => {
  const [chartMode, setChartMode] = useState<'target-cum' | 'forecast' | 'period'>('target-cum');
  const [selectedStore, setSelectedStore] = useState<string>('all');
  const [selectedCat, setSelectedCat] = useState<string>('all');
  const [trendFilter, setTrendFilter] = useState<'all' | 'up' | 'down'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Section C Day Explorer
  const [selectedDayExplorer, setSelectedDayExplorer] = useState<number>(novDaysElapsed || 10);
  const [explorerStore, setExplorerStore] = useState<string>('all');
  
  const chartCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstanceRef = useRef<Chart | null>(null);

  // Totals & KPI
  const {
    totalNovCum,
    totalTargetCum,
    totalTargetFullMonth,
    totalOctSame,
    totalOctFull,
    dailyRunRate,
    totalNovForecast,
    percentTargetCum,
    percentTargetFullMonth,
    growthPeriod,
    growthForecast
  } = useMemo(() => {
    const nov = categories.reduce((s, c) => s + c.novCum, 0);
    const octS = categories.reduce((s, c) => s + c.octSame, 0);
    const octF = categories.reduce((s, c) => s + c.octFull, 0);
    const runRate = novDaysElapsed > 0 ? nov / novDaysElapsed : 0;
    const forecast = runRate * 30;

    // Target totals from official dataset
    const weightCum = getCumulativeWeight(novDaysElapsed);
    const targetFullMonth = GRAND_TOTAL_CATEGORY_TARGET; // 38,428,573,273 đ
    const targetCum = Math.round(targetFullMonth * weightCum);

    const pctTargetCum = targetCum > 0 ? (nov / targetCum) * 100 : 0;
    const pctTargetFull = targetFullMonth > 0 ? (forecast / targetFullMonth) * 100 : 0;
    const gPeriod = octS > 0 ? ((nov - octS) / octS) * 100 : 0;
    const gForecast = octF > 0 ? ((forecast - octF) / octF) * 100 : 0;

    return {
      totalNovCum: nov,
      totalTargetCum: targetCum,
      totalTargetFullMonth: targetFullMonth,
      totalOctSame: octS,
      totalOctFull: octF,
      dailyRunRate: runRate,
      totalNovForecast: forecast,
      percentTargetCum: pctTargetCum,
      percentTargetFullMonth: pctTargetFull,
      growthPeriod: gPeriod,
      growthForecast: gForecast
    };
  }, [categories, novDaysElapsed]);

  // Build Drilldown Matrix with EXACT 21 Stores x 17 Categories Target Data
  const drilldownData: DrilldownRow[] = useMemo(() => {
    const totalStoreRev = stores.reduce((s, st) => s + st.thucHien, 0);
    const rows: DrilldownRow[] = [];
    let stt = 1;

    stores.forEach(store => {
      const storeRatio = totalStoreRev > 0 ? (store.thucHien / totalStoreRev) : (1 / stores.length);
      const officialName = OFFICIAL_STORE_NAMES[store.code] || store.name;
      const cleanShortName = officialName.replace(/^BHX_[A-Z]{3}_[A-Z]{3}\s*-\s*/i, '');
      const storeTargets = OFFICIAL_STORE_CATEGORY_TARGETS[store.code] || {};

      categories.forEach(cat => {
        // Base estimation for historical actual revenue
        const baseNov = Math.round(cat.novCum * storeRatio);
        const baseOct = Math.round(cat.octSame * storeRatio);
        const diff = baseNov - baseOct;
        const growth = baseOct > 0 ? ((diff / baseOct) * 100) : 0;

        // Exact Store Target for this Category
        const targetMonth = storeTargets[cat.name] || 0;
        const targetCum = getStoreCategoryCumulativeTarget(store.code, cat.name, novDaysElapsed);
        const percentTargetCum = targetCum > 0 ? (baseNov / targetCum) * 100 : 0;
        const percentTargetMonth = targetMonth > 0 ? (baseNov / targetMonth) * 100 : 0;
        const diffTargetCum = baseNov - targetCum;

        rows.push({
          stt: stt++,
          storeCode: store.code,
          storeName: officialName,
          shortName: cleanShortName,
          tier: store.tier,
          catId: cat.id,
          catName: cat.name,
          group: cat.group,
          novRevenue: baseNov,
          targetCum,
          percentTargetCum,
          targetMonth,
          percentTargetMonth,
          diffTargetCum,
          octRevenue: baseOct,
          diff,
          growth
        });
      });
    });

    return rows;
  }, [stores, categories, novDaysElapsed]);

  // Filter Drilldown
  const filteredDrilldown = useMemo(() => {
    return drilldownData.filter(item => {
      const matchStore = selectedStore === 'all' || item.storeCode === selectedStore;
      const matchCat = selectedCat === 'all' || item.catId === selectedCat;
      const matchTrend = trendFilter === 'all' || (trendFilter === 'up' && item.percentTargetCum >= 100) || (trendFilter === 'down' && item.percentTargetCum < 100);
      const q = searchQuery.trim().toLowerCase();
      const matchSearch = !q || item.storeName.toLowerCase().includes(q) || item.storeCode.toLowerCase().includes(q) || item.catName.toLowerCase().includes(q);
      return matchStore && matchCat && matchTrend && matchSearch;
    });
  }, [drilldownData, selectedStore, selectedCat, trendFilter, searchQuery]);

  // Render Chart
  useEffect(() => {
    if (!chartCanvasRef.current) return;
    const ctx = chartCanvasRef.current.getContext('2d');
    if (!ctx) return;

    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
      chartInstanceRef.current = null;
    }

    const labels = categories.map(c => c.name.length > 18 ? c.name.slice(0, 18) + '...' : c.name);

    let datasets: any[] = [];
    if (chartMode === 'target-cum') {
      datasets = [
        {
          label: `Target Lũy Kế ${novDaysElapsed} Ngày (Chỉ Tiêu Chuẩn)`,
          data: categories.map(c => getCategoryCumulativeTarget(c.name, novDaysElapsed)),
          backgroundColor: '#fed7aa',
          borderColor: '#f97316',
          borderWidth: 1,
          borderRadius: 5,
          barPercentage: 0.8
        },
        {
          label: `Thực Hiện Lũy Kế T11 (Đến ngày ${novDaysElapsed})`,
          data: categories.map(c => c.novCum),
          backgroundColor: '#007738',
          hoverBackgroundColor: '#005427',
          borderRadius: 5,
          barPercentage: 0.8
        }
      ];
    } else if (chartMode === 'forecast') {
      const forecasts = categories.map(c => (c.novCum / novDaysElapsed) * 30);
      datasets = [
        {
          label: 'Target Cả Tháng 31 Ngày (38.4 Tỷ)',
          data: categories.map(c => OFFICIAL_CATEGORY_TOTAL_TARGETS[c.name] || c.targetNov),
          backgroundColor: '#cbd5e1',
          borderColor: '#64748b',
          borderWidth: 1,
          borderRadius: 5,
          barPercentage: 0.8
        },
        {
          label: 'Dự Kiến Forecast Cả Tháng 11',
          data: forecasts,
          backgroundColor: '#d97706',
          hoverBackgroundColor: '#b45309',
          borderRadius: 5,
          barPercentage: 0.8
        }
      ];
    } else {
      datasets = [
        {
          label: 'Lũy Kế T10 Cùng Kỳ',
          data: categories.map(c => c.octSame),
          backgroundColor: '#93c5fd',
          borderRadius: 5,
          barPercentage: 0.8
        },
        {
          label: 'Lũy Kế T11 (Đến nay)',
          data: categories.map(c => c.novCum),
          backgroundColor: '#007738',
          hoverBackgroundColor: '#005427',
          borderRadius: 5,
          barPercentage: 0.8
        }
      ];
    }

    chartInstanceRef.current = new Chart(ctx, {
      type: 'bar',
      data: { labels, datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        layout: { padding: { top: 12, bottom: 4 } },
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: {
            position: 'top',
            labels: {
              boxWidth: 14,
              boxHeight: 14,
              font: { family: '"Plus Jakarta Sans"', size: 12, weight: 600 },
              color: '#1e293b'
            }
          },
          tooltip: {
            backgroundColor: '#0f172a',
            padding: 12,
            cornerRadius: 8,
            titleFont: { family: '"Plus Jakarta Sans"', size: 12, weight: 'bold' },
            bodyFont: { family: '"JetBrains Mono"', size: 11 },
            callbacks: {
              title: (items) => {
                if (!items.length) return '';
                return categories[items[0].dataIndex].name;
              },
              label: (context) => {
                return ' ' + context.dataset.label + ': ' + formatVND(context.raw as number);
              },
              afterBody: (items) => {
                if (!items.length) return [];
                const cat = categories[items[0].dataIndex];
                if (chartMode === 'target-cum') {
                  const targetCum = getCategoryCumulativeTarget(cat.name, novDaysElapsed);
                  const pct = targetCum > 0 ? (cat.novCum / targetCum) * 100 : 0;
                  const diff = cat.novCum - targetCum;
                  return [
                    '---------------------------',
                    `% Đạt Target Lũy Kế: ${pct.toFixed(2)}%`,
                    `Chênh lệch: ${(diff >= 0 ? '+' : '')}${formatVND(diff)}`
                  ];
                } else if (chartMode === 'forecast') {
                  const targetMonth = OFFICIAL_CATEGORY_TOTAL_TARGETS[cat.name] || cat.targetNov;
                  const fcast = (cat.novCum / novDaysElapsed) * 30;
                  const pct = targetMonth > 0 ? (fcast / targetMonth) * 100 : 0;
                  return [
                    '---------------------------',
                    `% Đạt Target Tháng: ${pct.toFixed(2)}%`,
                    `Chênh lệch Target: ${(fcast - targetMonth >= 0 ? '+' : '')}${formatVND(fcast - targetMonth)}`
                  ];
                } else {
                  const g = (((cat.novCum - cat.octSame) / cat.octSame) * 100);
                  return [
                    '---------------------------',
                    'Tăng trưởng cùng kỳ: ' + (g >= 0 ? '+' : '') + g.toFixed(2) + '%'
                  ];
                }
              }
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: {
              font: { family: '"Plus Jakarta Sans"', size: 10, weight: 600 },
              color: '#334155',
              maxRotation: 45,
              minRotation: 35
            }
          },
          y: {
            grid: { color: '#f1f5f9' },
            ticks: {
              font: { family: '"JetBrains Mono"', size: 11 },
              color: '#64748b',
              callback: (val) => {
                const n = Number(val);
                if (Math.abs(n) >= 1000000000) return (n / 1000000000).toFixed(1) + ' Tỷ';
                if (Math.abs(n) >= 1000000) return (n / 1000000).toFixed(0) + ' Tr';
                return n.toLocaleString('vi-VN');
              }
            }
          }
        }
      }
    });

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
      }
    };
  }, [categories, chartMode, novDaysElapsed]);

  // Export Full Target Excel file (21 stores x 17 categories x 31 days)
  const handleExportTargetExcel = () => {
    try {
      const wb = XLSX.utils.book_new();

      // Sheet 1: Ma trận 21 Siêu Thị x 17 Ngành Hàng Target Cả Tháng
      const sheet1Data: any[] = [
        ["STT", "Mã Siêu Thị", "Tên Siêu Thị", "Ngành Hàng BHX", "Target Cả Tháng 31 Ngày (VNĐ)", "Ghi Chú"]
      ];
      let rowIdx = 1;
      stores.forEach(s => {
        const officialName = OFFICIAL_STORE_NAMES[s.code] || s.name;
        const storeMap = OFFICIAL_STORE_CATEGORY_TARGETS[s.code] || {};
        categories.forEach(c => {
          const tgt = storeMap[c.name] || 0;
          sheet1Data.push([
            rowIdx++,
            s.code,
            officialName,
            c.name,
            tgt,
            "Target Chuẩn 38.4 Tỷ"
          ]);
        });
      });
      const ws1 = XLSX.utils.aoa_to_sheet(sheet1Data);
      XLSX.utils.book_append_sheet(wb, ws1, "Target 21 ST x 17 Ngành");

      // Sheet 2: Tổng 17 Ngành Hàng Toàn Khu Vực
      const sheet2Data: any[] = [
        ["STT", "Ngành Hàng BHX", "Phân Nhóm", "Target Cả Tháng 31 Ngày (VNĐ)", "Tỷ Trọng Target (%)"]
      ];
      categories.forEach((c, idx) => {
        const fullTarget = OFFICIAL_CATEGORY_TOTAL_TARGETS[c.name] || 0;
        const ratio = GRAND_TOTAL_CATEGORY_TARGET > 0 ? (fullTarget / GRAND_TOTAL_CATEGORY_TARGET) * 100 : 0;
        sheet2Data.push([
          idx + 1,
          c.name,
          c.group,
          fullTarget,
          `${ratio.toFixed(2)}%`
        ]);
      });
      sheet2Data.push([
        "",
        "TỔNG TOÀN KHU VỰC (17 NGÀNH HÀNG)",
        "Tất cả",
        GRAND_TOTAL_CATEGORY_TARGET,
        "100.00%"
      ]);
      const ws2 = XLSX.utils.aoa_to_sheet(sheet2Data);
      XLSX.utils.book_append_sheet(wb, ws2, "Target 17 Ngành Khu Vực");

      // Sheet 3: Phân bổ 31 Ngày Toàn Khu Vực
      const sheet3Data: any[] = [
        ["Ngày Trong Tháng", "Hệ Số Phân Bổ (%)", "Target Khu Vực Theo Ngày (VNĐ)", "Target Lũy Kế Đến Ngày (VNĐ)", "Tiến Độ Hoàn Thành (%)"]
      ];
      let cumSum = 0;
      DAILY_WEIGHTS_31_DAYS.forEach((weight, i) => {
        const day = i + 1;
        cumSum += weight;
        const dayTarget = Math.round(GRAND_TOTAL_CATEGORY_TARGET * weight);
        const cumTarget = Math.round(GRAND_TOTAL_CATEGORY_TARGET * cumSum);
        sheet3Data.push([
          `Ngày ${day}`,
          `${(weight * 100).toFixed(2)}%`,
          dayTarget,
          cumTarget,
          `${(cumSum * 100).toFixed(2)}%`
        ]);
      });
      const ws3 = XLSX.utils.aoa_to_sheet(sheet3Data);
      XLSX.utils.book_append_sheet(wb, ws3, "Phân Bổ 31 Ngày");

      XLSX.writeFile(wb, `Target_BHX_21_SieuThi_17_NganhHang_31Ngay.xlsx`);
    } catch (e: any) {
      alert("Lỗi xuất file Excel: " + e.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER CONTROL BAR */}
      <section className="bg-white rounded-xl p-4 sm:p-5 shadow-sm border border-emerald-900/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
              <ShoppingBag className="w-3.5 h-3.5" />
              Báo Cáo Ngành Hàng
            </span>
            <span className="text-xs text-slate-500 font-medium">Đối soát Thực hiện vs Target chuẩn 38.4 Tỷ (21 Siêu Thị x 17 Ngành x 31 Ngày)</span>
          </div>
          <h2 className="text-base sm:text-lg font-bold text-bhx-green-dark mt-1 flex items-center gap-2">
            Tổng Quan Doanh Thu Ngành Hàng & Đối Soát Target 31 Ngày
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Đã nạp chính xác bộ dữ liệu 357 bản ghi Target theo ngày của 21 siêu thị và 17 ngành hàng từ file kiểm duyệt.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 text-xs">
            <span className="text-slate-600 font-semibold">Số ngày lũy kế Tháng 11:</span>
            <div className="flex items-center gap-1.5">
              <input 
                type="number" 
                min={1} 
                max={31} 
                value={novDaysElapsed} 
                onChange={(e) => onDaysElapsedChange(Math.max(1, Math.min(31, parseInt(e.target.value, 10) || 1)))}
                className="w-12 px-1.5 py-1 bg-white border border-slate-300 rounded-md font-mono font-bold text-center text-bhx-green-dark focus:ring-1 focus:ring-bhx-green"
              />
              <span className="text-slate-500">/ 31 ngày</span>
            </div>
            <span className="text-[11px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
              {((novDaysElapsed / 31) * 100).toFixed(1)}% Tháng
            </span>
          </div>

          <button
            onClick={handleExportTargetExcel}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white transition shadow-xs"
            title="Tải bảng Target 21 Siêu Thị x 17 Ngành x 31 Ngày (.xlsx)"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Xuất File Excel Target</span>
          </button>
        </div>
      </section>

      {/* KPI CARDS WITH TARGET ACCURACY */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Thực Hiện Lũy Kế */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-emerald-900/10 hover:shadow-md transition">
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-xs font-semibold tracking-wide uppercase text-slate-600">Thực Hiện Lũy Kế T11</span>
            <span className="p-1.5 bg-emerald-50 text-bhx-green rounded-lg">
              <ShoppingBag className="w-4 h-4" />
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-bhx-green-dark font-mono tracking-tight">
            {formatVND(totalNovCum)}
          </div>
          <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
            <span>Trung bình ngày:</span>
            <b className="font-mono text-slate-800">{(dailyRunRate / 1000000).toFixed(1)} Tr/ngày</b>
          </div>
        </div>

        {/* Card 2: Target Lũy Kế N Ngày */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-emerald-900/10 hover:shadow-md transition">
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-xs font-semibold tracking-wide uppercase text-slate-600">Target Lũy Kế {novDaysElapsed} Ngày</span>
            <span className="p-1.5 bg-amber-50 text-amber-700 rounded-lg">
              <Target className="w-4 h-4" />
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-amber-700 font-mono tracking-tight">
            {formatVND(totalTargetCum)}
          </div>
          <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
            <span>Tiến độ đạt Target:</span>
            <span className={`font-bold font-mono px-2 py-0.5 rounded ${percentTargetCum >= 100 ? 'text-emerald-700 bg-emerald-50' : 'text-amber-800 bg-amber-50'}`}>
              {percentTargetCum.toFixed(2)}% {percentTargetCum >= 100 ? '🎯 Đạt' : '🟡 Cần bù'}
            </span>
          </div>
        </div>

        {/* Card 3: Target Cả Tháng (Chuẩn 38.4 Tỷ) */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-emerald-900/10 hover:shadow-md transition">
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-xs font-semibold tracking-wide uppercase text-slate-600">Target Cả Tháng (Từ File)</span>
            <span className="p-1.5 bg-blue-50 text-blue-700 rounded-lg">
              <Calendar className="w-4 h-4" />
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-blue-800 font-mono tracking-tight">
            {formatVND(totalTargetFullMonth)}
          </div>
          <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
            <span>Dự phóng Forecast:</span>
            <b className="font-mono text-slate-800">{formatVND(totalNovForecast)}</b>
          </div>
        </div>

        {/* Card 4: Forecast vs Target Tháng */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-emerald-900/10 hover:shadow-md transition">
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-xs font-semibold tracking-wide uppercase text-slate-600">Dự Báo Cả Tháng vs Target</span>
            <span className="p-1.5 bg-emerald-50 text-bhx-green rounded-lg">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-emerald-700 font-mono tracking-tight">
            {percentTargetFullMonth.toFixed(2)}% 🎯
          </div>
          <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
            <span>So với T10 cùng kỳ:</span>
            <b className={`font-mono ${growthPeriod >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
              {growthPeriod >= 0 ? '+' : ''}{growthPeriod.toFixed(2)}%
            </b>
          </div>
        </div>
      </section>

      {/* PHẦN A: TỔNG QUAN THEO TỪNG NGÀNH HÀNG KHU VỰC */}
      <section className="bg-white rounded-xl shadow-sm border border-emerald-900/10 overflow-hidden">
        <div className="bg-gradient-to-r from-bhx-green-dark to-bhx-green px-4 sm:px-6 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-bhx-yellow">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-bhx-yellow text-bhx-green-dark">
                PHẦN A
              </span>
              <h3 className="text-sm sm:text-base font-bold text-white tracking-tight flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-bhx-yellow" />
                Tổng Quan 17 Ngành Hàng Khu Vực vs Target Chuẩn & Dự Báo
              </h3>
            </div>
            <p className="text-xs text-emerald-100 mt-0.5">
              So sánh trực tiếp kết quả lũy kế T11 với Target lũy kế tương ứng và Target cả tháng (tổng 38.4 Tỷ)
            </p>
          </div>

          <div className="flex items-center gap-1 p-1 bg-white/10 rounded-lg text-xs font-semibold border border-white/15">
            <button 
              onClick={() => setChartMode('target-cum')}
              className={`px-3 py-1.5 rounded-md transition ${chartMode === 'target-cum' ? 'bg-bhx-yellow text-bhx-green-dark font-bold shadow-xs' : 'text-white hover:bg-white/15'}`}
            >
              Thực Hiện vs Target Lũy Kế
            </button>
            <button 
              onClick={() => setChartMode('forecast')}
              className={`px-3 py-1.5 rounded-md transition ${chartMode === 'forecast' ? 'bg-bhx-yellow text-bhx-green-dark font-bold shadow-xs' : 'text-white hover:bg-white/15'}`}
            >
              Forecast vs Target Tháng
            </button>
            <button 
              onClick={() => setChartMode('period')}
              className={`px-3 py-1.5 rounded-md transition ${chartMode === 'period' ? 'bg-bhx-yellow text-bhx-green-dark font-bold shadow-xs' : 'text-white hover:bg-white/15'}`}
            >
              T11 vs Cùng Kỳ T10
            </button>
          </div>
        </div>

        <div className="p-4 sm:p-5 space-y-6">
          <div className="w-full overflow-x-auto custom-scrollbar pb-2">
            <div className="relative w-full min-w-[750px] sm:min-w-[950px] h-[340px] sm:h-[380px]">
              <canvas ref={chartCanvasRef}></canvas>
            </div>
          </div>

          <div className="overflow-x-auto custom-scrollbar border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-100 text-slate-700 uppercase text-[11px] font-bold tracking-wider border-b border-slate-200">
                <tr>
                  <th scope="col" className="py-3 px-3 text-center w-12">STT</th>
                  <th scope="col" className="py-3 px-4">Tên Ngành Hàng BHX</th>
                  <th scope="col" className="py-3 px-4 text-right">Lũy Kế T11 (Đến nay)</th>
                  <th scope="col" className="py-3 px-4 text-right font-extrabold text-amber-900">Target Lũy Kế ({novDaysElapsed}N)</th>
                  <th scope="col" className="py-3 px-3 text-center">% Đạt Target LK</th>
                  <th scope="col" className="py-3 px-4 text-right font-extrabold text-teal-900">Target Cả Tháng</th>
                  <th scope="col" className="py-3 px-4 text-right font-mono text-slate-600">Lũy Kế T10</th>
                  <th scope="col" className="py-3 px-3 text-center">Tăng Trưởng T10</th>
                  <th scope="col" className="py-3 px-4 text-right font-extrabold text-amber-800">Forecast T11</th>
                  <th scope="col" className="py-3 px-3 text-center">% Forecast / Target</th>
                  <th scope="col" className="py-3 px-3 text-center">Đánh Giá</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {categories.map((cat, idx) => {
                  const catDailyRunRate = novDaysElapsed > 0 ? (cat.novCum / novDaysElapsed) : 0;
                  const catForecast = catDailyRunRate * 30;
                  const catTargetMonth = OFFICIAL_CATEGORY_TOTAL_TARGETS[cat.name] || cat.targetNov;
                  const catTargetCum = getCategoryCumulativeTarget(cat.name, novDaysElapsed);
                  const pctTargetCum = catTargetCum > 0 ? (cat.novCum / catTargetCum) * 100 : 0;
                  const catGrowthPeriod = cat.octSame > 0 ? (((cat.novCum - cat.octSame) / cat.octSame) * 100) : 0;
                  const catForecastRatio = catTargetMonth > 0 ? (catForecast / catTargetMonth) * 100 : 0;

                  return (
                    <tr key={cat.id} className="hover:bg-slate-50 transition">
                      <td className="py-2.5 px-3 text-center font-bold text-slate-500">{idx + 1}</td>
                      <td className="py-2.5 px-4 font-bold text-slate-900">
                        <div className="flex items-center gap-1.5">
                          <span>{cat.name}</span>
                          <span className="text-[10px] text-slate-400 font-normal">({cat.group})</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono font-bold text-bhx-green-dark">{formatVND(cat.novCum)}</td>
                      <td className="py-2.5 px-4 text-right font-mono font-bold text-amber-800">{formatVND(catTargetCum)}</td>
                      <td className="py-2.5 px-3 text-center font-mono font-bold">
                        <span className={`px-2 py-0.5 rounded text-xs ${pctTargetCum >= 100 ? 'bg-emerald-100 text-emerald-800 font-black' : pctTargetCum >= 90 ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'}`}>
                          {pctTargetCum.toFixed(1)}%
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono font-bold text-teal-800">{formatVND(catTargetMonth)}</td>
                      <td className="py-2.5 px-4 text-right font-mono text-slate-700">{formatVND(cat.octSame)}</td>
                      <td className={`py-2.5 px-3 text-center font-mono font-bold ${catGrowthPeriod >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                        {catGrowthPeriod >= 0 ? '+' : ''}{catGrowthPeriod.toFixed(2)}%
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono font-black text-amber-800 text-sm">{formatVND(catForecast)}</td>
                      <td className="py-2.5 px-3 text-center font-mono font-bold">
                        <span className={`px-2 py-0.5 rounded text-xs ${catForecastRatio >= 100 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                          {catForecastRatio.toFixed(1)}%
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {pctTargetCum >= 100 ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">Đạt Target 🎯</span>
                        ) : pctTargetCum >= 90 ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">Sát Target ↗</span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">Cần đẩy mạnh ⚠️</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-emerald-50/90 font-bold border-t-2 border-bhx-green text-xs sm:text-sm">
                <tr>
                  <td colSpan={2} className="py-3 px-4 text-bhx-green-dark uppercase font-extrabold text-xs">
                    Tổng Toàn Khu Vực (17 Ngành):
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-bhx-green-dark font-black">{formatVND(totalNovCum)}</td>
                  <td className="py-3 px-4 text-right font-mono text-amber-900 font-black">{formatVND(totalTargetCum)}</td>
                  <td className="py-3 px-3 text-center font-mono font-black text-emerald-800">
                    {totalTargetCum > 0 ? ((totalNovCum / totalTargetCum) * 100).toFixed(1) : 0}%
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-teal-900 font-black">{formatVND(totalTargetFullMonth)}</td>
                  <td className="py-3 px-4 text-right font-mono text-slate-800">{formatVND(totalOctSame)}</td>
                  <td className="py-3 px-3 text-center font-mono font-black text-emerald-800">{growthPeriod >= 0 ? '+' : ''}{growthPeriod.toFixed(2)}%</td>
                  <td className="py-3 px-4 text-right font-mono text-amber-950 font-black text-base">{formatVND(totalNovForecast)}</td>
                  <td className="py-3 px-3 text-center font-mono font-black text-emerald-800">
                    {totalTargetFullMonth > 0 ? ((totalNovForecast / totalTargetFullMonth) * 100).toFixed(1) : 0}%
                  </td>
                  <td className="py-3 px-3 text-center font-bold text-bhx-green-dark">Tiến độ tốt</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </section>

      {/* PHẦN B: CHI TIẾT THEO TỪNG SIÊU THỊ VÀ NGÀNH HÀNG */}
      <section className="bg-white rounded-xl shadow-sm border border-emerald-900/10 overflow-hidden">
        <div className="bg-gradient-to-r from-emerald-800 to-teal-800 px-4 sm:px-6 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-bhx-yellow">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-bhx-yellow text-bhx-green-dark">
                PHẦN B
              </span>
              <h3 className="text-sm sm:text-base font-bold text-white tracking-tight flex items-center gap-1.5">
                <Filter className="w-4 h-4 text-bhx-yellow" />
                Ma Trận Đối Soát 21 Siêu Thị x 17 Ngành Hàng vs Target Chuẩn
              </h3>
            </div>
            <p className="text-xs text-teal-100 mt-0.5">
              Tra cứu đối soát trực tiếp Target Lũy Kế và Target Cả Tháng của từng điểm bán từ file 38.4 Tỷ
            </p>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="p-4 bg-slate-50/80 border-b border-slate-200 flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Lọc theo Siêu Thị:</label>
            <select 
              value={selectedStore} 
              onChange={(e) => setSelectedStore(e.target.value)}
              className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:ring-1 focus:ring-bhx-green"
            >
              <option value="all">Tất cả {stores.length} Siêu thị</option>
              {stores.map(s => (
                <option key={s.code} value={s.code}>[{s.code}] {s.shortName}</option>
              ))}
            </select>
          </div>

          <div className="flex-1 min-w-[200px]">
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Lọc theo Ngành Hàng:</label>
            <select 
              value={selectedCat} 
              onChange={(e) => setSelectedCat(e.target.value)}
              className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:ring-1 focus:ring-bhx-green"
            >
              <option value="all">Tất cả Ngành hàng ({categories.length} ngành)</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="w-44">
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Tiến độ đạt Target:</label>
            <select 
              value={trendFilter} 
              onChange={(e) => setTrendFilter(e.target.value as any)}
              className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:ring-1 focus:ring-bhx-green"
            >
              <option value="all">Tất cả ({filteredDrilldown.length})</option>
              <option value="up">Đạt Target LK (≥ 100%)</option>
              <option value="down">Chưa đạt Target LK (&lt; 100%)</option>
            </select>
          </div>

          <div className="flex-1 min-w-[180px]">
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Tìm kiếm từ khóa:</label>
            <input 
              type="text" 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Gõ mã kho hoặc tên ngành..." 
              className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-bhx-green"
            />
          </div>
        </div>

        {/* Drilldown Table */}
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-100 text-slate-700 uppercase text-[11px] font-bold tracking-wider border-b border-slate-200">
              <tr>
                <th scope="col" className="py-3 px-3 text-center w-12">STT</th>
                <th scope="col" className="py-3 px-3">Mã Kho</th>
                <th scope="col" className="py-3 px-4">Tên Siêu Thị</th>
                <th scope="col" className="py-3 px-4">Ngành Hàng BHX</th>
                <th scope="col" className="py-3 px-4 text-right">Lũy Kế T11</th>
                <th scope="col" className="py-3 px-4 text-right font-extrabold text-amber-900">Target Lũy Kế</th>
                <th scope="col" className="py-3 px-3 text-center">% Đạt Target LK</th>
                <th scope="col" className="py-3 px-4 text-right font-mono text-teal-800">Target Cả Tháng</th>
                <th scope="col" className="py-3 px-4 text-right">Chênh Lệch LK</th>
                <th scope="col" className="py-3 px-3 text-center">Đánh Giá</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredDrilldown.map((r, idx) => {
                const badgeColor = r.percentTargetCum >= 100 ? 'text-emerald-700 bg-emerald-50 border-emerald-200' :
                                   r.percentTargetCum >= 85 ? 'text-blue-700 bg-blue-50 border-blue-200' :
                                   'text-rose-700 bg-rose-50 border-rose-200';
                const evaluation = r.percentTargetCum >= 100 ? 'Vượt Target 🎯' : r.percentTargetCum >= 85 ? 'Sát Target ↗' : 'Cần bù ⚠️';
                return (
                  <tr key={`${r.storeCode}_${r.catId}`} className="hover:bg-slate-50 transition">
                    <td className="py-2.5 px-3 text-center font-bold text-slate-500">{idx + 1}</td>
                    <td className="py-2.5 px-3 font-mono font-bold text-bhx-green text-xs">{r.storeCode}</td>
                    <td className="py-2.5 px-4 font-semibold text-slate-900">{r.shortName}</td>
                    <td className="py-2.5 px-4 font-bold text-slate-800">{r.catName}</td>
                    <td className="py-2.5 px-4 text-right font-mono font-bold text-bhx-green-dark">{formatVND(r.novRevenue)}</td>
                    <td className="py-2.5 px-4 text-right font-mono font-bold text-amber-800">{formatVND(r.targetCum)}</td>
                    <td className="py-2.5 px-3 text-center font-mono font-black">
                      <span className={`px-2 py-0.5 rounded text-xs ${r.percentTargetCum >= 100 ? 'bg-emerald-100 text-emerald-800' : r.percentTargetCum >= 85 ? 'bg-blue-100 text-blue-800' : 'bg-rose-100 text-rose-800'}`}>
                        {r.percentTargetCum.toFixed(1)}%
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono font-bold text-teal-800">{formatVND(r.targetMonth)}</td>
                    <td className={`py-2.5 px-4 text-right font-mono font-bold ${r.diffTargetCum >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                      {r.diffTargetCum >= 0 ? '+' : ''}{formatVND(r.diffTargetCum)}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${badgeColor}`}>{evaluation}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="p-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex items-center justify-between">
          <span>Hiển thị {filteredDrilldown.length} bản ghi phù hợp</span>
          <span className="text-[11px] italic text-slate-400">* Số liệu Target được đối soát theo đúng bảng pivot chuẩn 38.4 Tỷ của 21 siêu thị x 17 ngành</span>
        </div>
      </section>

      {/* PHẦN C: TRA CỨU TARGET CHI TIẾT 31 NGÀY & TẢI FILE EXCEL CHUẨN */}
      <section className="bg-white rounded-xl shadow-sm border border-emerald-900/10 overflow-hidden">
        <div className="bg-gradient-to-r from-amber-600 via-amber-700 to-amber-800 px-4 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-bhx-yellow text-white">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-bhx-yellow text-bhx-green-dark">
                PHẦN C
              </span>
              <h3 className="text-base sm:text-lg font-bold tracking-tight flex items-center gap-1.5">
                <CalendarDays className="w-5 h-5 text-bhx-yellow" />
                Tra Cứu Chi Tiết Kế Hoạch Target 31 Ngày (38.4 Tỷ)
              </h3>
            </div>
            <p className="text-xs text-amber-100 mt-1">
              Khám phá Target từng ngày cụ thể và Target lũy kế của 21 Siêu Thị & 17 Ngành Hàng
            </p>
          </div>

          <button
            onClick={handleExportTargetExcel}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold bg-white text-amber-900 hover:bg-amber-50 transition shadow-md"
          >
            <Download className="w-4 h-4 text-amber-700" />
            <span>TẢI FULL EXCEL TARGET (.XLSX)</span>
          </button>
        </div>

        {/* Day Selector */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700">Chọn Ngày trong tháng:</span>
              <span className="px-2.5 py-0.5 bg-amber-100 text-amber-900 font-extrabold text-xs rounded-full border border-amber-300">
                Ngày {selectedDayExplorer} / 31
              </span>
              <span className="text-xs text-slate-500 font-medium">
                (Hệ số ngày: {(DAILY_WEIGHTS_31_DAYS[selectedDayExplorer - 1] * 100).toFixed(2)}% | Lũy kế đến ngày: {(getCumulativeWeight(selectedDayExplorer) * 100).toFixed(2)}%)
              </span>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-slate-600">Xem cho Siêu Thị:</label>
              <select
                value={explorerStore}
                onChange={(e) => setExplorerStore(e.target.value)}
                className="p-1.5 bg-white border border-slate-300 rounded-md text-xs font-semibold text-slate-800"
              >
                <option value="all">Toàn Khu Vực (21 Siêu Thị)</option>
                {stores.map(s => (
                  <option key={s.code} value={s.code}>[{s.code}] {s.shortName}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Quick Day Buttons (1 to 31) */}
          <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar py-1">
            {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
              <button
                key={day}
                onClick={() => setSelectedDayExplorer(day)}
                className={`flex-shrink-0 w-8 h-8 rounded-lg text-xs font-bold transition flex items-center justify-center ${
                  selectedDayExplorer === day
                    ? 'bg-amber-600 text-white shadow-xs ring-2 ring-amber-400'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                {day}
              </button>
            ))}
          </div>
        </div>

        {/* 31-Day Category Target Detail Table */}
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-100 text-slate-700 uppercase text-[11px] font-bold tracking-wider border-b border-slate-200">
              <tr>
                <th scope="col" className="py-3 px-3 text-center w-12">STT</th>
                <th scope="col" className="py-3 px-4">Ngành Hàng BHX</th>
                <th scope="col" className="py-3 px-3 text-center">Phân Nhóm</th>
                <th scope="col" className="py-3 px-4 text-right font-extrabold text-amber-800">Target Ngày {selectedDayExplorer}</th>
                <th scope="col" className="py-3 px-4 text-right font-extrabold text-teal-800">Target Lũy Kế Đến Ngày {selectedDayExplorer}</th>
                <th scope="col" className="py-3 px-4 text-right font-bold text-slate-900">Target Cả Tháng 31 Ngày</th>
                <th scope="col" className="py-3 px-3 text-center">Tỷ Trọng Cả Tháng</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {categories.map((c, idx) => {
                let monthTarget = 0;
                if (explorerStore === 'all') {
                  monthTarget = OFFICIAL_CATEGORY_TOTAL_TARGETS[c.name] || 0;
                } else {
                  monthTarget = OFFICIAL_STORE_CATEGORY_TARGETS[explorerStore]?.[c.name] || 0;
                }
                const dayWeight = DAILY_WEIGHTS_31_DAYS[selectedDayExplorer - 1] || 0.032;
                const cumWeight = getCumulativeWeight(selectedDayExplorer);
                const dayTarget = Math.round(monthTarget * dayWeight);
                const cumTarget = Math.round(monthTarget * cumWeight);
                const ratio = GRAND_TOTAL_CATEGORY_TARGET > 0 ? (monthTarget / (explorerStore === 'all' ? GRAND_TOTAL_CATEGORY_TARGET : (stores.find(s => s.code === explorerStore)?.base || 1))) * 100 : 0;

                return (
                  <tr key={c.id} className="hover:bg-slate-50 transition">
                    <td className="py-2.5 px-3 text-center font-bold text-slate-500">{idx + 1}</td>
                    <td className="py-2.5 px-4 font-bold text-slate-900">{c.name}</td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700">
                        {c.group}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono font-bold text-amber-700">{formatVND(dayTarget)}</td>
                    <td className="py-2.5 px-4 text-right font-mono font-black text-teal-800">{formatVND(cumTarget)}</td>
                    <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-800">{formatVND(monthTarget)}</td>
                    <td className="py-2.5 px-3 text-center font-mono text-slate-600">{ratio.toFixed(2)}%</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-amber-50 font-bold border-t-2 border-amber-300 text-xs sm:text-sm">
              <tr>
                <td colSpan={3} className="py-3 px-4 text-amber-950 uppercase font-black">
                  Tổng Cộng {explorerStore === 'all' ? 'Toàn Khu Vực' : `Siêu Thị ${explorerStore}`}:
                </td>
                <td className="py-3 px-4 text-right font-mono text-amber-900 font-black text-sm">
                  {formatVND(Math.round((explorerStore === 'all' ? GRAND_TOTAL_CATEGORY_TARGET : (stores.find(s => s.code === explorerStore)?.base || 0)) * DAILY_WEIGHTS_31_DAYS[selectedDayExplorer - 1]))}
                </td>
                <td className="py-3 px-4 text-right font-mono text-teal-950 font-black text-base">
                  {formatVND(Math.round((explorerStore === 'all' ? GRAND_TOTAL_CATEGORY_TARGET : (stores.find(s => s.code === explorerStore)?.base || 0)) * getCumulativeWeight(selectedDayExplorer)))}
                </td>
                <td className="py-3 px-4 text-right font-mono text-slate-900 font-black text-base">
                  {formatVND(explorerStore === 'all' ? GRAND_TOTAL_CATEGORY_TARGET : (stores.find(s => s.code === explorerStore)?.base || 0))}
                </td>
                <td className="py-3 px-3 text-center font-mono font-black text-amber-900">100.00%</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </section>
    </div>
  );
};
