import type { Navigate } from '../types';

type LegalKind = 'privacy' | 'terms' | 'community-guidelines';

export function LegalPage({ kind, navigate }: { kind: LegalKind; navigate: Navigate }) {
  if (kind === 'privacy') return <PrivacyPolicy navigate={navigate} />;
  if (kind === 'terms') return <Terms navigate={navigate} />;
  return <Guidelines navigate={navigate} />;
}

function PrivacyPolicy({ navigate }: { navigate: Navigate }) {
  const firestoreRegion = import.meta.env.VITE_FIRESTORE_REGION;
  return <LegalShell title="Privacy Policy" updated="22 July 2026" navigate={navigate}>
    <p>Quiz Arcade is operated by Harvey Wells. Contact <a href="mailto:harvey.wells.07@gmail.com">harvey.wells.07@gmail.com</a> about this policy or your data.</p>
    <h2>Guests and account holders</h2><p>Guests can browse and practise, but attempts, notes, XP, Academy progress, and quiz sessions are kept only in memory for the current interaction. Theme and changelog choices may also be held for the current session. Older browser progress from releases before accounts is frozen until you download, claim, or delete it.</p><p>Signed-in accounts store your email and provider identity, handle, preset avatar, policy acknowledgements, quiz answers and attempts, active exam state, study activity, bookmarks, notes and highlights, Academy rewards, preferences, changelog state, community submissions, and any account-moderation actions.</p>
    <h2>Why data is used</h2><p>Account and learning data is used to provide sign-in, cross-device progress, exports, deletion, moderation, and service support. Security logs, IP address, user agent, App Check signals, and request metadata are used to prevent abuse and protect accounts. Optional public attribution is used only when you enable it.</p><p>Authorized administrators can search private profiles and view an account’s email, internal identifier, sign-in providers, verification and access status, and activity dates when needed for moderation or support. Administrators may correct a handle, reset a preset avatar, remove public attribution, revoke sessions, or suspend and restore access. Each change requires a reason and is recorded in a private audit log that authorized administrators can review; the console cannot edit email addresses, administrator claims, or learning records.</p>
    <h2>Services and locations</h2><p>Firebase Authentication and Firestore process account data for Quiz Arcade; Vercel hosts the application and API; Resend sends inactivity warnings. Firebase Authentication may process data in the United States. {firestoreRegion ? `Firestore is configured in ${firestoreRegion}.` : 'This pre-production build has not published its configured Firestore region; deployment is blocked until that detail is supplied.'}</p>
    <h2>Cookies and device storage</h2><p>Quiz Arcade uses a strictly necessary secure server-session cookie for up to five days and a short-lived CSRF cookie. Firebase App Check uses reCAPTCHA Enterprise to distinguish genuine app requests. There are no advertising or marketing analytics cookies.</p>
    <h2>Retention</h2><p>Account data is retained while the account is active. After 23 months of inactivity, Quiz Arcade emails a warning. Signing in cancels deletion. Once the account has been inactive for at least 24 months and at least 30 days have passed since a successful warning, the account and progress are deleted and approved community sets are anonymized. Automatic deletion pauses if warning delivery is unavailable, so an account is not removed without notice. Voluntary deletion lets you anonymize or delete approved sets. Provider backups may take additional time to expire under the processors’ published schedules.</p>
    <h2>Your choices and rights</h2><p>You can update your profile, control attribution, download a JSON export, and delete the account from the Account page. Contact Harvey Wells to request access to moderation records, challenge a moderation decision, or request access, correction, restriction, objection, portability, or erasure. UK users may complain to the Information Commissioner’s Office.</p>
    <h2>Legal basis and changes</h2><p>Account processing is necessary to provide the service you request; security and moderation use legitimate interests; public attribution follows your explicit choice. These bases and the final notice require legal review before production. Material changes will be dated here and surfaced in Quiz Arcade.</p>
  </LegalShell>;
}

function Terms({ navigate }: { navigate: Navigate }) {
  return <LegalShell title="Terms of Use" updated="22 July 2026" navigate={navigate}>
    <p>These terms govern Quiz Arcade accounts and community features. They require legal review before production.</p>
    <h2>Eligibility and accounts</h2><p>You must be at least 16 to create an account. Provide accurate information, protect your credentials, and tell us if you suspect unauthorized use. Do not share accounts or bypass security controls.</p>
    <h2>Learning service</h2><p>Quiz Arcade is unofficial certification preparation and is not affiliated with or endorsed by Microsoft. Content may contain mistakes and does not guarantee an exam result. Do not use the service to cheat or reproduce live examination material.</p>
    <h2>Your submissions</h2><p>You retain ownership of content you submit and confirm that it is original or properly licensed. You grant Quiz Arcade a non-exclusive, worldwide, royalty-free licence to host, review, format, display, and distribute approved submissions for operation of the service. This licence continues for sets retained in anonymized form after automatic inactivity deletion or when you choose anonymization.</p>
    <h2>Moderation and acceptable use</h2><p>We may review, reject, edit metadata for, unpublish, or delete submissions and suspend accounts to protect users, rights holders, or the service. Follow the Community Guidelines and applicable law.</p>
    <h2>Availability and responsibility</h2><p>The service may change, experience interruption, or be withdrawn. Nothing in these terms excludes rights or liability that cannot lawfully be excluded. Final limitation and governing-law wording will be added only after legal review.</p>
  </LegalShell>;
}

function Guidelines({ navigate }: { navigate: Navigate }) {
  return <LegalShell title="Community Guidelines" updated="22 July 2026" navigate={navigate}>
    <p>Help make shared quiz sets safe, useful, and fair.</p>
    <h2>Share only content you can use</h2><p>Submit original material, openly licensed material, or content you have permission to share. Do not upload real exam dumps, leaked questions, copyrighted copies, or answer keys obtained improperly.</p>
    <h2>Protect people</h2><p>Do not include personal or sensitive information, harassment, hate, sexual content, threats, impersonation, malware, tracking links, or instructions intended to cause harm.</p>
    <h2>Make sets useful</h2><p>Use accurate titles and tags, explain answers where practical, and do not deliberately mislead learners or spam duplicate material.</p>
    <h2>Moderation</h2><p>Submissions may wait for review. Quiz Arcade may reject, unpublish, or remove content that breaks these rules. Offensive, harassing, impersonating, or misleading handles may be corrected, and serious or repeated abuse may lead to session revocation or account suspension. Contact <a href="mailto:harvey.wells.07@gmail.com">harvey.wells.07@gmail.com</a> to report a set or challenge a moderation decision.</p>
    <h2>Attribution</h2><p>Creator handle and preset avatar appear only when the creator opts in. Email addresses and internal account identifiers are never shown publicly.</p>
  </LegalShell>;
}

function LegalShell({ title, updated, navigate, children }: { title: string; updated: string; navigate: Navigate; children: React.ReactNode }) {
  return <section className="legal-page"><header><p className="eyebrow">Quiz Arcade</p><h1>{title}</h1><span>Last updated {updated}</span></header><div className="legal-copy">{children}</div><div className="legal-nav"><button onClick={() => navigate('/privacy')}>Privacy</button><button onClick={() => navigate('/terms')}>Terms</button><button onClick={() => navigate('/community-guidelines')}>Community Guidelines</button></div></section>;
}
