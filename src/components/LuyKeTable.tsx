import React from 'react';
import { SupermarketData, formatVND } from '../data/supermarkets';
import { Award, ArrowUpDown } from 'lucide-react';

interface LuyKeTableProps {
  data: SupermarketData[];
  sortField: 'thucHien' | 'percentComplete' | 'base' | 'conLai';
  sortAsc: boolean;
  onSort: (field: 'thucHien' | 'percentComplete' | 'base' | 'conLai') => void;
  reportDate?: string;
}

export const LuyKeTable: React.FC<LuyKeTableProps> = ({
  data,
  sortField,
  sortAsc,
  onSort,
  reportDate
}) => {
  const totalThucHien = data.reduce((acc, cur) => acc + cur.thucHien, 0);
  const totalBase = data.reduce((acc, cur) => acc + cur.base, 0);
  const totalConLai = data.reduce((acc, cur) => acc + cur.conLai, 0);
  const avgPercent = totalBase > 0 ? (totalThucHien / totalBase) * 100 : 0;

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
      <div className="bg-gradient-to-r from-[#005427] to-[#007738] px-4 sm:px-6 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b-2 border-[#FFC700]">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-[#FFC700] text-[#005427]">
              BẢNG 3
            </span>
            <h3 className="text-sm sm:text-base font-bold text-white tracking-tight flex items-center gap-1.5">
              <Award className="w-4 h-4 text-[#FFC700]" />
              Báo Cáo Lũy Kế Doanh Thu Khu Vực
            </h3>
          </div>
          <p className="text-xs text-emerald-100 mt-0.5">
            Theo dõi kế hoạch Base, thực hiện lũy kế và tiến độ hoàn thành Tháng 11/2026
          </p>
        </div>
        <div className="text-xs text-emerald-100 font-medium">
          Tiến độ tháng: <span className="text-[#FFC700] font-bold font-mono">5/30 ngày (~16.7%)</span>
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
                onClick={() => onSort('thucHien')}
                className="py-3 px-4 text-right cursor-pointer hover:bg-slate-100 transition"
              >
                <div className="inline-flex items-center gap-1">
                  <span>Thực Hiện (VNĐ)</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th
                scope="col"
                onClick={() => onSort('base')}
                className="py-3 px-4 text-right cursor-pointer hover:bg-slate-100 transition"
              >
                <div className="inline-flex items-center gap-1">
                  <span>Base (VNĐ)</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th
                scope="col"
                onClick={() => onSort('percentComplete')}
                className="py-3 px-4 text-center w-48 cursor-pointer hover:bg-slate-100 transition"
              >
                <div className="inline-flex items-center gap-1">
                  <span>% Hoàn Thành</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th
                scope="col"
                onClick={() => onSort('conLai')}
                className="py-3 px-4 text-right cursor-pointer hover:bg-slate-100 transition"
              >
                <div className="inline-flex items-center gap-1">
                  <span>Còn Lại (VNĐ)</span>
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
                const pct = item.percentComplete;
                const isTop3 = idx < 3;
                const barColor =
                  pct >= 90
                    ? 'bg-[#007738]'
                    : pct >= 85
                    ? 'bg-amber-500'
                    : 'bg-orange-500';

                return (
                  <tr
                    key={item.code}
                    className={`hover:bg-slate-50/90 transition ${
                      isTop3 ? 'bg-amber-50/25' : ''
                    }`}
                  >
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      {renderRankBadge(idx + 1)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 leading-snug">
                        {item.name}
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                        <span className="font-mono text-slate-600 font-semibold">
                          Mã: {item.code}
                        </span>
                        <span>·</span>
                        <span className="text-[#007738] font-medium">
                          {item.tier}
                        </span>
                        <span>·</span>
                        <span>{item.addressName}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-[#005427] whitespace-nowrap">
                      {formatVND(item.thucHien)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-600 whitespace-nowrap">
                      {formatVND(item.base)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span
                          className={`font-mono font-bold ${
                            pct >= 90 ? 'text-[#007738]' : 'text-slate-800'
                          }`}
                        >
                          {pct.toFixed(2)}%
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {pct >= 80.65 ? '✓ Vượt mốc ngày' : 'Đang bám đuổi'}
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div
                          className={`${barColor} h-2 rounded-full transition-all duration-500`}
                          style={{ width: `${Math.min(pct, 100)}%` }}
                        />
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-semibold text-rose-600 whitespace-nowrap">
                      {formatVND(item.conLai)}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
          <tfoot className="bg-emerald-50/90 font-bold border-t-2 border-[#007738] text-xs sm:text-sm">
            <tr>
              <td className="py-3.5 px-3 text-center">TỔNG</td>
              <td className="py-3.5 px-4 text-slate-800">
                Tổng cộng ({data.length} Siêu thị)
              </td>
              <td className="py-3.5 px-4 text-right font-mono text-[#005427]">
                {formatVND(totalThucHien)}
              </td>
              <td className="py-3.5 px-4 text-right font-mono text-slate-700">
                {formatVND(totalBase)}
              </td>
              <td className="py-3.5 px-4 text-center font-mono text-[#007738]">
                {avgPercent.toFixed(2)}%
              </td>
              <td className="py-3.5 px-4 text-right font-mono text-rose-600">
                {formatVND(totalConLai)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};
