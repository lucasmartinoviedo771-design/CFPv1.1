import React, { useEffect, useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Grid, TextField, Button, Checkbox, FormControlLabel
} from '@mui/material';
import { ResolucionForm, initialResolucionFormState } from './types';

export interface ResolucionFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (form: ResolucionForm) => void;
  resolucion: ResolucionForm | null;
}

export default function ResolucionFormDialog({ open, onClose, onSave, resolucion }: ResolucionFormDialogProps) {
  const [form, setForm] = useState<ResolucionForm>(initialResolucionFormState);

  useEffect(() => {
    if (resolucion) {
      setForm(resolucion);
    } else {
      setForm(initialResolucionFormState);
    }
  }, [resolucion, open]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSave = () => {
    onSave(form);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{resolucion ? 'Editar Resolución' : 'Añadir Resolución'}</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12}><TextField name="numero" label="Número de Resolución" fullWidth value={form.numero} onChange={handleChange} /></Grid>
          <Grid item xs={12}><TextField name="nombre" label="Nombre" fullWidth value={form.nombre} onChange={handleChange} /></Grid>
          <Grid item xs={12}><TextField name="fecha_publicacion" label="Fecha de Publicación" type="date" fullWidth InputLabelProps={{ shrink: true }} value={form.fecha_publicacion} onChange={handleChange} /></Grid>
          <Grid item xs={12}><FormControlLabel control={<Checkbox name="vigente" checked={form.vigente} onChange={handleChange} />} label="Vigente" /></Grid>
          <Grid item xs={12}><TextField name="observaciones" label="Observaciones" fullWidth multiline rows={3} value={form.observaciones} onChange={handleChange} /></Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button onClick={handleSave} variant="contained">{resolucion ? 'Guardar Cambios' : 'Añadir'}</Button>
      </DialogActions>
    </Dialog>
  );
}
