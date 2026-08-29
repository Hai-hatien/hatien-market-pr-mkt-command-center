import fs from 'node:fs';

const read = file => fs.readFileSync(file, 'utf8');
const exists = file => fs.existsSync(file);
const registry = JSON.parse(read('marketing-agent-pack/cases/case-registry.json'));

if (registry.project !== 'HT-MARKET-PRMKT-V1') throw new Error('Sai project trong case registry');
if (!Array.isArray(registry.cases) || registry.cases.length !== 5) throw new Error('Case registry phải có đúng 5 case');
if (new Set(registry.cases.map(x => x.id)).size !== 5) throw new Error('Case ID bị trùng');

for (const item of registry.cases) {
  if (!item.owner || !item.priority || !item.runtime_evidence_env) throw new Error(`Case thiếu owner/priority/evidence: ${item.id}`);
  if (!Array.isArray(item.acceptance) || item.acceptance.length < 4) throw new Error(`Case thiếu acceptance: ${item.id}`);
  for (const file of item.required_files || []) {
    if (!exists(file)) throw new Error(`Case ${item.id} thiếu file: ${file}`);
  }
}

const index = read('apps-script/Index.html');
const web = read('apps-script/WebApp.gs');
const uat = read('apps-script/UATService.gs');
const tester = read('apps-script/TesterService.gs');
const gsc = read('apps-script/GSCCollector.gs');
const testerAgent = read('marketing-agent-pack/.agents/tester-agent.md');
const requireToken = (source, token, label) => {
  if (!source.includes(token)) throw new Error(`Thiếu contract ${label || token}`);
};

for (const [token, label] of [
  ['screen-overview', 'màn tổng quan'],
  ['screen-decisions', 'màn quyết định'],
  ['screen-publish', 'màn xuất bản']
]) requireToken(index, token, label);

for (const [token, label] of [
  ['function saveMarketOwnerDecision(payload)', 'lưu quyết định'],
  ['LockService.getScriptLock()', 'khóa ghi'],
  ['htmVerifyRecordIdentity_', 'kiểm ID'],
  ['Không thể lên lịch ở thời điểm đã qua', 'chặn lịch quá khứ']
]) requireToken(web, token, label);

for (const [token, label] of [
  ['function prepareMarketDashboardUat()', 'create UAT fixture'],
  ['function cleanupMarketDashboardUat()', 'cleanup UAT fixture'],
  ["'UAT-G1-'", 'UAT decision prefix'],
  ["'UAT-CONTENT-'", 'UAT content prefix']
]) requireToken(uat, token, label);

for (const [token, label] of [
  ['function getMarketRuntimeEvidence()', 'runtime evidence'],
  ['function getGoogleSearchConsoleDataStatus()', 'GSC data evidence'],
  ['function runGoogleSearchConsoleUat()', 'GSC UAT']
]) requireToken(tester, token, label);

for (const [token, label] of [
  ['hatiencorp.vn', 'GSC hatiencorp'],
  ['hatiengroup.com', 'GSC hatiengroup'],
  ["SHEET: 'GSC_Daily'", 'GSC output sheet']
]) requireToken(gsc, token, label);

for (const token of ['Code tới đâu', 'Deploy cái gì', 'Production ra sao', 'Test được chưa', 'Test với data gì']) {
  requireToken(testerAgent, token, `tester report ${token}`);
}

const allText = [index, web, uat, tester, gsc, testerAgent].join('\n');
for (const pattern of [
  /GEMINI_API_KEY\s*[:=]\s*['"][^'"]+['"]/, 
  /HT_WP_APP_PASSWORD\s*[:=]\s*['"][^'"]+['"]/, 
  /refresh_token\s*[:=]\s*['"][^'"]+['"]/i
]) {
  if (pattern.test(allText)) throw new Error(`Phát hiện secret hard-code: ${pattern}`);
}

console.log('PASS: five-case acceptance and tester contracts');
