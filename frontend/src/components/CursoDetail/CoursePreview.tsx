import React from "react";
import { Box, Typography, Accordion, AccordionSummary, AccordionDetails } from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { Programa, Bloque } from "../../api/types";
import ModuloPreview from "./ModuloPreview";
import BloqueExamenPreview from "./BloqueExamenPreview";

interface CoursePreviewProps {
  curso: Programa;
  bloques: Bloque[];
}

export default function CoursePreview({ curso, bloques }: CoursePreviewProps) {
  return (
    <Box>
      <Typography variant="h5" gutterBottom>Vista Previa del Curso: {curso.nombre}</Typography>
      {bloques.length > 0 ? (
        bloques.map(bloque => (
          <Accordion key={bloque.id} defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle1">Bloque {bloque.orden}: {bloque.nombre}</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <ModuloPreview bloque={bloque} />
              <BloqueExamenPreview bloque={bloque} />
            </AccordionDetails>
          </Accordion>
        ))
      ) : (
        <Typography>No hay bloques definidos para este curso.</Typography>
      )}
    </Box>
  );
}
