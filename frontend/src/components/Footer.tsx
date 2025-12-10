import React from 'react';
import { Logo } from './Logo';
import { MapPin, Phone, Mail } from 'lucide-react';

export const Footer = () => {
    return (
        <footer className="bg-black/40 backdrop-blur-lg border-t border-white/5 pt-12 pb-8 mt-auto">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-12">

                    {/* Brand */}
                    <div className="space-y-4">
                        <Logo />
                        <p className="text-gray-400 text-sm leading-relaxed max-w-xs">
                            Centro de Formación Profesional Malvinas Argentinas.
                            Formación profesional de vanguardia en tecnología y programación.
                        </p>
                    </div>

                    {/* Contact */}
                    <div>
                        <h3 className="text-lg font-semibold text-white mb-4 border-b border-brand-cyan/30 inline-block pb-1">Contacto</h3>
                        <ul className="space-y-3">
                            <li className="flex items-start text-gray-400 text-sm">
                                <MapPin size={18} className="mr-2 text-brand-cyan shrink-0 mt-0.5" />
                                <span>Av. Presidente Perón 4276,<br />Los Polvorines, Malvinas Argentinas</span>
                            </li>
                            <li className="flex items-center text-gray-400 text-sm">
                                <Phone size={18} className="mr-2 text-brand-cyan shrink-0" />
                                <span>+54 11 4660-9000</span>
                            </li>
                            <li className="flex items-center text-gray-400 text-sm">
                                <Mail size={18} className="mr-2 text-brand-cyan shrink-0" />
                                <span>info@malvinasargentinas.gob.ar</span>
                            </li>
                        </ul>
                    </div>

                    {/* Links */}
                    <div>
                        <h3 className="text-lg font-semibold text-white mb-4 border-b border-brand-cyan/30 inline-block pb-1">Enlaces</h3>
                        <ul className="space-y-2 text-sm text-gray-400">
                            <li><a href="#" className="hover:text-brand-accent transition-colors">Campus Virtual</a></li>
                            <li><a href="#" className="hover:text-brand-accent transition-colors">Calendario Académico</a></li>
                            <li><a href="#" className="hover:text-brand-accent transition-colors">Soporte Técnico</a></li>
                            <li><a href="#" className="hover:text-brand-accent transition-colors">Política de Privacidad</a></li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-white/5 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center text-xs text-gray-500">
                    <p>&copy; {new Date().getFullYear()} Code 3 Programación NIII. Todos los derechos reservados.</p>
                    <div className="flex space-x-4 mt-4 md:mt-0">
                        <span className="hover:text-white cursor-pointer">Desarrollado con Django & React</span>
                    </div>
                </div>
            </div>
        </footer>
    );
};
