# HÀ TIÊN — MARKET & MARKETING AGENT PACK V1

**Phiên bản:** 1.0.0  
**Ngày dựng:** 28/08/2026  
**Mục đích:** biến bộ Fullstack Marketing Unified Skill thành hệ vận hành theo từng case cho dự án **Hà Tiên — Market & PR-MKT Command Center**.

## 1. Đã dựng những gì

### Bốn agent bundle từ file nguồn

1. **MKT Strategist** — chiến lược, nghiên cứu đối thủ, insight, KPI, brief chiến dịch.
2. **Content Producer** — lịch nội dung, video, copy quảng cáo, brief UGC/EGC/KOC.
3. **Channel Operator** — thiết lập kênh, landing page, email, social listening, referral.
4. **Performance Analyst** — phân tích dữ liệu, audit hiệu suất, KPI ngược, báo cáo, A/B test.

### Ba lớp kiểm soát riêng của Hà Tiên

1. **G0 Case Controller** — nhận từng case, đọc context, chọn agent/skill, hợp nhất kết quả và chỉ trình quyết định thật sự cần anh Hải.
2. **G7 Proof & QA** — chặn claim, model, thông số, luật/tiêu chuẩn, media, canonical, CTA hoặc tracking chưa đủ bằng chứng.
3. **Product R&D Liaison** — chuyển cơ hội sản phẩm mới/biến thể sang Product R&D; không tự tạo Product, SKU, Opportunity hoặc báo giá.

### Thư viện

- **21 skill marketing tổng quát** được tách thành từng thư mục trong gói tải về.
- **1 skill domain chuyên biệt** về tính suất ăn/bếp công nghiệp, đặt riêng để không làm lệch router marketing.
- Ba workflow gốc: campaign launch, content production, monthly cycle.
- Workflow mới: **case-by-case**.
- Product Marketing Context làm sẵn cho Hà Tiên ở mức **working context nội bộ**.

## 2. Nguyên tắc kiến trúc

Không tạo 20 agent độc lập. **Skill là năng lực; agent là người điều phối một nhóm năng lực.** Tạo quá nhiều agent sẽ sinh trùng lặp, tranh quyền và đẩy việc thô lên sếp.

Hệ này dùng:

```text
CASE MỚI
→ G0 phân loại
→ chọn 1 agent chủ trì
→ gọi 1–4 skill cần thiết
→ agent phối hợp nếu thật sự cần
→ G7 kiểm bằng chứng/rủi ro
→ trả kết luận + việc làm + KPI
→ chỉ tạo Decision Pack khi có quyết định ảnh hưởng thật
```

## 3. Cách chạy từng case

Gửi yêu cầu theo dạng tự nhiên hoặc dùng mẫu:

```text
CASE: [mô tả vấn đề]
Kết quả cần: [quyết định/kế hoạch/nội dung/phân tích]
Dữ liệu có sẵn: [file, link, số liệu]
Deadline: [nếu có]
```

G0 tự mở mã:

```text
MKTCASE-YYYYMMDD-NNN
```

Mỗi case trả về tối thiểu:

- Kết luận điều hành.
- Dữ liệu và giả định.
- Agent chủ trì + skill đã dùng.
- Phân tích và bằng chứng.
- Bảng hành động: việc gì, ai làm, khi nào, KPI.
- Rủi ro/P0/P1.
- Quyết định cần anh Hải, nếu có.

## 4. Ranh giới bắt buộc

- Không tự xuất bản website/mạng xã hội.
- Không tự ghi CRM, tạo Opportunity, báo giá, Product hoặc SKU.
- Không tự đổi ngân sách/chạy quảng cáo.
- Không gọi `DONE`, `LIVE`, `Đã đăng` khi chưa có bằng chứng runtime/nhà cung cấp.
- Nội dung public phải qua G7 và tiêu chuẩn bài viết Hà Tiên v2.1.
- Nguồn không rõ không được biến thành fact.
- Agent không đẩy enquiry thô lên anh Hải; phải nghiên cứu tới mức đủ quyết định.

## 5. Runtime thực tế

Đây là **bộ prompt, router, context và workflow**. Nó chạy khi được ChatGPT/Codex/Claude/Gemini đọc và thực thi. File này **không tự tạo scheduler hoặc tiến trình nền**. Lịch tự động cần workflow/runner riêng và phải có bằng chứng chạy thật.

## 6. Thư mục chính

```text
marketing-agent-pack/
├── README.md
├── router/
├── .agents/
├── cases/
└── governance/
```

Bản đầy đủ 60 file, gồm 22 skill đã tách, được xuất thành ZIP để dùng ngoài repository.