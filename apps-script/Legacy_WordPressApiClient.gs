function wpUrl_(endpoint) {
  const cfg = getConfig_();
  return cfg.wpBaseUrl.replace(/\/$/, '') + HT.API_NAMESPACE + endpoint;
}

function wpAuthHeader_() {
  const cfg = getConfig_();
  const token = Utilities.base64Encode(cfg.wpUser + ':' + cfg.wpAppPassword);

  return 'Basic ' + token;
}

function wpGet_(endpoint, runId) {
  const cfg = getConfig_();
  const url = wpUrl_(endpoint);

  if (cfg.dryRun) {
    logAudit_({
      run_id: runId,
      action: 'WP_GET_DRY_RUN',
      endpoint: endpoint,
      ok: true,
      dry_run: true,
      response_or_error: url
    });

    return {
      ok: true,
      dry_run: true,
      url: url
    };
  }

  const res = UrlFetchApp.fetch(url, {
    method: 'get',
    headers: {
      Authorization: wpAuthHeader_()
    },
    muteHttpExceptions: true
  });

  const status = res.getResponseCode();
  const body = res.getContentText();
  const ok = status >= 200 && status < 300;

  logAudit_({
    run_id: runId,
    action: 'WP_GET',
    endpoint: endpoint,
    http_status: status,
    ok: ok,
    dry_run: false,
    response_or_error: body.slice(0, 1000)
  });

  if (!ok) throw new Error('WP GET failed: ' + endpoint + ' ' + status + ' ' + body);

  return safeJsonParse_(body);
}

function wpPost_(endpoint, record, runId) {
  const cfg = getConfig_();
  const url = wpUrl_(endpoint);
  const payload = JSON.stringify(record);

  if (cfg.dryRun) {
    logAudit_({
      run_id: runId,
      action: 'WP_POST_DRY_RUN',
      endpoint: endpoint,
      external_id: record.external_id,
      idempotency_key: record.idempotency_key,
      ok: true,
      dry_run: true,
      response_or_error: payload.slice(0, 1000)
    });

    return {
      ok: true,
      dry_run: true,
      endpoint: endpoint,
      external_id: record.external_id
    };
  }

  let lastError = null;

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = UrlFetchApp.fetch(url, {
        method: 'post',
        contentType: 'application/json',
        payload: payload,
        headers: {
          Authorization: wpAuthHeader_(),
          'Idempotency-Key': record.idempotency_key
        },
        muteHttpExceptions: true
      });

      const status = res.getResponseCode();
      const body = res.getContentText();
      const ok = status >= 200 && status < 300;

      logAudit_({
        run_id: runId,
        action: 'WP_POST_ATTEMPT_' + attempt,
        endpoint: endpoint,
        external_id: record.external_id,
        idempotency_key: record.idempotency_key,
        http_status: status,
        ok: ok,
        dry_run: false,
        response_or_error: body.slice(0, 1000)
      });

      if (ok) return safeJsonParse_(body);

      lastError = new Error('HTTP ' + status + ': ' + body);
    } catch (err) {
      lastError = err;

      logAudit_({
        run_id: runId,
        action: 'WP_POST_ATTEMPT_' + attempt,
        endpoint: endpoint,
        external_id: record.external_id,
        idempotency_key: record.idempotency_key,
        ok: false,
        dry_run: false,
        response_or_error: String(err).slice(0, 1000)
      });
    }

    Utilities.sleep(attempt * 1500);
  }

  throw lastError;
}