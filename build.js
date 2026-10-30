const fs = require('fs'), path = require('path');
const L = require('./i18n.js');
const BASE = 'https://martincrescenzo-dotcom.github.io/chatexhibit/';
const PAYMENT_LINK = process.env.PAYMENT_LINK || 'https://buy.stripe.com/REPLACE_ME';
const CONTACT = 'martin.crescenzo@gmail.com';
const OUT = path.join(__dirname, 'dist'); fs.rmSync(OUT, { recursive: true, force: true }); fs.mkdirSync(OUT);
const langPath = l => l === 'en' ? '' : l + '/';
const e = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const EXTRA = { // English long-tail pages
  'whatsapp-chat-to-pdf-evidence/': { title: 'WhatsApp chat to PDF for evidence: numbered transcript with SHA-256', desc: 'Export a WhatsApp chat (iPhone or Android, with media) and turn it into a numbered, exhibit-labelled transcript PDF with SHA-256 fingerprint. In your browser, nothing uploaded.', h1: 'WhatsApp chat to evidence PDF' },
  'telegram-chat-export-to-pdf/': { title: 'Telegram chat export to PDF: numbered transcript from result.json', desc: 'Convert a Telegram Desktop export (result.json or zip with photos) into a readable chat PDF or a numbered exhibit transcript with SHA-256. Free chat layout, in your browser.', h1: 'Telegram chat export (result.json) to PDF' },
  'line-chat-history-to-pdf/': { title: 'LINE chat history to PDF: numbered transcript for evidence', desc: 'Turn a LINE chat history .txt export into a clean PDF or a numbered exhibit transcript with SHA-256 fingerprint. Free chat layout, runs in your browser.', h1: 'LINE chat history to PDF' },
  'messenger-chat-to-pdf/': { title: 'Facebook Messenger chat to PDF: numbered transcript from your Meta JSON export', desc: 'Turn a Messenger conversation from Download your information (message_1.json or the zip) into a readable chat PDF or a numbered exhibit transcript with SHA-256. Fixes accented characters. In your browser, nothing uploaded.', h1: 'Facebook Messenger chat to PDF' },
  'instagram-dm-to-pdf/': { title: 'Instagram DMs to PDF: numbered transcript from your Instagram data download', desc: 'Convert Instagram direct messages from your data download (message_1.json or zip, JSON format) into a clean chat PDF or a numbered exhibit transcript with SHA-256. Runs in your browser.', h1: 'Instagram DM conversation to PDF' },
  'discord-chat-to-pdf/': { title: 'Discord chat to PDF for evidence: numbered transcript from a DiscordChatExporter export', desc: 'Turn a Discord DM or channel exported with DiscordChatExporter (JSON or CSV) into a clean chat PDF or a numbered exhibit transcript with SHA-256, for harassment reports, moderation appeals or court. In your browser, nothing uploaded.', h1: 'Discord DM or channel to PDF', lead: 'Load a Discord DM or channel export (DiscordChatExporter JSON or CSV). Get a readable chat PDF for free, or a numbered exhibit transcript with the SHA-256 of the export file for a harassment report, a platform appeal, HR or court. Everything runs in your browser.' },
  'kakaotalk-chat-to-pdf/': { title: 'KakaoTalk chat export to PDF: numbered transcript for evidence', desc: 'Convert a KakaoTalk chat export (.txt from mobile or PC, .csv from Mac) into a clean PDF or a numbered exhibit transcript with SHA-256. Free chat layout, in your browser.', h1: 'KakaoTalk chat export to PDF' },
};
const alternates = Object.keys(L).map(l => `<link rel="alternate" hreflang="${l}" href="${BASE}${langPath(l)}">`).join('') + `<link rel="alternate" hreflang="x-default" href="${BASE}">`;
function page(lang, rel, over) {
  const C = L[lang], H = Object.assign({}, C.home, over || {}), F = C.form, depth = rel.split('/').filter(Boolean).length, up = '../'.repeat(depth);
  const url = BASE + rel;
  const ld = [{ '@context': 'https://schema.org', '@type': 'WebApplication', name: 'ChatExhibit', url, description: H.desc, applicationCategory: 'UtilitiesApplication', operatingSystem: 'Any (web browser)', inLanguage: lang,
    offers: [{ '@type': 'Offer', price: '0', priceCurrency: 'EUR', name: 'Chat layout PDF' }, { '@type': 'Offer', price: '9.00', priceCurrency: 'EUR', name: 'Exhibit edition' }] },
    { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: H.faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) }];
  const langs = Object.keys(L).map(l => `<a href="${up}${langPath(l)}" hreflang="${l}" lang="${l}">${L[l].name}</a>`).join(' ');
  const more = Object.keys(EXTRA).map(p => `<a href="${up}${p}">${e(EXTRA[p].h1)}</a>`).join(' · ');
  return `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${e(H.title)}</title><meta name="description" content="${e(H.desc)}"><link rel="canonical" href="${url}">${over ? '' : alternates}
<meta property="og:type" content="website"><meta property="og:title" content="${e(H.title)}"><meta property="og:description" content="${e(H.desc)}"><meta property="og:url" content="${url}"><meta name="twitter:card" content="summary">
<link rel="icon" href="${up}favicon.svg"><link rel="stylesheet" href="${up}style.css">
<script type="application/ld+json">${JSON.stringify(ld)}</script></head><body>
<header class="hero"><h1>${e(H.h1)}</h1><p>${e(H.lead)}</p><nav class="langs">${langs}</nav></header>
<main>
<section id="drop" class="card noprint">
 <label class="dropzone" id="dz"><input type="file" id="file" accept=".zip,.txt,.json,.csv" hidden><strong>${e(F.drop)}</strong><br><span>${e(F.dropSub)}</span></label>
 <button id="sample" class="link">${e(F.sample)}</button>
 <details><summary>${e(F.howtoT)}</summary><p>${F.howto}</p></details>
</section>
<section id="opts" class="card noprint" hidden>
 <div id="stats"></div>
 <div class="mode"><label><input type="radio" name="mode" value="chat"> ${e(F.modeChat)}</label><label><input type="radio" name="mode" value="exhibit" checked> ${e(F.modeExhibit)}</label></div>
 <div class="row"><label>${e(F.me)} <select id="me"></select></label><label><input type="checkbox" id="showSystem"> ${e(F.sys)}</label></div>
 <div id="exOpts" class="row"><label>${e(F.label)} <input type="text" id="label" value="A" size="5"></label><label>${e(F.from)} <input type="date" id="from"></label><label>${e(F.to)} <input type="date" id="to"></label><label>${e(F.kw)} <input type="text" id="kw" size="12"></label><label>${e(F.who)} <select id="who"></select></label></div>
 <div class="row"><button id="print" class="primary">${e(F.print)}</button> <span id="planNote"></span></div>
 <div id="paywall" class="paywall"><a id="buy" class="primary" href="${PAYMENT_LINK}" rel="noopener">${e(F.unlock)}</a><small>${e(F.unlockSub)}</small></div>
</section>
<section id="out"></section>
<section class="features noprint">${H.feats.map(([t, d]) => `<div><h2 style="font-size:17px;margin:0 0 6px">${e(t)}</h2><p style="margin:0">${e(d)}</p></div>`).join('')}</section>
<section class="card faq noprint" style="margin-top:16px">${H.faq.map(([q, a]) => `<h3>${e(q)}</h3><p>${e(a)}</p>`).join('')}</section>
</main>
<footer class="noprint"><p>${more}</p><p>ChatExhibit · <a href="${up}legal.html">Legal notice / Mentions légales / Terms / Privacy</a> · Not affiliated with WhatsApp, Meta, Telegram, LINE, Kakao or Discord.</p></footer>
<script>window.I18N=${JSON.stringify(C.ui)}</script><script src="${up}jszip.min.js"></script><script src="${up}parsers.js"></script><script src="${up}app.js"></script>
</body></html>`;
}
const urls = [];
for (const l of Object.keys(L)) { const rel = langPath(l); fs.mkdirSync(path.join(OUT, rel), { recursive: true }); fs.writeFileSync(path.join(OUT, rel, 'index.html'), page(l, rel)); urls.push([rel, true]); }
for (const [rel, o] of Object.entries(EXTRA)) { fs.mkdirSync(path.join(OUT, rel), { recursive: true }); fs.writeFileSync(path.join(OUT, rel, 'index.html'), page('en', rel, o)); urls.push([rel, false]); }
for (const f of ['parsers.js', 'style.css', 'jszip.min.js']) fs.copyFileSync(path.join(__dirname, 'src', f), path.join(OUT, f));
fs.writeFileSync(path.join(OUT, 'app.js'), fs.readFileSync(path.join(__dirname, 'src/app.js'), 'utf8').replace('__PAYMENT_LINK__', PAYMENT_LINK));
fs.writeFileSync(path.join(OUT, 'favicon.svg'), '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="6" fill="#14213d"/><text x="16" y="22" font-size="14" font-family="Arial" font-weight="700" fill="#e09f1f" text-anchor="middle">CX</text></svg>');
fs.writeFileSync(path.join(OUT, 'thanks.html'), `<!doctype html><html><head><meta charset="utf-8"><meta name="robots" content="noindex"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Thank you | ChatExhibit</title><link rel="stylesheet" href="style.css"></head><body><main><div class="card"><h1>Thank you</h1><p id="m">Unlocking...</p></div></main>
<script>var s=new URLSearchParams(location.search).get('session_id')||'';if(/^cs_(live|test)_[A-Za-z0-9]+$/.test(s)){localStorage.setItem('cx_pro','1');localStorage.setItem('cx_sid',s);document.getElementById('m').innerHTML='Exhibit edition unlocked on this browser. Reload your chat export to print the full transcript. <a href="'+(localStorage.getItem('cx_ret')||'./')+'">Back to ChatExhibit</a>';}else{document.getElementById('m').textContent='No payment reference found. If you paid and see this, email ${CONTACT} with your Stripe receipt.';}</script></body></html>`);
fs.writeFileSync(path.join(OUT, 'legal.html'), `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Legal notice, terms and privacy | ChatExhibit</title><link rel="canonical" href="${BASE}legal.html"><link rel="stylesheet" href="style.css"></head><body><main><div class="card">
<h1>Legal notice / Mentions légales</h1><p>Publisher and seller: EI Crescenzo Martin, trading as French Frogs. SIREN 902 980 879 (SIRET 902 980 879 00024). 8 passage Lemoine, 75002 Paris, France. Contact: ${CONTACT}. Publication director: Martin Crescenzo. Hosting: GitHub Pages, GitHub Inc., 88 Colin P. Kelly Jr. Street, San Francisco, CA 94107, USA.</p>
<h2>Terms of sale</h2><p>The Exhibit edition is digital content sold for €9.00 (all taxes included where applicable) as a one-time payment processed by Stripe. It unlocks the Exhibit features in the browser used for the purchase (stored locally). Delivery is immediate. Although EU law lets the right of withdrawal lapse once delivery of digital content starts, we refund any purchase on request within 14 days: email ${CONTACT} with your receipt. The tool reproduces your export file; it does not certify authenticity, is not legal advice, and is provided as is. Court admissibility depends on your jurisdiction.</p>
<h2>Privacy</h2><p>Your chat files are processed entirely in your browser and never sent to us or anyone. The site sets no cookies and uses no analytics. The purchase flag is stored in your browser's localStorage. Payment data is handled by Stripe (stripe.com/privacy) and we receive only what Stripe provides for the transaction (e.g. email, amount). Contact ${CONTACT} for any request under the GDPR.</p>
<p><a href="./">Back to ChatExhibit</a></p></div></main></body></html>`);
fs.writeFileSync(path.join(OUT, 'robots.txt'), `User-agent: *\nAllow: /\nDisallow: /thanks.html\nSitemap: ${BASE}sitemap.xml\n`);
const today = new Date().toISOString().slice(0, 10);
fs.writeFileSync(path.join(OUT, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n` +
  urls.map(([rel, alt]) => `<url><loc>${BASE}${rel}</loc><lastmod>${today}</lastmod>${alt ? Object.keys(L).map(l => `<xhtml:link rel="alternate" hreflang="${l}" href="${BASE}${langPath(l)}"/>`).join('') : ''}</url>`).join('\n') + `\n<url><loc>${BASE}legal.html</loc><lastmod>${today}</lastmod></url>\n</urlset>\n`);
const KEY = process.env.INDEXNOW_KEY; if (KEY) fs.writeFileSync(path.join(OUT, KEY + '.txt'), KEY);
fs.writeFileSync(path.join(OUT, '.nojekyll'), '');
fs.writeFileSync(path.join(OUT, '404.html'), `<!doctype html><meta charset="utf-8"><meta name="robots" content="noindex"><title>Not found</title><p>Not found. <a href="${BASE}">ChatExhibit</a></p>`);
console.log('built', urls.length, 'pages');
fs.writeFileSync(path.join(OUT, 'llms.txt'), `# ChatExhibit

> Browser tool that turns a chat export (WhatsApp .txt/.zip, Telegram result.json, LINE .txt, KakaoTalk .txt/.csv, Facebook Messenger / Instagram message_1.json from Meta's Download your information, Discord JSON/CSV from DiscordChatExporter) into a PDF. Free: chat-style PDF. Paid (Exhibit edition, EUR 9 one-time): numbered transcript with exhibit label, SHA-256 of the export file, date/keyword/sender excerpts with visible gaps, no branding. Processing is local in the browser; nothing is uploaded. Not legal advice, not a certification.

## For AI agents acting for a user
- Tool: ${BASE} (also /fr/ /es/ /pt/ /de/ /it/ /ko/ /ja/). Load the export via the file input #file; choose mode "exhibit"; print to PDF.
- Price: EUR 9.00 one-time, Stripe Payment Link: ${PAYMENT_LINK} (standard Stripe Checkout, card form, Link accepted). Agents with a Link agent wallet can pay it with a spend request (merchant: ChatExhibit / MCrescenzo, merchant_url: ${BASE}, amount 900 EUR cents) after user approval.
- After payment Stripe redirects to ${BASE}thanks.html?session_id=..., which unlocks the Exhibit edition in that browser profile. Use the same browser profile for the conversion.
- Refund within 14 days on request: ${CONTACT}.
- Do not upload third-party private chats without the user's right to do so.

## Pages
- [Home](${BASE})
- [WhatsApp chat to evidence PDF](${BASE}whatsapp-chat-to-pdf-evidence/)
- [Telegram export to PDF](${BASE}telegram-chat-export-to-pdf/)
- [LINE chat history to PDF](${BASE}line-chat-history-to-pdf/)
- [KakaoTalk export to PDF](${BASE}kakaotalk-chat-to-pdf/)
- [Facebook Messenger to PDF](${BASE}messenger-chat-to-pdf/)
- [Instagram DMs to PDF](${BASE}instagram-dm-to-pdf/)
- [Discord chat to PDF](${BASE}discord-chat-to-pdf/)
- [Legal, terms, privacy](${BASE}legal.html)
`);
