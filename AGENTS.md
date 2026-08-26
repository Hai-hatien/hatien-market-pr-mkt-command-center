# AGENTS.md — HT-MARKET-PRMKT-V1

## Phạm vi

Tệp này áp dụng cho toàn bộ repository độc lập:

`Hai-hatien/hatien-market-pr-mkt-command-center`

Tọa độ dự án:

- Google Sheet Master: `1Ny1Rr9SHBO7s090J-eIZfpTo_JzgEvpvzr46nXnhwvI`
- Branch làm việc hiện tại: `migration/import-market-command-center-v1`
- Sản phẩm cần hoàn thành: Mobile Dashboard V1 cho Anh Hải.

## Nhiệm vụ duy nhất

Tiếp tục lập trình, kiểm thử và chuẩn bị triển khai Mobile Dashboard V1 cho tới khi đạt toàn bộ Điều kiện Hoàn thành bên dưới.

Không dừng ở phân tích, kế hoạch, mockup, source tĩnh hoặc báo cáo tiến độ. Sau khi đọc trạng thái hiện tại, phải sửa code tiếp ngay ở hạng mục chưa hoàn tất có mức ưu tiên cao nhất.

## Vòng lặp làm việc bắt buộc

Trong mỗi phiên làm việc:

1. Đọc `AGENTS.md`, `CONTINUOUS_AGENT_STATE.md`, pull request đang mở và code hiện tại.
2. Xác định đúng một lát cắt nhỏ nhất còn thiếu để tiến gần Điều kiện Hoàn thành.
3. Triển khai code thật.
4. Chạy kiểm tra liên quan; nếu kiểm tra lỗi thì sửa và chạy lại.
5. Kiểm tra giao diện ở chiều rộng 360 px và 390 px; không được tràn ngang.
6. Commit thay đổi vào đúng branch.
7. Cập nhật `CONTINUOUS_AGENT_STATE.md` bằng bằng chứng, việc còn lại và bước tiếp theo.
8. Nếu chưa đạt Điều kiện Hoàn thành, tiếp tục lát cắt tiếp theo trong cùng phiên cho tới khi hết thời gian hoặc giới hạn sử dụng.
9. Khi phiên buộc phải kết thúc nhưng dự án chưa xong, để lại trạng thái đủ chi tiết để phiên/Automation kế tiếp tiếp tục mà không cần hỏi lại người dùng.

Chỉ được dừng và báo hoàn thành khi toàn bộ Điều kiện Hoàn thành đã đạt, hoặc gặp blocker thật sự chỉ chủ sở hữu mới giải quyết được.

## UX dành cho Anh Hải

Giao diện phải hoàn toàn bằng tiếng Việt dễ hiểu. Không hiển thị trên giao diện sếp:

- mã luồng `G0/G1/G7`;
- `claim`, `gate`, `pending`, `approve task`, `run ID`;
- tên hàm, schema, trạng thái kỹ thuật hoặc mã nội bộ;
- bảng nhiều cột buộc kéo ngang.

Mobile là chuẩn thiết kế đầu tiên. Desktop chỉ mở rộng từ mobile.

Dashboard chỉ có ba màn chính:

1. **Tổng quan sáng nay**
   - Số việc cần quyết định.
   - Tín hiệu/cơ hội đáng chú ý.
   - Việc AI đang tự xử lý không cần Anh Hải can thiệp.

2. **Việc cần Anh Hải quyết định**
   - Chỉ hiện hồ sơ đã được AI làm rõ và có đủ lý do để duyệt.
   - Mỗi thẻ phải trả lời: Việc gì? Vì sao đáng làm? Bằng chứng nào? Giá trị SEO/Thương hiệu/Sales/R&D? Rủi ro? Khuyến nghị gì?
   - Quyết định nghiệp vụ: `Đồng ý`, `Nghiên cứu thêm`, `Tạm hoãn`, `Không làm`.

3. **Bài chờ đăng / lịch đăng**
   - Phân biệt rõ duyệt có nên viết với duyệt bản cuối để xuất bản.
   - Duyệt xuất bản chỉ có: `Đăng ngay`, `Lên lịch đăng`, `Sửa lại`, `Không đăng`.
   - Lên lịch phải có ngày, giờ, website/kênh.

## Ranh giới nghiệp vụ

- Đồng ý đề tài không đồng nghĩa được phép xuất bản.
- Không tự publish WordPress.
- Không tự duyệt pháp lý, tiêu chuẩn, thông số hoặc quyết định kinh doanh.
- Không ghi CRM.
- Không dùng GSC Wizard. Search Console phải đi qua collector chính chủ trong `apps-script/GSCCollector.gs` và tab `GSC_Daily`.
- Không báo `LIVE`, `DONE`, `Đã đăng` nếu chưa có URL thật và kiểm tra sau đăng.
- Không tạo thêm workflow hoặc tab nếu chưa chứng minh cần thiết.
- Không commit secret hoặc in giá trị của `HT_WP_APP_PASSWORD`, `GEMINI_API_KEY`, token hoặc khóa truy cập.

## Điều kiện Hoàn thành

### A. Chức năng

- `doGet()` phục vụ được Web App.
- Ba màn chính hoạt động và chuyển màn được trên điện thoại.
- Dữ liệu thật đọc từ Google Sheet; demo mode chỉ phục vụ UAT.
- Quyết định của Anh Hải được ghi đúng dòng, chống ghi đè và chống ghi nhầm sau khi Sheet thay đổi.
- Lịch đăng không cho chọn thời điểm trong quá khứ.
- Bài đã lên lịch vẫn hiển thị ngày/giờ rõ ràng.
- Collector Search Console chính chủ có kiểm tra property `hatiencorp.vn` và `hatiengroup.com` và ghi `GSC_Daily`.

### B. UX

- Không tràn ngang ở 360 px và 390 px.
- Vùng bấm tối thiểu phù hợp điện thoại.
- Không có thuật ngữ kỹ thuật trên màn hình sếp.
- Mở Dashboard trong 3–5 giây phải hiểu hôm nay cần quyết định gì.
- Không có bảng 15–20 cột trên mobile.

### C. Chất lượng

- Có kiểm tra tĩnh/logic cho các hàm backend quan trọng.
- Có kiểm tra giao diện mobile hoặc ảnh/render UAT.
- Không còn blocker P0 ngăn người dùng sử dụng ba luồng chính.
- Pull request mô tả đúng trạng thái và không tuyên bố runtime khi chưa có bằng chứng.

### D. Bằng chứng sử dụng thật

Một trong hai đường sau phải đạt:

1. Web App URL truy cập được và có bằng chứng ba màn chạy thật; hoặc
2. Nếu thiếu duy nhất Apps Script `scriptId`/quyền deploy của chủ sở hữu, phải có preview chạy được, bộ test đạt, manifest deploy chính xác và một blocker duy nhất với thao tác chủ sở hữu tối thiểu.

Mockup, ảnh AI, source HTML chưa chạy hoặc ZIP không được tính là hoàn thành.

## Blocker được phép hỏi chủ sở hữu

Chỉ hỏi Anh Hải khi blocker thuộc một trong các nhóm sau và đã thử mọi đường an toàn khác:

- Google OAuth cần chủ tài khoản bấm cấp quyền;
- thiếu Apps Script `scriptId`/deployment ID mà không thể tìm từ repo/Drive;
- quyền truy cập hệ thống không thể cấp qua các kết nối hiện có;
- quyết định nghiệp vụ có tác động public/production.

Khi báo blocker, phải ghi đúng một thao tác ngắn nhất Anh Hải cần làm và phần code đã hoàn tất tới đâu.

## Kỷ luật Git

- Chỉ làm trong repository này.
- Commit nhỏ, mô tả rõ.
- Không force-push.
- Không merge khi chưa có bằng chứng theo Điều kiện Hoàn thành.
- Không sửa sang HTG, HTC, STG hoặc repo cũ.

## Tiêu chuẩn báo cáo cuối

Báo hoàn thành phải có:

- URL preview/Web App;
- commit SHA cuối;
- kết quả kiểm tra;
- ảnh/render 360 px và 390 px;
- danh sách ba màn đã hoạt động;
- phần nào chạy thật, phần nào còn phụ thuộc deploy/OAuth;
- không dùng từ `xong`, `PASS`, `LIVE` nếu bằng chứng không hỗ trợ.
