import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiPlay, FiPause, FiRotateCcw, FiWind, FiCheckCircle } from 'react-icons/fi';
import * as Tone from 'tone';

const BREATHING_TECHNIQUES = {
    'box': {
        name: 'Box Breathing (4-4-4-4)',
        description: 'Equal ratio breathing to lower cortisol & calm nervous system.',
        phases: [
            { name: 'Inhale', duration: 4, action: 'expand' },
            { name: 'Hold', duration: 4, action: 'hold-full' },
            { name: 'Exhale', duration: 4, action: 'contract' },
            { name: 'Hold', duration: 4, action: 'hold-empty' }
        ]
    },
    '4-7-8': {
        name: 'Deep Calm (4-7-8)',
        description: 'Extended exhalation technique to activate parasympathetic rest & sleep.',
        phases: [
            { name: 'Inhale', duration: 4, action: 'expand' },
            { name: 'Hold', duration: 7, action: 'hold-full' },
            { name: 'Exhale', duration: 8, action: 'contract' }
        ]
    },
    'coherent': {
        name: 'Coherent Breathing (5-5)',
        description: 'Balanced heart rate variability (HRV) breathing.',
        phases: [
            { name: 'Inhale', duration: 5, action: 'expand' },
            { name: 'Exhale', duration: 5, action: 'contract' }
        ]
    },
    'sigh': {
        name: 'Physiological Sigh (2-1-6)',
        description: 'Rapid double-inhale to offload CO2 and reduce immediate anxiety.',
        phases: [
            { name: 'Inhale Deeply', duration: 2, action: 'expand' },
            { name: 'Quick Sniff In', duration: 1, action: 'expand-more' },
            { name: 'Long Exhale', duration: 6, action: 'contract' }
        ]
    }
};

export const BreathingPacer = ({ activity, onComplete }) => {
    const [selectedPatternKey, setSelectedPatternKey] = useState('box');
    const [isRunning, setIsRunning] = useState(false);
    const [phaseIndex, setPhaseIndex] = useState(0);
    const [secondsInPhase, setSecondsInPhase] = useState(0);
    const [cyclesCompleted, setCyclesCompleted] = useState(0);
    const synthRef = useRef(null);

    const pattern = BREATHING_TECHNIQUES[selectedPatternKey];
    const currentPhase = pattern.phases[phaseIndex];

    // Initialize Tone.js synth for soft audio swells
    useEffect(() => {
        try {
            synthRef.current = new Tone.Synth({
                oscillator: { type: 'sine' },
                envelope: { attack: 1.5, decay: 1, sustain: 0.5, release: 2 }
            }).toDestination();
            synthRef.current.volume.value = -20;
        } catch (_) { }

        return () => {
            if (synthRef.current) {
                try { synthRef.current.dispose(); } catch (_) { }
            }
        };
    }, []);

    // Main breathing loop timer
    useEffect(() => {
        let timer = null;
        if (isRunning) {
            timer = setInterval(() => {
                setSecondsInPhase(prev => {
                    if (prev + 1 >= currentPhase.duration) {
                        // Move to next phase
                        setPhaseIndex(pIdx => {
                            const nextIdx = (pIdx + 1) % pattern.phases.length;
                            if (nextIdx === 0) {
                                setCyclesCompleted(c => c + 1);
                            }
                            return nextIdx;
                        });
                        return 0;
                    }
                    return prev + 1;
                });
            }, 1000);
        }

        return () => clearInterval(timer);
    }, [isRunning, currentPhase, pattern]);

    // Audio cue when phase changes
    useEffect(() => {
        if (!isRunning || !synthRef.current) return;
        try {
            if (Tone.context.state !== 'running') {
                Tone.start();
            }
            if (currentPhase.name.includes('Inhale')) {
                synthRef.current.triggerAttackRelease('C3', currentPhase.duration * 0.8);
            } else if (currentPhase.name.includes('Exhale')) {
                synthRef.current.triggerAttackRelease('G2', currentPhase.duration * 0.8);
            } else {
                synthRef.current.triggerAttackRelease('E3', 0.5);
            }
        } catch (_) { }
    }, [phaseIndex, isRunning, currentPhase]);

    const handleTogglePlay = async () => {
        if (!isRunning) {
            await Tone.start();
        }
        setIsRunning(!isRunning);
    };

    const handleReset = () => {
        setIsRunning(false);
        setPhaseIndex(0);
        setSecondsInPhase(0);
        setCyclesCompleted(0);
    };

    // Calculate orb scale
    const getOrbScale = () => {
        if (!isRunning) return 1;
        const progress = secondsInPhase / currentPhase.duration;
        if (currentPhase.action === 'expand') {
            return 1 + progress * 0.6;
        } else if (currentPhase.action === 'expand-more') {
            return 1.6 + progress * 0.25;
        } else if (currentPhase.action === 'contract') {
            return 1.85 - progress * 0.85;
        } else if (currentPhase.action === 'hold-full') {
            return 1.6;
        } else {
            return 1;
        }
    };

    return (
        <div className="flex flex-col items-center justify-center py-4 max-w-2xl mx-auto w-full text-center space-y-6">
            {/* Pattern Selector */}
            <div className="flex flex-wrap items-center justify-center gap-2">
                {Object.entries(BREATHING_TECHNIQUES).map(([key, tech]) => (
                    <button
                        key={key}
                        onClick={() => {
                            setSelectedPatternKey(key);
                            handleReset();
                        }}
                        className={`text-xs px-3.5 py-1.5 rounded-full font-semibold transition-all cursor-pointer ${selectedPatternKey === key
                                ? 'bg-secondary text-white shadow-sm font-bold'
                                : 'bg-secondary/10 text-text-dark dark:text-text-light hover:bg-secondary/20'
                            }`}
                    >
                        {tech.name.split(' ')[0]} {tech.name.split(' ')[1]}
                    </button>
                ))}
            </div>

            {/* Glowing Interactive Visual Orb */}
            <div className="relative w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center my-4">
                {/* Background Outer Ring */}
                <div className="absolute inset-0 rounded-full border-2 border-dashed border-secondary/20 animate-spin-slow pointer-events-none" />

                {/* Animated Inner Pacing Orb */}
                <motion.div
                    animate={{ scale: getOrbScale() }}
                    transition={{ duration: 1, ease: 'easeInOut' }}
                    className={`w-36 h-36 sm:w-44 sm:h-44 rounded-full flex flex-col items-center justify-center shadow-2xl transition-colors duration-700 ${currentPhase.action.includes('expand')
                            ? 'bg-gradient-to-br from-teal-400 to-emerald-500 shadow-teal-500/30'
                            : currentPhase.action === 'hold-full'
                                ? 'bg-gradient-to-br from-indigo-400 to-purple-500 shadow-indigo-500/30'
                                : currentPhase.action === 'contract'
                                    ? 'bg-gradient-to-br from-sky-400 to-blue-500 shadow-blue-500/30'
                                    : 'bg-gradient-to-br from-amber-400 to-rose-400 shadow-rose-400/30'
                        }`}
                >
                    <span className="text-xl sm:text-2xl font-black text-white drop-shadow-md">
                        {isRunning ? currentPhase.name : 'Ready'}
                    </span>
                    {isRunning && (
                        <span className="text-2xl sm:text-3xl font-extrabold text-white/90 mt-1">
                            {currentPhase.duration - secondsInPhase}s
                        </span>
                    )}
                </motion.div>
            </div>

            {/* Cycle Counter & Instructions */}
            <div className="space-y-1">
                <div className="text-xs font-bold text-text-dark/50 dark:text-text-light/50 uppercase tracking-widest">
                    Cycles Completed: <span className="text-primary dark:text-accent font-extrabold text-sm">{cyclesCompleted}</span>
                </div>
                <p className="text-xs text-text-dark/60 dark:text-text-light/60 max-w-sm mx-auto italic">
                    "{pattern.description}"
                </p>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-center gap-3 pt-2">
                <button
                    onClick={handleTogglePlay}
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-primary hover:bg-primary-hover dark:bg-accent dark:hover:bg-accent-hover text-white dark:text-bg-dark font-bold text-sm shadow-md transition-all cursor-pointer"
                >
                    {isRunning ? <FiPause className="w-4 h-4 fill-current" /> : <FiPlay className="w-4 h-4 fill-current" />}
                    {isRunning ? 'Pause Pacer' : 'Start Breathing'}
                </button>
                <button
                    onClick={handleReset}
                    className="p-3 rounded-full border border-secondary/20 hover:bg-secondary/10 text-text-dark dark:text-text-light transition-all cursor-pointer"
                    title="Reset"
                >
                    <FiRotateCcw className="w-4 h-4" />
                </button>
                {onComplete && (
                    <button
                        onClick={onComplete}
                        className="inline-flex items-center gap-1.5 px-4 py-3 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold text-xs transition-all hover:bg-emerald-500/20 cursor-pointer"
                    >
                        <FiCheckCircle className="w-4 h-4" /> Finish
                    </button>
                )}
            </div>
        </div>
    );
};
