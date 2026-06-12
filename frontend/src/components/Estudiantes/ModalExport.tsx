import React from "react";
import { Modal } from "./Modal";
import { Button } from "../UI";
import { Download } from "lucide-react";
import type { ExportConfigState } from "../../pages/Estudiantes";

interface ModalExportProps {
    isOpen: boolean;
    exportConfig: ExportConfigState;
    exportLoading: boolean;
    setExportConfig: React.Dispatch<React.SetStateAction<ExportConfigState>>;
    toggleColumn: (col: string) => void;
    handleExport: () => void;
    onClose: () => void;
}

export const ModalExport: React.FC<ModalExportProps> = ({
    isOpen,
    exportConfig,
    exportLoading,
    setExportConfig,
    toggleColumn,
    handleExport,
    onClose
}) => {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Exportar Datos de Estudiantes"
            maxWidthClass="max-w-2xl"
            actions={
                <>
                    <Button variant="ghost" onClick={onClose}>Cancelar</Button>
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
                            { id: "sexo", label: "Sexo" },
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
    );
};
