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
    const baseStyles = 'inline-flex items-center justify-center font-medium rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer';

    const sizeStyles = {
        sm: 'px-4 py-1.5 text-xs',
        md: 'px-5 py-2.5 text-sm',
        lg: 'px-7 py-3 text-base',
    };

    const variantStyles = {
        primary: 'bg-primary hover:bg-primary-hover text-bg-light shadow-sm hover:shadow-md focus:ring-primary/50',
        secondary: 'bg-secondary hover:bg-secondary-hover text-bg-light shadow-sm hover:shadow focus:ring-secondary/50',
        accent: 'bg-accent hover:bg-accent-hover text-bg-dark shadow-sm hover:shadow focus:ring-accent/50',
        outline: 'border border-secondary/35 text-text-dark dark:text-text-light hover:bg-secondary/10 dark:hover:bg-secondary/5 focus:ring-secondary/30',
        ghost: 'text-text-dark/80 dark:text-text-light/80 hover:text-primary dark:hover:text-accent hover:bg-secondary/10 dark:hover:bg-secondary/5 focus:ring-secondary/20',
    };

    return (
        <motion.button
            whileTap={{ scale: 0.98 }}
            className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
            disabled={disabled}
            {...props}
        >
            {icon && iconPosition === 'left' && <span className="mr-2">{icon}</span>}
            {children}
            {icon && iconPosition === 'right' && <span className="ml-2">{icon}</span>}
        </motion.button>
    );
};
