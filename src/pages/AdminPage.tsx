import { Check, Loader2, Lock, Palette, RotateCcw, Shield } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { AdminConfig, DatasetInput, PublicDataset } from '../../shared/quiz';
import {
  deleteAdminDataset,
  fetchAdminConfig,
  fetchAdminDatasets,
  updateAdminConfig,
  updateAdminDataset
} from '../api';
import { UploadPanel } from '../components/UploadPanel';
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

  return <AdminConsole onUploaded={onUploaded} onConfigChanged={onConfigChanged} onToast={onToast} />;
}

function AdminConsole({
  onUploaded,
  onConfigChanged,
  onToast
}: {
  onUploaded: (dataset: PublicDataset) => void;
  onConfigChanged: (config: AdminConfig) => void;
  onToast: (kind: ToastKind, message: string) => void;
}) {
  const [tab, setTab] = useState<'upload' | 'datasets'>('upload');
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
        </div>
        <label className="toggle-row">
          <input type="checkbox" checked={moderationEnabled} onChange={(event) => toggleModeration(event.target.checked)} />
          <span>Require admin approval for upload-key submissions</span>
        </label>
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
      ) : (
        <AdminDatasetManager
          datasets={adminDatasets}
          isLoading={isLoadingAdmin}
          onChanged={refreshAdmin}
          onToast={onToast}
        />
      )}
    </section>
  );
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
