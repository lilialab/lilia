/** 各表单的 Turnstile `action`；widget 渲染与 siteverify 校验必须传同一个。 */
export const TURNSTILE_ACTION = {
  REGISTER: 'register',
  LOGIN: 'login',
  ANONYMOUS: 'anonymous',
} as const;
