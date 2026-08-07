import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMoon, FiPlay, FiPause, FiRotateCcw, FiCheckCircle } from 'react-icons/fi';
import * as Tone from 'tone';

const PEACEFUL_WORDS = [
    { word: 'Cloud ☁️', desc: 'Soft white puffy cumulus floating in blue sky' },
    { word: 'Candle 🕯️', desc: 'Warm gentle flickering yellow flame on wooden table' },
    { word: 'Pebble 🪨', desc: 'Smooth rounded grey stone resting by a cool stream' },
    { word: 'Feather 🪶', desc: 'Light downy white feather drifting on a warm breeze' },
    { word: 'Forest 🌲', desc: 'Quiet tall pine trees with sunlight filtering through leaves' },
    { word: 'River 🏞️', desc: 'Clear freshwater flowing gently over smooth stones' },
    { word: 'Harp 🎼', desc: 'Delicate wooden acoustic strings vibrating softly' },
    { word: 'Star ⭐', desc: 'Bright distant diamond glowing in deep midnight sky' },
    { word: 'Lighthouse 🏮', desc: 'Steady warm glow guiding ships home through ocean mist' },
    { word: 'Loom 🧶', desc: 'Soft pastel yarn woven slowly into cozy blanket' }
];

export const CognitiveShuffle = ({ activity, onComplete }) => {
    const [wordIndex, setWordIndex] = useState(0);
    const [isRunning, setIsRunning] = useState(false);
    const synthRef = useRef(null);

    useEffect(() => {
        try {
            synthRef.current = new Tone.Synth().toDestination();
            synthRef.current.volume.value = -18;
        } catch (_) { }
        return () => {
            if (synthRef.current) {
                try { synthRef.current.dispose(); } catch (_) { }
            }
        };
    }, []);

    useEffect(() => {
        let interval = null;
        if (isRunning) {
            interval = setInterval(() => {
                setWordIndex(prev => (prev + 1) % PEACEFUL_WORDS.length);
                try {
                    if (synthRef.current) {
                        synthRef.current.triggerAttackRelease('E4', '16n');
                    }
                } catch (_) { }
            }, 4000);
        }
        return () => clearInterval(interval);
    }, [isRunning]);

    const handleNext = () => {
        setWordIndex(prev => (prev + 1) % PEACEFUL_WORDS.length);
    };

    const currentItem = PEACEFUL_WORDS[wordIndex];

    return (
        <div className="flex flex-col items-center justify-center py-4 max-w-xl mx-auto w-full text-center space-y-6">
            {/* Word Card Display */}
            <div className="w-full relative h-48 flex items-center justify-center bg-bg-light dark:bg-bg-dark rounded-3xl border border-secondary/15 p-6 overflow-hidden">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={wordIndex}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -15 }}
                        transition={{ duration: 0.5 }}
                        className="space-y-2"
                    >
                        <span className="text-3xl font-black text-primary dark:text-accent tracking-wide block">
                            {currentItem.word}
                        </span>
                        <p className="text-xs text-text-dark/70 dark:text-text-light/75 italic max-w-xs mx-auto">
                            "{currentItem.desc}"
                        </p>
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-3">
                <button
                    onClick={() => setIsRunning(!isRunning)}
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-primary hover:bg-primary-hover dark:bg-accent dark:hover:bg-accent-hover text-white dark:text-bg-dark font-bold text-xs shadow-md transition-all cursor-pointer"
                >
                    {isRunning ? <FiPause className="w-4 h-4 fill-current" /> : <FiPlay className="w-4 h-4 fill-current" />}
                    {isRunning ? 'Pause Shuffle' : 'Auto Shuffle (Every 4s)'}
                </button>
                <button
                    onClick={handleNext}
                    className="px-4 py-3 rounded-full border border-secondary/20 hover:bg-secondary/10 text-text-dark dark:text-text-light text-xs font-bold transition-all cursor-pointer"
                >
                    Next Word Card →
                </button>
                {onComplete && (
                    <button
                        onClick={onComplete}
                        className="inline-flex items-center gap-1.5 px-5 py-3 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-bold text-xs transition-all cursor-pointer hover:bg-indigo-500/20"
                    >
                        <FiCheckCircle className="w-4 h-4" /> Ready for Sleep
                    </button>
                )}
            </div>
        </div>
    );
};
