# CASE 04 — Business Case nội dung và cổng duyệt xuất bản

**Case ID:** `MKTCASE-20260828-004`  
**Mức:** P0  
**Trạng thái triển khai:** READY FOR TEST

## Trước khi anh Hải duyệt

Mỗi bài phải trả lời rõ:

- Đang duyệt tiêu đề, brief hay toàn bộ bài?
- Đã áp tiêu chuẩn bài website Hà Tiên chưa?
- Giá trị cụ thể: thương hiệu, SEO, từ khóa, sales, uy tín hoặc hỗ trợ dự án?
- Từ khóa chính và ý định tìm kiếm là gì?
- CTA và trang đích là gì?
- Nguồn/căn cứ nào đã kiểm?
- QA/G7 đạt chưa?
- Điểm SEO và URL dự kiến?
- Có bản xem trước hoàn chỉnh chưa?
- Sau duyệt sẽ đăng khi nào, ở đâu và ai kiểm sau đăng?

## Cổng kỹ thuật

`DANG_NGAY` hoặc `LEN_LICH_DANG` chỉ được ghi khi:

```text
publish_ready = YES
qa_status = PASS | VERIFIED | DAT
preview_url != rỗng
```

Duyệt không đồng nghĩa hệ thống tự publish. Trạng thái LIVE chỉ được ghi sau khi URL, mobile, CTA, tracking và nội dung thực tế đã kiểm.
