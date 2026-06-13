import React, { useState, useEffect, useRef } from "react";
import { CheckCircle2, X, UploadCloud } from "lucide-react";
import { PROVINCIAS_AR } from "./constants";

export const inputCls =
  "w-full rounded-xl px-4 py-3 border border-[#b8ccd8] bg-white text-[#1a1f4e] focus:outline-none focus:ring-2 focus:ring-[#f5c518] transition-all text-sm";
export const labelCls = "block text-xs font-bold uppercase tracking-wider text-[#1a1f4e] mb-1";

interface FieldProps {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}

export function Field({ label, required, children }: FieldProps) {
  return (
    <div className="space-y-1 text-left">
      <label className={labelCls}>
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}

interface RadioProps {
  name: string;
  value: string;
  current: string;
  onSelect: (name: string, value: string) => void;
  label: string;
}

export function Radio({ name, value, current, onSelect, label }: RadioProps) {
  const active = current === value;
  return (
    <button
      type="button"
      onClick={() => onSelect(name, value)}
      className={`px-4 py-2 rounded-lg border-2 text-sm font-semibold transition-all ${
        active
          ? "border-[#f5c518] bg-[#f5c518]/15 text-[#1a1f4e]"
          : "border-[#b8ccd8] bg-white text-[#1a1f4e] hover:border-[#f5c518]/60"
      }`}
    >
      {label}
    </button>
  );
}

interface RadioOption {
  value: string;
  label: string;
}

interface RadioGroupProps {
  name: string;
  value: string;
  onSelect: (name: string, value: string) => void;
  options: RadioOption[];
}

export function RadioGroup({ name, value, onSelect, options }: RadioGroupProps) {
  return (
    <div className="flex flex-wrap gap-2 text-left">
      {options.map((o) => (
        <Radio key={o.value} name={name} value={o.value} current={value} onSelect={onSelect} label={o.label} />
      ))}
    </div>
  );
}

interface FileUploadProps {
  label: string;
  required?: boolean;
  file: File | null;
  onFile: (file: File | null) => void;
  accept?: string;
}

export function FileUpload({ label, required, file, onFile, accept }: FileUploadProps) {
  const ref = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);

  return (
    <div className="text-left">
      <label className={labelCls}>
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <label
        className={`flex flex-col items-center gap-2 p-6 rounded-xl border-2 border-dashed cursor-pointer transition-all ${
          drag
            ? "border-[#f5c518] bg-[#f5c518]/5"
            : file
            ? "border-green-400 bg-green-50"
            : "border-[#b8ccd8] bg-white hover:border-[#f5c518]/50"
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          const f = e.dataTransfer?.files?.[0];
          if (f) onFile(f);
        }}
      >
        <input
          ref={ref}
          type="file"
          className="hidden"
          accept={accept || ".pdf,.doc,.docx,image/*"}
          onChange={(e) => onFile(e.target.files?.[0] || null)}
        />
        {file ? (
          <div className="flex items-center gap-2 text-green-700 text-sm font-semibold">
            <CheckCircle2 size={18} /> {file.name}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                onFile(null);
                if (ref.current) ref.current.value = "";
              }}
              className="ml-2 text-red-400 hover:text-red-600"
            >
              <X size={14} />
            </button>
          </div>
        ) : (
          <>
            <UploadCloud size={28} className="text-[#b8ccd8]" />
            <span className="text-sm text-[#1a1f4e]/60">Arrastrá o hacé clic para adjuntar</span>
            <span className="text-xs text-[#1a1f4e]/40">PDF, Word, JPG, PNG</span>
          </>
        )}
      </label>
    </div>
  );
}

interface ProvinciaSelectProps {
  value: string;
  onChange: (prov: string) => void;
  className?: string;
}

export function ProvinciaSelect({ value, onChange, className }: ProvinciaSelectProps) {
  const [query, setQuery] = useState(value || "");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const filtered =
    query.length === 0 ? PROVINCIAS_AR : PROVINCIAS_AR.filter((p) => p.toLowerCase().includes(query.toLowerCase()));

  useEffect(() => {
    setQuery(value || "");
  }, [value]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const select = (prov: string) => {
    setQuery(prov);
    setOpen(false);
    onChange(prov);
  };

  return (
    <div ref={ref} className="relative">
      <input
        type="text"
        value={query}
        placeholder="Escribí o seleccioná tu provincia..."
        className={className}
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
          onChange("");
        }}
        autoComplete="off"
      />
      {open && filtered.length > 0 && (
        <ul
          className="absolute z-50 w-full mt-1 rounded-xl border border-white/20 shadow-xl max-h-52 overflow-y-auto"
          style={{ background: "#1a1f4e" }}
        >
          {filtered.map((p) => (
            <li
              key={p}
              onMouseDown={() => select(p)}
              className="px-4 py-2 cursor-pointer text-sm text-white hover:bg-white/10"
            >
              {p}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
