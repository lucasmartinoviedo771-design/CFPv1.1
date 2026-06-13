import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  X,
  Gamepad2,
  Clock,
} from "lucide-react";
import { apiClientV2 } from "../api/client";
import { NavbarVideojuegos } from "../components/NavbarVideojuegos";
import { FooterVideojuegos } from "../components/FooterVideojuegos";
import {
  compressImage,
  validateFile,
  normalizeText,
  calculateAge,
} from "../components/Preinscripcion/formHelpers";
import {
  STORAGE_KEY,
  FormState,
  INIT_FORM,
  Bloque,
  ProgramaOferta,
  VideojuegosConfig,
} from "../components/PreinscripcionVideojuegos/types";
import { ProgressBar } from "../components/PreinscripcionVideojuegos/ProgressBar";
import { StepEspecialidad } from "../components/PreinscripcionVideojuegos/StepEspecialidad";
import { StepIdentidad } from "../components/PreinscripcionVideojuegos/StepIdentidad";
import { StepContacto } from "../components/PreinscripcionVideojuegos/StepContacto";
import { StepDocumentacion } from "../components/PreinscripcionVideojuegos/StepDocumentacion";

function isOptativo(bloqueNombre: string): boolean {
  const norm = normalizeText(bloqueNombre);
  return norm.includes("arte") || norm.includes("entornos virtuales") || norm.includes("animacion");
}

function loadSaved(): { form: FormState; step: number; bloquesSeleccionados: number[] } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { form: INIT_FORM, step: 1, bloquesSeleccionados: [] };
    const parsed = JSON.parse(raw) as {
      form?: Partial<FormState>;
      step?: number;
      bloquesSeleccionados?: number[];
      expiresAt?: number;
    } | null;
    if (!parsed) return { form: INIT_FORM, step: 1, bloquesSeleccionados: [] };
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
  const [ofertaPrograma, setOfertaPrograma] = useState<ProgramaOferta | null>(null);
  const [config, setConfig] = useState<VideojuegosConfig>({ abierta: true, fecha_inicio: null, fecha_fin: null });

  // Selección de bloques del estudiante (contendrá optativos elegidos + obligatorios bloqueados)
  const [bloquesSeleccionados, setBloquesSeleccionados] = useState<number[]>(saved.bloquesSeleccionados);

  const [dniFile, setDniFile] = useState<File | null>(null);
  const [tituloFile, setTituloFile] = useState<File | null>(null);
  const [dniTutorFile, setDniTutorFile] = useState<File | null>(null);

  const [form, setForm] = useState<FormState>(saved.form);

  useEffect(() => {
    const expiresAt = Date.now() + 24 * 60 * 60 * 1000;
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ form, step, bloquesSeleccionados, expiresAt })
    );
  }, [form, step, bloquesSeleccionados]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        // 1. Cargar configuración de videojuegos
        try {
          const { data: cfg } = await apiClientV2.get<VideojuegosConfig>("/videojuegos/config");
          setConfig(cfg);
        } catch (e) {
          console.error("No se pudo obtener config de videojuegos", e);
        }

        // 2. Cargar oferta del programa "VJ"
        const { data } = await apiClientV2.get<{ items?: ProgramaOferta[] }>("/preinscripcion/oferta", {
          params: { programa_codigo: "VJ" },
        });

        const prog = data?.items?.[0] || null;
        setOfertaPrograma(prog);

        if (prog) {
          // Pre-seleccionar todos los bloques obligatorios (que no son optativos)
          const obligatoriosIds = (prog.bloques || [])
            .filter((b) => !isOptativo(b.bloque_nombre))
            .map((b) => b.bloque_id);
          setBloquesSeleccionados((prev) => {
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
    return (ofertaPrograma.bloques || []).filter((b) => isOptativo(b.bloque_nombre));
  }, [ofertaPrograma]);

  const obligatoryBlocks = useMemo(() => {
    if (!ofertaPrograma) return [];
    return (ofertaPrograma.bloques || []).filter((b) => !isOptativo(b.bloque_nombre));
  }, [ofertaPrograma]);

  const edad = useMemo(() => {
    return calculateAge(form.fecha_nacimiento);
  }, [form.fecha_nacimiento]);

  const esMenor = edad < 18;

  const validateStep = (s: number): boolean => {
    setError("");
    if (s === 1) {
      // Validar que se haya seleccionado al menos un bloque optativo
      const optativosSeleccionados = bloquesSeleccionados.filter((id) =>
        optativeBlocks.some((ob) => ob.bloque_id === id)
      );
      if (optativosSeleccionados.length === 0) {
        setError(
          "Debés seleccionar al menos una especialidad optativa (Arte y Animación o Programación de Entornos Virtuales)."
        );
        return false;
      }
    }
    if (s === 2) {
      if (!form.apellido.trim() || !form.nombre.trim() || !form.DNI.trim() || !form.fecha_nacimiento) {
        setError("Completá los campos obligatorios (Nombre, Apellido, DNI y Fecha de Nacimiento).");
        return false;
      }
      if (esMenor) {
        if (edad < 15) {
          setError("La edad mínima para preinscribirse es de 15 años.");
          return false;
        }
        if (!form.tutor_nombre.trim() || !form.tutor_dni.trim() || !form.tutor_telefono.trim()) {
          setError("Al ser menor de edad, debés completar todos los datos del tutor responsable.");
          return false;
        }
      }
    }
    if (s === 3) {
      if (!form.email.trim()) {
        setError("El email es obligatorio para el contacto.");
        return false;
      }
    }
    if (s === 4) {
      if (!dniFile) {
        setError("Debés adjuntar la digitalización del DNI.");
        return false;
      }
      if (esMenor && !dniTutorFile) {
        setError("Debés adjuntar la digitalización del DNI del Padre/Madre o Tutor.");
        return false;
      }
      if (!esMenor && !tituloFile) {
        setError("Esta oferta requiere adjuntar el título secundario.");
        return false;
      }
    }
    return true;
  };

  const nextStep = () => {
    if (validateStep(step)) {
      setStep((prev) => Math.min(prev + 1, 4));
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const prevStep = () => {
    setStep((prev) => Math.max(prev - 1, 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const toggleBloqueOptativo = (bid: number) => {
    setBloquesSeleccionados((prev) => {
      if (prev.includes(bid)) {
        // No permitir deseleccionar si es el único optativo
        const optativosRestantes = prev.filter((id) => id !== bid && optativeBlocks.some((ob) => ob.bloque_id === id));
        if (optativosRestantes.length === 0) return prev;
        return prev.filter((x) => x !== bid);
      } else {
        return [...prev, bid];
      }
    });
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validateStep(1)) return setStep(1);
    if (!validateStep(2)) return setStep(2);
    if (!validateStep(3)) return setStep(3);

    const dniErr = validateFile(dniFile, "DNI");
    if (dniErr) {
      setError(dniErr);
      setStep(4);
      return;
    }

    if (!esMenor) {
      const tErr = validateFile(tituloFile, "Título secundario");
      if (tErr) {
        setError(tErr);
        setStep(4);
        return;
      }
    }

    if (!ofertaPrograma) return;

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
          bloque_ids: bloquesSeleccionados,
        },
      ];
      fd.append("seleccion_programas_json", JSON.stringify(seleccion));

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

      // Token reCAPTCHA v3 mockup o real
      fd.append("recaptcha_token", "mock_token_vj");

      await apiClientV2.post("/preinscripcion", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setOk(
        `¡Postulación registrada! Hemos recibido tus datos correctamente. Se ha enviado un correo a ${form.email} confirmando el registro.`
      );
      localStorage.removeItem(STORAGE_KEY);
      setStep(1);
      setForm(INIT_FORM);
      setDniFile(null);
      setTituloFile(null);
      setDniTutorFile(null);

      // Resetear bloques seleccionados con los obligatorios de nuevo
      const obligatoriosIds = (ofertaPrograma.bloques || [])
        .filter((b) => !isOptativo(b.bloque_nombre))
        .map((b) => b.bloque_id);
      setBloquesSeleccionados(obligatoriosIds);
    } catch (eReq) {
      console.error("Error al enviar formulario:", eReq);
      let msg = "Ocurrió un error al procesar tu preinscripción. Por favor verifica los datos ingresados.";
      const errorObj = eReq as { response?: { data?: string | Record<string, string | string[]> } };
      const data = errorObj.response?.data;
      if (data) {
        if (typeof data === "string") msg = data;
        else if (data.detail) {
          msg = Array.isArray(data.detail) ? data.detail.join(", ") : String(data.detail);
        } else if (typeof data === "object") {
          const firstKey = Object.keys(data)[0];
          const firstError = data[firstKey];
          msg = Array.isArray(firstError) ? `${firstKey}: ${firstError[0]}` : String(firstError);
        }
      }
      setError(msg);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-[#050814] text-white items-center justify-center font-sans">
        <div className="animate-spin text-cyan-400 mb-4">
          <Gamepad2 size={48} />
        </div>
        <p className="text-indigo-300 font-bold uppercase tracking-wider">
          Cargando Oferta Académica de Videojuegos...
        </p>
      </div>
    );
  }

  if (!config.abierta) {
    return (
      <div className="flex flex-col min-h-screen bg-[#050814] text-white items-center justify-center font-sans px-4">
        <div className="max-w-md w-full bg-[#0c122c]/80 border border-indigo-500/20 rounded-[2rem] p-10 text-center space-y-6 shadow-2xl relative overflow-hidden">
          <div className="absolute -top-10 -left-10 w-40 h-40 bg-orange-500/10 rounded-full blur-2xl" />
          <div className="relative mx-auto w-20 h-20 bg-orange-500/20 text-orange-500 rounded-2xl flex items-center justify-center">
            <Clock size={40} />
          </div>
          <h2 className="text-3xl font-black text-white">Inscripciones Cerradas</h2>
          <p className="text-indigo-300 text-sm leading-relaxed">
            {config.mensaje_cierre ||
              "Las inscripciones para la Certificación en Desarrollo de Videojuegos no están abiertas en este momento."}
          </p>
          {config.fecha_inicio && (
            <p className="text-xs font-bold uppercase tracking-wider text-cyan-400">
              Período: {config.fecha_inicio} al {config.fecha_fin}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen font-sans selection:bg-cyan-400/30 text-white bg-[#050814] relative overflow-hidden">
      {/* Background radial effects */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/10 via-[#050814] to-[#050814]" />
        <div className="absolute top-10 left-1/4 w-96 h-96 rounded-full bg-cyan-400/5 blur-[120px]" />
        <div className="absolute bottom-10 right-1/4 w-96 h-96 rounded-full bg-orange-500/5 blur-[120px]" />
      </div>

      <NavbarVideojuegos />

      <main className="relative z-10 flex-grow pt-28 pb-20 px-4 flex flex-col items-center">
        <div className="max-w-4xl w-full space-y-8">
          {/* Header */}
          <header className="text-center space-y-4 animate-in fade-in slide-in-from-top-4 duration-700">
            <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight leading-tight max-w-3xl mx-auto">
              Certificación Profesional en{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 via-[#ff6600] to-cyan-400">
                Desarrollo de Videojuegos
              </span>
            </h1>
            <p className="text-indigo-200 text-lg font-medium max-w-2xl mx-auto">
              Sumate a una capacitación integral que combina creatividad, tecnología y trabajo en equipo para crear los
              juegos del futuro.
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
                  <div className="p-2 bg-red-500 rounded-lg text-white">
                    <X size={16} />
                  </div>{" "}
                  {error}
                </div>
              </div>
            )}

            <form onSubmit={onSubmit} className="space-y-10 min-h-[400px]">
              {/* STEP 1: SELECTOR DE ESPECIALIDAD */}
              {step === 1 && (
                <StepEspecialidad
                  bloquesSeleccionados={bloquesSeleccionados}
                  optativeBlocks={optativeBlocks}
                  obligatoryBlocks={obligatoryBlocks}
                  onToggleBloqueOptativo={toggleBloqueOptativo}
                />
              )}

              {/* STEP 2: IDENTIDAD */}
              {step === 2 && (
                <StepIdentidad form={form} onChange={onChange} edad={edad} esMenor={esMenor} />
              )}

              {/* STEP 3: CONTACTO */}
              {step === 3 && <StepContacto form={form} onChange={onChange} />}

              {/* STEP 4: DOCUMENTACION */}
              {step === 4 && (
                <StepDocumentacion
                  esMenor={esMenor}
                  dniFile={dniFile}
                  onDniFileChange={setDniFile}
                  dniTutorFile={dniTutorFile}
                  onDniTutorFileChange={setDniTutorFile}
                  tituloFile={tituloFile}
                  onTituloFileChange={setTituloFile}
                />
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
                  <button
                    type="button"
                    onClick={nextStep}
                    className="group relative flex items-center justify-center gap-3 px-10 py-4 bg-cyan-400 border-b-4 border-cyan-700 text-[#05011a] font-black uppercase tracking-widest text-xs rounded-2xl transition-all hover:scale-[1.02] hover:-translate-y-1 active:border-b-0 active:translate-y-0.5"
                  >
                    Siguiente Paso{" "}
                    <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={saving}
                    className="group relative flex items-center justify-center gap-3 px-12 py-4 bg-gradient-to-r from-cyan-400 to-orange-500 text-white font-black uppercase tracking-widest text-xs rounded-2xl transition-all hover:shadow-[0_0_30px_rgba(0,255,255,0.4)] hover:scale-105 active:scale-95 disabled:grayscale"
                  >
                    {saving ? "Procesando..." : "Confirmar Preinscripción"} <CheckCircle2 size={16} />
                  </button>
                )}
              </footer>
            </form>
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
                <button
                  onClick={() => setOk("")}
                  className="w-full py-4 bg-cyan-400 text-[#05011a] font-black rounded-2xl uppercase tracking-widest text-xs hover:bg-cyan-400/80 transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
      <FooterVideojuegos />
    </div>
  );
}
