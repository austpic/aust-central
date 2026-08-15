import { ArrowLeft, BookOpen, Phone, Plus, Smile, Send } from 'lucide-react';
import { useChatViewModel } from '../viewmodels/useChatViewModel';

// Mirrors InAppChatPage in lib/screens/book_exchange/in_app_chat_page.dart.
export default function ChatView() {
  const vm = useChatViewModel();
  const hasBook = vm.book !== undefined;

  return (
    <div className="mx-auto flex min-h-svh w-full max-w-3xl flex-col">
      {/* App bar */}
      <div className="flex items-center border-b border-white/40 bg-white/55 px-3 py-3 backdrop-blur-xl">
        <button
          type="button"
          onClick={vm.goBack}
          aria-label="Back"
          className="rounded-full p-2 text-darkgreen"
        >
          <ArrowLeft size={24} />
        </button>
        <span className="glass-tint ml-2 flex h-10 w-10 items-center justify-center rounded-full shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]">
          <span className="text-[15px] font-bold text-darkgreen">
            {vm.sellerName.charAt(0)}
          </span>
        </span>
        <div className="ml-3 flex-1">
          <div className="font-display text-[16px] font-bold tracking-tight text-textdark">{vm.sellerName}</div>
          <div className="font-mono text-[10px] uppercase tracking-[0.08em] text-black54">{vm.subtitle}</div>
        </div>
        <button
          type="button"
          aria-label="Call"
          className="rounded-full p-2 text-darkgreen"
        >
          <Phone size={22} />
        </button>
      </div>

      {/* Book banner */}
      {hasBook && (
        <div className="glass-tint flex items-center px-3 py-3">
          <span className="glass-accent flex h-[52px] w-10 items-center justify-center rounded-md">
            <BookOpen size={20} className="text-white" />
          </span>
          <div className="ml-3 min-w-0 flex-1">
            <div className="truncate text-[13.5px] font-bold text-textdark">
              {vm.book?.title}
            </div>
            <div className="text-[12px] text-black54">
              {vm.book?.course} • {vm.book?.tag}
            </div>
          </div>
          <button
            type="button"
            className="glass-accent rounded-[20px] px-4 py-2 text-[12.5px] font-semibold text-white"
          >
            View Detail
          </button>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {vm.messages.map((message, i) => {
          const isMe = message.sender === 'me';
          return (
            <div key={i} className="mb-2 flex flex-col">
              <div
                className={`max-w-[72%] rounded-2xl px-4 py-3 text-[14px] leading-[1.35] ${
                  isMe
                    ? 'glass-accent self-end rounded-br-md text-white'
                    : 'glass-pill self-start rounded-bl-md text-textdark'
                }`}
              >
                {message.text}
              </div>
              <div
                className={`mt-1 px-1 font-mono text-[10px] uppercase tracking-[0.06em] text-black45 ${
                  isMe ? 'self-end' : 'self-start'
                }`}
              >
                {message.time}
              </div>
              <div className="mb-2" />
            </div>
          );
        })}
      </div>

      {/* Quick replies */}
      <div className="flex gap-3 overflow-x-auto px-3 py-2">
        {vm.quickReplies.map((reply) => (
          <button
            key={reply}
            type="button"
            onClick={() => vm.setDraft(reply)}
            className="glass-pill shrink-0 rounded-[20px] px-4 py-2 text-[12.5px] font-semibold text-darkgreen"
          >
            {reply}
          </button>
        ))}
      </div>

      {/* Input bar */}
      <div className="flex items-center border-t border-white/40 bg-white/55 px-3 py-3 backdrop-blur-xl">
        <button type="button" aria-label="Add" className="rounded-full p-2 text-black/45">
          <Plus size={24} />
        </button>
        <div className="glass-input flex flex-1 items-center rounded-[24px] px-4">
          <input
            type="text"
            value={vm.draft}
            onChange={(e) => vm.setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') vm.send();
            }}
            placeholder="Type a message..."
            className="w-full bg-transparent py-3 text-[14px] text-ink outline-none placeholder:text-black38"
          />
          <Smile size={20} className="text-black38" />
        </div>
        <button
          type="button"
          onClick={vm.send}
          aria-label="Send"
          className="glass-accent ml-2 flex h-10 w-10 items-center justify-center rounded-full text-white"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}
