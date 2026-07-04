"use client";

import { useState, useEffect, useRef } from "react";
import {
  SlidersHorizontal,
  Save,
  RotateCcw,
  Sparkles,
  Play,
  CheckCircle,
  HelpCircle,
  Copy,
  Info,
  Clock,
  ArrowRight,
  TrendingDown
} from "lucide-react";

export default function PromptEditorPage() {
  // Settings state
  const [activePrompt, setActivePrompt] = useState("");
  const [editorPrompt, setEditorPrompt] = useState("");
  const [saveLoading, setSaveLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Sandbox inputs
  const [testDraft, setTestDraft] = useState("I need this report ASAP John, otherwise we are going to miss the deadline and it will look very bad.");
  const [testCommType, setTestCommType] = useState("email");
  const [testRecipient, setTestRecipient] = useState("Manager");
  const [testTone, setTestTone] = useState("Diplomatic");
  const [testSubject, setTestSubject] = useState("Project Delay");
  
  // Playground outputs
  const [runningTest, setRunningTest] = useState(false);
  const [resultA, setResultA] = useState(null); // Active
  const [resultB, setResultB] = useState(null); // Sandbox Draft

  const textareaRef = useRef(null);

  useEffect(() => {
    fetchPrompt();
  }, []);

  const fetchPrompt = () => {
    fetch("/api/admin/prompt-settings")
      .then((res) => res.json())
      .then((data) => {
        setActivePrompt(data.systemPromptTemplate || "");
        setEditorPrompt(data.systemPromptTemplate || "");
      })
      .catch((err) => console.error("Failed to load prompt settings:", err));
  };

  const handleSave = async () => {
    setSaveLoading(true);
    setSuccessMsg("");
    try {
      const res = await fetch("/api/admin/prompt-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ systemPromptTemplate: editorPrompt }),
      });
      if (res.ok) {
        setActivePrompt(editorPrompt);
        setSuccessMsg("System prompt updated successfully!");
        setTimeout(() => setSuccessMsg(""), 3000);
      }
    } catch (err) {
      console.error(err);
    }
    setSaveLoading(false);
  };

  const handleResetToDefault = () => {
    const confirmReset = confirm("Are you sure you want to reset the prompt template to default? This will overwrite your current draft.");
    if (!confirmReset) return;
    
    const defaultPrompt = `You are ProComm, an AI communication assistant. Your job is to rewrite the user's message to reflect the desired tone.

Given the user's draft: "{{message}}", communication type ({{communicationType}}), recipient ({{recipient}}), desired tone ({{tone}}), and subject ({{subject}}), do the following:

1. Detect the original tone of the user's message.
2. Rewrite the message directly and completely in the desired tone, including greeting, body, closing, and a signature line (e.g. "[Your Name]"). 
   CRITICAL CRITERIA: Do NOT reply to the message, do NOT quote the original text in quotes or blockquotes, and do NOT include intro/meta text such as "I wanted to touch base regarding your recent update:" or "Here is the rewritten version:". The rewritten message must stand on its own as a direct, seamless, and fully rewritten communication that is ready to be sent.
3. List 3-5 specific improvements made (e.g., specific wording adjustments, softening, or structure changes).
4. Generate alternative versions for all other available tones ({{targetTones}}). Each alternative MUST be a full, complete rewritten message including greeting, body, closing, and signature line, formatted for the selected communication type, ready to be sent.

Respond ONLY with valid JSON in this exact format, no other text:
{
  "rewrittenMessage": "the complete rewritten message",
  "originalTone": "detected original tone",
  "newTone": "{{tone}}",
  "improvements": ["improvement 1", "improvement 2", "improvement 3"],
  "alternatives": [
    { "tone": "Tone1", "preview": "Dear Recipient,\\n\\n[Full message body rewritten in Tone1 tone here]\\n\\nSincerely,\\n[Your Name]" },
    { "tone": "Tone2", "preview": "Dear Recipient,\\n\\n[Full message body rewritten in Tone2 tone here]\\n\\nSincerely,\\n[Your Name]" },
    { "tone": "Tone3", "preview": "Dear Recipient,\\n\\n[Full message body rewritten in Tone3 tone here]\\n\\nSincerely,\\n[Your Name]" },
    { "tone": "Tone4", "preview": "Dear Recipient,\\n\\n[Full message body rewritten in Tone4 tone here]\\n\\nSincerely,\\n[Your Name]" }
  ]
}`;
    setEditorPrompt(defaultPrompt);
  };

  const insertVariable = (variable) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const before = text.substring(0, start);
    const after = text.substring(end, text.length);
    
    const newText = before + variable + after;
    setEditorPrompt(newText);
    
    // Focus back and place cursor after variable
    setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = textarea.selectionEnd = start + variable.length;
    }, 50);
  };

  const runABTest = async () => {
    setRunningTest(true);
    setResultA(null);
    setResultB(null);

    const payload = {
      message: testDraft,
      communicationType: testCommType,
      recipient: testRecipient,
      tone: testTone,
      subject: testSubject
    };

    // Run both concurrently
    try {
      const [resA, resB] = await Promise.all([
        // A uses Active Database Template (template: null falls back to db template)
        fetch("/api/admin/prompt-settings/test", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }).then(r => r.json()),
        
        // B uses Custom Sandbox Template
        fetch("/api/admin/prompt-settings/test", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...payload,
            template: editorPrompt
          }),
        }).then(r => r.json())
      ]);

      setResultA(resA);
      setResultB(resB);
    } catch (err) {
      console.error("Failed to run sandbox comparison test:", err);
    }
    setRunningTest(false);
  };

  const variables = [
    { label: "{{message}}", desc: "User's raw draft text input" },
    { label: "{{communicationType}}", desc: "Selected format (email, slack, client...)" },
    { label: "{{recipient}}", desc: "Selected recipient role (Manager, Vendor...)" },
    { label: "{{tone}}", desc: "Desired tone preset (Professional, Diplomatic...)" },
    { label: "{{subject}}", desc: "Optional email subject line" },
    { label: "{{targetTones}}", desc: "Comma-separated list of secondary tones" }
  ];

  return (
    <div className="flex flex-col gap-6 h-full p-1">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">AI Prompt Configuration</h1>
          <p className="text-xs text-gray-400 mt-0.5">Edit base system prompts and perform side-by-side A/B sandbox tests</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
        {/* Editor (Left column) */}
        <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-800 flex items-center gap-1.5">
              <SlidersHorizontal className="h-4 w-4 text-violet-600" />
              System Prompt Template
            </h2>
            
            <div className="flex gap-2">
              <button
                onClick={handleResetToDefault}
                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors cursor-pointer"
                title="Reset to ProComm default prompt configuration"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reset
              </button>
              <button
                onClick={handleSave}
                disabled={saveLoading}
                className="inline-flex items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-violet-700 transition-colors disabled:opacity-50 cursor-pointer"
              >
                <Save className="h-3.5 w-3.5" />
                {saveLoading ? "Saving..." : "Save Settings"}
              </button>
            </div>
          </div>

          {successMsg && (
            <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-xs font-semibold text-green-700">
              <CheckCircle className="h-4 w-4" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Variable chips */}
          <div>
            <span className="block text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-2">Available Replacement Variables (Click to Insert)</span>
            <div className="flex flex-wrap gap-1.5">
              {variables.map((v) => (
                <button
                  key={v.label}
                  type="button"
                  onClick={() => insertVariable(v.label)}
                  className="rounded-lg bg-gray-50 border border-gray-100 hover:bg-violet-50 hover:border-violet-200 px-2 py-1 text-xs text-gray-600 hover:text-violet-700 font-mono transition-colors cursor-pointer"
                  title={v.desc}
                >
                  {v.label}
                </button>
              ))}
            </div>
          </div>

          <div className="relative">
            <textarea
              ref={textareaRef}
              value={editorPrompt}
              onChange={(e) => setEditorPrompt(e.target.value)}
              rows={20}
              className="w-full rounded-xl border border-gray-200 p-4 font-mono text-[11px] text-gray-700 leading-relaxed focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 bg-gray-50/30"
              placeholder="System prompt template goes here..."
            />
          </div>
        </div>

        {/* Playground (Right column) */}
        <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-800 flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-brand-600" />
              A/B Playground Sandbox
            </h2>
            <button
              onClick={runABTest}
              disabled={runningTest || !testDraft}
              className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-xs font-bold text-white hover:bg-brand-700 disabled:opacity-50 transition-colors cursor-pointer"
            >
              <Play className="h-3.5 w-3.5 fill-current" />
              {runningTest ? "Running Sandbox..." : "Run A/B Comparison"}
            </button>
          </div>

          {/* Test Inputs Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-xl bg-gray-50 p-4 border border-gray-100">
            {/* Tone Selector */}
            <div>
              <label className="block text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Target Tone</label>
              <select
                value={testTone}
                onChange={(e) => setTestTone(e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs focus:outline-none"
              >
                <option value="Professional">Professional</option>
                <option value="Diplomatic">Diplomatic</option>
                <option value="Firm">Firm</option>
                <option value="Empathetic">Empathetic</option>
                <option value="Neutral">Neutral</option>
              </select>
            </div>

            {/* Comm Type Selector */}
            <div>
              <label className="block text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Communication Type</label>
              <select
                value={testCommType}
                onChange={(e) => setTestCommType(e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs focus:outline-none"
              >
                <option value="email">Email</option>
                <option value="slack">Slack Message</option>
                <option value="client">Client Correspondence</option>
                <option value="hr">HR Notice</option>
                <option value="performance">Performance Feedback</option>
                <option value="escalation">Escalation Alert</option>
              </select>
            </div>

            {/* Recipient Input */}
            <div>
              <label className="block text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Recipient Context</label>
              <input
                type="text"
                value={testRecipient}
                onChange={(e) => setTestRecipient(e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs focus:outline-none"
                placeholder="e.g. Manager, Client"
              />
            </div>

            {/* Subject Input */}
            <div>
              <label className="block text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Subject Line</label>
              <input
                type="text"
                value={testSubject}
                onChange={(e) => setTestSubject(e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs focus:outline-none"
                placeholder="Subject Line (Optional)"
              />
            </div>

            {/* Draft Input */}
            <div className="sm:col-span-2">
              <label className="block text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Mock Raw Draft Message</label>
              <textarea
                value={testDraft}
                onChange={(e) => setTestDraft(e.target.value)}
                rows={2}
                className="w-full rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs focus:outline-none"
                placeholder="Type raw draft to test..."
              />
            </div>
          </div>

          {/* Test Output Comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Version A: Active */}
            <div className="flex flex-col border border-gray-200 rounded-xl overflow-hidden min-h-[220px]">
              <div className="bg-gray-100 px-3 py-2 border-b border-gray-200 flex items-center justify-between text-xs font-semibold text-gray-700">
                <span>Version A (Active Prompt)</span>
                {resultA && (
                  <span className="flex items-center gap-1 text-[10px] text-amber-600 font-bold">
                    <Clock className="h-3 w-3" />
                    {resultA.latencyMs}ms
                  </span>
                )}
              </div>
              <div className="p-4 flex-1 text-xs text-gray-600 bg-gray-50/30 overflow-y-auto max-h-[250px] whitespace-pre-wrap select-all">
                {runningTest ? (
                  <div className="space-y-2 animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                    <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                  </div>
                ) : resultA ? (
                  <>
                    <div className="font-semibold mb-2 text-gray-800">Rewritten Output:</div>
                    <div className="font-mono text-gray-600 mb-4 bg-white border border-gray-100 p-2.5 rounded-lg">{resultA.data?.rewrittenMessage || "Error running prompt template A"}</div>
                    
                    <div className="font-semibold text-gray-800 mb-1">Original Tone:</div>
                    <div className="mb-3 text-[10px]"><span className="bg-gray-100 px-1 py-0.5 rounded text-gray-500 font-bold">{resultA.data?.originalTone}</span></div>
                    
                    <div className="font-semibold text-gray-800 mb-1.5">Improvements:</div>
                    <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-gray-500">
                      {resultA.data?.improvements?.map((imp, idx) => (
                        <li key={idx}>{imp}</li>
                      ))}
                    </ul>
                  </>
                ) : (
                  <div className="h-full flex items-center justify-center text-center text-gray-400 py-10">
                    <div>
                      <SlidersHorizontal className="h-6 w-6 mx-auto mb-1 text-gray-300" />
                      <p>Run A/B Comparison to evaluate</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Version B: Sandbox */}
            <div className="flex flex-col border border-violet-200 rounded-xl overflow-hidden min-h-[220px]">
              <div className="bg-violet-50 px-3 py-2 border-b border-violet-100 flex items-center justify-between text-xs font-semibold text-violet-700">
                <span>Version B (Sandbox Draft)</span>
                {resultB && (
                  <span className="flex items-center gap-1 text-[10px] text-violet-600 font-bold">
                    <Clock className="h-3 w-3" />
                    {resultB.latencyMs}ms
                  </span>
                )}
              </div>
              <div className="p-4 flex-1 text-xs text-gray-600 bg-gray-50/30 overflow-y-auto max-h-[250px] whitespace-pre-wrap select-all">
                {runningTest ? (
                  <div className="space-y-2 animate-pulse">
                    <div className="h-4 bg-violet-100 rounded w-3/4"></div>
                    <div className="h-4 bg-violet-100 rounded w-5/6"></div>
                    <div className="h-4 bg-violet-100 rounded w-2/3"></div>
                  </div>
                ) : resultB ? (
                  <>
                    <div className="font-semibold mb-2 text-gray-800">Rewritten Output:</div>
                    <div className="font-mono text-gray-600 mb-4 bg-white border border-gray-100 p-2.5 rounded-lg">{resultB.data?.rewrittenMessage || "Error running prompt template B"}</div>
                    
                    <div className="font-semibold text-gray-800 mb-1">Original Tone:</div>
                    <div className="mb-3 text-[10px]"><span className="bg-gray-100 px-1 py-0.5 rounded text-gray-500 font-bold">{resultB.data?.originalTone}</span></div>
                    
                    <div className="font-semibold text-gray-800 mb-1.5">Improvements:</div>
                    <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-gray-500">
                      {resultB.data?.improvements?.map((imp, idx) => (
                        <li key={idx}>{imp}</li>
                      ))}
                    </ul>
                  </>
                ) : (
                  <div className="h-full flex items-center justify-center text-center text-gray-400 py-10">
                    <div>
                      <Sparkles className="h-6 w-6 mx-auto mb-1 text-gray-300" />
                      <p>Run A/B Comparison to evaluate</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick Stats on comparison */}
          {resultA && resultB && (
            <div className="flex items-center gap-2 rounded-lg bg-violet-50/50 border border-violet-100 p-3 text-xs text-violet-700">
              <Info className="h-4 w-4 shrink-0 text-violet-600" />
              <span>
                {resultB.latencyMs < resultA.latencyMs ? (
                  <>
                    Sandbox Draft prompt template ran <strong className="font-semibold text-green-700">{resultA.latencyMs - resultB.latencyMs}ms faster</strong> than the active template!
                  </>
                ) : resultB.latencyMs > resultA.latencyMs ? (
                  <>
                    Sandbox Draft prompt template was <strong className="font-semibold text-amber-700">{resultB.latencyMs - resultA.latencyMs}ms slower</strong> than the active template. Keep prompt sizes optimal to reduce TTFT (Time To First Token).
                  </>
                ) : (
                  <>
                    Both prompt configurations had identical execution latencies ({resultA.latencyMs}ms).
                  </>
                )}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
