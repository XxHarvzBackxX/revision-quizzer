import { ArrowLeft, BrainCircuit, Check, Crown, Flame, LockKeyhole, Medal, RefreshCcw, Shield, Sparkles, Star, Trophy, Zap } from 'lucide-react';
import { useEffect, useMemo } from 'react';
import type { DatasetSummary } from '../../shared/quiz';
import { revisionCourses } from '../revision/registry';
import { revisionPageKey, useRevisionState } from '../revision/storage';
import type { AttemptRecord } from '../storage';
import { academyCosmetics, buildAcademyCampaign } from '../study/academy';
import { calculateCertificationMastery } from '../study/mastery';
import { equipAcademyCosmetic, studyStreak, studyTotals, syncAcademyAchievements, useStudyState } from '../study/storage';
import { isThemeAvailable, rewardThemeFamilies, useTheme } from '../theme';
import { ThemeModeSwitch } from '../components/ThemeModeSwitch';
import type { Navigate } from '../types';

const achievementCopy = [
  { id: 'first-star', title: 'First Star', description: 'Earn a campaign star.' },
  { id: 'ten-stars', title: 'Star Runner', description: 'Earn ten campaign stars.' },
  { id: 'domain-champion', title: 'Domain Champion', description: 'Defeat a domain boss.' },
  { id: 'certification-conqueror', title: 'Certification Conqueror', description: 'Defeat a final certification boss.' }
];

export function AcademyProfilePage({ datasets, attempts, navigate, themesRequireUnlock = true }: {
  datasets: DatasetSummary[];
  attempts: AttemptRecord[];
  navigate: Navigate;
  themesRequireUnlock?: boolean;
}) {
  const study = useStudyState();
  const [theme, selectTheme] = useTheme();
  const revision = useRevisionState();
  const campaigns = useMemo(() => revisionCourses.map((course) => buildAcademyCampaign({
    course,
    mastery: calculateCertificationMastery({ examCode: course.examCode, attempts, datasets, course }),
    reviewedPageIds: new Set(course.pages.filter((page) => revision.reviewedPages[revisionPageKey(course.examCode, page.id)]).map((page) => page.id)),
    challenges: study.academy.challenges
  })), [attempts, datasets, revision.reviewedPages, study.academy.challenges]);
  const totalStars = campaigns.reduce((sum, campaign) => sum + campaign.earnedStars, 0);
  const domainBosses = campaigns.reduce((sum, campaign) => sum + campaign.passedBosses, 0);
  const finalBosses = campaigns.filter((campaign) => campaign.finalBoss?.passedAt).length;
  const totals = studyTotals(study);
  const streak = studyStreak(study);
  const themeProgress = { level: totals.level, achievementIds: Object.keys(study.academy.achievements) };

  useEffect(() => {
    syncAcademyAchievements({ totalStars, passedDomainBosses: domainBosses, passedFinalBosses: finalBosses });
  }, [totalStars, domainBosses, finalBosses]);

  const title = academyCosmetics.titles.find((item) => item.id === study.academy.inventory.equippedTitle)?.label ?? 'New Challenger';

  return (
    <section className="academy-profile-page">
      <button className="academy-back" onClick={() => navigate('/study')}><ArrowLeft size={16} /> Study plans</button>
      <header className="profile-hero">
        <div className={`profile-token ${study.academy.inventory.equippedToken}`}>{tokenIcon(study.academy.inventory.equippedToken)}</div>
        <div><span className="academy-kicker"><Medal size={17} /> Player profile</span><h1>{title}</h1><p>Your rewards reflect retained learning, completed quests, and cleared certification challenges.</p></div>
        <div className="profile-level"><span>Level</span><strong>{totals.level}</strong><small>{totals.xp} lifetime XP</small></div>
      </header>

      <div className="profile-stat-grid">
        <article><Star size={22} /><strong>{totalStars}</strong><span>campaign stars</span></article>
        <article><Trophy size={22} /><strong>{domainBosses}</strong><span>domain bosses</span></article>
        <article><Crown size={22} /><strong>{finalBosses}</strong><span>final bosses</span></article>
        <article><Flame size={22} /><strong>{streak.current}</strong><span>day streak</span></article>
        <article><Shield size={22} /><strong>{study.academy.inventory.streakShields}/2</strong><span>streak shields</span></article>
        <article><RefreshCcw size={22} /><strong>{study.academy.inventory.rerolls}/3</strong><span>quest rerolls</span></article>
      </div>

      <div className="profile-grid">
        <section className="trophy-cabinet">
          <div className="academy-section-heading"><div><span className="section-kicker">Trophy cabinet</span><h2>Achievements</h2></div></div>
          <div className="achievement-grid">
            {achievementCopy.map((achievement) => {
              const unlocked = study.academy.achievements[achievement.id];
              return <article className={unlocked ? 'unlocked' : 'locked'} key={achievement.id}><span>{unlocked ? <Trophy size={25} /> : <Medal size={25} />}</span><strong>{achievement.title}</strong><p>{achievement.description}</p><small>{unlocked ? `Unlocked ${new Date(unlocked.unlockedAt).toLocaleDateString()}` : 'Locked'}</small></article>;
            })}
          </div>
        </section>

        <section className="loadout-panel">
          <div className="academy-section-heading"><div><span className="section-kicker">Loadout</span><h2>Titles and map tokens</h2></div></div>
          <h3>Player title</h3>
          <div className="cosmetic-list">
            {academyCosmetics.titles.map((item) => <CosmeticButton key={item.id} id={item.id} label={item.label} unlocked={study.academy.inventory.unlockedCosmetics.includes(item.id)} equipped={study.academy.inventory.equippedTitle === item.id} onEquip={() => equipAcademyCosmetic('title', item.id)} />)}
          </div>
          <h3>Map token</h3>
          <div className="cosmetic-list token-list">
            {academyCosmetics.tokens.map((item) => <CosmeticButton key={item.id} id={item.id} label={item.label} unlocked={study.academy.inventory.unlockedCosmetics.includes(item.id)} equipped={study.academy.inventory.equippedToken === item.id} onEquip={() => equipAcademyCosmetic('token', item.id)} icon={tokenIcon(item.id)} />)}
          </div>
        </section>
      </div>

      <section className="profile-theme-rewards">
        <div className="academy-section-heading">
          <div><span className="section-kicker">Colour collection</span><h2>Theme rewards</h2></div>
          <p>{themesRequireUnlock ? 'Build your collection through Academy milestones.' : 'The administrator has made every bonus theme available site-wide.'}</p>
        </div>
        <div className="profile-theme-grid">
          {rewardThemeFamilies.map((family) => {
            const available = isThemeAvailable(family.light, themesRequireUnlock, themeProgress);
            const equipped = theme === family.light.id || theme === family.dark.id;
            const displayOption = theme === family.dark.id ? family.dark : family.light;
            return <article className={equipped ? 'equipped' : available ? '' : 'locked'} key={family.id}>
              <button className="profile-theme-select" disabled={!available} onClick={() => selectTheme(family.light.id)}>
                <span className="profile-theme-swatches" aria-hidden="true">{displayOption.swatches.map((color) => <i style={{ background: color }} key={color} />)}</span>
                <strong>{family.label}</strong>
                <small>{themesRequireUnlock ? family.unlock.requirement : 'Available site-wide'}</small>
                <span className="profile-theme-status">{equipped ? <><Check size={15} /> Equipped</> : available ? <><Sparkles size={15} /> Available</> : <><LockKeyhole size={15} /> Locked</>}</span>
              </button>
              <ThemeModeSwitch family={family} theme={theme} disabled={!available} onChange={selectTheme} />
            </article>;
          })}
        </div>
      </section>

      <section className="profile-campaigns">
        <div className="academy-section-heading"><div><span className="section-kicker">Campaign records</span><h2>Certification worlds</h2></div></div>
        <div>{campaigns.map((campaign) => <button onClick={() => navigate(`/study/${campaign.examCode.toLowerCase()}/academy`)} key={campaign.examCode}><span><strong>{campaign.examCode}</strong><small>{campaign.title}</small></span><span>{campaign.earnedStars}/{campaign.totalStars} <Star size={15} /></span><span>{campaign.passedBosses}/{campaign.zones.length} <Trophy size={15} /></span></button>)}</div>
      </section>
    </section>
  );
}

function CosmeticButton({ id, label, unlocked, equipped, onEquip, icon }: { id: string; label: string; unlocked: boolean; equipped: boolean; onEquip: () => void; icon?: React.ReactNode }) {
  return <button className={equipped ? 'equipped' : ''} disabled={!unlocked} onClick={onEquip} title={unlocked ? label : `${label} is locked`}><span>{icon ?? <Medal size={18} />}</span><strong>{label}</strong>{equipped && <Check size={16} />}{!unlocked && <small>Locked</small>}</button>;
}

function tokenIcon(id: string): React.ReactNode {
  if (id === 'token-crown') return <Crown size={30} />;
  if (id === 'token-bolt') return <Zap size={30} />;
  return <BrainCircuit size={30} />;
}
