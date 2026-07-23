import { Download, LogOut, Save, ShieldCheck, Trash2, UploadCloud } from 'lucide-react';
import { GoogleAuthProvider, linkWithPopup } from 'firebase/auth';
import { useEffect, useMemo, useState } from 'react';
import { ACCOUNT_AVATARS, type AccountAvatar } from '../../shared/account';
import type { DatasetSummary } from '../../shared/quiz';
import { claimLegacyProgress, deleteAccount as destroyAccount, deleteOwnedSubmission, fetchOwnedSubmissions, updateAccountProfile } from '../api';
import { useAccount } from '../account/AccountContext';
import { AvatarBadge } from '../account/AvatarBadge';
import { getFirebaseAuthClient } from '../firebase';
import { clearLegacyProgress, collectLegacyProgress, purgeAccountCache } from '../persistence';
import type { Navigate } from '../types';

export function AccountPage({ navigate }: { navigate: Navigate }) {
  const { account, refreshProfile, reloadData, signOut } = useAccount();
  const [avatar, setAvatar] = useState<AccountAvatar>(account?.avatar ?? 'quiz-bot');
  const [handle, setHandle] = useState(account?.handle ?? '');
  const [attribution, setAttribution] = useState(account?.attributionEnabled ?? false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deleteContent, setDeleteContent] = useState<'anonymize' | 'delete'>('anonymize');
  const [submissions, setSubmissions] = useState<DatasetSummary[]>([]);
  const legacy = useMemo(() => collectLegacyProgress(), [message]);

  useEffect(() => {
    if (account) void fetchOwnedSubmissions().then(setSubmissions).catch(() => setSubmissions([]));
  }, [account?.uid]);

  if (!account) {
    return <section className="account-page"><div className="account-guest-card"><ShieldCheck size={34} /><h1>Your progress, on your account</h1><p>Guests can browse and practise, but Quiz Arcade does not save guest attempts, notes, XP, or Academy progress.</p>{message && <div className="form-notice success">{message}</div>}<button className="primary-button" onClick={() => navigate('/login')}>Sign in</button><button className="ghost-button" onClick={() => navigate('/register')}>Create account</button>{legacy && <LegacyActions legacy={legacy} signedIn={false} onClaim={async () => {}} onChanged={setMessage} />}</div></section>;
  }
  const activeAccount = account;

  async function saveProfile() {
    setBusy(true); setError(''); setMessage('');
    try {
      let idToken: string | undefined;
      if (handle !== activeAccount.handle) {
        const user = (await getFirebaseAuthClient()).currentUser;
        if (!user) { navigate('/login'); return; }
        idToken = await user.getIdToken(true);
      }
      await updateAccountProfile({ handle, avatar, attributionEnabled: attribution }, idToken);
      await refreshProfile();
      setMessage('Profile saved.');
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not save your profile.'); }
    finally { setBusy(false); }
  }

  async function claim() {
    if (!legacy) return;
    setBusy(true); setError('');
    try {
      await claimLegacyProgress(crypto.randomUUID(), legacy);
      clearLegacyProgress();
      await reloadData();
      setMessage('Browser progress was securely added to your account.');
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not claim browser progress.'); }
    finally { setBusy(false); }
  }

  async function removeAccount() {
    if (deleteConfirm !== activeAccount.handle) return;
    setBusy(true); setError('');
    try {
      const user = (await getFirebaseAuthClient()).currentUser;
      if (!user) { navigate('/login'); return; }
      const token = await user.getIdToken(true);
      await destroyAccount(deleteContent, token);
      purgeAccountCache(activeAccount.uid);
      window.location.assign('/');
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not delete your account.'); setBusy(false); }
  }

  async function linkGoogle() {
    setBusy(true); setError(''); setMessage('');
    try {
      const user = (await getFirebaseAuthClient()).currentUser;
      if (!user) { navigate('/login'); return; }
      await linkWithPopup(user, new GoogleAuthProvider());
      setMessage('Google sign-in is now linked to your account.');
    } catch (cause) {
      const code = cause && typeof cause === 'object' && 'code' in cause ? String(cause.code) : '';
      setError(code.includes('provider-already-linked') ? 'Google sign-in is already linked.' : code.includes('credential-already-in-use') ? 'That Google identity belongs to another account.' : 'Could not link Google sign-in.');
    } finally { setBusy(false); }
  }

  return <section className="account-page">
    <div className="section-title"><p className="eyebrow">private account</p><h1>Account</h1></div>
    {message && <div className="form-notice success" role="status">{message}</div>}{error && <div className="form-notice error" role="alert">{error}</div>}
    <div className="account-grid">
      <article className="account-panel profile-panel"><div className="account-profile-heading"><AvatarBadge avatar={avatar} size="large" /><div><strong>@{activeAccount.handle}</strong><span>{activeAccount.email}</span>{activeAccount.admin && <small>Administrator</small>}</div>{activeAccount.admin && <button className="secondary-button account-admin-link" onClick={() => navigate('/admin')}><ShieldCheck size={17} />Admin console</button>}</div>
        <label className="field"><span>Handle</span><input minLength={3} maxLength={24} pattern="[a-z0-9_]+" value={handle} onChange={(event) => setHandle(event.target.value.toLowerCase())} /><small>Changing your handle requires a fresh sign-in and is limited to once every 30 days.</small></label>
        <fieldset className="avatar-picker compact"><legend>Avatar</legend>{ACCOUNT_AVATARS.map((option) => <button type="button" className={avatar === option ? 'selected' : ''} onClick={() => setAvatar(option)} aria-pressed={avatar === option} key={option}><AvatarBadge avatar={option} /><span>{option.replaceAll('-', ' ')}</span></button>)}</fieldset>
        <label className="consent-row"><input type="checkbox" checked={attribution} onChange={(event) => setAttribution(event.target.checked)} /><span>Show my handle and avatar on approved sets I contribute. My email and UID are never public.</span></label>
        <button className="primary-button" disabled={busy || !/^[a-z0-9_]{3,24}$/.test(handle)} onClick={saveProfile}><Save size={17} />Save profile</button>
      </article>
      <div className="account-side-panels">
        {legacy && <LegacyActions legacy={legacy} signedIn onClaim={claim} onChanged={setMessage} />}
        <article className="account-panel"><h2>Your data</h2><p>Download a machine-readable copy of your profile, progress, settings, and submissions.</p><a className="ghost-button account-download" href="/api/account/export" download="quiz-arcade-account-export.json"><Download size={17} />Download account export</a></article>
        <article className="account-panel"><h2>Sign-in methods</h2><p>Link Google only after signing into this existing account. Accounts are never merged from an email match alone.</p><button className="ghost-button" disabled={busy} onClick={linkGoogle}>Link Google</button></article>
        <article className="account-panel"><h2>Session</h2><p>Your server session lasts up to five days. Sensitive actions require a recent Firebase sign-in.</p><button className="ghost-button" onClick={async () => { await signOut(); navigate('/'); }}><LogOut size={17} />Sign out</button></article>
      </div>
    </div>
    <article className="account-panel owned-submissions"><h2>Your community submissions</h2><p>Remove a pending or approved set at any time.</p>{submissions.length === 0 ? <span className="muted-copy">No submissions yet.</span> : <div>{submissions.map((submission) => <div key={submission.id}><span><strong>{submission.title}</strong><small>{submission.status ?? 'approved'} · {submission.itemCount} questions</small></span><button className="danger-button" onClick={async () => { if (!window.confirm(`Delete “${submission.title}”?`)) return; await deleteOwnedSubmission(submission.id); setSubmissions((current) => current.filter((item) => item.id !== submission.id)); }}>Delete</button></div>)}</div>}</article>
    <article className="account-panel danger-zone"><h2>Delete account</h2><p>This permanently deletes your profile and learning data. Pending submissions are deleted. Choose what happens to approved sets.</p>
      <label className="consent-row"><input type="radio" name="content-delete" checked={deleteContent === 'anonymize'} onChange={() => setDeleteContent('anonymize')} /><span>Keep approved sets, permanently removing my identity and attribution.</span></label>
      <label className="consent-row"><input type="radio" name="content-delete" checked={deleteContent === 'delete'} onChange={() => setDeleteContent('delete')} /><span>Delete my approved sets too.</span></label>
      <label className="field"><span>Type <strong>{activeAccount.handle}</strong> to confirm</span><input value={deleteConfirm} onChange={(event) => setDeleteConfirm(event.target.value)} /></label>
      <div className="button-row"><a className="ghost-button account-download" href="/api/account/export" download="quiz-arcade-account-export.json"><Download size={17} />Export first</a><button className="danger-button" disabled={busy || deleteConfirm !== activeAccount.handle} onClick={removeAccount}><Trash2 size={17} />Permanently delete</button></div>
    </article>
  </section>;
}

function LegacyActions({ legacy, signedIn, onClaim, onChanged }: { legacy: Record<string, Record<string, unknown>>; signedIn: boolean; onClaim: () => Promise<void>; onChanged: (message: string) => void }) {
  function download() {
    const blob = new Blob([JSON.stringify({ format: 'quiz-arcade-legacy-export', version: 1, exportedAt: new Date().toISOString(), domains: legacy }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a'); link.href = url; link.download = 'quiz-arcade-browser-progress.json'; link.click(); URL.revokeObjectURL(url); onChanged('Legacy browser data downloaded.');
  }
  function remove() {
    if (!window.confirm('Delete this frozen browser progress? Download it first if you may need it later.')) return;
    clearLegacyProgress();
    onChanged('Legacy browser progress was deleted from this device.');
  }
  return <article className="account-panel legacy-panel"><h2>Existing browser progress found</h2><p>This older data is frozen. Download it now{signedIn ? ' or securely add it to this account' : ', then sign in to claim it'}.</p><div className="button-row"><button className="ghost-button" onClick={download}><Download size={17} />Download JSON</button>{signedIn && <button className="primary-button" onClick={() => void onClaim()}><UploadCloud size={17} />Claim progress</button>}<button className="danger-button" onClick={remove}>Delete browser copy</button></div></article>;
}
