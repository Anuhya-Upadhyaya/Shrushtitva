import React, { useState, useEffect, useRef } from 'react';
import { Plant, ChatMessage } from '../types/plant';
import { api } from '../services/api';
import {
  Send,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Sparkles,
  Bot,
  User,
  Sprout,
  ArrowRight,
  Loader2,
  CheckCircle2,
} from 'lucide-react';

interface AIAssistantProps {
  plants: Plant[];
  onSelectPlant: (plant: Plant) => void;
  onOpenAssessment: (plant: Plant) => void;
}

export const AIAssistant: React.FC<AIAssistantProps> = ({
  plants,
  onSelectPlant,
  onOpenAssessment,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [selectedPlantId, setSelectedPlantId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [speechSynthesisEnabled, setSpeechSynthesisEnabled] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Initialize Speech Recognition if supported in browser
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-IN';

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputMessage(transcript);
        setIsRecording(false);
      };

      recognition.onerror = () => {
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  // Fetch initial chat history
  useEffect(() => {
    api.getChatHistory().then((history) => {
      if (history && history.length > 0) {
        setMessages(history);
      } else {
        setMessages([
          {
            id: 'welcome_1',
            role: 'assistant',
            content:
              'Namaste! I am your Shrushtitva botanical care assistant. I have full context of all your managed plants, recent diagnoses, treatments, and local regional climate. What questions do you have today?',
            timestamp: new Date().toISOString(),
          },
        ]);
      }
    });
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleToggleVoice = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in this browser.');
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      setIsRecording(true);
      recognitionRef.current.start();
    }
  };

  const speakText = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: `u_${Date.now()}`,
      role: 'user',
      content: inputMessage.trim(),
      timestamp: new Date().toISOString(),
      plantId: selectedPlantId || undefined,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const { reply } = await api.sendChatMessage(userMsg.content, selectedPlantId || undefined);

      const assistantMsg: ChatMessage = {
        id: `a_${Date.now()}`,
        role: 'assistant',
        content: reply,
        timestamp: new Date().toISOString(),
        plantId: selectedPlantId || undefined,
      };

      setMessages((prev) => [...prev, assistantMsg]);

      if (speechSynthesisEnabled) {
        speakText(reply);
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          role: 'assistant',
          content: 'I had trouble connecting to the botanical knowledge base. Please check your network and try again.',
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const activePlant = plants.find((p) => p.id === selectedPlantId);

  return (
    <div className="max-w-4xl mx-auto space-y-4 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-neutral-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">AI Botanical Assistant</h1>
          <p className="text-xs text-neutral-500">
            Ask practical questions with verified plant record context, low-cost treatments, and plain language explanations
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Audio read-aloud toggle */}
          <button
            onClick={() => setSpeechSynthesisEnabled(!speechSynthesisEnabled)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl border transition-colors cursor-pointer ${
              speechSynthesisEnabled
                ? 'bg-purple-100 text-[#3B182E] border-purple-300'
                : 'bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-50'
            }`}
            title="Read assistant replies aloud"
          >
            {speechSynthesisEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            <span>Voice Output {speechSynthesisEnabled ? 'On' : 'Off'}</span>
          </button>
        </div>
      </div>

      {/* Plant Focus Context Selector */}
      <div className="flex items-center gap-2 p-3 bg-white rounded-2xl border border-neutral-200 text-xs">
        <Sprout className="w-4 h-4 text-[#3B182E] shrink-0" />
        <span className="font-semibold text-neutral-800 shrink-0">Focus Context:</span>
        <select
          value={selectedPlantId}
          onChange={(e) => setSelectedPlantId(e.target.value)}
          className="bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-1 text-xs text-neutral-800 focus:outline-none focus:ring-1 focus:ring-[#3B182E]"
        >
          <option value="">Whole Garden (All Plants)</option>
          {plants.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nickname} — {p.commonName} ({p.healthStatus.replace(/_/g, ' ')})
            </option>
          ))}
        </select>
        {activePlant && (
          <span className="text-neutral-400 text-[11px] truncate hidden sm:inline">
            Status: {activePlant.healthStatus} · {activePlant.growthStage}
          </span>
        )}
      </div>

      {/* Suggested Quick Inquiries */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="text-neutral-400 font-medium">Quick Questions:</span>
        {[
          'Why are my leaves turning yellow between veins?',
          'What is the cheapest safe remedy for spider mites?',
          'How do I brew aerated compost tea for nutrients?',
          'What vegetable seeds should I sow in my terrace now?',
        ].map((q, idx) => (
          <button
            key={idx}
            onClick={() => {
              setInputMessage(q);
            }}
            className="px-2.5 py-1 bg-white border border-neutral-200 rounded-lg text-neutral-600 hover:text-neutral-900 hover:border-neutral-300 transition-colors cursor-pointer text-[11px]"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Chat Messages Log */}
      <div className="bg-white rounded-3xl border border-neutral-200 shadow-2xs h-[520px] flex flex-col overflow-hidden">
        <div className="flex-1 p-5 overflow-y-auto space-y-4 text-xs">
          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <div key={msg.id} className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                    isUser ? 'bg-[#3B182E] text-white' : 'bg-[#FAF7F5] border border-neutral-200 text-[#3B182E]'
                  }`}
                >
                  {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                <div
                  className={`max-w-[80%] rounded-2xl p-4 leading-relaxed space-y-2 ${
                    isUser
                      ? 'bg-[#3B182E] text-white rounded-tr-none'
                      : 'bg-[#FAF7F5] text-neutral-800 rounded-tl-none border border-neutral-200/60'
                  }`}
                >
                  <p className="whitespace-pre-line">{msg.content}</p>

                  <div
                    className={`flex items-center justify-between text-[10px] pt-1 ${
                      isUser ? 'text-white/60' : 'text-neutral-400'
                    }`}
                  >
                    <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    {!isUser && (
                      <button
                        onClick={() => speakText(msg.content)}
                        className="hover:text-neutral-700 transition-colors cursor-pointer"
                        title="Read this aloud"
                      >
                        <Volume2 className="w-3 h-3 inline ml-1" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#FAF7F5] border border-neutral-200 text-[#3B182E] flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="p-3.5 bg-[#FAF7F5] border border-neutral-200/60 rounded-2xl rounded-tl-none flex items-center gap-2 text-neutral-500 text-xs">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Checking plant history and agricultural recommendations...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Chat Input Bar */}
        <form onSubmit={handleSendMessage} className="p-3 bg-neutral-50 border-t border-neutral-200 flex items-center gap-2">
          {/* Microphone Voice Button */}
          <button
            type="button"
            onClick={handleToggleVoice}
            className={`p-2.5 rounded-xl border transition-colors cursor-pointer shrink-0 ${
              isRecording
                ? 'bg-rose-500 text-white border-rose-600 animate-pulse'
                : 'bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-100'
            }`}
            title={isRecording ? 'Listening... click to stop' : 'Voice input (Speech to text)'}
          >
            {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>

          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder={
              isRecording
                ? 'Listening... speak clearly now...'
                : activePlant
                ? `Ask about ${activePlant.nickname} (${activePlant.commonName})...`
                : 'Ask anything about your plants, symptoms, or remedies...'
            }
            className="flex-1 p-2.5 bg-white border border-neutral-200 rounded-xl text-xs placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#3B182E]/20"
          />

          <button
            type="submit"
            disabled={!inputMessage.trim() || isLoading}
            className="p-2.5 bg-[#3B182E] hover:bg-[#2B1020] text-white rounded-xl transition-colors cursor-pointer disabled:opacity-40 shrink-0"
            title="Send inquiry"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
