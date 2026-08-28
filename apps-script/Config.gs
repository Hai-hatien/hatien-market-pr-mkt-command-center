/**
 * Hà Tiên — Market & PR-MKT Command Center
 * Independent package for owner dashboard, research and evidence.
 */
const HTM_CONFIG = Object.freeze({
  PROJECT_CODE: 'HT-MARKET-PRMKT-V1',
  VERSION: '1.3.0-five-case-uat',
  SPREADSHEET_ID: '1Ny1Rr9SHBO7s090J-eIZfpTo_JzgEvpvzr46nXnhwvI',
  TIME_ZONE: 'Asia/Ho_Chi_Minh',
  FINAL_APPROVER: 'ht@hatiencorp.vn',
  TECHNICAL_OPERATOR: 'gpt@hatiencorp.vn',

  SHEETS: Object.freeze({
    DASHBOARD: '00_Dashboard',
    G1: '02_G1_Market',
    CONTENT: '15_Content_Ideas',
    PROOF: '08_G7_Proof_QA',
    PRODUCT_RD: '16_Product_R&D',
    RUN_LOG: 'RunLog',
    ERROR_LOG: 'ErrorLog',
    ERROR_QUEUE: 'Automation_Error_Queue',
    G1_RESULTS: 'G1_AI_Results',
    GSC_DAILY: 'GSC_Daily'
  }),

  DECISIONS: Object.freeze({
    SHOULD_DO: Object.freeze(['CHUA_QUYET_DINH', 'DONG_Y', 'NGHIEN_CUU_THEM', 'TAM_HOAN', 'KHONG_LAM']),
    PUBLISH: Object.freeze(['CHUA_QUYET_DINH', 'DANG_NGAY', 'LEN_LICH_DANG', 'SUA_LAI', 'KHONG_DANG'])
  }),

  PUBLISH_READY: Object.freeze({
    YES: Object.freeze(['YES', 'TRUE', 'READY', 'DAT']),
    QA_PASS: Object.freeze(['PASS', 'VERIFIED', 'DAT', 'ĐẠT'])
  }),

  CASES: Object.freeze([
    'MKTCASE-20260828-001',
    'MKTCASE-20260828-002',
    'MKTCASE-20260828-003',
    'MKTCASE-20260828-004',
    'MKTCASE-20260828-005'
  ]),

  GUARDRAILS: Object.freeze({
    WORDPRESS_WRITE: false,
    CRM_WRITE: false,
    AUTO_PUBLISH: false,
    AUTO_APPROVE_LEGAL: false,
    AUTO_APPROVE_BUSINESS: false,
    DEMO_WRITE: false,
    REQUIRE_SOURCE_URL: true,
    REQUIRE_PREVIEW_BEFORE_PUBLISH_APPROVAL: true
  })
});

const HTM_REQUIRED_SHEETS = Object.freeze([
  HTM_CONFIG.SHEETS.DASHBOARD,
  HTM_CONFIG.SHEETS.G1,
  HTM_CONFIG.SHEETS.CONTENT,
  HTM_CONFIG.SHEETS.PROOF,
  HTM_CONFIG.SHEETS.PRODUCT_RD,
  HTM_CONFIG.SHEETS.RUN_LOG,
  HTM_CONFIG.SHEETS.ERROR_LOG,
  HTM_CONFIG.SHEETS.ERROR_QUEUE,
  HTM_CONFIG.SHEETS.G1_RESULTS
]);
