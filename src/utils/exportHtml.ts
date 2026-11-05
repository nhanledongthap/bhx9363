/**
 * Export utilities for standalone HTML and CSV reporting
 */

export function downloadStandaloneHtml(htmlContent: string, fileName = 'index.html') {
  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportCsvReport(data: any[]) {
  const headers = [
    "Xếp hạng Lũy kế",
    "Mã ĐN",
    "Tên siêu thị",
    "Phân loại kho",
    "Lũy kế Thực hiện (VNĐ)",
    "Chỉ tiêu Base (VNĐ)",
    "% Hoàn thành",
    "Còn lại (VNĐ)",
    "DT Offline Hôm nay (VNĐ)",
    "DT Online Hôm nay (VNĐ)",
    "Tổng DT Hôm nay (VNĐ)",
    "Số Bill Hôm nay"
  ];

  const rows = data.map((item, idx) => [
    idx + 1,
    `"${item.code}"`,
    `"${item.name}"`,
    `"${item.tier}"`,
    item.thucHien,
    item.base,
    `"${item.percentComplete.toFixed(2)}%"`,
    item.conLai,
    item.dtOfflineToday,
    item.dtOnlineToday,
    item.tongDtToday,
    item.totalBillsToday
  ]);

  const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(e => e.join(","))].join("\r\n");
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `Bao_cao_BHX_AnGiang_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
