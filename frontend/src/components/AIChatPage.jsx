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
      setMessages((prev) => [...prev, {
        role: 'assistant',
        text: result.reply,
        chart: result.chart,
        chartDescription: result.chartDescription
      }]);
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
              <div className="chat-msg-bubble">
                <div dangerouslySetInnerHTML={renderMessageContent(msg)} />
                {msg.chart && (!msg.text || !msg.text.includes('[CHART]')) && (
                  <div className="chat-inline-chart" style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div className="chart-image-container" style={{ background: '#ffffff', padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--color-border)', maxWidth: '750px' }}>
                      <img
                        src={`data:image/png;base64,${msg.chart}`}
                        alt="Generated Chart"
                        className="chart-image"
                        style={{ display: 'block', maxWidth: '100%', height: 'auto', borderRadius: '4px' }}
                      />
                    </div>
                    {msg.chartDescription && (
                      <div 
                        className="chat-chart-desc" 
                        style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', lineHeight: '1.4' }}
                        dangerouslySetInnerHTML={{ __html: formatMarkdown(msg.chartDescription) }}
                      />
                    )}
                  </div>
                )}
              </div>
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

// Inline chart parser
function renderMessageContent(msg) {
  const formattedText = formatMarkdown(msg.text);
  
  if (msg.chart && msg.text && msg.text.includes('[CHART]')) {
    const chartHtml = `
      <div class="chat-inline-chart" style="margin-top: 0.75rem; margin-bottom: 0.75rem; display: flex; flex-direction: column; gap: 0.5rem;">
        <div class="chart-image-container" style="background: #ffffff; padding: 0.5rem; border-radius: 8px; border: 1px solid var(--color-border); max-width: 750px;">
          <img
            src="data:image/png;base64,${msg.chart}"
            alt="Generated Chart"
            class="chart-image"
            style="display: block; max-width: 100%; height: auto; border-radius: 4px;"
          />
        </div>
        ${msg.chartDescription ? `
          <div class="chat-chart-desc" style="font-size: 0.8125rem; color: var(--color-text-secondary); line-height: 1.4;">
            ${formatMarkdown(msg.chartDescription)}
          </div>
        ` : ''}
      </div>
    `;
    return { __html: formattedText.replace('[CHART]', chartHtml) };
  }
  
  return { __html: formattedText };
}
