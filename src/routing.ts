import type { AppRoute } from './types';

export function parseRoute(pathname = window.location.pathname): AppRoute {
  if (pathname === '/gallery') return { name: 'gallery', path: pathname };
  if (pathname === '/upload') return { name: 'upload', path: pathname };
  if (pathname === '/admin') return { name: 'admin', path: pathname };
  if (pathname === '/login' || pathname === '/login/') return { name: 'login', path: '/login' };
  if (pathname === '/register' || pathname === '/register/') return { name: 'register', path: '/register' };
  if (pathname === '/forgot-password' || pathname === '/forgot-password/') return { name: 'forgot-password', path: '/forgot-password' };
  if (pathname === '/account' || pathname === '/account/') return { name: 'account', path: '/account' };
  if (pathname === '/privacy' || pathname === '/privacy/') return { name: 'privacy', path: '/privacy' };
  if (pathname === '/terms' || pathname === '/terms/') return { name: 'terms', path: '/terms' };
  if (pathname === '/community-guidelines' || pathname === '/community-guidelines/') return { name: 'community-guidelines', path: '/community-guidelines' };
  if (pathname === '/wiki' || pathname === '/wiki/') return { name: 'wiki', path: '/wiki' };
  if (pathname === '/study' || pathname === '/study/') return { name: 'study-index', path: '/study' };
  if (pathname === '/study/profile' || pathname === '/study/profile/') return { name: 'study-profile', path: '/study/profile' };
  if (pathname === '/study/mistakes' || pathname === '/study/mistakes/') return { name: 'mistake-review', path: '/study/mistakes' };
  if (pathname === '/study/mistakes/play' || pathname === '/study/mistakes/play/') return { name: 'mistake-review-play', path: '/study/mistakes/play' };

  const mistakeResultMatch = pathname.match(/^\/study\/mistakes\/results\/([^/]+)\/?$/);
  if (mistakeResultMatch?.[1]) return { name: 'mistake-review-result', path: pathname, attemptId: decodeURIComponent(mistakeResultMatch[1]) };

  const studyAcademyMatch = pathname.match(/^\/study\/([^/]+)\/academy\/?$/);
  if (studyAcademyMatch?.[1]) return { name: 'study-academy', path: pathname, examCode: decodeURIComponent(studyAcademyMatch[1]) };

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
  if (route.name === 'study-drill-play' || route.name === 'mistake-review-play') return 'quiz-play practice-mode study-drill-mode';
  if (route.name === 'mistake-review-result') return 'quiz-result mistake-review-result';
  if (route.name === 'study-drill-result') return 'quiz-result study-drill-result';
  if (route.name === 'study-index' || route.name === 'study-profile' || route.name === 'study-academy' || route.name === 'study-hub' || route.name === 'study-drill-setup' || route.name === 'mistake-review') return route.name;
  if (route.name === 'quiz-practice') return 'quiz-play practice-mode';
  if (route.name === 'quiz-exam') return 'quiz-play exam-mode';
  if (route.name === 'quiz-result') return 'quiz-result';
  if (route.name === 'wiki' || route.name === 'wiki-course' || route.name === 'wiki-page') return route.name;
  return route.name;
}
