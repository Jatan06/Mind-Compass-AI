/**
 * Button Component
 * 
 * What is it?
 * A versatile, reusable animated UI button component built with Tailwind CSS and Framer Motion.
 * 
 * What does it do?
 * 1. Supports multiple visual variants: `primary`, `secondary`, `accent`, `outline`, and `ghost`.
 * 2. Provides three standardized sizes: `sm` (small), `md` (medium), and `lg` (large).
 * 3. Renders optional icons placed on the `left` or `right` side of the button label text.
 * 4. Integrates Framer Motion's `whileTap` micro-animation for subtle tactile click feedback (scaling down to 0.98).
 * 5. Supports standard HTML button props (e.g. `disabled`, `onClick`, `type`) and custom `className` extensions.
 * 
 * @param {string} [variant='primary'] - Visual color theme ('primary' | 'secondary' | 'accent' | 'outline' | 'ghost')
 * @param {string} [size='md'] - Padding & font size scale ('sm' | 'md' | 'lg')
 * @param {React.ReactNode} children - Button label content or text
 * @param {React.ReactNode} [icon] - Optional icon element (e.g. React-Icons element)
 * @param {string} [iconPosition='right'] - Position of the icon relative to children ('left' | 'right')
 * @param {string} [className=''] - Additional Tailwind CSS classes to append or override
 * @param {boolean} [disabled] - Disables interaction and reduces opacity when true
 */

import React from 'react';
import { motion } from 'framer-motion';

export const Button = ({
    variant = 'primary',
    size = 'md',
    children,
    icon,
    iconPosition = 'right',
    className = '',
    disabled,
    ...props
}) => {
    // Base layout, font, rounding, focus rings, and cursor/disabled styles
    const baseStyles = 'inline-flex items-center justify-center font-medium rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer';

    // Padding and typography size mappings
    const sizeStyles = {
        sm: 'px-4 py-1.5 text-xs',
        md: 'px-5 py-2.5 text-sm',
        lg: 'px-7 py-3 text-base',
    };

    // Color theme variant style mappings
    const variantStyles = {
        primary: 'bg-primary hover:bg-primary-hover text-bg-light shadow-sm hover:shadow-md focus:ring-primary/50',
        secondary: 'bg-secondary hover:bg-secondary-hover text-bg-light shadow-sm hover:shadow focus:ring-secondary/50',
        accent: 'bg-accent hover:bg-accent-hover text-bg-dark shadow-sm hover:shadow focus:ring-accent/50',
        outline: 'border border-secondary/35 text-text-dark dark:text-text-light hover:bg-secondary/10 dark:hover:bg-secondary/5 focus:ring-secondary/30',
        ghost: 'text-text-dark/80 dark:text-text-light/80 hover:text-primary dark:hover:text-accent hover:bg-secondary/10 dark:hover:bg-secondary/5 focus:ring-secondary/20',
    };

    return (
        /* Framer Motion button with scale tap animation */
        <motion.button
            whileTap={{ scale: 0.98 }}
            className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
            disabled={disabled}
            {...props}
        >
            {/* Optional Left Icon */}
            {icon && iconPosition === 'left' && <span className="mr-2">{icon}</span>}
            
            {/* Button Label Text / Content */}
            {children}
            
            {/* Optional Right Icon */}
            {icon && iconPosition === 'right' && <span className="ml-2">{icon}</span>}
        </motion.button>
    );
};

