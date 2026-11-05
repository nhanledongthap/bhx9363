import React, { useEffect, useRef, useState } from 'react';
import Chart from 'chart.js/auto';
import { SupermarketData, formatVND, formatVNDShort } from '../data/supermarkets';
import { BarChart3, TrendingUp, CalendarDays, Percent, Info } from 'lucide-react';

interface RevenueChartProps {
  data: SupermarketData[];
}

export const RevenueChart: React.FC<RevenueChartProps> = ({ data }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstanceRef = useRef<Chart | null>(null);
  const [chartMode, setChartMode] = useState<'luyke' | 'today' | 'percent'>('luyke');

  useEffect(() => {
    if (!canvasRef.current) return;
    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
      chartInstanceRef.current = null;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // All supermarkets (ordered by revenue or user preference)
    let displayList: SupermarketData[] = [];
    if (chartMode === 'luyke') {
      displayList = [...data].sort((a, b) => b.thucHien - a.thucHien);
    } else if (chartMode === 'today') {
      displayList = [...data].sort((a, b) => b.tongDtToday - a.tongDtToday);
    } else {
      displayList = [...data].sort((a, b) => b.percentComplete - a.percentComplete);
    }

    const labels = displayList.map(s => s.shortName);

    let datasets: any[] = [];

    if (chartMode === 'luyke') {
      datasets = [
        {
          label: 'Chỉ tiêu Base Tháng',
          data: displayList.map(s => s.base),
          backgroundColor: '#cbd5e1', // Slate light for Base
          hoverBackgroundColor: '#94a3b8',
          borderRadius: 6,
          barPercentage: 0.85,
          categoryPercentage: 0.82,
          order: 2
        },
        {
          label: 'Thực hiện Lũy Kế',
          data: displayList.map(s => s.thucHien),
          backgroundColor: '#007738', // Brand Green
          hoverBackgroundColor: '#005427',
          borderRadius: 6,
          barPercentage: 0.85,
          categoryPercentage: 0.82,
          isMainResult: true,
          percentages: displayList.map(s => s.percentComplete),
          order: 1
        }
      ];
    } else if (chartMode === 'today') {
      // Compare Today's Retime vs Target Day (Base / 31)
      const dayTargets = displayList.map(s => Math.round(s.base / 31));
      const todayPcts = displayList.map((s, idx) => {
        const target = dayTargets[idx];
        return target > 0 ? (s.tongDtToday / target) * 100 : 0;
      });

      datasets = [
        {
          label: 'Target Ngày (Base/31)',
          data: dayTargets,
          backgroundColor: '#fed7aa', // Light amber/orange
          hoverBackgroundColor: '#fdba74',
          borderRadius: 6,
          barPercentage: 0.85,
          categoryPercentage: 0.82,
          order: 2
        },
        {
          label: 'Doanh thu Retime Hôm Nay',
          data: displayList.map(s => s.tongDtToday),
          backgroundColor: '#007738', // Brand Green
          hoverBackgroundColor: '#005427',
          borderRadius: 6,
          barPercentage: 0.85,
          categoryPercentage: 0.82,
          isMainResult: true,
          percentages: todayPcts,
          order: 1
        }
      ];
    } else {
      // Mode % Hoàn Thành Base
      datasets = [
        {
          label: '% Hoàn thành Base',
          data: displayList.map(s => s.percentComplete),
          backgroundColor: displayList.map(s => {
            if (s.percentComplete >= 90) return '#007738';
            if (s.percentComplete >= 85) return '#d97706';
            return '#dc2626';
          }),
          borderRadius: 6,
          barPercentage: 0.65,
          isMainResult: true,
          percentages: displayList.map(s => s.percentComplete)
        }
      ];
    }

    // Custom Plugin to draw % Hoàn Thành directly on top of bars
    const customDataLabelsPlugin = {
      id: 'customDataLabels',
      afterDatasetsDraw(chart: any) {
        const { ctx } = chart;
        ctx.save();
        chart.data.datasets.forEach((dataset: any, datasetIndex: number) => {
          if (dataset.isMainResult && dataset.percentages) {
            const meta = chart.getDatasetMeta(datasetIndex);
            meta.data.forEach((bar: any, index: number) => {
              const pct = dataset.percentages[index];
              if (pct !== undefined && pct !== null) {
                const text = `${pct.toFixed(1)}%`;
                ctx.fillStyle = pct >= 90 ? '#005427' : pct >= 85 ? '#b45309' : '#991b1b';
                ctx.font = 'bold 9px "Plus Jakarta Sans", sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'bottom';
                ctx.fillText(text, bar.x, bar.y - 3);
              }
            });
          }
        });
        ctx.restore();
      }
    };

    chartInstanceRef.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets
      },
      plugins: [customDataLabelsPlugin],
      options: {
        responsive: true,
        maintainAspectRatio: false,
        layout: {
          padding: {
            top: 24, // Space for percentage labels on top of bars
            bottom: 4
          }
        },
        interaction: {
          mode: 'index',
          intersect: false
        },
        plugins: {
          legend: {
            position: 'top',
            labels: {
              boxWidth: 14,
              boxHeight: 14,
              borderRadius: 3,
              useBorderRadius: true,
              font: {
                family: '"Plus Jakarta Sans", sans-serif',
                size: 12,
                weight: 600
              },
              color: '#1e293b'
            }
          },
          tooltip: {
            backgroundColor: '#0f172a',
            titleFont: {
              family: '"Plus Jakarta Sans", sans-serif',
              size: 13,
              weight: 'bold'
            },
            bodyFont: {
              family: '"JetBrains Mono", monospace',
              size: 12
            },
            padding: 12,
            cornerRadius: 8,
            callbacks: {
              title: (items) => {
                if (!items.length) return '';
                const idx = items[0].dataIndex;
                const store = displayList[idx];
                return `[${store.code}] ${store.shortName} (${store.tier})`;
              },
              label: (context) => {
                const label = context.dataset.label || '';
                const val = context.raw as number;
                if (chartMode === 'percent') {
                  return ` ${label}: ${val.toFixed(2)}% (Mục tiêu: 100%)`;
                }
                return ` ${label}: ${formatVND(val)}`;
              },
              afterBody: (items) => {
                if (!items.length) return [];
                const idx = items[0].dataIndex;
                const store = displayList[idx];
                const lines = [];
                lines.push(`---------------------------`);
                lines.push(`Tiến độ lũy kế: ${store.percentComplete.toFixed(2)}%`);
                lines.push(`Còn lại: ${formatVND(store.conLai)}`);
                lines.push(`Retime hôm nay: ${formatVND(store.tongDtToday)} (${store.totalBillsToday} bills)`);
                lines.push(`  + Offline: ${(store.dtOfflineToday / 1000000).toFixed(1)} Tr · Online: ${(store.dtOnlineToday / 1000000).toFixed(1)} Tr`);
                return lines;
              }
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: {
              font: {
                family: '"Plus Jakarta Sans", sans-serif',
                size: 11,
                weight: 600
              },
              color: '#334155',
              maxRotation: 45,
              minRotation: 35
            }
          },
          y: {
            grid: { color: '#f1f5f9' },
            ticks: {
              font: {
                family: '"JetBrains Mono", monospace',
                size: 11
              },
              color: '#64748b',
              callback: (val) => {
                if (chartMode === 'percent') {
                  return `${val}%`;
                }
                return formatVNDShort(val as number);
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
  }, [data, chartMode]);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-emerald-900/10 overflow-hidden">
      {/* Header Banner - Designated as BẢNG 1 */}
      <div className="bg-gradient-to-r from-emerald-900 via-[#005427] to-[#028c46] px-4 sm:px-6 py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 border-b-2 border-[#FFC700]">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-[#FFC700] text-[#005427]">
              BẢNG 1
            </span>
            <h3 className="text-sm sm:text-base font-bold text-white tracking-tight flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-[#FFC700]" />
              Biểu Đồ So Sánh Thực Hiện vs Base Tất Cả Siêu Thị ({data.length} Siêu Thị)
            </h3>
          </div>
          <p className="text-xs text-emerald-100 mt-0.5 flex items-center gap-1.5">
            <span>Hiển thị cột Base, cột Thực hiện và % hoàn thành trên đỉnh mỗi cột</span>
            <span className="hidden sm:inline text-emerald-300">·</span>
            <span className="hidden sm:inline text-emerald-200">Rà chuột vào từng cột để xem chi tiết đầy đủ</span>
          </p>
        </div>

        {/* Chart View Toggle Controls */}
        <div className="flex items-center gap-1 p-1 bg-white/10 backdrop-blur-xs rounded-lg text-xs font-semibold self-start md:self-auto border border-white/15">
          <button
            onClick={() => setChartMode('luyke')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition ${
              chartMode === 'luyke'
                ? 'bg-[#FFC700] text-[#005427] font-bold shadow-xs'
                : 'text-white hover:bg-white/15'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Thực Hiện Lũy Kế vs Base</span>
          </button>
          <button
            onClick={() => setChartMode('today')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition ${
              chartMode === 'today'
                ? 'bg-[#FFC700] text-[#005427] font-bold shadow-xs'
                : 'text-white hover:bg-white/15'
            }`}
          >
            <CalendarDays className="w-3.5 h-3.5" />
            <span>Hôm Nay vs Target Ngày</span>
          </button>
          <button
            onClick={() => setChartMode('percent')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition ${
              chartMode === 'percent'
                ? 'bg-[#FFC700] text-[#005427] font-bold shadow-xs'
                : 'text-white hover:bg-white/15'
            }`}
          >
            <Percent className="w-3.5 h-3.5" />
            <span>% Tiến Độ</span>
          </button>
        </div>
      </div>

      {/* Chart Canvas Container with Horizontal Scroll support for 21 stores */}
      <div className="p-4 sm:p-5">
        <div className="w-full overflow-x-auto custom-scrollbar pb-2">
          <div className="relative w-full min-w-[850px] sm:min-w-[1050px] h-[360px] sm:h-[400px]">
            <canvas ref={canvasRef} />
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-2">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-xs bg-[#cbd5e1] inline-block"></span>
              <span>Cột Base (Chỉ tiêu)</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-xs bg-[#007738] inline-block"></span>
              <span className="font-semibold text-[#005427]">Cột Thực hiện (Doanh thu)</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-[#005427] bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">90.0%</span>
              <span>% Hoàn thành trên đầu cột</span>
            </span>
          </div>

          <div className="flex items-center gap-1 text-[11px] text-slate-400">
            <Info className="w-3.5 h-3.5 text-slate-400" />
            <span>Kéo thanh trượt ngang trên điện thoại để xem trọn vẹn 21 siêu thị</span>
          </div>
        </div>
      </div>
    </div>
  );
};
