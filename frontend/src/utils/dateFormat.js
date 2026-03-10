export function formatDateDisplay(value) {
  if (!value) return "-";

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toLocaleDateString("es-AR", { timeZone: "UTC" });
  }

  const text = String(value);
  const isoDateOnly = /^(\d{4})-(\d{2})-(\d{2})$/;
  const match = text.match(isoDateOnly);
  if (match) {
    const [, y, m, d] = match;
    const utcDate = new Date(Date.UTC(Number(y), Number(m) - 1, Number(d)));
    return utcDate.toLocaleDateString("es-AR", { timeZone: "UTC" });
  }

  const parsed = new Date(text);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toLocaleDateString("es-AR", { timeZone: "UTC" });
  }

  return text;
}

export function formatDateTimeDisplay(value) {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString("es-AR");
}
