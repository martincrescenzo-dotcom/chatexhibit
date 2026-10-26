// ChatExhibit app. Everything runs locally in the browser.
const CONFIG = { PAYMENT_LINK: '__PAYMENT_LINK__', PREVIEW_ROWS: 15, PRICE: '€9' };
const T = window.I18N; const LANG = document.documentElement.lang;
const $ = s => document.querySelector(s);
let chat = null, media = new Map(), file = { name: '', size: 0, sha: '' };
const isPro = () => localStorage.getItem('cx_pro') === '1';
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const tf = (k, v) => T[k].replace(/\{(\w+)\}/g, (_, n) => v[n]);
const dfmt = d => d.toLocaleDateString(LANG, { year: 'numeric', month: '2-digit', day: '2-digit' });
const tfmt = d => d.toLocaleTimeString(LANG, { hour: '2-digit', minute: '2-digit' });
async function sha256(buf) { const h = await crypto.subtle.digest('SHA-256', buf); return [...new Uint8Array(h)].map(b => b.toString(16).padStart(2, '0')).join(''); }

async function loadFile(f) {
  media.clear();
  const buf = await f.arrayBuffer();
  file = { name: f.name, size: f.size, sha: await sha256(buf) };
  let text, name = f.name;
  if (/\.zip$/i.test(f.name)) {
    const zip = await JSZip.loadAsync(buf);
    const files = Object.values(zip.files).filter(z => !z.dir);
    const main = files.find(z => /result\.json$/i.test(z.name)) || files.find(z => /\.(txt|csv)$/i.test(z.name));
    if (!main) return alert(T.notChat);
    text = await main.async('string'); name = main.name;
    for (const z of files) if (/\.(jpe?g|png|gif|webp)$/i.test(z.name)) {
      const b = await z.async('blob'); const u = URL.createObjectURL(b);
      media.set(z.name.split('/').pop(), u); media.set(z.name.replace(/^[^/]*\//, ''), u);
    }
  } else text = new TextDecoder().decode(buf);
  setChat(text, name);
}
function setChat(text, name) {
  try { chat = ChatParsers.detect(text, name); } catch (e) { chat = null; }
  if (!chat || !chat.messages.length) return alert(T.notChat);
  $('#opts').hidden = false;
  $('#me').innerHTML = chat.senders.map(s => `<option>${esc(s)}</option>`).join('');
  $('#me').selectedIndex = Math.max(0, chat.senders.length - 1);
  $('#who').innerHTML = `<option value="">${esc(T.all)}</option>` + chat.senders.map(s => `<option>${esc(s)}</option>`).join('');
  $('#stats').textContent = tf('stats', { src: chat.source, n: chat.messages.length, p: chat.senders.length, m: new Set(media.values()).size });
  render();
  $('#opts').scrollIntoView({ behavior: 'smooth' });
}
function attHtml(m, small) {
  let b = '';
  if (m.attachment) { const u = media.get(m.attachment) || media.get(m.attachment.split('/').pop());
    b += u ? `<img src="${u}" alt="" class="${small ? 'sm' : ''}">` : `<div class="att">[${esc(T.attachment)}: ${esc(m.attachment)}]</div>`; }
  if (m.omitted) b += `<div class="att">[${esc(T.mediaOmitted)}]</div>`;
  return b;
}
function selection() {
  const from = $('#from').value ? new Date($('#from').value + 'T00:00') : null, to = $('#to').value ? new Date($('#to').value + 'T23:59:59') : null;
  const kw = $('#kw').value.trim().toLowerCase(), who = $('#who').value, sys = $('#showSystem').checked;
  return chat.messages.map((m, i) => ({ m, n: i + 1 })).filter(({ m }) =>
    (sys || !m.system) && (!from || m.date >= from) && (!to || m.date <= to) && (!who || m.sender === who) && (!kw || (m.text + ' ' + (m.attachment || '')).toLowerCase().includes(kw)));
}
function render() {
  if (!chat) return;
  const pro = isPro(), mode = document.querySelector('input[name=mode]:checked').value;
  document.body.classList.toggle('pro', pro);
  $('#paywall').hidden = pro || mode !== 'exhibit'; $('#planNote').textContent = pro ? T.unlocked : '';
  $('#exOpts').hidden = mode !== 'exhibit';
  $('#out').innerHTML = mode === 'exhibit' ? renderExhibit(pro) : renderChat();
}
function renderChat() {
  const me = $('#me').value, sys = $('#showSystem').checked;
  const msgs = chat.messages.filter(m => sys || !m.system);
  const first = chat.messages[0].date, last = chat.messages[chat.messages.length - 1].date;
  let h = `<div class="cover"><h2>${esc(chat.senders.join(' & ').slice(0, 140))}</h2><p>${chat.source} · ${dfmt(first)} – ${dfmt(last)} · ${msgs.length} ${esc(T.messages)}</p></div>`;
  let lastDay = '';
  for (const m of msgs) {
    const day = m.date.toDateString();
    if (day !== lastDay) { h += `<div class="day"><span>${m.date.toLocaleDateString(LANG, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span></div>`; lastDay = day; }
    if (m.system) { h += `<div class="sys">${esc(m.text)}</div>`; continue; }
    h += `<div class="msg ${m.sender === me ? 'me' : ''}">${m.sender === me ? '' : `<div class="who">${esc(m.sender)}</div>`}${attHtml(m)}${esc(m.text)}<time>${tfmt(m.date)}</time></div>`;
  }
  if (!isPro()) h += `<div class="wm">${esc(T.brand)}</div>`;
  return h;
}
function renderExhibit(pro) {
  const label = ($('#label').value.trim() || 'A').replace(/[^\w\-.]/g, '').slice(0, 12) || 'A';
  const sel = selection(); const total = chat.messages.length;
  const first = sel.length ? sel[0].m.date : chat.messages[0].date, last = sel.length ? sel[sel.length - 1].m.date : chat.messages[total - 1].date;
  const counts = new Map(); sel.forEach(({ m }) => m.sender && counts.set(m.sender, (counts.get(m.sender) || 0) + 1));
  const ref = n => `${label}-${String(n).padStart(4, '0')}`;
  let h = `<div class="excover"><div class="exlabel">${esc(T.exhibit)} ${esc(label)}</div><h2>${esc(T.transcriptOf)} ${esc(chat.source)}</h2><table class="meta">
   <tr><th>${esc(T.participants)}</th><td>${[...counts].map(([s, c]) => `${esc(s)} (${c})`).join('<br>') || '-'}</td></tr>
   <tr><th>${esc(T.period)}</th><td>${dfmt(first)} ${tfmt(first)} – ${dfmt(last)} ${tfmt(last)}</td></tr>
   <tr><th>${esc(T.messages)}</th><td>${tf('selOf', { n: sel.length, t: total })}${sel.length ? ` · ${ref(sel[0].n)} – ${ref(sel[sel.length - 1].n)}` : ''}</td></tr>
   <tr><th>${esc(T.sourceFile)}</th><td>${esc(file.name || 'sample')} (${file.size.toLocaleString(LANG)} bytes)</td></tr>
   <tr><th>SHA-256</th><td class="mono">${file.sha || '-'}</td></tr>
   <tr><th>${esc(T.generated)}</th><td>${new Date().toLocaleString(LANG)}</td></tr></table>
   <p class="note">${esc(T.coverNote)}</p></div>
  <table class="tx"><thead><tr><th>${esc(T.ref)}</th><th>${esc(T.date)}</th><th>${esc(T.time)}</th><th>${esc(T.sender)}</th><th>${esc(T.message)}</th></tr></thead><tbody>`;
  const rows = pro ? sel : sel.slice(0, CONFIG.PREVIEW_ROWS);
  let prev = 0;
  for (const { m, n } of rows) {
    if (n - prev > 1 && prev !== 0 || (prev === 0 && n > 1)) h += `<tr class="gap"><td colspan="5">${esc(tf('gap', { a: ref(prev + 1), b: ref(n - 1), n: n - prev - 1 }))}</td></tr>`;
    prev = n;
    h += `<tr class="${m.system ? 'sysrow' : ''}"><td class="mono">${ref(n)}</td><td>${dfmt(m.date)}</td><td>${m.date.toLocaleTimeString(LANG, { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</td><td>${esc(m.sender || T.system)}</td><td class="body">${attHtml(m, true)}${esc(m.text)}</td></tr>`;
  }
  if (pro && prev && prev < total) h += `<tr class="gap"><td colspan="5">${esc(tf('gap', { a: ref(prev + 1), b: ref(total), n: total - prev }))}</td></tr>`;
  h += `</tbody></table>`;
  if (!pro && sel.length > rows.length) h += `<div class="locked">${esc(tf('more', { n: sel.length - rows.length }))}</div>`;
  if (!pro) h += `<div class="wm">${esc(T.brand)}</div>`;
  return h;
}
const SAMPLE = `15/03/2024 09:41 - Alex: Hi, can you confirm the deposit of 800 EUR was received?\n15/03/2024 09:52 - Sam: Yes, received yesterday.\n18/03/2024 18:02 - Alex: The heater is still broken, see photo\n18/03/2024 18:02 - Alex: <Media omitted>\n19/03/2024 08:15 - Sam: I will send someone on Friday.\n22/03/2024 19:40 - Alex: Nobody came today.\n25/03/2024 10:03 - Sam: Sorry, next week then.`;
(() => {
  $('#file').onchange = e => e.target.files[0] && loadFile(e.target.files[0]);
  const dz = $('#dz');
  dz.ondragover = e => { e.preventDefault(); dz.classList.add('over'); };
  dz.ondragleave = () => dz.classList.remove('over');
  dz.ondrop = e => { e.preventDefault(); dz.classList.remove('over'); e.dataTransfer.files[0] && loadFile(e.dataTransfer.files[0]); };
  $('#sample').onclick = () => { file = { name: 'sample.txt', size: SAMPLE.length, sha: '' }; sha256(new TextEncoder().encode(SAMPLE)).then(s => { file.sha = s; setChat(SAMPLE, 'sample.txt'); }); };
  ['#me', '#showSystem', '#from', '#to', '#kw', '#who', '#label'].forEach(s => { $(s).oninput = render; $(s).onchange = render; });
  document.querySelectorAll('input[name=mode]').forEach(r => r.onchange = render);
  $('#buy').href = CONFIG.PAYMENT_LINK;
  $('#buy').onclick = () => localStorage.setItem('cx_ret', location.pathname);
  $('#print').onclick = () => { if (!isPro() && document.querySelector('input[name=mode]:checked').value === 'exhibit') { $('#paywall').scrollIntoView({ behavior: 'smooth' }); } window.print(); };
  if (isPro()) $('#planNote').textContent = T.unlocked;
})();
