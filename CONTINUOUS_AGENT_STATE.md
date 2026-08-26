# CONTINUOUS AGENT STATE — HT-MARKET-PRMKT-V1

Cập nhật: 2026-08-26

## Tọa độ chuẩn

- Repository: `Hai-hatien/hatien-market-pr-mkt-command-center`
- Branch: `recovery/ht-market-pr-mkt-20260825`
- Pull request: `#1`
- Google Sheet: `1Ny1Rr9SHBO7s090J-eIZfpTo_JzgEvpvzr46nXnhwvI`

Repo cũ `Hai-hatien/hatien-digital-platform` đã chuyển sang migration hold; không deploy hoặc tiếp tục phát triển dự án này ở repo cũ.

## Đã có trong source

- Mobile Dashboard 3 màn trong `apps-script/Index.html`.
- Preview UAT trong `apps-script/Preview.html`.
- Backend Web App và lưu quyết định trong `apps-script/WebApp.gs`.
- Cấu hình, core utilities và verifier.
- Search Console collector chính chủ cho `hatiencorp.vn` và `hatiengroup.com`.
- Apps Script manifest với quyền Sheets, Search Console read-only và external request.
- Static mobile contract và backend/GSC/security contract.
- GitHub workflow render 3 màn ở 360 px và 390 px.
- Product Owner Agent, script báo cáo và workflow 2 giờ.

## Bằng chứng hiện có

- Static mobile contract: PASS trên GitHub Actions.
- Backend/GSC/security contract: PASS trên GitHub Actions.
- Mobile render: PASS cho 3 màn × 360/390 px; báo cáo overflow=false cho cả 6 ảnh.
- Product Owner workflow đã chạy và tạo artifact báo cáo.

## Chưa được coi là hoàn thành

- Chưa có Apps Script `scriptId`/deployment mapping trong repository.
- Chưa chứng minh source đã được push vào Apps Script project thật.
- Chưa có Web App URL/HTTP runtime.
- Chưa chạy end-to-end ghi quyết định vào Google Sheet thật.
- Chưa OAuth GSC và chưa có dữ liệu thật trong `GSC_Daily`.
- Workflow PO lịch 2 giờ chỉ được kích hoạt theo lịch sau khi workflow nằm trên default branch `main`.
- Repository hiện cần được chủ sở hữu xác nhận ở chế độ Private.

## Việc tiếp theo duy nhất theo thứ tự

1. Xác định Apps Script `scriptId` hoặc tạo project đích chính thức.
2. Chuẩn bị `.clasp.json`/deploy manifest mà không commit credential.
3. Push source vào Apps Script và tạo Web App deployment.
4. Test HTTP và ba màn trên URL thật.
5. Test ghi một quyết định bằng dữ liệu kiểm thử có thể hoàn nguyên.
6. Cấp OAuth Search Console, chạy collector và xác minh `GSC_Daily`.
7. Cập nhật PO evidence; chỉ sau đó xem xét đưa PR khỏi Draft và merge.

## Definition of Done

Chỉ chuyển trạng thái sang `COMPLETED_WITH_EVIDENCE` khi có URL Web App, test mobile/runtime, ghi Sheet thật thành công, bằng chứng GSC hoặc scope ngoại lệ được duyệt, và không còn blocker P0.
