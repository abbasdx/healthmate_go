"use client";

import { useState, useRef, useEffect } from "react";
import axios from "axios";

type Message = {
  role: "user" | "bot";
  text: string;
};

export default function Chatbot() {
  /* FIXED: starts CLOSED instead of open */
  const [open, setOpen] = useState(false);

  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const [messages, setMessages] = useState<Message[]>([
    {
      role: "bot",
      text:
        "👋 Hello! I’m HealthMate AI.\n" +
        "We provide secure ONLINE doctor consultations only.\n" +
        "Ask me about symptoms, doctors, appointments, or health tips.",
    },
  ]);

  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const cleanReply = (text: string) => {
    return text
      .replace(/\*\*/g, "")
      .replace(/###/g, "")
      .replace(/##/g, "")
      .replace(/#/g, "")
      .replace(/\*/g, "• ")
      .replace(/zip code/gi, "preferred consultation time")
      .replace(/postal code/gi, "preferred consultation time")
      .replace(/near you/gi, "available online")
      .replace(/nearby/gi, "online")
      .replace(/local clinic/gi, "online consultation")
      .replace(/visit a clinic/gi, "book an online consultation")
      .replace(/in-person visit/gi, "online consultation")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  };

  const send = async () => {
    if (!msg.trim()) return;

    const userText = msg.trim();

    setMessages((prev) => [...prev, { role: "user", text: userText }]);
    setMsg("");
    setLoading(true);

    try {
      const res = await axios.post("http://localhost:8000/api/ai/chat", {
        message: userText,
      });

      let reply = cleanReply(res.data.reply || "I’m here to help.");

      if (
        reply.toLowerCase().includes("doctor near") ||
        reply.toLowerCase().includes("city") ||
        reply.toLowerCase().includes("location")
      ) {
        reply =
          "HealthMate works fully online through secure video consultations.\nI can help you choose the right specialist and book an appointment.";
      }

      setMessages((prev) => [...prev, { role: "bot", text: reply }]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: "bot",
          text: "⚠️ Server error. Please try again shortly.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const quickAsk = (text: string) => setMsg(text);

  return (
    <>
      {/* Floating Button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-5 right-5 z-50 rounded-full bg-blue-600 text-white px-5 py-4 shadow-xl hover:bg-blue-700 transition"
        >
          💬 HealthMate AI
        </button>
      )}

      {/* Chat Window */}
      {open && (
        <div className="fixed bottom-5 right-5 z-50 w-[390px] h-[660px] bg-white rounded-2xl shadow-2xl border flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-blue-600 text-white px-4 py-3 flex justify-between items-center">
            <div>
              <h2 className="font-semibold text-lg">HealthMate AI</h2>
              <p className="text-xs opacity-90">
                Online Health Consultation Assistant
              </p>
            </div>

            <button
              onClick={() => setOpen(false)}
              className="text-2xl hover:opacity-70"
            >
              ×
            </button>
          </div>

          {/* Quick Actions */}
          <div className="p-3 border-b flex gap-2 overflow-x-auto bg-white">
            <button
              onClick={() => quickAsk("I have fever and headache")}
              className="text-xs bg-gray-100 px-3 py-1 rounded-full"
            >
              Fever Help
            </button>

            <button
              onClick={() => quickAsk("Find an online dermatologist")}
              className="text-xs bg-gray-100 px-3 py-1 rounded-full"
            >
              Find Doctor
            </button>

            <button
              onClick={() => quickAsk("How do I book an online appointment?")}
              className="text-xs bg-gray-100 px-3 py-1 rounded-full"
            >
              Booking Help
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-4">
            {messages.map((item, index) => (
              <div
                key={index}
                className={`max-w-[88%] px-4 py-3 rounded-2xl text-sm whitespace-pre-line leading-7 ${
                  item.role === "user"
                    ? "ml-auto bg-blue-600 text-white"
                    : "mr-auto bg-white border text-gray-800"
                }`}
              >
                {item.text}
              </div>
            ))}

            {loading && (
              <div className="mr-auto bg-white border px-4 py-3 rounded-2xl text-sm">
                Typing...
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t bg-white">
            <div className="flex gap-2">
              <input
                className="flex-1 border rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="Ask symptoms, doctors, appointments..."
                value={msg}
                onChange={(e) => setMsg(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send()}
              />

              <button
                onClick={send}
                disabled={loading}
                className="bg-blue-600 text-white px-4 rounded-xl hover:bg-blue-700 disabled:opacity-50"
              >
                ➤
              </button>
            </div>

            <p className="text-[11px] text-gray-400 mt-2">
              Online consultations only. Informational support, not a diagnosis.
            </p>
          </div>
        </div>
      )}
    </>
  );
}