const TOKEN = /\{\{(\w+)\}\}/g;

/** 将模板中的 `{{key}}` 按 vars 的 kv 替换；未知 key 抛错。 */
export function interpolate(template: string, vars: Record<string, string>): string {
  return template.replace(TOKEN, (_match, key: string) => {
    if (!Object.hasOwn(vars, key)) {
      throw new Error(`未知插值变量: {{${key}}}`);
    }
    return vars[key];
  });
}
