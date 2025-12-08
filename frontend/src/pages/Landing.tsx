import React from 'react';
import { ArrowRight, Code, Cpu, Layers } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';

const FeatureCard = ({ icon, title, desc }) => (
    <div className="bg-brand-primary/20 backdrop-blur-sm border border-white/5 p-6 rounded-2xl hover:bg-brand-primary/40 transition-all hover:-translate-y-1 hover:border-brand-cyan/30 group">
        <div className="w-12 h-12 bg-gradient-to-br from-brand-accent to-purple-600 rounded-lg flex items-center justify-center mb-4 group-hover:shadow-[0_0_15px_rgba(255,102,0,0.5)] transition-shadow">
            {icon}
        </div>
        <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
        <p className="text-gray-400 text-sm leading-relaxed">{desc}</p>
    </div>
);

const Landing = () => {
    return (
        <div className="flex flex-col min-h-screen">
            <Navbar />

            {/* Background elements */}
            <div className="lines-bg">
                <div className="line"></div>
                <div className="line"></div>
                <div className="line"></div>
            </div>

            <div className="flex-grow pt-20 flex flex-col">
                {/* Hero Section */}
                <section className="relative flex-grow flex items-center justify-center px-4 sm:px-6 lg:px-8 py-20 overflow-hidden">

                    <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
                        <div className="space-y-8 animate-fade-in-up">
                            <div className="inline-block px-4 py-1 rounded-full border border-brand-cyan/30 bg-brand-cyan/10 text-brand-cyan text-xs font-bold tracking-wider uppercase mb-2">
                                Inscripciones Abiertas 2025
                            </div>

                            <h1 className="text-5xl md:text-7xl font-extrabold text-white leading-tight">
                                Aprende a <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-accent to-purple-500">Programar</span> <br />
                                el Futuro
                            </h1>

                            <p className="text-lg text-gray-300 max-w-xl border-l-4 border-brand-accent pl-4">
                                Formación Profesional Nivel III. Domina Python, Django y React con la metodología Code 3 en el Centro Politécnico Superior.
                            </p>

                            <div className="flex flex-col sm:flex-row gap-4 pt-4">
                                <Link to="/login" className="flex items-center justify-center gap-2 bg-gradient-to-r from-brand-accent to-red-500 text-white px-8 py-4 rounded-xl font-bold hover:shadow-[0_0_20px_rgba(255,102,0,0.5)] transition-all transform hover:scale-105">
                                    Comenzar Ahora <ArrowRight size={20} />
                                </Link>
                                <button className="flex items-center justify-center gap-2 bg-white/5 border border-white/10 text-white px-8 py-4 rounded-xl font-bold hover:bg-white/10 transition-all backdrop-blur-sm">
                                    Ver Plan de Estudios
                                </button>
                            </div>
                        </div>

                        {/* Abstract Visual Representation */}
                        <div className="hidden lg:flex justify-center items-center relative">
                            <div className="relative w-96 h-96">
                                {/* Decorative glowing circles behind */}
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-brand-primary/30 rounded-full blur-3xl"></div>
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-brand-accent/20 rounded-full blur-2xl"></div>

                                {/* Floating cards simulation */}
                                <div className="absolute top-0 right-0 bg-black/60 backdrop-blur-md p-4 rounded-xl border border-white/10 animate-bounce-slow shadow-xl">
                                    <div className="flex items-center gap-3">
                                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                        <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                    </div>
                                    <div className="mt-3 space-y-2 font-mono text-xs text-green-400">
                                        <p>$ python manage.py runserver</p>
                                        <p className="text-white">Starting development server...</p>
                                    </div>
                                </div>

                                <div className="absolute bottom-10 -left-10 bg-black/60 backdrop-blur-md p-4 rounded-xl border border-white/10 animate-bounce-slow-delay shadow-xl">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center font-bold text-white text-xs">TS</div>
                                        <div className="text-sm font-bold text-white">React Component</div>
                                    </div>
                                    <div className="h-2 w-32 bg-gray-700 rounded mb-1"></div>
                                    <div className="h-2 w-24 bg-gray-700 rounded"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Features Stripe */}
                <section className="bg-black/20 border-y border-white/5 py-16 backdrop-blur-sm">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <FeatureCard
                                icon={<Code className="text-white" />}
                                title="Full Stack Django"
                                desc="Domina el backend con Python y Django Rest Framework, integrando bases de datos MySQL y seguridad JWT."
                            />
                            <FeatureCard
                                icon={<Layers className="text-white" />}
                                title="Frontend Moderno"
                                desc="Crea interfaces reactivas con React, TypeScript y Tailwind CSS. Diseño responsive y UX/UI avanzado."
                            />
                            <FeatureCard
                                icon={<Cpu className="text-white" />}
                                title="IA Integrada"
                                desc="Aprende a utilizar herramientas de Inteligencia Artificial como Google Gemini para potenciar tu código."
                            />
                        </div>
                    </div>
                </section>
            </div>

            <Footer />
        </div>
    );
};

export default Landing;
