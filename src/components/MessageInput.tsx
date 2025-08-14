// src/components/MessageInput.tsx
import React, { useState, KeyboardEvent } from "react";
import { Send, Loader2 } from "lucide-react";

interface MessageInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

const MessageInput: React.FC<MessageInputProps> = ({
  onSendMessage,
  disabled = false,
  placeholder = "Type your message...",
}) => {
  const [message, setMessage] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSendMessage(message.trim());
      setMessage("");
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (message.trim() && !disabled) {
        onSendMessage(message.trim());
        setMessage("");
      }
    }
  };

  return (
    <div className="flex-shrink-0 p-4 bg-slate-900/60 backdrop-blur border-t border-white/10">
      <form onSubmit={handleSubmit} className="flex items-end gap-3">
        {/* Textarea Input */}
        <div className="flex-1">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            rows={1}
            className="w-full px-4 py-3 bg-white/10 text-white placeholder:text-slate-300 border border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/60 focus:border-transparent resize-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ maxHeight: "120px" }}
          />
        </div>

        {/* Send Button */}
        <button
          type="submit"
          disabled={!message.trim() || disabled}
          className="flex-shrink-0 w-10 h-10 bg-gradient-to-r from-teal-500 via-cyan-500 to-indigo-500 hover:from-teal-400 hover:via-cyan-400 hover:to-indigo-400 disabled:from-slate-600 disabled:to-slate-600 text-white rounded-full flex items-center justify-center transition-colors disabled:cursor-not-allowed shadow-lg"
        >
          {disabled ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <Send size={18} />
          )}
        </button>
      </form>
    </div>
  );
};

export default MessageInput;
