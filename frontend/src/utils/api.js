/**
 * API client for PipeWise-AI Python backend.
 * All ML operations go through the Flask server.
 */

const API_BASE = window.location.hostname === "localhost" ? "http://localhost:8000/api" : `http://${window.location.hostname}:8000/api`;

let sessionId = localStorage.getItem("pipewise_session_id") || "";

function getHeaders() {
  return {
    "X-Session-Id": sessionId,
  };
}

function saveSession(id) {
  sessionId = id;
  localStorage.setItem("pipewise_session_id", id);
}

// ── Upload ──

export async function uploadFile(file) {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_BASE}/upload`, {
    method: "POST",
    headers: { "X-Session-Id": sessionId },
    body: formData,
  });
  const data = await res.json();
  if (data.sessionId) saveSession(data.sessionId);
  if (!res.ok) throw new Error(data.error || "Upload failed");
  return data;
}

export async function loadDemo() {
  const res = await fetch(`${API_BASE}/upload/demo`, {
    method: "POST",
    headers: getHeaders(),
  });
  const data = await res.json();
  if (data.sessionId) saveSession(data.sessionId);
  if (!res.ok) throw new Error(data.error || "Demo load failed");
  return data;
}

// ── Understand ──

export async function getUnderstandData() {
  const res = await fetch(`${API_BASE}/understand`, { headers: getHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed");
  return data;
}

// ── Clean ──

export async function getCleanInfo() {
  const res = await fetch(`${API_BASE}/clean/info`, { headers: getHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed");
  return data;
}

export async function applyClean(action, column, strategy, fillValue) {
  const res = await fetch(`${API_BASE}/clean/apply`, {
    method: "POST",
    headers: { ...getHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ action, column, strategy, fillValue }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Clean failed");
  return data;
}

// ── Visualize ──

export async function generateChart(graphType, xColumn, yColumn) {
  const res = await fetch(`${API_BASE}/visualize`, {
    method: "POST",
    headers: { ...getHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ graphType, xColumn, yColumn }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Chart failed");
  return data;
}

// ── Train ──

export async function trainModel(targetColumn, algorithm, testSize, taskType) {
  const res = await fetch(`${API_BASE}/train`, {
    method: "POST",
    headers: { ...getHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ targetColumn, algorithm, testSize, taskType }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Training failed");
  return data;
}

export async function compareModels(targetColumn, testSize, taskType) {
  const res = await fetch(`${API_BASE}/train/compare`, {
    method: "POST",
    headers: { ...getHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ targetColumn, testSize, taskType }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Comparison failed");
  return data;
}

// ── Insights ──

export async function getInsights() {
  const res = await fetch(`${API_BASE}/insights`, { headers: getHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed");
  return data;
}

// ── Chat ──

export async function sendChatMessage(question) {
  const res = await fetch(`${API_BASE}/chat`, {
    method: "POST",
    headers: { ...getHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ question }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Chat failed");
  return data;
}

// ── Export ──

export function getExportUrl(format) {
  return `${API_BASE}/export/${format}?sid=${sessionId}`;
}

export async function exportData(format) {
  const res = await fetch(`${API_BASE}/export/${format}`, { headers: getHeaders() });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || "Export failed");
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `dataset_export.${format}`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Health ──

export async function checkHealth() {
  try {
    const res = await fetch(`${API_BASE}/health`, { headers: getHeaders() });
    return res.ok;
  } catch {
    return false;
  }
}
