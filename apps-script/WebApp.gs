/**
 * Mobile-first owner dashboard for HT-MARKET-PRMKT-V1.
 * UX exposes only business language and two decision types.
 */
function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('Hà Tiên — Market Command Center')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function getMarketDashboardModel() {
  htmEnsureMvpColumns_();

  const shouldDoCandidates = htmGetDecisionItems_(false);
  const shouldDo = shouldDoCandidates.filter(x => htmIsOwnerUndecided_(x.owner_decision)).slice(0, 10);
  const publishPending = htmGetDecisionItems_(true);
  const publishScheduled = htmGetScheduledPublishItems_();
  const publishLifecycle = htmGetPublishLifecycleItems_();
  const decided = htmGetDecidedItems_();
  const signals = htmGetRecentSignals_(8);
  const lifecycle = htmBuildPublishLifecycleGroups_(publishLifecycle);

  return {
    ok: true,
    generated_at: htmNowIso_(),
    greeting: htmOwnerGreeting_(),
    overview: {
      needs_decision: shouldDo.length,
      needs_decision_candidates: shouldDoCandidates.length,
      waiting_publish: lifecycle.not_ready.length + lifecycle.ready_to_schedule.length,
      scheduled_publish: lifecycle.scheduled.length,
      published_count: lifecycle.published.length,
      recent_signals: signals.length,
      summary: shouldDo.length || publishPending.length
        ? 'Có ' + (shouldDo.length + publishPending.length) + ' việc cần anh Hải xem.'
        : 'Sáng nay chưa có việc nào cần anh Hải quyết định.'
    },
    signals,
    decisions: shouldDo,
    decisions_candidates: shouldDoCandidates,
    decided,
    publish: publishPending,
    scheduled: publishScheduled,
    publish_lifecycle: lifecycle
  };
}

function saveMarketOwnerDecision(payload) {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) {
    throw new Error('Hệ thống đang lưu một quyết định khác. Vui lòng thử lại sau vài giây.');
  }

  try {
    return htmSaveMarketOwnerDecisionUnlocked_(payload);
  } finally {
    lock.releaseLock();
  }
}

function htmSaveMarketOwnerDecisionUnlocked_(payload) {
  if (!payload || !payload.source || !payload.row_number || !payload.decision_type) {
    throw new Error('Thiếu dữ liệu quyết định.');
  }

  const type = String(payload.decision_type).toUpperCase();
  const value = String(payload.decision_value || '').toUpperCase();
  const source = String(payload.source).toUpperCase();
  const allowed = type === 'PUBLISH' ? HTM_CONFIG.DECISIONS.PUBLISH : HTM_CONFIG.DECISIONS.SHOULD_DO;

  if (!allowed.includes(value)) throw new Error('Lựa chọn không hợp lệ.');
  if (!['G1_RESULTS', 'CONTENT'].includes(source)) throw new Error('Nguồn quyết định không hợp lệ.');

  const sheetName = source === 'CONTENT' ? HTM_CONFIG.SHEETS.CONTENT : HTM_CONFIG.SHEETS.G1_RESULTS;
  const sheet = htmSheet_(sheetName);
  const meta = htmTableMetaForSource_(sheet, source);
  const rowNumber = Number(payload.row_number);
  if (rowNumber <= meta.headerRow || rowNumber > sheet.getLastRow()) throw new Error('Dòng dữ liệu không hợp lệ.');

  const headers = meta.headers;
  const typeCol = htmHeaderIndex_(headers, ['decision_type']) + 1;
  const requiredCol = htmHeaderIndex_(headers, ['decision_required']) + 1;
  const decisionCol = htmHeaderIndex_(headers, ['owner_decision']) + 1;
  const noteCol = htmHeaderIndex_(headers, ['owner_note']) + 1;
  const decidedAtCol = htmHeaderIndex_(headers, ['owner_decided_at']) + 1;
  const publishAtCol = htmHeaderIndex_(headers, ['publish_at']) + 1;

  if (decisionCol <= 0) throw new Error('Thiếu cột lưu quyết định.');

  const rowType = typeCol > 0 ? String(sheet.getRange(rowNumber, typeCol).getDisplayValue() || type).toUpperCase() : type;
  if (rowType && rowType !== type) throw new Error('Loại quyết định không khớp dữ liệu.');

  if (requiredCol > 0 && String(sheet.getRange(rowNumber, requiredCol).getDisplayValue()).toUpperCase() !== 'YES') {
    throw new Error('Việc này không còn chờ quyết định.');
  }

  const currentDecision = String(sheet.getRange(rowNumber, decisionCol).getDisplayValue() || 'CHUA_QUYET_DINH').toUpperCase();
  if (currentDecision && currentDecision !== 'CHUA_QUYET_DINH') {
    throw new Error('Việc này đã được quyết định trước đó. Vui lòng tải lại màn hình.');
  }

  htmVerifyRecordIdentity_(sheet, meta, rowNumber, String(payload.record_id || ''));

  let publishAt = '';
  if (type === 'PUBLISH' && value === 'LEN_LICH_DANG') {
    publishAt = String(payload.publish_at || '').trim();
    if (!publishAt) throw new Error('Vui lòng chọn ngày giờ đăng.');
    const publishDate = new Date(publishAt);
    if (isNaN(publishDate.getTime())) throw new Error('Ngày giờ đăng không hợp lệ.');
    if (publishDate.getTime() < Date.now() - 60000) throw new Error('Không thể lên lịch ở thời điểm đã qua.');
  }

  sheet.getRange(rowNumber, decisionCol).setValue(value);
  if (requiredCol > 0) sheet.getRange(rowNumber, requiredCol).setValue('NO');
  if (noteCol > 0) sheet.getRange(rowNumber, noteCol).setValue(String(payload.note || ''));
  if (decidedAtCol > 0) sheet.getRange(rowNumber, decidedAtCol).setValue(htmNowIso_());
  if (publishAtCol > 0) sheet.getRange(rowNumber, publishAtCol).setValue(publishAt);

  htmAppendRun_({
    job: 'OWNER_DECISION',
    trigger_type: 'USER_ACTION',
    actor: HTM_CONFIG.FINAL_APPROVER,
    status: 'COMPLETED',
    source_ref: sheetName + '!R' + rowNumber,
    target_ref: sheetName + '!R' + rowNumber,
    result_summary: htmSafeJson_({ type, value, publish_at: publishAt || '' })
  });

  return { ok: true, message: htmDecisionSuccessMessage_(type, value) };
}

function htmGetDecisionItems_(onlyPending) {
  const includePendingOnly = onlyPending !== false;
  const items = [];
  items.push.apply(items, htmReadDecisionSheet_(HTM_CONFIG.SHEETS.G1_RESULTS, 'G1_RESULTS', 'SHOULD_DO', includePendingOnly));
  items.push.apply(items, htmReadDecisionSheet_(HTM_CONFIG.SHEETS.CONTENT, 'CONTENT', 'SHOULD_DO', includePendingOnly));
  items.push.apply(items, htmReadDecisionSheet_(HTM_CONFIG.SHEETS.CONTENT, 'CONTENT', 'PUBLISH', includePendingOnly));
  return items
    .filter(x => htmIsOwnerUndecided_(x.owner_decision))
    .sort((a, b) => String(b.created_at || '').localeCompare(String(a.created_at || '')));
}

function htmGetPublishLifecycleItems_() {
  return htmReadDecisionSheet_(HTM_CONFIG.SHEETS.CONTENT, 'CONTENT', 'PUBLISH', false, true);
}

function htmBuildPublishLifecycleGroups_(items) {
  const notReady = [];
  const readyToSchedule = [];
  const scheduled = [];
  const published = [];

  (items || []).forEach(item => {
    const decision = String(item.owner_decision || '').toUpperCase().replace(/[\s_-]/g, '');
    const publishStatus = String(item.publication_status || '').toUpperCase().replace(/[\s_-]/g, '');
    const hasPublishedUrl = /^https?:\/\//i.test(String(item.post_url || ''));
    const publishReady = String(item.publish_ready || '').toUpperCase().replace(/[\s_-]/g, '') === 'YES';

    if (publishStatus === 'PUBLISHED' || publishStatus === 'PUBLISHEDCHECKING' || publishStatus === 'LIVEVERIFIED' || hasPublishedUrl) {
      published.push(item);
      return;
    }
    if (decision === 'LEN_LICH_DANG' && item.publish_at) {
      scheduled.push(item);
      return;
    }
    if (decision === 'SUA_LAI' || publishReady === 'NO' || publishStatus === 'REVISIONREQUESTED') {
      notReady.push(item);
      return;
    }
    if (decision === 'KHONG_DANG') {
      notReady.push(item);
      return;
    }
    if (decision === 'DANG_NGAY' || publishReady || (decision && !['CHUAQUYETDINH',''].includes(decision))) {
      readyToSchedule.push(item);
      return;
    }
    if (htmIsOwnerUndecided_(item.owner_decision)) {
      notReady.push(item);
      return;
    }
    readyToSchedule.push(item);
  });

  [notReady, readyToSchedule, scheduled, published].forEach(group => {
    group.sort((a, b) => String(b.created_at || '').localeCompare(String(a.created_at || '')));
  });

  return {
    not_ready: notReady,
    ready_to_schedule: readyToSchedule,
    scheduled,
    published
  };
}

function htmGetDecidedItems_() {
  const items = [];
  items.push.apply(items, htmReadDecisionSheet_(HTM_CONFIG.SHEETS.G1_RESULTS, 'G1_RESULTS', 'SHOULD_DO', false, true));
  items.push.apply(items, htmReadDecisionSheet_(HTM_CONFIG.SHEETS.CONTENT, 'CONTENT', 'SHOULD_DO', false, true));
  items.push.apply(items, htmReadDecisionSheet_(HTM_CONFIG.SHEETS.CONTENT, 'CONTENT', 'PUBLISH', false, true));

  return items
    .filter(x => !htmIsOwnerUndecided_(x.owner_decision))
    .sort((a, b) => String(b.owner_decided_at || '').localeCompare(String(a.owner_decided_at || '')));
}

function htmReadDecisionSheet_(sheetName, sourceKey, defaultType, includePendingOnly, includeNoDecisionRequired) {
  const sheet = htmSheet_(sheetName);
  if (sheet.getLastRow() < 2 || sheet.getLastColumn() < 1) return [];

  const meta = htmTableMetaForSource_(sheet, sourceKey);
  const rowCount = sheet.getLastRow() - meta.headerRow;
  if (rowCount <= 0) return [];
  const rows = sheet.getRange(meta.headerRow + 1, 1, rowCount, sheet.getLastColumn()).getDisplayValues();
  const headers = meta.headers;
  const read = (row, names, fallback) => htmReadByAliases_(headers, row, names, fallback);

  return rows.map((row, i) => {
    const required = String(read(row, ['decision_required'], '')).toUpperCase();
    const ownerDecision = String(read(row, ['owner_decision'], 'CHUA_QUYET_DINH')).toUpperCase();
    const type = String(read(row, ['decision_type'], defaultType)).toUpperCase() || defaultType;

    return {
      source: sourceKey,
      row_number: meta.headerRow + 1 + i,
      record_id: read(row, ['result_id', 'Content ID', 'content_id', 'Asset ID', 'id'], ''),
      decision_type: type === 'PUBLISH' ? 'PUBLISH' : 'SHOULD_DO',
      decision_required: required,
      owner_decision: ownerDecision,
      owner_decided_at: read(row, ['owner_decided_at'], ''),
      publication_status: read(row, ['publication_status', 'publish_status'], ''),
      post_url: read(row, ['post_url', 'wp_post_url', 'published_url', 'live_url'], ''),
      publish_ready: read(row, ['publish_ready', 'ready_to_publish', 'publish_ok'], ''),
      publish_block_reason: read(row, ['publish_block_reason', 'publish_reason', 'block_reason', 'reason_not_ready'], ''),
      title: read(row, ['decision_title', 'Working Title', 'title', 'content_title', 'seo_title', 'finding', 'Core message'], 'Việc cần xem'),
      why_now: read(row, ['reason_to_decide', 'Decision / Notes', 'why_now', 'business_case', 'impact_hatien'], ''),
      value_summary: read(row, ['value_summary', 'impact_hatien', 'business_value', 'expected_value', 'Affected product/customer'], ''),
      risk_summary: read(row, ['risk_summary', 'risk', 'Claim Risk', 'evidence_status', 'confidence'], ''),
      evidence_summary: read(row, ['evidence_summary', 'source_title', 'Evidence Needed', 'evidence_status'], ''),
      recommendation: read(row, ['recommended_action', 'Next Action', 'ai_recommendation', 'recommendation'], ''),
      source_title: read(row, ['source_title', 'Source Trigger', 'evidence_title'], ''),
      source_url: read(row, ['source_url', 'Related Landing / Hub', 'evidence_url'], ''),
      preview_url: read(row, ['preview_url', 'WP Post ID / URL', 'draft_url', 'url'], ''),
      target_site: read(row, ['target_site', 'site', 'website'], sourceKey === 'CONTENT' ? 'hatiencorp.vn' : ''),
      created_at: read(row, ['created_at', 'Last Updated', 'Proposed Date', 'updated_at'], ''),
      publish_at: read(row, ['publish_at', 'scheduled_at'], '')
    };
  }).filter(item =>
    (includeNoDecisionRequired || item.decision_required === 'YES')
      && item.decision_type === defaultType
      && (includePendingOnly === false || htmIsOwnerUndecided_(item.owner_decision))
  );
}

function htmIsOwnerUndecided_(value) {
  const normalized = String(value || '').trim().toUpperCase().replace(/[\s_-]/g, '');
  return !normalized || normalized === 'CHUAQUYETDINH';
}

function htmGetScheduledPublishItems_() {
  const sheet = htmSheet_(HTM_CONFIG.SHEETS.CONTENT);
  if (sheet.getLastRow() < 2 || sheet.getLastColumn() < 1) return [];

  const meta = htmTableMetaForSource_(sheet, 'CONTENT');
  const rowCount = sheet.getLastRow() - meta.headerRow;
  if (rowCount <= 0) return [];
  const rows = sheet.getRange(meta.headerRow + 1, 1, rowCount, sheet.getLastColumn()).getDisplayValues();
  const headers = meta.headers;
  const read = (row, names, fallback) => htmReadByAliases_(headers, row, names, fallback);

  return rows.map((row, i) => ({
    source: 'CONTENT',
    row_number: meta.headerRow + 1 + i,
    record_id: read(row, ['Content ID', 'content_id', 'Asset ID', 'id'], ''),
    title: read(row, ['decision_title', 'Working Title', 'title', 'content_title', 'seo_title', 'Core message'], 'Bài đã lên lịch'),
    target_site: read(row, ['target_site', 'site', 'website'], 'hatiencorp.vn'),
    preview_url: read(row, ['preview_url', 'WP Post ID / URL', 'draft_url', 'url'], ''),
    owner_decision: String(read(row, ['owner_decision'], '')).toUpperCase(),
    publish_at: read(row, ['publish_at', 'scheduled_at'], ''),
    owner_note: read(row, ['owner_note', 'Decision / Notes'], '')
  }))
    .filter(item => item.owner_decision === 'LEN_LICH_DANG' && item.publish_at)
    .sort((a, b) => String(a.publish_at || '').localeCompare(String(b.publish_at || '')))
    .slice(0, 20);
}

function htmGetRecentSignals_(limit) {
  const sheet = htmSheet_(HTM_CONFIG.SHEETS.G1_RESULTS);
  if (sheet.getLastRow() < 2) return [];

  const meta = htmTableMetaForSource_(sheet, 'G1_RESULTS');
  const rowCount = sheet.getLastRow() - meta.headerRow;
  if (rowCount <= 0) return [];
  const rows = sheet.getRange(meta.headerRow + 1, 1, rowCount, sheet.getLastColumn()).getDisplayValues();
  const headers = meta.headers;
  const read = (row, names, fallback) => htmReadByAliases_(headers, row, names, fallback);

  return rows.map(row => ({
    title: read(row, ['decision_title', 'finding', 'title'], 'Tín hiệu thị trường'),
    detail: read(row, ['impact_hatien', 'reason_to_decide', 'finding'], ''),
    recommendation: read(row, ['recommended_action'], ''),
    source_title: read(row, ['source_title'], ''),
    source_url: read(row, ['source_url'], ''),
    created_at: read(row, ['created_at'], '')
  }))
    .filter(x => (x.title || x.detail) && htmIsRecentSignal_(x.created_at))
    .sort((a, b) => String(b.created_at || '').localeCompare(String(a.created_at || '')))
    .slice(0, Math.max(1, Number(limit || 8)));
}

function htmEnsureMvpColumns_() {
  htmEnsureColumns_(HTM_CONFIG.SHEETS.G1_RESULTS, 'G1_RESULTS', [
    'decision_required', 'decision_type', 'decision_title', 'reason_to_decide',
    'owner_decision', 'owner_note', 'owner_decided_at'
  ]);
  htmEnsureColumns_(HTM_CONFIG.SHEETS.CONTENT, 'CONTENT', [
    'decision_required', 'decision_type', 'decision_title', 'reason_to_decide',
    'owner_decision', 'owner_note', 'owner_decided_at', 'preview_url', 'target_site', 'publish_at'
  ]);
}

function htmEnsureColumns_(sheetName, sourceKey, required) {
  const sheet = htmSheet_(sheetName);
  const meta = htmTableMetaForSource_(sheet, sourceKey);
  const missing = required.filter(h => htmHeaderIndex_(meta.headers, [h]) < 0);
  if (!missing.length) return;

  const start = Math.max(1, sheet.getLastColumn() + 1);
  sheet.getRange(meta.headerRow, start, 1, missing.length).setValues([missing]);
}

function htmTableMetaForSource_(sheet, sourceKey) {
  const expected = sourceKey === 'CONTENT'
    ? ['Content ID', 'Working Title', 'Publish Status', 'Approval Status']
    : ['result_id', 'finding', 'source_url', 'recommended_action'];
  return htmDetectHeaderRow_(sheet, expected);
}

function htmDetectHeaderRow_(sheet, expectedHeaders) {
  const lastRow = Math.max(1, sheet.getLastRow());
  const lastCol = Math.max(1, sheet.getLastColumn());
  const scanRows = Math.min(10, lastRow);
  const values = sheet.getRange(1, 1, scanRows, lastCol).getDisplayValues();
  const expected = expectedHeaders.map(htmNormalizeHeader_);
  let bestIndex = 0;
  let bestScore = -1;

  values.forEach((row, i) => {
    const normalized = row.map(htmNormalizeHeader_);
    const score = expected.reduce((sum, h) => sum + (normalized.includes(h) ? 1 : 0), 0);
    if (score > bestScore) {
      bestScore = score;
      bestIndex = i;
    }
  });

  return { headerRow: bestIndex + 1, headers: values[bestIndex].map(String) };
}

function htmHeaderIndex_(headers, aliases) {
  const normalized = headers.map(htmNormalizeHeader_);
  for (let i = 0; i < aliases.length; i++) {
    const at = normalized.indexOf(htmNormalizeHeader_(aliases[i]));
    if (at >= 0) return at;
  }
  return -1;
}

function htmReadByAliases_(headers, row, aliases, fallback) {
  const at = htmHeaderIndex_(headers, aliases);
  return at >= 0 && String(row[at] || '').trim() ? row[at] : (fallback || '');
}

function htmNormalizeHeader_(value) {
  return String(value || '').trim().toLowerCase();
}

function htmVerifyRecordIdentity_(sheet, meta, rowNumber, recordId) {
  if (!recordId) return;
  const aliases = ['result_id', 'Content ID', 'content_id', 'Asset ID', 'id'];
  const col = htmHeaderIndex_(meta.headers, aliases) + 1;
  if (col <= 0) return;
  const actual = String(sheet.getRange(rowNumber, col).getDisplayValue() || '');
  if (actual && actual !== recordId) {
    throw new Error('Dữ liệu đã thay đổi vị trí. Vui lòng tải lại màn hình trước khi quyết định.');
  }
}

function htmIsRecentSignal_(value) {
  if (!value) return false;
  const parsed = new Date(value);
  if (isNaN(parsed.getTime())) return true;
  const ageMs = Date.now() - parsed.getTime();
  return ageMs >= -3600000 && ageMs <= 36 * 3600000;
}

function htmOwnerGreeting_() {
  const hour = Number(Utilities.formatDate(new Date(), HTM_CONFIG.TIME_ZONE, 'H'));
  if (hour < 11) return 'Chào buổi sáng, anh Hải';
  if (hour < 18) return 'Chào anh Hải';
  return 'Chào buổi tối, anh Hải';
}

function htmDecisionSuccessMessage_(type, value) {
  if (type === 'PUBLISH') {
    return {
      DANG_NGAY: 'Đã ghi nhận: đăng ngay.',
      LEN_LICH_DANG: 'Đã ghi nhận lịch đăng.',
      SUA_LAI: 'Đã gửi yêu cầu sửa lại.',
      KHONG_DANG: 'Đã ghi nhận: không đăng.'
    }[value] || 'Đã lưu quyết định.';
  }
  return {
    DONG_Y: 'Đã ghi nhận: đồng ý làm.',
    NGHIEN_CUU_THEM: 'Đã ghi nhận: nghiên cứu thêm.',
    TAM_HOAN: 'Đã ghi nhận: tạm hoãn.',
    KHONG_LAM: 'Đã ghi nhận: không làm.'
  }[value] || 'Đã lưu quyết định.';
}
