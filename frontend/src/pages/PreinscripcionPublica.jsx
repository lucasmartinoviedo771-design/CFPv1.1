import React, { useEffect, useMemo, useState } from "react";
import { apiClientV2 } from "../api/client";

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
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-white">
      <div className="max-w-5xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold mb-2">Preinscripción CFP</h1>
        <p className="text-indigo-200 mb-8">
          Completá tus datos y seleccioná el trayecto/bloque para iniciar la preinscripción.
        </p>

        {loading ? <p>Cargando oferta...</p> : null}
        {error ? <div className="mb-4 rounded-lg bg-red-500/20 border border-red-400/30 px-4 py-3">{error}</div> : null}
        {ok ? <div className="mb-4 rounded-lg bg-emerald-500/20 border border-emerald-400/30 px-4 py-3">{ok}</div> : null}

        <form onSubmit={onSubmit} className="space-y-6 bg-white/5 border border-white/10 rounded-2xl p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input className="bg-slate-900/60 rounded-lg px-3 py-2" name="apellido" placeholder="Apellido" value={form.apellido} onChange={onChange} required />
            <input className="bg-slate-900/60 rounded-lg px-3 py-2" name="nombre" placeholder="Nombre" value={form.nombre} onChange={onChange} required />
            <input className="bg-slate-900/60 rounded-lg px-3 py-2" name="email" type="email" placeholder="Email" value={form.email} onChange={onChange} required />
            <input className="bg-slate-900/60 rounded-lg px-3 py-2" name="dni" placeholder="DNI (8 dígitos)" value={form.dni} onChange={onChange} required />
            <input className="bg-slate-900/60 rounded-lg px-3 py-2" name="telefono" placeholder="Teléfono" value={form.telefono} onChange={onChange} />
            <input className="bg-slate-900/60 rounded-lg px-3 py-2" name="ciudad" placeholder="Ciudad" value={form.ciudad} onChange={onChange} />
            <input className="bg-slate-900/60 rounded-lg px-3 py-2 md:col-span-2" name="domicilio" placeholder="Domicilio" value={form.domicilio} onChange={onChange} />
            <input className="bg-slate-900/60 rounded-lg px-3 py-2" name="nacionalidad" placeholder="Nacionalidad" value={form.nacionalidad} onChange={onChange} />
            <input className="bg-slate-900/60 rounded-lg px-3 py-2" name="nivel_educativo" placeholder="Nivel educativo" value={form.nivel_educativo} onChange={onChange} />
            <label className="md:col-span-2 flex items-center gap-2 text-sm text-indigo-200">
              <input type="checkbox" name="trabaja" checked={form.trabaja} onChange={onChange} />
              Actualmente trabajo
            </label>
            {form.trabaja ? <input className="bg-slate-900/60 rounded-lg px-3 py-2 md:col-span-2" name="lugar_trabajo" placeholder="Lugar de trabajo" value={form.lugar_trabajo} onChange={onChange} /> : null}
          </div>

          <div className="space-y-3">
            <h2 className="text-xl font-semibold">Trayectos/Bloques disponibles</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {oferta.map((item) => (
                <label key={item.cohorte_id} className="border border-white/10 rounded-lg p-3 bg-slate-900/40 flex gap-3">
                  <input
                    type="checkbox"
                    checked={cohorteIds.includes(item.cohorte_id)}
                    onChange={() => toggleCohorte(item.cohorte_id)}
                  />
                  <div>
                    <p className="font-semibold">{item.programa_nombre}</p>
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
            <input className="bg-slate-900/60 rounded-lg px-3 py-2" name="dni_digitalizado" placeholder="Link de DNI digitalizado" value={form.dni_digitalizado} onChange={onChange} required />
            <input
              className="bg-slate-900/60 rounded-lg px-3 py-2"
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
            className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 px-5 py-3 rounded-lg font-semibold"
          >
            {saving ? "Enviando..." : "Enviar preinscripción"}
          </button>
        </form>
      </div>
    </div>
  );
}
