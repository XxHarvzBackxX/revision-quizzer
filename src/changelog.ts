import packageMetadata from '../package.json';

export type ChangelogSection = {
  title: string;
  items: string[];
};

export type ChangelogEntry = {
  version: string;
  releasedAt: string;
  title: string;
  summary: string;
  sections: ChangelogSection[];
};

type ChangelogReadState = {
  version: 1;
  readVersions: string[];
};

export const APP_VERSION = packageMetadata.version;
export const CHANGELOG_STORAGE_KEY = 'quiz-arcade:changelog:v1';

export const changelogEntries: ChangelogEntry[] = [
  {
    version: '0.2.0',
    releasedAt: '2026-07-21',
    title: 'Arcade Academy and realistic certification practice',
    summary: 'A major study upgrade with certification campaigns, more authentic exam formats and content, and a visible release history.',
    sections: [
      {
        title: 'Arcade Academy',
        items: [
          'Explore open AI-901 and AZ-900 campaign maps built from your existing study plan and RevisionWiki objectives.',
          'Earn study, practice, and mastery stars; complete adaptive daily and weekly quests; and challenge domain and final bosses.',
          'Unlock player titles and map tokens, earn quest rerolls and streak shields, and manage them from the new player profile.'
        ]
      },
      {
        title: 'More realistic exams',
        items: [
          'Answer inline dropdown questions and three-row Yes/No or True/False statement groups in both timed and practice modes.',
          'Use fully rewritten AI-901 and AZ-900 mock banks with blueprint-balanced topics, difficulty, explanations, and Microsoft Learn references.',
          'Practise with a separate 50-question AI-901 Microsoft Learn assessment transcribed from the supplied learner captures.'
        ]
      },
      {
        title: 'One connected study journey',
        items: [
          'Study recommendations, RevisionWiki reviews, targeted drills, bookmarks, exams, quests, and Academy progress now share the same evidence.',
          'AI-901 certification-wide study now draws from 200 built-in questions, including the observed practice assessment.',
          'Rewritten question banks automatically clear incompatible saved sessions while preserving unrelated community and study activity.'
        ]
      },
      {
        title: 'Release visibility',
        items: [
          'Quiz Arcade now displays its Semantic Versioning number and automatically introduces the newest unread release once.',
          'Every release remains available from Changelog History in the site footer.'
        ]
      }
    ]
  },
  {
    version: '0.1.0',
    releasedAt: '2026-07-15',
    title: 'Quiz Arcade foundation',
    summary: 'The first version of the certification-preparation experience and its local-first study toolkit.',
    sections: [
      {
        title: 'Certification practice',
        items: [
          'Take curated AI-901 and AZ-900 mock exams in guided practice or timed exam mode.',
          'Review explanations, domain performance, missed questions, saved attempts, and readiness estimates.'
        ]
      },
      {
        title: 'Smart study and RevisionWiki',
        items: [
          'Build targeted certification-wide drills from weak, missed, bookmarked, unseen, objective, domain, and difficulty filters.',
          'Track mastery, confidence, notes, bookmarks, XP, streaks, score trends, and RevisionWiki progress locally in the browser.'
        ]
      },
      {
        title: 'App experience',
        items: [
          'Browse built-in and community datasets, share quiz sets, and use the moderated administration workflow.',
          'Choose from six site-wide light, dark, contrast, purple, and mint themes.'
        ]
      }
    ]
  }
];

export const currentChangelog = changelogEntries.find((entry) => entry.version === APP_VERSION);

export function getLatestUnreadChangelog(): ChangelogEntry | undefined {
  const latest = changelogEntries[0];
  if (!latest) return undefined;
  return readChangelogState().readVersions.includes(latest.version) ? undefined : latest;
}

export function markChangelogRead(version: string): void {
  if (!changelogEntries.some((entry) => entry.version === version)) return;
  const current = readChangelogState();
  const read = new Set([...current.readVersions, version]);
  const next: ChangelogReadState = {
    version: 1,
    readVersions: changelogEntries.map((entry) => entry.version).filter((entryVersion) => read.has(entryVersion))
  };
  try {
    localStorage.setItem(CHANGELOG_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // The changelog remains usable for this visit when browser storage is unavailable.
  }
}

export function formatChangelogDate(value: string): string {
  const [year, month, day] = value.split('-').map(Number);
  return new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(year, month - 1, day));
}

function readChangelogState(): ChangelogReadState {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(CHANGELOG_STORAGE_KEY) ?? 'null');
    if (!isRecord(value) || value.version !== 1 || !Array.isArray(value.readVersions)) return emptyReadState();
    const known = new Set(changelogEntries.map((entry) => entry.version));
    return {
      version: 1,
      readVersions: [...new Set(value.readVersions.filter((item): item is string => typeof item === 'string' && known.has(item)))]
    };
  } catch {
    return emptyReadState();
  }
}

function emptyReadState(): ChangelogReadState {
  return { version: 1, readVersions: [] };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
