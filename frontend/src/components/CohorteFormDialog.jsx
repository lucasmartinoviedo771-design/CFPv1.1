import React, { useEffect, useMemo, useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, Select, MenuItem, FormControl, InputLabel, Button
} from '@mui/material';

export default function CohorteFormDialog({
  open,
  onClose,
  onSave,
  programas,
  calendarios,
  bloquesPrograma,
  existingNames = [],
  cohorte,
}) {
  const [form, setForm] = useState({ nombre: '', programa: '', bloque: '', bloque_fechas: '', fecha_inicio: '' });

  useEffect(() => {
    if (open) {
      setForm({
        nombre: cohorte?.nombre || '',
        programa: cohorte?.programa_id || '',
        bloque: cohorte?.bloque_id || '',
        bloque_fechas: cohorte?.bloque_fechas_id || '',
        fecha_inicio: cohorte?.fecha_inicio || '',
      });
    }
  }, [open, cohorte]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => {
      if (name === "programa") {
        return { ...prev, programa: value, bloque: "" };
      }
      return { ...prev, [name]: value };
    });
  };

  const selectedCalendario = useMemo(
    () => calendarios.find((b) => String(b.id) === String(form.bloque_fechas)),
    [calendarios, form.bloque_fechas]
  );

  const totalSemanas = selectedCalendario?.semanas_config?.length || 0;
  const nombresSugeridos = Array.from(new Set((existingNames || []).filter(Boolean)));
  const bloquesFiltrados = useMemo(() => {
    if (!form.programa) return bloquesPrograma;
    return bloquesPrograma.filter((b) => String(b.programa_id) === String(form.programa));
  }, [bloquesPrograma, form.programa]);

  const handleSave = () => {
    onSave(form);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{cohorte ? 'Editar Cohorte' : 'Crear Nueva Cohorte'}</DialogTitle>
      <DialogContent sx={{ pt: '20px !important' }}>
        <TextField
          autoFocus
          margin="dense"
          name="nombre"
          label="Nombre de la Cohorte (ej. 1° Cohorte 2026)"
          type="text"
          fullWidth
          variant="outlined"
          value={form.nombre}
          onChange={handleChange}
          sx={{ mb: 2 }}
          inputProps={{ list: "cohorte-name-suggestions" }}
        />
        <datalist id="cohorte-name-suggestions">
          {nombresSugeridos.map((name) => <option key={name} value={name} />)}
        </datalist>

        <TextField margin="dense" name="fecha_inicio" label="Fecha Inicio (Semana 1)" type="date" fullWidth variant="outlined" value={form.fecha_inicio} onChange={handleChange} InputLabelProps={{ shrink: true }} sx={{ mb: 2 }}/>
        <FormControl fullWidth margin="dense" sx={{ mb: 2 }}>
          <InputLabel>Programa</InputLabel>
          <Select name="programa" value={form.programa} label="Programa" onChange={handleChange}>
            {programas.map(p => <MenuItem key={p.id} value={p.id}>{p.nombre}</MenuItem>)}
          </Select>
        </FormControl>

        <FormControl fullWidth margin="dense" sx={{ mb: 2 }}>
          <InputLabel>Bloque</InputLabel>
          <Select name="bloque" value={form.bloque} label="Bloque" onChange={handleChange}>
            {bloquesFiltrados.map(b => <MenuItem key={b.id} value={b.id}>{b.nombre}</MenuItem>)}
          </Select>
        </FormControl>

        <FormControl fullWidth margin="dense">
          <InputLabel>Calendario</InputLabel>
          <Select name="bloque_fechas" value={form.bloque_fechas} label="Calendario" onChange={handleChange}>
            {calendarios.map(b => <MenuItem key={b.id} value={b.id}>{b.nombre}</MenuItem>)}
          </Select>
        </FormControl>
        <TextField
          margin="dense"
          label="Semanas de plantilla"
          fullWidth
          value={totalSemanas ? `${totalSemanas} semanas` : 'Sin secuencia'}
          InputProps={{ readOnly: true }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button onClick={handleSave} variant="contained">{cohorte ? 'Guardar' : 'Crear'}</Button>
      </DialogActions>
    </Dialog>
  );
}
