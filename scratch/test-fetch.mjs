const API_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = "openrouter/free";
const apiKey = "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";

const message = "i hate this delay, fix it now! fail is unacceptable";
const communicationType = "email";
const recipient = "John";
const tone = "Professional";
const subject = "Project Delay";

const systemPrompt = `You are ProComm, an AI communication assistant. Your job is to rewrite the user's message to reflect the desired tone.

Given the user's draft: "${message}", communication type (${communicationType}), recipient (${recipient || "someone"}), desired tone (${tone || "Professional"}), and subject (${subject || "none"}), do the following:

1. Detect the original tone of the user's message.
2. Rewrite the message directly and completely in the desired tone, including greeting, body, closing, and a signature line (e.g. "[Your Name]"). 
   CRITICAL CRITERIA: Do NOT reply to the message, do NOT quote the original text in quotes or blockquotes, and do NOT include intro/meta text such as "I wanted to touch base regarding your recent update:" or "Here is the rewritten version:". The rewritten message must stand on its own as a direct, seamless, and fully rewritten communication that is ready to be sent.
3. List 3-5 specific improvements made (e.g., specific wording adjustments, softening, or structure changes).
4. Generate 3 alternative versions in Professional, Diplomatic, and Firm tones (short previews).

Respond ONLY with valid JSON in this exact format, no other text:
{
  "rewrittenMessage": "the complete rewritten message",
  "originalTone": "detected original tone",
  "newTone": "${tone || "Professional"}",
  "improvements": ["improvement 1", "improvement 2", "improvement 3"],
  "alternatives": [
    { "tone": "Professional", "preview": "short preview of professional version..." },
    { "tone": "Diplomatic", "preview": "short preview of diplomatic version..." },
    { "tone": "Firm", "preview": "short preview of firm version..." }
  ]
}`;

async function run() {
  console.log("Fetching from OpenRouter...");
  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    }),
  });

  console.log("Status:", response.status, response.statusText);
  const text = await response.text();
  console.log("Raw Response Text:\n", text);
}

run().catch(console.error);
