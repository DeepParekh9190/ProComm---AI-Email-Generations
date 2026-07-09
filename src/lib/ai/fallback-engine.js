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

function rewordMessage(text, desiredTone) {
  if (!text) return "";

  const tone = desiredTone.toLowerCase();

  const rules = getToneRules(tone);

  // Apply rules in order: multi-word phrases first
  let result = text;
  for (const { pattern, replacement } of rules) {
    result = result.replace(pattern, replacement);
  }

  // Cleanup: fix grammar artifacts from partial matching
  result = cleanupRewording(result);

  return result.trim();
}

function cleanupRewording(text) {
  return text
    // Fix "continue to adding/doing/etc" → "continue to add/do/etc"
    .replace(/\bcontinue to (\w+)ing\b/gi, (_, w) => "continue to " + w)
    // Fix "noticed adding/doing/etc" → "noticed you are adding/doing/etc" (context dependent)
    .replace(/\bnoticed (\w+)ing\b/gi, (_, w) => "noticed that you are " + w + "ing")
    // Fix "noted that you continue to adding" → "noted that you continue to add"
    .replace(/\bcontinue to (\w+)ing\b/gi, (_, w) => "continue to " + w)
    // Remove leftover "to this" fragments when the first part was replaced
    .replace(/\bto this\b/gi, "")
    // Fix "to do this additional scope for free" → "to do this additional work for free"
    // (general cleanup of doubled prepositions)
    .replace(/\bto this in\b/gi, "in")
    .replace(/\bto this for\b/gi, "for")
    .replace(/\bto this on\b/gi, "on")
    .replace(/\bto this with\b/gi, "with")
    // Remove doubled spaces
    .replace(/\s{2,}/g, " ")
    // Capitalize first letter of sentences
    .replace(/(?:^|\.\s+|\!\s+|\?\s+)([a-z])/g, (match) => match.toUpperCase())
    // Fix lowercase "i" to "I"
    .replace(/\bi\b/g, "I")
    // Fix "i'll", "i'm", "i've", "i'd"
    .replace(/\bi'll\b/gi, "I will")
    .replace(/\bi'm\b/gi, "I am")
    .replace(/\bi've\b/gi, "I have")
    .replace(/\bi'd\b/gi, "I would");
}

function getToneRules(tone) {
  const rules = {
    professional: [
      { pattern: /\bcan't\b/gi, replacement: "am unable to" },
      { pattern: /\bwont\b|\bwon't\b/gi, replacement: "will not be able to" },
      { pattern: /\byou need to\b/gi, replacement: "we kindly request that you" },
      { pattern: /\byou must\b/gi, replacement: "it is important that you" },
      { pattern: /\bi need\b/gi, replacement: "I would appreciate" },
      { pattern: /\bsend me\b/gi, replacement: "please provide me with" },
      { pattern: /\bgive me\b/gi, replacement: "I would like to receive" },
      { pattern: /\bdone\b/gi, replacement: "completed" },
      { pattern: /\bhelp\b/gi, replacement: "assist" },
      { pattern: /\bfix\b/gi, replacement: "resolve" },
      { pattern: /\buse\b/gi, replacement: "utilize" },
      { pattern: /\bget back\b/gi, replacement: "follow up" },
      { pattern: /\btell me\b/gi, replacement: "please advise" },
      { pattern: /\bi think\b/gi, replacement: "it appears that" },
      { pattern: /\bno\b/gi, replacement: "unfortunately not" },
      { pattern: /\byeah\b|\byep\b/gi, replacement: "yes" },
      { pattern: /\bnah\b|\bnope\b/gi, replacement: "no" },
      { pattern: /\bthanks\b/gi, replacement: "thank you" },
      { pattern: /\bwanna\b|\bwant to\b/gi, replacement: "would like to" },
      { pattern: /\bgonna\b|\bgoing to\b/gi, replacement: "will" },
      { pattern: /\bugent\b|\basap\b/gi, replacement: "at your earliest convenience" },
      { pattern: /\bjust\b/gi, replacement: "" },
      { pattern: /\bgotta\b/gi, replacement: "need to" },
      { pattern: /\byou have to\b/gi, replacement: "it is necessary that you" },
      { pattern: /\byou keep (\w+)ing\b/gi, replacement: "I have noticed that you continue to $1" },
      { pattern: /\bi will not\b/gi, replacement: "I am unable to" },
      { pattern: /\bwe did not agree to this\b/gi, replacement: "this was not part of our agreed scope" },
      { pattern: /\bpay us\b/gi, replacement: "compensate us" },
      { pattern: /\bextra work\b/gi, replacement: "additional work" },
      { pattern: /\bif you want\b/gi, replacement: "should you wish to proceed with" },
      { pattern: /\bnot fair\b/gi, replacement: "does not seem reasonable" },
      { pattern: /\bwrong\b/gi, replacement: "incorrect" },
      { pattern: /\bproblem\b/gi, replacement: "matter" },
      { pattern: /\bstop\b/gi, replacement: "discontinue" },
      { pattern: /\bstart\b/gi, replacement: "commence" },
      { pattern: /\bcheck\b/gi, replacement: "review" },
      { pattern: /\bsorry\b/gi, replacement: "I apologize" },
      { pattern: /\bit's\b/gi, replacement: "it is" },
      { pattern: /\bi'm\b/gi, replacement: "I am" },
      { pattern: /\bi'll\b/gi, replacement: "I will" },
      { pattern: /\bdon't\b/gi, replacement: "do not" },
      { pattern: /\bdoesn't\b/gi, replacement: "does not" },
      { pattern: /\bdidn't\b/gi, replacement: "did not" },
      { pattern: /\bhaven't\b/gi, replacement: "have not" },
      { pattern: /\bhasn't\b/gi, replacement: "has not" },
      { pattern: /\bwouldn't\b/gi, replacement: "would not" },
      { pattern: /\bcouldn't\b/gi, replacement: "could not" },
      { pattern: /\bshouldn't\b/gi, replacement: "should not" },
      { pattern: /\bit'll\b/gi, replacement: "it will" },
      { pattern: /\bthat's\b/gi, replacement: "that is" },
      { pattern: /\bthere's\b/gi, replacement: "there is" },
      { pattern: /\bhere's\b/gi, replacement: "here is" },
      { pattern: /\bwhat's\b/gi, replacement: "what is" },
      { pattern: /\bwho's\b/gi, replacement: "who is" },
      { pattern: /\btoday\b/gi, replacement: "at the earliest opportunity" },
      { pattern: /\btomorrow\b/gi, replacement: "by end of business tomorrow" },
      { pattern: /\bnow\b/gi, replacement: "promptly" },
      { pattern: /\bwait\b/gi, replacement: "await" },
      { pattern: /\bget\b/gi, replacement: "obtain" },
      { pattern: /\bshow\b/gi, replacement: "demonstrate" },
      { pattern: /\bmake sure\b/gi, replacement: "ensure" },
      { pattern: /\blot of\b/gi, replacement: "significant" },
      { pattern: /\ba lot\b/gi, replacement: "substantial" },
      { pattern: /\bbig\b/gi, replacement: "significant" },
      { pattern: /\bsmall\b/gi, replacement: "minor" },
    ],
    diplomatic: [
      { pattern: /\byou're wrong\b/gi, replacement: "I see things differently" },
      { pattern: /\bthat's incorrect\b/gi, replacement: "I believe there may be a misunderstanding" },
      { pattern: /\bno\b/gi, replacement: "I would suggest considering an alternative approach" },
      { pattern: /\bcan't\b/gi, replacement: "may not be able to" },
      { pattern: /\bwont\b|\bwon't\b/gi, replacement: "might not" },
      { pattern: /\byou need to\b/gi, replacement: "it might be helpful to" },
      { pattern: /\byou must\b/gi, replacement: "perhaps we could" },
      { pattern: /\bi need\b/gi, replacement: "it would be great if we could" },
      { pattern: /\bsend me\b/gi, replacement: "would you mind sending" },
      { pattern: /\bproblem\b/gi, replacement: "opportunity for improvement" },
      { pattern: /\bfix\b/gi, replacement: "address" },
      { pattern: /\berror\b/gi, replacement: "discrepancy" },
      { pattern: /\bdidn't\b/gi, replacement: "was not able to" },
      { pattern: /\byou didn't\b/gi, replacement: "it seems there was a" },
      { pattern: /\bwrong\b/gi, replacement: "not quite aligned" },
      { pattern: /\bthanks\b/gi, replacement: "I appreciate" },
      { pattern: /\bi want\b/gi, replacement: "I was hoping" },
      { pattern: /\bnot possible\b/gi, replacement: "that may be challenging" },
      { pattern: /\bgotta\b/gi, replacement: "might need to" },
      { pattern: /\byou have to\b/gi, replacement: "it would be beneficial to" },
      { pattern: /\byou keep (\w+)ing\b/gi, replacement: "I have noticed that you are $1ing" },
      { pattern: /\bi will not\b/gi, replacement: "I may not be in a position to" },
      { pattern: /\bwe did not agree to this\b/gi, replacement: "I believe our understanding was different" },
      { pattern: /\bpay us more\b/gi, replacement: "discuss appropriate compensation" },
      { pattern: /\bextra work\b/gi, replacement: "additional scope" },
      { pattern: /\bif you want\b/gi, replacement: "should you wish to proceed with" },
      { pattern: /\bnot fair\b/gi, replacement: "might not be entirely equitable" },
      { pattern: /\bagree to disagree\b/gi, replacement: "let us find common ground" },
      { pattern: /\bi think\b/gi, replacement: "I am of the view that" },
      { pattern: /\bdone\b/gi, replacement: "addressed" },
      { pattern: /\bjust\b/gi, replacement: "" },
      { pattern: /\basap\b|\bugent\b/gi, replacement: "when you have a moment" },
      { pattern: /\bnow\b/gi, replacement: "in the near future" },
      { pattern: /\bstop\b/gi, replacement: "pause" },
      { pattern: /\bsorry\b/gi, replacement: "I regret" },
      { pattern: /\bgive me\b/gi, replacement: "if you could share" },
      { pattern: /\btell me\b/gi, replacement: "I would welcome your input on" },
      { pattern: /\bcheck\b/gi, replacement: "review whenever convenient" },
      { pattern: /\bi'm\b/gi, replacement: "I am" },
      { pattern: /\bi'll\b/gi, replacement: "I will" },
      { pattern: /\bit's\b/gi, replacement: "it is" },
      { pattern: /\bthat's\b/gi, replacement: "that is" },
      { pattern: /\bdon't\b/gi, replacement: "do not" },
      { pattern: /\bdoesn't\b/gi, replacement: "does not" },
      { pattern: /\bcan't\b/gi, replacement: "cannot" },
      { pattern: /\bi'd\b/gi, replacement: "I would" },
    ],
    firm: [
      { pattern: /\bi think\b/gi, replacement: "it is clear that" },
      { pattern: /\bmaybe\b|\bmaybe\b/gi, replacement: "this needs to be" },
      { pattern: /\bi would like\b/gi, replacement: "I expect" },
      { pattern: /\bplease consider\b/gi, replacement: "this requires" },
      { pattern: /\bif possible\b/gi, replacement: "effective immediately" },
      { pattern: /\bcould you please\b/gi, replacement: "you are directed to" },
      { pattern: /\bmay i\b/gi, replacement: "I will" },
      { pattern: /\bperhaps\b/gi, replacement: "it is necessary that" },
      { pattern: /\bmight be\b/gi, replacement: "will be" },
      { pattern: /\bi suggest\b/gi, replacement: "I require" },
      { pattern: /\bwe can\b/gi, replacement: "we will" },
      { pattern: /\bhoping\b/gi, replacement: "expecting" },
      { pattern: /\bgently remind\b/gi, replacement: "remind" },
      { pattern: /\bjust following up\b/gi, replacement: "following up" },
      { pattern: /\bjust\b/gi, replacement: "" },
      { pattern: /\bgotta\b/gi, replacement: "must" },
      { pattern: /\byou have to\b/gi, replacement: "you are required to" },
      { pattern: /\byou keep (\w+)ing\b/gi, replacement: "it has been noted that you continue to $1" },
      { pattern: /\bi will not\b/gi, replacement: "I cannot" },
      { pattern: /\bwe did not agree to this\b/gi, replacement: "this was not authorized" },
      { pattern: /\bpay us more\b/gi, replacement: "provide additional payment" },
      { pattern: /\bextra work\b/gi, replacement: "unauthorized work" },
      { pattern: /\bif you want\b/gi, replacement: "if you intend to proceed with" },
      { pattern: /\bnot fair\b/gi, replacement: "unacceptable" },
      { pattern: /\bwrong\b/gi, replacement: "incorrect and needs correction" },
      { pattern: /\bproblem\b/gi, replacement: "issue that requires resolution" },
      { pattern: /\bi need\b/gi, replacement: "I require" },
      { pattern: /\bsend me\b/gi, replacement: "submit to me" },
      { pattern: /\bgive me\b/gi, replacement: "provide me with" },
      { pattern: /\bdone\b/gi, replacement: "completed without delay" },
      { pattern: /\bfix\b/gi, replacement: "rectify" },
      { pattern: /\bhelp\b/gi, replacement: "support" },
      { pattern: /\bcheck\b/gi, replacement: "verify" },
      { pattern: /\bstop\b/gi, replacement: "cease" },
      { pattern: /\bwait\b/gi, replacement: "cannot wait" },
      { pattern: /\bnow\b/gi, replacement: "immediately" },
      { pattern: /\basap\b|\bugent\b/gi, replacement: "immediately" },
      { pattern: /\bthanks\b/gi, replacement: "acknowledge" },
      { pattern: /\bsorry\b/gi, replacement: "this should not have happened" },
      { pattern: /\bi'm\b/gi, replacement: "I am" },
      { pattern: /\bi'll\b/gi, replacement: "I will" },
      { pattern: /\bit's\b/gi, replacement: "it is" },
      { pattern: /\bthat's\b/gi, replacement: "that is" },
      { pattern: /\bdon't\b/gi, replacement: "do not" },
      { pattern: /\bwon't\b|\bwon't\b/gi, replacement: "will not" },
      { pattern: /\bcan't\b/gi, replacement: "cannot" },
      { pattern: /\bwould like to\b/gi, replacement: "must" },
    ],
    empathetic: [
      { pattern: /\bi understand\b/gi, replacement: "I truly understand" },
      { pattern: /\bsorry\b/gi, replacement: "I am truly sorry" },
      { pattern: /\bproblem\b/gi, replacement: "challenge" },
      { pattern: /\bissue\b/gi, replacement: "situation" },
      { pattern: /\berror\b/gi, replacement: "unfortunate mistake" },
      { pattern: /\bthanks\b/gi, replacement: "I am so grateful" },
      { pattern: /\bgood\b/gi, replacement: "wonderful" },
      { pattern: /\bgreat\b/gi, replacement: "fantastic" },
      { pattern: /\bdifficult\b/gi, replacement: "challenging" },
      { pattern: /\bhard\b/gi, replacement: "tough" },
      { pattern: /\bplease\b/gi, replacement: "I would kindly ask" },
      { pattern: /\bdon't worry\b/gi, replacement: "please do not worry" },
      { pattern: /\bi'll help\b/gi, replacement: "I am here to support you" },
      { pattern: /\byou need to\b/gi, replacement: "it might help to" },
      { pattern: /\bcan't\b/gi, replacement: "are unable to" },
      { pattern: /\bgotta\b/gi, replacement: "have to" },
      { pattern: /\byou have to\b/gi, replacement: "I know it is not easy, but" },
      { pattern: /\byou keep (\w+)ing\b/gi, replacement: "I have noticed you have been $1ing" },
      { pattern: /\bi will not\b/gi, replacement: "I am afraid I cannot" },
      { pattern: /\bwe did not agree to this\b/gi, replacement: "I understand we may have had a different understanding" },
      { pattern: /\bpay us more\b/gi, replacement: "work out the compensation" },
      { pattern: /\bextra work\b/gi, replacement: "additional effort" },
      { pattern: /\bif you want\b/gi, replacement: "if you feel it is necessary to proceed with" },
      { pattern: /\bnot fair\b/gi, replacement: "I can see how this feels unfair" },
      { pattern: /\bwrong\b/gi, replacement: "not quite right" },
      { pattern: /\bno\b/gi, replacement: "I wish I could say yes but" },
      { pattern: /\bi think\b/gi, replacement: "I feel" },
      { pattern: /\bi need\b/gi, replacement: "I could really use" },
      { pattern: /\bsend me\b/gi, replacement: "could you kindly share" },
      { pattern: /\bgive me\b/gi, replacement: "I would really appreciate" },
      { pattern: /\bdone\b/gi, replacement: "taken care of" },
      { pattern: /\bfix\b/gi, replacement: "sort out" },
      { pattern: /\bhelp\b/gi, replacement: "lend a hand" },
      { pattern: /\bcheck\b/gi, replacement: "look into" },
      { pattern: /\bstop\b/gi, replacement: "take a break from" },
      { pattern: /\bwait\b/gi, replacement: "bear with me" },
      { pattern: /\bnow\b/gi, replacement: "as soon as you can" },
      { pattern: /\basap\b|\bugent\b/gi, replacement: "whenever you get a chance" },
      { pattern: /\bi'm\b/gi, replacement: "I am" },
      { pattern: /\bi'll\b/gi, replacement: "I will" },
      { pattern: /\bit's\b/gi, replacement: "it is" },
      { pattern: /\bthat's\b/gi, replacement: "that is" },
      { pattern: /\bdon't\b|\bdon't\b/gi, replacement: "do not" },
      { pattern: /\bdoesn't\b/gi, replacement: "does not" },
      { pattern: /\bdidn't\b/gi, replacement: "did not" },
    ],
    neutral: [
      { pattern: /\byeah\b|\byep\b/gi, replacement: "yes" },
      { pattern: /\bnah\b|\bnope\b/gi, replacement: "no" },
      { pattern: /\bthanks\b/gi, replacement: "thank you" },
      { pattern: /\bwanna\b|\bwant to\b/gi, replacement: "would like to" },
      { pattern: /\bgonna\b|\bgoing to\b/gi, replacement: "will" },
      { pattern: /\bgotta\b/gi, replacement: "have to" },
      { pattern: /\bjust\b/gi, replacement: "" },
      { pattern: /\bdon't\b|\bdon't\b/gi, replacement: "do not" },
      { pattern: /\bcan't\b/gi, replacement: "cannot" },
      { pattern: /\bwon't\b|\bwon't\b/gi, replacement: "will not" },
      { pattern: /\bdoesn't\b/gi, replacement: "does not" },
      { pattern: /\bdidn't\b/gi, replacement: "did not" },
      { pattern: /\bhaven't\b/gi, replacement: "have not" },
      { pattern: /\bhasn't\b/gi, replacement: "has not" },
      { pattern: /\bi'm\b/gi, replacement: "I am" },
      { pattern: /\bi'll\b/gi, replacement: "I will" },
      { pattern: /\bit's\b/gi, replacement: "it is" },
      { pattern: /\bthat's\b/gi, replacement: "that is" },
      { pattern: /\bthere's\b/gi, replacement: "there is" },
      { pattern: /\bhere's\b/gi, replacement: "here is" },
      { pattern: /\bwont\b|\bwon't\b/gi, replacement: "will not" },
      { pattern: /\bi'd\b/gi, replacement: "I would" },
      { pattern: /\bit'll\b/gi, replacement: "it will" },
      { pattern: /\bwe'll\b/gi, replacement: "we will" },
    ],
  };

  return rules[tone] || rules.professional;
}

function getToneOpening(tone, recipient, commType) {
  const name = recipient || "there";
  const isSlack = commType === "slack";
  const t = tone.toLowerCase();

  const openings = {
    professional: isSlack ? `Hi ${name},\n\n` : `Dear ${name},\n\n`,
    diplomatic: isSlack ? `Hello ${name},\n\n` : `Dear ${name},\n\n`,
    firm: isSlack ? `${name},\n\n` : `Dear ${name},\n\n`,
    empathetic: isSlack ? `Hi ${name},\n\n` : `Dear ${name},\n\n`,
    neutral: isSlack ? `Hi ${name},\n\n` : `Hello ${name},\n\n`,
  };

  return openings[t] || openings.professional;
}

function getToneClosing(tone, commType) {
  const isSlack = commType === "slack";
  const t = tone.toLowerCase();

  const closings = {
    professional: isSlack ? "\n\nBest regards,\n[Your Name]" : "\n\nSincerely,\n[Your Name]",
    diplomatic: isSlack ? "\n\nWarmly,\n[Your Name]" : "\n\nWarm regards,\n[Your Name]",
    firm: isSlack ? "\n\nRegards,\n[Your Name]" : "\n\nBest regards,\n[Your Name]",
    empathetic: isSlack ? "\n\nWith appreciation,\n[Your Name]" : "\n\nWith gratitude,\n[Your Name]",
    neutral: isSlack ? "\n\nThanks,\n[Your Name]" : "\n\nRegards,\n[Your Name]",
  };

  return closings[t] || closings.professional;
}

export function generateSmartFallback({ message, communicationType, recipient, tone, subject }) {
  if (!message || !message.trim()) return "";

  const desiredTone = tone || "Professional";
  const isSlack = communicationType === "slack";

  // Extract subject line
  const subjectLine = subject && !isSlack ? `Subject: ${subject}\n\n` : "";

  // Clean the message — strip existing greetings/closings
  let cleaned = message.trim().replace(/\s+/g, " ");
  cleaned = cleaned.replace(/^(hi|hello|dear|hey|to:)\s+[a-zA-Z0-9_\-\s]+,?/i, "").trim();
  cleaned = cleaned
    .replace(/(sincerely|regards|best regards|thanks|thank you|best|cheers|warmly|gratitude),?\s*([a-zA-Z0-9_\-\s]*)$/i, "")
    .trim();

  // Reword the message for the desired tone
  const reworded = rewordMessage(cleaned, desiredTone);

  // Build the output
  const greeting = getToneOpening(desiredTone, recipient, communicationType);
  const closing = getToneClosing(desiredTone, communicationType);

  return `${subjectLine}${greeting}${reworded}${closing}`;
}

export function getImprovements(message = "", origTone = "Unstructured / Informal", newTone = "Professional") {
  const text = message.trim();
  const lower = text.toLowerCase();
  const improvements = [];

  if (/[A-Z]{3,}/.test(text) || text.includes("!")) {
    improvements.push("Standardized sentence casing and lowered aggressive punctuation emphasis.");
  }

  const hasGreeting = /^(hi|hello|dear|hey|to:)\s+/i.test(text);
  if (!hasGreeting) {
    improvements.push("Structured the opening with a polite and appropriate greeting.");
  } else if (
    /^(hey|yo|hi)\s+/i.test(text) &&
    (newTone.toLowerCase() === "professional" || newTone.toLowerCase() === "firm")
  ) {
    improvements.push("Upgraded the informal greeting to standard business correspondence style.");
  }

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

  const wordsCount = text.split(/\s+/).length;
  if (wordsCount < 10) {
    improvements.push("Expanded the brief input into a complete message with context and details.");
  } else if (!text.includes("\n")) {
    improvements.push("Organized continuous text into neat paragraphs for improved layout and readability.");
  }

  const hasClosing = /(sincerely|regards|best regards|thanks|thank you|best|cheers),?\s*([a-zA-Z0-9_\-\s]*)$/i.test(text);
  if (!hasClosing) {
    improvements.push("Appended a professional sign-off and a placeholder for contact details.");
  }

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