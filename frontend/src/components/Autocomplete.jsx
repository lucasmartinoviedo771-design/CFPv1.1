import React, { useState, useEffect, useRef } from 'react';
import { Search, X, ChevronDown } from 'lucide-react';
import { cn } from './UI';

export const Autocomplete = ({ 
    options, 
    value, 
    onChange, 
    placeholder = "Buscar...", 
    label, 
    className,
    containerClassName,
    isLoading = false
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [filteredOptions, setFilteredOptions] = useState([]);
    const containerRef = useRef(null);
    const inputRef = useRef(null);

    // Sincronizar el término de búsqueda con el valor inicial
    useEffect(() => {
        if (value) {
            const selected = options.find(opt => opt.value === value);
            if (selected) {
                setSearchTerm(selected.label);
            }
        } else {
            setSearchTerm("");
        }
    }, [value, options]);

    // Lógica de filtrado
    useEffect(() => {
        if (!searchTerm || (value && options.find(o => o.value === value)?.label === searchTerm)) {
            setFilteredOptions(options);
            return;
        }
        
        const filtered = options.filter(opt => 
            opt.label.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredOptions(filtered);
    }, [searchTerm, options, value]);

    // Cerrar al hacer clic afuera
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
                const selected = options.find(opt => opt.value === value);
                if (selected) {
                    setSearchTerm(selected.label);
                } else if (!value) {
                    setSearchTerm("");
                }
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [value, options]);

    const handleSelect = (option) => {
        onChange(option.value);
        setSearchTerm(option.label);
        setIsOpen(false);
    };

    const handleClear = (e) => {
        e.stopPropagation();
        onChange("");
        setSearchTerm("");
        setIsOpen(false);
    };

    return (
        <div className={cn("relative w-full", containerClassName)} ref={containerRef}>
            {label && <label className="block text-sm font-medium text-gray-200 mb-1">{label}</label>}
            
            <div className="relative group">
                <input
                    ref={inputRef}
                    type="text"
                    className={cn(
                        "block w-full rounded-lg border-indigo-500/30 bg-indigo-950/40 text-sm text-white placeholder-indigo-400/30 shadow-inner focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 py-2.5 pl-10 pr-12 border transition-all duration-300",
                        isOpen ? "border-indigo-400 ring-2 ring-indigo-500/20" : "",
                        className
                    )}
                    placeholder={placeholder}
                    value={searchTerm}
                    onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setIsOpen(true);
                    }}
                    onFocus={() => setIsOpen(true)}
                />
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <Search className={cn("h-4 w-4 transition-colors", isOpen ? "text-indigo-400" : "text-indigo-600")} />
                </div>
                
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 gap-2">
                    {isLoading ? (
                         <svg className="animate-spin h-4 w-4 text-indigo-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    ) : (
                        <>
                            {searchTerm && (
                                <button 
                                    type="button" 
                                    onClick={handleClear} 
                                    className="p-1 rounded-full hover:bg-white/10 text-indigo-400 hover:text-white transition-all"
                                >
                                    <X className="h-3.5 w-3.5" />
                                </button>
                            )}
                            <div className="h-4 w-[1px] bg-indigo-500/20 mx-1" />
                            <ChevronDown className={cn("h-4 w-4 text-indigo-500/50 transition-transform duration-300", isOpen ? "rotate-180" : "")} />
                        </>
                    )}
                </div>
            </div>

            {isOpen && (
                <div 
                    className="absolute z-[9999] mt-2 w-full max-h-72 overflow-y-auto rounded-xl bg-slate-800 shadow-[0_10px_40px_rgba(0,0,0,0.8)] border-2 border-indigo-500 ring-4 ring-indigo-500/20"
                    style={{ minHeight: '50px' }}
                >
                    {filteredOptions.length > 0 ? (
                        filteredOptions.map((opt) => (
                            <div
                                key={opt.value}
                                className={cn(
                                    "relative cursor-pointer select-none py-3 px-4 transition-all duration-150 border-b border-white/10 last:border-0",
                                    value === opt.value 
                                        ? "bg-indigo-600 text-white font-bold" 
                                        : "text-white hover:bg-indigo-500 bg-slate-800"
                                )}
                                onClick={() => {}} 
                                onMouseDown={(e) => {
                                    e.preventDefault(); 
                                    handleSelect(opt);
                                }}
                            >
                                <div className="flex justify-between items-center">
                                    <span className="block truncate text-sm font-semibold">{opt.label}</span>
                                    {opt.sublabel && <span className="text-[10px] text-white/50">{opt.sublabel}</span>}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="py-8 px-4 text-center text-white/50 italic flex flex-col items-center gap-3 bg-slate-800">
                             <Search size={32} className="opacity-20 text-white" />
                             <span className="text-sm">No hay coincidencias para "{searchTerm}"</span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
