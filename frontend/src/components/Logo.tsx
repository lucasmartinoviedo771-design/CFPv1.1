import React from 'react';

export const Logo = ({ className = "w-12 h-12", showText = true }) => {
    return (
        <div className={`flex items-center gap-3 ${className}`}>
            <div className="w-12 h-12 shrink-0 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
                <span className="text-2xl font-bold text-white">CFP</span>
            </div>

            {showText && (
                <div className="flex flex-col leading-tight">
                    <span className="text-xl font-bold text-white whitespace-nowrap">Malvinas Argentinas</span>
                    <span className="text-base font-semibold text-indigo-300 whitespace-nowrap">Gestión Académica</span>
                </div>
            )}
        </div>
    );
};
