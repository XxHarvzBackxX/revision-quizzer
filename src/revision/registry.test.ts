import { describe, expect, it } from 'vitest';
import aiPaper from '../../datasets/ai-901-mock-exam-1.json';
import azPaper from '../../datasets/az-900-mock-exam-1.json';
import { getRevisionCourse, revisionPathForObjective, searchRevisionContent, validateRevisionRegistry } from './registry';

describe('RevisionWiki content registry', () => {
  it('contains a valid, complete page for every built-in exam objective', () => {
    expect(validateRevisionRegistry()).toEqual([]);
    const ai = getRevisionCourse('AI-901');
    const az = getRevisionCourse('az-900');
    expect(ai?.pages).toHaveLength(7);
    expect(az?.pages).toHaveLength(11);

    for (const paper of [aiPaper, azPaper]) {
      const objectives = new Set(paper.items.map((item) => item.objectiveId));
      const course = getRevisionCourse(paper.examCode);
      expect(new Set(course?.pages.map((page) => page.objectiveId))).toEqual(objectives);
      for (const objective of objectives) expect(revisionPathForObjective(paper.examCode, objective)).toMatch(/^\/wiki\//);
    }
  });

  it('searches headings, keywords, blueprint points, and section text', () => {
    const allResults = searchRevisionContent('shared responsibility');
    expect(allResults[0]).toMatchObject({ courseCode: 'AZ-900' });
    expect(allResults.some((result) => result.pageId === 'cloud-computing')).toBe(true);

    const scoped = searchRevisionContent('grounding', 'AI-901');
    expect(scoped.length).toBeGreaterThan(0);
    expect(scoped.every((result) => result.courseCode === 'AI-901')).toBe(true);
  });

  it('uses unique stable IDs for all annotatable content', () => {
    for (const examCode of ['AI-901', 'AZ-900']) {
      const course = getRevisionCourse(examCode)!;
      expect(new Set(course.pages.map((page) => page.id)).size).toBe(course.pages.length);
      for (const page of course.pages) expect(new Set(page.blocks.map((block) => block.id)).size).toBe(page.blocks.length);
    }
  });
});
