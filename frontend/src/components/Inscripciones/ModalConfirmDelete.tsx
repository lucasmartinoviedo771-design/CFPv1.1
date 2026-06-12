import React from "react";
import { Modal } from "../Estudiantes/Modal";
import { Button } from "../UI";
import { ExtendedInscripcion } from "../../pages/Inscripciones";

interface ModalConfirmDeleteProps {
    isOpen: boolean;
    onClose: () => void;
    inscToDelete: ExtendedInscripcion | null;
    onConfirm: (id: number) => void;
}

export const ModalConfirmDelete: React.FC<ModalConfirmDeleteProps> = ({
    isOpen,
    onClose,
    inscToDelete,
    onConfirm,
}) => {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Confirmar eliminación"
            actions={
                <>
                    <Button variant="ghost" onClick={onClose}>
                        Cancelar
                    </Button>
                    <Button
                        onClick={() => inscToDelete && onConfirm(inscToDelete.id)}
                        className="bg-red-600 hover:bg-red-700 text-white border-none"
                    >
                        Eliminar
                    </Button>
                </>
            }
        >
            <p>
                ¿Estás seguro de que deseas eliminar la inscripción de{" "}
                <strong>
                    {inscToDelete?.estudiante?.apellido}, {inscToDelete?.estudiante?.nombre}
                </strong>{" "}
                al módulo <strong>{inscToDelete?.modulo?.nombre || "N/A"}</strong>?
            </p>
            <p className="text-sm text-gray-400 mt-2">Esta acción no se puede deshacer.</p>
        </Modal>
    );
};
