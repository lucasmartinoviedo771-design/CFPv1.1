import React, { useState } from 'react';
import { Logo } from './Logo';
import { Globe, Instagram, Facebook, Menu, X, Youtube } from 'lucide-react';


import imgInstagram from '../assets/social/instagram.png';
import imgYoutube from '../assets/social/youtube.png';
import imgCampus from '../assets/social/campus.png';
import imgWeb from '../assets/social/web.png';
import imgFacebook from '../assets/social/facebook.png';

type NavbarProps = {
    rightSlot?: React.ReactNode;
};

const SOCIAL_LINKS = [
    { href: 'https://politecnico.ar/cfp.html', label: 'Sitio CFP', src: imgWeb },
    { href: 'https://politecnico.ar/campus/', label: 'Campus', src: imgCampus },
    { href: 'https://www.instagram.com/politecnicotdf/', label: 'Instagram', src: imgInstagram },
    { href: 'https://www.facebook.com/politecnicotdf/', label: 'Facebook', src: imgFacebook },
    { href: 'https://www.youtube.com/@politecnicotdf', label: 'YouTube', src: imgYoutube },
];

export const Navbar = ({ rightSlot }: NavbarProps) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <nav className="fixed w-full z-50 transition-all duration-300 backdrop-blur-md bg-brand-dark/70 border-b border-white/10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-20">
                    <div className="flex-shrink-0 cursor-pointer">
                        <a href="https://politecnico.ar/">
                            <Logo />
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
                                className="inline-flex items-center gap-2 rounded-lg border border-indigo-300/30 bg-indigo-700/20 px-2.5 py-1.5 text-xs text-indigo-100 hover:bg-indigo-700/35 hover:scale-[1.03] transition-all"
                            >
                                <img src={src} alt={label} className="w-5 h-5 object-contain" />
                                <span className="hidden sm:inline-block font-medium">{label}</span>
                            </a>
                        ))}
                        {rightSlot ? <div className="ml-2">{rightSlot}</div> : null}
                    </div>

                    <div className="md:hidden">
                        {rightSlot ? <div className="inline-flex items-center mr-2">{rightSlot}</div> : null}
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
                <div className="md:hidden bg-brand-dark/95 backdrop-blur-xl border-b border-white/10">
                    <div className="px-4 py-3 grid grid-cols-2 gap-2">
                        {SOCIAL_LINKS.map(({ href, label, src }) => (
                            <a
                                key={href}
                                href={href}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center justify-center gap-2 rounded-lg border border-indigo-300/30 bg-indigo-700/20 px-2.5 py-2 text-xs text-indigo-100 transition-all active:scale-95"
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
