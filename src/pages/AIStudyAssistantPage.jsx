import { useState, useRef, useEffect } from "react";

// ─── OpenRouter REST API caller & Fallback Configuration ──────────────────────
const FREE_MODELS = [
  "deepseek/deepseek-r1:free",
  "qwen/qwen-2.5-72b-instruct:free",
  "google/gemini-2.0-flash-exp:free",
  "meta-llama/llama-3.1-8b-instruct:free",
  "google/gemma-4-31b-it:free",
  "google/gemma-4-26b-a4b-it:free",
  "inclusionai/ling-3.0-flash:free",
  "nvidia/nemotron-3-nano-30b-a3b:free",
  "openrouter/free",
];

const MODEL_DISPLAY_NAMES = {
  "deepseek/deepseek-r1:free": "DeepSeek R1",
  "qwen/qwen-2.5-72b-instruct:free": "Qwen 2.5 72B",
  "google/gemini-2.0-flash-exp:free": "Gemini 2.0 Flash",
  "meta-llama/llama-3.1-8b-instruct:free": "Llama 3.1 8B",
  "google/gemma-4-31b-it:free": "Gemma 4 31B",
  "google/gemma-4-26b-a4b-it:free": "Gemma 4 26B",
  "inclusionai/ling-3.0-flash:free": "Ling 3.0 Flash",
  "nvidia/nemotron-3-nano-30b-a3b:free": "Nemotron 3 Nano",
  "openrouter/free": "Auto Free Model",
};

function getModelDisplayName(slug) {
  if (!slug) return "Auto Free Model";
  if (MODEL_DISPLAY_NAMES[slug]) return MODEL_DISPLAY_NAMES[slug];
  const namePart = slug.split("/").pop().replace(":free", "");
  return namePart.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

const SYSTEM_INSTRUCTION = `You are an academic tutor helping university students.
Provide accurate, educational, and easy-to-understand answers.

If the question is programming:
- explain the concept
- include code examples when appropriate

If the question is mathematics:
- solve it step by step

If the question is science:
- explain clearly with examples

Keep answers concise, helpful, and suitable for university students.`;

async function callOpenRouter(question, history = []) {
  const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;

  if (!apiKey) {
    throw new Error("OpenRouter API key is not configured. Please set VITE_OPENROUTER_API_KEY in your .env file.");
  }

  const messages = [
    { role: "system", content: SYSTEM_INSTRUCTION },
  ];

  for (const turn of history) {
    messages.push({
      role: turn.role === "user" ? "user" : "assistant",
      content: turn.text || turn.content || "",
    });
  }

  messages.push({
    role: "user",
    content: question.trim(),
  });

  const url = "https://openrouter.ai/api/v1/chat/completions";
  let lastError = null;

  for (const model of FREE_MODELS) {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errMsg = data?.error?.message || `OpenRouter API error (status ${response.status})`;
        lastError = new Error(errMsg);
        console.warn(`OpenRouter model ${model} failed: ${errMsg}`);
        continue;
      }

      const text = data?.choices?.[0]?.message?.content;

      if (!text) {
        lastError = new Error(`No response generated from ${model}.`);
        continue;
      }

      return { text, modelUsed: model };
    } catch (err) {
      lastError = err;
      console.warn(`Fetch error for model ${model}:`, err);
    }
  }

  throw lastError || new Error("Failed to generate response. All free OpenRouter models are currently unavailable.");
}

// ─── Simple Markdown Renderer ─────────────────────────────────────────────────
function MarkdownRenderer({ text }) {
  if (!text) return null;

  const inlineRender = (str) => {
    if (!str) return null;
    const parts = [];
    const regex = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g;
    let lastIndex = 0;
    let match;
    let key = 0;

    while ((match = regex.exec(str)) !== null) {
      if (match.index > lastIndex) parts.push(str.slice(lastIndex, match.index));
      const token = match[0];
      if (token.startsWith("**") && token.endsWith("**")) {
        parts.push(<strong key={key++}>{token.slice(2, -2)}</strong>);
      } else if (token.startsWith("*") && token.endsWith("*")) {
        parts.push(<em key={key++}>{token.slice(1, -1)}</em>);
      } else if (token.startsWith("`") && token.endsWith("`")) {
        parts.push(<code key={key++} className="ai-inline-code">{token.slice(1, -1)}</code>);
      }
      lastIndex = regex.lastIndex;
    }
    if (lastIndex < str.length) parts.push(str.slice(lastIndex));
    return parts;
  };

  const renderMarkdown = (raw) => {
    const lines = raw.split("\n");
    const elements = [];
    let i = 0;

    while (i < lines.length) {
      const line = lines[i];

      // Fenced code block
      if (line.trimStart().startsWith("```")) {
        const lang = line.replace(/```/, "").trim() || "code";
        const codeLines = [];
        i++;
        while (i < lines.length && !lines[i].trimStart().startsWith("```")) {
          codeLines.push(lines[i]);
          i++;
        }
        const codeText = codeLines.join("\n");
        elements.push(
          <div key={`code-${i}`} className="ai-code-block">
            <div className="ai-code-block-header">
              <span className="ai-code-lang">{lang}</span>
              <button className="ai-copy-btn" onClick={() => navigator.clipboard.writeText(codeText)} title="Copy code">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
                Copy
              </button>
            </div>
            <pre className="ai-code-pre"><code>{codeText}</code></pre>
          </div>
        );
        i++;
        continue;
      }

      // Headings
      if (/^#{1,3}\s/.test(line)) {
        const level = line.match(/^(#+)/)[1].length;
        const content = line.replace(/^#+\s/, "");
        const Tag = level === 1 ? "h3" : level === 2 ? "h4" : "h5";
        elements.push(<Tag key={`h-${i}`} className={`ai-md-h${level}`}>{inlineRender(content)}</Tag>);
        i++; continue;
      }

      // Unordered list
      if (/^[-*+]\s/.test(line.trimStart())) {
        const items = [];
        while (i < lines.length && /^[-*+]\s/.test(lines[i].trimStart())) {
          items.push(<li key={i}>{inlineRender(lines[i].replace(/^[-*+]\s/, "").trim())}</li>);
          i++;
        }
        elements.push(<ul key={`ul-${i}`} className="ai-md-ul">{items}</ul>);
        continue;
      }

      // Ordered list
      if (/^\d+\.\s/.test(line.trimStart())) {
        const items = [];
        while (i < lines.length && /^\d+\.\s/.test(lines[i].trimStart())) {
          items.push(<li key={i}>{inlineRender(lines[i].replace(/^\d+\.\s/, "").trim())}</li>);
          i++;
        }
        elements.push(<ol key={`ol-${i}`} className="ai-md-ol">{items}</ol>);
        continue;
      }

      // HR
      if (/^---+$/.test(line.trim())) {
        elements.push(<hr key={`hr-${i}`} className="ai-md-hr" />);
        i++; continue;
      }

      // Empty line
      if (line.trim() === "") { i++; continue; }

      // Paragraph
      elements.push(<p key={`p-${i}`} className="ai-md-p">{inlineRender(line)}</p>);
      i++;
    }

    return elements;
  };

  return <div className="ai-md-body">{renderMarkdown(text)}</div>;
}

// ─── Thinking Indicator ───────────────────────────────────────────────────────
function ThinkingIndicator() {
  return (
    <div className="ai-message ai-message-bot">
      <div className="ai-avatar ai-avatar-bot">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" /><path d="M12 8v4l3 3" />
        </svg>
      </div>
      <div className="ai-bubble ai-bubble-bot ai-thinking-bubble">
        <span className="ai-thinking-text">Thinking</span>
        <span className="ai-dot" /><span className="ai-dot" /><span className="ai-dot" />
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AIStudyAssistantPage({ user }) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeModel, setActiveModel] = useState(FREE_MODELS[0]);
  const chatEndRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 200) + "px";
  }, [input]);

  const handleSubmit = async (e) => {
    e?.preventDefault();
    const question = input.trim();
    if (!question || loading) return;

    const newMessages = [...messages, { role: "user", text: question }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    // Pass last 10 turns as context
    const history = messages.slice(-10).map((m) => ({
      role: m.role === "user" ? "user" : "assistant",
      text: m.text,
    }));

    try {
      const { text: answer, modelUsed } = await callOpenRouter(question, history);
      if (modelUsed) {
        setActiveModel(modelUsed);
      }
      setMessages((prev) => [...prev, { role: "ai", text: answer }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "ai", text: err.message || "Failed to get a response. Please try again.", error: true },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const clearConversation = () => { setMessages([]); setInput(""); };

  const handleRetry = () => {
    const lastUser = [...messages].reverse().find((m) => m.role === "user");
    if (lastUser) {
      setMessages((prev) => prev.slice(0, -1));
      setInput(lastUser.text);
    }
  };

  const suggestions = [
    "Explain how photosynthesis works",
    "Solve: ∫ x² dx from 0 to 3",
    "What is Big O notation in algorithms?",
    "Explain Newton's second law with an example",
  ];

  const isEmptyState = messages.length === 0 && !loading;

  return (
    <div className="page ai-page">
      {/* Header */}
      <div className="ai-page-header">
        <div className="container">
          <div className="ai-header-content">
            <div className="ai-header-icon">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <div className="ai-header-text">
              <h1 className="ai-page-title">AI Study Assistant</h1>
              <p className="ai-page-desc">Powered by OpenRouter ({getModelDisplayName(activeModel)}) · Ask maths, science, programming &amp; more</p>
            </div>
            {messages.length > 0 && (
              <button onClick={clearConversation} className="ai-clear-btn">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M9 6V4h6v2" />
                </svg>
                New Chat
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="container ai-container">
        {/* Chat Window */}
        <div className="ai-chat-window">
          {isEmptyState && (
            <div className="ai-empty-state">
              <div className="ai-empty-icon">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2z" />
                  <path d="M12 8v4" /><path d="M12 16h.01" />
                </svg>
              </div>
              <h2 className="ai-empty-title">What would you like to learn today?</h2>
              <p className="ai-empty-desc">Ask me any academic question — I am here to help!</p>
              <div className="ai-suggestions">
                {suggestions.map((s) => (
                  <button key={s} className="ai-suggestion-chip"
                    onClick={() => { setInput(s); textareaRef.current?.focus(); }}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="ai-messages">
            {messages.map((msg, idx) => (
              <div key={idx} className={`ai-message ${msg.role === "user" ? "ai-message-user" : "ai-message-bot"}`}>
                {msg.role === "ai" && (
                  <div className={`ai-avatar ${msg.error ? "ai-avatar-error" : "ai-avatar-bot"}`}>
                    {msg.error
                      ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                      : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 8v4l3 3" /></svg>
                    }
                  </div>
                )}
                <div className={`ai-bubble ${msg.role === "user" ? "ai-bubble-user" : msg.error ? "ai-bubble-error" : "ai-bubble-bot"}`}>
                  {msg.role === "user" ? (
                    <p className="ai-user-text">{msg.text}</p>
                  ) : msg.error ? (
                    <div className="ai-error-content">
                      <p style={{ margin: 0 }}>{msg.text}</p>
                      <button className="ai-retry-btn" onClick={handleRetry}>↩ Retry</button>
                    </div>
                  ) : (
                    <MarkdownRenderer text={msg.text} />
                  )}
                </div>
                {msg.role === "user" && (
                  <div className="ai-avatar ai-avatar-user">
                    {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
                  </div>
                )}
              </div>
            ))}
            {loading && <ThinkingIndicator />}
            <div ref={chatEndRef} />
          </div>
        </div>

        {/* Input */}
        <form className="ai-input-form" onSubmit={handleSubmit}>
          <div className={`ai-input-wrapper${loading ? " ai-input-wrapper--loading" : ""}`}>
            <textarea
              ref={textareaRef}
              className="ai-textarea"
              placeholder="Ask any academic question… (Enter to send, Shift+Enter for new line)"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
              rows={1}
              maxLength={4000}
              aria-label="Ask a question"
            />
            <div className="ai-input-actions">
              {input.length > 100 && <span className="ai-char-count">{input.length}/4000</span>}
              <button
                type="submit"
                className={`ai-send-btn${loading || !input.trim() ? " ai-send-btn--disabled" : " ai-send-btn--active"}`}
                disabled={loading || !input.trim()}
                aria-label="Send question"
              >
                {loading
                  ? <svg className="ai-spinner" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" /></svg>
                  : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
                }
              </button>
            </div>
          </div>
          <p className="ai-input-hint">
            {loading ? "⏳ Thinking… please wait" : "Press Enter to send · Shift+Enter for a new line"}
          </p>
        </form>

        <p className="ai-disclaimer">
          AI responses may contain errors. Always verify important information with your course materials or instructor.
        </p>
      </div>

      <style>{`
        .ai-page { padding-bottom: 0; min-height: calc(100vh - 72px); display: flex; flex-direction: column; }
        .ai-container { flex: 1; display: flex; flex-direction: column; padding-bottom: 32px; max-width: 860px; }
        .ai-page-header { background: linear-gradient(135deg,#4F46E5 0%,#7C3AED 50%,#06B6D4 100%); padding: 32px 0 24px; }
        .ai-header-content { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; }
        .ai-header-icon { width: 50px; height: 50px; border-radius: 14px; background: rgba(255,255,255,0.18); display: flex; align-items: center; justify-content: center; color: white; flex-shrink: 0; border: 1px solid rgba(255,255,255,0.3); }
        .ai-header-text { flex: 1; min-width: 0; }
        .ai-page-title { font-size: 24px; font-weight: 800; color: white; margin: 0; letter-spacing: -0.4px; }
        .ai-page-desc { color: rgba(255,255,255,0.8); font-size: 13.5px; margin: 3px 0 0; }
        .ai-clear-btn { margin-left: auto; display: flex; align-items: center; gap: 6px; background: rgba(255,255,255,0.15); border: 1px solid rgba(255,255,255,0.3); color: white; border-radius: 8px; padding: 7px 14px; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.2s; white-space: nowrap; }
        .ai-clear-btn:hover { background: rgba(255,255,255,0.25); }
        .ai-chat-window { background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-lg); margin-top: 20px; box-shadow: var(--shadow-md); min-height: 380px; max-height: 540px; overflow-y: auto; display: flex; flex-direction: column; }
        .ai-empty-state { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 44px 24px; text-align: center; }
        .ai-empty-icon { width: 76px; height: 76px; border-radius: 50%; background: var(--primary-light); color: var(--primary); display: flex; align-items: center; justify-content: center; margin-bottom: 18px; animation: ai-float 3s ease-in-out infinite; }
        @keyframes ai-float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        .ai-empty-title { font-size: 19px; font-weight: 700; color: var(--text-primary); margin: 0 0 8px; }
        .ai-empty-desc { color: var(--text-muted); font-size: 14px; margin: 0 0 22px; }
        .ai-suggestions { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; max-width: 580px; }
        .ai-suggestion-chip { background: var(--primary-light); color: var(--primary); border: 1px solid #C7D2FE; border-radius: 99px; padding: 7px 15px; font-size: 13px; font-weight: 500; cursor: pointer; transition: all 0.2s; }
        .ai-suggestion-chip:hover { background: var(--primary); color: white; transform: translateY(-1px); }
        .ai-messages { padding: 18px; display: flex; flex-direction: column; gap: 16px; }
        .ai-message { display: flex; gap: 10px; align-items: flex-start; animation: ai-slide-in 0.22s ease; }
        @keyframes ai-slide-in { from{opacity:0;transform:translateY(7px)} to{opacity:1;transform:translateY(0)} }
        .ai-message-user { flex-direction: row-reverse; }
        .ai-avatar { width: 32px; height: 32px; border-radius: 50%; flex-shrink: 0; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 13px; }
        .ai-avatar-bot { background: linear-gradient(135deg,#4F46E5,#06B6D4); color: white; box-shadow: 0 2px 8px rgba(79,70,229,0.3); }
        .ai-avatar-user { background: linear-gradient(135deg,#F59E0B,#EF4444); color: white; box-shadow: 0 2px 8px rgba(245,158,11,0.3); }
        .ai-avatar-error { background: #FEE2E2; color: #EF4444; }
        .ai-bubble { max-width: calc(100% - 46px); border-radius: 16px; padding: 12px 16px; font-size: 14.5px; line-height: 1.65; }
        .ai-bubble-user { background: linear-gradient(135deg,#4F46E5,#7C3AED); color: white; border-bottom-right-radius: 4px; }
        .ai-bubble-bot { background: var(--bg-main); border: 1px solid var(--border); color: var(--text-primary); border-bottom-left-radius: 4px; }
        .ai-bubble-error { background: #FEF2F2; border: 1px solid #FECACA; color: #DC2626; border-bottom-left-radius: 4px; }
        .ai-user-text { margin: 0; color: white; }
        .ai-error-content { display: flex; flex-direction: column; gap: 8px; }
        .ai-retry-btn { align-self: flex-start; background: #EF4444; color: white; border: none; border-radius: 6px; padding: 4px 12px; font-size: 12px; font-weight: 600; cursor: pointer; transition: background 0.2s; }
        .ai-retry-btn:hover { background: #DC2626; }
        .ai-thinking-bubble { display: flex; align-items: center; gap: 4px; padding: 12px 16px; }
        .ai-thinking-text { color: var(--text-muted); font-size: 13px; font-style: italic; margin-right: 2px; }
        .ai-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--primary); display: inline-block; animation: ai-bounce 1.2s ease-in-out infinite; }
        .ai-dot:nth-child(3) { animation-delay: 0.15s; }
        .ai-dot:nth-child(4) { animation-delay: 0.30s; }
        @keyframes ai-bounce { 0%,60%,100%{transform:translateY(0);opacity:0.4} 30%{transform:translateY(-6px);opacity:1} }
        .ai-md-body { display: flex; flex-direction: column; gap: 8px; }
        .ai-md-p { margin: 0; }
        .ai-md-h1 { font-size: 17px; font-weight: 800; margin: 2px 0 0; }
        .ai-md-h2 { font-size: 15px; font-weight: 700; margin: 2px 0 0; }
        .ai-md-h3 { font-size: 14px; font-weight: 600; margin: 2px 0 0; }
        .ai-md-ul,.ai-md-ol { padding-left: 18px; margin: 0; display: flex; flex-direction: column; gap: 3px; }
        .ai-md-hr { border: none; border-top: 1px solid var(--border); margin: 2px 0; }
        .ai-inline-code { background: rgba(79,70,229,0.1); color: #4F46E5; padding: 1px 5px; border-radius: 4px; font-family: 'Courier New',monospace; font-size: 13px; font-weight: 600; }
        .ai-code-block { border-radius: 10px; overflow: hidden; border: 1px solid var(--border); margin: 2px 0; }
        .ai-code-block-header { display: flex; align-items: center; justify-content: space-between; background: #1E1E2E; padding: 7px 12px; }
        .ai-code-lang { color: #A78BFA; font-size: 11px; font-weight: 700; font-family: monospace; text-transform: uppercase; }
        .ai-copy-btn { display: flex; align-items: center; gap: 4px; background: rgba(255,255,255,0.1); color: #94A3B8; border: 1px solid rgba(255,255,255,0.1); border-radius: 5px; padding: 3px 8px; font-size: 11px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
        .ai-copy-btn:hover { background: rgba(255,255,255,0.2); color: white; }
        .ai-code-pre { background: #1A1A2E; padding: 12px 14px; margin: 0; overflow-x: auto; font-family: 'Courier New',Consolas,monospace; font-size: 13px; line-height: 1.6; color: #E2E8F0; }
        .ai-input-form { display: flex; flex-direction: column; gap: 7px; margin-top: 14px; }
        .ai-input-wrapper { display: flex; align-items: flex-end; gap: 10px; background: var(--bg-card); border: 2px solid var(--border); border-radius: 14px; padding: 10px 10px 10px 16px; box-shadow: var(--shadow-sm); transition: border-color 0.2s, box-shadow 0.2s; }
        .ai-input-wrapper:focus-within { border-color: var(--primary); box-shadow: 0 0 0 3px rgba(79,70,229,0.1); }
        .ai-input-wrapper--loading { opacity: 0.75; }
        .ai-textarea { flex: 1; border: none; outline: none; resize: none; background: transparent; font-size: 15px; color: var(--text-primary); line-height: 1.5; min-height: 24px; max-height: 200px; padding: 0; }
        .ai-textarea::placeholder { color: var(--text-muted); }
        .ai-textarea:disabled { cursor: not-allowed; }
        .ai-input-actions { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
        .ai-char-count { font-size: 11px; color: var(--text-muted); white-space: nowrap; }
        .ai-send-btn { width: 38px; height: 38px; border-radius: 10px; border: none; display: flex; align-items: center; justify-content: center; transition: all 0.2s; flex-shrink: 0; }
        .ai-send-btn--active { background: linear-gradient(135deg,#4F46E5,#7C3AED); color: white; box-shadow: 0 2px 8px rgba(79,70,229,0.4); cursor: pointer; }
        .ai-send-btn--active:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(79,70,229,0.5); }
        .ai-send-btn--disabled { background: var(--bg-main); color: var(--text-muted); cursor: not-allowed; }
        .ai-input-hint { font-size: 12px; color: var(--text-muted); text-align: center; }
        .ai-spinner { animation: ai-spin 0.8s linear infinite; }
        @keyframes ai-spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        .ai-disclaimer { font-size: 12px; color: var(--text-muted); text-align: center; margin-top: 10px; padding: 0 16px; }
        @media (max-width: 600px) {
          .ai-page-title { font-size: 19px; }
          .ai-clear-btn { margin-left: 0; }
          .ai-chat-window { max-height: 400px; }
          .ai-suggestion-chip { font-size: 12px; padding: 6px 12px; }
          .ai-page-header { padding: 24px 0 18px; }
        }
      `}</style>
    </div>
  );
}
