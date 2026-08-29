function pushDashboardHotNews(runId) {
  const ss = getSpreadsheet_();
  const sheet = ss.getSheetByName(HT.SHEETS.DASHBOARD);

  if (!sheet) throw new Error('Missing sheet: ' + HT.SHEETS.DASHBOARD);

  const values = sheet.getRange('A33:H60').getValues();
  let count = 0;

  values.forEach(function (row, index) {
    if (isBlankRow_(row)) return;

    const date = row[0];
    const level = normalizeText_(row[1]);
    const market = normalizeText_(row[2]);
    const finding = normalizeText_(row[3]);

    if (!finding || finding === 'Tin / tín hiệu') return;

    const payload = {
      date: date,
      level: level,
      market: market,
      finding: finding,
      impact_hatien: normalizeText_(row[4]),
      workstream: normalizeText_(row[5]),
      verification_status: normalizeText_(row[6]),
      source: normalizeText_(row[7])
    };

    const record = buildEnvelope_({
      source_system: 'sheet_00_dashboard',
      entity_type: 'market_finding',
      external_id: 'DASHBOARD_HOTNEWS_ROW_' + (33 + index),
      priority: level === 'HOT' ? 'P0' : 'P2',
      payload: payload,
      meta: {
        sheet_name: HT.SHEETS.DASHBOARD,
        row_number: 33 + index
      }
    });

    wpPost_(HT.ENDPOINTS.MARKET_FINDING, record, runId);
    count++;
  });

  return count;
}

function pushStreamTaskRows(runId) {
  const ss = getSpreadsheet_();
  let total = 0;

  HT.STREAM_SHEETS.forEach(function (sheetName) {
    const sheet = ss.getSheetByName(sheetName);
    if (!sheet) return;

    const values = sheet.getRange('A5:H80').getValues();

    values.forEach(function (row, index) {
      if (isBlankRow_(row)) return;

      const priority = normalizeText_(row[0]);
      const task = normalizeText_(row[1]);

      if (!priority || !task || task === 'Task') return;

      const payload = {
        priority: priority,
        task: task,
        owner: normalizeText_(row[2]),
        deadline: normalizeText_(row[3]),
        status: normalizeText_(row[4]),
        deliverable: normalizeText_(row[5]),
        dependency_or_source: normalizeText_(row[6]),
        control_note: normalizeText_(row[7])
      };

      const record = buildEnvelope_({
        source_system: 'sheet_stream_task',
        entity_type: 'stream_task',
        external_id: sheetName + '_TASK_ROW_' + (5 + index),
        priority: priority,
        payload: payload,
        meta: {
          sheet_name: sheetName,
          row_number: 5 + index
        }
      });

      wpPost_(HT.ENDPOINTS.STREAM_REPORT, record, runId);
      total++;
    });
  });

  return total;
}

function pushRndBacklog(runId) {
  const ss = getSpreadsheet_();
  const sheet = ss.getSheetByName(HT.SHEETS.RND);

  if (!sheet) throw new Error('Missing sheet: ' + HT.SHEETS.RND);

  const values = sheet.getRange('A4:L120').getValues();
  let count = 0;

  values.forEach(function (row, index) {
    if (isBlankRow_(row)) return;

    const priority = normalizeText_(row[0]);
    const rndId = normalizeText_(row[1]);
    const idea = normalizeText_(row[2]);

    if (!priority || !rndId || !idea) return;

    const payload = {
      priority: priority,
      rnd_id: rndId,
      proposal: idea,
      type: normalizeText_(row[3]),
      workstream: normalizeText_(row[4]),
      impact: normalizeText_(row[5]),
      confidence: normalizeText_(row[6]),
      recommendation: normalizeText_(row[7]),
      decision: normalizeText_(row[8]),
      required_output: normalizeText_(row[9]),
      deadline: normalizeText_(row[10]),
      approval_note: normalizeText_(row[11])
    };

    const record = buildEnvelope_({
      source_system: 'sheet_rnd_backlog',
      entity_type: 'rnd_item',
      external_id: rndId,
      priority: priority,
      payload: payload,
      meta: {
        sheet_name: HT.SHEETS.RND,
        row_number: 4 + index
      }
    });

    wpPost_(HT.ENDPOINTS.RND_ITEM, record, runId);
    count++;
  });

  return count;
}

function runCommandCenterPush() {
  const runId = 'RUN-' + Utilities.formatDate(new Date(), 'Asia/Ho_Chi_Minh', 'yyyyMMdd-HHmmss');

  logAudit_({
    run_id: runId,
    action: 'RUN_START',
    ok: true,
    dry_run: getConfig_().dryRun,
    response_or_error: 'Command Center push started'
  });

  const result = {
    hot_news: pushDashboardHotNews(runId),
    stream_tasks: pushStreamTaskRows(runId),
    rnd_items: pushRndBacklog(runId)
  };

  logAudit_({
    run_id: runId,
    action: 'RUN_DONE',
    ok: true,
    dry_run: getConfig_().dryRun,
    response_or_error: JSON.stringify(result)
  });

  return result;
}