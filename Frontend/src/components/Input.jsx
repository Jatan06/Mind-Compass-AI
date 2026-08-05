/**
 * Input Component
 * 
 * What is it?
 * A reusable, accessible form text field input component for MindCompass AI.
 * 
 * What does it do?
 * 1. Wraps an `<input>` element with an uppercase tracking label and optional error/helper text.
 * 2. Uses `React.forwardRef` to allow parent components or form libraries to access the underlying input ref.
 * 3. Dynamically applies red validation borders (`border-red-400`) and focus ring styles when an `error` prop is present.
 * 4. Displays validation error text or subtle helper description text below the input field.
 * 
 * @param {string} label - Form field label text displayed above the input
 * @param {string} error - Validation error message (highlights border in red when provided)
 * @param {string} helperText - Descriptive helper text shown when no error is active
 * @param {string} containerClassName - Custom CSS classes applied to the outer wrapper container
 * @param {string} id - HTML `id` attribute for linking label `htmlFor`
 */

import React from 'react';

export const Input = React.forwardRef(
    ({ label, error, helperText, containerClassName = '', id, ...props }, ref) => {
        return (
            <div className={`flex flex-col gap-1.5 w-full text-left ${containerClassName}`}>
                {/* Upper Field Label */}
                {label && (
                    <label
                        htmlFor={id}
                        className="text-xs font-semibold uppercase tracking-wider text-text-dark/75 dark:text-text-light/75 ml-1"
                    >
                        {label}
                    </label>
                )}

                {/* Input Control Container */}
                <div className="relative">
                    <input
                        id={id}
                        ref={ref}
                        className={`w-full rounded-2xl px-4 py-3.5 text-sm transition-all duration-200 
              border outline-none bg-card-light dark:bg-card-dark text-text-dark dark:text-text-light
              ${error
                                ? 'border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-500/35'
                                : 'border-secondary/20 dark:border-secondary/10 focus:border-secondary focus:ring-1 focus:ring-secondary/35'
                            }
            `}
                        {...props}
                    />
                </div>

                {/* Validation Error Message Banner */}
                {error && (
                    <span className="text-xs text-red-500 font-medium ml-1">
                        {error}
                    </span>
                )}

                {/* Optional Field Helper Description Text */}
                {!error && helperText && (
                    <span className="text-xs text-text-dark/50 dark:text-text-light/50 ml-1">
                        {helperText}
                    </span>
                )}
            </div>
        );
    }
);

Input.displayName = 'Input';

export default Input;

