import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiActivity, FiPlus, FiCheckCircle } from 'react-icons/fi';
import * as Tone from 'tone';

export const ZenRiverThoughts = ({ activity, onComplete }) => {
    const [thoughtInput, setThoughtInput] = useState('');
    const [leaves, setLeaves] = useState([
        { id: 1, text: 'Worrying about tomorrow' },
        { id: 2, text: 'Rushing to finish work' }
    ]);
    const [releasedCount, setReleasedCount] = useState(0);

    const synthRef = useRef(null);

    useEffect(() => {
        try {
            synthRef.current = new Tone.Synth({
                oscillator: { type: 'sine' },
                envelope: { attack: 0.05, decay: 0.4, sustain: 0.1, release: 0.8 }
            }).toDestination();
            synthRef.current.volume.value = -16;
        } catch (_) { }

        return () => {
            if (synthRef.current) {
                try { synthRef.current.dispose(); } catch (_) { }
            }
        };
    }, []);

    const handleAddLeaf = () => {
        if (!thoughtInput.trim()) return;
        const newLeaf = {
            id: Date.now(),
            text: thoughtInput.trim()
        };
        setLeaves(prev => [...prev, newLeaf]);
        setThoughtInput('');
    };

    const handleReleaseLeaf = async (id) => {
        try {
            if (Tone.context.state !== 'running') {
                await Tone.start();
            }
            if (synthRef.current) {
                synthRef.current.triggerAttackRelease('A4', '8n');
            }
        } catch (_) { }

        setLeaves(prev => prev.filter(l => l.id !== id));
        setReleasedCount(c => c + 1);
    };

    return (
        <div className="flex flex-col items-center justify-center py-4 max-w-xl mx-auto w-full text-center space-y-6">
            {/* River Canvas Display */}
            <div className="w-full relative h-64 bg-gradient-to-b from-emerald-900/20 via-teal-900/30 to-cyan-950 rounded-3xl border border-secondary/20 p-4 overflow-hidden flex flex-col justify-between shadow-inner">
                {/* Gentle Water Currents */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,_var(--tw-gradient-stops))] from-teal-500/10 via-transparent to-transparent pointer-events-none" />

                {/* Floating Leaves */}
                <div className="relative z-10 space-y-3 py-4">
                    <AnimatePresence>
                        {leaves.map((leaf) => (
                            <motion.div
                                key={leaf.id}
                                initial={{ x: -100, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                exit={{ x: 200, opacity: 0 }}
                                transition={{ duration: 0.8 }}
                                onClick={() => handleReleaseLeaf(leaf.id)}
                                className="flex items-center gap-2 bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 px-4 py-2 rounded-full text-xs font-semibold w-fit mx-auto cursor-pointer hover:bg-emerald-500/30 transition-all shadow-md active:scale-95"
                            >
                                🍃 "{leaf.text}" <span className="text-[10px] opacity-60">(tap to float)</span>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                    {leaves.length === 0 && (
                        <p className="text-xs text-teal-200/50 italic">The stream is calm. Add a thought below to place it on a leaf.</p>
                    )}
                </div>

                {/* Status bar */}
                <div className="relative z-10 text-[11px] text-teal-200/70 font-medium">
                    Thoughts Released Downstream: <span className="text-teal-300 font-extrabold">{releasedCount}</span>
                </div>
            </div>

            {/* Input Form */}
            <div className="flex flex-col sm:flex-row gap-2 w-full">
                <input
                    type="text"
                    value={thoughtInput}
                    onChange={(e) => setThoughtInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddLeaf()}
                    placeholder="Place a thought on a leaf (e.g. Feeling overwhelmed...)"
                    className="flex-1 px-4 py-2.5 bg-bg-light dark:bg-bg-dark rounded-full text-xs text-text-dark dark:text-text-light border border-secondary/20 outline-none focus:border-teal-400 transition-all"
                />
                <button
                    onClick={handleAddLeaf}
                    disabled={!thoughtInput.trim()}
                    className="px-5 py-2.5 rounded-full bg-teal-500 hover:bg-teal-600 text-white font-bold text-xs transition-all cursor-pointer disabled:opacity-30 flex items-center gap-1 shadow-md"
                >
                    <FiPlus className="w-4 h-4" /> Add Leaf
                </button>
            </div>

            {/* Finish Action */}
            {onComplete && (
                <button
                    onClick={onComplete}
                    className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-full bg-primary hover:bg-primary-hover dark:bg-accent dark:hover:bg-accent-hover text-white dark:text-bg-dark font-bold text-xs shadow-md transition-all cursor-pointer"
                >
                    <FiCheckCircle className="w-4 h-4" /> Finish River Practice
                </button>
            )}
        </div>
    );
};
