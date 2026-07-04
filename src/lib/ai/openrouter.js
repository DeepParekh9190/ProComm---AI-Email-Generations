import { detectOriginalTone, generateSmartFallback, getImprovements, generateAlternatives } from "./fallback-engine.js";
import { getPromptSettings } from "../telemetry.js";

const MODEL = process.env.OPENROUTER_MODEL || "openrouter/free";
const API_URL = "https://openrouter.ai/api/v1/chat/completions";

function safeParseJSON(text) {
  if (!text) return null;
  let cleaned = text.trim();

  // Strip Markdown code block markers (e.g. ```json ... ```)
  if (cleaned.startsWith("```")) {
    cleaned = cleaned
      .replace(/^```(?:json)?\n?/i, "")
      .replace(/\n?```$/, "")
      .trim();
  }

  // Attempt direct parse
  try {
    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed)) {
      return parsed[0];
    }
    return parsed;
  } catch (e) {
    // If direct parsing fails, extract the first outer JSON object block
    const startIdx = cleaned.indexOf("{");
    const endIdx = cleaned.lastIndexOf("}");
    if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
      try {
        const jsonSub = cleaned.substring(startIdx, endIdx + 1);
        const parsed = JSON.parse(jsonSub);
        if (Array.isArray(parsed)) {
          return parsed[0];
        }
        return parsed;
      } catch (innerError) {
        console.error("Failed to parse extracted JSON block:", innerError);
      }
    }
  }
  return null;
}

function buildSystemPrompt({ message, communicationType, recipient, tone, subject, template }) {
  const activeTone = tone || "Professional";
  const targetTones = ["Professional", "Diplomatic", "Firm", "Empathetic", "Neutral"].filter(
    (t) => t.toLowerCase() !== activeTone.toLowerCase()
  );

  if (template) {
    return template
      .split("{{message}}").join(message || "")
      .split("{{communicationType}}").join(communicationType || "email")
      .split("{{recipient}}").join(recipient || "someone")
      .split("{{tone}}").join(activeTone)
      .split("{{subject}}").join(subject || "none")
      .split("{{targetTones}}").join(targetTones.join(", "));
  }

  return `You are ProComm, an AI communication assistant. Your job is to rewrite the user's message to reflect the desired tone.

Given the user's draft: "${message}", communication type (${communicationType}), recipient (${recipient || "someone"}), desired tone (${activeTone}), and subject (${subject || "none"}), do the following:

1. Detect the original tone of the user's message.
2. Rewrite the message directly and completely in the desired tone, including greeting, body, closing, and a signature line (e.g. "[Your Name]"). 
   CRITICAL CRITERIA: Do NOT reply to the message, do NOT quote the original text in quotes or blockquotes, and do NOT include intro/meta text such as "I wanted to touch base regarding your recent update:" or "Here is the rewritten version:". The rewritten message must stand on its own as a direct, seamless, and fully rewritten communication that is ready to be sent.
3. List 3-5 specific improvements made (e.g., specific wording adjustments, softening, or structure changes).
4. Generate alternative versions for all other available tones (${targetTones.join(", ")}). Each alternative MUST be a full, complete rewritten message including greeting, body, closing, and signature line, formatted for the selected communication type, ready to be sent.

Respond ONLY with valid JSON in this exact format, no other text:
{
  "rewrittenMessage": "the complete rewritten message",
  "originalTone": "detected original tone",
  "newTone": "${activeTone}",
  "improvements": ["improvement 1", "improvement 2", "improvement 3"],
  "alternatives": [
    { "tone": "${targetTones[0]}", "preview": "Dear ${recipient || "Recipient"},\\n\\n[Full message body rewritten in ${targetTones[0]} tone here]\\n\\nSincerely,\\n[Your Name]" },
    { "tone": "${targetTones[1]}", "preview": "Dear ${recipient || "Recipient"},\\n\\n[Full message body rewritten in ${targetTones[1]} tone here]\\n\\nSincerely,\\n[Your Name]" },
    { "tone": "${targetTones[2]}", "preview": "Dear ${recipient || "Recipient"},\\n\\n[Full message body rewritten in ${targetTones[2]} tone here]\\n\\nSincerely,\\n[Your Name]" },
    { "tone": "${targetTones[3]}", "preview": "Dear ${recipient || "Recipient"},\\n\\n[Full message body rewritten in ${targetTones[3]} tone here]\\n\\nSincerely,\\n[Your Name]" }
  ]
}`;
}

export async function generateRewrite({ message, communicationType, recipient, tone, subject, model, template }) {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey || apiKey === "paste-your-api-key-here") {
    console.warn("API WARNING: OPENROUTER_API_KEY is not set or is using the placeholder. Falling back to local template responses.");
    return getDemoResponse({ message, communicationType, recipient, tone, subject });
  }

  console.log(`API INFO: Initiating rewrite request using OpenRouter key ending in "...${apiKey.slice(-6)}". Model: ${model || MODEL}`);

  const settings = await getPromptSettings().catch(() => ({}));
  const systemPrompt = buildSystemPrompt({
    message,
    communicationType,
    recipient,
    tone,
    subject,
    template: template || settings?.systemPromptTemplate
  });

  try {
    let activeModel = model || MODEL;
    if (activeModel === "openrouter/free") {
      activeModel = "meta-llama/llama-3.3-70b-instruct:free";
    }
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
        "X-Title": "ProComm",
      },
      body: JSON.stringify({
        model: activeModel,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      console.error(`API ERROR: OpenRouter returned status ${response.status}. Details: ${errorText}`);
      throw new Error(`OpenRouter API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    const promptTokens = data.usage?.prompt_tokens || 0;
    const completionTokens = data.usage?.completion_tokens || 0;

    const parsed = safeParseJSON(content);
    if (parsed) {
      const orig = detectOriginalTone(message);
      const activeTone = tone || "Professional";
      return {
        rewrittenMessage:
          parsed.rewrittenMessage ||
          generateSmartFallback({ message, communicationType, recipient, tone: activeTone, subject }),
        originalTone: parsed.originalTone || orig,
        newTone: parsed.newTone || activeTone,
        improvements:
          Array.isArray(parsed.improvements) && parsed.improvements.length > 0
            ? parsed.improvements
            : getImprovements(message, parsed.originalTone || orig, parsed.newTone || activeTone),
        alternatives:
          Array.isArray(parsed.alternatives) && parsed.alternatives.length > 0
            ? parsed.alternatives
            : generateAlternatives({ message, communicationType, recipient, currentTone: activeTone }),
        promptTokens,
        completionTokens
      };
    }

    console.warn("API WARNING: AI responded, but output is not valid JSON. Safe-parser returned null. Raw AI output:\n", content);
    return getDemoResponse({ message, communicationType, recipient, tone, subject });
  } catch (error) {
    console.error("API ERROR: Exception occurred during OpenRouter API call:", error);
    return getDemoResponse({ message, communicationType, recipient, tone, subject });
  }
}

export async function streamRewrite({ message, communicationType, recipient, tone, subject, model }) {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey || apiKey === "paste-your-api-key-here") {
    console.warn("API WARNING (Streaming): OPENROUTER_API_KEY is not set. Returning fallback stream.");
    const fallback = getDemoResponse({ message, communicationType, recipient, tone, subject });
    return {
      type: "fallback",
      ...fallback,
    };
  }

  console.log(`API INFO (Streaming): Initiating stream request with key ending in "...${apiKey.slice(-6)}"`);

  const settings = await getPromptSettings().catch(() => ({}));
  const systemPrompt = buildSystemPrompt({
    message,
    communicationType,
    recipient,
    tone,
    subject,
    template: settings?.systemPromptTemplate
  });
  let activeModel = model || MODEL;
  if (activeModel === "openrouter/free") {
    activeModel = "meta-llama/llama-3.3-70b-instruct:free";
  }

  let response;
  try {
    response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
        "X-Title": "ProComm",
      },
      body: JSON.stringify({
        model: activeModel,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message },
        ],
        temperature: 0.7,
        max_tokens: 2000,
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      console.error(`API ERROR (Streaming): OpenRouter stream returned status ${response.status}. Details: ${errorText}`);
      return createFallbackStream({ message, communicationType, recipient, tone, subject });
    }
  } catch (error) {
    console.error("API ERROR (Streaming): Connection to OpenRouter stream endpoint failed:", error);
    return createFallbackStream({ message, communicationType, recipient, tone, subject });
  }

  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  const stream = new ReadableStream({
    async start(controller) {
      const reader = response.body.getReader();
      let buffer = "";
      let fullContent = "";

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const data = line.slice(6).trim();
            if (data === "[DONE]") continue;

            try {
              const parsed = JSON.parse(data);
              const token = parsed.choices?.[0]?.delta?.content || "";
              if (token) {
                fullContent += token;
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "token", content: token })}\n\n`));
              }
            } catch {
              // skip unparseable chunks
            }
          }
        }

        const parsed = safeParseJSON(fullContent);
        if (parsed) {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: "complete",
                data: {
                  rewrittenMessage:
                    parsed.rewrittenMessage ||
                    generateSmartFallback({
                      message,
                      communicationType,
                      recipient,
                      tone: tone || "Professional",
                      subject,
                    }),
                  originalTone: parsed.originalTone || detectOriginalTone(message),
                  newTone: parsed.newTone || tone || "Professional",
                  improvements:
                    Array.isArray(parsed.improvements) && parsed.improvements.length > 0
                      ? parsed.improvements
                      : getImprovements(
                          message,
                          parsed.originalTone || detectOriginalTone(message),
                          parsed.newTone || tone || "Professional"
                        ),
                  alternatives:
                    Array.isArray(parsed.alternatives) && parsed.alternatives.length > 0
                      ? parsed.alternatives
                      : generateAlternatives({
                          message,
                          communicationType,
                          recipient,
                          currentTone: tone || "Professional",
                        }),
                  promptTokens: 0,
                  completionTokens: 0
                },
              })}\n\n`
            )
          );
        } else {
          const fallback = getDemoResponse({ message, communicationType, recipient, tone, subject });
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "fallback", data: fallback })}\n\n`));
        }
      } catch (error) {
        const fallback = getDemoResponse({ message, communicationType, recipient, tone, subject });
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "fallback", data: fallback })}\n\n`));
      } finally {
        controller.close();
      }
    },
  });

  return stream;
}

function createFallbackStream({ message, communicationType, recipient, tone, subject }) {
  const encoder = new TextEncoder();
  return new ReadableStream({
    start(controller) {
      const fallback = getDemoResponse({ message, communicationType, recipient, tone, subject });
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "fallback", data: fallback })}\n\n`));
      controller.close();
    }
  });
}

function getDemoResponse({ message, communicationType, recipient, tone, subject }) {
  const orig = detectOriginalTone(message);
  const activeTone = tone || "Professional";
  return {
    rewrittenMessage: generateSmartFallback({ message, communicationType, recipient, tone: activeTone, subject }),
    originalTone: orig,
    newTone: activeTone,
    improvements: getImprovements(message, orig, activeTone),
    alternatives: generateAlternatives({ message, communicationType, recipient, currentTone: activeTone }),
    promptTokens: 0,
    completionTokens: 0
  };
}
