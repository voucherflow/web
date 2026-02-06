"use client";

import { useState } from "react";

type Msg = { role: "user" | "assistant"; content: string };

export default function AssistantPage() {
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", content: "Ask me anything about Section 8 / HUD landlord processes. Example: “What causes HQS inspection failures?”" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const send = async () => {
    const text = input.trim();
    if (!text) return;

    setMessages((m) => [...m, { role: "user", content: text }]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Request failed");

      setMessages((m) => [...m, { role: "assistant", content: json.reply }]);
    } catch (e: any) {
      setMessages((m) => [...m, { role: "assistant", content: `Error: ${e.message}` }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold">VoucherFlow Assistant</h1>
        <p className="mt-2 text-gray-700">
          AI help for HUD landlords: inspections,流程, documents, and next steps.
        </p>
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <div className="space-y-4">
          {messages.map((m, i) => (
            <div key={i} className={m.role === "user" ? "text-right" : "text-left"}>
              <div
                className={[
                  "inline-block max-w-[90%] rounded-xl px-4 py-3",
                  m.role === "user" ? "bg-black text-white" : "bg-gray-100 text-gray-900",
                ].join(" ")}
              >
                {m.content}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex gap-3">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question…"
            className="flex-1 rounded-lg border border-gray-300 bg-white p-2 text-gray-900"
            onKeyDown={(e) => {
              if (e.key === "Enter") send();
            }}
          />
          <button
            onClick={send}
            disabled={loading}
            className="rounded-lg bg-black px-4 py-2 text-white hover:opacity-90 disabled:opacity-60"
          >
            {loading ? "Thinking…" : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
}
