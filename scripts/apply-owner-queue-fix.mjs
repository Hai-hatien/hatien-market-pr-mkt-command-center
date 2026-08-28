import fs from 'node:fs';

function replaceOnce(file, from, to, label) {
  const source = fs.readFileSync(file, 'utf8');
  if (source.includes(to)) {
    console.log(`SKIP ${label}: already applied`);
    return false;
  }
  if (!source.includes(from)) {
    throw new Error(`Không tìm thấy điểm vá: ${label}`);
  }
  fs.writeFileSync(file, source.replace(from, to));
  console.log(`APPLIED ${label}`);
  return true;
}

replaceOnce(
  'apps-script/WebApp.gs',
  "  items.push.apply(items, htmReadDecisionSheet_(HTM_CONFIG.SHEETS.G1_RESULTS, 'G1_RESULTS', 'SHOULD_DO'));\n  items.push.apply(items, htmReadDecisionSheet_(HTM_CONFIG.SHEETS.CONTENT, 'CONTENT', 'PUBLISH'));",
  "  items.push.apply(items, htmReadDecisionSheet_(HTM_CONFIG.SHEETS.G1_RESULTS, 'G1_RESULTS', 'SHOULD_DO'));\n  items.push.apply(items, htmReadDecisionSheet_(HTM_CONFIG.SHEETS.CONTENT, 'CONTENT', 'SHOULD_DO'));\n  items.push.apply(items, htmReadDecisionSheet_(HTM_CONFIG.SHEETS.CONTENT, 'CONTENT', 'PUBLISH'));",
  'đưa đề xuất nội dung đã được tester rà vào cổng duyệt đề tài'
);

replaceOnce(
  'apps-script/Index.html',
  "return `<article class=\"card\"><div class=\"tag ${ready?'ready':'waiting'}\">${ready?'Đủ điều kiện trình duyệt':'Chưa đủ điều kiện đăng'}</div><h3>",
  "return `<article class=\"card\"><div class=\"tag ${ready?'ready':'waiting'}\">Có cho xuất bản không?</div><div class=\"meta\">${ready?'Đủ điều kiện trình duyệt':'Chưa đủ điều kiện đăng'}</div><h3>",
  'khôi phục câu hỏi duyệt xuất bản rõ nghĩa cho người dùng'
);

console.log('Owner queue repair completed.');
