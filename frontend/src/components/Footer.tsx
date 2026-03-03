import React from "react";
import { Logo } from "./Logo";
import { MapPin, Phone, Mail, MessageCircle } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="bg-black/40 backdrop-blur-lg border-t border-white/5 pt-10 pb-8 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div>
            <Logo />
          </div>

          <div>
            <h3 className="text-lg font-semibold text-white mb-4 border-b border-brand-cyan/30 inline-block pb-1">Contacto</h3>
            <ul className="space-y-3">
              <li className="flex items-start text-gray-300 text-sm">
                <MapPin size={18} className="mr-2 text-brand-cyan shrink-0 mt-0.5" />
                <span>Dirección: Monte Independencia 261, V9420 Río Grande, Tierra del Fuego</span>
              </li>
              <li className="flex items-center text-gray-300 text-sm">
                <MessageCircle size={18} className="mr-2 text-brand-cyan shrink-0" />
                <span>WhatsApp: +54 9 2964 35-5801</span>
              </li>
              <li className="flex items-center text-gray-300 text-sm">
                <Phone size={18} className="mr-2 text-brand-cyan shrink-0" />
                <span>Teléfono: 02964 69-7979</span>
              </li>
              <li className="flex items-center text-gray-300 text-sm">
                <Mail size={18} className="mr-2 text-brand-cyan shrink-0" />
                <span>estudiantes.cfp@malvinastdf.edu.ar</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/5 mt-10 pt-6 flex flex-col md:flex-row justify-center items-center">
          <p className="text-sm font-bold text-white tracking-widest uppercase opacity-90 hover:text-brand-cyan transition-colors duration-300">
            Desarrollado por: <span className="text-brand-cyan">lucasoviedodev@gmail.com</span>
          </p>
        </div>
      </div>
    </footer>
  );
};
