import { BookOpenText, BrainCircuit, Library, Upload } from 'lucide-react';
import type { AppRoute, Navigate } from '../types';
import { ThemePicker } from './ThemePicker';

export function Topbar({ route, navigate }: { route: AppRoute; navigate: Navigate }) {
  return (
    <header className="topbar">
      <button className="brand-button" onClick={() => navigate('/')} aria-label="Open home">
        <span className="brand-mark"><BrainCircuit size={23} /></span>
        <span>
          <strong>Quiz Arcade</strong>
          <small>Certification prep with a pulse</small>
        </span>
      </button>
      <div className="topbar-tools">
        <nav className="nav-actions">
          <button className={route.name === 'home' ? 'nav-button active' : 'nav-button'} onClick={() => navigate('/')}>Home</button>
          <button className={route.name === 'gallery' ? 'nav-button active' : 'nav-button'} onClick={() => navigate('/gallery')}>
            <Library size={17} /> Exam library
          </button>
          <button className={route.name.startsWith('wiki') ? 'nav-button active' : 'nav-button'} onClick={() => navigate('/wiki')}>
            <BookOpenText size={17} /> RevisionWiki
          </button>
          <button className={route.name === 'upload' ? 'nav-button active' : 'nav-button'} onClick={() => navigate('/upload')}>
            <Upload size={17} /> Share a set
          </button>
        </nav>
        <ThemePicker />
      </div>
    </header>
  );
}
