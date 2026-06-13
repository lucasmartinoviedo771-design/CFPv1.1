import React, { useEffect, useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Grid, TextField, Button, FormControlLabel, Checkbox
} from '@mui/material';
import { ModuloForm, initialModuloFormState } from './types';

export interface ModuloFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (form: ModuloForm) => void;
  modulo: ModuloForm | null;
  bloqueId: number | null;
}

export default function ModuloFormDialog({ open, onClose, onSave, modulo, bloqueId }: ModuloFormDialogProps) {
  const [form, setForm] = useState<ModuloForm>(initialModuloFormState);

  useEffect(() => {
    if (modulo) {
      setForm({
        ...modulo,
        bloque_id: modulo.bloque_id
      });
    } else {
      setForm({ ...initialModuloFormState, bloque_id: bloqueId });
    }
  }, [modulo, bloqueId, open]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSave = () => {
    onSave(form);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{modulo ? 'Editar Módulo' : 'Añadir Módulo'}</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12}><TextField name="nombre" label="Nombre del Módulo" fullWidth value={form.nombre} onChange={handleChange} /></Grid>
          <Grid item xs={12} sm={6}><FormControlLabel control={<Checkbox name="es_practica" checked={form.es_practica} onChange={handleChange} />} label="Es Práctica" /></Grid>
          {form.es_practica && (
            <Grid item xs={12}><TextField name="asistencia_requerida_practica" label="Asistencia Requerida (%)" type="number" fullWidth value={form.asistencia_requerida_practica} onChange={handleChange} /></Grid>
          )}
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button onClick={handleSave} variant="contained">{modulo ? 'Guardar Cambios' : 'Añadir'}</Button>
      </DialogActions>
    </Dialog>
  );
}
