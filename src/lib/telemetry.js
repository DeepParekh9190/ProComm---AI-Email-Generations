import fs from "fs";
import path from "path";

const LOG_FILE_PATH = path.join(process.cwd(), "src", "lib", "data", "telemetry_logs.json");
const PROMPT_FILE_PATH = path.join(process.cwd(), "src", "lib", "data", "prompt_settings.json");

function generateSeedLogs() {
  const seed = [];
  const tones = ["Professional", "Diplomatic", "Firm", "Empathetic", "Neutral"];
  const origTones = ["Aggressive", "Impatient", "Apologetic", "Abrupt", "Unstructured / Informal"];
  const commTypes = ["email", "slack", "client", "hr", "performance", "escalation"];
  const recipients = ["Employee", "Manager", "Client", "Vendor", "Partner"];
  const models = [
    "openrouter/free",
    "meta-llama/llama-3.3-70b-instruct:free",
    "meta-llama/llama-3.2-3b-instruct:free",
    "google/gemma-4-31b-it:free",
    "qwen/qwen3-coder:free"
  ];
  const now = new Date();
  for (let i = 28; i >= 0; i--) {
    const timestamp = new Date(now.getTime() - i * 6 * 60 * 60 * 1000 - Math.random() * 3 * 60 * 60 * 1000);
    const isFallback = Math.random() < 0.15;
    const model = isFallback ? "fallback-engine" : models[Math.floor(Math.random() * models.length)];
    const pTokens = isFallback ? 0 : Math.floor(Math.random() * 400) + 120;
    const cTokens = isFallback ? 0 : Math.floor(Math.random() * 300) + 80;
    
    seed.push({
      id: Math.random().toString(36).substring(2, 9),
      timestamp: timestamp.toISOString(),
      userId: "mock-uid-" + Math.floor(Math.random() * 5),
      originalTone: origTones[Math.floor(Math.random() * origTones.length)],
      newTone: tones[Math.floor(Math.random() * tones.length)],
      communicationType: commTypes[Math.floor(Math.random() * commTypes.length)],
      recipient: recipients[Math.floor(Math.random() * recipients.length)],
      model: model,
      latencyMs: isFallback ? Math.floor(Math.random() * 80) + 15 : Math.floor(Math.random() * 1400) + 600,
      promptTokens: pTokens,
      completionTokens: cTokens,
      isFallback: isFallback,
      draftLength: Math.floor(Math.random() * 200) + 50,
      rewriteLength: Math.floor(Math.random() * 300) + 100
    });
  }
  return seed;
}

function ensureFileExists(filePath, isLogs = false) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(filePath)) {
    const defaultContent = isLogs ? generateSeedLogs() : {};
    fs.writeFileSync(filePath, JSON.stringify(defaultContent, null, 2), "utf-8");
  }
}

export async function addTelemetryLog(entry) {
  try {
    ensureFileExists(LOG_FILE_PATH, true);
    const fileContent = await fs.promises.readFile(LOG_FILE_PATH, "utf-8");
    const logs = JSON.parse(fileContent || "[]");
    
    const newEntry = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toISOString(),
      ...entry,
    };
    
    logs.push(newEntry);
    
    if (logs.length > 500) {
      logs.shift();
    }
    
    await fs.promises.writeFile(LOG_FILE_PATH, JSON.stringify(logs, null, 2), "utf-8");
    return newEntry;
  } catch (error) {
    console.error("Failed to write telemetry log:", error);
    return null;
  }
}

export async function getTelemetryLogs() {
  try {
    ensureFileExists(LOG_FILE_PATH, true);
    const fileContent = await fs.promises.readFile(LOG_FILE_PATH, "utf-8");
    return JSON.parse(fileContent || "[]");
  } catch (error) {
    console.error("Failed to read telemetry logs:", error);
    return [];
  }
}

export async function getPromptSettings() {
  const defaultPrompt = `You are ProComm, an AI writing assistant. Your task is to rewrite the user's draft into a polished, professionally worded message that matches the desired tone while preserving the original meaning and intent.

Analyze both the subject line and the draft together. The subject gives context — use it to frame the rewritten message appropriately.

Communication type: {{communicationType}}
Recipient: {{recipient}}
Desired tone: {{tone}}
Subject: {{subject}}

CRITICAL INSTRUCTION — You MUST:
- Rewrite EVERY sentence using DIFFERENT words, vocabulary, and sentence structures.
- Do NOT copy any phrase or wording from the original draft. The rewritten version should sound completely new while saying the same thing.
- Keep the core meaning, intent, and key facts identical — only change how they are expressed.
- Match the vocabulary, sentence length, and formality to the selected tone.

Follow these steps:
1. Detect the original tone of the user's draft.
2. Rewrite the entire message in the desired tone — greeting, body, closing, and a signature line (e.g. "[Your Name]"). 
   CRITICAL: Do NOT reply to the message, do NOT quote the original text, and do NOT include meta text like "Here is the rewritten version:" or "I wanted to touch base regarding your recent update:". The final message must stand alone as a ready-to-send communication.
3. List 3-5 specific improvements you made (e.g., wording changes, structure improvements, tone alignment).
4. Generate alternative versions for all remaining tones: {{targetTones}}. Each must be a full, complete rewritten message with greeting, body, closing, and signature.

Respond ONLY with valid JSON in this exact format:
{
  "rewrittenMessage": "the complete rewritten message with all new wording",
  "originalTone": "detected original tone",
  "newTone": "{{tone}}",
  "improvements": ["improvement 1", "improvement 2", "improvement 3"],
  "alternatives": [
    { "tone": "Tone1", "preview": "Full rewritten message in Tone1 tone" },
    { "tone": "Tone2", "preview": "Full rewritten message in Tone2 tone" },
    { "tone": "Tone3", "preview": "Full rewritten message in Tone3 tone" },
    { "tone": "Tone4", "preview": "Full rewritten message in Tone4 tone" }
  ]
}`;

  const defaultData = JSON.stringify({ systemPromptTemplate: defaultPrompt }, null, 2);
  
  try {
    ensureFileExists(PROMPT_FILE_PATH, false);
    const fileContent = await fs.promises.readFile(PROMPT_FILE_PATH, "utf-8");
    const parsed = JSON.parse(fileContent || "{}");
    if (!parsed.systemPromptTemplate) {
      parsed.systemPromptTemplate = defaultPrompt;
    }
    return parsed;
  } catch (error) {
    console.error("Failed to read prompt settings:", error);
    return { systemPromptTemplate: defaultPrompt };
  }
}

export async function updatePromptSettings(settings) {
  try {
    ensureFileExists(PROMPT_FILE_PATH, false);
    await fs.promises.writeFile(PROMPT_FILE_PATH, JSON.stringify(settings, null, 2), "utf-8");
    return true;
  } catch (error) {
    console.error("Failed to write prompt settings:", error);
    return false;
  }
}
