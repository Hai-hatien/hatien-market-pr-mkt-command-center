# CASE 02 — Google Search Console và dữ liệu thật

**Case ID:** `MKTCASE-20260828-002`  
**Mức:** P0  
**Trạng thái triển khai:** READY FOR TEST

## Phạm vi

- Kết nối Google Search Console chính chủ bằng OAuth Apps Script.
- Hai property: `hatiencorp.vn` và `hatiengroup.com`.
- Ghi dữ liệu vào `GSC_Daily`.

## Nghiệm thu

Chạy `runGoogleSearchConsoleUat()` và xác nhận:

- `connection.ok = true`;
- có cả hai domain;
- `rowsWritten > 0` hoặc ghi rõ kỳ không có dữ liệu;
- `getGoogleSearchConsoleDataStatus().ok = true`;
- báo cáo không dùng dữ liệu demo để thay cho GSC thật.
