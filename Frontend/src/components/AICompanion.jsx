import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { aiAPI } from '../services/api';

/* ─────────────────────────────────────────────
   4-pointed sparkle star — matches the reference button design
   ───────────────────────────────────────────── */
const SparkleIcon = ({ className = '' }) => (
    <svg
        viewBox="0 0 24 24"
        fill="currentColor"
        className={className}
        aria-hidden="true"
    >
        {/* Large 4-pointed star: two overlapping diamond shapes */}
        <path d="M12 2C12 2 13.2 8.8 16 12C13.2 15.2 12 22 12 22C12 22 10.8 15.2 8 12C10.8 8.8 12 2 12 2Z" />
        <path d="M2 12C2 12 8.8 10.8 12 8C15.2 10.8 22 12 22 12C22 12 15.2 13.2 12 16C8.8 13.2 2 12 2 12Z" />
        {/* Small accent star top-right */}
        <path d="M18.5 4.5C18.5 4.5 19.1 7.4 20.5 8.5C19.1 9.6 18.5 12.5 18.5 12.5C18.5 12.5 17.9 9.6 16.5 8.5C17.9 7.4 18.5 4.5 18.5 4.5Z" opacity="0.7" />
    </svg>
);


/* ─────────────────────────────────────────────
   Send icon
   ───────────────────────────────────────────── */
const SendIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} className="w-4 h-4" aria-hidden="true">
        <line x1="22" y1="2" x2="11" y2="13" />
        <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
);

/* ─────────────────────────────────────────────
   Close icon
   ───────────────────────────────────────────── */
const CloseIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4" aria-hidden="true">
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
);

/* ─────────────────────────────────────────────
   Typing dots indicator
   ───────────────────────────────────────────── */
const TypingIndicator = () => (
    <div className="flex items-center gap-1 px-4 py-3">
        {[0, 1, 2].map(i => (
            <motion.span
                key={i}
                className="w-2 h-2 rounded-full bg-secondary/60 dark:bg-secondary/50 block"
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
            />
        ))}
    </div>
);

/* ─────────────────────────────────────────────
   Format timestamp
   ───────────────────────────────────────────── */
const formatTime = (date) =>
    date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

/* ─────────────────────────────────────────────
   Quick-starter suggestion chips shown on open
   ───────────────────────────────────────────── */
const SUGGESTION_CHIPS = [
    "How am I doing lately?",
    "Why do I feel stressed?",
    "What should I focus on today?",
    "Give me a calming tip.",
];

/* ═══════════════════════════════════════════════
   Main AICompanion Component
   ═══════════════════════════════════════════════ */
export const AICompanion = ({ userProfile, wellnessScore }) => {
    const [open, setOpen] = useState(false);
    const [messages, setMessages] = useState(() => {
        try {
            const storage = localStorage.getItem('access_token') ? localStorage : sessionStorage;
            const saved = storage.getItem('ai_chat_messages');
            if (saved) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    return parsed.map(m => ({ ...m, ts: new Date(m.ts) }));
                }
            }
        } catch (e) { }
        return [];
    });
    const [inputValue, setInputValue] = useState('');
    const [loading, setLoading] = useState(false);
    const [greeted, setGreeted] = useState(() => {
        try {
            const storage = localStorage.getItem('access_token') ? localStorage : sessionStorage;
            const saved = storage.getItem('ai_chat_messages');
            if (saved) {
                const parsed = JSON.parse(saved);
                return Array.isArray(parsed) && parsed.length > 0;
            }
        } catch (e) { }
        return false;
    });

    const textareaRef = useRef(null);
    const messagesEndRef = useRef(null);
    const panelRef = useRef(null);

    /* ── Persist messages to active session storage ── */
    useEffect(() => {
        if (messages.length > 0) {
            try {
                const storage = localStorage.getItem('access_token') ? localStorage : sessionStorage;
                storage.setItem('ai_chat_messages', JSON.stringify(messages));
            } catch (e) { }
        }
    }, [messages]);

    /* ── Auto-scroll to bottom ── */
    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, []);

    useEffect(() => {
        if (open) scrollToBottom();
    }, [messages, loading, open, scrollToBottom]);

    /* ── Auto-resize textarea ── */
    useEffect(() => {
        const ta = textareaRef.current;
        if (!ta) return;
        ta.style.height = 'auto';
        ta.style.height = `${Math.min(ta.scrollHeight, 120)}px`;
    }, [inputValue]);

    /* ── Greeting on first open ── */
    useEffect(() => {
        if (open && !greeted && messages.length === 0) {
            const name = userProfile?.name?.split(' ')[0] || 'there';
            const score = wellnessScore ?? 72;
            const scoreLabel = score >= 75 ? 'in a great space' : score >= 55 ? 'on a solid path' : 'navigating some challenges';

            const greeting = `Hey ${name}! 🌿 I'm **Compass**, your personal AI companion on Mind Compass.\n\nBased on your recent data, you're ${scoreLabel} right now (wellness score: ${score}/100). I know your patterns, your goals, and what you're working through — I'm here whenever you need to talk, reflect, or just get some perspective.\n\nWhat's on your mind today?`;

            setMessages([{
                id: 'greeting',
                role: 'model',
                content: greeting,
                ts: new Date(),
            }]);
            setGreeted(true);
        }
    }, [open, greeted, messages.length, userProfile, wellnessScore]);

    /* ── Close on outside click ── */
    useEffect(() => {
        if (!open) return;
        const handler = (e) => {
            if (panelRef.current && !panelRef.current.contains(e.target)) {
                // Only close if the click is not on the trigger button (handled by toggle)
                const trigger = document.getElementById('ai-companion-trigger');
                if (trigger && !trigger.contains(e.target)) {
                    setOpen(false);
                }
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [open]);

    /* ── Build history for API ── */
    const buildHistory = () =>
        messages
            .filter(m => m.id !== 'greeting')
            .map(m => ({ role: m.role, content: m.content }));

    /* ── Send message ── */
    const sendMessage = useCallback(async (text) => {
        const content = (text || inputValue).trim();
        if (!content || loading) return;

        const userMsg = {
            id: `u-${Date.now()}`,
            role: 'user',
            content,
            ts: new Date(),
        };

        setMessages(prev => [...prev, userMsg]);
        setInputValue('');
        setLoading(true);

        const history = buildHistory();

        try {
            const res = await aiAPI.chat(content, history);
            const aiMsg = {
                id: `m-${Date.now()}`,
                role: 'model',
                content: res.data.response,
                ts: new Date(),
            };
            setMessages(prev => [...prev, aiMsg]);
        } catch (err) {
            const errMsg = {
                id: `e-${Date.now()}`,
                role: 'model',
                content: "I'm having a little trouble connecting right now. Please try again in a moment — I'm here for you. 💚",
                ts: new Date(),
            };
            setMessages(prev => [...prev, errMsg]);
        } finally {
            setLoading(false);
        }
    }, [inputValue, loading, messages]);

    /* ── Handle textarea key press ── */
    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    /* ── Render bold in model messages (simple **text** parser) ── */
    const renderContent = (text) => {
        const parts = text.split(/(\*\*[^*]+\*\*)/g);
        return parts.map((part, i) => {
            if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong>;
            }
            return <span key={i}>{part}</span>;
        });
    };

    return (
        <>
            {/* ── Circular Glowing-Ring Trigger Button ── */}
            <button
                id="ai-companion-trigger"
                onClick={() => setOpen(prev => !prev)}
                title="Open AI Companion — Compass"
                aria-label="Open AI Companion — Compass"
                className="relative inline-flex items-center justify-center cursor-pointer outline-none group flex-shrink-0"
                style={{ width: 36, height: 36 }}
            >
                {/* Gradient ring — SVG so we can use conic/linear gradient properly */}
                <svg
                    viewBox="0 0 36 36"
                    fill="none"
                    className="absolute inset-0 w-full h-full"
                    style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.5s ease' }}
                    aria-hidden="true"
                >
                    <defs>
                        <linearGradient id="ring-grad-light" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#1E352F" stopOpacity="1" />
                            <stop offset="50%" stopColor="#94A89A" stopOpacity="0.9" />
                            <stop offset="100%" stopColor="#EADEC9" stopOpacity="1" />
                        </linearGradient>
                        <linearGradient id="ring-grad-dark" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#EADEC9" stopOpacity="1" />
                            <stop offset="50%" stopColor="#94A89A" stopOpacity="0.9" />
                            <stop offset="100%" stopColor="#1E352F" stopOpacity="1" />
                        </linearGradient>
                    </defs>
                    {/* Outer glow ring */}
                    <circle cx="18" cy="18" r="16" strokeWidth="2.5"
                        className="stroke-primary/20 dark:stroke-accent/20" fill="none" />
                    {/* Main gradient ring */}
                    <circle cx="18" cy="18" r="16" strokeWidth="2"
                        stroke="url(#ring-grad-light)" fill="none"
                        className="dark:hidden"
                        strokeLinecap="round"
                        strokeDasharray={open ? '100 0' : '72 29'}
                        style={{ transition: 'stroke-dasharray 0.4s ease' }}
                    />
                    <circle cx="18" cy="18" r="16" strokeWidth="2"
                        stroke="url(#ring-grad-dark)" fill="none"
                        className="hidden dark:block"
                        strokeLinecap="round"
                        strokeDasharray={open ? '100 0' : '72 29'}
                        style={{ transition: 'stroke-dasharray 0.4s ease' }}
                    />
                </svg>

                {/* Dark circular center */}
                <span
                    className={`
                        absolute inset-[4px] rounded-full flex items-center justify-center
                        transition-all duration-300
                        ${open
                            ? 'bg-primary dark:bg-card-dark shadow-inner'
                            : 'bg-primary/8 dark:bg-bg-dark/60 group-hover:bg-primary/15 dark:group-hover:bg-card-dark/80'
                        }
                    `}
                >
                    <SparkleIcon
                        className={`w-4 h-4 transition-all duration-300 ${
                            open
                                ? 'text-accent scale-110'
                                : 'text-primary dark:text-accent group-hover:scale-110'
                        }`}
                    />
                </span>

                {/* Ambient glow behind the button */}
                <motion.span
                    className="absolute inset-0 rounded-full pointer-events-none"
                    style={{
                        background: 'radial-gradient(circle, rgba(30,53,47,0.18) 0%, transparent 70%)'
                    }}
                    animate={{ opacity: open ? [0.4, 0.8, 0.4] : [0.1, 0.25, 0.1] }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                />

                {/* Pulse ring when closed */}
                {!open && (
                    <motion.span
                        className="absolute inset-0 rounded-full border border-primary/30 dark:border-accent/25 pointer-events-none"
                        animate={{ scale: [1, 1.55], opacity: [0.5, 0] }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
                    />
                )}
            </button>


            {/* ── Chat Panel ── */}
            <AnimatePresence>
                {open && (
                    <motion.div
                        ref={panelRef}
                        key="companion-panel"
                        initial={{ opacity: 0, scale: 0.95, y: 8 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 8 }}
                        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                        className="
                            fixed z-50
                            bottom-4 right-4
                            w-[calc(100vw-2rem)] sm:w-[420px]
                            h-[75vh] sm:h-[600px] max-h-[680px]
                            bg-white dark:bg-card-dark
                            border border-secondary/20 dark:border-secondary/10
                            rounded-3xl shadow-2xl
                            flex flex-col overflow-hidden
                        "
                        style={{
                            boxShadow: '0 25px 60px -10px rgba(30,53,47,0.18), 0 10px 30px -5px rgba(30,53,47,0.10)'
                        }}
                    >
                        {/* ── Header ── */}
                        <div className="flex items-center gap-3 px-5 py-4 border-b border-secondary/10 dark:border-secondary/5 bg-primary dark:bg-card-dark flex-shrink-0">
                            {/* Avatar */}
                            <div className="relative flex-shrink-0">
                                <div className="w-9 h-9 rounded-full bg-accent/20 dark:bg-accent/10 flex items-center justify-center">
                                    <SparkleIcon className="w-4 h-4 text-accent dark:text-accent" />
                                </div>
                                {/* Online dot */}
                                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 border-2 border-primary dark:border-card-dark rounded-full" />
                            </div>

                            {/* Name + subtitle */}
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-text-light leading-tight">Compass</p>
                                <p className="text-[11px] text-text-light/60 leading-tight">Your AI Mental Health Companion</p>
                            </div>

                            {/* Close btn */}
                            <button
                                onClick={() => setOpen(false)}
                                aria-label="Close companion chat"
                                className="w-7 h-7 rounded-full flex items-center justify-center text-text-light/60 hover:text-text-light hover:bg-white/10 transition-all cursor-pointer outline-none"
                            >
                                <CloseIcon />
                            </button>
                        </div>

                        {/* ── Messages Area ── */}
                        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 scroll-smooth">

                            {/* Suggestion chips — only when chat is just greeting */}
                            {messages.length <= 1 && !loading && (
                                <motion.div
                                    initial={{ opacity: 0, y: 6 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.4 }}
                                    className="flex flex-wrap gap-2 mb-2"
                                >
                                    {SUGGESTION_CHIPS.map((chip, i) => (
                                        <button
                                            key={i}
                                            onClick={() => sendMessage(chip)}
                                            className="
                                                text-[11px] font-medium px-3 py-1.5 rounded-full cursor-pointer
                                                border border-secondary/25 dark:border-secondary/15
                                                text-text-dark/70 dark:text-text-light/65
                                                bg-secondary/8 dark:bg-secondary/5
                                                hover:bg-primary/10 hover:text-primary
                                                dark:hover:bg-accent/10 dark:hover:text-accent
                                                transition-all duration-200
                                            "
                                        >
                                            {chip}
                                        </button>
                                    ))}
                                </motion.div>
                            )}

                            {/* Message Bubbles */}
                            <AnimatePresence initial={false}>
                                {messages.map((msg) => (
                                    <motion.div
                                        key={msg.id}
                                        initial={{ opacity: 0, y: 8, scale: 0.97 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0 }}
                                        transition={{ duration: 0.25 }}
                                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} gap-2`}
                                    >
                                        {/* Companion avatar (left) */}
                                        {msg.role === 'model' && (
                                            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 dark:bg-accent/10 flex items-center justify-center mt-1">
                                                <SparkleIcon className="w-3 h-3 text-primary dark:text-accent" />
                                            </div>
                                        )}

                                        <div className={`max-w-[82%] ${msg.role === 'user' ? '' : ''}`}>
                                            {/* Bubble */}
                                            <div
                                                className={`
                                                    px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap
                                                    ${msg.role === 'user'
                                                        ? 'bg-primary text-text-light dark:bg-accent dark:text-bg-dark rounded-tr-sm'
                                                        : 'bg-secondary/8 dark:bg-secondary/10 text-text-dark dark:text-text-light border border-secondary/10 dark:border-secondary/5 rounded-tl-sm'
                                                    }
                                                `}
                                            >
                                                {msg.role === 'model' ? renderContent(msg.content) : msg.content}
                                            </div>
                                            {/* Timestamp */}
                                            <p className={`text-[10px] mt-1 text-text-dark/35 dark:text-text-light/30 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                                                {formatTime(msg.ts)}
                                            </p>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>

                            {/* Typing indicator */}
                            {loading && (
                                <motion.div
                                    initial={{ opacity: 0, y: 6 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="flex items-start gap-2"
                                >
                                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 dark:bg-accent/10 flex items-center justify-center mt-1">
                                        <SparkleIcon className="w-3 h-3 text-primary dark:text-accent" />
                                    </div>
                                    <div className="bg-secondary/8 dark:bg-secondary/10 border border-secondary/10 dark:border-secondary/5 rounded-2xl rounded-tl-sm">
                                        <TypingIndicator />
                                    </div>
                                </motion.div>
                            )}

                            <div ref={messagesEndRef} />
                        </div>

                        {/* ── Input Area ── */}
                        <div className="flex-shrink-0 border-t border-secondary/10 dark:border-secondary/5 px-4 py-3 bg-white dark:bg-card-dark">
                            <div className="flex items-end gap-2">
                                <textarea
                                    ref={textareaRef}
                                    id="ai-companion-input"
                                    value={inputValue}
                                    onChange={e => setInputValue(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Ask Compass anything…"
                                    disabled={loading}
                                    rows={1}
                                    aria-label="Message input"
                                    className="
                                        flex-1 resize-none rounded-2xl border border-secondary/20 dark:border-secondary/10
                                        bg-secondary/5 dark:bg-secondary/5
                                        px-4 py-2.5 text-sm
                                        text-text-dark dark:text-text-light
                                        placeholder:text-text-dark/35 dark:placeholder:text-text-light/30
                                        focus:outline-none focus:ring-2 focus:ring-primary/30 dark:focus:ring-accent/30
                                        transition-all duration-200
                                        disabled:opacity-50
                                        leading-relaxed max-h-[120px] overflow-y-auto
                                    "
                                    style={{ scrollbarWidth: 'none' }}
                                />
                                <motion.button
                                    onClick={() => sendMessage()}
                                    disabled={!inputValue.trim() || loading}
                                    aria-label="Send message"
                                    whileTap={{ scale: 0.92 }}
                                    className="
                                        flex-shrink-0 w-9 h-9 rounded-full
                                        bg-primary dark:bg-accent
                                        text-text-light dark:text-bg-dark
                                        flex items-center justify-center
                                        transition-all duration-200
                                        disabled:opacity-40 disabled:cursor-not-allowed
                                        hover:opacity-90 cursor-pointer
                                    "
                                >
                                    <SendIcon />
                                </motion.button>
                            </div>
                            <p className="text-[10px] text-center text-text-dark/25 dark:text-text-light/20 mt-2 leading-tight">
                                Compass uses your Mind Compass data · Not a substitute for professional care
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default AICompanion;
