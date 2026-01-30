import bcrypt from 'bcrypt';
import { authConfig } from '../../config/auth.js';

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, authConfig.bcrypt.saltRounds);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
