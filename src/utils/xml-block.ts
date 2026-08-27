/** 用 XML 标签包一层正文；开闭标签由调用处写出。 */
export function xmlBlock(tag: string, body: string): string {
  return `<${tag}>\n${body}\n</${tag}>`;
}
