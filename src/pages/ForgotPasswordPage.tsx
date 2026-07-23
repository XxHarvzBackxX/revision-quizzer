import { sendPasswordResetEmail } from 'firebase/auth';
import { useState } from 'react';
import { getFirebaseAuthClient } from '../firebase';
import type { Navigate } from '../types';

export function ForgotPasswordPage({ navigate }: { navigate: Navigate }) {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    try { await sendPasswordResetEmail(await getFirebaseAuthClient(), email); } catch { /* Keep the response generic to prevent enumeration. */ }
    setSent(true);
    setBusy(false);
  }
  return <section className="auth-page"><div className="auth-card"><p className="eyebrow">account recovery</p><h1>Reset your password</h1>{sent ? <><div className="form-notice success">If an account exists for that address, Firebase has sent recovery instructions.</div><button className="primary-button" onClick={() => navigate('/login')}>Back to sign in</button></> : <form onSubmit={submit}><label className="field"><span>Email address</span><input type="email" required autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} /></label><button className="primary-button big" disabled={busy}>Send reset link</button></form>}</div></section>;
}
