import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiCheckCircle, FiPlus, FiAlertCircle, FiShield } from 'react-icons/fi';
import * as Tone from 'tone';

export const ThoughtCourtScale = ({ activity, onComplete }) => {
    const [worryThought, setWorryThought] = useState('');
    const [evidenceItems, setEvidenceItems] = useState([]);
    const [currentEvidence, setCurrentEvidence] = useState('');

    const synthRef = useRef(null);

    useEffect(() => {
        try {
            synthRef.current = new Tone.Synth({
                oscillator: { type: 'triangle' },
                envelope: { attack: 0.1, decay: 0.3, sustain: 0.5, release: 1 }
            }).toDestination();
            synthRef.current.volume.value = -14;
        } catch (_) { }

        return () => {
            if (synthRef.current) {
                try { synthRef.current.dispose(); } catch (_) { }
            }
        };
    }, []);

    const handleAddEvidence = async () => {
        if (!currentEvidence.trim()) return;

        try {
            if (Tone.context.state !== 'running') {
                await Tone.start();
            }
            if (synthRef.current) {
                const notes = ['G4', 'B4', 'D5', 'G5'];
                const note = notes[Math.min(evidenceItems.length, notes.length - 1)];
                synthRef.current.triggerAttackRelease(note, '8n');
            }
        } catch (_) { }

        setEvidenceItems(prev => [...prev, currentEvidence.trim()]);
        setCurrentEvidence('');
    };

    // Calculate scale tilt angle (-15 deg heavy left worry, 0 deg balanced)
    const getScaleAngle = () => {
        if (!worryThought.trim()) return 0;
        const count = evidenceItems.length;
        if (count === 0) return -15;
        if (count === 1) return -10;
        if (count === 2) return -5;
        return 0; // Balanced!
    };

    const isBalanced = evidenceItems.length >= 2;

    return (
        <div className="flex flex-col items-center justify-center p-6 md:p-8 bg-card-light dark:bg-card-dark rounded-[2.5rem] border border-secondary/20 shadow-lg max-w-xl mx-auto w-full text-center space-y-6">
            {/* Header */}
            <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-500 text-xs font-bold uppercase tracking-wider mb-2">
                    <FiShield className="w-4 h-4" /> CBT Thought Court Scale
                </div>
                <h2 className="text-2xl font-bold text-text-dark dark:text-text-light">
                    {activity?.title || 'Cognitive Reframing Scale'}
                </h2>
                <p className="text-xs sm:text-sm text-text-dark/65 dark:text-text-light/70 mt-1 max-w-md mx-auto">
                    Place an anxious thought on trial. Add objective evidence weights to rebalance your scale.
                </p>
            </div>

            {/* Interactive Animated Balance Scale */}
            <div className="w-full bg-bg-light dark:bg-bg-dark rounded-3xl border border-secondary/15 p-6 space-y-4">
                <div className="relative h-44 flex flex-col items-center justify-end">
                    {/* Scale Stand Base */}
                    <div className="w-4 h-28 bg-secondary/30 rounded-t-full relative flex flex-col items-center justify-start">
                        {/* Scale Pivot Point */}
                        <div className="w-8 h-8 rounded-full bg-primary dark:bg-accent -translate-y-4 shadow-md border-2 border-white/20" />
                    </div>
                    <div className="w-24 h-3 bg-secondary/40 rounded-full" />

                    {/* Rotating Balance Beam */}
                    <motion.div
                        animate={{ rotate: getScaleAngle() }}
                        transition={{ type: 'spring', stiffness: 100, damping: 15 }}
                        className="absolute top-10 w-full max-w-md h-2 bg-secondary/50 rounded-full flex justify-between items-center px-4"
                    >
                        {/* Left Pan: Anxious Thought */}
                        <div className="relative flex flex-col items-center translate-y-12 -translate-x-4">
                            <div className="w-0.5 h-10 bg-secondary/30" />
                            <div className="w-28 sm:w-32 min-h-16 p-2 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs font-medium flex items-center justify-center shadow-md">
                                {worryThought.trim() ? worryThought : '⚡ Type Anxious Thought'}
                            </div>
                        </div>

                        {/* Right Pan: Objective Evidence Weights */}
                        <div className="relative flex flex-col items-center translate-y-12 translate-x-4">
                            <div className="w-0.5 h-10 bg-secondary/30" />
                            <div className="w-28 sm:w-32 min-h-16 p-2 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-medium flex flex-col items-center justify-center shadow-md">
                                {evidenceItems.length === 0 ? (
                                    <span className="text-[10px] text-text-dark/40 dark:text-text-light/40 italic">Add Evidence Weights</span>
                                ) : (
                                    <div className="space-y-0.5 w-full">
                                        {evidenceItems.map((item, idx) => (
                                            <div key={idx} className="bg-emerald-500/20 px-1.5 py-0.5 rounded text-[10px] truncate font-bold">
                                                ⚖️ {item}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Inputs */}
            <div className="w-full space-y-3">
                <input
                    type="text"
                    value={worryThought}
                    onChange={(e) => setWorryThought(e.target.value)}
                    placeholder="1. Enter your anxious thought (e.g. What if I mess up?)"
                    className="w-full px-4 py-2.5 bg-bg-light dark:bg-bg-dark rounded-full text-xs text-text-dark dark:text-text-light border border-secondary/20 outline-none focus:border-rose-400 transition-all"
                />

                <div className="flex gap-2">
                    <input
                        type="text"
                        value={currentEvidence}
                        onChange={(e) => setCurrentEvidence(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddEvidence()}
                        placeholder="2. Add realistic evidence against this thought..."
                        className="flex-1 px-4 py-2.5 bg-bg-light dark:bg-bg-dark rounded-full text-xs text-text-dark dark:text-text-light border border-secondary/20 outline-none focus:border-emerald-400 transition-all"
                    />
                    <button
                        onClick={handleAddEvidence}
                        disabled={!currentEvidence.trim()}
                        className="px-4 py-2.5 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs transition-all cursor-pointer disabled:opacity-30 flex items-center gap-1 shadow-md"
                    >
                        <FiPlus className="w-4 h-4" /> Add Weight
                    </button>
                </div>
            </div>

            {/* Finish Action */}
            {isBalanced && onComplete && (
                <motion.button
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    onClick={onComplete}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-lg transition-all cursor-pointer"
                >
                    <FiCheckCircle className="w-4 h-4" /> Thought Balanced & Re-framed
                </motion.button>
            )}
        </div>
    );
};
