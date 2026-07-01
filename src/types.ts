export type ToastKind = 'success' | 'error' | 'info';

export type Toast = {
  id: number;
  kind: ToastKind;
  message: string;
};

export type AppRoute =
  | { name: 'home'; path: '/' }
  | { name: 'gallery'; path: '/gallery' }
  | { name: 'upload'; path: '/upload' }
  | { name: 'admin'; path: '/admin' }
  | { name: 'quiz-menu'; path: string; slug: string }
  | { name: 'quiz-play'; path: string; slug: string };

export type Navigate = (path: string) => void;
