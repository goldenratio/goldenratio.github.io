export class SwiftParser {
  constructor(text, showTypes) {
    this.s = text;
    this.i = 0;
    this.types = showTypes;
  }

  skip() {
    while (/\s/.test(this.s[this.i] || '') && this.i < this.s.length) this.i++;
  }

  peek() {
    this.skip();
    return this.s[this.i];
  }

  quoted() {
    const start = this.i++;
    let escaped = false;
    while (this.i < this.s.length) {
      let c = this.s[this.i++];
      if (c === '"' && !escaped) break;
      if (c === '\\' && !escaped) escaped = true;
      else escaped = false;
    }
    const raw = this.s.slice(start, this.i);
    try {
      return JSON.parse(raw)
    } catch {
      return raw.slice(1, -1)
    }
  }

  token() {
    this.skip();
    const start = this.i;
    while (this.i < this.s.length && !/[\s(),\[\]{}:]/.test(this.s[this.i])) this.i++;
    return this.s.slice(start, this.i);
  }

  parse() {
    const value = this.value();
    this.skip();
    if (this.i < this.s.length) throw Error('Unexpected input near ' + this.s.slice(this.i, this.i + 45));
    return value;
  }

  value() {
    this.skip();
    const c = this.s[this.i];
    if (c === '"') return this.quoted();
    if (c === '[') return this.square();
    if (c === '{') return this.braces();
    if (c === '(') {
      this.i++;
      const v = this.value();
      this.skip();
      if (this.s[this.i] === ')') this.i++;
      return v;
    }
    const name = this.token();
    if (!name) throw Error('Expected value at ' + this.i);
    if (name === 'nil' || name === 'null') return null;
    if (name === 'true') return true;
    if (name === 'false') return false;
    if (/^-?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?$/.test(name)) return Number(name);
    this.skip();
    if (this.s[this.i] === '(') {
      this.i++;
      if (name === 'Optional') {
        this.skip();
        if (this.s[this.i] === ')') {
          this.i++;
          return null;
        }
        const v = this.value();
        this.expect(')');
        return v;
      }
      const obj = {};
      if (this.types) obj._type = name;
      this.skip();
      if (this.s[this.i] === ')') {
        this.i++;
        return obj;
      }
      let n = 0;
      while (this.i < this.s.length) {
        this.skip();
        const mark = this.i;
        let key = this.token();
        this.skip();
        if (key && this.s[this.i] === ':') {
          this.i++;
          obj[key] = this.value();
        } else {
          this.i = mark;
          obj['_' + n++] = this.value();
        }
        this.skip();
        if (this.s[this.i] === ',') {
          this.i++;
          continue;
        }
        this.expect(')');
        break;
      }
      return obj;
    }
    return name.includes('.') ? name.slice(name.lastIndexOf('.') + 1) : name;
  }

  expect(char) {
    this.skip();
    if (this.s[this.i] !== char) throw Error('Expected ' + char + ' at ' + this.i);
    this.i++;
  }

  square() {
    this.expect('[');
    this.skip();
    if (this.s[this.i] === ']') {
      this.i++;
      return [];
    }
    if (this.s[this.i] === ':') {
      this.i++;
      this.expect(']');
      return {};
    }
    const result = [];
    let dict = null;
    while (this.i < this.s.length) {
      const key = this.value();
      this.skip();
      if (this.s[this.i] === ':') {
        this.i++;
        const val = this.value();
        if (!dict) {
          dict = {};
          for (const item of result) dict[String(item)] = null;
        }
        dict[String(key)] = val;
      } else if (dict) {
        dict[String(key)] = null;
      } else result.push(key);
      this.skip();
      if (this.s[this.i] === ',') {
        this.i++;
        continue;
      }
      this.expect(']');
      return dict || result;
    }
    throw Error('Unclosed [');
  }

  braces() {
    const start = this.i;
    let depth = 0,
      inString = false,
      esc = false;
    while (this.i < this.s.length) {
      const c = this.s[this.i++];
      if (inString) {
        if (c === '"' && !esc) inString = false;
        if (c === '\\' && !esc) esc = true;
        else esc = false;
        continue;
      }
      if (c === '"') inString = true;
      else if (c === '{') depth++;
      else if (c === '}' && --depth === 0) break;
    }
    let raw = this.s.slice(start, this.i);
    try {
      return JSON.parse(raw)
    } catch {
      this.i = start;
      this.expect('{');
      const obj = {};
      this.skip();
      while (this.peek() !== '}' && this.i < this.s.length) {
        const k = this.value();
        this.expect(':');
        obj[String(k)] = this.value();
        this.skip();
        if (this.peek() === ',') this.i++;
        else break;
      }
      this.expect('}');
      return obj;
    }
  }
}
