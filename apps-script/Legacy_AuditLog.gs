function getSpreadsheet_() {
  return SpreadsheetApp.openById(getConfig_().spreadsheetId);
}

function getOrCreateSheet_(sheetName, headers) {
  const ss = getSpreadsheet_();
  let sheet = ss.getSheetByName(sheetName);

  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  }

  if (sheet.getLastRow() === 0 && headers && headers.length) {
    sheet.appendRow(headers);
  }

  return sheet;
}

function ensureAuditLogSheet_() {
  return getOrCreateSheet_(HT.SHEETS.AUDIT_LOG, [
    'timestamp',
    'run_id',
    'action',
    'endpoint',
    'external_id',
    'idempotency_key',
    'http_status',
    'ok',
    'dry_run',
    'response_or_error'
  ]);
}

function logAudit_(entry) {
  const sheet = ensureAuditLogSheet_();

  sheet.appendRow([
    nowIso_(),
    entry.run_id || '',
    entry.action || '',
    entry.endpoint || '',
    entry.external_id || '',
    entry.idempotency_key || '',
    entry.http_status || '',
    entry.ok === true ? 'TRUE' : 'FALSE',
    entry.dry_run === true ? 'TRUE' : 'FALSE',
    entry.response_or_error || ''
  ]);
}