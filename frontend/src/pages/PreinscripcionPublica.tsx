import React, { useEffect, useMemo, useState } from "react";

const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY as string;

function loadRecaptcha() {
  if (document.querySelector(`script[src*="recaptcha"]`)) return;
  const script = document.createElement("script");
  script.src = `https://www.google.com/recaptcha/api.js?render=${RECAPTCHA_SITE_KEY}`;
  script.async = true;
  document.head.appendChild(script);
}

function getRecaptchaToken(action: string): Promise<string> {
  return new Promise((resolve) => {
    const w = window as unknown as { grecaptcha?: { ready: (cb: () => void) => void; execute: (key: string, opts: { action: string }) => Promise<string> } };
    if (!w.grecaptcha) return resolve("");
    w.grecaptcha.ready(async () => {
      try {
        const token = await w.grecaptcha!.execute(RECAPTCHA_SITE_KEY, { action });
        resolve(token);
      } catch {
        resolve("");
      }
    });
  });
}
import {
  ArrowRight,
  ArrowLeft,
  Moon,
  Sun,
  CheckCircle2,
  X
} from "lucide-react";
import { apiClientV2 } from "../api/client";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";
import {
  compressImage,
  validateFile,
  normalizeText,
  calculateAge
} from "../components/Preinscripcion/formHelpers";
import {
  STORAGE_KEY,
  FormState,
  INIT_FORM,
  Bloque,
  ProgramaOferta
} from "../components/PreinscripcionPublica/types";
import { ProgressBar } from "../components/PreinscripcionPublica/ProgressBar";
import { StepOferta } from "../components/PreinscripcionPublica/StepOferta";
import { StepIdentidad } from "../components/PreinscripcionPublica/StepIdentidad";
import { StepContacto } from "../components/PreinscripcionPublica/StepContacto";
import { StepDocumentacion } from "../components/PreinscripcionPublica/StepDocumentacion";

function isProgramacionII(bloqueNombre: string): boolean {
  return normalizeText(bloqueNombre).includes("programacion ii");
}

function isProgramadorNivelIII(programaNombre: string): boolean {
  const norm = normalizeText(programaNombre);
  return norm.includes("programador de nivel iii") || norm.includes("programacion de nivel iii") || norm.includes("programacion (nivel iii)");
}

function loadSaved(): { form: FormState; step: number; selectedProgramaIds: string[]; bloquesPorPrograma: Record<string, number[]> } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { form: INIT_FORM, step: 1, selectedProgramaIds: [], bloquesPorPrograma: {} };
    const parsed = JSON.parse(raw) as {
      form?: Partial<FormState>;
      step?: number;
      selectedProgramaIds?: string[];
      bloquesPorPrograma?: Record<string, number[]>;
      expiresAt?: number;
    } | null;
    if (!parsed) return { form: INIT_FORM, step: 1, selectedProgramaIds: [], bloquesPorPrograma: {} };
    if (parsed.expiresAt && Date.now() > parsed.expiresAt) {
      localStorage.removeItem(STORAGE_KEY);
      return { form: INIT_FORM, step: 1, selectedProgramaIds: [], bloquesPorPrograma: {} };
    }
    return {
      form: { ...INIT_FORM, ...parsed.form },
      step: parsed.step || 1,
      selectedProgramaIds: parsed.selectedProgramaIds || [],
      bloquesPorPrograma: parsed.bloquesPorPrograma || {},
    };
  } catch {
    return { form: INIT_FORM, step: 1, selectedProgramaIds: [], bloquesPorPrograma: {} };
  }
}

export default function PreinscripcionPublica() {
  const saved = useMemo(() => loadSaved(), []);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [step, setStep] = useState(saved.step);
  const [oferta, setOferta] = useState<ProgramaOferta[]>([]);
  const [isDark, setIsDark] = useState(() => localStorage.getItem("preins_theme") !== "light");

  const [selectedProgramaIds, setSelectedProgramaIds] = useState<string[]>(saved.selectedProgramaIds);
  const [expandedProgramaId, setExpandedProgramaId] = useState("");
  const [bloquesPorPrograma, setBloquesPorPrograma] = useState<Record<string, number[]>>(saved.bloquesPorPrograma);

  const [dniFile, setDniFile] = useState<File | null>(null);
  const [tituloFile, setTituloFile] = useState<File | null>(null);
  const [dniTutorFile, setDniTutorFile] = useState<File | null>(null);

  const [form, setForm] = useState<FormState>(saved.form);

  useEffect(() => { loadRecaptcha(); }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const { data } = await apiClientV2.get<{ items?: ProgramaOferta[] }>("/preinscripcion/oferta");
        setOferta(Array.isArray(data?.items) ? data.items : []);
      } catch {
        setError("No se pudo cargar la oferta.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    localStorage.setItem("preins_theme", isDark ? "dark" : "light");
  }, [isDark]);

  useEffect(() => {
    const expiresAt = Date.now() + 24 * 60 * 60 * 1000;
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ form, step, selectedProgramaIds, bloquesPorPrograma, expiresAt })
    );
  }, [form, step, selectedProgramaIds, bloquesPorPrograma]);

  const selectedProgramas = useMemo(() => oferta.filter((p) => selectedProgramaIds.includes(String(p.programa_id))), [oferta, selectedProgramaIds]);
  const selectedProgramaSet = useMemo(() => new Set(selectedProgramaIds), [selectedProgramaIds]);

  const edad = useMemo(() => {
    return calculateAge(form.fecha_nacimiento);
  }, [form.fecha_nacimiento]);

  const esMenor = edad < 18;

  const requiresTitle = useMemo(() => {
    if (esMenor) return false;
    return selectedProgramas.some(p => Boolean(p.requiere_titulo_secundario) || isProgramadorNivelIII(p.programa_nombre));
  }, [selectedProgramas, esMenor]);

  const ofertaView = useMemo<ProgramaOferta[]>(() =>
    oferta
      .filter((p) => normalizeText(p.programa_nombre) !== "sistemas de representacion" && !normalizeText(p.programa_nombre).includes("tecnicatura"))
      .map((p) => ({
        ...p,
        bloquesOrdenados: [...(p.bloques || [])].sort((a, b) => (isProgramacionII(a.bloque_nombre) ? 1 : 0) - (isProgramacionII(b.bloque_nombre) ? 1 : 0)),
      })).sort((a, b) => {
        const aProg = isProgramadorNivelIII(a.programa_nombre) ? 0 : 1;
        const bProg = isProgramadorNivelIII(b.programa_nombre) ? 0 : 1;
        return aProg !== bProg ? aProg - bProg : a.programa_nombre.localeCompare(b.programa_nombre, "es");
      }), [oferta]
  );

  const validateStep = (s: number): boolean => {
    setError("");
    if (s === 1) {
      if (!selectedProgramaIds.length) return setError("Seleccioná al menos una oferta formativa."), false;
      for (const pid of selectedProgramaIds) {
        if (!(bloquesPorPrograma[String(pid)] || []).length) {
          const p = oferta.find(x => String(x.programa_id) === String(pid));
          return setError(`Debés elegir al menos un bloque en ${p?.programa_nombre}.`), false;
        }
      }
    }
    if (s === 2) {
      if (!form.apellido.trim() || !form.nombre.trim() || !form.dni.trim() || !form.fecha_nacimiento) {
        return setError("Completá los campos obligatorios (Nombre, Apellido, DNI y Fecha de Nacimiento)."), false;
      }
      if (esMenor) {
        if (edad < 16) return setError("La edad mínima para preinscribirse es de 16 años."), false;
        // Solo Nivel III
        const soloNivelIII = selectedProgramas.every(p => isProgramadorNivelIII(p.programa_nombre));
        if (!soloNivelIII) return setError("Atención: Los menores de 18 años solo pueden inscribirse en el curso de 'Programación de Nivel III'."), false;

        if (!form.tutor_nombre.trim() || !form.tutor_dni.trim()) {
          return setError("Al ser menor de edad, debés completar los datos del padre/tutor."), false;
        }
      }
    }
    if (s === 3) {
      if (!form.email.trim()) return setError("El email es obligatorio para el contacto."), false;
    }
    if (s === 4) {
      if (!dniFile) return setError("Debés adjuntar la digitalización del DNI."), false;
      if (esMenor && !dniTutorFile) return setError("Debés adjuntar la digitalización del DNI del Padre/Madre o Tutor."), false;
      if (requiresTitle && !tituloFile) return setError("Esta oferta requiere adjuntar el título secundario."), false;
    }
    return true;
  };

  const nextStep = () => {
    if (validateStep(step)) {
      setStep(prev => Math.min(prev + 1, 4));
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const prevStep = () => {
    setStep(prev => Math.max(prev - 1, 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setForm(prev => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const openPrograma = (p: ProgramaOferta) => {
    const id = String(p.programa_id);
    if (selectedProgramaSet.has(id)) {
      setSelectedProgramaIds(prev => prev.filter(x => x !== id));
      setBloquesPorPrograma(prev => { const n = { ...prev }; delete n[id]; return n; });
      setExpandedProgramaId(curr => curr === id ? "" : curr);
      return;
    }
    setSelectedProgramaIds(prev => [...prev, id]);
    setExpandedProgramaId(id);
    const defaults = (p.bloques || [])
      .filter(b => (b.correlativas_ids || []).length === 0 && !isProgramacionII(b.bloque_nombre))
      .map(b => b.bloque_id);
    setBloquesPorPrograma(prev => ({ ...prev, [id]: defaults }));
  };

  const toggleBloque = (pid: number, bid: number) => {
    const actuales = bloquesPorPrograma[String(pid)] || [];
    const next = actuales.includes(bid)
      ? (actuales.length <= 1 ? actuales : actuales.filter(x => x !== bid))
      : [...actuales, bid];
    setBloquesPorPrograma(prev => ({ ...prev, [String(pid)]: next }));
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validateStep(1)) return setStep(1);
    if (!validateStep(2)) return setStep(2);
    if (!validateStep(3)) return setStep(3);

    const dniErr = validateFile(dniFile, "DNI");
    if (dniErr) return setError(dniErr), setStep(4);
    if (requiresTitle) {
      const tErr = validateFile(tituloFile, "Título secundario");
      if (tErr) return setError(tErr), setStep(4);
    }

    try {
      setSaving(true);
      const recaptchaToken = await getRecaptchaToken("preinscripcion_publica");
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, typeof v === "boolean" ? String(v) : (v || "")));
      const seleccion = selectedProgramaIds.map(pid => ({ programa_id: Number(pid), bloque_ids: bloquesPorPrograma[pid] }));
      fd.append("seleccion_programas_json", JSON.stringify(seleccion));
      fd.append("recaptcha_token", recaptchaToken);

      if (dniFile) {
        const processedDni = await compressImage(dniFile);
        fd.append("dni_digitalizado", processedDni);
      }

      if (tituloFile && !esMenor) {
        const processedTitulo = await compressImage(tituloFile);
        fd.append("titulo_secundario_digitalizado", processedTitulo);
      }

      if (dniTutorFile && esMenor) {
        const processedDniTutor = await compressImage(dniTutorFile);
        fd.append("dni_tutor_digitalizado", processedDniTutor);
      }

      const { data } = await apiClientV2.post<{ estudiante_id?: number }>("/preinscripcion", fd, { headers: { "Content-Type": "multipart/form-data" } });
      setOk(`¡Éxito! Estudiante registrado. ID: ${data?.estudiante_id}`);
      localStorage.removeItem(STORAGE_KEY);
      setStep(1);
      setForm(INIT_FORM);
      setDniFile(null);
      setTituloFile(null);
      setDniTutorFile(null);
      setSelectedProgramaIds([]);
      setExpandedProgramaId("");
      setBloquesPorPrograma({});
    } catch (eReq) {
      console.error("Error completo:", eReq);
      let msg = "Error al enviar el formulario.";
      const errorObj = eReq as { response?: { data?: string | Record<string, string | string[]> } };
      const data = errorObj.response?.data;
      if (data) {
        if (typeof data === "string") msg = data;
        else if (data && typeof data === "object" && "detail" in data && typeof data.detail === "string") {
          msg = data.detail;
        } else if (typeof data === "object") {
          const firstKey = Object.keys(data)[0];
          const firstError = data[firstKey];
          msg = Array.isArray(firstError) ? `${firstKey}: ${firstError[0]}` : String(firstError);
        }
      }
      setError(msg);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally { setSaving(false); }
  };

  const theme = isDark
    ? {
      page: "bg-[#090026] text-white",
      glass: "bg-brand-primary/20 border-white/10 backdrop-blur-xl shadow-2xl shadow-indigo-500/10",
      help: "text-indigo-200",
      title: "text-white",
      input: "bg-indigo-950/40 border-indigo-500/30 text-white placeholder-indigo-300 focus:border-cyan-400/70 focus:ring-1 focus:ring-cyan-400/20",
    }
    : {
      page: "bg-[#cfe3f2] text-[#0f172a]",
      glass: "bg-[#b8d6ea] border-[#6ba3c7] backdrop-blur-xl shadow-xl shadow-[#6ba3c7]/20",
      help: "text-[#1e3a5f]",
      title: "text-[#0f172a]",
      input: "bg-[#a8cce3] border-[#6ba3c7] text-[#0f172a] placeholder-[#355a78] focus:border-sky-600 focus:ring-1 focus:ring-sky-400",
    };

  return (
    <div className={`flex flex-col min-h-screen font-sans selection:bg-cyan-400/30 transition-colors duration-500 ${theme.page}`}>
      <Navbar
        rightSlot={
          <button
            onClick={() => setIsDark(!isDark)}
            className={`p-2 rounded-xl border ${isDark ? "bg-white/5 border-white/10 text-cyan-400" : "bg-white border-[#6ba3c7] text-[#1e3a5f]"} transition-all hover:scale-110 shadow-lg`}
          >
            {isDark ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        }
      />

      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className={`absolute top-0 left-0 w-full h-full ${isDark ? "bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/20 via-[#0a0033] to-[#0a0033]" : "bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-200 via-slate-100 to-slate-100"}`}></div>
        <div className={`absolute top-0 left-1/4 w-96 h-96 rounded-full blur-[120px] transition-opacity duration-1000 ${isDark ? 'bg-cyan-400/20' : 'bg-sky-400/20 opacity-40'}`} />
        <div className={`absolute bottom-0 right-1/4 w-96 h-96 rounded-full blur-[120px] transition-opacity duration-1000 ${isDark ? 'bg-orange-500/10' : 'bg-orange-300/20 opacity-30'}`} />
      </div>

      <main className="relative z-10 flex-grow pt-28 pb-20 px-4 flex flex-col items-center">
        <div className="max-w-4xl w-full space-y-8">
          <header className="text-center space-y-4 animate-in fade-in slide-in-from-top-4 duration-700">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-cyan-400/30 bg-cyan-400/10 text-cyan-400 text-xs font-black tracking-widest uppercase">
              <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" /> CFP Malvinas Argentinas
            </div>
            <h1 className={`text-4xl md:text-6xl font-black ${theme.title} tracking-tight`}>
              Inscripción <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-orange-500">2026</span>
            </h1>
            <p className={`${theme.help} text-lg font-medium`}>Completá los pasos para formar parte del CFP Malvinas Argentinas.</p>
          </header>

          <div className={`${theme.glass} rounded-[2rem] p-6 md:p-12 relative overflow-hidden transition-all duration-700`}>
            {loading ? (
              <div className="flex items-center justify-center min-h-[400px] text-cyan-400">Cargando oferta...</div>
            ) : (
              <>
                <ProgressBar currentStep={step} totalSteps={4} isDark={isDark} />

                {error && (
                  <div className="mb-6 animate-in fade-in slide-in-from-right-4 duration-300">
                    <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex items-center gap-3 text-red-400 font-medium text-sm">
                      <div className="p-2 bg-red-500 rounded-lg text-white"><X size={16} /></div> {error}
                    </div>
                  </div>
                )}

                <form onSubmit={onSubmit} className="space-y-10 min-h-[400px]">
                  {step === 1 && (
                    <StepOferta
                      ofertaView={ofertaView}
                      selectedProgramaSet={selectedProgramaSet}
                      expandedProgramaId={expandedProgramaId}
                      bloquesPorPrograma={bloquesPorPrograma}
                      openPrograma={openPrograma}
                      toggleBloque={toggleBloque}
                      isDark={isDark}
                    />
                  )}

                  {step === 2 && (
                    <StepIdentidad form={form} onChange={onChange} edad={edad} esMenor={esMenor} isDark={isDark} />
                  )}

                  {step === 3 && (
                    <StepContacto form={form} onChange={onChange} isDark={isDark} />
                  )}

                  {step === 4 && (
                    <StepDocumentacion
                      esMenor={esMenor}
                      requiresTitle={requiresTitle}
                      dniFile={dniFile}
                      onDniFileChange={setDniFile}
                      dniTutorFile={dniTutorFile}
                      onDniTutorFileChange={setDniTutorFile}
                      tituloFile={tituloFile}
                      onTituloFileChange={setTituloFile}
                      isDark={isDark}
                    />
                  )}

                  <footer className="pt-8 border-t border-white/5 flex flex-col-reverse sm:flex-row justify-between gap-4">
                    {step > 1 && (
                      <button
                        type="button"
                        onClick={prevStep}
                        className={`flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all ${isDark ? "bg-white/5 hover:bg-white/10 text-white" : "bg-white/50 hover:bg-white/80 text-[#1e3a5f]"
                          }`}
                        disabled={saving}
                      >
                        <ArrowLeft size={16} /> Volver
                      </button>
                    )}
                    <div className="flex-grow" />
                    {step < 4 ? (
                      <button type="button" onClick={nextStep} className="group relative flex items-center justify-center gap-3 px-10 py-4 bg-cyan-400 border-b-4 border-cyan-700 text-[#05011a] font-black uppercase tracking-widest text-xs rounded-2xl transition-all hover:scale-[1.02] hover:-translate-y-1 active:border-b-0 active:translate-y-0.5">
                        Siguiente Paso <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                      </button>
                    ) : (
                      <button type="submit" disabled={saving} className="group relative flex items-center justify-center gap-3 px-12 py-4 bg-gradient-to-r from-cyan-400 to-orange-500 text-white font-black uppercase tracking-widest text-xs rounded-2xl transition-all hover:shadow-[0_0_30px_rgba(0,255,255,0.4)] hover:scale-105 active:scale-95 disabled:grayscale">
                        {saving ? "Procesando..." : "Confirmar Preinscripción"} <CheckCircle2 size={16} />
                      </button>
                    )}
                  </footer>
                </form>
              </>
            )}
          </div>

          {ok && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
              <div className="bg-indigo-950/90 border border-cyan-400/30 rounded-[3rem] p-10 max-w-md w-full text-center space-y-6 shadow-2xl relative overflow-hidden">
                <div className="absolute -top-10 -left-10 w-40 h-40 bg-emerald-500/10 rounded-full blur-2xl" />
                <div className="relative mx-auto w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/40">
                  <CheckCircle2 size={50} className="text-[#050814]" />
                  <div className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-25" />
                </div>
                <h3 className="text-3xl font-black tracking-tight">¡Genial!</h3>
                <p className="text-indigo-200 text-sm font-medium leading-relaxed">{ok}</p>
                <button onClick={() => setOk("")} className="w-full py-4 bg-cyan-400 text-[#05011a] font-black rounded-2xl uppercase tracking-widest text-xs hover:bg-cyan-400/80 transition-colors">Cerrar</button>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
