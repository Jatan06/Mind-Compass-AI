/**
 * Footer Component
 * 
 * What is it?
 * The global footer component displayed at the bottom of pages across MindCompass AI.
 * 
 * What does it do?
 * 1. Displays brand identity including logo icon, brand title, and tagline description.
 * 2. Renders social media links (Twitter, Instagram, LinkedIn).
 * 3. Provides Product navigation links (Features, About Us, FAQ) that support smooth scrolling to homepage sections.
 * 4. Supplies Legal & Support links (Sign In, Sign Up, Privacy Policy, Terms of Service).
 * 5. Handles policy disclosures via interactive dialog alerts for Privacy and Terms.
 * 6. Displays current year copyright notice, medical/therapy disclaimer, and well-being credit line.
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { LogoIcon } from './Logo';
import { FiHeart, FiShare2, FiGithub } from 'react-icons/fi';
import { ShareModal } from './ShareModal';

export const Footer = () => {
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    // Dynamic year calculation for copyright notice
    const currentYear = new Date().getFullYear();

    return (
      <footer className="w-full bg-bg-light dark:bg-bg-dark border-t border-secondary/15 dark:border-secondary/5 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6 md:px-8 py-12 md:py-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-12 mb-12">
            {/* Brand Identity: Animated Logo, Description, and Social Links */}
            <div className="col-span-1 md:col-span-2 space-y-4">
              <Link
                to="/"
                className="flex items-center gap-3 group focus:outline-none w-fit"
              >
                <LogoIcon
                  size={36}
                  className="transform transition-transform duration-500 group-hover:rotate-45"
                />
                <span className="text-lg font-bold tracking-tight text-primary dark:text-bg-light">
                  Mind
                  <span className="text-secondary font-medium">Compass</span>
                </span>
              </Link>
              <p className="text-sm leading-relaxed text-text-dark/70 dark:text-text-light/75 max-w-sm">
                Navigate Your Mind. Discover Your Balance. A thoughtful mental
                wellness companion designed to support your daily emotional
                journey.
              </p>

              {/* GitHub Link & Share Action Button */}
              <div className="flex items-center gap-3 pt-2">
                <a
                  href="https://github.com/Jatan06/Mind-Compass-AI"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-full text-text-dark/65 dark:text-text-light/65 hover:text-primary dark:hover:text-accent hover:bg-secondary/10 dark:hover:bg-secondary/5 transition-all cursor-pointer outline-none"
                  aria-label="GitHub Repository"
                  title="GitHub Repository"
                >
                  <FiGithub className="w-5 h-5" />
                </a>
                <button
                  type="button"
                  onClick={() => setIsShareModalOpen(true)}
                  className="p-2 rounded-full text-text-dark/65 dark:text-text-light/65 hover:text-primary dark:hover:text-accent hover:bg-secondary/10 dark:hover:bg-secondary/5 transition-all cursor-pointer outline-none flex items-center gap-2 text-xs font-semibold"
                  aria-label="Share MindCompass AI"
                  title="Share MindCompass AI"
                >
                  <FiShare2 className="w-5 h-5" />
                  <span>Share</span>
                </button>
              </div>
            </div>

            {/* Product Links Column: Anchor navigation to landing page sections */}
            <div className="space-y-4">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-secondary dark:text-secondary-hover">
                Product
              </h4>
              <ul className="space-y-2.5">
                <li>
                  <Link
                    to="/#features"
                    onClick={() => {
                      if (window.location.pathname === "/") {
                        document
                          .getElementById("features")
                          ?.scrollIntoView({ behavior: "smooth" });
                      }
                    }}
                    className="text-sm text-text-dark/80 dark:text-text-light/80 hover:text-primary dark:hover:text-accent transition-colors"
                  >
                    Features
                  </Link>
                </li>
                <li>
                  <Link
                    to="/#about"
                    onClick={() => {
                      if (window.location.pathname === "/") {
                        document
                          .getElementById("about")
                          ?.scrollIntoView({ behavior: "smooth" });
                      }
                    }}
                    className="text-sm text-text-dark/80 dark:text-text-light/80 hover:text-primary dark:hover:text-accent transition-colors"
                  >
                    About Us
                  </Link>
                </li>
                <li>
                  <Link
                    to="/#faq"
                    onClick={() => {
                      if (window.location.pathname === "/") {
                        document
                          .getElementById("faq")
                          ?.scrollIntoView({ behavior: "smooth" });
                      }
                    }}
                    className="text-sm text-text-dark/80 dark:text-text-light/80 hover:text-primary dark:hover:text-accent transition-colors"
                  >
                    FAQ
                  </Link>
                </li>
              </ul>
            </div>

            {/* Legal & Support Links Column: Sign-in/up routes and Policy alerts */}
            <div className="space-y-4">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-secondary dark:text-secondary-hover">
                Legal & Support
              </h4>
              <ul className="space-y-2.5">
                <li>
                  <Link
                    to="/login"
                    className="text-sm text-text-dark/80 dark:text-text-light/80 hover:text-primary dark:hover:text-accent transition-colors"
                  >
                    Sign In
                  </Link>
                </li>
                <li>
                  <Link
                    to="/register"
                    className="text-sm text-text-dark/80 dark:text-text-light/80 hover:text-primary dark:hover:text-accent transition-colors"
                  >
                    Sign Up
                  </Link>
                </li>
                <li>
                  <button
                    onClick={() =>
                      alert(
                        "Privacy Policy:\n\nMindCompass protects your privacy. All your journals, mood logs, and personal details are encrypted and never sold or shared with third parties.",
                      )
                    }
                    className="text-sm text-text-dark/80 dark:text-text-light/80 hover:text-primary dark:hover:text-accent transition-colors text-left cursor-pointer"
                  >
                    Privacy Policy
                  </button>
                </li>
                <li>
                  <button
                    onClick={() =>
                      alert(
                        "Terms of Service:\n\nMindCompass provides self-care and tracking tools for wellness. It is not a replacement for medical diagnosis or clinical therapy.",
                      )
                    }
                    className="text-sm text-text-dark/80 dark:text-text-light/80 hover:text-primary dark:hover:text-accent transition-colors text-left cursor-pointer"
                  >
                    Terms of Service
                  </button>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar: Copyright notice, medical disclaimer, and well-being badge */}
          <div className="border-t border-secondary/15 dark:border-secondary/5 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs text-text-dark/60 dark:text-text-light/60 text-center md:text-left">
              &copy; {currentYear} MindCompass. All rights reserved. Not
              replacement for professional medical help.
            </p>
            <p className="text-xs text-text-dark/65 dark:text-text-light/65 flex items-center justify-center md:justify-end gap-1">
              Crafted with{" "}
              <FiHeart className="w-3.5 h-3.5 fill-secondary/80 text-secondary" />{" "}
              for emotional well-being.
            </p>
          </div>
        </div>

        {/* Share Popup Modal */}
        <ShareModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          shareUrl="https://mind-compass-ai-frontend.onrender.com/"
        />
      </footer>
    );
};

