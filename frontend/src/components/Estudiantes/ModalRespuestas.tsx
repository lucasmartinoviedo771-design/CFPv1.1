import React from "react";
import { Modal } from "./Modal";
import { Button } from "../UI";
import { NIVELACION_QUESTIONS } from "../../pages/Estudiantes";
import type { LocalEstudianteDetail } from "../../pages/Estudiantes";

interface ModalRespuestasProps {
    isOpen: boolean;
    student: LocalEstudianteDetail | null;
    onClose: () => void;
}

export const ModalRespuestas: React.FC<ModalRespuestasProps> = ({ isOpen, student, onClose }) => {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`Respuestas de ${student?.nombre} ${student?.apellido}`}
            maxWidthClass="max-w-2xl"
            actions={
                <Button onClick={onClose} className="bg-indigo-600 hover:bg-indigo-500 text-white">
                    Cerrar
                </Button>
            }
        >
            <div className="space-y-4">
                {NIVELACION_QUESTIONS.map(q => {
                    const answerStr = student?.nivelacion_digital?.respuestas_json?.answers?.[q.id];
                    const answerInt = answerStr !== undefined ? parseInt(answerStr) : -1;
                    return (
                        <div key={q.id} className="p-3 bg-indigo-950/40 rounded-lg border border-indigo-500/20">
                            <p className="font-bold text-sm text-indigo-100 mb-2">{q.id}. {q.text}</p>
                            <div className="space-y-1 pl-2">
                                {q.options.map((opt, idx) => {
                                    let style = "text-indigo-300 text-xs";
                                    let icon = null;
                                    if (idx === q.correct && idx === answerInt) {
                                        style = "text-emerald-400 font-bold";
                                        icon = "✓";
                                    } else if (idx === answerInt && idx !== q.correct) {
                                        style = "text-red-400 font-bold";
                                        icon = "✗";
                                    } else if (idx === q.correct) {
                                        style = "text-emerald-400/70";
                                    }
                                    return (
                                        <div key={idx} className={`flex items-start gap-2 ${style}`}>
                                            <span className="mt-0.5">{icon || "•"}</span>
                                            <span>{opt}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>
        </Modal>
    );
};
