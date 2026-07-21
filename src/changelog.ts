import packageMetadata from '../package.json';

export type ChangelogSection = {
  title: string;
  items: string[];
};

export type ChangelogEntry = {
  version?: string;
  deployment: number;
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
    version: '0.3.0',
    deployment: 5,
    releasedAt: '2026-07-21',
    title: 'Official-first library and historical deployment archive',
    summary: 'Official practice content is easier to find, and the release log now records every numbered production deployment.',
    sections: [
      {
        title: 'Official datasets',
        items: [
          'Official datasets now appear before other curated papers on the home page and in the certification library.',
          'A dedicated purple Official seal distinguishes trusted built-in assessment content from Quiz Arcade-curated mock exams.',
          'Official provenance is assigned by the built-in dataset registry and cannot be claimed by public uploads.'
        ]
      },
      {
        title: 'Complete release history',
        items: [
          'Added net changelogs for production deployments #1, #2, and #3 based on their exact master-branch merge ranges.',
          'Legacy deployments are identified as previously unversioned instead of being assigned fictional Semantic Versioning numbers.',
          'Changelog History now follows the production sequence from the first numbered deployment through the current release.'
        ]
      },
      {
        title: 'Versioning',
        items: [
          'Advanced Quiz Arcade from v0.2.0 to v0.3.0 because official-first discovery and provenance badges add backward-compatible functionality.',
          'Deployment numbers and Semantic Versioning are now displayed together for all newly versioned production releases.'
        ]
      }
    ]
  },
  {
    version: '0.2.0',
    deployment: 4,
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
    deployment: 3,
    releasedAt: '2026-07-15',
    title: 'Quiz Arcade identity and safer releases',
    summary: 'A small production update that established the app icon and automated post-release branch synchronization.',
    sections: [
      {
        title: 'Brand identity',
        items: [
          'Added the Quiz Arcade brain favicon for browser tabs, bookmarks, and installed shortcuts.'
        ]
      },
      {
        title: 'Release reliability',
        items: [
          'Added an automated workflow to synchronize dev after a production release reaches master.',
          'The workflow uses fast-forward or merge-based synchronization checks so release history is retained across branches.'
        ]
      }
    ]
  },
  {
    deployment: 2,
    releasedAt: '2026-07-15',
    title: 'Study plans get a proper front door',
    summary: 'Smart study became a first-class destination with a certification chooser and persistent primary navigation.',
    sections: [
      {
        title: 'Study navigation',
        items: [
          'Added Study to the primary navigation so smart-study tools no longer depended on entering through an exam card.',
          'Added a dedicated study-plan landing page for choosing between AI-901 and AZ-900.'
        ]
      },
      {
        title: 'At-a-glance progress',
        items: [
          'Certification cards show readiness, ready objectives, reviewed guides, saved questions, and the recommended next action.',
          'The landing page surfaces overall XP, level progress, current streak, and longest streak before opening a certification hub.',
          'Added direct actions to open each study plan or build a focused drill.'
        ]
      }
    ]
  },
  {
    deployment: 1,
    releasedAt: '2026-07-15',
    title: 'Smart study loop and accessible themes',
    summary: 'Quiz Arcade connected exam evidence, targeted practice, RevisionWiki, and local progress into a personalised study loop.',
    sections: [
      {
        title: 'Personalised study',
        items: [
          'Added AI-901 and AZ-900 study hubs with objective mastery, readiness, score trends, and next-best recommendations.',
          'Added certification-wide drills for weak, missed, bookmarked, unseen, objective, domain, difficulty, and mixed-question practice.',
          'Connected exam results and weak objectives directly to the matching RevisionWiki content.'
        ]
      },
      {
        title: 'Learning evidence',
        items: [
          'Added answer-confidence ratings, saved questions, personal question notes, missed-question retries, and provenance-aware drill results.',
          'Added local XP, levels, daily question goals, activity streaks, and study settings.',
          'Added responsive study dashboards and controls across desktop and mobile layouts.'
        ]
      },
      {
        title: 'Accessibility',
        items: [
          'Improved text, accent, surface, and highlighted-note contrast across all selectable themes.',
          'Added automated WCAG contrast validation to protect theme readability.'
        ]
      }
    ]
  }
];

export const currentChangelog = changelogEntries.find((entry) => entry.version === APP_VERSION);

export function changelogEntryKey(entry: ChangelogEntry): string {
  return entry.version ?? `deployment-${entry.deployment}`;
}

export function getLatestUnreadChangelog(): ChangelogEntry | undefined {
  const latest = changelogEntries[0];
  if (!latest) return undefined;
  return readChangelogState().readVersions.includes(changelogEntryKey(latest)) ? undefined : latest;
}

export function markChangelogRead(releaseKey: string): void {
  if (!changelogEntries.some((entry) => changelogEntryKey(entry) === releaseKey)) return;
  const current = readChangelogState();
  const read = new Set([...current.readVersions, releaseKey]);
  const next: ChangelogReadState = {
    version: 1,
    readVersions: changelogEntries.map(changelogEntryKey).filter((entryKey) => read.has(entryKey))
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
    const known = new Set(changelogEntries.map(changelogEntryKey));
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
