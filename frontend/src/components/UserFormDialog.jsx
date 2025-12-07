import React, { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, Select, MenuItem, FormControl, InputLabel, Checkbox, ListItemText, Alert, FormHelperText } from '@mui/material';
import api from '../services/apiClient';

export default function UserFormDialog({ open, onClose, user, onSave }) {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    password: '',
    password2: '',
    groups: [],
  });
  const [availableGroups, setAvailableGroups] = useState([]);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || '',
        email: user.email || '',
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        password: '', // Password is never pre-filled for security
        password2: '',
        groups: user.groups || [],
      });
    } else {
      setFormData({
        username: '',
        email: '',
        first_name: '',
        last_name: '',
        password: '',
        password2: '',
        groups: [],
      });
    }
  }, [user, open]);

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const response = await api.get('/groups/'); // Assuming a /groups/ endpoint exists
        setAvailableGroups(response.data.results || response.data);
      } catch (err) {
        console.error("Error fetching groups:", err);
      }
    };
    fetchGroups();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const next = { ...prev, [name]: value };
      // Auto-sugerir username a partir del email si está vacío
      if (name === 'email' && (!prev.username || prev.username.trim() === '')) {
        const suggested = (value || '').split('@')[0] || '';
        next.username = suggested;
      }
      return next;
    });
    setErrors(prev => ({ ...prev, [name]: null })); // Clear error on change
  };

  const handleGroupChange = (e) => {
    const { value } = e.target;
    setFormData(prev => ({ ...prev, groups: value }));
  };

  const validateForm = () => {
    let newErrors = {};
    // Si el username está vacío, intentamos derivarlo del email
    if (!formData.username) {
      if (formData.email) {
        const fallback = formData.email.split('@')[0];
        setFormData(prev => ({ ...prev, username: fallback }));
      } else {
        newErrors.username = 'El nombre de usuario es requerido.';
      }
    }
    if (!formData.email) newErrors.email = 'El email es requerido.';
    if (!user && !formData.password) newErrors.password = 'La contraseña es requerida para nuevos usuarios.';
    if (formData.password && formData.password.length < 8) newErrors.password = 'La contraseña debe tener al menos 8 caracteres.';
    if (formData.password && formData.password !== formData.password2) newErrors.password2 = 'Las contraseñas no coinciden.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    const dataToSave = { ...formData };
    if (!dataToSave.password) {
      delete dataToSave.password;
      delete dataToSave.password2;
    }

    try {
      if (user) {
        // Update user
        await api.patch(`/users/${user.id}/`, dataToSave);
      } else {
        // Create new user
        await api.post('/users/', dataToSave);
      }
      onSave();
      onClose();
    } catch (err) {
      console.error("Error saving user:", err);
      if (err.response && err.response.data) {
        const server = err.response.data || {};
        setErrors(prev => ({ ...prev, ...server, general: buildErrorSummary(server) }));
      } else {
        setErrors({ general: 'Error al guardar el usuario.' });
      }
    }
  };

  function buildErrorSummary(obj) {
    try {
      const parts = [];
      for (const [k, v] of Object.entries(obj || {})) {
        if (k === 'non_field_errors') {
          parts.push(...(Array.isArray(v) ? v : [String(v)]));
        } else if (Array.isArray(v)) {
          parts.push(`${k}: ${v.join(', ')}`);
        } else if (typeof v === 'string') {
          parts.push(`${k}: ${v}`);
        }
      }
      return parts.join(' · ');
    } catch {
      return '';
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{user ? 'Editar Usuario' : 'Agregar Usuario'}</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          name="username"
          label="Nombre de Usuario"
          type="text"
          fullWidth
          variant="outlined"
          value={formData.username}
          onChange={handleChange}
          error={!!errors.username}
          helperText={errors.username}
          sx={{ mb: 2 }}
        />
        <TextField
          margin="dense"
          name="email"
          label="Email"
          type="email"
          fullWidth
          variant="outlined"
          value={formData.email}
          onChange={handleChange}
          error={!!errors.email}
          helperText={errors.email}
          sx={{ mb: 2 }}
        />
        <TextField
          margin="dense"
          name="first_name"
          label="Nombre"
          type="text"
          fullWidth
          variant="outlined"
          value={formData.first_name}
          onChange={handleChange}
          error={!!errors.first_name}
          helperText={errors.first_name}
          sx={{ mb: 2 }}
        />
        <TextField
          margin="dense"
          name="last_name"
          label="Apellido"
          type="text"
          fullWidth
          variant="outlined"
          value={formData.last_name}
          onChange={handleChange}
          error={!!errors.last_name}
          helperText={errors.last_name}
          sx={{ mb: 2 }}
        />
        <TextField
          margin="dense"
          name="password"
          label={user ? 'Nueva Contraseña (dejar vacío para no cambiar)' : 'Contraseña'}
          type="password"
          fullWidth
          variant="outlined"
          value={formData.password}
          onChange={handleChange}
          error={!!errors.password}
          helperText={errors.password}
          sx={{ mb: 2 }}
        />
        <TextField
          margin="dense"
          name="password2"
          label="Confirmar Contraseña"
          type="password"
          fullWidth
          variant="outlined"
          value={formData.password2}
          onChange={handleChange}
          error={!!errors.password2}
          helperText={errors.password2}
          sx={{ mb: 2 }}
        />
        <FormControl fullWidth margin="dense" variant="outlined" sx={{ mb: 2 }} error={!!errors.groups}>
          <InputLabel id="groups-label">Grupos</InputLabel>
          <Select
            labelId="groups-label"
            id="groups"
            multiple
            value={formData.groups}
            onChange={handleGroupChange}
            renderValue={(selected) => selected.join(', ')}
          >
            {availableGroups.map((group) => (
              <MenuItem key={group.id} value={group.name}>
                <Checkbox checked={formData.groups.indexOf(group.name) > -1} />
                <ListItemText primary={group.name} />
              </MenuItem>
            ))}
          </Select>
          {errors.groups && (
            <FormHelperText>{Array.isArray(errors.groups) ? errors.groups.join(', ') : String(errors.groups)}</FormHelperText>
          )}
        </FormControl>
        {errors.general && <Alert severity="error" sx={{ mt: 2 }}>{errors.general}</Alert>}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button onClick={handleSubmit} variant="contained">Guardar</Button>
      </DialogActions>
    </Dialog>
  );
}
