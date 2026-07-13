import bcrypt from 'bcryptjs';

const BCRYPT_COST = 10;

/** 对明文密码做 bcrypt 哈希。 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_COST);
}

/** 校验明文密码与哈希是否匹配。 */
export async function verifyPassword(password: string, passwordHash: string): Promise<boolean> {
  return bcrypt.compare(password, passwordHash);
}
