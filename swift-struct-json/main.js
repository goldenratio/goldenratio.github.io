import { SwiftParser } from './swift_parser.js';

const $ = id => document.getElementById(id);

const sample = `fooo main webview navigationUpdate NavigationUpdate(value: PortalBridge.NavigationUpdate.Value(from: PortalBridge.NavigationEvent(page: Optional("sportsbook"), hash: Optional(""), params: [:], historyState: Optional(PortalBridge.NavigationEvent.HistoryState.push)), to: PortalBridge.NavigationEvent(page: Optional("sportsbook"), hash: Optional(""), params: [:], historyState: Optional(PortalBridge.NavigationEvent.HistoryState.replace))))
foo AppEvent({"type":"cashierMenu"}) // we click cashier button
fooo MFE navigationUpdate NavigationUpdate(value: PortalBridge.NavigationUpdate.Value(from: PortalBridge.NavigationEvent(page: Optional("sportsbook"), hash: Optional(""), params: ["module": "rsi-cashier", "modal": "true"], historyState: Optional(PortalBridge.NavigationEvent.HistoryState.push)), to: PortalBridge.NavigationEvent(page: Optional("sportsbook"), hash: Optional(""), params: ["pmCode": "CC", "module": "rsi-cashier", "modal": "true"], historyState: Optional(PortalBridge.NavigationEvent.HistoryState.push))))`;

function findPayload(line) {
  let inString = false,
    esc = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inString) {
      if (c === '"' && !esc) inString = false;
      if (c === '\\' && !esc) esc = true;
      else esc = false;
      continue;
    }
    if (c === '"') {
      inString = true;
      continue;
    }
    if (c === '{') return {
      start: i,
      wrapped: false
    };
    if (/[A-Za-z_]/.test(c) && (!i || !/[\w.]/.test(line[i - 1]))) {
      const m = /^[A-Za-z_][\w.]*(?=\()/.exec(line.slice(i));
      if (m) {
        const end = i + m[0].length;
        if (line[end] === '(') return {
          start: i,
          wrapped: true
        };
      }
    }
  }
  return null;
}

function balancedPart(text, start) {
  let stack = [],
    quote = false,
    escape = false,
    begin = false;
  for (let i = start; i < text.length; i++) {
    let c = text[i];
    if (quote) {
      if (c === '"' && !escape) quote = false;
      if (c === '\\' && !escape) escape = true;
      else escape = false;
      continue;
    }
    if (c === '"') {
      quote = true;
      continue;
    }
    if ('([{'.includes(c)) {
      stack.push(c);
      begin = true;
    } else if (')]}'.includes(c)) {
      const open = stack.pop();
      if (!open || '([{'.indexOf(open) !== ')]}'.indexOf(c)) throw Error('Unbalanced delimiters');
      if (begin && stack.length === 0) return text.slice(start, i + 1);
    }
  }
  throw Error('Unclosed Swift value');
}

function processLine(line, showTypes) {
  const location = findPayload(line);
  if (!location) return line.trim();
  let start = location.start;
  let payload = balancedPart(line, start);
  let value;
  try {
    value = new SwiftParser(payload, showTypes).parse();
  } catch (err) {
    throw Error(err.message + ' | ' + payload.slice(0, 100));
  }
  return value;
}
let records = [];

function convert() {
  const lines = $('input').value.split(/\r?\n/).filter(l => l.trim());
  records = [];
  let errors = 0;
  const output = $('output');
  output.replaceChildren();
  for (let i = 0; i < lines.length; i++) {
    let result, failed = false;
    try {
      result = processLine(lines[i], $('types').checked)
    } catch (e) {
      errors++;
      failed = true;
      result = {
        line: i + 1,
        error: e.message,
        raw: lines[i]
      };
    }
    records.push(result);
    const card = document.createElement('div');
    card.className = 'log-card' + (failed ? ' has-error' : '');
    const header = document.createElement('div');
    header.className = 'card-header';
    const title = document.createElement('span');
    title.className = 'card-title';
    title.textContent = `Log ${i + 1} · ${lines[i].slice(0, 90)}`;
    title.title = lines[i];
    const copy = document.createElement('button');
    copy.textContent = 'Copy';
    copy.type = 'button';
    const formatted = JSON.stringify(result, null, 2);
    copy.onclick = () => copyText(formatted, copy);
    const pre = document.createElement('pre');
    pre.textContent = formatted;
    header.append(title, copy);
    card.append(header, pre);
    output.append(card);
  }
  $('status').textContent = `${lines.length} logs · ${errors} errors`;
  $('status').className = 'status' + (errors ? ' error' : '');
}

async function copyText(text, button) {
  try {
    await navigator.clipboard.writeText(text);
    if (button) {
      button.textContent = 'Copied';
      setTimeout(() => button.textContent = 'Copy', 1300)
    } else $('status').textContent = 'Copied all logs';
  } catch {
    $('status').textContent = 'Clipboard unavailable';
  }
}

async function main() {
  $('convert').onclick = convert;
  $('sample').onclick = () => {
    $('input').value = sample;
    convert()
  };
  $('types').onchange = convert;
  $('copy').onclick = () => copyText(records.map(r => JSON.stringify(r, null, 2)).join('\n\n'));
  $('download').onclick = () => {
    const blob = new Blob([records.map(r => JSON.stringify(r)).join('\n')], {
      type: 'application/x-ndjson'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'swift-logs.jsonl';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  $('input').value = sample;
  convert();
}

main();
