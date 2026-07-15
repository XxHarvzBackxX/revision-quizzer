import type { AppRoute } from './types';

export function parseRoute(pathname = window.location.pathname): AppRoute {
  if (pathname === '/gallery') return { name: 'gallery', path: pathname };
  if (pathname === '/upload') return { name: 'upload', path: pathname };
  if (pathname === '/admin') return { name: 'admin', path: pathname };
  if (pathname === '/wiki' || pathname === '/wiki/') return { name: 'wiki', path: '/wiki' };
  if (pathname === '/study' || pathname === '/study/') return { name: 'study-index', path: '/study' };

  const studyResultMatch = pathname.match(/^\/study\/([^/]+)\/drill\/results\/([^/]+)\/?$/);
  if (studyResultMatch?.[1] && studyResultMatch[2]) {
    return { name: 'study-drill-result', path: pathname, examCode: decodeURIComponent(studyResultMatch[1]), attemptId: decodeURIComponent(studyResultMatch[2]) };
  }

  const studyPlayMatch = pathname.match(/^\/study\/([^/]+)\/drill\/play\/?$/);
  if (studyPlayMatch?.[1]) return { name: 'study-drill-play', path: pathname, examCode: decodeURIComponent(studyPlayMatch[1]) };

  const studySetupMatch = pathname.match(/^\/study\/([^/]+)\/drill\/?$/);
  if (studySetupMatch?.[1]) return { name: 'study-drill-setup', path: pathname, examCode: decodeURIComponent(studySetupMatch[1]) };

  const studyHubMatch = pathname.match(/^\/study\/([^/]+)\/?$/);
  if (studyHubMatch?.[1]) return { name: 'study-hub', path: pathname, examCode: decodeURIComponent(studyHubMatch[1]) };

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
  if (route.name === 'study-drill-play') return 'quiz-play practice-mode study-drill-mode';
  if (route.name === 'study-drill-result') return 'quiz-result study-drill-result';
  if (route.name === 'study-index' || route.name === 'study-hub' || route.name === 'study-drill-setup') return route.name;
  if (route.name === 'quiz-practice') return 'quiz-play practice-mode';
  if (route.name === 'quiz-exam') return 'quiz-play exam-mode';
  if (route.name === 'quiz-result') return 'quiz-result';
  if (route.name === 'wiki' || route.name === 'wiki-course' || route.name === 'wiki-page') return route.name;
  return route.name;
}
