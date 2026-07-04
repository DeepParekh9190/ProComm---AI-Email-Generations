"use client";

import { useState, useEffect } from "react";
import {
  Activity,
  DollarSign,
  Cpu,
  RefreshCw,
  Search,
  Trash2,
  Calendar,
  Layers,
  ArrowRight,
  Eye,
  AlertTriangle,
  Clock
} from "lucide-react";

export default function TelemetryLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLog, setSelectedLog] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchLogs = () => {
    setLoading(true);
    fetch("/api/admin/telemetry")
      .then((res) => res.json())
      .then((data) => {
        setLogs(data.logs || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load telemetry logs:", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleClearLogs = async () => {
    if (!confirm("Are you sure you want to clear all telemetry logs? This cannot be undone.")) return;
    setActionLoading(true);
    try {
      const res = await fetch("/api/admin/telemetry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "clear" }),
      });
      if (res.ok) {
        setLogs([]);
        setSelectedLog(null);
      }
    } catch (err) {
      console.error(err);
    }
    setActionLoading(false);
  };

  // Calculations
  const totalRequests = logs.length;
  const fallbackRequests = logs.filter((l) => l.isFallback).length;
  const fallbackRate = totalRequests ? Math.round((fallbackRequests / totalRequests) * 100) : 0;
  
  const avgLatency = totalRequests
    ? Math.round(logs.reduce((acc, curr) => acc + (curr.latencyMs || 0), 0) / totalRequests)
    : 0;

  const totalPromptTokens = logs.reduce((acc, curr) => acc + (curr.promptTokens || 0), 0);
  const totalCompletionTokens = logs.reduce((acc, curr) => acc + (curr.completionTokens || 0), 0);
  const totalTokens = totalPromptTokens + totalCompletionTokens;

  // Cost formula based on average token cost (OpenRouter averages)
  // Let's assume $0.00015 / 1K input tokens and $0.0006 / 1K output tokens
  const totalCost = totalRequests
    ? ((totalPromptTokens * 0.00015 + totalCompletionTokens * 0.0006) / 1000)
    : 0;

  // Filter logs
  const filteredLogs = logs.filter((log) => {
    const s = searchTerm.toLowerCase();
    return (
      (log.userEmail || "").toLowerCase().includes(s) ||
      (log.model || "").toLowerCase().includes(s) ||
      (log.originalTone || "").toLowerCase().includes(s) ||
      (log.newTone || "").toLowerCase().includes(s) ||
      (log.communicationType || "").toLowerCase().includes(s) ||
      (log.recipient || "").toLowerCase().includes(s) ||
      (log.draftSnippet || "").toLowerCase().includes(s) ||
      (log.rewriteSnippet || "").toLowerCase().includes(s)
    );
  }).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  // Render SVG charts
  const renderLatencyChart = () => {
    if (logs.length < 2) return <div className="h-32 flex items-center justify-center text-xs text-gray-400">Not enough data to render trend</div>;
    
    // Last 15 logs
    const recentLogs = [...logs].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)).slice(-15);
    const maxLat = Math.max(...recentLogs.map((l) => l.latencyMs || 100));
    
    const width = 500;
    const height = 120;
    const padding = 20;
    
    const points = recentLogs.map((log, index) => {
      const x = padding + (index * (width - padding * 2)) / (recentLogs.length - 1);
      const y = height - padding - ((log.latencyMs || 0) / maxLat) * (height - padding * 2);
      return { x, y, val: log.latencyMs, date: log.timestamp };
    });
    
    const pathD = `M ${points[0].x} ${points[0].y} ` + points.slice(1).map(p => `L ${p.x} ${p.y}`).join(" ");
    
    return (
      <svg className="w-full h-32" viewBox={`0 0 ${width} ${height}`}>
        {/* Grid lines */}
        <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="#f1f5f9" strokeWidth={1} />
        <line x1={padding} y1={height / 2} x2={width - padding} y2={height / 2} stroke="#f1f5f9" strokeWidth={1} />
        <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#e2e8f0" strokeWidth={1} />
        
        {/* Graph Line */}
        <path d={pathD} fill="none" stroke="#d97706" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        
        {/* Glow under path */}
        <path
          d={`${pathD} L ${points[points.length-1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`}
          fill="url(#latencyGrad)"
          opacity={0.15}
        />
        
        <defs>
          <linearGradient id="latencyGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#d97706" />
            <stop offset="100%" stopColor="#d97706" stopOpacity="0" />
          </linearGradient>
        </defs>
        
        {/* Data points */}
        {points.map((p, i) => (
          <g key={i} className="group">
            <circle cx={p.x} cy={p.y} r={3} fill="#d97706" className="cursor-pointer hover:r-5 transition-all" />
            <title>{`${p.val}ms (${new Date(p.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})})`}</title>
          </g>
        ))}
      </svg>
    );
  };

  return (
    <div className="flex flex-col gap-6 h-full p-1">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Telemetry & Generation Logs</h1>
          <p className="text-xs text-gray-400 mt-0.5">Audit rewrite requests, cost metrics, and AI model latency</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchLogs}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-all cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <button
            onClick={handleClearLogs}
            disabled={actionLoading || totalRequests === 0}
            className="inline-flex items-center gap-1.5 rounded-lg bg-red-50 border border-red-100 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100 disabled:opacity-50 transition-all cursor-pointer"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Clear Logs
          </button>
        </div>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {/* Total Cost */}
        <div className="flex items-center gap-4 rounded-2xl bg-white border border-gray-100 px-5 py-4 shadow-sm">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-green-50 text-green-600">
            <DollarSign className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Total Spend</p>
            <p className="text-2xl font-bold text-gray-900 leading-tight">
              ${totalCost.toFixed(4)}
            </p>
            <p className="text-[10px] text-gray-400 mt-0.5">Estimated on tokens</p>
          </div>
        </div>

        {/* Avg Latency */}
        <div className="flex items-center gap-4 rounded-2xl bg-white border border-gray-100 px-5 py-4 shadow-sm">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Avg Latency</p>
            <p className="text-2xl font-bold text-gray-900 leading-tight">
              {avgLatency}ms
            </p>
            <p className="text-[10px] text-gray-400 mt-0.5">Speed across all models</p>
          </div>
        </div>

        {/* Total Tokens */}
        <div className="flex items-center gap-4 rounded-2xl bg-white border border-gray-100 px-5 py-4 shadow-sm">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <Cpu className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Tokens Used</p>
            <p className="text-2xl font-bold text-gray-900 leading-tight">
              {totalTokens.toLocaleString()}
            </p>
            <p className="text-[10px] text-gray-400 mt-0.5">In: {totalPromptTokens.toLocaleString()} | Out: {totalCompletionTokens.toLocaleString()}</p>
          </div>
        </div>

        {/* Fallback Rate */}
        <div className="flex items-center gap-4 rounded-2xl bg-white border border-gray-100 px-5 py-4 shadow-sm">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Fallback Engine Rate</p>
            <p className="text-2xl font-bold text-gray-900 leading-tight">
              {fallbackRate}%
            </p>
            <p className="text-[10px] text-gray-400 mt-0.5">{fallbackRequests} of {totalRequests} rewrites</p>
          </div>
        </div>
      </div>

      {/* Latency & Audit Logs split */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Trends */}
        <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-5 lg:col-span-1">
          <h2 className="text-sm font-bold text-gray-800 mb-1">Latency Trend</h2>
          <p className="text-[11px] text-gray-400 mb-4">Response times in milliseconds for recent requests</p>
          {loading ? (
            <div className="h-32 rounded-lg bg-gray-50 animate-pulse" />
          ) : (
            renderLatencyChart()
          )}
          
          <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">Total API calls tracked:</span>
              <span className="font-semibold text-gray-700">{totalRequests}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">Active OpenRouter calls:</span>
              <span className="font-semibold text-gray-700">{totalRequests - fallbackRequests}</span>
            </div>
          </div>
        </div>

        {/* Log Viewer */}
        <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-5 lg:col-span-2 flex flex-col min-h-[400px]">
          {/* Controls */}
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-gray-800 self-start sm:self-center">Generation Audit Trail</h2>
            
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
              <input
                type="text"
                placeholder="Search logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-gray-50/50 pl-8 pr-3 py-1.5 text-xs text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500 focus:bg-white"
              />
            </div>
          </div>

          {/* Table */}
          <div className="flex-1 overflow-x-auto">
            {loading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-10 rounded-lg bg-gray-50 animate-pulse" />
                ))}
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-center">
                <Search className="h-8 w-8 text-gray-300 mb-2" />
                <p className="text-xs text-gray-500 font-medium">No telemetry logs found</p>
                <p className="text-[10px] text-gray-400">Try adjusting your search criteria or run a rewrite</p>
              </div>
            ) : (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 text-gray-400 font-semibold">
                    <th className="py-2.5">User</th>
                    <th className="py-2.5">Tone Change</th>
                    <th className="py-2.5">Context</th>
                    <th className="py-2.5">Speed/Tokens</th>
                    <th className="py-2.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-3 pr-2">
                        <div className="font-semibold text-gray-800">{log.userEmail || "Anonymous"}</div>
                        <div className="text-[9px] text-gray-400">
                          {new Date(log.timestamp).toLocaleString()}
                        </div>
                      </td>
                      <td className="py-3 pr-2">
                        <div className="flex items-center gap-1">
                          <span className="rounded bg-gray-100 px-1 py-0.5 text-[10px] text-gray-600">{log.originalTone || "Auto"}</span>
                          <ArrowRight className="h-3 w-3 text-gray-300" />
                          <span className="rounded bg-blue-50 px-1 py-0.5 text-[10px] font-semibold text-blue-700">{log.newTone || "Professional"}</span>
                        </div>
                      </td>
                      <td className="py-3 pr-2">
                        <div className="capitalize text-gray-700 font-medium">{log.communicationType}</div>
                        <div className="text-[10px] text-gray-400">to {log.recipient || "someone"}</div>
                      </td>
                      <td className="py-3 pr-2">
                        <div className="text-gray-700 font-medium">{log.latencyMs}ms</div>
                        <div className="text-[10px] text-gray-400">
                          {log.isFallback ? (
                            <span className="text-purple-600 font-semibold">Local Fallback</span>
                          ) : (
                            `${(log.promptTokens || 0) + (log.completionTokens || 0)} tokens`
                          )}
                        </div>
                      </td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="inline-flex h-7 w-7 items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors cursor-pointer"
                          title="View Generation Audit Comparison"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Comparison Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-3xl rounded-2xl bg-white border border-gray-100 shadow-xl overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="border-b border-gray-100 px-6 py-4 bg-gray-50/50 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-gray-800 text-sm">Rewrite Audit Comparison</h3>
                <p className="text-[10px] text-gray-400 mt-0.5">
                  User: {selectedLog.userEmail} · {new Date(selectedLog.timestamp).toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="rounded-lg p-1.5 hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
            
            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-4">
              {/* Context Row */}
              <div className="grid grid-cols-3 gap-4 rounded-xl bg-gray-50 p-3 text-xs">
                <div>
                  <span className="block text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">Model used</span>
                  <span className="font-semibold text-gray-700">{selectedLog.model}</span>
                </div>
                <div>
                  <span className="block text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">Latency</span>
                  <span className="font-semibold text-gray-700">{selectedLog.latencyMs}ms</span>
                </div>
                <div>
                  <span className="block text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">Tokens</span>
                  <span className="font-semibold text-gray-700">
                    {selectedLog.isFallback ? "N/A (Heuristic)" : `${(selectedLog.promptTokens || 0) + (selectedLog.completionTokens || 0)} total`}
                  </span>
                </div>
              </div>

              {/* Side-by-Side comparison */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Draft Input */}
                <div className="flex flex-col border border-red-100 rounded-xl overflow-hidden">
                  <div className="bg-red-50 px-3 py-2 border-b border-red-100 flex items-center justify-between text-xs font-semibold text-red-700">
                    <span>Draft Input</span>
                    <span className="rounded bg-red-100 px-1 py-0.5 text-[9px] uppercase">{selectedLog.originalTone || "Original"}</span>
                  </div>
                  <div className="p-4 flex-1 text-xs text-gray-700 leading-relaxed font-mono whitespace-pre-wrap select-all">
                    {selectedLog.draftSnippet || "No input draft content logged"}
                  </div>
                </div>

                {/* Rewritten Output */}
                <div className="flex flex-col border border-blue-100 rounded-xl overflow-hidden">
                  <div className="bg-blue-50 px-3 py-2 border-b border-blue-100 flex items-center justify-between text-xs font-semibold text-blue-700">
                    <span>AI Rewritten Message</span>
                    <span className="rounded bg-blue-100 px-1 py-0.5 text-[9px] uppercase">{selectedLog.newTone}</span>
                  </div>
                  <div className="p-4 flex-1 text-xs text-gray-700 leading-relaxed font-mono whitespace-pre-wrap select-all">
                    {selectedLog.rewriteSnippet || "No rewrite output content logged"}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Modal Footer */}
            <div className="border-t border-gray-100 px-6 py-4 bg-gray-50/50 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="rounded-lg bg-gray-900 px-4 py-2 text-xs font-semibold text-white hover:bg-gray-800 transition-colors cursor-pointer"
              >
                Close Audit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
