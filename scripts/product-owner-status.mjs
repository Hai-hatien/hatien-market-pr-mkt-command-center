import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const root = process.cwd();
const exists = rel => fs.existsSync(path.join(root, rel));
const read = rel => exists(rel) ? fs.readFileSync(path.join(root, rel), 'utf8') : '';
const yesNo = value => String(value || '').trim() ? 'ĐÃ CẤU HÌNH' : 'CHƯA CẤU HÌNH';
const boolVar = name => ['1', 'true', 'yes', 'pass', 'ready'].includes(String(process.env[name] || '').trim().toLowerCase());

function git(command, fallback = '') {
  try { return execSync(`git ${command}`, { encoding: 'utf8' }).trim(); }
  catch { return fallback; }
}

const sha = process.env.GITHUB_SHA || git('rev-parse HEAD', 'UNKNOWN');
const branch = process.env.GITHUB_HEAD_REF || process.env.GITHUB_REF_NAME || git('branch --show-current', 'UNKNOWN');
const previousSha = String(process.env.PO_PREVIOUS_SHA || '').trim();
const codeChanged = previousSha ? previousSha !== sha : null;

const requiredSource = [
  'apps-script/Index.html',
  'apps-script/Preview.html',
  'apps-script/WebApp.gs',
  'apps-script/Config.gs',
  'apps-script/Core.gs',
  'apps-script/GSCCollector.gs',
  'apps-script/appsscript.json'
];
const sourcePresent = requiredSource.filter(exists);
const sourceMissing = requiredSource.filter(x => !exists(x));

const index = read('apps-script/Index.html');
const webApp = read('apps-script/WebApp.gs');
const gsc = read('apps-script/GSCCollector.gs');

const uxScreens = {
  overview: index.includes('screen-overview'),
  decisions: index.includes('screen-decisions'),
  publish: index.includes('screen-publish')
};
const backendContracts = {
  doGet: /function\s+doGet\s*\(/.test(webApp),
  model: /function\s+getMarketDashboardModel\s*\(/.test(webApp),
  saveDecision: /function\s+saveMarketOwnerDecision\s*\(/.test(webApp),
  lock: /LockService\.getScriptLock/.test(webApp),
  antiOverwrite: webApp.includes('đã được quyết định trước đó'),
  recordIdentity: webApp.includes('htmVerifyRecordIdentity_'),
  pastScheduleGuard: webApp.includes('Không thể lên lịch ở thời điểm đã qua')
};
const gscContracts = {
  direct: gsc.includes('ScriptApp.getOAuthToken()'),
  domains: gsc.includes('hatiencorp.vn') && gsc.includes('hatiengroup.com'),
  sheet: gsc.includes("SHEET: 'GSC_Daily'")
};

const staticResult = String(process.env.PO_STATIC_RESULT || 'NOT_EXECUTED').toUpperCase();
const mobileResult = String(process.env.PO_MOBILE_RESULT || 'NOT_EXECUTED').toUpperCase();
const sheetE2e = String(process.env.PO_SHEET_E2E_RESULT || 'NOT_EXECUTED').toUpperCase();
const gscReal = String(process.env.PO_REAL_GSC_DATA || 'NO').toUpperCase();
const sheetReal = String(process.env.PO_REAL_SHEET_DATA || 'NO').toUpperCase();

const deploymentId = String(process.env.HT_DEPLOYMENT_ID || '').trim();
const webAppUrl = String(process.env.HT_WEB_APP_URL || '').trim();
let httpStatus = 'NOT_CHECKED';
let httpOk = false;
if (webAppUrl) {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12000);
    const response = await fetch(webAppUrl, { redirect: 'follow', signal: controller.signal });
    clearTimeout(timer);
    httpStatus = String(response.status);
    httpOk = response.ok;
  } catch (error) {
    httpStatus = `ERROR:${error.name || 'FetchError'}`;
  }
}

const demoEvidence = {
  model: index.includes('function demoModel()'),
  signals: (index.match(/title:'[^']+'/g) || []).length >= 6 ? 3 : 'UNKNOWN',
  decisions: index.includes("record_id:'demo-1'") && index.includes("record_id:'demo-2'") ? 2 : 'UNKNOWN',
  pendingPublish: index.includes("record_id:'demo-3'") ? 1 : 'UNKNOWN',
  scheduled: index.includes("record_id:'demo-4'") ? 1 : 'UNKNOWN'
};

const allUx = Object.values(uxScreens).every(Boolean);
const allBackend = Object.values(backendContracts).every(Boolean);
const allGscContract = Object.values(gscContracts).every(Boolean);
const testsExecuted = [staticResult, mobileResult, sheetE2e].some(x => !['NOT_EXECUTED', 'UNKNOWN', ''].includes(x));

let poState = 'AMBER — CODE CÓ, RUNTIME CHƯA ĐỦ';
if (!allUx || !allBackend || sourceMissing.length) poState = 'RED — BLOCKER NGĂN SỬ DỤNG';
if (httpOk && staticResult === 'PASS' && mobileResult === 'PASS' && sheetE2e === 'PASS') {
  poState = 'GREEN — CÓ BẰNG CHỨNG TIẾN TRIỂN';
}

const report = `# Báo cáo Product Owner — ${new Date().toISOString()}

**Kết luận PO:** ${poState}

## 1. Code tới đâu

- Repository: \`${process.env.GITHUB_REPOSITORY || 'Hai-hatien/hatien-market-pr-mkt-command-center'}\`
- Branch/ref: \`${branch}\`
- Commit SHA: \`${sha}\`
- Có commit mới từ lượt trước: ${codeChanged === null ? 'CHƯA CÓ MỐC SO SÁNH' : codeChanged ? 'CÓ' : 'KHÔNG'}
- Source bắt buộc hiện có: ${sourcePresent.length}/${requiredSource.length}
- Source còn thiếu: ${sourceMissing.length ? sourceMissing.map(x => `\`${x}\``).join(', ') : 'Không'}
- Ba màn UX: Tổng quan=${uxScreens.overview ? 'CÓ' : 'THIẾU'}; Cần quyết định=${uxScreens.decisions ? 'CÓ' : 'THIẾU'}; Chờ đăng=${uxScreens.publish ? 'CÓ' : 'THIẾU'}
- Backend: doGet=${backendContracts.doGet ? 'CÓ' : 'THIẾU'}; đọc model=${backendContracts.model ? 'CÓ' : 'THIẾU'}; lưu quyết định=${backendContracts.saveDecision ? 'CÓ' : 'THIẾU'}; khóa ghi=${backendContracts.lock ? 'CÓ' : 'THIẾU'}; chống ghi đè=${backendContracts.antiOverwrite ? 'CÓ' : 'THIẾU'}; kiểm record ID=${backendContracts.recordIdentity ? 'CÓ' : 'THIẾU'}; chặn lịch quá khứ=${backendContracts.pastScheduleGuard ? 'CÓ' : 'THIẾU'}
- GSC contract chính chủ: ${allGscContract ? 'CÓ ĐỦ SOURCE' : 'CHƯA ĐỦ SOURCE'}

## 2. Deploy cái gì

- Apps Script deployment ID: ${yesNo(deploymentId)}
- Web App URL: ${yesNo(webAppUrl)}
- HTTP Web App: ${httpStatus}
- Kết luận deploy: ${deploymentId && webAppUrl ? 'CÓ TỌA ĐỘ DEPLOY; cần đối chiếu runtime' : 'CHƯA DEPLOY ĐƯỢC CHỨNG MINH'}

## 3. Production ra sao

- Production URL truy cập được: ${httpOk ? 'CÓ' : 'CHƯA CÓ BẰNG CHỨNG'}
- HTTP status: ${httpStatus}
- Sheet end-to-end: ${sheetE2e}
- Dữ liệu Sheet thật được xác nhận: ${sheetReal}
- Tự publish WordPress: KHÔNG
- Kết luận production: ${httpOk && sheetE2e === 'PASS' ? 'RUNTIME CÓ BẰNG CHỨNG' : 'CHƯA CÓ PRODUCTION ĐỦ BẰNG CHỨNG'}

## 4. Test được chưa

- Static contract: ${staticResult}
- Mobile render 360/390 px: ${mobileResult}
- End-to-end ghi quyết định về Sheet: ${sheetE2e}
- Có test thực sự được khai báo: ${testsExecuted ? 'CÓ' : 'CHƯA'}
- Commit được đánh giá: \`${sha}\`

## 5. Test với data gì

- Demo fixture tồn tại: ${demoEvidence.model ? 'CÓ' : 'KHÔNG'}
- Demo: tín hiệu=${demoEvidence.signals}; việc cần quyết định=${demoEvidence.decisions}; bài chờ đăng=${demoEvidence.pendingPublish}; bài đã lên lịch=${demoEvidence.scheduled}
- Dữ liệu Google Sheet thật: ${sheetReal}
- Dữ liệu GSC thật sau OAuth: ${gscReal}
- Spreadsheet config: ${yesNo(process.env.HT_SPREADSHEET_ID)}
- WordPress config: base URL=${yesNo(process.env.HT_WP_BASE_URL)}; user=${yesNo(process.env.HT_WP_USER)}; app password=${yesNo(process.env.HT_WP_APP_PASSWORD)}
- Gemini API key: ${yesNo(process.env.GEMINI_API_KEY)}

> Báo cáo không hiển thị giá trị secret. Mock/demo không được tính là production data.
`;

fs.writeFileSync('po-report.md', report);
fs.writeFileSync('po-state.json', JSON.stringify({
  generatedAt: new Date().toISOString(),
  sha,
  branch,
  poState,
  sourcePresent,
  sourceMissing,
  uxScreens,
  backendContracts,
  gscContracts,
  deploymentConfigured: Boolean(deploymentId && webAppUrl),
  httpStatus,
  test: { staticResult, mobileResult, sheetE2e },
  data: { demoEvidence, sheetReal, gscReal }
}, null, 2));

console.log(report);
