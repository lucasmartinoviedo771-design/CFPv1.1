import React, { useState, useEffect } from 'react';
import api from '../services/apiClient';
import { Button, Input } from './UI';
import { Shield, AlertCircle } from 'lucide-react';

// Custom Modal Component (Reused logic pattern)
const Modal = ({ isOpen, onClose, title, children, actions }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#1e1b4b] border border-indigo-500/30 rounded-xl shadow-2xl w-full max-w-md flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-indigo-500/20"><h3 className="text-xl font-bold text-white">{title}</h3></div>
        <div className="p-6 overflow-y-auto flex-1 text-gray-200 space-y-4">{children}</div>
        <div className="p-4 border-t border-indigo-500/20 flex justify-end gap-3 bg-indigo-950/30 rounded-b-xl">{actions}</div>
      </div>
    </div>
  );
};

export default function UserFormDialog({ open, onClose, user, onSave }) {
  const [formData, setFormData] = useState({
    username: '', email: '', first_name: '', last_name: '', password: '', password2: '', groups: [],
  });
  const [availableGroups, setAvailableGroups] = useState([]);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || '', email: user.email || '', first_name: user.first_name || '', last_name: user.last_name || '',
        password: '', password2: '', groups: user.groups || [],
      });
    } else {
      setFormData({ username: '', email: '', first_name: '', last_name: '', password: '', password2: '', groups: [] });
    }
    setErrors({});
  }, [user, open]);

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const response = await api.get('/groups/');
        setAvailableGroups(response.data.results || response.data);
      } catch (err) { console.error(err); }
    };
    fetchGroups();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const next = { ...prev, [name]: value };
      if (name === 'email' && (!prev.username || prev.username.trim() === '')) {
        next.username = (value || '').split('@')[0] || '';
      }
      return next;
    });
    setErrors(prev => ({ ...prev, [name]: null }));
  };

  const handleGroupToggle = (groupName) => {
    setFormData(prev => {
      const groups = prev.groups.includes(groupName)
        ? prev.groups.filter(g => g !== groupName)
        : [...prev.groups, groupName];
      return { ...prev, groups };
    });
  };

  const validateForm = () => {
    let newErrors = {};
    if (!formData.username) newErrors.username = 'El usuario es requerido';
    if (!formData.email) newErrors.email = 'El email es requerido';
    if (!user && !formData.password) newErrors.password = 'Contraseña requerida';
    if (formData.password && formData.password.length < 8) newErrors.password = 'Min 8 caracteres';
    if (formData.password !== formData.password2) newErrors.password2 = 'No coinciden';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    const dataToSave = { ...formData };
    if (!dataToSave.password) { delete dataToSave.password; delete dataToSave.password2; }

    try {
      if (user) await api.patch(`/users/${user.id}/`, dataToSave);
      else await api.post('/users/', dataToSave);
      onSave();
      onClose();
    } catch (err) {
      if (err.response?.data) {
        setErrors({ ...err.response.data, general: JSON.stringify(err.response.data) });
      } else {
        setErrors({ general: 'Error al guardar.' });
      }
    }
  };

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title={user ? 'Editar Usuario' : 'Nuevo Usuario'}
      actions={<><Button variant="ghost" onClick={onClose}>Cancelar</Button><Button onClick={handleSubmit}>Guardar</Button></>}
    >
      <Input name="username" label="Usuario" value={formData.username} onChange={handleChange} />
      {errors.username && <p className="text-red-400 text-xs mt-1">{errors.username}</p>}

      <Input name="email" label="Email" type="email" value={formData.email} onChange={handleChange} />
      {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}

      <div className="grid grid-cols-2 gap-4">
        <Input name="first_name" label="Nombre" value={formData.first_name} onChange={handleChange} />
        <Input name="last_name" label="Apellido" value={formData.last_name} onChange={handleChange} />
      </div>

      <div className="border-t border-indigo-500/20 pt-4 mt-2">
        <Input name="password" label={user ? "Nueva Contraseña (opcional)" : "Contraseña"} type="password" value={formData.password} onChange={handleChange} />
        {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password}</p>}

        <Input name="password2" label="Confirmar Contraseña" type="password" value={formData.password2} onChange={handleChange} />
        {errors.password2 && <p className="text-red-400 text-xs mt-1">{errors.password2}</p>}
      </div>

      <div className="mt-4">
        <label className="text-sm font-medium text-indigo-300 mb-2 block flex items-center gap-2">
          <Shield size={14} /> Grupos / Permisos
        </label>
        <div className="bg-indigo-950/30 p-3 rounded-lg border border-indigo-500/20 max-h-32 overflow-y-auto space-y-2">
          {availableGroups.map((group) => (
            <label key={group.id} className="flex items-center gap-2 cursor-pointer hover:bg-white/5 p-1 rounded">
              <input
                type="checkbox"
                className="rounded bg-indigo-900 border-indigo-500 text-brand-accent focus:ring-brand-accent/50"
                checked={formData.groups.includes(group.name)}
                onChange={() => handleGroupToggle(group.name)}
              />
              <span className="text-sm text-gray-300">{group.name}</span>
            </label>
          ))}
          {availableGroups.length === 0 && <p className="text-xs text-gray-500 text-center">No hay grupos disponibles</p>}
        </div>
      </div>

      {errors.general && (
        <div className="flex items-start gap-2 text-red-400 bg-red-900/20 p-3 rounded text-sm mt-2 border border-red-500/20">
          <AlertCircle size={16} className="mt-0.5 min-w-[16px]" />
          <span className="break-all">{errors.general}</span>
        </div>
      )}
    </Modal>
  );
}
