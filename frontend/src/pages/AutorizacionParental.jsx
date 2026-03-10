import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import {
    CheckCircle2,
    ShieldCheck,
    Camera,
    FileText,
    AlertTriangle,
    Loader2,
    Check,
    UserCheck,
    Upload,
    RefreshCw
} from 'lucide-react';
import { apiClientV2 } from '../api/client';
import { Button, Card } from '../components/UI';

export default function AutorizacionParental() {
    const { token } = useParams();
    const [loading, setLoading] = useState(true);
    const [info, setInfo] = useState(null);
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [done, setDone] = useState(false);

    // States for the process
    const [step, setStep] = useState(1); // 1: Welcome/Read, 2: Checks, 3: Selfie
    const [checks, setChecks] = useState({
        leido: false,
        aceptado: false,
        autorizado: false
    });
    const [selfie, setSelfie] = useState(null);
    const [selfiePreview, setSelfiePreview] = useState(null);
    const fileInputRef = useRef(null);

    // Camera states
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null);
    const [cameraMode, setCameraMode] = useState('idle'); // 'idle' | 'requesting' | 'active' | 'denied' | 'captured'

    const stopCamera = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(t => t.stop());
            streamRef.current = null;
        }
    }, []);

    const startCamera = useCallback(async () => {
        setCameraMode('requesting');
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false });
            streamRef.current = stream;
            if (videoRef.current) videoRef.current.srcObject = stream;
            setCameraMode('active');
        } catch {
            setCameraMode('denied');
        }
    }, []);

    const capturePhoto = useCallback(() => {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (!video || !canvas) return;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext('2d').drawImage(video, 0, 0);
        canvas.toBlob(blob => {
            const file = new File([blob], 'selfie.jpg', { type: 'image/jpeg' });
            setSelfie(file);
            setSelfiePreview(URL.createObjectURL(blob));
            setCameraMode('captured');
            stopCamera();
        }, 'image/jpeg', 0.92);
    }, [stopCamera]);

    const retakePhoto = useCallback(() => {
        setSelfie(null);
        setSelfiePreview(null);
        setCameraMode('idle');
    }, []);

    // Stop camera when leaving step 3
    useEffect(() => {
        if (step !== 3) stopCamera();
    }, [step, stopCamera]);

    useEffect(() => {
        const fetchInfo = async () => {
            try {
                const { data } = await apiClientV2.get(`/autorizaciones/${token}`);
                setInfo(data);
                if (data.status === 'DIGITAL') setDone(true);
            } catch (err) {
                setError("El enlace es inválido o ha expirado.");
            } finally {
                setLoading(false);
            }
        };
        fetchInfo();
    }, [token]);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelfie(file);
            setSelfiePreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async () => {
        setSubmitting(true);
        try {
            const fd = new FormData();
            fd.append('selfie', selfie);
            await apiClientV2.post(`/autorizaciones/${token}/submit`, fd, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setDone(true);
        } catch (err) {
            alert("Error al enviar la autorización. Intenta de nuevo.");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-[#090026] flex items-center justify-center">
            <Loader2 className="animate-spin text-brand-cyan" size={48} />
        </div>
    );

    if (error || !info) return (
        <div className="min-h-screen bg-[#090026] flex items-center justify-center p-6 text-center">
            <Card className="max-w-md bg-red-500/10 border-red-500/30">
                <AlertTriangle className="mx-auto text-red-400 mb-4" size={48} />
                <h2 className="text-xl font-bold text-white mb-2">Enlace no válido</h2>
                <p className="text-red-200/70">{error || "No se pudo encontrar la información solicitada."}</p>
            </Card>
        </div>
    );

    if (done) return (
        <div className="min-h-screen bg-[#090026] flex items-center justify-center p-6 text-center">
            <div className="max-w-md animate-in zoom-in duration-500">
                <div className="w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-emerald-500/50">
                    <Check className="text-emerald-400" size={48} />
                </div>
                <h2 className="text-3xl font-black text-white mb-4">¡Autorización Registrada!</h2>
                <p className="text-indigo-200 leading-relaxed mb-8">
                    Muchas gracias, <b>{info.tutor_nombre}</b>. La conformidad para <b>{info.estudiante_nombre} {info.estudiante_apellido}</b> ha sido procesada correctamente.
                </p>
                <p className="text-sm text-indigo-400">Ya puedes cerrar esta ventana.</p>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#090026] text-white font-sans p-4 pb-12">
            <div className="max-w-lg mx-auto pt-8">
                {/* Header */}
                <div className="mb-8 text-center">
                    <div className="inline-flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-white text-lg shadow-lg"
                            style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)' }}>
                            CFP
                        </div>
                        <div className="text-left">
                            <h1 className="text-xl font-black tracking-tight text-white">Malvinas Argentinas</h1>
                            <p className="text-indigo-300 text-xs">Autorización Digital · Inscripción de Menor</p>
                        </div>
                    </div>
                </div>

                {/* Info Card */}
                <Card className="bg-indigo-950/40 border-indigo-500/20 mb-6">
                    <p className="text-indigo-200 text-sm leading-relaxed">
                        Hola <b>{info.tutor_nombre}</b>, para completar la inscripción de <b>{info.estudiante_nombre} {info.estudiante_apellido}</b> en el trayecto <b>{info.programa_nombre}</b>, necesitamos tu conformidad legal.
                    </p>
                </Card>

                {/* Stepper Logic */}
                <div className="space-y-6">

                    {/* STEP 1: READ PDF */}
                    <div className={`transition-all duration-500 ${step === 1 ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
                        <div className="flex items-center gap-3 mb-4">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${step > 1 ? 'bg-emerald-500' : 'bg-brand-cyan'}`}>
                                {step > 1 ? <Check size={16} /> : "1"}
                            </div>
                            <h3 className="font-bold">Lectura de Condiciones</h3>
                        </div>

                        {step === 1 && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="rounded-2xl border border-indigo-500/30 overflow-hidden bg-black/40 h-[450px] flex flex-col">
                                    <div className="p-3 bg-indigo-900/30 border-b border-indigo-500/20 flex items-center gap-2">
                                        <FileText size={16} className="text-indigo-400" />
                                        <span className="text-xs font-bold text-indigo-200">Condiciones CODE3</span>
                                    </div>
                                    <div className="flex-grow overflow-y-auto p-6 text-sm text-indigo-100 leading-relaxed scrollbar-thin scrollbar-thumb-indigo-500/30 font-sans">
                                        <h4 className="text-center font-black mb-1 text-brand-cyan uppercase tracking-tighter">Centro de Formación Profesional “Malvinas Argentinas”</h4>
                                        <p className="text-center font-bold text-indigo-300 mb-6 uppercase text-xs border-b border-indigo-500/20 pb-4">Programador de Nivel III</p>

                                        <div className="space-y-6">
                                            <p className="text-[13px] text-indigo-100/90 leading-relaxed">
                                                La inscripción y permanencia del menor en la oferta formativa <b>CODE 3</b>, autorizada por la Dirección Provincial de Educación Técnico Profesional mediante la <b>Nota N° 22081/2025</b>, queda sujeta al cumplimiento y aceptación de las siguientes condiciones:
                                            </p>

                                            <section>
                                                <h5 className="font-black text-brand-accent uppercase text-[11px] tracking-widest mb-3 flex items-center gap-2">
                                                    <span className="w-5 h-5 bg-brand-accent/20 rounded flex items-center justify-center text-[10px]">1</span>
                                                    Responsabilidad de la Inscripción
                                                </h5>
                                                <ul className="list-disc ml-5 space-y-3 text-indigo-200/90 text-[13px]">
                                                    <li>La inscripción es de carácter personal y voluntario por parte del menor.</li>
                                                    <li>La responsabilidad legal, civil y administrativa sobre la participación del menor recae exclusivamente sobre sus <b>progenitores o tutores responsables declarados</b>.</li>
                                                    <li>El Centro de Formación Profesional (CFP) es la única institución responsable de este trayecto formativo, dejando constancia que al ser una propuesta formativa voluntaria, complementaria y extra-escolar, la misma <b>no guarda vinculación alguna con la institución educativa a la que asista el/la estudiante</b>.</li>
                                                </ul>
                                            </section>

                                            <section>
                                                <h5 className="font-black text-brand-accent uppercase text-[11px] tracking-widest mb-3 flex items-center gap-2">
                                                    <span className="w-5 h-5 bg-brand-accent/20 rounded flex items-center justify-center text-[10px]">2</span>
                                                    Modalidad, Régimen de Presencialidad y Espacios Compartidos
                                                </h5>
                                                <ul className="list-disc ml-5 space-y-3 text-indigo-200/90 text-[13px]">
                                                    <li><b>Cursada Virtual:</b> La propuesta pedagógica se desarrolla bajo una modalidad 100% virtual.</li>
                                                    <li><b>Entornos Multietarios:</b> Se informa que el menor compartirá espacios virtuales de aprendizaje con alumnos mayores de edad en encuentros sincrónicos bajo tecnología MS Teams y asincrónica mediante la Plataforma Moodle.</li>
                                                    <li>Estas tecnologías están monitoreadas por el equipo de gestión académico del Centro. Este Centro no es responsable de las vinculaciones que se desarrollen por afuera de estas tecnologías. <b>Apelamos al cuidado compartido de las vinculaciones del /la menor</b> y solicitamos informarnos de cualquier situación irregular.</li>
                                                    <li><b>Acceso a Actividades:</b> Este proyecto formativo no contempla actividades presenciales en las que se requiera la asistencia del/la menor.</li>
                                                </ul>
                                            </section>

                                            <section>
                                                <h5 className="font-black text-brand-accent uppercase text-[11px] tracking-widest mb-3 flex items-center gap-2">
                                                    <span className="w-5 h-5 bg-brand-accent/20 rounded flex items-center justify-center text-[10px]">3</span>
                                                    Autorización para el Uso de Material Audiovisual
                                                </h5>
                                                <ul className="list-disc ml-5 space-y-3 text-indigo-200/90 text-[13px]">
                                                    <li><b>Clases Grabadas:</b> Los encuentros sincrónicos serán grabados y puestos a disposición de los estudiantes para fines estrictamente pedagógicos en el Campus.</li>
                                                    <li><b>Difusión Institucional:</b> El material generado durante las clases y las imágenes de los encuentros sincrónicos podrán ser utilizados y difundidos en los canales oficiales de comunicación y redes sociales del <b>Centro Politécnico Superior Malvinas Argentinas</b>.</li>
                                                </ul>
                                            </section>

                                            <section>
                                                <h5 className="font-black text-brand-accent uppercase text-[11px] tracking-widest mb-3 flex items-center gap-2">
                                                    <span className="w-5 h-5 bg-brand-accent/20 rounded flex items-center justify-center text-[10px]">4</span>
                                                    Canal de Comunicación Oficial
                                                </h5>
                                                <p className="ml-5 text-indigo-200/90 text-[13px]">
                                                    Se establece como único canal de mensajería instantánea autorizado el WhatsApp del CFP: <b>+54-9-2964355801</b>
                                                </p>
                                            </section>

                                            <section>
                                                <h5 className="font-black text-brand-accent uppercase text-[11px] tracking-widest mb-3 flex items-center gap-2">
                                                    <span className="w-5 h-5 bg-brand-accent/20 rounded flex items-center justify-center text-[10px]">5</span>
                                                    Supervisión y Régimen de Convivencia Virtual
                                                </h5>
                                                <ul className="list-disc ml-5 space-y-3 text-indigo-200/90 text-[13px]">
                                                    <li>El tutor es responsable del comportamiento del menor en los entornos virtuales y el uso de los dispositivos de conexión.</li>
                                                    <li>El menor deberá observar las <a href="/Normas_Convivencia_CFP.pdf" target="_blank" rel="noreferrer" className="text-brand-cyan hover:underline font-bold">normas de convivencia del CFP</a>.</li>
                                                    <li>El uso de lenguaje inapropiado, el incumplimiento de las pautas de comportamiento digital o cualquier conducta que alterara el normal desarrollo de las clases virtuales podría ser motivo de baja del trayecto formativo, previa evaluación de la gravedad del evento por parte del equipo de gestión.</li>
                                                </ul>
                                            </section>

                                            <div className="bg-indigo-500/10 p-5 rounded-2xl border border-indigo-500/20 text-center mt-10">
                                                <h6 className="font-black text-brand-cyan text-[10px] uppercase tracking-[0.2em] mb-2">Aceptación de Condiciones</h6>
                                                <p className="text-[12px] italic text-indigo-200 leading-snug">
                                                    Al formalizar la inscripción, el tutor responsable declara conocer y aceptar estas condiciones en su totalidad.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <Button
                                    fullWidth
                                    onClick={() => setStep(2)}
                                    className="bg-brand-cyan border-none hover:bg-cyan-600 shadow-lg shadow-cyan-900/20"
                                >
                                    He leído las condiciones
                                </Button>
                            </div>
                        )}
                    </div>

                    {/* STEP 2: CHECKS */}
                    <div className={`transition-all duration-500 ${step === 2 ? 'opacity-100 scale-100' : 'opacity-40 scale-95 pointer-events-none'}`}>
                        <div className="flex items-center gap-3 mb-4">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${step > 2 ? 'bg-emerald-500' : (step === 2 ? 'bg-brand-cyan' : 'bg-indigo-900')}`}>
                                {step > 2 ? <Check size={16} /> : "2"}
                            </div>
                            <h3 className="font-bold">Declaración Jurada</h3>
                        </div>

                        {step === 2 && (
                            <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div
                                    onClick={() => setChecks(p => ({ ...p, leido: !p.leido }))}
                                    className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-3 ${checks.leido ? 'border-brand-cyan bg-brand-cyan/10' : 'border-indigo-500/20 bg-indigo-950/20'}`}
                                >
                                    <div className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${checks.leido ? 'bg-brand-cyan border-brand-cyan' : 'border-indigo-500/50'}`}>
                                        {checks.leido && <Check size={14} className="text-white" />}
                                    </div>
                                    <p className="text-sm">Confirmo que he leído y comprendido las condiciones de cursada.</p>
                                </div>

                                <div
                                    onClick={() => setChecks(p => ({ ...p, aceptado: !p.aceptado }))}
                                    className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-3 ${checks.aceptado ? 'border-brand-cyan bg-brand-cyan/10' : 'border-indigo-500/20 bg-indigo-950/20'}`}
                                >
                                    <div className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${checks.aceptado ? 'bg-brand-cyan border-brand-cyan' : 'border-indigo-500/50'}`}>
                                        {checks.aceptado && <Check size={14} className="text-white" />}
                                    </div>
                                    <p className="text-sm">Acepto los términos establecidos para la modalidad virtual.</p>
                                </div>

                                <div
                                    onClick={() => setChecks(p => ({ ...p, autorizado: !p.autorizado }))}
                                    className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-3 ${checks.autorizado ? 'border-brand-cyan bg-brand-cyan/10' : 'border-indigo-500/20 bg-indigo-950/20'}`}
                                >
                                    <div className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${checks.autorizado ? 'bg-brand-cyan border-brand-cyan' : 'border-indigo-500/50'}`}>
                                        {checks.autorizado && <Check size={14} className="text-white" />}
                                    </div>
                                    <p className="text-sm">Autorizo al menor a mi cargo a participar de las actividades académicas.</p>
                                </div>

                                <Button
                                    fullWidth
                                    disabled={!checks.leido || !checks.aceptado || !checks.autorizado}
                                    onClick={() => setStep(3)}
                                    className="mt-4 bg-brand-cyan border-none"
                                >
                                    Continuar
                                </Button>
                            </div>
                        )}
                    </div>

                    {/* STEP 3: SELFIE */}
                    <div className={`transition-all duration-500 ${step === 3 ? 'opacity-100 scale-100' : 'opacity-40 scale-95 pointer-events-none'}`}>
                        <div className="flex items-center gap-3 mb-4">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${step === 3 ? 'bg-brand-cyan' : 'bg-indigo-900'}`}>
                                3
                            </div>
                            <h3 className="font-bold">Validación de Identidad</h3>
                        </div>

                        {step === 3 && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="bg-orange-500/10 border border-orange-500/30 p-4 rounded-2xl">
                                    <p className="text-xs text-orange-200 leading-relaxed font-medium">
                                        <b>Aviso:</b> La firma digital requiere que te tomes una selfie. Esta foto debe coincidir con el <b>DNI del Padre/Madre o Tutor</b> enviado en la inscripción para validar tu identidad.
                                    </p>
                                </div>

                                {/* Camera View */}
                                <div className="flex flex-col items-center gap-3">

                                    {/* Preview or Video */}
                                    <div className="relative w-full max-w-xs aspect-square rounded-2xl overflow-hidden border-2 border-indigo-500/40 bg-indigo-950/40 flex items-center justify-center">
                                        {cameraMode === 'captured' && selfiePreview ? (
                                            <img src={selfiePreview} alt="Selfie" className="w-full h-full object-cover" />
                                        ) : cameraMode === 'active' || cameraMode === 'requesting' ? (
                                            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                                        ) : cameraMode === 'denied' ? (
                                            <div className="flex flex-col items-center gap-3 p-6 text-center">
                                                <AlertTriangle className="text-red-400" size={40} />
                                                <p className="text-sm text-red-300 font-bold">No se pudo acceder a la cámara</p>
                                                <p className="text-xs text-red-200/80 leading-relaxed">
                                                    La cámara es un <b>requisito obligatorio</b> para completar la validación de identidad.<br /><br />
                                                    Por favor intentá nuevamente o abrí este link desde un dispositivo con cámara (celular o PC con webcam).
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center gap-2">
                                                <Camera className="text-indigo-400" size={48} />
                                                <span className="text-xs text-indigo-300">La cámara aparecerá aquí</span>
                                            </div>
                                        )}
                                        {cameraMode === 'requesting' && (
                                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                                <Loader2 className="animate-spin text-brand-cyan" size={32} />
                                            </div>
                                        )}
                                    </div>

                                    {/* Hidden canvas for capture */}
                                    <canvas ref={canvasRef} className="hidden" />

                                    {/* Action Buttons */}
                                    <div className="flex gap-2 w-full max-w-xs">
                                        {cameraMode === 'idle' ? (
                                            <Button
                                                fullWidth
                                                onClick={startCamera}
                                                className="bg-brand-cyan/20 border border-brand-cyan/40 text-brand-cyan hover:bg-brand-cyan/30 py-3"
                                            >
                                                <Camera size={16} className="mr-2" /> Abrir Cámara
                                            </Button>
                                        ) : cameraMode === 'denied' ? (
                                            <Button
                                                fullWidth
                                                onClick={startCamera}
                                                className="bg-red-500/20 border border-red-500/40 text-red-300 hover:bg-red-500/30 py-3"
                                            >
                                                <RefreshCw size={16} className="mr-2" /> Intentar Nuevamente
                                            </Button>
                                        ) : cameraMode === 'active' ? (
                                            <Button
                                                fullWidth
                                                onClick={capturePhoto}
                                                className="bg-brand-cyan border-none py-3 text-[#090026] font-black hover:bg-cyan-400 shadow-lg shadow-cyan-900/30"
                                            >
                                                <Camera size={18} className="mr-2" /> Tomar Foto
                                            </Button>
                                        ) : cameraMode === 'captured' ? (
                                            <Button
                                                fullWidth
                                                variant="outline"
                                                onClick={retakePhoto}
                                                className="border-indigo-500/40 text-indigo-300 py-3"
                                            >
                                                <RefreshCw size={16} className="mr-2" /> Sacar Otra Foto
                                            </Button>
                                        ) : null}
                                    </div>
                                </div>

                                <Button
                                    fullWidth
                                    isLoading={submitting}
                                    disabled={!selfie}
                                    onClick={handleSubmit}
                                    className="bg-brand-accent border-none py-6 text-lg hover:bg-orange-600 shadow-xl shadow-orange-950/20"
                                >
                                    Firmar y Autorizar
                                </Button>

                                <p className="text-[10px] text-center text-indigo-400 uppercase tracking-widest font-black">
                                    Validado por CFP v2.0
                                </p>
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
}
