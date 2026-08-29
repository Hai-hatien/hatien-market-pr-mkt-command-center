import { chromium } from 'playwright';
import fs from 'node:fs';

const url=process.env.HT_WEB_APP_URL||'https://script.google.com/macros/s/AKfycbzzAteIFxUfLAgp-PMlL4mdrHgyslnecWL5b7AmkGVJn2HSmwVMQ9K7sM6MY5S_6ces/exec?v=bfdfccf';
const candidates=['C:/Program Files/Google/Chrome/Application/chrome.exe',process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,process.env.CHROME_EXECUTABLE_PATH].filter(Boolean);
const launchOptions={headless:true};
for(const candidate of candidates){if(fs.existsSync(candidate)){launchOptions.executablePath=candidate;break}}
const browser=await chromium.launch(launchOptions);
try{
  const page=await browser.newPage({viewport:{width:390,height:844}});
  const errors=[];
  page.on('console',message=>{if(message.type()==='error')errors.push(message.text())});
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto(url,{waitUntil:'networkidle'});
  await page.waitForTimeout(1800);
  fs.mkdirSync('artifacts/runtime-smoke',{recursive:true});
  await page.screenshot({path:'artifacts/runtime-smoke/web-app.png',fullPage:true});
  const body=await page.locator('body').innerText();
  if(/Đăng nhập|Email hoặc số điện thoại|Email or phone|accounts\.google\.com/i.test(body)||/accounts\.google\.com/i.test(page.url()))throw new Error('Web App yêu cầu đăng nhập Google, chưa thể xác nhận runtime bằng URL công khai.');
  if(errors.some(error=>/SyntaxError|unescaped line break/i.test(error)))throw new Error('Runtime có SyntaxError: '+errors.join(' | '));
  if(!/Đáng chú ý sáng nay|Tổng quan|Cần quyết định/.test(body))throw new Error('Không thấy text dashboard sau khi tải Web App.');
  console.log('PASS: runtime smoke, no browser SyntaxError and dashboard text rendered');
}finally{await browser.close()}
