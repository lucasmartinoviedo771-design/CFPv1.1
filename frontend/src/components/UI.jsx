import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Utility for merging tailwind classes
export function cn(...inputs) {
    return twMerge(clsx(inputs));
}

// --- Button ---
export const Button = ({
    className,
    variant = 'primary',
    size = 'md',
    isLoading,
    startIcon,
    children,
    disabled,
    ...props
}) => {
    const variants = {
        primary: 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-sm border border-transparent',
        secondary: 'bg-indigo-800 text-indigo-100 hover:bg-indigo-700 border border-indigo-500/30',
        danger: 'bg-red-600 text-white hover:bg-red-700 shadow-sm border border-transparent',
        ghost: 'bg-transparent text-indigo-300 hover:bg-indigo-900/50 hover:text-white',
        outline: 'bg-transparent border border-indigo-500/30 text-indigo-300 hover:bg-indigo-900/30 hover:text-white'
    };

    const sizes = {
        sm: 'px-3 py-1.5 text-xs',
        md: 'px-4 py-2 text-sm',
        lg: 'px-6 py-3 text-base'
    };

    return (
        <button
            className={cn(
                'inline-flex items-center justify-center rounded-md font-medium transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none cursor-pointer',
                variants[variant],
                sizes[size],
                className
            )}
            disabled={disabled || isLoading}
            {...props}
        >
            {isLoading && (
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            )}
            {!isLoading && startIcon && (
                <span className="mr-2 -ml-1 flex items-center">{startIcon}</span>
            )}
            {children}
        </button>
    );
};

// --- Input ---
export const Input = ({ className, label, error, id, labelClassName, ...props }) => {
    return (
        <div className="w-full">
            {label && <label htmlFor={id} className={cn("block text-sm font-medium text-gray-200 mb-1", labelClassName)}>{label}</label>}
            <input
                id={id}
                className={cn(
                    'block w-full rounded-md border-indigo-500/30 bg-indigo-950/50 text-white placeholder-indigo-400/50 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3 border transition-colors',
                    error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : '',
                    className
                )}
                {...props}
            />
            {error && <p className="mt-1 text-sm text-red-400 animate-pulse">{error}</p>}
        </div>
    );
};

// --- Select ---
export const Select = ({ className, label, options, id, labelClassName, ...props }) => {
    return (
        <div className="w-full">
            {label && <label htmlFor={id} className={cn("block text-sm font-medium text-gray-200 mb-1", labelClassName)}>{label}</label>}
            <select
                id={id}
                className={cn(
                    'block w-full rounded-md border-indigo-500/30 bg-indigo-950/50 text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3 border transition-colors appearance-none', // appearance-none helps styling but removes arrow, usually need custom arrow or keep default. Kept default for robustness unless requested.
                    className
                )}
                {...props}
            >
                {options.map((opt) => (
                    <option key={opt.value} value={opt.value} className="bg-[#1e1b4b] text-white">
                        {opt.label}
                    </option>
                ))}
            </select>
        </div>
    );
};

// --- Card ---
export const Card = ({ children, className, title }) => (
    <div className={cn("bg-indigo-900/20 overflow-hidden shadow-lg rounded-xl border border-indigo-500/20 backdrop-blur-sm", className)}>
        {title && (
            <div className="px-6 py-4 border-b border-indigo-500/20 bg-indigo-950/30">
                <h3 className="text-lg leading-6 font-bold text-white">{title}</h3>
            </div>
        )}
        <div className="px-6 py-6">{children}</div>
    </div>
);

// --- Table ---
export const Table = ({ headers, children }) => (
    <div className="overflow-x-auto rounded-lg border border-indigo-500/20">
        <table className="min-w-full divide-y divide-indigo-500/20">
            <thead className="bg-indigo-950 text-indigo-200">
                <tr>
                    {headers.map((h, i) => (
                        <th key={i} scope="col" className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider">
                            {h}
                        </th>
                    ))}
                </tr>
            </thead>
            <tbody className="bg-transparent divide-y divide-indigo-500/10">
                {children}
            </tbody>
        </table>
    </div>
);

export const TableRow = ({ children, className }) => (
    <tr className={cn("hover:bg-indigo-500/10 transition-colors", className)}>{children}</tr>
);

export const TableCell = ({ children, className, ...props }) => (
    <td className={cn("px-6 py-4 whitespace-nowrap text-sm text-gray-300", className)} {...props}>{children}</td>
);

// --- Badge ---
export const Badge = ({ children, variant = 'neutral' }) => {
    const variants = {
        success: 'bg-green-500/20 text-green-400 border border-green-500/30',
        warning: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
        error: 'bg-red-500/20 text-red-400 border border-red-500/30',
        neutral: 'bg-gray-500/20 text-gray-300 border border-gray-500/30',
        primary: 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
    };
    return (
        <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold backdrop-blur-sm", variants[variant])}>
            {children}
        </span>
    );
};
