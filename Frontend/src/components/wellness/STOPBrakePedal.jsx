import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiOctagon, FiCheckCircle, FiArrowRight } from 'react-icons/fi';
import * as Tone from 'tone';

const EMOTIONS = [
    { name: 'Anger / Frustration 🔴', color: 'bg-rose-500/20 text-rose-500 border-rose-500/40' },
    { name: 'Anxiety / Fear 🟡', color: 'bg-amber-500/20 text-amber-500 border-amber-500/40' },
    { name: 'Sadness / Heavy 🔵', color: 'bg-sky-500/20 text-sky-500 border-sky-500/40' },
    { name: 'Overwhelm / Panic 🟣', color: 'bg-purple-500/20 text-purple-500 border-purple-500/40' }
];

export const STOPBrakePedal = ({ activity, onComplete }) => {
    const [step, setStep] = useState(1); // 1: Stop, 2: Take Breath, 3: Observe, 4: Proceed
    const [brakeProgress, setBrakeProgress] = useState(0);
    const [selectedEmotion, setSelectedEmotion] = useState('');
    const synthRef = useRef(null);

    useEffect(() => {
        try {
            synthRef.current = new Tone.Synth().toDestination();
            synthRef.current.volume.value = -14;
        } catch (_) { }
        return () => {
            if (synthRef.current) {
                try { synthRef.current.dispose(); } catch (_) { }
            }
        };
    }, []);

    // Step 1: Press & Hold Brake Pedal logic
    useEffect(() => {
        let timer = null;
        if (step === 1 && brakeProgress > 0 && brakeProgress < 100) {
            timer = setInterval(() => {
                setBrakeProgress(p => {
                    if (p + 25 >= 100) {
                        try {
                            if (synthRef.current) synthRef.current.triggerAttackRelease('C5', '8n');
                        } catch (_) { }
                        setStep(2);
                        return 100;
                    }
                    return p + 25;
                });
            }, 500);
        }
        return () => clearInterval(timer);
    }, [step, brakeProgress]);

    return (
        <div className="flex flex-col items-center justify-center py-4 max-w-xl mx-auto w-full text-center space-y-6">
            {/* Step Wizard Card */}
            <div className="w-full bg-bg-light dark:bg-bg-dark rounded-3xl border border-secondary/15 p-6 space-y-5">
                {/* Step 1: STOP */}
                {step === 1 && (
                    <div className="space-y-4">
                        <div className="w-14 h-14 rounded-full bg-rose-500 text-white font-black text-xl flex items-center justify-center mx-auto shadow-lg shadow-rose-500/30">
                            STOP
                        </div>
                        <h3 className="text-base font-bold text-text-dark dark:text-text-light">
                            1. Press & Hold the Emergency Brake
                        </h3>
                        <p className="text-xs text-text-dark/70 dark:text-text-light/70">
                            Press and hold the red brake button below for 2 seconds to pause reaction.
                        </p>
                        <button
                            onMouseDown={() => setBrakeProgress(10)}
                            onTouchStart={() => setBrakeProgress(10)}
                            className="w-full py-4 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-sm shadow-lg transition-all cursor-pointer select-none active:scale-95"
                        >
                            {brakeProgress > 0 ? `Holding Brake... ${brakeProgress}%` : '🔴 Press & Hold Emergency Brake'}
                        </button>
                    </div>
                )}

                {/* Step 2: TAKE A BREATH */}
                {step === 2 && (
                    <div className="space-y-4">
                        <div className="w-14 h-14 rounded-full bg-sky-500 text-white font-black text-xl flex items-center justify-center mx-auto shadow-lg shadow-sky-500/30">
                            TAKE
                        </div>
                        <h3 className="text-base font-bold text-text-dark dark:text-text-light">
                            2. Take One Deep Centering Breath
                        </h3>
                        <div className="w-20 h-20 rounded-full bg-sky-400/20 border-2 border-sky-400 flex items-center justify-center mx-auto animate-pulse">
                            <span className="text-xs font-bold text-sky-400">Inhale...</span>
                        </div>
                        <button
                            onClick={() => setStep(3)}
                            className="inline-flex items-center justify-center gap-2 w-full py-3 rounded-full bg-primary hover:bg-primary-hover dark:bg-accent dark:hover:bg-accent-hover text-white dark:text-bg-dark font-bold text-xs shadow-md transition-all cursor-pointer"
                        >
                            Breath Completed <FiArrowRight />
                        </button>
                    </div>
                )}

                {/* Step 3: OBSERVE */}
                {step === 3 && (
                    <div className="space-y-4">
                        <div className="w-14 h-14 rounded-full bg-amber-500 text-white font-black text-xl flex items-center justify-center mx-auto shadow-lg shadow-amber-500/30">
                            OBSERVE
                        </div>
                        <h3 className="text-base font-bold text-text-dark dark:text-text-light">
                            3. Observe & Name Your Primary Emotion
                        </h3>
                        <div className="grid grid-cols-2 gap-2">
                            {EMOTIONS.map((emo, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setSelectedEmotion(emo.name)}
                                    className={`p-3 rounded-2xl border text-xs font-bold transition-all cursor-pointer ${emo.color} ${selectedEmotion === emo.name ? 'ring-2 ring-primary font-black' : ''
                                        }`}
                                >
                                    {emo.name}
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={() => setStep(4)}
                            disabled={!selectedEmotion}
                            className="inline-flex items-center justify-center gap-2 w-full py-3 rounded-full bg-primary hover:bg-primary-hover dark:bg-accent dark:hover:bg-accent-hover text-white dark:text-bg-dark font-bold text-xs shadow-md transition-all cursor-pointer disabled:opacity-30"
                        >
                            Next Step <FiArrowRight />
                        </button>
                    </div>
                )}

                {/* Step 4: PROCEED */}
                {step === 4 && (
                    <div className="space-y-4 py-2">
                        <div className="w-16 h-16 rounded-full bg-emerald-500 text-white font-black text-2xl flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/30">
                            🟢
                        </div>
                        <h3 className="text-xl font-bold text-text-dark dark:text-text-light">
                            4. Proceed Mindfully with Safety
                        </h3>
                        <p className="text-xs text-text-dark/75 dark:text-text-light/80 bg-emerald-500/10 p-3 rounded-2xl border border-emerald-500/20 max-w-sm mx-auto">
                            You have successfully paused your automatic reaction. Ask yourself: *"What is the most mindful choice I can make right now?"*
                        </p>
                        {onComplete && (
                            <button
                                onClick={onComplete}
                                className="inline-flex items-center gap-1.5 px-6 py-3 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
                            >
                                <FiCheckCircle className="w-4 h-4" /> Reset Completed
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
