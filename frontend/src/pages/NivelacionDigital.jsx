import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { CheckCircle, AlertCircle, Loader, Send, Star, Shield, Cpu, Wifi, Database, Link as LinkIcon, Download, Globe, Lock, LogOut, Mail, MessageCircle } from 'lucide-react';

import { Card, Button } from '../components/UI';

const API_URL = import.meta.env.VITE_API_URL || '/api/v2';

const iconMap = {
    1: <Shield className="text-orange-400" />,
    2: <Cpu className="text-blue-400" />,
    3: <Wifi className="text-emerald-400" />,
    4: <Database className="text-purple-400" />,
    5: <LinkIcon className="text-indigo-400" />,
    6: <Download className="text-cyan-400" />,
    7: <Globe className="text-sky-400" />,
    8: <Lock className="text-red-400" />,
    9: <LogOut className="text-amber-400" />,
    10: <Mail className="text-green-400" />,
};

export default function NivelacionDigital() {
    const { token } = useParams();
    const [testData, setTestData] = useState(null);
    const [answers, setAnswers] = useState({});
    const [wantsModule1, setWantsModule1] = useState(false);
    const [step, setStep] = useState('questions'); // 'questions' | 'preference' | 'result'
    const [loading, setLoading] = useState(true);

    const [submitting, setSubmitting] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchTest = async () => {
            try {
                const { data } = await axios.get(`${API_URL}/nivelacion/test/${token}`);
                if (data.error) {
                    setError(data.error);
                } else {
                    setTestData(data);
                }
            } catch (err) {
                setError("No se pudo cargar el test. El enlace puede haber expirado.");
            } finally {
                setLoading(false);
            }
        };
        fetchTest();
    }, [token]);

    const handleOptionSelect = (qId, optionIdx) => {
        setAnswers(prev => ({ ...prev, [qId]: optionIdx }));
    };

    const calculateCurrentScore = () => {
        let score = 0;
        testData.questions.forEach(q => {
            if (answers[q.id] === q.correct) score++;
        });
        return score;
    };

    const handleContinue = () => {
        if (Object.keys(answers).length < testData.questions.length) {
            alert("Por favor, responde todas las preguntas antes de continuar.");
            return;
        }
        
        const score = calculateCurrentScore();
        if (score >= 7) {
            setStep('preference');
        } else {
            handleSubmit(false);
        }
    };

    const handleSubmit = async (finalWantsModule1) => {
        setSubmitting(true);
        try {
            const { data } = await axios.post(`${API_URL}/nivelacion/submit/${token}`, { 
                answers,
                wants_module1: finalWantsModule1
            });
            setResult(data);
            setStep('result');
        } catch (err) {
            alert("Error al enviar el test. Intenta nuevamente.");
        } finally {
            setSubmitting(false);
        }
    };


    if (loading) return (
        <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
            <Loader className="animate-spin text-brand-accent" size={48} />
        </div>
    );

    if (error || (result && result.error)) return (
        <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4">
            <Card className="max-w-md w-full text-center">
                <AlertCircle className="mx-auto text-red-400 mb-4" size={64} />
                <h2 className="text-2xl font-bold text-white mb-2">Atención</h2>
                <p className="text-indigo-200 mb-6">{error || result.error}</p>
                <Button onClick={() => window.location.href = '/'} variant="outline">Volver al inicio</Button>
            </Card>
        </div>
    );

    if (step === 'result') return (
        <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4">
            <Card className="max-w-xl w-full text-center py-10 px-8">
                <div className="relative inline-block mb-8">
                    {result.passed ? (
                         <div className="bg-emerald-500/10 p-6 rounded-full border border-emerald-500/20">
                            <CheckCircle className="text-emerald-400" size={72} />
                            <Star className="absolute -top-2 -right-2 text-yellow-400 animate-bounce" size={32} />
                         </div>
                    ) : (
                        <div className="bg-brand-accent/10 p-6 rounded-full border border-brand-accent/20">
                            <Star className="text-brand-accent" size={72} />
                        </div>
                    )}
                </div>
                
                <h2 className="text-3xl font-extrabold text-white mb-4">
                    {result.passed ? '¡Excelente Desempeño!' : '¡Gracias por participar!'}
                </h2>
                
                <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 mb-8 border border-white/10">
                    <p className="text-xl text-indigo-100 leading-relaxed">
                        {result.message}
                    </p>
                </div>

                {!result.passed && (
                    <div className="mb-8 p-4 bg-indigo-950/40 rounded-xl border border-indigo-500/20">
                        <p className="text-indigo-200 text-sm mb-4">
                            <b>Horario de cursada (Presencial):</b><br />
                            Lunes y Viernes de 19:00 a 20:20 hs.<br />
                            <i className="text-xs opacity-70">Dirección: Monte Independencia 261, Río Grande.</i>
                        </p>
                        <p className="text-indigo-300 text-xs mb-4">
                            Si tienes alguna duda, no dudes en consultarnos por WhatsApp:
                        </p>
                        <Button 
                            onClick={() => window.open('https://wa.me/5492964355801?text=Hola,%20acabo%20de%20realizar%20el%20test%20de%20nivelación%20digital.', '_blank')}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white w-full h-12"
                            startIcon={<MessageCircle size={20} />}
                        >
                            Contactar por WhatsApp
                        </Button>
                    </div>
                )}


                <p className="text-indigo-400 text-xs mb-8">Tus datos de inscripción han sido actualizados automáticamente en nuestro sistema.</p>
                
                <Button 
                    onClick={() => window.location.href = 'https://politecnico.ar'} 
                    variant="outline"
                    className="border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/10"
                >
                    Volver a la Web Principal
                </Button>
            </Card>
        </div>
    );

    if (step === 'preference') return (
        <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4">
             <Card className="max-w-2xl w-full p-8 md:p-12">
                <div className="text-center mb-10">
                    <div className="inline-block p-5 bg-emerald-500/20 rounded-full mb-6 border border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                        <CheckCircle className="text-emerald-400" size={56} />
                    </div>
                    <h2 className="text-4xl font-black text-white mb-4 tracking-tight">¡Felicitaciones!</h2>
                    <p className="text-lg text-indigo-100 max-w-md mx-auto leading-relaxed">
                        Has demostrado tener los conocimientos necesarios para ingresar directamente al <span className="text-brand-accent font-bold">Módulo 2</span>.
                    </p>
                </div>

                <div className="space-y-6">
                    <p className="text-white font-semibold text-center border-b border-white/5 pb-4">¿Cómo prefieres comenzar tu camino?</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div 
                            onClick={() => setWantsModule1(false)}
                            className={`p-6 rounded-2xl border-2 transition-all group flex flex-col justify-between ${!wantsModule1 ? 'bg-brand-accent/20 border-brand-accent shadow-[0_0_15px_rgba(255,102,0,0.1)]' : 'bg-white/5 border-white/10 hover:border-indigo-500/50'}`}
                        >
                            <div>
                                <h4 className={`font-bold text-xl mb-2 ${!wantsModule1 ? 'text-white' : 'text-indigo-200'}`}>Ir al Módulo 2</h4>
                                <p className="text-indigo-300 text-xs leading-relaxed">Modalidad Virtual. Ideal para quienes ya manejan las bases y quieren avanzar rápido.</p>
                            </div>
                            <div className={`mt-4 w-6 h-6 rounded-full border-2 flex items-center justify-center ${!wantsModule1 ? 'bg-brand-accent border-brand-accent' : 'border-white/20'}`}>
                                {!wantsModule1 && <CheckCircle size={14} className="text-white" />}
                            </div>
                        </div>

                        <div 
                            onClick={() => setWantsModule1(true)}
                            className={`p-6 rounded-2xl border-2 transition-all group flex flex-col justify-between ${wantsModule1 ? 'bg-brand-accent/20 border-brand-accent shadow-[0_0_15px_rgba(255,102,0,0.1)]' : 'bg-white/5 border-white/10 hover:border-indigo-500/50'}`}
                        >
                            <div>
                                <h4 className={`font-bold text-xl mb-2 ${wantsModule1 ? 'text-white' : 'text-indigo-200'}`}>Empezar Módulo 1</h4>
                                <p className="text-indigo-300 text-xs leading-relaxed">Modalidad Presencial. Ideal para reforzar bases con acompañamiento docente antes del Módulo 2.</p>
                            </div>
                            <div className={`mt-4 w-6 h-6 rounded-full border-2 flex items-center justify-center ${wantsModule1 ? 'bg-brand-accent border-brand-accent' : 'border-white/20'}`}>
                                {wantsModule1 && <CheckCircle size={14} className="text-white" />}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-12">
                    <Button 
                        onClick={() => handleSubmit(wantsModule1)} 
                        isLoading={submitting}
                        fullWidth
                        size="lg"
                        className="bg-brand-accent hover:bg-orange-600 h-16 text-xl shadow-2xl shadow-brand-accent/20 font-black uppercase tracking-widest"
                    >
                        Confirmar e Inscribirse
                    </Button>
                </div>
             </Card>
        </div>
    )


    return (
        <div className="min-h-screen bg-[#0f172a] py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto">
                <div className="text-center mb-12 animate-in fade-in slide-in-from-top-4 duration-700">
                    <h1 className="text-4xl font-extrabold text-white tracking-tight mb-4">
                        Centro de Formación Profesional
                    </h1>
                    <div className="inline-block px-4 py-1.5 rounded-full bg-brand-accent/10 border border-brand-accent/20 text-brand-accent font-semibold text-sm mb-4">
                        Test Diagnóstico: Habilidades Digitales
                    </div>
                    <p className="text-xl text-indigo-200">
                        Hola <span className="text-white font-bold">{testData.student_name}</span>. 
                        Este test nos ayudará a asignarte el nivel más adecuado para tu aprendizaje.
                    </p>
                </div>

                <div className="space-y-8">
                    {testData.questions.map((q, idx) => (
                        <Card key={q.id} className="animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: `${idx * 100}ms` }}>
                            <div className="flex items-start gap-4 mb-6">
                                <div className="p-3 bg-indigo-950/50 rounded-lg border border-indigo-500/20">
                                    {iconMap[q.id] || <Star className="text-indigo-400" />}
                                </div>
                                <div>
                                    <span className="text-xs font-bold text-brand-accent uppercase tracking-wider">Pregunta {idx + 1} de 10</span>
                                    <h3 className="text-xl font-bold text-white mt-1">{q.text}</h3>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-3">
                                {q.options.map((opt, optIdx) => (
                                    <button
                                        key={optIdx}
                                        onClick={() => handleOptionSelect(q.id, optIdx)}
                                        className={`w-full text-left p-4 rounded-xl border transition-all duration-200 flex items-center gap-4 ${
                                            answers[q.id] === optIdx
                                                ? 'bg-brand-accent/20 border-brand-accent text-white shadow-lg shadow-brand-accent/10'
                                                : 'bg-indigo-950/30 border-indigo-500/10 text-indigo-300 hover:bg-white/5 hover:border-indigo-500/30'
                                        }`}
                                    >
                                        <div className={`w-6 h-6 rounded-full border flex items-center justify-center flex-shrink-0 ${
                                            answers[q.id] === optIdx ? 'bg-brand-accent border-brand-accent' : 'border-indigo-500/50'
                                        }`}>
                                            {answers[q.id] === optIdx && <CheckCircle size={14} className="text-white" />}
                                        </div>
                                        <span className="text-lg">{opt}</span>
                                    </button>
                                ))}
                            </div>
                        </Card>
                    ))}
                </div>

                <div className="mt-12 flex justify-center">
                    <Button 
                        onClick={handleContinue} 
                        isLoading={submitting}
                        size="lg"
                        className="bg-brand-accent hover:bg-orange-600 text-white min-w-[280px] h-14 text-lg shadow-xl shadow-brand-accent/20"
                        startIcon={<Send size={20} />}
                    >
                        {submitting ? "Enviando respuestas..." : "Finalizar Test"}
                    </Button>
                </div>

                
                <p className="mt-8 text-center text-indigo-400 text-sm">
                    Tus respuestas se asocian automáticamente a tu legajo. No necesitas ingresar datos personales.
                </p>
            </div>
        </div>
    );
}
