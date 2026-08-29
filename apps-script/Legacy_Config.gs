const HT = {
  APP_NAME: 'HT_CommandCenter_WP_Bridge',
  API_NAMESPACE: '/wp-json/ht/v1',

  DEFAULT_SPREADSHEET_ID: '1Ny1Rr9SHBO7s090J-eIZfpTo_JzgEvpvzr46nXnhwvI',

  SHEETS: {
    DASHBOARD: '00_Dashboard',
    RND: '10_R&D_P0-P9',
    AUDIT_LOG: '99_AppsScript_AuditLog'
  },

  STREAM_SHEETS: [
    '01_G0_Command',
    '02_G1_Market',
    '03_G2_Customer',
    '04_G3_Showroom',
    '05_G4_PR_Content',
    '06_G5_Acquisition',
    '07_G6_CRM_Sales',
    '08_G7_Proof_QA',
    '09_G8_Aftersales'
  ],

  ENDPOINTS: {
    HEALTH: '/health',
    STREAM_REPORT: '/command/stream-report',
    MARKET_FINDING: '/command/market-finding',
    RND_ITEM: '/command/rnd-item',
    BLOCKER: '/command/blocker',
    DECISION_NEEDED: '/command/decision-needed',
    CONTENT_DRAFT: '/content/draft'
  }
};

/**
 * Chạy 1 lần để tạo Script Properties.
 * Sau khi tạo xong, vào Project Settings kiểm tra lại.
 */
function setupScriptProperties() {
  PropertiesService.getScriptProperties().setProperties({
    HT_SPREADSHEET_ID: HT.DEFAULT_SPREADSHEET_ID,
    HT_WP_BASE_URL: 'https://hatiencorp.vn',
    HT_WP_USER: 'ht-api-intake',
    HT_WP_APP_PASSWORD: 'PASTE_APPLICATION_PASSWORD_HERE',
    HT_DRY_RUN: 'true'
  }, true);
}

/**
 * Đọc cấu hình.
 */
function getConfig_() {
  const props = PropertiesService.getScriptProperties();

  const cfg = {
    spreadsheetId: props.getProperty('HT_SPREADSHEET_ID') || HT.DEFAULT_SPREADSHEET_ID,
    wpBaseUrl: props.getProperty('HT_WP_BASE_URL'),
    wpUser: props.getProperty('HT_WP_USER'),
    wpAppPassword: props.getProperty('HT_WP_APP_PASSWORD'),
    dryRun: String(props.getProperty('HT_DRY_RUN') || 'true').toLowerCase() === 'true'
  };

  if (!cfg.spreadsheetId) throw new Error('Missing HT_SPREADSHEET_ID');
  if (!cfg.wpBaseUrl) throw new Error('Missing HT_WP_BASE_URL');

  if (!cfg.dryRun) {
    if (!cfg.wpUser) throw new Error('Missing HT_WP_USER');
    if (!cfg.wpAppPassword) throw new Error('Missing HT_WP_APP_PASSWORD');
    if (cfg.wpAppPassword === 'PASTE_APPLICATION_PASSWORD_HERE') {
      throw new Error('HT_WP_APP_PASSWORD is not configured');
    }
  }

  return cfg;
}