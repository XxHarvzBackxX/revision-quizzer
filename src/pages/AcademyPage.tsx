import {
  ArrowLeft,
  ArrowRight,
  BrainCircuit,
  BookOpenText,
  Check,
  Crown,
  Flame,
  Gamepad2,
  Loader2,
  LockKeyholeOpen,
  RefreshCcw,
  Shield,
  Sparkles,
  Star,
  Swords,
  Target,
  Trophy,
  UserRound,
  Zap
} from 'lucide-react';
import { useEffect, useMemo } from 'react';
import type { DatasetSummary, PublicDataset } from '../../shared/quiz';
import { getRevisionCourse, revisionPathForObjective } from '../revision/registry';
import { revisionPageKey, useRevisionState } from '../revision/storage';
import type { AttemptRecord } from '../storage';
import {
  BOSS_PASS_PERCENTAGE,
  buildAcademyCampaign,
  createAcademyChallengeConfig,
  type AcademyCampaign,
  type AcademyQuestContext
} from '../study/academy';
import { calculateCertificationMastery } from '../study/mastery';
import { buildCertificationPool } from '../study/pool';
import {
  beginStudyDrill,
  claimAcademyQuest,
  ensureAcademyQuests,
  getActiveAcademyQuests,
  rerollAcademyQuest,
  shieldRecoveryDate,
  studyTotals,
  syncAcademyAchievements,
  useStreakShield,
  useStudyState
} from '../study/storage';
import type { AcademyQuest } from '../study/types';
import type { Navigate, ToastKind } from '../types';

export function AcademyPage({
  examCode,
  datasets,
  allDatasetSummaries,
  attempts,
  isLoading,
  navigate,
  onToast
}: {
  examCode: string;
  datasets: PublicDataset[];
  allDatasetSummaries: DatasetSummary[];
  attempts: AttemptRecord[];
  isLoading: boolean;
  navigate: Navigate;
  onToast: (kind: ToastKind, message: string) => void;
}) {
  const course = getRevisionCourse(examCode);
  const study = useStudyState();
  const revision = useRevisionState();
  const mastery = useMemo(() => course ? calculateCertificationMastery({
    examCode: course.examCode,
    attempts,
    datasets: allDatasetSummaries,
    course
  }) : [], [course, attempts, allDatasetSummaries]);
  const reviewedPageIds = useMemo(() => new Set(course?.pages.filter((page) => (
    revision.reviewedPages[revisionPageKey(course.examCode, page.id)]
  )).map((page) => page.id) ?? []), [course, revision.reviewedPages]);
  const campaign = useMemo(() => course ? buildAcademyCampaign({
    course,
    mastery,
    reviewedPageIds,
    challenges: study.academy.challenges
  }) : undefined, [course, mastery, reviewedPageIds, study.academy.challenges]);
  const weak = [...mastery].filter((item) => item.status !== 'ready').sort((left, right) => left.score - right.score || right.blueprintWeight - left.blueprintWeight)[0];
  const questContext: AcademyQuestContext | undefined = course ? {
    examCode: course.examCode,
    weakObjectiveId: weak?.objectiveId,
    weakObjectiveTitle: weak?.title,
    unreviewedGuideCount: course.pages.length - reviewedPageIds.size,
    bookmarkCount: Object.values(study.bookmarks).filter((bookmark) => bookmark.examCode === course.examCode).length
  } : undefined;

  useEffect(() => {
    if (questContext) ensureAcademyQuests(questContext);
  }, [questContext?.examCode, questContext?.weakObjectiveId, questContext?.unreviewedGuideCount, questContext?.bookmarkCount]);

  useEffect(() => {
    if (!campaign) return;
    syncAcademyAchievements({
      totalStars: campaign.earnedStars,
      passedDomainBosses: campaign.passedBosses,
      passedFinalBosses: campaign.finalBoss?.passedAt ? 1 : 0
    });
  }, [campaign?.earnedStars, campaign?.passedBosses, campaign?.finalBoss?.passedAt]);

  if (!course || !campaign || !questContext) {
    return <section className="result-empty"><Target size={38} /><h1>Academy unavailable</h1><p>This certification does not have a mapped campaign.</p><button className="primary-button" onClick={() => navigate('/study')}>Study plans</button></section>;
  }

  const quests = getActiveAcademyQuests(study, course.examCode);
  const recoveryDate = shieldRecoveryDate(study);
  const totals = studyTotals(study);

  function startBoss(kind: 'domain-boss' | 'final-boss', domainId?: string) {
    const config = createAcademyChallengeConfig({
      examCode: course!.examCode,
      pool: buildCertificationPool(course!.examCode, datasets),
      kind,
      domainId
    });
    if (!config) {
      onToast('error', 'The built-in question bank is still loading. Try again in a moment.');
      return;
    }
    beginStudyDrill(config);
    navigate(`/study/${course!.examCode.toLowerCase()}/drill/play`);
  }

  function claim(quest: AcademyQuest) {
    const before = studyTotals().level;
    const updated = claimAcademyQuest(quest.id);
    const after = studyTotals(updated).level;
    onToast('success', after > before ? `Quest claimed · Level ${after} reached!` : `Quest claimed · +${quest.rewardXp} XP`);
  }

  function reroll(quest: AcademyQuest) {
    const updated = rerollAcademyQuest(quest.id, questContext!);
    if (updated.academy.inventory.rerolls < study.academy.inventory.rerolls) onToast('info', 'Daily quest rerolled.');
  }

  return (
    <section className="academy-page" style={{ '--course-accent': course.accent } as React.CSSProperties}>
      <header className="academy-hero">
        <div>
          <button className="academy-back" onClick={() => navigate(`/study/${course.examCode.toLowerCase()}`)}><ArrowLeft size={16} /> Study plan</button>
          <span className="academy-kicker"><Gamepad2 size={17} /> {course.examCode} Arcade Academy</span>
          <h1>Master the map.<br /><em>Beat the blueprint.</em></h1>
          <p>Earn stars from real study evidence, clear every domain boss, and take on the final certification challenge.</p>
          <div className="academy-hero-actions">
            <button className="primary-button large" onClick={() => navigate(`/study/${course.examCode.toLowerCase()}/drill`)}>Quick training <ArrowRight size={18} /></button>
            <button className="secondary-button large" onClick={() => navigate('/study/profile')}><UserRound size={18} /> Player profile</button>
          </div>
        </div>
        <div className="academy-player-orb">
          <div className={`academy-map-token ${study.academy.inventory.equippedToken}`}>{mapToken(study.academy.inventory.equippedToken)}</div>
          <span>Level {totals.level}</span>
          <strong>{campaign.earnedStars}/{campaign.totalStars}</strong>
          <small>campaign stars</small>
          <div><span style={{ width: `${campaign.totalStars ? campaign.earnedStars / campaign.totalStars * 100 : 0}%` }} /></div>
        </div>
      </header>

      {recoveryDate && (
        <section className="shield-recovery-card">
          <Shield size={26} />
          <div><strong>Streak recovery available</strong><p>Use one shield to protect {formatDate(recoveryDate)}. Protected days never award XP.</p></div>
          <button className="secondary-button" onClick={() => { useStreakShield(); onToast('success', 'Streak shield activated.'); }}>Use shield</button>
        </section>
      )}

      <QuestBoard quests={quests} rerolls={study.academy.inventory.rerolls} onClaim={claim} onReroll={reroll} />

      <section className="campaign-section">
        <div className="academy-section-heading">
          <div><span className="section-kicker">Campaign map</span><h2>{course.shortTitle} journey</h2></div>
          <p>Every lesson stays open. Stars mark earned status, not access.</p>
        </div>
        <div className="campaign-zones">
          {campaign.zones.map((zone, zoneIndex) => (
            <article className="campaign-zone" key={zone.id}>
              <header><span>Zone {zoneIndex + 1}</span><h3>{zone.title}</h3><small>{zone.weight}% of the blueprint</small></header>
              <div className="campaign-path">
                {zone.stages.map((stage, index) => (
                  <div className="campaign-stage-wrap" key={stage.id}>
                    {index > 0 && <span className="campaign-connector" aria-hidden="true" />}
                    <button className={`campaign-stage stars-${stage.earnedStars}`} onClick={() => navigate(revisionPathForObjective(course.examCode, stage.objectiveId) ?? `/wiki/${course.examCode.toLowerCase()}`)}>
                      <span className="campaign-stage-number">{index + 1}</span>
                      <span className="campaign-stage-copy"><strong>{stage.title}</strong><small>{stage.mastery.evidence} answers · {stage.mastery.evidence ? `${stage.mastery.score}% mastery` : 'unseen'}</small></span>
                      <span className="campaign-stars" aria-label={`${stage.earnedStars} of 3 stars`}>
                        <Star className={stage.stars.studied ? 'earned' : ''} size={17} aria-label="Guide reviewed" />
                        <Star className={stage.stars.practised ? 'earned' : ''} size={17} aria-label="Practice evidence" />
                        <Star className={stage.stars.mastered ? 'earned' : ''} size={17} aria-label="Objective mastered" />
                      </span>
                      <ArrowRight size={17} />
                    </button>
                  </div>
                ))}
                <BossNode campaign={campaign} zoneId={zone.id} title={`${zone.title} Boss`} progress={zone.boss} loading={isLoading} onStart={() => startBoss('domain-boss', zone.id)} />
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className={`final-boss-card ${campaign.finalBoss?.passedAt ? 'defeated' : ''}`}>
        <div className="final-boss-icon"><Crown size={42} /></div>
        <div>
          <span className="section-kicker">Final checkpoint</span>
          <h2>{course.examCode} Certification Boss</h2>
          <p>25 blueprint-weighted questions under exam conditions. Score {BOSS_PASS_PERCENTAGE}% to earn the crown.</p>
          <div className="boss-meta"><span><Trophy size={16} /> Best {campaign.finalBoss?.bestPercentage ?? 0}%</span><span><Swords size={16} /> {campaign.finalBoss?.attempts ?? 0} attempts</span><span><Sparkles size={16} /> 500 XP first clear</span></div>
        </div>
        <button className="primary-button large" disabled={isLoading} onClick={() => startBoss('final-boss')}>{campaign.finalBoss?.passedAt ? 'Challenge again' : 'Face final boss'} <Crown size={18} /></button>
      </section>
    </section>
  );
}

function QuestBoard({ quests, rerolls, onClaim, onReroll }: {
  quests: AcademyQuest[];
  rerolls: number;
  onClaim: (quest: AcademyQuest) => void;
  onReroll: (quest: AcademyQuest) => void;
}) {
  return (
    <section className="quest-board">
      <div className="academy-section-heading"><div><span className="section-kicker">Quest board</span><h2>Today and this week</h2></div><p><RefreshCcw size={15} /> {rerolls} reroll{rerolls === 1 ? '' : 's'} available</p></div>
      <div className="quest-columns">
        {(['daily', 'weekly'] as const).map((period) => (
          <div className="quest-column" key={period}>
            <header><span>{period === 'daily' ? <Flame size={18} /> : <Trophy size={18} />}</span><div><strong>{period === 'daily' ? 'Daily missions' : 'Weekly missions'}</strong><small>{period === 'daily' ? 'Complete all three for a reroll' : 'Complete all three for a streak shield'}</small></div></header>
            {quests.filter((quest) => quest.period === period).map((quest) => (
              <article className={`quest-card ${quest.completedAt ? 'complete' : ''} ${quest.claimedAt ? 'claimed' : ''}`} key={quest.id}>
                <div className="quest-icon">{quest.claimedAt ? <Check size={18} /> : quest.completedAt ? <Sparkles size={18} /> : <Target size={18} />}</div>
                <div className="quest-copy"><strong>{quest.title}</strong><p>{quest.description}</p><div className="quest-progress"><span style={{ width: `${quest.progress / quest.target * 100}%` }} /></div><small>{quest.progress}/{quest.target} · {quest.rewardXp} XP</small></div>
                {quest.completedAt && !quest.claimedAt ? <button onClick={() => onClaim(quest)}>Claim</button> : period === 'daily' && !quest.completedAt && rerolls > 0 ? <button className="quest-reroll" onClick={() => onReroll(quest)} aria-label={`Reroll ${quest.title}`}><RefreshCcw size={15} /></button> : null}
              </article>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}

function BossNode({ title, progress, loading, onStart }: {
  campaign: AcademyCampaign;
  zoneId: string;
  title: string;
  progress: AcademyCampaign['zones'][number]['boss'];
  loading: boolean;
  onStart: () => void;
}) {
  return (
    <div className={`boss-node ${progress?.passedAt ? 'defeated' : ''}`}>
      <div><span>{progress?.passedAt ? <Trophy size={25} /> : <Swords size={25} />}</span><div><strong>{title}</strong><small>{progress?.passedAt ? `Defeated · best ${progress.bestPercentage}%` : `${BOSS_PASS_PERCENTAGE}% to clear · 250 XP`}</small></div></div>
      <button className="secondary-button" disabled={loading} onClick={onStart}>{progress?.passedAt ? 'Replay' : 'Start boss'} <LockKeyholeOpen size={16} /></button>
    </div>
  );
}

function formatDate(key: string): string {
  const [year, month, day] = key.split('-').map(Number);
  return new Intl.DateTimeFormat(undefined, { weekday: 'long', day: 'numeric', month: 'short' }).format(new Date(year, month - 1, day));
}

function mapToken(id: string): React.ReactNode {
  if (id === 'token-crown') return <Crown size={25} />;
  if (id === 'token-bolt') return <Zap size={25} />;
  return <BrainCircuit size={25} />;
}
