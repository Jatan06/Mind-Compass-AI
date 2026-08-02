import React from 'react';

export const Input = React.forwardRef(
    ({ label, error, helperText, containerClassName = '', id, ...props }, ref) => {
        return (
            <div className={`flex flex-col gap-1.5 w-full text-left ${containerClassName}`}>
                <label
                    htmlFor={id}
                    className="text-xs font-semibold uppercase tracking-wider text-text-dark/75 dark:text-text-light/75 ml-1"
                >
                    {label}
                </label>
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
                {error && (
                    <span className="text-xs text-red-500 font-medium ml-1">
                        {error}
                    </span>
                )}
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
