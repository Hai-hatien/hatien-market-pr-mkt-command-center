// Runtime patch for publish lifecycle actions.
// Purpose: "Nghiên cứu lại" / "Sửa lịch đăng" in the publish lifecycle tab
// are follow-up workflow actions, not fresh pending owner decisions.
// They must not be blocked by decision_required = NO.

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

  // The publish lifecycle tab sends SUA_LAI for the "Nghiên cứu lại" button.
  // For SHOULD_DO content rows, map that to the existing owner decision vocabulary.
  if (source === 'CONTENT' && type === 'SHOULD_DO' && value === 'SUA_LAI') {
    value = 'NGHIEN_CUU_THEM';
  }

  const allowed = type === 'PUBLISH'
    ? HTM_CONFIG.DECISIONS.PUBLISH
    : HTM_CONFIG.DECISIONS.SHOULD_DO;

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

  const rowType = typeCol > 0
    ? String(sheet.getRange(rowNumber, typeCol).getDisplayValue() || type).toUpperCase()
    : type;
  if (rowType && rowType !== type) throw new Error('Loại quyết định không khớp dữ liệu.');

  const requiredValue = requiredCol > 0
    ? String(sheet.getRange(rowNumber, requiredCol).getDisplayValue()).toUpperCase()
    : '';
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
