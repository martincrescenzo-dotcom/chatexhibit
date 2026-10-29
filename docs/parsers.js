// Chat export parsers: WhatsApp, Telegram (JSON), Messenger/Instagram (JSON), LINE (txt), KakaoTalk (txt/csv). Pure, no DOM.
(function (root) {
  const BIDI = /[\u200e\u200f\u202a-\u202e\u2066-\u2069\ufeff]/g;
  const norm = t => t.replace(/\r\n?/g, '\n').replace(BIDI, '');
  const msg = (date, sender, text, extra) => Object.assign({ date, sender, text: text || '', attachment: null, omitted: false, system: !sender }, extra || {});
  function finish(messages, source) {
    messages = messages.filter(m => m.date && !isNaN(m.date));
    const counts = new Map();
    for (const m of messages) if (m.sender) counts.set(m.sender, (counts.get(m.sender) || 0) + 1);
    return { source, messages, senders: [...counts.keys()], counts };
  }
  const h24 = (h, ap) => { if (!ap) return h; const pm = /p|오후|午後|下午/i.test(ap); if (pm && h < 12) return h + 12; if (!pm && h === 12) return 0; return h; };

  // ---------- WhatsApp ----------
  const WA_HEAD = /^\[?(\d{1,4})[\/.\-](\d{1,2})[\/.\-](\d{1,4}),?\s+(\d{1,2})[:.](\d{2})(?:[:.](\d{2}))?\s*([AaPp]\.?\s?[Mm]\.?)?\]?\s*(?:[-–]\s)?\s*(.*)$/;
  const WA_ATTACH = [
    /<(?:attached|anexado|pièce jointe|adjunto|allegato|Anhang|anexo|joint)\s*:\s*([^>]+)>/i,
    /^(\S+\.\w{2,5})\s+\((?:file attached|fichier joint|archivo adjunto|file allegato|Datei angehängt|arquivo anexado|ficheiro anexado|bestand bijgevoegd)\)/i,
  ];
  const WA_OMIT = /^<?(Media omitted|Médias omis|Multimedia omitido|Media omessi|Medien ausgeschlossen|Mídia oculta|image omitted|video omitted|audio omitted|sticker omitted|GIF omitted|document omitted|imagem ocultada|image absente|vidéo absente|imagen omitida)>?$/i;
  function parseWhatsApp(text) {
    const raw = [];
    for (const line of norm(text).split('\n')) {
      const m = line.match(WA_HEAD);
      if (m) raw.push({ a: +m[1], b: +m[2], c: +m[3], h: +m[4], mi: +m[5], s: +(m[6] || 0), ap: m[7], rest: m[8] });
      else if (raw.length) raw[raw.length - 1].rest += '\n' + line;
    }
    let order = 'DMY';
    if (raw.some(r => r.a > 31)) order = 'YMD'; else if (raw.some(r => r.b > 12)) order = 'MDY'; else if (raw.some(r => r.a > 12)) order = 'DMY';
    else if (raw.some(r => r.ap)) order = 'MDY';
    const out = [];
    for (const r of raw) {
      let d, mo, y;
      if (order === 'YMD') { y = r.a; mo = r.b; d = r.c; } else if (order === 'MDY') { mo = r.a; d = r.b; y = r.c; } else { d = r.a; mo = r.b; y = r.c; }
      if (y < 100) y += 2000;
      const date = new Date(y, mo - 1, d, h24(r.h, r.ap), r.mi, r.s);
      let sender = null, body = r.rest;
      const sm = body.match(/^([^:\n]{1,60}?):\s([\s\S]*)$/) || body.match(/^([^:\n]{1,60}?):$/);
      if (sm) { sender = sm[1].trim(); body = sm[2] || ''; }
      const m = msg(date, sender, body);
      const bc = body.trim();
      for (const re of WA_ATTACH) { const am = bc.match(re); if (am) { m.attachment = am[1].trim(); m.text = bc.replace(am[0], '').trim(); break; } }
      if (WA_OMIT.test(bc)) { m.omitted = true; m.text = ''; }
      out.push(m);
    }
    return finish(out, 'WhatsApp');
  }

  // ---------- Telegram JSON (Telegram Desktop export) ----------
  function parseTelegram(json) {
    const data = typeof json === 'string' ? JSON.parse(json) : json;
    const list = data.messages || (data.chats && data.chats.list && data.chats.list[0] && data.chats.list[0].messages) || [];
    const out = [];
    for (const t of list) {
      const text = Array.isArray(t.text) ? t.text.map(p => typeof p === 'string' ? p : p.text).join('') : (t.text || '');
      const date = t.date_unixtime ? new Date(+t.date_unixtime * 1000) : new Date(t.date);
      if (t.type === 'service') { out.push(msg(date, null, [t.actor, t.action].filter(Boolean).join(' · ') + (text ? ': ' + text : ''))); continue; }
      const m = msg(date, t.from || t.actor || 'Unknown', text);
      const att = t.photo || t.file;
      if (att) { if (/not included|File not included/i.test(att)) m.omitted = true; else m.attachment = att; }
      if (t.sticker_emoji && !text) m.text = t.sticker_emoji;
      out.push(m);
    }
    return finish(out, 'Telegram');
  }

  // ---------- LINE ----------
  const LINE_DATE = /^(\d{4})[\/.\-](\d{1,2})[\/.\-](\d{1,2})(?:\s*\(?[^\t\d]{0,12}\)?)?\s*$/;
  const LINE_MSG = /^(午前|午後|AM|PM)?\s?(\d{1,2}):(\d{2})\s?(AM|PM)?\t([^\t]*)(?:\t([\s\S]*))?$/i;
  function parseLine(text) {
    const out = []; let day = null;
    for (const line of norm(text).split('\n')) {
      const dm = line.match(LINE_DATE);
      if (dm) { day = [+dm[1], +dm[2], +dm[3]]; continue; }
      const mm = day && line.match(LINE_MSG);
      if (mm) {
        const date = new Date(day[0], day[1] - 1, day[2], h24(+mm[2], mm[1] || mm[4]), +mm[3]);
        let body = mm[6], sender = mm[5];
        if (body === undefined) { body = sender; sender = null; }
        const m = msg(date, sender || null, body.replace(/^"([\s\S]*)$/, '$1'));
        if (/^\[(Photo|Sticker|Video|File|Voice message|写真|スタンプ|動画|ファイル|ボイスメッセージ|Album|アルバム)\]$/i.test(m.text)) { m.omitted = true; m.attachment = null; m.text = m.text; }
        out.push(m);
      } else if (out.length && day && !/^\[LINE\]|^Saved on|^保存日時/.test(line)) {
        const last = out[out.length - 1]; last.text += '\n' + line.replace(/"$/, '');
      }
    }
    out.forEach(m => m.text = m.text.replace(/"\s*$/, m.text.startsWith('"') ? '' : '"').replace(/\n+$/, ''));
    return finish(out, 'LINE');
  }

  // ---------- KakaoTalk ----------
  // Android/iOS: "2024년 1월 15일 오후 3:20, 홍길동 : 안녕"  or "2024. 1. 15. 오후 3:20, 홍길동 : 안녕"  or EN "January 15, 2024, 3:20 PM, Hong : Hi" / "2024-01-15 15:20, Hong : Hi"
  // PC: "--------------- 2024년 1월 15일 월요일 ---------------" + "[홍길동] [오후 3:20] 안녕"
  const MONTHS = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 };
  const K_MOB_KO = /^(\d{4})(?:년|\.)\s*(\d{1,2})(?:월|\.)\s*(\d{1,2})(?:일|\.)\s*(오전|오후)?\s*(\d{1,2}):(\d{2})(?:\s*(AM|PM))?,\s(.*)$/i;
  const K_MOB_EN = /^([A-Za-z]{3})[a-z]*\.? (\d{1,2}), (\d{4}),? (?:at )?(\d{1,2}):(\d{2})\s*(AM|PM)?,\s(.*)$/i;
  const K_MOB_ISO = /^(\d{4})-(\d{2})-(\d{2}) (\d{1,2}):(\d{2})(?::\d{2})?,\s(.*)$/;
  const K_PC_DAY = /^-{3,}\s*(\d{4})년\s*(\d{1,2})월\s*(\d{1,2})일.*-{3,}\s*$|^-{3,}\s*[A-Za-z]+,\s*([A-Za-z]+)\s+(\d{1,2}),\s*(\d{4})\s*-{3,}\s*$/;
  const K_PC_MSG = /^\[([^\]]+)\] \[(오전|오후|AM|PM)?\s?(\d{1,2}):(\d{2})\s?(AM|PM)?\] ([\s\S]*)$/i;
  function kSplit(rest) { const i = rest.indexOf(' : '); return i > 0 && i < 80 ? [rest.slice(0, i).trim(), rest.slice(i + 3)] : [null, rest]; }
  function parseKakao(text) {
    text = norm(text);
    if (/^"?Date"?,"?User"?,"?Message"?/i.test(text)) return parseKakaoCsv(text);
    const out = []; let day = null;
    for (const line of text.split('\n')) {
      let m;
      if ((m = line.match(K_PC_DAY))) { day = m[1] ? [+m[1], +m[2], +m[3]] : [+m[6], MONTHS[m[4].slice(0, 3).toLowerCase()], +m[5]]; continue; }
      if (day && (m = line.match(K_PC_MSG))) { out.push(msg(new Date(day[0], day[1] - 1, day[2], h24(+m[3], m[2] || m[5]), +m[4]), m[1], m[6])); continue; }
      if ((m = line.match(K_MOB_KO))) { const [s, b] = kSplit(m[8]); out.push(msg(new Date(+m[1], +m[2] - 1, +m[3], h24(+m[5], m[4] || m[7]), +m[6]), s, b)); continue; }
      if ((m = line.match(K_MOB_EN)) && MONTHS[m[1].toLowerCase()]) { const [s, b] = kSplit(m[7]); out.push(msg(new Date(+m[3], MONTHS[m[1].toLowerCase()] - 1, +m[2], h24(+m[4], m[6]), +m[5]), s, b)); continue; }
      if ((m = line.match(K_MOB_ISO))) { const [s, b] = kSplit(m[6]); out.push(msg(new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]), s, b)); continue; }
      if (/^(\d{4})(년|\.)\s*\d{1,2}(월|\.)\s*\d{1,2}(일|\.)?\s*(오전|오후)?\s*\d{1,2}:\d{2}\s*$/.test(line)) continue; // date-only separator
      if (out.length && !/님과 카카오톡 대화|^저장한 날짜|^Date Saved|^Talk_|KakaoTalk Chats with/.test(line)) out[out.length - 1].text += '\n' + line;
    }
    out.forEach(m => { m.text = m.text.replace(/\n+$/, ''); if (/^(사진|동영상|이모티콘|Photo|Video|Emoticon|파일: .*|File: .*)$/.test(m.text)) m.omitted = true; });
    return finish(out, 'KakaoTalk');
  }
  function csvRows(t) {
    const rows = []; let row = [], f = '', q = false;
    for (let i = 0; i < t.length; i++) { const c = t[i];
      if (q) { if (c === '"') { if (t[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += c; }
      else if (c === '"') q = true; else if (c === ',') { row.push(f); f = ''; } else if (c === '\n') { row.push(f); rows.push(row); row = []; f = ''; } else f += c; }
    if (f || row.length) { row.push(f); rows.push(row); }
    return rows;
  }
  function parseKakaoCsv(text) {
    const out = [];
    for (const r of csvRows(text).slice(1)) { if (r.length < 3) continue; const d = new Date(r[0].replace(' ', 'T')); out.push(msg(d, r[1] || null, r.slice(2).join(','))); }
    return finish(out, 'KakaoTalk');
  }

  // ---------- Facebook Messenger / Instagram (Meta "Download your information" JSON) ----------
  const fixMeta = t => { if (typeof t !== 'string') return ''; try { return /[\u00c0-\u00ff][\u0080-\u00bf]/.test(t) ? decodeURIComponent(escape(t)) : t; } catch (e) { return t; } };
  function parseMeta(data) {
    const list = (data.messages || []).slice();
    const out = [];
    for (const t of list) {
      const ts = t.timestamp_ms || t.timestamp; const date = new Date(+ts);
      const sender = fixMeta(t.sender_name || t.senderName) || 'Unknown';
      let text = fixMeta(t.content !== undefined ? t.content : t.text);
      const m = msg(date, sender, text);
      const media = [].concat(t.photos || [], t.videos || [], t.audio_files || [], t.files || [], t.gifs || [], t.media || [], t.sticker ? [t.sticker] : []);
      if (media.length) { const u = media[0].uri || media[0].url; if (u) m.attachment = u; else m.omitted = true; }
      if (t.share && t.share.link && !text.includes(t.share.link)) m.text = (text ? text + '\n' : '') + t.share.link;
      if (t.is_unsent || t.isUnsent) { m.system = true; m.text = m.text || '(message unsent)'; }
      out.push(m);
    }
    out.sort((a, b) => a.date - b.date);
    const src = /instagram/i.test(data.thread_path || '') ? 'Instagram' : 'Messenger';
    return finish(out, data.__src || src);
  }
  const isMeta = d => d && Array.isArray(d.messages) && d.messages.length && (d.messages[0].sender_name !== undefined || d.messages[0].senderName !== undefined) && (d.messages[0].timestamp_ms !== undefined || d.messages[0].timestamp !== undefined);

  function detect(text, name) {
    name = name || '';
    const t = norm(text).trimStart();
    if (/\.json$/i.test(name) || t.startsWith('{')) { const d = JSON.parse(t); if (isMeta(d)) { if (/instagram/i.test(name)) d.__src = 'Instagram'; return parseMeta(d); } return parseTelegram(d); }
    const head = t.slice(0, 4000);
    if (/^\[LINE\]|^\uFEFF?\[LINE\]/m.test(head) || /^\d{1,2}:\d{2}\t/m.test(head)) return parseLine(t);
    if (/카카오톡 대화|KakaoTalk|^"?Date"?,"?User"?,"?Message"?|^-{5,} .*(\d{4}년|, \d{4}) .*-{5,}$|^\d{4}년 \d{1,2}월 \d{1,2}일 (오전|오후)/m.test(head)) return parseKakao(t);
    const wa = parseWhatsApp(t);
    if (wa.messages.length) return wa;
    for (const f of [parseKakao, parseLine]) { const r = f(t); if (r.messages.length) return r; }
    return wa;
  }
  const api = { detect, parseMeta, parseWhatsApp, parseTelegram, parseLine, parseKakao };
  if (typeof module !== 'undefined') module.exports = api; else root.ChatParsers = api;
})(this);
