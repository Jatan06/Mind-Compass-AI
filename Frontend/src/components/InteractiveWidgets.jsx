import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiCheck, FiRefreshCw, FiHeart, FiClock, FiPlay, FiSmile } from 'react-icons/fi';

// -------------------------------------------------------------
// Breathing Circle Widget
// Requires the user to hold/follow the breathing pacing for N cycles.
// -------------------------------------------------------------
export const BreathingCircleWidget = ({ instruction, onComplete }) => {
    const defaultCycles = instruction.target_cycles || 5;
    const [cycle, setCycle] = useState(0);
    const [phase, setPhase] = useState('Idle'); // Idle, Inhale, Hold, Exhale

    // Configurable tempos
    const inDur = instruction.inhale_duration || 4;
    const holdDur = instruction.hold_duration || 4;
    const exDur = instruction.exhale_duration || 4;

    useEffect(() => {
        if (cycle >= defaultCycles) {
            onComplete(true);
            setPhase('Done');
        }
    }, [cycle, defaultCycles, onComplete]);

    const startBreathing = () => {
        if (cycle >= defaultCycles) return;
        setPhase('Inhale');
        let timer1 = setTimeout(() => {
            setPhase('Hold');
            let timer2 = setTimeout(() => {
                setPhase('Exhale');
                let timer3 = setTimeout(() => {
                    setCycle(c => c + 1);
                    setPhase('Idle');
                }, exDur * 1000);
            }, holdDur * 1000);
        }, inDur * 1000);
    };

    const getScale = () => {
        if (phase === 'Inhale') return 1.5;
        if (phase === 'Hold') return 1.5;
        if (phase === 'Exhale') return 1;
        return 1;
    };

    return (
        <div className="flex flex-col items-center justify-center space-y-12 py-8">
            <h3 className="text-xl md:text-2xl font-bold tracking-tight text-center max-w-lg mb-8">{instruction.text || "Follow the breathing pattern"}</h3>

            <div className="relative w-48 h-48 flex items-center justify-center">
                <motion.div
                    initial={{ scale: 1 }}
                    animate={{ scale: getScale(), opacity: phase === 'Idle' || phase === 'Done' ? 0.3 : 0.8 }}
                    transition={{ duration: phase === 'Inhale' ? inDur : phase === 'Exhale' ? exDur : 0.5, ease: "easeInOut" }}
                    className="absolute w-32 h-32 bg-primary/20 dark:bg-accent/20 rounded-full"
                />
                <motion.div
                    initial={{ scale: 1 }}
                    animate={{ scale: getScale() * 0.9, opacity: phase === 'Idle' || phase === 'Done' ? 0.6 : 1 }}
                    transition={{ duration: phase === 'Inhale' ? inDur : phase === 'Exhale' ? exDur : 0.5, ease: "easeInOut" }}
                    className="absolute w-24 h-24 bg-primary dark:bg-accent rounded-full shadow-lg flex items-center justify-center"
                >
                    <span className="text-white font-bold text-lg select-none">{phase === 'Done' ? <FiCheck className="w-8 h-8" /> : phase}</span>
                </motion.div>
            </div>

            <div className="flex flex-col items-center space-y-4">
                <div className="text-sm font-bold text-text-dark/50 tracking-widest uppercase">
                    CYCLE {Math.min(cycle, defaultCycles)} / {defaultCycles}
                </div>
                {phase === 'Idle' && cycle < defaultCycles && (
                    <button onClick={startBreathing} className="px-6 py-2 bg-primary dark:bg-accent text-white rounded-full font-bold shadow-md hover:scale-105 transition-transform">
                        Start Next Cycle
                    </button>
                )}
            </div>
        </div>
    );
};

// -------------------------------------------------------------
// Text Input Widget (Journaling / Reframing)
// Requires a minimum number of characters to pass.
// -------------------------------------------------------------
export const TextInputWidget = ({ instruction, onComplete }) => {
    const [text, setText] = useState("");
    const minChars = instruction.min_length || 15;

    useEffect(() => {
        if (text.trim().length >= minChars) {
            onComplete(true);
        } else {
            onComplete(false);
        }
    }, [text, minChars, onComplete]);

    return (
        <div className="flex flex-col space-y-6 max-w-2xl mx-auto w-full text-left py-6">
            <h3 className="text-xl md:text-2xl font-bold tracking-tight text-balance">{instruction.text}</h3>

            <div className="relative">
                <textarea
                    rows={4}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder={instruction.placeholder || "Type your reflections here..."}
                    className="w-full rounded-2xl p-5 border border-secondary/20 bg-bg-light dark:bg-bg-dark text-text-dark dark:text-text-light outline-none focus:ring-2 focus:ring-primary/50 transition-all resize-none shadow-inner"
                />
                <div className={`absolute bottom-3 right-4 text-xs font-bold uppercase ${text.length >= minChars ? 'text-emerald-500' : 'text-text-dark/30'}`}>
                    {text.length}/{minChars} Chars
                </div>
            </div>
        </div>
    );
};

// -------------------------------------------------------------
// Checklist Widget
// Requires checking off all actionable items.
// -------------------------------------------------------------
export const ChecklistWidget = ({ instruction, onComplete }) => {
    const items = instruction.list_items || [];
    const [checked, setChecked] = useState(new Array(items.length).fill(false));

    const toggle = (i) => {
        const nc = [...checked];
        nc[i] = !nc[i];
        setChecked(nc);
        if (nc.every(v => v)) {
            onComplete(true);
        } else {
            onComplete(false);
        }
    };

    return (
        <div className="flex flex-col space-y-6 max-w-xl mx-auto w-full text-left py-6">
            <h3 className="text-xl md:text-2xl font-bold tracking-tight mb-4">{instruction.text}</h3>
            <div className="space-y-3">
                {items.map((it, idx) => (
                    <button
                        key={idx}
                        onClick={() => toggle(idx)}
                        className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all text-left group
                            ${checked[idx] ? 'bg-emerald-500/10 border-emerald-500 text-emerald-700 dark:text-emerald-400'
                                : 'bg-card-light dark:bg-card-dark border-secondary/20 hover:border-secondary/40 text-text-dark/80 dark:text-text-light/80'}`}
                    >
                        <div className={`w-6 h-6 rounded-md border flex items-center justify-center flex-shrink-0 transition-colors
                            ${checked[idx] ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-secondary/30 bg-transparent group-hover:border-primary'}`}>
                            {checked[idx] && <FiCheck className="w-4 h-4" />}
                        </div>
                        <span className="text-sm font-semibold">{it}</span>
                    </button>
                ))}
            </div>
        </div>
    );
};

// -------------------------------------------------------------
// Slider Widget (Mood, Tension, Feeling)
// Just requires a simple interaction.
// -------------------------------------------------------------
export const SliderWidget = ({ instruction, onComplete }) => {
    const [val, setVal] = useState(50);
    const [interacted, setInteracted] = useState(false);

    const handleSlider = (e) => {
        setVal(e.target.value);
        if (!interacted) {
            setInteracted(true);
            onComplete(true);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center space-y-10 py-10 max-w-lg mx-auto w-full">
            <h3 className="text-xl md:text-2xl font-bold tracking-tight text-center text-balance">{instruction.text}</h3>
            <div className="w-full space-y-4">
                <input
                    type="range" min="0" max="100" value={val}
                    onChange={handleSlider}
                    className="w-full h-3 bg-secondary/20 rounded-lg appearance-none cursor-pointer accent-primary"
                />
                <div className="flex justify-between text-xs font-bold uppercase text-text-dark/40 tracking-wider">
                    <span>{instruction.min_label || 'Low'}</span>
                    <span>{instruction.max_label || 'High'}</span>
                </div>
            </div>
        </div>
    );
};

// -------------------------------------------------------------
// Tap Progress Widget (Rhythm/Grounding)
// Requires tapping the center circle N times.
// -------------------------------------------------------------
export const ProgressTapWidget = ({ instruction, onComplete }) => {
    const target = instruction.target_taps || 10;
    const [taps, setTaps] = useState(0);

    const handleTap = () => {
        if (taps < target) {
            const next = taps + 1;
            setTaps(next);
            if (next >= target) {
                onComplete(true);
            }
        }
    };

    return (
        <div className="flex flex-col items-center justify-center space-y-8 py-10 max-w-md mx-auto w-full">
            <h3 className="text-xl md:text-2xl font-bold tracking-tight text-center">{instruction.text}</h3>
            <button
                onClick={handleTap}
                className={`relative w-40 h-40 rounded-full flex items-center justify-center outline-none transition-transform
                    ${taps >= target ? 'bg-emerald-500 scale-100 cursor-default shadow-none text-white' : 'bg-primary dark:bg-accent text-white shadow-xl hover:scale-105 active:scale-95'}`}
            >
                <div className="text-3xl font-bold text-white z-10 flex flex-col items-center justify-center">
                    {taps >= target ? <FiCheck className="w-10 h-10" /> : `${taps} / ${target}`}
                    {taps < target && <span className="text-[10px] font-medium tracking-widest mt-1 opacity-70 uppercase">Taps</span>}
                </div>
                {/* SVG Ring Progress */}
                <svg className="absolute inset-0 w-full h-full transform -rotate-90 pointer-events-none">
                    <circle cx="80" cy="80" r="76" stroke="rgba(255,255,255,0.2)" strokeWidth="4" fill="none" />
                    <circle cx="80" cy="80" r="76" stroke="white" strokeWidth="4" fill="none" strokeDasharray="477" strokeDashoffset={477 - (477 * taps) / target} className="transition-all duration-300" />
                </svg>
            </button>
        </div>
    );
};

// -------------------------------------------------------------
// Hold & Release Widget
// Requires continuous mousedown for N seconds to fill progress.
// -------------------------------------------------------------
export const HoldReleaseWidget = ({ instruction, onComplete }) => {
    const targetSecs = instruction.hold_seconds || 5;
    const [progress, setProgress] = useState(0);
    const [isHolding, setIsHolding] = useState(false);
    const [completed, setCompleted] = useState(false);
    const intervalRef = useRef(null);

    useEffect(() => {
        if (isHolding && !completed) {
            intervalRef.current = setInterval(() => {
                setProgress(p => {
                    if (p + 2 >= 100) {
                        setCompleted(true);
                        onComplete(true);
                        clearInterval(intervalRef.current);
                        return 100;
                    }
                    return p + 2;
                });
            }, (targetSecs * 1000) / 50);
        } else if (!isHolding && !completed) {
            if (intervalRef.current) clearInterval(intervalRef.current);
            setProgress(0);
        }
        return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    }, [isHolding, completed, targetSecs, onComplete]);

    return (
        <div className="flex flex-col items-center justify-center space-y-12 py-12 max-w-lg mx-auto w-full text-center">
            <h3 className="text-xl md:text-2xl font-bold tracking-tight text-balance">{instruction.text}</h3>

            <button
                onMouseDown={() => setIsHolding(true)}
                onMouseUp={() => setIsHolding(false)}
                onMouseLeave={() => setIsHolding(false)}
                onTouchStart={(e) => { e.preventDefault(); setIsHolding(true); }}
                onTouchEnd={() => setIsHolding(false)}
                className={`relative w-48 h-48 rounded-full outline-none select-none overflow-hidden border-4 flex items-center justify-center transition-all ${completed ? 'border-primary bg-primary/10' : 'border-secondary/20 bg-card-light'
                    }`}
            >
                <div style={{ height: `${progress}%` }} className="absolute bottom-0 w-full bg-primary dark:bg-accent transition-all duration-75" />
                <span className="relative z-10 font-bold uppercase tracking-widest text-sm mix-blend-difference text-white">
                    {completed ? "Released" : "Hold"}
                </span>
            </button>
        </div>
    );
};
