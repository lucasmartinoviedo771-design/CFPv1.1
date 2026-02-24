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
    telefono: "",
    ciudad: "",
    domicilio: "",
    nacionalidad: "Argentina",
    nivel_educativo: "Secundaria Completa",
    trabaja: false,
    lugar_trabajo: "",
    dni_digitalizado: "",
    titulo_secundario_digitalizado: "",
  });
  const [cohorteIds, setCohorteIds] = useState([]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const { data } = await apiClientV2.get("/preinscripcion/oferta");
        setOferta(Array.isArray(data?.items) ? data.items : []);
      } catch (e) {
        setError("No se pudo cargar la oferta de preinscripción.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const requiereTitulo = useMemo(() => {
    const selected = oferta.filter((o) => cohorteIds.includes(o.cohorte_id));
    return selected.some((o) => o.requiere_titulo_secundario);
  }, [oferta, cohorteIds]);

  const onChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const toggleCohorte = (id) => {
    setCohorteIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setOk("");
    if (!cohorteIds.length) {
      setError("Seleccioná al menos un trayecto/bloque.");
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
      const payload = { ...form, cohorte_ids: cohorteIds };
      const { data } = await apiClientV2.post("/preinscripcion", payload);
      setOk(
        `Preinscripción enviada. Estudiante #${data?.estudiante_id}. Inscripciones nuevas: ${
          data?.inscripciones_creadas?.length || 0
        }.`
      );
      setCohorteIds([]);
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
                <input className="bg-indigo-950/40 border border-indigo-500/20 rounded-lg px-3 py-2" name="telefono" placeholder="Teléfono" value={form.telefono} onChange={onChange} />
                <input className="bg-indigo-950/40 border border-indigo-500/20 rounded-lg px-3 py-2" name="ciudad" placeholder="Ciudad" value={form.ciudad} onChange={onChange} />
                <input className="bg-indigo-950/40 border border-indigo-500/20 rounded-lg px-3 py-2 md:col-span-2" name="domicilio" placeholder="Domicilio" value={form.domicilio} onChange={onChange} />
                <input className="bg-indigo-950/40 border border-indigo-500/20 rounded-lg px-3 py-2" name="nacionalidad" placeholder="Nacionalidad" value={form.nacionalidad} onChange={onChange} />
                <input className="bg-indigo-950/40 border border-indigo-500/20 rounded-lg px-3 py-2" name="nivel_educativo" placeholder="Nivel educativo" value={form.nivel_educativo} onChange={onChange} />
                <label className="md:col-span-2 flex items-center gap-2 text-sm text-indigo-200">
                  <input type="checkbox" name="trabaja" checked={form.trabaja} onChange={onChange} />
                  Actualmente trabajo
                </label>
                {form.trabaja ? <input className="bg-indigo-950/40 border border-indigo-500/20 rounded-lg px-3 py-2 md:col-span-2" name="lugar_trabajo" placeholder="Lugar de trabajo" value={form.lugar_trabajo} onChange={onChange} /> : null}
              </div>

              <div className="space-y-3">
                <h2 className="text-xl font-bold">Trayectos/Bloques disponibles</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {oferta.map((item) => (
                    <label key={item.cohorte_id} className="border border-white/10 rounded-xl p-4 bg-black/30 hover:bg-black/40 transition-colors flex gap-3">
                      <input
                        type="checkbox"
                        checked={cohorteIds.includes(item.cohorte_id)}
                        onChange={() => toggleCohorte(item.cohorte_id)}
                      />
                      <div>
                        <p className="font-bold">{item.programa_nombre}</p>
                        <p className="text-sm text-indigo-200">
                          {item.bloque_nombre} - {item.cohorte_nombre}
                        </p>
                        {item.requiere_titulo_secundario ? (
                          <p className="text-xs text-amber-300 mt-1">Requiere título secundario</p>
                        ) : null}
                      </div>
                    </label>
                  ))}
                </div>
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
