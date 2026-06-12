import React from "react";
import { Modal } from "./Modal";
import { Button } from "../UI";

interface ModalQRProps {
    open: boolean;
    url: string;
    studentName: string;
    onClose: () => void;
}

export const ModalQR: React.FC<ModalQRProps> = ({ open, url, studentName, onClose }) => {
    return (
        <Modal
            isOpen={open}
            onClose={onClose}
            title="Autorización Presencial"
            maxWidthClass="max-w-sm"
            actions={<Button onClick={onClose}>Cerrar</Button>}
        >
            <div className="flex flex-col items-center text-center space-y-4">
                <p className="text-sm text-indigo-200">
                    Pedile al <b>Padre/Madre o Tutor</b> que escanee este código para firmar la autorización de <b>{studentName}</b>
                </p>
                <div className="p-4 bg-white rounded-2xl shadow-xl">
                    <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`}
                        alt="QR de Autorización"
                        className="w-48 h-48"
                    />
                </div>
                <div className="w-full p-3 bg-black/40 rounded-lg border border-white/5 overflow-hidden">
                    <p className="text-[10px] text-indigo-400 uppercase font-bold mb-1">Link Directo</p>
                    <p className="text-[10px] text-gray-400 break-all select-all cursor-pointer font-mono">{url}</p>
                </div>
            </div>
        </Modal>
    );
};
