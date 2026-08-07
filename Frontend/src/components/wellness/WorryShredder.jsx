import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiTrash2, FiSend, FiRefreshCw, FiCheckCircle } from 'react-icons/fi';
import * as Tone from 'tone';

const AFFIRMATIONS = [
    "You have let go of this thought. Your mind is now clear and calm.",
    "This thought does not control your peace. You are grounded and present.",
    "Breathe deeply. What is behind you cannot define this present moment.",
    "You are resilient, strong, and capable of handling whatever comes next.",
    "Your mind is a peaceful sanctuary. All tension has dissolved."
];

export const WorryShredder = ({ activity, onComplete }) => {
    const [worryText, setWorryText] = useState('');
    const [mode, setMode] = useState('shred'); // 'shred' | 'burn' | 'float' | 'launch'
    const [isReleasing, setIsReleasing] = useState(false);
    const [isReleased, setIsReleased] = useState(false);
    const [affirmation, setAffirmation] = useState('');

    const synthRef = useRef(null);

    const handleRelease = async () => {
        if (!worryText.trim()) return;

        setIsReleasing(true);

        // Sound effect
        try {
            if (Tone.context.state !== 'running') {
                await Tone.start();
            }
            const noise = new Tone.NoiseSynth({
                noise: { type: 'pink' },
                envelope: { attack: 0.1, decay: 0.8, sustain: 0 }
            }).toDestination();
            noise.volume.value = -12;
            noise.triggerAttackRelease('8n');
        } catch (_) { }

        setTimeout(() => {
            setIsReleasing(false);
            setIsReleased(true);
            setAffirmation(AFFIRMATIONS[Math.floor(Math.random() * AFFIRMATIONS.length)]);
        }, 2200);
    };

    const handleReset = () => {
        setWorryText('');
        setIsReleasing(false);
        setIsReleased(false);
    };

    return (
        <div className="flex flex-col items-center justify-center p-6 md:p-8 bg-card-light dark:bg-card-dark rounded-[2.5rem] border border-secondary/20 shadow-lg max-w-xl mx-auto w-full text-center space-y-6 overflow-hidden">
            {/* Header */}
            <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-bold uppercase tracking-wider mb-2">
                    <FiTrash2 className="w-4 h-4" /> Thought Shredder & Catharsis
                </div>
                <h2 className="text-2xl font-bold text-text-dark dark:text-text-light">
                    {activity?.title || 'Worry Release Shredder'}
                </h2>
                <p className="text-xs sm:text-sm text-text-dark/65 dark:text-text-light/70 mt-1 max-w-md mx-auto">
                    Type out what is stressing you out right now and release it visually to free your working memory.
                </p>
            </div>

            {/* Input & Release Animations */}
            <div className="w-full relative min-h-[220px] flex items-center justify-center">
                <AnimatePresence mode="wait">
                    {!isReleased ? (
                        <motion.div
                            key="input-form"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="w-full space-y-4"
                        >
                            {/* Mode Selectors */}
                            <div className="flex items-center justify-center gap-2">
                                {[
                                    { id: 'shred', label: '✂️ Shred Paper' },
                                    { id: 'burn', label: '🔥 Burn Away' },
                                    { id: 'float', label: '🎈 Float Away' },
                                    { id: 'launch', label: '🚀 Launch Space' }
                                ].map(m => (
                                    <button
                                        key={m.id}
                                        onClick={() => setMode(m.id)}
                                        className={`text-xs px-3 py-1.5 rounded-full font-semibold transition-all cursor-pointer ${mode === m.id
                                                ? 'bg-secondary text-white font-bold shadow-sm'
                                                : 'bg-secondary/10 text-text-dark dark:text-text-light hover:bg-secondary/20'
                                            }`}
                                    >
                                        {m.label}
                                    </button>
                                ))}
                            </div>

                            {/* Animated Textbox Container */}
                            <div className="relative overflow-hidden rounded-2xl border border-secondary/20 bg-bg-light dark:bg-bg-dark p-2">
                                {isReleasing && (
                                    <motion.div
                                        className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                    >
                                        {mode === 'shred' && (
                                            <motion.div
                                                animate={{ y: [0, 200], opacity: [1, 0] }}
                                                transition={{ duration: 2 }}
                                                className="flex gap-2 text-primary font-mono text-xs font-bold"
                                            >
                                                <span>||||| SHREDDING |||||</span>
                                            </motion.div>
                                        )}
                                        {mode === 'burn' && (
                                            <motion.div
                                                animate={{ scale: [1, 1.8], opacity: [1, 0] }}
                                                transition={{ duration: 2 }}
                                                className="text-4xl"
                                            >
                                                🔥🔥🔥
                                            </motion.div>
                                        )}
                                        {mode === 'float' && (
                                            <motion.div
                                                animate={{ y: [0, -250], opacity: [1, 0] }}
                                                transition={{ duration: 2 }}
                                                className="text-4xl"
                                            >
                                                🎈☁️
                                            </motion.div>
                                        )}
                                        {mode === 'launch' && (
                                            <motion.div
                                                animate={{ y: [0, -300], scale: [1, 0.2] }}
                                                transition={{ duration: 2 }}
                                                className="text-4xl"
                                            >
                                                🚀✨
                                            </motion.div>
                                        )}
                                    </motion.div>
                                )}

                                <textarea
                                    value={worryText}
                                    onChange={(e) => setWorryText(e.target.value)}
                                    disabled={isReleasing}
                                    placeholder="Write your stressful thought here without judging yourself..."
                                    className={`w-full h-32 p-3 bg-transparent text-sm text-text-dark dark:text-text-light outline-none resize-none transition-all duration-700 ${isReleasing ? 'blur-sm opacity-20 scale-95' : ''
                                        }`}
                                />
                            </div>

                            <button
                                onClick={handleRelease}
                                disabled={!worryText.trim() || isReleasing}
                                className="inline-flex items-center justify-center gap-2 w-full py-3 rounded-full bg-primary hover:bg-primary-hover dark:bg-accent dark:hover:bg-accent-hover text-white dark:text-bg-dark font-bold text-sm shadow-md transition-all cursor-pointer disabled:opacity-40"
                            >
                                <FiSend className="w-4 h-4" /> Release & Destroy Thought
                            </button>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="affirmation-result"
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            className="space-y-6 py-6"
                        >
                            <div className="w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto text-3xl">
                                ✨
                            </div>
                            <h3 className="text-lg font-bold text-text-dark dark:text-text-light">
                                Thought Destroyed!
                            </h3>
                            <p className="text-sm font-medium text-text-dark/80 dark:text-text-light/80 bg-secondary/10 p-4 rounded-2xl border border-secondary/15 italic max-w-md mx-auto">
                                "{affirmation}"
                            </p>
                            <div className="flex justify-center gap-3">
                                <button
                                    onClick={handleReset}
                                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-secondary/20 hover:bg-secondary/10 text-text-dark dark:text-text-light text-xs font-bold transition-all cursor-pointer"
                                >
                                    <FiRefreshCw className="w-3.5 h-3.5" /> Release Another Thought
                                </button>
                                {onComplete && (
                                    <button
                                        onClick={onComplete}
                                        className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-primary hover:bg-primary-hover dark:bg-accent dark:hover:bg-accent-hover text-white dark:text-bg-dark font-bold text-xs shadow-md transition-all cursor-pointer"
                                    >
                                        <FiCheckCircle className="w-4 h-4" /> Finish Session
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};
