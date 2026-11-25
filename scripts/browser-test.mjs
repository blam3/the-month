import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';

function parseCsv(text) {
  const rows = []; let row = [], value = '', quoted = false;
  for (let i=0; i<text.length; i++) {
    const c = text[i];
    if (c === '"') { if (quoted && text[i+1] === '"') { value += '"'; i++; } else quoted = !quoted; }
    else if (c === ',' && !quoted) { row.push(value); value = ''; }
    else if ((c === '\n' || c === '\r') && !quoted) {
      if (c === '\r' && text[i+1] === '\n') i++;
      row.push(value); if (row.some(v=>v!=='')) rows.push(row); row=[]; value='';
    } else value += c;
  }
  if (value || row.length) { row.push(value); rows.push(row); }
  assert(!quoted, 'CSV quote balance');
  const headers = rows.shift();
  return rows.map(values => { assert.equal(values.length,headers.length); return Object.fromEntries(headers.map((h,i)=>[h,values[i]])); });
}

function verify(rows) {
  assert.equal(rows.length,21);
  assert.equal(rows.filter(r=>r.trial_role==='decision').length,15);
  assert.equal(rows.filter(r=>r.trial_role==='expense').length,6);
  let balance=1000, expenses=0;
  for (const row of rows) {
    assert.equal(Number(row.balance_before), balance, `ledger before ${row.event_id}`);
    assert.equal(Number(row.balance_after), balance+Number(row.delta), `ledger after ${row.event_id}`);
    assert(Number(row.rt)>=0);
    if (row.trial_role==='decision') {
      const options=JSON.parse(row.options_json), chosen=options[Number(row.response)];
      assert.equal(chosen.tag, row.chosen_tag);
      assert.equal(chosen.p, Number(row.chosen_p));
      assert.equal(chosen.win, Number(row.chosen_win));
      assert.equal(chosen.lose, Number(row.chosen_lose));
      assert([chosen.win,chosen.lose].includes(Number(row.delta)));
      if (row.outcome_won===true || row.outcome_won==='true') assert.equal(Number(row.delta), chosen.win);
      if (row.outcome_won===false || row.outcome_won==='false') assert.equal(Number(row.delta), chosen.lose);
    } else expenses+=Number(row.delta);
    balance=Number(row.balance_after);
  }
  assert.equal(expenses,-1450);
  return balance;
}

const port=8127;
const server=spawn(process.execPath,['scripts/serve.mjs'],{env:{...process.env,PORT:String(port)},stdio:'ignore'});
let browser;
try {
  for (let i=0;i<100;i++) { try { const r=await fetch(`http://127.0.0.1:${port}`);if(r.ok)break; } catch{} await new Promise(r=>setTimeout(r,100)); }
  browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH || undefined,headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--single-process']});
  const context=await browser.newContext({acceptDownloads:true,viewport:{width:1200,height:950}});
  // Runtime assets must be local: no third-party requests are permitted.
  await context.route('**/*',route=> new URL(route.request().url()).hostname==='127.0.0.1' ? route.continue():route.abort());
  const page=await context.newPage(); const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await mkdir('artifacts',{recursive:true});
  async function run() {
    await page.goto(`http://127.0.0.1:${port}/?seed=verified-demo`);
    for(let i=0;i<70;i++) {
      if(await page.locator('#download-csv').count())break;
      if(await page.locator('#jspsych-instructions-next').count()) await page.locator('#jspsych-instructions-next').click();
      else if(await page.locator('#bc-continue').count())await page.locator('#bc-continue').click();
      else if(await page.locator('.bc-opt[data-i="0"]').count()) { if(i===2) await page.screenshot({path:'artifacts/demo.png'}); await page.locator('.bc-opt[data-i="0"]').click(); }
      else if(await page.locator('#jspsych-html-button-response-btngroup [data-choice="0"]').count())await page.locator('#jspsych-html-button-response-btngroup [data-choice="0"]').click();
      else await page.locator('button').first().waitFor({state:'visible'});
    }
    if (!(await page.locator('#download-csv').count())) { await page.screenshot({path:'artifacts/failure.png'}); console.log(await page.locator('body').innerText()); console.log('JS errors:',errors); }
    await page.locator('#download-csv').waitFor({timeout:5000});
    const csvEvent=page.waitForEvent('download');await page.locator('#download-csv').click(); const csvDownload=await csvEvent;
    await csvDownload.saveAs('artifacts/demo.csv');
    const jsonEvent=page.waitForEvent('download');await page.locator('#download-json').click();const jsonDownload=await jsonEvent;
    await jsonDownload.saveAs('artifacts/demo.json');
    const csvRows=parseCsv(await readFile('artifacts/demo.csv','utf8'));
    const jsonRows=JSON.parse(await readFile('artifacts/demo.json','utf8'));
    assert.equal(verify(csvRows),verify(jsonRows));
    for(let i=0;i<jsonRows.length;i++) for(const field of ['event_id','trial_role','balance_before','balance_after','delta','seed','plugin_version']) assert.equal(String(jsonRows[i][field]),csvRows[i][field]);
    assert.equal(errors.length,0,errors.join('\n'));
    return jsonRows;
  }
  const first=await run(); const second=await run();
  const stable=rows=>rows.map(r=>[r.event_id,r.response,r.chosen_p,r.delta,r.balance_before,r.balance_after]);
  assert.deepEqual(stable(first),stable(second),'seeded choice/outcome repeatability');
  await page.screenshot({path:'artifacts/export.png'});
  await page.setViewportSize({width:390,height:844});
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'mobile export overflow');
  await writeFile('artifacts/verification.json',JSON.stringify({status:'passed',row_count:21,decisions:15,expenses:6,expense_total:-1450,checks:['real browser downloads','CSV/JSON agreement','row-by-row balance conservation','option reconstruction','seed repeatability ignoring timings/session ID','no external runtime requests','no JavaScript errors']},null,2)+'\n');
  console.log('Browser export checks passed: 21 ledger rows, CSV/JSON agreement, balances, option reconstruction, and seeded replay.');
} finally { if(browser)await browser.close();server.kill(); }
