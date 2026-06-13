import React from "react";
import { CheckCircle2, User, BookOpen, Monitor, Heart } from "lucide-react";

interface ProgressBarProps {
  step: number;
}

const STEPS = [
  { n: 1, label: "Personales", icon: <User size={18} /> },
  { n: 2, label: "Académicos", icon: <BookOpen size={18} /> },
  { n: 3, label: "Tecnológicos", icon: <Monitor size={18} /> },
  { n: 4, label: "Complementarios", icon: <Heart size={18} /> },
];

export function ProgressBar({ step }: ProgressBarProps) {
  const progress = ((step - 1) / (STEPS.length - 1)) * 100;
  return (
    <div className="w-full mb-10">
      <div className="flex justify-between items-center relative mb-4">
        <div className="absolute top-1/2 left-0 w-full h-1 -translate-y-1/2 rounded-full bg-[#b8ccd8]" />
        <div
          className="absolute top-1/2 left-0 h-1 -translate-y-1/2 rounded-full bg-[#f5c518] transition-all duration-700"
          style={{ width: `${progress}%` }}
        />
        {STEPS.map((s) => (
          <div key={s.n} className="relative z-10 flex flex-col items-center">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500 font-bold text-sm ${
                s.n < step
                  ? "bg-[#f5c518] text-[#1a1f4e] shadow-md"
                  : s.n === step
                  ? "bg-[#1a1f4e] text-[#f5c518] scale-110 shadow-lg"
                  : "bg-white border-2 border-[#b8ccd8] text-[#c8c4bc]"
              }`}
            >
              {s.n < step ? <CheckCircle2 size={18} /> : s.icon}
            </div>
            <span
              className={`absolute -bottom-5 text-[9px] font-black uppercase tracking-widest whitespace-nowrap ${
                s.n <= step ? "text-[#1a1f4e]" : "text-[#c8c4bc]"
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
