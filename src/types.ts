export type ToastKind = 'success' | 'error' | 'info';

export type Toast = {
  id: number;
  kind: ToastKind;
  message: string;
  createdAt: number;
};

export type AppRoute =
  | { name: 'home'; path: '/' }
  | { name: 'gallery'; path: '/gallery' }
  | { name: 'upload'; path: '/upload' }
  | { name: 'admin'; path: '/admin' }
  | { name: 'quiz-menu'; path: string; slug: string }
  | { name: 'quiz-practice'; path: string; slug: string }
  | { name: 'quiz-exam'; path: string; slug: string }
  | { name: 'quiz-result'; path: string; slug: string; attemptId: string };

export type Navigate = (path: string) => void;
