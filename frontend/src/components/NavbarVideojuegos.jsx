import React, { useState } from 'react';
import { Gamepad2, Menu, X } from 'lucide-react';

import imgInstagram from '../assets/social/instagram.png';
import imgYoutube from '../assets/social/youtube.png';
import imgCampus from '../assets/social/campus.png';
import imgWeb from '../assets/social/web.png';
import imgFacebook from '../assets/social/facebook.png';

const SOCIAL_LINKS = [
    { href: 'https://politecnico.ar/', label: 'Politécnico', src: imgWeb },
    { href: 'https://politecnico.ar/campus/', label: 'Campus', src: imgCampus },
    { href: 'https://www.instagram.com/politecnicotdf/', label: 'Instagram', src: imgInstagram },
    { href: 'https://www.facebook.com/politecnicotdf/', label: 'Facebook', src: imgFacebook },
    { href: 'https://www.youtube.com/@politecnicotdf', label: 'YouTube', src: imgYoutube },
];

export const LogoVideojuegos = () => (
    <div className="flex items-center gap-3">
        <div className="w-12 h-12 shrink-0 bg-gradient-to-br from-[#00ccff] to-[#FF6600] rounded-xl flex items-center justify-center shadow-lg shadow-[#00ccff]/20">
            <Gamepad2 size={24} className="text-[#050814]" />
        </div>
        <div className="flex flex-col leading-tight">
            <span className="text-xl font-black text-white whitespace-nowrap tracking-wider">VIDEOJUEGOS</span>
            <span className="text-xs font-black text-[#00ccff] whitespace-nowrap tracking-widest uppercase">Malvinas Argentinas</span>
        </div>
    </div>
);

export const NavbarVideojuegos = () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <nav className="fixed w-full z-50 transition-all duration-300 backdrop-blur-md bg-[#050814]/70 border-b border-indigo-500/10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-20">
                    <div className="flex-shrink-0 cursor-pointer">
                        <a href="https://politecnico.ar/">
                            <LogoVideojuegos />
                        </a>
                    </div>

                    <div className="hidden md:flex items-center gap-2">
                        {SOCIAL_LINKS.map(({ href, label, src }) => (
                            <a
                                key={href}
                                href={href}
                                target="_blank"
                                rel="noreferrer"
                                aria-label={label}
                                title={label}
                                className="inline-flex items-center gap-2 rounded-lg border border-indigo-300/10 bg-indigo-950/20 px-2.5 py-1.5 text-xs text-indigo-100 hover:bg-[#00ccff]/10 hover:scale-[1.03] transition-all"
                            >
                                <img src={src} alt={label} className="w-5 h-5 object-contain" />
                                <span className="hidden sm:inline-block font-medium">{label}</span>
                            </a>
                        ))}
                    </div>

                    <div className="md:hidden">
                        <button
                            onClick={() => setIsOpen(!isOpen)}
                            className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-white/10 focus:outline-none"
                        >
                            {isOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            {isOpen && (
                <div className="md:hidden bg-[#050814]/95 backdrop-blur-xl border-b border-indigo-500/10">
                    <div className="px-4 py-3 grid grid-cols-2 gap-2">
                        {SOCIAL_LINKS.map(({ href, label, src }) => (
                            <a
                                key={href}
                                href={href}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center justify-center gap-2 rounded-lg border border-indigo-300/10 bg-indigo-950/20 px-2.5 py-2 text-xs text-indigo-100 transition-all active:scale-95"
                            >
                                <img src={src} alt={label} className="w-6 h-6 object-contain" />
                                <span className="font-medium">{label}</span>
                            </a>
                        ))}
                    </div>
                </div>
            )}
        </nav>
    );
};
