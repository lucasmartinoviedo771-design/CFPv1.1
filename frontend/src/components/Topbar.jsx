import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, User, KeyRound } from 'lucide-react';
import authService from '../services/authService';
import { UserContext } from '../App';

export default function Topbar({ title }) {
  const navigate = useNavigate();
  const { user } = useContext(UserContext);

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  return (
    <header className="bg-transparent border-b border-indigo-500/10 backdrop-blur-sm h-16 flex items-center justify-between px-6 z-20">
      <h2 className="text-xl font-bold text-white tracking-tight drop-shadow-md">
        {title}
      </h2>

      <div className="flex items-center gap-4">
        {/* User Info */}
        <div className="hidden md:flex flex-col items-end">
          <span className="text-sm font-medium text-white">
            {user?.username || 'Usuario'}
          </span>
          {Array.isArray(user?.groups) && user.groups.length > 0 && (
            <span className="text-xs text-brand-cyan">
              {user.groups[0]}
            </span>
          )}
        </div>

        {/* Change Password Button (Icon only on mobile) */}
        <button
          onClick={() => navigate('/set-password')}
          className="p-2 text-indigo-300 hover:text-white hover:bg-white/10 rounded-full transition-colors"
          title="Cambiar contraseña"
        >
          <KeyRound size={20} />
        </button>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="p-2 text-red-400 hover:text-red-200 hover:bg-red-500/10 rounded-full transition-colors"
          title="Cerrar Sessión"
        >
          <LogOut size={20} />
        </button>

        {/* Avatar */}
        <div className="h-10 w-10 rounded-full bg-gradient-to-r from-brand-accent to-purple-600 flex items-center justify-center text-white font-bold shadow-lg border border-white/20">
          {(user?.username || 'A').charAt(0).toUpperCase()}
        </div>
      </div>
    </header>
  );
}
