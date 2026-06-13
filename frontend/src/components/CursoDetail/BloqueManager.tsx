import React, { useState, useEffect, useCallback } from "react";
import {
  Box, Typography, TextField, Button, CircularProgress, Accordion, AccordionSummary, AccordionDetails, Divider
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { Programa, Bloque } from "../../api/types";
import { listBloques, createBloque, deleteBloque } from "../../services/estructuraService";
import BloqueExamenManager from "./BloqueExamenManager";
import ModuloManager from "./ModuloManager";
import { BloqueFormState } from "./types";

interface BloqueManagerProps {
  curso: Programa;
  bloques: Bloque[];
  setBloques: React.Dispatch<React.SetStateAction<Bloque[]>>;
}

export default function BloqueManager({ curso, bloques, setBloques }: BloqueManagerProps) {
  const [form, setForm] = useState<BloqueFormState>({ nombre: '', orden: 10, programa_id: curso.id });
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  useEffect(() => {
    setForm(f => ({ ...f, programa_id: curso.id }));
  }, [curso.id]);

  const fetchBloques = useCallback(async () => {
    try {
      const res = await listBloques({ programa_id: curso.id });
      setBloques(Array.isArray(res) ? res : []);
    } catch (err) { console.error("Error fetching bloques:", err); }
  }, [curso.id, setBloques]);

  useEffect(() => { fetchBloques(); }, [fetchBloques, setBloques]);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const val = e.target.name === 'orden' ? Number(e.target.value) : e.target.value;
    setForm(f => ({ ...f, [e.target.name]: val }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaveStatus('saving');
    try {
      await createBloque({
        nombre: form.nombre,
        orden: form.orden,
        programa_id: form.programa_id,
        correlativas_ids: []
      });
      setForm({ nombre: '', orden: 10, programa_id: curso.id });
      fetchBloques();
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (err) {
      console.error("Error creating bloque:", err);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 2000);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("¿Eliminar bloque? Se borrarán sus módulos y exámenes.")) {
      setSaveStatus('saving');
      try {
        await deleteBloque(id);
        fetchBloques();
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      } catch (err) {
        console.error("Error deleting bloque:", err);
        setSaveStatus('error');
        setTimeout(() => setSaveStatus('idle'), 2000);
      }
    }
  };

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="h6">Bloques del Curso</Typography>
      <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', gap: 2, my: 2, alignItems: 'center' }}>
        <TextField name="nombre" value={form.nombre} onChange={handleFormChange} label="Nombre del Bloque" size="small" required />
        <TextField name="orden" value={form.orden} onChange={handleFormChange} label="Orden" type="number" size="small" required />
        <Button type="submit" variant="contained" disabled={saveStatus === 'saving'}>Agregar Bloque</Button>
        {saveStatus === 'saving' && <CircularProgress size={20} />}
        {saveStatus === 'saved' && <Typography sx={{ color: 'success.main' }}>Guardado ✓</Typography>}
        {saveStatus === 'error' && <Typography color="error">Error al guardar</Typography>}
      </Box>

      {bloques && bloques.length > 0 ? (
        bloques.map(b => (
          <Accordion key={b.id}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography sx={{ flexShrink: 0, mr: 2 }}>Orden: {b.orden}</Typography>
              <Typography sx={{ flexGrow: 1 }}>{b.nombre}</Typography>
              <Button onClick={(e) => { e.stopPropagation(); handleDelete(b.id); }} size="small" color="error">Eliminar Bloque</Button>
            </AccordionSummary>
            <AccordionDetails>
              <BloqueExamenManager bloque={b} />
              <Divider sx={{ my: 2 }} />
              <ModuloManager bloque={b} />
            </AccordionDetails>
          </Accordion>
        ))
      ) : (
        <Typography>No hay bloques definidos.</Typography>
      )}
    </Box>
  );
}
