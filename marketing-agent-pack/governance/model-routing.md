# MODEL ROUTING — HÀ TIÊN MARKET & PR-MKT

**Policy ID:** `HTM-MODEL-ROUTING-20260828-001`  
**Trạng thái:** Owner approved  
**Cập nhật:** 28/08/2026 18:37 VN  
**File máy đọc:** `marketing-agent-pack/governance/model-routing.json`

> Đây là nhãn phân tầng model vận hành nội bộ theo yêu cầu của anh Hải. Không tự diễn giải các nhãn này thành tên model API public nếu runner chưa khai báo alias tương ứng.

## 1. Quy tắc gán nhanh

| Nhóm agent / vai trò | Model bắt buộc | Lý do |
|---|---|---|
| BA, PO, PM, CMO | `GPT_5_6_SOL_EXTRA_HIGH` | Quyết định chiến lược, điều phối, owner-level và rủi ro cao |
| DEV, Content Creator, Designer | `GPT_5_5_MEDIUM` | Thực thi theo brief/spec/test đã khóa |
| Agent thuộc team Marketing | `GPT_5_5_EXTRA_HIGH` | Cần suy luận sâu về thị trường, insight, kênh, performance và nội dung |

## 2. Gán cho agent hiện có

| Agent | Nhóm | Model tier | Ghi chú |
|---|---|---|---|
| `g0-case-controller` | BA/PM | `GPT_5_6_SOL_EXTRA_HIGH` | Điều phối case và Decision Pack |
| `g7-proof-qa` | CMO/QA rủi ro public | `GPT_5_6_SOL_EXTRA_HIGH` | Chặn claim, pháp lý, model, media, canonical, CTA |
| `product-rd-liaison` | BA/PM sản phẩm | `GPT_5_6_SOL_EXTRA_HIGH` | Chuyển tín hiệu thành cơ hội R&D; không tự tạo SKU |
| `product-owner-agent` | PO | `GPT_5_6_SOL_EXTRA_HIGH` | Báo cáo trạng thái, production, test, blocker |
| `ba-agent` | BA | `GPT_5_6_SOL_EXTRA_HIGH` | Phân tích yêu cầu, quy trình, tiêu chí nghiệm thu |
| `pm-agent` | PM | `GPT_5_6_SOL_EXTRA_HIGH` | Quản lý scope, deadline, blocker, milestone |
| `cmo-agent` | CMO | `GPT_5_6_SOL_EXTRA_HIGH` | Định vị, brand, chiến lược marketing, cổng public |
| `mkt-strategist` | Marketing team | `GPT_5_5_EXTRA_HIGH` | Chiến lược, đối thủ, insight, KPI, brief chiến dịch |
| `content-producer` | Marketing team | `GPT_5_5_EXTRA_HIGH` | Lập kế hoạch/brief/luồng nội dung; khác Content Creator thực thi |
| `channel-operator` | Marketing team | `GPT_5_5_EXTRA_HIGH` | Kênh, landing, email, listening, referral |
| `performance-analyst` | Marketing team | `GPT_5_5_EXTRA_HIGH` | Dữ liệu, hiệu suất, KPI, A/B test |
| `product-marketing-context` | Marketing team | `GPT_5_5_EXTRA_HIGH` | Bối cảnh sản phẩm, khách hàng, định vị, proof points |
| `dev-agent` | DEV | `GPT_5_5_MEDIUM` | Code theo spec/guardrail/test |
| `content-creator` | Content Creator | `GPT_5_5_MEDIUM` | Sản xuất bản nháp/asset theo brief, không tự duyệt claim |
| `designer` | Designer | `GPT_5_5_MEDIUM` | Thiết kế theo design system và tiêu chí mobile |
| `tester-agent` | Tester/QA runner | `GPT_5_5_MEDIUM` | Test độc lập, không làm đẹp báo cáo |

## 3. Thứ tự resolve

```text
agent_overrides
→ role_defaults
→ team_defaults
→ fallback_policy
```

- Exact agent override luôn thắng team default.
- Agent strategic/approval-level dùng `GPT_5_6_SOL_EXTRA_HIGH`.
- Agent Marketing team dùng `GPT_5_5_EXTRA_HIGH`.
- Agent thực thi code/asset/design/test lặp lại dùng `GPT_5_5_MEDIUM`.
- Unknown agent không được tự bịa model; nếu thiếu team/role phải hỏi owner hoặc cập nhật config.

## 4. Lệnh kiểm tra

```bash
node tests/model-routing-contract.mjs
node scripts/resolve-agent-model.mjs g0-case-controller
node scripts/resolve-agent-model.mjs content-creator
node scripts/resolve-agent-model.mjs mkt-strategist
```

## 5. Guardrail

- Gán model không thay quyền nghiệp vụ.
- Model mạnh hơn không được tự publish, tự ghi CRM, tự tạo Opportunity, Product, SKU hoặc báo giá.
- Output public vẫn phải qua G7 và tiêu chuẩn nội dung Hà Tiên.
- Tester chỉ được báo PASS khi có bằng chứng runtime thật, không dựa vào model tier.
