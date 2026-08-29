import fs from 'node:fs';

const html=fs.readFileSync('apps-script/Index.html','utf8');
const must=[
  'screen-overview','screen-decisions','screen-decided','screen-publish',
  'Tổng quan','Cần quyết định','Chờ đăng','Tin lên lịch đăng','Chưa đủ điều kiện lên lịch','Đủ điều kiện, chờ chọn lịch','Đã lên lịch','Đã đăng','Nghiên cứu lại','Sửa lịch đăng','Xem bài đã đăng','Lý do chưa lên lịch','Link đã đăng',
  'Đã quyết định',
  'Có nên làm / viết không?','Có cho xuất bản không?',
  'Đăng ngay','Lên lịch đăng','Sửa lại','Không đăng',
  'Đồng ý làm','Nghiên cứu thêm','Tạm hoãn','Không làm',
  'Xem toàn bộ hàng chờ',
  'Vì sao cần xem lúc này','Căn cứ','Giá trị dự kiến','Cần lưu ý','Đề xuất:',
  'Đồng ý đề tài chỉ cho phép đội ngũ làm tiếp; chưa đồng nghĩa bài được xuất bản.',
  'CHẾ ĐỘ XEM THỬ','không ghi Google Sheet','không đăng website',
  '@media (max-width:380px)'
];
for(const token of must){
  if(!html.includes(token)) throw new Error(`Thiếu hợp đồng UX: ${token}`);
}

const body=html.slice(html.indexOf('<body>'));
const visibleBody=body.replace(/<script>[\s\S]*<\/script>/,'');
const forbidden=[/PENDING_G0_G7/i,/\bG0\b/,/\bG7\b/,/Run ID/i,/decision_type/i,/owner_decision/i,/\bclaim\b/i,/\bgate\b/i];
for(const pattern of forbidden){
  if(pattern.test(visibleBody)) throw new Error(`Lộ mã kỹ thuật trên UI: ${pattern}`);
}

if(!html.includes(".replace(/\\bG[0-8]\\b/g,'AI')")) {
  throw new Error('Thiếu lớp chuyển thuật ngữ kỹ thuật sang ngôn ngữ nghiệp vụ');
}
if(!html.includes(".replace(/\\bclaim\\b/gi,'nội dung cần kiểm chứng')")) {
  throw new Error('Thiếu lớp chuyển thuật ngữ claim trên dữ liệu động');
}
if(!html.includes(".replace(/\\bgate\\b/gi,'bước kiểm tra')")) {
  throw new Error('Thiếu lớp chuyển thuật ngữ gate trên dữ liệu động');
}
if(!html.includes("if(state.demo){demoApply(item,value,publishAt,note);")) {
  throw new Error('Chế độ xem thử chưa được chặn trước lời gọi backend');
}
if(!html.includes("else showLoadError({message:'Không có kết nối Google Apps Script.")) {
  throw new Error('Mất backend vẫn đang có nguy cơ giả vờ lưu thành công');
}

console.log('PASS: mobile owner UX, business language and demo safety contract');
