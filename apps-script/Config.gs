/**
 * Hà Tiên — Market & PR-MKT Command Center
 * MVP recovery package
 * Bound spreadsheet: 1Ny1Rr9SHBO7s090J-eIZfpTo_JzgEvpvzr46nXnhwvI
 *
 * Scheduling/research is owned by ChatGPT Schedule.
 * Apps Script is only the thin UI/data layer.
 */
const HTM_CONFIG = Object.freeze({
  PROJECT_CODE: 'HT-MARKET-PRMKT-V1',
  VERSION: '1.1.1-mvp',
  SPREADSHEET_ID: '1Ny1Rr9SHBO7s090J-eIZfpTo_JzgEvpvzr46nXnhwvI',
  TIME_ZONE: 'Asia/Ho_Chi_Minh',
  FINAL_APPROVER: 'ht@hatiencorp.vn',

  SHEETS: Object.freeze({
    DASHBOARD: '00_Dashboard',
    G1: '02_G1_Market',
    CONTENT: '15_Content_Ideas',
    PROOF: '08_G7_Proof_QA',
    CONTENT_IDEAS: '15_Content_Ideas',
    PRODUCT_RD: '16_Product_R&D',
    RUN_LOG: 'RunLog',
    ERROR_LOG: 'ErrorLog',
    G1_RESULTS: 'G1_AI_Results'
  }),

  // Only two business decisions are exposed to the owner in MVP.
  DECISIONS: Object.freeze({
    SHOULD_DO: Object.freeze(['CHUA_QUYET_DINH', 'DONG_Y', 'NGHIEN_CUU_THEM', 'TAM_HOAN', 'KHONG_LAM']),
    PUBLISH: Object.freeze(['CHUA_QUYET_DINH', 'DANG_NGAY', 'LEN_LICH_DANG', 'SUA_LAI', 'KHONG_DANG'])
  }),

  GUARDRAILS: Object.freeze({
    WORDPRESS_WRITE: false,
    CRM_WRITE: false,
    AUTO_PUBLISH: false,
    AUTO_APPROVE_LEGAL: false,
    AUTO_APPROVE_BUSINESS: false,
    REQUIRE_SOURCE_URL: true
  })
});

const HTM_REQUIRED_SHEETS = Object.freeze(Array.from(new Set(Object.values(HTM_CONFIG.SHEETS))));
