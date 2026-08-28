/**
 * Bằng chứng runtime dành cho Tester/PO. Không trả secret và không tự thay đổi dữ liệu.
 */
function getMarketRuntimeEvidence() {
  let dashboard = null;
  let dashboardError = '';
  try {
    dashboard = getMarketDashboardModel();
  } catch (error) {
    dashboardError = String(error && error.message ? error.message : error);
  }

  return {
    ok: !dashboardError,
    project_code: HTM_CONFIG.PROJECT_CODE,
    version: HTM_CONFIG.VERSION,
    checked_at: htmNowIso_(),
    workbook: htmValidateWorkbook_(),
    dashboard: dashboard ? {
      needs_decision: dashboard.overview.needs_decision,
      waiting_publish: dashboard.overview.waiting_publish,
      scheduled_publish: dashboard.overview.scheduled_publish,
      recent_signals: dashboard.overview.recent_signals
    } : null,
    dashboard_error: dashboardError,
    uat: getMarketUatReadiness(),
    gsc: getGoogleSearchConsoleDataStatus(),
    guardrails: HTM_CONFIG.GUARDRAILS
  };
}

function getGoogleSearchConsoleDataStatus() {
  const ss = htmSpreadsheet_();
  const sheet = ss.getSheetByName(HTM_CONFIG.SHEETS.GSC_DAILY || 'GSC_Daily');
  if (!sheet || sheet.getLastRow() < 2) {
    return {
      ok: false,
      status: 'NO_REAL_DATA',
      sheet: HTM_CONFIG.SHEETS.GSC_DAILY || 'GSC_Daily',
      rows: 0,
      sites: []
    };
  }

  const values = sheet.getRange(2, 1, sheet.getLastRow() - 1, Math.min(sheet.getLastColumn(), 13)).getDisplayValues();
  const sites = Array.from(new Set(values.map(function (row) { return row[4] || row[3]; }).filter(Boolean)));
  const collected = values.map(function (row) { return row[0]; }).filter(Boolean).sort().pop() || '';
  return {
    ok: sites.indexOf('hatiencorp.vn') >= 0 && sites.indexOf('hatiengroup.com') >= 0,
    status: 'REAL_DATA_PRESENT',
    sheet: HTM_CONFIG.SHEETS.GSC_DAILY || 'GSC_Daily',
    rows: values.length,
    sites: sites,
    latest_collected_at: collected
  };
}

function runGoogleSearchConsoleUat() {
  const connection = connectGoogleSearchConsole();
  if (!connection.ok) return { ok: false, step: 'CONNECT', connection: connection };
  const collection = collectGoogleSearchConsole(28);
  return {
    ok: Boolean(collection && collection.ok),
    connection: connection,
    collection: collection,
    data_status: getGoogleSearchConsoleDataStatus()
  };
}
