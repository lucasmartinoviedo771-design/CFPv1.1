import React, { useState, useEffect } from "react";
import { Box, Typography, TableContainer, Table, TableBody, TableRow, TableCell, Paper } from "@mui/material";
import { Bloque, Examen } from "../../api/types";
import { listExamenes } from "../../services/estructuraService";
import { formatDateDisplay } from "../../utils/dateFormat";

interface BloqueExamenPreviewProps {
  bloque: Bloque;
}

export default function BloqueExamenPreview({ bloque }: BloqueExamenPreviewProps) {
  const [examenes, setExamenes] = useState<Examen[]>([]);

  useEffect(() => {
    async function fetchBloqueExamenes() {
      try {
        const res = await listExamenes({ bloque_id: bloque.id });
        const arr = Array.isArray(res) ? res : [];
        setExamenes(arr.filter(ex => ['FINAL_SINC', 'FINAL_VIRTUAL', 'EQUIVALENCIA'].includes(ex.tipo_examen)));
      } catch (err) {
        console.error("Error fetching bloque examenes for preview:", err);
      }
    }
    fetchBloqueExamenes();
  }, [bloque.id]);

  if (examenes.length === 0) return null;

  return (
    <Box sx={{ mt: 2, ml: 2 }}>
      <Typography variant="subtitle1">Exámenes Finales del Bloque:</Typography>
      <TableContainer component={Paper} variant="outlined" sx={{ mt: 1 }}>
        <Table size="small">
          <TableBody>
            {examenes.map(ex => (
              <TableRow key={ex.id}>
                <TableCell>{ex.tipo_examen}</TableCell>
                <TableCell>{formatDateDisplay(ex.fecha)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
