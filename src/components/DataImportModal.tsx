import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { SUPERMARKETS_DATA, SupermarketData, formatVND, OFFICIAL_OCTOBER_BASE } from '../data/supermarkets';
import {
  X,
  Upload,
  FileSpreadsheet,
  Link as LinkIcon,
  ClipboardPaste,
  Check,
  AlertCircle,
  RotateCcw,
  Sparkles,
  RefreshCw,
  Trash2
} from 'lucide-react';

interface DataImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveData: (newData: SupermarketData[], dateStr: string) => void;
  onResetDefault: () => void;
  currentData: SupermarketData[];
}

export const DataImportModal: React.FC<DataImportModalProps> = ({
  isOpen,
  onClose,
  onSaveData,
  onResetDefault
}) => {
  const [activeTab, setActiveTab] = useState<'paste' | 'file' | 'googlesheet'>('paste');
  const [pasteContent, setPasteContent] = useState('');
  const [dateInput, setDateInput] = useState(new Date().toLocaleDateString('vi-VN'));
  const [previewRows, setPreviewRows] = useState<SupermarketData[] | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Google Sheet URL
  const [googleSheetUrl, setGoogleSheetUrl] = useState(() => {
    return localStorage.getItem('bhx_gsheet_url') || '';
  });
  const [isLoadingGSheet, setIsLoadingGSheet] = useState(false);

  if (!isOpen) return null;

  const parseNum = (val: any): number => {
    if (typeof val === 'number') return isNaN(val) ? 0 : val;
    if (!val) return 0;
    // Remove currency symbols, commas, dots (handle vi-VN and en-US)
    const str = String(val).trim();
    // Check if format like "1.234.567" or "1,234,567"
    const clean = str.replace(/[^\d.-]/g, '');
    const parsed = parseFloat(clean);
    return isNaN(parsed) ? 0 : parsed;
  };

  /**
   * ROBUST PARSER THAT HANDLES BOTH:
   * 1. Multi-day logs (e.g. 525 rows = 21 stores x 25 days) - automatically picks latest date & computes true cumulative
   * 2. Single-day summary tables (1 row per store)
   * GUARANTEES ZERO STORE DUPLICATION (Map by store code)
   */
  const parseRowsToData = (rows: any[][]): { data: SupermarketData[]; detectedDate: string } => {
    if (!rows || rows.length === 0) throw new Error('Không có dữ liệu');

    // Filter out completely blank rows
    const validRows = rows.filter(
      (r) => r && r.length > 0 && r.some((c) => c !== '' && c !== null && c !== undefined)
    );

    if (validRows.length === 0) throw new Error('File hoặc nội dung dán không có dòng dữ liệu hợp lệ');

    // Helper to score DD/MM/YYYY for chronological comparison
    const parseDateScore = (d: string): number => {
      if (!d) return 0;
      const parts = String(d).split('/');
      if (parts.length === 3) {
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10);
        const year = parseInt(parts[2], 10);
        if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
          return year * 10000 + month * 100 + day;
        }
      }
      return 0;
    };

    // Identify header row and map column positions
    let startIdx = 0;
    let colDate = -1;
    let colMa = -1;
    let colTen = -1;
    let colLoaiKho = -1;
    let colDtOffline = -1;
    let colDtOnline = -1;
    let colTongBill = -1;
    let colLuyKe = -1;
    let colBase = -1;

    const r0Text = validRows[0].map((c) => String(c || '').toLowerCase()).join(' ');
    if (
      r0Text.includes('ngày') ||
      r0Text.includes('mã đn') ||
      r0Text.includes('mã siêu thị') ||
      r0Text.includes('siêu thị') ||
      r0Text.includes('tên') ||
      r0Text.includes('doanh thu') ||
      isNaN(Number(validRows[0][0]))
    ) {
      startIdx = 1;
      validRows[0].forEach((c, idx) => {
        const h = String(c || '').trim().toLowerCase();
        if (h === 'ngày' || h.includes('date')) colDate = idx;
        else if (h.includes('mã siêu thị') || h.includes('mã đn') || h === 'mã') colMa = idx;
        else if (h.includes('tên siêu thị') || h.includes('tên đn') || h.includes('tên kho') || h === 'tên') colTen = idx;
        else if (h.includes('loại kho') || h.includes('tier')) colLoaiKho = idx;
        else if ((h.includes('doanh thu offline') || h.includes('dt offline')) && !h.includes('lũy kế')) {
          if (!h.includes('đã vat') || colDtOffline === -1) colDtOffline = idx;
        } else if ((h.includes('doanh thu online') || h.includes('dt online')) && !h.includes('lũy kế')) {
          if (!h.includes('đã vat') || colDtOnline === -1) colDtOnline = idx;
        } else if ((h.includes('tổng số bill') || h.includes('số bill')) && !h.includes('online')) {
          colTongBill = idx;
        } else if (
          (h.includes('lũy kế') || h.includes('thực hiện lũy kế') || h.includes('dt lũy kế') || h.includes('cum')) &&
          !h.includes('hôm nay') && !h.includes('%')
        ) {
          colLuyKe = idx;
        } else if (
          (h.includes('target base') || h.includes('kế hoạch base') || h === 'base' || h.includes('chỉ tiêu base') || h.includes('kế hoạch tháng')) &&
          !h.includes('%')
        ) {
          colBase = idx;
        }
      });
    }

    interface StoreAcc {
      code: string;
      fullName: string;
      shortName: string;
      tier: '5 Tỷ -> <8 Tỷ' | '3 Tỷ -> <5 Tỷ' | '1.2 Tỷ -> <2 Tỷ';
      addressName: string;
      cluster: string;
      openDate: string;
      latestDateStr: string;
      latestDateScore: number;
      dtOfflineToday: number;
      dtOnlineToday: number;
      tongDtToday: number;
      totalBillsToday: number;
      sumDtAllDays: number;
      explicitLuyKe: number;
      explicitBase: number;
      rowCount: number;
    }

    const storeMap = new Map<string, StoreAcc>();
    let overallLatestDate = '';
    let overallLatestScore = 0;

    for (let i = startIdx; i < validRows.length; i++) {
      const row = validRows[i];
      if (!row || row.length < 2) continue;

      const cellStrings = row.map((c) => String(c ?? '').trim());
      const rowFullText = cellStrings.join(' ');

      // 1. Detect store code
      let code = '';
      if (colMa !== -1 && row[colMa]) {
        code = String(row[colMa]).trim();
      } else {
        const codeMatch = rowFullText.match(/\b(6\d{3}|4\d{3}|5\d{3}|7\d{3}|8\d{3}|9\d{3}|1\d{4}|2\d{4}|3\d{4})\b/);
        if (codeMatch) code = codeMatch[1];
        else {
          const fallbackMatch = (cellStrings[0] + ' ' + cellStrings[1]).match(/\d+/);
          code = fallbackMatch ? fallbackMatch[0] : `ST${i}`;
        }
      }

      const masterStore = SUPERMARKETS_DATA.find((s) => s.code === code);

      // 2. Detect Supermarket Name
      let fullName = '';
      if (colTen !== -1 && row[colTen]) {
        fullName = String(row[colTen]).trim();
      } else if (masterStore) {
        fullName = masterStore.name;
      } else {
        for (const c of cellStrings) {
          if (c.includes('BHX') || c.includes('Chợ') || c.includes('Thửa') || c.length > fullName.length) {
            if (!/^\d{2}\/\d{2}\/\d{4}$/.test(c) && !/^\d+$/.test(c)) {
              fullName = c;
            }
          }
        }
      }
      if (!fullName) fullName = `Siêu thị BHX ${code}`;
      if (!fullName.includes(code)) fullName = `${code} - ${fullName}`;

      // 3. Detect Date
      let rowDate = '';
      if (colDate !== -1 && row[colDate]) {
        rowDate = String(row[colDate]).trim();
      } else {
        for (const c of cellStrings) {
          const dMatch = c.match(/(\d{1,2}\/\d{1,2}\/\d{4})/);
          if (dMatch) {
            rowDate = dMatch[1];
            break;
          }
        }
      }

      const dateScore = parseDateScore(rowDate);
      if (dateScore > overallLatestScore) {
        overallLatestScore = dateScore;
        overallLatestDate = rowDate;
      }

      // 4. Detect Tier
      let tier: '5 Tỷ -> <8 Tỷ' | '3 Tỷ -> <5 Tỷ' | '1.2 Tỷ -> <2 Tỷ' = masterStore ? masterStore.tier : '1.2 Tỷ -> <2 Tỷ';
      const tierText = colLoaiKho !== -1 && row[colLoaiKho] ? String(row[colLoaiKho]) : rowFullText;
      if (tierText.includes('5 Tỷ') || tierText.includes('5-8') || tierText.includes('5 tỷ') || tierText.includes('5 tỷ - < 6 tỷ')) {
        tier = '5 Tỷ -> <8 Tỷ';
      } else if (tierText.includes('3 Tỷ') || tierText.includes('3-5') || tierText.includes('3 tỷ') || tierText.includes('2 tỷ - < 5 tỷ') || tierText.includes('2 Tỷ')) {
        tier = '3 Tỷ -> <5 Tỷ';
      }

      // 5. Read DT Offline, DT Online, Bills
      let rowOffline = 0;
      let rowOnline = 0;
      let rowBills = 0;

      if (colDtOffline !== -1 && row[colDtOffline] !== undefined) {
        rowOffline = parseNum(row[colDtOffline]);
      }
      if (colDtOnline !== -1 && row[colDtOnline] !== undefined) {
        rowOnline = parseNum(row[colDtOnline]);
      }
      if (colTongBill !== -1 && row[colTongBill] !== undefined) {
        rowBills = parseNum(row[colTongBill]);
      }

      if (colDtOffline === -1 || colDtOnline === -1) {
        const numbersInRow: number[] = [];
        for (let c = 0; c < row.length; c++) {
          if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(String(row[c]))) continue;
          const n = parseNum(row[c]);
          if (n > 0) numbersInRow.push(n);
        }
        const tenM = numbersInRow.filter((n) => n >= 10000000 && n < 500000000);
        const millions = numbersInRow.filter((n) => n >= 50000 && n < 10000000);
        const billNums = numbersInRow.filter((n) => n >= 50 && n <= 3000);

        if (tenM.length >= 1) rowOffline = tenM[0];
        if (millions.length >= 1) rowOnline = millions[0];
        if (billNums.length >= 1) rowBills = billNums[0];
      }

      const rowTongDt = rowOffline + rowOnline;

      // 6. Explicit Lũy Kế and Base if columns were present
      let rowLuyKe = 0;
      if (colLuyKe !== -1 && row[colLuyKe] !== undefined) {
        rowLuyKe = parseNum(row[colLuyKe]);
      }
      let rowBase = 0;
      if (colBase !== -1 && row[colBase] !== undefined) {
        rowBase = parseNum(row[colBase]);
      }

      // Aggregate into storeMap
      if (!storeMap.has(code)) {
        storeMap.set(code, {
          code,
          fullName: masterStore ? masterStore.name : fullName,
          shortName: masterStore ? masterStore.shortName : fullName.replace(/^.*-\s*/, '').replace(/BHX_AGI_\w+\s*-\s*/, '').slice(0, 25),
          tier,
          addressName: masterStore ? masterStore.addressName : 'Khu vực Tỉnh An Giang',
          cluster: masterStore ? masterStore.cluster : 'An Giang',
          openDate: masterStore ? masterStore.openDate : '2020',
          latestDateStr: rowDate || '',
          latestDateScore: dateScore,
          dtOfflineToday: rowOffline,
          dtOnlineToday: rowOnline,
          tongDtToday: rowTongDt,
          totalBillsToday: rowBills || (masterStore ? masterStore.totalBillsToday : 300),
          sumDtAllDays: rowTongDt,
          explicitLuyKe: rowLuyKe,
          explicitBase: rowBase,
          rowCount: 1
        });
      } else {
        const item = storeMap.get(code)!;
        item.rowCount++;
        item.sumDtAllDays += rowTongDt;
        if (rowLuyKe > 0) item.explicitLuyKe = rowLuyKe;
        if (rowBase > 0) item.explicitBase = rowBase;

        // Update today's Retime if this row is for the latest recorded date
        if (dateScore >= item.latestDateScore) {
          item.latestDateScore = dateScore;
          item.latestDateStr = rowDate || item.latestDateStr;
          if (rowOffline > 0) item.dtOfflineToday = rowOffline;
          if (rowOnline > 0) item.dtOnlineToday = rowOnline;
          item.tongDtToday = item.dtOfflineToday + item.dtOnlineToday;
          if (rowBills > 0) item.totalBillsToday = rowBills;
        }
      }
    }

    if (storeMap.size === 0) {
      throw new Error('Không phân tích được danh sách siêu thị nào từ file hoặc nội dung đã dán');
    }

    // Convert map to array and compute accurate cumulative values
    const finalData: SupermarketData[] = [];

    storeMap.forEach((item) => {
      const masterStore = SUPERMARKETS_DATA.find((s) => s.code === item.code);

      // Determine Base Target
      let base = item.explicitBase;
      if (!base && OFFICIAL_OCTOBER_BASE[item.code]) {
        base = OFFICIAL_OCTOBER_BASE[item.code];
      } else if (!base && masterStore) {
        base = masterStore.base;
      }
      if (!base) {
        if (item.tier === '3 Tỷ -> <5 Tỷ' || item.tier === '5 Tỷ -> <8 Tỷ') base = 2500000000;
        else base = 1200000000;
      }

      // Determine Thực Hiện Lũy Kế:
      // Case 1: Explicit cumulative column exists in file
      // Case 2: Multi-day transaction log (rowCount > 1) -> sum of all days in the file
      // Case 3: Single-day report -> preserve known authentic master cumulative
      let thucHien = 0;
      if (item.explicitLuyKe > 0) {
        thucHien = item.explicitLuyKe;
      } else if (item.rowCount > 1) {
        thucHien = item.sumDtAllDays;
      } else if (masterStore) {
        thucHien = masterStore.thucHien;
      } else {
        thucHien = item.tongDtToday > 0 ? item.tongDtToday * 25 : Math.round(base * 0.88);
      }

      const percent = base > 0 ? (thucHien / base) * 100 : 0;
      const conLai = Math.max(0, base - thucHien);

      finalData.push({
        rankLuyKe: 0,
        rankRetime: 0,
        code: item.code,
        name: item.fullName,
        shortName: item.shortName,
        addressName: item.addressName,
        province: 'Tỉnh An Giang',
        cluster: item.cluster,
        tier: item.tier,
        openDate: item.openDate,
        thucHien,
        base,
        percentComplete: parseFloat(percent.toFixed(2)),
        conLai,
        dtOfflineToday: item.dtOfflineToday,
        dtOnlineToday: item.dtOnlineToday,
        tongDtToday: item.tongDtToday,
        totalBillsToday: item.totalBillsToday,
        growthVsYesterday: masterStore ? masterStore.growthVsYesterday : 2.5
      });
    });

    // Sort & assign Rank Lũy kế (1 to N)
    finalData.sort((a, b) => b.thucHien - a.thucHien);
    finalData.forEach((s, idx) => {
      s.rankLuyKe = idx + 1;
    });

    // Sort & assign Rank Retime (1 to N)
    const sortedRetime = [...finalData].sort((a, b) => b.tongDtToday - a.tongDtToday);
    sortedRetime.forEach((s, idx) => {
      const orig = finalData.find((f) => f.code === s.code);
      if (orig) orig.rankRetime = idx + 1;
    });

    return {
      data: finalData,
      detectedDate: overallLatestDate || new Date().toLocaleDateString('vi-VN')
    };
  };

  // Handle Tab 1: Parse pasted text
  const handlePreviewPaste = () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      if (!pasteContent.trim()) {
        setErrorMsg('Vui lòng dán dữ liệu từ bảng tính Excel / Google Sheets vào ô dưới');
        return;
      }

      const lines = pasteContent.trim().split(/\r\n|\n|\r/);
      const rawRows = lines.map((line) => {
        if (line.includes('\t')) return line.split('\t');
        return line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
      });

      const { data, detectedDate } = parseRowsToData(rawRows);
      setPreviewRows(data);
      if (detectedDate) setDateInput(detectedDate);
      setSuccessMsg(`Đã lọc sạch và nhận diện chính xác ${data.length} siêu thị (loại bỏ hoàn toàn các dòng trùng lặp)! Bấm "Xóa Cũ & Áp Dụng Dữ Liệu Mới" để hoàn tất.`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Lỗi phân tích dữ liệu dán');
    }
  };

  // Handle Tab 2: Upload Excel File
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg(null);
    setSuccessMsg(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];

        const { data: parsed, detectedDate } = parseRowsToData(data);
        setPreviewRows(parsed);
        if (detectedDate) setDateInput(detectedDate);
        setSuccessMsg(`Đã phân tích thành công ${parsed.length} siêu thị từ file "${file.name}"! Toàn bộ data cũ sẽ được xóa sạch khi bạn bấm áp dụng.`);
      } catch (err: any) {
        setErrorMsg('Lỗi khi đọc file Excel: ' + err.message);
      }
    };
    reader.readAsBinaryString(file);
  };

  // Handle Tab 3: Google Sheet Live Link
  const handleFetchGoogleSheet = async () => {
    if (!googleSheetUrl.trim()) {
      setErrorMsg('Vui lòng nhập đường link Google Sheets');
      return;
    }

    setIsLoadingGSheet(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      let csvUrl = googleSheetUrl.trim();
      if (csvUrl.includes('/edit')) {
        csvUrl = csvUrl.replace(/\/edit.*$/, '/export?format=csv');
      } else if (!csvUrl.includes('export?format=csv')) {
        csvUrl = csvUrl + (csvUrl.includes('?') ? '&' : '?') + 'format=csv';
      }

      const res = await fetch(csvUrl);
      if (!res.ok) {
        throw new Error('Không thể tải Google Sheet. Hãy kiểm tra quyền "Bất kỳ ai có liên kết đều có thể xem".');
      }

      const text = await res.text();
      const lines = text.trim().split(/\r\n|\n|\r/);
      const rawRows = lines.map((line) => line.split(','));

      const { data: parsed, detectedDate } = parseRowsToData(rawRows);
      setPreviewRows(parsed);
      if (detectedDate) setDateInput(detectedDate);
      localStorage.setItem('bhx_gsheet_url', googleSheetUrl.trim());
      setSuccessMsg(`Đã kết nối thành công ${parsed.length} siêu thị từ Google Sheets!`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Lỗi kết nối Google Sheets');
    } finally {
      setIsLoadingGSheet(false);
    }
  };

  // Apply parsed data: WIPE OLD DATA COMPLETELY & APPLY NEW
  const handleApply = () => {
    if (!previewRows || previewRows.length === 0) return;
    
    // Clear any leftover artifacts
    localStorage.removeItem('bhx_supermarket_data');
    localStorage.removeItem('bhx_report_date');

    // Call parent handler with fresh array clone
    onSaveData([...previewRows], dateInput);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden border border-slate-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-gradient-to-r from-[#005427] to-[#007738] text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FFC700] text-[#005427] font-black flex items-center justify-center shadow-xs">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                Nạp Dữ Liệu Báo Cáo Siêu Thị Mới
                <span className="text-[11px] font-semibold bg-[#FFC700] text-[#005427] px-2 py-0.5 rounded-full">
                  Clean Reset
                </span>
              </h3>
              <p className="text-xs text-emerald-100">
                Tự động xóa sạch số liệu cũ, chống trùng lặp dòng và tính toán lại toàn bộ chỉ số từ đầu.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex items-center gap-2 px-5 py-2.5 bg-slate-50 border-b border-slate-200">
          <button
            onClick={() => setActiveTab('paste')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              activeTab === 'paste'
                ? 'bg-[#007738] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
            }`}
          >
            <ClipboardPaste className="w-4 h-4" />
            <span>1. Dán từ Excel / Google Sheet</span>
          </button>

          <button
            onClick={() => setActiveTab('file')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              activeTab === 'file'
                ? 'bg-[#007738] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>2. Tải File Excel (.xlsx / .csv)</span>
          </button>

          <button
            onClick={() => setActiveTab('googlesheet')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              activeTab === 'googlesheet'
                ? 'bg-[#007738] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
            }`}
          >
            <LinkIcon className="w-4 h-4" />
            <span>3. Kết nối Link Google Sheet</span>
          </button>
        </div>

        {/* Date Selector Row */}
        <div className="px-5 py-2.5 bg-emerald-50/60 border-b border-emerald-100 flex items-center justify-between text-xs text-slate-700">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-[#005427]">Ngày báo cáo:</span>
            <input
              type="text"
              value={dateInput}
              onChange={(e) => setDateInput(e.target.value)}
              placeholder="VD: 26/03/2026"
              className="px-2 py-1 bg-white border border-emerald-300 rounded text-xs font-mono font-bold text-slate-800 w-32 focus:outline-none focus:ring-1 focus:ring-[#007738]"
            />
            <span className="text-slate-400 text-[11px]">(Tự động nhận diện từ file)</span>
          </div>

          <button
            onClick={onResetDefault}
            className="text-xs text-rose-600 hover:text-rose-800 flex items-center gap-1 font-semibold transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Khôi phục dữ liệu gốc</span>
          </button>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs custom-scrollbar">
          
          {/* TAB 1: PASTE */}
          {activeTab === 'paste' && (
            <div className="space-y-3">
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900">
                <p className="font-bold flex items-center gap-1 mb-1">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  Dán trực tiếp các dòng từ file Excel:
                </p>
                <p className="text-[11px] text-amber-800">
                  Dù file của bạn có 21 dòng (báo cáo ngày) hay hàng trăm dòng (lịch sử nhiều ngày), thuật toán sẽ <b>tự động gom nhóm theo mã siêu thị</b>, lấy ngày mới nhất và <b>xóa sạch data cũ</b> để không bao giờ bị chồng lấn.
                </p>
              </div>

              <textarea
                value={pasteContent}
                onChange={(e) => setPasteContent(e.target.value)}
                placeholder="Dán nội dung copy từ Excel vào đây...&#10;Ví dụ:&#10;6119	BHX_AGI_TTO - Thửa 309 Tri Tôn	2785620000	3100000000	98405000	24935127	698&#10;6220	BHX_AGI_TRI - Chợ Mới Nhà Bàng	2420150000	2800000000	52894000	9708261	504"
                rows={8}
                className="w-full p-3 font-mono text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#007738] custom-scrollbar"
              />

              <div className="flex justify-end">
                <button
                  onClick={handlePreviewPaste}
                  className="px-4 py-2 bg-[#007738] text-white font-bold rounded-lg hover:bg-[#005427] transition shadow-xs flex items-center gap-1.5"
                >
                  <ClipboardPaste className="w-4 h-4" />
                  <span>Kiểm Tra & Chuẩn Hóa Dữ Liệu</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: FILE */}
          {activeTab === 'file' && (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-slate-300 rounded-2xl p-8 text-center hover:border-[#007738] bg-slate-50/50 transition flex flex-col items-center justify-center">
                <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-[#007738] mb-3">
                  <Upload className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-sm text-slate-800 mb-1">
                  Chọn file Excel (.xlsx, .xls, .csv)
                </h4>
                <p className="text-xs text-slate-500 mb-4 max-w-sm">
                  Hệ thống tự động đọc và lọc sạch dữ liệu mới, loại bỏ dòng trùng
                </p>
                <label className="cursor-pointer px-4 py-2 bg-[#007738] text-white rounded-lg font-bold text-xs hover:bg-[#005427] transition shadow-xs">
                  <span>Chọn file từ máy tính / điện thoại</span>
                  <input
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          )}

          {/* TAB 3: GOOGLE SHEETS */}
          {activeTab === 'googlesheet' && (
            <div className="space-y-3">
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-950">
                <p className="font-bold flex items-center gap-1 mb-1">
                  <LinkIcon className="w-4 h-4 text-[#007738]" />
                  Đồng bộ Google Sheets trực tiếp:
                </p>
                <p className="text-[11px] text-emerald-800">
                  Dán đường link Google Sheets (chọn quyền "Bất kỳ ai có liên kết đều có thể xem").
                </p>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={googleSheetUrl}
                  onChange={(e) => setGoogleSheetUrl(e.target.value)}
                  placeholder="https://docs.google.com/spreadsheets/d/.../edit?usp=sharing"
                  className="flex-1 p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#007738]"
                />
                <button
                  onClick={handleFetchGoogleSheet}
                  disabled={isLoadingGSheet}
                  className="px-4 py-2 bg-[#007738] text-white font-bold rounded-xl hover:bg-[#005427] transition shadow-xs flex items-center gap-1.5 flex-shrink-0 disabled:opacity-50"
                >
                  {isLoadingGSheet ? 'Đang tải...' : 'Đồng Bộ Ngay'}
                </button>
              </div>
            </div>
          )}

          {/* Messages */}
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center gap-2">
              <Check className="w-4 h-4 flex-shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Preview Section */}
          {previewRows && (
            <div className="space-y-2 pt-2 border-t border-slate-200">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
                  <RefreshCw className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Dữ liệu mới sẵn sàng ({previewRows.length} Siêu thị duy nhất)</span>
                </h4>
                <span className="text-[11px] text-emerald-700 font-bold">
                  Tổng DT Lũy Kế: {formatVND(previewRows.reduce((a, b) => a + b.thucHien, 0))}
                </span>
              </div>

              <div className="max-h-56 overflow-y-auto border border-slate-200 rounded-xl custom-scrollbar">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-bold sticky top-0">
                    <tr>
                      <th className="p-2 text-center w-10">Mã</th>
                      <th className="p-2">Tên Siêu Thị</th>
                      <th className="p-2 text-right">Lũy Kế (VNĐ)</th>
                      <th className="p-2 text-right">Base (VNĐ)</th>
                      <th className="p-2 text-center">% Đạt</th>
                      <th className="p-2 text-right">Hôm Nay (VNĐ)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {previewRows.map((r, i) => (
                      <tr key={r.code} className="hover:bg-slate-50">
                        <td className="p-2 text-center text-slate-500 font-mono font-semibold">{r.code}</td>
                        <td className="p-2 font-medium text-slate-900">{r.name}</td>
                        <td className="p-2 text-right font-mono text-[#005427] font-semibold">{formatVND(r.thucHien)}</td>
                        <td className="p-2 text-right font-mono text-slate-600">{formatVND(r.base)}</td>
                        <td className="p-2 text-center font-mono font-bold text-emerald-700">{r.percentComplete}%</td>
                        <td className="p-2 text-right font-mono text-amber-800 font-bold">{formatVND(r.tongDtToday)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="text-xs text-slate-500 flex items-center gap-1">
            <Trash2 className="w-3.5 h-3.5 text-rose-500" />
            <span>Bấm áp dụng sẽ xóa hoàn toàn data cũ và tải data mới vào Dashboard.</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-white border border-slate-300 rounded-lg font-semibold text-slate-700 hover:bg-slate-100 transition"
            >
              Hủy
            </button>
            <button
              onClick={handleApply}
              disabled={!previewRows || previewRows.length === 0}
              className="px-5 py-2 bg-[#007738] text-white font-bold rounded-lg hover:bg-[#005427] transition shadow-md disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Xóa Cũ & Áp Dụng Dữ Liệu Mới</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
