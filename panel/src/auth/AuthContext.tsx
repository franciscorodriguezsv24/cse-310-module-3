import { onAuthStateChanged, signInWithEmailAndPassword, signOut, type User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { createContext, use, useEffect, useMemo, useState, type ReactNode } from 'react';

import { auth, db } from '../firebase';

export type AuthStatus = 'loading' | 'signed-out' | 'not-staff' | 'staff';

interface AuthContextValue {
  status: AuthStatus;
  user: User | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Tracks the signed-in user and whether they are staff (a /staff/{uid} document exists).
 * This only decides what the UI shows; the security rules are what actually block writes.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<AuthStatus>('loading');

  useEffect(
    () =>
      onAuthStateChanged(auth, async (nextUser) => {
        setUser(nextUser);
        if (!nextUser) {
          setStatus('signed-out');
          return;
        }
        try {
          const staffDoc = await getDoc(doc(db, 'staff', nextUser.uid));
          setStatus(staffDoc.exists() ? 'staff' : 'not-staff');
        } catch {
          setStatus('not-staff');
        }
      }),
    [],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      user,
      signIn: async (email, password) => {
        await signInWithEmailAndPassword(auth, email, password);
      },
      signOut: () => signOut(auth),
    }),
    [status, user],
  );

  return <AuthContext value={value}>{children}</AuthContext>;
}

/** Access the auth state from any component. */
export function useAuth(): AuthContextValue {
  const context = use(AuthContext);
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>');
  return context;
}
