import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Activity,
  ArrowRight,
  Bot,
  Check,
  ChevronDown,
  CircleAlert,
  ClipboardCheck,
  ExternalLink,
  FileText,
  Globe2,
  Loader2,
  Mail,
  Play,
  Search,
  Send,
  Sparkles,
  Target,
  UserCheck,
} from "lucide-react";
import "./styles.css";

const API_URL = "http://127.0.0.1:8787/api";

const seedCompanies = [
  {
    name: "Northstar Clinics",
    url: "https://northstar.example",
    market: "multi-location healthcare operations",
    signal: "hiring care coordinators while support tickets rise",
    status: "Ready",
    fit: 91,
  },
  {
    name: "Harbor FreightOps",
    url: "https://harborops.example",
    market: "logistics and route planning",
    signal: "recent warehouse expansion and manual dispatch workflows",
    status: "Needs approval",
    fit: 84,
  },
  {
    name: "LedgerLeaf",
    url: "https://ledgerleaf.example",
    market: "bookkeeping for small businesses",
    signal: "publishing AI assistant roles and onboarding content",
    status: "Drafting",
    fit: 78,
  },
];

const pipelineSteps = [
  { title: "Company map", icon: Globe2, state: "complete" },
  { title: "Buyer personas", icon: UserCheck, state: "complete" },
  { title: "Pain signals", icon: Search, state: "active" },
  { title: "Outreach draft", icon: Mail, state: "queued" },
  { title: "Human review", icon: ClipboardCheck, state: "queued" },
];

const sourceNotes = [
  "Care team page mentions 24/7 scheduling load and fragmented intake forms.",
  "Job post asks for automation around insurance eligibility and document routing.",
  "Founder interview says speed-to-first-response is a board-level metric.",
];

function App() {
  const [targetUrl, setTargetUrl] = useState("https://northstar.example");
  const [persona, setPersona] = useState("VP Operations");
  const [tone, setTone] = useState("Direct");
  const [running, setRunning] = useState(false);
  const [approved, setApproved] = useState(false);
  const [workspace, setWorkspace] = useState(null);
  const [workspaceName, setWorkspaceName] = useState("OpsPilot Demo");
  const [documentText, setDocumentText] = useState(
    "Refund requests are delayed because support agents manually inspect invoices before approval.\n\nThe operations team wants cited answers, source highlights, and feedback tracking."
  );
  const [documentName, setDocumentName] = useState("ops-runbook.md");
  const [question, setQuestion] = useState("Why are refund requests delayed?");
  const [ragResult, setRagResult] = useState(null);
  const [adminLogs, setAdminLogs] = useState([]);
  const [apiStatus, setApiStatus] = useState("Starting workspace...");
  const [asking, setAsking] = useState(false);

  const selectedCompany = useMemo(
    () => seedCompanies.find((company) => company.url === targetUrl) ?? seedCompanies[0],
    [targetUrl]
  );

  function runAgent() {
    setRunning(true);
    window.setTimeout(() => setRunning(false), 1200);
  }

  useEffect(() => {
    createDemoWorkspace();
  }, []);

  async function createDemoWorkspace() {
    try {
      const response = await fetch(`${API_URL}/workspaces`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: workspaceName, email: "demo@opspilot.local" }),
      });
      const payload = await response.json();
      setWorkspace(payload.workspace);
      setApiStatus("Workspace ready");
    } catch {
      setApiStatus("Start the backend with npm run server");
    }
  }

  async function refreshLogs(workspaceId = workspace?.id) {
    if (!workspaceId) return;
    const response = await fetch(`${API_URL}/workspaces/${workspaceId}/logs`);
    const payload = await response.json();
    setAdminLogs(payload.logs);
  }

  async function ingestCurrentDocument() {
    if (!workspace) return;
    setApiStatus("Ingesting document...");
    const response = await fetch(`${API_URL}/workspaces/${workspace.id}/documents`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        filename: documentName,
        mimeType: documentName.endsWith(".md") ? "text/markdown" : "text/plain",
        text: documentText,
      }),
    });
    const payload = await response.json();
    setApiStatus(`Ingested ${payload.document.chunkCount} cited chunk(s)`);
    await refreshLogs();
  }

  async function askRagQuestion() {
    if (!workspace) return;
    setAsking(true);
    const response = await fetch(`${API_URL}/workspaces/${workspace.id}/query`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question }),
    });
    const payload = await response.json();
    setRagResult(payload);
    setAsking(false);
    await refreshLogs();
  }

  async function sendFeedback(rating) {
    if (!workspace || !ragResult) return;
    await fetch(`${API_URL}/workspaces/${workspace.id}/feedback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ queryId: ragResult.id, rating }),
    });
    setApiStatus(`Feedback saved: ${rating.replace("_", " ")}`);
    await refreshLogs();
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand-lockup">
          <div className="brand-mark">
            <Bot size={20} />
          </div>
          <div>
            <strong>OpsPilot</strong>
            <span>agentic sales research</span>
          </div>
        </div>

        <nav className="nav-list" aria-label="Main navigation">
          <button className="nav-item active">
            <Activity size={17} /> Workspace
          </button>
          <button className="nav-item">
            <Target size={17} /> Leads
          </button>
          <button className="nav-item">
            <FileText size={17} /> Playbooks
          </button>
        </nav>

        <section className="sidebar-panel">
          <span className="panel-label">Today</span>
          <strong>12 leads researched</strong>
          <p>5 drafts waiting for human approval before outreach.</p>
        </section>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">AI agent command center</p>
            <h1>Turn target accounts into sourced outreach plans.</h1>
          </div>
          <button className="primary-action" onClick={runAgent}>
            {running ? <Loader2 className="spin" size={18} /> : <Play size={18} />}
            Run agent
          </button>
        </header>

        <section className="control-strip" aria-label="Research controls">
          <label>
            Company
            <div className="select-shell">
              <select value={targetUrl} onChange={(event) => setTargetUrl(event.target.value)}>
                {seedCompanies.map((company) => (
                  <option value={company.url} key={company.url}>
                    {company.name}
                  </option>
                ))}
              </select>
              <ChevronDown size={16} />
            </div>
          </label>
          <label>
            Persona
            <input value={persona} onChange={(event) => setPersona(event.target.value)} />
          </label>
          <label>
            Tone
            <div className="segmented">
              {["Direct", "Warm", "Technical"].map((option) => (
                <button
                  className={tone === option ? "selected" : ""}
                  onClick={() => setTone(option)}
                  key={option}
                >
                  {option}
                </button>
              ))}
            </div>
          </label>
        </section>

        <section className="grid-layout">
          <article className="rag-console">
            <div className="section-heading">
              <div>
                <p className="eyebrow">RAG workspace</p>
                <h2>Grounded answer engine</h2>
              </div>
              <span className="status-pill">{apiStatus}</span>
            </div>

            <div className="rag-grid">
              <label>
                Workspace
                <input value={workspaceName} onChange={(event) => setWorkspaceName(event.target.value)} />
              </label>
              <button className="secondary-action" onClick={createDemoWorkspace}>
                <UserCheck size={17} /> Create workspace
              </button>
              <label>
                Document name
                <input value={documentName} onChange={(event) => setDocumentName(event.target.value)} />
              </label>
              <label className="wide-field">
                Document text
                <textarea value={documentText} onChange={(event) => setDocumentText(event.target.value)} />
              </label>
              <button className="secondary-action" onClick={ingestCurrentDocument} disabled={!workspace}>
                <FileText size={17} /> Ingest document
              </button>
              <label className="wide-field">
                Ask a question
                <input value={question} onChange={(event) => setQuestion(event.target.value)} />
              </label>
              <button className="primary-action" onClick={askRagQuestion} disabled={!workspace || asking}>
                {asking ? <Loader2 className="spin" size={18} /> : <Search size={18} />}
                Ask RAG
              </button>
            </div>

            {ragResult && (
              <div className="rag-answer">
                <h3>Answer</h3>
                <p>{ragResult.answer}</p>
                <div className="feedback-actions" aria-label="Answer feedback">
                  <button onClick={() => sendFeedback("correct")}>Correct</button>
                  <button onClick={() => sendFeedback("wrong")}>Wrong</button>
                  <button onClick={() => sendFeedback("missing_context")}>Missing context</button>
                </div>
              </div>
            )}
          </article>

          <article className="source-viewer">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Source viewer</p>
                <h2>Highlighted evidence</h2>
              </div>
            </div>
            {ragResult?.citations?.length ? (
              ragResult.citations.map((citation) => (
                <div className="citation-card" key={citation.chunkId}>
                  <strong>{citation.citation}</strong>
                  <p dangerouslySetInnerHTML={{ __html: citation.highlight }} />
                </div>
              ))
            ) : (
              <p className="muted-copy">Ask a question after ingesting a document to see cited evidence.</p>
            )}
          </article>

          <article className="logs-panel">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Admin logs</p>
                <h2>Latency, cost, model calls</h2>
              </div>
              <button className="icon-action" onClick={() => refreshLogs()} aria-label="Refresh logs">
                <Activity size={17} />
              </button>
            </div>
            <div className="log-list">
              {adminLogs.slice(0, 5).map((log) => (
                <div className="log-row" key={log.id}>
                  <span>{log.event}</span>
                  <span>{log.model || log.filename || log.rating}</span>
                  <strong>{log.latencyMs ?? 0} ms</strong>
                  <span>${log.estimatedCostUsd ?? 0}</span>
                </div>
              ))}
            </div>
          </article>

          <article className="agent-map">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Run state</p>
                <h2>{selectedCompany.name}</h2>
              </div>
              <a href={selectedCompany.url} target="_blank" rel="noreferrer">
                <ExternalLink size={16} /> Source
              </a>
            </div>

            <div className="signal-tape" aria-label="Agent pipeline">
              {pipelineSteps.map((step, index) => {
                const Icon = step.icon;
                return (
                  <div className={`pipeline-node ${step.state}`} key={step.title}>
                    <div className="node-icon">
                      <Icon size={18} />
                    </div>
                    <span>{step.title}</span>
                    {index < pipelineSteps.length - 1 && <ArrowRight size={16} />}
                  </div>
                );
              })}
            </div>

            <div className="evidence-board">
              <h3>Evidence collected</h3>
              {sourceNotes.map((note) => (
                <div className="evidence-item" key={note}>
                  <Check size={16} />
                  <p>{note}</p>
                </div>
              ))}
            </div>
          </article>

          <article className="insight-panel">
            <p className="eyebrow">Account fit</p>
            <div className="score-row">
              <strong>{selectedCompany.fit}</strong>
              <span>/100</span>
            </div>
            <p>{selectedCompany.market}</p>
            <div className="warning-box">
              <CircleAlert size={17} />
              <span>{selectedCompany.signal}</span>
            </div>
          </article>

          <article className="draft-panel">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Generated draft</p>
                <h2>Message for {persona || "the buyer"}</h2>
              </div>
              <Sparkles size={20} />
            </div>
            <div className="message-preview">
              <p>Subject: Reducing intake drag at {selectedCompany.name}</p>
              <p>Hi, I noticed your team is expanding while intake and scheduling complexity are rising.</p>
              <p>
                OpsPilot found three signals that point to a practical automation opportunity: eligibility checks,
                document routing, and faster first response. I built RAG and agent workflows that turn scattered
                operational docs into auditable next actions.
              </p>
              <p>Worth a 15-minute look at where the bottleneck is hiding?</p>
            </div>
            <div className="approval-row">
              <label className="check-row">
                <input type="checkbox" checked={approved} onChange={(event) => setApproved(event.target.checked)} />
                Approve before sending
              </label>
              <button className="send-action" disabled={!approved}>
                <Send size={17} /> Queue outreach
              </button>
            </div>
          </article>

          <article className="lead-table">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Lead queue</p>
                <h2>Research targets</h2>
              </div>
            </div>
            <div className="table">
              {seedCompanies.map((company) => (
                <button className="table-row" onClick={() => setTargetUrl(company.url)} key={company.url}>
                  <span>{company.name}</span>
                  <span>{company.market}</span>
                  <span>{company.status}</span>
                  <strong>{company.fit}</strong>
                </button>
              ))}
            </div>
          </article>
        </section>
      </section>
    </main>
  );
}

createRoot(document.getElementById("root")).render(<App />);
