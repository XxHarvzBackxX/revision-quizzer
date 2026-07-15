import { readFileSync, writeFileSync } from 'node:fs';

const STUDY_GUIDE = {
  title: 'AI-901 study guide (skills measured from April 15, 2026)',
  url: 'https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/ai-901'
};

const references = {
  'responsible-ai': { title: 'Responsible AI principles and approach', url: 'https://learn.microsoft.com/en-us/azure/machine-learning/concept-responsible-ai' },
  'model-components': { title: 'Model catalog and collections in Microsoft Foundry', url: 'https://learn.microsoft.com/en-us/azure/ai-foundry/how-to/model-catalog-overview' },
  'ai-workloads': { title: 'Introduction to AI concepts', url: 'https://learn.microsoft.com/en-us/training/modules/get-started-ai-fundamentals/' },
  'foundry-generative': { title: 'What is Microsoft Foundry?', url: 'https://learn.microsoft.com/en-us/azure/ai-foundry/what-is-azure-ai-foundry' },
  'foundry-text-speech': { title: 'Azure Speech in Foundry Tools', url: 'https://learn.microsoft.com/en-us/azure/ai-services/speech-service/overview' },
  'foundry-vision': { title: 'Image inputs with Azure OpenAI models', url: 'https://learn.microsoft.com/en-us/azure/ai-services/openai/how-to/gpt-with-vision' },
  'foundry-extraction': { title: 'Azure Content Understanding documentation', url: 'https://learn.microsoft.com/en-us/azure/ai-services/content-understanding/overview' }
};

const objectiveNotes = {
  'responsible-ai': 'Responsible AI decisions should address the relevant principle in the design and operation of the solution, rather than treating governance as a final UI step.',
  'model-components': 'Model capability, deployment choice, and inference settings should be selected against measured quality, latency, cost, and consistency requirements.',
  'ai-workloads': 'The input, required output, and business task identify the workload; unrelated modalities or generative features do not satisfy that requirement.',
  'foundry-generative': 'Foundry apps and agents combine an appropriate deployment with instructions, SDK or API calls, tools, identity, and evaluation according to the scenario.',
  'foundry-text-speech': 'A text or speech solution must use the capability that matches the requested analysis, recognition, translation, or synthesis flow.',
  'foundry-vision': 'Vision solutions use visual-capable models or services when image content must be interpreted or generated.',
  'foundry-extraction': 'Content Understanding uses analyzers and schemas to turn documents, images, audio, or video into grounded structured output.'
};

const multiSelectByPaper = [
  [
    multi('A team is preparing a customer-facing generative AI app for launch. Which TWO actions most directly improve transparency?', ['Tell users that they are interacting with AI', 'Document the system’s intended uses and known limitations'], ['Tell users that they are interacting with AI', 'Document the system’s intended uses and known limitations', 'Increase temperature to make every answer different', 'Remove human review so the experience is consistent'], 'concepts', 'responsible-ai'),
    multi('A team needs repeatable JSON output from a deployed generative model. Which TWO changes generally reduce variation?', ['Lower the temperature', 'Constrain the response with a defined schema'], ['Lower the temperature', 'Constrain the response with a defined schema', 'Increase the temperature', 'Ask for several creative alternatives'], 'concepts', 'model-components'),
    multi('A prompt agent must answer from approved policy documents and call a ticketing function when escalation is required. Which TWO capabilities should be configured?', ['File search grounded on the approved documents', 'A function tool with a controlled ticketing operation'], ['File search grounded on the approved documents', 'A function tool with a controlled ticketing operation', 'Image generation for policy diagrams', 'A higher temperature to encourage escalation'], 'foundry', 'foundry-generative'),
    multi('A Content Understanding solution processes recorded support calls. Which TWO outputs can an audio analyzer produce for downstream processing?', ['A transcript of the spoken content', 'Structured fields defined by the analyzer schema'], ['A transcript of the spoken content', 'Structured fields defined by the analyzer schema', 'A newly generated product image', 'An Azure role assignment for the caller'], 'foundry', 'foundry-extraction')
  ],
  [
    multi('A support team wants to route messages by tone and show the products mentioned in each message. Which TWO text-analysis capabilities are required?', ['Sentiment analysis', 'Entity recognition'], ['Sentiment analysis', 'Entity recognition', 'Speech synthesis', 'Image generation'], 'concepts', 'ai-workloads'),
    multi('A voice assistant must accept a spoken question and read a text answer aloud. Which TWO speech capabilities are required?', ['Speech recognition', 'Speech synthesis'], ['Speech recognition', 'Speech synthesis', 'Object detection', 'Document field extraction'], 'foundry', 'foundry-text-speech'),
    multi('A multimodal client sends a product photograph to a deployed model. Which TWO elements must the request provide?', ['A deployment that supports image input', 'The image content or an accessible image URL in the prompt'], ['A deployment that supports image input', 'The image content or an accessible image URL in the prompt', 'A speech-synthesis voice', 'A Content Understanding audio analyzer'], 'foundry', 'foundry-vision'),
    multi('A production client uses DefaultAzureCredential to call a Foundry project. Which TWO configuration steps support passwordless access?', ['Assign the application identity an appropriate Azure role', 'Use the Foundry project endpoint when creating the client'], ['Assign the application identity an appropriate Azure role', 'Use the Foundry project endpoint when creating the client', 'Embed an administrator password in the browser bundle', 'Allow anonymous access to every project resource'], 'foundry', 'foundry-generative')
  ],
  [
    multi('An agent retrieves content from documents supplied by users. Which TWO controls reduce the risk of prompt injection?', ['Treat retrieved instructions as untrusted data', 'Keep privileged actions behind validation and authorization'], ['Treat retrieved instructions as untrusted data', 'Keep privileged actions behind validation and authorization', 'Let retrieved text replace the system instructions', 'Automatically execute every tool call proposed by the model'], 'concepts', 'responsible-ai'),
    multi('A team is comparing two model deployments for a customer-service application. Which TWO measurements should be collected on representative prompts?', ['Task quality or accuracy', 'Latency and token cost'], ['Task quality or accuracy', 'Latency and token cost', 'The number of CSS rules in the client', 'The alphabetical order of deployment names'], 'concepts', 'model-components'),
    multi('An order-management agent can issue refunds. Which TWO safeguards should be implemented before the tool performs a refund?', ['Validate the tool arguments and authorization', 'Ask for user confirmation when the request is ambiguous or consequential'], ['Validate the tool arguments and authorization', 'Ask for user confirmation when the request is ambiguous or consequential', 'Raise the model temperature before every call', 'Expose the refund API without authentication'], 'foundry', 'foundry-generative'),
    multi('A Content Understanding analyzer extracts fields from invoices. Which TWO practices make the result safer to automate?', ['Define the required fields and types in the analyzer schema', 'Use confidence and grounding information to identify results that need review'], ['Define the required fields and types in the analyzer schema', 'Use confidence and grounding information to identify results that need review', 'Discard the source location of every extracted value', 'Use speech synthesis to verify the invoice total'], 'foundry', 'foundry-extraction')
  ]
];

const files = [
  'datasets/ai-901-mock-exam-1.json',
  'datasets/ai-901-mock-exam-2.json',
  'datasets/ai-901-mock-exam-3.json'
];

for (const [paperIndex, file] of files.entries()) {
  const dataset = JSON.parse(readFileSync(file, 'utf8'));
  const items = dataset.items.map((item) => ({ ...item }));
  const replacementIndexes = [9, 21, 36, 46];
  replacementIndexes.forEach((index, replacementIndex) => { items[index] = multiSelectByPaper[paperIndex][replacementIndex]; });
  if (paperIndex === 2) {
    items[45] = single(
      'A Python application creates an AIProjectClient for a Foundry project. Which value should be supplied together with DefaultAzureCredential?',
      'The Foundry project endpoint',
      ['The Foundry project endpoint', 'The model deployment name by itself', 'The Azure subscription display name', 'The model temperature as the endpoint'],
      'foundry',
      'foundry-generative'
    );
    items[47] = single(
      'A lightweight application needs to call Foundry without embedding a long-lived secret in its source code. Which authentication design is preferred when the app runs in Azure?',
      'Use a managed identity with an appropriate role assignment',
      ['Use a managed identity with an appropriate role assignment', 'Commit an API key to the application repository', 'Send an administrator password with every model prompt', 'Allow anonymous access to the Foundry project'],
      'foundry',
      'foundry-generative'
    );
  }

  assignDomains(items);
  assignDifficulty(items);

  dataset.title = `AI-901 Mock Exam ${paperIndex + 1}: ${['Foundry and Applied AI', 'Workloads and Responsible AI', 'End-to-End Solutions'][paperIndex]}`;
  dataset.description = `A 50-question unofficial mock paper aligned to the AI-901 skills measured from April 15, 2026. Includes realistic scenarios, detailed explanations, and official Microsoft Learn references. Original practice content; not official exam questions.`;
  dataset.tags = ['ai-901', 'azure', 'foundry', 'mock-exam'];
  dataset.shuffleQuestions = true;
  dataset.kind = 'exam';
  dataset.curated = true;
  dataset.examCode = 'AI-901';
  dataset.blueprintVersion = '2026-04-15';
  dataset.durationMinutes = 45;
  dataset.readinessTarget = 70;
  dataset.domains = [
    { id: 'concepts', title: 'Identify AI concepts and capabilities', weight: 44 },
    { id: 'foundry', title: 'Implement AI solutions using Microsoft Foundry', weight: 56 }
  ];
  dataset.items = items.map((item, index) => enrichItem(item, paperIndex, index));
  writeFileSync(file, `${JSON.stringify(dataset, null, 2)}\n`);
}

function enrichItem(item, paperIndex, index) {
  const objectiveId = item.objectiveId || classifyObjective(item, item.domainId);
  const answers = item.type === 'multi-select' ? item.answers : [item.answer];
  const answerText = answers.map((answer) => `“${answer}”`).join(' and ');
  return {
    ...item,
    id: `ai901-p${paperIndex + 1}-q${String(index + 1).padStart(2, '0')}`,
    objectiveId,
    explanation: item.explanation || `${answerText} ${answers.length > 1 ? 'are the required choices' : 'is the best answer'} because the selection directly satisfies the scenario’s stated requirement. ${objectiveNotes[objectiveId]}`,
    references: [references[objectiveId] || STUDY_GUIDE]
  };
}

function assignDomains(items) {
  const scored = items.map((item, index) => ({ index, score: foundryScore(item) }));
  scored.sort((left, right) => right.score - left.score || left.index - right.index);
  const foundryIndexes = new Set(scored.slice(0, 28).map(({ index }) => index));
  items.forEach((item, index) => { item.domainId = foundryIndexes.has(index) ? 'foundry' : 'concepts'; });
}

function foundryScore(item) {
  if (item.domainId === 'foundry') return 100;
  if (item.domainId === 'concepts') return -100;
  const text = `${item.prompt} ${item.answer || ''} ${(item.answers || []).join(' ')}`.toLowerCase();
  const terms = ['foundry', 'sdk', 'api', 'client', 'agent', 'deploy', 'deployment', 'content understanding', 'analyzer', 'tool', 'endpoint', 'credential', 'rbac', 'python', 'code', 'application', 'prompt'];
  return terms.reduce((score, term) => score + (text.includes(term) ? 1 : 0), 0);
}

function assignDifficulty(items) {
  const scored = items.map((item, index) => ({
    index,
    score: item.prompt.length + Math.max(...item.options.map((option) => option.length)) + (item.type === 'multi-select' ? 80 : 0)
  })).sort((left, right) => left.score - right.score || left.index - right.index);
  items.forEach((item) => { item.difficulty = 'medium'; });
  scored.slice(0, 10).forEach(({ index }) => { items[index].difficulty = 'easy'; });
  scored.slice(-10).forEach(({ index }) => { items[index].difficulty = 'hard'; });
}

function classifyObjective(item, domainId) {
  const text = `${item.prompt} ${item.answer || ''} ${(item.answers || []).join(' ')}`.toLowerCase();
  if (domainId === 'concepts') {
    if (/fair|reliab|safe|privacy|security|inclusive|transparen|accountab|responsible|bias|harm|human review|prompt injection/.test(text)) return 'responsible-ai';
    if (/temperature|token|model|deployment|generative|latency|cost|parameter/.test(text)) return 'model-components';
    return 'ai-workloads';
  }
  if (/content understanding|extract|document|form|invoice|receipt|audio|video|analyzer|schema|field/.test(text)) return 'foundry-extraction';
  if (/vision|image|visual|ocr|object detection/.test(text)) return 'foundry-vision';
  if (/speech|spoken|transcri|synthesi|sentiment|entity|key phrase|summar/.test(text)) return 'foundry-text-speech';
  return 'foundry-generative';
}

function multi(prompt, answers, options, domainId, objectiveId) {
  return { type: 'multi-select', prompt, answers, options, domainId, objectiveId };
}

function single(prompt, answer, options, domainId, objectiveId) {
  return { type: 'multiple-choice', prompt, answer, options, domainId, objectiveId };
}
