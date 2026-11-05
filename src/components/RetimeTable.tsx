import React from 'react';
import { SupermarketData, formatVND } from '../data/supermarkets';
import { Clock, ArrowUpDown, ShoppingCart } from 'lucide-react';

interface RetimeTableProps {
  data: SupermarketData[];
  sortField: 'tongDtToday' | 'dtOfflineToday' | 'dtOnlineToday' | 'totalBillsToday';
  sortAsc: boolean;
  onSort: (field: 'tongDtToday' | 'dtOfflineToday' | 'dtOnlineToday' | 'totalBillsToday') => void;
  reportDate?: string;
}

export const RetimeTable: React.FC<RetimeTableProps> = ({
  data,
  sortField,
  sortAsc,
  onSort,
  reportDate
}) => {
  const totalOffline = data.reduce((acc, cur) => acc + cur.dtOfflineToday, 0);
  const totalOnline = data.reduce((acc, cur) => acc + cur.dtOnlineToday, 0);
  const totalToday = data.reduce((acc, cur) => acc + cur.tongDtToday, 0);
  const totalBills = data.reduce((acc, cur) => acc + cur.totalBillsToday, 0);

  const renderRankBadge = (rank: number) => {
    if (rank === 1) {
      return (
        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-400 text-amber-950 font-black text-xs shadow-xs">
          1
        </span>
      );
    }
    if (rank === 2) {
      return (
        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-300 text-slate-800 font-bold text-xs shadow-xs">
          2
        </span>
      );
    }
    if (rank === 3) {
      return (
        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-600 text-white font-bold text-xs shadow-xs">
          3
        </span>
      );
    }
    return (
      <span className="inline-flex items-center justify-center w-6 h-6 text-slate-500 font-semibold text-xs">
        {rank}
      </span>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-emerald-900/10 overflow-hidden">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-700 to-amber-600 px-4 sm:px-6 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b-2 border-[#FFC700]">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-[#FFC700] text-amber-950">
              BẢNG 2
            </span>
            <h3 className="text-sm sm:text-base font-bold text-white tracking-tight flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-[#FFC700]" />
              Báo Cáo Retime Doanh Thu Hôm Nay
            </h3>
          </div>
          <p className="text-xs text-amber-100 mt-0.5">
            Dữ liệu doanh số thời gian thực ngày {reportDate || 'hôm nay'} (Kênh bán Offline & Online)
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-amber-100 font-medium">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Retime trực tiếp từ POS</span>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs sm:text-sm">
          <thead className="bg-slate-50 text-slate-600 uppercase text-[11px] font-bold tracking-wider border-b border-slate-200 select-none">
            <tr>
              <th scope="col" className="py-3 px-3 text-center w-14">
                Xếp hạng
              </th>
              <th scope="col" className="py-3 px-4">
                Tên Siêu Thị & Mã ĐN
              </th>
              <th
                scope="col"
                onClick={() => onSort('dtOfflineToday')}
                className="py-3 px-4 text-right cursor-pointer hover:bg-slate-100 transition"
              >
                <div className="inline-flex items-center gap-1">
                  <span>DT Offline (VNĐ)</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th
                scope="col"
                onClick={() => onSort('dtOnlineToday')}
                className="py-3 px-4 text-right cursor-pointer hover:bg-slate-100 transition"
              >
                <div className="inline-flex items-center gap-1">
                  <span>DT Online (VNĐ)</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th
                scope="col"
                onClick={() => onSort('tongDtToday')}
                className="py-3 px-4 text-right cursor-pointer hover:bg-slate-100 transition"
              >
                <div className="inline-flex items-center gap-1 text-[#005427] font-extrabold">
                  <span>Tổng Doanh Thu VNĐ</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th
                scope="col"
                onClick={() => onSort('totalBillsToday')}
                className="py-3 px-4 text-center w-28 cursor-pointer hover:bg-slate-100 transition"
              >
                <div className="inline-flex items-center gap-1">
                  <span>Số Hóa Đơn</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {data.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-400">
                  Không tìm thấy siêu thị phù hợp bộ lọc tìm kiếm
                </td>
              </tr>
            ) : (
              data.map((item, idx) => {
                const isTop3 = idx < 3;
                return (
                  <tr
                    key={item.code}
                    className={`hover:bg-slate-50/90 transition ${
                      isTop3 ? 'bg-amber-50/30' : ''
                    }`}
                  >
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      {renderRankBadge(idx + 1)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 leading-snug">
                        {item.name}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                        Mã: {item.code} · {item.tier}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-700 whitespace-nowrap">
                      {formatVND(item.dtOfflineToday)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-emerald-700 whitespace-nowrap font-medium">
                      {formatVND(item.dtOnlineToday)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-extrabold text-amber-900 whitespace-nowrap text-sm sm:text-base">
                      {formatVND(item.tongDtToday)}
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-slate-800">
                      <span className="inline-flex items-center gap-1">
                        <ShoppingCart className="w-3 h-3 text-slate-400" />
                        {item.totalBillsToday.toLocaleString('vi-VN')}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
          <tfoot className="bg-amber-50/90 font-bold border-t-2 border-amber-600 text-xs sm:text-sm">
            <tr>
              <td className="py-3.5 px-3 text-center">TỔNG</td>
              <td className="py-3.5 px-4 text-slate-900">
                Tổng Retime Hôm Nay ({data.length} Siêu thị)
              </td>
              <td className="py-3.5 px-4 text-right font-mono text-slate-800">
                {formatVND(totalOffline)}
              </td>
              <td className="py-3.5 px-4 text-right font-mono text-emerald-800">
                {formatVND(totalOnline)}
              </td>
              <td className="py-3.5 px-4 text-right font-mono text-amber-900 text-sm sm:text-base">
                {formatVND(totalToday)}
              </td>
              <td className="py-3.5 px-4 text-center font-mono text-slate-900">
                {totalBills.toLocaleString('vi-VN')}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};
