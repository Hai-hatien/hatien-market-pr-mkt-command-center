function htmSpreadsheet_() {
  return SpreadsheetApp.openById(HTM_CONFIG.SPREADSHEET_ID);
}

function htmSheet_(name) {
  const sheet = htmSpreadsheet_().getSheetByName(name);
  if (!sheet) throw new Error('Missing sheet: ' + name);
  return sheet;
}

function htmNowIso_() {
  return Utilities.formatDate(new Date(), HTM_CONFIG.TIME_ZONE, "yyyy-MM-dd'T'HH:mm:ssXXX");
}

function htmToday_() {
  return Utilities.formatDate(new Date(), HTM_CONFIG.TIME_ZONE, 'yyyy-MM-dd');
}

function htmId_(prefix) {
  return prefix + '-' + Utilities.formatDate(new Date(), HTM_CONFIG.TIME_ZONE, 'yyyyMMdd-HHmmss') + '-' + Utilities.getUuid().slice(0, 8);
}

function htmValidateWorkbook_() {
  const ss = htmSpreadsheet_();
  const existing = new Set(ss.getSheets().map(s => s.getName()));
  const missing = HTM_REQUIRED_SHEETS.filter(name => !existing.has(name));
  return { ok: missing.length === 0, missing, checkedAt: htmNowIso_() };
}

function htmWithLock_(jobName, fn) {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) {
    htmAppendRun_({ job: jobName, status: 'SKIPPED_LOCKED', result_summary: 'Another run holds the script lock.' });
    return { ok: false, skipped: true, reason: 'LOCKED' };
  }
  try {
    return fn();
  } finally {
    lock.releaseLock();
  }
}

function htmAppendObject_(sheetName, object) {
  const sheet = htmSheet_(sheetName);
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getDisplayValues()[0];
  const row = headers.map(h => Object.prototype.hasOwnProperty.call(object, h) ? object[h] : '');
  sheet.appendRow(row);
  return sheet.getLastRow();
}

function htmAppendRun_(data) {
  const correlationId = data.correlation_id || htmId_('run');
  htmAppendObject_(HTM_CONFIG.SHEETS.RUN_LOG, {
    correlation_id: correlationId,
    run_id: data.run_id || correlationId,
    run_date: htmToday_(),
    job: data.job || '',
    trigger_type: data.trigger_type || '',
    started_at: data.started_at || '',
    ended_at: data.ended_at || htmNowIso_(),
    status: data.status || '',
    attempt: data.attempt || 1,
    actor: data.actor || 'SYSTEM',
    source_ref: data.source_ref || '',
    target_ref: data.target_ref || '',
    result_summary: data.result_summary || '',
    evidence_ref: data.evidence_ref || '',
    code_version: HTM_CONFIG.VERSION,
    prompt_version: data.prompt_version || '',
    rule_version: data.rule_version || '',
    created_at: htmNowIso_()
  });
  return correlationId;
}

function htmRecordError_(job, error, context) {
  const ctx = context || {};
  const errorId = htmId_('err');
  const correlationId = ctx.correlation_id || htmId_('run');
  const message = error && error.message ? error.message : String(error);
  htmAppendObject_(HTM_CONFIG.SHEETS.ERROR_LOG, {
    error_id: errorId,
    correlation_id: correlationId,
    run_id: ctx.run_id || correlationId,
    job,
    failed_at: htmNowIso_(),
    attempt: ctx.attempt || 1,
    error_class: error && error.name ? error.name : 'Error',
    error_code: ctx.error_code || '',
    error_message: message,
    payload_ref: ctx.payload_ref || '',
    evidence_ref: ctx.evidence_ref || '',
    owner: HTM_CONFIG.TECHNICAL_OPERATOR,
    status: 'OPEN',
    created_at: htmNowIso_()
  });
  htmAppendObject_(HTM_CONFIG.SHEETS.ERROR_QUEUE, {
    queue_id: htmId_('dlq'),
    correlation_id: correlationId,
    run_id: ctx.run_id || correlationId,
    job,
    failed_at: htmNowIso_(),
    attempt_count: ctx.attempt || 1,
    payload_ref: ctx.payload_ref || '',
    error_class: error && error.name ? error.name : 'Error',
    error_message: message,
    status: 'OPEN',
    next_retry_at: '',
    owner: HTM_CONFIG.TECHNICAL_OPERATOR,
    resolution: '',
    created_at: htmNowIso_()
  });
  return { errorId, correlationId };
}

function htmSafeJson_(value) {
  try { return JSON.stringify(value); } catch (e) { return String(value); }
}
