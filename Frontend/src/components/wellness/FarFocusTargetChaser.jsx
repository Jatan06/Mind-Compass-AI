import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { FiSun, FiPlay, FiPause, FiCheckCircle } from 'react-icons/fi';
import * as Tone from 'tone';

export const FarFocusTargetChaser = ({ activity, onComplete }) => {
    const [timeLeft, setTimeLeft] = useState(20);
    const [isRunning, setIsRunning] = useState(false);
    const [targetPos, setTargetPos] = useState({ x: 50, y: 50 });

    const synthRef = useRef(null);

    useEffect(() => {
        try {
            synthRef.current = new Tone.Synth().toDestination();
            synthRef.current.volume.value = -16;
        } catch (_) { }
        return () => {
            if (synthRef.current) {
                try { synthRef.current.dispose(); } catch (_) { }
            }
        };
    }, []);

    // Timer & Target Movement
    useEffect(() => {
        let timer = null;
        let posTimer = null;

        if (isRunning && timeLeft > 0) {
            timer = setInterval(() => {
                setTimeLeft(prev => prev - 1);
            }, 1000);

            posTimer = setInterval(() => {
                setTargetPos({
                    x: 15 + Math.random() * 70,
                    y: 15 + Math.random() * 70
                });
            }, 3000);
        } else if (timeLeft === 0) {
            setIsRunning(false);
            try {
                if (synthRef.current) synthRef.current.triggerAttackRelease('C5', '4n');
            } catch (_) { }
        }

        return () => {
            clearInterval(timer);
            clearInterval(posTimer);
        };
    }, [isRunning, timeLeft]);

    const handleTogglePlay = () => {
        setIsRunning(!isRunning);
    };

    return (
        <div className="flex flex-col items-center justify-center py-4 max-w-xl mx-auto w-full text-center space-y-6">
            {/* Interactive Eye Tracking Canvas */}
            <div className="w-full relative h-64 bg-slate-950 rounded-3xl border border-secondary/20 p-4 overflow-hidden flex items-center justify-center shadow-inner">
                {/* Floating Target Orb */}
                <motion.div
                    animate={{ left: `${targetPos.x}%`, top: `${targetPos.y}%` }}
                    transition={{ duration: 2.5, ease: 'easeInOut' }}
                    className="absolute -translate-x-1/2 -translate-y-1/2 flex items-center justify-center"
                >
                    <div className="w-12 h-12 rounded-full bg-cyan-400/20 border-2 border-cyan-400 flex items-center justify-center shadow-lg shadow-cyan-400/40 animate-pulse">
                        <div className="w-4 h-4 rounded-full bg-cyan-300" />
                    </div>
                </motion.div>

                {/* Center Timer Overlay */}
                <div className="z-10 bg-slate-900/80 px-5 py-2.5 rounded-full border border-cyan-400/30 text-cyan-300 font-mono text-2xl font-bold backdrop-blur-sm">
                    00:{timeLeft.toString().padStart(2, '0')}
                </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-3">
                <button
                    onClick={handleTogglePlay}
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-primary hover:bg-primary-hover dark:bg-accent dark:hover:bg-accent-hover text-white dark:text-bg-dark font-bold text-xs shadow-md transition-all cursor-pointer"
                >
                    {isRunning ? <FiPause className="w-4 h-4 fill-current" /> : <FiPlay className="w-4 h-4 fill-current" />}
                    {isRunning ? 'Pause Target' : 'Start 20s Eye Tracking'}
                </button>
                {timeLeft === 0 && onComplete && (
                    <button
                        onClick={onComplete}
                        className="inline-flex items-center gap-1.5 px-6 py-3 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
                    >
                        <FiCheckCircle className="w-4 h-4" /> Eye Strain Relieved
                    </button>
                )}
            </div>
        </div>
    );
};
