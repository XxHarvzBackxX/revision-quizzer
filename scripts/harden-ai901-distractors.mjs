import { readFileSync, writeFileSync } from 'node:fs';

function hardenItem(item, index) {
  const replacement = replacements.get(item.prompt);
  if (replacement) {
    return replacement;
  }

  const options = closeOptions(item.answer, item.prompt, index);
  return {
    ...item,
    options
  };
}

function closeOptions(answer, prompt, index) {
  const pool = choosePool(answer, prompt);
  const choices = [answer];

  for (const option of rotate(pool, index)) {
    if (normalize(option) !== normalize(answer) && !choices.some((choice) => normalize(choice) === normalize(option))) {
      choices.push(option);
    }
    if (choices.length === 4) break;
  }

  return choices;
}

function choosePool(answer, prompt) {
  const haystack = `${answer} ${prompt}`.toLowerCase();

  if (haystack.includes('prompt agent') || haystack.includes('hosted agent') || haystack.includes('responses api')) {
    return [
      'Prompt agent',
      'Hosted agent',
      'Call the Responses API directly from the existing process',
      'Create a custom tool hosted outside Foundry and call it from a prompt agent',
      'Use a lightweight client that invokes a published agent endpoint'
    ];
  }

  if (haystack.includes('file search') || haystack.includes('code interpreter') || haystack.includes('web search') || haystack.includes('memory') || haystack.includes('custom function')) {
    return [
      'File search',
      'Code interpreter',
      'Web search',
      'Memory',
      'A custom function or API tool with controlled authentication',
      'A connected MCP server with scoped tools'
    ];
  }

  if (haystack.includes('content understanding') || haystack.includes('analyzer') || haystack.includes('confidence') || haystack.includes('grounding')) {
    return [
      'Content Understanding with a custom or prebuilt analyzer',
      'Azure AI Search vector indexing without field extraction',
      'A multimodal model prompt without a defined extraction schema',
      'Document Intelligence-style OCR followed by manual review',
      'Content Understanding with confidence scores and grounding enabled'
    ];
  }

  if (haystack.includes('speech')) {
    return [
      'Speech recognition followed by model processing and speech synthesis',
      'Speech synthesis only with no transcription step',
      'Text analysis over manually typed transcripts only',
      'A multimodal image model with no audio handling',
      'Speech translation when source and target languages differ'
    ];
  }

  if (haystack.includes('vision') || haystack.includes('image') || haystack.includes('multimodal') || haystack.includes('ocr')) {
    return [
      'A deployed multimodal model that accepts image input',
      'A text-only chat model with no visual input',
      'Content Understanding image extraction',
      'Image generation from a text prompt',
      'OCR or visual text extraction'
    ];
  }

  if (haystack.includes('sentiment') || haystack.includes('entity') || haystack.includes('key phrase') || haystack.includes('summarization') || haystack.includes('text analysis')) {
    return [
      'Entity detection',
      'Key phrase extraction',
      'Sentiment analysis',
      'Summarization',
      'Language detection'
    ];
  }

  if (haystack.includes('fairness') || haystack.includes('transparency') || haystack.includes('accountability') || haystack.includes('inclusiveness') || haystack.includes('privacy') || haystack.includes('reliability')) {
    return [
      'Fairness',
      'Reliability and safety',
      'Privacy and security',
      'Inclusiveness',
      'Transparency',
      'Accountability'
    ];
  }

  if (haystack.includes('temperature') || haystack.includes('tokens') || haystack.includes('model') || haystack.includes('deployment')) {
    return [
      'Lower temperature and constrain maximum output tokens',
      'Use a smaller low-latency model after evaluation',
      'Use a larger reasoning model for complex multi-step tasks',
      'Change the model deployment and re-test quality, latency, and cost',
      'Use grounding instead of relying only on model pretraining'
    ];
  }

  if (haystack.includes('identity') || haystack.includes('rbac') || haystack.includes('credential') || haystack.includes('authorization') || haystack.includes('entra')) {
    return [
      'Microsoft Entra authentication with RBAC scoped to the Foundry project',
      'A browser-exposed API key stored in localStorage',
      'A managed identity or DefaultAzureCredential-based app identity',
      'Anonymous access with tool permissions disabled',
      'OAuth On-Behalf-Of for user-delegated tool access'
    ];
  }

  return [
    'Ground the response with trusted data and validate outputs before use',
    'Use a prompt agent with configured instructions and tools',
    'Use a hosted agent when custom orchestration code is required',
    'Use Content Understanding when structured extraction from multimodal content is required',
    'Use tracing and evaluations to diagnose model and tool behavior'
  ];
}

const replacements = new Map([
  [
    'A dataset upload includes multiple-choice items where the correct answer is always first. What should the quiz UI do?',
    mc(
      'A Foundry agent is given retrieval results where the first result is often irrelevant because of index ranking. The app still needs answer choices to be presented without positional bias. What should the developer do?',
      'Randomize presentation order while preserving the mapping between each option and its underlying value',
      [
        'Randomize presentation order while preserving the mapping between each option and its underlying value',
        'Always trust the first returned item because retrieval ranking is deterministic',
        'Remove all distractors and expose only the top-ranked answer',
        'Sort options alphabetically and assume this removes semantic bias'
      ]
    )
  ],
  [
    'A user accidentally clicks the wrong option in a multiple-choice quiz. Which interaction reduces this risk?',
    mc(
      'An agent can call an order-cancellation tool. The model can identify the likely order, but users sometimes phrase requests ambiguously. Which UX pattern best reduces unintended tool execution?',
      'Require explicit user confirmation before executing the cancellation tool',
      [
        'Require explicit user confirmation before executing the cancellation tool',
        'Execute the tool as soon as the model infers intent',
        'Hide the tool call details to reduce friction',
        'Increase model temperature so the agent explores more actions'
      ]
    )
  ],
  [
    'A flashcard asks a user to recall an answer. What is the fair scoring flow?',
    mc(
      'A training app uses an AI tutor to ask open recall questions. The model cannot reliably determine whether a short learner response is sufficient without rubric context. Which scoring design is most appropriate?',
      'Show the expected answer or rubric and let the learner confirm or request review',
      [
        'Show the expected answer or rubric and let the learner confirm or request review',
        'Always award points when the answer is revealed',
        'Always mark short responses wrong to avoid false positives',
        'Use only sentiment analysis to grade recall accuracy'
      ]
    )
  ],
  [
    'A team wants randomized question order only for datasets that request it. Where should this preference be stored?',
    mc(
      'A Foundry client app supports per-dataset runtime behavior such as whether review items should be randomized. Where should this preference be modeled?',
      'As dataset metadata that the client reads before starting a round',
      [
      'As dataset metadata that the client reads before starting a round',
        'Only as a model deployment parameter because it changes generation quality',
        'Only as a user score field after the round ends',
        'Only in a server log because the client does not need it'
      ]
    )
  ]
]);

function mc(prompt, answer, options) {
  return { type: 'multiple-choice', prompt, answer, options };
}

function rotate(values, offset) {
  return values.map((_, index) => values[(index + offset) % values.length]);
}

function normalize(value) {
  return String(value).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

const files = [
  'datasets/ai-901-mock-exam-1.json',
  'datasets/ai-901-mock-exam-2.json',
  'datasets/ai-901-mock-exam-3.json'
];

for (const file of files) {
  const dataset = JSON.parse(readFileSync(file, 'utf8'));
  dataset.description = dataset.description.replace(
    /Harder unofficial AI-901/,
    'Challenging unofficial AI-901'
  );
  dataset.items = dataset.items.map(hardenItem);
  writeFileSync(file, `${JSON.stringify(dataset, null, 2)}\n`);
}
