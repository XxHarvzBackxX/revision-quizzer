import { createUserWithEmailAndPassword, GoogleAuthProvider, sendEmailVerification, signInWithEmailAndPassword, signInWithPopup, type User } from 'firebase/auth';
import { KeyRound, Loader2, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { ACCOUNT_AVATARS, type AccountAvatar, type AccountOnboarding } from '../../shared/account';
import { ApiError, createSession } from '../api';
import { useAccount } from '../account/AccountContext';
import { AvatarBadge } from '../account/AvatarBadge';
import { getFirebaseAuthClient } from '../firebase';
import type { Navigate } from '../types';

export function AuthPage({ mode, navigate }: { mode: 'login' | 'register'; navigate: Navigate }) {
  const { activate, authAvailable } = useAccount();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pendingToken, setPendingToken] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submitEmail(event: React.FormEvent) {
    event.preventDefault();
    await run(async () => {
      const auth = await getFirebaseAuthClient();
      if (mode === 'register') {
        const result = await createUserWithEmailAndPassword(auth, email, password);
        await sendEmailVerification(result.user);
        setMessage('Check your inbox, verify your email, then return here to sign in and finish your profile.');
        setPassword('');
        return;
      }
      const result = await signInWithEmailAndPassword(auth, email, password);
      await establish(result.user);
    });
  }

  async function google() {
    await run(async () => establish((await signInWithPopup(await getFirebaseAuthClient(), new GoogleAuthProvider())).user));
  }

  async function establish(user: User) {
    const token = await user.getIdToken(true);
    try {
      const profile = await createSession(token);
      await activate(profile);
      navigate('/account');
    } catch (cause) {
      if (cause instanceof ApiError && cause.code === 'onboarding_required') {
        setPendingToken(token);
        return;
      }
      throw cause;
    }
  }

  async function finishOnboarding(onboarding: AccountOnboarding) {
    await run(async () => {
      const profile = await createSession(pendingToken, onboarding);
      await activate(profile);
      navigate('/account');
    });
  }

  async function run(action: () => Promise<void>) {
    setBusy(true);
    setError('');
    setMessage('');
    try {
      await action();
    } catch (cause) {
      setError(authErrorMessage(cause));
    } finally {
      setBusy(false);
    }
  }

  if (pendingToken) return <OnboardingForm busy={busy} error={error} onSubmit={finishOnboarding} />;

  return (
    <section className="auth-page">
      <div className="auth-card">
        <span className="auth-icon"><ShieldCheck size={30} /></span>
        <p className="eyebrow">secure account</p>
        <h1>{mode === 'register' ? 'Create your account' : 'Welcome back'}</h1>
        <p>{mode === 'register' ? 'Save progress privately and continue across your devices.' : 'Sign in to restore your account progress.'}</p>
        {!authAvailable && <div className="form-notice error">Account sign-in is not configured on this deployment.</div>}
        {message && <div className="form-notice success" role="status">{message}</div>}
        {error && <div className="form-notice error" role="alert">{error}</div>}
        <form onSubmit={submitEmail}>
          <label className="field"><span>Email address</span><input type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} /></label>
          <label className="field"><span>Password</span><input type="password" minLength={12} maxLength={128} autoComplete={mode === 'register' ? 'new-password' : 'current-password'} required value={password} onChange={(event) => setPassword(event.target.value)} /></label>
          <button className="primary-button big" disabled={busy || !authAvailable}>{busy ? <Loader2 className="spin" size={18} /> : <KeyRound size={18} />}{mode === 'register' ? 'Create account' : 'Sign in'}</button>
        </form>
        <div className="auth-divider"><span>or</span></div>
        <button className="google-button" disabled={busy || !authAvailable} onClick={google}>Continue with Google</button>
        <div className="auth-links">
          {mode === 'login' ? <><button onClick={() => navigate('/forgot-password')}>Forgot password?</button><button onClick={() => navigate('/register')}>Create account</button></> : <button onClick={() => navigate('/login')}>Already have an account?</button>}
        </div>
        <small>Accounts are for people aged 16 or over. Credentials are handled by Firebase Authentication. Review our <button className="inline-link" onClick={() => navigate('/privacy')}>Privacy Policy</button> and <button className="inline-link" onClick={() => navigate('/terms')}>Terms</button>.</small>
      </div>
    </section>
  );
}

function OnboardingForm({ busy, error, onSubmit }: { busy: boolean; error: string; onSubmit: (value: AccountOnboarding) => Promise<void> }) {
  const [handle, setHandle] = useState('');
  const [avatar, setAvatar] = useState<AccountAvatar>('quiz-bot');
  const [age, setAge] = useState(false);
  const [terms, setTerms] = useState(false);
  const [privacy, setPrivacy] = useState(false);
  return (
    <section className="auth-page"><form className="auth-card onboarding-card" onSubmit={(event) => { event.preventDefault(); void onSubmit({ handle, avatar, isAtLeast16: true, acceptsTerms: true, acknowledgesPrivacy: true }); }}>
      <p className="eyebrow">one last step</p><h1>Build your private profile</h1>
      {error && <div className="form-notice error" role="alert">{error}</div>}
      <label className="field"><span>Unique handle</span><input required minLength={3} maxLength={24} pattern="[a-z0-9_]+" value={handle} onChange={(event) => setHandle(event.target.value.toLowerCase())} /><small>3–24 lowercase letters, numbers, or underscores.</small></label>
      <fieldset className="avatar-picker"><legend>Preset avatar</legend>{ACCOUNT_AVATARS.map((option) => <button type="button" className={avatar === option ? 'selected' : ''} aria-pressed={avatar === option} onClick={() => setAvatar(option)} key={option}><AvatarBadge avatar={option} /><span>{option.replaceAll('-', ' ')}</span></button>)}</fieldset>
      <label className="consent-row"><input type="checkbox" required checked={age} onChange={(event) => setAge(event.target.checked)} /><span>I confirm that I am at least 16 years old.</span></label>
      <label className="consent-row"><input type="checkbox" required checked={terms} onChange={(event) => setTerms(event.target.checked)} /><span>I accept the <a href="/terms" target="_blank" rel="noreferrer">Terms</a>.</span></label>
      <label className="consent-row"><input type="checkbox" required checked={privacy} onChange={(event) => setPrivacy(event.target.checked)} /><span>I have read the <a href="/privacy" target="_blank" rel="noreferrer">Privacy Policy</a>.</span></label>
      <button className="primary-button big" disabled={busy || !age || !terms || !privacy || !/^[a-z0-9_]{3,24}$/.test(handle)}>{busy ? <Loader2 className="spin" size={18} /> : <ShieldCheck size={18} />}Finish account</button>
    </form></section>
  );
}

function authErrorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (error && typeof error === 'object' && 'code' in error) {
    const code = String(error.code);
    if (code.includes('invalid-credential')) return 'The email or password is incorrect.';
    if (code.includes('email-already-in-use')) return 'An account already uses that email. Sign in instead.';
    if (code.includes('account-exists-with-different-credential')) return 'An account already uses that email. Sign in with its existing method, then link Google from Account.';
    if (code.includes('weak-password')) return 'Choose a stronger password with at least 12 characters.';
    if (code.includes('popup-closed')) return 'Google sign-in was closed before it finished.';
  }
  return 'Sign-in could not be completed. Please try again.';
}
