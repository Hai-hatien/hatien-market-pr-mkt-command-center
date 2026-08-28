# CASE ROUTER — HÀ TIÊN MARKET & MARKETING

## 1. Router cấp agent

| Dạng case | Agent chủ trì | Skill mặc định | Phối hợp |
|---|---|---|---|
| Chính sách, xu hướng, đối thủ, tín hiệu thị trường | MKT Strategist / G1 | 08, 15, 09 | G7; Product R&D nếu có cơ hội sản phẩm |
| Khách hàng, use case, JTBD, định vị, giá trị | MKT Strategist / G2 | 09, 16, 17 | G4/G5 |
| Kế hoạch marketing, GTM, campaign | MKT Strategist / G5 | 00, 02, 10, 11, 12, 19 | Content Producer, Channel Operator |
| Lịch nội dung, bài social, video, copy, UGC | Content Producer / G4 | 01, 04, 05, 06 | G7 trước public |
| Landing page, email, kênh, automation, social listening, referral | Channel Operator / G5/G8 | 11, 12, 14, 15, 18 | G6 đo lường; G7 compliance |
| Data ads/GA4/GSC/Sheet, hiệu suất, báo cáo, KPI | Performance Analyst / G6 | 03, 07, 10, 13, 19 | G0 quyết định ưu tiên |
| Tính suất ăn, công suất bếp, phân khu, thiết bị | Product R&D Liaison | skill-tinh-suat-an-hatiens | Kỹ thuật/R&D/G7 |
| Bài website, trang giải pháp, model, case study | Content Producer + G7 | 09, 12, 01 và chuẩn bài v2.1 | Kỹ thuật, SEO, Web |
| Vấn đề không rõ loại | G0 Case Controller | product-marketing-context | Chỉ hỏi tối đa 4 câu thiết yếu |

## 2. Router cấp skill

| Tín hiệu/trigger | Skill |
|---|---|
| lập kế hoạch, GTM, launch | 00-ke-hoach-mkt |
| lịch đăng, content calendar | 01-lich-noi-dung |
| brief chiến dịch | 02-brief-chien-dich |
| CPMess cao, ROAS thấp, audit | 03-danh-gia-hieu-suat |
| script TikTok/Reels/Shorts | 04-script-video |
| copy quảng cáo | 05-copy-quang-cao |
| brief UGC/EGC/KOC | 06-brief-ugc-egc |
| báo cáo tuần/tháng | 07-bao-cao-marketing |
| đối thủ/cạnh tranh | 08-nghien-cuu-doi-thu |
| insight/persona/JTBD/journey | 09-insight-khach-hang |
| tính ngân sách/KPI ngược | 10-tinh-kpi-nguoc |
| thiết lập kênh | 11-thiet-lap-kenh |
| brief landing page | 12-brief-landing-page |
| đọc/phân tích dữ liệu | 13-phan-tich-du-lieu |
| email/sequence/automation | 14-email-marketing |
| brand monitoring/crisis | 15-social-listening |
| tâm lý/FOMO/social proof | 16-marketing-psychology |
| pricing/gói giá | 17-pricing-strategy |
| referral/affiliate | 18-referral-program |
| A/B test | 19-ab-test-setup |
| suất ăn/bếp công nghiệp/công suất/phân khu | domain skill tính suất ăn Hà Tiên |

## 3. Cổng trước khi chạy

1. Đọc `.agents/product-marketing-context.md`.
2. Kiểm dữ liệu đầu vào đã đủ chưa; chỉ hỏi tối đa 4 câu và không hỏi lại dữ liệu đã có.
3. Xác định case có cần web research, file/Drive/GSC/CRM hay không.
4. Xác định quyền: chỉ đọc, đề xuất, hay được phép ghi.
5. Xác định có nội dung public/claim kỹ thuật/pháp lý hay không; nếu có, G7 bắt buộc.

## 4. Cổng kết thúc

Case chỉ được chuyển `READY_FOR_ACTION` khi:

- Kết luận có căn cứ.
- Dữ liệu thiếu được nêu rõ.
- Có hành động, owner, deadline và KPI.
- Không còn P0.
- Không gọi trạng thái public/runtime nếu chưa có bằng chứng.

## 5. Khi nào mới trình anh Hải

Chỉ tạo Decision Pack khi cần một quyết định có ảnh hưởng thật, ví dụ:

- mở/không mở chương trình Audit;
- mở/không mở R&D sản phẩm mới;
- đầu tư/không đầu tư campaign hoặc ngân sách;
- chọn giữa hai kiến trúc/định vị có đánh đổi;
- duyệt public/production.

Không trình enquiry thô, câu hỏi nghiên cứu, lỗi kỹ thuật có thể tự điều tra hoặc việc agent có thể tự xử lý trong quyền hiện có.