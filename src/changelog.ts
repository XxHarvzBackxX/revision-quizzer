import packageMetadata from '../package.json';
import { readAppStorage, writeAppStorage } from './persistence';

/** User-facing release copy. Prefer observable outcomes over implementation details. */
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
    version: '0.5.0',
    deployment: 9,
    releasedAt: '2026-07-22',
    title: 'Private accounts and secure progress sync',
    summary: 'Verified accounts can now carry learning progress, preferences, and creator identity across devices, with self-service data controls, audited moderation, and transparent guest behaviour.',
    sections: [
      {
        title: 'Sign-in and private identity',
        items: [
          'Added account creation and verified sign-in with email and password or Google, alongside email verification and password recovery.',
          'Every account has a unique handle and a choice of preset avatars, without exposing private email addresses or account identifiers to other players.',
          'Player identity now appears consistently across Home, Study, Academy, results, contributions, profiles, and administrator tools, with quicker access from the top navigation.',
          'Sessions last for up to five days, while sensitive actions such as changing a handle or deleting an account require a recent sign-in.'
        ]
      },
      {
        title: 'Progress and continuity',
        items: [
          'Signed-in attempts, active exams, Study settings, Academy progress, RevisionWiki activity, themes, and changelog state now follow the player between supported devices.',
          'Theme choices are saved reliably before sign-out and restored after sign-in, including custom palettes and preferences selected on another device.',
          'Existing browser progress can be claimed safely by a new account or downloaded as JSON, and is not removed until a successful import is confirmed.',
          'Guests can still browse and practise without an account, while their learning activity remains temporary and disappears instead of being stored.'
        ]
      },
      {
        title: 'Data choices and contributions',
        items: [
          'Account holders can download a JSON copy of their account information, learning progress, preferences, and contribution records whenever they choose.',
          'Signed-in contributors can manage their own pending submissions and choose whether approved quiz sets show their public handle and avatar.',
          'Deleting an account removes private data and pending submissions, with a clear choice to delete approved contributions or keep them without personal attribution.',
          'Inactive accounts receive a warning and at least 30 days to return before automatic deletion; deletion pauses if that warning cannot be delivered.'
        ]
      },
      {
        title: 'Safer administration',
        items: [
          'Administrator access now belongs to individually authorised accounts instead of relying on shared passwords.',
          'Administrators can search account profiles, review relevant account status, correct inappropriate handles or avatars, and remove public contribution attribution.',
          'Moderation tools can revoke sessions, suspend access, or restore an account without allowing administrators to rewrite private learning progress or sign-in details.',
          'Every account action requires a reason and is recorded in a private, reviewable moderation history shown alongside the profile.'
        ]
      },
      {
        title: 'Security and transparency',
        items: [
          'Private account and progress information is now handled through protected account services, with database access kept on the server and safeguards around signed-in requests.',
          'Registration clearly records the age confirmation and acceptance of the Terms and Privacy Policy required to create an account.',
          'Added plain-language Privacy Policy, Terms, and Community Guidelines pages to the footer, account screens, and other relevant touchpoints.',
          'Account services have been organised to deploy reliably within the free hosting plan while keeping their authentication and privacy protections intact.'
        ]
      }
    ]
  },
  {
    version: '0.4.0',
    deployment: 8,
    releasedAt: '2026-07-22',
    title: 'Player shortcuts from every page',
    summary: 'A new player icon keeps Study & Academy and the player profile one quick menu away throughout Quiz Arcade.',
    sections: [
      {
        title: 'Faster player navigation',
        items: [
          'Added a player icon to the top-right corner with direct shortcuts to Study & Academy and the player profile.',
          'The icon and menu highlight the current study or profile destination and close automatically after a selection.'
        ]
      },
      {
        title: 'Responsive and accessible',
        items: [
          'The compact control and its menu adapt to mobile headers while keeping clear labels, focus states, and current-page cues.'
        ]
      }
    ]
  },
  {
    version: '0.3.0',
    deployment: 7,
    releasedAt: '2026-07-21',
    title: 'Academy colour collections',
    summary: 'Five light-and-dark colour families turn Academy progress into visible profile rewards, with an administrator-controlled site-wide option.',
    sections: [
      {
        title: 'Five paired colour themes',
        items: [
          'Added Pacific blue, Arcade red, Sunset orange, Solar yellow, and Neon pink colour families, each with a complete light and dark appearance.',
          'Every bonus colour includes its own inline light/dark switch in the header picker and player profile.',
          'All ten new palettes maintain the same readable contrast and consistent surfaces as the original themes.'
        ]
      },
      {
        title: 'Academy rewards',
        items: [
          'Bonus themes can unlock through a first campaign star, Academy level 3, ten campaign stars, a domain boss, and a final certification boss.',
          'The player profile now displays the complete colour collection with each requirement, availability state, and equipped theme.',
          'Locked selections explain the next milestone, while previously earned achievements and XP grant their matching colours automatically.'
        ]
      },
      {
        title: 'Administrator control',
        items: [
          'The admin console can switch bonus colours between Academy unlocks and immediate site-wide availability.',
          'Theme availability is part of public site configuration, so the header picker and profile always apply the same rule.',
          'Changing the setting takes effect in the current admin session without discarding anyone’s Academy progress.'
        ]
      }
    ]
  },
  {
    version: '0.2.1',
    deployment: 6,
    releasedAt: '2026-07-21',
    title: 'Theme-safe surfaces across Quiz Arcade',
    summary: 'Dark themes now keep panels, controls, badges, and feedback states on the correct palette throughout the app.',
    sections: [
      {
        title: 'Dark-theme consistency',
        items: [
          'Fixed changelog cards that could show mismatched backgrounds and text in dark themes.',
          'The exam question navigator, submission dialog, option markers, result filters, and empty states now use the selected theme’s surfaces and foregrounds.',
          'Hover, selected, answered, correct, warning, and incorrect states remain visually distinct without switching back to light-only colours.'
        ]
      },
      {
        title: 'Badges and feedback',
        items: [
          'Official, curated, result, question-type, and upload badges now adapt their colour treatment to every light and dark theme.',
          'Success, warning, and error messages now keep consistent, readable colours across practice, exams, results, and administration.'
        ]
      },
      {
        title: 'Theme safeguards',
        items: [
          'Added automated checks that catch missing theme colours before they can create an inconsistent screen.',
          'Expanded readability checks to cover buttons and accent badges in all six selectable themes.'
        ]
      }
    ]
  },
  {
    version: '0.2.0',
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
          'Only built-in content can display the Official seal; community uploads cannot claim it.'
        ]
      },
      {
        title: 'Complete release history',
        items: [
          'Reconstructed clear summaries for production updates #1, #2, and #3 from the changes that were actually released.',
          'Older updates appear as Previously unversioned rather than being given made-up release numbers.',
          'Changelog History now follows the production sequence from the first numbered deployment through the current release.'
        ]
      },
      {
        title: 'Release visibility',
        items: [
          'Quiz Arcade now displays its release number and automatically introduces the newest unread release once.',
          'Every release remains available from Changelog History in the site footer.'
        ]
      }
    ]
  },
  {
    deployment: 4,
    releasedAt: '2026-07-21',
    title: 'Arcade Academy and realistic certification practice',
    summary: 'A major study upgrade with certification campaigns and more authentic exam formats and content.',
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
      }
    ]
  },
  {
    deployment: 3,
    releasedAt: '2026-07-15',
    title: 'Quiz Arcade identity and safer releases',
    summary: 'A small production update that established the app icon and made follow-up development safer after releases.',
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
          'Added an automated safeguard that keeps ongoing development aligned after each production release.',
          'Release history is preserved while future work continues from the latest production changes.'
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
          'Added answer-confidence ratings, saved questions, personal question notes, missed-question retries, and drill results that remember where each question came from.',
          'Added local XP, levels, daily question goals, activity streaks, and study settings.',
          'Added responsive study dashboards and controls across desktop and mobile layouts.'
        ]
      },
      {
        title: 'Accessibility',
        items: [
          'Improved text, accent, surface, and highlighted-note contrast across all selectable themes.',
          'Added automated accessibility checks to protect readable colour contrast.'
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
    writeAppStorage(CHANGELOG_STORAGE_KEY, JSON.stringify(next));
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
    const value: unknown = JSON.parse(readAppStorage(CHANGELOG_STORAGE_KEY) ?? 'null');
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
