import React, { useMemo, useRef, useState } from "react";
import { Modal } from "../components/Estudiantes/Modal";
import { ModalQR } from "../components/Estudiantes/ModalQR";
import { ModalConfirmDelete } from "../components/Estudiantes/ModalConfirmDelete";
import { ModalRespuestas } from "../components/Estudiantes/ModalRespuestas";
import { ModalExport } from "../components/Estudiantes/ModalExport";
import { ModalDetalle } from "../components/Estudiantes/ModalDetalle";
import { EstudiantesTable } from "../components/Estudiantes/EstudiantesTable";
import { useEstudiantes, useSaveEstudiante, useProgramas, useBloques, useModulos, useCohortes } from "../api/hooks";
import { apiClientV2 } from "../api/client";
import { formatDateDisplay, formatDateTimeDisplay } from "../utils/dateFormat";
import { Card, Select, Button, Input } from '../components/UI';
import {
    UserPlus, Edit2, Trash2, Search, Save, X, AlertCircle,
    Check, Eye, User, MapPin, Briefcase, FileText, Download, Plus, Baby, Cpu, Send
} from 'lucide-react';
import { getMediaUrl } from '../utils/media';
import type { Estudiante, EstudianteDetail, Programa, Bloque, Modulo, Cohorte, Inscripcion, Nota } from "../api/types";

// Section Header Helper
export interface SectionDividerProps {
    title: string;
    icon?: React.ComponentType<{ size?: number | string; className?: string }>;
}

export const SectionDivider: React.FC<SectionDividerProps> = ({ title, icon: Icon }) => (
    <div className="flex items-center gap-2 text-indigo-300 border-b border-indigo-500/20 pb-2 mb-4 mt-6">
        {Icon && <Icon size={16} />}
        <span className="text-sm font-bold uppercase tracking-wider">{title}</span>
    </div>
);



export interface NivelacionQuestion {
    id: number;
    text: string;
    options: string[];
    correct: number;
}

export const NIVELACION_QUESTIONS: NivelacionQuestion[] = [
    { id: 1, text: '¿Qué es un "enlace" o "hipervínculo" en una página web?', options: ["Una imagen decorativa", "Un texto o imagen que al hacer clic te lleva a otra página o sección", "Un anuncio publicitario", "El título principal de la página"], correct: 1 },
    { id: 2, text: '¿Qué significa "descargar" un archivo de internet?', options: ["Subir un archivo a una página web", "Guardar una copia del archivo en tu dispositivo", "Eliminar el archivo de internet", "Compartir el archivo con otros usuarios en línea"], correct: 1 },
    { id: 3, text: '¿Cuál es la función principal de un explorador web (navegador)?', options: ["Escribir y editar documentos de texto.", "Mostrar páginas web y permitir la navegación por internet.", "Enviar y recibir correos electrónicos.", "Reproducir música y videos."], correct: 1 },
    { id: 4, text: '¿Qué es una "contraseña" o "clave" en el contexto de internet?', options: ["Un programa para proteger la computadora de virus", "Una secuencia secreta de caracteres para acceder a una cuenta o servicio en línea", "El nombre de usuario para iniciar sesión en una página web", "Un código de descuento para compras en línea"], correct: 1 },
    { id: 5, text: '¿Qué significa "cerrar sesión" o "salir" de una cuenta en línea?', options: ["Eliminar la cuenta permanentemente", "Desactivar temporalmente la cuenta", "Finalizar la sesión activa y requerir volver a ingresar las credenciales para acceder", "Guardar la información de la sesión para un acceso más rápido la próxima vez"], correct: 2 },
    { id: 6, text: '¿Qué es el "correo electrónico" o "e-mail"?', options: ["Un programa para crear presentations", "Un servicio para enviar y recibir mensajes a través de internet", "Una red social para compartir mensajes cortos", "Un sistema para realizar videollamadas"], correct: 1 },
    { id: 7, text: '¿Qué precaución básica se debe tener al navegar por internet?', options: ["Compartir contraseñas con amigos cercanos", "Hacer clic en todos los enlaces que aparezcan", "Evitar ingresar información personal en sitios web no seguros (sin \"https://\")", "Descargar archivos de fuentes desconocidas sin analizarlos"], correct: 2 },
    { id: 8, text: '¿Cuál de los siguientes dispositivos se utiliza principalmente para almacenar información de forma permanente en una computadora?', options: ["Memoria RAM", "Unidad Central de Procesamiento (CPU)", "Disco duro o unidad de estado sólido (SSD)", "Una marca de computadoras"], correct: 2 },
    { id: 9, text: '¿Cuál de los siguientes iconos suele representar una conexión Wi-Fi en un dispositivo electrónico?', options: ["Un enchufe", "Unas ondas o barras curvas que se expanden hacia arriba", "Un círculo con una flecha", "Un candado cerrado para navegar por internet", "Una marca de computadoras"], correct: 1 },
    { id: 10, text: '¿Qué unidad se utiliza comúnmente para medir la capacidad de almacenamiento?', options: ["Hertz (Hz)", "Watts (W)", "Gigabytes (GB) o Terabytes (TB)", "Pixeles"], correct: 2 }
];

interface FormState {
    apellido: string;
    nombre: string;
    email: string;
    dni: string;
    cuit: string;
    sexo: string;
    fecha_nacimiento: string;
    pais_nacimiento: string;
    pais_nacimiento_otro: string;
    nacionalidad: string;
    nacionalidad_otra: string;
    lugar_nacimiento: string;
    domicilio: string;
    barrio: string;
    ciudad: string;
    telefono: string;
    nivel_educativo: string;
    estatus: string;
    posee_pc: boolean;
    posee_conectividad: boolean;
    puede_traer_pc: boolean;
    trabaja: boolean;
    lugar_trabajo: string;
    dni_digitalizado: string;
    titulo_secundario_digitalizado: string;
    tutor_nombre: string;
    tutor_dni: string;
    tutor_telefono: string;
    dni_tutor_digitalizado: string;
    nota_parental_firmada: string;
    [key: string]: string | boolean;
}

const initialFormState: FormState = {
    apellido: "", nombre: "", email: "", dni: "", cuit: "", sexo: "M", fecha_nacimiento: "",
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

export const calculateAge = (birthDate: string | null | undefined): number | null => {
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

export type LocalEstudiante = Estudiante & {
    fecha_nacimiento?: string | null;
};

interface LocalNivelacionDigital {
    completado: boolean;
    puntaje: number;
    respuestas_json?: {
        wants_module1?: boolean;
        answers?: Record<string, string>;
    } | null;
}

export type LocalEstudianteDetail = EstudianteDetail & {
    nivelacion_digital?: LocalNivelacionDigital | null;
    autorizacion_fecha?: string | null;
    autorizacion_selfie?: string | null;
    autorizacion_status?: string | null;
    autorizacion_token?: string | null;
};

export interface ViewDataState {
    loading: boolean;
    error: string;
    student: LocalEstudianteDetail | null;
    inscripciones: Inscripcion[];
    notas: Nota[];
}

export interface ExportConfigState {
    columns: string[];
    format: "excel" | "pdf";
    anio: string;
    estatus: string;
    programa_id: string;
    bloque_id: string;
    modulo_id: string;
    cohorte_id: string;
}

export default function Estudiantes() {
    const [filters, setFilters] = useState({ 
        dni: "", 
        nombre_apellido: "", 
        telefono: "", 
        estatus: "", 
        anio: "2026",
        programa_id: "",
        bloque_id: "",
        modulo_id: "",
        cohorte_id: "",
        rango_edad: ""
    });
    const [ordering, setOrdering] = useState<{ field: string; direction: "asc" | "desc" }>({ field: "apellido", direction: "asc" });
    const [qrModal, setQrModal] = useState<{ open: boolean; url: string; studentName: string }>({ open: false, url: "", studentName: "" });
    const [deleteTarget, setDeleteTarget] = useState<LocalEstudiante | null>(null);
    const [editId, setEditId] = useState<number | null>(null);
    const [form, setForm] = useState<FormState>(initialFormState);
    interface FileDataState {
        dniFile: File | null;
        tituloFile: File | null;
        dniTutorFile: File | null;
        notaParentalFile: File | null;
    }
    const [fileData, setFileData] = useState<FileDataState>({ dniFile: null, tituloFile: null, dniTutorFile: null, notaParentalFile: null });
    const [feedback, setFeedback] = useState<{ open: boolean; message: string; severity: "success" | "warning" | "error" }>({ open: false, message: "", severity: "success" });
    const [viewStudentId, setViewStudentId] = useState<number | null>(null);
    const [viewData, setViewData] = useState<ViewDataState>({ loading: false, error: "", student: null, inscripciones: [], notas: [] });
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(25);
    const [loadingEditId, setLoadingEditId] = useState<number | null>(null);
    const [exportModalOpen, setExportModalOpen] = useState(false);
    const [exportConfig, setExportConfig] = useState<ExportConfigState>({
        columns: ["apellido", "nombre", "dni", "sexo", "email", "estatus", "materias_aprobadas", "materias_cursando", "materias_pendientes"],
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
    const [showRespuestasModal, setShowRespuestasModal] = useState(false);
    const formCardRef = useRef<HTMLDivElement>(null);

    const { data: rawEstudiantes = [], isLoading, refetch } = useEstudiantes({
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
    const estudiantes = useMemo(() => rawEstudiantes as LocalEstudiante[], [rawEstudiantes]);
    
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
            const valA = (a as Record<string, unknown>)[ordering.field];
            const valB = (b as Record<string, unknown>)[ordering.field];
            const fieldA = String(valA || "").toLowerCase();
            const fieldB = String(valB || "").toLowerCase();
            return fieldA > fieldB ? dir : fieldA < fieldB ? -dir : 0;
        });
        return arr;
    }, [estudiantes, ordering]);

    const paginatedRows = useMemo(() => sortedRows.slice(page * rowsPerPage, (page + 1) * rowsPerPage), [sortedRows, page, rowsPerPage]);

    const handleSort = (field: string) => setOrdering({ field, direction: ordering.field === field && ordering.direction === "asc" ? "desc" : "asc" });

    const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;
        setForm(f => ({ ...f, [name]: type === "checkbox" ? checked : value }));
    };

    const handleSubmit = async () => {
        if (!form.dni || !form.apellido || !form.nombre || !form.email) {
            setFeedback({ open: true, message: "Completa DNI, apellido, nombre y email.", severity: "error" });
            return;
        }
        const payload = {
            ...form,
            sexo: form.sexo || "M",
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
            setActiveTab("list");
        } catch (error) {
            const errObj = error as { response?: { data?: unknown }; message?: string };
            const errorMsg = errObj.response?.data ? JSON.stringify(errObj.response.data) : errObj.message;
            setFeedback({ open: true, message: `Error: ${errorMsg} `, severity: "error" });
        }
    };

    const handleStartEdit = async (student: LocalEstudiante) => {
        setLoadingEditId(student.id);
        try {
            const { data } = await apiClientV2.get<Record<string, unknown>>(`/estudiantes/${student.id}`);
            setEditId(student.id);

            // Clean data: replace nulls with empty strings to prevent controlled input issues and data loss
            const cleanedData = { ...initialFormState };
            Object.keys(cleanedData).forEach(key => {
                const val = data[key];
                if (val !== null && val !== undefined && val !== "") {
                    if (typeof cleanedData[key] === 'boolean') {
                        cleanedData[key] = !!val;
                    } else {
                        cleanedData[key] = String(val);
                    }
                } else if (typeof cleanedData[key] === 'boolean') {
                    cleanedData[key] = false;
                } else {
                    cleanedData[key] = "";
                }
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
        } catch {
            setDeleteTarget(null);
            setFeedback({ open: true, message: "Error al procesar la baja.", severity: "error" });
        }
    };

    const handleOpenDetail = async (student: LocalEstudiante) => {
        setViewStudentId(student.id);
        setViewData({ loading: true, error: "", student: null, inscripciones: [], notas: [] });
        try {
            const [studentRes, inscripcionesRes, notasRes] = await Promise.all([
                apiClientV2.get<LocalEstudianteDetail>(`/estudiantes/${student.id}`),
                apiClientV2.get<Inscripcion[]>(`/inscripciones`, { params: { estudiante_id: student.id } }),
                apiClientV2.get<Nota[]>(`/examenes/notas`, { params: { estudiante_id: student.id } }),
            ]);
            setViewData({
                loading: false,
                error: "",
                student: studentRes.data,
                inscripciones: Array.isArray(inscripcionesRes.data) ? inscripcionesRes.data : [],
                notas: Array.isArray(notasRes.data) ? notasRes.data : [],
            });
        } catch {
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

            if (response.data.type === 'application/json') {
                const reader = new FileReader();
                reader.onload = () => {
                    try {
                        const errorData = JSON.parse(reader.result as string);
                        setFeedback({ open: true, message: `Error: ${errorData.detail || 'No se pudo generar el archivo'}`, severity: "error" });
                    } catch {
                        setFeedback({ open: true, message: 'No se pudo generar el archivo', severity: "error" });
                    }
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
            
            setTimeout(() => {
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);
            }, 100);
            
            setExportModalOpen(false);
        } catch {
            setFeedback({ open: true, message: "Error al generar el reporte. Verifique su conexión.", severity: "error" });
        } finally {
            setExportLoading(false);
        }
    };

    const toggleColumn = (col: string) => {
        setExportConfig(prev => ({
            ...prev,
            columns: prev.columns.includes(col) 
                ? prev.columns.filter(c => c !== col) 
                : [...prev.columns, col]
        }));
    };



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
                                <Select name="sexo" label="Sexo" value={form.sexo} onChange={onChange} options={[{ value: 'M', label: 'Masculino' }, { value: 'F', label: 'Femenino' }, { value: 'O', label: 'Otro' }]} />
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
                                    <input type="file" accept=".pdf,image/*" onChange={(e) => setFileData({ ...fileData, dniFile: e.target.files?.[0] || null })} className="w-full text-indigo-200 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-indigo-900 file:text-indigo-300 hover:file:bg-indigo-800" />
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
                                    <input type="file" accept=".pdf,image/*" onChange={(e) => setFileData({ ...fileData, tituloFile: e.target.files?.[0] || null })} className="w-full text-indigo-200 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-indigo-900 file:text-indigo-300 hover:file:bg-indigo-800" />
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
                                            <input type="file" accept=".pdf,image/*" onChange={(e) => setFileData({ ...fileData, dniTutorFile: e.target.files?.[0] || null })} className="w-full text-indigo-200 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-indigo-900 file:text-indigo-300 hover:file:bg-indigo-800" />
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
                                            <input type="file" accept=".pdf,image/*" onChange={(e) => setFileData({ ...fileData, notaParentalFile: e.target.files?.[0] || null })} className="w-full text-indigo-200 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-indigo-900 file:text-indigo-300 hover:file:bg-indigo-800" />
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
                                        { value: 'MENORES', label: 'Menores (< 18 años)' }, 
                                        { value: 'MAYORES', label: 'Adultos (>= 18 años)' }
                                    ]} 
                                    className="bg-indigo-950/40 border-brand-accent/20 text-xs" 
                                />
                                <Select 
                                    value={filters.programa_id} 
                                    onChange={(e) => { setFilters({ ...filters, programa_id: e.target.value, bloque_id: "", modulo_id: "", cohorte_id: "" }); setPage(0); }} 
                                    options={[{ value: '', label: 'Cualquier Trayecto' }, ...programas.map(p => ({ value: p.id, label: p.nombre }))]} 
                                    className="bg-indigo-950/40 border-brand-accent/20 text-xs" 
                                />
                                <Select 
                                    value={filters.bloque_id} 
                                    onChange={(e) => { setFilters({ ...filters, bloque_id: e.target.value, modulo_id: "", cohorte_id: "" }); setPage(0); }} 
                                    options={[{ value: '', label: 'Cualquier Módulo' }, ...bloques.map(b => ({ value: b.id, label: b.nombre }))]} 
                                    disabled={!filters.programa_id} 
                                    className="bg-indigo-950/40 border-brand-accent/20 text-xs" 
                                />
                                <Select 
                                    value={filters.modulo_id} 
                                    onChange={(e) => { setFilters({ ...filters, modulo_id: e.target.value }); setPage(0); }} 
                                    options={[{ value: '', label: 'Cualquier Materia' }, ...modulos.map(m => ({ value: m.id, label: m.nombre }))]} 
                                    disabled={!filters.bloque_id} 
                                    className="bg-indigo-950/40 border-brand-accent/20 text-xs" 
                                />
                                <Select 
                                    value={filters.cohorte_id} 
                                    onChange={(e) => { setFilters({ ...filters, cohorte_id: e.target.value }); setPage(0); }} 
                                    options={[{ value: '', label: 'Cualquier Cohorte' }, ...filteredCohortes.map(c => ({ value: c.id, label: c.nombre }))]} 
                                    disabled={!filters.programa_id} 
                                    className="bg-indigo-950/40 border-brand-accent/20 text-xs" 
                                />
                            </div>
                        </div>
                    </div>

                    <EstudiantesTable
                        rows={paginatedRows}
                        isLoading={isLoading}
                        ordering={ordering}
                        onSort={handleSort}
                        onView={handleOpenDetail}
                        onStartEdit={handleStartEdit}
                        onDelete={setDeleteTarget}
                        loadingEditId={loadingEditId}
                        page={page}
                        rowsPerPage={rowsPerPage}
                        totalRows={sortedRows.length}
                        onPageChange={setPage}
                    />
                </div>
            )}

            <ModalConfirmDelete
                deleteTarget={deleteTarget}
                onConfirm={handleConfirmDelete}
                onCancel={() => setDeleteTarget(null)}
            />

            <ModalDetalle
                isOpen={!!viewStudentId}
                studentId={viewStudentId}
                viewData={viewData}
                onClose={() => setViewStudentId(null)}
                onRefresh={() => handleOpenDetail({ id: viewStudentId! } as LocalEstudiante)}
                onOpenRespuestas={() => setShowRespuestasModal(true)}
                onOpenQR={(url, name) => setQrModal({ open: true, url, studentName: name })}
                setFeedback={setFeedback}
            />

            <ModalQR
                open={qrModal.open}
                url={qrModal.url}
                studentName={qrModal.studentName}
                onClose={() => setQrModal({ ...qrModal, open: false })}
            />

            <ModalRespuestas
                isOpen={showRespuestasModal}
                student={viewData.student}
                onClose={() => setShowRespuestasModal(false)}
            />

            <ModalExport
                isOpen={exportModalOpen}
                exportConfig={exportConfig}
                exportLoading={exportLoading}
                setExportConfig={setExportConfig}
                toggleColumn={toggleColumn}
                handleExport={handleExport}
                onClose={() => setExportModalOpen(false)}
            />

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
