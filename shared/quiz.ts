export type QuizItemType = 'flashcard' | 'free-write' | 'multiple-choice';

export type BaseQuizItem = {
  type: QuizItemType;
  prompt: string;
  answer: string;
};

export type FlashcardItem = BaseQuizItem & {
  type: 'flashcard';
};

export type FreeWriteItem = BaseQuizItem & {
  type: 'free-write';
};

export type MultipleChoiceItem = BaseQuizItem & {
  type: 'multiple-choice';
  options: string[];
};

export type QuizItem = FlashcardItem | FreeWriteItem | MultipleChoiceItem;

export type DatasetInput = {
  title: string;
  description?: string;
  tags?: string[];
  shuffleQuestions?: boolean;
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
const MAX_TEXT_LENGTH = 800;
const MAX_TITLE_LENGTH = 120;
const MAX_DESCRIPTION_LENGTH = 500;
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

  const validItems = items.map((item, index) => normalizeItem(item, index, errors)).filter(Boolean) as QuizItem[];

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

  if (!left && !right) {
    return 1;
  }

  if (!left || !right) {
    return 0;
  }

  if (left === right) {
    return 1;
  }

  const distance = levenshtein(left, right);
  return Math.max(0, 1 - distance / Math.max(left.length, right.length));
}

export function isFreeWritePass(actual: string, expected: string): boolean {
  return answerSimilarity(actual, expected) >= 0.5;
}

export function createSlug(title: string, id: string): string {
  const base = normalizeAnswer(title).replace(/\s+/g, '-').slice(0, 64) || 'dataset';
  return `${base}-${id.slice(0, 8)}`;
}

function normalizeItem(item: unknown, index: number, errors: string[]): QuizItem | null {
  const label = `Item ${index + 1}`;

  if (!isRecord(item)) {
    errors.push(`${label} must be an object.`);
    return null;
  }

  const type = item.type;
  const prompt = normalizeText(item.prompt);
  const answer = normalizeText(item.answer);

  if (type !== 'flashcard' && type !== 'free-write' && type !== 'multiple-choice') {
    errors.push(`${label} type must be flashcard, free-write, or multiple-choice.`);
  }

  if (!prompt) {
    errors.push(`${label} prompt is required.`);
  } else if (prompt.length > MAX_TEXT_LENGTH) {
    errors.push(`${label} prompt must be ${MAX_TEXT_LENGTH} characters or fewer.`);
  }

  if (!answer) {
    errors.push(`${label} answer is required.`);
  } else if (answer.length > MAX_TEXT_LENGTH) {
    errors.push(`${label} answer must be ${MAX_TEXT_LENGTH} characters or fewer.`);
  }

  if (type === 'multiple-choice') {
    if (!Array.isArray(item.options)) {
      errors.push(`${label} options must be an array.`);
      return null;
    }

    const options = item.options.map(normalizeText).filter(Boolean);
    if (options.length < 2) {
      errors.push(`${label} must include at least two options.`);
    }
    if (options.length > MAX_OPTIONS) {
      errors.push(`${label} cannot include more than ${MAX_OPTIONS} options.`);
    }
    if (!options.some((option) => normalizeAnswer(option) === normalizeAnswer(answer))) {
      errors.push(`${label} options must include the answer.`);
    }

    if (type === 'multiple-choice' && prompt && answer && options.length >= 2) {
      return { type, prompt, answer, options };
    }
  }

  if (type === 'flashcard' && prompt && answer) {
    return { type, prompt, answer };
  }

  if (type === 'free-write' && prompt && answer) {
    return { type, prompt, answer };
  }

  return null;
}

function normalizeTags(value: unknown, errors: string[]): string[] {
  if (value === undefined) {
    return [];
  }

  if (!Array.isArray(value)) {
    errors.push('Tags must be an array of strings.');
    return [];
  }

  const tags = value.map(normalizeText).filter(Boolean).slice(0, MAX_TAGS);
  const invalidTag = tags.find((tag) => tag.length > MAX_TAG_LENGTH);
  if (invalidTag) {
    errors.push(`Tags must be ${MAX_TAG_LENGTH} characters or fewer.`);
  }

  return Array.from(new Set(tags.map((tag) => tag.toLowerCase())));
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
      current[j] = Math.min(
        current[j - 1] + 1,
        previous[j] + 1,
        previous[j - 1] + substitutionCost
      );
    }

    for (let j = 0; j <= right.length; j += 1) {
      previous[j] = current[j];
    }
  }

  return previous[right.length];
}
