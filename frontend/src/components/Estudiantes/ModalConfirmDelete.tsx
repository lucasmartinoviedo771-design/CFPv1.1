import React from "react";
import { Modal } from "./Modal";
import { Button } from "../UI";

interface ModalConfirmDeleteProps {
    deleteTarget: { nombre: string; apellido: string } | null;
    onConfirm: () => void;
    onCancel: () => void;
}

export const ModalConfirmDelete: React.FC<ModalConfirmDeleteProps> = ({ deleteTarget, onConfirm, onCancel }) => {
    return (
        <Modal
            isOpen={!!deleteTarget}
            onClose={onCancel}
            title="Confirmar Baja"
            actions={
                <>
                    <Button variant="ghost" onClick={onCancel}>Cancelar</Button>
                    <Button onClick={onConfirm} className="bg-red-600 hover:bg-red-700 text-white border-none">Dar de Baja</Button>
                </>
            }
        >
            <p>¿Estás seguro de que quieres dar de baja a <strong>{deleteTarget?.apellido}, {deleteTarget?.nombre}</strong>?</p>
            <p className="text-sm text-gray-400 mt-2">El estudiante no aparecerá en las listas activas pero su historial se conservará.</p>
        </Modal>
    );
};
