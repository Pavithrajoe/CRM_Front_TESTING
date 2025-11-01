import React, { useState, useEffect, useRef } from 'react';
import Fuse from 'fuse.js';

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { content: 'Hello! I am your OCRM assistant. How can I help you today?', isUser: false }
  ]);
  const [userInput, setUserInput] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [fuse, setFuse] = useState(null);
  const chatMessagesRef = useRef(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  useEffect(() => {
    const loadQnA = async () => {
      try {
        const response = await fetch('public/assets/merged_crm_ocrm_qna_400.json');
        const qnaData = await response.json();
        const fuseInstance = new Fuse(qnaData, {
          keys: [
            { name: 'question', weight: 0.7 },
            { name: 'variants', weight: 0.3 }
          ],
          includeScore: true,
          threshold: 0.6,
          ignoreLocation: true
        });
        setFuse(fuseInstance);
        console.log('Total Q&A entries loaded:', qnaData.length);
      } catch (error) {
        console.error('Failed to load Q&A data:', error);
      }
    };
    loadQnA();
  }, []);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window) {
      const recognition = new window.webkitSpeechRecognition();
      recognition.lang = 'en-US';
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.onresult = (event) => {
        const voiceInput = event.results[0][0].transcript;
        setUserInput(voiceInput);
      };
      recognitionRef.current = recognition;
    }
  }, []);

  useEffect(() => {
    if (userInput.length > 2 && fuse) {
      const matches = fuse.search(userInput).slice(0, 25);
      const uniqueSuggestions = [...new Set(
        matches.map(match =>
          match.item.question.replace(/\s*\(Example \d+\)$/, '').trim()
        )
      )];
      setSuggestions(uniqueSuggestions);
    } else {
      setSuggestions([]);
    }
  }, [userInput, fuse]);

  const getOpenRouterResponse = async (userText) => {
    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "mistralai/mistral-7b-instruct",
          messages: [
            { role: "system", content: "You are a helpful CRM assistant. Reply in a friendly, clear way using known CRM info." },
            { role: "user", content: userText }
          ],
          temperature: 0.5
        })
      });
      const data = await response.json();
      return data.choices?.[0]?.message?.content || "Sorry, I didn’t get that.";
    } catch (error) {
      console.error("OpenRouter error:", error);
      return "There was a problem reaching the assistant. Try again later.";
    }
  };

  const getLocalAnswer = (text) => {
    if (!fuse) {
      console.warn("Fuse not ready yet.");
      return null;
    }

    if (!text || typeof text !== 'string') return null;

    const result = fuse.search(text.toLowerCase());
    return result.length > 0 && result[0]?.item?.answer
      ? result[0].item.answer
      : null;
  };

  const startVoiceInput = () => {
    recognitionRef.current?.start();
  };

  const handleSendMessage = async () => {
    if (!userInput.trim()) return;
    const newUserMessage = { content: userInput, isUser: true };
    setMessages(prev => [...prev, newUserMessage]);
    setUserInput('');
    setIsLoading(true);
    let botReply = getLocalAnswer(newUserMessage.content);
    if (!botReply) {
      botReply = await getOpenRouterResponse(newUserMessage.content);
    }
    setMessages(prev => [...prev, { content: botReply, isUser: false }]);
    setIsLoading(false);
    setSuggestions([]);
  };

  return (
    <>
      <div
        className="fixed bottom-5 right-5 text-4xl bg-purple-100 rounded-full shadow-lg p-4 cursor-pointer transition-transform duration-300 hover:scale-110 z-[1000] border-2 border-purple-300 transform-gpu"
        onClick={() => setIsOpen(!isOpen)}
        title={isOpen ? "Close Chat" : "Open Chat"}
      >
        <span className="drop-shadow-md">
          <img src="/public/illustrations/chatbot.svg" className="h-10 w-10" />
        </span>
      </div>

      {isOpen && (
        <div className="fixed bottom-20 right-5 w-96 h-[600px] rounded-lg overflow-hidden flex flex-col bg-white shadow-2xl z-[999] animate-fade-in-up transform-gpu">
          <div className="bg-gradient-to-r from-purple-700 to-indigo-800 text-white p-5 text-center shadow-md">
            <h1 className="text-2xl font-semibold drop-shadow-sm">Your CRM ChatBot ✨</h1>
          </div>

          <div ref={chatMessagesRef} className="flex-1 p-5 overflow-y-auto bg-purple-50 flex flex-col custom-scrollbar">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`mb-4 p-3 rounded-xl max-w-[85%] break-words animate-message-fade-in ${msg.isUser ? 'bg-purple-200 text-purple-900 self-end rounded-br-lg' : 'bg-blue-100 text-blue-900 self-start rounded-bl-lg'} shadow-sm`}
              >
                {msg.content}
              </div>
            ))}
            {isLoading && (
              <div className="self-start text-gray-500 italic mb-4 animate-pulse">
                Inklidox Child is typing...
              </div>
            )}
          </div>

          <div className="flex p-4 bg-white border-t border-gray-200 gap-3 shadow-inner flex-col">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Type your message here..."
                className="flex-1 p-2 text-base rounded-md border border-gray-300 outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') handleSendMessage();
                }}
                disabled={isLoading}
              />
              <button
                onClick={startVoiceInput}
                title="Speak"
                className="bg-gray-100 px-3 rounded shadow"
              >
                🎤
              </button>
              <button
                className={`px-5 py-2 bg-purple-700 text-white border-none rounded-full cursor-pointer font-bold transition-colors duration-300 hover:bg-purple-800 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''} shadow-md`}
                onClick={handleSendMessage}
                disabled={isLoading}
              >
                Send
              </button>
            </div>

            {suggestions.length > 0 && (
              <ul className="text-sm text-gray-600 mt-2 space-y-1">
                {suggestions.map((s, i) => (
                  <li
                    key={i}
                    className="cursor-pointer hover:text-purple-700"
                    onClick={() => {
                      setUserInput(s);
                      setSuggestions([]);
                    }}
                  >
                    {s}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default Chatbot;
