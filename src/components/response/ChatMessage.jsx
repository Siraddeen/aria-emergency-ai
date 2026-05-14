import { useEffect } from "react";
import ResponseCard from "./ResponseCard";

export default function ChatMessage({ message, setActiveCriticalAlert }) {
  const time = new Date(message.timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  // USER MESSAGE
  if (message.role === "user")
    return (
      <div className="flex flex-col items-end gap-1">
        <div className="bg-gradient-to-br from-[#0099ff] to-[#0077cc] text-white px-3.5 py-2.5 rounded-2xl rounded-br-sm max-w-[78%] text-[15px] leading-relaxed font-medium">
          {message.text}
        </div>

        <span className="font-mono text-[10px] text-[#4a5568] px-1">
          {time}
        </span>
      </div>
    );

  // ERROR MESSAGE
  if (message.role === "error")
    return (
      <div className="bg-red-900/20 border border-red-500/30 rounded-lg px-3.5 py-2.5 text-[#ff4444] text-sm">
        ⚠ {message.text}
      </div>
    );

  // ASSISTANT MESSAGE
  if (message.role === "assistant" && message.response)
    return (
      <div
        id={`message-${message.id}`}
        className="flex flex-col items-start gap-1"
      >
        {" "}
        <ResponseCard response={message.response} />
        <span className="font-mono text-[10px] text-[#4a5568] px-1">
          {time}
        </span>
      </div>
    );

  return null;
}
