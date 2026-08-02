import React from 'react';

export const HeroIllustration = () => {
    return (
        <svg
            viewBox="0 0 500 500"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-auto max-w-lg mx-auto"
        >
            {/* Background soft sun */}
            <circle cx="280" cy="220" r="140" fill="url(#sun-gradient)" />

            {/* Curved hills - organic, quiet paths */}
            <path
                d="M50 420 C 150 420, 220 340, 300 340 C 380 340, 400 380, 480 380 L 480 470 L 50 470 Z"
                fill="currentColor"
                className="text-secondary/15 dark:text-secondary/5"
            />
            <path
                d="M20 450 C 120 450, 180 395, 260 395 C 340 395, 380 430, 460 430 L 460 470 L 20 470 Z"
                fill="currentColor"
                className="text-secondary/25 dark:text-secondary/10"
            />

            {/* Pathway winding up */}
            <path
                d="M200 470 C 205 440, 220 410, 250 400 C 275 390, 290 365, 295 330 C 300 290, 270 270, 280 230"
                stroke="currentColor"
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray="4 8"
                className="text-primary dark:text-accent opacity-60"
            />

            {/* Abstract organic leaves - minimal lines */}
            {/* Left branch */}
            <path
                d="M100 430 C 95 380, 130 350, 140 310"
                stroke="currentColor"
                strokeWidth="3.5"
                strokeLinecap="round"
                className="text-secondary"
            />
            {/* Leaves on left branch */}
            <path d="M120 380 C 135 375, 140 360, 130 355 C 118 360, 115 375, 120 380 Z" fill="currentColor" className="text-secondary" />
            <path d="M110 395 C 95 395, 90 385, 100 380 C 110 380, 115 390, 110 395 Z" fill="currentColor" className="text-secondary" />
            <path d="M135 340 C 150 335, 155 320, 145 315 C 135 320, 130 335, 135 340 Z" fill="currentColor" className="text-primary dark:text-accent" />

            {/* Right floral element */}
            <path
                d="M380 400 C 400 350, 390 310, 420 270"
                stroke="currentColor"
                strokeWidth="3.5"
                strokeLinecap="round"
                className="text-secondary"
            />
            {/* Leaves on right element */}
            <path d="M395 350 C 410 345, 415 330, 405 325 C 395 330, 390 345, 395 350 Z" fill="currentColor" className="text-primary dark:text-accent" />
            <path d="M410 305 C 425 295, 420 280, 410 285 C 400 290, 400 300, 410 305 Z" fill="currentColor" className="text-secondary" />

            {/* Little organic details: floating seeds */}
            <path d="M120 200 C 125 195, 135 195, 140 200 C 132 205, 125 205, 120 200 Z" fill="currentColor" className="text-secondary/50" />
            <path d="M160 170 C 163 167, 169 167, 172 170 C 167 173, 163 173, 160 170 Z" fill="currentColor" className="text-secondary/50" />
            <path d="M360 140 C 365 135, 375 135, 380 140 C 372 145, 365 145, 360 140 Z" fill="currentColor" className="text-secondary/40" />

            {/* Compass Needle - Floating softly */}
            <g transform="translate(280, 220)">
                <circle cx="0" cy="0" r="16" fill="currentColor" className="text-bg-light dark:text-bg-dark shadow-sm" />
                <path d="M 0,-14 L 4,-3 L 14,0 L 4,3 L 0,14 L -4,3 L -14,0 L -4,-3 Z" fill="currentColor" className="text-primary dark:text-accent" />
                <circle cx="0" cy="0" r="3" fill="currentColor" className="text-secondary" />
            </g>

            <defs>
                <radialGradient id="sun-gradient" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#EADEC9" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#FAF7F0" stopOpacity="0" />
                </radialGradient>
            </defs>
        </svg>
    );
};
