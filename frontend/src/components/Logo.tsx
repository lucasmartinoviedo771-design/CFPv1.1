import React from 'react';

// Recreating the "Cube" logo concept with SVG and CSS to match the design provided
export const Logo = ({ className = "w-12 h-12", showText = true }) => {
    return (
        <div className={`flex items-center gap-3 ${className}`}>
            {/* Abstract Cube Representation */}
            <div className="relative w-10 h-10 flex-shrink-0">
                <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-[0_0_10px_rgba(168,85,247,0.5)]">
                    <path d="M50 5 L93.3 30 V80 L50 105 L6.7 80 V30 L50 5Z" fill="url(#grad1)" stroke="#00ccff" strokeWidth="1" />
                    <path d="M50 5 L50 55 M50 55 L93.3 30 M50 55 L6.7 30" stroke="rgba(255,255,255,0.5)" strokeWidth="1" />
                    <defs>
                        <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#d500f9" />
                            <stop offset="100%" stopColor="#2962ff" />
                        </linearGradient>
                    </defs>
                </svg>
            </div>

            {showText && (
                <div className="flex flex-col leading-none tracking-tight">
                    <div className="flex items-baseline">
                        <span className="text-3xl font-bold text-white">Code</span>
                        <span className="text-4xl font-extrabold text-brand-accent ml-1 drop-shadow-md">3</span>
                    </div>
                    <span className="text-[0.6rem] uppercase tracking-widest text-brand-cyan">Programación NIII</span>
                </div>
            )}
        </div>
    );
};
