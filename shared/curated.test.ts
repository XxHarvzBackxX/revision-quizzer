import { describe, expect, it } from 'vitest';
import ai1 from '../datasets/ai-901-mock-exam-1.json';
import ai2 from '../datasets/ai-901-mock-exam-2.json';
import ai3 from '../datasets/ai-901-mock-exam-3.json';
import az1 from '../datasets/az-900-mock-exam-1.json';
import az2 from '../datasets/az-900-mock-exam-2.json';
import az3 from '../datasets/az-900-mock-exam-3.json';
import { validateDataset } from './quiz';

const papers = [ai1, ai2, ai3, az1, az2, az3];

describe('built-in curated papers', () => {
  it('validates all six enriched datasets', () => {
    for (const paper of papers) {
      const result = validateDataset(paper);
      expect(result.ok, result.ok ? undefined : result.errors.join('\n')).toBe(true);
    }
  });

  it('contains three papers and 150 questions per certification', () => {
    const byExam = papers.reduce<Record<string, { papers: number; questions: number }>>((current, paper) => {
      const result = current[paper.examCode] ?? { papers: 0, questions: 0 };
      result.papers += 1;
      result.questions += paper.items.length;
      current[paper.examCode] = result;
      return current;
    }, {});
    expect(byExam).toEqual({
      'AI-901': { papers: 3, questions: 150 },
      'AZ-900': { papers: 3, questions: 150 }
    });
  });

  it('uses the realistic content revision and target format split on every paper', () => {
    papers.forEach((paper, index) => {
      const formats = paper.items.reduce<Record<string, number>>((counts, item) => ({ ...counts, [item.type]: (counts[item.type] ?? 0) + 1 }), {});
      expect(paper.contentRevision).toBe('2026-realistic-v1');
      expect(formats).toEqual(index % 3 === 1
        ? { 'multiple-choice': 28, dropdown: 7, 'statement-group': 8, 'multi-select': 7 }
        : { 'multiple-choice': 28, dropdown: 8, 'statement-group': 7, 'multi-select': 7 });
    });
  });
});
