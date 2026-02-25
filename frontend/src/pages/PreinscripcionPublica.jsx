import React, { useEffect, useMemo, useState } from "react";
import { ArrowRight, ChevronDown, ChevronUp, Moon, Sun, CheckCircle2 } from "lucide-react";
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

function validateFile(file, label) {
  if (!file) return `${label}: archivo requerido.`;
  if (file.size > MAX_MB * 1024 * 1024) return `${label}: tamaño máximo ${MAX_MB}MB.`;
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
  return normalizeText(programaNombre) === "programador de nivel iii";
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
    <div>
      <label className={`block text-sm mb-2 ${isDark ? "text-indigo-200" : "text-slate-700"}`}>{label}</label>
      <label
        className={`block rounded-xl border-2 border-dashed p-4 cursor-pointer transition-colors ${dragOver
          ? isDark
            ? "border-brand-cyan bg-indigo-900/40"
            : "border-sky-500 bg-sky-50"
          : isDark
            ? "border-indigo-400/40 bg-indigo-950/20"
            : "border-slate-300 bg-white"
          }`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        <input
          type="file"
          accept=".pdf,image/*"
          className="hidden"
          onChange={(e) => onFileChange(e.target.files?.[0] || null)}
        />
        <div className="text-sm">
          <p className={`font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>Arrastrá y soltá el archivo acá</p>
          <p className={isDark ? "text-indigo-200" : "text-slate-600"}>o hacé clic para abrir el explorador</p>
          <p className={`mt-1 text-xs ${isDark ? "text-indigo-300" : "text-slate-500"}`}>PDF/JPG/PNG/WEBP - Máximo 3MB</p>
          <p className={`mt-2 text-xs ${isDark ? "text-emerald-300" : "text-emerald-700"}`}>
            {file ? `Seleccionado: ${file.name}` : "Ningún archivo seleccionado"}
          </p>
        </div>
      </label>
    </div>
  );
}

export default function PreinscripcionPublica() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [oferta, setOferta] = useState([]);
  const [isDark, setIsDark] = useState(() => localStorage.getItem("preins_theme") !== "light");

  const [selectedProgramaIds, setSelectedProgramaIds] = useState([]);
  const [expandedProgramaId, setExpandedProgramaId] = useState("");
  const [bloquesPorPrograma, setBloquesPorPrograma] = useState({});

  const [dniFile, setDniFile] = useState(null);
  const [tituloFile, setTituloFile] = useState(null);

  const [form, setForm] = useState({
    apellido: "",
    nombre: "",
    email: "",
    dni: "",
    cuit: "",
    sexo: "",
    fecha_nacimiento: "",
    pais_nacimiento: "Argentina",
    pais_nacimiento_otro: "",
    nacionalidad: "Argentina",
    nacionalidad_otra: "",
    lugar_nacimiento: "",
    domicilio: "",
    barrio: "",
    ciudad: "",
    telefono: "",
    nivel_educativo: "Secundaria Completa",
    posee_pc: false,
    posee_conectividad: false,
    puede_traer_pc: false,
    trabaja: false,
    lugar_trabajo: "",
  });

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const { data } = await apiClientV2.get("/preinscripcion/oferta");
        const items = Array.isArray(data?.items) ? data.items : [];
        setOferta(items);
      } catch {
        setError("No se pudo cargar la oferta de preinscripción.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    localStorage.setItem("preins_theme", isDark ? "dark" : "light");
  }, [isDark]);

  const selectedProgramas = useMemo(
    () => oferta.filter((p) => selectedProgramaIds.includes(String(p.programa_id))),
    [oferta, selectedProgramaIds]
  );
  const selectedProgramaSet = useMemo(() => new Set(selectedProgramaIds), [selectedProgramaIds]);
  const ofertaView = useMemo(
    () =>
      oferta.map((p) => ({
        ...p,
        bloquesOrdenados: [...(p.bloques || [])].sort((a, b) => {
          const aLast = isProgramacionII(a.bloque_nombre) ? 1 : 0;
          const bLast = isProgramacionII(b.bloque_nombre) ? 1 : 0;
          return aLast - bLast;
        }),
      })).sort((a, b) => {
        const aProg = normalizeText(a.programa_nombre) === "programador de nivel iii" ? 0 : 1;
        const bProg = normalizeText(b.programa_nombre) === "programador de nivel iii" ? 0 : 1;
        if (aProg !== bProg) return aProg - bProg;
        return a.programa_nombre.localeCompare(b.programa_nombre, "es");
      }),
    [oferta]
  );
  const requiereTitulo = selectedProgramas.some(
    (p) => Boolean(p.requiere_titulo_secundario) || isProgramadorNivelIII(p.programa_nombre)
  );

  const onChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const openPrograma = (p) => {
    const id = String(p.programa_id);
    const isSelected = selectedProgramaIds.includes(id);

    if (isSelected) {
      setSelectedProgramaIds((prev) => prev.filter((x) => x !== id));
      setBloquesPorPrograma((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      setExpandedProgramaId((curr) => (curr === id ? "" : curr));
      return;
    }

    setSelectedProgramaIds((prev) => [...prev, id]);
    setExpandedProgramaId(id);
    const prevSeleccion = bloquesPorPrograma[id];
    if (Array.isArray(prevSeleccion)) return;
    const defaultBloques = (p.bloques || [])
      .filter((b) => (b.correlativas_ids || []).length === 0 && !isProgramacionII(b.bloque_nombre))
      .map((b) => b.bloque_id);
    setBloquesPorPrograma((prev) => ({ ...prev, [id]: defaultBloques }));
  };

  const toggleBloque = (programaId, bloqueId) => {
    const key = String(programaId);
    if (!selectedProgramaSet.has(key)) return;
    const actuales = bloquesPorPrograma[key] || [];
    const next = (() => {
      const exists = actuales.includes(bloqueId);
      if (exists && actuales.length <= 1) return actuales;
      return exists ? actuales.filter((x) => x !== bloqueId) : [...actuales, bloqueId];
    })();
    setBloquesPorPrograma((prev) => ({ ...prev, [key]: next }));
  };

  const resumenSeleccion = useMemo(() => {
    return selectedProgramas.map((p) => {
      const sel = bloquesPorPrograma[String(p.programa_id)] || [];
      const bloques = (p.bloques || []).filter((b) => sel.includes(b.bloque_id));
      return { programa: p, bloques };
    });
  }, [selectedProgramas, bloquesPorPrograma]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setOk("");

    if (!selectedProgramaIds.length) {
      setError("Seleccioná al menos una oferta formativa.");
      return;
    }
    for (const pid of selectedProgramaIds) {
      const sel = bloquesPorPrograma[String(pid)] || [];
      if (!sel.length) {
        const p = oferta.find((x) => String(x.programa_id) === String(pid));
        setError(`Debés dejar al menos un bloque en ${p?.programa_nombre || "la oferta seleccionada"}.`);
        return;
      }
    }

    const dniErr = validateFile(dniFile, "DNI");
    if (dniErr) {
      setError(dniErr);
      return;
    }
    if (requiereTitulo) {
      const titleErr = validateFile(tituloFile, "Título secundario");
      if (titleErr) {
        setError(titleErr);
        return;
      }
    } else if (tituloFile) {
      const titleErr = validateFile(tituloFile, "Título secundario");
      if (titleErr) {
        setError(titleErr);
        return;
      }
    }

    try {
      setSaving(true);
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, typeof v === "boolean" ? String(v) : (v || "")));
      const seleccion = selectedProgramaIds.map((pid) => ({
        programa_id: Number(pid),
        bloque_ids: bloquesPorPrograma[String(pid)] || [],
      }));
      fd.append("seleccion_programas_json", JSON.stringify(seleccion));
      fd.append("dni_digitalizado", dniFile);
      if (tituloFile) fd.append("titulo_secundario_digitalizado", tituloFile);

      const { data } = await apiClientV2.post("/preinscripcion", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setOk(
        `Preinscripción enviada. Estudiante #${data?.estudiante_id}. Inscripciones nuevas: ${data?.inscripciones_creadas?.length || 0
        }.`
      );
      // Resetear el formulario
      setForm({
        apellido: "",
        nombre: "",
        email: "",
        dni: "",
        cuit: "",
        sexo: "",
        fecha_nacimiento: "",
        pais_nacimiento: "Argentina",
        pais_nacimiento_otro: "",
        nacionalidad: "Argentina",
        nacionalidad_otra: "",
        lugar_nacimiento: "",
        domicilio: "",
        barrio: "",
        ciudad: "",
        telefono: "",
        nivel_educativo: "Secundaria Completa",
        posee_pc: false,
        posee_conectividad: false,
        puede_traer_pc: false,
        trabaja: false,
        lugar_trabajo: "",
      });
      setSelectedProgramaIds([]);
      setExpandedProgramaId("");
      setBloquesPorPrograma({});
      setDniFile(null);
      setTituloFile(null);
    } catch (eReq) {
      setError(String(eReq?.response?.data?.detail || "No se pudo enviar la preinscripción."));
    } finally {
      setSaving(false);
    }
  };

  const theme = isDark
    ? {
      page: "bg-[#090026] text-white",
      section: "bg-brand-primary/20 border-white/10",
      help: "text-indigo-200",
      title: "text-white",
      input: "bg-indigo-950/40 border-indigo-500/30 text-white placeholder-indigo-300",
      card: "border-white/10 bg-black/30",
      cardActive: "border-emerald-400 bg-emerald-900/20",
      summary: "border-indigo-400/40 bg-indigo-950/30 text-indigo-100",
    }
    : {
      page: "bg-[#cfe3f2] text-[#0f172a]",
      section: "bg-[#b8d6ea] border-[#6ba3c7] shadow-sm",
      help: "text-[#1e3a5f]",
      title: "text-[#0f172a]",
      input: "bg-[#a8cce3] border-[#6ba3c7] text-[#0f172a] placeholder-[#355a78]",
      card: "border-[#6ba3c7] bg-[#a8cce3]",
      cardActive: "border-emerald-600 bg-emerald-100",
      summary: "border-[#6ba3c7] bg-[#a8cce3] text-[#0f172a]",
    };

  return (
    <div className={`flex flex-col min-h-screen ${theme.page}`}>
      <Navbar
        rightSlot={
          <button
            type="button"
            onClick={() => setIsDark((v) => !v)}
            className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border ${isDark ? "border-indigo-400/40 bg-indigo-900/30 text-indigo-100" : "border-slate-300 bg-white text-slate-700"}`}
          >
            {isDark ? <Sun size={16} /> : <Moon size={16} />} {isDark ? "Vista clara" : "Vista oscura"}
          </button>
        }
      />
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className={`absolute top-0 left-0 w-full h-full ${isDark ? "bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/20 via-[#0a0033] to-[#0a0033]" : "bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-200 via-slate-100 to-slate-100"}`}></div>
      </div>

      <div className="relative z-10 flex-grow pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-[1500px] mx-auto space-y-6">
          <div className="animate-fade-in-up">
            <div className="inline-block px-4 py-1 rounded-full border border-brand-cyan/30 bg-brand-cyan/10 text-brand-cyan text-xs font-bold tracking-wider uppercase mb-3">
              Inscripciones Abiertas
            </div>
            <h1 className={`text-4xl md:text-5xl font-extrabold leading-tight ${theme.title}`}>
              Formulario de <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-accent to-purple-500">Preinscripción</span>
            </h1>
          </div>

          {/* Alertas fijas flotantes (Toasts) */}
          {error && (
            <div className="fixed bottom-6 right-6 lg:bottom-10 lg:right-10 z-[100] animate-fade-in-up max-w-sm md:max-w-md rounded-xl bg-red-600 px-5 py-4 text-white shadow-2xl shadow-red-900/50 flex items-start gap-3 border border-red-500">
              <div className="flex-1">
                <p className="font-bold mb-1">Oops, falta algo</p>
                <p className="text-sm text-red-100 leading-relaxed">{error}</p>
              </div>
              <button className="text-red-300 hover:text-white transition-colors p-1" onClick={() => setError("")}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
          )}

          {ok && (
            <div className="fixed bottom-6 right-6 lg:bottom-10 lg:right-10 z-[100] animate-fade-in-up max-w-sm md:max-w-md rounded-xl bg-emerald-600 px-5 py-4 text-white shadow-2xl shadow-emerald-900/50 flex items-start gap-3 border border-emerald-500">
              <div className="flex-1">
                <p className="font-bold mb-1">¡Preinscripción Exitosa!</p>
                <p className="text-sm text-emerald-100 leading-relaxed">{ok}</p>
              </div>
              <button className="text-emerald-300 hover:text-white transition-colors p-1" onClick={() => setOk("")}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
          )}

          <form onSubmit={onSubmit} className={`preins-form ${isDark ? "preins-dark" : "preins-light"} space-y-6 border rounded-2xl p-6 md:p-8 ${theme.section}`}>
            <section className="space-y-3">
              <h2 className={`text-xl font-bold ${theme.title}`}>Oferta Formativa</h2>
              <p className={`text-sm ${theme.help}`}>Primero seleccioná una oferta.</p>
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {ofertaView.map((p) => {
                  const pid = String(p.programa_id);
                  const active = selectedProgramaSet.has(pid);
                  const expanded = active && String(p.programa_id) === String(expandedProgramaId);
                  return (
                    <div
                      key={p.programa_id}
                      className={`relative rounded-xl border p-4 transition-all duration-200 cursor-pointer overflow-hidden ${active
                        ? `${theme.cardActive} ring-2 ring-emerald-500 shadow-md`
                        : `${theme.card} hover:border-brand-cyan/70 hover:shadow-sm hover:scale-[1.01]`
                        }`}
                      onClick={() => openPrograma(p)}
                    >
                      {active && (
                        <div className="absolute top-0 right-0 w-16 h-16 pointer-events-none">
                          <div className={`absolute top-0 right-0 w-0 h-0 border-t-[40px] border-l-[40px] border-l-transparent ${isDark ? 'border-t-emerald-600/80' : 'border-t-emerald-500'}`}></div>
                          <CheckCircle2 size={16} strokeWidth={3} className="absolute top-2 right-2 text-white" />
                        </div>
                      )}

                      <button
                        type="button"
                        className="w-full flex items-center justify-between text-left pr-6"
                      >
                        <div>
                          <p className={`font-bold text-lg ${theme.title}`}>{p.programa_nombre}</p>
                          <p className={`text-xs ${theme.help}`}>{p.bloques?.length || 0} bloque(s) disponible(s)</p>
                        </div>
                        {expanded ? <ChevronUp size={18} className={theme.help} /> : <ChevronDown size={18} className={theme.help} />}
                      </button>

                      {expanded ? (
                        <div className={`mt-3 space-y-2 border-t pt-3 ${isDark ? "border-white/10" : "border-slate-300"}`}>
                          {p.bloquesOrdenados.map((b) => {
                            const hasCorrelativas = (b.correlativas_ids || []).length > 0;
                            const programacionIILocked = isProgramacionII(b.bloque_nombre);
                            const checked = active && (bloquesPorPrograma[pid] || []).includes(b.bloque_id);
                            return (
                              <label key={b.bloque_id} className={`flex items-start gap-2 text-sm rounded-lg px-2 py-1 ${checked ? (isDark ? "bg-emerald-500/15 text-emerald-300" : "bg-emerald-100 text-emerald-900") : theme.help}`}>
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  disabled={programacionIILocked}
                                  onChange={() => toggleBloque(pid, b.bloque_id)}
                                />
                                <span>
                                  <strong>{b.bloque_nombre}</strong> - cohorte automática: {b.cohorte_nombre}
                                  {programacionIILocked ? (
                                    <em className="block text-amber-300">Requiere Programación I y Base de Datos aprobada.</em>
                                  ) : null}
                                  {hasCorrelativas && !programacionIILocked ? <em className="block text-amber-300">No se selecciona por defecto (requiere correlativas)</em> : null}
                                </span>
                              </label>
                            );
                          })}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
              <div className={`rounded-xl border p-4 ${theme.summary}`}>
                <h3 className={`font-bold mb-2 ${theme.title}`}>Resumen de inscripción</h3>
                {!resumenSeleccion.length ? (
                  <p className={`text-sm ${theme.help}`}>Todavía no seleccionaste una oferta formativa.</p>
                ) : (
                  <div className={`text-sm space-y-3 ${theme.help}`}>
                    {resumenSeleccion.map(({ programa, bloques }) => (
                      <div key={programa.programa_id} className={`rounded-lg border p-3 space-y-2 ${isDark ? "border-indigo-400/30 bg-indigo-900/20" : "border-slate-300 bg-white"}`}>
                        <p className={`font-semibold ${theme.title}`}>{programa.programa_nombre}</p>
                        <p><strong>Bloques seleccionados:</strong> {bloques.length}</p>
                        <ul className="space-y-1">
                          {bloques.map((b) => (
                            <li key={b.bloque_id} className={`rounded px-2 py-1 ${isDark ? "bg-indigo-700/20" : "bg-slate-100"}`}>
                              {b.bloque_nombre} - cohorte automática: {b.cohorte_nombre}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>

            <section className="space-y-3">
              <h2 className={`text-xl font-bold ${theme.title}`}>Datos Personales</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input className={`border rounded-lg px-3 py-2 ${theme.input}`} name="apellido" placeholder="Apellido" value={form.apellido} onChange={onChange} required />
                <input className={`border rounded-lg px-3 py-2 ${theme.input}`} name="nombre" placeholder="Nombre" value={form.nombre} onChange={onChange} required />
                <input className={`border rounded-lg px-3 py-2 ${theme.input}`} name="dni" placeholder="DNI (8 dígitos)" value={form.dni} onChange={onChange} required />
                <input className={`border rounded-lg px-3 py-2 ${theme.input}`} name="cuit" placeholder="CUIT (opcional)" value={form.cuit} onChange={onChange} />
                <select className={`border rounded-lg px-3 py-2 ${theme.input}`} name="sexo" value={form.sexo} onChange={onChange}>
                  <option value="">Sexo (opcional)</option><option value="Masculino">Masculino</option><option value="Femenino">Femenino</option><option value="Otro">Otro</option>
                </select>
                <input className={`border rounded-lg px-3 py-2 ${theme.input}`} name="fecha_nacimiento" type="date" value={form.fecha_nacimiento} onChange={onChange} />
                <select className={`border rounded-lg px-3 py-2 ${theme.input}`} name="pais_nacimiento" value={form.pais_nacimiento} onChange={onChange}>
                  <option value="Argentina">Argentina</option>
                  <option value="Bolivia">Bolivia</option>
                  <option value="Brasil">Brasil</option>
                  <option value="Chile">Chile</option>
                  <option value="Paraguay">Paraguay</option>
                  <option value="Uruguay">Uruguay</option>
                  <option value="Otro">Otro</option>
                </select>
                <input className={`border rounded-lg px-3 py-2 ${theme.input} transition-opacity duration-300 ${form.pais_nacimiento === 'Otro' ? 'opacity-100' : 'opacity-40 pointer-events-none'}`} name="pais_nacimiento_otro" placeholder="Especifique país de nacimiento" value={form.pais_nacimiento_otro} onChange={onChange} tabIndex={form.pais_nacimiento === 'Otro' ? 0 : -1} />
                <select className={`border rounded-lg px-3 py-2 ${theme.input}`} name="nacionalidad" value={form.nacionalidad} onChange={onChange}>
                  <option value="Argentina">Argentina</option>
                  <option value="Boliviana">Boliviana</option>
                  <option value="Brasileña">Brasileña</option>
                  <option value="Chilena">Chilena</option>
                  <option value="Paraguaya">Paraguaya</option>
                  <option value="Uruguaya">Uruguaya</option>
                  <option value="Otra">Otra</option>
                </select>
                <input className={`border rounded-lg px-3 py-2 ${theme.input} transition-opacity duration-300 ${form.nacionalidad === 'Otra' || form.nacionalidad === 'Otro' ? 'opacity-100' : 'opacity-40 pointer-events-none'}`} name="nacionalidad_otra" placeholder="Especifique nacionalidad" value={form.nacionalidad_otra} onChange={onChange} tabIndex={form.nacionalidad === 'Otra' || form.nacionalidad === 'Otro' ? 0 : -1} />
                <input className={`border rounded-lg px-3 py-2 md:col-span-2 ${theme.input}`} name="lugar_nacimiento" placeholder="Lugar de nacimiento" value={form.lugar_nacimiento} onChange={onChange} />
              </div>
            </section>

            <section className="space-y-3">
              <h2 className={`text-xl font-bold ${theme.title}`}>Contacto y Domicilio</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input className={`border rounded-lg px-3 py-2 ${theme.input}`} name="email" type="email" placeholder="Email" value={form.email} onChange={onChange} required />
                <input className={`border rounded-lg px-3 py-2 ${theme.input}`} name="telefono" placeholder="Teléfono" value={form.telefono} onChange={onChange} />
                <input className={`border rounded-lg px-3 py-2 ${theme.input}`} name="ciudad" placeholder="Ciudad" value={form.ciudad} onChange={onChange} />
                <input className={`border rounded-lg px-3 py-2 ${theme.input}`} name="barrio" placeholder="Barrio" value={form.barrio} onChange={onChange} />
                <input className={`border rounded-lg px-3 py-2 md:col-span-2 ${theme.input}`} name="domicilio" placeholder="Domicilio" value={form.domicilio} onChange={onChange} />
              </div>
            </section>

            <section className="space-y-3">
              <h2 className={`text-xl font-bold ${theme.title}`}>Situación Académica</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className={`block text-sm mb-1 ${theme.help}`}>Nivel Educativo</label>
                  <select className={`w-full border rounded-lg px-3 py-2 ${theme.input}`} name="nivel_educativo" value={form.nivel_educativo} onChange={onChange}>
                    <option value="">Seleccionar...</option>
                    {NIVEL_EDUCATIVO_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
              </div>
            </section>

            <section className="space-y-3">
              <h2 className={`text-xl font-bold ${theme.title}`}>Recursos</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className={`flex items-center gap-2 text-sm ${theme.help}`}><input type="checkbox" name="posee_pc" checked={form.posee_pc} onChange={onChange} />Posee PC</label>
                <label className={`flex items-center gap-2 text-sm ${theme.help}`}><input type="checkbox" name="posee_conectividad" checked={form.posee_conectividad} onChange={onChange} />Posee conectividad</label>
                <label className={`flex items-center gap-2 text-sm md:col-span-2 ${theme.help}`}><input type="checkbox" name="puede_traer_pc" checked={form.puede_traer_pc} onChange={onChange} />Puede traer esa PC a clase</label>
              </div>
            </section>

            <section className="space-y-3">
              <h2 className={`text-xl font-bold ${theme.title}`}>Situación Laboral</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <p className={`text-sm mb-2 ${theme.help}`}>Actualmente trabaja</p>
                  <label className={`mr-5 text-sm ${theme.help}`}>
                    <input type="radio" name="trabaja_radio" checked={form.trabaja === true} onChange={() => setForm((prev) => ({ ...prev, trabaja: true }))} /> Si
                  </label>
                  <label className={`text-sm ${theme.help}`}>
                    <input type="radio" name="trabaja_radio" checked={form.trabaja === false} onChange={() => setForm((prev) => ({ ...prev, trabaja: false, lugar_trabajo: "" }))} /> No
                  </label>
                </div>
                {form.trabaja ? <input className={`border rounded-lg px-3 py-2 md:col-span-2 ${theme.input}`} name="lugar_trabajo" placeholder="Lugar de trabajo" value={form.lugar_trabajo} onChange={onChange} /> : null}
              </div>
            </section>

            <section className="space-y-3">
              <h2 className={`text-xl font-bold ${theme.title}`}>Documentación (PDF o imagen, máx 3MB)</h2>
              <div className="grid grid-cols-1 gap-4">
                <DropFileField label="DNI (obligatorio)" required file={dniFile} onFileChange={setDniFile} isDark={isDark} />
                <DropFileField label={`Título secundario ${requiereTitulo ? "(obligatorio para este programa)" : "(opcional)"}`} required={requiereTitulo} file={tituloFile} onFileChange={setTituloFile} isDark={isDark} />
              </div>
            </section>

            <button
              type="submit"
              disabled={saving || loading}
              className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-brand-accent to-red-500 text-white px-8 py-3 rounded-xl font-bold hover:shadow-[0_0_20px_rgba(255,102,0,0.5)] transition-all disabled:opacity-60"
            >
              {saving ? "Enviando..." : "Enviar preinscripción"} <ArrowRight size={18} />
            </button>
          </form>
        </div>
      </div>
      <Footer />
    </div>
  );
}
