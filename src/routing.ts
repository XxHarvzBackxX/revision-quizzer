import type { AppRoute } from './types';

export function parseRoute(pathname = window.location.pathname): AppRoute {
  if (pathname === '/gallery') return { name: 'gallery', path: pathname };
  if (pathname === '/upload') return { name: 'upload', path: pathname };
  if (pathname === '/admin') return { name: 'admin', path: pathname };

  const playMatch = pathname.match(/^\/quiz\/([^/]+)\/play$/);
  if (playMatch?.[1]) {
    return { name: 'quiz-play', path: pathname, slug: decodeURIComponent(playMatch[1]) };
  }

  const quizMatch = pathname.match(/^\/quiz\/([^/]+)$/);
  if (quizMatch?.[1]) {
    return { name: 'quiz-menu', path: pathname, slug: decodeURIComponent(quizMatch[1]) };
  }

  return { name: 'home', path: '/' };
}

export function routeClass(route: AppRoute): string {
  return route.name === 'quiz-play' ? 'quiz-play' : route.name;
}
