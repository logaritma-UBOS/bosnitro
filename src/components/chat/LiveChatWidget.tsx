"use client";
import { useState, useEffect, useRef } from "react";
import { sendMessage, getChatHistory, getUnreadAdminMessages, markMessagesAsRead } from "@/actions/chat";

export default function LiveChatWidget({ userId }: { userId: string }) {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<any[]>([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const endRef = useRef<HTMLDivElement>(null);

    const fetchMessages = async () => {
        const res = await getChatHistory(userId);
        setMessages(res);
    };

    const fetchUnread = async () => {
        if (isOpen) return;
        const count = await getUnreadAdminMessages(userId);
        setUnreadCount(count);
    };

    useEffect(() => {
        const handleOpenChat = () => handleOpen();
        window.addEventListener('open-live-chat', handleOpenChat);
        return () => window.removeEventListener('open-live-chat', handleOpenChat);
    }, []);

    useEffect(() => {
        // Poll for unread when closed, poll messages when open
        if (isOpen) {
            fetchMessages();
            markMessagesAsRead(userId);
            setUnreadCount(0);
        }
        const interval = setInterval(() => {
            if (isOpen) {
                fetchMessages();
            } else {
                fetchUnread();
            }
        }, 5000);
        return () => clearInterval(interval);
    }, [isOpen]);

    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleOpen = () => {
        setIsOpen(true);
        setUnreadCount(0);
        markMessagesAsRead(userId);
    };

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;
        setLoading(true);
        const tempMsg = input;
        setInput("");
        await sendMessage(userId, tempMsg, "USER");
        await fetchMessages();
        setLoading(false);
    };

    return (
        <div className={`fixed bottom-24 right-4 z-[9999] md:bottom-6 md:right-6 ${!isOpen ? 'hidden md:block' : ''}`}>
            {isOpen ? (
                <div className="w-80 h-[420px] bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden">
                    {/* Header */}
                    <div className="bg-indigo-600 p-4 text-white flex justify-between items-center flex-shrink-0">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                            <span className="font-bold text-sm">Live Support UBOS</span>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="hover:text-gray-200 p-1">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
                        </button>
                    </div>
                    {/* Messages */}
                    <div className="flex-1 p-4 overflow-y-auto bg-gray-50 flex flex-col gap-3">
                        <div className="text-center text-xs text-gray-400">Pesan Anda dibalas oleh Tim UBOS.</div>
                        {messages.map(msg => (
                            <div key={msg.id} className={`flex ${msg.senderRole === "USER" ? "justify-end" : "justify-start"}`}>
                                {msg.senderRole === "ADMIN" && (
                                    <div className="w-6 h-6 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center mr-1.5 flex-shrink-0 mt-auto">U</div>
                                )}
                                <div className={`max-w-[75%] p-3 rounded-2xl text-sm leading-relaxed ${msg.senderRole === "USER" ? "bg-indigo-600 text-white rounded-tr-none" : "bg-white border border-gray-200 text-gray-800 rounded-tl-none shadow-sm"}`}>
                                    {msg.message}
                                </div>
                            </div>
                        ))}
                        {messages.length === 0 && (
                            <div className="text-center text-xs text-gray-400 mt-4">Belum ada pesan. Kirim pertanyaan Anda!</div>
                        )}
                        <div ref={endRef} />
                    </div>
                    {/* Input */}
                    <form onSubmit={handleSend} className="p-3 bg-white border-t border-gray-100 flex gap-2 flex-shrink-0">
                        <input
                            type="text"
                            disabled={loading}
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            placeholder="Ketik pesan..."
                            className="flex-1 border border-gray-200 bg-gray-50 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                        <button
                            disabled={loading || !input.trim()}
                            type="submit"
                            className="bg-indigo-600 text-white p-2 rounded-xl hover:bg-indigo-700 disabled:opacity-50 flex-shrink-0"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/></svg>
                        </button>
                    </form>
                </div>
            ) : (
                <button
                    onClick={handleOpen}
                    className="hidden md:flex relative w-12 h-12 bg-indigo-600 rounded-full shadow-lg items-center justify-center text-white hover:bg-indigo-700 hover:scale-105 transition-all"
                >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                    {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-white text-[10px] font-black flex items-center justify-center border-2 border-white animate-bounce">
                            {unreadCount > 9 ? "9+" : unreadCount}
                        </span>
                    )}
                </button>
            )}
        </div>
    );
}
