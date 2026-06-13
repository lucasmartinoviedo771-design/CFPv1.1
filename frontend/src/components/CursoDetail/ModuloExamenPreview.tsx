import React, { useState, useEffect } from "react";
import { Box, Typography, TableContainer, Table, TableBody, TableRow, TableCell, Paper } from "@mui/material";
import { Modulo, Examen } from "../../api/types";
import { listExamenes } from "../../services/estructuraService";
import { formatDateDisplay } from "../../utils/dateFormat";

interface ModuloExamenPreviewProps {
  modulo: Modulo;
}

export default function ModuloExamenPreview({ modulo }: ModuloExamenPreviewProps) {
  const [examenes, setExamenes] = useState<Examen[]>([]);

  useEffect(() => {
    async function fetchModuloExamenes() {
      try {
        const res = await listExamenes({ modulo_id: modulo.id });
        const arr = Array.isArray(res) ? res : [];
        setExamenes(arr.filter(ex => ['PARCIAL', 'RECUP'].includes(ex.tipo_examen)));
      } catch (err) {
        console.error("Error fetching module examenes for preview:", err);
      }
    }
    fetchModuloExamenes();
  }, [modulo.id]);

  if (examenes.length === 0) return null;

  return (
    <Box sx={{ mt: 1, ml: 2 }}>
      <Typography variant="subtitle2">Exámenes del Módulo:</Typography>
      <TableContainer component={Paper} variant="outlined" sx={{ mt: 0.5 }}>
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
