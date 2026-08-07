import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiActivity, FiPlay, FiPause, FiRotateCcw, FiCheckCircle } from 'react-icons/fi';

const BODY_ZONES = [
    {
        id: 'neck',
        name: 'Neck Roll & Tilt 🦒',
        duration: 30,
        instructions: [
            'Slowly tilt your right ear down toward your right shoulder.',
            'Hold for 10 seconds, feeling the gentle stretch along the left neck.',
            'Roll your head forward slowly and tilt left ear to left shoulder.',
            'Breathe slowly and deeply throughout the motion.'
        ]
    },
    {
        id: 'shoulders',
        name: 'Shoulder Drops 💆',
        duration: 30,
        instructions: [
            'Inhale deeply and shrug your shoulders up to your ears.',
            'Hold for 3 seconds with high tension.',
            'Exhale forcefully and let your shoulders drop completely.',
            'Repeat 4 times to release upper back tightness.'
        ]
    },
    {
        id: 'wrists',
        name: 'Wrist & Hand Release 🖐️',
        duration: 30,
        instructions: [
            'Extend right arm forward with palm facing up.',
            'Use left hand to gently pull right fingers down toward the floor.',
            'Hold for 15 seconds, then switch to the left wrist.',
            'Unclench fingers and shake out both hands.'
        ]
    },
    {
        id: 'back',
        name: 'Seated Spinal Twist 🧘',
        duration: 30,
        instructions: [
            'Sit tall with feet flat on the floor.',
            'Place right hand on left knee and gently twist torso to the left.',
            'Hold for 15 seconds, taking deep abdominal breaths.',
            'Switch sides and twist gently to the right.'
        ]
    },
    {
        id: 'eyes',
        name: 'Eye Strain De-focus 👁️',
        duration: 30,
        instructions: [
            'Look away from all digital screens.',
            'Focus your eyes on a distant object across the room or window.',
            'Blink slowly 5 times to rest wet tear film.',
            'Rub palms together to create warmth and gently cup over closed eyes.'
        ]
    }
];

export const BodyStretchGuide = ({ activity, onComplete }) => {
    const [selectedZone, setSelectedZone] = useState(BODY_ZONES[0]);
    const [timeLeft, setTimeLeft] = useState(BODY_ZONES[0].duration);
    const [isRunning, setIsRunning] = useState(false);

    useEffect(() => {
        let timer = null;
        if (isRunning && timeLeft > 0) {
            timer = setInterval(() => {
                setTimeLeft(prev => prev - 1);
            }, 1000);
        } else if (timeLeft === 0) {
            setIsRunning(false);
        }
        return () => clearInterval(timer);
    }, [isRunning, timeLeft]);

    const handleSelectZone = (zone) => {
        setSelectedZone(zone);
        setTimeLeft(zone.duration);
        setIsRunning(false);
    };

    const handleTogglePlay = () => {
        setIsRunning(!isRunning);
    };

    const handleReset = () => {
        setIsRunning(false);
        setTimeLeft(selectedZone.duration);
    };

    return (
        <div className="flex flex-col items-center justify-center py-4 max-w-xl mx-auto w-full text-center space-y-6">
            {/* Zone Selector Chips */}
            <div className="flex flex-wrap justify-center gap-2">
                {BODY_ZONES.map(z => (
                    <button
                        key={z.id}
                        onClick={() => handleSelectZone(z)}
                        className={`text-xs px-3.5 py-2 rounded-full font-semibold transition-all cursor-pointer ${selectedZone.id === z.id
                                ? 'bg-secondary text-white font-bold shadow-sm'
                                : 'bg-secondary/10 text-text-dark dark:text-text-light hover:bg-secondary/20'
                            }`}
                    >
                        {z.name}
                    </button>
                ))}
            </div>

            {/* Active Stretch Display */}
            <div className="w-full bg-bg-light dark:bg-bg-dark p-6 rounded-3xl border border-secondary/15 space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-text-dark dark:text-text-light">
                        {selectedZone.name}
                    </h3>
                    <div className="w-12 h-12 rounded-full bg-secondary/10 text-primary dark:text-accent font-extrabold text-sm flex items-center justify-center border border-secondary/20">
                        {timeLeft}s
                    </div>
                </div>

                <ul className="text-left text-xs space-y-2 text-text-dark/75 dark:text-text-light/80 bg-card-light dark:bg-card-dark p-4 rounded-2xl border border-secondary/10">
                    {selectedZone.instructions.map((inst, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                            <span className="text-primary dark:text-accent font-bold">•</span>
                            <span>{inst}</span>
                        </li>
                    ))}
                </ul>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-3">
                <button
                    onClick={handleTogglePlay}
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-primary hover:bg-primary-hover dark:bg-accent dark:hover:bg-accent-hover text-white dark:text-bg-dark font-bold text-xs shadow-md transition-all cursor-pointer"
                >
                    {isRunning ? <FiPause className="w-4 h-4 fill-current" /> : <FiPlay className="w-4 h-4 fill-current" />}
                    {isRunning ? 'Pause Stretch' : 'Start 30s Timer'}
                </button>
                <button
                    onClick={handleReset}
                    className="p-3 rounded-full border border-secondary/20 hover:bg-secondary/10 text-text-dark dark:text-text-light transition-all cursor-pointer"
                >
                    <FiRotateCcw className="w-4 h-4" />
                </button>
                {onComplete && (
                    <button
                        onClick={onComplete}
                        className="inline-flex items-center gap-1.5 px-5 py-3 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-bold text-xs transition-all cursor-pointer hover:bg-emerald-500/20"
                    >
                        <FiCheckCircle className="w-4 h-4" /> Done Stretching
                    </button>
                )}
            </div>
        </div>
    );
};
