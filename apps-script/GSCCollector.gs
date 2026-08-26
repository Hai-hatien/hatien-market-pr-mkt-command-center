/**
 * Direct Google Search Console connector for HT-MARKET-PRMKT-V1.
 * Uses the signed-in Google account of the bound Apps Script project.
 * No GSC Wizard / third-party service.
 */
const HTM_GSC = Object.freeze({
  SHEET: 'GSC_Daily',
  API_BASE: 'https://www.googleapis.com/webmasters/v3',
  TARGET_DOMAINS: Object.freeze(['hatiencorp.vn', 'hatiengroup.com']),
  DEFAULT_DAYS: 28,
  ROW_LIMIT: 25000,
  HEADERS: Object.freeze([
    'collected_at', 'period_start', 'period_end', 'site_url', 'domain',
    'query', 'page', 'device', 'country',
    'clicks', 'impressions', 'ctr', 'position'
  ])
});

/**
 * One-time connection check. Run this manually in Apps Script once after deploy.
 * Google will show an OAuth consent screen for the signed-in account.
 */
function connectGoogleSearchConsole() {
  const sites = htmGscListSites_();
  const matched = HTM_GSC.TARGET_DOMAINS.map(domain => ({
    domain,
    properties: sites
      .filter(site => htmGscDomainFromSiteUrl_(site.siteUrl) === domain)
      .map(site => ({ siteUrl: site.siteUrl, permissionLevel: site.permissionLevel || '' }))
  }));

  const missing = matched.filter(x => x.properties.length === 0).map(x => x.domain);
  htmGscEnsureSheet_();

  return {
    ok: missing.length === 0,
    matched,
    missing,
    message: missing.length
      ? 'Đã cấp quyền API nhưng chưa thấy property: ' + missing.join(', ')
      : 'Đã nối trực tiếp Google Search Console cho cả hai website.'
  };
}

/**
 * Pulls the last N settled days for both domains into GSC_Daily.
 * Dimensions intentionally limited to query + page so data remains useful and compact.
 */
function collectGoogleSearchConsole(days) {
  const lookbackDays = Math.max(7, Math.min(Number(days || HTM_GSC.DEFAULT_DAYS), 90));
  const end = new Date();
  end.setDate(end.getDate() - 3); // Search Console commonly lags 2-3 days.
  const start = new Date(end);
  start.setDate(start.getDate() - lookbackDays + 1);

  const startDate = Utilities.formatDate(start, HTM_CONFIG.TIME_ZONE, 'yyyy-MM-dd');
  const endDate = Utilities.formatDate(end, HTM_CONFIG.TIME_ZONE, 'yyyy-MM-dd');
  const collectedAt = Utilities.formatDate(new Date(), HTM_CONFIG.TIME_ZONE, "yyyy-MM-dd'T'HH:mm:ssXXX");

  const sites = htmGscListSites_();
  const targets = [];
  HTM_GSC.TARGET_DOMAINS.forEach(domain => {
    const candidates = sites.filter(site => htmGscDomainFromSiteUrl_(site.siteUrl) === domain);
    if (candidates.length) targets.push({ domain, siteUrl: htmGscChooseProperty_(candidates).siteUrl });
  });

  const missing = HTM_GSC.TARGET_DOMAINS.filter(domain => !targets.some(t => t.domain === domain));
  if (missing.length) throw new Error('GSC property not accessible for: ' + missing.join(', '));

  const rows = [];
  targets.forEach(target => {
    const data = htmGscQuery_(target.siteUrl, startDate, endDate);
    (data.rows || []).forEach(row => {
      const keys = row.keys || [];
      rows.push([
        collectedAt,
        startDate,
        endDate,
        target.siteUrl,
        target.domain,
        keys[0] || '',
        keys[1] || '',
        '',
        '',
        Number(row.clicks || 0),
        Number(row.impressions || 0),
        Number(row.ctr || 0),
        Number(row.position || 0)
      ]);
    });
  });

  const sheet = htmGscEnsureSheet_();
  htmGscReplacePeriod_(sheet, startDate, endDate, rows);

  return {
    ok: true,
    period: { startDate, endDate },
    sites: targets,
    rowsWritten: rows.length,
    sheet: HTM_GSC.SHEET
  };
}

/** Lightweight status for Dashboard / ChatGPT Schedule. */
function getGoogleSearchConsoleStatus() {
  try {
    const sites = htmGscListSites_();
    const matched = HTM_GSC.TARGET_DOMAINS.map(domain => ({
      domain,
      accessible: sites.some(site => htmGscDomainFromSiteUrl_(site.siteUrl) === domain)
    }));
    return { ok: matched.every(x => x.accessible), matched };
  } catch (error) {
    return { ok: false, error: String(error && error.message ? error.message : error) };
  }
}

function htmGscListSites_() {
  const response = UrlFetchApp.fetch(HTM_GSC.API_BASE + '/sites', {
    method: 'get',
    headers: { Authorization: 'Bearer ' + ScriptApp.getOAuthToken() },
    muteHttpExceptions: true
  });
  const code = response.getResponseCode();
  const body = response.getContentText();
  if (code < 200 || code >= 300) {
    throw new Error('Search Console sites.list HTTP ' + code + ': ' + body.slice(0, 1000));
  }
  const parsed = JSON.parse(body || '{}');
  return Array.isArray(parsed.siteEntry) ? parsed.siteEntry : [];
}

function htmGscQuery_(siteUrl, startDate, endDate) {
  const url = HTM_GSC.API_BASE + '/sites/' + encodeURIComponent(siteUrl) + '/searchAnalytics/query';
  const payload = {
    startDate,
    endDate,
    dimensions: ['query', 'page'],
    type: 'web',
    rowLimit: HTM_GSC.ROW_LIMIT,
    startRow: 0
  };
  const response = UrlFetchApp.fetch(url, {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    headers: { Authorization: 'Bearer ' + ScriptApp.getOAuthToken() },
    muteHttpExceptions: true
  });
  const code = response.getResponseCode();
  const body = response.getContentText();
  if (code < 200 || code >= 300) {
    throw new Error('Search Console searchAnalytics.query HTTP ' + code + ' for ' + siteUrl + ': ' + body.slice(0, 1000));
  }
  return JSON.parse(body || '{}');
}

function htmGscDomainFromSiteUrl_(siteUrl) {
  const value = String(siteUrl || '').trim().toLowerCase();
  if (value.startsWith('sc-domain:')) return value.replace('sc-domain:', '').replace(/^www\./, '');
  try {
    return new URL(value).hostname.replace(/^www\./, '');
  } catch (_) {
    return '';
  }
}

function htmGscChooseProperty_(candidates) {
  // Prefer domain property so all protocols/subdomains are included.
  return candidates.find(x => String(x.siteUrl || '').startsWith('sc-domain:')) || candidates[0];
}

function htmGscEnsureSheet_() {
  const ss = SpreadsheetApp.openById(HTM_CONFIG.SPREADSHEET_ID);
  let sheet = ss.getSheetByName(HTM_GSC.SHEET);
  if (!sheet) sheet = ss.insertSheet(HTM_GSC.SHEET);
  const current = sheet.getLastColumn() ? sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), HTM_GSC.HEADERS.length)).getDisplayValues()[0] : [];
  const needsHeader = HTM_GSC.HEADERS.some((h, i) => current[i] !== h);
  if (needsHeader) {
    sheet.clear();
    sheet.getRange(1, 1, 1, HTM_GSC.HEADERS.length).setValues([HTM_GSC.HEADERS]);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function htmGscReplacePeriod_(sheet, startDate, endDate, rows) {
  const lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    const data = sheet.getRange(2, 1, lastRow - 1, HTM_GSC.HEADERS.length).getValues();
    const keep = data.filter(r => !(String(r[1]) === startDate && String(r[2]) === endDate));
    sheet.getRange(2, 1, lastRow - 1, HTM_GSC.HEADERS.length).clearContent();
    if (keep.length) sheet.getRange(2, 1, keep.length, HTM_GSC.HEADERS.length).setValues(keep);
  }
  const insertAt = Math.max(2, sheet.getLastRow() + 1);
  if (rows.length) sheet.getRange(insertAt, 1, rows.length, HTM_GSC.HEADERS.length).setValues(rows);
}
