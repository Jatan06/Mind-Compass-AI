/**
 * HeroIllustration Component
 *
 * What is it?
 * A custom inline SVG vector graphic component featured prominently on the Landing Page hero section.
 *
 * What does it do?
 * 1. Renders a calming, organic nature-inspired landscape matching MindCompass AI's aesthetic theme.
 * 2. Features a soft background sun element rendered with a radial gradient.
 * 3. Draws layered rolling hills and a dashed winding pathway representing the journey of emotional growth.
 * 4. Includes minimalist botanical branches with organic leaf shapes and floating seed details.
 * 5. Highlights a central floating compass needle icon symbolizing direction, balance, and self-discovery.
 */

import React from "react";
import { motion } from "framer-motion";

export const HeroIllustration = () => {
  return (
    <svg
      viewBox="0 0 500 500"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-auto max-w-lg mx-auto"
    >
      {/* Background: Soft sun with radial gradient glow */}
      <circle cx="280" cy="220" r="140" fill="url(#sun-gradient)" />

      {/* Foreground: Curved rolling hills with organic layered paths */}
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

      {/* Pathway: Dashed line winding upward through the landscape */}
      <path
        d="M200 470 C 205 440, 220 410, 250 400 C 275 390, 290 365, 295 330 C 300 290, 270 270, 280 230"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray="4 8"
        className="text-primary dark:text-accent opacity-60"
      />

      {/* Soft Wind Breeze Lines (Left to Right Flow) */}
      <g className="pointer-events-none">
        <motion.path
          d="M 30 250 C 110 235, 190 265, 290 240 C 360 225, 430 250, 480 235"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          className="text-primary/25 dark:text-accent/25"
          initial={{ opacity: 0, x: -30 }}
          animate={{
            opacity: [0, 0.45, 0.45, 0],
            x: [-15, 35, 80],
          }}
          transition={{
            duration: 6.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.path
          d="M 10 320 C 80 305, 160 335, 260 310 C 330 295, 400 320, 470 305"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          className="text-secondary/30 dark:text-secondary/15"
          initial={{ opacity: 0, x: -25 }}
          animate={{
            opacity: [0, 0.35, 0.35, 0],
            x: [-10, 30, 70],
          }}
          transition={{
            duration: 7.2,
            delay: 2.2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </g>

      {/* Botanical Elements: Minimalist left branch & leaves (Swaying slowly & smoothly to right) */}
      <motion.g
        style={{ transformOrigin: "100px 430px" }}
        animate={{
          rotate: [0, 5.5, 0.8, 4.0, 0],
          skewX: [0, -1.5, 0, -0.8, 0],
        }}
        transition={{
          duration: 6.0,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <path
          d="M100 430 C 95 380, 130 350, 140 310"
          stroke="currentColor"
          strokeWidth="3.5"
          strokeLinecap="round"
          className="text-secondary"
        />
        <path
          d="M120 380 C 135 375, 140 360, 130 355 C 118 360, 115 375, 120 380 Z"
          fill="currentColor"
          className="text-secondary"
        />
        <path
          d="M110 395 C 95 395, 90 385, 100 380 C 110 380, 115 390, 110 395 Z"
          fill="currentColor"
          className="text-secondary"
        />
        <path
          d="M135 340 C 150 335, 155 320, 145 315 C 135 320, 130 335, 135 340 Z"
          fill="currentColor"
          className="text-primary dark:text-accent"
        />
      </motion.g>

      {/* Botanical Elements: Minimalist right branch & leaves (Swaying slowly & smoothly to right) */}
      <motion.g
        style={{ transformOrigin: "380px 400px" }}
        animate={{
          rotate: [0, 5.0, 0.6, 3.5, 0],
          skewX: [0, -1.2, 0, -0.6, 0],
        }}
        transition={{
          duration: 6.0,
          delay: 1.0,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <path
          d="M380 400 C 400 350, 390 310, 420 270"
          stroke="currentColor"
          strokeWidth="3.5"
          strokeLinecap="round"
          className="text-secondary"
        />
        <path
          d="M395 350 C 410 345, 415 330, 405 325 C 395 330, 390 345, 395 350 Z"
          fill="currentColor"
          className="text-primary dark:text-accent"
        />
        <path
          d="M410 305 C 425 295, 420 280, 410 285 C 400 290, 400 300, 410 305 Z"
          fill="currentColor"
          className="text-secondary"
        />
      </motion.g>

      {/* Decorative Details: Floating organic seeds/particles (Gently drifting with the breeze) */}
      <motion.path
        d="M120 200 C 125 195, 135 195, 140 200 C 132 205, 125 205, 120 200 Z"
        fill="currentColor"
        className="text-secondary/50"
        animate={{
          x: [0, 50, 100],
          y: [0, -8, -3],
          opacity: [0.2, 0.7, 0.2],
        }}
        transition={{
          duration: 7.0,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.path
        d="M160 170 C 163 167, 169 167, 172 170 C 167 173, 163 173, 160 170 Z"
        fill="currentColor"
        className="text-secondary/50"
        animate={{
          x: [0, 45, 90],
          y: [0, -5, -10],
          opacity: [0.2, 0.7, 0.2],
        }}
        transition={{
          duration: 6.5,
          delay: 1.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.path
        d="M360 140 C 365 135, 375 135, 380 140 C 372 145, 365 145, 360 140 Z"
        fill="currentColor"
        className="text-secondary/40"
        animate={{
          x: [0, 40, 80],
          y: [0, -4, -8],
          opacity: [0.15, 0.6, 0.15],
        }}
        transition={{
          duration: 6.8,
          delay: 3.0,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Central Focal Point: Floating Compass Needle Star */}
      <g transform="translate(280, 220)">
        <motion.g
          animate={{
            y: [0, -5, 0],
          }}
          transition={{
            duration: 5.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <circle
            cx="0"
            cy="0"
            r="16"
            fill="currentColor"
            className="text-bg-light dark:text-bg-dark shadow-sm"
          />
          <path
            d="M 0,-14 L 4,-3 L 14,0 L 4,3 L 0,14 L -4,3 L -14,0 L -4,-3 Z"
            fill="currentColor"
            className="text-primary dark:text-accent"
          />
          <circle
            cx="0"
            cy="0"
            r="3"
            fill="currentColor"
            className="text-secondary"
          />
        </motion.g>
      </g>

      {/* Gradient Definitions */}
      <defs>
        <radialGradient id="sun-gradient" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#EADEC9" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#FAF7F0" stopOpacity="0" />
        </radialGradient>
      </defs>
    </svg>
  );
};
