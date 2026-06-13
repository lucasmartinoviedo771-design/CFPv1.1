export const ACCEPTED_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/webp"];

export const NIVEL_EDUCATIVO_OPTIONS = [
  "Primaria Completa",
  "Secundaria Incompleta",
  "Secundaria Completa",
  "Terciaria/Universitaria Incompleta",
  "Terciaria/Universitaria Completa",
  "Terciaria/Universitaria",
];

export async function compressImage(file: File): Promise<File> {
  if (!file.type.startsWith("image/")) return file;
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;
        const MAX_WIDTH = 1200;
        if (width > MAX_WIDTH) {
          height *= MAX_WIDTH / width;
          width = MAX_WIDTH;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
        }
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(new File([blob], file.name, { type: "image/jpeg", lastModified: Date.now() }));
          } else {
            resolve(file);
          }
        }, "image/jpeg", 0.7);
      };
    };
  });
}

export function validateFile(file: File | null, label: string): string {
  if (!file) return `${label}: archivo requerido.`;
  if (file.size > 5 * 1024 * 1024 && !file.type.startsWith("image/")) {
    return `${label}: el PDF no debe superar los 5MB.`;
  }
  if (!ACCEPTED_TYPES.includes(file.type)) return `${label}: formato permitido PDF/JPG/PNG/WEBP.`;
  return "";
}

export function normalizeText(value: string | null | undefined): string {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function calculateAge(fecha_nacimiento: string | null | undefined): number {
  if (!fecha_nacimiento) return 18;
  try {
    const parts = fecha_nacimiento.split(/[-/]/).map(Number);
    let y, m, d;
    if (parts[0] > 1000) {
      [y, m, d] = parts;
    } else {
      [d, m, y] = parts;
    }

    const nac = new Date(y, m - 1, d);
    if (isNaN(nac.getTime())) return 18;

    const hoy = new Date();
    let e = hoy.getFullYear() - nac.getFullYear();
    const mm = hoy.getMonth() - nac.getMonth();
    if (mm < 0 || (mm === 0 && hoy.getDate() < nac.getDate())) e--;
    return e;
  } catch {
    return 18;
  }
}
