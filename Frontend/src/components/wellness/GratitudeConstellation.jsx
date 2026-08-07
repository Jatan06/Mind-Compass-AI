import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiStar, FiHeart, FiPlus, FiCheckCircle } from 'react-icons/fi';
import * as Tone from 'tone';

const NOTES = ['C4', 'E4', 'G4', 'B4', 'C5'];

export const GratitudeConstellation = ({ activity, onComplete }) => {
    const [entries, setEntries] = useState(['', '', '']);
    const [stars, setStars] = useState([]);
    const [isComplete, setIsComplete] = useState(false);

    const synthRef = useRef(null);

    useEffect(() => {
        try {
            synthRef.current = new Tone.PolySynth(Tone.Synth, {
                oscillator: { type: 'sine' },
                envelope: { attack: 0.5, decay: 1, sustain: 0.7, release: 2 }
            }).toDestination();
            synthRef.current.volume.value = -12;
        } catch (_) { }

        return () => {
            if (synthRef.current) {
                try { synthRef.current.dispose(); } catch (_) { }
            }
        };
    }, []);

    const handleAddStar = async (index) => {
        const text = entries[index].trim();
        if (!text) return;

        // Sound trigger
        try {
            if (Tone.context.state !== 'running') {
                await Tone.start();
            }
            if (synthRef.current) {
                synthRef.current.triggerAttackRelease(NOTES[index % NOTES.length], '2n');
            }
        } catch (_) { }

        // Generate random star coordinates on canvas
        const newStar = {
            id: index,
            text,
            x: 20 + Math.random() * 60, // percentage 20%-80%
            y: 20 + Math.random() * 60
        };

        setStars(prev => [...prev.filter(s => s.id !== index), newStar]);

        if (stars.length + 1 >= 3) {
            setIsComplete(true);
        }
    };

    const handleTextChange = (idx, val) => {
        const next = [...entries];
        next[idx] = val;
        setEntries(next);
    };

    return (
        <div className="flex flex-col items-center justify-center p-6 md:p-8 bg-card-light dark:bg-card-dark rounded-[2.5rem] border border-secondary/20 shadow-lg max-w-xl mx-auto w-full text-center space-y-6">
            {/* Header */}
            <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-500 text-xs font-bold uppercase tracking-wider mb-2">
                    <FiStar className="w-4 h-4" /> Night Sky Gratitude Constellation
                </div>
                <h2 className="text-2xl font-bold text-text-dark dark:text-text-light">
                    {activity?.title || 'Gratitude Constellation Sky'}
                </h2>
                <p className="text-xs sm:text-sm text-text-dark/65 dark:text-text-light/70 mt-1 max-w-md mx-auto">
                    Record 3 positive moments from today to ignite glowing stars and form your daily gratitude constellation.
                </p>
            </div>

            {/* Interactive Night Sky Canvas */}
            <div className="w-full relative h-64 bg-slate-950 rounded-3xl border border-secondary/20 p-4 overflow-hidden flex items-center justify-center shadow-inner">
                {/* Background ambient stars */}
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-900/30 via-slate-950 to-slate-950" />

                {/* SVG Constellation Connection Lines */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none">
                    {stars.length > 1 && stars.map((s, idx) => {
                        if (idx === 0) return null;
                        const prev = stars[idx - 1];
                        return (
                            <line
                                key={`line-${idx}`}
                                x1={`${prev.x}%`}
                                y1={`${prev.y}%`}
                                x2={`${s.x}%`}
                                y2={`${s.y}%`}
                                stroke="rgba(251, 191, 36, 0.4)"
                                strokeWidth="1.5"
                                strokeDasharray="4 4"
                            />
                        );
                    })}
                </svg>

                {/* Animated Constellation Stars */}
                <AnimatePresence>
                    {stars.map(star => (
                        <motion.div
                            key={`star-${star.id}`}
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: [1, 1.3, 1], opacity: 1 }}
                            transition={{ duration: 0.8 }}
                            style={{ left: `${star.x}%`, top: `${star.y}%` }}
                            className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group cursor-pointer"
                        >
                            <div className="w-8 h-8 rounded-full bg-amber-400/20 flex items-center justify-center border border-amber-400/50 shadow-lg shadow-amber-400/30 animate-pulse">
                                <FiStar className="w-4 h-4 text-amber-300 fill-amber-300" />
                            </div>
                            <span className="text-[10px] font-semibold text-amber-200 bg-slate-900/90 px-2 py-0.5 rounded-full mt-1 max-w-[120px] truncate border border-amber-400/20 shadow-md">
                                {star.text}
                            </span>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {stars.length === 0 && (
                    <span className="text-xs text-slate-500 font-mono italic z-10">
                        ✨ Add your first gratitude moment below to ignite the sky...
                    </span>
                )}
            </div>

            {/* Input Cards */}
            <div className="w-full space-y-3">
                {[0, 1, 2].map(idx => (
                    <div key={idx} className="flex gap-2 items-center">
                        <span className="w-6 h-6 rounded-full bg-amber-500/10 text-amber-500 font-bold text-xs flex items-center justify-center border border-amber-500/20">
                            {idx + 1}
                        </span>
                        <input
                            type="text"
                            value={entries[idx]}
                            onChange={(e) => handleTextChange(idx, e.target.value)}
                            placeholder={`Gratitude moment ${idx + 1} (e.g. Warm sunny morning walk...)`}
                            className="flex-1 px-4 py-2 bg-bg-light dark:bg-bg-dark rounded-full text-xs text-text-dark dark:text-text-light border border-secondary/20 outline-none focus:border-amber-400 transition-all"
                        />
                        <button
                            onClick={() => handleAddStar(idx)}
                            disabled={!entries[idx].trim()}
                            className="p-2.5 rounded-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs transition-all cursor-pointer disabled:opacity-30 shadow-md"
                            title="Launch Star"
                        >
                            <FiPlus className="w-4 h-4" />
                        </button>
                    </div>
                ))}
            </div>

            {/* Finish Action */}
            {isComplete && onComplete && (
                <motion.button
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={onComplete}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-lg transition-all cursor-pointer"
                >
                    <FiCheckCircle className="w-4 h-4" /> Save Constellation & Complete
                </motion.button>
            )}
        </div>
    );
};
