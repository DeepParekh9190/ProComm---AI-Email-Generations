"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Cpu, Plus, Pencil, Trash2, Loader2, Check, X, Search, ChevronDown } from "lucide-react";

// ─── Curated OpenRouter model catalogue ─────────────────────────────────────
const MODEL_CATALOGUE = [
  // ── Meta Llama (free) ──────────────────────────────────────────────────────
  { group: "Meta · Free",        name: "Llama 3.3 70B (Free)",          model_id: "meta-llama/llama-3.3-70b-instruct:free" },
  { group: "Meta · Free",        name: "Llama 3.1 8B (Free)",           model_id: "meta-llama/llama-3.1-8b-instruct:free" },
  { group: "Meta · Free",        name: "Llama 3.2 3B (Free)",           model_id: "meta-llama/llama-3.2-3b-instruct:free" },
  { group: "Meta · Free",        name: "Llama 3.2 11B Vision (Free)",   model_id: "meta-llama/llama-3.2-11b-vision-instruct:free" },
  // ── Google Gemini (free) ──────────────────────────────────────────────────
  { group: "Google · Free",      name: "Gemini 2.0 Flash (Free)",       model_id: "google/gemini-2.0-flash-exp:free" },
  { group: "Google · Free",      name: "Gemini 2.0 Flash Thinking (Free)", model_id: "google/gemini-2.0-flash-thinking-exp:free" },
  { group: "Google · Free",      name: "Gemma 3 27B (Free)",            model_id: "google/gemma-3-27b-it:free" },
  { group: "Google · Free",      name: "Gemma 3 12B (Free)",            model_id: "google/gemma-3-12b-it:free" },
  // ── Mistral (free) ───────────────────────────────────────────────────────
  { group: "Mistral · Free",     name: "Mistral 7B (Free)",             model_id: "mistralai/mistral-7b-instruct:free" },
  { group: "Mistral · Free",     name: "Mistral Small 3.2 24B (Free)",  model_id: "mistralai/mistral-small-3.2-24b-instruct:free" },
  { group: "Mistral · Free",     name: "Devstral Small (Free)",         model_id: "mistralai/devstral-small:free" },
  // ── DeepSeek (free) ──────────────────────────────────────────────────────
  { group: "DeepSeek · Free",    name: "DeepSeek V3 (Free)",            model_id: "deepseek/deepseek-chat:free" },
  { group: "DeepSeek · Free",    name: "DeepSeek R1 (Free)",            model_id: "deepseek/deepseek-r1:free" },
  { group: "DeepSeek · Free",    name: "DeepSeek R1 Distill Llama 70B (Free)", model_id: "deepseek/deepseek-r1-distill-llama-70b:free" },
  // ── Qwen (free) ──────────────────────────────────────────────────────────
  { group: "Qwen · Free",        name: "Qwen3 235B A22B (Free)",        model_id: "qwen/qwen3-235b-a22b:free" },
  { group: "Qwen · Free",        name: "Qwen3 30B A3B (Free)",          model_id: "qwen/qwen3-30b-a3b:free" },
  { group: "Qwen · Free",        name: "Qwen 2.5 72B (Free)",           model_id: "qwen/qwen-2.5-72b-instruct:free" },
  // ── Microsoft (free) ─────────────────────────────────────────────────────
  { group: "Microsoft · Free",   name: "Phi-4 (Free)",                  model_id: "microsoft/phi-4:free" },
  { group: "Microsoft · Free",   name: "Phi-3 Mini 128K (Free)",        model_id: "microsoft/phi-3-mini-128k-instruct:free" },
  // ── Other free ───────────────────────────────────────────────────────────
  { group: "Other · Free",       name: "Gemini Flash 1.5 8B (Free)",    model_id: "google/gemini-flash-1.5-8b:free" },
  { group: "Other · Free",       name: "Zephyr 7B Beta (Free)",         model_id: "huggingfaceh4/zephyr-7b-beta:free" },
  // ── Paid ─────────────────────────────────────────────────────────────────
  { group: "Anthropic · Paid",   name: "Claude 3.5 Sonnet",             model_id: "anthropic/claude-3-5-sonnet" },
  { group: "Anthropic · Paid",   name: "Claude 3.5 Haiku",              model_id: "anthropic/claude-3-5-haiku" },
  { group: "Anthropic · Paid",   name: "Claude 3 Opus",                 model_id: "anthropic/claude-3-opus" },
  { group: "OpenAI · Paid",      name: "GPT-4o",                        model_id: "openai/gpt-4o" },
  { group: "OpenAI · Paid",      name: "GPT-4o Mini",                   model_id: "openai/gpt-4o-mini" },
  { group: "OpenAI · Paid",      name: "o3 Mini",                       model_id: "openai/o3-mini" },
  { group: "Google · Paid",      name: "Gemini 1.5 Pro",                model_id: "google/gemini-pro-1.5" },
  { group: "Meta · Paid",        name: "Llama 3.3 70B",                 model_id: "meta-llama/llama-3.3-70b-instruct" },
  { group: "DeepSeek · Paid",    name: "DeepSeek V3",                   model_id: "deepseek/deepseek-chat" },
  { group: "Mistral · Paid",     name: "Mistral Large",                 model_id: "mistralai/mistral-large" },
];

// group models
const GROUPS = [...new Set(MODEL_CATALOGUE.map((m) => m.group))];

// ─── Searchable Model Dropdown ───────────────────────────────────────────────
function ModelPicker({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = query.trim()
    ? MODEL_CATALOGUE.filter(
        (m) =>
          m.name.toLowerCase().includes(query.toLowerCase()) ||
          m.model_id.toLowerCase().includes(query.toLowerCase()) ||
          m.group.toLowerCase().includes(query.toLowerCase())
      )
    : MODEL_CATALOGUE;

  const filteredGroups = [...new Set(filtered.map((m) => m.group))];

  const selected = MODEL_CATALOGUE.find((m) => m.model_id === value?.model_id);

  return (
    <div ref={ref} className="relative">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => { setOpen((v) => !v); setQuery(""); }}
        className={`w-full flex items-center justify-between rounded-lg border px-3.5 py-2.5 text-sm text-left transition-all focus:outline-none focus:ring-2 focus:ring-brand-100 ${
          selected
            ? "border-brand-400 bg-brand-50/40 text-gray-900"
            : "border-border bg-white text-text-muted"
        }`}
      >
        <span className="truncate">
          {selected ? (
            <span className="font-semibold">{selected.name}</span>
          ) : (
            "Select a model…"
          )}
        </span>
        <ChevronDown className={`h-4 w-4 shrink-0 ml-2 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 mt-1.5 w-full rounded-xl border border-border bg-white shadow-xl overflow-hidden">
          {/* Search */}
          <div className="flex items-center gap-2 border-b border-border px-3 py-2">
            <Search className="h-3.5 w-3.5 shrink-0 text-text-muted" />
            <input
              autoFocus
              type="text"
              placeholder="Search models…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full text-sm text-text-primary placeholder:text-text-muted focus:outline-none bg-transparent"
            />
            {query && (
              <button onClick={() => setQuery("")} className="text-text-muted hover:text-text-primary">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-60 overflow-y-auto py-1">
            {filteredGroups.length === 0 ? (
              <p className="px-4 py-6 text-center text-xs text-text-muted">No models match your search.</p>
            ) : (
              filteredGroups.map((group) => (
                <div key={group}>
                  <p className="sticky top-0 bg-gray-50 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-text-muted border-b border-border-light">
                    {group}
                  </p>
                  {filtered.filter((m) => m.group === group).map((m) => (
                    <button
                      key={m.model_id}
                      type="button"
                      onClick={() => { onChange(m); setOpen(false); setQuery(""); }}
                      className={`w-full flex items-center gap-2 px-4 py-2.5 text-left hover:bg-surface-secondary transition-colors ${
                        selected?.model_id === m.model_id ? "bg-brand-50" : ""
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-text-primary truncate">{m.name}</p>
                        <p className="text-[10px] font-mono text-text-muted truncate">{m.model_id}</p>
                      </div>
                      {selected?.model_id === m.model_id && (
                        <Check className="h-3.5 w-3.5 shrink-0 text-brand-600" />
                      )}
                    </button>
                  ))}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function AdminAIModelsPage() {
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);

  // form state
  const [selectedModel, setSelectedModel] = useState(null); // { name, model_id }
  const [customName, setCustomName] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [isDefault, setIsDefault] = useState(false);

  const fetchModels = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/ai-models");
      const data = await res.json();
      if (data.models) setModels(data.models);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchModels(); }, [fetchModels]);

  const resetForm = () => {
    setSelectedModel(null);
    setCustomName("");
    setIsActive(true);
    setIsDefault(false);
    setEditing(null);
    setShowForm(false);
  };

  const openEdit = (model) => {
    // Try to find in catalogue
    const catalogue = MODEL_CATALOGUE.find((m) => m.model_id === model.model_id);
    setSelectedModel(catalogue || { name: model.name, model_id: model.model_id });
    setCustomName(model.name);
    setIsActive(model.is_active);
    setIsDefault(model.is_default);
    setEditing(model.id);
    setShowForm(true);
  };

  const handleSave = async () => {
    const modelId = selectedModel?.model_id;
    const name = customName.trim() || selectedModel?.name || "";
    if (!name || !modelId) return;

    setActionLoading("save");
    const url = editing ? `/api/admin/ai-models/${editing}` : "/api/admin/ai-models";
    const method = editing ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, model_id: modelId, is_active: isActive, is_default: isDefault }),
    });

    if (res.ok) { await fetchModels(); resetForm(); }
    setActionLoading(null);
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this model? Users will no longer be able to use it.")) return;
    setActionLoading(id);
    const res = await fetch(`/api/admin/ai-models/${id}`, { method: "DELETE" });
    if (res.ok) await fetchModels();
    setActionLoading(null);
  };

  const toggleActive = async (model) => {
    setActionLoading(model.id);
    const res = await fetch(`/api/admin/ai-models/${model.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !model.is_active }),
    });
    if (res.ok) await fetchModels();
    setActionLoading(null);
  };

  const setAsDefault = async (model) => {
    if (model.is_default) return;
    setActionLoading(model.id);
    const res = await fetch(`/api/admin/ai-models/${model.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_default: true }),
    });
    if (res.ok) await fetchModels();
    setActionLoading(null);
  };

  const canSave = (selectedModel?.model_id) && !actionLoading;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-text-primary">AI Models</h1>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Model
        </button>
      </div>

      {/* ── Add / Edit Modal ─────────────────────────────────────────── */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/25 backdrop-blur-sm" onClick={resetForm}>
          <div className="w-full max-w-lg rounded-2xl border border-border bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-text-primary mb-1">{editing ? "Edit Model" : "Add AI Model"}</h2>
            <p className="text-xs text-text-muted mb-5">
              {editing ? "Update the settings for this model." : "Pick a model from the list — name and ID are filled automatically."}
            </p>

            <div className="space-y-4">
              {/* Model picker */}
              <div>
                <label className="block text-sm font-semibold text-text-primary mb-1.5">
                  Model <span className="text-red-400">*</span>
                </label>
                <ModelPicker
                  value={selectedModel}
                  onChange={(m) => {
                    setSelectedModel(m);
                    setCustomName(m.name);
                  }}
                />
              </div>

              {/* Display name — editable after selection */}
              {selectedModel && (
                <div>
                  <label className="block text-sm font-semibold text-text-primary mb-1.5">
                    Display Name
                    <span className="ml-2 text-[10px] font-normal text-text-muted">(optional override)</span>
                  </label>
                  <input
                    type="text"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    className="w-full rounded-lg border border-border bg-white px-3.5 py-2.5 text-sm text-text-primary focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
                  />
                </div>
              )}

              {/* Model ID preview */}
              {selectedModel && (
                <div className="rounded-lg bg-gray-50 border border-border-light px-3.5 py-2.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted mb-0.5">Model ID</p>
                  <p className="font-mono text-xs text-text-secondary break-all">{selectedModel.model_id}</p>
                </div>
              )}

              {/* Toggles */}
              <div className="flex items-center gap-6 pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="rounded border-border text-brand-600 focus:ring-brand-500"
                  />
                  <span className="text-sm font-medium text-text-primary">Active</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isDefault}
                    onChange={(e) => setIsDefault(e.target.checked)}
                    className="rounded border-border text-brand-600 focus:ring-brand-500"
                  />
                  <span className="text-sm font-medium text-text-primary">Default model</span>
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                onClick={resetForm}
                className="rounded-lg border border-border px-4 py-2 text-sm font-semibold text-text-secondary hover:bg-surface-secondary transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!canSave}
                className="rounded-lg bg-brand-600 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-40 transition-colors"
              >
                {actionLoading === "save" ? "Saving…" : editing ? "Update" : "Add Model"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Table ───────────────────────────────────────────────────── */}
      <div className="overflow-x-auto rounded-xl border border-border bg-white shadow-soft">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-surface-secondary">
              <th className="px-4 py-3 text-left font-semibold text-text-secondary">Name</th>
              <th className="px-4 py-3 text-left font-semibold text-text-secondary">Model ID</th>
              <th className="px-4 py-3 text-center font-semibold text-text-secondary">Active</th>
              <th className="px-4 py-3 text-center font-semibold text-text-secondary">Default</th>
              <th className="px-4 py-3 text-right font-semibold text-text-secondary">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="py-12 text-center"><Loader2 className="mx-auto h-5 w-5 animate-spin text-text-muted" /></td></tr>
            ) : models.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-16 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="rounded-2xl bg-gray-50 p-4">
                      <Cpu className="h-8 w-8 text-gray-300" />
                    </div>
                    <p className="text-sm font-semibold text-text-secondary">No AI models yet</p>
                    <p className="text-xs text-text-muted">Click &quot;Add Model&quot; and pick one from the list.</p>
                  </div>
                </td>
              </tr>
            ) : (
              models.map((model) => (
                <tr key={model.id} className="border-b border-border-light hover:bg-surface-secondary/50 transition-colors">
                  <td className="px-4 py-3 font-medium text-text-primary">
                    <div className="flex items-center gap-2">
                      <Cpu className="h-4 w-4 text-text-muted shrink-0" />
                      {model.name}
                      {model.is_default && (
                        <span className="rounded bg-brand-50 px-1.5 py-0.5 text-[10px] font-bold text-brand-700 border border-brand-100 uppercase tracking-wider">Default</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-text-secondary">{model.model_id}</td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => toggleActive(model)}
                      disabled={actionLoading === model.id}
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold transition-colors disabled:opacity-50 ${model.is_active ? "bg-green-50 text-green-700 hover:bg-green-100" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}
                    >
                      {model.is_active ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                      {model.is_active ? "Active" : "Inactive"}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => setAsDefault(model)}
                      disabled={model.is_default || actionLoading === model.id}
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold transition-colors disabled:opacity-50 ${model.is_default ? "bg-brand-50 text-brand-700 cursor-default" : "bg-slate-100 text-slate-500 hover:bg-brand-50 hover:text-brand-600"}`}
                    >
                      {model.is_default ? <Check className="h-3 w-3" /> : null}
                      {model.is_default ? "Default" : "Set Default"}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => openEdit(model)} disabled={actionLoading === model.id} className="rounded-lg p-2 text-text-secondary hover:bg-surface-secondary hover:text-brand-600 transition-colors disabled:opacity-50" title="Edit">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button onClick={() => handleDelete(model.id)} disabled={actionLoading === model.id} className="rounded-lg p-2 text-text-secondary hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-50" title="Delete">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
