import { useState, useRef, useEffect } from 'react';
import type { KeyboardEvent } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { sendMessage, addUserMessage, clearChat } from '../store/chatSlice';
import { fetchInteractions } from '../store/interactionSlice';
import { resetForm } from '../store/formSlice';
import type { RootState, AppDispatch } from '../store/store';

export default function ChatPanel() {
  const dispatch = useDispatch<AppDispatch>();
  const { messages, loading } = useSelector((s: RootState) => s.chat);
  const form = useSelector((s: RootState) => s.form);
  const { editingId } = form;
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading) return;

    dispatch(addUserMessage(text));
    setInput('');

    const conversationHistory = messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    console.log("DEBUG ChatPanel: Sending payload with editingId =", editingId);
    const result = await dispatch(sendMessage({ 
      message: text, 
      conversationHistory, 
      interactionId: editingId,
      currentFormState: form 
    }));
    const payload = result.payload as any;

    // Refresh interactions list if something was saved
    if (payload?.saved_interaction || payload?.action_taken === 'log_interaction') {
      dispatch(fetchInteractions());
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClear = () => {
    dispatch(clearChat());
    dispatch(resetForm());
  };

  return (
    <div className="chat-panel">
      <div className="chat-header">
        <span className="chat-header-icon">&#x1F916;</span>
        <div>
          <strong>AI Assistant</strong>
          <p className="chat-subtitle">Log interaction via chat</p>
        </div>
        {messages.length > 0 && (
          <button className="clear-chat-btn" onClick={handleClear} type="button">Clear</button>
        )}
      </div>

      <div className="chat-messages">
        {messages.length === 0 && (
          <div className="chat-bubble assistant">
            Log interaction details here (e.g., "Met Dr. Smith, discussed Product X efficacy, positive sentiment, shared brochure") or ask for help.
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`chat-bubble ${msg.role}`}>
            {msg.content}
            {msg.action_taken && (
              <div className="chat-action-badge">
                {msg.action_taken === 'log_interaction'
                  ? 'Saved to DB & form filled'
                  : `Action: ${msg.action_taken}`}
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="chat-bubble assistant typing">
            <span className="dot"></span>
            <span className="dot"></span>
            <span className="dot"></span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-area">
        <input
          type="text"
          placeholder="Describe interaction..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={loading}
        />
        <button
          className="chat-send-btn"
          onClick={handleSend}
          disabled={loading || !input.trim()}
        >
          <span className="send-icon">&#x25B2;</span> Log
        </button>
      </div>
    </div>
  );
}
