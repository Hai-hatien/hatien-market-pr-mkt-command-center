/**
 * MVP verification only.
 * No Apps Script scheduler. No AI gateway. No auto-publish.
 * ChatGPT Schedule performs research; WebApp.gs owns the mobile decision UX.
 */
function verifyMarketMvp() {
  const validation = htmValidateWorkbook_();
  return {
    ok: validation.ok,
    workbook: validation,
    version: HTM_CONFIG.VERSION,
    research_owner: 'CHATGPT_SCHEDULE',
    owner_ui: 'MOBILE_WEB_APP',
    screens: ['TONG_QUAN', 'CAN_QUYET_DINH', 'CHO_DANG_LICH_DANG'],
    decision_types: ['SHOULD_DO', 'PUBLISH'],
    gsc_mode: 'DIRECT_GOOGLE_SEARCH_CONSOLE_API',
    auto_publish: false
  };
}
