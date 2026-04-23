import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, X, Send, Loader2, Volume2 } from "lucide-react";

const FloatingChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<
    { sender: string; text: string }[]
  >([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

  // 🔥 USER HEALTH DATA (can later come from Supabase)
  const userHealthData = {
    calories: 1850,
    exercise: 45,
    steps: 6000,
    sleep: 6,
  };

  const toggleChat = () => setIsOpen(!isOpen);

  const speakText = (text: string) => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const userMsg = inputText;
    setInputText("");
    setLoading(true);

    const newMessages = [...messages, { sender: "user", text: userMsg }];
    setMessages(newMessages);

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${API_KEY}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [
              {
                role: "user",
                parts: [
                  {
                    text: `
You are a professional AI health doctor.

User Health Data:
- Calories: ${userHealthData.calories}
- Exercise: ${userHealthData.exercise} minutes
- Steps: ${userHealthData.steps}
- Sleep: ${userHealthData.sleep} hours

User Question:
${userMsg}

Instructions:
- Give simple explanation
- Give practical steps
- Keep answer short but helpful
- Sound like a real doctor
`,
                  },
                ],
              },
            ],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 1024,
            },
          }),
        }
      );

      const data = await response.json();

      const botResponse =
        data?.candidates?.[0]?.content?.parts?.[0]?.text ||
        "Sorry, I couldn't generate a response.";

      setMessages([...newMessages, { sender: "bot", text: botResponse }]);
      speakText(botResponse);
    } catch (error) {
      console.error(error);
      setMessages([
        ...newMessages,
        {
          sender: "bot",
          text: "AI not working. Check API key / billing.",
        },
      ]);
    } finally {
      setLoading(false);
      scrollToBottom();
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isOpen]);

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {isOpen ? (
          <motion.div className="w-80 bg-[#1f2937] rounded-xl shadow-xl border border-gray-700">
            {/* HEADER */}
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-3 text-white flex justify-between">
              <h3>Health Assistant</h3>
              <button onClick={toggleChat}>
                <X size={16} />
              </button>
            </div>

            {/* CHAT */}
            <div className="h-64 p-3 overflow-y-auto bg-gray-900">
              {messages.length === 0 ? (
                <div className="text-gray-400 text-center mt-10">
                  Ask me about your health 👇
                </div>
              ) : (
                messages.map((msg, i) => (
                  <div
                    key={i}
                    className={`mb-2 ${
                      msg.sender === "bot" ? "text-left" : "text-right"
                    }`}
                  >
                    <div
                      className={`inline-block px-3 py-2 rounded-lg ${
                        msg.sender === "bot"
                          ? "bg-gray-700 text-white"
                          : "bg-blue-500 text-white"
                      }`}
                    >
                      {msg.text}
                      {msg.sender === "bot" && (
                        <button
                          onClick={() => speakText(msg.text)}
                          className="ml-2"
                        >
                          <Volume2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}

              {loading && (
                <Loader2 className="animate-spin text-white" />
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* INPUT */}
            <form
              onSubmit={handleSendMessage}
              className="p-3 flex gap-2 bg-gray-800"
            >
              <input
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="flex-1 p-2 bg-gray-700 text-white rounded"
                placeholder="Ask health question..."
              />
              <button className="bg-blue-500 p-2 rounded text-white">
                <Send size={16} />
              </button>

              {isSpeaking && (
                <button
                  type="button"
                  onClick={stopSpeaking}
                  className="bg-red-500 p-2 rounded text-white"
                >
                  <Volume2 size={14} />
                </button>
              )}
            </form>
          </motion.div>
        ) : (
          <button
            onClick={toggleChat}
            className="w-14 h-14 bg-blue-600 rounded-full flex items-center justify-center text-white"
          >
            <MessageSquare />
          </button>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FloatingChatbot;