import fs from 'node:fs';

const read = file => fs.readFileSync(file, 'utf8');
const config = read('apps-script/Config.gs');
const core = read('apps-script/Core.gs');
const web = read('apps-script/WebApp.gs');
const gsc = read('apps-script/GSCCollector.gs');
const manifest = JSON.parse(read('apps-script/appsscript.json'));

const requireToken = (source, token, label) => {
  if (!source.includes(token)) throw new Error(`Thiếu backend contract: ${label || token}`);
};

for (const [token, label] of [
  ["PROJECT_CODE: 'HT-MARKET-PRMKT-V1'", 'project code'],
  ["SPREADSHEET_ID: '1Ny1Rr9SHBO7s090J-eIZfpTo_JzgEvpvzr46nXnhwvI'", 'spreadsheet ID'],
  ["AUTO_PUBLISH: false", 'auto publish disabled'],
  ["CRM_WRITE: false", 'CRM write disabled'],
  ["WORDPRESS_WRITE: false", 'WordPress write disabled'],
  ["DONG_Y", 'owner decision values'],
  ["LEN_LICH_DANG", 'publish schedule decision']
]) requireToken(config, token, label);

for (const [token, label] of [
  ['function doGet()', 'doGet Web App entry'],
  ['function getMarketDashboardModel()', 'dashboard data model'],
  ['function saveMarketOwnerDecision(payload)', 'owner decision handler'],
  ['LockService.getScriptLock()', 'write lock'],
  ['htmVerifyRecordIdentity_', 'record identity protection'],
  ['đã được quyết định trước đó', 'anti-overwrite protection'],
  ['Không thể lên lịch ở thời điểm đã qua', 'past schedule guard'],
  ["job: 'OWNER_DECISION'", 'decision audit log']
]) requireToken(web, token, label);

for (const [token, label] of [
  ["TARGET_DOMAINS: Object.freeze(['hatiencorp.vn', 'hatiengroup.com'])", 'both GSC domains'],
  ["SHEET: 'GSC_Daily'", 'GSC output sheet'],
  ['ScriptApp.getOAuthToken()', 'Google OAuth token'],
  ['searchAnalytics/query', 'Search Console query endpoint'],
  ['function connectGoogleSearchConsole()', 'GSC connection check'],
  ['function collectGoogleSearchConsole(days)', 'GSC collector']
]) requireToken(gsc, token, label);

for (const [token, label] of [
  ['SpreadsheetApp.openById', 'spreadsheet open'],
  ['function htmAppendRun_', 'run audit'],
  ['function htmRecordError_', 'error audit']
]) requireToken(core, token, label);

const scopes = new Set(manifest.oauthScopes || []);
for (const scope of [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/webmasters.readonly',
  'https://www.googleapis.com/auth/script.external_request'
]) {
  if (!scopes.has(scope)) throw new Error(`Thiếu OAuth scope: ${scope}`);
}

const forbiddenSecretPatterns = [
  /GEMINI_API_KEY\s*[:=]\s*['"][^'"]+['"]/,
  /HT_WP_APP_PASSWORD\s*[:=]\s*['"][^'"]+['"]/,
  /Authorization:\s*['"]Bearer\s+[A-Za-z0-9._-]{12,}/
];
const combined = [config, core, web, gsc].join('\n');
for (const pattern of forbiddenSecretPatterns) {
  if (pattern.test(combined)) throw new Error(`Phát hiện secret hard-code: ${pattern}`);
}

console.log('PASS: backend, decision, GSC and security contracts');
