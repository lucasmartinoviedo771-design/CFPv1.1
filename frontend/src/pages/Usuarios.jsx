import React, { useEffect, useState, useContext } from 'react';
import api from '../api/client';
import UserFormDialog from '../components/UserFormDialog';
import { UserContext } from '../App';
import { Card, Button } from '../components/UI';
import { Edit2, Trash2, UserPlus, Users as UsersIcon, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';

export default function Usuarios() {
  const { user } = useContext(UserContext);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [feedback, setFeedback] = useState({ open: false, message: '', severity: 'success' });
  const [openDialog, setOpenDialog] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/users');
      setUsers(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error("Error fetching users:", err);
      setError('Error al cargar usuarios.');
      setFeedback({ open: true, message: 'Error al cargar usuarios', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && (user.is_superuser || user.groups.includes('Admin'))) {
      fetchUsers();
    }
  }, [user]);

  const handleAddUser = () => {
    setEditingUser(null);
    setOpenDialog(true);
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setOpenDialog(true);
  };

  const handleRegenerate = async (targetUser) => {
    if (window.confirm(`¿Regenerar contraseña para ${targetUser.username}?\n\nSeguridad: Esto creará una contraseña nueva aleatoria y se la enviará por correo. El usuario deberá cambiarla al ingresar.`)) {
      try {
        await api.post(`/users/${targetUser.id}/regenerate-password`);
        setFeedback({ open: true, message: 'Contraseña regenerada y enviada por correo', severity: 'success' });
        // remove alert quickly
        setTimeout(() => setFeedback({ ...feedback, open: false }), 4000);
      } catch (err) {
        console.error(err);
        setFeedback({ open: true, message: 'Error al regenerar contraseña. Verifique que tenga email.', severity: 'error' });
        setTimeout(() => setFeedback({ ...feedback, open: false }), 4000);
      }
    }
  }

  const handleDelete = async (userId) => {
    if (window.confirm('¿Está seguro de que desea eliminar este usuario?')) {
      try {
        await api.delete(`/users/${userId}`);
        setFeedback({ open: true, message: 'Usuario eliminado con éxito', severity: 'success' });
        fetchUsers();
      } catch (err) {
        setFeedback({ open: true, message: 'Error al eliminar usuario', severity: 'error' });
      }
    }
  };

  if (!user || (!user.is_superuser && !user.groups.includes('Admin'))) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-indigo-300 animate-fade-in-up">
        <AlertCircle size={48} className="text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-white">Acceso Denegado</h2>
        <p>No tienes permisos para ver esta página.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Gestión de Usuarios</h1>
          <p className="text-indigo-300">Administración de cuentas y permisos.</p>
        </div>
        <Button onClick={handleAddUser} className="bg-brand-accent hover:bg-orange-600 border-none shadow-lg" startIcon={<UserPlus size={18} />}>
          Agregar Usuario
        </Button>
      </div>

      {loading && <div className="text-center py-10 text-white">Cargando...</div>}

      {!loading && !error && (
        <Card className="bg-indigo-900/20 border-indigo-500/30 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-[#1e1b4b] text-indigo-300 uppercase text-xs">
                <tr>
                  <th className="px-6 py-3">ID</th>
                  <th className="px-6 py-3">Usuario</th>
                  <th className="px-6 py-3">Email</th>
                  <th className="px-6 py-3">Nombre</th>
                  <th className="px-6 py-3">Grupos</th>
                  <th className="px-6 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-indigo-500/10">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-3 text-indigo-400 font-mono">{u.id}</td>
                    <td className="px-6 py-3 font-medium text-white">{u.username}</td>
                    <td className="px-6 py-3 text-gray-300">{u.email}</td>
                    <td className="px-6 py-3 text-gray-300">{u.first_name} {u.last_name}</td>
                    <td className="px-6 py-3">
                      {u.is_superuser && (
                        <span className="px-2 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs mr-1 border border-purple-500/30">SuperAdmin</span>
                      )}
                      {u.groups && u.groups.map(g => (
                        <span key={g} className="px-2 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs mr-1">{g}</span>
                      ))}
                    </td>
                    <td className="px-6 py-3 text-right flex justify-end gap-2">
                      <button onClick={() => handleRegenerate(u)} title="Regenerar credenciales" className="p-1 text-yellow-400 hover:text-yellow-200 transition-colors"><RefreshCw size={16} /></button>
                      <button onClick={() => handleEdit(u)} className="p-1 text-indigo-400 hover:text-white transition-colors"><Edit2 size={16} /></button>
                      <button onClick={() => handleDelete(u.id)} className="p-1 text-red-400 hover:text-red-200 transition-colors"><Trash2 size={16} /></button>
                    </td>
                  </tr>
                ))}
              </tbody> (
            </table>
          </div>
        </Card>
      )}

      {/* Modal is handled inside this component or passed down props? The original imported UserFormDialog. */}
      {/* Note: I kept UserFormDialog usage, assuming I'll refactor it next. */}
      {openDialog && <UserFormDialog
        open={openDialog}
        onClose={() => { setOpenDialog(false); setEditingUser(null); }}
        user={editingUser}
        onSave={fetchUsers}
      />}

      {feedback.open && (
        <div className={`fixed bottom-4 right-4 p-4 rounded-lg shadow-xl border flex items-center gap-2 animate-fade-in z-50 ${feedback.severity === 'error' ? 'bg-red-900/90 border-red-500 text-white' : 'bg-green-900/90 border-green-500 text-white'}`}>
          {feedback.severity === 'error' ? <AlertCircle size={20} /> : <CheckCircle size={20} />}
          {feedback.message}
        </div>
      )}
    </div>
  );
}
