/**
 * Dữ liệu UAT tách biệt bằng tiền tố UAT-. Không tự chạy, không tự xuất bản.
 * Tester/QA chỉ gọi prepareMarketDashboardUat() khi bắt đầu kiểm thử thật.
 */
function prepareMarketDashboardUat() {
  return htmWithLock_('PREPARE_MARKET_UAT', function () {
    htmEnsureMvpColumns_();
    const stamp = Utilities.formatDate(new Date(), HTM_CONFIG.TIME_ZONE, 'yyyyMMdd');
    const decisionId = 'UAT-G1-' + stamp + '-001';
    const contentId = 'UAT-CONTENT-' + stamp + '-001';

    const decision = htmUpsertUatRecord_(HTM_CONFIG.SHEETS.G1_RESULTS, 'G1_RESULTS', decisionId, {
      result_id: decisionId,
      finding: 'Bản ghi kiểm thử quyết định đề tài — không phải đề xuất kinh doanh thật',
      decision_required: 'YES',
      decision_type: 'SHOULD_DO',
      decision_title: 'Kiểm thử luồng quyết định của anh Hải',
      reason_to_decide: 'Chỉ dùng để kiểm tra giao diện, ghi đúng dòng và chống ghi đè.',
      value_summary: 'Xác nhận hệ thống có thể ghi nhận quyết định mà không tác động dữ liệu kinh doanh.',
      risk_summary: 'Không được dùng bản ghi UAT làm nguồn nội dung hoặc quyết định thật.',
      evidence_summary: 'Dữ liệu do QA tạo có tiền tố UAT và có thể xóa sau kiểm thử.',
      recommended_action: 'Chọn Nghiên cứu thêm để kiểm luồng an toàn.',
      source_title: 'Hồ sơ UAT nội bộ',
      source_url: 'https://script.google.com',
      created_at: htmNowIso_(),
      owner_decision: 'CHUA_QUYET_DINH',
      owner_note: '',
      owner_decided_at: ''
    });

    const content = htmUpsertUatRecord_(HTM_CONFIG.SHEETS.CONTENT, 'CONTENT', contentId, {
      'Content ID': contentId,
      'Working Title': 'Bài kiểm thử lịch đăng — không xuất bản thật',
      decision_required: 'YES',
      decision_type: 'PUBLISH',
      decision_title: 'Bài kiểm thử cổng duyệt xuất bản',
      reason_to_decide: 'Chỉ dùng UAT để kiểm tiêu chuẩn, preview, lịch đăng và trạng thái sau duyệt.',
      value_summary: 'Kiểm chứng cổng duyệt bài trước khi áp dụng cho nội dung thật.',
      evidence_summary: 'Fixture UAT nội bộ; không phải claim hoặc nội dung được phép public.',
      standard_status: 'Đã áp dụng Tiêu chuẩn bài website Hà Tiên v2.1',
      business_value: 'UAT hệ thống; không có giá trị SEO/sales thật.',
      primary_keyword: 'uat dashboard hà tiên',
      search_intent: 'Kiểm thử nội bộ',
      cta: 'Không có CTA public',
      qa_status: 'PASS',
      seo_score: 'UAT',
      approval_scope: 'Duyệt toàn bộ fixture UAT và lịch giả lập',
      planned_url: 'https://hatiencorp.vn/uat-khong-xuat-ban',
      publish_ready: 'YES',
      preview_url: 'https://example.com/uat-preview',
      target_site: 'hatiencorp.vn',
      publish_at: '',
      publication_status: 'READY_FOR_APPROVAL',
      post_url: '',
      post_publish_check: 'UAT — không xuất bản thật',
      owner_decision: 'CHUA_QUYET_DINH',
      owner_note: 'UAT — không đăng thật',
      owner_decided_at: ''
    });

    htmAppendRun_({
      job: 'PREPARE_MARKET_UAT',
      trigger_type: 'MANUAL_QA',
      actor: HTM_CONFIG.TECHNICAL_OPERATOR,
      status: 'COMPLETED',
      result_summary: htmSafeJson_({ decision: decision, content: content })
    });

    return { ok: true, decision: decision, content: content, warning: 'Chỉ dùng UAT; không xuất bản website.' };
  });
}

function getMarketUatReadiness() {
  htmEnsureMvpColumns_();
  return {
    ok: true,
    checked_at: htmNowIso_(),
    decision_records: htmListUatRecords_(HTM_CONFIG.SHEETS.G1_RESULTS, 'G1_RESULTS'),
    content_records: htmListUatRecords_(HTM_CONFIG.SHEETS.CONTENT, 'CONTENT')
  };
}

function cleanupMarketDashboardUat() {
  return htmWithLock_('CLEANUP_MARKET_UAT', function () {
    const deleted = [];
    [
      [HTM_CONFIG.SHEETS.G1_RESULTS, 'G1_RESULTS'],
      [HTM_CONFIG.SHEETS.CONTENT, 'CONTENT']
    ].forEach(function (entry) {
      const sheet = htmSheet_(entry[0]);
      const meta = htmTableMetaForSource_(sheet, entry[1]);
      const idCol = htmHeaderIndex_(meta.headers, ['result_id', 'Content ID', 'content_id', 'Asset ID', 'id']) + 1;
      if (idCol <= 0) return;
      const rows = [];
      for (let row = meta.headerRow + 1; row <= sheet.getLastRow(); row++) {
        const id = String(sheet.getRange(row, idCol).getDisplayValue() || '');
        if (id.indexOf('UAT-') === 0) rows.push(row);
      }
      rows.reverse().forEach(function (row) {
        deleted.push(entry[0] + '!R' + row);
        sheet.deleteRow(row);
      });
    });
    htmAppendRun_({
      job: 'CLEANUP_MARKET_UAT',
      trigger_type: 'MANUAL_QA',
      actor: HTM_CONFIG.TECHNICAL_OPERATOR,
      status: 'COMPLETED',
      result_summary: htmSafeJson_({ deleted: deleted })
    });
    return { ok: true, deleted: deleted };
  });
}

function htmUpsertUatRecord_(sheetName, sourceKey, recordId, data) {
  const sheet = htmSheet_(sheetName);
  const meta = htmTableMetaForSource_(sheet, sourceKey);
  const idCol = htmHeaderIndex_(meta.headers, ['result_id', 'Content ID', 'content_id', 'Asset ID', 'id']) + 1;
  if (idCol <= 0) throw new Error('Không tìm thấy cột ID trong ' + sheetName);

  for (let row = meta.headerRow + 1; row <= sheet.getLastRow(); row++) {
    if (String(sheet.getRange(row, idCol).getDisplayValue() || '') === recordId) {
      return { id: recordId, row_number: row, created: false, sheet: sheetName };
    }
  }

  const normalizedData = {};
  Object.keys(data).forEach(function (key) {
    normalizedData[htmNormalizeHeader_(key)] = data[key];
  });
  const rowValues = meta.headers.map(function (header) {
    const key = htmNormalizeHeader_(header);
    return Object.prototype.hasOwnProperty.call(normalizedData, key) ? normalizedData[key] : '';
  });
  const rowNumber = Math.max(meta.headerRow + 1, sheet.getLastRow() + 1);
  sheet.getRange(rowNumber, 1, 1, rowValues.length).setValues([rowValues]);
  return { id: recordId, row_number: rowNumber, created: true, sheet: sheetName };
}

function htmListUatRecords_(sheetName, sourceKey) {
  const sheet = htmSheet_(sheetName);
  const meta = htmTableMetaForSource_(sheet, sourceKey);
  const idCol = htmHeaderIndex_(meta.headers, ['result_id', 'Content ID', 'content_id', 'Asset ID', 'id']) + 1;
  const decisionCol = htmHeaderIndex_(meta.headers, ['owner_decision']) + 1;
  const requiredCol = htmHeaderIndex_(meta.headers, ['decision_required']) + 1;
  if (idCol <= 0) return [];
  const records = [];
  for (let row = meta.headerRow + 1; row <= sheet.getLastRow(); row++) {
    const id = String(sheet.getRange(row, idCol).getDisplayValue() || '');
    if (id.indexOf('UAT-') !== 0) continue;
    records.push({
      id: id,
      row_number: row,
      decision_required: requiredCol > 0 ? sheet.getRange(row, requiredCol).getDisplayValue() : '',
      owner_decision: decisionCol > 0 ? sheet.getRange(row, decisionCol).getDisplayValue() : ''
    });
  }
  return records;
}
