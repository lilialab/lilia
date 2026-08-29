/*
 * JSON ↔ YAML 文本转换。
 *
 * 用途：画像源是 JSON（现在是文件，以后入库），塞进 LLM prompt 时收成 YAML，少括号噪音。
 * 不是通用 YAML 库，也不 parse 任意 YAML。
 *
 * 生产只用 jsonToYaml（chat/group prompt）。yamlToJson 只覆盖本文件写出的子集，
 * 目前给单测往返用，业务路径没有调用。
 *
 * jsonToYaml 比当前角色卡多出来的能力（删留时可对照）：
 * - omitEmpty：空对象 / 空数组 / null 不输出（避免 prompt 里出现 habits: {}）
 * - 任意深度嵌套，不只两层
 * - 数组元素可以是对象（friends: [{ name, age }]），角色画像暂时没有
 * - 按 YAML 规则给 key/字符串加引号（{{name}}、看起来像 true/15 的字）
 */

export type JsonObject = { [key: string]: JsonValue };
export type JsonValue = string | number | boolean | null | JsonValue[] | JsonObject;

const INDENT = '  ';

/* -------------------------------------------------------------------------- */
/* JSON → YAML（生产：prompt 注入） */
/* -------------------------------------------------------------------------- */

/** 把 JSON 写成 2 空格缩进的 YAML；空容器与 null 省略。非 JSON 值先 JSON 克隆丢掉。 */
export function jsonToYaml(value: unknown): string {
  if (value === undefined || value === null) return '';
  const json = JSON.parse(JSON.stringify(value)) as JsonValue;
  const cleaned = omitEmpty(json);
  if (cleaned === undefined) return '';
  return dump(cleaned, 0).join('\n');
}

/** 去掉 null、空数组、空对象（含子树清空后的空对象）。0 / false / '' 保留。 */
function omitEmpty(value: JsonValue): JsonValue | undefined {
  if (value === null) return undefined;
  if (Array.isArray(value)) {
    const items = value.map(omitEmpty).filter((item): item is JsonValue => item !== undefined);
    return items.length === 0 ? undefined : items;
  }
  if (typeof value === 'object') {
    const out: JsonObject = {};
    for (const [key, child] of Object.entries(value)) {
      const kept = omitEmpty(child);
      if (kept !== undefined) out[key] = kept;
    }
    return Object.keys(out).length === 0 ? undefined : out;
  }
  return value;
}

function dump(value: JsonValue, indent: number): string[] {
  if (value === null) return [];
  if (Array.isArray(value)) return dumpArray(value, indent);
  if (typeof value === 'object') return dumpObject(value, indent);
  return [formatScalar(value)];
}

function dumpObject(obj: JsonObject, indent: number): string[] {
  const pad = INDENT.repeat(indent);
  const lines: string[] = [];
  for (const [key, value] of Object.entries(obj)) {
    const k = formatKey(key);
    if (isScalar(value)) {
      lines.push(`${pad}${k}: ${formatScalar(value)}`);
      continue;
    }
    lines.push(`${pad}${k}:`);
    lines.push(...dump(value, indent + 1));
  }
  return lines;
}

/** 标量写成 `- item`；对象/嵌套数组把第一行接在 `- ` 后，其余行再缩进两格。 */
function dumpArray(items: JsonValue[], indent: number): string[] {
  const pad = INDENT.repeat(indent);
  const lines: string[] = [];
  for (const item of items) {
    if (isScalar(item)) {
      lines.push(`${pad}- ${formatScalar(item)}`);
      continue;
    }
    const nested = dump(item, 0);
    if (nested.length === 0) continue;
    const [first, ...rest] = nested;
    lines.push(`${pad}- ${first}`);
    for (const line of rest) {
      lines.push(`${pad}  ${line}`);
    }
  }
  return lines;
}

function isScalar(value: JsonValue): value is string | number | boolean {
  return typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean';
}

function formatKey(key: string): string {
  return needsQuotes(key) ? quoteDouble(key) : key;
}

function formatScalar(value: string | number | boolean): string {
  if (typeof value !== 'string') return String(value);
  return needsQuotes(value) ? quoteDouble(value) : value;
}

function quoteDouble(value: string): string {
  return `"${value.replaceAll('\\', '\\\\').replaceAll('"', '\\"').replaceAll('\n', '\\n')}"`;
}

/** 空串、YAML 指示符、易被当成 bool/number 的字、含 `:` `#` `{}` 等时加双引号。 */
function needsQuotes(value: string): boolean {
  if (value.length === 0) return true;
  if (/^[\s-?:,[\]{}#&*!|>'"%@`~]/.test(value)) return true;
  if (/\s$/.test(value)) return true;
  if (/[\n:#{}[\],&*!|>'"%@`]/.test(value)) return true;
  if (/^(?:true|false|null|yes|no|on|off|~)$/i.test(value)) return true;
  if (/^[+-]?(?:\d+(?:\.\d+)?|\.\d+)(?:[eE][+-]?\d+)?$/.test(value)) return true;
  return false;
}

/* -------------------------------------------------------------------------- */
/* YAML → JSON（非生产：只认 jsonToYaml 写出的子集，供往返测试） */
/* -------------------------------------------------------------------------- */

interface YamlLine {
  indent: number;
  content: string;
}

/**
 * 把本模块写出的 YAML 解析回 JSON。空文本 → `{}`。
 * 不支持注释以外的 YAML 特性（锚点、多文档、字面块等）；乱格式会抛错。
 */
export function yamlToJson(text: string): JsonValue {
  const lines = toYamlLines(text);
  if (lines.length === 0) return {};
  const first = lines.at(0);
  if (!first) return {};
  const { value, next } = parseBlock(lines, 0, first.indent);
  if (next !== lines.length) {
    throw new Error('YAML 未能完整解析');
  }
  return value;
}

function toYamlLines(text: string): YamlLine[] {
  const lines: YamlLine[] = [];
  for (const raw of text.replaceAll('\t', '  ').split('\n')) {
    if (raw.trim() === '' || raw.trimStart().startsWith('#')) continue;
    const indentMatch = raw.match(/^ */);
    const indent = indentMatch ? indentMatch[0].length : 0;
    if (indent % 2 !== 0) {
      throw new Error('YAML 缩进必须为 2 的倍数');
    }
    lines.push({ indent, content: raw.slice(indent) });
  }
  return lines;
}

function parseBlock(
  lines: YamlLine[],
  index: number,
  indent: number,
): { value: JsonValue; next: number } {
  const line = lines[index];
  if (!line || line.indent !== indent) {
    throw new Error('YAML 结构无效');
  }
  if (line.content.startsWith('- ')) {
    return parseArray(lines, index, indent);
  }
  return parseObject(lines, index, indent);
}

function parseObject(
  lines: YamlLine[],
  index: number,
  indent: number,
): { value: JsonObject; next: number } {
  const obj: JsonObject = {};
  let i = index;
  while (i < lines.length) {
    const current = lines.at(i);
    if (!current || current.indent !== indent) break;
    const content = current.content;
    if (content.startsWith('- ')) break;
    const split = splitMapping(content);
    if (!split) {
      throw new Error(`YAML 无法解析映射行: ${content}`);
    }
    const { key, inline } = split;
    i += 1;
    if (inline !== undefined) {
      obj[key] = parseScalar(inline);
      continue;
    }
    const child = lines.at(i);
    if (!child || child.indent <= indent) {
      continue;
    }
    const parsed = parseBlock(lines, i, child.indent);
    obj[key] = parsed.value;
    i = parsed.next;
  }
  return { value: obj, next: i };
}

/** 对应 dumpArray：标量项、`- key: val` 对象项、`-` 后嵌套块。 */
function parseArray(
  lines: YamlLine[],
  index: number,
  indent: number,
): { value: JsonValue[]; next: number } {
  const items: JsonValue[] = [];
  let i = index;
  while (i < lines.length) {
    const current = lines.at(i);
    if (!current || current.indent !== indent || !current.content.startsWith('- ')) break;
    const rest = current.content.slice(2);
    i += 1;
    const mapping = splitMapping(rest);
    if (mapping) {
      if (mapping.inline === undefined) {
        const obj: JsonObject = {};
        const nested = lines.at(i);
        if (nested && nested.indent > indent) {
          const parsed = parseBlock(lines, i, nested.indent);
          if (
            parsed.value !== null && typeof parsed.value === 'object'
            && !Array.isArray(parsed.value)
          ) {
            Object.assign(obj, parsed.value);
          } else {
            items.push(parsed.value);
            i = parsed.next;
            continue;
          }
          i = parsed.next;
        }
        items.push(obj);
        continue;
      }
      const obj: JsonObject = { [mapping.key]: parseScalar(mapping.inline) };
      while (i < lines.length) {
        const extra = lines.at(i);
        if (!extra || extra.indent <= indent || extra.content.startsWith('- ')) break;
        const parsed = parseObject(lines, i, extra.indent);
        Object.assign(obj, parsed.value);
        i = parsed.next;
      }
      items.push(obj);
      continue;
    }
    if (rest === '') {
      const nested = lines.at(i);
      if (!nested || nested.indent <= indent) {
        continue;
      }
      const parsed = parseBlock(lines, i, nested.indent);
      items.push(parsed.value);
      i = parsed.next;
      continue;
    }
    items.push(parseScalar(rest));
  }
  return { value: items, next: i };
}

function splitMapping(content: string): { key: string; inline: string | undefined } | undefined {
  if (content.startsWith('"')) {
    const end = content.indexOf('":', 1);
    if (end === -1) return undefined;
    const key = JSON.parse(content.slice(0, end + 1)) as string;
    const after = content.slice(end + 2);
    return { key, inline: after === '' ? undefined : after.replace(/^ /, '') };
  }
  const colon = content.indexOf(':');
  if (colon <= 0) return undefined;
  const key = content.slice(0, colon);
  if (/[^\w.\u4e00-\u9fff-]/.test(key)) return undefined;
  const after = content.slice(colon + 1);
  return { key, inline: after === '' ? undefined : after.replace(/^ /, '') };
}

function parseScalar(raw: string): JsonValue {
  if (raw.startsWith('"')) {
    return JSON.parse(raw) as string;
  }
  if (raw === 'true') return true;
  if (raw === 'false') return false;
  if (raw === 'null') return null;
  if (/^-?\d+$/.test(raw)) return Number(raw);
  if (/^-?\d+\.\d+$/.test(raw)) return Number(raw);
  return raw;
}
