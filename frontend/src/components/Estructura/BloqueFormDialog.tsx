import React, { useEffect, useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Grid, TextField, Button, Checkbox, FormControl, InputLabel, Select, MenuItem, SelectChangeEvent
} from '@mui/material';
import { BloqueForm, BloqueEstructura, initialBloqueFormState } from './types';

export interface BloqueFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (form: BloqueForm) => void;
  bloque: BloqueForm | null;
  programaId: number | null;
  availableBloques: BloqueEstructura[];
}

export default function BloqueFormDialog({ open, onClose, onSave, bloque, programaId, availableBloques = [] }: BloqueFormDialogProps) {
  const [form, setForm] = useState<BloqueForm>(initialBloqueFormState);

  useEffect(() => {
    if (bloque) {
      setForm({
        ...initialBloqueFormState,
        ...bloque,
        programa_id: bloque.programa_id || programaId,
        correlativas_ids: Array.isArray(bloque.correlativas_ids) ? bloque.correlativas_ids : [],
      });
    } else {
      setForm({ ...initialBloqueFormState, programa_id: programaId });
    }
  }, [bloque, programaId, open]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent<number[]>) => {
    const { name, value } = e.target;
    if (name === 'correlativas_ids') {
      const list = Array.isArray(value) ? value : [];
      setForm(prev => ({ ...prev, correlativas_ids: list.map((id) => Number(id)) }));
      return;
    }
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    onSave(form);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{bloque ? 'Editar Bloque' : 'Añadir Bloque'}</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12}><TextField name="nombre" label="Nombre del Bloque" fullWidth value={form.nombre} onChange={handleChange} /></Grid>
          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel id="correlativas-label">Correlativas (requisitos previos)</InputLabel>
              <Select<number[]>
                labelId="correlativas-label"
                multiple
                name="correlativas_ids"
                value={Array.isArray(form.correlativas_ids) ? form.correlativas_ids : []}
                label="Correlativas (requisitos previos)"
                onChange={handleChange}
                renderValue={(selected) => {
                  const selectedSet = new Set(selected.map((id) => Number(id)));
                  return availableBloques
                    .filter((b) => selectedSet.has(Number(b.id)))
                    .map((b) => b.nombre)
                    .join(', ');
                }}
              >
                {availableBloques
                  .filter((b) => Number(b.id) !== Number(form.id))
                  .map((b) => (
                    <MenuItem key={b.id} value={b.id}>
                      <Checkbox checked={(form.correlativas_ids || []).includes(Number(b.id))} />
                      {b.nombre}
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button onClick={handleSave} variant="contained">{bloque ? 'Guardar Cambios' : 'Añadir'}</Button>
      </DialogActions>
    </Dialog>
  );
}
