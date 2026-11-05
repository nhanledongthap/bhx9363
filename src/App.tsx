/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import {
  SUPERMARKETS_DATA,
  SupermarketData,
  formatVND,
  OFFICIAL_OCTOBER_BASE
} from './data/supermarkets';
import { INITIAL_CATEGORIES, CategoryItem } from './data/categories';
import { RevenueChart } from './components/RevenueChart';
import { LuyKeTable } from './components/LuyKeTable';
import { RetimeTable } from './components/RetimeTable';
import { CategoryReportTab } from './components/CategoryReportTab';
import { DataUploadTab } from './components/DataUploadTab';
import { TargetManagementTab } from './components/TargetManagementTab';
import { downloadStandaloneHtml, exportCsvReport } from './utils/exportHtml';
import {
  TrendingUp,
  Clock,
  Store,
  ReceiptText,
  Search,
  Download,
  Printer,
  ChevronRight,
  Filter,
  CheckCircle2,
  Calendar,
  PlusCircle,
  RotateCcw,
  ShoppingBag,
  Layers,
  UploadCloud,
  FileCode,
  Target
} from 'lucide-react';

export default function App() {
  // Active Main Tab
  const [activeTab, setActiveTab] = useState<'stores' | 'categories' | 'targets' | 'upload'>('stores');

  // Load store data from localStorage or default (BẮT BUỘC ĐÚNG 21 SIÊU THỊ)
  const [dataList, setDataList] = useState<SupermarketData[]>(() => {
    try {
      const saved = localStorage.getItem('bhx_stores_data');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length === 21) {
          const totThucHien = parsed.reduce((sum: number, s: SupermarketData) => sum + (s.thucHien || 0), 0);
          const totToday = parsed.reduce((sum: number, s: SupermarketData) => sum + (s.tongDtToday || 0), 0);

          // TỰ ĐỘNG CHUYỂN ĐỔI SANG BỘ SỐ LIỆU CHUẨN THÁNG 11:
          // Nếu dữ liệu cũ còn lưu số 38.7 Tỷ (mock tháng 10) hoặc 6.2 Tỷ nằm ở hôm nay
          if (totThucHien > 20000000000 || totToday > 3000000000) {
            console.log("Cập nhật sang dữ liệu chuẩn Tháng 11: Lũy kế 6.205.486.038 đ, Retime 1.241.097.209 đ");
            localStorage.setItem('bhx_stores_data', JSON.stringify(SUPERMARKETS_DATA));
            return SUPERMARKETS_DATA;
          }

          return parsed.map((s: SupermarketData) => {
            const correctBase = OFFICIAL_OCTOBER_BASE[s.code] || s.base;
            const thucHien = s.thucHien || 0;
            const percentComplete = correctBase > 0 ? (thucHien / correctBase) * 100 : 0;
            const conLai = Math.max(0, correctBase - thucHien);
            return {
              ...s,
              base: correctBase,
              percentComplete,
              conLai
            };
          });
        } else {
          localStorage.removeItem('bhx_stores_data');
        }
      }
    } catch {}
    return SUPERMARKETS_DATA;
  });

  // Load category data (BẮT BUỘC ĐÚNG 17 NGÀNH HÀNG)
  const [categories, setCategories] = useState<CategoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('bhx_categories_data');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length === 17) return parsed;
        else {
          localStorage.removeItem('bhx_categories_data');
        }
      }
    } catch {}
    return INITIAL_CATEGORIES;
  });

  // Days elapsed in Nov (default 5 days)
  const [novDaysElapsed, setNovDaysElapsed] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('bhx_nov_days');
      if (saved) return parseInt(saved, 10) || 5;
    } catch {}
    return 5;
  });

  // LIVE CLOCK: Thời gian thực tự động chạy từng giây
  const [liveClock, setLiveClock] = useState<string>(() => {
    const now = new Date();
    return now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  });

  const [reportDate, setReportDate] = useState<string>(() => {
    const saved = localStorage.getItem('bhx_report_date');
    if (saved && saved !== '25/10/2026') return saved;
    const now = new Date();
    const d = String(now.getDate()).padStart(2, '0');
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const y = now.getFullYear();
    return `${d}/${m}/${y}`;
  });

  const [isLiveClock, setIsLiveClock] = useState<boolean>(true);

  // Ticking live clock
  useEffect(() => {
    if (!isLiveClock) return;
    const timer = setInterval(() => {
      const now = new Date();
      setLiveClock(now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 1000);
    return () => clearInterval(timer);
  }, [isLiveClock]);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTier, setSelectedTier] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'all' | 'chart' | 'retime' | 'luyke'>('all');

  // Sorting state for Bảng Lũy kế
  const [luyKeSort, setLuyKeSort] = useState<{
    field: 'thucHien' | 'percentComplete' | 'base' | 'conLai';
    asc: boolean;
  }>({
    field: 'thucHien',
    asc: false
  });

  // Sorting state for Bảng Retime
  const [retimeSort, setRetimeSort] = useState<{
    field: 'tongDtToday' | 'dtOfflineToday' | 'dtOnlineToday' | 'totalBillsToday';
    asc: boolean;
  }>({
    field: 'tongDtToday',
    asc: false
  });

  // Handlers for updating data
  const handleUpdateStores = (newStores: SupermarketData[], newDateStr?: string) => {
    // Fail-safe check: Doanh thu lũy kế cả tháng luôn phải lớn hơn doanh thu 1 ngày
    const totTh = newStores.reduce((sum, s) => sum + (s.thucHien || 0), 0);
    const totTd = newStores.reduce((sum, s) => sum + (s.tongDtToday || 0), 0);
    let finalStores = newStores;
    if (totTh < totTd && totTd > 1000000000) {
      console.warn("Tự động sửa lỗi đảo ngược cột: Lũy Kế < Retime Hôm Nay");
      finalStores = newStores.map(s => {
        const correctBase = OFFICIAL_OCTOBER_BASE[s.code] || s.base;
        const thucHien = Math.max(s.thucHien, s.tongDtToday);
        const tongDtToday = Math.min(s.thucHien, s.tongDtToday);
        const dtOfflineToday = tongDtToday;
        const dtOnlineToday = 0;
        const percentComplete = correctBase > 0 ? (thucHien / correctBase) * 100 : 0;
        const conLai = Math.max(0, correctBase - thucHien);
        return {
          ...s,
          thucHien,
          tongDtToday,
          dtOfflineToday,
          dtOnlineToday,
          base: correctBase,
          percentComplete,
          conLai
        };
      });
    }

    setSearchTerm('');
    setSelectedTier('all');
    setDataList([...finalStores]);
    localStorage.setItem('bhx_stores_data', JSON.stringify(finalStores));
    if (newDateStr) {
      setReportDate(newDateStr);
      localStorage.setItem('bhx_report_date', newDateStr);
    }
  };

  const handleSwapLuyKeRetime = () => {
    const swapped = dataList.map(s => {
      const correctBase = OFFICIAL_OCTOBER_BASE[s.code] || s.base;
      const thucHien = s.tongDtToday;
      const tongDtToday = s.thucHien;
      const dtOfflineToday = tongDtToday;
      const dtOnlineToday = 0;
      const percentComplete = correctBase > 0 ? (thucHien / correctBase) * 100 : 0;
      const conLai = Math.max(0, correctBase - thucHien);
      return {
        ...s,
        thucHien,
        tongDtToday,
        dtOfflineToday,
        dtOnlineToday,
        base: correctBase,
        percentComplete,
        conLai
      };
    });
    setDataList(swapped);
    localStorage.setItem('bhx_stores_data', JSON.stringify(swapped));
    alert('✅ Đã hoán đổi vị trí giữa Doanh Thu Lũy Kế và Doanh Thu Retime Hôm Nay!');
  };

  const handleUpdateCategories = (newCats: CategoryItem[]) => {
    setCategories([...newCats]);
    localStorage.setItem('bhx_categories_data', JSON.stringify(newCats));
  };

  const handleDaysElapsedChange = (days: number) => {
    setNovDaysElapsed(days);
    localStorage.setItem('bhx_nov_days', days.toString());
  };

  const handleResetDefault = () => {
    setDataList(SUPERMARKETS_DATA);
    setCategories(INITIAL_CATEGORIES);
    setNovDaysElapsed(10);
    setReportDate('25/10/2026');
    setSearchTerm('');
    setSelectedTier('all');
    localStorage.removeItem('bhx_stores_data');
    localStorage.removeItem('bhx_categories_data');
    localStorage.removeItem('bhx_nov_days');
    localStorage.removeItem('bhx_report_date');
    alert('✅ Đã reset toàn bộ dữ liệu cũ đã upload về đúng 21 siêu thị và 17 ngành hàng gốc ban đầu!');
  };

  // Download Standalone HTML
  const handleDownloadStandalone = () => {
    fetch('/bachhoaxanh_dashboard.html')
      .then(res => res.text())
      .then(html => downloadStandaloneHtml(html, 'index.html'))
      .catch(() => {
        alert('Đang tải file index.html...');
      });
  };

  // Dynamic store stats
  const dynamicStats = useMemo(() => {
    const totalThucHien = dataList.reduce((acc, cur) => acc + cur.thucHien, 0);
    const totalBase = dataList.reduce((acc, cur) => acc + cur.base, 0);
    const totalConLai = Math.max(0, totalBase - totalThucHien);
    const totalDtToday = dataList.reduce((acc, cur) => acc + cur.tongDtToday, 0);
    const totalDtOfflineToday = dataList.reduce((acc, cur) => acc + cur.dtOfflineToday, 0);
    const totalDtOnlineToday = dataList.reduce((acc, cur) => acc + cur.dtOnlineToday, 0);
    const totalBillsToday = dataList.reduce((acc, cur) => acc + cur.totalBillsToday, 0);
    const avgCompletion = totalBase > 0 ? (totalThucHien / totalBase) * 100 : 0;

    return {
      totalStores: dataList.length,
      totalThucHien,
      totalBase,
      totalConLai,
      totalDtToday,
      totalDtOfflineToday,
      totalDtOnlineToday,
      totalBillsToday,
      avgCompletion
    };
  }, [dataList]);

  // Filtered store dataset
  const filteredData = useMemo(() => {
    return dataList.filter((item) => {
      const matchTier = selectedTier === 'all' || item.tier === selectedTier;
      const q = searchTerm.trim().toLowerCase();
      const matchSearch =
        !q ||
        item.name.toLowerCase().includes(q) ||
        item.code.toLowerCase().includes(q) ||
        item.addressName.toLowerCase().includes(q) ||
        item.shortName.toLowerCase().includes(q);
      return matchTier && matchSearch;
    });
  }, [dataList, selectedTier, searchTerm]);

  // Sorted stores for Lũy kế
  const sortedLuyKeData = useMemo(() => {
    return [...filteredData].sort((a, b) => {
      let valA = a[luyKeSort.field];
      let valB = b[luyKeSort.field];
      if (valA < valB) return luyKeSort.asc ? -1 : 1;
      if (valA > valB) return luyKeSort.asc ? 1 : -1;
      return 0;
    });
  }, [filteredData, luyKeSort]);

  // Sorted stores for Retime
  const sortedRetimeData = useMemo(() => {
    return [...filteredData].sort((a, b) => {
      let valA = a[retimeSort.field];
      let valB = b[retimeSort.field];
      if (valA < valB) return retimeSort.asc ? -1 : 1;
      if (valA > valB) return retimeSort.asc ? 1 : -1;
      return 0;
    });
  }, [filteredData, retimeSort]);

  return (
    <div className="min-h-screen flex flex-col bg-[#F4F7F5] text-slate-800 font-sans selection:bg-[#FFC700] selection:text-[#005427]">
      {/* BRAND HEADER */}
      <header className="bg-gradient-to-r from-[#005427] via-[#007738] to-[#028c46] text-white shadow-md border-b-4 border-[#FFC700] sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20 py-2">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#FFC700] rounded-xl flex items-center justify-center shadow-md text-[#005427] font-extrabold text-lg sm:text-2xl tracking-tight flex-shrink-0 ring-2 ring-yellow-400/50">
                <span>BHX</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] sm:text-xs font-bold tracking-widest text-[#FFC700] uppercase">
                    BÁCH HÓA XANH
                  </span>
                  <span className="text-xs text-emerald-200">·</span>
                  <span className="text-[11px] sm:text-xs font-semibold text-emerald-100">
                    Khu Vực An Giang ({dataList.length} Siêu Thị)
                  </span>
                </div>
                <h1 className="text-sm sm:text-lg lg:text-xl font-bold tracking-tight text-white leading-tight">
                  Báo Cáo Doanh Thu Siêu Thị & Phân Tích Ngành Hàng
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={handleResetDefault}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-500/80 hover:bg-rose-600 text-white transition border border-rose-300/40 shadow-xs"
                title="Khôi phục toàn bộ dữ liệu về 21 siêu thị và 17 ngành hàng gốc ban đầu"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden lg:inline">Reset Về 21 Siêu Thị</span>
                <span className="lg:hidden">Reset</span>
              </button>

              <button
                onClick={handleDownloadStandalone}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-white/10 hover:bg-white/20 text-white transition border border-white/20 shadow-xs"
                title="Tải file HTML hoàn chỉnh để đưa thẳng lên GitHub Pages"
              >
                <Download className="w-4 h-4 text-[#FFC700]" />
                <span className="hidden md:inline">Tải File index.html (GitHub Pages)</span>
                <span className="md:hidden">Tải HTML</span>
              </button>

              <button
                onClick={() => setActiveTab('upload')}
                className="inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-lg text-xs font-bold bg-[#FFC700] text-[#005427] hover:bg-yellow-300 transition shadow-xs ring-2 ring-yellow-400/40"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Cập Nhật Data</span>
              </button>

              <button
                onClick={() => window.print()}
                className="no-print hidden sm:inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-white/10 hover:bg-white/20 text-white transition border border-white/20"
              >
                <Printer className="w-4 h-4" />
                <span>In</span>
              </button>
            </div>
          </div>

          {/* MAIN TABS NAVIGATION */}
          <nav className="flex items-center space-x-2 pt-1 pb-2 overflow-x-auto no-print">
            <button
              onClick={() => setActiveTab('stores')}
              className={`flex items-center gap-2 px-4 py-2 rounded-t-lg font-bold text-xs sm:text-sm border-b-2 transition ${
                activeTab === 'stores'
                  ? 'bg-white text-[#005427] border-[#FFC700] shadow-xs'
                  : 'text-emerald-100 hover:text-white hover:bg-white/10 border-transparent'
              }`}
            >
              <Store className="w-4 h-4" />
              <span>Tab 1: Doanh Thu Siêu Thị</span>
            </button>

            <button
              onClick={() => setActiveTab('categories')}
              className={`flex items-center gap-2 px-4 py-2 rounded-t-lg font-bold text-xs sm:text-sm border-b-2 transition ${
                activeTab === 'categories'
                  ? 'bg-white text-[#005427] border-[#FFC700] shadow-xs'
                  : 'text-emerald-100 hover:text-white hover:bg-white/10 border-transparent'
              }`}
            >
              <ShoppingBag className="w-4 h-4 text-[#FFC700]" />
              <span>Tab 2: Doanh Thu Theo Ngành Hàng (17 Ngành)</span>
            </button>

            <button
              onClick={() => setActiveTab('targets')}
              className={`flex items-center gap-2 px-4 py-2 rounded-t-lg font-bold text-xs sm:text-sm border-b-2 transition ${
                activeTab === 'targets'
                  ? 'bg-white text-[#005427] border-[#FFC700] shadow-xs'
                  : 'text-emerald-100 hover:text-white hover:bg-white/10 border-transparent'
              }`}
            >
              <Target className="w-4 h-4 text-amber-300" />
              <span>Tab 3: Cập Nhật Target (Mục Tiêu)</span>
              <span className="bg-[#FFC700] text-[#005427] text-[10px] font-extrabold px-1.5 py-0.2 rounded-full uppercase">
                Mới
              </span>
            </button>

            <button
              onClick={() => setActiveTab('upload')}
              className={`flex items-center gap-2 px-4 py-2 rounded-t-lg font-bold text-xs sm:text-sm border-b-2 transition ${
                activeTab === 'upload'
                  ? 'bg-white text-[#005427] border-[#FFC700] shadow-xs'
                  : 'text-emerald-100 hover:text-white hover:bg-white/10 border-transparent'
              }`}
            >
              <UploadCloud className="w-4 h-4 text-emerald-300" />
              <span>Tab 4: Cập Nhật Data Thực Hiện</span>
            </button>
          </nav>
        </div>
      </header>

      {/* SUB-HEADER / NOTIFICATION BANNER */}
      <div className="bg-emerald-900/10 border-b border-emerald-900/15 py-1.5 px-4 text-xs text-slate-700">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
            </span>
            <span className="font-semibold text-[#005427]">Dữ liệu Retime trực tiếp:</span>
            <span className="font-mono font-bold text-emerald-900 bg-white/80 px-2 py-0.5 rounded border border-emerald-300 shadow-2xs flex items-center gap-1.5">
              <span>⏰ {liveClock}</span>
              <span className="text-slate-400">·</span>
              <span>Ngày {reportDate}</span>
            </span>
            <button
              onClick={() => {
                const newD = prompt('Nhập ngày hiển thị báo cáo (ví dụ: 05/11/2026):', reportDate);
                if (newD) {
                  setReportDate(newD);
                  localStorage.setItem('bhx_report_date', newD);
                }
              }}
              className="text-[11px] text-[#007738] font-bold hover:underline"
              title="Đổi ngày báo cáo"
            >
              [✎ Đổi ngày]
            </button>
          </div>
          <div className="flex items-center gap-3 text-slate-500 font-medium">
            <span>Tiến độ hoàn thành: <b className="text-slate-800 font-mono">{dynamicStats.avgCompletion.toFixed(2)}%</b></span>
            <span>·</span>
            <span className="text-[#007738] font-semibold">{dataList.length}/{dataList.length} Điểm bán kết nối POS</span>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

        {/* TAB 1: STORE OVERVIEW & TABLES */}
        {activeTab === 'stores' && (
          <div className="space-y-6">
            {/* 4 KPI CARDS */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-bold uppercase tracking-wider text-[#005427] flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#007738]"></span>
                  Tổng quan chỉ số kinh doanh toàn khu vực
                </h2>
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <span>Cập nhật lúc: <b className="font-mono text-slate-700">{liveClock} · {reportDate}</b></span>
                  <button
                    onClick={handleSwapLuyKeRetime}
                    className="text-amber-800 bg-amber-100/80 hover:bg-amber-200 border border-amber-300 font-semibold px-2 py-0.5 rounded transition flex items-center gap-1 shadow-2xs"
                    title="Đổi chỗ giữa Doanh thu Lũy kế và Doanh thu Retime Hôm nay nếu file tải lên bị nhận diện ngược"
                  >
                    <span>⇄</span>
                    <span>Đổi chỗ Lũy Kế ⇄ Hôm Nay</span>
                  </button>
                  <button onClick={() => setActiveTab('upload')} className="text-[#007738] font-semibold hover:underline">
                    [Đổi dữ liệu mới]
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Card 1: Tổng Lũy Kế */}
                <div className="bg-white rounded-xl p-4 shadow-sm border border-emerald-900/10 hover:shadow-md transition">
                  <div className="flex items-center justify-between text-slate-500 mb-1.5">
                    <span className="text-xs font-semibold tracking-wide uppercase text-slate-600">Tổng DT Lũy Kế</span>
                    <span className="p-1.5 bg-emerald-50 text-[#007738] rounded-lg">
                      <TrendingUp className="w-4 h-4" />
                    </span>
                  </div>
                  <div className="text-xl sm:text-2xl font-extrabold text-[#005427] font-mono tracking-tight">
                    {formatVND(dynamicStats.totalThucHien)}
                  </div>
                  <div className="mt-2.5 pt-2 border-t border-slate-100 space-y-1 text-xs text-slate-600">
                    <div className="flex items-center justify-between">
                      <span>Base: <b className="font-mono text-slate-700">{formatVND(dynamicStats.totalBase)}</b></span>
                      <span className="font-bold text-[#007738] bg-emerald-50 px-2 py-0.5 rounded text-[11px]">
                        {dynamicStats.avgCompletion.toFixed(2)}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] pt-0.5 border-t border-slate-50">
                      <span className="text-slate-500 font-medium">Còn lại hoàn thành Base:</span>
                      <span className="font-mono font-bold text-rose-600">{formatVND(dynamicStats.totalConLai)}</span>
                    </div>
                  </div>
                </div>

                {/* Card 2: Retime Hôm Nay */}
                <div className="bg-white rounded-xl p-4 shadow-sm border border-emerald-900/10 hover:shadow-md transition">
                  <div className="flex items-center justify-between text-slate-500 mb-1.5">
                    <span className="text-xs font-semibold tracking-wide uppercase text-slate-600">Doanh Thu Retime Hôm Nay</span>
                    <span className="p-1.5 bg-amber-50 text-amber-700 rounded-lg">
                      <Clock className="w-4 h-4" />
                    </span>
                  </div>
                  <div className="text-xl sm:text-2xl font-extrabold text-amber-700 font-mono tracking-tight">
                    {formatVND(dynamicStats.totalDtToday)}
                  </div>
                  <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                    <span>Offline: <b className="font-mono text-slate-700">{(dynamicStats.totalDtOfflineToday / 1000000).toFixed(1)} Tr</b></span>
                    <span>Online: <b className="font-mono text-emerald-700">{(dynamicStats.totalDtOnlineToday / 1000000).toFixed(1)} Tr</b></span>
                  </div>
                </div>

                {/* Card 3: Số Siêu Thị Hoạt Động */}
                <div className="bg-white rounded-xl p-4 shadow-sm border border-emerald-900/10 hover:shadow-md transition">
                  <div className="flex items-center justify-between text-slate-500 mb-1.5">
                    <span className="text-xs font-semibold tracking-wide uppercase text-slate-600">Siêu Thị Hoạt Động</span>
                    <span className="p-1.5 bg-emerald-50 text-[#007738] rounded-lg">
                      <Store className="w-4 h-4" />
                    </span>
                  </div>
                  <div className="text-xl sm:text-2xl font-extrabold text-[#005427] font-mono tracking-tight">
                    {dataList.length} / {dataList.length} <span className="text-sm font-normal text-slate-500">Điểm bán</span>
                  </div>
                  <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                    <span className="text-[#007738] font-semibold">100% Đang hoạt động</span>
                    <span className="text-slate-500">An Giang</span>
                  </div>
                </div>

                {/* Card 4: Tổng Bills */}
                <div className="bg-white rounded-xl p-4 shadow-sm border border-emerald-900/10 hover:shadow-md transition">
                  <div className="flex items-center justify-between text-slate-500 mb-1.5">
                    <span className="text-xs font-semibold tracking-wide uppercase text-slate-600">Tổng Bill Hôm Nay</span>
                    <span className="p-1.5 bg-emerald-50 text-[#007738] rounded-lg">
                      <ReceiptText className="w-4 h-4" />
                    </span>
                  </div>
                  <div className="text-xl sm:text-2xl font-extrabold text-slate-900 font-mono tracking-tight">
                    {dynamicStats.totalBillsToday.toLocaleString('vi-VN')} <span className="text-sm font-normal text-slate-500">Hóa đơn</span>
                  </div>
                  <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                    <span>Trung bình / Siêu thị:</span>
                    <span className="font-mono font-bold text-[#007738]">
                      {dataList.length > 0 ? Math.round(dynamicStats.totalBillsToday / dataList.length) : 0} bills/ngày
                    </span>
                  </div>
                </div>
              </div>
            </section>

            {/* SEARCH & FILTERS */}
            <section className="bg-white rounded-xl p-3 sm:p-4 shadow-sm border border-emerald-900/10 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Tìm tên siêu thị hoặc mã ĐN (vd: 6119, Tri Tôn)..."
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#007738] focus:bg-white transition"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-slate-500">Loại Kho:</span>
                <button
                  onClick={() => setSelectedTier('all')}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium ${selectedTier === 'all' ? 'bg-[#007738] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                >
                  Tất cả
                </button>
                <button
                  onClick={() => setSelectedTier('5 Tỷ -> <8 Tỷ')}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium ${selectedTier === '5 Tỷ -> <8 Tỷ' ? 'bg-[#007738] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                >
                  5 - 8 Tỷ
                </button>
                <button
                  onClick={() => setSelectedTier('3 Tỷ -> <5 Tỷ')}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium ${selectedTier === '3 Tỷ -> <5 Tỷ' ? 'bg-[#007738] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                >
                  3 - 5 Tỷ
                </button>
                <button
                  onClick={() => setSelectedTier('1.2 Tỷ -> <2 Tỷ')}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium ${selectedTier === '1.2 Tỷ -> <2 Tỷ' ? 'bg-[#007738] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                >
                  1.2 - 2 Tỷ
                </button>
              </div>

              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg text-xs font-semibold self-start md:self-auto">
                <button
                  onClick={() => setViewMode('all')}
                  className={`px-2.5 py-1 rounded-md transition ${viewMode === 'all' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  Tất Cả 3 Bảng
                </button>
                <button
                  onClick={() => setViewMode('chart')}
                  className={`px-2.5 py-1 rounded-md transition ${viewMode === 'chart' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  Bảng 1 (Biểu Đồ)
                </button>
                <button
                  onClick={() => setViewMode('retime')}
                  className={`px-2.5 py-1 rounded-md transition ${viewMode === 'retime' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  Bảng 2 (Retime)
                </button>
                <button
                  onClick={() => setViewMode('luyke')}
                  className={`px-2.5 py-1 rounded-md transition ${viewMode === 'luyke' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  Bảng 3 (Lũy Kế)
                </button>
              </div>
            </section>

            {/* 3 TABLES */}
            <div className="space-y-6">
              {(viewMode === 'all' || viewMode === 'chart') && (
                <RevenueChart data={filteredData} />
              )}

              {(viewMode === 'all' || viewMode === 'retime') && (
                <RetimeTable
                  data={sortedRetimeData}
                  reportDate={reportDate}
                  sortField={retimeSort.field}
                  sortAsc={retimeSort.asc}
                  onSort={(field: 'tongDtToday' | 'dtOfflineToday' | 'dtOnlineToday' | 'totalBillsToday') =>
                    setRetimeSort((prev) => ({
                      field,
                      asc: prev.field === field ? !prev.asc : false
                    }))
                  }
                />
              )}

              {(viewMode === 'all' || viewMode === 'luyke') && (
                <LuyKeTable
                  data={sortedLuyKeData}
                  reportDate={reportDate}
                  sortField={luyKeSort.field}
                  sortAsc={luyKeSort.asc}
                  onSort={(field: 'thucHien' | 'percentComplete' | 'base' | 'conLai') =>
                    setLuyKeSort((prev) => ({
                      field,
                      asc: prev.field === field ? !prev.asc : false
                    }))
                  }
                />
              )}
            </div>
          </div>
        )}

        {/* TAB 2: CATEGORY REPORT TAB */}
        {activeTab === 'categories' && (
          <CategoryReportTab
            categories={categories}
            stores={dataList}
            novDaysElapsed={novDaysElapsed}
            onDaysElapsedChange={handleDaysElapsedChange}
          />
        )}

        {/* TAB 3: TARGET MANAGEMENT TAB (NEW) */}
        {activeTab === 'targets' && (
          <TargetManagementTab
            stores={dataList}
            categories={categories}
            onUpdateStores={handleUpdateStores}
            onUpdateCategories={handleUpdateCategories}
            onSwitchTab={setActiveTab}
          />
        )}

        {/* TAB 4: DATA UPLOAD TAB (ACTUAL REVENUE) */}
        {activeTab === 'upload' && (
          <DataUploadTab
            onUpdateStores={handleUpdateStores}
            onUpdateCategories={handleUpdateCategories}
            onResetDefault={handleResetDefault}
            onSwitchTab={setActiveTab}
            currentStores={dataList}
            currentCategories={categories}
          />
        )}

      </main>

      {/* FOOTER */}
      <footer className="mt-auto bg-slate-800 text-slate-300 py-6 border-t border-slate-700 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-md bg-[#FFC700] text-[#005427] font-extrabold flex items-center justify-center text-xs">
              BHX
            </span>
            <span className="font-bold text-white">Bách Hóa Xanh Dashboard</span>
            <span className="text-slate-500">|</span>
            <span>Hệ thống báo cáo kinh doanh 21 Siêu thị khu vực An Giang</span>
          </div>
          <div className="text-slate-400 text-center sm:text-right">
            Hỗ trợ xem trên máy tính & điện thoại · Tối ưu xuất bản GitHub Pages
          </div>
        </div>
      </footer>
    </div>
  );
}
