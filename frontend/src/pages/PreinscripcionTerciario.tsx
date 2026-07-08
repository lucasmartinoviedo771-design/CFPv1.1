import React, { useState, useEffect } from "react";
import { ArrowRight, ArrowLeft, CheckCircle2, AlertTriangle, X } from "lucide-react";
import { apiClientV2 } from "../api/client";

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

import { STORAGE_KEY, FormState, INIT_FORM, PreinscripcionConfig } from "../components/PreinscripcionTerciario/types";
import { getEmailPorLocalidad } from "../components/PreinscripcionTerciario/constants";
import { ProgressBar } from "../components/PreinscripcionTerciario/ProgressBar";
import { StepPersonales } from "../components/PreinscripcionTerciario/StepPersonales";
import { StepAcademicos } from "../components/PreinscripcionTerciario/StepAcademicos";
import { StepTecnologicos } from "../components/PreinscripcionTerciario/StepTecnologicos";
import { StepComplementarios } from "../components/PreinscripcionTerciario/StepComplementarios";

const P = { navy: "#1a1f4e", yellow: "#f5c518", blue: "#b8ccd8" };

function loadSaved(): { form: FormState; step: number } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { form: INIT_FORM, step: 1 };
    const parsed = JSON.parse(raw) as { form?: Partial<FormState>; step?: number; expiresAt?: number } | null;
    if (!parsed) return { form: INIT_FORM, step: 1 };
    if (parsed.expiresAt && Date.now() > parsed.expiresAt) {
      localStorage.removeItem(STORAGE_KEY);
      return { form: INIT_FORM, step: 1 };
    }
    return { form: { ...INIT_FORM, ...parsed.form }, step: parsed.step || 1 };
  } catch {
    return { form: INIT_FORM, step: 1 };
  }
}

export default function PreinscripcionTerciario() {
  const saved = loadSaved();
  const [step, setStep] = useState(saved.step);
  const [form, setForm] = useState<FormState>(saved.form);

  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [rechazado, setRechazado] = useState(false);
  const [configLoading, setConfigLoading] = useState(true);
  const [config, setConfig] = useState<PreinscripcionConfig | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    loadRecaptcha();
    
    // Buscar token en la URL
    const params = new URLSearchParams(window.location.search);
    const t = params.get("token");
    if (t) {
      setToken(t);
      apiClientV2
        .get<FormState>(`/preinscripcion-terciario/data`, { params: { token: t } })
        .then(({ data }) => {
          // Normalizar valores booleanos a strings esperados por los inputs
          const normalizedData = { ...data } as Record<string, unknown>;
          Object.keys(normalizedData).forEach(key => {
            if (normalizedData[key] === true) normalizedData[key] = "si";
            if (normalizedData[key] === false) normalizedData[key] = "no";
            if (normalizedData[key] === null) normalizedData[key] = "";
          });
          setForm((p) => ({ ...p, ...normalizedData }));
        })
        .catch((err) => {
          console.error("Error al cargar datos del token:", err);
          setError("El enlace de completado de datos es inválido o ha expirado.");
        });
    }
  }, []);

  useEffect(() => {
    apiClientV2
      .get<PreinscripcionConfig>("/preinscripcion-terciario-config")
      .then(({ data }) => setConfig(data))
      .catch(() => setConfig({ abierta: false, mensaje_cierre: "No se pudo verificar el estado del formulario." }))
      .finally(() => setConfigLoading(false));
  }, []);

  // Persistir en localStorage con expiración de 24 horas (solo si no estamos usando un token)
  useEffect(() => {
    if (token) return;
    const expiresAt = Date.now() + 24 * 60 * 60 * 1000;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ form, step, expiresAt }));
  }, [form, step, token]);

  const onSelect = (name: string, value: string) =>
    setForm((p) => {
      const next = { ...p, [name]: value };
      if (name === "posee_discapacidad" && value === "no") {
        next.tipo_discapacidad = "";
        next.posee_cud = "";
        next.apoyo_inclusion = "";
        next.requiere_apoyo_especifico = "";
        next.descripcion_apoyo = "";
      }
      if (name === "posee_estudios_superiores" && value === "no") {
        next.estudios_superiores_finalizado = "";
        next.estudios_superiores_carrera = "";
      }
      return next;
    });

  const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  const validate = (s: number): boolean => {
    setError("");
    if (s === 1) {
      if (!form.email.trim()) return setError("El email es obligatorio."), false;
      if (!form.apellido.trim()) return setError("El apellido es obligatorio."), false;
      if (!form.nombre.trim()) return setError("El nombre es obligatorio."), false;
      if (!form.dni.trim()) return setError("El DNI es obligatorio."), false;
      if (!form.cuil.trim()) return setError("El CUIL es obligatorio."), false;
      if (!/^\d{11}$/.test(form.cuil)) return setError("El CUIL debe tener exactamente 11 dígitos numéricos."), false;
      if (!form.sexo) return setError("El sexo es obligatorio."), false;
      if (!form.celular.trim()) return setError("El celular es obligatorio."), false;
      if (!/^\d{10}$/.test(form.celular)) return setError("El celular debe tener exactamente 10 dígitos numéricos. Ej: 2964123456"), false;
      if (!form.fecha_nacimiento) return setError("La fecha de nacimiento es obligatoria."), false;
      if (!form.provincia_nacimiento) return setError("La provincia de nacimiento es obligatoria."), false;
      if (!form.localidad_nacimiento) return setError("La localidad de nacimiento es obligatoria."), false;
      if (form.localidad_nacimiento === "Otra" && !form.localidad_nacimiento_otra.trim())
        return setError("Especificá tu localidad de nacimiento."), false;
      if (!form.nacionalidad.trim()) return setError("La nacionalidad es obligatoria."), false;
      if (!form.domicilio.trim()) return setError("El domicilio es obligatorio."), false;
      if (!form.provincia_residencia) return setError("La provincia de residencia es obligatoria."), false;
      if (!form.localidad) return setError("La localidad de residencia es obligatoria."), false;
    }
    if (s === 2) {
      if (!form.finalizo_secundaria) return setError("Indicá si finalizaste el secundario."), false;
      if (!form.posee_estudios_superiores) return setError("Indicá si poseés estudios superiores."), false;
      if (form.posee_estudios_superiores === "si") {
        if (!form.estudios_superiores_finalizado) return setError("Indicá si finalizaste los estudios superiores."), false;
        if (!form.estudios_superiores_carrera.trim()) return setError("Especificá el nombre de la carrera de estudios superiores."), false;
      }
    }
    if (s === 3) {
      if (!form.posee_pc) return setError("Indicá si poseés PC o notebook."), false;
      if (!form.posee_internet) return setError("Indicá si poseés conectividad."), false;
    }
    if (s === 4) {
      if (!form.pueblo_originario) return setError("Indicá si pertenecés a pueblos originarios."), false;
      if (!form.posee_discapacidad) return setError("Indicá si poseés alguna discapacidad."), false;
      if (form.posee_discapacidad === "si") {
        if (!form.tipo_discapacidad) return setError("Indicá el tipo de discapacidad."), false;
        if (!form.posee_cud) return setError("Indicá si poseés CUD."), false;
        if (!form.apoyo_inclusion) return setError("Indicá el tipo de apoyo que recibís en el aula."), false;
        if (!form.requiere_apoyo_especifico) return setError("Indicá si requerís apoyo específico."), false;
        if (form.requiere_apoyo_especifico === "si" && !form.descripcion_apoyo.trim())
          return setError("Describí el tipo de apoyo que necesitás."), false;
      }
    }
    return true;
  };

  const nextStep = () => {
    if (validate(step)) {
      setStep((p) => Math.min(p + 1, 5));
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };
  const prevStep = () => {
    setError("");
    setStep((p) => Math.max(p - 1, 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (step < 4) {
      nextStep();
      return;
    }

    // Validar todos los pasos secuencialmente antes de enviar
    for (let i = 1; i <= 4; i++) {
      if (!validate(i)) {
        setStep(i);
        return;
      }
    }

    setSaving(true);
    try {
      const recaptchaToken = await getRecaptchaToken("preinscripcion_terciario");
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v ?? ""));
      fd.append("recaptcha_token", recaptchaToken);
      if (token) {
        fd.append("token", token);
      }

      await apiClientV2.post("/preinscripcion-terciario", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (!token) {
        localStorage.removeItem(STORAGE_KEY);
      }
      setDone(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      const errorObj = err as { response?: { data?: string | { detail?: string } } };
      const data = errorObj.response?.data;
      let msg = "Error al enviar el formulario.";
      if (data) {
        if (typeof data === "string") msg = data;
        else if (data && typeof data === "object" && "detail" in data && typeof data.detail === "string") {
          msg = data.detail;
        }
      }
      setError(msg);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setSaving(false);
    }
  };

  const Header = () => (
    <header style={{ background: P.navy }} className="shadow-lg">
      <div className="max-w-3xl mx-auto">
        <img
          src="/banner_preinscripcion.png"
          alt="Centro Politécnico Superior Malvinas Argentinas"
          className="w-full h-auto object-contain block"
        />
      </div>
    </header>
  );

  if (rechazado) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "#1a1f4e" }}>
        <div className="max-w-lg w-full text-center space-y-8">
          <div className="mx-auto w-28 h-28 bg-red-500/20 rounded-full flex items-center justify-center border-4 border-red-500/40">
            <AlertTriangle size={60} className="text-red-400" />
          </div>
          <div className="space-y-4">
            <h2 className="text-4xl font-black text-white leading-tight">
              Solo residentes de
              <br />
              Tierra del Fuego
            </h2>
            <p className="text-white/60 text-lg leading-relaxed">
              La <span className="text-[#f5c518] font-semibold">Tecnicatura en Ciencias de Datos e IA</span> es exclusiva
              para personas que residan en la provincia de Tierra del Fuego, Antártida e Islas del Atlántico Sur.
            </p>
            <p className="text-white/40 text-sm">
              Si creés que esto es un error o tu situación es especial, comunicate con la institución.
            </p>
          </div>
          <button
            onClick={() => {
              setRechazado(false);
              setForm((p) => ({ ...p, provincia_residencia: "", localidad: "" }));
            }}
            className="px-8 py-4 rounded-2xl font-bold text-base transition-opacity hover:opacity-90"
            style={{ background: "#f5c518", color: "#1a1f4e" }}
          >
            ← Volver al formulario
          </button>
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="min-h-screen bg-[#b8ccd8] flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-xl max-w-md w-full p-10 text-center space-y-6">
          <div className="relative mx-auto w-20 h-20 bg-[#f5c518] rounded-full flex items-center justify-center shadow-lg">
            <CheckCircle2 size={44} className="text-[#1a1f4e]" />
            <div className="absolute inset-0 rounded-full bg-[#f5c518] animate-ping opacity-20" />
          </div>
          <h2 className="text-2xl font-black text-[#1a1f4e]">¡Preinscripción recibida!</h2>
          <p className="text-[#1a1f4e]/70 text-sm leading-relaxed">
            Tu preinscripción fue registrada correctamente. En los próximos días recibirás un email con información en{" "}
            <strong>{form.email}</strong>.
          </p>
          <p className="text-xs text-[#1a1f4e]/50">
            Ante dudas:{" "}
            <a href={`mailto:${getEmailPorLocalidad(form.localidad)}`} className="underline">
              {getEmailPorLocalidad(form.localidad)}
            </a>
          </p>
        </div>
      </div>
    );
  }

  if (configLoading) {
    return (
      <div className="min-h-screen bg-[#b8ccd8] flex flex-col">
        <Header />
        <div className="flex-grow flex items-center justify-center text-[#1a1f4e]/50 text-sm">Cargando...</div>
      </div>
    );
  }

  if (!config?.abierta && !token) {
    return (
      <div className="min-h-screen bg-[#b8ccd8] flex flex-col">
        <Header />
        <main className="flex-grow flex items-center justify-center px-4 py-16">
          <div className="max-w-lg w-full text-center space-y-6">
            <div className="text-lg md:text-xl font-black uppercase tracking-widest text-[#1a1f4e] leading-tight max-w-md mx-auto">
              Tecnicatura en Ciencias de
              <br />
              Datos e Inteligencia Artificial
            </div>
            <div className="w-20 h-20 rounded-2xl mx-auto flex items-center justify-center" style={{ background: P.navy }}>
              <span className="text-4xl">📋</span>
            </div>
            <div>
              <h1 className="text-2xl font-black text-[#1a1f4e] mb-3">Preinscripciones cerradas</h1>
              <p className="text-[#1a1f4e]/70 text-sm leading-relaxed">
                {config?.mensaje_cierre || "Las preinscripciones están cerradas en este momento."}
              </p>
            </div>
            {(config?.fecha_inicio || config?.fecha_fin) && (
              <div
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
                style={{ background: P.yellow + "30", color: P.navy }}
              >
                📅 Período: {config.fecha_inicio || "—"} al {config.fecha_fin || "—"}
              </div>
            )}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#b8ccd8] flex flex-col">
      <Header />

      <main className="flex-grow flex items-start justify-center py-10 px-4">
        <div className="max-w-3xl w-full">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-black text-[#1a1f4e] mb-1">Preinscripción 2026</h1>
            <p className="text-[#1a1f4e]/60 text-sm">Completá los pasos para registrar tu preinscripción.</p>
          </div>

          <div className="bg-white rounded-3xl shadow-xl p-6 md:p-10">
            <ProgressBar step={step} />

            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-center gap-3 text-red-600 text-sm font-medium">
                <X size={16} className="flex-shrink-0" /> {error}
              </div>
            )}

            <form onSubmit={onSubmit} className="space-y-8 mt-8">
              {/* PASO 1: Datos Personales */}
              {step === 1 && (
                <StepPersonales
                  form={form}
                  onChange={onChange}
                  onSelect={onSelect}
                  setForm={setForm}
                  setRechazado={setRechazado}
                />
              )}

              {/* PASO 2: Datos Académicos */}
              {step === 2 && <StepAcademicos form={form} onChange={onChange} onSelect={onSelect} />}

              {/* PASO 3: Datos Tecnológicos */}
              {step === 3 && <StepTecnologicos form={form} onSelect={onSelect} />}

              {/* PASO 4: Datos Complementarios */}
              {step === 4 && <StepComplementarios form={form} onSelect={onSelect} onChange={onChange} />}

              {/* Confirmación final — paso 4 */}
              {step === 4 && (
                <div className="p-5 rounded-2xl bg-[#1a1f4e]/5 border border-[#1a1f4e]/10 mt-4 text-left">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 size={22} className="text-[#1a1f4e] flex-shrink-0" />
                    <div>
                      <p className="font-black text-[#1a1f4e] text-sm">Listo para enviar</p>
                      <p className="text-xs text-[#1a1f4e]/60 mt-0.5">
                        Al confirmar declarás que los datos ingresados son verídicos.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Footer de navegación */}
              <div className="pt-6 border-t border-[#b8ccd8] flex flex-col-reverse sm:flex-row justify-between gap-3">
                {step > 1 && (
                  <button
                    type="button"
                    onClick={prevStep}
                    disabled={saving}
                    className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl border-2 border-[#1a1f4e]/20 text-[#1a1f4e] font-bold text-sm hover:bg-[#1a1f4e]/5 transition-all"
                  >
                    <ArrowLeft size={15} /> Volver
                  </button>
                )}
                <div className="flex-grow" />
                {step < 4 ? (
                  <button
                    type="button"
                    onClick={nextStep}
                    className="flex items-center justify-center gap-2 px-8 py-3 rounded-xl font-bold text-sm transition-all hover:opacity-90 active:scale-95"
                    style={{ background: P.navy, color: P.yellow }}
                  >
                    Siguiente <ArrowRight size={15} />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex items-center justify-center gap-2 px-10 py-3 rounded-xl font-bold text-sm transition-all hover:opacity-90 active:scale-95 disabled:opacity-60"
                    style={{ background: P.yellow, color: P.navy }}
                  >
                    {saving ? "Enviando..." : "Confirmar Preinscripción"}
                    <CheckCircle2 size={15} />
                  </button>
                )}
              </div>
            </form>
          </div>

          <p className="text-center text-xs text-[#1a1f4e]/50 mt-6">
            Contacto:{" "}
            <a href={`mailto:${getEmailPorLocalidad(form.localidad)}`} className="underline">
              {getEmailPorLocalidad(form.localidad)}
            </a>
          </p>
        </div>
      </main>
    </div>
  );
}
