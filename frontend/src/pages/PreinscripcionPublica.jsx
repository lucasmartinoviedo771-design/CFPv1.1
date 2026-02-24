import React, { useEffect, useMemo, useState } from "react";
import { ArrowRight, ChevronDown, ChevronUp } from "lucide-react";
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

function DropFileField({ label, required, file, onFileChange }) {
  const [dragOver, setDragOver] = useState(false);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer?.files?.[0] || null;
    if (dropped) onFileChange(dropped);
  };

  return (
    <div>
      <label className="block text-sm text-indigo-200 mb-2">{label}</label>
      <label
        className={`block rounded-xl border-2 border-dashed p-4 cursor-pointer transition-colors ${
          dragOver ? "border-brand-cyan bg-indigo-900/40" : "border-indigo-400/40 bg-indigo-950/20"
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
          required={required}
        />
        <div className="text-sm">
          <p className="font-semibold text-white">Arrastrá y soltá el archivo acá</p>
          <p className="text-indigo-200">o hacé clic para abrir el explorador</p>
          <p className="mt-1 text-xs text-indigo-300">PDF/JPG/PNG/WEBP - Máximo 3MB</p>
          <p className="mt-2 text-xs text-emerald-300">
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

  const [programaId, setProgramaId] = useState("");
  const [expandedProgramaId, setExpandedProgramaId] = useState("");
  const [bloqueIds, setBloqueIds] = useState([]);

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

  const programaSeleccionado = useMemo(
    () => oferta.find((p) => String(p.programa_id) === String(programaId)),
    [oferta, programaId]
  );
  const bloquesSeleccionadosDetalle = useMemo(() => {
    if (!programaSeleccionado) return [];
    return (programaSeleccionado.bloques || []).filter((b) => bloqueIds.includes(b.bloque_id));
  }, [programaSeleccionado, bloqueIds]);

  const requiereTitulo = Boolean(programaSeleccionado?.requiere_titulo_secundario);

  const onChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const openPrograma = (p) => {
    const id = String(p.programa_id);
    const isSame = String(programaId) === id;
    setExpandedProgramaId((curr) => (curr === id ? "" : id));

    if (isSame) {
      setProgramaId("");
      setBloqueIds([]);
      return;
    }

    setProgramaId(id);
    const defaultBloques = (p.bloques || [])
      .filter((b) => (b.correlativas_ids || []).length === 0 && !isProgramacionII(b.bloque_nombre))
      .map((b) => b.bloque_id);
    setBloqueIds(defaultBloques);
  };

  const toggleBloque = (bloqueId) => {
    setBloqueIds((prev) => {
      const exists = prev.includes(bloqueId);
      if (exists && prev.length <= 1) return prev;
      return exists ? prev.filter((x) => x !== bloqueId) : [...prev, bloqueId];
    });
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setOk("");

    if (!programaId) {
      setError("Seleccioná un programa.");
      return;
    }
    if (!bloqueIds.length) {
      setError("Debés dejar al menos un bloque seleccionado.");
      return;
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
      fd.append("programa_id", String(programaId));
      bloqueIds.forEach((id) => fd.append("bloque_ids", String(id)));
      fd.append("dni_digitalizado", dniFile);
      if (tituloFile) fd.append("titulo_secundario_digitalizado", tituloFile);

      const { data } = await apiClientV2.post("/preinscripcion", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setOk(
        `Preinscripción enviada. Estudiante #${data?.estudiante_id}. Inscripciones nuevas: ${
          data?.inscripciones_creadas?.length || 0
        }.`
      );
    } catch (eReq) {
      setError(String(eReq?.response?.data?.detail || "No se pudo enviar la preinscripción."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen text-white">
      <Navbar />
      <div className="lines-bg"><div className="line"></div><div className="line"></div><div className="line"></div></div>

      <div className="flex-grow pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-[1500px] mx-auto space-y-6">
          <div className="animate-fade-in-up">
            <div className="inline-block px-4 py-1 rounded-full border border-brand-cyan/30 bg-brand-cyan/10 text-brand-cyan text-xs font-bold tracking-wider uppercase mb-3">
              Inscripciones Abiertas
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold leading-tight">
              Formulario de <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-accent to-purple-500">Preinscripción</span>
            </h1>
          </div>

          {loading ? <p className="text-indigo-200">Cargando oferta...</p> : null}
          {error ? <div className="rounded-lg bg-red-500/20 border border-red-400/30 px-4 py-3">{error}</div> : null}
          {ok ? <div className="rounded-lg bg-emerald-500/20 border border-emerald-400/30 px-4 py-3">{ok}</div> : null}

          <form onSubmit={onSubmit} className="space-y-6 bg-brand-primary/20 backdrop-blur-sm border border-white/10 rounded-2xl p-6 md:p-8">
            <section className="space-y-3">
              <h2 className="text-xl font-bold">Oferta Formativa</h2>
              <p className="text-sm text-indigo-200">Primero seleccioná una oferta. Al seleccionarla se tildan sus bloques por defecto (excepto correlativas).</p>
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {oferta.map((p) => {
                  const active = String(p.programa_id) === String(programaId);
                  const expanded = String(p.programa_id) === String(expandedProgramaId);
                  const bloquesOrdenados = [...(p.bloques || [])].sort((a, b) => {
                    const aLast = isProgramacionII(a.bloque_nombre) ? 1 : 0;
                    const bLast = isProgramacionII(b.bloque_nombre) ? 1 : 0;
                    return aLast - bLast;
                  });
                  return (
                    <div key={p.programa_id} className={`rounded-xl border p-4 ${active ? "border-emerald-400 bg-emerald-900/20" : "border-white/10 bg-black/30"}`}>
                      <button
                        type="button"
                        onClick={() => openPrograma(p)}
                        className="w-full flex items-center justify-between text-left"
                      >
                        <div>
                          <p className="font-bold text-lg">{p.programa_nombre}</p>
                          <p className="text-xs text-indigo-300">{p.bloques?.length || 0} bloque(s) disponible(s)</p>
                        </div>
                        {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      </button>

                      {expanded ? (
                        <div className="mt-3 space-y-2 border-t border-white/10 pt-3">
                          {bloquesOrdenados.map((b) => {
                            const hasCorrelativas = (b.correlativas_ids || []).length > 0;
                            const programacionIILocked = isProgramacionII(b.bloque_nombre);
                            const checked = bloqueIds.includes(b.bloque_id);
                            return (
                              <label key={b.bloque_id} className={`flex items-start gap-2 text-sm rounded-lg px-2 py-1 ${checked ? "bg-emerald-500/15 text-emerald-200" : "text-indigo-100"}`}>
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  disabled={programacionIILocked}
                                  onChange={() => toggleBloque(b.bloque_id)}
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
              <div className="rounded-xl border border-emerald-500/40 bg-emerald-900/15 p-4">
                <h3 className="font-bold text-emerald-300 mb-2">Resumen de inscripción</h3>
                {!programaSeleccionado ? (
                  <p className="text-sm text-emerald-100/80">Todavía no seleccionaste una oferta formativa.</p>
                ) : (
                  <div className="text-sm text-emerald-100 space-y-2">
                    <p><strong>Programa:</strong> {programaSeleccionado.programa_nombre}</p>
                    <p><strong>Bloques seleccionados:</strong> {bloquesSeleccionadosDetalle.length}</p>
                    <ul className="space-y-1">
                      {bloquesSeleccionadosDetalle.map((b) => (
                        <li key={b.bloque_id} className="rounded bg-emerald-700/20 px-2 py-1">
                          {b.bloque_nombre} - cohorte automática: {b.cohorte_nombre}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold">Datos Personales</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input className="bg-indigo-950/40 border border-indigo-500/20 rounded-lg px-3 py-2" name="apellido" placeholder="Apellido" value={form.apellido} onChange={onChange} required />
                <input className="bg-indigo-950/40 border border-indigo-500/20 rounded-lg px-3 py-2" name="nombre" placeholder="Nombre" value={form.nombre} onChange={onChange} required />
                <input className="bg-indigo-950/40 border border-indigo-500/20 rounded-lg px-3 py-2" name="dni" placeholder="DNI (8 dígitos)" value={form.dni} onChange={onChange} required />
                <input className="bg-indigo-950/40 border border-indigo-500/20 rounded-lg px-3 py-2" name="cuit" placeholder="CUIT (opcional)" value={form.cuit} onChange={onChange} />
                <select className="bg-indigo-950/40 border border-indigo-500/20 rounded-lg px-3 py-2" name="sexo" value={form.sexo} onChange={onChange}>
                  <option value="">Sexo (opcional)</option><option value="Masculino">Masculino</option><option value="Femenino">Femenino</option><option value="Otro">Otro</option>
                </select>
                <input className="bg-indigo-950/40 border border-indigo-500/20 rounded-lg px-3 py-2" name="fecha_nacimiento" type="date" value={form.fecha_nacimiento} onChange={onChange} />
                <input className="bg-indigo-950/40 border border-indigo-500/20 rounded-lg px-3 py-2" name="pais_nacimiento" placeholder="País de nacimiento" value={form.pais_nacimiento} onChange={onChange} />
                <input className="bg-indigo-950/40 border border-indigo-500/20 rounded-lg px-3 py-2" name="pais_nacimiento_otro" placeholder="Otro país de nacimiento" value={form.pais_nacimiento_otro} onChange={onChange} />
                <input className="bg-indigo-950/40 border border-indigo-500/20 rounded-lg px-3 py-2" name="nacionalidad" placeholder="Nacionalidad" value={form.nacionalidad} onChange={onChange} />
                <input className="bg-indigo-950/40 border border-indigo-500/20 rounded-lg px-3 py-2" name="nacionalidad_otra" placeholder="Otra nacionalidad" value={form.nacionalidad_otra} onChange={onChange} />
                <input className="bg-indigo-950/40 border border-indigo-500/20 rounded-lg px-3 py-2 md:col-span-2" name="lugar_nacimiento" placeholder="Lugar de nacimiento" value={form.lugar_nacimiento} onChange={onChange} />
              </div>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold">Contacto y Domicilio</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input className="bg-indigo-950/40 border border-indigo-500/20 rounded-lg px-3 py-2" name="email" type="email" placeholder="Email" value={form.email} onChange={onChange} required />
                <input className="bg-indigo-950/40 border border-indigo-500/20 rounded-lg px-3 py-2" name="telefono" placeholder="Teléfono" value={form.telefono} onChange={onChange} />
                <input className="bg-indigo-950/40 border border-indigo-500/20 rounded-lg px-3 py-2" name="ciudad" placeholder="Ciudad" value={form.ciudad} onChange={onChange} />
                <input className="bg-indigo-950/40 border border-indigo-500/20 rounded-lg px-3 py-2" name="barrio" placeholder="Barrio" value={form.barrio} onChange={onChange} />
                <input className="bg-indigo-950/40 border border-indigo-500/20 rounded-lg px-3 py-2 md:col-span-2" name="domicilio" placeholder="Domicilio" value={form.domicilio} onChange={onChange} />
              </div>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold">Situación Académica</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm text-indigo-200 mb-1">Nivel Educativo</label>
                  <select className="w-full bg-indigo-950/40 border border-indigo-500/20 rounded-lg px-3 py-2" name="nivel_educativo" value={form.nivel_educativo} onChange={onChange}>
                    <option value="">Seleccionar...</option>
                    {NIVEL_EDUCATIVO_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
              </div>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold">Recursos</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="flex items-center gap-2 text-sm text-indigo-200"><input type="checkbox" name="posee_pc" checked={form.posee_pc} onChange={onChange} />Posee PC</label>
                <label className="flex items-center gap-2 text-sm text-indigo-200"><input type="checkbox" name="posee_conectividad" checked={form.posee_conectividad} onChange={onChange} />Posee conectividad</label>
                <label className="flex items-center gap-2 text-sm text-indigo-200 md:col-span-2"><input type="checkbox" name="puede_traer_pc" checked={form.puede_traer_pc} onChange={onChange} />Puede traer esa PC a clase</label>
              </div>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold">Situación Laboral</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <p className="text-sm text-indigo-200 mb-2">Actualmente trabaja</p>
                  <label className="mr-5 text-sm text-indigo-100">
                    <input type="radio" name="trabaja_radio" checked={form.trabaja === true} onChange={() => setForm((prev) => ({ ...prev, trabaja: true }))} /> Si
                  </label>
                  <label className="text-sm text-indigo-100">
                    <input type="radio" name="trabaja_radio" checked={form.trabaja === false} onChange={() => setForm((prev) => ({ ...prev, trabaja: false, lugar_trabajo: "" }))} /> No
                  </label>
                </div>
                {form.trabaja ? <input className="bg-indigo-950/40 border border-indigo-500/20 rounded-lg px-3 py-2 md:col-span-2" name="lugar_trabajo" placeholder="Lugar de trabajo" value={form.lugar_trabajo} onChange={onChange} /> : null}
              </div>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold">Documentación (PDF o imagen, máx 3MB)</h2>
              <div className="grid grid-cols-1 gap-4">
                <DropFileField label="DNI (obligatorio)" required file={dniFile} onFileChange={setDniFile} />
                <DropFileField label={`Título secundario ${requiereTitulo ? "(obligatorio para este programa)" : "(opcional)"}`} required={requiereTitulo} file={tituloFile} onFileChange={setTituloFile} />
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
