import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiAward, FiRotateCcw, FiCheckCircle } from 'react-icons/fi';
import * as Tone from 'tone';

const NOTES = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5', 'D5', 'E5'];

export const ZenCountingStreak = ({ activity, onComplete }) => {
    const [currentCount, setCurrentCount] = useState(1);
    const [streakScore, setStreakScore] = useState(0);
    const [highStreak, setHighStreak] = useState(0);

    const synthRef = useRef(null);

    useEffect(() => {
        try {
            synthRef.current = new Tone.Synth({
                oscillator: { type: 'sine' },
                envelope: { attack: 0.1, decay: 0.3, sustain: 0.5, release: 0.8 }
            }).toDestination();
            synthRef.current.volume.value = -14;
        } catch (_) { }
        return () => {
            if (synthRef.current) {
                try { synthRef.current.dispose(); } catch (_) { }
            }
        };
    }, []);

    const handleCountBreath = async () => {
        try {
            if (Tone.context.state !== 'running') {
                await Tone.start();
            }
            if (synthRef.current) {
                const note = NOTES[(currentCount - 1) % NOTES.length];
                synthRef.current.triggerAttackRelease(note, '8n');
            }
        } catch (_) { }

        if (currentCount === 10) {
            setCurrentCount(1);
            const nextStreak = streakScore + 10;
            setStreakScore(nextStreak);
            if (nextStreak > highStreak) setHighStreak(nextStreak);
        } else {
            setCurrentCount(prev => prev + 1);
            setStreakScore(prev => prev + 1);
        }
    };

    const handleReset = () => {
        setCurrentCount(1);
        setStreakScore(0);
    };

    return (
        <div className="flex flex-col items-center justify-center py-4 max-w-xl mx-auto w-full text-center space-y-6">
            {/* Streak Counter Canvas */}
            <div className="w-full bg-bg-light dark:bg-bg-dark rounded-3xl border border-secondary/15 p-8 flex flex-col items-center justify-center space-y-4">
                <div className="flex gap-6 text-xs font-bold text-text-dark/60 dark:text-text-light/60 uppercase tracking-widest">
                    <span>Current Streak: <strong className="text-primary dark:text-accent font-extrabold text-sm">{streakScore}</strong></span>
                    <span>Best Streak: <strong className="text-emerald-500 font-extrabold text-sm">{highStreak}</strong></span>
                </div>

                {/* Big Interactive Counting Orb Button */}
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={handleCountBreath}
                    className="w-36 h-36 sm:w-44 sm:h-44 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-black text-4xl sm:text-5xl shadow-xl flex flex-col items-center justify-center cursor-pointer ring-4 ring-purple-400/30"
                >
                    <span>{currentCount}</span>
                    <span className="text-[10px] font-extrabold tracking-widest uppercase text-white/80 mt-1">Tap Exhale</span>
                </motion.button>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-3">
                <button
                    onClick={handleReset}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-secondary/20 hover:bg-secondary/10 text-text-dark dark:text-text-light text-xs font-bold transition-all cursor-pointer"
                >
                    <FiRotateCcw className="w-3.5 h-3.5" /> Reset Streak
                </button>
                {onComplete && (
                    <button
                        onClick={onComplete}
                        className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-full bg-primary hover:bg-primary-hover dark:bg-accent dark:hover:bg-accent-hover text-white dark:text-bg-dark font-bold text-xs shadow-md transition-all cursor-pointer"
                    >
                        <FiCheckCircle className="w-4 h-4" /> Finish Focus Game
                    </button>
                )}
            </div>
        </div>
    );
};
