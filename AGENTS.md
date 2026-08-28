# AGENTS.md — HT-MARKET-PRMKT-V1

## Tọa độ

- Repository: `Hai-hatien/hatien-market-pr-mkt-command-center`
- Google Sheet Master: `1Ny1Rr9SHBO7s090J-eIZfpTo_JzgEvpvzr46nXnhwvI`
- Branch hiện tại: `recovery/ht-market-pr-mkt-20260825`
- Sản phẩm cần hoàn thành: Mobile Dashboard V1 cho Anh Hải.

## Model routing bắt buộc

Policy chính thức nằm tại:

```text
marketing-agent-pack/governance/model-routing.json
marketing-agent-pack/governance/model-routing.md
```

Quy tắc owner đã chốt:

| Nhóm agent / vai trò | Model tier |
|---|---|
| BA, PO, PM, CMO | `GPT_5_6_SOL_EXTRA_HIGH` |
| DEV, Content Creator, Designer | `GPT_5_5_MEDIUM` |
| Các agent thuộc team Marketing | `GPT_5_5_EXTRA_HIGH` |

Khi một agent có tên cụ thể trong `agent_overrides`, phải dùng override đó trước mọi team default. Lệnh kiểm tra:

```bash
node tests/model-routing-contract.mjs
node scripts/resolve-agent-model.mjs g0-case-controller
```

Gán model không thay quyền nghiệp vụ: model mạnh hơn vẫn không được tự publish, tự ghi CRM, tự tạo Product/SKU/Opportunity/Quote hoặc tự gọi LIVE/DONE khi thiếu bằng chứng.

## Nhiệm vụ coding agent

Tiếp tục lập trình, kiểm thử và chuẩn bị triển khai cho tới khi có bằng chứng sử dụng thật. Không dừng ở phân tích, kế hoạch, mockup, source tĩnh hoặc một commit.

Mỗi phiên phải chạy vòng lặp:

1. Đọc `AGENTS.md`, `CONTINUOUS_AGENT_STATE.md`, PR và source hiện tại.
2. Chọn phần còn thiếu quan trọng nhất.
3. Code thật.
4. Chạy test; lỗi thì sửa và chạy lại.
5. Kiểm tra mobile 360 px và 390 px, không tràn ngang.
6. Commit vào đúng branch.
7. Cập nhật `CONTINUOUS_AGENT_STATE.md`.
8. Tiếp tục lát cắt kế tiếp cho tới khi hết phiên hoặc đạt Điều kiện Hoàn thành.

## UX dành cho Anh Hải

Dashboard chỉ có ba màn:

1. **Tổng quan sáng nay**
2. **Việc cần Anh Hải quyết định**
3. **Bài chờ đăng / lịch đăng**

Không hiển thị trên giao diện sếp: `G0/G7`, claim, gate, pending, approve task, run ID, schema, tên hàm hoặc bảng nhiều cột.

Chỉ có hai cổng nghiệp vụ:

- Có nên làm/viết không: `Đồng ý`, `Nghiên cứu thêm`, `Tạm hoãn`, `Không làm`.
- Có cho xuất bản không: `Đăng ngay`, `Lên lịch đăng`, `Sửa lại`, `Không đăng`.

Đồng ý đề tài không đồng nghĩa được phép xuất bản.

## Ranh giới

- Không tự publish WordPress.
- Không ghi CRM.
- Không tự duyệt pháp lý, tiêu chuẩn, thông số hoặc quyết định kinh doanh.
- Không dùng GSC Wizard; Search Console đi qua `apps-script/GSCCollector.gs` và tab `GSC_Daily`.
- Không báo LIVE/DONE nếu chưa có URL thật và kiểm tra sau đăng.
- Không commit hoặc in secret: `HT_WP_APP_PASSWORD`, `GEMINI_API_KEY`, token, API key.
- Không sửa sang HTG, HTC, STG hoặc repo cũ.

## Điều kiện Hoàn thành

- `doGet()` phục vụ Web App.
- Ba màn chạy và chuyển màn được trên điện thoại.
- Đọc dữ liệu thật từ Google Sheet; demo chỉ dùng UAT.
- Quyết định ghi đúng dòng, chống ghi đè và chống ghi nhầm sau khi Sheet thay đổi.
- Không cho lên lịch trong quá khứ; bài đã lên lịch hiển thị rõ ngày/giờ.
- GSC collector đọc được `hatiencorp.vn` và `hatiengroup.com`, ghi `GSC_Daily` sau OAuth.
- Có test backend và render UAT 360/390 px.
- Có URL preview/Web App hoặc, nếu thiếu duy nhất scriptId/quyền deploy, có preview chạy được, test đạt, deploy manifest chính xác và đúng một owner blocker.

Mockup, ảnh AI, source chưa chạy hoặc ZIP không tính là hoàn thành.

## Khi được hỏi chủ sở hữu

Chỉ hỏi khi cần:

- bấm Google OAuth;
- xác nhận Apps Script `scriptId`/deployment ID;
- cấp quyền không thể tự lấy;
- duyệt public/production.

Mỗi lần chỉ đưa một thao tác ngắn nhất.

## Báo cáo cuối

Phải có URL, commit SHA, test thật, render 360/390 px, trạng thái ba màn, phần chạy thật và phần còn phụ thuộc OAuth/deploy. Không dùng `xong`, `PASS`, `LIVE` nếu bằng chứng không hỗ trợ.
