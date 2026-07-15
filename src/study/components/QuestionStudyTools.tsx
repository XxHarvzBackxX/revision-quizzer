import { Bookmark, MessageSquareText, Save, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { PublicDataset, QuizItem } from '../../../shared/quiz';
import { questionIdentity, saveBookmarkNote, toggleStudyBookmark, useStudyState } from '../storage';

export function QuestionStudyTools({ dataset, item, questionIndex }: {
  dataset: PublicDataset;
  item: QuizItem;
  questionIndex: number;
}) {
  const state = useStudyState();
  const identity = questionIdentity(dataset, item, questionIndex);
  const bookmark = state.bookmarks[identity.key];
  const [noteOpen, setNoteOpen] = useState(false);
  const [note, setNote] = useState(bookmark?.note ?? '');

  useEffect(() => setNote(bookmark?.note ?? ''), [bookmark?.note]);

  const input = {
    ...identity,
    examCode: dataset.examCode?.toUpperCase() ?? 'COMMUNITY',
    prompt: item.prompt
  };

  return (
    <div className="question-study-tools">
      <button
        type="button"
        className={bookmark ? 'active' : ''}
        aria-pressed={Boolean(bookmark)}
        onClick={() => toggleStudyBookmark(input)}
      >
        <Bookmark size={15} fill={bookmark ? 'currentColor' : 'none'} /> {bookmark ? 'Saved' : 'Save question'}
      </button>
      <button type="button" className={bookmark?.note ? 'active' : ''} onClick={() => setNoteOpen((open) => !open)}>
        <MessageSquareText size={15} /> {bookmark?.note ? 'Edit note' : 'Add note'}
      </button>
      {noteOpen && (
        <div className="question-note-editor">
          <label>Personal note<textarea value={note} maxLength={500} onChange={(event) => setNote(event.target.value)} placeholder="Why was this tricky? What should you remember?" /></label>
          <span>{note.length}/500</span>
          <div>
            <button type="button" onClick={() => setNoteOpen(false)}><X size={14} /> Cancel</button>
            <button type="button" className="primary-button" onClick={() => { saveBookmarkNote(input, note); setNoteOpen(false); }}><Save size={14} /> Save note</button>
          </div>
        </div>
      )}
    </div>
  );
}
