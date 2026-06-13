export const PROVINCIAS_AR = [
  "Buenos Aires",
  "Catamarca",
  "Chaco",
  "Chubut",
  "Ciudad Autónoma de Buenos Aires",
  "Córdoba",
  "Corrientes",
  "Entre Ríos",
  "Formosa",
  "Jujuy",
  "La Pampa",
  "La Rioja",
  "Mendoza",
  "Misiones",
  "Neuquén",
  "Río Negro",
  "Salta",
  "San Juan",
  "San Luis",
  "Santa Cruz",
  "Santa Fe",
  "Santiago del Estero",
  "Tierra del Fuego, Antártida e Islas del Atlántico Sur",
  "Tucumán",
];

export const CIUDADES_POR_PROVINCIA: Record<string, string[]> = {
  "Buenos Aires": [
    "La Plata",
    "Mar del Plata",
    "Bahía Blanca",
    "Quilmes",
    "Lanús",
    "Lomas de Zamora",
    "General Roca",
    "Tandil",
    "Pergamino",
    "San Nicolás",
    "Otra",
  ],
  Catamarca: ["San Fernando del Valle de Catamarca", "San Isidro", "Belén", "Santa María", "Andalgalá", "Otra"],
  Chaco: ["Resistencia", "Presidencia Roque Sáenz Peña", "Villa Ángela", "Charata", "Otra"],
  Chubut: ["Rawson", "Comodoro Rivadavia", "Trelew", "Puerto Madryn", "Esquel", "Otra"],
  "Ciudad Autónoma de Buenos Aires": ["CABA", "Otra"],
  Córdoba: ["Córdoba", "Villa María", "Río Cuarto", "San Francisco", "Villa Carlos Paz", "Alta Gracia", "Otra"],
  Corrientes: ["Corrientes", "Goya", "Mercedes", "Paso de los Libres", "Otra"],
  "Entre Ríos": ["Paraná", "Concordia", "Gualeguaychú", "Concepción del Uruguay", "Otra"],
  Formosa: ["Formosa", "Clorinda", "Pirané", "Otra"],
  Jujuy: ["San Salvador de Jujuy", "San Pedro de Jujuy", "Palpalá", "Libertador General San Martín", "Otra"],
  "La Pampa": ["Santa Rosa", "General Pico", "Otra"],
  "La Rioja": ["La Rioja", "Chilecito", "Otra"],
  Mendoza: ["Mendoza", "San Rafael", "Godoy Cruz", "Luján de Cuyo", "Maipú", "Otra"],
  Misiones: ["Posadas", "Oberá", "Eldorado", "Puerto Iguazú", "Otra"],
  Neuquén: ["Neuquén", "San Martín de los Andes", "Zapala", "Cutral Có", "Otra"],
  "Río Negro": ["Viedma", "Bariloche", "General Roca", "Cipolletti", "Otra"],
  Salta: ["Salta", "San Ramón de la Nueva Orán", "Tartagal", "Metán", "Otra"],
  "San Juan": ["San Juan", "Rawson", "Rivadavia", "Otra"],
  "San Luis": ["San Luis", "Villa Mercedes", "Otra"],
  "Santa Cruz": ["Río Gallegos", "Caleta Olivia", "Pico Truncado", "Puerto Deseado", "Otra"],
  "Santa Fe": ["Santa Fe", "Rosario", "Rafaela", "Santo Tomé", "Venado Tuerto", "Otra"],
  "Santiago del Estero": ["Santiago del Estero", "La Banda", "Otra"],
  "Tierra del Fuego, Antártida e Islas del Atlántico Sur": [
    "Ushuaia",
    "Río Grande - Margen Sur",
    "Río Grande - Margen Norte",
    "Tolhuin",
    "Zona Rural (Ej: Estancia Cullen)",
    "Otra",
  ],
  Tucumán: ["San Miguel de Tucumán", "Concepción", "Banda del Río Salí", "Otra"],
};

export const LOCALIDADES = [
  { value: "ushuaia", label: "Ushuaia" },
  { value: "rg_sur", label: "Río Grande - Margen Sur" },
  { value: "rg_norte", label: "Río Grande - Margen Norte" },
  { value: "tolhuin", label: "Tolhuin" },
  { value: "zona_rural", label: "Zona Rural (Ej: Estancia Cullen)" },
];

export const getEmailPorLocalidad = (localidad: string) => {
  if (localidad === "ushuaia") {
    return "Tutoria.cetns.ush@tdf.edu.ar";
  }
  if (localidad === "tolhuin") {
    return "Tutoria.cetns.tol@tdf.edu.ar";
  }
  return "Tutoria.cetns.rg@gmail.com";
};
