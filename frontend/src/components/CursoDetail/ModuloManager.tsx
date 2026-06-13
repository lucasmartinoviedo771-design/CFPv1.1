import React, { useState, useEffect, useCallback } from "react";
import {
  Box, Typography, TextField, Button, CircularProgress, Accordion, AccordionSummary, AccordionDetails
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { Bloque, Modulo } from "../../api/types";
import { listModulos, createModulo, deleteModulo } from "../../services/estructuraService";
import ModuloExamenManager from "./ModuloExamenManager";
import { ModuloFormState } from "./types";

interface ModuloManagerProps {
  bloque: Bloque;
}

export default function ModuloManager({ bloque }: ModuloManagerProps) {
  const [modulos, setModulos] = useState<Modulo[]>([]);
  const [form, setForm] = useState<ModuloFormState>({ nombre: '', orden: 10, bloque: bloque.id });
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  const fetchModulos = useCallback(async () => {
    try {
      const res = await listModulos({ bloque_id: bloque.id });
      setModulos(Array.isArray(res) ? res : []);
    } catch (err) { console.error("Error fetching modulos:", err); }
  }, [bloque.id]);

  useEffect(() => { fetchModulos(); }, [fetchModulos]);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const val = e.target.name === 'orden' ? Number(e.target.value) : e.target.value;
    setForm(f => ({ ...f, [e.target.name]: val }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaveStatus('saving');
    try {
      await createModulo({
        nombre: form.nombre,
        orden: form.orden,
        bloque_id: form.bloque,
        es_practica: false,
        asistencia_requerida_practica: 80
      });
      setForm({ nombre: '', orden: 10, bloque: bloque.id });
      fetchModulos();
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (err) {
      console.error("Error creating modulo:", err);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 2000);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("¿Eliminar módulo? Se borrarán sus exámenes.")) {
      setSaveStatus('saving');
      try {
        await deleteModulo(id);
        fetchModulos();
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      } catch (err) {
        console.error("Error deleting modulo:", err);
        setSaveStatus('error');
        setTimeout(() => setSaveStatus('idle'), 2000);
      }
    }
  };

  return (
    <Box>
      <Typography variant="subtitle1" sx={{ mt: 1 }}>Módulos del Bloque</Typography>
      <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', gap: 1, my: 1, alignItems: 'center' }}>
        <TextField name="nombre" value={form.nombre} onChange={handleFormChange} label="Nombre del Módulo" size="small" required />
        <TextField name="orden" value={form.orden} onChange={handleFormChange} label="Orden" type="number" size="small" required />
        <Button type="submit" variant="outlined" size="small" disabled={saveStatus === 'saving'}>Agregar Módulo</Button>
        {saveStatus === 'saving' && <CircularProgress size={20} />}
        {saveStatus === 'saved' && <Typography sx={{ color: 'success.main' }}>Guardado ✓</Typography>}
        {saveStatus === 'error' && <Typography color="error">Error al guardar</Typography>}
      </Box>
      {modulos.map(m => (
        <Accordion key={m.id} sx={{ my: 1 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography sx={{ flexShrink: 0, mr: 2 }}>Orden: {m.orden}</Typography>
            <Typography sx={{ flexGrow: 1 }}>{m.nombre}</Typography>
            <Button onClick={(e) => { e.stopPropagation(); handleDelete(m.id); }} size="small" color="error">Eliminar Módulo</Button>
          </AccordionSummary>
          <AccordionDetails>
            <ModuloExamenManager modulo={m} />
          </AccordionDetails>
        </Accordion>
      ))}
    </Box>
  );
}
