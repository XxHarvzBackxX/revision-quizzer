import { Check, KeyRound, Loader2, Lock, RotateCcw, Shield } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { DatasetInput, PublicDataset } from '../../shared/quiz';
import {
  deleteAdminDataset,
  fetchAdminConfig,
  fetchAdminDatasets,
  loginAdmin,
  updateAdminConfig,
  updateAdminDataset
} from '../api';
import { UploadPanel } from '../components/UploadPanel';
import type { ToastKind } from '../types';
import { parseDataset } from '../utils/quizUi';

export function AdminPage({
  onUploaded,
  onToast
}: {
  onUploaded: (dataset: PublicDataset) => void;
  onToast: (kind: ToastKind, message: string) => void;
}) {
  const [password, setPassword] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  async function submitLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoggingIn(true);
    try {
      await loginAdmin(password);
      setAdminPassword(password);
      setPassword('');
      onToast('success', 'Admin unlocked.');
    } catch (error) {
      onToast('error', error instanceof Error ? error.message : 'Could not log in.');
    } finally {
      setIsLoggingIn(false);
    }
  }

  if (!adminPassword) {
    return (
      <section className="admin-login">
        <form className="login-panel" onSubmit={submitLogin}>
          <div className="lock-badge"><Shield size={32} /></div>
          <h1>Admin access</h1>
          <p>This page is intentionally hidden from navigation.</p>
          <label className="field">
            <span>Admin password</span>
            <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" autoFocus />
          </label>
          <button className="primary-button big" disabled={!password || isLoggingIn}>
            {isLoggingIn ? <Loader2 className="spin" size={18} /> : <KeyRound size={18} />}
            Unlock uploader
          </button>
        </form>
      </section>
    );
  }

  return <AdminConsole adminPassword={adminPassword} onUploaded={onUploaded} onToast={onToast} />;
}

function AdminConsole({
  adminPassword,
  onUploaded,
  onToast
}: {
  adminPassword: string;
  onUploaded: (dataset: PublicDataset) => void;
  onToast: (kind: ToastKind, message: string) => void;
}) {
  const [tab, setTab] = useState<'upload' | 'datasets'>('upload');
  const [adminDatasets, setAdminDatasets] = useState<PublicDataset[]>([]);
  const [moderationEnabled, setModerationEnabled] = useState(false);
  const [uploadKey, setUploadKey] = useState('');
  const [isLoadingAdmin, setIsLoadingAdmin] = useState(true);

  useEffect(() => {
    void refreshAdmin();
  }, []);

  async function refreshAdmin() {
    setIsLoadingAdmin(true);
    try {
      const [config, datasets] = await Promise.all([
        fetchAdminConfig(adminPassword),
        fetchAdminDatasets(adminPassword)
      ]);
      setModerationEnabled(config.moderationEnabled);
      setUploadKey(config.uploadKey);
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
      const config = await updateAdminConfig({ moderationEnabled: value, uploadKey }, adminPassword);
      setModerationEnabled(config.moderationEnabled);
      setUploadKey(config.uploadKey);
      onToast('success', config.moderationEnabled ? 'Approval gate enabled.' : 'Approval gate disabled.');
    } catch (error) {
      setModerationEnabled(!value);
      onToast('error', error instanceof Error ? error.message : 'Could not update moderation setting.');
    }
  }

  async function saveUploadKey() {
    try {
      const config = await updateAdminConfig({ moderationEnabled, uploadKey }, adminPassword);
      setModerationEnabled(config.moderationEnabled);
      setUploadKey(config.uploadKey);
      onToast('success', config.uploadKey ? 'Upload key saved.' : 'Upload key cleared; public uploads are open.');
    } catch (error) {
      onToast('error', error instanceof Error ? error.message : 'Could not save upload key.');
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
        <label className="admin-key-field">
          <span>Upload key</span>
          <input value={uploadKey} onChange={(event) => setUploadKey(event.target.value)} placeholder="Leave blank for open uploads" />
        </label>
        <button className="ghost-button" onClick={saveUploadKey}>Save key</button>
        <button className="ghost-button" onClick={refreshAdmin}>
          {isLoadingAdmin ? <Loader2 className="spin" size={16} /> : <RotateCcw size={16} />}
          Refresh
        </button>
      </div>

      {tab === 'upload' ? (
        <UploadPanel adminPassword={adminPassword} mode="admin" onUploaded={(dataset) => {
          onUploaded(dataset);
          void refreshAdmin();
        }} onToast={onToast} />
      ) : (
        <AdminDatasetManager
          adminPassword={adminPassword}
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
  adminPassword,
  datasets,
  isLoading,
  onChanged,
  onToast
}: {
  adminPassword: string;
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
      items: selected.items
    }, null, 2));
    setStatus(selected.status ?? 'approved');
  }, [selected?.id]);

  async function save() {
    if (!selected || !parsed.dataset) return;
    setIsSaving(true);
    try {
      await updateAdminDataset(selected.id, parsed.dataset, status, adminPassword);
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
      await deleteAdminDataset(selected.id, adminPassword);
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
