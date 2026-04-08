import React, { useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useEstudiantes, useSaveEstudiante, useProgramas, useBloques, useModulos, useCohortes } from "../api/hooks";
import { apiClientV2 } from "../api/client";
import { formatDateDisplay, formatDateTimeDisplay } from "../utils/dateFormat";
import { Card, Select, Button, Input } from '../components/UI';
import {
    UserPlus, Edit2, Trash2, Search, Save, X, AlertCircle,
    Check, Eye, User, MapPin, Briefcase, FileText, Download, Plus, Baby, Cpu, Send
} from 'lucide-react';
import { getMediaUrl } from '../utils/media';

// Section Header Helper
const SectionDivider = ({ title, icon: Icon }) => (
    <div className="flex items-center gap-2 text-indigo-300 border-b border-indigo-500/20 pb-2 mb-4 mt-6">
        {Icon && <Icon size={16} />}
        <span className="text-sm font-bold uppercase tracking-wider">{title}</span>
    </div>
);

// Modal Custom
const Modal = ({ isOpen, onClose, title, children, actions, maxWidthClass = "max-w-lg" }) => {
    if (!isOpen) return null;
    if (typeof document === "undefined") return null;
    return createPortal((
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
            <div className={`bg-[#1e1b4b] border border-indigo-500/30 rounded-xl shadow-2xl w-full ${maxWidthClass}`}>
                <div className="p-6 border-b border-indigo-500/20"><h3 className="text-xl font-bold text-white">{title}</h3></div>
                <div className="p-6 text-gray-200 max-h-[75vh] overflow-y-auto">{children}</div>
                <div className="p-4 border-t border-indigo-500/20 flex justify-end gap-3 bg-indigo-950/30 rounded-b-xl">{actions}</div>
            </div>
        </div>
    ), document.body);
};

const initialFormState = {
    apellido: "", nombre: "", email: "", dni: "", cuit: "", sexo: "Masculino", fecha_nacimiento: "",
    pais_nacimiento: "Argentina", pais_nacimiento_otro: "",
    nacionalidad: "Argentina", nacionalidad_otra: "",
    lugar_nacimiento: "",
    domicilio: "", barrio: "", ciudad: "", telefono: "",
    nivel_educativo: "", estatus: "Regular",
    posee_pc: false, posee_conectividad: false, puede_traer_pc: false,
    trabaja: false, lugar_trabajo: "",
    dni_digitalizado: "",
    titulo_secundario_digitalizado: "",
    tutor_nombre: "", tutor_dni: "", tutor_telefono: "",
    dni_tutor_digitalizado: "", nota_parental_firmada: ""
};

const calculateAge = (birthDate) => {
    if (!birthDate) return null;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
        age--;
    }
    return age;
};

export default function Estudiantes() {
    const [filters, setFilters] = useState({ 
        dni: "", 
        nombre_apellido: "", 
        telefono: "", // <--- Added this line
        estatus: "", 
        anio: "2026",
        programa_id: "",
        bloque_id: "",
        modulo_id: "",
        cohorte_id: "",
        rango_edad: ""
    });
    const [ordering, setOrdering] = useState({ field: "apellido", direction: "asc" });
    const [qrModal, setQrModal] = useState({ open: false, url: "", studentName: "" });
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [editId, setEditId] = useState(null);
    const [form, setForm] = useState(initialFormState);
    const [fileData, setFileData] = useState({ dniFile: null, tituloFile: null, dniTutorFile: null, notaParentalFile: null });
    const [feedback, setFeedback] = useState({ open: false, message: "", severity: "success" });
    const [viewStudentId, setViewStudentId] = useState(null);
    const [viewData, setViewData] = useState({ loading: false, error: "", student: null, inscripciones: [], notas: [] });
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(25);
    const [loadingEditId, setLoadingEditId] = useState(null);
    const [exportModalOpen, setExportModalOpen] = useState(false);
    const [exportConfig, setExportConfig] = useState({
        columns: ["apellido", "nombre", "dni", "email", "estatus", "materias_aprobadas", "materias_cursando", "materias_pendientes"],
        format: "excel",
        anio: "",
        estatus: "",
        programa_id: "",
        bloque_id: "",
        modulo_id: "",
        cohorte_id: ""
    });
    const [exportLoading, setExportLoading] = useState(false);
    const [activeTab, setActiveTab] = useState("list"); // "list" or "add"
    const formCardRef = useRef(null);

    const { data: estudiantes = [], isLoading, refetch } = useEstudiantes({
        search: filters.nombre_apellido || undefined,
        dni: filters.dni || undefined,
        estatus: filters.estatus || undefined,
        anio: filters.anio || undefined,
        programa_id: filters.programa_id ? parseInt(filters.programa_id) : undefined,
        bloque_id: filters.bloque_id ? parseInt(filters.bloque_id) : undefined,
        modulo_id: filters.modulo_id ? parseInt(filters.modulo_id) : undefined,
        cohorte_id: filters.cohorte_id ? parseInt(filters.cohorte_id) : undefined,
        telefono: filters.telefono || undefined,
        rango_edad: filters.rango_edad || undefined,
    });
    
    const { data: programas = [] } = useProgramas();
    const { data: bloques = [] } = useBloques(filters.programa_id ? parseInt(filters.programa_id) : undefined);
    const { data: modulos = [] } = useModulos(filters.bloque_id ? parseInt(filters.bloque_id) : undefined);
    const { data: cohortes = [] } = useCohortes(filters.programa_id ? parseInt(filters.programa_id) : undefined);

    const filteredCohortes = useMemo(() => {
        let list = [...cohortes];
        if (filters.bloque_id) {
            list = list.filter(c => c.bloque_id === parseInt(filters.bloque_id));
        }
        return list.sort((a, b) => {
            const regex = /(\d+)(?:º|°|rta|era|da|ra|\s)?\s*Cohorte\s*(\d{4})/i;
            const matchA = a.nombre.match(regex);
            const matchB = b.nombre.match(regex);
            if (matchA && matchB) {
                const numA = parseInt(matchA[1], 10);
                const yearA = parseInt(matchA[2], 10);
                const numB = parseInt(matchB[1], 10);
                const yearB = parseInt(matchB[2], 10);
                if (yearA !== yearB) return yearB - yearA;
                return numA - numB;
            }
            return a.nombre.localeCompare(b.nombre);
        });
    }, [cohortes, filters.bloque_id]);
    const saveEstudiante = useSaveEstudiante();

    const sortedRows = useMemo(() => {
        const arr = [...estudiantes];
        arr.sort((a, b) => {
            const dir = ordering.direction === "asc" ? 1 : -1;
            const fieldA = (a[ordering.field] || "").toLowerCase();
            const fieldB = (b[ordering.field] || "").toLowerCase();
            return fieldA > fieldB ? dir : fieldA < fieldB ? -dir : 0;
        });
        return arr;
    }, [estudiantes, ordering]);

    const paginatedRows = useMemo(() => sortedRows.slice(page * rowsPerPage, (page + 1) * rowsPerPage), [sortedRows, page, rowsPerPage]);

    const handleSort = (field) => setOrdering({ field, direction: ordering.field === field && ordering.direction === "asc" ? "desc" : "asc" });

    const onChange = (e) => {
        const { name, value, type, checked } = e.target;
        setForm(f => ({ ...f, [name]: type === "checkbox" ? checked : value }));
    };

    const handleSubmit = async () => {
        if (!form.dni || !form.apellido || !form.nombre || !form.email) {
            setFeedback({ open: true, message: "Completa DNI, apellido, nombre y email.", severity: "error" });
            return;
        }
        const payload = {
            ...form,
            sexo: form.sexo || "Masculino",
            fecha_nacimiento: form.fecha_nacimiento || null,
            puede_traer_pc: form.posee_pc ? form.puede_traer_pc : false,
            lugar_trabajo: form.trabaja ? form.lugar_trabajo : "",
        };
        try {
            await saveEstudiante.mutateAsync({ id: editId || undefined, ...payload, ...fileData });
            setFeedback({ open: true, message: `Estudiante ${editId ? "actualizado" : "creado"} con éxito`, severity: "success" });
            setForm(initialFormState);
            setFileData({ dniFile: null, tituloFile: null, dniTutorFile: null, notaParentalFile: null });
            const isEdit = !!editId;
            setEditId(null);
            refetch();
            setActiveTab("list");
        } catch (error) {
            const errorMsg = error.response?.data ? JSON.stringify(error.response.data) : error.message;
            setFeedback({ open: true, message: `Error: ${errorMsg} `, severity: "error" });
        }
    };

    const handleStartEdit = async (student) => {
        setLoadingEditId(student.id);
        try {
            const { data } = await apiClientV2.get(`/estudiantes/${student.id}`);
            setEditId(student.id);

            // Clean data: replace nulls with empty strings to prevent controlled input issues and data loss
            const cleanedData = { ...initialFormState };
            Object.keys(data).forEach(key => {
                if (data[key] !== null && data[key] !== undefined && data[key] !== "") {
                    cleanedData[key] = data[key];
                } else if (typeof cleanedData[key] === 'boolean') {
                    cleanedData[key] = data[key] ?? false;
                } else if (cleanedData[key] === "") {
                    cleanedData[key] = data[key] ?? "";
                }
                // If cleanedData already has a non-empty default (from initialFormState) and data is null/empty, we keep the default.
            });

            setForm(cleanedData);
            setFileData({ dniFile: null, tituloFile: null, dniTutorFile: null, notaParentalFile: null });
            setActiveTab("add");
            // Wait for next tick to ensure the "add" tab is rendered
            setTimeout(() => {
                formCardRef.current?.scrollIntoView({ behavior: "smooth" });
            }, 100);
        } catch {
            setFeedback({
                open: true,
                message: "Error al cargar datos del estudiante para edición.",
                severity: "error",
            });
        } finally {
            setLoadingEditId(null);
        }
    };

    const handleConfirmDelete = async () => {
        if (!deleteTarget) return;
        const isTest = deleteTarget.apellido?.toUpperCase().includes("TEST") || deleteTarget.nombre?.toUpperCase().includes("TEST") || deleteTarget.dni?.startsWith("99000");

        try {
            if (isTest && window.confirm("Este parece ser un alumno de prueba. ¿Deseas ELIMINARLO PERMANENTEMENTE?")) {
                await apiClientV2.post('/estudiantes/bulk_delete/', { ids: [deleteTarget.id] });
                setFeedback({ open: true, message: "Prueba eliminada.", severity: "success" });
            } else {
                await apiClientV2.post('/estudiantes/bulk_archive/', { ids: [deleteTarget.id] });
                setFeedback({ open: true, message: "Dado de baja correctamente.", severity: "success" });
            }
            setDeleteTarget(null);
            refetch();
        } catch (error) {
            setDeleteTarget(null);
            setFeedback({ open: true, message: "Error al procesar la baja.", severity: "error" });
        }
    };

    const handleOpenDetail = async (student) => {
        setViewStudentId(student.id);
        setViewData({ loading: true, error: "", student: null, inscripciones: [], notas: [] });
        try {
            const [studentRes, inscripcionesRes, notasRes] = await Promise.all([
                apiClientV2.get(`/estudiantes/${student.id}`),
                apiClientV2.get(`/inscripciones`, { params: { estudiante_id: student.id } }),
                apiClientV2.get(`/examenes/notas`, { params: { estudiante_id: student.id } }),
            ]);
            setViewData({
                loading: false,
                error: "",
                student: studentRes.data,
                inscripciones: Array.isArray(inscripcionesRes.data) ? inscripcionesRes.data : [],
                notas: Array.isArray(notasRes.data) ? notasRes.data : [],
            });
        } catch (error) {
            setViewData({ loading: false, error: "No se pudo cargar la información del estudiante.", student: null, inscripciones: [], notas: [] });
        }
    };

    const handleExport = async () => {
        setExportLoading(true);
        try {
            const response = await apiClientV2.post('/estudiantes/export/', {
                search: filters.nombre_apellido || undefined,
                dni: filters.dni || undefined,
                anio: filters.anio ? parseInt(filters.anio) : undefined,
                estatus: filters.estatus || undefined,
                programa_id: filters.programa_id ? parseInt(filters.programa_id) : undefined,
                bloque_id: filters.bloque_id ? parseInt(filters.bloque_id) : undefined,
                modulo_id: filters.modulo_id ? parseInt(filters.modulo_id) : undefined,
                cohorte_id: filters.cohorte_id ? parseInt(filters.cohorte_id) : undefined,
                rango_edad: filters.rango_edad || undefined,
                columns: exportConfig.columns,
                format: exportConfig.format
            }, { responseType: 'blob' });

            // Detectar si el servidor devolvió un error en formato JSON a pesar de responseType 'blob'
            if (response.data.type === 'application/json') {
                const reader = new FileReader();
                reader.onload = () => {
                    const errorData = JSON.parse(reader.result);
                    setFeedback({ open: true, message: `Error: ${errorData.detail || 'No se pudo generar el archivo'}`, severity: "error" });
                };
                reader.readAsText(response.data);
                setExportLoading(false);
                return;
            }

            const blob = new Blob([response.data], { 
                type: exportConfig.format === 'excel' 
                    ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
                    : 'application/pdf' 
            });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `estudiantes_${new Date().toISOString().split('T')[0]}.${exportConfig.format === 'excel' ? 'xlsx' : 'pdf'}`);
            document.body.appendChild(link);
            link.click();
            
            // Limpieza diferida
            setTimeout(() => {
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);
            }, 100);
            
            setExportModalOpen(false);
        } catch (error) {
            console.error("Export error:", error);
            setFeedback({ open: true, message: "Error al generar el reporte. Verifique su conexión.", severity: "error" });
        } finally {
            setExportLoading(false);
        }
    };

    const toggleColumn = (col) => {
        setExportConfig(prev => ({
            ...prev,
            columns: prev.columns.includes(col) 
                ? prev.columns.filter(c => c !== col) 
                : [...prev.columns, col]
        }));
    };

    const trayectoria = useMemo(() => {
        const inscripciones = viewData.inscripciones || [];
        const notas = viewData.notas || [];

        const inscripcionesActivas = inscripciones.filter(i => i.estado === "CURSANDO");
        const modulosMap = new Map();
        inscripcionesActivas.forEach(i => {
            if (i?.modulo?.id && !modulosMap.has(i.modulo.id)) {
                modulosMap.set(i.modulo.id, {
                    ...i.modulo,
                    _programa_nombre: i?.cohorte?.programa?.nombre,
                    _bloque_nombre: i?.modulo?.bloque?.nombre || i?.cohorte?.bloque?.nombre
                });
            }
        });
        const modulosInscriptos = Array.from(modulosMap.values());

        const modulosAprobadosIds = new Set(
            notas
                .filter(n => n.aprobado && n.examen_modulo_id)
                .map(n => n.examen_modulo_id)
        );

        const modulosAprobados = modulosInscriptos.filter(m => modulosAprobadosIds.has(m.id));
        const modulosPendientes = modulosInscriptos.filter(m => !modulosAprobadosIds.has(m.id));

        return {
            inscripcionesActivas,
            modulosAprobados,
            modulosPendientes,
            notasAprobadas: notas.filter(n => n.aprobado),
        };
    }, [viewData.inscripciones, viewData.notas]);

    return (
        <div className="space-y-6 animate-fade-in-up">
            <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">Gestión de Estudiantes</h1>
                <p className="text-indigo-300">Administración completa del padrón de alumnos.</p>
            </div>

            {/* Selector de Solapas (Tabs) */}
            <div className="flex border-b border-indigo-500/20 mb-6 gap-2 bg-indigo-950/20 p-1 rounded-t-xl">
                <button
                    onClick={() => setActiveTab("list")}
                    className={`flex-1 py-3 px-4 rounded-lg font-bold text-sm transition-all duration-300 flex items-center justify-center gap-2 ${
                        activeTab === "list" 
                        ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20" 
                        : "text-indigo-400 hover:text-white hover:bg-white/5"
                    }`}
                >
                    <User size={18} />
                    Ver Estudiantes
                </button>
                <button
                    onClick={() => {
                        setActiveTab("add");
                        if (!editId) setForm(initialFormState);
                    }}
                    className={`flex-1 py-3 px-4 rounded-lg font-bold text-sm transition-all duration-300 flex items-center justify-center gap-2 ${
                        activeTab === "add" 
                        ? "bg-brand-accent text-white shadow-lg shadow-brand-accent/20" 
                        : "text-indigo-400 hover:text-white hover:bg-white/5"
                    }`}
                >
                    <UserPlus size={18} />
                    {editId ? "Editar Estudiante" : "Carga de Estudiantes"}
                </button>
            </div>

            {activeTab === "add" ? (
                /* Formulario de Edición/Creación (Solapa 2) */
                <div ref={formCardRef} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <Card className="bg-indigo-900/20 border-indigo-500/30 mb-8">
                    <div className="flex items-center justify-between border-b border-indigo-500/20 pb-4 mb-4">
                        <h2 className="text-lg font-bold text-white flex items-center gap-2">
                            {editId ? <Edit2 className="text-brand-accent" /> : <UserPlus className="text-brand-accent" />}
                            {editId ? "Editando Estudiante" : "Agregar Nuevo Estudiante"}
                        </h2>
                        {editId && (
                            <Button 
                                size="sm" 
                                variant="ghost" 
                                onClick={() => { 
                                    setEditId(null); 
                                    setForm(initialFormState); 
                                    setActiveTab("list");
                                }}
                            >
                                Cancelar Edición
                            </Button>
                        )}
                    </div>

                    <div className="space-y-4">
                        <SectionDivider title="Datos Personales" icon={User} />
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <Input name="dni" label="DNI" value={form.dni} onChange={onChange} />
                            <Input name="cuit" label="CUIT" value={form.cuit} onChange={onChange} />
                            <Input name="apellido" label="Apellido" value={form.apellido} onChange={onChange} />
                            <Input name="nombre" label="Nombre" value={form.nombre} onChange={onChange} />
                            <div className="md:col-span-2"><Input name="email" label="Email" type="email" value={form.email} onChange={onChange} /></div>
                            <div className="md:col-span-1">
                                <Select name="sexo" label="Sexo" value={form.sexo} onChange={onChange} options={[{ value: 'Masculino', label: 'Masculino' }, { value: 'Femenino', label: 'Femenino' }, { value: 'Otro', label: 'Otro' }]} />
                            </div>
                            <div className="md:col-span-1"><Input name="fecha_nacimiento" label="Fecha Nacimiento" type="date" value={form.fecha_nacimiento} onChange={onChange} /></div>
                        </div>

                        <SectionDivider title="Origen" icon={MapPin} />
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="flex flex-col gap-4">
                                <Select
                                    name="pais_nacimiento"
                                    label="País de Nacimiento"
                                    value={form.pais_nacimiento}
                                    onChange={onChange}
                                    options={[
                                        { value: '', label: 'Seleccionar...' },
                                        { value: 'Argentina', label: 'Argentina' },
                                        { value: 'Bolivia', label: 'Bolivia' },
                                        { value: 'Brasil', label: 'Brasil' },
                                        { value: 'Chile', label: 'Chile' },
                                        { value: 'Paraguay', label: 'Paraguay' },
                                        { value: 'Uruguay', label: 'Uruguay' },
                                        { value: 'Otro', label: 'Otro' },
                                    ]}
                                />
                                {form.pais_nacimiento === 'Otro' && (
                                    <Input name="pais_nacimiento_otro" label="Especifique País" value={form.pais_nacimiento_otro} onChange={onChange} placeholder="Nombre del país" />
                                )}
                            </div>
                            <div className="flex flex-col gap-4">
                                <Select
                                    name="nacionalidad"
                                    label="Nacionalidad"
                                    value={form.nacionalidad}
                                    onChange={onChange}
                                    options={[
                                        { value: '', label: 'Seleccionar...' },
                                        { value: 'Argentina', label: 'Argentina' },
                                        { value: 'Bolivia', label: 'Bolivia' },
                                        { value: 'Brasil', label: 'Brasil' },
                                        { value: 'Chile', label: 'Chile' },
                                        { value: 'Paraguay', label: 'Paraguay' },
                                        { value: 'Uruguay', label: 'Uruguay' },
                                        { value: 'Otro', label: 'Otro' },
                                    ]}
                                />
                                {form.nacionalidad === 'Otro' && (
                                    <Input name="nacionalidad_otra" label="Especifique Nacionalidad" value={form.nacionalidad_otra} onChange={onChange} placeholder="Nacionalidad" />
                                )}
                            </div>
                            <Input name="lugar_nacimiento" label="Lugar de Nacimiento" value={form.lugar_nacimiento} onChange={onChange} placeholder="Provincia / Estado" />
                        </div>

                        <SectionDivider title="Domicilio Actual" icon={MapPin} />
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="md:col-span-2"><Input name="domicilio" label="Domicilio" value={form.domicilio} onChange={onChange} /></div>
                            <Input name="ciudad" label="Ciudad" value={form.ciudad} onChange={onChange} />
                            <Input name="barrio" label="Barrio" value={form.barrio} onChange={onChange} />
                            <Input name="telefono" label="Teléfono (10 dígitos)" value={form.telefono} onChange={onChange} />
                        </div>

                        <SectionDivider title="Datos Académicos y Laborales" icon={Briefcase} />
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="md:col-span-2"><Select name="nivel_educativo" label="Nivel Educativo" value={form.nivel_educativo} onChange={onChange} options={[
                                { value: '', label: 'Seleccionar...' },
                                { value: 'Primaria Completa', label: 'Primaria Completa' },
                                { value: 'Secundaria Incompleta', label: 'Secundaria Incompleta' },
                                { value: 'Secundaria Completa', label: 'Secundaria Completa' },
                                { value: 'Terciaria/Universitaria Incompleta', label: 'Terciaria/Universitaria Incompleta' },
                                { value: 'Terciaria/Universitaria Completa', label: 'Terciaria/Universitaria Completa' },
                                { value: 'Terciaria/Universitaria', label: 'Terciaria/Universitaria' },
                            ]} /></div>
                            <div className="md:col-span-2"><Select name="estatus" label="Estatus" value={form.estatus} onChange={onChange} options={[{ value: 'Regular', label: 'Regular' }, { value: 'Baja', label: 'Baja' }, { value: 'Condicional', label: 'Condicional' }, { value: 'Preinscripto', label: 'Preinscripto' }]} /></div>
                        </div>

                        <div className="flex flex-wrap gap-4 pt-2">
                            <label className="flex items-center gap-2 text-indigo-200 text-sm cursor-pointer"><input type="checkbox" name="posee_pc" checked={form.posee_pc} onChange={onChange} className="rounded bg-indigo-900 border-indigo-500" /> Posee PC</label>
                            <label className="flex items-center gap-2 text-indigo-200 text-sm cursor-pointer"><input type="checkbox" name="posee_conectividad" checked={form.posee_conectividad} onChange={onChange} className="rounded bg-indigo-900 border-indigo-500" /> Tiene Internet</label>
                            <label className="flex items-center gap-2 text-indigo-200 text-sm cursor-pointer"><input type="checkbox" name="puede_traer_pc" checked={form.puede_traer_pc} onChange={onChange} className="rounded bg-indigo-900 border-indigo-500" /> Puede asistir con PC personal</label>
                            <label className="flex items-center gap-2 text-indigo-200 text-sm cursor-pointer"><input type="checkbox" name="trabaja" checked={form.trabaja} onChange={onChange} className="rounded bg-indigo-900 border-indigo-500" /> Trabaja</label>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input name="lugar_trabajo" label="Lugar de trabajo" value={form.lugar_trabajo} onChange={onChange} disabled={!form.trabaja} />
                        </div>

                        <SectionDivider title="Documentación (Opcional)" icon={FileText} />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-indigo-300 mb-1">DNI Digitalizado (PDF/Imagen)</label>
                                <div className="flex flex-col gap-2">
                                    <input type="file" accept=".pdf,image/*" onChange={(e) => setFileData({ ...fileData, dniFile: e.target.files[0] })} className="w-full text-indigo-200 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-indigo-900 file:text-indigo-300 hover:file:bg-indigo-800" />
                                    {editId && form.dni_digitalizado && (
                                        <div className="flex items-center gap-2">
                                            <a href={getMediaUrl(form.dni_digitalizado)} target="_blank" rel="noreferrer" className="text-xs text-green-400 hover:text-green-300 flex items-center gap-1 underline decoration-dotted">
                                                <Eye size={12} /> Ver DNI actual
                                            </a>
                                            <span className="text-[10px] text-gray-500 italic">(Se reemplazará si sube uno nuevo)</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-emerald-300 mb-1">Título Secundario (PDF/Imagen)</label>
                                <div className="flex flex-col gap-2">
                                    <input type="file" accept=".pdf,image/*" onChange={(e) => setFileData({ ...fileData, tituloFile: e.target.files[0] })} className="w-full text-indigo-200 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-indigo-900 file:text-indigo-300 hover:file:bg-indigo-800" />
                                    {editId && form.titulo_secundario_digitalizado && (
                                        <div className="flex items-center gap-2">
                                            <a href={getMediaUrl(form.titulo_secundario_digitalizado)} target="_blank" rel="noreferrer" className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 underline decoration-dotted">
                                                <Eye size={12} /> Ver Título actual
                                            </a>
                                            <span className="text-[10px] text-gray-500 italic">(Se reemplazará si sube uno nuevo)</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {(() => {
                        const hoy = new Date();
                        const nac = form.fecha_nacimiento ? new Date(form.fecha_nacimiento) : null;
                        let edad = 18;
                        if (nac) {
                            edad = hoy.getFullYear() - nac.getFullYear();
                            const mm = hoy.getMonth() - nac.getMonth();
                            if (mm < 0 || (mm === 0 && hoy.getDate() < nac.getDate())) edad--;
                        }
                        if (edad >= 18) return null;

                        return (
                            <div className="space-y-4 animate-in zoom-in-95 duration-300">
                                <SectionDivider title="Datos del Padre/Madre o Tutor (Obligatorio para Menores)" icon={User} />
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <Input name="tutor_nombre" label="Nombre del Padre/Madre o Tutor" value={form.tutor_nombre} onChange={onChange} />
                                    <Input name="tutor_dni" label="DNI del Padre/Madre o Tutor" value={form.tutor_dni} onChange={onChange} />
                                    <Input name="tutor_telefono" label="Teléfono del Padre/Madre o Tutor" value={form.tutor_telefono} onChange={onChange} />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-orange-300 mb-1">DNI del Padre/Madre o Tutor (PDF/Imagen)</label>
                                        <div className="flex flex-col gap-2">
                                            <input type="file" accept=".pdf,image/*" onChange={(e) => setFileData({ ...fileData, dniTutorFile: e.target.files[0] })} className="w-full text-indigo-200 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-indigo-900 file:text-indigo-300 hover:file:bg-indigo-800" />
                                            {editId && form.dni_tutor_digitalizado && (
                                                <a href={getMediaUrl(form.dni_tutor_digitalizado)} target="_blank" rel="noreferrer" className="text-xs text-orange-400 hover:text-orange-300 flex items-center gap-1 underline decoration-dotted">
                                                    <Eye size={12} /> Ver archivo actual
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-emerald-300 mb-1">Nota Autorización Parental (PDF/Imagen)</label>
                                        <div className="flex flex-col gap-2">
                                            <input type="file" accept=".pdf,image/*" onChange={(e) => setFileData({ ...fileData, notaParentalFile: e.target.files[0] })} className="w-full text-indigo-200 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-indigo-900 file:text-indigo-300 hover:file:bg-indigo-800" />
                                            {editId && form.nota_parental_firmada && (
                                                <a href={getMediaUrl(form.nota_parental_firmada)} target="_blank" rel="noreferrer" className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 underline decoration-dotted">
                                                    <Eye size={12} /> Ver archivo actual
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })()}

                    <div className="flex justify-end gap-4 mt-8 pt-6 border-t border-indigo-500/20">
                        <Button 
                            onClick={handleSubmit} 
                            isLoading={saveEstudiante.isPending}
                            size="lg"
                            className="bg-brand-accent hover:bg-orange-600 text-white min-w-[200px] shadow-lg shadow-brand-accent/20"
                            startIcon={saveEstudiante.isPending ? null : <Save size={20} />}
                        >
                            {saveEstudiante.isPending ? "Guardando..." : (editId ? "Guardar Cambios" : "Crear Estudiante")}
                        </Button>
                    </div>

                </Card>
                </div>
            ) : (
                /* Listado y Filtros (Solapa 1) */
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="space-y-4 mb-6">
                        {/* Panel de Búsqueda de Estudiante */}
                        <div className="bg-white/5 border border-white/5 p-4 rounded-2xl">
                            <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                <Search size={14} /> Búsqueda de Estudiante
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                                <div className="col-span-1 md:col-span-1">
                                    <Input placeholder="Nombre/Apellido" value={filters.nombre_apellido} name="nombre_apellido" onChange={(e) => { setFilters({ ...filters, nombre_apellido: e.target.value }); setPage(0); }} className="bg-indigo-950/30" />
                                </div>
                                <Input placeholder="DNI" value={filters.dni} name="dni" onChange={(e) => { setFilters({ ...filters, dni: e.target.value }); setPage(0); }} className="bg-indigo-950/30" />
                                <Input placeholder="Teléfono" value={filters.telefono} name="telefono" onChange={(e) => { setFilters({ ...filters, telefono: e.target.value }); setPage(0); }} className="bg-indigo-950/30" />
                                <Select 
                                    value={filters.anio} 
                                    onChange={(e) => { setFilters({ ...filters, anio: e.target.value }); setPage(0); }} 
                                    options={[
                                        { value: '', label: 'Cualquier Año' },
                                        { value: '2023', label: '2023' },
                                        { value: '2024', label: '2024' },
                                        { value: '2025', label: '2025' },
                                        { value: '2026', label: '2026' },
                                    ]} 
                                    className="bg-indigo-950/30" 
                                />
                            </div>
                        </div>

                        {/* Panel de Filtros Académicos / Reportes */}
                        <div className="bg-brand-accent/5 border border-brand-accent/20 p-4 rounded-2xl shadow-lg shadow-brand-accent/5">
                            <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-3">
                                <p className="text-[10px] font-bold text-brand-accent uppercase tracking-widest flex items-center gap-2">
                                    <Briefcase size={14} /> Filtros de Cursada / Reportes
                                </p>
                                <div className="flex gap-2">
                                    <Button onClick={() => refetch()} size="sm" startIcon={<Search size={16} />} className="bg-indigo-600 hover:bg-indigo-500 border-none px-4">Filtrar</Button>
                                    <Button 
                                        onClick={() => setExportModalOpen(true)} 
                                        size="sm"
                                        startIcon={<Download size={16} />} 
                                        variant="outline" 
                                        className="border-brand-accent/50 text-brand-accent hover:bg-brand-accent/10 px-4"
                                    >
                                        Exportar Listado
                                    </Button>
                                    <Button 
                                        onClick={() => {
                                            setEditId(null);
                                            setForm(initialFormState);
                                            setActiveTab("add");
                                        }}
                                        size="sm"
                                        startIcon={<Plus size={16} />}
                                        className="bg-brand-accent hover:bg-orange-600 border-none px-4"
                                    >
                                        Nuevo Estudiante
                                    </Button>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
                                <Select 
                                    value={filters.estatus} 
                                    onChange={(e) => { setFilters({ ...filters, estatus: e.target.value }); setPage(0); }} 
                                    options={[
                                        { value: '', label: 'Estatus: Todos' }, 
                                        { value: 'Regular', label: 'Regular' }, 
                                        { value: 'Baja', label: 'Baja' }, 
                                        { value: 'Condicional', label: 'Condicional' }, 
                                        { value: 'Preinscripto', label: 'Preinscripto' }
                                    ]} 
                                    className="bg-indigo-950/40 border-brand-accent/20 text-xs" 
                                />
                                <Select 
                                    value={filters.rango_edad} 
                                    onChange={(e) => { setFilters({ ...filters, rango_edad: e.target.value }); setPage(0); }} 
                                    options={[
                                        { value: '', label: 'Cualquier Edad' }, 
                                        { value: 'mayores', label: 'Mayores (>= 18)' }, 
                                        { value: 'menores', label: 'Menores (< 18)' }
                                    ]} 
                                    className="bg-indigo-950/40 border-brand-accent/20 text-xs" 
                                />
                                <Select
                                    value={filters.programa_id}
                                    onChange={(e) => { setFilters({ ...filters, programa_id: e.target.value, bloque_id: "", modulo_id: "", cohorte_id: "" }); setPage(0); }}
                                    options={[{ value: '', label: 'Todos los Programas' }, ...programas.map(p => ({ value: p.id, label: p.nombre }))]}
                                    className="bg-indigo-950/40 border-brand-accent/20 text-xs"
                                />
                                <Select
                                    value={filters.bloque_id}
                                    onChange={(e) => { setFilters({ ...filters, bloque_id: e.target.value, modulo_id: "", cohorte_id: "" }); setPage(0); }}
                                    options={[{ value: '', label: 'Todos los Bloques' }, ...bloques.map(b => ({ value: b.id, label: b.nombre }))]}
                                    className="bg-indigo-950/40 border-brand-accent/20 text-xs"
                                    disabled={!filters.programa_id}
                                />
                                <Select
                                    value={filters.modulo_id}
                                    onChange={(e) => { setFilters({ ...filters, modulo_id: e.target.value, cohorte_id: "" }); setPage(0); }}
                                    options={[{ value: '', label: 'Todos los Módulos' }, ...modulos.map(m => ({ value: m.id, label: m.nombre }))]}
                                    className="bg-indigo-950/40 border-brand-accent/20 text-xs"
                                    disabled={!filters.bloque_id}
                                />
                                <Select
                                    value={filters.cohorte_id}
                                    onChange={(e) => { setFilters({ ...filters, cohorte_id: e.target.value }); setPage(0); }}
                                    options={[{ value: '', label: 'Todas las Cohortes' }, ...filteredCohortes.map(c => ({ value: c.id, label: c.nombre }))]}
                                    className="bg-indigo-950/40 border-brand-accent/20 text-xs"
                                    disabled={!filters.programa_id}
                                />
                            </div>
                        </div>
                    </div>

                <Card className="bg-indigo-900/10 border-indigo-500/20 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-[#1e1b4b] text-indigo-300 uppercase text-xs">
                                <tr>
                                    <th className="px-6 py-3 cursor-pointer hover:text-white group" onClick={() => handleSort('dni')}>
                                        <div className="flex items-center gap-1">DNI {ordering.field === 'dni' ? (ordering.direction === 'asc' ? '↑' : '↓') : <span className="opacity-0 group-hover:opacity-50 text-[10px]">⇅</span>}</div>
                                    </th>
                                    <th className="px-6 py-3 cursor-pointer hover:text-white group" onClick={() => handleSort('apellido')}>
                                        <div className="flex items-center gap-1">Estudiante {ordering.field === 'apellido' ? (ordering.direction === 'asc' ? '↑' : '↓') : <span className="opacity-0 group-hover:opacity-50 text-[10px]">⇅</span>}</div>
                                    </th>
                                    <th className="px-6 py-3 cursor-pointer hover:text-white group hidden md:table-cell" onClick={() => handleSort('email')}>
                                        <div className="flex items-center gap-1">Email {ordering.field === 'email' ? (ordering.direction === 'asc' ? '↑' : '↓') : <span className="opacity-0 group-hover:opacity-50 text-[10px]">⇅</span>}</div>
                                    </th>
                                    <th className="px-6 py-3 cursor-pointer hover:text-white group hidden md:table-cell" onClick={() => handleSort('telefono')}>
                                        <div className="flex items-center gap-1">Teléfono {ordering.field === 'telefono' ? (ordering.direction === 'asc' ? '↑' : '↓') : <span className="opacity-0 group-hover:opacity-50 text-[10px]">⇅</span>}</div>
                                    </th>
                                    <th className="px-6 py-3 cursor-pointer hover:text-white group hidden md:table-cell" onClick={() => handleSort('ciudad')}>
                                        <div className="flex items-center gap-1">Ciudad {ordering.field === 'ciudad' ? (ordering.direction === 'asc' ? '↑' : '↓') : <span className="opacity-0 group-hover:opacity-50 text-[10px]">⇅</span>}</div>
                                    </th>
                                    <th className="px-6 py-3 cursor-pointer hover:text-white group" onClick={() => handleSort('estatus')}>
                                        <div className="flex items-center gap-1">Estatus {ordering.field === 'estatus' ? (ordering.direction === 'asc' ? '↑' : '↓') : <span className="opacity-0 group-hover:opacity-50 text-[10px]">⇅</span>}</div>
                                    </th>
                                    <th className="px-6 py-3 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-indigo-500/10">
                                {paginatedRows.map(r => (
                                    <tr key={r.id} className="hover:bg-white/5 transition-colors">
                                        <td className="px-6 py-3 font-mono text-indigo-200">{r.dni}</td>
                                        <td className="px-6 py-3 font-medium">
                                            {(() => {
                                                const age = calculateAge(r.fecha_nacimiento);
                                                const isMinor = age !== null && age < 18;
                                                return (
                                                    <div className="flex items-center gap-2">
                                                        <span className={isMinor ? "text-orange-400 font-bold" : "text-white"}>
                                                            {r.apellido}, {r.nombre}
                                                        </span>
                                                        {age !== null && (
                                                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${isMinor ? "bg-orange-500/20 text-orange-300 border border-orange-500/30" : "bg-indigo-500/20 text-indigo-300"}`}>
                                                                {age} años {isMinor && <Baby size={10} className="inline ml-1" />}
                                                            </span>
                                                        )}
                                                    </div>
                                                );
                                            })()}
                                        </td>
                                        <td className="px-6 py-3 hidden md:table-cell text-gray-400">{r.email}</td>
                                        <td className="px-6 py-3 hidden md:table-cell text-gray-400">{r.telefono || "-"}</td>
                                        <td className="px-6 py-3 hidden md:table-cell text-gray-400">{r.ciudad}</td>
                                        <td className="px-6 py-3">
                                            <span className={`px-2 py-1 rounded text-xs font-bold ${r.estatus === 'Baja' ? 'bg-red-500/20 text-red-400' :
                                                r.estatus === 'Condicional' ? 'bg-yellow-500/20 text-yellow-500' :
                                                    r.estatus === 'Preinscripto' ? 'bg-blue-500/20 text-blue-400' :
                                                        'bg-green-500/20 text-green-400'
                                                }`}>
                                                {r.estatus}
                                            </span>
                                        </td>
                                        <td className="px-6 py-3 text-right flex justify-end gap-2">
                                            <button onClick={() => handleOpenDetail(r)} className="p-1 text-cyan-400 hover:text-cyan-200" title="Ver detalle"><Eye size={16} /></button>
                                            <button
                                                onClick={() => handleStartEdit(r)}
                                                className="p-1 text-indigo-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                                                disabled={loadingEditId === r.id}
                                                title={loadingEditId === r.id ? "Cargando datos completos..." : "Editar"}
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button onClick={() => setDeleteTarget(r)} className="p-1 text-red-400 hover:text-red-200"><Trash2 size={16} /></button>
                                        </td>
                                    </tr>
                                ))}
                                {paginatedRows.length === 0 && (
                                    <tr><td colSpan={6} className="text-center py-8 text-white">No se encontraron estudiantes.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    {/* Paginación simple manual */}
                    <div className="p-4 border-t border-indigo-500/20 flex items-center justify-between text-indigo-300 text-sm">
                        <span>Mostrando {page * rowsPerPage + 1} - {Math.min((page + 1) * rowsPerPage, sortedRows.length)} de {sortedRows.length}</span>
                        <div className="flex gap-2">
                            <button disabled={page === 0} onClick={() => setPage(page - 1)} className="px-3 py-1 bg-indigo-950 hover:bg-indigo-900 rounded disabled:opacity-50">Anterior</button>
                            <button disabled={(page + 1) * rowsPerPage >= sortedRows.length} onClick={() => setPage(page + 1)} className="px-3 py-1 bg-indigo-950 hover:bg-indigo-900 rounded disabled:opacity-50">Siguiente</button>
                        </div>
                    </div>
                </Card>
            </div>

            )}

            {/* Modal Confirmación Delete */}
            <Modal
                isOpen={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                title="Confirmar Baja"
                actions={
                    <>
                        <Button variant="ghost" onClick={() => setDeleteTarget(null)}>Cancelar</Button>
                        <Button onClick={handleConfirmDelete} className="bg-red-600 hover:bg-red-700 text-white border-none">Dar de Baja</Button>
                    </>
                }
            >
                <p>¿Estás seguro de que quieres dar de baja a <strong>{deleteTarget?.apellido}, {deleteTarget?.nombre}</strong>?</p>
                <p className="text-sm text-gray-400 mt-2">El estudiante no aparecerá en las listas activas pero su historial se conservará.</p>
            </Modal >

            <Modal
                isOpen={!!viewStudentId}
                onClose={() => setViewStudentId(null)}
                title={viewData.student ? `Detalle: ${viewData.student.apellido}, ${viewData.student.nombre} ` : "Detalle del Estudiante"}
                maxWidthClass="max-w-5xl"
                actions={<Button variant="ghost" onClick={() => setViewStudentId(null)}>Cerrar</Button>}
            >
                {viewData.loading && <p className="text-indigo-200">Cargando detalle...</p>}
                {!!viewData.error && <p className="text-red-300">{viewData.error}</p>}

                {!viewData.loading && !viewData.error && viewData.student && (
                    <div className="space-y-6">
                        <div>
                            <SectionDivider title="Datos Personales" icon={User} />
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                                <p><span className="text-indigo-300">DNI:</span> {viewData.student.dni || "-"}</p>
                                <p><span className="text-indigo-300">CUIT:</span> {viewData.student.cuit || "-"}</p>
                                <p><span className="text-indigo-300">Email:</span> {viewData.student.email || "-"}</p>
                                <p><span className="text-indigo-300">Sexo:</span> {viewData.student.sexo || "-"}</p>
                                <p><span className="text-indigo-300">Fecha Nacimiento:</span> {formatDateDisplay(viewData.student.fecha_nacimiento)}</p>
                                <p><span className="text-indigo-300">Estatus:</span> {viewData.student.estatus || "-"}</p>
                                <p><span className="text-indigo-300">País Nacimiento:</span> {viewData.student.pais_nacimiento || "-"}</p>
                                <p><span className="text-indigo-300">Nacionalidad:</span> {viewData.student.nacionalidad || "-"}</p>
                                <p><span className="text-indigo-300">Lugar Nacimiento:</span> {viewData.student.lugar_nacimiento || "-"}</p>
                                <p><span className="text-indigo-300">Domicilio:</span> {viewData.student.domicilio || "-"}</p>
                                <p><span className="text-indigo-300">Ciudad:</span> {viewData.student.ciudad || "-"}</p>
                                <p><span className="text-indigo-300">Barrio:</span> {viewData.student.barrio || "-"}</p>
                                <p><span className="text-indigo-300">Teléfono:</span> {viewData.student.telefono || "-"}</p>
                                <p><span className="text-indigo-300">Nivel Educativo:</span> {viewData.student.nivel_educativo || "-"}</p>
                                <p><span className="text-indigo-300">Lugar de trabajo:</span> {viewData.student.lugar_trabajo || "-"}</p>
                            </div>

                            <SectionDivider title="Documentación" icon={FileText} />
                            <div className="flex gap-4">
                                {viewData.student.dni_digitalizado ? (
                                    <a
                                        href={getMediaUrl(viewData.student.dni_digitalizado)}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="flex items-center gap-2 bg-indigo-500/20 hover:bg-indigo-500/40 px-4 py-2 rounded-lg text-cyan-300 transition-all border border-cyan-500/30"
                                    >
                                        <Download size={18} /> Ver DNI Digitalizado
                                    </a>
                                ) : (
                                    <div className="flex items-center gap-2 bg-red-500/10 px-4 py-2 rounded-lg text-red-400 border border-red-500/20">
                                        <X size={18} /> DNI no disponible
                                    </div>
                                )}

                                {viewData.student.titulo_secundario_digitalizado ? (
                                    <a
                                        href={getMediaUrl(viewData.student.titulo_secundario_digitalizado)}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="flex items-center gap-2 bg-indigo-500/20 hover:bg-indigo-500/40 px-4 py-2 rounded-lg text-emerald-300 transition-all border border-emerald-500/30"
                                    >
                                        <Download size={18} /> Ver Título Secundario
                                    </a>
                                ) : (
                                    <div className="flex items-center gap-2 bg-indigo-900/40 px-4 py-2 rounded-lg text-gray-500 border border-white/10">
                                        <X size={18} /> Título no disponible
                                    </div>
                                )}
                            </div>

                            {(() => {
                                const hoy = new Date();
                                const nac = viewData.student.fecha_nacimiento ? new Date(viewData.student.fecha_nacimiento) : null;
                                let edad = 18;
                                if (nac) {
                                    edad = hoy.getFullYear() - nac.getFullYear();
                                    const mm = hoy.getMonth() - nac.getMonth();
                                    if (mm < 0 || (mm === 0 && hoy.getDate() < nac.getDate())) edad--;
                                }
                                if (edad >= 18) return null;

                                return (
                                    <>
                                        <SectionDivider title="Información del Padre/Madre o Tutor (Menor de Edad)" icon={User} />
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm mb-4">
                                            <p><span className="text-indigo-300">Responsable:</span> <span className="text-white font-bold">{viewData.student.tutor_nombre || "No cargado"}</span></p>
                                            <p><span className="text-indigo-300">DNI Responsable:</span> <span className="text-white font-bold">{viewData.student.tutor_dni || "No cargado"}</span></p>
                                            <p><span className="text-indigo-300">WhatsApp Tutor:</span> <span className="text-emerald-400 font-bold">{viewData.student.tutor_telefono || "No cargado"}</span></p>
                                        </div>
                                        <div className="flex flex-wrap gap-4">
                                            <div className="flex flex-col gap-2">
                                                {viewData.student.dni_tutor_digitalizado ? (
                                                    <a
                                                        href={getMediaUrl(viewData.student.dni_tutor_digitalizado)}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="flex items-center gap-2 bg-orange-500/10 hover:bg-orange-500/20 px-4 py-2 rounded-lg text-orange-300 transition-all border border-orange-500/30"
                                                    >
                                                        <Download size={18} /> Ver DNI del Padre/Madre o Tutor
                                                    </a>
                                                ) : (
                                                    <div className="flex items-center gap-2 bg-orange-900/20 px-4 py-2 rounded-lg text-orange-400/50 border border-orange-500/10 italic text-xs">
                                                        DNI Padre/Madre o Tutor pendiente
                                                    </div>
                                                )}
                                                <label className="cursor-pointer bg-orange-600/80 hover:bg-orange-500 text-white text-[10px] px-3 py-1.5 rounded-full text-center transition-all flex items-center justify-center gap-1">
                                                    <Download size={12} className="rotate-180" /> {viewData.student.dni_tutor_digitalizado ? "REEMPLAZAR DNI TUTOR" : "SUBIR DNI TUTOR"}
                                                    <input
                                                        type="file"
                                                        accept="image/*,application/pdf"
                                                        className="hidden"
                                                        onChange={async (e) => {
                                                            const f = e.target.files?.[0];
                                                            if (!f) return;
                                                            try {
                                                                const fd = new FormData();
                                                                fd.append('dni_tutor_digitalizado', f);
                                                                await apiClientV2.post(`/estudiantes/${viewData.student.id}/documentos`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
                                                                setFeedback({ open: true, message: "DNI del tutor actualizado correctamente.", severity: "success" });
                                                                handleOpenDetail(viewData.student);
                                                            } catch {
                                                                setFeedback({ open: true, message: "Error al subir el DNI.", severity: "error" });
                                                            }
                                                        }}
                                                    />
                                                </label>
                                            </div>

                                            {viewData.student.nota_parental_firmada ? (
                                                <a
                                                    href={getMediaUrl(viewData.student.nota_parental_firmada)}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="flex items-center gap-2 bg-emerald-500/10 hover:bg-emerald-500/20 px-4 py-2 rounded-lg text-emerald-300 transition-all border border-emerald-500/30"
                                                >
                                                    <Check size={18} /> Autorización Parental OK
                                                </a>
                                            ) : (
                                                <div className="flex items-center gap-2 bg-red-900/20 px-4 py-2 rounded-lg text-red-300 border border-red-500/20 italic text-xs">
                                                    <AlertCircle size={14} /> Falta Autorización Firmada
                                                </div>
                                            )}

                                            {viewData.student.autorizacion_status === 'DIGITAL' && (
                                                <div className="flex flex-col gap-2">
                                                    <div className="flex flex-col gap-1 items-center bg-emerald-500/10 px-4 py-2 rounded-lg border border-emerald-500/20 text-xs shadow-sm">
                                                        <span className="text-emerald-400 font-bold flex items-center gap-2">
                                                            <Check size={14} /> Firma Digital Validada
                                                        </span>
                                                        <span className="text-[10px] text-emerald-300 opacity-80">
                                                            {formatDateTimeDisplay(viewData.student.autorizacion_fecha)}
                                                        </span>
                                                    </div>
                                                    {viewData.student.autorizacion_selfie && (
                                                        <a
                                                            href={getMediaUrl(viewData.student.autorizacion_selfie)}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] px-3 py-1.5 rounded-full transition-all"
                                                        >
                                                            <Eye size={12} /> VER SELFIE DE FIRMA
                                                        </a>
                                                    )}
                                                </div>
                                            )}

                                            {viewData.student.autorizacion_status === 'PENDIENTE' && (
                                                <div className="flex flex-col gap-2 p-3 bg-indigo-950/50 border border-indigo-500/20 rounded-xl">
                                                    <p className="text-[10px] font-bold text-indigo-300 uppercase mb-1">Firma Presencial</p>
                                                    <div className="flex gap-2">
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={async () => {
                                                                let token = viewData.student.autorizacion_token;
                                                                if (!token) {
                                                                    const { data } = await apiClientV2.post(`/autorizaciones/generate/${viewData.student.id}`);
                                                                    token = data.token;
                                                                }
                                                                const url = `https://politecnico.ar/cfp/autorizar.html?token=${token}`;
                                                                window.open(url, '_blank');
                                                            }}
                                                            className="text-[10px] py-1 h-auto"
                                                            title="Abrir en este dispositivo"
                                                        >
                                                            Abrir Link
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={async () => {
                                                                let token = viewData.student.autorizacion_token;
                                                                if (!token) {
                                                                    const { data } = await apiClientV2.post(`/autorizaciones/generate/${viewData.student.id}`);
                                                                    token = data.token;
                                                                }
                                                                const url = `https://politecnico.ar/cfp/autorizar.html?token=${token}`;
                                                                setQrModal({ open: true, url, studentName: `${viewData.student.nombre} ${viewData.student.apellido}` });
                                                            }}
                                                            className="text-[10px] py-1 h-auto"
                                                        >
                                                            Generar QR / Link
                                                        </Button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </>
                                );
                            })()}
                        </div >

                        {/* Nivelación Digital */}
                        {viewData.inscripciones.some(i => (i?.cohorte?.programa?.nombre || "").toLowerCase().includes("habilidades digitales")) && (
                            <div className="mx-6 mb-8 p-5 bg-brand-accent/5 border border-brand-accent/20 rounded-2xl backdrop-blur-md animate-in fade-in slide-in-from-left-4 duration-500">
                                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-brand-accent/20 rounded-xl">
                                            <Cpu className="text-brand-accent" size={24} />
                                        </div>
                                        <div>
                                            <h4 className="text-lg font-bold text-white tracking-tight">Nivelación: Habilidades Digitales</h4>
                                            <div className="flex items-center gap-3 mt-1">
                                                {viewData.student.nivelacion_digital ? (
                                                    <div className="flex items-center gap-2">
                                                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${viewData.student.nivelacion_digital.completado ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                                                            {viewData.student.nivelacion_digital.completado ? `Completado: ${viewData.student.nivelacion_digital.puntaje}/10` : 'Enviado / Pendiente'}
                                                        </span>
                                                        {viewData.student.nivelacion_digital.completado && (
                                                            <span className="text-xs font-medium text-indigo-300">
                                                                Propuesta: <span className={viewData.student.nivelacion_digital.puntaje >= 7 ? 'text-emerald-400' : 'text-amber-400'}>
                                                                    {viewData.student.nivelacion_digital.puntaje >= 7 ? 'Módulo 2' : 'Módulo 1'}
                                                                </span>
                                                            </span>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="text-sm text-indigo-300">Test pendiente de envío</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <Button
                                        onClick={async () => {
                                            try {
                                                const { data } = await apiClientV2.post(`/nivelacion/generate/${viewData.student.id}`);
                                                const url = `${window.location.origin}/nivelacion/${data.token}`;
                                                setQrModal({ 
                                                    open: true, 
                                                    url, 
                                                    studentName: `${viewData.student.nombre} ${viewData.student.apellido} (Test Nivelación)` 
                                                });
                                            } catch (err) {
                                                alert("Error al generar el test.");
                                            }
                                        }}
                                        className="bg-brand-accent hover:bg-orange-600 border-none shadow-lg shadow-brand-accent/20"
                                        startIcon={<Send size={16} />}
                                    >
                                        Generar Invitación
                                    </Button>
                                </div>
                            </div>
                        )}

                        <div>
                            <SectionDivider title="Trayectoria Académica" icon={Briefcase} />
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
                                <div className="bg-indigo-950/40 border border-indigo-500/30 rounded-lg p-3">
                                    <p className="text-xs text-indigo-300">Inscripciones activas</p>
                                    <p className="text-xl font-bold text-white">{trayectoria.inscripcionesActivas.length}</p>
                                </div>
                                <div className="bg-indigo-950/40 border border-indigo-500/30 rounded-lg p-3">
                                    <p className="text-xs text-indigo-300">Módulos aprobados</p>
                                    <p className="text-xl font-bold text-green-400">{trayectoria.modulosAprobados.length}</p>
                                </div>
                                <div className="bg-indigo-950/40 border border-indigo-500/30 rounded-lg p-3">
                                    <p className="text-xs text-indigo-300">Módulos pendientes</p>
                                    <p className="text-xl font-bold text-amber-300">{trayectoria.modulosPendientes.length}</p>
                                </div>
                                <div className="bg-indigo-950/40 border border-indigo-500/30 rounded-lg p-3">
                                    <p className="text-xs text-indigo-300">Notas aprobadas</p>
                                    <p className="text-xl font-bold text-cyan-300">{trayectoria.notasAprobadas.length}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Card className="bg-indigo-950/30 border-indigo-500/20">
                                    <h4 className="text-white font-semibold mb-2">Inscripciones</h4>
                                    <div className="space-y-2 text-sm">
                                        {viewData.inscripciones.length ? viewData.inscripciones.map(i => (
                                            <div key={i.id} className="border-b border-indigo-500/10 pb-3 mb-2 last:border-0 last:mb-0">
                                                <div className="flex flex-col">
                                                    <p className="text-indigo-100 font-bold">{i?.cohorte?.programa?.nombre || "Programa"}</p>
                                                    <p className="text-indigo-300 text-xs">{i?.modulo?.bloque?.nombre || i?.cohorte?.bloque?.nombre || "-"}</p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-200 text-[10px] border border-indigo-500/20">
                                                            {i?.modulo?.nombre || "Inscripción"}
                                                        </span>
                                                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wider ${i.estado === 'APROBADO' ? 'bg-green-500/20 text-green-400' :
                                                            i.estado === 'CURSANDO' ? 'bg-blue-500/20 text-blue-400' :
                                                                i.estado === 'PAUSADO' ? 'bg-yellow-500/20 text-yellow-400' :
                                                                    'bg-red-500/20 text-red-400'
                                                            }`}>
                                                            {i.estado}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        )) : <p className="text-indigo-500/50 italic text-center py-4">Sin inscripciones registradas.</p>}
                                    </div>
                                </Card>

                                <Card className="bg-indigo-950/30 border-indigo-500/20">
                                    <h4 className="text-white font-semibold mb-2">Qué le falta aprobar</h4>
                                    <div className="space-y-2 text-sm">
                                        {trayectoria.modulosPendientes.length ? trayectoria.modulosPendientes.map(m => (
                                            <div key={m.id} className="border-b border-indigo-500/10 pb-1 mb-1">
                                                <p className="text-indigo-300 text-xs">{m._programa_nombre || "Programa"} - {m._bloque_nombre || "Bloque"}</p>
                                                <p className="text-amber-300">{m.nombre}</p>
                                            </div>
                                        )) : <p className="text-green-300">No tiene módulos pendientes en sus inscripciones activas.</p>}
                                    </div>
                                </Card>
                            </div>
                        </div>
                    </div >
                )}
            </Modal >

            {/* Modal QR */}
            <Modal
                isOpen={qrModal.open}
                onClose={() => setQrModal({ ...qrModal, open: false })}
                title="Autorización Presencial"
                maxWidthClass="max-w-sm"
                actions={<Button onClick={() => setQrModal({ ...qrModal, open: false })}>Cerrar</Button>}
            >
                <div className="flex flex-col items-center text-center space-y-4">
                    <p className="text-sm text-indigo-200">
                        Pedile al <b>Padre/Madre o Tutor</b> que escanee este código para firmar la autorización de <b>{qrModal.studentName}</b>
                    </p>
                    <div className="p-4 bg-white rounded-2xl shadow-xl">
                        <img
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrModal.url)}`}
                            alt="QR de Autorización"
                            className="w-48 h-48"
                        />
                    </div>
                    <div className="w-full p-3 bg-black/40 rounded-lg border border-white/5 overflow-hidden">
                        <p className="text-[10px] text-indigo-400 uppercase font-bold mb-1">Link Directo</p>
                        <p className="text-[10px] text-gray-400 break-all select-all cursor-pointer font-mono">{qrModal.url}</p>
                    </div>
                </div>
            </Modal>

            {/* Modal Exportación */}
            <Modal
                isOpen={exportModalOpen}
                onClose={() => setExportModalOpen(false)}
                title="Exportar Datos de Estudiantes"
                maxWidthClass="max-w-2xl"
                actions={
                    <>
                        <Button variant="ghost" onClick={() => setExportModalOpen(false)}>Cancelar</Button>
                        <Button 
                            onClick={handleExport} 
                            isLoading={exportLoading}
                            className="bg-brand-accent hover:bg-orange-600 border-none" 
                            startIcon={<Download size={18} />}
                        >
                            Descargar {exportConfig.format === 'excel' ? 'Excel' : 'PDF'}
                        </Button>
                    </>
                }
            >
                <div className="space-y-6">
                    <div className="bg-indigo-950/40 p-4 border border-indigo-500/20 rounded-xl mb-4">
                        <p className="text-xs text-indigo-300">
                            La exportación incluirá a los estudiantes según los <b>filtros que seleccionaste en la pantalla principal</b>.
                        </p>
                    </div>

                    <div>
                        <p className="text-sm text-indigo-300 mb-4">Seleccione las columnas que desea incluir en el archivo:</p>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {[
                                { id: "apellido", label: "Apellido" },
                                { id: "nombre", label: "Nombre" },
                                { id: "dni", label: "DNI" },
                                { id: "email", label: "Email" },
                                { id: "telefono", label: "Teléfono" },
                                { id: "ciudad", label: "Ciudad" },
                                { id: "estatus", label: "Estatus" },
                                { id: "fecha_nacimiento", label: "Fecha Nac." },
                                { id: "fecha_inscripcion", label: "Fecha Inscripción" },
                                { id: "materias_aprobadas", label: "Módulos Aprobados" },
                                { id: "materias_cursando", label: "Módulos Cursando" },
                                { id: "materias_pendientes", label: "Módulos Pendientes" },
                            ].map(col => (
                                <label key={col.id} className="flex items-center gap-2 p-2 rounded bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10 transition-colors">
                                    <input 
                                        type="checkbox" 
                                        checked={exportConfig.columns.includes(col.id)}
                                        onChange={() => toggleColumn(col.id)}
                                        className="rounded border-indigo-500 bg-indigo-900 text-brand-accent"
                                    />
                                    <span className="text-sm text-white">{col.label}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div>
                        <p className="text-sm text-indigo-300 mb-4">Formato de salida:</p>
                        <div className="flex gap-4">
                            <label className="flex-1 flex items-center justify-center gap-2 p-4 rounded-xl border-2 cursor-pointer transition-all bg-white/5 border-white/10 hover:border-brand-accent/50 group">
                                <input 
                                    type="radio" 
                                    name="exportFormat" 
                                    hidden 
                                    checked={exportConfig.format === 'excel'} 
                                    onChange={() => setExportConfig({...exportConfig, format: 'excel'})} 
                                />
                                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${exportConfig.format === 'excel' ? 'border-brand-accent' : 'border-gray-500'}`}>
                                    {exportConfig.format === 'excel' && <div className="w-2 h-2 rounded-full bg-brand-accent" />}
                                </div>
                                <span className={`font-bold ${exportConfig.format === 'excel' ? 'text-brand-accent' : 'text-gray-400 group-hover:text-white'}`}>Excel (.xlsx)</span>
                            </label>
                            <label className="flex-1 flex items-center justify-center gap-2 p-4 rounded-xl border-2 cursor-pointer transition-all bg-white/5 border-white/10 hover:border-brand-accent/50 group">
                                <input 
                                    type="radio" 
                                    name="exportFormat" 
                                    hidden 
                                    checked={exportConfig.format === 'pdf'} 
                                    onChange={() => setExportConfig({...exportConfig, format: 'pdf'})} 
                                />
                                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${exportConfig.format === 'pdf' ? 'border-brand-accent' : 'border-gray-500'}`}>
                                    {exportConfig.format === 'pdf' && <div className="w-2 h-2 rounded-full bg-brand-accent" />}
                                </div>
                                <span className={`font-bold ${exportConfig.format === 'pdf' ? 'text-brand-accent' : 'text-gray-400 group-hover:text-white'}`}>Documento PDF (.pdf)</span>
                            </label>
                        </div>
                    </div>
                </div>
            </Modal>

            {/* Toast Feedback */}
            {feedback.open && (
                <div className={`fixed bottom-4 right-4 p-4 rounded-lg shadow-xl border flex items-center gap-2 animate-fade-in z-[100] ${feedback.severity === 'error' ? 'bg-red-900/90 border-red-500 text-white' :
                    feedback.severity === 'warning' ? 'bg-amber-600/90 border-amber-400 text-white' :
                        'bg-green-900/90 border-green-500 text-white'
                    }`}>
                    {feedback.severity === 'error' ? <AlertCircle size={20} /> : feedback.severity === 'warning' ? <AlertCircle size={20} /> : <Check size={20} />}
                    {feedback.message}
                    <button onClick={() => setFeedback({ ...feedback, open: false })} className="ml-4 hover:text-gray-300"><X size={14} /></button>
                </div>
            )}
        </div >
    );
}
