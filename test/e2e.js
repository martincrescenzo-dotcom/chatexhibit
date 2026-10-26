const p=require('/workspace/e2e/node_modules/puppeteer-core');
(async()=>{const b=await p.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox']});
const B='http://localhost:8766/chatexhibit/';
for (const mode of ['free','pro']){
 const pg=await b.newPage(); const errs=[]; pg.on('pageerror',e=>errs.push(e.message)); pg.on('dialog',d=>{errs.push('dialog:'+d.message());d.dismiss()});
 if(mode==='pro'){await pg.goto(B+'thanks.html?session_id=cs_test_abc123');console.log(await pg.$eval('#m',e=>e.textContent));}
 await pg.goto(B+'fr/'); if(mode==='free') await pg.evaluate(()=>localStorage.clear()); await pg.reload();
 for (const f of ['long_fr.txt','sample_ios.zip','line_ja.txt','kakao_pc.txt','telegram.json']) {
  await (await pg.$('#file')).uploadFile(__dirname+'/'+f); await new Promise(r=>setTimeout(r,700));
  const r=await pg.evaluate(()=>({stats:document.querySelector('#stats').textContent,rows:document.querySelectorAll('#out .tx tbody tr').length,gap:document.querySelectorAll('.gap').length,sha:document.querySelector('.meta .mono').textContent.slice(0,12),locked:!!document.querySelector('.locked'),paywall:!document.querySelector('#paywall').hidden}));
  console.log(mode,f,JSON.stringify(r));
 }
 await (await pg.$('#file')).uploadFile(__dirname+'/long_fr.txt'); await new Promise(r=>setTimeout(r,500));
 await pg.type('#kw','deposit'); await new Promise(r=>setTimeout(r,300));
 console.log(mode,'kw', await pg.$$eval('#out .tx tbody tr',t=>t.map(x=>x.textContent.slice(0,90))));
 await pg.pdf({path:`/tmp/cx_${mode}.pdf`,format:'A4'});
 await pg.click('input[value=chat]'); console.log(mode,'chat msgs',await pg.$$eval('#out .msg',x=>x.length));
 console.log(mode,'errors',errs); await pg.close();}
await b.close();})();
