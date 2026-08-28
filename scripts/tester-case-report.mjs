import fs from 'node:fs';
import { execSync } from 'node:child_process';

const read = file => fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
const exists = file => fs.existsSync(file);
const git = (cmd, fallback = '') => {
  try { return execSync(`git ${cmd}`, { encoding: 'utf8' }).trim(); } catch { return fallback; }
};
const norm = value => String(value || 'NOT_EXECUTED').trim().toUpperCase();
const isPass = value => ['PASS', 'SUCCESS', 'YES', 'TRUE'].includes(norm(value));
const isFail = value => ['FAIL', 'FAILURE', 'ERROR'].includes(norm(value));

const registry = JSON.parse(read('marketing-agent-pack/cases/case-registry.json'));
const sha = String(process.env.TESTER_TARGET_SHA || process.env.GITHUB_SHA || git('rev-parse HEAD', 'UNKNOWN')).trim();
const branch = String(process.env.TESTER_TARGET_BRANCH || process.env.GITHUB_REF_NAME || git('branch --show-current', 'UNKNOWN')).trim();
const previousSha = String(process.env.TESTER_PREVIOUS_SHA || '').trim();
const staticResult = norm(process.env.TESTER_STATIC_RESULT);
const mobileResult = norm(process.env.TESTER_MOBILE_RESULT);
const deployResult = norm(process.env.TESTER_DEPLOY_RESULT);
const deploySha = String(process.env.TESTER_DEPLOY_SHA || '').trim();
const deployRunUrl = String(process.env.TESTER_DEPLOY_RUN_URL || '').trim();
const deploymentId = String(process.env.HT_DEPLOYMENT_ID || '').trim();
const webAppUrl = String(process.env.HT_WEB_APP_URL || '').trim();

let httpStatus = 'NOT_CHECKED';
let runtimeMarker = 'NOT_CHECKED';
if (webAppUrl) {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);
    const response = await fetch(webAppUrl, { redirect: 'follow', signal: controller.signal });
    const body = await response.text();
    clearTimeout(timer);
    httpStatus = String(response.status);
    runtimeMarker = body.includes('Hà Tiên — Market Command Center') || body.includes('Hà Tiên · Thị trường & nội dung')
      ? 'APP_HTML_CONFIRMED'
      : body.toLowerCase().includes('sign in') || body.toLowerCase().includes('đăng nhập')
        ? 'AUTH_REQUIRED'
        : 'UNCONFIRMED_BODY';
  } catch (error) {
    httpStatus = `ERROR:${error.name || 'FetchError'}`;
    runtimeMarker = 'FETCH_ERROR';
  }
}

const source = {
  index: read('apps-script/Index.html'),
  web: read('apps-script/WebApp.gs'),
  uat: read('apps-script/UATService.gs'),
  tester: read('apps-script/TesterService.gs'),
  gsc: read('apps-script/GSCCollector.gs'),
  case03: read('marketing-agent-pack/cases/CASE-03-DAILY-RESEARCH.md'),
  case04: read('marketing-agent-pack/cases/CASE-04-CONTENT-PUBLISH-GATE.md'),
  case05: read('marketing-agent-pack/cases/CASE-05-RD-OPPORTUNITY.md')
};
const has = (key, tokens) => tokens.every(token => source[key].includes(token));

const codeGate = {
  'MKTCASE-20260828-001':
    has('index', ['screen-overview', 'screen-decisions', 'screen-publish']) &&
    has('web', ['LockService.getScriptLock()', 'htmVerifyRecordIdentity_', 'Không thể lên lịch ở thời điểm đã qua']) &&
    has('uat', ['prepareMarketDashboardUat()', 'cleanupMarketDashboardUat()']),
  'MKTCASE-20260828-002':
    has('gsc', ['hatiencorp.vn', 'hatiengroup.com', "SHEET: 'GSC_Daily'", 'ScriptApp.getOAuthToken()']) &&
    has('tester', ['runGoogleSearchConsoleUat()', 'getGoogleSearchConsoleDataStatus()']),
  'MKTCASE-20260828-003':
    exists('marketing-agent-pack/schedules/daily-market-research-0630.md') &&
    has('case03', ['Google Trends', 'Đối thủ', 'Search Console', 'pain/JTBD']),
  'MKTCASE-20260828-004':
    has('case04', ['publish_ready = YES', 'Duyệt không đồng nghĩa']) &&
    has('index', ['Có cho xuất bản không?', 'Xem bản xem trước']) &&
    has('web', ['decision_type', 'preview_url']),
  'MKTCASE-20260828-005':
    exists('marketing-agent-pack/.agents/product-rd-liaison.md') &&
    has('case05', ['Use case', 'Prototype/test tối thiểu', 'không tự tạo SKU'])
};

const evidence = Object.fromEntries(registry.cases.map(item => [item.id, norm(process.env[item.runtime_evidence_env])]));
const caseStatus = item => {
  if (!codeGate[item.id] || isFail(evidence[item.id])) return 'FAIL';
  if (isPass(evidence[item.id])) return 'PASS';
  return 'READY_FOR_TEST';
};
const cases = registry.cases.map(item => ({
  ...item,
  code_ok: Boolean(codeGate[item.id]),
  runtime_evidence: evidence[item.id],
  tester_status: caseStatus(item)
}));

const overall = cases.some(item => item.tester_status === 'FAIL')
  ? 'RED — CÓ CASE FAIL'
  : cases.every(item => item.tester_status === 'PASS') && isPass(staticResult) && isPass(mobileResult) && isPass(deployResult) && runtimeMarker === 'APP_HTML_CONFIRMED'
    ? 'GREEN — ĐỦ BẰNG CHỨNG NGHIỆM THU'
    : 'AMBER — CODE SẴN SÀNG, RUNTIME/UAT CHƯA ĐỦ';

const tableRows = cases.map(item => `| ${item.id} | ${item.name} | ${item.code_ok ? 'Đạt' : 'Thiếu'} | ${item.runtime_evidence} | **${item.tester_status}** |`).join('\n');
const actions = cases.filter(item => item.tester_status !== 'PASS').map(item =>
  `- **${item.id}:** ${item.tester_status === 'FAIL' ? 'Sửa code/contract lỗi rồi chạy lại.' : `Chạy UAT thật và cập nhật ${item.runtime_evidence_env}.`}`
).join('\n') || '- Không còn action mở.';

const report = `# Báo cáo TESTER — ${new Date().toISOString()}

**Kết luận:** ${overall}

## 1. Code tới đâu

- Repository: \`${process.env.GITHUB_REPOSITORY || 'Hai-hatien/hatien-market-pr-mkt-command-center'}\`
- Branch kiểm: \`${branch}\`
- Commit SHA: \`${sha}\`
- Có commit mới từ kỳ trước: ${previousSha ? (previousSha === sha ? 'KHÔNG' : 'CÓ') : 'CHƯA CÓ MỐC SO SÁNH'}
- Case registry: ${cases.length}/5 case.
- Static contract: ${staticResult}

## 2. Deploy cái gì

- Deployment ID: ${deploymentId ? 'ĐÃ CÓ' : 'CHƯA CÓ'}
- Web App URL: ${webAppUrl || 'CHƯA CÓ'}
- Deploy result: ${deployResult}
- Deploy SHA: \`${deploySha || 'UNKNOWN'}\`
${deployRunUrl ? `- Workflow deploy: ${deployRunUrl}` : ''}

## 3. Production ra sao

- HTTP Web App: ${httpStatus}
- Runtime marker: ${runtimeMarker}
- Tự publish WordPress: KHÔNG
- Production được phép gọi: ${cases.every(item => item.tester_status === 'PASS') && runtimeMarker === 'APP_HTML_CONFIRMED' ? 'CÓ THỂ XEM XÉT' : 'CHƯA'}

## 4. Test được chưa

- Static/case contracts: ${staticResult}
- Mobile 360/390 px đúng commit: ${mobileResult}
- Case PASS: ${cases.filter(x => x.tester_status === 'PASS').length}/5
- Case READY_FOR_TEST: ${cases.filter(x => x.tester_status === 'READY_FOR_TEST').length}/5
- Case FAIL: ${cases.filter(x => x.tester_status === 'FAIL').length}/5

| Case | Nội dung | Code gate | Runtime evidence | Kết quả tester |
|---|---|---:|---|---|
${tableRows}

## 5. Test với data gì

- Demo UI: ${source.index.includes('function demoModel()') ? 'CÓ — chỉ dùng render/UX' : 'KHÔNG'}
- Fixture UAT: ${source.uat.includes("'UAT-G1-'") && source.uat.includes("'UAT-CONTENT-'") ? 'CÓ SOURCE — phải chạy trên Sheet thật' : 'THIẾU'}
- Sheet end-to-end: ${evidence['MKTCASE-20260828-001']}
- GSC thật sau OAuth: ${evidence['MKTCASE-20260828-002']}
- Run nghiên cứu hằng ngày: ${evidence['MKTCASE-20260828-003']}
- UAT cổng duyệt bài: ${evidence['MKTCASE-20260828-004']}
- UAT cơ hội R&D: ${evidence['MKTCASE-20260828-005']}

## Task kế tiếp

${actions}

> Tester không coi demo, source tĩnh hoặc lời mô tả là production evidence. Báo cáo không hiển thị secret.
`;

fs.writeFileSync('tester-report.md', report);
fs.writeFileSync('tester-state.json', JSON.stringify({ generated_at: new Date().toISOString(), overall, sha, branch, staticResult, mobileResult, deployResult, httpStatus, runtimeMarker, cases }, null, 2));
console.log(report);
