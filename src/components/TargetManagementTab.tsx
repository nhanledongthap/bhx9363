import React, { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { SupermarketData, OFFICIAL_OCTOBER_BASE, OFFICIAL_STORE_NAMES, formatVND } from '../data/supermarkets';
import { CategoryItem, OFFICIAL_17_CATEGORIES, normalizeCategoryName } from '../data/categories';
import { 
  OFFICIAL_STORE_CATEGORY_TARGETS, 
  OFFICIAL_CATEGORY_TOTAL_TARGETS, 
  GRAND_TOTAL_CATEGORY_TARGET 
} from '../data/categoryTargetsData';
import { 
  Target, 
  UploadCloud, 
  FileSpreadsheet, 
  Edit3, 
  CheckCircle2, 
  AlertCircle, 
  Download, 
  RotateCcw, 
  Save, 
  Store, 
  ShoppingBag, 
  Layers, 
  Percent, 
  Sparkles,
  ArrowRight,
  TrendingUp,
  Search
} from 'lucide-react';

interface TargetManagementTabProps {
  stores: SupermarketData[];
  categories: CategoryItem[];
  onUpdateStores: (newStores: SupermarketData[]) => void;
  onUpdateCategories: (newCategories: CategoryItem[]) => void;
  onSwitchTab: (tab: 'stores' | 'categories' | 'targets' | 'upload') => void;
}

export const TargetManagementTab: React.FC<TargetManagementTabProps> = ({
  stores,
  categories,
  onUpdateStores,
  onUpdateCategories,
  onSwitchTab
}) => {
  const [activeSubSection, setActiveSubSection] = useState<'manual-stores' | 'upload-excel' | 'manual-cats'>('manual-stores');
  const [alert, setAlert] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [storeSearch, setStoreSearch] = useState('');

  // Editable store targets state: map of code -> newBase number
  const [editedStoreBases, setEditedStoreBases] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    stores.forEach(s => {
      initial[s.code] = s.base;
    });
    return initial;
  });

  // Editable category targets state: map of catId -> newTarget number
  const [editedCatTargets, setEditedCatTargets] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    categories.forEach(c => {
      initial[c.id] = c.targetNov || c.octFull;
    });
    return initial;
  });

  // File upload states
  const [targetStoreFile, setTargetStoreFile] = useState<File | null>(null);
  const [parsedStoreTargets, setParsedStoreTargets] = useState<{ code: string; name: string; oldBase: number; newBase: number }[] | null>(null);

  const [targetCatFile, setTargetCatFile] = useState<File | null>(null);
  const [parsedCatTargets, setParsedCatTargets] = useState<{ id: string; name: string; oldTarget: number; newTarget: number }[] | null>(null);

  const [dualStoreFile, setDualStoreFile] = useState<File | null>(null);
  const [dualCatFile, setDualCatFile] = useState<File | null>(null);

  // Helper number parser
  const parseNum = (v: any) => {
    if (!v) return 0;
    const n = parseFloat(String(v).replace(/[^0-9.-]/g, ''));
    return isNaN(n) ? 0 : Math.round(n);
  };

  // Common Reader
  const readWorkbook = (file: File, callback: (rows: any[][]) => void) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const buffer = e.target?.result as ArrayBuffer;
        const workbook = XLSX.read(buffer, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rawRows = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1, defval: '' });
        callback(rawRows);
      } catch (err: any) {
        setAlert({ type: 'error', message: 'Lỗi đọc file Excel: ' + err.message });
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // --- PARSE TARGET STORE FILE ---
  const handleParseStoreTargetFile = (file: File) => {
    readWorkbook(file, (rows) => {
      try {
        const valid = rows.filter(r => r && r.length > 0 && r.some(c => c !== '' && c !== null));
        if (valid.length < 2) throw new Error('File Target Siêu thị không đủ dòng dữ liệu');

        let colCode = -1, colName = -1, colTarget = -1;
        let headerIdx = -1;

        for (let i = 0; i < Math.min(10, valid.length); i++) {
          const row = valid[i].map(c => String(c).toLowerCase().trim());
          row.forEach((cell, idx) => {
            if (cell.includes('mã siêu thị') || cell.includes('ma sieu thi') || cell.includes('mã') || cell.includes('code')) colCode = idx;
            if (cell.includes('tên siêu thị') || cell.includes('ten sieu thi') || cell.includes('tên') || cell.includes('siêu thị')) colName = idx;
            if (cell.includes('target') || cell.includes('base') || cell.includes('chỉ tiêu') || cell.includes('mục tiêu') || cell.includes('kế hoạch')) colTarget = idx;
          });
          if (colCode !== -1 && colTarget !== -1) {
            headerIdx = i;
            break;
          }
        }

        if (colCode === -1) {
          // fallback first column is code, second or third is target
          colCode = 0;
          colTarget = valid[0].length > 2 ? 2 : 1;
          headerIdx = 0;
        }

        const start = headerIdx >= 0 ? headerIdx + 1 : 0;
        const parsedList: { code: string; name: string; oldBase: number; newBase: number }[] = [];

        for (let i = start; i < valid.length; i++) {
          const row = valid[i];
          const rawCode = colCode >= 0 ? String(row[colCode] || '').trim() : '';
          const match = rawCode.match(/\d{4,5}/);
          const code = match ? match[0] : rawCode;
          if (!code) continue;

          const existingStore = stores.find(s => s.code === code);
          const oldBase = existingStore ? existingStore.base : (OFFICIAL_OCTOBER_BASE[code] || 0);
          const newBase = colTarget >= 0 ? parseNum(row[colTarget]) : 0;
          const storeName = OFFICIAL_STORE_NAMES[code] || (colName >= 0 && row[colName] ? String(row[colName]) : existingStore?.name || `Siêu thị ${code}`);

          if (newBase > 0) {
            parsedList.push({
              code,
              name: storeName,
              oldBase,
              newBase
            });
          }
        }

        if (parsedList.length === 0) {
          throw new Error('Không trích xuất được dòng dữ liệu Target Siêu Thị hợp lệ.');
        }

        setParsedStoreTargets(parsedList);
        setAlert({
          type: 'info',
          message: `Đã phân tích thành công ${parsedList.length} siêu thị từ file Target Siêu Thị. Nhấn nút "Cập Nhật Target Siêu Thị" bên dưới để áp dụng.`
        });
      } catch (err: any) {
        setAlert({ type: 'error', message: err.message });
        setParsedStoreTargets(null);
      }
    });
  };

  // --- PARSE TARGET CATEGORY FILE ---
  const handleParseCatTargetFile = (file: File) => {
    readWorkbook(file, (rows) => {
      try {
        const valid = rows.filter(r => r && r.length > 0 && r.some(c => c !== '' && c !== null));
        if (valid.length < 2) throw new Error('File Target Ngành Hàng không đủ dòng dữ liệu');

        let colName = -1, colTarget = -1;
        let headerIdx = -1;

        for (let i = 0; i < Math.min(10, valid.length); i++) {
          const row = valid[i].map(c => String(c).toLowerCase().trim());
          row.forEach((cell, idx) => {
            if (cell.includes('ngành hàng') || cell.includes('nganh hang') || cell.includes('tên ngành') || cell.includes('danh mục')) colName = idx;
            if (cell.includes('target') || cell.includes('chỉ tiêu') || cell.includes('mục tiêu') || cell.includes('kế hoạch') || cell.includes('base')) colTarget = idx;
          });
          if (colName !== -1 && colTarget !== -1) {
            headerIdx = i;
            break;
          }
        }

        if (colName === -1) {
          colName = 0;
          colTarget = valid[0].length > 1 ? 1 : 0;
          headerIdx = 0;
        }

        const start = headerIdx >= 0 ? headerIdx + 1 : 0;
        const targetMap: Record<string, number> = {};

        for (let i = start; i < valid.length; i++) {
          const row = valid[i];
          const rawName = colName >= 0 ? String(row[colName] || '').trim() : '';
          if (!rawName) continue;

          const matchedOfficial = normalizeCategoryName(rawName);
          if (matchedOfficial) {
            const val = colTarget >= 0 ? parseNum(row[colTarget]) : 0;
            if (val > 0) {
              targetMap[matchedOfficial] = val;
            }
          }
        }

        const parsedList: { id: string; name: string; oldTarget: number; newTarget: number }[] = [];
        categories.forEach(cat => {
          if (targetMap[cat.name]) {
            parsedList.push({
              id: cat.id,
              name: cat.name,
              oldTarget: cat.targetNov || cat.octFull,
              newTarget: targetMap[cat.name]
            });
          }
        });

        if (parsedList.length === 0) {
          throw new Error('Không khớp được ngành hàng nào trong 17 ngành hàng BHX chuẩn.');
        }

        setParsedCatTargets(parsedList);
        setAlert({
          type: 'info',
          message: `Đã phân tích thành công Target cho ${parsedList.length}/17 ngành hàng. Nhấn nút "Cập Nhật Target Ngành Hàng" bên dưới để áp dụng.`
        });
      } catch (err: any) {
        setAlert({ type: 'error', message: err.message });
        setParsedCatTargets(null);
      }
    });
  };

  // --- APPLY STORE TARGETS FROM PARSED FILE ---
  const applyStoreTargetsFromFile = () => {
    if (!parsedStoreTargets || parsedStoreTargets.length === 0) return;

    const targetMap: Record<string, number> = {};
    parsedStoreTargets.forEach(item => {
      targetMap[item.code] = item.newBase;
    });

    const updatedStores = stores.map(store => {
      if (targetMap[store.code]) {
        const newBase = targetMap[store.code];
        const thucHien = store.thucHien;
        const percentComplete = newBase > 0 ? (thucHien / newBase) * 100 : 0;
        const conLai = Math.max(0, newBase - thucHien);
        return {
          ...store,
          base: newBase,
          percentComplete,
          conLai
        };
      }
      return store;
    });

    onUpdateStores(updatedStores);
    
    // Update local edit state
    const newEdits = { ...editedStoreBases };
    parsedStoreTargets.forEach(item => {
      newEdits[item.code] = item.newBase;
    });
    setEditedStoreBases(newEdits);

    setAlert({
      type: 'success',
      message: `Đã cập nhật thành công Target Base cho ${parsedStoreTargets.length} siêu thị từ file Excel! Bảng và biểu đồ đã tự động tính lại.`
    });
    setParsedStoreTargets(null);
    setTargetStoreFile(null);
  };

  // --- APPLY CATEGORY TARGETS FROM PARSED FILE ---
  const applyCatTargetsFromFile = () => {
    if (!parsedCatTargets || parsedCatTargets.length === 0) return;

    const targetMap: Record<string, number> = {};
    parsedCatTargets.forEach(item => {
      targetMap[item.name] = item.newTarget;
    });

    const updatedCategories = categories.map(cat => {
      if (targetMap[cat.name]) {
        return {
          ...cat,
          targetNov: targetMap[cat.name]
        };
      }
      return cat;
    });

    onUpdateCategories(updatedCategories);

    // Update local edit state
    const newEdits = { ...editedCatTargets };
    parsedCatTargets.forEach(item => {
      newEdits[item.id] = item.newTarget;
    });
    setEditedCatTargets(newEdits);

    setAlert({
      type: 'success',
      message: `Đã cập nhật thành công Target cho ${parsedCatTargets.length} ngành hàng từ file Excel!`
    });
    setParsedCatTargets(null);
    setTargetCatFile(null);
  };

  // --- MANUAL STORE TARGET CHANGE ---
  const handleStoreBaseChange = (code: string, value: number) => {
    setEditedStoreBases(prev => ({
      ...prev,
      [code]: Math.max(0, value)
    }));
  };

  // Quick adjust single store by percent
  const adjustSingleStorePercent = (code: string, percent: number) => {
    setEditedStoreBases(prev => {
      const current = prev[code] || 0;
      const updated = Math.round(current * (1 + percent / 100));
      return {
        ...prev,
        [code]: Math.max(0, updated)
      };
    });
  };

  // Batch adjust all 21 stores by percent
  const batchAdjustAllStores = (percent: number) => {
    setEditedStoreBases(prev => {
      const next: Record<string, number> = {};
      Object.keys(prev).forEach(code => {
        next[code] = Math.round(prev[code] * (1 + percent / 100));
      });
      return next;
    });
    setAlert({
      type: 'info',
      message: `Đã điều chỉnh nhanh tất cả siêu thị ${percent >= 0 ? '+' : ''}${percent}%. Nhấn "Lưu Target Siêu Thị" để áp dụng chính thức.`
    });
  };

  // Save manual store targets
  const saveManualStoreTargets = () => {
    const updatedStores = stores.map(store => {
      const newBase = editedStoreBases[store.code] !== undefined ? editedStoreBases[store.code] : store.base;
      const thucHien = store.thucHien;
      const percentComplete = newBase > 0 ? (thucHien / newBase) * 100 : 0;
      const conLai = Math.max(0, newBase - thucHien);
      return {
        ...store,
        base: newBase,
        percentComplete,
        conLai
      };
    });

    onUpdateStores(updatedStores);
    setAlert({
      type: 'success',
      message: 'Đã lưu thành công Target Base cho toàn bộ 21 siêu thị! Toàn bộ biểu đồ và báo cáo đã được cập nhật.'
    });
  };

  // Reset store targets to official October base
  const resetToOfficialStoreBases = () => {
    const updatedStores = stores.map(store => {
      const official = OFFICIAL_OCTOBER_BASE[store.code] || store.base;
      const thucHien = store.thucHien;
      const percentComplete = official > 0 ? (thucHien / official) * 100 : 0;
      const conLai = Math.max(0, official - thucHien);
      return {
        ...store,
        base: official,
        percentComplete,
        conLai
      };
    });

    const resetEdits: Record<string, number> = {};
    stores.forEach(s => {
      resetEdits[s.code] = OFFICIAL_OCTOBER_BASE[s.code] || s.base;
    });
    setEditedStoreBases(resetEdits);

    onUpdateStores(updatedStores);
    setAlert({
      type: 'info',
      message: 'Đã khôi phục Target Base chuẩn Tháng 10 ban đầu (Tổng 42.733.168.495 đ) cho 21 siêu thị!'
    });
  };

  // Save manual category targets
  const handleCatTargetChange = (catId: string, val: number) => {
    setEditedCatTargets(prev => ({
      ...prev,
      [catId]: Math.max(0, val)
    }));
  };

  const saveManualCategoryTargets = () => {
    const updated = categories.map(cat => ({
      ...cat,
      targetNov: editedCatTargets[cat.id] !== undefined ? editedCatTargets[cat.id] : (cat.targetNov || cat.octFull)
    }));

    onUpdateCategories(updated);
    setAlert({
      type: 'success',
      message: 'Đã lưu thành công Target Tháng 11 cho toàn bộ 17 ngành hàng!'
    });
  };

  // Reset category targets
  const resetCategoryTargets = () => {
    const updated = categories.map(cat => ({
      ...cat,
      targetNov: cat.octFull // default to October full revenue
    }));

    const resetEdits: Record<string, number> = {};
    categories.forEach(c => {
      resetEdits[c.id] = c.octFull;
    });
    setEditedCatTargets(resetEdits);

    onUpdateCategories(updated);
    setAlert({
      type: 'info',
      message: 'Đã khôi phục Target 17 ngành hàng về bằng tổng doanh thu Tháng 10!'
    });
  };

  // NẠP DỮ LIỆU TARGET CHUẨN 38.4 TỶ (21 SIÊU THỊ x 17 NGÀNH HÀNG x 31 NGÀY)
  const loadOfficial38BTargetData = () => {
    // 1. Update Category Targets to official totals (Sum = 38,428,573,273 đ)
    const updatedCats = categories.map(cat => ({
      ...cat,
      targetNov: OFFICIAL_CATEGORY_TOTAL_TARGETS[cat.name] || cat.targetNov
    }));
    const newCatEdits: Record<string, number> = {};
    updatedCats.forEach(c => {
      newCatEdits[c.id] = c.targetNov;
    });
    setEditedCatTargets(newCatEdits);
    onUpdateCategories(updatedCats);

    // 2. Update Store Bases to sum of 17 category targets from the pivot table
    const newStoreEdits: Record<string, number> = {};
    const updatedStores = stores.map(store => {
      const storeTargets = OFFICIAL_STORE_CATEGORY_TARGETS[store.code] || {};
      const calculatedStoreBase = Object.values(storeTargets).reduce((a, b) => a + b, 0);
      const targetToUse = calculatedStoreBase > 0 ? calculatedStoreBase : store.base;
      newStoreEdits[store.code] = targetToUse;
      const thucHien = store.thucHien;
      const percentComplete = targetToUse > 0 ? (thucHien / targetToUse) * 100 : 0;
      const conLai = Math.max(0, targetToUse - thucHien);
      return {
        ...store,
        base: targetToUse,
        percentComplete,
        conLai
      };
    });
    setEditedStoreBases(newStoreEdits);
    onUpdateStores(updatedStores);

    setAlert({
      type: 'success',
      message: `⚡ Đã nạp thành công bộ dữ liệu Target chuẩn 38.428.573.273 đ (21 Siêu Thị x 17 Ngành Hàng x 31 Ngày)! Toàn bộ hệ số đối soát đã được áp dụng.`
    });
  };

  // Calculations for totals
  const totalCurrentBase = useMemo(() => stores.reduce((s, st) => s + st.base, 0), [stores]);
  const totalEditedBase = useMemo(() => {
    return stores.reduce((s, st) => s + (editedStoreBases[st.code] !== undefined ? editedStoreBases[st.code] : st.base), 0);
  }, [stores, editedStoreBases]);
  const totalThucHien = useMemo(() => stores.reduce((s, st) => s + st.thucHien, 0), [stores]);
  const projectedPercent = totalEditedBase > 0 ? (totalThucHien / totalEditedBase) * 100 : 0;

  const totalCatTarget = useMemo(() => {
    return categories.reduce((s, c) => s + (editedCatTargets[c.id] !== undefined ? editedCatTargets[c.id] : (c.targetNov || c.octFull)), 0);
  }, [categories, editedCatTargets]);

  // Filtered stores for manual table
  const filteredStores = useMemo(() => {
    const q = storeSearch.trim().toLowerCase();
    if (!q) return stores;
    return stores.filter(s => 
      s.code.toLowerCase().includes(q) ||
      s.name.toLowerCase().includes(q) ||
      (OFFICIAL_STORE_NAMES[s.code] || '').toLowerCase().includes(q)
    );
  }, [stores, storeSearch]);

  // Download Sample Excel Templates
  const downloadStoreTargetTemplate = () => {
    const sample = stores.map(s => ({
      "Mã siêu thị": s.code,
      "Tên siêu thị": OFFICIAL_STORE_NAMES[s.code] || s.name,
      "Phân khúc": s.tier,
      "Target Base (VNĐ)": s.base
    }));
    const ws = XLSX.utils.json_to_sheet(sample);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Target_Sieu_Thi");
    XLSX.writeFile(wb, "Template_Target_Sieu_Thi_BHX.xlsx");
  };

  const downloadCategoryTargetTemplate = () => {
    const sample = OFFICIAL_17_CATEGORIES.map((catName, idx) => {
      const found = categories.find(c => c.name === catName);
      return {
        "STT": idx + 1,
        "Ngành hàng BHX": catName,
        "Phân nhóm": found?.group || "Khác",
        "Target Tháng 11 (VNĐ)": found?.targetNov || found?.octFull || 2000000000
      };
    });
    const ws = XLSX.utils.json_to_sheet(sample);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Target_Nganh_Hang");
    XLSX.writeFile(wb, "Template_Target_Nganh_Hang_BHX.xlsx");
  };

  return (
    <div className="space-y-6">
      {/* HEADER BANNER */}
      <section className="bg-white rounded-xl p-4 sm:p-5 shadow-sm border border-emerald-900/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1">
              <Target className="w-3.5 h-3.5" />
              Chỉ Tiêu & Kế Hoạch
            </span>
            <span className="text-xs text-slate-500 font-medium">Quản lý Target Doanh Thu Siêu Thị & Ngành Hàng</span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-bhx-green-dark mt-1 flex items-center gap-2">
            Cập Nhật Target Doanh Thu & Chỉ Tiêu Từng Siêu Thị
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">
            Tải file Excel Target hoặc trực tiếp chỉnh sửa bằng tay từng siêu thị. Hệ thống tự động tính lại % hoàn thành và đối soát.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={loadOfficial38BTargetData}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-extrabold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white transition shadow-sm ring-2 ring-amber-300/50"
            title="Nạp ngay bộ Target chuẩn 38.428.573.273 đ của 21 Siêu Thị x 17 Ngành Hàng (31 Ngày)"
          >
            <Sparkles className="w-4 h-4 text-yellow-200" />
            <span>⚡ NẠP TARGET CHUẨN 38.4 TỶ (21 ST x 17 NGÀNH)</span>
          </button>
        </div>

        {/* Sub Navigation */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setActiveSubSection('manual-stores')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg transition ${
              activeSubSection === 'manual-stores'
                ? 'bg-white text-bhx-green-dark font-bold shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5 text-bhx-green" />
            <span>Sửa Tay 21 Siêu Thị</span>
          </button>

          <button
            onClick={() => setActiveSubSection('upload-excel')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg transition ${
              activeSubSection === 'upload-excel'
                ? 'bg-white text-bhx-green-dark font-bold shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UploadCloud className="w-3.5 h-3.5 text-amber-600" />
            <span>Upload File Excel Target</span>
          </button>

          <button
            onClick={() => setActiveSubSection('manual-cats')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg transition ${
              activeSubSection === 'manual-cats'
                ? 'bg-white text-bhx-green-dark font-bold shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-blue-600" />
            <span>Target 17 Ngành Hàng</span>
          </button>
        </div>
      </section>

      {/* ALERT NOTIFICATION */}
      {alert && (
        <div
          className={`p-4 rounded-xl flex items-start justify-between gap-3 shadow-xs animate-fadeIn ${
            alert.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
              : alert.type === 'error'
              ? 'bg-rose-50 text-rose-900 border border-rose-200'
              : 'bg-blue-50 text-blue-900 border border-blue-200'
          }`}
        >
          <div className="flex items-start gap-2.5">
            {alert.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />}
            {alert.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />}
            {alert.type === 'info' && <Sparkles className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />}
            <span className="text-xs sm:text-sm font-medium">{alert.message}</span>
          </div>
          <button onClick={() => setAlert(null)} className="text-xs text-slate-400 hover:text-slate-700 font-bold">
            ✕
          </button>
        </div>
      )}

      {/* SUMMARY KPI CARDS */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-emerald-900/10">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold uppercase text-slate-600">Tổng Target Khu Vực</span>
            <span className="p-1.5 bg-amber-50 text-amber-700 rounded-lg"><Target className="w-4 h-4" /></span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-amber-700 font-mono tracking-tight">
            {formatVND(totalEditedBase)}
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
            <span>Target Base hiện hành:</span>
            <b className="font-mono">{formatVND(totalCurrentBase)}</b>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-emerald-900/10">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold uppercase text-slate-600">Doanh Thu Đã Thực Hiện</span>
            <span className="p-1.5 bg-emerald-50 text-bhx-green rounded-lg"><Store className="w-4 h-4" /></span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-bhx-green-dark font-mono tracking-tight">
            {formatVND(totalThucHien)}
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
            <span>Tiến độ hoàn thành:</span>
            <span className="font-bold font-mono text-emerald-700 px-2 py-0.5 bg-emerald-50 rounded">
              {projectedPercent.toFixed(2)}%
            </span>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-emerald-900/10">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold uppercase text-slate-600">Số Siêu Thị Có Target</span>
            <span className="p-1.5 bg-blue-50 text-blue-700 rounded-lg"><Store className="w-4 h-4" /></span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-800 font-mono tracking-tight">
            21 / 21 Điểm bán
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
            <span>Trung bình Target/Kho:</span>
            <b className="font-mono text-slate-700">{formatVND(Math.round(totalEditedBase / 21))}</b>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-emerald-900/10">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold uppercase text-slate-600">Tổng Target 17 Ngành Hàng</span>
            <span className="p-1.5 bg-purple-50 text-purple-700 rounded-lg"><ShoppingBag className="w-4 h-4" /></span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-purple-800 font-mono tracking-tight">
            {formatVND(totalCatTarget)}
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
            <span>Ngành hàng chuẩn:</span>
            <span className="font-bold text-slate-700">17 Ngành BHX</span>
          </div>
        </div>
      </section>

      {/* ========================================================
          SUB-SECTION 1: MANUAL STORE TARGET EDITOR (21 SUPERMARKETS)
          ======================================================== */}
      {activeSubSection === 'manual-stores' && (
        <section className="bg-white rounded-xl shadow-sm border border-emerald-900/10 overflow-hidden">
          {/* Header & Quick Batch Actions */}
          <div className="bg-gradient-to-r from-bhx-green-dark to-bhx-green px-4 sm:px-6 py-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b-2 border-bhx-yellow text-white">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-bhx-yellow text-bhx-green-dark">
                  CHỈNH SỬA TAY
                </span>
                <h3 className="text-base sm:text-lg font-bold tracking-tight flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-bhx-yellow" />
                  Bảng Cập Nhật Target Base Từng Siêu Thị (21 Điểm Bán)
                </h3>
              </div>
              <p className="text-xs text-emerald-100 mt-1">
                Nhập số tiền Target Base mới hoặc bấm các nút tăng/giảm % nhanh cho từng kho. Bấm "Lưu Target" để áp dụng vào toàn bộ báo cáo.
              </p>
            </div>

            {/* Global Actions */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={resetToOfficialStoreBases}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-white/10 hover:bg-white/20 text-white transition border border-white/20"
                title="Khôi phục Target Base gốc 42.7 Tỷ của tháng 10"
              >
                <RotateCcw className="w-3.5 h-3.5 text-amber-300" />
                <span>Khôi Phục Base Gốc (42.7 Tỷ)</span>
              </button>

              <button
                onClick={saveManualStoreTargets}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold bg-bhx-yellow text-bhx-green-dark hover:bg-yellow-300 transition shadow-md ring-2 ring-yellow-400/40"
              >
                <Save className="w-4 h-4" />
                <span>LƯU TARGET SIÊU THỊ ĐÃ SỬA</span>
              </button>
            </div>
          </div>

          {/* Batch Quick Adjust Toolbar */}
          <div className="p-4 bg-emerald-50/50 border-b border-emerald-900/10 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-bold text-slate-700 flex items-center gap-1">
                <Percent className="w-3.5 h-3.5 text-bhx-green" />
                Áp dụng nhanh cho 21 siêu thị:
              </span>
              <button
                onClick={() => batchAdjustAllStores(5)}
                className="px-2.5 py-1 bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-300 rounded font-bold shadow-2xs"
              >
                +5%
              </button>
              <button
                onClick={() => batchAdjustAllStores(10)}
                className="px-2.5 py-1 bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-300 rounded font-bold shadow-2xs"
              >
                +10%
              </button>
              <button
                onClick={() => batchAdjustAllStores(-5)}
                className="px-2.5 py-1 bg-white hover:bg-rose-50 text-rose-800 border border-rose-300 rounded font-bold shadow-2xs"
              >
                -5%
              </button>
              <button
                onClick={() => batchAdjustAllStores(-10)}
                className="px-2.5 py-1 bg-white hover:bg-rose-50 text-rose-800 border border-rose-300 rounded font-bold shadow-2xs"
              >
                -10%
              </button>
            </div>

            {/* Search Box */}
            <div className="relative min-w-[240px]">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm siêu thị hoặc mã ĐN..."
                value={storeSearch}
                onChange={e => setStoreSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-bhx-green focus:outline-none"
              />
            </div>
          </div>

          {/* Stores Table */}
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-100 text-slate-700 uppercase text-[11px] font-bold tracking-wider border-b border-slate-200">
                <tr>
                  <th scope="col" className="py-3 px-3 text-center w-12">STT</th>
                  <th scope="col" className="py-3 px-3 text-center w-24">Mã ST</th>
                  <th scope="col" className="py-3 px-4">Tên Siêu Thị</th>
                  <th scope="col" className="py-3 px-3 text-center">Phân Khúc</th>
                  <th scope="col" className="py-3 px-4 text-right">Target Base Cũ</th>
                  <th scope="col" className="py-3 px-4 text-center min-w-[280px]">Target Base Mới (VNĐ)</th>
                  <th scope="col" className="py-3 px-4 text-right">Thực Hiện Đến Nay</th>
                  <th scope="col" className="py-3 px-3 text-center">Tiến Độ Dự Kiến</th>
                  <th scope="col" className="py-3 px-4 text-right">Còn Lại</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredStores.map((store, idx) => {
                  const currentVal = editedStoreBases[store.code] !== undefined ? editedStoreBases[store.code] : store.base;
                  const thucHien = store.thucHien;
                  const newPercent = currentVal > 0 ? (thucHien / currentVal) * 100 : 0;
                  const newConLai = Math.max(0, currentVal - thucHien);
                  const isModified = currentVal !== store.base;
                  const officialName = OFFICIAL_STORE_NAMES[store.code] || store.name;

                  return (
                    <tr key={store.code} className={`hover:bg-slate-50 transition ${isModified ? 'bg-amber-50/40' : ''}`}>
                      <td className="py-2.5 px-3 text-center font-bold text-slate-500">{idx + 1}</td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="font-mono font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-800 text-xs">
                          {store.code}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 font-semibold text-slate-900">
                        <div>
                          <div>{officialName}</div>
                          <div className="text-[10px] text-slate-500 font-normal">{store.addressName}</div>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          store.tier === '5 Tỷ -> <8 Tỷ' ? 'bg-purple-100 text-purple-800' :
                          store.tier === '3 Tỷ -> <5 Tỷ' ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {store.tier}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono text-slate-600">
                        {formatVND(store.base)}
                      </td>

                      {/* Editable Target Base Input */}
                      <td className="py-2 px-3">
                        <div className="flex items-center gap-1.5 justify-center">
                          <input
                            type="number"
                            step="1000000"
                            value={currentVal}
                            onChange={(e) => handleStoreBaseChange(store.code, parseInt(e.target.value, 10) || 0)}
                            className="w-36 px-2.5 py-1 text-right font-mono font-bold text-bhx-green-dark bg-white border border-slate-300 rounded-md focus:ring-2 focus:ring-bhx-green focus:border-bhx-green shadow-2xs"
                          />
                          {/* Quick Adjust Buttons */}
                          <div className="flex items-center gap-0.5">
                            <button
                              onClick={() => adjustSingleStorePercent(store.code, 5)}
                              className="px-1.5 py-0.5 text-[10px] bg-slate-100 hover:bg-emerald-100 text-emerald-800 rounded font-bold border border-slate-200"
                              title="Tăng 5%"
                            >
                              +5%
                            </button>
                            <button
                              onClick={() => adjustSingleStorePercent(store.code, -5)}
                              className="px-1.5 py-0.5 text-[10px] bg-slate-100 hover:bg-rose-100 text-rose-800 rounded font-bold border border-slate-200"
                              title="Giảm 5%"
                            >
                              -5%
                            </button>
                          </div>
                        </div>
                      </td>

                      <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-800">
                        {formatVND(thucHien)}
                      </td>

                      <td className="py-2.5 px-3 text-center">
                        <span className={`font-mono font-bold px-2 py-0.5 rounded text-xs ${
                          newPercent >= 100 ? 'bg-emerald-100 text-emerald-800' :
                          newPercent >= 80 ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {newPercent.toFixed(2)}%
                        </span>
                      </td>

                      <td className="py-2.5 px-4 text-right font-mono text-slate-600">
                        {formatVND(newConLai)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-slate-50 border-t-2 border-slate-200 font-bold text-slate-900">
                <tr>
                  <td colSpan={4} className="py-3 px-4 text-right uppercase text-xs font-black">
                    Tổng 21 Siêu Thị Toàn Khu Vực:
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-slate-700">{formatVND(totalCurrentBase)}</td>
                  <td className="py-3 px-4 text-center font-mono font-black text-amber-900 text-sm">{formatVND(totalEditedBase)}</td>
                  <td className="py-3 px-4 text-right font-mono text-bhx-green-dark">{formatVND(totalThucHien)}</td>
                  <td className="py-3 px-3 text-center font-mono text-emerald-800">{projectedPercent.toFixed(2)}%</td>
                  <td className="py-3 px-4 text-right font-mono text-slate-700">{formatVND(Math.max(0, totalEditedBase - totalThucHien))}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Footer Save Button */}
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs text-slate-500">
              * Sau khi điều chỉnh, dữ liệu sẽ được lưu tự động trên trình duyệt và áp dụng đồng bộ vào Biểu đồ & Bảng Lũy Kế ở Tab 1.
            </div>
            <button
              onClick={saveManualStoreTargets}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold bg-bhx-green text-white hover:bg-bhx-green-dark transition shadow-md"
            >
              <Save className="w-4 h-4 text-bhx-yellow" />
              <span>LƯU TARGET SIÊU THỊ ĐÃ SỬA TAY</span>
            </button>
          </div>
        </section>
      )}

      {/* ========================================================
          SUB-SECTION 2: UPLOAD EXCEL / CSV TARGET FILES
          ======================================================== */}
      {activeSubSection === 'upload-excel' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* THẺ 1: TARGET SIÊU THỊ */}
            <div className="bg-white rounded-xl shadow-sm border border-emerald-900/10 overflow-hidden flex flex-col justify-between">
              <div>
                <div className="bg-gradient-to-r from-bhx-green-dark to-bhx-green px-5 py-3.5 border-b-2 border-bhx-yellow text-white">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm sm:text-base font-bold flex items-center gap-2">
                      <Store className="w-4 h-4 text-bhx-yellow" />
                      1. Upload Target Doanh Thu Siêu Thị
                    </h3>
                    <span className="text-[10px] font-extrabold bg-bhx-yellow text-bhx-green-dark px-2 py-0.5 rounded uppercase">
                      21 Kho
                    </span>
                  </div>
                  <p className="text-xs text-emerald-100 mt-1">
                    Cập nhật Target Base cho 21 siêu thị theo cột <code className="bg-emerald-900/40 px-1 rounded text-yellow-300">Mã siêu thị</code> và <code className="bg-emerald-900/40 px-1 rounded text-yellow-300">Target Base</code>
                  </p>
                </div>

                <div className="p-5 space-y-4">
                  <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:border-bhx-green transition bg-slate-50/50">
                    <FileSpreadsheet className="w-10 h-10 text-bhx-green mx-auto mb-2" />
                    <p className="text-xs sm:text-sm font-bold text-slate-800">
                      Chọn file Excel Target Siêu Thị (.xlsx / .csv)
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1">
                      File gồm các cột: Mã siêu thị, Tên siêu thị, Target Base (VNĐ)
                    </p>
                    <input
                      type="file"
                      accept=".xlsx, .xls, .csv"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) {
                          setTargetStoreFile(f);
                          handleParseStoreTargetFile(f);
                        }
                      }}
                      className="mt-3 block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-emerald-100 file:text-emerald-800 hover:file:bg-emerald-200 cursor-pointer"
                    />
                  </div>

                  {/* Parsed Preview */}
                  {parsedStoreTargets && (
                    <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-200 space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-emerald-900">
                        <span>Đã phân tích: {parsedStoreTargets.length} siêu thị</span>
                        <span className="text-emerald-700">Sẵn sàng cập nhật</span>
                      </div>
                      <div className="max-h-36 overflow-y-auto custom-scrollbar text-[11px] bg-white rounded-lg p-2 border border-emerald-100">
                        {parsedStoreTargets.slice(0, 5).map(item => (
                          <div key={item.code} className="flex justify-between py-0.5 border-b border-slate-100">
                            <span className="font-mono font-bold text-slate-800">[{item.code}] {item.name.slice(0, 25)}...</span>
                            <span className="font-mono text-emerald-700 font-bold">{formatVND(item.newBase)}</span>
                          </div>
                        ))}
                        {parsedStoreTargets.length > 5 && (
                          <div className="text-center text-slate-400 text-[10px] pt-1">
                            ... và {parsedStoreTargets.length - 5} siêu thị khác
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-2">
                <button
                  onClick={downloadStoreTargetTemplate}
                  className="inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-bhx-green font-semibold"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Tải File Mẫu (.xlsx)</span>
                </button>

                <button
                  onClick={applyStoreTargetsFromFile}
                  disabled={!parsedStoreTargets}
                  className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition shadow-xs ${
                    parsedStoreTargets
                      ? 'bg-bhx-green text-white hover:bg-bhx-green-dark'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-bhx-yellow" />
                  <span>CẬP NHẬT TARGET SIÊU THỊ</span>
                </button>
              </div>
            </div>

            {/* THẺ 2: TARGET NGÀNH HÀNG */}
            <div className="bg-white rounded-xl shadow-sm border border-emerald-900/10 overflow-hidden flex flex-col justify-between">
              <div>
                <div className="bg-gradient-to-r from-emerald-800 to-teal-800 px-5 py-3.5 border-b-2 border-bhx-yellow text-white">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm sm:text-base font-bold flex items-center gap-2">
                      <ShoppingBag className="w-4 h-4 text-bhx-yellow" />
                      2. Upload Target Doanh Thu Ngành Hàng
                    </h3>
                    <span className="text-[10px] font-extrabold bg-bhx-yellow text-bhx-green-dark px-2 py-0.5 rounded uppercase">
                      17 Ngành
                    </span>
                  </div>
                  <p className="text-xs text-emerald-100 mt-1">
                    Cập nhật Target Tháng 11 theo cột <code className="bg-teal-900/40 px-1 rounded text-yellow-300">Ngành hàng BHX</code> (tự chuẩn hóa 17 ngành chuẩn)
                  </p>
                </div>

                <div className="p-5 space-y-4">
                  <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:border-teal-600 transition bg-slate-50/50">
                    <FileSpreadsheet className="w-10 h-10 text-teal-600 mx-auto mb-2" />
                    <p className="text-xs sm:text-sm font-bold text-slate-800">
                      Chọn file Excel Target Ngành Hàng (.xlsx / .csv)
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1">
                      File gồm các cột: Ngành hàng BHX, Target Tháng 11 (VNĐ)
                    </p>
                    <input
                      type="file"
                      accept=".xlsx, .xls, .csv"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) {
                          setTargetCatFile(f);
                          handleParseCatTargetFile(f);
                        }
                      }}
                      className="mt-3 block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-teal-100 file:text-teal-800 hover:file:bg-teal-200 cursor-pointer"
                    />
                  </div>

                  {/* Parsed Preview */}
                  {parsedCatTargets && (
                    <div className="bg-teal-50 rounded-xl p-3 border border-teal-200 space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-teal-900">
                        <span>Đã phân tích: {parsedCatTargets.length}/17 ngành hàng</span>
                        <span className="text-teal-700">Sẵn sàng cập nhật</span>
                      </div>
                      <div className="max-h-36 overflow-y-auto custom-scrollbar text-[11px] bg-white rounded-lg p-2 border border-teal-100">
                        {parsedCatTargets.slice(0, 5).map(item => (
                          <div key={item.id} className="flex justify-between py-0.5 border-b border-slate-100">
                            <span className="font-semibold text-slate-800">{item.name}</span>
                            <span className="font-mono text-teal-700 font-bold">{formatVND(item.newTarget)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-2">
                <button
                  onClick={downloadCategoryTargetTemplate}
                  className="inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-teal-700 font-semibold"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Tải File Mẫu (.xlsx)</span>
                </button>

                <button
                  onClick={applyCatTargetsFromFile}
                  disabled={!parsedCatTargets}
                  className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition shadow-xs ${
                    parsedCatTargets
                      ? 'bg-teal-700 text-white hover:bg-teal-800'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-bhx-yellow" />
                  <span>CẬP NHẬT TARGET NGÀNH HÀNG</span>
                </button>
              </div>
            </div>
          </div>

          {/* DUAL TARGET UPLOAD CARD */}
          <div className="bg-white rounded-xl shadow-sm border border-emerald-900/10 p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
              <div>
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  Lựa Chọn 3: Upload Cả 2 File Target Cùng Lúc
                </h4>
                <p className="text-xs text-slate-500">
                  Cập nhật đồng thời chỉ tiêu cho 21 siêu thị và 17 ngành hàng chỉ với 1 cú click.
                </p>
              </div>
              <button
                onClick={() => {
                  if (parsedStoreTargets) applyStoreTargetsFromFile();
                  if (parsedCatTargets) applyCatTargetsFromFile();
                  if (!parsedStoreTargets && !parsedCatTargets) {
                    setAlert({ type: 'error', message: 'Vui lòng chọn ít nhất 1 file Target trước khi bấm Cập nhật!' });
                  }
                }}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold bg-gradient-to-r from-bhx-green to-teal-700 text-white hover:opacity-95 transition shadow-md"
              >
                <CheckCircle2 className="w-4 h-4 text-bhx-yellow" />
                <span>⚡ CẬP NHẬT TOÀN BỘ TARGET</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          SUB-SECTION 3: MANUAL CATEGORY TARGET EDITOR (17 CATS)
          ======================================================== */}
      {activeSubSection === 'manual-cats' && (
        <section className="bg-white rounded-xl shadow-sm border border-emerald-900/10 overflow-hidden">
          <div className="bg-gradient-to-r from-teal-800 to-emerald-800 px-4 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-bhx-yellow text-white">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-bhx-yellow text-bhx-green-dark">
                  CHỈNH SỬA TAY
                </span>
                <h3 className="text-base sm:text-lg font-bold tracking-tight flex items-center gap-2">
                  <Layers className="w-4 h-4 text-bhx-yellow" />
                  Bảng Cập Nhật Target 17 Ngành Hàng Chuẩn Bách Hóa Xanh
                </h3>
              </div>
              <p className="text-xs text-emerald-100 mt-1">
                Điều chỉnh chỉ tiêu Target Tháng 11 cho từng ngành hàng để đối soát với dự phóng thực tế (Forecast).
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={resetCategoryTargets}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-white/10 hover:bg-white/20 text-white transition border border-white/20"
              >
                <RotateCcw className="w-3.5 h-3.5 text-amber-300" />
                <span>Khôi Phục Mặc Định</span>
              </button>

              <button
                onClick={saveManualCategoryTargets}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold bg-bhx-yellow text-bhx-green-dark hover:bg-yellow-300 transition shadow-md ring-2 ring-yellow-400/40"
              >
                <Save className="w-4 h-4" />
                <span>LƯU TARGET 17 NGÀNH HÀNG</span>
              </button>
            </div>
          </div>

          {/* Category Targets Table */}
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-100 text-slate-700 uppercase text-[11px] font-bold tracking-wider border-b border-slate-200">
                <tr>
                  <th scope="col" className="py-3 px-3 text-center w-12">STT</th>
                  <th scope="col" className="py-3 px-4">Tên Ngành Hàng BHX</th>
                  <th scope="col" className="py-3 px-3 text-center">Phân Nhóm</th>
                  <th scope="col" className="py-3 px-4 text-right">Lũy Kế T11 (Đến nay)</th>
                  <th scope="col" className="py-3 px-4 text-right">Doanh Thu T10</th>
                  <th scope="col" className="py-3 px-4 text-center min-w-[240px]">Target Tháng 11 (VNĐ)</th>
                  <th scope="col" className="py-3 px-3 text-center">Dự Báo / Target</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {categories.map((cat, idx) => {
                  const currentVal = editedCatTargets[cat.id] !== undefined ? editedCatTargets[cat.id] : (cat.targetNov || cat.octFull);
                  // Run rate forecast: 30 days
                  const forecast = (cat.novCum / 10) * 30;
                  const ratio = currentVal > 0 ? (forecast / currentVal) * 100 : 0;

                  return (
                    <tr key={cat.id} className="hover:bg-slate-50 transition">
                      <td className="py-2.5 px-3 text-center font-bold text-slate-500">{idx + 1}</td>
                      <td className="py-2.5 px-4 font-bold text-slate-900">{cat.name}</td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700">
                          {cat.group}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono font-bold text-bhx-green-dark">
                        {formatVND(cat.novCum)}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono text-slate-600">
                        {formatVND(cat.octFull)}
                      </td>
                      <td className="py-2 px-3 text-center">
                        <input
                          type="number"
                          step="10000000"
                          value={currentVal}
                          onChange={(e) => handleCatTargetChange(cat.id, parseInt(e.target.value, 10) || 0)}
                          className="w-44 px-3 py-1 text-right font-mono font-bold text-teal-800 bg-white border border-slate-300 rounded-md focus:ring-2 focus:ring-teal-600 focus:border-teal-600 shadow-2xs"
                        />
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className={`font-mono font-bold px-2 py-0.5 rounded text-xs ${
                          ratio >= 100 ? 'bg-emerald-100 text-emerald-800' :
                          ratio >= 90 ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {ratio.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-slate-50 border-t-2 border-slate-200 font-bold text-slate-900">
                <tr>
                  <td colSpan={3} className="py-3 px-4 text-right uppercase text-xs font-black">
                    Tổng 17 Ngành Hàng:
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-bhx-green-dark">
                    {formatVND(categories.reduce((s, c) => s + c.novCum, 0))}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-slate-600">
                    {formatVND(categories.reduce((s, c) => s + c.octFull, 0))}
                  </td>
                  <td className="py-3 px-4 text-center font-mono font-black text-teal-900 text-sm">
                    {formatVND(totalCatTarget)}
                  </td>
                  <td className="py-3 px-3 text-center font-mono text-slate-500">-</td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="text-xs text-slate-500">
              * Target ngành hàng được sử dụng để đối soát ở Tab 2: Báo Cáo Doanh Thu Theo Ngành Hàng.
            </span>
            <button
              onClick={saveManualCategoryTargets}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold bg-teal-700 text-white hover:bg-teal-800 transition shadow-md"
            >
              <Save className="w-4 h-4 text-bhx-yellow" />
              <span>LƯU TARGET 17 NGÀNH HÀNG</span>
            </button>
          </div>
        </section>
      )}
    </div>
  );
};
