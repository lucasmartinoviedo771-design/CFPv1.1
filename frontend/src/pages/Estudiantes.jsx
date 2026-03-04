import React, { useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useEstudiantes, useSaveEstudiante } from "../api/hooks";
import { apiClientV2 } from "../api/client";
import { formatDateDisplay } from "../utils/dateFormat";
import { Card, Select, Button, Input } from '../components/UI';
import {
    UserPlus, Edit2, Trash2, Search, Save, X, AlertCircle,
    Check, Eye, User, MapPin, Briefcase, FileText, Download
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
    tutor_nombre: "", tutor_dni: "",
    dni_tutor_digitalizado: "", nota_parental_firmada: ""
};

export default function Estudiantes() {
    const [filters, setFilters] = useState({ dni: "", nombre_apellido: "", estatus: "" });
    const [ordering, setOrdering] = useState({ field: "apellido", direction: "asc" });
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
    const formCardRef = useRef(null);

    const { data: estudiantes = [], isLoading, refetch } = useEstudiantes({
        search: filters.nombre_apellido || undefined,
        dni: filters.dni || undefined,
        estatus: filters.estatus || undefined,
    });
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
            setEditId(null);
            refetch();
        } catch (error) {
            const errorMsg = error.response?.data ? JSON.stringify(error.response.data) : error.message;
            setFeedback({ open: true, message: `Error: ${errorMsg}`, severity: "error" });
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
            formCardRef.current?.scrollIntoView({ behavior: "smooth" });
        } catch {
            setFeedback({
                open: true,
                message: "No se pudieron cargar todos los datos del estudiante para edición.",
                severity: "error",
            });
        } finally {
            setLoadingEditId(null);
        }
    };

    const handleConfirmDelete = async () => {
        if (!deleteTarget) return;
        try {
            await saveEstudiante.mutateAsync({ id: deleteTarget.id, estatus: "Baja" });
            setFeedback({ open: true, message: "Estudiante dado de baja", severity: "success" });
            setDeleteTarget(null);
            refetch();
        } catch (error) { setFeedback({ open: true, message: "Error al dar de baja", severity: "error" }); }
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

    const trayectoria = useMemo(() => {
        const inscripciones = viewData.inscripciones || [];
        const notas = viewData.notas || [];

        const inscripcionesActivas = inscripciones.filter(i => i.estado === "ACTIVO");
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

            {/* Formulario de Edición/Creación */}
            <div ref={formCardRef}>
                <Card className="bg-indigo-900/20 border-indigo-500/30 mb-8">
                    <div className="flex items-center justify-between border-b border-indigo-500/20 pb-4 mb-4">
                        <h2 className="text-lg font-bold text-white flex items-center gap-2">
                            {editId ? <Edit2 className="text-brand-accent" /> : <UserPlus className="text-brand-accent" />}
                            {editId ? "Editando Estudiante" : "Agregar Nuevo Estudiante"}
                        </h2>
                        {editId && <Button size="sm" variant="ghost" onClick={() => { setEditId(null); setForm(initialFormState); }}>Cancelar Edición</Button>}
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
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-indigo-300 mb-1">DNI Digitalizado (PDF/Imagen)</label>
                                <input type="file" accept=".pdf,image/*" onChange={(e) => setFileData({ ...fileData, dniFile: e.target.files[0] })} className="w-full text-indigo-200 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-indigo-900 file:text-indigo-300 hover:file:bg-indigo-800" />
                                {editId && form.dni_digitalizado && <p className="text-xs text-green-400 mt-1">Archivo actual guardado. Suba uno nuevo si desea reemplazarlo.</p>}
                            </div>
                            {editId && form.titulo_secundario_digitalizado && <p className="text-xs text-green-400 mt-1">Archivo actual guardado. Suba uno nuevo si desea reemplazarlo.</p>}
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
                                <SectionDivider title="Datos del Tutor (Obligatorio para Menores)" icon={User} />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Input name="tutor_nombre" label="Nombre del Tutor" value={form.tutor_nombre} onChange={onChange} />
                                    <Input name="tutor_dni" label="DNI del Tutor" value={form.tutor_dni} onChange={onChange} />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-orange-300 mb-1">DNI del Tutor (PDF/Imagen)</label>
                                        <input type="file" accept=".pdf,image/*" onChange={(e) => setFileData({ ...fileData, dniTutorFile: e.target.files[0] })} className="w-full text-indigo-200 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-indigo-900 file:text-indigo-300 hover:file:bg-indigo-800" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-emerald-300 mb-1">Nota Autorización Parental (PDF/Imagen)</label>
                                        <input type="file" accept=".pdf,image/*" onChange={(e) => setFileData({ ...fileData, notaParentalFile: e.target.files[0] })} className="w-full text-indigo-200 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-indigo-900 file:text-indigo-300 hover:file:bg-indigo-800" />
                                    </div>
                                </div>
                            </div>
                        );
                    })()}

                    <div className="flex justify-end pt-4 border-t border-indigo-500/20 mt-4">
                        <Button onClick={handleSubmit} className="bg-brand-accent hover:bg-orange-600 border-none px-8 py-2 shadow-lg" startIcon={<Save size={18} />}>
                            {editId ? "Guardar Cambios" : "Crear Estudiante"}
                        </Button>
                    </div>
                </Card>
            </div>

            {/* Listado y Filtros */}
            <div className="space-y-4">
                <div className="flex flex-col md:flex-row gap-4 mb-4">
                    <div className="flex-1"><Input placeholder="Buscar por Nombre/Apellido" value={filters.nombre_apellido} name="nombre_apellido" onChange={(e) => { setFilters({ ...filters, nombre_apellido: e.target.value }); setPage(0); }} className="bg-indigo-950/50" /></div>
                    <div className="w-full md:w-48"><Input placeholder="Buscar DNI" value={filters.dni} name="dni" onChange={(e) => { setFilters({ ...filters, dni: e.target.value }); setPage(0); }} className="bg-indigo-950/50" /></div>
                    <div className="w-full md:w-48"><Select value={filters.estatus} onChange={(e) => { setFilters({ ...filters, estatus: e.target.value }); setPage(0); }} options={[{ value: '', label: 'Todos' }, { value: 'Regular', label: 'Regular' }, { value: 'Baja', label: 'Baja' }, { value: 'Condicional', label: 'Condicional' }, { value: 'Preinscripto', label: 'Preinscripto' }]} className="bg-indigo-950/50" /></div>
                    <Button onClick={() => refetch()} startIcon={<Search size={18} />} className="bg-indigo-600 hover:bg-indigo-500 border-none">Buscar</Button>
                </div>

                <Card className="bg-indigo-900/10 border-indigo-500/20 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-[#1e1b4b] text-indigo-300 uppercase text-xs">
                                <tr>
                                    <th className="px-6 py-3 cursor-pointer hover:text-white" onClick={() => handleSort('dni')}>DNI</th>
                                    <th className="px-6 py-3 cursor-pointer hover:text-white" onClick={() => handleSort('apellido')}>Estudiante {ordering.field === 'apellido' && (ordering.direction === 'asc' ? '↑' : '↓')}</th>
                                    <th className="px-6 py-3 hidden md:table-cell">Email</th>
                                    <th className="px-6 py-3 hidden md:table-cell">Ciudad</th>
                                    <th className="px-6 py-3">Estatus</th>
                                    <th className="px-6 py-3 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-indigo-500/10">
                                {paginatedRows.map(r => (
                                    <tr key={r.id} className="hover:bg-white/5 transition-colors">
                                        <td className="px-6 py-3 font-mono text-indigo-200">{r.dni}</td>
                                        <td className="px-6 py-3 font-medium text-white">{r.apellido}, {r.nombre}</td>
                                        <td className="px-6 py-3 hidden md:table-cell text-gray-400">{r.email}</td>
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
                title={viewData.student ? `Detalle: ${viewData.student.apellido}, ${viewData.student.nombre}` : "Detalle del Estudiante"}
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
                                        <SectionDivider title="Información del Tutor (Menor de Edad)" icon={User} />
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm mb-4">
                                            <p><span className="text-indigo-300">Responsable:</span> <span className="text-white font-bold">{viewData.student.tutor_nombre || "No cargado"}</span></p>
                                            <p><span className="text-indigo-300">DNI Responsable:</span> <span className="text-white font-bold">{viewData.student.tutor_dni || "No cargado"}</span></p>
                                        </div>
                                        <div className="flex flex-wrap gap-4">
                                            {viewData.student.dni_tutor_digitalizado ? (
                                                <a
                                                    href={getMediaUrl(viewData.student.dni_tutor_digitalizado)}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="flex items-center gap-2 bg-orange-500/10 hover:bg-orange-500/20 px-4 py-2 rounded-lg text-orange-300 transition-all border border-orange-500/30"
                                                >
                                                    <Download size={18} /> Ver DNI del Tutor
                                                </a>
                                            ) : (
                                                <div className="flex items-center gap-2 bg-orange-900/20 px-4 py-2 rounded-lg text-orange-400/50 border border-orange-500/10 italic text-xs">
                                                    DNI Tutor pendiente
                                                </div>
                                            )}

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
                                                <div className="flex flex-col gap-2">
                                                    <div className="flex items-center gap-2 bg-red-900/20 px-4 py-2 rounded-lg text-red-300 border border-red-500/20 italic text-xs">
                                                        <AlertCircle size={14} /> Falta Autorización Firmada
                                                    </div>
                                                    <label className="cursor-pointer bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] px-3 py-1.5 rounded-full text-center transition-all flex items-center justify-center gap-1">
                                                        <Download size={12} className="rotate-180" /> SUBIR NOTA ESCANEADA
                                                        <input
                                                            type="file"
                                                            className="hidden"
                                                            onChange={async (e) => {
                                                                const f = e.target.files?.[0];
                                                                if (!f) return;
                                                                try {
                                                                    const fd = new FormData();
                                                                    fd.append('nota_parental_firmada', f);
                                                                    await apiClientV2.post(`/estudiantes/${viewData.student.id}/documentos`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
                                                                    setFeedback({ open: true, message: "Nota de autorización guardada.", severity: "success" });
                                                                    handleOpenDetail(viewData.student); // Refrescar modal
                                                                } catch {
                                                                    setFeedback({ open: true, message: "Error al subir la nota.", severity: "error" });
                                                                }
                                                            }}
                                                        />
                                                    </label>
                                                </div>
                                            )}
                                        </div>
                                    </>
                                );
                            })()}
                        </div>

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
                                            <div key={i.id} className="border-b border-indigo-500/10 pb-2">
                                                <p className="text-indigo-100">{i?.cohorte?.programa?.nombre || "Programa"} - {i?.cohorte?.nombre || "Cohorte"}</p>
                                                <p className="text-indigo-300">Bloque: {i?.modulo?.bloque?.nombre || i?.cohorte?.bloque?.nombre || "-"}</p>
                                                <p className="text-indigo-300">Módulo: {i?.modulo?.nombre || "-"}</p>
                                                <p className="text-indigo-300">Estado: {i.estado}</p>
                                            </div>
                                        )) : <p className="text-indigo-300">Sin inscripciones registradas.</p>}
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
                    </div>
                )}
            </Modal>

            {/* Toast Feedback */}
            {
                feedback.open && (
                    <div className={`fixed bottom-4 right-4 p-4 rounded-lg shadow-xl border flex items-center gap-2 animate-fade-in z-[60] ${feedback.severity === 'error' ? 'bg-red-900/90 border-red-500 text-white' : 'bg-green-900/90 border-green-500 text-white'}`}>
                        {feedback.severity === 'error' ? <AlertCircle size={20} /> : <Check size={20} />}
                        {feedback.message}
                        <button onClick={() => setFeedback({ ...feedback, open: false })} className="ml-4 hover:text-gray-300"><X size={14} /></button>
                    </div>
                )
            }
        </div >
    );
}
