import { Upload } from 'lucide-react';
import type { PublicConfig, PublicDataset } from '../../shared/quiz';
import { UploadPanel } from '../components/UploadPanel';
import type { ToastKind } from '../types';

export function PublicUploadPage({
  config,
  onUploaded,
  onToast
}: {
  config: PublicConfig;
  onUploaded: (dataset: PublicDataset) => void;
  onToast: (kind: ToastKind, message: string) => void;
}) {
  return (
    <section className="public-upload-page">
      <div className="section-title upload-title">
        <p className="eyebrow"><Upload size={16} /> share a set</p>
        <h1>Upload</h1>
      </div>
      <div className="upload-intro">
        <strong>Public submissions</strong>
        <span>
          {config.uploadKeyRequired
            ? 'An upload key is required. If approval is enabled, your set will wait for admin review.'
            : 'No upload key is required right now. If approval is enabled, your set will wait for admin review.'}
        </span>
      </div>
      <UploadPanel mode="public" publicConfig={config} onUploaded={onUploaded} onToast={onToast} />
    </section>
  );
}
