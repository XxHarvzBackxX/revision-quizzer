import type { AppRoute } from './types';

export function parseRoute(pathname = window.location.pathname): AppRoute {
  if (pathname === '/gallery') return { name: 'gallery', path: pathname };
  if (pathname === '/upload') return { name: 'upload', path: pathname };
  if (pathname === '/admin') return { name: 'admin', path: pathname };
  if (pathname === '/wiki' || pathname === '/wiki/') return { name: 'wiki', path: '/wiki' };

  const wikiPageMatch = pathname.match(/^\/wiki\/([^/]+)\/([^/]+)\/?$/);
  if (wikiPageMatch?.[1] && wikiPageMatch[2]) {
    return { name: 'wiki-page', path: pathname, examCode: decodeURIComponent(wikiPageMatch[1]), pageSlug: decodeURIComponent(wikiPageMatch[2]) };
  }

  const wikiCourseMatch = pathname.match(/^\/wiki\/([^/]+)\/?$/);
  if (wikiCourseMatch?.[1]) {
    return { name: 'wiki-course', path: pathname, examCode: decodeURIComponent(wikiCourseMatch[1]) };
  }

  const resultMatch = pathname.match(/^\/quiz\/([^/]+)\/results\/([^/]+)$/);
  if (resultMatch?.[1] && resultMatch[2]) {
    return {
      name: 'quiz-result',
      path: pathname,
      slug: decodeURIComponent(resultMatch[1]),
      attemptId: decodeURIComponent(resultMatch[2])
    };
  }

  const examMatch = pathname.match(/^\/quiz\/([^/]+)\/exam$/);
  if (examMatch?.[1]) {
    return { name: 'quiz-exam', path: pathname, slug: decodeURIComponent(examMatch[1]) };
  }

  const practiceMatch = pathname.match(/^\/quiz\/([^/]+)\/(?:practice|play)$/);
  if (practiceMatch?.[1]) {
    return { name: 'quiz-practice', path: pathname, slug: decodeURIComponent(practiceMatch[1]) };
  }

  const quizMatch = pathname.match(/^\/quiz\/([^/]+)$/);
  if (quizMatch?.[1]) {
    return { name: 'quiz-menu', path: pathname, slug: decodeURIComponent(quizMatch[1]) };
  }

  return { name: 'home', path: '/' };
}

export function routeClass(route: AppRoute): string {
  if (route.name === 'quiz-practice') return 'quiz-play practice-mode';
  if (route.name === 'quiz-exam') return 'quiz-play exam-mode';
  if (route.name === 'quiz-result') return 'quiz-result';
  if (route.name === 'wiki' || route.name === 'wiki-course' || route.name === 'wiki-page') return route.name;
  return route.name;
}
