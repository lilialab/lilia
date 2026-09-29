import { randomInt } from 'node:crypto';

/** 匿名账号未设密码时，改密 / 删号 / 密码校验入口的统一提示。 */
export const ANONYMOUS_ACCOUNT_MESSAGE = '该账号尚未设置密码，请先保存账号';

/** 账号标识前缀；匿名账号一眼可辨。 */
const ACCOUNT_PREFIX = 'u_';

/** 随机部分长度与字母表；去掉 0/O/1/I/L 等易混字符，方便用户口述或手输。 */
const RANDOM_LENGTH = 10;
const RANDOM_ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';

/** 随机昵称的形容词与名词；组合出「安静的猫」这类可读昵称。 */
const NICKNAME_ADJECTIVES = ['安静的', '好奇的', '认真的', '爱笑的', '慢半拍的', '爱看云的'];
const NICKNAME_NOUNS = ['猫', '狐狸', '水獭', '渡鸦', '鲸鱼', '松鼠'];

function randomOf<T>(values: ArrayLike<T>): T {
  return values[randomInt(values.length)];
}

/** 生成匿名账号标识（如 `u_K7M3PQ2XB9`）。 */
export function generateAnonymousAccount(): string {
  const body = Array.from({ length: RANDOM_LENGTH }, () => randomOf(RANDOM_ALPHABET)).join('');
  return `${ACCOUNT_PREFIX}${body}`;
}

/** 生成随机昵称（如「安静的猫」）。 */
export function generateAnonymousNickname(): string {
  return `${randomOf(NICKNAME_ADJECTIVES)}${randomOf(NICKNAME_NOUNS)}`;
}
