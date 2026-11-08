#!/usr/bin/env python3
"""Convert a WhatsApp chat export (.txt) to printable HTML (then Print > Save as PDF).
Usage: python3 whatsapp_to_html.py chat.txt > chat.html
Evidence-ready PDF with cover sheet, page numbers and SHA-256 hash: https://martincrescenzo-dotcom.github.io/chatexhibit/"""
import html, re, sys

PATS = [
    re.compile(r'^\u200e?\[(\d{1,2}[./-]\d{1,2}[./-]\d{2,4}),? (\d{1,2}:\d{2}(?::\d{2})?(?:\s?[APap]\.?[Mm]\.?)?)\] ([^:]+?): (.*)$'),
    re.compile(r'^(\d{1,2}[./-]\d{1,2}[./-]\d{2,4}),? (\d{1,2}:\d{2}(?::\d{2})?(?:\s?[APap]\.?[Mm]\.?)?) - ([^:]+?): (.*)$'),
]

def parse(lines):
    msgs = []
    for raw in lines:
        line = raw.rstrip('\n').replace('\u202f', ' ')
        for p in PATS:
            m = p.match(line)
            if m:
                msgs.append(list(m.groups()))
                break
        else:
            if msgs:
                msgs[-1][3] += '\n' + line
    return msgs

def main():
    path = sys.argv[1]
    with open(path, encoding='utf-8-sig', errors='replace') as f:
        msgs = parse(f)
    out = ['<!doctype html><meta charset="utf-8"><title>%s</title>' % html.escape(path),
           '<style>body{font:14px/1.45 system-ui,sans-serif;max-width:800px;margin:2em auto}'
           '.m{margin:.4em 0;padding:.4em .6em;border-left:3px solid #ccc;page-break-inside:avoid}'
           '.h{color:#555;font-size:12px}.t{white-space:pre-wrap}</style>',
           '<h1>%s</h1><p>%d messages</p>' % (html.escape(path), len(msgs))]
    for d, t, who, text in msgs:
        out.append('<div class="m"><div class="h">%s %s, <b>%s</b></div><div class="t">%s</div></div>'
                   % (html.escape(d), html.escape(t), html.escape(who), html.escape(text)))
    sys.stdout.write('\n'.join(out))

if __name__ == '__main__':
    main()
