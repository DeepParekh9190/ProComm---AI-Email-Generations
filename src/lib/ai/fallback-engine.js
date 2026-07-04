export function detectOriginalTone(draft = "") {
  const text = draft.toLowerCase();
  if (
    text.includes("unacceptable") ||
    text.includes("hate") ||
    text.includes("disappointed") ||
    text.includes("why did you") ||
    text.includes("fail") ||
    text.includes("useless") ||
    text.includes("excuse") ||
    text.includes("blame") ||
    text.includes("angry") ||
    text.includes("mad") ||
    (text.includes("!") && (text.includes("now") || text.includes("never") || text.includes("wrong")))
  )
    return "Aggressive";
  if (
    text.includes("right now") ||
    text.includes("immediately") ||
    text.includes("asap") ||
    text.includes("hurry") ||
    text.includes("quick") ||
    text.includes("need this done") ||
    text.includes("fast")
  )
    return "Impatient";
  if (
    text.includes("sorry") ||
    text.includes("apologize") ||
    text.includes("mistake") ||
    text.includes("regret") ||
    text.includes("my bad")
  )
    return "Apologetic";
  if (
    text.includes("please") ||
    text.includes("thank you") ||
    text.includes("thanks") ||
    text.includes("could you") ||
    text.includes("hope you are well") ||
    text.includes("appreciate")
  )
    return "Polite / Casual";
  if (draft.trim().split(/\s+/).length < 8) return "Abrupt";
  return "Unstructured / Informal";
}

export function generateSmartFallback({ message, communicationType, recipient, tone, subject }) {
  const recipientName = recipient || "Recipient";
  const desiredTone = tone || "Professional";
  const subjectLine = subject ? `Subject: ${subject}\n\n` : "";

  let greeting = "",
    closing = "";
  if (communicationType === "slack") {
    greeting = `Hey *${recipientName}*,\n\n`;
    closing = "\n\nLet me know if this works!";
  } else if (communicationType === "email" || communicationType === "client") {
    greeting = `Dear ${recipientName},\n\n`;
    closing = `\n\nSincerely,\n[Your Name]`;
  } else {
    greeting = `Hi ${recipientName},\n\n`;
    closing = `\n\nRegards,\n[Your Name]`;
  }

  const text = message ? message.trim() : "";

  // Clean message from any existing greetings/closings
  let cleaned = text.replace(/^(hi|hello|dear|hey|to:)\s+[a-zA-Z0-9_\-\s]+,?/i, "").trim();
  cleaned = cleaned
    .replace(/(sincerely|regards|best regards|thanks|thank you|best|cheers),?\s*([a-zA-Z0-9_\-\s]*)$/i, "")
    .trim();

  const formattedBody = cleaned.trim();
  const endsWithPunctuation = /[.!?,]$/.test(formattedBody);
  const bodyWithPeriod = endsWithPunctuation ? formattedBody : `${formattedBody}.`;

  // Helper to check for exact word/phrase matches to avoid substring false positives (e.g. "sending" matching "send")
  const match = (pattern) => new RegExp(`\\b(${pattern})\\b`, "i").test(cleaned);

  // Detect theme
  let theme = "default";
  if (match("delay|timeline|deadline|completed by now|late|behind schedule|not finish|unacceptable")) {
    if (match("we|us|our|sorry|apologize|fail|won't|will not")) {
      theme = "delay_notification";
    } else {
      theme = "delay_request";
    }
  } else if (match("sorry|apologize|regret|oversight|mistake")) {
    theme = "apology";
  } else if (match("meet|meeting|call|discuss|schedule|connect")) {
    theme = "meeting";
  } else if (match("please|could you|would you|request|send|need")) {
    theme = "request";
  } else if (
    match("outage|outages|system crash|service interruption") ||
    /api\b.*\bdown/i.test(cleaned) ||
    /server\b.*\bdown/i.test(cleaned) ||
    /service\b.*\bdown/i.test(cleaned) ||
    /system\b.*\bdown/i.test(cleaned) ||
    /platform\b.*\bdown/i.test(cleaned)
  ) {
    theme = "escalation";
  }

  // Pre-crafted high-quality rewrites for each theme/tone
  const templates = {
    delay_notification: {
      professional: `I am writing to inform you of an adjustment to our project schedule. Unfortunately, we have encountered some unexpected challenges: ${bodyWithPeriod} We are working diligently to resolve these issues and will keep you updated on our progress. Thank you for your patience and understanding.`,
      diplomatic: `I hope you are having a productive week. I wanted to touch base regarding our project timeline. We have hit a few unexpected roadblocks: ${bodyWithPeriod} We are doing everything we can to get back on track and appreciate your understanding.`,
      firm: `Please note that we have encountered a delay in our delivery timeline: ${bodyWithPeriod} We are prioritizing this issue to minimize any impact on operations. We will provide a confirmed delivery schedule as soon as possible.`,
      empathetic: `I hope you are doing well. I wanted to reach out and let you know that we have run into some delays on our end: ${bodyWithPeriod} I know you are relying on this delivery, and I sincerely apologize for any inconvenience this causes. Let me know if there is anything we can do to support you in the meantime.`,
      neutral: `Regarding our project timeline: ${bodyWithPeriod} We have encountered a delay and are working to resolve it.`,
    },
    delay_request: {
      professional: `I am writing to follow up on the status of the project. We had scheduled completion by this date, but we have not yet received a progress report. Please provide a status update and a revised completion timeline at your earliest convenience so we can align our plans.`,
      diplomatic: `I hope you are having a productive week. I wanted to touch base regarding the project timeline. I know there are many moving parts, but since we are past the expected completion date, we would appreciate more visibility on the progress. Let's connect to see how we can support you in moving this forward.`,
      firm: `Please note that the project timeline has been delayed, and we have not seen the expected progress or communication. This situation is critical to our planning. Please provide a status update and a confirmed resolution timeline by the end of the day today.`,
      empathetic: `I hope you are doing well. I wanted to reach out regarding the project schedule. I know how much effort you have been putting into this, and I understand that unexpected challenges can come up. Let know how things are going and if there is anything I can do to help support you.`,
      neutral: `This is a follow-up regarding the project timeline. We need to receive a progress update and a resolution schedule.`,
    },
    apology: {
      professional: `Please accept my sincere apologies for the oversight. I take full responsibility for the error, and I am actively working on a resolution. I will provide another update shortly and appreciate your patience.`,
      diplomatic: `I wanted to address the recent issue and express my regret for any inconvenience caused. We are reviewing what happened to ensure it is not repeated, and we appreciate your understanding as we resolve this.`,
      firm: `I acknowledge the error on our part and am taking steps to correct it. A resolution is currently underway to prevent further issues.`,
      empathetic: `I am very sorry for the mistake. I understand how this affects you and feel terrible about the inconvenience. I am doing everything I can to fix it immediately.`,
      neutral: `Regarding the recent error, please accept our apology. We are working to resolve the issue.`,
    },
    meeting: {
      professional: `I would like to schedule a time for us to connect and discuss the next steps for our project. Please let me know your availability over the coming days, or feel free to send a calendar invitation.`,
      diplomatic: `I hope you're having a good week. When you have a moment, I would love to connect briefly to align on our project details. Let me know what times work best for you, and we can set up a short call.`,
      firm: `We need to schedule a meeting as soon as possible to address outstanding items. Please share your availability for a call today or tomorrow.`,
      empathetic: `I hope your week is going well. If you have some time, I'd love to chat and see how things are going with the project. Let me know when you might be free for a casual catch-up.`,
      neutral: `Let's schedule a time to meet and discuss the project updates.`,
    },
    request: {
      professional: `I am writing to request additional details regarding this matter. Could you please provide the necessary information at your earliest convenience? Thank you for your assistance.`,
      diplomatic: `I hope you are well. When you have a moment, could you help clarify a few details? Your guidance would be highly valuable to help us move forward.`,
      firm: `Please provide the requested information by tomorrow. We require these details to proceed on schedule.`,
      empathetic: `I hope your week is going well. If you have some time, could you share your thoughts on this? I want to make sure I align with your expectations.`,
      neutral: `Please send the details regarding this request.`,
    },
    escalation: {
      professional: `I am writing to formally raise a critical concern regarding the performance of your services. We have experienced multiple service outages recently, which are causing operational issues and impacting our users. Please investigate this issue immediately and provide a detailed root cause analysis and resolution plan.`,
      diplomatic: `I hope you are well. I wanted to bring to your attention some recent service interruptions we've experienced with your platform. These issues are affecting our operations, so we would appreciate it if your team could look into this urgently and help us ensure stability moving forward.`,
      firm: `Please be advised that we are experiencing critical service outages with your system. This is causing significant disruption and financial impact. We require immediate resolution of this issue and a confirmation of service stability. If this is not resolved permanently, we will be forced to re-evaluate our agreement and pursue necessary actions.`,
      empathetic: `I am reaching out to let you know we've run into some critical issues with the service stability today. I know your team is working hard, but it's causing a lot of pressure on our side with our users. Let us know how we can work together to get this resolved as quickly as possible.`,
      neutral: `We are reporting service outages with your platform. We require an immediate update on the status and a plan for resolution.`,
    },
    default: {
      professional: `I am writing to communicate regarding this matter. I wanted to ensure we address the details clearly: ${bodyWithPeriod} Please let me know if you have any questions or require further clarification.`,
      diplomatic: `I hope you are having a productive week. I wanted to touch base regarding: ${bodyWithPeriod} I understand there are multiple aspects to consider here, and I look forward to working collaboratively with you to resolve this.`,
      firm: `Please review the following important update: ${bodyWithPeriod} This requires your prompt attention. Please confirm your schedule for completion by today.`,
      empathetic: `I hope you are doing well. I wanted to reach out regarding: ${bodyWithPeriod} I know there has been a lot of work put into this, and I appreciate your dedication. Let me know if there is anything I can do to assist or support you.`,
      neutral: `Regarding the item: ${bodyWithPeriod} We should track this update and coordinate on our next steps.`,
    },
  };

  const toneKey = desiredTone.toLowerCase();
  const matchedTheme = templates[theme] ? theme : "default";
  const bodyText = templates[matchedTheme][toneKey] || templates[matchedTheme].professional;

  return `${subjectLine}${greeting}${bodyText}${closing}`;
}

export function getImprovements(message = "", origTone = "Unstructured / Informal", newTone = "Professional") {
  const text = message.trim();
  const lower = text.toLowerCase();
  const improvements = [];

  // 1. Casing / Punctuation
  if (/[A-Z]{3,}/.test(text) || text.includes("!")) {
    improvements.push("Standardized sentence casing and lowered aggressive punctuation emphasis.");
  }

  // 2. Greeting analysis
  const hasGreeting = /^(hi|hello|dear|hey|to:)\s+/i.test(text);
  if (!hasGreeting) {
    improvements.push("Structured the opening with a polite and appropriate greeting.");
  } else if (
    /^(hey|yo|hi)\s+/i.test(text) &&
    (newTone.toLowerCase() === "professional" || newTone.toLowerCase() === "firm")
  ) {
    improvements.push("Upgraded the informal greeting to standard business correspondence style.");
  }

  // 3. Wording and phrase improvements based on detected negative words
  const matchedWords = [];
  if (lower.includes("unacceptable")) matchedWords.push("'unacceptable'");
  if (lower.includes("disappointed")) matchedWords.push("'disappointed'");
  if (lower.includes("fail")) matchedWords.push("'fail'");
  if (lower.includes("useless")) matchedWords.push("'useless'");

  if (matchedWords.length > 0) {
    const listStr = matchedWords.join(" or ");
    improvements.push(`Replaced confrontational or negative language (like ${listStr}) with constructive feedback.`);
  }
  if (lower.includes("immediately") || lower.includes("asap") || lower.includes("hurry") || lower.includes("fast")) {
    improvements.push("Softened high-pressure urgency demands into standard, collaborative schedule alignment.");
  }
  if (lower.includes("sorry") || lower.includes("apologize") || lower.includes("mistake")) {
    improvements.push(
      "Balanced apologetic language to maintain professional authority while acknowledging the concern."
    );
  }

  // 4. Structure & paragraph organization
  const wordsCount = text.split(/\s+/).length;
  if (wordsCount < 10) {
    improvements.push("Expanded the brief input into a complete message with context and details.");
  } else if (!text.includes("\n")) {
    improvements.push("Organized continuous text into neat paragraphs for improved layout and readability.");
  }

  // 5. Closing / Signature
  const hasClosing = /(sincerely|regards|best regards|thanks|thank you|best|cheers),?\s*([a-zA-Z0-9_\-\s]*)$/i.test(
    text
  );
  if (!hasClosing) {
    improvements.push("Appended a professional sign-off and a placeholder for contact details.");
  }

  // Fallbacks if we don't have enough specific improvements (we want at least 3)
  if (improvements.length < 3) {
    if (newTone.toLowerCase() === "firm") {
      improvements.push("Stated expectations and timelines clearly and assertively.");
      improvements.push("Removed passive phrasing to deliver a direct, strong message.");
    } else if (newTone.toLowerCase() === "diplomatic") {
      improvements.push("Buffered feedback with collaborative wording to encourage cooperation.");
      improvements.push("Framed critical concerns from a constructive business standpoint.");
    } else {
      improvements.push("Enhanced phrasing to match formal business communication guidelines.");
      improvements.push("Streamlined wording for maximum clarity and concise delivery.");
    }
  }

  return improvements.slice(0, 4);
}

export function generateAlternatives({ message, communicationType, recipient, currentTone }) {
  const allTones = ["Professional", "Diplomatic", "Firm", "Empathetic", "Neutral"];
  return allTones
    .filter((t) => t.toLowerCase() !== currentTone.toLowerCase())
    .map((t) => ({
      tone: t,
      preview: generateSmartFallback({ message, communicationType, recipient, tone: t, subject: "" }),
    }));
}
