import { NavLink, Outlet } from 'react-router';

import { useAuth } from '../auth/AuthContext';
import { usingEmulators } from '../firebase';
import { LoginPage } from '../pages/LoginPage';

/** App shell: shows the sign-in page until a staff member is signed in, then the nav and the current page. */
export function Layout() {
  const { status, user, signOut } = useAuth();

  if (status === 'loading') return <p className="centered muted">Loading…</p>;
  if (status === 'signed-out') return <LoginPage />;
  if (status === 'not-staff') {
    return (
      <div className="centered card narrow">
        <h1>Not a staff account</h1>
        <p className="muted">{user?.email} is signed in but isn't on the staff list, so it can't edit the menu.</p>
        <button onClick={signOut}>Sign out</button>
      </div>
    );
  }

  return (
    <>
      <header className="topbar">
        <strong className="brand">🍣 Menu Panel</strong>
        <nav>
          <NavLink to="/products">Products</NavLink>
          <NavLink to="/branches">Branches</NavLink>
        </nav>
        <span className="spacer" />
        {usingEmulators && <span className="badge">Emulator</span>}
        <span className="muted small">{user?.email}</span>
        <button className="ghost" onClick={signOut}>
          Sign out
        </button>
      </header>
      <main>
        <Outlet />
      </main>
    </>
  );
}
