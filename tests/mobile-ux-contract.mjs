import fs from 'node:fs';

const html=fs.readFileSync('apps-script/Index.html','utf8');
const must=[
  'screen-overview','screen-decisions','screen-publish',
  'Tổng quan','Cần quyết định','Chờ đăng',
  'Có nên làm / viết không?','Có cho xuất bản không?',
  'Đăng ngay','Lên lịch đăng','Sửa lại','Không đăng',
  'Đồng ý làm','Nghiên cứu thêm','Tạm hoãn','Không làm',
  '@media (max-width:380px)'
];
for(const token of must){
  if(!html.includes(token)) throw new Error(`Thiếu hợp đồng UX: ${token}`);
}

const body=html.slice(html.indexOf('<body>'));
const forbidden=[/PENDING_G0_G7/i,/\bG0\b/,/\bG7\b/,/Run ID/i,/decision_type/i,/owner_decision/i];
for(const pattern of forbidden){
  if(pattern.test(body.replace(/<script>[\s\S]*<\/script>/,''))) throw new Error(`Lộ mã kỹ thuật trên UI: ${pattern}`);
}

console.log('PASS: mobile owner UX contract');
