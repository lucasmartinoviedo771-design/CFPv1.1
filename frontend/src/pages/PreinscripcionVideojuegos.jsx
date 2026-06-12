import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  User,
  FileText,
  GraduationCap,
  Smartphone,
  UploadCloud,
  X,
  Gamepad2,
  Rocket,
  Sparkles,
  Clock,
  Heart
} from "lucide-react";
import { apiClientV2 } from "../api/client";
import { NavbarVideojuegos } from "../components/NavbarVideojuegos";
import { FooterVideojuegos } from "../components/FooterVideojuegos";

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

function isOptativo(bloqueNombre) {
  const norm = normalizeText(bloqueNombre);
  return norm.includes("arte") || norm.includes("entornos virtuales") || norm.includes("animacion");
}

function DropFileField({ label, required, file, onFileChange, description }) {
  const [dragOver, setDragOver] = useState(false);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer?.files?.[0] || null;
    if (dropped) onFileChange(dropped);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col">
        <div className="flex justify-between items-center">
          <label className="block text-sm font-semibold text-indigo-200">
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
        {description && (
          <p className="text-xs mt-1 text-indigo-300 leading-relaxed">
            {description}
          </p>
        )}
      </div>
      <label
        className={`group relative block rounded-2xl border-2 border-dashed p-8 cursor-pointer transition-all duration-300 overflow-hidden ${dragOver
          ? "border-brand-cyan bg-brand-cyan/10"
          : "border-indigo-500/30 bg-white/5 hover:border-brand-cyan/50"
          }`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        <input type="file" accept=".pdf,image/*" className="hidden" onChange={(e) => onFileChange(e.target.files?.[0] || null)} />
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="p-4 rounded-full transition-transform group-hover:scale-110 bg-indigo-500/10 text-brand-cyan">
            <UploadCloud size={32} />
          </div>
          <div>
            <p className="font-bold text-white">
              {file ? "¡Archivo detectado!" : "Arrastrá y soltá el archivo acá"}
            </p>
            <p className="text-xs mt-1 text-indigo-300">
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

const ProgressBar = ({ currentStep, totalSteps }) => {
  const steps = [
    { n: 1, label: "Especialidad", icon: <Gamepad2 size={18} /> },
    { n: 2, label: "Identidad", icon: <User size={18} /> },
    { n: 3, label: "Contacto", icon: <Smartphone size={18} /> },
    { n: 4, label: "Documentación", icon: <FileText size={18} /> }
  ];

  const progress = ((currentStep - 1) / (totalSteps - 1)) * 100;

  return (
    <div className="w-full mb-12">
      <div className="flex justify-between items-center relative mb-4">
        <div className="absolute top-1/2 left-0 w-full h-1 -translate-y-1/2 rounded-full bg-white/5" />
        <div
          className="absolute top-1/2 left-0 h-1 -translate-y-1/2 bg-gradient-to-r from-brand-cyan to-brand-accent transition-all duration-700 ease-out shadow-[0_0_15px_#00ffff]"
          style={{ width: `${progress}%` }}
        />

        {steps.map((s) => (
          <div key={s.n} className="relative z-10 flex flex-col items-center">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 ${s.n < currentStep
              ? "bg-brand-cyan text-[#050814] shadow-[0_0_15px_rgba(0,255,255,0.4)]"
              : s.n === currentStep
                ? "bg-brand-accent text-white shadow-[0_0_15px_rgba(255,102,0,0.4)] scale-110"
                : "bg-indigo-950 border border-indigo-500/30 text-indigo-400"
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

const STORAGE_KEY = "preinscripcion_videojuegos_v1";

const INIT_FORM = {
  apellido: "", nombre: "", email: "", DNI: "", cuit: "", sexo: "",
  fecha_nacimiento: "", pais_nacimiento: "Argentina", pais_nacimiento_otro: "",
  nacionalidad: "Argentina", nacionalidad_otra: "", lugar_nacimiento: "",
  domicilio: "", barrio: "", ciudad: "", telefono: "", nivel_educativo: "Secundaria Completa",
  posee_pc: false, posee_conectividad: false, puede_traer_pc: false, trabaja: false, lugar_trabajo: "",
  tutor_nombre: "", tutor_dni: "", tutor_telefono: "",
};

function loadSaved() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { form: INIT_FORM, step: 1, bloquesSeleccionados: [] };
    const parsed = JSON.parse(raw);
    if (parsed.expiresAt && Date.now() > parsed.expiresAt) {
      localStorage.removeItem(STORAGE_KEY);
      return { form: INIT_FORM, step: 1, bloquesSeleccionados: [] };
    }
    return {
      form: { ...INIT_FORM, ...parsed.form },
      step: parsed.step || 1,
      bloquesSeleccionados: parsed.bloquesSeleccionados || [],
    };
  } catch {
    return { form: INIT_FORM, step: 1, bloquesSeleccionados: [] };
  }
}

export default function PreinscripcionVideojuegos() {
  const saved = useMemo(() => loadSaved(), []);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [step, setStep] = useState(saved.step);
  const [ofertaPrograma, setOfertaPrograma] = useState(null);
  const [config, setConfig] = useState({ abierta: true, fecha_inicio: null, fecha_fin: null });

  // Selección de bloques del estudiante (contendrá optativos elegidos + obligatorios bloqueados)
  const [bloquesSeleccionados, setBloquesSeleccionados] = useState(saved.bloquesSeleccionados);

  const [dniFile, setDniFile] = useState(null);
  const [tituloFile, setTituloFile] = useState(null);
  const [dniTutorFile, setDniTutorFile] = useState(null);

  const [form, setForm] = useState(saved.form);

  useEffect(() => {
    const expiresAt = Date.now() + 24 * 60 * 60 * 1000;
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ form, step, bloquesSeleccionados, expiresAt })
    );
  }, [form, step, bloquesSeleccionados]);

  useEffect(() => {
    const load = async () => {
      setLoading(true); setError("");
      try {
        // 1. Cargar configuración de videojuegos
        try {
          const { data: cfg } = await apiClientV2.get("/videojuegos/config");
          setConfig(cfg);
        } catch (e) {
          console.error("No se pudo obtener config de videojuegos", e);
        }

        // 2. Cargar oferta del programa "VJ"
        const { data } = await apiClientV2.get("/preinscripcion/oferta", {
          params: { programa_codigo: "VJ" }
        });
        
        const prog = data?.items?.[0] || null;
        setOfertaPrograma(prog);

        if (prog) {
          // Pre-seleccionar todos los bloques obligatorios (que no son optativos)
          const obligatoriosIds = (prog.bloques || [])
            .filter(b => !isOptativo(b.bloque_nombre))
            .map(b => b.bloque_id);
          setBloquesSeleccionados(prev => {
            const combined = new Set([...obligatoriosIds, ...prev]);
            return Array.from(combined);
          });
        }
      } catch (err) {
        setError("No se pudo cargar la oferta del programa de Videojuegos.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const optativeBlocks = useMemo(() => {
    if (!ofertaPrograma) return [];
    return (ofertaPrograma.bloques || []).filter(b => isOptativo(b.bloque_nombre));
  }, [ofertaPrograma]);

  const obligatoryBlocks = useMemo(() => {
    if (!ofertaPrograma) return [];
    return (ofertaPrograma.bloques || []).filter(b => !isOptativo(b.bloque_nombre));
  }, [ofertaPrograma]);

  const edad = useMemo(() => {
    if (!form.fecha_nacimiento) return 18;
    try {
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

  const validateStep = (s) => {
    setError("");
    if (s === 1) {
      // Validar que se haya seleccionado al menos un bloque optativo
      const optativosSeleccionados = bloquesSeleccionados.filter(id => 
        optativeBlocks.some(ob => ob.bloque_id === id)
      );
      if (optativosSeleccionados.length === 0) {
        return setError("Debés seleccionar al menos una especialidad optativa (Arte y Animación o Programación de Entornos Virtuales)."), false;
      }
    }
    if (s === 2) {
      if (!form.apellido.trim() || !form.nombre.trim() || !form.DNI.trim() || !form.fecha_nacimiento) {
        return setError("Completá los campos obligatorios (Nombre, Apellido, DNI y Fecha de Nacimiento)."), false;
      }
      if (esMenor) {
        if (edad < 15) return setError("La edad mínima para preinscribirse es de 15 años."), false;
        if (!form.tutor_nombre.trim() || !form.tutor_dni.trim() || !form.tutor_telefono.trim()) {
          return setError("Al ser menor de edad, debés completar todos los datos del tutor responsable."), false;
        }
      }
    }
    if (s === 3) {
      if (!form.email.trim()) return setError("El email es obligatorio para el contacto."), false;
    }
    if (s === 4) {
      if (!dniFile) return setError("Debés adjuntar la digitalización del DNI."), false;
      if (esMenor && !dniTutorFile) return setError("Debés adjuntar la digitalización del DNI del Padre/Madre o Tutor."), false;
      if (!esMenor && !tituloFile) {
        return setError("Esta oferta requiere adjuntar el título secundario."), false;
      }
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

  const toggleBloqueOptativo = (bid) => {
    setBloquesSeleccionados(prev => {
      if (prev.includes(bid)) {
        // No permitir deseleccionar si es el único optativo
        const optativosRestantes = prev.filter(id => id !== bid && optativeBlocks.some(ob => ob.bloque_id === id));
        if (optativosRestantes.length === 0) return prev;
        return prev.filter(x => x !== bid);
      } else {
        return [...prev, bid];
      }
    });
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep(1)) return setStep(1);
    if (!validateStep(2)) return setStep(2);
    if (!validateStep(3)) return setStep(3);

    const dniErr = validateFile(dniFile, "DNI");
    if (dniErr) return setError(dniErr), setStep(4);
    
    if (!esMenor) {
      const tErr = validateFile(tituloFile, "Título secundario");
      if (tErr) return setError(tErr), setStep(4);
    }

    try {
      setSaving(true);
      const fd = new FormData();
      
      // Mapear campos requeridos por el backend
      fd.append("apellido", form.apellido);
      fd.append("nombre", form.nombre);
      fd.append("email", form.email);
      fd.append("dni", form.DNI);
      fd.append("cuit", form.cuit || "");
      fd.append("sexo", form.sexo || "");
      fd.append("fecha_nacimiento", form.fecha_nacimiento);
      fd.append("pais_nacimiento", form.pais_nacimiento || "Argentina");
      fd.append("pais_nacimiento_otro", form.pais_nacimiento_otro || "");
      fd.append("nacionalidad", form.nacionalidad || "Argentina");
      fd.append("nacionalidad_otra", form.nacionalidad_otra || "");
      fd.append("lugar_nacimiento", form.lugar_nacimiento || "");
      fd.append("domicilio", form.domicilio || "");
      fd.append("barrio", form.barrio || "");
      fd.append("ciudad", form.ciudad || "");
      fd.append("telefono", form.telefono || "");
      fd.append("nivel_educativo", form.nivel_educativo || "");
      fd.append("posee_pc", String(form.posee_pc));
      fd.append("posee_conectividad", String(form.posee_conectividad));
      fd.append("puede_traer_pc", String(form.puede_traer_pc));
      fd.append("trabaja", String(form.trabaja));
      fd.append("lugar_trabajo", form.lugar_trabajo || "");
      
      if (esMenor) {
        fd.append("tutor_nombre", form.tutor_nombre);
        fd.append("tutor_dni", form.tutor_dni);
        fd.append("tutor_telefono", form.tutor_telefono);
      }

      const seleccion = [
        {
          programa_id: Number(ofertaPrograma.programa_id),
          bloque_ids: bloquesSeleccionados
        }
      ];
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

      // Token reCAPTCHA v3 mockup o real
      fd.append("recaptcha_token", "mock_token_vj");

      const { data } = await apiClientV2.post("/preinscripcion", fd, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      setOk(`¡Postulación registrada! Hemos recibido tus datos correctamente. Se ha enviado un correo a ${form.email} confirmando el registro.`);
      localStorage.removeItem(STORAGE_KEY);
      setStep(1);
      setForm(INIT_FORM);
      setDniFile(null);
      setTituloFile(null);
      setDniTutorFile(null);
      
      // Resetear bloques seleccionados con los obligatorios de nuevo
      const obligatoriosIds = (ofertaPrograma.bloques || [])
        .filter(b => !isOptativo(b.bloque_nombre))
        .map(b => b.bloque_id);
      setBloquesSeleccionados(obligatoriosIds);

    } catch (eReq) {
      console.error("Error al enviar formulario:", eReq);
      let msg = "Ocurrió un error al procesar tu preinscripción. Por favor verifica los datos ingresados.";
      const data = eReq?.response?.data;
      if (data) {
        if (typeof data === "string") msg = data;
        else if (data.detail) msg = data.detail;
        else if (typeof data === "object") {
          const firstKey = Object.keys(data)[0];
          const firstError = data[firstKey];
          msg = Array.isArray(firstError) ? `${firstKey}: ${firstError[0]}` : String(firstError);
        }
      }
      setError(msg);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-[#050814] text-white items-center justify-center font-sans">
        <div className="animate-spin text-brand-cyan mb-4"><Gamepad2 size={48} /></div>
        <p className="text-indigo-300 font-bold uppercase tracking-wider">Cargando Oferta Académica de Videojuegos...</p>
      </div>
    );
  }

  if (!config.abierta) {
    return (
      <div className="flex flex-col min-h-screen bg-[#050814] text-white items-center justify-center font-sans px-4">
        <div className="max-w-md w-full bg-[#0c122c]/80 border border-indigo-500/20 rounded-[2rem] p-10 text-center space-y-6 shadow-2xl relative overflow-hidden">
          <div className="absolute -top-10 -left-10 w-40 h-40 bg-brand-accent/10 rounded-full blur-2xl" />
          <div className="relative mx-auto w-20 h-20 bg-brand-accent/20 text-brand-accent rounded-2xl flex items-center justify-center">
            <Clock size={40} />
          </div>
          <h2 className="text-3xl font-black text-white">Inscripciones Cerradas</h2>
          <p className="text-indigo-300 text-sm leading-relaxed">
            {config.mensaje_cierre || "Las inscripciones para la Certificación en Desarrollo de Videojuegos no están abiertas en este momento."}
          </p>
          {config.fecha_inicio && (
            <p className="text-xs font-bold uppercase tracking-wider text-brand-cyan">
              Período: {config.fecha_inicio} al {config.fecha_fin}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen font-sans selection:bg-brand-cyan/30 text-white bg-[#050814] relative overflow-hidden">
      {/* Background radial effects */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/10 via-[#050814] to-[#050814]" />
        <div className="absolute top-10 left-1/4 w-96 h-96 rounded-full bg-brand-cyan/5 blur-[120px]" />
        <div className="absolute bottom-10 right-1/4 w-96 h-96 rounded-full bg-brand-accent/5 blur-[120px]" />
      </div>

      <NavbarVideojuegos />

      <main className="relative z-10 flex-grow pt-28 pb-20 px-4 flex flex-col items-center">
        <div className="max-w-4xl w-full space-y-8">
          
          {/* Header */}
          <header className="text-center space-y-4 animate-in fade-in slide-in-from-top-4 duration-700">
            <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight leading-tight max-w-3xl mx-auto">
              Certificación Profesional en <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-accent via-[#ff6600] to-brand-cyan">Desarrollo de Videojuegos</span>
            </h1>
            <p className="text-indigo-200 text-lg font-medium max-w-2xl mx-auto">
              Sumate a una capacitación integral que combina creatividad, tecnología y trabajo en equipo para crear los juegos del futuro.
            </p>
            
            {/* Logos convocantes */}
            <div className="pt-2 flex flex-wrap justify-center items-center gap-x-6 gap-y-2 text-xs font-bold text-indigo-400">
              <span>ADVA</span>
              <span className="text-indigo-600">•</span>
              <span>Agencia de Innovación de TDF</span>
              <span className="text-indigo-600">•</span>
              <span>CFI</span>
              <span className="text-indigo-600">•</span>
              <span>Centro Politécnico Superior</span>
            </div>
          </header>

          <div className="bg-[#0c122c]/50 border border-indigo-500/10 backdrop-blur-xl shadow-2xl rounded-[2rem] p-6 md:p-12 relative overflow-hidden">
            <ProgressBar currentStep={step} totalSteps={4} />

            {error && (
              <div className="mb-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex items-center gap-3 text-red-400 font-medium text-sm">
                  <div className="p-2 bg-red-500 rounded-lg text-white"><X size={16} /></div> {error}
                </div>
              </div>
            )}

            <form onSubmit={onSubmit} className="space-y-10 min-h-[400px]">
              
              {/* STEP 1: SELECTOR DE ESPECIALIDAD */}
              {step === 1 && (
                <div className="animate-in fade-in slide-in-from-right-8 duration-500 space-y-8">
                  <div className="space-y-2">
                    <h2 className="text-2xl font-black text-white">Especialización de Trayecto</h2>
                    <p className="text-indigo-300">Seleccioná qué rama optativa querés cursar. Podés elegir una o ambas.</p>
                  </div>

                  {/* Especialidades optativas */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {optativeBlocks.map((b) => {
                      const active = bloquesSeleccionados.includes(b.bloque_id);
                      return (
                        <div
                          key={b.bloque_id}
                          className={`group relative rounded-3xl border-2 p-6 transition-all duration-500 cursor-pointer overflow-hidden ${active
                            ? "border-brand-cyan bg-[#00ccff]/5 shadow-lg shadow-brand-cyan/5"
                            : "border-indigo-500/20 bg-black/20 hover:border-brand-cyan/50 hover:scale-[1.01]"
                            }`}
                          onClick={() => toggleBloqueOptativo(b.bloque_id)}
                        >
                          <div className="flex justify-between items-start">
                            <div className="space-y-2">
                              <span className="text-[10px] font-black uppercase tracking-widest text-brand-cyan">MÓDULO OPTATIVO</span>
                              <h3 className="font-black text-xl leading-tight text-white">{b.bloque_nombre}</h3>
                              <p className="text-xs text-indigo-300">Ingreso habilitado para la cohorte {b.cohorte_nombre}.</p>
                            </div>
                            <div className={`p-2 rounded-xl transition-colors ${active ? "bg-brand-cyan text-[#050814]" : "bg-indigo-500/10 text-indigo-400 group-hover:text-brand-cyan"}`}>
                              <CheckCircle2 size={24} />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Materias Obligatorias Informativas */}
                  <div className="p-6 rounded-[2rem] bg-indigo-950/20 border border-indigo-500/20 space-y-4">
                    <div className="flex items-center gap-2 text-brand-accent">
                      <Sparkles size={16} />
                      <h4 className="text-xs font-black uppercase tracking-widest leading-none">Materias Comunes Obligatorias</h4>
                    </div>
                    <p className="text-xs text-indigo-300">
                      Independientemente de la especialidad elegida, cursarás y te inscribirás automáticamente en las siguientes asignaturas transversales:
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {obligatoryBlocks.map((b) => (
                        <div key={b.bloque_id} className="p-4 rounded-xl bg-black/40 border border-indigo-500/10 flex items-center gap-3">
                          <CheckCircle2 size={16} className="text-[#a855f7] flex-none" />
                          <span className="font-bold text-xs text-indigo-100">{b.bloque_nombre}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: IDENTIDAD */}
              {step === 2 && (
                <div className="animate-in fade-in slide-in-from-right-8 duration-500 space-y-8">
                  <div className="space-y-2">
                    <h2 className="text-2xl font-black text-white">Identidad del Aspirante</h2>
                    <p className="text-indigo-300">Completá tus datos personales básicos tal cual figuran en tu documento.</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase tracking-widest ml-1 text-brand-cyan">Apellido</label>
                      <input className="w-full rounded-2xl px-5 py-4 bg-indigo-950/40 border border-indigo-500/30 text-white placeholder-indigo-300 focus:border-brand-cyan/70 focus:ring-1 focus:ring-brand-cyan/20 focus:outline-none transition-all" name="apellido" placeholder="Pérez" value={form.apellido} onChange={onChange} required />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase tracking-widest ml-1 text-brand-cyan">Nombre</label>
                      <input className="w-full rounded-2xl px-5 py-4 bg-indigo-950/40 border border-indigo-500/30 text-white placeholder-indigo-300 focus:border-brand-cyan/70 focus:ring-1 focus:ring-brand-cyan/20 focus:outline-none transition-all" name="nombre" placeholder="Juan" value={form.nombre} onChange={onChange} required />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase tracking-widest ml-1 text-brand-cyan">DNI (Documento)</label>
                      <input className="w-full rounded-2xl px-5 py-4 bg-indigo-950/40 border border-indigo-500/30 text-white placeholder-indigo-300 focus:border-brand-cyan/70 focus:ring-1 focus:ring-brand-cyan/20 focus:outline-none transition-all" name="DNI" placeholder="Sin puntos ni espacios" value={form.DNI} onChange={onChange} required />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase tracking-widest ml-1 text-indigo-400">CUIT (Opcional)</label>
                      <input className="w-full rounded-2xl px-5 py-4 bg-indigo-950/40 border border-indigo-500/30 text-white placeholder-indigo-300 focus:border-brand-cyan/70 focus:ring-1 focus:ring-brand-cyan/20 focus:outline-none transition-all" name="cuit" placeholder="20XXXXXXXXX" value={form.cuit} onChange={onChange} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase tracking-widest ml-1 text-indigo-400">Sexo</label>
                      <select className="w-full rounded-2xl px-5 py-4 bg-indigo-950/40 border border-indigo-500/30 text-white focus:border-brand-cyan/70 focus:ring-1 focus:ring-brand-cyan/20 focus:outline-none transition-all" name="sexo" value={form.sexo} onChange={onChange}>
                        <option value="">Seleccione...</option>
                        <option value="M">Masculino</option>
                        <option value="F">Femenino</option>
                        <option value="O">Otro/X</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase tracking-widest ml-1 text-indigo-400">Fecha de Nacimiento *</label>
                      <input type="date" className="w-full rounded-2xl px-5 py-4 bg-indigo-950/40 border border-indigo-500/30 text-white focus:border-brand-cyan/70 focus:ring-1 focus:ring-brand-cyan/20 focus:outline-none transition-all" name="fecha_nacimiento" value={form.fecha_nacimiento} onChange={onChange} required />
                      {form.fecha_nacimiento && (
                        <div className="flex items-center justify-between mt-2 text-[10px] font-bold">
                          <p className="text-brand-cyan">EDAD: {edad} AÑOS</p>
                          {esMenor && <p className="text-brand-accent animate-pulse">⚠️ REQUIERE AUTORIZACIÓN DEL TUTOR</p>}
                        </div>
                      )}
                    </div>

                    {esMenor && (
                      <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 p-6 rounded-[2rem] bg-brand-accent/5 border border-brand-accent/20 animate-in zoom-in-95 duration-300">
                        <div className="md:col-span-2 flex items-start gap-3 p-4 rounded-xl bg-brand-accent/10 border border-brand-accent/20 mb-2">
                          <Smartphone className="text-brand-accent mt-1 flex-none" size={18} />
                          <div>
                            <p className="text-xs font-bold uppercase tracking-tight text-brand-accent">Autorización Parental Requerida</p>
                            <p className="text-[11px] leading-relaxed text-indigo-200">
                              Al ser menor de edad, el tutor responsable recibirá un enlace por WhatsApp para firmar y validar tu inscripción mediante firma digital.
                            </p>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-semibold text-brand-accent">Nombre del Tutor responsable *</label>
                          <input className="w-full rounded-xl px-4 py-3 bg-indigo-950/40 border border-brand-accent/30 text-white focus:outline-none focus:ring-1 focus:ring-brand-accent" name="tutor_nombre" placeholder="Nombre completo" value={form.tutor_nombre} onChange={onChange} required />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-semibold text-brand-accent">DNI del Tutor *</label>
                          <input className="w-full rounded-xl px-4 py-3 bg-indigo-950/40 border border-brand-accent/30 text-white focus:outline-none focus:ring-1 focus:ring-brand-accent" name="tutor_dni" placeholder="DNI del tutor" value={form.tutor_dni} onChange={onChange} required />
                        </div>
                        <div className="md:col-span-2 space-y-2">
                          <label className="text-xs font-semibold text-brand-accent">WhatsApp del Tutor (Celular) *</label>
                          <input className="w-full rounded-xl px-4 py-3 bg-indigo-950/40 border border-brand-accent/30 text-white focus:outline-none focus:ring-1 focus:ring-brand-accent" name="tutor_telefono" placeholder="2964 XXXXXX (Sin 0 ni 15)" value={form.tutor_telefono} onChange={onChange} required />
                        </div>
                      </div>
                    )}

                    <div className="space-y-2"><label className="text-xs font-black uppercase tracking-widest ml-1 text-indigo-400">Nacionalidad</label><input className="w-full rounded-2xl px-5 py-4 bg-indigo-950/40 border border-indigo-500/30 text-white focus:outline-none" name="nacionalidad" value={form.nacionalidad} onChange={onChange} /></div>
                    <div className="space-y-2"><label className="text-xs font-black uppercase tracking-widest ml-1 text-indigo-400">Provincia de Nacimiento</label><input className="w-full rounded-2xl px-5 py-4 bg-indigo-950/40 border border-indigo-500/30 text-white focus:outline-none" name="lugar_nacimiento" placeholder="Ej: Tierra del Fuego" value={form.lugar_nacimiento} onChange={onChange} /></div>
                  </div>
                </div>
              )}

              {/* STEP 3: CONTACTO */}
              {step === 3 && (
                <div className="animate-in fade-in slide-in-from-right-8 duration-500 space-y-8">
                  <div className="space-y-2">
                    <h2 className="text-2xl font-black text-white">Contacto y Situación</h2>
                    <p className="text-indigo-300">Medios de comunicación y perfil sociodemográfico.</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2 space-y-2">
                      <label className="text-xs font-black uppercase tracking-widest ml-1 text-brand-cyan">Email (Correo Electrónico)</label>
                      <input type="email" className="w-full rounded-2xl px-5 py-4 bg-indigo-950/40 border border-indigo-500/30 text-white focus:outline-none focus:ring-1" name="email" placeholder="usuario@ejemplo.com" value={form.email} onChange={onChange} required />
                    </div>
                    <div className="space-y-2"><label className="text-xs font-black uppercase tracking-widest ml-1 text-indigo-400">Celular / Teléfono</label><input className="w-full rounded-2xl px-5 py-4 bg-indigo-950/40 border border-indigo-500/30 text-white focus:outline-none" name="telefono" placeholder="2964 XXXXXX" value={form.telefono} onChange={onChange} /></div>
                    <div className="space-y-2"><label className="text-xs font-black uppercase tracking-widest ml-1 text-indigo-400">Nivel Educativo</label><select className="w-full rounded-2xl px-5 py-4 bg-indigo-950/40 border border-indigo-500/30 text-white focus:outline-none" name="nivel_educativo" value={form.nivel_educativo} onChange={onChange}>{NIVEL_EDUCATIVO_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}</select></div>

                    <div className="space-y-2"><label className="text-xs font-black uppercase tracking-widest ml-1 text-indigo-400">Ciudad</label><input className="w-full rounded-2xl px-5 py-4 bg-indigo-950/40 border border-indigo-500/30 text-white focus:outline-none" name="ciudad" placeholder="Ej: Río Grande" value={form.ciudad} onChange={onChange} /></div>
                    <div className="space-y-2"><label className="text-xs font-black uppercase tracking-widest ml-1 text-indigo-400">Barrio</label><input className="w-full rounded-2xl px-5 py-4 bg-indigo-950/40 border border-indigo-500/30 text-white focus:outline-none" name="barrio" placeholder="Ej: Chacra IV" value={form.barrio} onChange={onChange} /></div>

                    <div className="md:col-span-2 space-y-2">
                      <label className="text-xs font-black uppercase tracking-widest ml-1 text-indigo-400">Domicilio Particular</label>
                      <input className="w-full rounded-2xl px-5 py-4 bg-indigo-950/40 border border-indigo-500/30 text-white focus:outline-none" name="domicilio" placeholder="Calle y número" value={form.domicilio} onChange={onChange} />
                    </div>

                    <div className="md:col-span-2 p-6 rounded-[2rem] bg-indigo-950/20 border border-indigo-500/20 space-y-4">
                      <p className="text-xs font-black uppercase tracking-tighter text-brand-cyan">Equipamiento y Trabajo</p>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <label className="flex items-center gap-2 cursor-pointer group"><input type="checkbox" className="w-5 h-5 rounded border-indigo-500/30 text-brand-cyan" name="posee_pc" checked={form.posee_pc} onChange={onChange} /><span className="text-sm font-bold">Poseo PC</span></label>
                        <label className="flex items-center gap-2 cursor-pointer group"><input type="checkbox" className="w-5 h-5 rounded border-indigo-500/30 text-brand-cyan" name="posee_conectividad" checked={form.posee_conectividad} onChange={onChange} /><span className="text-sm font-bold">Tengo Internet</span></label>
                        <label className="flex items-center gap-2 cursor-pointer group"><input type="checkbox" className="w-5 h-5 rounded border-indigo-500/30 text-brand-accent" name="trabaja" checked={form.trabaja} onChange={onChange} /><span className="text-sm font-bold">Actualmente Trabajo</span></label>
                      </div>
                      {form.trabaja && (
                        <div className="mt-4 animate-in fade-in slide-in-from-top-2">
                          <label className="text-xs font-black uppercase tracking-widest ml-1 text-brand-accent">Lugar de Trabajo</label>
                          <input className="w-full rounded-2xl px-5 py-4 mt-1 bg-indigo-950/40 border border-brand-accent/35 text-white focus:outline-none" name="lugar_trabajo" placeholder="Nombre de la empresa o institución" value={form.lugar_trabajo} onChange={onChange} />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 4: DOCUMENTACION */}
              {step === 4 && (
                <div className="animate-in fade-in slide-in-from-right-8 duration-500 space-y-8">
                  <div className="space-y-2">
                    <h2 className="text-2xl font-black text-white">Documentación Digital</h2>
                    <p className="text-indigo-300">Subí copias digitales legibles de la documentación requerida.</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <DropFileField label="Copia Frente y Dorso de tu DNI" required file={dniFile} onFileChange={setDniFile} />
                    {esMenor ? (
                      <DropFileField label="Copia DNI del Padre/Madre o Tutor (Obligatorio)" required file={dniTutorFile} onFileChange={setDniTutorFile} />
                    ) : (
                      <DropFileField
                        label="Copia de Título Secundario / Analítico"
                        required
                        file={tituloFile}
                        onFileChange={setTituloFile}
                        description="Formatos permitidos: PDF o foto/imagen. Deben incluirse todas sus hojas, tanto el anverso como el reverso."
                      />
                    )}
                  </div>
                  <div className="p-6 rounded-3xl bg-emerald-500/5 border border-emerald-500/20">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-2xl bg-emerald-500 text-[#050814] shadow-lg shadow-emerald-500/20"><CheckCircle2 size={24} /></div>
                      <div>
                        <p className="font-black tracking-tight leading-none text-white">Postulación Lista para Enviar</p>
                        <p className="text-sm text-indigo-300 mt-1">Al enviar, declarás que la información proporcionada es verídica.</p>
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
                    className="flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all bg-white/5 hover:bg-white/10 text-white disabled:opacity-55"
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
              <div className="bg-indigo-950/90 border border-brand-cyan/30 rounded-[3rem] p-10 max-w-md w-full text-center space-y-6 shadow-2xl relative overflow-hidden">
                <div className="absolute -top-10 -left-10 w-40 h-40 bg-emerald-500/10 rounded-full blur-2xl" />
                <div className="relative mx-auto w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/40">
                  <CheckCircle2 size={50} className="text-[#050814]" />
                  <div className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-25" />
                </div>
                <h3 className="text-3xl font-black tracking-tight">¡Genial!</h3>
                <p className="text-indigo-200 text-sm font-medium leading-relaxed">{ok}</p>
                <button onClick={() => setOk("")} className="w-full py-4 bg-brand-cyan text-[#05011a] font-black rounded-2xl uppercase tracking-widest text-xs hover:bg-brand-cyan/80 transition-colors">Cerrar</button>
              </div>
            </div>
          )}
        </div>
      </main>
      <FooterVideojuegos />
    </div>
  );
}
