export interface CategoryItem {
  id: string;
  name: string;
  group: 'Tươi sống' | 'Sữa & Khô' | 'Mát & Kem' | 'Phi thực phẩm' | 'Đồ uống & Bia' | 'Khác';
  novCum: number;  // Lũy kế Tháng 11 (đến ngày hiện tại)
  octSame: number; // Lũy kế Tháng 10 (cùng kỳ số ngày)
  octFull: number; // Tổng Tháng 10 (cả tháng 31 ngày)
  targetNov: number; // Chỉ tiêu Target Tháng 11 (VNĐ)
}

export interface DrilldownRow {
  stt: number;
  storeCode: string;
  storeName: string;
  shortName: string;
  tier: string;
  catId: string;
  catName: string;
  group: string;
  novRevenue: number;
  targetCum: number;
  percentTargetCum: number;
  targetMonth: number;
  percentTargetMonth: number;
  diffTargetCum: number;
  octRevenue: number;
  diff: number;
  growth: number;
}

// 17 NGÀNH HÀNG CHUẨN XÁC THEO CỘT "Ngành hàng BHX" TỪ HÌNH ẢNH THỰC TẾ (KHÔNG TRÙNG LẶP)
export const OFFICIAL_17_CATEGORIES = [
  "Trái cây",
  "Khác",
  "Trứng",
  "Chăm sóc cá nhân",
  "Cá (Hải sản)",
  "Thịt",
  "Bánh kẹo - Trà - Cà phê - Bột Dinh Dưỡng các loại",
  "Rau Củ Quả CL",
  "Bia Các Loại",
  "Sữa - Thức uống bổ dưỡng các loại",
  "Kem các loại",
  "Thức uống giải khát các loại",
  "Thực phẩm - Gia vị các loại",
  "Chăm sóc nhà cửa",
  "Sản Phẩm Từ Sữa - Bảo Quản Mát",
  "Thực phẩm đông lạnh - Hàng mát các loại",
  "BHX - Hàng khuyến mãi"
] as const;

export const INITIAL_CATEGORIES: CategoryItem[] = [
  { id: "cat_1", name: "Trái cây", group: "Tươi sống", novCum: 485000000, octSame: 450000000, octFull: 1420000000, targetNov: 1513169724 },
  { id: "cat_2", name: "Khác", group: "Khác", novCum: 8900000, octSame: 7500000, octFull: 24500000, targetNov: 27228441 },
  { id: "cat_3", name: "Trứng", group: "Tươi sống", novCum: 182000000, octSame: 172000000, octFull: 535000000, targetNov: 569323099 },
  { id: "cat_4", name: "Chăm sóc cá nhân", group: "Phi thực phẩm", novCum: 790000000, octSame: 730000000, octFull: 2280000000, targetNov: 2457466888 },
  { id: "cat_5", name: "Cá (Hải sản)", group: "Tươi sống", novCum: 510000000, octSame: 470000000, octFull: 1490000000, targetNov: 1587264446 },
  { id: "cat_6", name: "Thịt", group: "Tươi sống", novCum: 1580000000, octSame: 1470000000, octFull: 4620000000, targetNov: 4930884491 },
  { id: "cat_7", name: "Bánh kẹo - Trà - Cà phê - Bột Dinh Dưỡng các loại", group: "Sữa & Khô", novCum: 1250000000, octSame: 1160000000, octFull: 3650000000, targetNov: 3893775103 },
  { id: "cat_8", name: "Rau Củ Quả CL", group: "Tươi sống", novCum: 345000000, octSame: 320000000, octFull: 1010000000, targetNov: 1075200511 },
  { id: "cat_9", name: "Bia Các Loại", group: "Đồ uống & Bia", novCum: 1950000000, octSame: 1810000000, octFull: 5680000000, targetNov: 6069381010 },
  { id: "cat_10", name: "Sữa - Thức uống bổ dưỡng các loại", group: "Sữa & Khô", novCum: 770000000, octSame: 715000000, octFull: 2250000000, targetNov: 2403785345 },
  { id: "cat_11", name: "Kem các loại", group: "Mát & Kem", novCum: 150000000, octSame: 140000000, octFull: 440000000, targetNov: 468118376 },
  { id: "cat_12", name: "Thức uống giải khát các loại", group: "Đồ uống & Bia", novCum: 475000000, octSame: 440000000, octFull: 1380000000, targetNov: 1479115278 },
  { id: "cat_13", name: "Thực phẩm - Gia vị các loại", group: "Sữa & Khô", novCum: 1710000000, octSame: 1590000000, octFull: 4980000000, targetNov: 5315072593 },
  { id: "cat_14", name: "Chăm sóc nhà cửa", group: "Phi thực phẩm", novCum: 975000000, octSame: 905000000, octFull: 2840000000, targetNov: 3030625408 },
  { id: "cat_15", name: "Sản Phẩm Từ Sữa - Bảo Quản Mát", group: "Mát & Kem", novCum: 605000000, octSame: 565000000, octFull: 1770000000, targetNov: 1889916030 },
  { id: "cat_16", name: "Thực phẩm đông lạnh - Hàng mát các loại", group: "Mát & Kem", novCum: 550000000, octSame: 515000000, octFull: 1610000000, targetNov: 1716301562 },
  { id: "cat_17", name: "BHX - Hàng khuyến mãi", group: "Khác", novCum: 650000, octSame: 550000, octFull: 1850000, targetNov: 1944968 }
];

// Helper chuẩn hóa tên ngành hàng khi import file để không bao giờ bị trùng lặp
export function normalizeCategoryName(raw: string): string {
  if (!raw) return "Khác";
  const s = raw.trim();
  // Khớp chính xác trước
  for (const official of OFFICIAL_17_CATEGORIES) {
    if (s.toLowerCase() === official.toLowerCase()) return official;
  }
  // Khớp mềm
  const lower = s.toLowerCase();
  if (lower.includes("trái cây") || lower.includes("trai cay")) return "Trái cây";
  if (lower.includes("trứng") || lower.includes("trung")) return "Trứng";
  if (lower.includes("chăm sóc cá nhân") || lower.includes("cham soc ca nhan")) return "Chăm sóc cá nhân";
  if (lower.includes("cá") || lower.includes("hải sản") || lower.includes("hai san")) return "Cá (Hải sản)";
  if (lower.includes("thịt") || lower.includes("thit")) return "Thịt";
  if (lower.includes("bánh kẹo") || lower.includes("cà phê") || lower.includes("dinh dưỡng")) return "Bánh kẹo - Trà - Cà phê - Bột Dinh Dưỡng các loại";
  if (lower.includes("rau") || lower.includes("củ quả")) return "Rau Củ Quả CL";
  if (lower.includes("bia")) return "Bia Các Loại";
  if (lower.includes("sản phẩm từ sữa") || lower.includes("bảo quản mát")) return "Sản Phẩm Từ Sữa - Bảo Quản Mát";
  if (lower.includes("sữa") || lower.includes("bổ dưỡng")) return "Sữa - Thức uống bổ dưỡng các loại";
  if (lower.includes("kem")) return "Kem các loại";
  if (lower.includes("giải khát") || lower.includes("nước ngọt")) return "Thức uống giải khát các loại";
  if (lower.includes("gia vị") || lower.includes("mì") || lower.includes("miến") || lower.includes("cháo")) return "Thực phẩm - Gia vị các loại";
  if (lower.includes("nhà cửa") || lower.includes("nha cua")) return "Chăm sóc nhà cửa";
  if (lower.includes("đông lạnh") || lower.includes("hàng mát")) return "Thực phẩm đông lạnh - Hàng mát các loại";
  if (lower.includes("khuyến mãi") || lower.includes("khuyết") || lower.includes("giảm")) return "BHX - Hàng khuyến mãi";
  return "Khác";
}
