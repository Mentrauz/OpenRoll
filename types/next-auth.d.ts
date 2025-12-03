import { DefaultSession } from 'next-auth'

interface UserSession {
  userId: string;
  tmsId: string;
  role: 'admin' | 'accounts' | 'data-operations' | 'supervisor' | 'hr';
  name: string;
}

declare module 'next-auth' {
  interface Session {
    user: UserSession
  }

  interface User extends UserSession {}
}

declare module 'next-auth/jwt' {
  interface JWT extends UserSession {}
} 