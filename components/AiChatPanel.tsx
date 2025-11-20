import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Bot, User, Loader2, Zap, FileText, PanelRightClose, PanelRightOpen, ArrowLeftToLine, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createChatSession } from '../services/geminiService';
import { ChatMessage, Task } from '../types';
import { GenerateContentResponse } from '@google/genai';

interface AiChatPanelProps {
  isOpen: boolean;
  onToggle: () => void;
  onAddTasks: (data: any) => void;
  onUpdateTask: (data: any) => void;
  activeTask?: Task | null;
  isMobile?: boolean;
}

export const AiChatPanel: React.FC<AiChatPanelProps> = ({ isOpen, onToggle, onAddTasks, onUpdateTask, activeTask, isMobile = false }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      text: "Hi! I'm your ZenTask assistant. Tell me about a project you want to start, and I'll help you plan it.",
      timestamp: new Date(),
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isExecutingTool, setIsExecutingTool] = useState(false);
  
  const chatSessionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const prevActiveTaskRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (!chatSessionRef.current) {
      chatSessionRef.current = createChatSession();
    }
  }, []);

  // Context Switching Logic
  useEffect(() => {
    const handleContextSwitch = async () => {
      if (isOpen && activeTask && activeTask.id !== prevActiveTaskRef.current) {
        prevActiveTaskRef.current = activeTask.id;
        
        // Add a visual divider for the context switch
        setMessages(prev => [...prev, {
          id: `ctx-${Date.now()}`,
          role: 'model', // Visually distinctive system-like message
          text: `I've switched focus to the task: "${activeTask.title}". How can we improve it?`,
          timestamp: new Date()
        }]);

        setIsTyping(true);

        // Send hidden prompt to Gemini to prime the context
        const contextPrompt = `
          CONTEXT UPDATE: The user is now focusing on a specific task.
          Task Details:
          - ID: "${activeTask.id}"
          - Title: "${activeTask.title}"
          - Description: "${activeTask.description || 'None'}"
          - Priority: ${activeTask.priority}
          - Subtasks: ${activeTask.subtasks.map(s => s.title).join(', ')}
          
          Please respond briefly acknowledging this task. Offer to:
          1. Optimize the description.
          2. Suggest better subtasks.
          3. Provide a strategy to complete it.
        `;

        try {
          const chat = chatSessionRef.current;
          const result = await chat.sendMessageStream({ message: contextPrompt });
          
          const responseId = `ai-${Date.now()}`;
          setMessages(prev => [...prev, {
            id: responseId,
            role: 'model',
            text: '',
            timestamp: new Date(),
            isStreaming: true
          }]);

          let fullText = '';
          for await (const chunk of result) {
            const c = chunk as GenerateContentResponse;
            if (c.text) {
              fullText += c.text;
              setMessages(prev => prev.map(msg => 
                msg.id === responseId ? { ...msg, text: fullText } : msg
              ));
            }
          }
          
          setMessages(prev => prev.map(msg => 
            msg.id === responseId ? { ...msg, isStreaming: false } : msg
          ));

        } catch (err) {
          console.error("Context switch error", err);
        } finally {
          setIsTyping(false);
        }
      }
    };

    handleContextSwitch();
  }, [activeTask, isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen, isExecutingTool]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isTyping || isExecutingTool) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const chat = chatSessionRef.current;
      const responseId = (Date.now() + 1).toString();
      
      // Optimistic initial response bubble
      setMessages(prev => [...prev, {
        id: responseId,
        role: 'model',
        text: '',
        timestamp: new Date(),
        isStreaming: true
      }]);

      let result = await chat.sendMessageStream({ message: userMsg.text });
      let fullText = '';
      let functionCalls: any[] = [];
      
      for await (const chunk of result) {
        const c = chunk as GenerateContentResponse;
        
        // 1. Accumulate Text
        if (c.text) {
          fullText += c.text;
          setMessages(prev => prev.map(msg => 
            msg.id === responseId ? { ...msg, text: fullText } : msg
          ));
        }

        // 2. Accumulate Function Calls
        const calls = c.candidates?.[0]?.content?.parts?.filter((p: any) => p.functionCall).map((p: any) => p.functionCall);
        if (calls && calls.length > 0) {
          functionCalls = [...functionCalls, ...calls];
        }
      }

      setMessages(prev => prev.map(msg => 
        msg.id === responseId ? { ...msg, isStreaming: false } : msg
      ));

      // If functions were called
      if (functionCalls.length > 0) {
        setIsExecutingTool(true);
        const responses = [];

        for (const call of functionCalls) {
          if (call.name === 'createProjectPlan') {
            onAddTasks(call.args);
            responses.push({
              name: call.name,
              response: { result: "success", message: "Tasks created successfully in the user's workspace." },
              id: call.id 
            });
          } else if (call.name === 'updateTask') {
            onUpdateTask(call.args);
            responses.push({
              name: call.name,
              response: { result: "success", message: "Task updated successfully." },
              id: call.id
            });
          }
        }

        // Send tool response back to model
        const toolResponseParts = responses.map(r => ({
          functionResponse: {
            name: r.name,
            response: r.response,
            id: r.id
          }
        }));

        const finalResult = await chat.sendMessageStream({ message: toolResponseParts });
        
        const confirmationId = (Date.now() + 2).toString();
        setMessages(prev => [...prev, {
          id: confirmationId,
          role: 'model',
          text: '',
          timestamp: new Date(),
          isStreaming: true
        }]);

        let finalText = '';
        for await (const chunk of finalResult) {
          const c = chunk as GenerateContentResponse;
          if (c.text) {
            finalText += c.text;
            setMessages(prev => prev.map(msg => 
              msg.id === confirmationId ? { ...msg, text: finalText } : msg
            ));
          }
        }
        
        setMessages(prev => prev.map(msg => 
          msg.id === confirmationId ? { ...msg, isStreaming: false } : msg
        ));
        setIsExecutingTool(false);
      }

    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'model',
        text: "I encountered a glitch while processing that. Could you try again?",
        timestamp: new Date()
      }]);
      setIsExecutingTool(false);
    } finally {
      setIsTyping(false);
    }
  };

  // Dynamic styles for sidebar type behavior
  const containerClasses = isMobile
    ? `fixed inset-0 z-50 w-full bg-white dark:bg-[#111] transition-transform duration-300 flex flex-col h-[100dvh] ${isOpen ? 'translate-x-0' : 'translate-x-full'}`
    : `fixed right-0 top-0 h-full bg-white dark:bg-[#111] border-l border-gray-200 dark:border-dark-border z-40 flex flex-col transition-all duration-300 ease-in-out ${isOpen ? 'w-[380px]' : 'w-[60px]'}`;

  return (
    <div className={containerClasses}>
      
      {/* Compact View Overlay (Desktop Only) */}
      {!isMobile && !isOpen && (
        <button 
          onClick={onToggle}
          className="h-full w-full flex flex-col items-center pt-6 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors gap-8 group"
          title="Open AI Assistant"
        >
           <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300 shadow-sm group-hover:scale-105 transition-transform">
              <Sparkles size={20} className="fill-purple-100 dark:fill-purple-900" />
           </div>
           
           {/* Vertical Text */}
           <div className="flex-1 flex items-center justify-center">
             <div className="[writing-mode:vertical-rl] rotate-180 text-xs font-bold text-gray-400 dark:text-gray-500 tracking-[0.2em] uppercase group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                AI Assistant
             </div>
           </div>

           <div className="pb-6 text-gray-300 dark:text-gray-600 group-hover:text-black dark:group-hover:text-white transition-colors">
             <ArrowLeftToLine size={18} />
           </div>
        </button>
      )}

      {/* Expanded View Content (Visible if open, or always processed if mobile open) */}
      <div className={`flex flex-col h-full w-full ${!isOpen && !isMobile ? 'opacity-0 pointer-events-none hidden' : 'opacity-100 flex'}`}>
        
        {/* Header */}
        <div className="flex flex-col border-b border-gray-100 dark:border-dark-border bg-white/80 dark:bg-[#111]/80 backdrop-blur-sm flex-shrink-0">
          <div className="flex items-center justify-between px-5 py-4">
            <div className="flex items-center gap-2.5">
               <div className="p-1.5 bg-purple-50 dark:bg-purple-900/30 rounded-md text-purple-600 dark:text-purple-300">
                 <Sparkles size={16} />
               </div>
               <div>
                 <h2 className="text-sm font-semibold text-charcoal dark:text-gray-200">AI Assistant</h2>
                 <p className="text-[10px] text-gray-500 dark:text-gray-400">Powered by Gemini</p>
               </div>
            </div>
            
            {/* Collapse Button / Close Button */}
            <button 
              onClick={onToggle}
              className="p-2 text-gray-400 hover:text-black dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/5 rounded-full transition-colors"
              title="Collapse Sidebar"
            >
              {isMobile ? <X size={20} /> : <PanelRightClose size={18} />}
            </button>
          </div>

          {/* Active Task Context Banner */}
          {activeTask && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              className="px-5 py-2 bg-purple-50/50 dark:bg-purple-900/20 border-t border-purple-50 dark:border-purple-900/30 flex items-center gap-2"
            >
              <FileText size={12} className="text-purple-600 dark:text-purple-400" />
              <span className="text-[11px] font-medium text-purple-900 dark:text-purple-300 truncate max-w-[250px]">
                Discussing: {activeTask.title}
              </span>
            </motion.div>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 scrollbar-hide bg-gray-50/30 dark:bg-[#0f0f0f]">
          <AnimatePresence>
          {messages.map((msg) => (
            <motion.div 
              key={msg.id} 
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className={`flex items-start gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              {/* Avatar */}
              <div className={`
                w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-1 shadow-sm border border-white dark:border-gray-700
                ${msg.role === 'user' ? 'bg-black dark:bg-white text-white dark:text-black' : 'bg-white dark:bg-gray-800 text-purple-600 dark:text-purple-400'}
              `}>
                {msg.role === 'user' ? <User size={12} /> : <Bot size={14} />}
              </div>

              {/* Bubble */}
              <div className={`
                max-w-[80%] p-3.5 rounded-2xl text-[13px] leading-relaxed shadow-sm
                ${msg.role === 'user' 
                  ? 'bg-black dark:bg-white text-white dark:text-black rounded-tr-sm' 
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-100 dark:border-gray-700 rounded-tl-sm'}
              `}>
                {msg.text}
                {msg.isStreaming && (
                   <span className="inline-block w-1.5 h-3 ml-1 align-middle bg-purple-400 animate-pulse"></span>
                )}
              </div>
            </motion.div>
          ))}
          </AnimatePresence>
          
          {/* Typing / Action Indicators */}
          {(isTyping || isExecutingTool) && !messages[messages.length - 1]?.isStreaming && messages[messages.length - 1]?.role === 'user' && (
             <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-2 text-gray-400 dark:text-gray-500 text-xs ml-12 animate-pulse"
             >
                {isExecutingTool ? (
                  <>
                    <Zap size={10} className="fill-yellow-400 text-yellow-400" />
                    <span>Updating tasks...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={10} />
                    <span>Thinking...</span>
                  </>
                )}
             </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-gray-100 dark:border-dark-border bg-white dark:bg-[#111] flex-shrink-0">
          <form onSubmit={handleSend} className="relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={activeTask ? "Ask how to improve this task..." : "E.g., 'Help me plan a launch party'"}
              className="w-full pl-4 pr-12 py-3.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-charcoal dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-100 dark:focus:ring-purple-900/30 focus:border-purple-200 dark:focus:border-purple-800 transition-all"
            />
            <button 
              type="submit"
              disabled={!input.trim() || isTyping || isExecutingTool}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-white dark:bg-gray-800 text-black dark:text-white shadow-sm border border-gray-100 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all group"
            >
               {isTyping || isExecutingTool ? <Loader2 size={16} className="animate-spin text-purple-600 dark:text-purple-400" /> : <Send size={16} className="group-hover:scale-110 transition-transform" />}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};