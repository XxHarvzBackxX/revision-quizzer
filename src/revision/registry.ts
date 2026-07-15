import { ai901Course } from './content/ai901';
import { az900Course } from './content/az900';
import type { RevisionBlock, RevisionCourse, RevisionPage, RevisionSearchResult, RevisionTextSegment } from './types';

export const revisionCourses: RevisionCourse[] = [ai901Course, az900Course];

export function getRevisionCourse(examCode: string | undefined): RevisionCourse | undefined {
  return examCode ? revisionCourses.find((course) => course.examCode.toLowerCase() === examCode.toLowerCase()) : undefined;
}

export function getRevisionPage(course: RevisionCourse, slugOrId: string | undefined): RevisionPage | undefined {
  if (!slugOrId) return undefined;
  return course.pages.find((page) => page.slug === slugOrId || page.id === slugOrId || page.objectiveId === slugOrId);
}

export function revisionPathForObjective(examCode?: string, objectiveId?: string, blockId?: string): string | undefined {
  const course = getRevisionCourse(examCode);
  const page = course && getRevisionPage(course, objectiveId);
  if (!course || !page) return undefined;
  const base = `/wiki/${course.examCode.toLowerCase()}/${page.slug}`;
  return blockId ? `${base}#${encodeURIComponent(blockId)}` : base;
}

export function getCoursePath(examCode?: string): string | undefined {
  const course = getRevisionCourse(examCode);
  return course ? `/wiki/${course.examCode.toLowerCase()}` : undefined;
}

export function searchRevisionContent(query: string, examCode?: string): RevisionSearchResult[] {
  const terms = normalize(query).split(' ').filter((term) => term.length > 1);
  if (!terms.length) return [];
  const courses = examCode ? revisionCourses.filter((course) => course.examCode.toLowerCase() === examCode.toLowerCase()) : revisionCourses;
  const results: RevisionSearchResult[] = [];

  for (const course of courses) {
    for (const page of course.pages) {
      const pageTitle = normalize(`${page.title} ${page.summary} ${page.keywords.join(' ')} ${page.blueprintPoints.join(' ')}`);
      const pageScore = scoreText(pageTitle, terms, normalize(page.title));
      if (pageScore > 0) {
        results.push({
          courseCode: course.examCode,
          pageId: page.id,
          pageSlug: page.slug,
          title: page.title,
          excerpt: page.summary,
          score: pageScore + 8
        });
      }
      for (const block of page.blocks) {
        const text = blockSearchText(block);
        const score = scoreText(normalize(text), terms, normalize(block.title ?? ''));
        if (score > 0) {
          results.push({
            courseCode: course.examCode,
            pageId: page.id,
            pageSlug: page.slug,
            blockId: block.id,
            title: page.title,
            section: block.title,
            excerpt: excerptAround(text, terms),
            score
          });
        }
      }
    }
  }

  return results.sort((left, right) => right.score - left.score || left.title.localeCompare(right.title)).slice(0, 30);
}

export function getBlockSegments(block: RevisionBlock): RevisionTextSegment[] {
  if (block.type === 'text') {
    return [
      ...(block.paragraphs ?? []).map((text, index) => ({ id: `p${index}`, text })),
      ...(block.bullets ?? []).map((text, index) => ({ id: `b${index}`, text }))
    ];
  }
  if (block.type === 'callout') return block.paragraphs.map((text, index) => ({ id: `p${index}`, text }));
  if (block.type === 'checklist') return block.items.map((text, index) => ({ id: `i${index}`, text }));
  return [];
}

export function blockSearchText(block: RevisionBlock): string {
  const heading = block.title ?? '';
  if (block.type === 'text') return [heading, ...(block.paragraphs ?? []), ...(block.bullets ?? [])].join(' ');
  if (block.type === 'callout') return [heading, ...block.paragraphs].join(' ');
  if (block.type === 'checklist') return [heading, ...block.items].join(' ');
  if (block.type === 'comparison') return [heading, ...block.columns, ...block.rows.flat()].join(' ');
  if (block.type === 'flow') return [heading, ...block.steps.flatMap((step) => [step.title, step.text])].join(' ');
  return [heading, ...block.items.flatMap((item) => [item.question, item.answer])].join(' ');
}

export function validateRevisionRegistry(courses = revisionCourses): string[] {
  const errors: string[] = [];
  const expected: Record<string, string[]> = {
    'AI-901': ['responsible-ai', 'model-components', 'ai-workloads', 'foundry-generative', 'foundry-text-speech', 'foundry-vision', 'foundry-extraction'],
    'AZ-900': ['cloud-computing', 'cloud-benefits', 'service-types', 'azure-architecture', 'compute-networking', 'azure-storage', 'identity-security', 'cost-management', 'governance-compliance', 'management-deployment', 'monitoring']
  };

  for (const course of courses) {
    const sourceIds = new Set(course.sources.map((source) => source.id));
    uniqueErrors(course.pages.map((page) => page.id), `${course.examCode} page ID`, errors);
    uniqueErrors(course.pages.map((page) => page.slug), `${course.examCode} page slug`, errors);
    uniqueErrors(course.pages.map((page) => page.objectiveId), `${course.examCode} objective`, errors);
    const expectedObjectives = expected[course.examCode] ?? [];
    for (const objective of expectedObjectives) {
      if (!course.pages.some((page) => page.objectiveId === objective)) errors.push(`${course.examCode} is missing objective ${objective}.`);
    }
    for (const page of course.pages) {
      if (!course.domains.some((domain) => domain.id === page.domainId)) errors.push(`${course.examCode}/${page.id} has an unknown domain.`);
      if (!page.blueprintPoints.length) errors.push(`${course.examCode}/${page.id} has no blueprint points.`);
      if (!page.blocks.length) errors.push(`${course.examCode}/${page.id} has no content blocks.`);
      uniqueErrors(page.blocks.map((block) => block.id), `${course.examCode}/${page.id} block ID`, errors);
      for (const id of page.sourceIds) if (!sourceIds.has(id)) errors.push(`${course.examCode}/${page.id} references unknown source ${id}.`);
    }
    for (const source of course.sources) {
      if (!/^https:\/\/learn\.microsoft\.com\//.test(source.url)) errors.push(`${course.examCode} source ${source.id} is not a Microsoft Learn HTTPS URL.`);
    }
  }
  uniqueErrors(courses.map((course) => course.examCode.toLowerCase()), 'course code', errors);
  return errors;
}

function scoreText(text: string, terms: string[], title: string): number {
  if (!terms.every((term) => text.includes(term))) return 0;
  return terms.reduce((score, term) => score + occurrences(text, term) + (title.includes(term) ? 5 : 0), 0);
}

function occurrences(text: string, term: string): number {
  return text.split(term).length - 1;
}

function excerptAround(text: string, terms: string[]): string {
  const normalized = normalize(text);
  const positions = terms.map((term) => normalized.indexOf(term)).filter((position) => position >= 0);
  const firstMatch = positions.length ? Math.min(...positions) : 0;
  const start = Math.max(0, firstMatch - 55);
  const excerpt = text.slice(start, start + 190).trim();
  return `${start > 0 ? '…' : ''}${excerpt}${start + 190 < text.length ? '…' : ''}`;
}

function normalize(value: string): string {
  return value.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9\s-]/g, ' ').replace(/\s+/g, ' ').trim();
}

function uniqueErrors(values: string[], label: string, errors: string[]) {
  const seen = new Set<string>();
  for (const value of values) {
    if (seen.has(value)) errors.push(`Duplicate ${label}: ${value}.`);
    seen.add(value);
  }
}
