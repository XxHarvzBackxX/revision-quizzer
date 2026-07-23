import { Loader2, Plus, Trash2, Upload } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { DatasetInput, PublicConfig, PublicDataset, QuizItemType } from '../../shared/quiz';
import { uploadDataset } from '../api';
import type { ToastKind } from '../types';
import { parseDataset, sampleDataset } from '../utils/quizUi';

type UploadState = {
  raw: string;
  dataset: DatasetInput | null;
  errors: string[];
};
type FriendlyItemType = Exclude<QuizItemType, 'multi-select' | 'dropdown' | 'statement-group'>;
type FriendlyItem = {
  type: FriendlyItemType;
  prompt: string;
  answer: string;
  options: string[];
};

export function UploadPanel({
  mode,
  publicConfig,
  onUploaded,
  onToast
}: {
  mode: 'admin' | 'public';
  publicConfig?: PublicConfig;
  onUploaded: (dataset: PublicDataset) => void;
  onToast: (kind: ToastKind, message: string) => void;
}) {
  const [uploadMode, setUploadMode] = useState<'friendly' | 'json'>('friendly');
  const [state, setState] = useState<UploadState>({ raw: sampleDataset, dataset: null, errors: [] });
  const [friendlyTitle, setFriendlyTitle] = useState('');
  const [friendlyDescription, setFriendlyDescription] = useState('');
  const [friendlyTags, setFriendlyTags] = useState('');
  const [friendlyShuffle, setFriendlyShuffle] = useState(false);
  const [friendlyItems, setFriendlyItems] = useState<FriendlyItem[]>([
    { type: 'multiple-choice', prompt: '', answer: '', options: ['', '', '', ''] }
  ]);
  const [isUploading, setIsUploading] = useState(false);
  const friendlyDataset = useMemo(() => createFriendlyDataset(friendlyTitle, friendlyDescription, friendlyTags, friendlyShuffle, friendlyItems), [friendlyTitle, friendlyDescription, friendlyTags, friendlyShuffle, friendlyItems]);
  const parsed = useMemo(() => uploadMode === 'json' ? parseDataset(state.raw) : validateFriendlyDataset(friendlyDataset), [friendlyDataset, state.raw, uploadMode]);

  useEffect(() => {
    setState((current) => ({ ...current, dataset: parsed.dataset, errors: parsed.errors }));
  }, [parsed.dataset, parsed.errors]);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    const raw = await file.text();
    setState((current) => ({ ...current, raw }));
  }

  async function submit() {
    const dataset = uploadMode === 'json' ? state.dataset : parsed.dataset;
    if (!dataset) return;
    setIsUploading(true);
    try {
      onUploaded(await uploadDataset(dataset));
    } catch (error) {
      onToast('error', error instanceof Error ? error.message : 'Upload failed.');
    } finally {
      setIsUploading(false);
    }
  }

  function updateFriendlyItem(index: number, patch: Partial<FriendlyItem>) {
    setFriendlyItems((items) => items.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item));
  }

  function updateOption(itemIndex: number, optionIndex: number, value: string) {
    setFriendlyItems((items) => items.map((item, index) => {
      if (index !== itemIndex) return item;
      const options = item.options.map((option, currentIndex) => currentIndex === optionIndex ? value : option);
      return { ...item, options };
    }));
  }

  return (
      <div className="upload-layout">
        <div className="upload-editor">
        <div className="segmented-control upload-mode-control">
          <button className={uploadMode === 'friendly' ? 'active' : ''} onClick={() => setUploadMode('friendly')}>Friendly builder</button>
          <button className={uploadMode === 'json' ? 'active' : ''} onClick={() => setUploadMode('json')}>JSON bulk upload</button>
        </div>
        {mode === 'public' && <div className="open-upload-note">Your account owns this submission. It may wait for moderator approval.</div>}
        {uploadMode === 'friendly' ? (
          <div className="friendly-builder">
            <label className="field">
              <span>Quiz title</span>
              <input value={friendlyTitle} onChange={(event) => setFriendlyTitle(event.target.value)} />
            </label>
            <label className="field">
              <span>Description</span>
              <input value={friendlyDescription} onChange={(event) => setFriendlyDescription(event.target.value)} />
            </label>
            <label className="field">
              <span>Tags</span>
              <input value={friendlyTags} onChange={(event) => setFriendlyTags(event.target.value)} placeholder="biology, gcse, cells" />
            </label>
            <label className="toggle-row friendly-toggle">
              <input type="checkbox" checked={friendlyShuffle} onChange={(event) => setFriendlyShuffle(event.target.checked)} />
              <span>Shuffle question order each round</span>
            </label>
            <div className="friendly-items">
              {friendlyItems.map((item, index) => (
                <div className="friendly-item" key={index}>
                  <div className="friendly-item-header">
                    <strong>Question {index + 1}</strong>
                    <button className="icon-button dark" disabled={friendlyItems.length === 1} onClick={() => setFriendlyItems((items) => items.filter((_, itemIndex) => itemIndex !== index))} aria-label="Remove question">
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <label className="field">
                    <span>Type</span>
                    <select value={item.type} onChange={(event) => updateFriendlyItem(index, { type: event.target.value as FriendlyItemType })}>
                      <option value="multiple-choice">Multiple choice</option>
                      <option value="flashcard">Flashcard</option>
                      <option value="free-write">Free write</option>
                    </select>
                  </label>
                  <label className="field">
                    <span>Question</span>
                    <input value={item.prompt} onChange={(event) => updateFriendlyItem(index, { prompt: event.target.value })} />
                  </label>
                  <label className="field">
                    <span>Correct answer</span>
                    <input value={item.answer} onChange={(event) => updateFriendlyItem(index, { answer: event.target.value })} />
                  </label>
                  {item.type === 'multiple-choice' && (
                    <div className="option-editor-grid">
                      {item.options.map((option, optionIndex) => (
                        <label className="field" key={optionIndex}>
                          <span>Option {optionIndex + 1}</span>
                          <input value={option} onChange={(event) => updateOption(index, optionIndex, event.target.value)} />
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
            <button className="ghost-button builder-add" onClick={() => setFriendlyItems((items) => [...items, { type: 'multiple-choice', prompt: '', answer: '', options: ['', '', '', ''] }])}>
              <Plus size={17} /> Add question
            </button>
          </div>
        ) : (
          <>
            <label className="file-picker">
              <Upload size={18} />
              Choose .json file
              <input type="file" accept="application/json,.json" onChange={(event) => handleFile(event.target.files?.[0])} />
            </label>
            <textarea value={state.raw} spellCheck={false} onChange={(event) => setState({ ...state, raw: event.target.value })} aria-label="Dataset JSON" />
          </>
        )}
      </div>
      <div className="upload-preview">
        <h2>Preview</h2>
        {state.errors.length > 0 ? (
          <div className="validation-list" role="status">{state.errors.map((error) => <p key={error}>{error}</p>)}</div>
          ) : parsed.dataset ? (
            <div className="preview-box">
            <strong>{parsed.dataset.title}</strong>
            <p>{parsed.dataset.description || 'No description supplied.'}</p>
            <div className="tag-row">{parsed.dataset.tags?.map((tag) => <span key={tag}>{tag}</span>)}</div>
            <p>{parsed.dataset.items.length} quiz items ready.</p>
            <button className="primary-button" disabled={isUploading} onClick={submit}>
              {isUploading ? <Loader2 className="spin" size={17} /> : <Upload size={17} />}
              {mode === 'admin' ? 'Publish approved set' : 'Submit set'}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function createFriendlyDataset(title: string, description: string, tags: string, shuffleQuestions: boolean, items: FriendlyItem[]): DatasetInput {
  return {
    title,
    description,
    tags: tags.split(',').map((tag) => tag.trim()).filter(Boolean),
    shuffleQuestions,
    items: items.map((item) => {
      if (item.type === 'multiple-choice') {
        return {
          type: item.type,
          prompt: item.prompt,
          answer: item.answer,
          options: item.options
        };
      }

      return {
        type: item.type,
        prompt: item.prompt,
        answer: item.answer
      };
    })
  };
}

function validateFriendlyDataset(dataset: DatasetInput): { dataset: DatasetInput | null; errors: string[] } {
  return parseDataset(JSON.stringify(dataset));
}
