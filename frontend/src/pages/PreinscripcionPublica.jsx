import React, { useEffect, useMemo, useState } from "react";
import { apiClientV2 } from "../api/client";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";
import { ArrowRight } from "lucide-react";

export default function PreinscripcionPublica() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [oferta, setOferta] = useState([]);

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
    telefono: "",
    ciudad: "",
    domicilio: "",
    barrio: "",
    nacionalidad: "Argentina",
    nacionalidad_otra: "",
    lugar_nacimiento: "",
    nivel_educativo: "Secundaria Completa",
    posee_pc: false,
    posee_conectividad: false,
    puede_traer_pc: false,
    trabaja: false,
    lugar_trabajo: "",
    dni_digitalizado: "",
    titulo_secundario_digitalizado: "",
  });
  const [programaId, setProgramaId] = useState("");
  const [bloqueIds, setBloqueIds] = useState([]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const { data } = await apiClientV2.get("/preinscripcion/oferta");
        const items = Array.isArray(data?.items) ? data.items : [];
        setOferta(items);
        if (items.length > 0) {
          const firstProgramaId = items[0].programa_id;
          setProgramaId(String(firstProgramaId));
          setBloqueIds((items[0].bloques || []).map((b) => b.bloque_id));
        }
      } catch (e) {
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

  const requiereTitulo = useMemo(() => {
    return Boolean(programaSeleccionado?.requiere_titulo_secundario);
  }, [programaSeleccionado]);

  const onChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const onProgramaChange = (e) => {
    const id = e.target.value;
    setProgramaId(id);
    const p = oferta.find((x) => String(x.programa_id) === String(id));
    setBloqueIds((p?.bloques || []).map((b) => b.bloque_id));
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
    if (!form.dni_digitalizado.trim()) {
      setError("Debés cargar el link de DNI digitalizado.");
      return;
    }
    if (requiereTitulo && !form.titulo_secundario_digitalizado.trim()) {
      setError("Este trayecto requiere título secundario digitalizado.");
      return;
    }
    try {
      setSaving(true);
      const payload = {
        ...form,
        programa_id: Number(programaId),
        bloque_ids: bloqueIds,
      };
      const { data } = await apiClientV2.post("/preinscripcion", payload);
      setOk(
        `Preinscripción enviada. Estudiante #${data?.estudiante_id}. Inscripciones nuevas: ${
          data?.inscripciones_creadas?.length || 0
        }.`
      );
      const p = oferta.find((x) => String(x.programa_id) === String(programaId));
      setBloqueIds((p?.bloques || []).map((b) => b.bloque_id));
    } catch (e) {
      const msg = e?.response?.data?.detail || "No se pudo enviar la preinscripción.";
      setError(String(msg));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen text-white">
      <Navbar />

      <div className="lines-bg">
        <div className="line"></div>
        <div className="line"></div>
        <div className="line"></div>
      </div>

      <div className="flex-grow pt-24 pb-16">
        <section className="px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="mb-8 animate-fade-in-up">
              <div className="inline-block px-4 py-1 rounded-full border border-brand-cyan/30 bg-brand-cyan/10 text-brand-cyan text-xs font-bold tracking-wider uppercase mb-3">
                Inscripciones Abiertas
              </div>
              <h1 className="text-4xl md:text-5xl font-extrabold leading-tight">
                Formulario de <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-accent to-purple-500">Preinscripción</span>
              </h1>
              <p className="text-gray-300 mt-3 border-l-4 border-brand-accent pl-4 max-w-3xl">
                Completá tus datos, elegí trayecto y adjuntá la documentación solicitada.
              </p>
            </div>

            {loading ? <p className="text-indigo-200">Cargando oferta...</p> : null}
            {error ? <div className="mb-4 rounded-lg bg-red-500/20 border border-red-400/30 px-4 py-3">{error}</div> : null}
            {ok ? <div className="mb-4 rounded-lg bg-emerald-500/20 border border-emerald-400/30 px-4 py-3">{ok}</div> : null}

            <form onSubmit={onSubmit} className="space-y-6 bg-brand-primary/20 backdrop-blur-sm border border-white/10 rounded-2xl p-6 md:p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input className="bg-indigo-950/40 border border-indigo-500/20 rounded-lg px-3 py-2" name="apellido" placeholder="Apellido" value={form.apellido} onChange={onChange} required />
                <input className="bg-indigo-950/40 border border-indigo-500/20 rounded-lg px-3 py-2" name="nombre" placeholder="Nombre" value={form.nombre} onChange={onChange} required />
                <input className="bg-indigo-950/40 border border-indigo-500/20 rounded-lg px-3 py-2" name="email" type="email" placeholder="Email" value={form.email} onChange={onChange} required />
                <input className="bg-indigo-950/40 border border-indigo-500/20 rounded-lg px-3 py-2" name="dni" placeholder="DNI (8 dígitos)" value={form.dni} onChange={onChange} required />
                <input className="bg-indigo-950/40 border border-indigo-500/20 rounded-lg px-3 py-2" name="cuit" placeholder="CUIT (opcional)" value={form.cuit} onChange={onChange} />
                <select className="bg-indigo-950/40 border border-indigo-500/20 rounded-lg px-3 py-2" name="sexo" value={form.sexo} onChange={onChange}>
                  <option value="">Sexo (opcional)</option>
                  <option value="Masculino">Masculino</option>
                  <option value="Femenino">Femenino</option>
                  <option value="Otro">Otro</option>
                </select>
                <input className="bg-indigo-950/40 border border-indigo-500/20 rounded-lg px-3 py-2" name="fecha_nacimiento" type="date" value={form.fecha_nacimiento} onChange={onChange} />
                <input className="bg-indigo-950/40 border border-indigo-500/20 rounded-lg px-3 py-2" name="lugar_nacimiento" placeholder="Lugar de nacimiento" value={form.lugar_nacimiento} onChange={onChange} />
                <input className="bg-indigo-950/40 border border-indigo-500/20 rounded-lg px-3 py-2" name="pais_nacimiento" placeholder="País de nacimiento" value={form.pais_nacimiento} onChange={onChange} />
                <input className="bg-indigo-950/40 border border-indigo-500/20 rounded-lg px-3 py-2" name="pais_nacimiento_otro" placeholder="Otro país de nacimiento" value={form.pais_nacimiento_otro} onChange={onChange} />
                <input className="bg-indigo-950/40 border border-indigo-500/20 rounded-lg px-3 py-2" name="telefono" placeholder="Teléfono" value={form.telefono} onChange={onChange} />
                <input className="bg-indigo-950/40 border border-indigo-500/20 rounded-lg px-3 py-2" name="ciudad" placeholder="Ciudad" value={form.ciudad} onChange={onChange} />
                <input className="bg-indigo-950/40 border border-indigo-500/20 rounded-lg px-3 py-2" name="barrio" placeholder="Barrio" value={form.barrio} onChange={onChange} />
                <input className="bg-indigo-950/40 border border-indigo-500/20 rounded-lg px-3 py-2 md:col-span-2" name="domicilio" placeholder="Domicilio" value={form.domicilio} onChange={onChange} />
                <input className="bg-indigo-950/40 border border-indigo-500/20 rounded-lg px-3 py-2" name="nacionalidad" placeholder="Nacionalidad" value={form.nacionalidad} onChange={onChange} />
                <input className="bg-indigo-950/40 border border-indigo-500/20 rounded-lg px-3 py-2" name="nacionalidad_otra" placeholder="Otra nacionalidad" value={form.nacionalidad_otra} onChange={onChange} />
                <input className="bg-indigo-950/40 border border-indigo-500/20 rounded-lg px-3 py-2" name="nivel_educativo" placeholder="Nivel educativo" value={form.nivel_educativo} onChange={onChange} />
                <label className="flex items-center gap-2 text-sm text-indigo-200">
                  <input type="checkbox" name="posee_pc" checked={form.posee_pc} onChange={onChange} />
                  Posee PC en domicilio
                </label>
                <label className="flex items-center gap-2 text-sm text-indigo-200">
                  <input type="checkbox" name="posee_conectividad" checked={form.posee_conectividad} onChange={onChange} />
                  Posee conectividad
                </label>
                <label className="md:col-span-2 flex items-center gap-2 text-sm text-indigo-200">
                  <input type="checkbox" name="puede_traer_pc" checked={form.puede_traer_pc} onChange={onChange} />
                  Puede traer PC a clase
                </label>
                <label className="md:col-span-2 flex items-center gap-2 text-sm text-indigo-200">
                  <input type="checkbox" name="trabaja" checked={form.trabaja} onChange={onChange} />
                  Actualmente trabajo
                </label>
                {form.trabaja ? <input className="bg-indigo-950/40 border border-indigo-500/20 rounded-lg px-3 py-2 md:col-span-2" name="lugar_trabajo" placeholder="Lugar de trabajo" value={form.lugar_trabajo} onChange={onChange} /> : null}
              </div>

              <div className="space-y-3">
                <h2 className="text-xl font-bold">Programa y Bloques</h2>
                <select
                  className="w-full bg-indigo-950/40 border border-indigo-500/20 rounded-lg px-3 py-2"
                  value={programaId}
                  onChange={onProgramaChange}
                  required
                >
                  <option value="">Seleccionar programa</option>
                  {oferta.map((p) => (
                    <option key={p.programa_id} value={p.programa_id}>
                      {p.programa_nombre}
                    </option>
                  ))}
                </select>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {(programaSeleccionado?.bloques || []).map((item) => (
                    <label key={item.bloque_id} className="border border-white/10 rounded-xl p-4 bg-black/30 hover:bg-black/40 transition-colors flex gap-3">
                      <input
                        type="checkbox"
                        checked={bloqueIds.includes(item.bloque_id)}
                        onChange={() => toggleBloque(item.bloque_id)}
                      />
                      <div>
                        <p className="font-bold">{item.bloque_nombre}</p>
                        <p className="text-sm text-indigo-200">Cohorte automática: {item.cohorte_nombre}</p>
                        <p className="text-xs text-indigo-300 mt-1">
                          Al confirmar se inscribe en Módulo 1 (o módulo único si solo existe uno).
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
                {requiereTitulo ? (
                  <p className="text-xs text-amber-300">Este programa requiere título secundario digitalizado.</p>
                ) : null}
              </div>

              <div className="grid grid-cols-1 gap-4">
                <input className="bg-indigo-950/40 border border-indigo-500/20 rounded-lg px-3 py-2" name="dni_digitalizado" placeholder="Link de DNI digitalizado" value={form.dni_digitalizado} onChange={onChange} required />
                <input
                  className="bg-indigo-950/40 border border-indigo-500/20 rounded-lg px-3 py-2"
                  name="titulo_secundario_digitalizado"
                  placeholder={requiereTitulo ? "Link de título secundario digitalizado (obligatorio)" : "Link de título secundario digitalizado (opcional)"}
                  value={form.titulo_secundario_digitalizado}
                  onChange={onChange}
                  required={requiereTitulo}
                />
              </div>

              <button
                type="submit"
                disabled={saving || loading}
                className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-brand-accent to-red-500 text-white px-8 py-3 rounded-xl font-bold hover:shadow-[0_0_20px_rgba(255,102,0,0.5)] transition-all disabled:opacity-60"
              >
                {saving ? "Enviando..." : "Enviar preinscripción"} <ArrowRight size={18} />
              </button>
            </form>
          </div>
        </section>
      </div>

      <Footer />
    </div>
  );
}
