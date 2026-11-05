export interface SupermarketData {
  rankLuyKe: number;
  rankRetime: number;
  code: string;
  name: string;
  shortName: string;
  addressName: string;
  province: string;
  cluster: string;
  tier: '5 Tỷ -> <8 Tỷ' | '3 Tỷ -> <5 Tỷ' | '1.2 Tỷ -> <2 Tỷ';
  openDate: string;
  // Lũy kế
  thucHien: number; // VNĐ
  base: number;     // VNĐ (Chính xác theo Target Base Tháng 10 data_bot_9363)
  percentComplete: number; // %
  conLai: number;   // VNĐ
  // Retime Hôm nay (Chính xác theo báo cáo ngày 25/10/2026)
  dtOfflineToday: number;
  dtOnlineToday: number;
  tongDtToday: number;
  totalBillsToday: number;
  growthVsYesterday: number; // %
}

// BẢNG TARGET BASE CHÍNH THỨC THÁNG 10/2026 - TỔNG KHU VỰC: 42.733.168.495 đ
export const OFFICIAL_OCTOBER_BASE: Record<string, number> = {
  "6220": 4404285551, // BHX_AGI_TBI - Thửa 206 Nhà Bàng
  "6119": 4388456841, // BHX_AGI_TTO - Thửa 368 Tri Tôn
  "5806": 2997892666, // BHX_AGI_TBI - Lô 17 Chi Lăng
  "8653": 2740370926, // BHX_AGI_TTO - Trần Hưng Đạo
  "5019": 2783888016, // BHX_AGI_TBI - Thửa 74 Tịnh Biên
  "7140": 2754516949, // BHX_AGI_TTO - Ngô Tự Lợi (Ba Chúc)
  "8873": 1485990436, // BHX_AGI_TBI - An Hảo
  "9376": 1305367509, // BHX_AGI_TTO - Lương An Trà (Giồng Cát)
  "30256": 2521968912, // BHX_AGI_CDA - Cần Đăng
  "5118": 2979462900, // BHX_AGI_CTH - Thửa 17 Vĩnh Bình
  "10070": 2115314759, // BHX_AGI_CPH - Thạnh Mỹ Tây
  "27944": 1237589316, // BHX_AGI_VGI - Vĩnh Gia
  "29756": 1066818791, // BHX_AGI_VTT - Chợ Kênh 7
  "29909": 908330767,  // BHX_AGI_VHA - Vĩnh Nhuận
  "4684": 1618695985,  // BHX_AGI_CPH - Thửa 145 Vĩnh Thuận (Chợ Vịnh Tre)
  "15033": 1203546592, // BHX_AGI_LXU - Bình Đức
  "9307": 1467549673,  // BHX_AGI_LXU - Mỹ Hòa Hưng
  "4687": 2112759295,  // BHX_AGI_LXU - Thửa 1615 Mỹ Quý
  "30455": 789862611,  // BHX_AGI_ACU - Văn Giáo
  "35547": 850500000,  // BHX_AGI_CTO - Chợ Cô Tô
  "35562": 1000000000   // BHX_AGI_CTO - Chợ Tà Đảnh
};

// 21 SIÊU THỊ CHUẨN XÁC TỪ FILE MÃ SIÊU THỊ - TÊN SIÊU THỊ
export const OFFICIAL_STORE_NAMES: Record<string, string> = {
  "6220": "BHX_AGI_TBI - Thửa 206 Nhà Bàng",
  "4684": "BHX_AGI_CPH - Thửa 145 Vĩnh Thuận (Chợ Vịnh Tre)",
  "15033": "BHX_AGI_LXU - Bình Đức",
  "29756": "BHX_AGI_VTT - Chợ Kênh 7",
  "27944": "BHX_AGI_VGI - Vĩnh Gia",
  "4687": "BHX_AGI_LXU - Thửa 1615 Mỹ Quý",
  "6119": "BHX_AGI_TTO - Thửa 368 Tri Tôn",
  "5019": "BHX_AGI_TBI - Thửa 74 Tịnh Biên",
  "30256": "BHX_AGI_CDA - Cần Đăng",
  "30455": "BHX_AGI_ACU - Văn Giáo",
  "5118": "BHX_AGI_CTH - Thửa 17 Vĩnh Bình",
  "10070": "BHX_AGI_CPH - Thạnh Mỹ Tây",
  "7140": "BHX_AGI_TTO - Ngô Tự Lợi (Ba Chúc)",
  "8653": "BHX_AGI_TTO - Trần Hưng Đạo",
  "9307": "BHX_AGI_LXU - Mỹ Hòa Hưng",
  "9376": "BHX_AGI_TTO - Lương An Trà (Giồng Cát)",
  "35562": "BHX_AGI_CTO - Chợ Tà Đảnh",
  "35547": "BHX_AGI_CTO - Chợ Cô Tô",
  "8873": "BHX_AGI_TBI - An Hảo",
  "29909": "BHX_AGI_VHA - Vĩnh Nhuận",
  "5806": "BHX_AGI_TBI - Lô 17 Chi Lăng"
};

// 21 SIÊU THỊ BÁCH HÓA XANH KHU VỰC AN GIANG (DỮ LIỆU THÁNG 11 CHUẨN XÁC: TỔNG LŨY KẾ 6.205.486.038 đ / BASE 42.733.168.495 đ)
export const SUPERMARKETS_DATA: SupermarketData[] = [
  {
    rankLuyKe: 1,
    rankRetime: 1,
    code: "6220",
    name: "BHX_AGI_TBI - Thửa 206 Nhà Bàng",
    shortName: "Thửa 206 Nhà Bàng",
    addressName: "Thửa 206, TT. Nhà Bàng, Tịnh Biên",
    province: "Tỉnh An Giang",
    cluster: "Tịnh Biên",
    tier: "3 Tỷ -> <5 Tỷ",
    openDate: "23/04/2020",
    thucHien: 628196984,
    base: 4404285551,
    percentComplete: 14.26,
    conLai: 3776088567,
    dtOfflineToday: 112923277,
    dtOnlineToday: 12716120,
    tongDtToday: 125639397,
    totalBillsToday: 850,
    growthVsYesterday: 4.5
  },
  {
    rankLuyKe: 2,
    rankRetime: 2,
    code: "6119",
    name: "BHX_AGI_TTO - Thửa 368 Tri Tôn",
    shortName: "Thửa 368 Tri Tôn",
    addressName: "Thửa 368, TT. Tri Tôn, Tri Tôn",
    province: "Tỉnh An Giang",
    cluster: "Tri Tôn",
    tier: "3 Tỷ -> <5 Tỷ",
    openDate: "07/03/2020",
    thucHien: 600612566,
    base: 4388456841,
    percentComplete: 13.68,
    conLai: 3787844275,
    dtOfflineToday: 96294770,
    dtOnlineToday: 23827744,
    tongDtToday: 120122513,
    totalBillsToday: 640,
    growthVsYesterday: 3.2
  },
  {
    rankLuyKe: 3,
    rankRetime: 3,
    code: "5806",
    name: "BHX_AGI_TBI - Lô 17 Chi Lăng",
    shortName: "Lô 17 Chi Lăng",
    addressName: "Lô 17, TT. Chi Lăng, Tịnh Biên",
    province: "Tỉnh An Giang",
    cluster: "Tịnh Biên",
    tier: "1.2 Tỷ -> <2 Tỷ",
    openDate: "30/12/2019",
    thucHien: 426696245,
    base: 2997892666,
    percentComplete: 14.23,
    conLai: 2571196421,
    dtOfflineToday: 81732632,
    dtOnlineToday: 3606617,
    tongDtToday: 85339249,
    totalBillsToday: 516,
    growthVsYesterday: 5.1
  },
  {
    rankLuyKe: 4,
    rankRetime: 4,
    code: "5118",
    name: "BHX_AGI_CTH - Thửa 17 Vĩnh Bình",
    shortName: "Thửa 17 Vĩnh Bình",
    addressName: "Thửa 17, Vĩnh Bình, Châu Thành",
    province: "Tỉnh An Giang",
    cluster: "Châu Thành",
    tier: "1.2 Tỷ -> <2 Tỷ",
    openDate: "09/10/2019",
    thucHien: 424796954,
    base: 2979462900,
    percentComplete: 14.26,
    conLai: 2554665946,
    dtOfflineToday: 69557005,
    dtOnlineToday: 15402386,
    tongDtToday: 84959391,
    totalBillsToday: 581,
    growthVsYesterday: 2.9
  },
  {
    rankLuyKe: 5,
    rankRetime: 5,
    code: "5019",
    name: "BHX_AGI_TBI - Thửa 74 Tịnh Biên",
    shortName: "Thửa 74 Tịnh Biên",
    addressName: "Thửa 74, Khóm Xuân Phú, Tịnh Biên",
    province: "Tỉnh An Giang",
    cluster: "Tịnh Biên",
    tier: "1.2 Tỷ -> <2 Tỷ",
    openDate: "19/10/2019",
    thucHien: 412625547,
    base: 2783888016,
    percentComplete: 14.82,
    conLai: 2371262469,
    dtOfflineToday: 67452310,
    dtOnlineToday: 15072800,
    tongDtToday: 82525109,
    totalBillsToday: 562,
    growthVsYesterday: 6.8
  },
  {
    rankLuyKe: 6,
    rankRetime: 6,
    code: "30256",
    name: "BHX_AGI_CDA - Cần Đăng",
    shortName: "Cần Đăng",
    addressName: "Ấp Cần Thạnh, Cần Đăng, Châu Thành",
    province: "Tỉnh An Giang",
    cluster: "Châu Thành",
    tier: "1.2 Tỷ -> <2 Tỷ",
    openDate: "20/08/2020",
    thucHien: 406497176,
    base: 2521968912,
    percentComplete: 16.12,
    conLai: 2115471736,
    dtOfflineToday: 70194512,
    dtOnlineToday: 11104923,
    tongDtToday: 81299435,
    totalBillsToday: 557,
    growthVsYesterday: 2.1
  },
  {
    rankLuyKe: 7,
    rankRetime: 7,
    code: "8653",
    name: "BHX_AGI_TTO - Trần Hưng Đạo",
    shortName: "Trần Hưng Đạo",
    addressName: "Trần Hưng Đạo, TT. Tri Tôn",
    province: "Tỉnh An Giang",
    cluster: "Tri Tôn",
    tier: "1.2 Tỷ -> <2 Tỷ",
    openDate: "16/07/2021",
    thucHien: 395932643,
    base: 2740370926,
    percentComplete: 14.45,
    conLai: 2344438283,
    dtOfflineToday: 72096484,
    dtOnlineToday: 7090045,
    tongDtToday: 79186529,
    totalBillsToday: 497,
    growthVsYesterday: 1.8
  },
  {
    rankLuyKe: 8,
    rankRetime: 8,
    code: "7140",
    name: "BHX_AGI_TTO - Ngô Tự Lợi (Ba Chúc)",
    shortName: "Ngô Tự Lợi (Ba Chúc)",
    addressName: "Ấp Lư Trì, TT. Ba Chúc, Tri Tôn",
    province: "Tỉnh An Giang",
    cluster: "Tri Tôn",
    tier: "1.2 Tỷ -> <2 Tỷ",
    openDate: "03/10/2020",
    thucHien: 392725282,
    base: 2754516949,
    percentComplete: 14.26,
    conLai: 2361791667,
    dtOfflineToday: 64305532,
    dtOnlineToday: 14239524,
    tongDtToday: 78545056,
    totalBillsToday: 537,
    growthVsYesterday: 1.5
  },
  {
    rankLuyKe: 9,
    rankRetime: 9,
    code: "10070",
    name: "BHX_AGI_CPH - Thạnh Mỹ Tây",
    shortName: "Thạnh Mỹ Tây",
    addressName: "Thạnh Mỹ Tây, Châu Phú",
    province: "Tỉnh An Giang",
    cluster: "Châu Phú",
    tier: "1.2 Tỷ -> <2 Tỷ",
    openDate: "02/10/2021",
    thucHien: 372074899,
    base: 2115314759,
    percentComplete: 17.59,
    conLai: 1743239860,
    dtOfflineToday: 48442396,
    dtOnlineToday: 25972584,
    tongDtToday: 74414980,
    totalBillsToday: 421,
    growthVsYesterday: 3.7
  },
  {
    rankLuyKe: 10,
    rankRetime: 10,
    code: "4687",
    name: "BHX_AGI_LXU - Thửa 1615 Mỹ Quý",
    shortName: "Thửa 1615 Mỹ Quý",
    addressName: "Thửa 1615, P. Mỹ Quý, Long Xuyên",
    province: "Tỉnh An Giang",
    cluster: "Long Xuyên",
    tier: "1.2 Tỷ -> <2 Tỷ",
    openDate: "12/03/2019",
    thucHien: 301226678,
    base: 2112759295,
    percentComplete: 14.26,
    conLai: 1811532617,
    dtOfflineToday: 49323389,
    dtOnlineToday: 10921947,
    tongDtToday: 60245336,
    totalBillsToday: 412,
    growthVsYesterday: 2.0
  },
  {
    rankLuyKe: 11,
    rankRetime: 11,
    code: "4684",
    name: "BHX_AGI_CPH - Thửa 145 Vĩnh Thuận (Chợ Vịnh Tre)",
    shortName: "Thửa 145 Vĩnh Thuận",
    addressName: "Thửa 145, Vịnh Tre, Vĩnh Thạnh Trung",
    province: "Tỉnh An Giang",
    cluster: "Châu Phú",
    tier: "1.2 Tỷ -> <2 Tỷ",
    openDate: "18/06/2019",
    thucHien: 230785597,
    base: 1618695985,
    percentComplete: 14.26,
    conLai: 1387910388,
    dtOfflineToday: 37789242,
    dtOnlineToday: 8367878,
    tongDtToday: 46157119,
    totalBillsToday: 315,
    growthVsYesterday: 0.9
  },
  {
    rankLuyKe: 12,
    rankRetime: 12,
    code: "8873",
    name: "BHX_AGI_TBI - An Hảo",
    shortName: "An Hảo",
    addressName: "Ấp An Hòa, An Hảo, Tịnh Biên",
    province: "Tỉnh An Giang",
    cluster: "Tịnh Biên",
    tier: "1.2 Tỷ -> <2 Tỷ",
    openDate: "01/08/2021",
    thucHien: 211865101,
    base: 1485990436,
    percentComplete: 14.26,
    conLai: 1274125335,
    dtOfflineToday: 34691166,
    dtOnlineToday: 7681854,
    tongDtToday: 42373020,
    totalBillsToday: 290,
    growthVsYesterday: 1.7
  },
  {
    rankLuyKe: 13,
    rankRetime: 13,
    code: "9307",
    name: "BHX_AGI_LXU - Mỹ Hòa Hưng",
    shortName: "Mỹ Hòa Hưng",
    addressName: "Ấp Mỹ An, Mỹ Hòa Hưng, Long Xuyên",
    province: "Tỉnh An Giang",
    cluster: "Long Xuyên",
    tier: "1.2 Tỷ -> <2 Tỷ",
    openDate: "12/09/2021",
    thucHien: 209235910,
    base: 1467549673,
    percentComplete: 14.26,
    conLai: 1258313763,
    dtOfflineToday: 34260658,
    dtOnlineToday: 7586524,
    tongDtToday: 41847182,
    totalBillsToday: 286,
    growthVsYesterday: 1.1
  },
  {
    rankLuyKe: 14,
    rankRetime: 14,
    code: "9376",
    name: "BHX_AGI_TTO - Lương An Trà (Giồng Cát)",
    shortName: "Lương An Trà (Giồng Cát)",
    addressName: "Lương An Trà, Tri Tôn",
    province: "Tỉnh An Giang",
    cluster: "Tri Tôn",
    tier: "1.2 Tỷ -> <2 Tỷ",
    openDate: "28/09/2021",
    thucHien: 186112786,
    base: 1305367509,
    percentComplete: 14.26,
    conLai: 1119254723,
    dtOfflineToday: 30474437,
    dtOnlineToday: 6748120,
    tongDtToday: 37222557,
    totalBillsToday: 254,
    growthVsYesterday: 1.4
  },
  {
    rankLuyKe: 15,
    rankRetime: 15,
    code: "27944",
    name: "BHX_AGI_VGI - Vĩnh Gia",
    shortName: "Vĩnh Gia",
    addressName: "Ấp Vĩnh Cầu, Vĩnh Gia, Tri Tôn",
    province: "Tỉnh An Giang",
    cluster: "Tri Tôn",
    tier: "1.2 Tỷ -> <2 Tỷ",
    openDate: "15/01/2020",
    thucHien: 176449309,
    base: 1237589316,
    percentComplete: 14.26,
    conLai: 1061140007,
    dtOfflineToday: 28892122,
    dtOnlineToday: 6397740,
    tongDtToday: 35289862,
    totalBillsToday: 241,
    growthVsYesterday: 0.5
  },
  {
    rankLuyKe: 16,
    rankRetime: 16,
    code: "15033",
    name: "BHX_AGI_LXU - Bình Đức",
    shortName: "Bình Đức",
    addressName: "P. Bình Đức, TP. Long Xuyên",
    province: "Tỉnh An Giang",
    cluster: "Long Xuyên",
    tier: "1.2 Tỷ -> <2 Tỷ",
    openDate: "10/05/2021",
    thucHien: 171595668,
    base: 1203546592,
    percentComplete: 14.26,
    conLai: 1031950924,
    dtOfflineToday: 28097378,
    dtOnlineToday: 6221755,
    tongDtToday: 34319134,
    totalBillsToday: 235,
    growthVsYesterday: 1.2
  },
  {
    rankLuyKe: 17,
    rankRetime: 17,
    code: "29756",
    name: "BHX_AGI_VTT - Chợ Kênh 7",
    shortName: "Chợ Kênh 7",
    addressName: "Kênh 7, Vĩnh An, Châu Thành",
    province: "Tỉnh An Giang",
    cluster: "Châu Thành",
    tier: "1.2 Tỷ -> <2 Tỷ",
    openDate: "11/06/2020",
    thucHien: 152101700,
    base: 1066818791,
    percentComplete: 14.26,
    conLai: 914717091,
    dtOfflineToday: 24905401,
    dtOnlineToday: 5514939,
    tongDtToday: 30420340,
    totalBillsToday: 208,
    growthVsYesterday: 4.2
  },
  {
    rankLuyKe: 18,
    rankRetime: 18,
    code: "35562",
    name: "BHX_AGI_CTO - Chợ Tà Đảnh",
    shortName: "Chợ Tà Đảnh",
    addressName: "Xã Tà Đảnh, Tri Tôn",
    province: "Tỉnh An Giang",
    cluster: "Tri Tôn",
    tier: "1.2 Tỷ -> <2 Tỷ",
    openDate: "25/03/2022",
    thucHien: 142575008,
    base: 1000000000,
    percentComplete: 14.26,
    conLai: 857424992,
    dtOfflineToday: 23345484,
    dtOnlineToday: 5169517,
    tongDtToday: 28515002,
    totalBillsToday: 195,
    growthVsYesterday: -0.4
  },
  {
    rankLuyKe: 19,
    rankRetime: 19,
    code: "29909",
    name: "BHX_AGI_VHA - Vĩnh Nhuận",
    shortName: "Vĩnh Nhuận",
    addressName: "Vĩnh Nhuận, Châu Thành",
    province: "Tỉnh An Giang",
    cluster: "Châu Thành",
    tier: "1.2 Tỷ -> <2 Tỷ",
    openDate: "25/06/2020",
    thucHien: 129505269,
    base: 908330767,
    percentComplete: 14.26,
    conLai: 778825498,
    dtOfflineToday: 21205422,
    dtOnlineToday: 4695632,
    tongDtToday: 25901054,
    totalBillsToday: 177,
    growthVsYesterday: 3.1
  },
  {
    rankLuyKe: 20,
    rankRetime: 20,
    code: "35547",
    name: "BHX_AGI_CTO - Chợ Cô Tô",
    shortName: "Chợ Cô Tô",
    addressName: "TT. Cô Tô, Tri Tôn",
    province: "Tỉnh An Giang",
    cluster: "Tri Tôn",
    tier: "1.2 Tỷ -> <2 Tỷ",
    openDate: "18/03/2022",
    thucHien: 121260046,
    base: 850500000,
    percentComplete: 14.26,
    conLai: 729239954,
    dtOfflineToday: 19855334,
    dtOnlineToday: 4396675,
    tongDtToday: 24252009,
    totalBillsToday: 166,
    growthVsYesterday: 2.3
  },
  {
    rankLuyKe: 21,
    rankRetime: 21,
    code: "30455",
    name: "BHX_AGI_ACU - Văn Giáo",
    shortName: "Văn Giáo",
    addressName: "Văn Giáo, Tịnh Biên",
    province: "Tỉnh An Giang",
    cluster: "Tịnh Biên",
    tier: "1.2 Tỷ -> <2 Tỷ",
    openDate: "15/09/2020",
    thucHien: 112614670,
    base: 789862611,
    percentComplete: 14.26,
    conLai: 677247941,
    dtOfflineToday: 18439725,
    dtOnlineToday: 4083209,
    tongDtToday: 22522934,
    totalBillsToday: 154,
    growthVsYesterday: 0.8
  }
];

export const SUMMARY_STATS = {
  totalStores: 21,
  activeStores: 21,
  currentDate: "05/11/2026",
  reportMonth: "11/2026",
  daysInMonth: 30,
  currentDay: 5,
  expectedProgress: 16.67,
  totalThucHien: 6205486038,
  totalBase: 42733168495,
  totalConLai: 36527682457,
  totalDtToday: 1241097209,
  totalDtOfflineToday: 1034278675,
  totalDtOnlineToday: 206818534,
  totalBillsToday: 8094
};

export function formatVND(num: number): string {
  return new Intl.NumberFormat('vi-VN').format(Math.round(num)) + ' đ';
}

export function formatVNDShort(num: number): string {
  if (num >= 1000000000) {
    return (num / 1000000000).toFixed(2).replace('.', ',') + ' Tỷ';
  }
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace('.', ',') + ' Tr';
  }
  return formatVND(num);
}
