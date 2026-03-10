import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Moon,
  Sun,
  CheckCircle2,
  User,
  FileText,
  GraduationCap,
  Smartphone,
  UploadCloud,
  X
} from "lucide-react";
import { apiClientV2 } from "../api/client";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";

const MAX_MB = 3;
const ACCEPTED_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
const NIVEL_EDUCATIVO_OPTIONS = [
  "Primaria Completa",
  "Secundaria Incompleta",
  "Secundaria Completa",
  "Terciaria/Universitaria Incompleta",
  "Terciaria/Universitaria Completa",
  "Terciaria/Universitaria",
];

async function compressImage(file) {
  if (!file.type.startsWith("image/")) return file;
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target.result;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;
        const MAX_WIDTH = 1200;
        if (width > MAX_WIDTH) {
          height *= MAX_WIDTH / width;
          width = MAX_WIDTH;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob((blob) => {
          resolve(new File([blob], file.name, { type: "image/jpeg", lastModified: Date.now() }));
        }, "image/jpeg", 0.7);
      };
    };
  });
}

function validateFile(file, label) {
  if (!file) return `${label}: archivo requerido.`;
  // Solo validamos tamaño aquí para el feedback visual inicial, 
  // pero el proceso de carga manejará la compresión de ser necesario.
  if (file.size > 5 * 1024 * 1024 && !file.type.startsWith("image/")) {
    return `${label}: el PDF no debe superar los 5MB.`;
  }
  if (!ACCEPTED_TYPES.includes(file.type)) return `${label}: formato permitido PDF/JPG/PNG/WEBP.`;
  return "";
}

function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function isProgramacionII(bloqueNombre) {
  return normalizeText(bloqueNombre).includes("programacion ii");
}

function isProgramadorNivelIII(programaNombre) {
  const norm = normalizeText(programaNombre);
  return norm.includes("programador de nivel iii") || norm.includes("programacion de nivel iii") || norm.includes("programacion (nivel iii)");
}

function DropFileField({ label, required, file, onFileChange, isDark }) {
  const [dragOver, setDragOver] = useState(false);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer?.files?.[0] || null;
    if (dropped) onFileChange(dropped);
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <label className={`block text-sm font-semibold ${isDark ? "text-indigo-200" : "text-slate-700"}`}>
          {label} {required && <span className="text-brand-accent">*</span>}
        </label>
        {file && (
          <button
            type="button"
            onClick={() => onFileChange(null)}
            className="text-xs flex items-center gap-1 text-red-400 hover:text-red-300 transition-colors"
          >
            <X size={12} /> Limpiar
          </button>
        )}
      </div>
      <label
        className={`group relative block rounded-2xl border-2 border-dashed p-8 cursor-pointer transition-all duration-300 overflow-hidden ${dragOver
          ? "border-brand-cyan bg-brand-cyan/10"
          : isDark
            ? "border-indigo-500/30 bg-white/5 hover:border-brand-cyan/50"
            : "border-slate-300 bg-white hover:border-sky-500"
          }`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        <input type="file" accept=".pdf,image/*" className="hidden" onChange={(e) => onFileChange(e.target.files?.[0] || null)} />
        <div className="flex flex-col items-center text-center space-y-3">
          <div className={`p-4 rounded-full transition-transform group-hover:scale-110 ${isDark ? "bg-indigo-500/10 text-brand-cyan" : "bg-sky-50 text-sky-600"}`}>
            <UploadCloud size={32} />
          </div>
          <div>
            <p className={`font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
              {file ? "¡Archivo detectado!" : "Arrastrá y soltá el archivo acá"}
            </p>
            <p className={`text-xs mt-1 ${isDark ? "text-indigo-300" : "text-slate-500"}`}>
              PDF, JPG o PNG hasta 3MB
            </p>
          </div>
          {file && (
            <div className="mt-4 px-4 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 animate-in fade-in slide-in-from-bottom-2">
              <p className="text-sm font-bold text-emerald-400 line-clamp-1">
                {file.name}
              </p>
            </div>
          )}
        </div>
      </label>
    </div>
  );
}

const ProgressBar = ({ currentStep, totalSteps, isDark }) => {
  const steps = [
    { n: 1, label: "Oferta", icon: <GraduationCap size={18} /> },
    { n: 2, label: "Identidad", icon: <User size={18} /> },
    { n: 3, label: "Datos", icon: <Smartphone size={18} /> },
    { n: 4, label: "Documentación", icon: <FileText size={18} /> }
  ];

  const progress = ((currentStep - 1) / (totalSteps - 1)) * 100;

  return (
    <div className="w-full mb-12">
      <div className="flex justify-between items-center relative mb-4">
        <div className={`absolute top-1/2 left-0 w-full h-1 -translate-y-1/2 rounded-full ${isDark ? "bg-white/5" : "bg-slate-200"}`} />
        <div
          className="absolute top-1/2 left-0 h-1 -translate-y-1/2 bg-gradient-to-r from-brand-cyan to-brand-accent transition-all duration-700 ease-out shadow-[0_0_15px_#00ffff]"
          style={{ width: `${progress}%` }}
        />

        {steps.map((s) => (
          <div key={s.n} className="relative z-10 flex flex-col items-center">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 ${s.n < currentStep
              ? "bg-brand-cyan text-white shadow-[0_0_15px_rgba(0,255,255,0.4)]"
              : s.n === currentStep
                ? "bg-brand-accent text-white shadow-[0_0_15px_rgba(255,102,0,0.4)] scale-110"
                : isDark ? "bg-indigo-950 border border-indigo-500/30 text-indigo-400" : "bg-white border border-slate-300 text-slate-400"
              }`}>
              {s.n < currentStep ? <CheckCircle2 size={24} /> : s.icon}
            </div>
            <span className={`absolute -bottom-7 text-[10px] font-black uppercase tracking-widest ${s.n <= currentStep ? "text-brand-cyan" : "text-slate-500"
              }`}>
              {s.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default function PreinscripcionPublica() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [step, setStep] = useState(1);
  const [oferta, setOferta] = useState([]);
  const [isDark, setIsDark] = useState(() => localStorage.getItem("preins_theme") !== "light");

  const [selectedProgramaIds, setSelectedProgramaIds] = useState([]);
  const [expandedProgramaId, setExpandedProgramaId] = useState("");
  const [bloquesPorPrograma, setBloquesPorPrograma] = useState({});

  const [dniFile, setDniFile] = useState(null);
  const [tituloFile, setTituloFile] = useState(null);
  const [dniTutorFile, setDniTutorFile] = useState(null);

  const [form, setForm] = useState({
    apellido: "", nombre: "", email: "", dni: "", cuit: "", sexo: "",
    fecha_nacimiento: "", pais_nacimiento: "Argentina", pais_nacimiento_otro: "",
    nacionalidad: "Argentina", nacionalidad_otra: "", lugar_nacimiento: "",
    domicilio: "", barrio: "", ciudad: "", telefono: "", nivel_educativo: "Secundaria Completa",
    posee_pc: false, posee_conectividad: false, puede_traer_pc: false, trabaja: false, lugar_trabajo: "",
    tutor_nombre: "", tutor_dni: "", tutor_telefono: "",
  });

  useEffect(() => {
    const load = async () => {
      setLoading(true); setError("");
      try {
        const { data } = await apiClientV2.get("/preinscripcion/oferta");
        setOferta(Array.isArray(data?.items) ? data.items : []);
      } catch { setError("No se pudo cargar la oferta."); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  useEffect(() => { localStorage.setItem("preins_theme", isDark ? "dark" : "light"); }, [isDark]);

  const selectedProgramas = useMemo(() => oferta.filter((p) => selectedProgramaIds.includes(String(p.programa_id))), [oferta, selectedProgramaIds]);
  const selectedProgramaSet = useMemo(() => new Set(selectedProgramaIds), [selectedProgramaIds]);

  const edad = useMemo(() => {
    if (!form.fecha_nacimiento) return 18;
    try {
      // Soportar formatos YYYY-MM-DD (estándar) y otros posibles
      const parts = form.fecha_nacimiento.split(/[-/]/).map(Number);
      let y, m, d;
      if (parts[0] > 1000) { [y, m, d] = parts; }
      else { [d, m, y] = parts; }

      const nac = new Date(y, m - 1, d);
      if (isNaN(nac.getTime())) return 18;

      const hoy = new Date();
      let e = hoy.getFullYear() - nac.getFullYear();
      const mm = hoy.getMonth() - nac.getMonth();
      if (mm < 0 || (mm === 0 && hoy.getDate() < nac.getDate())) e--;
      return e;
    } catch { return 18; }
  }, [form.fecha_nacimiento]);

  const esMenor = edad < 18;

  const requiresTitle = useMemo(() => {
    if (esMenor) return false;
    return selectedProgramas.some(p => Boolean(p.requiere_titulo_secundario) || isProgramadorNivelIII(p.programa_nombre));
  }, [selectedProgramas, esMenor]);

  const ofertaView = useMemo(() =>
    oferta
      .filter((p) => normalizeText(p.programa_nombre) !== "sistemas de representacion")
      .map((p) => ({
        ...p,
        bloquesOrdenados: [...(p.bloques || [])].sort((a, b) => (isProgramacionII(a.bloque_nombre) ? 1 : 0) - (isProgramacionII(b.bloque_nombre) ? 1 : 0)),
      })).sort((a, b) => {
        const aProg = isProgramadorNivelIII(a.programa_nombre) ? 0 : 1;
        const bProg = isProgramadorNivelIII(b.programa_nombre) ? 0 : 1;
        return aProg !== bProg ? aProg - bProg : a.programa_nombre.localeCompare(b.programa_nombre, "es");
      }), [oferta]
  );

  const validateStep = (s) => {
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

  const onChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const openPrograma = (p) => {
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

  const toggleBloque = (pid, bid) => {
    const actuales = bloquesPorPrograma[String(pid)] || [];
    const next = actuales.includes(bid)
      ? (actuales.length <= 1 ? actuales : actuales.filter(x => x !== bid))
      : [...actuales, bid];
    setBloquesPorPrograma(prev => ({ ...prev, [String(pid)]: next }));
  };

  const onSubmit = async (e) => {
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
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, typeof v === "boolean" ? String(v) : (v || "")));
      const seleccion = selectedProgramaIds.map(pid => ({ programa_id: Number(pid), bloque_ids: bloquesPorPrograma[pid] }));
      fd.append("seleccion_programas_json", JSON.stringify(seleccion));

      const processedDni = await compressImage(dniFile);
      fd.append("dni_digitalizado", processedDni);

      if (tituloFile && !esMenor) {
        const processedTitulo = await compressImage(tituloFile);
        fd.append("titulo_secundario_digitalizado", processedTitulo);
      }

      if (dniTutorFile && esMenor) {
        const processedDniTutor = await compressImage(dniTutorFile);
        fd.append("dni_tutor_digitalizado", processedDniTutor);
      }

      const { data } = await apiClientV2.post("/preinscripcion", fd, { headers: { "Content-Type": "multipart/form-data" } });
      setOk(`¡Éxito! Estudiante registrado. ID: ${data?.estudiante_id}`);
      setStep(1);
      setForm({
        apellido: "", nombre: "", email: "", dni: "", cuit: "", sexo: "",
        fecha_nacimiento: "", pais_nacimiento: "Argentina", pais_nacimiento_otro: "",
        nacionalidad: "Argentina", nacionalidad_otra: "", lugar_nacimiento: "",
        domicilio: "", barrio: "", ciudad: "", telefono: "", nivel_educativo: "Secundaria Completa",
        posee_pc: false, posee_conectividad: false, puede_traer_pc: false, trabaja: false, lugar_trabajo: "",
        tutor_nombre: "", tutor_dni: "", tutor_telefono: "",
      });
      setDniFile(null);
      setTituloFile(null);
      setDniTutorFile(null);
      setSelectedProgramaIds([]);
      setExpandedProgramaId("");
      setBloquesPorPrograma({});
      setDniFile(null);
      setTituloFile(null);
    } catch (eReq) {
      console.error("Error completo:", eReq);
      let msg = "Error al enviar el formulario.";
      const data = eReq?.response?.data;
      if (data) {
        if (typeof data === "string") msg = data;
        else if (data.detail) msg = data.detail;
        else if (typeof data === "object") {
          // Tomar el primer error que encontremos en el objeto (formato DRF)
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
      input: "bg-indigo-950/40 border-indigo-500/30 text-white placeholder-indigo-300 focus:border-brand-cyan/70 focus:ring-1 focus:ring-brand-cyan/20",
      card: "border-white/10 bg-black/30",
      cardActive: "border-emerald-400 bg-emerald-900/20",
      summary: "border-indigo-400/40 bg-indigo-950/30 text-indigo-100",
    }
    : {
      page: "bg-[#cfe3f2] text-[#0f172a]",
      glass: "bg-[#b8d6ea] border-[#6ba3c7] backdrop-blur-xl shadow-xl shadow-[#6ba3c7]/20",
      help: "text-[#1e3a5f]",
      title: "text-[#0f172a]",
      input: "bg-[#a8cce3] border-[#6ba3c7] text-[#0f172a] placeholder-[#355a78] focus:border-sky-600 focus:ring-1 focus:ring-sky-400",
      card: "border-[#6ba3c7] bg-[#a8cce3]",
      cardActive: "border-emerald-600 bg-emerald-100",
      summary: "border-[#6ba3c7] bg-[#a8cce3] text-[#0f172a]",
    };

  return (
    <div className={`flex flex-col min-h-screen font-sans selection:bg-brand-cyan/30 transition-colors duration-500 ${theme.page}`}>
      <Navbar
        rightSlot={
          <button
            onClick={() => setIsDark(!isDark)}
            className={`p-2 rounded-xl border ${isDark ? "bg-white/5 border-white/10 text-brand-cyan" : "bg-white border-[#6ba3c7] text-[#1e3a5f]"} transition-all hover:scale-110 shadow-lg`}
          >
            {isDark ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        }
      />

      <div className="fixed inset-0 z-0">
        <div className={`absolute top-0 left-0 w-full h-full ${isDark ? "bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/20 via-[#0a0033] to-[#0a0033]" : "bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-200 via-slate-100 to-slate-100"}`}></div>
        <div className={`absolute top-0 left-1/4 w-96 h-96 rounded-full blur-[120px] transition-opacity duration-1000 ${isDark ? 'bg-brand-cyan/20' : 'bg-sky-400/20 opacity-40'}`} />
        <div className={`absolute bottom-0 right-1/4 w-96 h-96 rounded-full blur-[120px] transition-opacity duration-1000 ${isDark ? 'bg-brand-accent/10' : 'bg-orange-300/20 opacity-30'}`} />
      </div>

      <main className="relative z-10 flex-grow pt-28 pb-20 px-4 flex flex-col items-center">
        <div className="max-w-4xl w-full space-y-8">
          <header className="text-center space-y-4 animate-in fade-in slide-in-from-top-4 duration-700">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-brand-cyan/30 bg-brand-cyan/10 text-brand-cyan text-xs font-black tracking-widest uppercase">
              <div className="w-2 h-2 rounded-full bg-brand-cyan animate-pulse" /> CFP Malvinas Argentinas
            </div>
            <h1 className={`text-4xl md:text-6xl font-black ${theme.title} tracking-tight`}>
              Inscripción <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-cyan via-purple-400 to-brand-accent">2026</span>
            </h1>
            <p className={`${theme.help} text-lg font-medium`}>Completá los pasos para formar parte del CFP Malvinas Argentinas.</p>
          </header>

          <div className={`${theme.glass} rounded-[2rem] p-6 md:p-12 relative overflow-hidden transition-all duration-700`}>
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
                <div className="animate-in fade-in slide-in-from-right-8 duration-500 space-y-8">
                  <div className="space-y-2">
                    <h2 className={`text-2xl font-black ${theme.title}`}>Oferta Formativa</h2>
                    <p className={theme.help}>Seleccioná los programas de tu interés.</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {ofertaView.map((p) => {
                      const active = selectedProgramaSet.has(String(p.programa_id));
                      const expanded = active && String(p.programa_id) === String(expandedProgramaId);
                      return (
                        <div
                          key={p.programa_id}
                          className={`group relative rounded-3xl border-2 p-6 transition-all duration-500 cursor-pointer overflow-hidden ${active
                            ? `${theme.cardActive} ring-2 ring-emerald-500 shadow-lg`
                            : `${theme.card} hover:border-brand-cyan/70 hover:shadow-md hover:scale-[1.01]`
                            }`}
                          onClick={() => openPrograma(p)}
                        >
                          <div className="flex justify-between items-start">
                            <div className="space-y-1 flex-grow">
                              <h3 className={`font-black text-xl leading-tight ${theme.title}`}>{p.programa_nombre}</h3>
                              <p className={`text-xs font-bold ${active ? 'text-brand-cyan' : theme.help}`}>{p.bloques?.length || 0} BLOQUES DISPONIBLES</p>
                            </div>
                            <div className={`p-2 rounded-xl transition-colors ${active ? "bg-brand-cyan shadow-lg shadow-brand-cyan/50 text-white" : "bg-indigo-500/10 text-indigo-400 group-hover:text-brand-cyan"}`}>
                              {active ? <CheckCircle2 size={24} /> : (expanded ? <ChevronUp size={24} /> : <ChevronDown size={24} />)}
                            </div>
                          </div>
                          {expanded && (
                            <div className="mt-6 pt-6 border-t border-white/10 space-y-4 animate-in fade-in zoom-in-95 duration-500" onClick={(e) => e.stopPropagation()}>
                              {p.bloquesOrdenados.map((b) => (
                                <label
                                  key={b.bloque_id}
                                  className={`flex items-start gap-4 p-4 rounded-2xl transition-all ${isDark ? "bg-white/5 hover:bg-white/10" : "bg-white/40 hover:bg-white/60"
                                    }`}
                                >
                                  <input type="checkbox" className="mt-1 w-5 h-5 rounded-lg border-2 border-brand-cyan text-brand-cyan focus:ring-0 cursor-pointer" checked={(bloquesPorPrograma[String(p.programa_id)] || []).includes(b.bloque_id)} disabled={isProgramacionII(b.bloque_nombre)} onChange={() => toggleBloque(p.programa_id, b.bloque_id)} />
                                  <div className="flex flex-col">
                                    <span className="font-bold text-sm tracking-tight">{b.bloque_nombre}</span>
                                    <span className={`text-[10px] uppercase font-black tracking-widest ${isDark ? 'text-indigo-400' : 'text-slate-400'}`}>Inicio: {b.cohorte_nombre}</span>
                                    {isProgramacionII(b.bloque_nombre) && <span className="text-[10px] text-brand-accent mt-1 font-bold">REQUISITO: PROG. I Y BD APROBADA</span>}
                                  </div>
                                </label>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="animate-in fade-in slide-in-from-right-8 duration-500 space-y-8">
                  <div className="space-y-2">
                    <h2 className={`text-2xl font-black ${theme.title}`}>Identidad</h2>
                    <p className={theme.help}>Tus datos personales básicos.</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2"><label className="text-xs font-black uppercase tracking-widest ml-1 text-brand-cyan">Apellido</label><input className={`w-full rounded-2xl px-5 py-4 ${theme.input} transition-all`} name="apellido" placeholder="Pérez" value={form.apellido} onChange={onChange} required /></div>
                    <div className="space-y-2"><label className="text-xs font-black uppercase tracking-widest ml-1 text-brand-cyan">Nombre</label><input className={`w-full rounded-2xl px-5 py-4 ${theme.input} transition-all`} name="nombre" placeholder="Juan" value={form.nombre} onChange={onChange} required /></div>
                    <div className="space-y-2"><label className="text-xs font-black uppercase tracking-widest ml-1 text-brand-cyan">DNI</label><input className={`w-full rounded-2xl px-5 py-4 ${theme.input} transition-all`} name="dni" placeholder="Sin puntos ni espacios" value={form.dni} onChange={onChange} required /></div>
                    <div className="space-y-2"><label className="text-xs font-black uppercase tracking-widest ml-1 text-indigo-400">CUIT (Opcional)</label><input className={`w-full rounded-2xl px-5 py-4 ${theme.input}`} name="cuit" placeholder="20XXXXXXXXX" value={form.cuit} onChange={onChange} /></div>
                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase tracking-widest ml-1 text-indigo-400">Sexo</label>
                      <select className={`w-full rounded-2xl px-5 py-4 ${theme.input}`} name="sexo" value={form.sexo} onChange={onChange}>
                        <option value="">Seleccione...</option><option value="Masculino">Masculino</option><option value="Femenino">Femenino</option><option value="Otro">Otro/X</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase tracking-widest ml-1 text-indigo-400">Fecha de Nacimiento *</label>
                      <input type="date" className={`w-full rounded-2xl px-5 py-4 ${theme.input}`} name="fecha_nacimiento" value={form.fecha_nacimiento} onChange={onChange} required />
                      {form.fecha_nacimiento && (
                        <div className="flex items-center justify-between mt-2">
                          <p className={`text-[10px] font-bold ${esMenor ? (isDark ? "text-orange-400" : "text-orange-700") : "text-brand-cyan"}`}>
                            EDAD CALCULADA: {edad} AÑOS
                          </p>
                          {esMenor && (
                            <p className={`text-[10px] font-black animate-pulse ${isDark ? "text-orange-400" : "text-orange-600"}`}>
                              ⚠️ REQUIERE TUTOR (CODE 3)
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                    {esMenor && (
                      <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 p-6 rounded-[2rem] bg-orange-500/5 border border-orange-500/20 animate-in zoom-in-95 duration-300">
                        <div className="md:col-span-2 flex items-start gap-4 p-4 rounded-2xl bg-orange-500/10 border border-orange-500/30 mb-2">
                          <Smartphone className={`${isDark ? "text-orange-400" : "text-orange-600"} mt-1 flex-none`} size={20} />
                          <div>
                            <p className={`text-xs font-bold uppercase tracking-tight ${isDark ? "text-orange-200" : "text-orange-700"}`}>Autorización del Padre/Madre o Tutor vía WhatsApp</p>
                            <p className={`text-[11px] leading-relaxed ${isDark ? "text-orange-300/80" : "text-orange-900"}`}>
                              Al ser menor de edad, el padre, madre o tutor responsable recibirá un enlace por <b>WhatsApp</b> para autorizar la cursada mediante una <b>firma digital (selfie de conformidad)</b>.
                            </p>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-black uppercase tracking-widest ml-1 text-brand-accent">Nombre del Padre/Madre o Tutor *</label>
                          <input className={`w-full rounded-2xl px-5 py-4 ${theme.input} border-brand-accent/30`} name="tutor_nombre" placeholder="Nombre completo" value={form.tutor_nombre} onChange={onChange} required />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-black uppercase tracking-widest ml-1 text-brand-accent">DNI del Padre/Madre o Tutor *</label>
                          <input className={`w-full rounded-2xl px-5 py-4 ${theme.input} border-brand-accent/30`} name="tutor_dni" placeholder="DNI del responsable" value={form.tutor_dni} onChange={onChange} required />
                        </div>
                        <div className="md:col-span-2 space-y-2">
                          <label className="text-xs font-black uppercase tracking-widest ml-1 text-brand-accent">WhatsApp del Padre/Madre o Tutor (Celular) *</label>
                          <input className={`w-full rounded-2xl px-5 py-4 ${theme.input} border-brand-accent/30`} name="tutor_telefono" placeholder="2964 XXXXXX (Sin 0 ni 15)" value={form.tutor_telefono} onChange={onChange} required />
                        </div>
                      </div>
                    )}
                    <div className="space-y-2"><label className="text-xs font-black uppercase tracking-widest ml-1 text-indigo-400">Nacionalidad</label><input className={`w-full rounded-2xl px-5 py-4 ${theme.input}`} name="nacionalidad" value={form.nacionalidad} onChange={onChange} /></div>
                    <div className="space-y-2"><label className="text-xs font-black uppercase tracking-widest ml-1 text-indigo-400">Lugar de Nacim. (Provincia)</label><input className={`w-full rounded-2xl px-5 py-4 ${theme.input}`} name="lugar_nacimiento" placeholder="Ej: Tierra del Fuego" value={form.lugar_nacimiento} onChange={onChange} /></div>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="animate-in fade-in slide-in-from-right-8 duration-500 space-y-8">
                  <div className="space-y-2">
                    <h2 className={`text-2xl font-black ${theme.title}`}>Contacto y Situación</h2>
                    <p className={theme.help}>¿Cómo te contactamos y cuál es tu perfil?</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2 space-y-2"><label className="text-xs font-black uppercase tracking-widest ml-1 text-brand-cyan">Email</label><input type="email" className={`w-full rounded-2xl px-5 py-4 ${theme.input}`} name="email" placeholder="usuario@ejemplo.com" value={form.email} onChange={onChange} required /></div>
                    <div className="space-y-2"><label className="text-xs font-black uppercase tracking-widest ml-1 text-indigo-400">Teléfono</label><input className={`w-full rounded-2xl px-5 py-4 ${theme.input}`} name="telefono" value={form.telefono} onChange={onChange} /></div>
                    <div className="space-y-2"><label className="text-xs font-black uppercase tracking-widest ml-1 text-indigo-400">Nivel Educativo</label><select className={`w-full rounded-2xl px-5 py-4 ${theme.input}`} name="nivel_educativo" value={form.nivel_educativo} onChange={onChange}>{NIVEL_EDUCATIVO_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}</select></div>

                    <div className="space-y-2"><label className="text-xs font-black uppercase tracking-widest ml-1 text-indigo-400">Ciudad</label><input className={`w-full rounded-2xl px-5 py-4 ${theme.input}`} name="ciudad" placeholder="Ej: Río Grande" value={form.ciudad} onChange={onChange} /></div>
                    <div className="space-y-2"><label className="text-xs font-black uppercase tracking-widest ml-1 text-indigo-400">Barrio</label><input className={`w-full rounded-2xl px-5 py-4 ${theme.input}`} name="barrio" placeholder="Ej: Chacra II" value={form.barrio} onChange={onChange} /></div>

                    <div className="md:col-span-2 space-y-2">
                      <label className="text-xs font-black uppercase tracking-widest ml-1 text-indigo-400">Domicilio Particular</label>
                      <input className={`w-full rounded-2xl px-5 py-4 ${theme.input}`} name="domicilio" placeholder="Calle y número" value={form.domicilio} onChange={onChange} />
                    </div>
                    <div className="md:col-span-2 p-6 rounded-[2rem] bg-brand-cyan/5 border border-brand-cyan/10 space-y-4">
                      <p className="text-xs font-black uppercase tracking-tighter text-brand-cyan">Equipamiento y Trabajo</p>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <label className="flex items-center gap-2 cursor-pointer group"><input type="checkbox" className="w-5 h-5 rounded border-indigo-500/30 text-brand-cyan" name="posee_pc" checked={form.posee_pc} onChange={onChange} /><span className="text-sm font-bold">Poseo PC</span></label>
                        <label className="flex items-center gap-2 cursor-pointer group"><input type="checkbox" className="w-5 h-5 rounded border-indigo-500/30 text-brand-cyan" name="posee_conectividad" checked={form.posee_conectividad} onChange={onChange} /><span className="text-sm font-bold">Tengo Internet</span></label>
                        <label className="flex items-center gap-2 cursor-pointer group"><input type="checkbox" className="w-5 h-5 rounded border-indigo-500/30 text-brand-accent" name="trabaja" checked={form.trabaja} onChange={onChange} /><span className="text-sm font-bold">Actualmente Trabajo</span></label>
                      </div>
                      {form.trabaja && (
                        <div className="mt-4 animate-in fade-in slide-in-from-top-2">
                          <label className="text-xs font-black uppercase tracking-widest ml-1 text-brand-accent">Lugar de Trabajo</label>
                          <input className={`w-full rounded-2xl px-5 py-4 mt-1 ${theme.input} border-brand-accent/30`} name="lugar_trabajo" placeholder="Nombre de la empresa o institución" value={form.lugar_trabajo} onChange={onChange} />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {step === 4 && (
                <div className="animate-in fade-in slide-in-from-right-8 duration-500 space-y-8">
                  <div className="space-y-2">
                    <h2 className={`text-2xl font-black ${theme.title}`}>Documentación</h2>
                    <p className={theme.help}>Subí copias digitales legibles.</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <DropFileField label="Digitalización de DNI" required file={dniFile} onFileChange={setDniFile} isDark={isDark} />
                    {esMenor ? (
                      <DropFileField label="DNI del Padre/Madre o Tutor (Obligatorio)" required file={dniTutorFile} onFileChange={setDniTutorFile} isDark={isDark} />
                    ) : (
                      requiresTitle && (
                        <DropFileField label="Digitalización de Título Secundario" required file={tituloFile} onFileChange={setTituloFile} isDark={isDark} />
                      )
                    )}
                  </div>
                  <div className={`p-6 rounded-3xl ${isDark ? "bg-emerald-500/5 border border-emerald-500/20" : "bg-emerald-50 border border-emerald-200"}`}>
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-2xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/30"><CheckCircle2 size={24} /></div>
                      <div>
                        <p className="font-black tracking-tight leading-none">Listo para enviar</p>
                        <p className="text-sm opacity-70">Al hacer clic en enviar, confirmás que tus datos son verídicos.</p>
                      </div>
                    </div>
                  </div>
                </div>
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
                  <button type="button" onClick={nextStep} className="group relative flex items-center justify-center gap-3 px-10 py-4 bg-brand-cyan border-b-4 border-cyan-700 text-[#05011a] font-black uppercase tracking-widest text-xs rounded-2xl transition-all hover:scale-[1.02] hover:-translate-y-1 active:border-b-0 active:translate-y-0.5">
                    Siguiente Paso <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                ) : (
                  <button type="submit" disabled={saving} className="group relative flex items-center justify-center gap-3 px-12 py-4 bg-gradient-to-r from-brand-cyan to-brand-accent text-white font-black uppercase tracking-widest text-xs rounded-2xl transition-all hover:shadow-[0_0_30px_rgba(0,255,255,0.4)] hover:scale-105 active:scale-95 disabled:grayscale">
                    {saving ? "Procesando..." : "Confirmar Preinscripción"} <CheckCircle2 size={16} />
                  </button>
                )}
              </footer>
            </form>
          </div>

          {ok && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
              <div className={`${isDark ? 'bg-indigo-950/90 border-brand-cyan/30' : 'bg-white border-slate-200'} border-2 rounded-[3rem] p-10 max-w-md w-full text-center space-y-6 shadow-2xl`}>
                <div className="relative mx-auto w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/40">
                  <CheckCircle2 size={50} className="text-white" />
                  <div className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-25" />
                </div>
                <h3 className="text-3xl font-black tracking-tight">¡Genial!</h3>
                <p className="opacity-80 font-medium">{ok}</p>
                <button onClick={() => setOk("")} className="w-full py-4 bg-brand-cyan text-[#05011a] font-black rounded-2xl uppercase tracking-widest text-xs">Cerrar</button>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
