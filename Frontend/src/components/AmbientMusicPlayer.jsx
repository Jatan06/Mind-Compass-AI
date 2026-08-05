import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMusic, FiVolume2, FiVolumeX } from 'react-icons/fi';
import { audioEngine, getSoundscapeForCategory } from '../utils/soundscapes';

/**
 * AmbientMusicPlayer
 * A minimal ambient sound status bar embedded inside the Guided Session view.
 * All play/pause control is driven externally by isTimerRunning + durationSeconds.
 * Users can only mute/unmute from this component.
 */
export const AmbientMusicPlayer = ({
    category = 'All',
    isTimerRunning = false,
    durationSeconds = 300
}) => {
    const [isMuted, setIsMuted] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);
    const prevRunningRef = useRef(false);
    const soundscape = getSoundscapeForCategory(category);

    // Start / pause / stop sound in sync with timer
    useEffect(() => {
        const wasRunning = prevRunningRef.current;
        prevRunningRef.current = isTimerRunning;

        if (isTimerRunning && !wasRunning) {
            // Timer was resumed or started
            if (audioEngine.currentSoundscape?.id === soundscape.id && audioEngine.masterVol) {
                audioEngine.resume();
            } else {
                setIsLoaded(false);
                audioEngine.play(soundscape, durationSeconds).then(() => setIsLoaded(true));
            }
        } else if (!isTimerRunning && wasRunning) {
            // Timer was paused
            audioEngine.pause();
        }
    }, [isTimerRunning]); // eslint-disable-line react-hooks/exhaustive-deps


    // Clean up on unmount
    useEffect(() => {
        return () => { audioEngine.stop(); };
    }, []);

    const handleMuteToggle = () => {
        const next = !isMuted;
        setIsMuted(next);
        audioEngine.setMuted(next);
    };

    if (!isTimerRunning && !prevRunningRef.current) return null;

    return (
        <AnimatePresence>
            <motion.div
                key="ambient-player"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.4 }}
                className="flex items-center justify-between gap-3 px-5 py-3 rounded-2xl border border-secondary/15 dark:border-secondary/10 bg-secondary/5 dark:bg-secondary/5"
            >
                {/* Left: sound info */}
                <div className="flex items-center gap-3 min-w-0">
                    {/* Animated music icon */}
                    <div className="relative flex-shrink-0">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center
                            ${isTimerRunning ? 'bg-primary/15 dark:bg-accent/15 text-primary dark:text-accent' : 'bg-secondary/10 text-text-dark/40 dark:text-text-light/40'}`}>
                            <FiMusic className="w-4 h-4" />
                        </div>
                        {isTimerRunning && (
                            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-card-light dark:border-card-dark">
                                <span className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-75" />
                            </span>
                        )}
                    </div>

                    {/* Soundscape name */}
                    <div className="min-w-0">
                        <p className="text-[10px] uppercase font-bold tracking-wider text-secondary">
                            Ambient Soundscape
                        </p>
                        <p className="text-xs font-semibold text-text-dark dark:text-text-light truncate">
                            {soundscape.title}
                        </p>
                    </div>
                </div>

                {/* Right: waveform visualizer + mute button */}
                <div className="flex items-center gap-3 flex-shrink-0">
                    {/* Simple waveform animation when playing */}
                    {isTimerRunning && !isMuted && (
                        <div className="flex items-end gap-[3px] h-5">
                            {[0.4, 0.7, 1, 0.7, 0.5, 0.8, 0.6].map((h, i) => (
                                <motion.span
                                    key={i}
                                    className="w-[3px] rounded-full bg-primary dark:bg-accent opacity-75"
                                    animate={{ scaleY: [h, 1, h * 0.6, 1, h] }}
                                    transition={{
                                        repeat: Infinity,
                                        duration: 1.2 + i * 0.15,
                                        ease: 'easeInOut',
                                        delay: i * 0.1
                                    }}
                                    style={{ height: '100%', transformOrigin: 'bottom' }}
                                />
                            ))}
                        </div>
                    )}

                    {/* Mute toggle */}
                    <button
                        onClick={handleMuteToggle}
                        title={isMuted ? 'Unmute sound' : 'Mute sound'}
                        className="p-2 rounded-xl hover:bg-secondary/15 dark:hover:bg-secondary/10 transition-colors cursor-pointer text-text-dark/60 dark:text-text-light/60"
                    >
                        {isMuted
                            ? <FiVolumeX className="w-4 h-4" />
                            : <FiVolume2 className="w-4 h-4" />
                        }
                    </button>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};
