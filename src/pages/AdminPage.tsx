import { Ban, Check, KeyRound, Loader2, Lock, Palette, RotateCcw, Search, Shield, UserCheck, Users } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { ACCOUNT_AVATARS, type AccountAvatar, type AccountProfile, type AdminAccountProfile } from '../../shared/account';
import type { AdminConfig, DatasetInput, PublicDataset } from '../../shared/quiz';
import {
  applyAdminAccountAction,
  deleteAdminDataset,
  fetchAdminAccounts,
  fetchAdminConfig,
  fetchAdminDatasets,
  updateAdminAccount,
  updateAdminConfig,
  updateAdminDataset
} from '../api';
import { AvatarBadge } from '../account/AvatarBadge';
import { UploadPanel } from '../components/UploadPanel';
import { PlayerIdentity } from '../account/PlayerIdentity';
import type { ToastKind } from '../types';
import { parseDataset } from '../utils/quizUi';
import { useAccount } from '../account/AccountContext';
import type { Navigate } from '../types';

export function AdminPage({
  onUploaded,
  onConfigChanged,
  onToast,
  navigate
}: {
  onUploaded: (dataset: PublicDataset) => void;
  onConfigChanged: (config: AdminConfig) => void;
  onToast: (kind: ToastKind, message: string) => void;
  navigate: Navigate;
}) {
  const { account } = useAccount();

  if (!account) {
    return (
      <section className="admin-login">
        <div className="login-panel">
          <div className="lock-badge"><Shield size={32} /></div>
          <h1>Admin access</h1>
          <p>Sign in with an account that has the server-managed administrator claim.</p>
          <button className="primary-button big" onClick={() => navigate('/login')}>Sign in securely</button>
        </div>
      </section>
    );
  }
  if (!account.admin) return <section className="admin-login"><div className="login-panel"><div className="lock-badge"><Shield size={32} /></div><h1>Access denied</h1><p>Your account does not have the administrator claim.</p></div></section>;

  return <AdminConsole account={account} navigate={navigate} onUploaded={onUploaded} onConfigChanged={onConfigChanged} onToast={onToast} />;
}

function AdminConsole({
  account,
  navigate,
  onUploaded,
  onConfigChanged,
  onToast
}: {
  account: AccountProfile;
  navigate: Navigate;
  onUploaded: (dataset: PublicDataset) => void;
  onConfigChanged: (config: AdminConfig) => void;
  onToast: (kind: ToastKind, message: string) => void;
}) {
  const [tab, setTab] = useState<'upload' | 'datasets' | 'accounts'>('upload');
  const [adminDatasets, setAdminDatasets] = useState<PublicDataset[]>([]);
  const [moderationEnabled, setModerationEnabled] = useState(false);
  const [themesRequireUnlock, setThemesRequireUnlock] = useState(true);
  const [isLoadingAdmin, setIsLoadingAdmin] = useState(true);
  const [isSavingThemeAvailability, setIsSavingThemeAvailability] = useState(false);

  useEffect(() => {
    void refreshAdmin();
  }, []);

  async function refreshAdmin() {
    setIsLoadingAdmin(true);
    try {
      const [config, datasets] = await Promise.all([
        fetchAdminConfig(),
        fetchAdminDatasets()
      ]);
      setModerationEnabled(config.moderationEnabled);
      setThemesRequireUnlock(config.themesRequireUnlock);
      onConfigChanged(config);
      setAdminDatasets(datasets);
    } catch (error) {
      onToast('error', error instanceof Error ? error.message : 'Could not load admin data.');
    } finally {
      setIsLoadingAdmin(false);
    }
  }

  async function toggleModeration(value: boolean) {
    setModerationEnabled(value);
    try {
      const config = await updateAdminConfig({ moderationEnabled: value, themesRequireUnlock });
      setModerationEnabled(config.moderationEnabled);
      setThemesRequireUnlock(config.themesRequireUnlock);
      onConfigChanged(config);
      onToast('success', config.moderationEnabled ? 'Approval gate enabled.' : 'Approval gate disabled.');
    } catch (error) {
      setModerationEnabled(!value);
      onToast('error', error instanceof Error ? error.message : 'Could not update moderation setting.');
    }
  }

  async function setThemeAvailability(requireUnlock: boolean) {
    if (requireUnlock === themesRequireUnlock) return;
    const previous = themesRequireUnlock;
    setThemesRequireUnlock(requireUnlock);
    setIsSavingThemeAvailability(true);
    try {
      const config = await updateAdminConfig({ moderationEnabled, themesRequireUnlock: requireUnlock });
      setModerationEnabled(config.moderationEnabled);
      setThemesRequireUnlock(config.themesRequireUnlock);
      onConfigChanged(config);
      onToast('success', config.themesRequireUnlock ? 'Bonus themes now require Academy rewards.' : 'Bonus themes are now available site-wide.');
    } catch (error) {
      setThemesRequireUnlock(previous);
      onToast('error', error instanceof Error ? error.message : 'Could not update theme availability.');
    } finally {
      setIsSavingThemeAvailability(false);
    }
  }

  return (
    <section className="admin-page">
      <div className="section-title admin-title">
        <p className="eyebrow"><Lock size={16} /> admin console</p>
        <h1>Control room</h1>
      </div>
      <div className="admin-toolbar">
        <div className="segmented-control">
          <button className={tab === 'upload' ? 'active' : ''} onClick={() => setTab('upload')}>Upload</button>
          <button className={tab === 'datasets' ? 'active' : ''} onClick={() => setTab('datasets')}>Datasets</button>
          <button className={tab === 'accounts' ? 'active' : ''} onClick={() => setTab('accounts')}>Accounts</button>
        </div>
        <label className="toggle-row">
          <input type="checkbox" checked={moderationEnabled} onChange={(event) => toggleModeration(event.target.checked)} />
          <span>Require admin approval for upload-key submissions</span>
        </label>
        <PlayerIdentity account={account} label="Administrator" actionLabel="Account profile" className="admin-profile-identity" onOpen={() => navigate('/account')} />
        <button className="ghost-button" onClick={refreshAdmin}>
          {isLoadingAdmin ? <Loader2 className="spin" size={16} /> : <RotateCcw size={16} />}
          Refresh
        </button>
      </div>

      <section className="admin-theme-setting" aria-labelledby="admin-theme-setting-title">
        <span className="admin-setting-icon"><Palette size={22} /></span>
        <div>
          <h2 id="admin-theme-setting-title">Bonus colour themes</h2>
          <p>Choose whether every visitor gets the new palettes immediately or earns them through Academy progress.</p>
        </div>
        <div className="admin-theme-options" role="group" aria-label="Bonus theme availability">
          <button
            className={!themesRequireUnlock ? 'active' : ''}
            disabled={isSavingThemeAvailability}
            aria-pressed={!themesRequireUnlock}
            onClick={() => setThemeAvailability(false)}
          >Site-wide</button>
          <button
            className={themesRequireUnlock ? 'active' : ''}
            disabled={isSavingThemeAvailability}
            aria-pressed={themesRequireUnlock}
            onClick={() => setThemeAvailability(true)}
          >Academy unlocks</button>
        </div>
      </section>

      {tab === 'upload' ? (
        <UploadPanel mode="admin" onUploaded={(dataset) => {
          onUploaded(dataset);
          void refreshAdmin();
        }} onToast={onToast} />
      ) : tab === 'datasets' ? (
        <AdminDatasetManager
          datasets={adminDatasets}
          isLoading={isLoadingAdmin}
          onChanged={refreshAdmin}
          onToast={onToast}
        />
      ) : (
        <AdminAccountManager currentAdministratorUid={account.uid} onToast={onToast} />
      )}
    </section>
  );
}

function AdminAccountManager({
  currentAdministratorUid,
  onToast
}: {
  currentAdministratorUid: string;
  onToast: (kind: ToastKind, message: string) => void;
}) {
  const [accounts, setAccounts] = useState<AdminAccountProfile[]>([]);
  const [selectedUid, setSelectedUid] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [activeSearch, setActiveSearch] = useState('');
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [handle, setHandle] = useState('');
  const [avatar, setAvatar] = useState<AccountAvatar>('quiz-bot');
  const [reason, setReason] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const selected = accounts.find((account) => account.uid === selectedUid) ?? accounts[0];
  const profileChanged = Boolean(selected && (handle !== selected.handle || avatar !== selected.avatar));
  const reasonValid = reason.trim().length >= 5 && reason.trim().length <= 300;

  useEffect(() => { void loadAccounts('', false); }, []);

  useEffect(() => {
    if (!selected) {
      setSelectedUid('');
      return;
    }
    if (selected.uid !== selectedUid) setSelectedUid(selected.uid);
    setHandle(selected.handle);
    setAvatar(selected.avatar);
    setReason('');
  }, [selected?.uid]);

  async function loadAccounts(query: string, append: boolean) {
    setIsLoading(true);
    try {
      const result = await fetchAdminAccounts(query, append ? nextCursor ?? '' : '');
      setAccounts((current) => append ? [...current, ...result.accounts] : result.accounts);
      setNextCursor(result.nextCursor);
      if (!append) setSelectedUid(result.accounts[0]?.uid ?? '');
    } catch (error) {
      onToast('error', error instanceof Error ? error.message : 'Could not load account profiles.');
    } finally {
      setIsLoading(false);
    }
  }

  function replaceAccount(account: AdminAccountProfile) {
    setAccounts((current) => current.map((item) => item.uid === account.uid ? account : item));
    setSelectedUid(account.uid);
    setHandle(account.handle);
    setAvatar(account.avatar);
    setReason('');
  }

  async function saveProfile() {
    if (!selected || !profileChanged || !reasonValid) return;
    setIsSaving(true);
    try {
      const account = await updateAdminAccount({
        uid: selected.uid,
        reason: reason.trim(),
        ...(handle !== selected.handle ? { handle } : {}),
        ...(avatar !== selected.avatar ? { avatar } : {})
      });
      replaceAccount(account);
      onToast('success', `@${account.handle} was updated and the moderation action was logged.`);
    } catch (error) {
      onToast('error', error instanceof Error ? error.message : 'Could not update that profile.');
    } finally {
      setIsSaving(false);
    }
  }

  async function removeAttribution() {
    if (!selected?.attributionEnabled || !reasonValid) return;
    setIsSaving(true);
    try {
      const account = await updateAdminAccount({ uid: selected.uid, reason: reason.trim(), attributionEnabled: false });
      replaceAccount(account);
      onToast('success', 'Public creator attribution was removed.');
    } catch (error) {
      onToast('error', error instanceof Error ? error.message : 'Could not remove attribution.');
    } finally {
      setIsSaving(false);
    }
  }

  async function runAction(action: 'revoke-sessions' | 'suspend' | 'restore') {
    if (!selected || !reasonValid) return;
    const label = action === 'revoke-sessions' ? 'revoke every active session' : action === 'suspend' ? 'suspend this account' : 'restore this account';
    if (!window.confirm(`Are you sure you want to ${label} for @${selected.handle}?`)) return;
    setIsSaving(true);
    try {
      const account = await applyAdminAccountAction({ uid: selected.uid, reason: reason.trim(), action });
      replaceAccount(account);
      onToast('success', action === 'suspend' ? 'Account suspended and sessions revoked.' : action === 'restore' ? 'Account access restored.' : 'All account sessions were revoked.');
    } catch (error) {
      onToast('error', error instanceof Error ? error.message : 'Could not complete that account action.');
    } finally {
      setIsSaving(false);
    }
  }

  return <section className="admin-account-manager" aria-labelledby="admin-accounts-title">
    <div className="admin-accounts-heading">
      <div><span className="admin-setting-icon"><Users size={22} /></span><div><h2 id="admin-accounts-title">Account moderation</h2><p>Search private profiles and apply narrowly scoped, audited corrections.</p></div></div>
      <form onSubmit={(event) => { event.preventDefault(); const query = searchInput.trim(); setActiveSearch(query); void loadAccounts(query, false); }}>
        <label><span className="sr-only">Search accounts</span><Search size={16} /><input value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="Handle, email, or exact UID" /></label>
        <button className="secondary-button" type="submit">Search</button>
        <button className="ghost-button" type="button" disabled={isLoading} onClick={() => void loadAccounts(activeSearch, false)}><RotateCcw size={16} />Refresh</button>
        {activeSearch && <button className="ghost-button" type="button" onClick={() => { setSearchInput(''); setActiveSearch(''); void loadAccounts('', false); }}>Clear</button>}
      </form>
    </div>

    {isLoading && accounts.length === 0 ? <div className="empty-state admin-empty">Loading account profiles...</div> : accounts.length === 0 ? <div className="empty-state admin-empty">No matching accounts.</div> : <div className="account-manager-layout">
      <aside className="account-sidebar" aria-label="Account profiles">
        {accounts.map((account) => <button className={account.uid === selected?.uid ? 'account-manager-item active' : 'account-manager-item'} onClick={() => setSelectedUid(account.uid)} key={account.uid}>
          <AvatarBadge avatar={account.avatar} />
          <span><strong>@{account.handle}</strong><small>{account.email}</small></span>
          <em className={account.status}>{account.admin ? 'admin' : account.status}</em>
        </button>)}
        {nextCursor && !activeSearch && <button className="ghost-button account-load-more" disabled={isLoading} onClick={() => void loadAccounts('', true)}>{isLoading ? <Loader2 className="spin" size={16} /> : null}Load more</button>}
      </aside>

      {selected && <div className="account-manager-editor">
        <header><AvatarBadge avatar={avatar} size="large" /><div><h2>@{selected.handle}</h2><p>{selected.email}</p><span>{selected.emailVerified ? 'Verified email' : 'Unverified email'} · {selected.providers.join(', ') || 'Unknown provider'}</span></div><strong className={`account-status ${selected.status}`}>{selected.disabled ? 'Suspended' : selected.status}</strong></header>
        <dl className="account-metadata"><div><dt>Firebase UID</dt><dd>{selected.uid}</dd></div><div><dt>Created</dt><dd>{formatAccountDate(selected.createdAt)}</dd></div><div><dt>Last active</dt><dd>{formatAccountDate(selected.lastActiveAt)}</dd></div><div><dt>Last sign-in</dt><dd>{formatAccountDate(selected.lastSignInAt)}</dd></div></dl>
        <div className="account-moderation-fields">
          <label className="field"><span>Handle</span><input minLength={3} maxLength={24} pattern="[a-z0-9_]+" value={handle} onChange={(event) => setHandle(event.target.value.toLowerCase())} /></label>
          <label className="field"><span>Preset avatar</span><select value={avatar} onChange={(event) => setAvatar(event.target.value as AccountAvatar)}>{ACCOUNT_AVATARS.map((option) => <option value={option} key={option}>{option.replaceAll('-', ' ')}</option>)}</select></label>
        </div>
        <label className="field"><span>Moderation reason</span><textarea maxLength={300} value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Required for the private audit log" /><small>5–300 characters. The user does not see this internal note.</small></label>
        <div className="account-moderation-summary"><span>Public attribution: <strong>{selected.attributionEnabled ? 'enabled' : 'off'}</strong></span><span>Administrator claim: <strong>{selected.admin ? 'yes' : 'no'}</strong></span></div>
        <div className="button-row account-profile-actions">
          <button className="primary-button" disabled={isSaving || !reasonValid || !profileChanged || !/^[a-z0-9_]{3,24}$/.test(handle)} onClick={saveProfile}>{isSaving ? <Loader2 className="spin" size={17} /> : <Check size={17} />}Save profile correction</button>
          <button className="secondary-button" disabled={isSaving || !reasonValid || !selected.attributionEnabled} onClick={removeAttribution}>Remove public attribution</button>
        </div>
        <div className="button-row account-security-actions">
          <button className="ghost-button" disabled={isSaving || !reasonValid} onClick={() => void runAction('revoke-sessions')}><KeyRound size={17} />Revoke sessions</button>
          {selected.disabled || selected.status === 'suspended' ? <button className="secondary-button" disabled={isSaving || !reasonValid} onClick={() => void runAction('restore')}><UserCheck size={17} />Restore access</button> : <button className="danger-button" disabled={isSaving || !reasonValid || selected.uid === currentAdministratorUid} title={selected.uid === currentAdministratorUid ? 'You cannot suspend your own administrator account.' : undefined} onClick={() => void runAction('suspend')}><Ban size={17} />Suspend account</button>}
        </div>
        <p className="account-moderation-boundary">Email addresses, administrator claims, and learning records cannot be changed here.</p>
      </div>}
    </div>}
  </section>;
}

function formatAccountDate(value?: string): string {
  if (!value) return 'Not recorded';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) || date.getUTCFullYear() === 1970 ? 'Not recorded' : date.toLocaleString();
}

function AdminDatasetManager({
  datasets,
  isLoading,
  onChanged,
  onToast
}: {
  datasets: PublicDataset[];
  isLoading: boolean;
  onChanged: () => Promise<void>;
  onToast: (kind: ToastKind, message: string) => void;
}) {
  const [selectedId, setSelectedId] = useState('');
  const [raw, setRaw] = useState('');
  const [status, setStatus] = useState<'approved' | 'pending'>('approved');
  const [isSaving, setIsSaving] = useState(false);
  const selected = datasets.find((dataset) => dataset.id === selectedId) ?? datasets[0];
  const parsed = useMemo(() => raw ? parseDataset(raw) : { dataset: null as DatasetInput | null, errors: [] }, [raw]);

  useEffect(() => {
    if (!selected) {
      setSelectedId('');
      setRaw('');
      return;
    }

    if (!selectedId || selected.id !== selectedId) {
      setSelectedId(selected.id);
    }

    setRaw(JSON.stringify({
      title: selected.title,
      description: selected.description,
      tags: selected.tags,
      shuffleQuestions: Boolean(selected.shuffleQuestions),
      kind: selected.kind,
      curated: selected.curated,
      examCode: selected.examCode,
      blueprintVersion: selected.blueprintVersion,
      durationMinutes: selected.durationMinutes,
      readinessTarget: selected.readinessTarget,
      domains: selected.domains,
      items: selected.items
    }, null, 2));
    setStatus(selected.status ?? 'approved');
  }, [selected?.id]);

  async function save() {
    if (!selected || !parsed.dataset) return;
    setIsSaving(true);
    try {
      await updateAdminDataset(selected.id, parsed.dataset, status);
      onToast('success', `"${parsed.dataset.title}" saved.`);
      await onChanged();
    } catch (error) {
      onToast('error', error instanceof Error ? error.message : 'Could not save dataset.');
    } finally {
      setIsSaving(false);
    }
  }

  async function remove() {
    if (!selected) return;
    const confirmed = window.confirm(`Delete "${selected.title}"? This cannot be undone.`);
    if (!confirmed) return;

    setIsSaving(true);
    try {
      await deleteAdminDataset(selected.id);
      onToast('success', 'Dataset deleted.');
      setSelectedId('');
      await onChanged();
    } catch (error) {
      onToast('error', error instanceof Error ? error.message : 'Could not delete dataset.');
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return <div className="empty-state admin-empty">Loading admin datasets...</div>;
  }

  if (datasets.length === 0) {
    return <div className="empty-state admin-empty">No datasets to manage yet.</div>;
  }

  return (
    <div className="manager-layout">
      <aside className="dataset-sidebar">
        {datasets.map((dataset) => (
          <button className={dataset.id === selected?.id ? 'manager-item active' : 'manager-item'} key={dataset.id} onClick={() => setSelectedId(dataset.id)}>
            <span>{dataset.title}</span>
            <strong>{dataset.status ?? 'approved'}</strong>
          </button>
        ))}
      </aside>
      <div className="manager-editor">
        <div className="manager-heading">
          <div>
            <h2>{selected?.title}</h2>
            <p>Edit the dataset JSON, then save it as approved or pending.</p>
          </div>
          <select value={status} onChange={(event) => setStatus(event.target.value as 'approved' | 'pending')}>
            <option value="approved">Approved</option>
            <option value="pending">Pending</option>
          </select>
        </div>
        <textarea value={raw} spellCheck={false} onChange={(event) => setRaw(event.target.value)} aria-label="Editable dataset JSON" />
        {parsed.errors.length > 0 && (
          <div className="validation-list" role="status">{parsed.errors.map((error) => <p key={error}>{error}</p>)}</div>
        )}
        <div className="button-row manager-actions">
          <button className="danger-button" disabled={isSaving} onClick={remove}>Delete</button>
          <button className="primary-button" disabled={isSaving || !parsed.dataset || parsed.errors.length > 0} onClick={save}>
            {isSaving ? <Loader2 className="spin" size={17} /> : <Check size={17} />}
            Save changes
          </button>
        </div>
      </div>
    </div>
  );
}
