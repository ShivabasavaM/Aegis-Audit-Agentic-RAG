import { useState, useRef, useEffect } from "react";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

const rCfg = {
  Critical: { dot: "#ef4444", accent: "#ef4444", bg: "rgba(239,68,68,0.06)", border: "rgba(239,68,68,0.18)", badge: { bg: "#fef2f2", text: "#b91c1c" }, label: "Critical" },
  High:     { dot: "#f97316", accent: "#f97316", bg: "rgba(249,115,22,0.06)", border: "rgba(249,115,22,0.18)", badge: { bg: "#fff7ed", text: "#c2410c" }, label: "High" },
  Medium:   { dot: "#eab308", accent: "#eab308", bg: "rgba(234,179,8,0.06)",  border: "rgba(234,179,8,0.18)",  badge: { bg: "#fefce8", text: "#854d0e" }, label: "Medium" },
  Low:      { dot: "#22c55e", accent: "#22c55e", bg: "rgba(34,197,94,0.06)",  border: "rgba(34,197,94,0.18)",  badge: { bg: "#f0fdf4", text: "#15803d" }, label: "Low" },
  ERROR:    { dot: "#6b7280", accent: "#6b7280", bg: "rgba(107,114,128,0.06)", border: "rgba(107,114,128,0.18)", badge: { bg: "#f9fafb", text: "#374151" }, label: "Unknown" },
};

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,300&family=JetBrains+Mono:wght@400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg: #0d0d0f;
    --bg1: #131316;
    --bg2: #18181d;
    --bg3: #1e1e25;
    --bg4: #24242d;
    --border: rgba(255,255,255,0.06);
    --border2: rgba(255,255,255,0.10);
    --text: #f0f0f2;
    --text2: #9898a8;
    --text3: #5a5a6a;
    --accent: #7c6ff7;
    --accent2: #6358d4;
    --accent-glow: rgba(124,111,247,0.15);
    --font: 'DM Sans', system-ui, sans-serif;
    --mono: 'JetBrains Mono', monospace;
    --r: 10px;
    --r2: 14px;
  }

  body { font-family: var(--font); background: var(--bg); color: var(--text); -webkit-font-smoothing: antialiased; }

  ::-webkit-scrollbar { width: 4px; height: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: var(--bg4); border-radius: 4px; }

  .root { display: flex; height: 100vh; overflow: hidden; background: var(--bg); }

  /* ── SIDEBAR ── */
  .sidebar {
    width: 280px;
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    border-right: 1px solid var(--border);
    background: var(--bg1);
    transition: width 0.25s cubic-bezier(.4,0,.2,1);
    overflow: hidden;
    position: relative;
  }
  .sidebar.collapsed { width: 0; }

  .sidebar-head {
    padding: 20px;
    border-bottom: 1px solid var(--border);
    display: flex;
    align-items: center;
    gap: 12px;
    flex-shrink: 0;
  }

  .logo-mark {
    width: 36px; height: 36px;
    border-radius: 10px;
    background: linear-gradient(135deg, var(--accent) 0%, #4f46e5 100%);
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
    box-shadow: 0 0 0 1px rgba(124,111,247,0.3), 0 4px 16px rgba(124,111,247,0.25);
  }

  .logo-text { line-height: 1; }
  .logo-text .name { font-size: 15px; font-weight: 600; letter-spacing: -0.3px; color: var(--text); }
  .logo-text .tag { font-size: 11px; color: var(--text3); font-weight: 400; margin-top: 2px; font-family: var(--mono); }

  .sidebar-body { flex: 1; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 6px; }

  .section-label {
    font-size: 10px;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--text3);
    padding: 10px 4px 6px;
    font-family: var(--mono);
  }

  /* Upload zone */
  .upload-zone {
    border: 1px dashed var(--border2);
    border-radius: var(--r);
    padding: 12px;
    cursor: pointer;
    transition: all 0.18s ease;
    background: transparent;
    display: flex; align-items: center; gap: 10px;
  }
  .upload-zone:hover { border-color: var(--accent); background: var(--accent-glow); }
  .upload-zone.has-file { border-color: rgba(124,111,247,0.4); border-style: solid; background: var(--accent-glow); }
  .upload-zone.dragging { border-color: var(--accent); background: rgba(124,111,247,0.12); }

  .upload-icon {
    width: 32px; height: 32px;
    border-radius: 8px;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
    background: var(--bg3);
    border: 1px solid var(--border);
  }
  .upload-zone.has-file .upload-icon { background: rgba(124,111,247,0.2); border-color: rgba(124,111,247,0.3); }

  .upload-meta { min-width: 0; flex: 1; }
  .upload-meta .ulabel { font-size: 10px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text3); }
  .upload-zone.has-file .upload-meta .ulabel { color: var(--accent); }
  .upload-meta .uname { font-size: 12px; color: var(--text2); margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .upload-zone.has-file .upload-meta .uname { color: var(--text); }

  /* Buttons */
  .btn-run {
    width: 100%;
    padding: 12px;
    border-radius: var(--r);
    font-family: var(--font);
    font-size: 13px;
    font-weight: 600;
    letter-spacing: 0.01em;
    cursor: pointer;
    transition: all 0.18s ease;
    display: flex; align-items: center; justify-content: center; gap: 8px;
    border: none;
    outline: none;
  }
  .btn-run.active {
    background: linear-gradient(135deg, var(--accent) 0%, #4f46e5 100%);
    color: #fff;
    box-shadow: 0 1px 0 rgba(255,255,255,0.12) inset, 0 4px 20px rgba(124,111,247,0.3);
  }
  .btn-run.active:hover { filter: brightness(1.08); transform: translateY(-1px); }
  .btn-run.active:active { transform: translateY(0); }
  .btn-run.disabled { background: var(--bg3); color: var(--text3); cursor: not-allowed; }

  .btn-secondary {
    width: 100%;
    padding: 10px 12px;
    border-radius: var(--r);
    font-family: var(--font);
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.18s ease;
    display: flex; align-items: center; justify-content: center; gap: 7px;
    background: var(--bg3);
    border: 1px solid var(--border);
    color: var(--text2);
    outline: none;
  }
  .btn-secondary:hover { background: var(--bg4); border-color: var(--border2); color: var(--text); }

  .btn-danger {
    width: 100%;
    padding: 9px 12px;
    border-radius: var(--r);
    font-family: var(--font);
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.18s ease;
    display: flex; align-items: center; justify-content: center; gap: 7px;
    background: transparent;
    border: 1px solid rgba(239,68,68,0.2);
    color: rgba(239,68,68,0.7);
    outline: none;
  }
  .btn-danger:hover { background: rgba(239,68,68,0.08); border-color: rgba(239,68,68,0.35); color: #ef4444; }

  /* Status footer */
  .status-footer {
    padding: 14px 16px;
    border-top: 1px solid var(--border);
    flex-shrink: 0;
  }
  .status-row {
    display: flex; align-items: center; justify-content: space-between;
    padding: 5px 0;
  }
  .status-key { font-size: 11.5px; color: var(--text3); display: flex; align-items: center; gap: 7px; }
  .status-dot { width: 5px; height: 5px; border-radius: 50%; }
  .status-val { font-size: 11px; font-family: var(--mono); color: var(--text2); }
  .status-val.active { color: var(--accent); background: rgba(124,111,247,0.12); padding: 2px 6px; border-radius: 4px; }

  /* ── SIDEBAR TOGGLE ── */
  .sidebar-toggle {
    position: absolute;
    left: 12px;
    top: 20px;
    z-index: 50;
    width: 30px; height: 30px;
    border-radius: 8px;
    background: var(--bg2);
    border: 1px solid var(--border2);
    color: var(--text2);
    cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    transition: all 0.18s;
  }
  .sidebar-toggle:hover { background: var(--bg3); color: var(--text); }

  /* ── MAIN ── */
  .main { flex: 1; display: flex; flex-direction: column; overflow: hidden; }

  /* Header */
  .main-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 14px 24px;
    border-bottom: 1px solid var(--border);
    background: var(--bg1);
    flex-shrink: 0;
    gap: 12px;
  }
  .main-header-left { min-width: 0; }
  .main-header-left h1 { font-size: 15px; font-weight: 600; color: var(--text); letter-spacing: -0.2px; }
  .main-header-left p { font-size: 12px; color: var(--text3); margin-top: 1px; }

  /* Tab switcher */
  .tab-group {
    display: flex;
    background: var(--bg2);
    border: 1px solid var(--border);
    border-radius: var(--r);
    padding: 3px;
    gap: 2px;
    flex-shrink: 0;
  }
  .tab {
    display: flex; align-items: center; gap: 6px;
    padding: 6px 14px;
    border-radius: 7px;
    font-size: 12.5px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s;
    border: none;
    background: transparent;
    color: var(--text3);
    font-family: var(--font);
    white-space: nowrap;
  }
  .tab:hover { color: var(--text2); }
  .tab.active { background: var(--bg4); color: var(--text); box-shadow: 0 1px 3px rgba(0,0,0,0.3); }

  /* ── AUDIT PANEL ── */
  .audit-panel { flex: 1; overflow-y: auto; padding: 24px; background: var(--bg); }
  .audit-inner { max-width: 1000px; margin: 0 auto; }

  .stat-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px; }
  .stat-card {
    background: var(--bg2);
    border: 1px solid var(--border);
    border-radius: var(--r2);
    padding: 18px 20px;
  }
  .stat-card .val { font-size: 32px; font-weight: 700; letter-spacing: -1px; line-height: 1; }
  .stat-card .lbl { font-size: 12px; color: var(--text3); margin-top: 6px; font-weight: 400; }
  .stat-card.v { --c: var(--accent); }
  .stat-card.r { --c: #ef4444; }
  .stat-card.o { --c: #f97316; }
  .stat-card.g { --c: #22c55e; }
  .stat-card .val { color: var(--c, var(--text)); }

  .audit-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }

  /* Audit card */
  .audit-card {
    background: var(--bg2);
    border: 1px solid var(--border);
    border-radius: var(--r2);
    cursor: pointer;
    transition: border-color 0.18s, background 0.18s;
    overflow: hidden;
    position: relative;
  }
  .audit-card::before {
    content: '';
    position: absolute;
    left: 0; top: 0; bottom: 0;
    width: 3px;
    border-radius: 3px 0 0 3px;
    background: var(--ac, transparent);
  }
  .audit-card:hover { border-color: var(--border2); background: var(--bg3); }

  .audit-card-head {
    padding: 14px 16px 14px 20px;
    display: flex; align-items: flex-start; justify-content: space-between; gap: 8px;
  }
  .audit-card-head-left { flex: 1; min-width: 0; }
  .audit-card-head-left .pillar { font-size: 13px; font-weight: 600; color: var(--text); line-height: 1.3; }
  .audit-card-head-left .citation { font-size: 11px; color: var(--text3); margin-top: 3px; font-family: var(--mono); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .audit-card-head-right { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }

  .rating-badge {
    font-size: 11px;
    font-weight: 600;
    padding: 3px 8px;
    border-radius: 5px;
    font-family: var(--mono);
    letter-spacing: 0.02em;
  }

  .chevron { transition: transform 0.2s; color: var(--text3); }
  .chevron.open { transform: rotate(180deg); }

  .audit-card-body { border-top: 1px solid var(--border); padding: 14px 16px 16px 20px; }
  .audit-card-body .field-label { font-size: 10px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.07em; color: var(--text3); margin-bottom: 5px; font-family: var(--mono); }
  .audit-card-body .finding-text { font-size: 12.5px; color: var(--text2); line-height: 1.6; }
  .remediation-box {
    margin-top: 12px;
    padding: 12px 14px;
    border-radius: 8px;
    background: var(--bg3);
    border: 1px solid var(--border);
  }
  .remediation-box .rtext { font-size: 12.5px; color: var(--text2); line-height: 1.6; }

  /* Loading state */
  .audit-loading {
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    height: 60vh; gap: 16px;
  }
  .spinner {
    width: 36px; height: 36px;
    border: 2px solid var(--border);
    border-top-color: var(--accent);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }
  .audit-loading p { font-size: 13px; color: var(--text2); }

  /* Empty state */
  .empty-state {
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    height: 60vh; gap: 16px; text-align: center;
  }
  .empty-icon {
    width: 64px; height: 64px;
    border-radius: 16px;
    background: var(--bg2);
    border: 1px solid var(--border);
    display: flex; align-items: center; justify-content: center;
    color: var(--text3);
  }
  .empty-state h3 { font-size: 16px; font-weight: 600; color: var(--text); }
  .empty-state p { font-size: 13px; color: var(--text3); max-width: 300px; line-height: 1.6; }

  /* ── CHAT ── */
  .chat-panel { flex: 1; display: flex; flex-direction: column; overflow: hidden; background: var(--bg); }
  .chat-messages { flex: 1; overflow-y: auto; padding: 24px; }
  .chat-inner { max-width: 800px; margin: 0 auto; display: flex; flex-direction: column; gap: 20px; }

  .bubble-row { display: flex; gap: 10px; }
  .bubble-row.user { flex-direction: row-reverse; }

  .avatar {
    width: 30px; height: 30px;
    border-radius: 9px;
    background: linear-gradient(135deg, var(--accent) 0%, #4f46e5 100%);
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
    align-self: flex-end;
    margin-bottom: 2px;
    box-shadow: 0 2px 8px rgba(124,111,247,0.3);
  }

  .bubble {
    max-width: 75%;
    padding: 11px 15px;
    border-radius: 14px;
    font-size: 13.5px;
    line-height: 1.65;
  }
  .bubble.user {
    background: var(--accent);
    color: #fff;
    border-bottom-right-radius: 4px;
  }
  .bubble.assistant {
    background: var(--bg2);
    border: 1px solid var(--border);
    color: var(--text);
    border-bottom-left-radius: 4px;
  }
  .bubble.assistant p { margin: 0 0 8px; }
  .bubble.assistant p:last-child { margin-bottom: 0; }
  .bubble.assistant strong { color: var(--text); font-weight: 600; }
  .bubble.assistant code { font-family: var(--mono); font-size: 12px; background: var(--bg4); padding: 1px 5px; border-radius: 4px; color: var(--accent); }
  .bubble.assistant pre { background: var(--bg); border: 1px solid var(--border); border-radius: 8px; padding: 12px; overflow-x: auto; margin: 8px 0; }
  .bubble.assistant pre code { background: none; padding: 0; }
  .bubble.assistant ul, .bubble.assistant ol { padding-left: 18px; margin: 6px 0; }
  .bubble.assistant li { margin: 3px 0; }

  /* Typing indicator */
  .typing-dots { display: flex; align-items: center; gap: 4px; padding: 4px 2px; }
  .typing-dots span {
    width: 6px; height: 6px;
    border-radius: 50%;
    background: var(--text3);
    animation: dot-bounce 1.2s infinite ease-in-out;
  }
  .typing-dots span:nth-child(2) { animation-delay: 0.2s; }
  .typing-dots span:nth-child(3) { animation-delay: 0.4s; }
  @keyframes dot-bounce { 0%,80%,100% { transform: scale(0.7); opacity: 0.5; } 40% { transform: scale(1); opacity: 1; } }

  /* Chat input */
  .chat-input-area {
    padding: 14px 24px 20px;
    border-top: 1px solid var(--border);
    background: var(--bg1);
    flex-shrink: 0;
  }
  .chat-input-wrap {
    max-width: 800px; margin: 0 auto;
    background: var(--bg2);
    border: 1px solid var(--border2);
    border-radius: 14px;
    padding: 10px 12px 10px 16px;
    display: flex; align-items: flex-end; gap: 10px;
    transition: border-color 0.18s;
  }
  .chat-input-wrap:focus-within { border-color: rgba(124,111,247,0.4); }
  .chat-textarea {
    flex: 1;
    background: transparent;
    border: none;
    outline: none;
    font-family: var(--font);
    font-size: 13.5px;
    color: var(--text);
    resize: none;
    max-height: 120px;
    line-height: 1.5;
  }
  .chat-textarea::placeholder { color: var(--text3); }
  .send-btn {
    width: 32px; height: 32px;
    border-radius: 9px;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
    cursor: pointer;
    border: none;
    transition: all 0.15s;
    align-self: flex-end;
    margin-bottom: 1px;
  }
  .send-btn.on { background: var(--accent); color: #fff; box-shadow: 0 2px 8px rgba(124,111,247,0.35); }
  .send-btn.on:hover { filter: brightness(1.1); }
  .send-btn.on:active { transform: scale(0.95); }
  .send-btn.off { background: var(--bg4); color: var(--text3); cursor: not-allowed; }
  .chat-disclaimer { text-align: center; font-size: 11px; color: var(--text3); margin-top: 8px; }

  @media (max-width: 768px) {
    .sidebar { width: 260px; }
    .stat-grid { grid-template-columns: repeat(2, 1fr); }
    .audit-grid { grid-template-columns: 1fr; }
  }
`;

function ShieldSvg({ size = 16, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2L3 7v5c0 5.25 3.75 10.15 9 11.25C17.25 22.15 21 17.25 21 12V7L12 2z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}

function UploadIcon({ hasFile }) {
  if (hasFile) return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}

function UploadZone({ label, file, onFileChange }) {
  const ref = useRef();
  const [dragging, setDragging] = useState(false);
  return (
    <div
      className={`upload-zone ${file ? "has-file" : ""} ${dragging ? "dragging" : ""}`}
      onClick={() => ref.current.click()}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) onFileChange(f); }}
    >
      <input ref={ref} type="file" accept=".pdf" style={{ display: "none" }} onChange={(e) => onFileChange(e.target.files[0])} />
      <div className="upload-icon"><UploadIcon hasFile={!!file} /></div>
      <div className="upload-meta">
        <div className="ulabel">{label}</div>
        <div className="uname">{file ? file.name : "Drop or click to upload"}</div>
      </div>
    </div>
  );
}

function AuditCard({ result }) {
  const [open, setOpen] = useState(false);
  
  // 1. Defense: If result is null/undefined, don't crash, just render nothing.
  if (!result) return null; 

  const r = rCfg[result?.rating] || rCfg.ERROR;
  return (
    <div className="audit-card" style={{ "--ac": r.dot }} onClick={() => setOpen(!open)}>
      <div className="audit-card-head">
        <div className="audit-card-head-left">
          {/* 2. Defense: Force strings so React doesn't crash if an object slips through */}
          <div className="pillar">{String(result?.pillar || "Unknown Pillar")}</div>
          <div className="citation">{String(result?.citation || "No citation")}</div>
        </div>
        <div className="audit-card-head-right">
          <span className="rating-badge" style={{ background: r.badge.bg, color: r.badge.text }}>{r.label}</span>
          <svg className={`chevron ${open ? "open" : ""}`} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>
      {open && (
        <div className="audit-card-body">
          <div className="field-label">Finding</div>
          <div className="finding-text">{String(result?.finding || "No finding generated.")}</div>
          <div className="remediation-box" style={{ borderColor: r.border, background: `${r.bg}` }}>
            <div className="field-label" style={{ color: r.dot }}>Remediation</div>
            <div className="rtext">{String(result?.remediation || "N/A")}</div>
          </div>
        </div>
      )}
    </div>
  );
}

function SimpleMarkdown({ text }) {
  const html = text
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/^# (.+)$/gm, "<h1>$1</h1>")
    .replace(/^\* (.+)$/gm, "<li>$1</li>")
    .replace(/^- (.+)$/gm, "<li>$1</li>")
    .replace(/(<li>[\s\S]+?<\/li>)/g, "<ul>$1</ul>")
    .replace(/\n\n/g, "</p><p>")
    .replace(/^(?!<[hul])(.+)$/gm, "$1");
  return <div dangerouslySetInnerHTML={{ __html: `<p>${html}</p>` }} />;
}

function Bubble({ msg }) {
  const isUser = msg.role === "user";
  return (
    <div className={`bubble-row ${isUser ? "user" : ""}`}>
      {!isUser && (
        <div className="avatar"><ShieldSvg size={14} color="#fff" /></div>
      )}
      <div className={`bubble ${isUser ? "user" : "assistant"}`}>
        {isUser ? msg.content : <SimpleMarkdown text={msg.content} />}
      </div>
    </div>
  );
}

const fmtSession = (id) => {
  if (!id) return "Awaiting docs";
  if (id === "general_chat") return "General mode";
  const parts = id.split("_");
  return parts[1] ? parts[1].substring(0, 8).toUpperCase() : "Active";
};

export default function AegisAudit() {
  const [lawFile, setLawFile] = useState(null);
  const [policyFile, setPolicyFile] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [report, setReport] = useState(null);
  const [view, setView] = useState("chat");
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditDone, setAuditDone] = useState(false);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hello, I'm Buddy — your AI compliance assistant. Upload your **Target Law** and **Internal Policy** documents, then run a full 8-pillar audit to surface every compliance gap, or ask me anything directly." }
  ]);
  const chatEndRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, isTyping]);

  const adjustTextarea = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg = input;
    setMessages(p => [...p, { role: "user", content: userMsg }, { role: "assistant", content: "" }]);
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    setIsTyping(true);

    try {
      const response = await fetch(`${API_BASE_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sessionId || "general_chat",
          query: userMsg,
          history: messages.map(m => `${m.role}: ${m.content}`)
        }),
      });
      if (!response.ok) throw new Error("Backend error");
      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let done = false;
      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        if (value) {
          const chunk = decoder.decode(value, { stream: true });
          setMessages(prev => {
            const updated = [...prev];
            const last = updated.length - 1;
            updated[last] = { ...updated[last], content: updated[last].content + chunk };
            return updated;
          });
        }
      }
    } catch {
      setMessages(p => [...p, { role: "assistant", content: "⚠️ Network error or stream interrupted. Please check your connection." }]);
    }
    setIsTyping(false);
  };

  const runAudit = async () => {
    if (!lawFile || !policyFile) return;
    setIsAuditing(true);
    setAuditDone(false);
    setView("audit");
    let currentSession = sessionId;
    if (!currentSession) {
      const formData = new FormData();
      formData.append("law_file", lawFile);
      formData.append("policy_file", policyFile);
      try {
        const upRes = await fetch(`${API_BASE_URL}/upload`, { method: "POST", body: formData });
        const upData = await upRes.json();
        if (upRes.ok) { currentSession = upData.session_id; setSessionId(currentSession); }
        else { alert(`Upload failed: ${upData.detail}`); setIsAuditing(false); return; }
      } catch { alert("Failed to connect to backend."); setIsAuditing(false); return; }
    }
    try {
      const audRes = await fetch(`${API_BASE_URL}/audit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: currentSession }),
      });
      const audData = await audRes.json();
      if (audRes.ok) { setReport(audData.report); setAuditDone(true); }
      else alert(`Audit failed: ${audData.detail}`);
    } catch { alert("Audit execution failed."); }
    setIsAuditing(false);
  };

  const handleDestroySession = async () => {
    if (!sessionId) return;
    
    try {
      await fetch(`${API_BASE_URL}/logout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId }),
      });
    } catch (error) { 
      console.error(error); 
    }
    
    // Reset all state variables to clear the UI
    setSessionId(null);
    setReport(null);
    setLawFile(null);
    setPolicyFile(null);
    setAuditDone(false);
    setMessages([{ 
      role: "assistant", 
      content: "Session destroyed. All data has been purged. Upload new documents to start again." 
    }]);
  };

  const handleExportReport = async () => {
    if (!sessionId || !report) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/export`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          session_id: sessionId,
          report_data: report 
        }),
      });

      if (!response.ok) throw new Error("Failed to generate report");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      const a = document.createElement("a");
      a.href = url;
      
      // 🔥 FIX: Clean up the ID and explicitly force .docx
      const cleanId = sessionId.replace("session_", "").substring(0, 6).toUpperCase();
      a.download = `Aegis_Audit_${cleanId}.docx`; 
      
      document.body.appendChild(a);
      a.click();
      
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
    } catch (error) {
      console.error(error);
      alert("Failed to export the report.");
    }
  };

  const stats = report ? [
    { label: "Pillars Analysed", value: report.length, cls: "v" },
    { label: "Critical Issues", value: report.filter(r => r?.rating === "Critical").length, cls: "r" },
    { label: "High Risk", value: report.filter(r => r?.rating === "High").length, cls: "o" },
    { label: "Compliant", value: report.filter(r => r?.rating === "Low").length, cls: "g" },
  ] : [];

  return (
    <>
      <style>{CSS}</style>
      <div className="root">
        {/* SIDEBAR */}
        <aside className={`sidebar ${sidebarOpen ? "" : "collapsed"}`}>
          <div className="sidebar-head">
            <div className="logo-mark"><ShieldSvg size={16} color="#fff" /></div>
            <div className="logo-text">
              <div className="name">Aegis Audit</div>
              <div className="tag">Agentic Compliance RAG</div>
            </div>
          </div>

          <div className="sidebar-body">
            <div className="section-label">Documents</div>
            <UploadZone label="Target Law" file={lawFile} onFileChange={setLawFile} />
            <UploadZone label="Internal Policy" file={policyFile} onFileChange={setPolicyFile} />

            <div className="section-label" style={{ marginTop: 8 }}>Actions</div>
            <button
              className={`btn-run ${lawFile && policyFile && !isAuditing ? "active" : "disabled"}`}
              onClick={runAudit}
              disabled={!lawFile || !policyFile || isAuditing}
            >
              {isAuditing ? (
                <><div className="spinner" style={{ width: 14, height: 14, borderWidth: 2, flexShrink: 0 }} />Analysing…</>
              ) : (
                <><ShieldSvg size={14} color="currentColor" />Run 8-Pillar Audit</>
              )}
            </button>

            {auditDone && (
              <button className="btn-secondary" onClick={handleExportReport}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Export Report
              </button>
            )}

            {sessionId && (
              <button className="btn-danger" onClick={handleDestroySession}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4h6v2" />
                </svg>
                Destroy Instance
              </button>
            )}
          </div>

          <div className="status-footer">
            <div className="section-label" style={{ padding: "0 0 8px" }}>Status</div>
            <div className="status-row">
              <span className="status-key"><span className="status-dot" style={{ background: "#22c55e" }} />Neural Engine</span>
              <span className="status-val">Online</span>
            </div>
            <div className="status-row">
              <span className="status-key"><span className="status-dot" style={{ background: sessionId ? "#22c55e" : "var(--text3)" }} />Data Enclave</span>
              <span className={`status-val ${sessionId ? "active" : ""}`}>{fmtSession(sessionId)}</span>
            </div>
            <div className="status-row">
              <span className="status-key"><span className="status-dot" style={{ background: "#22c55e" }} />Orchestration</span>
              <span className="status-val">Agentic RAG</span>
            </div>
          </div>
        </aside>

        {/* SIDEBAR TOGGLE (when collapsed) */}
        {!sidebarOpen && (
          <button className="sidebar-toggle" onClick={() => setSidebarOpen(true)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M13 5l7 7-7 7M5 5l7 7-7 7" />
            </svg>
          </button>
        )}

        {/* MAIN */}
        <main className="main">
          <header className="main-header">
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              {sidebarOpen && (
                <button
                  onClick={() => setSidebarOpen(false)}
                  style={{ width: 30, height: 30, borderRadius: 8, background: "var(--bg2)", border: "1px solid var(--border)", color: "var(--text3)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 19l-7-7 7-7M19 19l-7-7 7-7" />
                  </svg>
                </button>
              )}
              <div className="main-header-left">
                <h1>{view === "audit" ? "Gap Analysis Report" : "Interactive Terminal"}</h1>
                <p>{view === "audit" ? "Automated 8-Pillar Compliance Review" : "Query your secured documents in real time"}</p>
              </div>
            </div>
            <div className="tab-group">
              {[
                { key: "chat", label: "Terminal", icon: "M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" },
                { key: "audit", label: "Report", icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" },
              ].map(t => (
                <button key={t.key} className={`tab ${view === t.key ? "active" : ""}`} onClick={() => setView(t.key)}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d={t.icon} />
                  </svg>
                  {t.label}
                </button>
              ))}
            </div>
          </header>

          {/* AUDIT PANEL */}
          {view === "audit" && (
            <div className="audit-panel">
              <div className="audit-inner">
                {isAuditing && (
                  <div className="audit-loading">
                    <div className="spinner" />
                    <p>Compiling legal analysis across 8 pillars…</p>
                  </div>
                )}

                {auditDone && report && (
                  <>
                    <div className="stat-grid">
                      {stats.map(s => (
                        <div key={s.label} className={`stat-card ${s.cls}`}>
                          <div className="val">{s.value}</div>
                          <div className="lbl">{s.label}</div>
                        </div>
                      ))}
                    </div>
                    <div className="audit-grid">
                      {report.map((r, i) => <AuditCard key={i} result={r} />)}
                    </div>
                  </>
                )}

                {!isAuditing && !auditDone && (
                  <div className="empty-state">
                    <div className="empty-icon">
                      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                        <line x1="16" y1="13" x2="8" y2="13" />
                        <line x1="16" y1="17" x2="8" y2="17" />
                        <polyline points="10 9 9 9 8 9" />
                      </svg>
                    </div>
                    <h3>Ready for Review</h3>
                    <p>Upload your target law and internal policy in the sidebar, then run the 8-pillar audit to generate a compliance report.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* CHAT PANEL */}
          {view === "chat" && (
            <div className="chat-panel">
              <div className="chat-messages">
                <div className="chat-inner">
                  {messages.map((m, i) => <Bubble key={i} msg={m} />)}
                  {isTyping && (
                    <div className="bubble-row">
                      <div className="avatar"><ShieldSvg size={14} color="#fff" /></div>
                      <div className="bubble assistant">
                        <div className="typing-dots"><span /><span /><span /></div>
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>
              </div>

              <div className="chat-input-area">
                <div className="chat-input-wrap">
                  <textarea
                    ref={textareaRef}
                    className="chat-textarea"
                    value={input}
                    placeholder="Query the enclave…"
                    rows={1}
                    onChange={e => { setInput(e.target.value); adjustTextarea(); }}
                    onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                  />
                  <button className={`send-btn ${input.trim() ? "on" : "off"}`} onClick={handleSend} disabled={!input.trim()}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
                <div className="chat-disclaimer">Aegis Audit uses AI — verify critical findings independently</div>
              </div>
            </div>
          )}
        </main>
      </div>
    </>
  );
}