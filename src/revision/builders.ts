import type {
  RevisionBlock,
  RevisionCalloutTone,
  RevisionPage,
  RevisionQuickCheckBlock
} from './types';

type LessonInput = Omit<RevisionPage, 'blocks'> & {
  overview: string[];
  keyPoints: string[];
  comparison?: { title: string; columns: string[]; rows: string[][] };
  flow?: { title: string; steps: Array<{ title: string; text: string }> };
  insight: string[];
  traps: string[];
  checklist: string[];
  recall: RevisionQuickCheckBlock['items'];
  extraBlocks?: RevisionBlock[];
};

export function lesson(input: LessonInput): RevisionPage {
  const blocks: RevisionBlock[] = [
    {
      id: `${input.id}-overview`,
      type: 'text',
      title: 'The 60-second overview',
      paragraphs: input.overview,
      bullets: input.keyPoints
    }
  ];

  if (input.comparison) {
    blocks.push({ id: `${input.id}-comparison`, type: 'comparison', ...input.comparison });
  }
  if (input.flow) {
    blocks.push({ id: `${input.id}-flow`, type: 'flow', ...input.flow });
  }
  if (input.extraBlocks) blocks.push(...input.extraBlocks);
  blocks.push(
    callout(`${input.id}-insight`, 'Helpful insight', 'insight', input.insight),
    callout(`${input.id}-traps`, 'Exam traps and common confusions', 'exam-trap', input.traps),
    { id: `${input.id}-checklist`, type: 'checklist', title: 'Revision checklist', items: input.checklist },
    { id: `${input.id}-recall`, type: 'quick-check', title: 'Quick recall', items: input.recall }
  );

  const { overview: _overview, keyPoints: _keyPoints, comparison: _comparison, flow: _flow, insight: _insight,
    traps: _traps, checklist: _checklist, recall: _recall, extraBlocks: _extraBlocks, ...page } = input;
  return { ...page, blocks };
}

export function callout(id: string, title: string, tone: RevisionCalloutTone, paragraphs: string[]): RevisionBlock {
  return { id, title, type: 'callout', tone, paragraphs };
}
