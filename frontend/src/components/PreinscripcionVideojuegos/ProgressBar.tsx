import React from "react";
import { CheckCircle2, User, FileText, Smartphone, Gamepad2 } from "lucide-react";

interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
}

export function ProgressBar({ currentStep, totalSteps }: ProgressBarProps) {
  const steps = [
    { n: 1, label: "Especialidad", icon: <Gamepad2 size={18} /> },
    { n: 2, label: "Identidad", icon: <User size={18} /> },
    { n: 3, label: "Contacto", icon: <Smartphone size={18} /> },
    { n: 4, label: "Documentación", icon: <FileText size={18} /> }
  ];

  const progress = ((currentStep - 1) / (totalSteps - 1)) * 100;

  return (
    <div className="w-full mb-12">
      <div className="flex justify-between items-center relative mb-4">
        <div className="absolute top-1/2 left-0 w-full h-1 -translate-y-1/2 rounded-full bg-white/5" />
        <div
          className="absolute top-1/2 left-0 h-1 -translate-y-1/2 bg-gradient-to-r from-cyan-400 to-orange-500 transition-all duration-700 ease-out shadow-[0_0_15px_#00ffff]"
          style={{ width: `${progress}%` }}
        />

        {steps.map((s) => (
          <div key={s.n} className="relative z-10 flex flex-col items-center">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 ${
                s.n < currentStep
                  ? "bg-cyan-400 text-[#050814] shadow-[0_0_15px_rgba(0,255,255,0.4)]"
                  : s.n === currentStep
                  ? "bg-orange-500 text-white shadow-[0_0_15px_rgba(255,102,0,0.4)] scale-110"
                  : "bg-indigo-950 border border-indigo-500/30 text-indigo-400"
              }`}
            >
              {s.n < currentStep ? <CheckCircle2 size={24} /> : s.icon}
            </div>
            <span
              className={`absolute -bottom-7 text-[10px] font-black uppercase tracking-widest ${
                s.n <= currentStep ? "text-cyan-400" : "text-slate-500"
              }`}
            >
              {s.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
