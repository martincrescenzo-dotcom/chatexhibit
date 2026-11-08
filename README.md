# ChatExhibit: chat export to evidence PDF (WhatsApp, Telegram, LINE, KakaoTalk, Slack, …)

**Live: https://martincrescenzo-dotcom.github.io/chatexhibit/**

Turn a chat export into a numbered, exhibit-labelled transcript PDF with the SHA-256 fingerprint of the original export file and clearly marked excerpt gaps. Runs 100% in the browser: no upload, no account, no server.

- WhatsApp chat to PDF (iPhone/Android .txt or .zip with photos)
- Telegram chat export (result.json) to PDF
- LINE chat history (.txt, Japanese/English) to PDF
- KakaoTalk chat export (.txt mobile/PC, .csv Mac) to PDF
- Facebook Messenger / Instagram DMs (Meta JSON export) to PDF
- Discord DMs or channels (DiscordChatExporter JSON/CSV) to PDF
- Google Chat (Google Takeout messages.json) to PDF
- Slack workspace / channel export (JSON or zip) to PDF
- French evidence pages: [WhatsApp PDF preuve](https://martincrescenzo-dotcom.github.io/chatexhibit/whatsapp-conversation-pdf-preuve/), [exporter WhatsApp PDF](https://martincrescenzo-dotcom.github.io/chatexhibit/exporter-conversation-whatsapp-pdf/), [Telegram PDF preuve](https://martincrescenzo-dotcom.github.io/chatexhibit/telegram-export-pdf-preuve/)
- Free: chat-style PDF, unlimited. Exhibit edition (numbered transcript, date/keyword/sender excerpts, no branding): €9 one-time.

Languages: [English](https://martincrescenzo-dotcom.github.io/chatexhibit/) · [Français](https://martincrescenzo-dotcom.github.io/chatexhibit/fr/) · [Español](https://martincrescenzo-dotcom.github.io/chatexhibit/es/) · [Português](https://martincrescenzo-dotcom.github.io/chatexhibit/pt/) · [Deutsch](https://martincrescenzo-dotcom.github.io/chatexhibit/de/) · [Italiano](https://martincrescenzo-dotcom.github.io/chatexhibit/it/) · [한국어 카카오톡 대화 PDF](https://martincrescenzo-dotcom.github.io/chatexhibit/ko/) · [日本語 LINEトーク履歴 PDF](https://martincrescenzo-dotcom.github.io/chatexhibit/ja/)

Not legal advice and not a certification of authenticity. Not affiliated with WhatsApp, Meta, Telegram, LINE, Kakao, Discord, Google or Slack.

Source layout: `src/` (parsers, app, styles), `i18n.js`, `build.js` (generates `docs/`), `test/` (`node test/test.js`). Publisher: EI Crescenzo Martin (French Frogs), Paris.

## Free offline script

[`tools/whatsapp_to_html.py`](tools/) converts a WhatsApp export to printable HTML with Python only, no upload.
