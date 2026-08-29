# CASE 01 — Dashboard duyệt mobile và UAT an toàn

**Case ID:** `MKTCASE-20260828-001`  
**Mức:** P0  
**Trạng thái triển khai:** READY FOR TEST

## Kết quả phải có

- Ba màn: Tổng quan, Cần quyết định, Chờ đăng/lịch đăng.
- Demo có banner rõ và chỉ mô phỏng tại trình duyệt.
- Dữ liệu UAT có tiền tố `UAT-`, tạo/xóa bằng hàm riêng.
- Backend khóa ghi, chống ghi đè, kiểm ID và chặn lịch quá khứ.
- Tester chụp 360/390 px và test Sheet end-to-end.

## Không được gọi hoàn thành khi

- Chỉ có ảnh preview hoặc dữ liệu demo.
- Chưa ghi đúng dòng Google Sheet thật.
- Chưa test hai tab cùng lúc.
- Chưa kiểm `RunLog`.

## Lệnh/hàm UAT

1. `prepareMarketDashboardUat()`.
2. Mở Web App và thao tác trên bản ghi `UAT-`.
3. Kiểm cột quyết định, thời gian, trạng thái và `RunLog`.
4. `cleanupMarketDashboardUat()` sau nghiệm thu.
