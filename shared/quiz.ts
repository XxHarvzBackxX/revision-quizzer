export type QuizItemType = 'flashcard' | 'free-write' | 'multiple-choice' | 'multi-select';
export type DatasetKind = 'quiz' | 'exam';
export type Difficulty = 'easy' | 'medium' | 'hard';

export type QuestionReference = {
  title: string;
  url: string;
};

export type BaseQuizItem = {
  type: QuizItemType;
  prompt: string;
  id?: string;
  domainId?: string;
  objectiveId?: string;
  difficulty?: Difficulty;
  explanation?: string;
  references?: QuestionReference[];
  /** Runtime provenance used when a certification drill combines multiple papers. */
  sourceDatasetId?: string;
  sourceDatasetSlug?: string;
  sourceQuestionId?: string;
};

export type FlashcardItem = BaseQuizItem & {
  type: 'flashcard';
  answer: string;
};

export type FreeWriteItem = BaseQuizItem & {
  type: 'free-write';
  answer: string;
};

export type MultipleChoiceItem = BaseQuizItem & {
  type: 'multiple-choice';
  answer: string;
  options: string[];
};

export type MultiSelectItem = BaseQuizItem & {
  type: 'multi-select';
  answers: string[];
  options: string[];
};

export type QuizItem = FlashcardItem | FreeWriteItem | MultipleChoiceItem | MultiSelectItem;

export type ExamDomain = {
  id: string;
  title: string;
  weight: number;
};

export type DatasetInput = {
  title: string;
  description?: string;
  tags?: string[];
  shuffleQuestions?: boolean;
  kind?: DatasetKind;
  curated?: boolean;
  examCode?: string;
  blueprintVersion?: string;
  durationMinutes?: number;
  readinessTarget?: number;
  domains?: ExamDomain[];
  items: QuizItem[];
};

export type PublicDataset = DatasetInput & {
  id: string;
  slug: string;
  itemCount: number;
  createdAt: string;
  status?: 'approved' | 'pending';
};

export type DatasetSummary = Omit<PublicDataset, 'items'>;

export type AdminConfig = {
  moderationEnabled: boolean;
  uploadKey: string;
};

export type PublicConfig = {
  uploadKeyRequired: boolean;
};

export type ValidationResult =
  | { ok: true; value: DatasetInput }
  | { ok: false; errors: string[] };

const MAX_ITEMS = 250;
const MAX_PROMPT_LENGTH = 2400;
const MAX_ANSWER_LENGTH = 1200;
const MAX_EXPLANATION_LENGTH = 2400;
const MAX_TITLE_LENGTH = 120;
const MAX_DESCRIPTION_LENGTH = 800;
const MAX_TAGS = 8;
const MAX_TAG_LENGTH = 32;
const MAX_OPTIONS = 8;

export function validateDataset(input: unknown): ValidationResult {
  const errors: string[] = [];

  if (!isRecord(input)) {
    return { ok: false, errors: ['Dataset must be a JSON object.'] };
  }

  const title = normalizeText(input.title);
  const description = normalizeOptionalText(input.description);
  const tags = normalizeTags(input.tags, errors);
  const shuffleQuestions = Boolean(input.shuffleQuestions);
  const kind: DatasetKind = input.kind === 'exam' ? 'exam' : 'quiz';
  const curated = Boolean(input.curated);
  const examCode = normalizeOptionalText(input.examCode);
  const blueprintVersion = normalizeOptionalText(input.blueprintVersion);
  const durationMinutes = normalizeOptionalNumber(input.durationMinutes);
  const readinessTarget = normalizeOptionalNumber(input.readinessTarget);
  const domains = normalizeDomains(input.domains, errors);
  const items = Array.isArray(input.items) ? input.items : [];

  if (!title) {
    errors.push('Dataset title is required.');
  } else if (title.length > MAX_TITLE_LENGTH) {
    errors.push(`Dataset title must be ${MAX_TITLE_LENGTH} characters or fewer.`);
  }

  if (description && description.length > MAX_DESCRIPTION_LENGTH) {
    errors.push(`Dataset description must be ${MAX_DESCRIPTION_LENGTH} characters or fewer.`);
  }

  if (!Array.isArray(input.items)) {
    errors.push('Dataset items must be an array.');
  } else if (items.length === 0) {
    errors.push('Dataset must include at least one quiz item.');
  } else if (items.length > MAX_ITEMS) {
    errors.push(`Dataset cannot include more than ${MAX_ITEMS} quiz items.`);
  }

  if (durationMinutes !== undefined && (!Number.isInteger(durationMinutes) || durationMinutes < 1 || durationMinutes > 480)) {
    errors.push('Duration must be a whole number between 1 and 480 minutes.');
  }
  if (readinessTarget !== undefined && (readinessTarget < 1 || readinessTarget > 100)) {
    errors.push('Readiness target must be between 1 and 100.');
  }
  if (kind === 'exam' && curated) {
    if (!examCode) errors.push('Curated exams must include an exam code.');
    if (!blueprintVersion) errors.push('Curated exams must include a blueprint version.');
    if (!durationMinutes) errors.push('Curated exams must include a duration.');
    if (!readinessTarget) errors.push('Curated exams must include a readiness target.');
    if (domains.length === 0) errors.push('Curated exams must define their blueprint domains.');
  }

  const validItems = items
    .map((item, index) => normalizeItem(item, index, errors, kind === 'exam' && curated))
    .filter(Boolean) as QuizItem[];

  const itemIds = validItems.map((item) => item.id).filter(Boolean) as string[];
  if (new Set(itemIds).size !== itemIds.length) {
    errors.push('Question IDs must be unique within a dataset.');
  }

  if (kind === 'exam' && curated) {
    const domainIds = new Set(domains.map((domain) => domain.id));
    for (const item of validItems) {
      if (item.domainId && !domainIds.has(item.domainId)) {
        errors.push(`Question ${item.id ?? item.prompt.slice(0, 24)} uses an unknown domain.`);
      }
    }
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    value: {
      title,
      description,
      tags,
      shuffleQuestions,
      kind,
      curated,
      examCode: examCode || undefined,
      blueprintVersion: blueprintVersion || undefined,
      durationMinutes,
      readinessTarget,
      domains: domains.length ? domains : undefined,
      items: validItems
    }
  };
}

export function normalizeAnswer(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function answerSimilarity(actual: string, expected: string): number {
  const left = normalizeAnswer(actual);
  const right = normalizeAnswer(expected);

  if (!left && !right) return 1;
  if (!left || !right) return 0;
  if (left === right) return 1;

  const distance = levenshtein(left, right);
  return Math.max(0, 1 - distance / Math.max(left.length, right.length));
}

export function isFreeWritePass(actual: string, expected: string): boolean {
  return answerSimilarity(actual, expected) >= 0.5;
}

export function getCorrectAnswers(item: QuizItem): string[] {
  return item.type === 'multi-select' ? item.answers : [item.answer];
}

export function isObjectiveItem(item: QuizItem): item is MultipleChoiceItem | MultiSelectItem {
  return item.type === 'multiple-choice' || item.type === 'multi-select';
}

export function isResponseCorrect(item: QuizItem, response: string[]): boolean {
  if (item.type === 'free-write') {
    return isFreeWritePass(response[0] ?? '', item.answer);
  }

  const expected = getCorrectAnswers(item).map(normalizeAnswer).sort();
  const actual = response.map(normalizeAnswer).filter(Boolean).sort();
  return expected.length === actual.length && expected.every((answer, index) => answer === actual[index]);
}

export function createSlug(title: string, id: string): string {
  const base = normalizeAnswer(title).replace(/\s+/g, '-').slice(0, 64) || 'dataset';
  return `${base}-${id.slice(0, 8)}`;
}

function normalizeItem(item: unknown, index: number, errors: string[], strictExam: boolean): QuizItem | null {
  const label = `Item ${index + 1}`;
  if (!isRecord(item)) {
    errors.push(`${label} must be an object.`);
    return null;
  }

  const type = item.type;
  const prompt = normalizeText(item.prompt);
  const answer = normalizeText(item.answer);
  const answers = Array.isArray(item.answers) ? item.answers.map(normalizeText).filter(Boolean) : [];
  const id = normalizeOptionalText(item.id);
  const domainId = normalizeOptionalText(item.domainId);
  const objectiveId = normalizeOptionalText(item.objectiveId);
  const explanation = normalizeOptionalText(item.explanation);
  const difficulty: Difficulty | undefined = item.difficulty === 'easy' || item.difficulty === 'medium' || item.difficulty === 'hard'
    ? item.difficulty
    : undefined;
  const references = normalizeReferences(item.references, label, errors);

  if (type !== 'flashcard' && type !== 'free-write' && type !== 'multiple-choice' && type !== 'multi-select') {
    errors.push(`${label} type must be flashcard, free-write, multiple-choice, or multi-select.`);
  }
  if (!prompt) errors.push(`${label} prompt is required.`);
  else if (prompt.length > MAX_PROMPT_LENGTH) errors.push(`${label} prompt must be ${MAX_PROMPT_LENGTH} characters or fewer.`);
  if (explanation.length > MAX_EXPLANATION_LENGTH) errors.push(`${label} explanation must be ${MAX_EXPLANATION_LENGTH} characters or fewer.`);

  if (strictExam) {
    if (!id) errors.push(`${label} must include a stable ID.`);
    if (!domainId) errors.push(`${label} must include a domain.`);
    if (!objectiveId) errors.push(`${label} must include an objective.`);
    if (!difficulty) errors.push(`${label} must include a difficulty.`);
    if (!explanation) errors.push(`${label} must include an explanation.`);
    if (references.length === 0) errors.push(`${label} must include at least one reference.`);
    if (type === 'flashcard' || type === 'free-write') errors.push(`${label} uses a study-only question type in a curated exam.`);
  }

  const metadata: Omit<BaseQuizItem, 'type' | 'prompt'> = {
    ...(id ? { id } : {}),
    ...(domainId ? { domainId } : {}),
    ...(objectiveId ? { objectiveId } : {}),
    ...(difficulty ? { difficulty } : {}),
    ...(explanation ? { explanation } : {}),
    ...(references.length ? { references } : {})
  };

  if (type === 'multiple-choice' || type === 'multi-select') {
    if (!Array.isArray(item.options)) {
      errors.push(`${label} options must be an array.`);
      return null;
    }
    const options = item.options.map(normalizeText).filter(Boolean);
    if (options.length < 2) errors.push(`${label} must include at least two options.`);
    if (options.length > MAX_OPTIONS) errors.push(`${label} cannot include more than ${MAX_OPTIONS} options.`);
    if (new Set(options.map(normalizeAnswer)).size !== options.length) errors.push(`${label} options must be unique.`);

    if (type === 'multiple-choice') {
      if (!answer) errors.push(`${label} answer is required.`);
      else if (answer.length > MAX_ANSWER_LENGTH) errors.push(`${label} answer must be ${MAX_ANSWER_LENGTH} characters or fewer.`);
      if (!options.some((option) => normalizeAnswer(option) === normalizeAnswer(answer))) errors.push(`${label} options must include the answer.`);
      if (prompt && answer && options.length >= 2) return { type, prompt, answer, options, ...metadata };
    }

    if (type === 'multi-select') {
      if (answers.length < 2) errors.push(`${label} must include at least two correct answers.`);
      if (answers.length >= options.length) errors.push(`${label} must include at least one incorrect option.`);
      if (answers.some((value) => !options.some((option) => normalizeAnswer(option) === normalizeAnswer(value)))) {
        errors.push(`${label} options must include every correct answer.`);
      }
      if (prompt && answers.length >= 2 && options.length >= 3) return { type, prompt, answers, options, ...metadata };
    }
  }

  if (type === 'flashcard' || type === 'free-write') {
    if (!answer) errors.push(`${label} answer is required.`);
    else if (answer.length > MAX_ANSWER_LENGTH) errors.push(`${label} answer must be ${MAX_ANSWER_LENGTH} characters or fewer.`);
    if (prompt && answer && type === 'flashcard') return { type, prompt, answer, ...metadata };
    if (prompt && answer && type === 'free-write') return { type, prompt, answer, ...metadata };
  }

  return null;
}

function normalizeDomains(value: unknown, errors: string[]): ExamDomain[] {
  if (value === undefined) return [];
  if (!Array.isArray(value)) {
    errors.push('Domains must be an array.');
    return [];
  }

  const domains = value.flatMap((entry, index) => {
    if (!isRecord(entry)) {
      errors.push(`Domain ${index + 1} must be an object.`);
      return [];
    }
    const id = normalizeText(entry.id);
    const title = normalizeText(entry.title);
    const weight = normalizeOptionalNumber(entry.weight);
    if (!id || !title || weight === undefined || weight <= 0 || weight > 100) {
      errors.push(`Domain ${index + 1} must include an ID, title, and weight between 1 and 100.`);
      return [];
    }
    return [{ id, title, weight }];
  });
  const total = domains.reduce((sum, domain) => sum + domain.weight, 0);
  if (domains.length && Math.abs(total - 100) > 0.01) errors.push('Domain weights must total 100.');
  return domains;
}

function normalizeReferences(value: unknown, label: string, errors: string[]): QuestionReference[] {
  if (value === undefined) return [];
  if (!Array.isArray(value)) {
    errors.push(`${label} references must be an array.`);
    return [];
  }
  return value.flatMap((entry, index) => {
    if (!isRecord(entry)) {
      errors.push(`${label} reference ${index + 1} must be an object.`);
      return [];
    }
    const title = normalizeText(entry.title);
    const url = normalizeText(entry.url);
    if (!title || !/^https:\/\//i.test(url)) {
      errors.push(`${label} reference ${index + 1} must include a title and HTTPS URL.`);
      return [];
    }
    return [{ title, url }];
  });
}

function normalizeTags(value: unknown, errors: string[]): string[] {
  if (value === undefined) return [];
  if (!Array.isArray(value)) {
    errors.push('Tags must be an array of strings.');
    return [];
  }
  const tags = value.map(normalizeText).filter(Boolean).slice(0, MAX_TAGS);
  if (tags.some((tag) => tag.length > MAX_TAG_LENGTH)) errors.push(`Tags must be ${MAX_TAG_LENGTH} characters or fewer.`);
  return Array.from(new Set(tags.map((tag) => tag.toLowerCase())));
}

function normalizeOptionalNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function normalizeOptionalText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function levenshtein(left: string, right: string): number {
  const previous = Array.from({ length: right.length + 1 }, (_, index) => index);
  const current = Array.from({ length: right.length + 1 }, () => 0);
  for (let i = 1; i <= left.length; i += 1) {
    current[0] = i;
    for (let j = 1; j <= right.length; j += 1) {
      const substitutionCost = left[i - 1] === right[j - 1] ? 0 : 1;
      current[j] = Math.min(current[j - 1] + 1, previous[j] + 1, previous[j - 1] + substitutionCost);
    }
    for (let j = 0; j <= right.length; j += 1) previous[j] = current[j];
  }
  return previous[right.length];
}
