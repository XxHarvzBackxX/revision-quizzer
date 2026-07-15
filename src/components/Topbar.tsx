import { BrainCircuit, Library, Upload } from 'lucide-react';
import type { AppRoute, Navigate } from '../types';

export function Topbar({ route, navigate }: { route: AppRoute; navigate: Navigate }) {
  return (
    <header className="topbar">
      <button className="brand-button" onClick={() => navigate('/')} aria-label="Open home">
        <span className="brand-mark"><BrainCircuit size={23} /></span>
        <span>
          <strong>Quiz Arcade</strong>
          <small>Serious prep, better practice</small>
        </span>
      </button>
      <nav className="nav-actions">
        <button className={route.name === 'home' ? 'nav-button active' : 'nav-button'} onClick={() => navigate('/')}>Home</button>
        <button className={route.name === 'gallery' ? 'nav-button active' : 'nav-button'} onClick={() => navigate('/gallery')}>
          <Library size={17} /> Exam library
        </button>
        <button className={route.name === 'upload' ? 'nav-button active' : 'nav-button'} onClick={() => navigate('/upload')}>
          <Upload size={17} /> Share a set
        </button>
      </nav>
    </header>
  );
}
