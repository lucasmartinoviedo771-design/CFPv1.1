import React, { useMemo, useRef, useState } from "react";
import { useEstudiantes, useSaveEstudiante } from "../api/hooks";
import FileUpload from "../components/FileUpload"; // Asumiremos que FileUpload es compatible o lo ignoramos por ahora
import { uploadFile } from "../services/uploadService";
import { Card, Select, Button, Input } from '../components/UI';
import {
    UserPlus, Edit2, Trash2, Search, Upload, Save, X, AlertCircle,
    Check, ChevronDown, ChevronUp, User, MapPin, Briefcase
} from 'lucide-react';

// Custom Tabs
const Tabs = ({ activeTab, onChange, tabs }) => (
    <div className="flex border-b border-indigo-500/30 mb-6">
        {tabs.map((tab, idx) => (
            <button
                key={idx}
                onClick={() => onChange(idx)}
                className={`px-6 py-3 font-medium text-sm transition-colors relative ${activeTab === idx ? 'text-white' : 'text-indigo-400 hover:text-indigo-200'}`}
            >
                {tab.label}
                {activeTab === idx && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-brand-accent shadow-[0_0_10px_#FF6600]"></div>}
            </button>
        ))}
    </div>
);

// Section Header Helper
const SectionDivider = ({ title, icon: Icon }) => (
    <div className="flex items-center gap-2 text-indigo-300 border-b border-indigo-500/20 pb-2 mb-4 mt-6">
        {Icon && <Icon size={16} />}
        <span className="text-sm font-bold uppercase tracking-wider">{title}</span>
    </div>
);

// Modal Custom
const Modal = ({ isOpen, onClose, title, children, actions }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
            <div className="bg-[#1e1b4b] border border-indigo-500/30 rounded-xl shadow-2xl w-full max-w-lg">
                <div className="p-6 border-b border-indigo-500/20"><h3 className="text-xl font-bold text-white">{title}</h3></div>
                <div className="p-6 text-gray-200">{children}</div>
                <div className="p-4 border-t border-indigo-500/20 flex justify-end gap-3 bg-indigo-950/30 rounded-b-xl">{actions}</div>
            </div>
        </div>
    );
};

const initialFormState = {
    apellido: "", nombre: "", email: "", dni: "", cuit: "", sexo: "", fecha_nacimiento: "",
    pais_nacimiento: "", nacionalidad: "", lugar_nacimiento: "",
    domicilio: "", barrio: "", ciudad: "", telefono: "",
    nivel_educativo: "", estatus: "Regular",
    posee_pc: false, posee_conectividad: false, puede_traer_pc: false,
    trabaja: false, lugar_trabajo: "",
    dni_digitalizado: ""
};

export default function Estudiantes() {
    const [filters, setFilters] = useState({ dni: "", nombre_apellido: "", estatus: "" });
    const [ordering, setOrdering] = useState({ field: "apellido", direction: "asc" });
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [editId, setEditId] = useState(null);
    const [form, setForm] = useState(initialFormState);
    const [feedback, setFeedback] = useState({ open: false, message: "", severity: "success" });
    const [currentTab, setCurrentTab] = useState(0);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(25);
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
            fecha_nacimiento: form.fecha_nacimiento || null,
            puede_traer_pc: form.posee_pc ? form.puede_traer_pc : false,
            lugar_trabajo: form.trabaja ? form.lugar_trabajo : "",
        };
        try {
            await saveEstudiante.mutateAsync({ id: editId || undefined, ...payload });
            setFeedback({ open: true, message: `Estudiante ${editId ? "actualizado" : "creado"} con éxito`, severity: "success" });
            setForm(initialFormState);
            setEditId(null);
            refetch();
        } catch (error) {
            const errorMsg = error.response?.data ? JSON.stringify(error.response.data) : error.message;
            setFeedback({ open: true, message: `Error: ${errorMsg}`, severity: "error" });
        }
    };

    const handleStartEdit = (student) => {
        setEditId(student.id);
        setForm({ ...initialFormState, ...student });
        formCardRef.current?.scrollIntoView({ behavior: "smooth" });
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

    return (
        <div className="space-y-6 animate-fade-in-up">
            <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">Gestión de Estudiantes</h1>
                <p className="text-indigo-300">Administración completa del padrón de alumnos.</p>
            </div>

            <Tabs activeTab={currentTab} onChange={setCurrentTab} tabs={[{ label: 'Padrón' }, { label: 'Carga Masiva' }]} />

            {currentTab === 0 && (
                <>
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

                                <SectionDivider title="Ubicación" icon={MapPin} />
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    <div className="md:col-span-2"><Input name="domicilio" label="Domicilio" value={form.domicilio} onChange={onChange} /></div>
                                    <Input name="ciudad" label="Ciudad" value={form.ciudad} onChange={onChange} />
                                    <Input name="barrio" label="Barrio" value={form.barrio} onChange={onChange} />
                                </div>

                                <SectionDivider title="Datos Académicos y Laborales" icon={Briefcase} />
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    <div className="md:col-span-2"><Select name="nivel_educativo" label="Nivel Educativo" value={form.nivel_educativo} onChange={onChange} options={[{ value: 'Primaria Completa', label: 'Primaria Completa' }, { value: 'Secundaria Completa', label: 'Secundaria Completa' }, { value: 'Terciaria/Universitaria', label: 'Terciaria' }]} /></div>
                                    <div className="md:col-span-2"><Select name="estatus" label="Estatus" value={form.estatus} onChange={onChange} options={[{ value: 'Regular', label: 'Regular' }, { value: 'Libre', label: 'Libre' }, { value: 'Baja', label: 'Baja' }]} /></div>
                                </div>

                                <div className="flex flex-wrap gap-4 pt-2">
                                    <label className="flex items-center gap-2 text-indigo-200 text-sm cursor-pointer"><input type="checkbox" name="posee_pc" checked={form.posee_pc} onChange={onChange} className="rounded bg-indigo-900 border-indigo-500" /> Posee PC</label>
                                    <label className="flex items-center gap-2 text-indigo-200 text-sm cursor-pointer"><input type="checkbox" name="posee_conectividad" checked={form.posee_conectividad} onChange={onChange} className="rounded bg-indigo-900 border-indigo-500" /> Tiene Internet</label>
                                    <label className="flex items-center gap-2 text-indigo-200 text-sm cursor-pointer"><input type="checkbox" name="trabaja" checked={form.trabaja} onChange={onChange} className="rounded bg-indigo-900 border-indigo-500" /> Trabaja</label>
                                </div>

                                <div className="flex justify-end pt-4 border-t border-indigo-500/20 mt-4">
                                    <Button onClick={handleSubmit} className="bg-brand-accent hover:bg-orange-600 border-none px-8 py-2 shadow-lg" startIcon={<Save size={18} />}>
                                        {editId ? "Guardar Cambios" : "Crear Estudiante"}
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    </div>

                    {/* Listado y Filtros */}
                    <div className="space-y-4">
                        <div className="flex flex-col md:flex-row gap-4 mb-4">
                            <div className="flex-1"><Input placeholder="Buscar por Nombre/Apellido" value={filters.nombre_apellido} name="nombre_apellido" onChange={(e) => { setFilters({ ...filters, nombre_apellido: e.target.value }); setPage(0); }} className="bg-indigo-950/50" /></div>
                            <div className="w-full md:w-48"><Input placeholder="Buscar DNI" value={filters.dni} name="dni" onChange={(e) => { setFilters({ ...filters, dni: e.target.value }); setPage(0); }} className="bg-indigo-950/50" /></div>
                            <div className="w-full md:w-48"><Select value={filters.estatus} onChange={(e) => { setFilters({ ...filters, estatus: e.target.value }); setPage(0); }} options={[{ value: '', label: 'Todos' }, { value: 'Regular', label: 'Regular' }, { value: 'Baja', label: 'Baja' }]} className="bg-indigo-950/50" /></div>
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
                                                    <span className={`px-2 py-1 rounded text-xs font-bold ${r.estatus === 'Baja' ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
                                                        {r.estatus}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-3 text-right flex justify-end gap-2">
                                                    <button onClick={() => handleStartEdit(r)} className="p-1 text-indigo-400 hover:text-white"><Edit2 size={16} /></button>
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
                </>
            )}

            {currentTab === 1 && (
                <Card className="bg-indigo-900/20 border-indigo-500/30">
                    <div className="text-center py-10">
                        <Upload className="mx-auto text-indigo-400 mb-4" size={48} />
                        <FileUpload
                            title="Carga Masiva de Inscripciones"
                            description="Arrastra tu archivo .csv o .xlsx aquí"
                            doUpload={(file, onProgress) => uploadFile("/import-inscripciones", file, onProgress)}
                            onUpload={() => {
                                setFeedback({ open: true, message: "Archivo procesado correctamente", severity: "info" });
                                refetch();
                            }}
                        />
                    </div>
                </Card>
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
            </Modal>

            {/* Toast Feedback */}
            {feedback.open && (
                <div className={`fixed bottom-4 right-4 p-4 rounded-lg shadow-xl border flex items-center gap-2 animate-fade-in z-[60] ${feedback.severity === 'error' ? 'bg-red-900/90 border-red-500 text-white' : 'bg-green-900/90 border-green-500 text-white'}`}>
                    {feedback.severity === 'error' ? <AlertCircle size={20} /> : <Check size={20} />}
                    {feedback.message}
                    <button onClick={() => setFeedback({ ...feedback, open: false })} className="ml-4 hover:text-gray-300"><X size={14} /></button>
                </div>
            )}
        </div>
    );
}
