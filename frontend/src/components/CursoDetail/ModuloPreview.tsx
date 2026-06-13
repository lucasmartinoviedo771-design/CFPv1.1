import React, { useState, useEffect } from "react";
import { Box, Typography, Accordion, AccordionSummary, AccordionDetails } from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { Bloque, Modulo } from "../../api/types";
import { listModulos } from "../../services/estructuraService";
import ModuloExamenPreview from "./ModuloExamenPreview";

interface ModuloPreviewProps {
  bloque: Bloque;
}

export default function ModuloPreview({ bloque }: ModuloPreviewProps) {
  const [modulos, setModulos] = useState<Modulo[]>([]);

  useEffect(() => {
    async function fetchModulos() {
      try {
        const res = await listModulos({ bloque_id: bloque.id });
        setModulos(Array.isArray(res) ? res : []);
      } catch (err) {
        console.error("Error fetching modulos for preview:", err);
      }
    }
    fetchModulos();
  }, [bloque.id]);

  if (modulos.length === 0) return null;

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="subtitle1">Módulos:</Typography>
      {modulos.map(modulo => (
        <Accordion key={modulo.id} defaultExpanded sx={{ ml: 2, my: 1 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>Módulo {modulo.orden}: {modulo.nombre}</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <ModuloExamenPreview modulo={modulo} />
          </AccordionDetails>
        </Accordion>
      ))}
    </Box>
  );
}
