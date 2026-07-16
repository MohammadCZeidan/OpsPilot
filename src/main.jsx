import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Activity,
  Bot,
  CheckCircle2,
  CircleAlert,
  Database,
  FileText,
  Loader2,
  MessageSquareText,
  RefreshCw,
  Search,
  Send,
  Upload,
  UserCheck,
  XCircle,
} from "lucide-react";
import "./styles.css";

const API_URL = "http://127.0.0.1:8787/api";

function App() {
  const [workspaces, setWorkspaces] = useState([]);
  const [workspace, setWorkspace] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [adminLogs, setAdminLogs] = useState([]);
  const [workspaceName, setWorkspaceName] = useState("My AI Workspace");
  const [documentText, setDocumentText] = useState("");
  const [documentName, setDocumentName] = useState("knowledge.md");
  const [selectedFile, setSelectedFile] = useState(null);
  const [question, setQuestion] = useState("");
  const [ragResult, setRagResult] = useState(null);
  const [apiStatus, setApiStatus] = useState("Checking backend...");
  const [busy, setBusy] = useState(false);
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [token, setToken] = useState(() => window.localStorage.getItem("opspilot_token") || "");
  const [user, setUser] = useState(null);

  const selectedWorkspaceId = workspace?.id || "";
  const activeWorkspace = useMemo(
    () => workspaces.find((item) => item.id === selectedWorkspaceId) || workspace,
    [selectedWorkspaceId, workspace, workspaces]
  );

  useEffect(() => {
    if (token) {
      loadWorkspaces();
    } else {
      setApiStatus("Register or log in to start.");
    }
  }, [token]);

  useEffect(() => {
    if (!selectedWorkspaceId) return;
    refreshWorkspaceData(selectedWorkspaceId);
  }, [selectedWorkspaceId]);

  async function api(path, options) {
    const response = await fetch(`${API_URL}${path}`, options);
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error(payload.error || `Request failed with ${response.status}`);
      error.status = response.status;
      throw error;
    }
    return payload;
  }

  async function loadWorkspaces() {
    try {
      const payload = await api("/workspaces", { headers: authHeaders() });
      setWorkspaces(payload.workspaces);
      if (!workspace && payload.workspaces.length) {
        setWorkspace(payload.workspaces[0]);
      }
      setApiStatus(payload.workspaces.length ? "Backend connected" : "Backend connected. Create a workspace.");
    } catch (error) {
      if (error.message === "Authentication required.") {
        logout();
        return;
      }
      setApiStatus(error.message.includes("fetch") ? "Start backend with npm run server" : error.message);
    }
  }

  function authHeaders(extra = {}) {
    return {
      ...extra,
      Authorization: `Bearer ${token}`,
    };
  }

  async function register() {
    setBusy(true);
    try {
      const payload = await api("/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: authEmail, password: authPassword }),
      });
      setToken(payload.token);
      setUser(payload.user);
      window.localStorage.setItem("opspilot_token", payload.token);
      setApiStatus("Registered and logged in");
    } catch (error) {
      if (error.status === 409) {
        setApiStatus("Account already exists. Logging in...");
        await login();
        return;
      }
      setApiStatus(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function login() {
    setBusy(true);
    try {
      const payload = await api("/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: authEmail, password: authPassword }),
      });
      setToken(payload.token);
      setUser(payload.user);
      window.localStorage.setItem("opspilot_token", payload.token);
      setApiStatus("Logged in");
    } catch (error) {
      setApiStatus(`Upload failed: ${error.message}`);
    } finally {
      setBusy(false);
    }
  }

  function logout() {
    setToken("");
    setUser(null);
    setWorkspace(null);
    setWorkspaces([]);
    setDocuments([]);
    setConversations([]);
    setAdminLogs([]);
    window.localStorage.removeItem("opspilot_token");
    setApiStatus("Logged out");
  }

  if (!token) {
    return (
      <main className="auth-shell">
        <section className="auth-panel">
          <div className="brand-lockup">
            <div className="brand-mark">
              <Bot size={20} />
            </div>
            <div>
              <strong>OpsPilot</strong>
              <span>secure RAG workspace</span>
            </div>
          </div>

          <div className="auth-copy">
            <p className="eyebrow">Sign in first</p>
            <h1>Access your grounded AI workspace.</h1>
            <p>Register or log in before creating workspaces, uploading documents, and asking citation-backed questions.</p>
          </div>

          <div className="auth-form">
            <label>
              Email
              <input value={authEmail} onChange={(event) => setAuthEmail(event.target.value)} placeholder="you@example.com" />
            </label>
            <label>
              Password
              <input
                type="password"
                value={authPassword}
                onChange={(event) => setAuthPassword(event.target.value)}
                placeholder="At least 6 characters"
              />
            </label>
            <div className="auth-actions">
              <button className="secondary-action" onClick={register} disabled={busy}>
                Register
              </button>
              <button className="primary-action" onClick={login} disabled={busy}>
                Login
              </button>
            </div>
            <p className={`status-message ${apiStatus.toLowerCase().includes("failed") || apiStatus.toLowerCase().includes("invalid") ? "error" : ""}`}>
              {apiStatus}
            </p>
          </div>
        </section>
      </main>
    );
  }

  async function refreshWorkspaceData(workspaceId = selectedWorkspaceId) {
    if (!workspaceId) return;
    const [workspacePayload, documentPayload, conversationPayload, logsPayload] = await Promise.all([
      api(`/workspaces/${workspaceId}`, { headers: authHeaders() }),
      api(`/workspaces/${workspaceId}/documents`, { headers: authHeaders() }),
      api(`/workspaces/${workspaceId}/conversations`, { headers: authHeaders() }),
      api(`/workspaces/${workspaceId}/logs`, { headers: authHeaders() }),
    ]);
    setWorkspace(workspacePayload.workspace);
    setDocuments(documentPayload.documents);
    setConversations(conversationPayload.conversations);
    setAdminLogs(logsPayload.logs);
  }

  async function createWorkspace() {
    setBusy(true);
    try {
      const payload = await api("/workspaces", {
        method: "POST",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ name: workspaceName }),
      });
      setWorkspace(payload.workspace);
      setApiStatus("Workspace created");
      await loadWorkspaces();
    } catch (error) {
      setApiStatus(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function ingestCurrentDocument() {
    if (!workspace) return;
    setBusy(true);
    try {
      const request =
        selectedFile
          ? {
              method: "POST",
              headers: authHeaders(),
              body: multipartDocumentBody(selectedFile, documentName),
            }
          : {
              method: "POST",
              headers: authHeaders({ "Content-Type": "application/json" }),
              body: JSON.stringify({
                filename: documentName,
                mimeType: documentName.endsWith(".md") ? "text/markdown" : "text/plain",
                text: documentText,
              }),
            };

      const payload = await api(`/workspaces/${workspace.id}/documents`, request);
      setApiStatus(`Ingested ${payload.document.chunkCount} cited chunk(s)`);
      setDocumentText("");
      setSelectedFile(null);
      await refreshWorkspaceData();
      await loadWorkspaces();
    } catch (error) {
      setApiStatus(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function ingestFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setDocumentName(file.name);
    if (file.type.startsWith("text/") || /\.(txt|md|markdown)$/i.test(file.name)) {
      setDocumentText(await file.text());
    } else {
      setDocumentText(`Selected binary document: ${file.name}. Click Ingest document to parse it on the backend.`);
    }
    event.target.value = "";
  }

  function multipartDocumentBody(file, filename) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("filename", filename);
    formData.append("mimeType", file.type || inferMimeType(filename));
    return formData;
  }

  function inferMimeType(filename) {
    if (/\.pdf$/i.test(filename)) return "application/pdf";
    if (/\.docx$/i.test(filename)) return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    if (/\.(md|markdown)$/i.test(filename)) return "text/markdown";
    return "text/plain";
  }

  async function askRagQuestion() {
    if (!workspace) return;
    setBusy(true);
    try {
      const payload = await api(`/workspaces/${workspace.id}/query`, {
        method: "POST",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ question }),
      });
      setRagResult(payload);
      setApiStatus("Grounded answer generated");
      await refreshWorkspaceData();
      await loadWorkspaces();
    } catch (error) {
      setApiStatus(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function sendFeedback(rating) {
    if (!workspace || !ragResult) return;
    try {
      await api(`/workspaces/${workspace.id}/feedback`, {
        method: "POST",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ queryId: ragResult.id, rating }),
      });
      setApiStatus(`Feedback saved: ${rating.replace("_", " ")}`);
      await refreshWorkspaceData();
      await loadWorkspaces();
    } catch (error) {
      setApiStatus(error.message);
    }
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
            <span>backend-backed RAG system</span>
          </div>
        </div>

        <nav className="nav-list" aria-label="Main navigation">
          <button className="nav-item active">
            <Database size={17} /> Workspaces
          </button>
          <button className="nav-item">
            <FileText size={17} /> Documents
          </button>
          <button className="nav-item">
            <MessageSquareText size={17} /> Answers
          </button>
        </nav>

        <section className="sidebar-panel">
          <span className="panel-label">Backend status</span>
          <strong>{apiStatus}</strong>
          <p>Logged in as {user?.email || authEmail || "token user"}. JWT is stored locally for this browser session.</p>
        </section>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">AI command center</p>
            <h1>Build a real workspace, ingest documents, ask grounded questions.</h1>
          </div>
          <button className="primary-action" onClick={() => refreshWorkspaceData()} disabled={!workspace}>
            <RefreshCw size={18} />
            Refresh
          </button>
        </header>

        <div className={`status-banner ${apiStatus.toLowerCase().includes("failed") || apiStatus.toLowerCase().includes("error") ? "error" : ""}`}>
          {apiStatus}
        </div>

        <section className="control-strip" aria-label="Workspace controls">
          <label>
            Active workspace
            <div className="select-shell">
              <select
                value={selectedWorkspaceId}
                onChange={(event) => setWorkspace(workspaces.find((item) => item.id === event.target.value))}
              >
                <option value="">Choose a workspace</option>
                {workspaces.map((item) => (
                  <option value={item.id} key={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>
          </label>
          <label>
            New workspace
            <input value={workspaceName} onChange={(event) => setWorkspaceName(event.target.value)} />
          </label>
          <label>
            Session
            <button className="icon-action logout-action" onClick={logout}>
              Logout
            </button>
          </label>
        </section>

        <section className="grid-layout">
          <article className="rag-console">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Workspace</p>
                <h2>{activeWorkspace?.name || "No workspace yet"}</h2>
              </div>
              <button className="secondary-action" onClick={createWorkspace} disabled={busy}>
                <UserCheck size={17} /> Create workspace
              </button>
            </div>

            <div className="metric-grid">
              <Metric label="Documents" value={activeWorkspace?.documentCount || 0} />
              <Metric label="Chunks" value={activeWorkspace?.chunkCount || 0} />
              <Metric label="Conversations" value={activeWorkspace?.conversationCount || 0} />
              <Metric label="Feedback" value={activeWorkspace?.feedbackCount || 0} />
            </div>
          </article>

          <article className="rag-console">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Document ingestion</p>
                <h2>Upload TXT, Markdown, PDF, or DOCX</h2>
              </div>
              <label className="upload-action">
                <Upload size={17} />
                Choose file
                <input
                  type="file"
                  accept=".txt,.md,.markdown,.pdf,.docx,text/plain,text/markdown,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  onChange={ingestFile}
                />
              </label>
            </div>

            <div className="rag-grid">
              <label>
                Document name
                <input value={documentName} onChange={(event) => setDocumentName(event.target.value)} />
              </label>
              <button className="secondary-action" onClick={ingestCurrentDocument} disabled={!workspace || busy}>
                <FileText size={17} /> Ingest document
              </button>
              <label className="wide-field">
                Document text
                <textarea
                  value={documentText}
                  onChange={(event) => setDocumentText(event.target.value)}
                  placeholder="Paste source text here, or choose a .txt/.md/.pdf/.docx file."
                />
              </label>
            </div>
          </article>

          <article className="source-viewer">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Stored documents</p>
                <h2>Backend inventory</h2>
              </div>
            </div>
            {documents.length ? (
              documents.map((document) => (
                <div className="citation-card" key={document.id}>
                  <strong>{document.filename}</strong>
                  <p>{document.chunkCount} chunk(s) stored from {document.mimeType}</p>
                </div>
              ))
            ) : (
              <p className="muted-copy">No documents ingested yet.</p>
            )}
          </article>

          <article className="logs-panel">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Admin logs</p>
                <h2>Latency, cost, model calls</h2>
              </div>
              <button className="icon-action" onClick={() => refreshWorkspaceData()} disabled={!workspace} aria-label="Refresh logs">
                <Activity size={17} />
              </button>
            </div>
            <div className="log-list">
              {adminLogs.slice(0, 6).map((log) => (
                <div className="log-row" key={log.id}>
                  <span>{log.event}</span>
                  <span>{log.model || log.filename || log.rating}</span>
                  <strong>{log.latencyMs ?? 0} ms</strong>
                  <span>${log.estimatedCostUsd ?? 0}</span>
                </div>
              ))}
            </div>
          </article>

          <article className="draft-panel">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Grounded Q&A</p>
                <h2>Ask the indexed workspace</h2>
              </div>
              {busy && <Loader2 className="spin" size={20} />}
            </div>
            <div className="ask-row">
              <input
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                placeholder="Ask a question about your ingested documents"
              />
              <button className="primary-action" onClick={askRagQuestion} disabled={!workspace || !question.trim() || busy}>
                <Search size={18} /> Ask
              </button>
            </div>

            {ragResult && (
              <div className="rag-answer">
                <h3>Answer</h3>
                <p>{ragResult.answer}</p>
                <div className="feedback-actions" aria-label="Answer feedback">
                  <button onClick={() => sendFeedback("correct")}>
                    <CheckCircle2 size={16} /> Correct
                  </button>
                  <button onClick={() => sendFeedback("wrong")}>
                    <XCircle size={16} /> Wrong
                  </button>
                  <button onClick={() => sendFeedback("missing_context")}>
                    <CircleAlert size={16} /> Missing context
                  </button>
                </div>
              </div>
            )}
          </article>

          <article className="lead-table">
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

          <article className="lead-table">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Conversation memory</p>
                <h2>Saved backend queries</h2>
              </div>
            </div>
            <div className="table">
              {conversations.length ? (
                conversations.map((conversation) => (
                  <button className="table-row" onClick={() => setRagResult(conversation)} key={conversation.id}>
                    <span>{conversation.question}</span>
                    <span>{conversation.citations.length} citation(s)</span>
                    <span>{new Date(conversation.createdAt).toLocaleString()}</span>
                    <Send size={16} />
                  </button>
                ))
              ) : (
                <p className="muted-copy">No questions asked yet.</p>
              )}
            </div>
          </article>
        </section>
      </section>
    </main>
  );
}

function Metric({ label, value }) {
  return (
    <div className="metric-tile">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);
