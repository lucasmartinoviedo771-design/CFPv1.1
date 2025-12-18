import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button
} from '@mui/material';

export default function BloqueFormDialog({ open, onClose, onSave, bloque }) {
  const [form, setForm] = useState({ nombre: '', descripcion: '' });

  useEffect(() => {
    if (bloque) {
      setForm({ nombre: bloque.nombre, descripcion: bloque.descripcion || '' });
    } else {
      setForm({ nombre: '', descripcion: '' });
    }
  }, [bloque, open]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    // Validar campos
    if (!form.nombre) {
      alert('Por favor ingresa un nombre para la plantilla de calendario');
      return;
    }
    console.log('Enviando datos:', form);
    onSave(form);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{bloque ? 'Editar Plantilla de Calendario' : 'Añadir Plantilla de Calendario'}</DialogTitle>
      <DialogContent sx={{ pt: '20px !important' }}>
        <TextField autoFocus margin="dense" name="nombre" label="Nombre de la Plantilla" type="text" fullWidth variant="outlined" value={form.nombre} onChange={handleChange} sx={{ mb: 2 }} placeholder="Ej: Estándar 8 semanas" />
        <TextField margin="dense" name="descripcion" label="Descripción (opcional)" type="text" fullWidth variant="outlined" multiline rows={3} value={form.descripcion} onChange={handleChange} placeholder="Describe la secuencia de semanas..." />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button onClick={handleSave} variant="contained">{bloque ? 'Guardar Cambios' : 'Crear'}</Button>
      </DialogActions>
    </Dialog>
  );
}
