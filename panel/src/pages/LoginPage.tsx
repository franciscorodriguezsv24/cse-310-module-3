import { FirebaseError } from 'firebase/app';
import { useState, type FormEvent } from 'react';

import { useAuth } from '../auth/AuthContext';
import { usingEmulators } from '../firebase';

/** Email/password sign-in for staff. */
export function LoginPage() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      await signIn(email, password);
    } catch (e) {
      const code = e instanceof FirebaseError ? e.code : '';
      setError(
        code === 'auth/invalid-credential' || code === 'auth/user-not-found' || code === 'auth/wrong-password'
          ? 'Wrong email or password.'
          : 'Could not sign in. Check your connection and try again.',
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="centered card narrow stack" onSubmit={submit}>
      <h1>🍣 Staff sign-in</h1>
      <label>
        Email
        <input type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </label>
      <label>
        Password
        <input
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </label>
      {error && <p className="error">{error}</p>}
      <button type="submit" disabled={busy}>
        {busy ? 'Signing in…' : 'Sign in'}
      </button>
      {usingEmulators && <p className="muted small">Emulator: staff@example.com / sushi-staff-123 (after `npm run seed`)</p>}
    </form>
  );
}
