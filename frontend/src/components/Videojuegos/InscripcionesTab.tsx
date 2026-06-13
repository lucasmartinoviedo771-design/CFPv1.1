import React, { useState, useEffect, useCallback, useMemo } from "react";
import { ShieldAlert, CheckCircle2 } from "lucide-react";
import { apiClientV2 } from "../../api/client";
import { Alumno, Cohorte, Modulo, Inscripcion } from "./InscripcionesTabTypes";
import InscripcionesTabFilters from "./InscripcionesTabFilters";
import InscripcionesTabTable from "./InscripcionesTabTable";
import AddInscripcionModal from "./AddInscripcionModal";

export default function InscripcionesTab() {
  const [inscripciones, setInscripciones] = useState<Inscripcion[]>([]);
  const [alumnos, setAlumnos] = useState<Alumno[]>([]);
  const [cohortes, setCohortes] = useState<Cohorte[]>([]);
  const [modulos, setModulos] = useState<Modulo[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters & Search
  const [search, setSearch] = useState("");
  const [filterCohorte, setFilterCohorte] = useState("");
  const [filterEstado, setFilterEstado] = useState("");
  
  // Add modal state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [studentSearch, setStudentSearch] = useState("");
  const [selectedStudent, setSelectedStudent] = useState("");
  const [selectedCohorte, setSelectedCohorte] = useState("");
  const [selectedModulo, setSelectedModulo] = useState("");
  const [inscStatus, setInscStatus] = useState("CURSANDO");
  
  // Edit state
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingEstado, setEditingEstado] = useState("");
  
  // Actions feedback
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchInscripciones = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await apiClientV2.get("/videojuegos/inscripciones");
      setInscripciones(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setError("No se pudieron cargar las inscripciones.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInscripciones();
    
    // Load VJ students & VJ cohortes for forms
    apiClientV2.get("/videojuegos/alumnos").then(({ data }) => {
      setAlumnos(Array.isArray(data) ? data : []);
    }).catch(console.error);

    apiClientV2.get("/videojuegos/cohortes").then(({ data }) => {
      setCohortes(Array.isArray(data) ? data : []);
    }).catch(console.error);
  }, [fetchInscripciones]);

  // Load modules when cohorte changes
  useEffect(() => {
    if (!selectedCohorte) {
      setModulos([]);
      setSelectedModulo("");
      return;
    }
    apiClientV2.get("/videojuegos/modulos", { params: { cohorte_id: selectedCohorte } })
      .then(({ data }) => {
        setModulos(Array.isArray(data) ? data : []);
        setSelectedModulo("");
      }).catch(console.error);
  }, [selectedCohorte]);

  const filteredAlumnos = useMemo(() => {
    const q = studentSearch.toLowerCase().trim();
    if (!q) return alumnos;
    return alumnos.filter(s => 
      s.apellido.toLowerCase().includes(q) || 
      s.nombre.toLowerCase().includes(q) || 
      s.dni.includes(q)
    );
  }, [alumnos, studentSearch]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent || !selectedCohorte) {
      setError("Por favor, selecciona un alumno y una cohorte.");
      return;
    }
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      await apiClientV2.post("/videojuegos/inscripciones", {
        estudiante_id: Number(selectedStudent),
        cohorte_id: Number(selectedCohorte),
        modulo_id: selectedModulo ? Number(selectedModulo) : null,
        estado: inscStatus
      });
      setSuccess("Inscripción registrada con éxito.");
      fetchInscripciones();
      setTimeout(() => {
        setIsAddOpen(false);
        setSelectedStudent("");
        setSelectedCohorte("");
        setSelectedModulo("");
        setStudentSearch("");
        setSuccess("");
      }, 1000);
    } catch (err) {
      console.error(err);
      const errorObj = err as {
        response?: {
          data?: {
            detail?: string;
          };
        };
      };
      setError(errorObj?.response?.data?.detail || "Ocurrió un error al registrar la inscripción.");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateEstado = async (id: number) => {
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      await apiClientV2.patch(`/videojuegos/inscripciones/${id}`, {
        estado: editingEstado
      });
      setSuccess("Estado de inscripción actualizado.");
      setEditingId(null);
      fetchInscripciones();
      setTimeout(() => setSuccess(""), 2000);
    } catch (err) {
      console.error(err);
      setError("Error al actualizar la inscripción.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("¿Estás seguro de que deseas eliminar esta inscripción?")) {
      return;
    }
    setError("");
    setSuccess("");
    try {
      await apiClientV2.delete(`/videojuegos/inscripciones/${id}`);
      setSuccess("Inscripción eliminada.");
      fetchInscripciones();
      setTimeout(() => setSuccess(""), 2000);
    } catch (err) {
      console.error(err);
      setError("Error al eliminar la inscripción.");
    }
  };

  const filteredInscripciones = useMemo(() => {
    return inscripciones.filter((ins) => {
      if (filterCohorte && String(ins.cohorte?.id) !== filterCohorte) return false;
      if (filterEstado && ins.estado !== filterEstado) return false;
      
      const q = search.toLowerCase().trim();
      if (!q) return true;
      
      const fullname = `${ins.estudiante?.apellido || ""} ${ins.estudiante?.nombre || ""}`.toLowerCase();
      const dni = ins.estudiante?.dni || "";
      const email = ins.estudiante?.email?.toLowerCase() || "";
      const modulo = ins.modulo?.nombre?.toLowerCase() || "";
      
      return fullname.includes(q) || dni.includes(q) || email.includes(q) || modulo.includes(q);
    });
  }, [inscripciones, search, filterCohorte, filterEstado]);

  const handleCloseAdd = () => {
    setIsAddOpen(false);
    setSelectedStudent("");
    setSelectedCohorte("");
    setSelectedModulo("");
    setStudentSearch("");
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm font-semibold flex items-center gap-2">
          <ShieldAlert size={16} /> {error}
        </div>
      )}
      {success && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-semibold flex items-center gap-2">
          <CheckCircle2 size={16} /> {success}
        </div>
      )}

      <InscripcionesTabFilters
        search={search}
        onSearchChange={setSearch}
        filterCohorte={filterCohorte}
        onFilterCohorteChange={setFilterCohorte}
        filterEstado={filterEstado}
        onFilterEstadoChange={setFilterEstado}
        cohortes={cohortes}
        onAddClick={() => setIsAddOpen(true)}
      />

      <InscripcionesTabTable
        loading={loading}
        filteredInscripciones={filteredInscripciones}
        editingId={editingId}
        editingEstado={editingEstado}
        onEditingEstadoChange={setEditingEstado}
        saving={saving}
        onUpdateEstado={handleUpdateEstado}
        onCancelEdit={() => setEditingId(null)}
        onStartEdit={(id, estado) => {
          setEditingId(id);
          setEditingEstado(estado);
        }}
        onDelete={handleDelete}
      />

      <AddInscripcionModal
        isOpen={isAddOpen}
        onClose={handleCloseAdd}
        studentSearch={studentSearch}
        onStudentSearchChange={setStudentSearch}
        selectedStudent={selectedStudent}
        onSelectedStudentChange={setSelectedStudent}
        filteredAlumnos={filteredAlumnos}
        cohortes={cohortes}
        selectedCohorte={selectedCohorte}
        onSelectedCohorteChange={setSelectedCohorte}
        modulos={modulos}
        selectedModulo={selectedModulo}
        onSelectedModuloChange={setSelectedModulo}
        inscStatus={inscStatus}
        onInscStatusChange={setInscStatus}
        saving={saving}
        onSubmit={handleCreate}
      />
    </div>
  );
}
