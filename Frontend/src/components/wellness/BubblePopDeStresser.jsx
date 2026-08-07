import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiRotateCcw, FiSmile, FiCheckCircle } from 'react-icons/fi';
import * as Tone from 'tone';

const GRID_SIZE = 25; // 5x5 grid

const BUBBLE_COLORS = [
    'from-pink-400 to-rose-500',
    'from-purple-400 to-indigo-500',
    'from-teal-400 to-emerald-500',
    'from-sky-400 to-blue-500',
    'from-amber-400 to-orange-500'
];

const NOTES = ['C4', 'E4', 'G4', 'B4', 'C5', 'D5', 'E5', 'G5'];

export const BubblePopDeStresser = ({ activity, onComplete }) => {
    const [bubbles, setBubbles] = useState(() =>
        Array.from({ length: GRID_SIZE }, (_, i) => ({
            id: i,
            popped: false,
            color: BUBBLE_COLORS[i % BUBBLE_COLORS.length]
        }))
    );
    const [popCount, setPopCount] = useState(0);
    const synthRef = useRef(null);

    // Initialize Tone.js Synth for pop sounds
    useEffect(() => {
        try {
            synthRef.current = new Tone.PluckSynth({
                attackNoise: 1,
                dampening: 4000,
                resonance: 0.9
            }).toDestination();
            synthRef.current.volume.value = -12;
        } catch (_) { }

        return () => {
            if (synthRef.current) {
                try { synthRef.current.dispose(); } catch (_) { }
            }
        };
    }, []);

    const handlePop = async (id) => {
        // Audio trigger
        try {
            if (Tone.context.state !== 'running') {
                await Tone.start();
            }
            if (synthRef.current) {
                const note = NOTES[id % NOTES.length];
                synthRef.current.triggerAttackRelease(note, '16n');
            }
        } catch (_) { }

        setBubbles(prev =>
            prev.map(b => (b.id === id ? { ...b, popped: true } : b))
        );
        setPopCount(c => c + 1);
    };

    const handleReset = () => {
        setBubbles(
            Array.from({ length: GRID_SIZE }, (_, i) => ({
                id: i,
                popped: false,
                color: BUBBLE_COLORS[i % BUBBLE_COLORS.length]
            }))
        );
    };

    const totalPoppedInGrid = bubbles.filter(b => b.popped).length;
    const progressPercent = Math.round((totalPoppedInGrid / GRID_SIZE) * 100);

    return (
        <div className="flex flex-col items-center justify-center py-4 max-w-xl mx-auto w-full text-center space-y-6">
            {/* Stress Relief Progress Bar */}
            <div className="w-full space-y-1">
                <div className="flex justify-between text-xs font-semibold text-text-dark/60 dark:text-text-light/60 px-1">
                    <span>Tension Cleared</span>
                    <span className="font-bold text-primary dark:text-accent">{progressPercent}%</span>
                </div>
                <div className="w-full bg-secondary/10 rounded-full h-2.5 overflow-hidden">
                    <motion.div
                        className="bg-gradient-to-r from-teal-400 to-rose-400 h-full rounded-full"
                        animate={{ width: `${progressPercent}%` }}
                        transition={{ duration: 0.3 }}
                    />
                </div>
            </div>

            {/* 5x5 Bubble Matrix */}
            <div className="grid grid-cols-5 gap-1.5 sm:gap-3 p-2.5 sm:p-4 bg-secondary/5 rounded-3xl border border-secondary/10">
                {bubbles.map(bubble => (
                    <motion.button
                        key={bubble.id}
                        whileHover={{ scale: bubble.popped ? 1 : 1.1 }}
                        whileTap={{ scale: 0.85 }}
                        onClick={() => !bubble.popped && handlePop(bubble.id)}
                        className={`w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 shadow-md ${bubble.popped
                                ? 'bg-secondary/10 border border-secondary/10 scale-90 opacity-40 shadow-inner'
                                : `bg-gradient-to-br ${bubble.color} shadow-lg hover:brightness-110 active:shadow-sm ring-2 ring-white/20`
                            }`}
                    >
                        <AnimatePresence>
                            {!bubble.popped ? (
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    exit={{ scale: 0 }}
                                    className="w-3 h-3 bg-white/40 rounded-full -translate-x-1.5 -translate-y-1.5 blur-[0.5px]"
                                />
                            ) : (
                                <motion.span
                                    initial={{ scale: 0, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className="text-xs font-black text-text-dark/30 dark:text-text-light/30"
                                >
                                    ✓
                                </motion.span>
                            )}
                        </AnimatePresence>
                    </motion.button>
                ))}
            </div>

            {/* Total Pops Stats */}
            <div className="text-xs font-bold text-text-dark/50 dark:text-text-light/50 uppercase tracking-widest">
                Total Pops Completed: <span className="text-primary dark:text-accent font-extrabold text-sm">{popCount}</span>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-3 pt-2">
                <button
                    onClick={handleReset}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-secondary/20 hover:bg-secondary/10 text-text-dark dark:text-text-light text-xs font-bold transition-all cursor-pointer"
                >
                    <FiRotateCcw className="w-3.5 h-3.5" /> Reset Bubble Grid
                </button>
                {onComplete && (
                    <button
                        onClick={onComplete}
                        className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-primary hover:bg-primary-hover dark:bg-accent dark:hover:bg-accent-hover text-white dark:text-bg-dark font-bold text-xs shadow-md transition-all cursor-pointer"
                    >
                        <FiCheckCircle className="w-4 h-4" /> Done Feeling Relaxed
                    </button>
                )}
            </div>
        </div>
    );
};
