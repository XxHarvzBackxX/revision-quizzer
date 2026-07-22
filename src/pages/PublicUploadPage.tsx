import { Upload } from 'lucide-react';
import type { PublicConfig, PublicDataset } from '../../shared/quiz';
import { UploadPanel } from '../components/UploadPanel';
import type { ToastKind } from '../types';
import { useAccount } from '../account/AccountContext';
import { PlayerIdentity } from '../account/PlayerIdentity';
import type { Navigate } from '../types';

export function PublicUploadPage({
  config,
  onUploaded,
  onToast,
  navigate
}: {
  config: PublicConfig;
  onUploaded: (dataset: PublicDataset) => void;
  onToast: (kind: ToastKind, message: string) => void;
  navigate: Navigate;
}) {
  const { account } = useAccount();
  if (!account) return <section className="public-upload-page"><div className="account-guest-card"><Upload size={34} /><h1>Sign in to share a set</h1><p>Account ownership helps us moderate submissions and lets you manage or remove your work later.</p><button className="primary-button" onClick={() => navigate('/login')}>Sign in</button><button className="ghost-button" onClick={() => navigate('/community-guidelines')}>Read the guidelines</button></div></section>;
  return (
    <section className="public-upload-page">
      <div className="section-title upload-title">
        <p className="eyebrow"><Upload size={16} /> share a set</p>
        <h1>Upload</h1>
      </div>
      <div className="upload-intro">
        <div className="upload-intro-copy"><strong>Public submissions</strong><span>Submissions are linked privately to your account and may wait for moderator approval.</span></div>
        <PlayerIdentity account={account} label={account.attributionEnabled ? 'Public attribution enabled' : 'Submitting privately'} actionLabel="Profile settings" className="upload-player-identity" onOpen={() => navigate('/account')} />
      </div>
      <UploadPanel mode="public" publicConfig={config} onUploaded={onUploaded} onToast={onToast} />
      <p className="upload-policy-note">Submit only original or licensed material. Do not upload real exam dumps or personal information. See the Community Guidelines.</p>
    </section>
  );
}
