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
      summary: shouldDo.length || publishPending.length || publishLifecycle.length
        ? 'Có ' + (shouldDo.length + publishPending.length + publishLifecycle.length) + ' việc cần anh Hải xem.'
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
  let value = String(payload.decision_value || '').toUpperCase();
  const source = String(payload.source).toUpperCase();

  // In the publish lifecycle tab, "Nghiên cứu lại" is a follow-up action.
  // It is not a fresh pending owner decision, so it must be allowed even when
  // decision_required is already NO.
  if (source === 'CONTENT' && type === 'SHOULD_DO' && value === 'SUA_LAI') value = 'NGHIEN_CUU_THEM';

  const allowed = type === 'PUBLISH' ? HTM_CONFIG.DECISIONS.PUBLISH : HTM_CONFIG.DECISIONS.SHOULD_DO;

  if (!allowed.includes(value)) throw new Error('Lựa chọn không hợp lệ.');
  if (!['G1_RESULTS', 'CONTENT'].includes(source)) throw new Error('Nguồn quyết định không hợp lệ.');

  const canLifecycleAction = source === 'CONTENT' && (
    (type === 'SHOULD_DO' && value === 'NGHIEN_CUU_THEM') ||
    (type === 'PUBLISH' && ['LEN_LICH_DANG', 'SUA_LAI'].includes(value))
  );

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

  const requiredValue = requiredCol > 0 ? String(sheet.getRange(rowNumber, requiredCol).getDisplayValue()).toUpperCase() : '';
  if (requiredCol > 0 && requiredValue !== 'YES' && !canLifecycleAction) {
    throw new Error('Việc này không còn chờ quyết định.');
  }

  const currentDecision = String(sheet.getRange(rowNumber, decisionCol).getDisplayValue() || 'CHUA_QUYET_DINH').toUpperCase();
  if (currentDecision && currentDecision !== 'CHUA_QUYET_DINH' && !canLifecycleAction) {
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
  if (noteCol > 0) {
    const defaultNote = canLifecycleAction && !payload.note
      ? (value === 'LEN_LICH_DANG' ? 'Cập nhật lịch đăng từ tab Tin lên lịch đăng.' : 'Yêu cầu nghiên cứu lại từ tab Tin lên lịch đăng.')
      : '';
    sheet.getRange(rowNumber, noteCol).setValue(String(payload.note || defaultNote || ''));
  }
  if (decidedAtCol > 0) sheet.getRange(rowNumber, decidedAtCol).setValue(htmNowIso_());
  if (publishAtCol > 0) sheet.getRange(rowNumber, publishAtCol).setValue(publishAt);

  htmAppendRun_({
    job: canLifecycleAction ? 'PUBLISH_LIFECYCLE_ACTION' : 'OWNER_DECISION',
    trigger_type: 'USER_ACTION',
    actor: HTM_CONFIG.FINAL_APPROVER,
    status: 'COMPLETED',
    source_ref: sheetName + '!R' + rowNumber,
    target_ref: sheetName + '!R' + rowNumber,
    result_summary: htmSafeJson_({ type, value, publish_at: publishAt || '', lifecycle_action: canLifecycleAction })
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
  const items = [];
  items.push.apply(items, htmReadDecisionSheet_(HTM_CONFIG.SHEETS.CONTENT, 'CONTENT', 'SHOULD_DO', false, true));
  items.push.apply(items, htmReadDecisionSheet_(HTM_CONFIG.SHEETS.CONTENT, 'CONTENT', 'PUBLISH', false, true));

  const seen = {};
  return items
    .filter(item => item.record_id || item.title)
    .filter(item => {
      const key = String(item.row_number || item.record_id || item.title || '');
      if (seen[key]) return false;
      seen[key] = true;
      return true;
    })
    .map(htmEnrichPublishLifecycleItem_);
}

function htmEnrichPublishLifecycleItem_(item) {
  const enriched = Object.assign({}, item);
  if (!enriched.publish_block_reason) {
    enriched.publish_block_reason = htmInferPublishBlockReason_(enriched);
  }
  return enriched;
}

function htmInferPublishBlockReason_(item) {
  const type = String(item.decision_type || '').toUpperCase();
  const decision = htmNormalizeValue_(item.owner_decision);
  const publishStatus = htmNormalizeValue_(item.publication_status);
  const g7Status = String(item.g7_status || '').trim();
  const approvalStatus = String(item.approval_status || '').trim();
  const nextAction = String(item.recommendation || '').trim();

  if (type !== 'PUBLISH') {
    if (decision === 'DONGY') return 'Đã đồng ý làm nhưng chưa có bản thảo/preview được duyệt xuất bản.';
    if (decision === 'NGHIENCUUTHEM') return 'Đang ở bước nghiên cứu thêm, chưa đủ điều kiện lên lịch đăng.';
    if (decision === 'TAMHOAN') return 'Đề tài đang tạm hoãn, không đưa vào lịch đăng.';
    if (decision === 'KHONGLAM') return 'Đề tài đã được quyết định không làm, không đưa vào lịch đăng.';
    return 'Đề tài còn ở cổng quyết định có nên làm hay không, chưa phải bài chờ đăng.';
  }

  if (publishStatus === 'NOTREADY') return 'Bài chưa sẵn sàng xuất bản.';
  if (g7Status && !['VERIFIED', 'NOT_REQUIRED'].includes(htmNormalizeValue_(g7Status))) return 'Chưa qua kiểm chứng G7: ' + g7Status + '.';
  if (approvalStatus && !['APPROVED', 'APPROVEDTOCRM', 'APPROVEDTOPUBLISH'].includes(htmNormalizeValue_(approvalStatus))) return 'Chưa được phê duyệt xuất bản: ' + approvalStatus + '.';
  if (nextAction) return nextAction;
  return 'Chưa đủ điều kiện lên lịch đăng.';
}

function htmBuildPublishLifecycleGroups_(items) {
  const notReady = [];
  const readyToSchedule = [];
  const scheduled = [];
  const published = [];

  (items || []).forEach(item => {
    const decision = htmNormalizeValue_(item.owner_decision);
    const publishStatus = htmNormalizeValue_(item.publication_status);
    const publishReadyStatus = htmNormalizeValue_(item.publish_ready);
    const hasPublishedUrl = /^https?:\/\//i.test(String(item.post_url || ''));
    const publishReady = ['YES', 'READY', 'TRUE', 'PASS', 'APPROVED'].includes(publishReadyStatus);
    const publishNotReady = ['NO', 'NOTREADY', 'FALSE', 'BLOCKED'].includes(publishReadyStatus)
      || ['NOTREADY', 'NEEDSRESEARCH', 'PENDINGREVIEW', 'REVISIONREQUESTED', 'REJECTED'].includes(publishStatus);

    if (publishStatus === 'PUBLISHED' || publishStatus === 'PUBLISHEDCHECKING' || publishStatus === 'LIVEVERIFIED' || hasPublishedUrl) {
      published.push(item);
      return;
    }
    if (decision === 'LENLICHDANG' && item.publish_at) {
      scheduled.push(item);
      return;
    }
    if (item.decision_type !== 'PUBLISH') {
      notReady.push(item);
      return;
    }
    if (decision === 'SUALAI' || decision === 'KHONGDANG' || publishNotReady) {
      notReady.push(item);
      return;
    }
    if (decision === 'DANGNGAY' || publishReady || (decision && !['CHUAQUYETDINH',''].includes(decision))) {
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
      publication_status: read(row, ['publication_status', 'publish_status', 'Publish Status'], ''),
      post_url: read(row, ['post_url', 'wp_post_url', 'published_url', 'live_url', 'WP Post ID / URL'], ''),
      publish_ready: read(row, ['publish_ready', 'ready_to_publish', 'publish_ok', 'Publish Ready'], ''),
      publish_block_reason: read(row, ['publish_block_reason', 'publish_reason', 'block_reason', 'reason_not_ready'], ''),
      approval_status: read(row, ['approval_status', 'Approval Status'], ''),
      g7_status: read(row, ['g7_status', 'G7 Status'], ''),
      work_status: read(row, ['work_status', 'Work Status'], ''),
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
  const normalized = htmNormalizeValue_(value);
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
    .filter(item => htmNormalizeValue_(item.owner_decision) === 'LENLICHDANG' && item.publish_at)
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
  return String(value || '').trim().toLowerCase().replace(/[^a-z0-9à-ỹ]+/g, '');
}

function htmNormalizeValue_(value) {
  return String(value || '').trim().toUpperCase().replace(/[\s_-]/g, '');
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