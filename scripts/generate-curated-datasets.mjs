import { writeFileSync } from 'node:fs';
import { ai901Definition } from './content/ai901.mjs';
import { az900Definition } from './content/az900.mjs';

for (const definition of [ai901Definition, az900Definition]) compile(definition);

function compile(definition) {
  definition.papers.forEach((paper, paperIndex) => {
    const items = paper.items.map((draft, questionIndex) => {
      const objective = definition.objectives[draft.objectiveId];
      if (!objective) throw new Error(`${definition.examCode} paper ${paperIndex + 1} question ${questionIndex + 1} has unknown objective ${draft.objectiveId}`);
      const reference = definition.references[draft.reference ?? draft.objectiveId];
      if (!reference) throw new Error(`${definition.examCode} ${draft.objectiveId} has no reference`);
      const { reference: _reference, ...item } = draft;
      return {
        ...item,
        id: `${definition.idPrefix}-r1-p${paperIndex + 1}-q${String(questionIndex + 1).padStart(2, '0')}`,
        domainId: objective.domainId,
        references: [reference]
      };
    });
    const dataset = {
      title: `${definition.examCode} Mock Exam ${paperIndex + 1}: ${paper.title}`,
      description: `A 50-question unofficial mock paper aligned to the ${definition.examCode} skills measured from ${definition.skillsDate}. Uses realistic dropdown, statement, single-choice, and multiple-answer formats with original questions and official Microsoft Learn references.`,
      tags: definition.tags,
      shuffleQuestions: true,
      kind: 'exam',
      curated: true,
      examCode: definition.examCode,
      blueprintVersion: definition.blueprintVersion,
      contentRevision: '2026-realistic-v1',
      durationMinutes: 45,
      readinessTarget: 70,
      domains: definition.domains,
      items
    };
    writeFileSync(`datasets/${definition.examCode.toLowerCase()}-mock-exam-${paperIndex + 1}.json`, `${JSON.stringify(dataset, null, 2)}\n`);
  });
}
