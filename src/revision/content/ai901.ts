import { lesson } from '../builders';
import type { RevisionCourse } from '../types';

const sourceIds = ['ai-study-guide', 'ai-learning-path', 'foundry-docs'];

export const ai901Course: RevisionCourse = {
  examCode: 'AI-901',
  title: 'Introduction to AI in Azure',
  shortTitle: 'AI in Azure',
  description: 'A practical guide to AI concepts, responsible design, and implementing common workloads with Microsoft Foundry and Azure AI services.',
  blueprintVersion: '2026-04-15',
  contentVersion: '2026.07.1',
  lastReviewed: '2026-07-15',
  accent: '#6d5ce8',
  domains: [
    { id: 'concepts', title: 'Identify AI concepts and capabilities', weight: 44 },
    { id: 'foundry', title: 'Implement AI solutions using Microsoft Foundry', weight: 56 }
  ],
  sources: [
    { id: 'ai-study-guide', title: 'AI-901 official study guide', url: 'https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/ai-901' },
    { id: 'ai-learning-path', title: 'Get started with AI applications and agents on Azure', url: 'https://learn.microsoft.com/en-us/training/paths/get-started-ai-apps-agents/' },
    { id: 'foundry-docs', title: 'Microsoft Foundry documentation', url: 'https://learn.microsoft.com/en-us/azure/foundry/' },
    { id: 'responsible-ai-docs', title: 'Responsible AI overview', url: 'https://learn.microsoft.com/en-us/azure/machine-learning/concept-responsible-ai' },
    { id: 'model-catalog', title: 'Model catalog in Microsoft Foundry', url: 'https://learn.microsoft.com/en-us/azure/foundry/how-to/model-catalog-overview' },
    { id: 'prompt-flow', title: 'Prompt flow concepts', url: 'https://learn.microsoft.com/en-us/azure/machine-learning/prompt-flow/overview-what-is-prompt-flow' },
    { id: 'agent-service', title: 'Microsoft Foundry Agent Service', url: 'https://learn.microsoft.com/en-us/azure/foundry/agents/overview' },
    { id: 'language-service', title: 'Azure Language in Foundry Tools', url: 'https://learn.microsoft.com/en-us/azure/ai-services/language-service/overview' },
    { id: 'speech-service', title: 'Azure Speech overview', url: 'https://learn.microsoft.com/en-us/azure/ai-services/speech-service/overview' },
    { id: 'vision-service', title: 'Azure Vision overview', url: 'https://learn.microsoft.com/en-us/azure/ai-services/computer-vision/overview' },
    { id: 'document-intelligence', title: 'Azure Document Intelligence overview', url: 'https://learn.microsoft.com/en-us/azure/ai-services/document-intelligence/overview' },
    { id: 'content-understanding', title: 'Azure Content Understanding overview', url: 'https://learn.microsoft.com/en-us/azure/ai-services/content-understanding/overview' }
  ],
  pages: [
    lesson({
      id: 'responsible-ai', objectiveId: 'responsible-ai', slug: 'responsible-ai', title: 'Responsible AI principles', domainId: 'concepts',
      summary: 'Turn fairness, reliability, privacy, inclusion, transparency, and accountability into concrete design decisions.', estimatedMinutes: 14,
      keywords: ['fairness', 'reliability', 'safety', 'privacy', 'security', 'inclusiveness', 'transparency', 'accountability', 'human oversight'],
      blueprintPoints: ['Identify features of responsible AI', 'Describe considerations for fairness, reliability and safety', 'Describe privacy, security, inclusiveness, transparency, and accountability'],
      sourceIds: [...sourceIds, 'responsible-ai-docs'],
      overview: [
        'Responsible AI is a lifecycle discipline, not a final compliance check. Teams identify who could be affected, measure risks before release, monitor production behavior, and provide routes for people to challenge or correct outcomes.',
        'Microsoft groups the discipline into six principles. In an exam scenario, look for the harm being reduced and choose the principle that most directly addresses it.'
      ],
      keyPoints: [
        'Fairness: similar people should receive comparable treatment; inspect performance across relevant groups and mitigate skewed data or proxy variables.',
        'Reliability and safety: operate consistently under expected and unexpected conditions; test boundaries, fail safely, monitor drift, and plan rollback.',
        'Privacy and security: minimize and protect data, control access, respect consent and retention, and defend the model and application from abuse.',
        'Inclusiveness: design with diverse users, abilities, languages, environments, and access needs rather than treating accessibility as an afterthought.',
        'Transparency: help people understand that AI is involved, its intended use, important limitations, and the reasons or evidence behind an output.',
        'Accountability: people and organizations remain answerable; define owners, approvals, audit trails, escalation, and meaningful human oversight.'
      ],
      comparison: {
        title: 'Diagnose the principle from the scenario', columns: ['Scenario signal', 'Primary principle', 'Best response'], rows: [
          ['Loan recommendations differ sharply between demographic groups', 'Fairness', 'Measure group-level performance and address data or feature bias'],
          ['A controller must enter a safe state when confidence is low', 'Reliability and safety', 'Set operating thresholds, fallback behavior, and monitoring'],
          ['A user asks why an application rejected an input', 'Transparency', 'Explain the AI role, evidence, limits, and appeal path'],
          ['No one owns approval of a high-impact model update', 'Accountability', 'Assign accountable owners and record review decisions'],
          ['A speech interface excludes users with a particular accent or disability', 'Inclusiveness', 'Co-design, accessibility-test, and broaden representative evaluation']
        ]
      },
      flow: { title: 'A responsible delivery loop', steps: [
        { title: 'Map', text: 'Define intended use, affected people, foreseeable misuse, and unacceptable harms.' },
        { title: 'Measure', text: 'Choose quality, safety, fairness, privacy, and accessibility evaluations before deployment.' },
        { title: 'Mitigate', text: 'Improve data, prompts, policies, filters, user experience, or human review based on risk.' },
        { title: 'Operate', text: 'Log appropriately, monitor changes, investigate incidents, and keep an accountable owner.' }
      ] },
      insight: ['More than one principle can apply. Choose the most direct one first: explainability points to transparency; an appeal and named decision owner point to accountability; unequal measured outcomes point to fairness.'],
      traps: [
        'Transparency does not mean publishing model weights, private data, or security secrets. It means giving useful, audience-appropriate information about use, limitations, and outputs.',
        'A technically accurate system can still be unfair, unsafe, inaccessible, or inappropriate for its intended context.',
        'Human review is not automatically meaningful oversight. Reviewers need authority, sufficient context, time, and a clear escalation route.'
      ],
      checklist: ['Recall all six principles without prompts', 'Match each principle to a practical mitigation', 'Explain why monitoring is part of responsible AI', 'Separate transparency from accountability', 'Identify impacted groups and foreseeable misuse in a scenario'],
      recall: [
        { question: 'Which principle is most directly concerned with comparable treatment across groups?', answer: 'Fairness.' },
        { question: 'Which principle requires named owners and routes to contest an outcome?', answer: 'Accountability.' },
        { question: 'Why is production monitoring necessary?', answer: 'Data, users, threats, and model behavior can change after pre-release evaluation.' }
      ]
    }),
    lesson({
      id: 'model-components', objectiveId: 'model-components', slug: 'model-components-and-configuration', title: 'Model components and configuration', domainId: 'concepts',
      summary: 'Understand data, training, inference, parameters, tokens, context, embeddings, and the settings that change model output.', estimatedMinutes: 17,
      keywords: ['model', 'training', 'inference', 'parameters', 'tokens', 'context window', 'temperature', 'grounding', 'embeddings', 'fine-tuning'],
      blueprintPoints: ['Identify common AI model components', 'Describe training and inferencing', 'Describe model configuration and deployment choices'],
      sourceIds: [...sourceIds, 'model-catalog', 'prompt-flow'],
      overview: [
        'A model learns or encodes patterns and uses them during inference to produce a prediction or generated output. An application surrounds that model with instructions, data retrieval, tools, validation, safety controls, and a user experience.',
        'Foundation models are pretrained on broad data. You normally begin with prompt design and grounding, evaluate, and only then consider fine-tuning when the required behavior cannot be achieved reliably another way.'
      ],
      keyPoints: [
        'Training updates model parameters from examples; validation helps tune choices; a held-out test set estimates generalization. Inference uses the finished model on new input.',
        'Tokens are units processed by language models. The context window limits the combined instructions, conversation, retrieved content, input, and generated output.',
        'Temperature controls sampling variability: lower values are usually steadier; higher values can be more diverse. It does not add knowledge or guarantee factuality.',
        'Embeddings are numeric vectors whose distance represents semantic similarity. They support search, clustering, recommendations, and retrieval for grounding.',
        'Grounding supplies relevant, trusted context at request time. Retrieval-augmented generation keeps source knowledge outside model weights and can support citations.',
        'Evaluation should reflect the workload: classification metrics, retrieval relevance, groundedness, task completion, safety, latency, and cost can all matter.'
      ],
      comparison: { title: 'Choose the lightest customization that works', columns: ['Technique', 'Changes weights?', 'Best fit', 'Key trade-off'], rows: [
        ['Prompting', 'No', 'Clear instructions, examples, format, and tone', 'Fastest; limited by base-model capability'],
        ['Grounding / RAG', 'No', 'Current or private knowledge and source-backed answers', 'Requires retrieval quality and context management'],
        ['Fine-tuning', 'Yes', 'Repeated specialized behavior, style, or task patterns', 'Needs quality examples, evaluation, deployment, and maintenance'],
        ['Agent tools', 'No', 'Taking actions or fetching live system data', 'Requires permissions, orchestration, and tool-result validation']
      ] },
      flow: { title: 'From request to response', steps: [
        { title: 'Compose context', text: 'Combine system instructions, user input, history, and retrieved material within the context limit.' },
        { title: 'Tokenize and infer', text: 'The model processes tokens and predicts an output according to its learned parameters and decoding settings.' },
        { title: 'Validate', text: 'Apply content safety, structured-output checks, grounding checks, and business rules.' },
        { title: 'Observe', text: 'Capture permitted quality, latency, token, cost, and error signals for improvement.' }
      ] },
      insight: ['When a scenario says facts change frequently, prefer grounding over fine-tuning. When it says consistent domain-specific response behavior across many examples, fine-tuning may be relevant after prompting and evaluation.'],
      traps: [
        'Lower temperature does not make a model factually correct; it only changes sampling behavior.',
        'Embeddings are not human-readable summaries and do not by themselves generate a natural-language answer.',
        'The system prompt competes for the same context budget as conversation history, retrieved passages, input, and output allowance.',
        'A larger model is not automatically the best deployment: quality must be balanced with latency, throughput, regional availability, and cost.'
      ],
      checklist: ['Distinguish training, validation, testing, and inference', 'Explain tokens and context limits', 'Choose prompting, RAG, fine-tuning, or tools for a scenario', 'Describe what embeddings enable', 'Name workload-specific evaluation dimensions'],
      recall: [
        { question: 'What changes when a model is fine-tuned?', answer: 'Its weights are updated using task-specific examples.' },
        { question: 'What should you use for frequently changing private facts?', answer: 'Grounding with retrieval, commonly RAG.' },
        { question: 'What does temperature primarily change?', answer: 'The variability of token sampling and therefore output diversity.' }
      ]
    }),
    lesson({
      id: 'ai-workloads', objectiveId: 'ai-workloads', slug: 'identify-ai-workloads', title: 'Identify AI workloads', domainId: 'concepts',
      summary: 'Recognize prediction, anomaly detection, vision, language, speech, extraction, and generative workloads from business requirements.', estimatedMinutes: 15,
      keywords: ['classification', 'regression', 'clustering', 'anomaly detection', 'computer vision', 'nlp', 'speech', 'generative AI', 'extraction'],
      blueprintPoints: ['Identify common AI workloads', 'Identify machine learning techniques', 'Select an appropriate Azure AI capability for a scenario'],
      sourceIds,
      overview: [
        'Start with the desired output, not a product name. A category is classification, a number is regression, an unusual observation is anomaly detection, and groups discovered without labels are clustering.',
        'Modern solutions combine workloads. A support assistant might transcribe speech, classify intent, retrieve policy text, generate a grounded answer, synthesize speech, and extract structured fields for a case.'
      ],
      keyPoints: [
        'Classification predicts one or more labels; binary classification has two outcomes, multiclass chooses one of several, and multilabel can assign several.',
        'Regression predicts a continuous numeric value such as time, demand, temperature, or price.',
        'Clustering groups similar unlabeled items; anomaly detection identifies events that deviate from learned normal patterns.',
        'Vision covers image classification, object detection/location, OCR, captions, spatial analysis, and image generation.',
        'Language and speech cover sentiment, key phrases, entities, summarization, translation, question answering, recognition, and synthesis.',
        'Information extraction converts documents, images, audio, or video into a defined schema; generative AI creates or transforms content and can orchestrate actions through agents.'
      ],
      comparison: { title: 'Read the output clue', columns: ['Requirement', 'Workload', 'Example output'], rows: [
        ['Predict a category', 'Classification', 'fraud / not fraud'],
        ['Predict a quantity', 'Regression', '18.4 minutes'],
        ['Discover natural groups', 'Clustering', 'customer segments'],
        ['Spot departure from normal', 'Anomaly detection', 'unusual sensor reading'],
        ['Locate things in an image', 'Object detection', 'label plus bounding box'],
        ['Return defined fields from mixed content', 'Information extraction', 'schema-aligned JSON'],
        ['Create a novel response or asset', 'Generative AI', 'text, image, code, or audio']
      ] },
      flow: { title: 'Classify a workload', steps: [
        { title: 'Find the input', text: 'Structured rows, free text, audio, image, video, or mixed documents.' },
        { title: 'Find the output', text: 'Label, number, group, anomaly, transcript, bounding box, schema, or newly generated content.' },
        { title: 'Check constraints', text: 'Need live data, explanations, low latency, batch processing, language support, or human review?' },
        { title: 'Compose services', text: 'Split a multi-stage business journey into the smallest clear workload stages.' }
      ] },
      insight: ['“What should the system return?” is the quickest exam heuristic. Product choices become much easier after you have named the output type and modality.'],
      traps: [
        'OCR reads text from pixels; language analysis interprets the resulting text. A solution may use both.',
        'Object detection locates instances; image classification labels the image as a whole.',
        'Clustering has no target label. Classification learns from labeled examples.',
        'Generative AI can summarize or answer questions, but deterministic extraction is often better when a stable schema and auditable fields are the primary requirement.'
      ],
      checklist: ['Map label, number, group, and anomaly outputs', 'Separate OCR from language analysis', 'Distinguish image classification and object detection', 'Recognize multimodal pipelines', 'Choose extraction versus free-form generation'],
      recall: [
        { question: 'Which technique predicts delivery duration?', answer: 'Regression, because the output is a continuous number.' },
        { question: 'Which technique discovers groups without known labels?', answer: 'Clustering.' },
        { question: 'What differentiates object detection from classification?', answer: 'Object detection identifies and locates individual objects, usually with bounding boxes.' }
      ]
    }),
    lesson({
      id: 'foundry-generative', objectiveId: 'foundry-generative', slug: 'generative-apps-and-agents', title: 'Generative applications and agents', domainId: 'foundry',
      summary: 'Move from model discovery and prompting to grounded applications, evaluations, safe deployments, and tool-using agents.', estimatedMinutes: 22,
      keywords: ['Microsoft Foundry', 'model catalog', 'prompt', 'deployment', 'RAG', 'agent', 'tools', 'evaluation', 'content safety'],
      blueprintPoints: ['Describe Microsoft Foundry capabilities', 'Select, deploy, and consume models', 'Create prompts and grounded applications', 'Describe agents, tools, evaluations, and safeguards'],
      sourceIds: [...sourceIds, 'model-catalog', 'prompt-flow', 'agent-service'],
      overview: [
        'Microsoft Foundry brings model discovery, projects, development tools, evaluation, tracing, deployment, and operational controls into one application platform. A project provides the working boundary for connections, collaborators, assets, and application development.',
        'A generative application calls a deployed model endpoint. An agent adds an orchestration loop that can decide when to use approved tools, incorporate their results, and continue until it can answer or complete a task.'
      ],
      keyPoints: [
        'Use the model catalog to compare providers, modalities, capabilities, benchmarks, deployment options, regions, and costs before creating a deployment.',
        'A deployment gives an application a callable model target. Authentication and endpoint details must be protected; use managed identity or a secure secret store where supported.',
        'Prompts commonly separate system instructions, user content, examples, retrieved context, and output constraints. Structured outputs reduce downstream parsing ambiguity.',
        'RAG retrieves relevant material, places it in the model context, and asks for a grounded response. Retrieval quality, chunking, metadata, and citation behavior must be evaluated.',
        'Agents use instructions plus tools such as search, files, functions, or connected services. Tool permissions should be least-privilege, arguments validated, and consequential actions confirmed.',
        'Evaluate task success, groundedness, relevance, safety, latency, and cost using representative data. Traces help diagnose model calls, retrieval, and tool execution.'
      ],
      comparison: { title: 'Application patterns', columns: ['Pattern', 'Use when', 'What you control'], rows: [
        ['Direct model call', 'A single prompt produces the required output', 'Messages, parameters, validation'],
        ['RAG application', 'Answers need current or private knowledge', 'Indexing, retrieval, context, citations'],
        ['Prompt flow / workflow', 'A known sequence of model, code, and data steps is needed', 'Explicit graph, variants, evaluation'],
        ['Agent', 'The path depends on the request and approved tools', 'Instructions, tools, permissions, stop conditions']
      ] },
      flow: { title: 'A production-minded Foundry workflow', steps: [
        { title: 'Select', text: 'Match capability, modality, quality, safety, region, latency, and cost to the workload.' },
        { title: 'Prototype', text: 'Create a project, deployment, prompt, data connection, or agent and test representative cases.' },
        { title: 'Evaluate', text: 'Compare variants against quality and safety thresholds before release.' },
        { title: 'Deploy and observe', text: 'Secure access, trace calls, monitor quality/cost, and keep rollback and incident routes.' }
      ] },
      insight: ['Use an agent when the application must choose among tools or adapt its route. Use an explicit workflow when the sequence is known and predictability is more important than autonomous planning.'],
      traps: [
        'Deploying a model does not automatically build an application, add private knowledge, or make outputs safe.',
        'RAG updates context, not model weights. Fine-tuning updates weights, not live source documents.',
        'An agent is not simply a chatbot. Its distinguishing capability is orchestrated reasoning and tool use toward a goal.',
        'Content filters are one layer. Prompt injection defenses, authorization, tool validation, data boundaries, evaluation, and human confirmation may also be required.'
      ],
      checklist: ['Explain project, catalog, model, deployment, and endpoint', 'Write the parts of a grounded prompt', 'Choose direct call, workflow, RAG, or agent', 'Describe least-privilege tool use', 'Name quality, safety, operational, and cost evaluations'],
      recall: [
        { question: 'What makes an agent different from a single model call?', answer: 'It can orchestrate a multistep loop and choose approved tools based on the goal and intermediate results.' },
        { question: 'Does RAG update model weights?', answer: 'No. It supplies retrieved information in the inference context.' },
        { question: 'What should happen before comparing model variants?', answer: 'Define representative evaluation data and measurable quality and safety criteria.' }
      ]
    }),
    lesson({
      id: 'foundry-text-speech', objectiveId: 'foundry-text-speech', slug: 'text-and-speech', title: 'Text and speech workloads', domainId: 'foundry',
      summary: 'Choose and combine language analysis, translation, conversational language understanding, speech recognition, and synthesis.', estimatedMinutes: 18,
      keywords: ['sentiment', 'key phrases', 'named entities', 'PII', 'summarization', 'translation', 'speech to text', 'text to speech', 'CLU'],
      blueprintPoints: ['Implement text analysis and translation concepts', 'Describe conversational language understanding', 'Describe speech recognition, synthesis, and translation'],
      sourceIds: [...sourceIds, 'language-service', 'speech-service'],
      overview: [
        'Azure Language capabilities extract meaning from text: language detection, sentiment, key phrases, named entities, linked entities, PII, summarization, and custom classification or entity extraction. Conversational language understanding maps an utterance to an intent and entities.',
        'Azure Speech turns audio into text, text into audio, or translates speech. Real-time and batch modes serve different latency and throughput requirements, and language, locale, audio quality, and vocabulary affect results.'
      ],
      keyPoints: [
        'Sentiment identifies expressed opinion and can return document-, sentence-, or aspect-level signals; it does not prove the author’s real-world intent.',
        'Named entity recognition identifies categories such as people, organizations, locations, dates, and quantities; entity linking connects ambiguous mentions to known identities.',
        'PII detection helps locate sensitive spans for redaction, but the application still needs data-handling, access, retention, and review controls.',
        'Extractive summarization selects important sentences; abstractive summarization generates a new condensed expression and therefore needs stronger factuality evaluation.',
        'Speech to text supports transcription; text to speech produces synthesized voices; speech translation recognizes and translates spoken language.',
        'Custom language or speech models are useful when domain labels, entities, acoustic environments, pronunciations, or vocabulary need workload-specific adaptation.'
      ],
      comparison: { title: 'Select the language capability', columns: ['Need', 'Capability', 'Output'], rows: [
        ['Overall opinion in reviews', 'Sentiment analysis', 'positive/neutral/negative signals'],
        ['Important nouns and concepts', 'Key phrase extraction', 'salient phrases'],
        ['People, places, dates, or sensitive spans', 'NER / PII detection', 'typed text spans'],
        ['Map “book a table for four”', 'Conversational language understanding', 'intent plus entities'],
        ['Live captions', 'Speech to text', 'streaming transcript'],
        ['Read a response aloud', 'Text to speech', 'synthesized audio']
      ] },
      flow: { title: 'A voice assistant pipeline', steps: [
        { title: 'Recognize', text: 'Speech to text converts the caller’s audio to a transcript.' },
        { title: 'Understand', text: 'Language analysis or a generative model identifies intent, entities, and relevant context.' },
        { title: 'Respond', text: 'Business logic or a grounded model produces an approved answer.' },
        { title: 'Synthesize', text: 'Text to speech renders the answer using an appropriate voice and locale.' }
      ] },
      insight: ['Separate modality conversion from meaning: speech recognition creates text; a language model or language service interprets that text. This distinction resolves many service-selection questions.'],
      traps: [
        'Translation changes language; transcription changes audio into text. Speech translation performs both stages.',
        'Key phrases are extracted fragments, not a generated summary.',
        'Intent is the user’s goal; an entity is a relevant detail such as location, product, or date.',
        'Synthetic voice capability does not grant permission to clone or impersonate a voice; consent and responsible-use controls still apply.'
      ],
      checklist: ['Match standard text analytics to outputs', 'Separate intent from entities', 'Compare extractive and abstractive summaries', 'Trace a speech recognition-to-synthesis pipeline', 'Recognize when custom vocabulary or models help'],
      recall: [
        { question: 'Which capability locates sensitive text spans?', answer: 'PII detection.' },
        { question: 'What is the difference between intent and entity?', answer: 'Intent is the goal; entities are details needed to fulfil it.' },
        { question: 'Which speech capability creates audio from a written answer?', answer: 'Text to speech, also called speech synthesis.' }
      ]
    }),
    lesson({
      id: 'foundry-vision', objectiveId: 'foundry-vision', slug: 'vision-and-image-generation', title: 'Vision and image generation', domainId: 'foundry',
      summary: 'Interpret images with classification, detection, OCR, captions, and multimodal models, or generate new images from prompts.', estimatedMinutes: 17,
      keywords: ['computer vision', 'classification', 'object detection', 'OCR', 'captioning', 'multimodal', 'image generation', 'bounding box'],
      blueprintPoints: ['Describe image analysis capabilities', 'Describe OCR and object detection', 'Describe multimodal and image-generation use cases'],
      sourceIds: [...sourceIds, 'vision-service'],
      overview: [
        'Computer vision extracts information from pixels. Common outputs include a label for an entire image, locations of objects, detected text, captions, tags, or answers about visual content.',
        'Multimodal foundation models can reason across images and text. Image-generation models create or edit images from natural-language instructions; both require evaluation for accuracy, safety, provenance, and intended-use risk.'
      ],
      keyPoints: [
        'Image classification assigns one or more labels to an image; object detection identifies individual objects and their locations.',
        'OCR detects printed or handwritten text and returns content plus layout/location information. Document-specific extraction can then attach semantic field names.',
        'Image analysis can create captions, dense captions, tags, object signals, and smart crops depending on the selected capability.',
        'Multimodal models accept image and text context for visual question answering, comparison, summarization, or content understanding.',
        'Image generation follows prompt instructions such as subject, composition, medium, lighting, and aspect. Iterative prompting and human review improve results.',
        'Confidence thresholds trade false positives against false negatives. The correct threshold depends on the consequence of each error.'
      ],
      comparison: { title: 'Vision outputs at a glance', columns: ['Task', 'Typical output', 'Example'], rows: [
        ['Image classification', 'label and confidence', 'damage present'],
        ['Object detection', 'label, confidence, bounding box', 'three helmets and locations'],
        ['OCR', 'text and layout coordinates', 'invoice characters and lines'],
        ['Captioning', 'natural-language description', 'a cyclist crossing a bridge'],
        ['Image generation', 'new image pixels', 'campaign artwork from a prompt'],
        ['Multimodal reasoning', 'contextual answer', 'compare two equipment photos']
      ] },
      flow: { title: 'Design a visual inspection solution', steps: [
        { title: 'Define evidence', text: 'Decide whether the required evidence is a class, object location, text, description, or structured field.' },
        { title: 'Capture well', text: 'Control resolution, angle, lighting, orientation, and representative conditions where possible.' },
        { title: 'Choose and test', text: 'Use prebuilt capability first, or custom training when the domain cannot be represented adequately.' },
        { title: 'Set action policy', text: 'Use confidence and consequence to decide automatic action, retry, or human review.' }
      ] },
      insight: ['When the business asks “where is it?”, object detection is the likely answer. When it asks “what kind of image is this?”, classification is the likely answer.'],
      traps: [
        'OCR returns text; it does not necessarily know that a value is an invoice total or contract party.',
        'A bounding box is evidence of object detection, not basic image classification.',
        'A fluent multimodal description is still a generated claim and should be checked when decisions have consequences.',
        'Image generation creates new content; image analysis describes or extracts information from existing content.'
      ],
      checklist: ['Identify classification, detection, OCR, and caption outputs', 'Explain bounding boxes and confidence', 'Separate OCR from semantic extraction', 'Describe a multimodal model use case', 'Name safety and provenance considerations for generated images'],
      recall: [
        { question: 'Which task returns a bounding box?', answer: 'Object detection.' },
        { question: 'What does OCR produce?', answer: 'Recognized text and usually position/layout information from an image or document.' },
        { question: 'What is multimodal input?', answer: 'A request that combines more than one modality, such as text and an image.' }
      ]
    }),
    lesson({
      id: 'foundry-extraction', objectiveId: 'foundry-extraction', slug: 'information-extraction', title: 'Information extraction and Content Understanding', domainId: 'foundry',
      summary: 'Turn documents and mixed media into validated, schema-aligned information using OCR, Document Intelligence, and Content Understanding.', estimatedMinutes: 20,
      keywords: ['information extraction', 'Content Understanding', 'Document Intelligence', 'OCR', 'schema', 'analyzer', 'confidence', 'grounding'],
      blueprintPoints: ['Describe document processing and extraction', 'Describe Content Understanding analyzers and schemas', 'Interpret extracted fields, confidence, and grounding information'],
      sourceIds: [...sourceIds, 'document-intelligence', 'content-understanding'],
      overview: [
        'Information extraction transforms unstructured content into structured fields. OCR is a foundation, but production extraction also needs a schema, semantic field mapping, confidence handling, validation, and traceability to source evidence.',
        'Azure Document Intelligence specializes in document layout and field extraction. Azure Content Understanding uses analyzers and schemas across documents, images, audio, and video to produce structured, grounded outputs.'
      ],
      keyPoints: [
        'Prebuilt document models cover common formats such as invoices, receipts, IDs, and tax documents; custom models address organization-specific layouts and fields.',
        'Layout analysis identifies words, lines, tables, selection marks, and document structure. A semantic extraction layer maps evidence to fields such as supplier, total, or renewal date.',
        'A Content Understanding analyzer defines how a content type is processed. Its schema defines field names, descriptions, and types expected in the result.',
        'Field descriptions matter because they clarify semantic intent, especially when similar values occur in several places.',
        'Grounding or source information links an extracted value back to the relevant region or time span, supporting review and audit.',
        'Confidence is a signal for workflow policy, not a guarantee. Low-confidence or high-impact results should be validated or routed to a person.'
      ],
      comparison: { title: 'Choose the extraction layer', columns: ['Capability', 'Primary job', 'Use it when'], rows: [
        ['OCR / Read', 'Recognize characters and layout', 'You mainly need text from pixels'],
        ['Document Intelligence prebuilt', 'Extract known document fields', 'The format is a supported common business document'],
        ['Document Intelligence custom', 'Learn organization-specific document fields', 'Layouts or schemas are specialized'],
        ['Content Understanding', 'Analyze mixed modalities into a schema', 'Inputs or semantic extraction needs span documents, images, audio, or video'],
        ['Generative prompt only', 'Flexible ad-hoc interpretation', 'The result is exploratory and separately validated']
      ] },
      flow: { title: 'A reliable extraction pipeline', steps: [
        { title: 'Define schema', text: 'Name fields, types, descriptions, required status, and valid value rules from the business need.' },
        { title: 'Analyze', text: 'Run the appropriate prebuilt/custom model or analyzer over the input modality.' },
        { title: 'Validate', text: 'Check types, required fields, confidence, grounding, cross-field rules, and duplicate documents.' },
        { title: 'Route', text: 'Accept, retry, or send to human review according to consequence-aware thresholds.' }
      ] },
      insight: ['A strong schema is part of model quality. “Date” is ambiguous; “contract termination date shown in the cancellation clause” gives an analyzer and reviewer much clearer intent.'],
      traps: [
        'OCR alone does not assign business meaning to a value.',
        'Confidence scores from different models or fields should not be treated as perfectly calibrated probabilities without evaluation.',
        'A required schema field can still be missing when the source does not contain it or evidence is insufficient.',
        'Multimodal extraction does not eliminate validation, access controls, retention rules, or human review for consequential workflows.'
      ],
      checklist: ['Separate OCR, layout, and semantic fields', 'Choose prebuilt, custom, or multimodal extraction', 'Explain analyzers and schemas', 'Use descriptions, types, confidence, and grounding', 'Design accept/review/reject routing'],
      recall: [
        { question: 'What defines the fields an analyzer should return?', answer: 'Its schema.' },
        { question: 'Why keep grounding information?', answer: 'It connects an extracted value to source evidence for validation and audit.' },
        { question: 'When is a prebuilt model a strong first choice?', answer: 'When the input is a common supported document type with standard fields.' }
      ]
    })
  ]
};
