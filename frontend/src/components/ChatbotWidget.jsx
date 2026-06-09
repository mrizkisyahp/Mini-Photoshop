import React, { useState, useRef, useEffect } from 'react';
import { FiMessageSquare, FiX, FiSend } from 'react-icons/fi';
import ReactMarkdown from 'react-markdown';
import { sendDataRequest } from '../api/api';

const ChatbotWidget = ({ currentImageFile }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { sender: 'bot', text: 'Hi! I am the Mini-Photoshop assistant. You can ask me to identify what is in your image, or how to improve it using the tools!' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [limitsData, setLimitsData] = useState(null);
  const [showLimits, setShowLimits] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || !currentImageFile || loading) return;

    const userText = input.trim();
    setMessages(prev => [...prev, { sender: 'user', text: userText }]);
    setInput('');
    setLoading(true);

    try {
      const data = await sendDataRequest('/api/chatbot/ask', currentImageFile, { message: userText });
      setMessages(prev => [...prev, { sender: 'bot', text: data.reply || "No response." }]);
    } catch (e) {
      setMessages(prev => [...prev, { sender: 'bot', text: "Error connecting to AI: " + (e.response?.data?.detail || e.message) }]);
    } finally {
      setLoading(false);
    }
  };

  const handleFetchLimits = async () => {
    setShowLimits(true);
    setLimitsData({ loading: true });
    try {
      const res = await fetch('http://localhost:8000/api/chatbot/limits');
      const data = await res.json();
      setLimitsData(data);
    } catch (e) {
      setLimitsData({ error: e.message });
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 w-14 h-14 bg-cyan-600 hover:bg-cyan-500 text-white rounded-full flex items-center justify-center shadow-lg transition-transform ${isOpen ? 'scale-0' : 'scale-100'} z-50`}
      >
        <FiMessageSquare size={24} />
      </button>

      {/* Chat Window */}
      <div className={`fixed bottom-6 right-6 w-80 md:w-96 h-[500px] bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl flex flex-col transition-transform origin-bottom-right z-50 ${isOpen ? 'scale-100' : 'scale-0'}`}>
        <div className="bg-zinc-950 p-4 rounded-t-xl border-b border-zinc-800 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <FiMessageSquare className="text-cyan-400" />
            <h3 className="text-zinc-200 font-semibold text-sm">Mini-Photoshop AI</h3>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={handleFetchLimits} className="text-[10px] bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-2 py-1 rounded transition-colors uppercase tracking-wider font-semibold">
              Limits
            </button>
            <button onClick={() => setIsOpen(false)} className="text-zinc-500 hover:text-zinc-300 transition-colors">
              <FiX size={18} />
            </button>
          </div>
        </div>

        {/* Limits Modal Overlay */}
        {showLimits && (
          <div className="absolute inset-0 top-14 bg-zinc-950/95 backdrop-blur-sm z-50 p-4 flex flex-col gap-3 rounded-b-xl overflow-y-auto border-t border-zinc-800">
            <div className="flex justify-between items-center">
              <h4 className="text-cyan-400 font-semibold text-sm uppercase tracking-widest">OpenRouter API Limits</h4>
              <button onClick={() => setShowLimits(false)} className="text-zinc-400 hover:text-white">
                <FiX size={16} />
              </button>
            </div>
            {limitsData?.loading ? (
              <div className="text-zinc-400 text-xs text-center mt-10 animate-pulse">Fetching limits...</div>
            ) : limitsData?.error ? (
              <div className="text-red-400 text-xs bg-red-500/10 p-3 rounded">{limitsData.error}</div>
            ) : (
              <pre className="text-[10px] text-zinc-300 font-mono bg-zinc-900 p-3 rounded border border-zinc-800 whitespace-pre-wrap overflow-x-auto">
                {JSON.stringify(limitsData, null, 2)}
              </pre>
            )}
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
          {messages.map((msg, idx) => (
            <div key={idx} className={`max-w-[85%] rounded-lg p-3 text-sm whitespace-pre-wrap prose prose-invert prose-sm ${msg.sender === 'user' ? 'bg-cyan-600/20 text-cyan-100 border border-cyan-500/30 self-end rounded-br-none' : 'bg-zinc-800 text-zinc-300 border border-zinc-700 self-start rounded-bl-none'}`}>
              <ReactMarkdown>{msg.text}</ReactMarkdown>
            </div>
          ))}
          {loading && (
            <div className="bg-zinc-800 text-zinc-400 border border-zinc-700 self-start rounded-bl-none rounded-lg p-3 text-sm flex gap-1">
              <span className="animate-bounce">.</span><span className="animate-bounce delay-75">.</span><span className="animate-bounce delay-150">.</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-3 border-t border-zinc-800 bg-zinc-950 rounded-b-xl flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            disabled={!currentImageFile || loading}
            placeholder={currentImageFile ? "Ask a question..." : "Upload image first..."}
            className="flex-1 bg-zinc-900 border border-zinc-800 text-zinc-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-cyan-500 transition-colors disabled:opacity-50"
          />
          <button
            onClick={handleSend}
            disabled={!currentImageFile || !input.trim() || loading}
            className="w-10 h-10 bg-cyan-600 hover:bg-cyan-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white rounded-lg flex items-center justify-center transition-colors"
          >
            <FiSend size={16} />
          </button>
        </div>
      </div>
    </>
  );
};

export default ChatbotWidget;
