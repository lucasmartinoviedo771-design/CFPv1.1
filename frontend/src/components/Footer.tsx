import React from "react";
import { Logo } from "./Logo";
import { MapPin, Phone, Mail, MessageCircle, Globe, Instagram, Facebook, Youtube } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="bg-black/40 backdrop-blur-lg border-t border-white/5 pt-10 pb-8 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-white mb-4 border-b border-brand-cyan/30 inline-block pb-1">Redes y Sitios</h3>
          <div className="flex flex-wrap gap-3 text-sm">
            <a href="https://politecnico.ar/cfp.html" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-indigo-900/40 hover:bg-indigo-800/50 text-indigo-100"><Globe size={16} /> Sitio CFP</a>
            <a href="https://politecnico.ar/campus/" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-indigo-900/40 hover:bg-indigo-800/50 text-indigo-100"><Globe size={16} /> Campus</a>
            <a href="https://www.instagram.com/politecnicotdf/" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-indigo-900/40 hover:bg-indigo-800/50 text-indigo-100"><Instagram size={16} /> Instagram</a>
            <a href="https://www.facebook.com/politecnicotdf/" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-indigo-900/40 hover:bg-indigo-800/50 text-indigo-100"><Facebook size={16} /> Facebook</a>
            <a href="https://www.youtube.com/@politecnicotdf" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-indigo-900/40 hover:bg-indigo-800/50 text-indigo-100"><Youtube size={16} /> YouTube</a>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="space-y-4">
            <Logo />
            <p className="text-gray-400 text-sm leading-relaxed max-w-md">
              CFP Centro de Formación Profesional "Malvinas Argentinas".
            </p>
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

        <div className="border-t border-white/5 mt-10 pt-6 flex flex-col md:flex-row justify-between items-center text-xs text-gray-500">
          <p>&copy; {new Date().getFullYear()} CFP Centro de Formación Profesional "Malvinas Argentinas".</p>
          <span className="mt-3 md:mt-0">Desarrollado con Django & React</span>
        </div>
      </div>
    </footer>
  );
};
