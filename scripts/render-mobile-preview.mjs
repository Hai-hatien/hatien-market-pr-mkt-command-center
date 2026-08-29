import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const base='http://127.0.0.1:4173/Preview.html';
const widths=[360,390];
const screens=['overview','decisions','decided','publish'];
const expected={
  overview:['Đáng chú ý sáng nay','Cần quyết định','Chờ duyệt đăng'],
  decisions:['Việc cần anh quyết định','Không có việc nào cần quyết định.'],
  decided:['Đã quyết định'],
  publish:['Bài chờ đăng / lịch đăng','Có cho xuất bản không?','Đăng ngay',['Lên lịch đăng','Xác nhận lịch đăng'],'Sửa lại','Không đăng']
};
const report=[];
const candidates = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
  process.env.CHROME_EXECUTABLE_PATH
].filter(Boolean);
const launchOptions = {headless:true};
for (const candidate of candidates) {
  try {
    if (fs.existsSync(candidate)) {
      launchOptions.executablePath = candidate;
      break;
    }
  } catch (_) {}
}

const browser=await chromium.launch(launchOptions);
try{
  for(const width of widths){
    const context=await browser.newContext({viewport:{width,height:844},deviceScaleFactor:1});
    for(const screen of screens){
      const page=await context.newPage();
      const url=`${base}?screen=${screen}`;
      await page.goto(url,{waitUntil:'networkidle'});
      await page.waitForTimeout(250);
      const title=await page.title();
      let frame;
      for(let attempt=0; attempt<20; attempt++){
        frame=page.frames().find(f=>f.url().includes('Index.html'));
        if(!frame){
          const iframe=await page.$('iframe#app');
          if(iframe){
            frame=await iframe.contentFrame();
          }
        }
        if(frame) break;
        await page.waitForTimeout(150);
      }
      if(!frame) throw new Error(`Không tìm thấy iframe preview ${width}/${screen}`);
      const btn=frame.locator(`[data-screen="${screen}"]`);
      if(await btn.count()>0){
        await btn.first().click({timeout:1500}).catch(()=>{});
      }
      for(const text of expected[screen]){
        const tokens=Array.isArray(text)?text:[text];
        let found=false;
        for(const token of tokens){
          try{
            await frame.getByText(token,{exact:false}).first().waitFor({state:'visible',timeout:1000});
            found=true;
            break;
          } catch(_) {}
        }
        if(found) continue;
        try{
          await frame.getByText(Array.isArray(text)?text.join('/'):text,{exact:false}).first().waitFor({state:'visible',timeout:1500});
        } catch(_) {
          throw new Error(`Thiếu text ${Array.isArray(text)?text.join('/') : text} ở ${width}/${screen}`);
        }
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
