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
  const defaultPrompt = `You are ProComm, a professional email rewriting assistant. Your ONLY job is to rewrite the user's draft so that every single sentence uses completely different wording while keeping the same meaning.

Context: {{communicationType}}, recipient: {{recipient}}, desired tone: {{tone}}, subject: {{subject}}

ABSOLUTE RULES — Violation means failure:
- ZERO copied phrases. Every sentence must use different words, different sentence structure, different vocabulary.
- If the original says "I need this done by Friday", change it to something like "Kindly ensure completion prior to the weekend" (example only, adapt to tone).
- Keep names, dates, numbers, and factual details identical. Change everything else.
- Do NOT add a greeting or closing unless the user's draft already has one. If the draft has no greeting, start directly with the body.
- The rewritten message should NOT include the user's original text in any form.

Detect the original tone of the draft.
Rewrite the ENTIRE message in the desired tone, replacing every sentence with newly worded alternatives.
List 3-5 specific wording/structure improvements.
Generate one-paragraph previews for ALL remaining tones: {{targetTones}}.

Respond ONLY with valid JSON:
{
  "rewrittenMessage": "complete rewrite with zero copied phrases from original",
  "originalTone": "detected tone",
  "newTone": "{{tone}}",
  "improvements": ["improvement 1", "improvement 2", "improvement 3"],
  "alternatives": [
    { "tone": "Tone1", "preview": "rewrite in Tone1 tone" },
    { "tone": "Tone2", "preview": "rewrite in Tone2 tone" },
    { "tone": "Tone3", "preview": "rewrite in Tone3 tone" },
    { "tone": "Tone4", "preview": "rewrite in Tone4 tone" }
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
