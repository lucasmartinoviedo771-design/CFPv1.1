import React, { useState, useEffect, useCallback } from "react";
import {
  Box, Typography, FormControl, InputLabel, Select, MenuItem, TextField, Button,
  CircularProgress, TableContainer, Table, TableBody, TableRow, TableCell, Paper
} from "@mui/material";
import { Modulo, Examen } from "../../api/types";
import { listExamenes, createExamen, deleteExamen } from "../../services/estructuraService";
import { formatDateDisplay } from "../../utils/dateFormat";
import { ExamenFormState } from "./types";

interface ModuloExamenManagerProps {
  modulo: Modulo;
}

export default function ModuloExamenManager({ modulo }: ModuloExamenManagerProps) {
  const [examenes, setExamenes] = useState<Examen[]>([]);
  const [form, setForm] = useState<ExamenFormState>({ tipo_examen: 'PARCIAL', fecha: '', modulo: modulo.id, bloque: null });
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  const fetchExamenes = useCallback(async () => {
    try {
      const res = await listExamenes({ modulo_id: modulo.id });
      setExamenes(Array.isArray(res) ? res : []);
    } catch (err) { console.error("Error fetching module examenes:", err); }
  }, [modulo.id]);

  useEffect(() => { fetchExamenes(); }, [fetchExamenes]);

  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | { target: { name: string; value: unknown } }
  ) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaveStatus('saving');
    try {
      const payload: Partial<Examen> & { fecha: string | null } = {
        tipo_examen: form.tipo_examen,
        fecha: form.fecha === '' ? null : form.fecha,
        modulo_id: form.modulo,
        bloque_id: form.bloque,
        peso: 1
      };
      await createExamen(payload);
      setForm({ tipo_examen: 'PARCIAL', fecha: '', modulo: modulo.id, bloque: null });
      fetchExamenes();
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (err) {
      console.error("Error creating module examen:", err);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 2000);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("¿Eliminar examen?")) {
      setSaveStatus('saving');
      try {
        await deleteExamen(id);
        fetchExamenes();
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      } catch (err) {
        console.error("Error deleting module examen:", err);
        setSaveStatus('error');
        setTimeout(() => setSaveStatus('idle'), 2000);
      }
    }
  };

  return (
    <Box>
      <Typography variant="subtitle2" sx={{ mt: 1 }}>Exámenes del Módulo (Parciales)</Typography>
      <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', gap: 1, my: 1, alignItems: 'center' }}>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Tipo</InputLabel>
          <Select name="tipo_examen" value={form.tipo_examen} label="Tipo" onChange={(e) => handleFormChange(e)}>
            <MenuItem value="PARCIAL">Parcial</MenuItem>
            <MenuItem value="RECUP">Recuperatorio</MenuItem>
          </Select>
        </FormControl>
        <TextField name="fecha" type="date" value={form.fecha} onChange={handleFormChange} size="small" InputLabelProps={{ shrink: true }} />
        <Button type="submit" variant="outlined" size="small" disabled={saveStatus === 'saving'}>Agregar Examen</Button>
        {saveStatus === 'saving' && <CircularProgress size={20} />}
        {saveStatus === 'saved' && <Typography sx={{ color: 'success.main' }}>Guardado ✓</Typography>}
        {saveStatus === 'error' && <Typography color="error">Error al guardar</Typography>}
      </Box>
      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableBody>
            {examenes.map(ex => (
              <TableRow key={ex.id}>
                <TableCell>{ex.tipo_examen}</TableCell>
                <TableCell>{formatDateDisplay(ex.fecha)}</TableCell>
                <TableCell align="right"><Button onClick={() => handleDelete(ex.id)} size="small" color="error">X</Button></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
