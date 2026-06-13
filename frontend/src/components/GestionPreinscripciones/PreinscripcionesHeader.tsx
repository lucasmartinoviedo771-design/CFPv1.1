import React from "react";
import { Search, Loader, UserCheck, Trash2, XCircle, UploadCloud } from "lucide-react";
import { Button, Input } from '../UI';

export interface PreinscripcionesHeaderProps {
  selectedCount: number;
  approving: boolean;
  canDelete: boolean;
  isAdmin: boolean;
  viewArchived: boolean;
  onBulkArchive: () => void;
  onBulkDelete: () => void;
  onBulkApprove: () => void;
  onBulkRestore: () => void;
  onViewArchivedChange: (val: boolean) => void;
  searchTerm: string;
  onSearchTermChange: (val: string) => void;
  onRefetch: () => void;
}

export default function PreinscripcionesHeader({
  selectedCount,
  approving,
  canDelete,
  isAdmin,
  viewArchived,
  onBulkArchive,
  onBulkDelete,
  onBulkApprove,
  onBulkRestore,
  onViewArchivedChange,
  searchTerm,
  onSearchTermChange,
  onRefetch,
}: PreinscripcionesHeaderProps) {
  return (
    <>
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Preinscripciones CFP</h1>
          <p className="text-indigo-300">Revisión y aprobación masiva de nuevos Estudiantes.</p>
        </div>
        <div className="flex gap-3">
          {canDelete && (
            <Button
              onClick={onBulkArchive}
              disabled={selectedCount === 0 || approving}
              variant="danger"
              className="bg-orange-600 hover:bg-orange-500 border-none px-6"
              startIcon={<Trash2 size={18} />}
              title="Quitar de la lista (Borrado Lógico)"
            >
              Quitar ({selectedCount})
            </Button>
          )}
          {isAdmin && (
            <Button
              onClick={onBulkDelete}
              disabled={selectedCount === 0 || approving}
              variant="danger"
              className="bg-red-700 hover:bg-red-600 border-none px-2"
              startIcon={<XCircle size={18} />}
              title="Eliminar Permanente"
            />
          )}
          <Button
            onClick={onBulkApprove}
            disabled={selectedCount === 0 || approving}
            className="bg-emerald-600 hover:bg-emerald-500 border-none px-6"
            startIcon={approving ? <Loader className="animate-spin" size={18} /> : <UserCheck size={18} />}
          >
            Aprobar Seleccionados ({selectedCount})
          </Button>
          {viewArchived && selectedCount > 0 && (
            <Button
              onClick={onBulkRestore}
              disabled={approving}
              className="bg-cyan-600 hover:bg-cyan-500 border-none px-6"
              startIcon={<UploadCloud size={18} />}
            >
              Restaurar ({selectedCount})
            </Button>
          )}
        </div>
      </div>

      <div className="flex gap-2 mb-4 bg-indigo-950/30 p-1 rounded-lg w-fit border border-indigo-500/10">
        <button
          onClick={() => onViewArchivedChange(false)}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
            !viewArchived
              ? "bg-indigo-600 text-white shadow-lg"
              : "text-indigo-400 hover:text-indigo-200"
          }`}
        >
          Cola Principal
        </button>
        <button
          onClick={() => onViewArchivedChange(true)}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
            viewArchived
              ? "bg-orange-600 text-white shadow-lg"
              : "text-indigo-400 hover:text-indigo-200"
          }`}
        >
          <Trash2 size={16} /> Papelera / Archivados
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-4">
        <div className="flex-1 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-indigo-400">
            <Search size={18} />
          </div>
          <Input
            placeholder="Buscar por DNI, Nombre o Apellido..."
            value={searchTerm}
            onChange={(e) => onSearchTermChange(e.target.value)}
            className="bg-indigo-950/50 pl-10"
          />
        </div>
        <Button onClick={onRefetch} variant="ghost" className="text-indigo-300">
          Actualizar
        </Button>
      </div>
    </>
  );
}
