import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const base='http://127.0.0.1:4173/Preview.html';
const widths=[360,390];
const screens=['overview','decisions','publish'];
const expected={
  overview:['Đáng chú ý sáng nay','Cần quyết định','Chờ duyệt đăng'],
  decisions:['Việc cần anh quyết định','Có nên làm / viết không?','Đồng ý làm'],
  publish:['Bài chờ đăng / lịch đăng','Có cho xuất bản không?','Đăng ngay','Lên lịch đăng','Sửa lại','Không đăng']
};
const report=[];
const browser=await chromium.launch({headless:true});
try{
  for(const width of widths){
    const context=await browser.newContext({viewport:{width,height:844},deviceScaleFactor:1});
    for(const screen of screens){
      const page=await context.newPage();
      const url=`${base}?screen=${screen}`;
      await page.goto(url,{waitUntil:'networkidle'});
      await page.waitForTimeout(250);
      const title=await page.title();
      const frame=page.frames().find(f=>f!==page.mainFrame());
      if(!frame) throw new Error(`Không tìm thấy iframe preview ${width}/${screen}`);
      for(const text of expected[screen]){
        if(!(await frame.getByText(text,{exact:false}).first().isVisible())) throw new Error(`Thiếu text ${text} ở ${width}/${screen}`);
      }
      const overflow=await frame.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth+1);
      if(overflow) throw new Error(`Tràn ngang ở ${width}/${screen}`);
      const outDir=path.join('artifacts','mobile-ux',String(width));
      fs.mkdirSync(outDir,{recursive:true});
      const shot=path.join(outDir,`${screen}.png`);
      await page.screenshot({path:shot,fullPage:true});
      report.push({width,screen,url,title,overflow:false,screenshot:shot});
      await page.close();
    }
    await context.close();
  }
} finally {
  await browser.close();
}
fs.writeFileSync('artifacts/mobile-ux/report.json',JSON.stringify(report,null,2));
console.log(`PASS: ${report.length} mobile renders`);
