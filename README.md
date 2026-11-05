# Bách Hóa Xanh - Dashboard Báo Cáo Kinh Doanh Siêu Thị

Trang web Dashboard báo cáo kinh doanh hiện đại, chuẩn nhận diện chuỗi siêu thị Bách Hóa Xanh (Xanh lá `#007738` & Vàng `#FFC700`), hiển thị số liệu 21 siêu thị khu vực Tỉnh An Giang.

## 🚀 Tính Năng Chính
- **Chỉ số tổng quan (KPIs)**: Tổng DT Lũy Kế, Doanh thu Retime hôm nay, 21/21 siêu thị hoạt động, tổng số bill hôm nay.
- **Biểu đồ cột (Chart.js)**: Trực quan hóa Top các siêu thị doanh thu dẫn đầu (Top Lũy Kế, Top Retime Hôm Nay, % Hoàn thành Base).
- **Bảng 1**: Báo cáo Lũy Kế Doanh Thu Khu Vực (Xếp hạng, Tên siêu thị, Thực hiện, Base, % Hoàn thành, Còn lại).
- **Bảng 2**: Báo cáo Retime Doanh Thu Hôm Nay (Xếp hạng, Tên siêu thị, DT Offline, DT Online, Tổng Doanh Thu VNĐ, Số Hóa Đơn).
- **Bộ lọc & Tìm kiếm**: Tìm theo tên siêu thị, mã ĐN (6119, 6220...), lọc theo Loại Kho (5-8 Tỷ, 3-5 Tỷ, 1.2-2 Tỷ).
- **Tải file HTML đơn**: Tải file `bachhoaxanh_dashboard.html` độc lập chạy trực tiếp không cần server.

---

## 🌐 Hướng Dẫn Đưa Lên GitHub & Bật GitHub Pages Miễn Phí

### ⚡ CÁCH 1: Đẩy mã nguồn này lên GitHub (Khuyên dùng)

1. Mở trang [GitHub.com/new](https://github.com/new) và tạo một repository mới (ví dụ đặt tên: `bach-hoa-xanh-dashboard`). Chọn chế độ **Public**.
2. Trên máy tính của bạn (trong thư mục dự án), chạy 3 câu lệnh sau:
   ```bash
   git remote add origin https://github.com/<USERNAME>/<REPO_NAME>.git
   git branch -M main
   git push -u origin main
   ```
3. Sau khi đẩy code lên:
   - Vào mục **Settings** của repository trên GitHub.
   - Chọn mục **Pages** ở thanh bên trái.
   - Tại mục **Build and deployment > Source**, chọn: **GitHub Actions**.
   - Dự án đã tích hợp sẵn workflow tự động `.github/workflows/deploy.yml`, GitHub sẽ tự động build và cung cấp link truy cập dạng:
     `https://<USERNAME>.github.io/<REPO_NAME>/`

---

### 🟢 CÁCH 2: Upload trực tiếp 1 file HTML duy nhất lên GitHub (Không cần gõ lệnh)

1. Tải file `bachhoaxanh_dashboard.html` từ trang web về máy tính, hoặc đổi tên thành `index.html`.
2. Tạo 1 repository mới trên [GitHub](https://github.com/new).
3. Bấm **Upload files**, kéo thả file `index.html` vào và bấm **Commit changes**.
4. Vào **Settings > Pages > Branch**: chọn `main` (thư mục `/root`), bấm **Save**.
5. Đợi 1 phút, trang web của bạn sẽ hoạt động tại: `https://<USERNAME>.github.io/<REPO_NAME>/`
