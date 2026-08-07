import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiCompass, FiCheck, FiArrowRight, FiCheckCircle } from 'react-icons/fi';
import * as Tone from 'tone';

const GROUNDING_STEPS = [
    {
        count: 5,
        sense: 'SEE 👁️',
        title: '5 Things You Can SEE',
        prompt: 'Look around your room. Name or tap 5 distinct objects you can see right now.',
        placeholder: 'e.g., A blue mug, computer monitor, potted plant, wooden desk, desk lamp'
    },
    {
        count: 4,
        sense: 'TOUCH 🖐️',
        title: '4 Things You Can TOUCH',
        prompt: 'Notice physical contact. Identify 4 textures or physical sensations you feel right now.',
        placeholder: 'e.g., Cool chair cushion, soft cotton shirt, feet pressed against floor, smooth phone edge'
    },
    {
        count: 3,
        sense: 'HEAR 👂',
        title: '3 Things You Can HEAR',
        prompt: 'Listen closely to subtle background audio. Name 3 sounds present in your environment.',
        placeholder: 'e.g., Computer fan hum, distant traffic, quiet ambient breeze'
    },
    {
        count: 2,
        sense: 'SMELL 👃',
        title: '2 Things You Can SMELL',
        prompt: 'Take a slow deep breath through your nose. What 2 scents or scents in memory can you notice?',
        placeholder: 'e.g., Coffee aroma, fresh air, soft laundry soap'
    },
    {
        count: 1,
        sense: 'TASTE 👅',
        title: '1 Thing You Can TASTE',
        prompt: 'Focus on your tongue and mouth. Name 1 taste present right now or take a sip of water.',
        placeholder: 'e.g., Mint toothpaste, tea note, clean fresh water'
    }
];

export const GroundingWizard = ({ activity, onComplete }) => {
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [inputs, setInputs] = useState(Array(5).fill(''));
    const [isCompleted, setIsCompleted] = useState(false);
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

    const step = GROUNDING_STEPS[currentStepIndex];

    const handleNextStep = async () => {
        try {
            if (Tone.context.state !== 'running') {
                await Tone.start();
            }
            if (synthRef.current) {
                synthRef.current.triggerAttackRelease('C5', '8n');
            }
        } catch (_) { }

        if (currentStepIndex + 1 < GROUNDING_STEPS.length) {
            setCurrentStepIndex(prev => prev + 1);
        } else {
            setIsCompleted(true);
        }
    };

    const handleInputChange = (val) => {
        const next = [...inputs];
        next[currentStepIndex] = val;
        setInputs(next);
    };

    return (
        <div className="flex flex-col items-center justify-center p-6 md:p-8 bg-card-light dark:bg-card-dark rounded-[2.5rem] border border-secondary/20 shadow-lg max-w-xl mx-auto w-full text-center space-y-6">
            {/* Header */}
            <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider mb-2">
                    <FiCompass className="w-4 h-4" /> 5-4-3-2-1 Grounding Wizard
                </div>
                <h2 className="text-2xl font-bold text-text-dark dark:text-text-light">
                    {activity?.title || '5-4-3-2-1 Sensory Grounding'}
                </h2>
                <p className="text-xs sm:text-sm text-text-dark/65 dark:text-text-light/70 mt-1 max-w-md mx-auto">
                    Anchor your mind to the physical present moment and interrupt racing anxiety thoughts.
                </p>
            </div>

            {/* Progress Bar */}
            <div className="w-full space-y-1">
                <div className="flex justify-between text-xs font-semibold text-text-dark/60 dark:text-text-light/60 px-1">
                    <span>Step {currentStepIndex + 1} of 5</span>
                    <span className="font-bold text-primary dark:text-accent">{step.sense}</span>
                </div>
                <div className="w-full bg-secondary/10 rounded-full h-2.5 overflow-hidden flex gap-1 p-0.5">
                    {GROUNDING_STEPS.map((s, idx) => (
                        <div
                            key={idx}
                            className={`h-full flex-1 rounded-full transition-all duration-500 ${idx <= currentStepIndex ? 'bg-primary dark:bg-accent' : 'bg-secondary/20'
                                }`}
                        />
                    ))}
                </div>
            </div>

            {/* Interactive Card */}
            <AnimatePresence mode="wait">
                {!isCompleted ? (
                    <motion.div
                        key={`step-${currentStepIndex}`}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="w-full space-y-5 bg-bg-light dark:bg-bg-dark p-6 rounded-3xl border border-secondary/15 shadow-inner"
                    >
                        <div className="w-14 h-14 rounded-2xl bg-primary/10 dark:bg-accent/15 text-primary dark:text-accent font-black text-2xl flex items-center justify-center mx-auto">
                            {step.count}
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-text-dark dark:text-text-light">
                                {step.title}
                            </h3>
                            <p className="text-xs text-text-dark/70 dark:text-text-light/70 mt-1 leading-relaxed">
                                {step.prompt}
                            </p>
                        </div>

                        <textarea
                            value={inputs[currentStepIndex]}
                            onChange={(e) => handleInputChange(e.target.value)}
                            placeholder={step.placeholder}
                            className="w-full h-24 p-3 bg-card-light dark:bg-card-dark rounded-xl text-xs text-text-dark dark:text-text-light border border-secondary/20 outline-none focus:border-primary transition-all resize-none"
                        />

                        <button
                            onClick={handleNextStep}
                            className="inline-flex items-center justify-center gap-2 w-full py-3 rounded-full bg-primary hover:bg-primary-hover dark:bg-accent dark:hover:bg-accent-hover text-white dark:text-bg-dark font-bold text-xs shadow-md transition-all cursor-pointer"
                        >
                            {currentStepIndex === 4 ? 'Complete Grounding' : 'Next Sense Step'}
                            <FiArrowRight className="w-4 h-4" />
                        </button>
                    </motion.div>
                ) : (
                    <motion.div
                        key="completed-view"
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="w-full space-y-5 py-4"
                    >
                        <div className="w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto text-3xl">
                            🌿
                        </div>
                        <h3 className="text-xl font-bold text-text-dark dark:text-text-light">
                            You are Grounded & Present!
                        </h3>
                        <p className="text-xs text-text-dark/70 dark:text-text-light/70 max-w-sm mx-auto">
                            By engaging all five physical senses, you have successfully shifted your nervous system back to safety.
                        </p>
                        {onComplete && (
                            <button
                                onClick={onComplete}
                                className="inline-flex items-center gap-1.5 px-6 py-3 rounded-full bg-primary hover:bg-primary-hover dark:bg-accent dark:hover:bg-accent-hover text-white dark:text-bg-dark font-bold text-xs shadow-md transition-all cursor-pointer"
                            >
                                <FiCheckCircle className="w-4 h-4" /> Done Feeling Grounded
                            </button>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
