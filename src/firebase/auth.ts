import {
  signOut,
  type User,
} from 'firebase/auth';
import { auth } from './config';

// تم إلغاء الاعتماد على فايربيس في تسجيل الدخول، وأصبح الاعتماد كلياً على Google Sheets عبر AuthContext
export async function loginWithEmail(_email: string, _pass: string): Promise<User> {
  throw new Error("Login is handled via Google Sheets.");
}

export async function logout(): Promise<void> {
  await signOut(auth);
}