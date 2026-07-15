import { Search, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { Navigate } from '../../types';
import { searchRevisionContent } from '../registry';
import { setRevisionSearchScope, useRevisionState } from '../storage';

export function RevisionSearch({ examCode, navigate, compact = false }: { examCode?: string; navigate: Navigate; compact?: boolean }) {
  const [query, setQuery] = useState('');
  const state = useRevisionState();
  const scope = examCode ? state.preferences.searchScope : 'all';
  const scopedExamCode = scope === 'course' ? examCode : undefined;
  const results = useMemo(() => searchRevisionContent(query, scopedExamCode), [query, scopedExamCode]);

  function open(courseCode: string, pageSlug: string, blockId?: string) {
    setQuery('');
    navigate(`/wiki/${courseCode.toLowerCase()}/${pageSlug}${blockId ? `#${encodeURIComponent(blockId)}` : ''}`);
  }

  return (
    <div className={`revision-search ${compact ? 'compact' : ''}`}>
      <label><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={scope === 'course' && examCode ? `Search ${examCode} notes` : 'Search every revision page'} />{query && <button onClick={() => setQuery('')} aria-label="Clear search"><X size={15} /></button>}</label>
      {examCode && <div className="revision-search-scope"><button className={scope === 'course' ? 'active' : ''} onClick={() => setRevisionSearchScope('course')}>{examCode}</button><button className={scope === 'all' ? 'active' : ''} onClick={() => setRevisionSearchScope('all')}>All guides</button></div>}
      {query.trim().length > 1 && (
        <div className="revision-search-results">
          {results.length ? results.slice(0, compact ? 7 : 12).map((result) => (
            <button key={`${result.courseCode}-${result.pageId}-${result.blockId ?? 'page'}`} onClick={() => open(result.courseCode, result.pageSlug, result.blockId)}>
              <span>{result.courseCode}{result.section ? ` · ${result.section}` : ''}</span>
              <strong>{result.title}</strong>
              <small>{result.excerpt}</small>
            </button>
          )) : <p>No revision sections match “{query}”.</p>}
        </div>
      )}
    </div>
  );
}
