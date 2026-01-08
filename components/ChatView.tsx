
import React, { useState, useRef, useEffect } from 'react';
import { Message } from '../types';
import { chatWithGemini } from '../services/gemini';
import { GenerateContentResponse } from '@google/genai';

const ChatView: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    try {
      const modelMessageId = (Date.now() + 1).toString();
      let streamContent = '';
      
      const stream = await chatWithGemini(input);
      
      setMessages(prev => [...prev, {
        id: modelMessageId,
        role: 'model',
        content: '',
        timestamp: new Date(),
      }]);

      for await (const chunk of stream) {
        const text = (chunk as GenerateContentResponse).text;
        if (text) {
          streamContent += text;
          setMessages(prev => prev.map(msg => 
            msg.id === modelMessageId ? { ...msg, content: streamContent } : msg
          ));
        }
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'model',
        content: "I'm sorry, I encountered an error while processing your request.",
        timestamp: new Date(),
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="h-full flex flex-col max-w-5xl mx-auto w-full">
      <div 
        ref={scrollRef}
        className="flex-1 p-6 space-y-6 overflow-y-auto scroll-smooth"
      >
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center opacity-50 space-y-4">
            <i className="fa-solid fa-robot text-6xl"></i>
            <p className="text-lg font-medium">Hello! How can I help you today?</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-xl">
              <button 
                onClick={() => setInput("Explain quantum computing like I'm five.")}
                className="p-4 bg-slate-800/50 rounded-xl hover:bg-slate-800 transition-colors text-left"
              >
                "Explain quantum computing..."
              </button>
              <button 
                onClick={() => setInput("Write a poem about neon cities.")}
                className="p-4 bg-slate-800/50 rounded-xl hover:bg-slate-800 transition-colors text-left"
              >
                "Write a poem about..."
              </button>
            </div>
          </div>
        )}
        
        {messages.map((msg) => (
          <div 
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[85%] md:max-w-[75%] rounded-2xl p-4 shadow-sm ${
              msg.role === 'user' 
                ? 'bg-blue-600 text-white rounded-tr-none' 
                : 'bg-slate-800 text-slate-100 rounded-tl-none border border-slate-700'
            }`}>
              <div className="whitespace-pre-wrap leading-relaxed">
                {msg.content}
              </div>
              <div className={`mt-2 text-[10px] ${msg.role === 'user' ? 'text-blue-200' : 'text-slate-500'}`}>
                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-slate-800 rounded-2xl p-4 rounded-tl-none border border-slate-700 animate-pulse">
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce"></div>
                <div className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 md:p-8 bg-slate-900">
        <form 
          onSubmit={handleSubmit}
          className="relative max-w-4xl mx-auto flex gap-3"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 bg-slate-800 border border-slate-700 rounded-2xl px-6 py-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder-slate-500 shadow-xl"
            disabled={isTyping}
          />
          <button
            type="submit"
            disabled={!input.trim() || isTyping}
            className={`px-6 py-4 rounded-2xl font-bold transition-all shadow-xl flex items-center gap-2 ${
              !input.trim() || isTyping
                ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-500 text-white active:scale-95'
            }`}
          >
            <i className="fa-solid fa-paper-plane"></i>
            <span className="hidden md:inline">Send</span>
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatView;
