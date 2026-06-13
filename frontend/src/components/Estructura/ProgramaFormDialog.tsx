import React, { useEffect, useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Grid, TextField, Button
} from '@mui/material';
import { ProgramaForm, initialProgramaFormState } from './types';

export interface ProgramaFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (form: ProgramaForm) => void;
  programa: ProgramaForm | null;
  resolucionId: number | null;
}

export default function ProgramaFormDialog({ open, onClose, onSave, programa, resolucionId }: ProgramaFormDialogProps) {
  const [form, setForm] = useState<ProgramaForm>(initialProgramaFormState);

  useEffect(() => {
    if (programa) {
      setForm(programa);
    } else {
      setForm({ ...initialProgramaFormState, resolucion_id: resolucionId });
    }
  }, [programa, resolucionId, open]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    onSave(form);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{programa ? 'Editar Programa' : 'Añadir Programa'}</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12}><TextField name="nombre" label="Nombre del Programa" fullWidth value={form.nombre} onChange={handleChange} /></Grid>
          <Grid item xs={12}><TextField name="codigo" label="Código del Programa" fullWidth value={form.codigo} onChange={handleChange} /></Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button onClick={handleSave} variant="contained">{programa ? 'Guardar Cambios' : 'Añadir'}</Button>
      </DialogActions>
    </Dialog>
  );
}
