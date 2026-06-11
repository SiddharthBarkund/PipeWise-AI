import { useState } from 'react';
import { ChevronRightIcon } from './Icons';
import { sendChatMessage } from '../utils/api';

const SUGGESTIONS = [
  'Show me the top 5 most correlated features',
  'What percentage of data is missing?',
  'What are the column types?',
  'Show me statistics for the data',
  'Are there any duplicates?',
  'Show me the first 5 rows',
];

export default function AIChatPage({ fileData }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: fileData
        ? `I've loaded **${fileData.name}** with ${fileData.rows.toLocaleString()} rows and ${fileData.columns} columns. Ask me anything about your data! I analyze it using Python pandas on the backend.`
        : 'Upload a dataset first, then ask me anything about it.',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const question = input;
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', text: question }]);
    setLoading(true);

    try {
      const result = await sendChatMessage(question);
      setMessages((prev) => [...prev, { role: 'assistant', text: result.reply }]);
    } catch (e) {
      setMessages((prev) => [...prev, { role: 'assistant', text: `⚠️ Error: ${e.message}` }]);
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestion = (s) => setInput(s);

  return (
    <div className="page-content fade-in" id="chat-page">
      <div className="breadcrumb"><span>Pipeline</span><ChevronRightIcon /><span className="current">AI chat</span></div>
      <h2 className="page-title">AI Data Chat</h2>
      <p className="page-subtitle">Ask questions about your data — analyzed by Python pandas</p>

      <div className="chat-container">
        <div className="chat-messages" id="chat-messages">
          {messages.map((msg, i) => (
            <div key={i} className={`chat-msg chat-msg-${msg.role}`}>
              <div className="chat-msg-avatar">{msg.role === 'assistant' ? '🤖' : 'SB'}</div>
              <div className="chat-msg-bubble" dangerouslySetInnerHTML={{ __html: formatMarkdown(msg.text) }} />
            </div>
          ))}
          {loading && (
            <div className="chat-msg chat-msg-assistant">
              <div className="chat-msg-avatar">🤖</div>
              <div className="chat-msg-bubble"><div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /></div>
            </div>
          )}
        </div>

        {fileData && messages.length <= 2 && (
          <div className="chat-suggestions">
            {SUGGESTIONS.map((s) => (
              <button key={s} className="chat-suggestion-btn" onClick={() => handleSuggestion(s)}>{s}</button>
            ))}
          </div>
        )}

        <div className="chat-input-row">
          <input
            className="chat-input"
            placeholder={fileData ? 'Ask about your data…' : 'Upload data first…'}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            disabled={!fileData || loading}
            id="chat-input"
          />
          <button className="chat-send-btn" onClick={handleSend} disabled={!fileData || !input.trim() || loading} id="btn-chat-send">
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

// Simple markdown-like formatting
function formatMarkdown(text) {
  if (!text) return '';
  return text
    .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code>$1</code>')
    .replace(/\n/g, '<br/>');
}
