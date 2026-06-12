import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, KeyRound, Moon, Sun } from 'lucide-react';
import authService from '../services/authService';
import { ThemeModeContext, UserContext, ActivePanelContext } from '../App';
import type { UserDetails } from '../api/types';

const GRUPOS_CFP = ['Admin', 'Secretaría', 'Regencia', 'Coordinación Docente', 'Docente', 'Preceptor', 'Bedel', 'Rector'];
const GRUPOS_TERCIARIO = ['Admin', 'Terciario', 'Rector'];

interface TopbarProps {
  title?: string;
}

export default function Topbar({ title }: TopbarProps) {
  const navigate = useNavigate();
  const { user } = useContext(UserContext);
  const { mode, toggleMode } = useContext(ThemeModeContext);
  const { activePanel } = useContext(ActivePanelContext);

  const tieneCFP = user && (user.is_superuser || user.is_staff || user.groups?.some(g => GRUPOS_CFP.includes(g)));
  const tieneTerciario = user && (user.is_superuser || user.is_staff || user.groups?.some(g => GRUPOS_TERCIARIO.includes(g)));
  const tieneVJ = user && (user.is_superuser || user.is_staff || user.groups?.includes("Videojuegos"));

  let areas = 0;
  if (tieneCFP) areas++;
  if (tieneTerciario) areas++;
  if (tieneVJ) areas++;
  const mostrarSelector = areas > 1;

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
        {mostrarSelector && (
          <div className="flex items-center bg-indigo-950/60 p-0.5 rounded-xl border border-indigo-500/20 mr-2 shadow-inner">
            {tieneCFP && (
              <button
                onClick={activePanel !== 'cfp' ? () => navigate('/dashboard') : undefined}
                className={activePanel === 'cfp'
                  ? "px-4 py-1.5 rounded-lg text-xs font-black bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 transition-all cursor-default"
                  : "px-4 py-1.5 rounded-lg text-xs font-bold text-indigo-300 hover:text-white transition-all hover:bg-white/5 active:scale-95"
                }
              >
                CFP
              </button>
            )}
            {tieneTerciario && (
              <button
                onClick={activePanel !== 'terciario' ? () => navigate('/admin-terciario') : undefined}
                className={activePanel === 'terciario'
                  ? "px-4 py-1.5 rounded-lg text-xs font-black bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 transition-all cursor-default"
                  : "px-4 py-1.5 rounded-lg text-xs font-bold text-indigo-300 hover:text-white transition-all hover:bg-white/5 active:scale-95"
                }
              >
                Terciario
              </button>
            )}
            {tieneVJ && (
              <button
                onClick={activePanel !== 'videojuegos' ? () => navigate('/admin-videojuegos') : undefined}
                className={activePanel === 'videojuegos'
                  ? "px-4 py-1.5 rounded-lg text-xs font-black bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 transition-all cursor-default"
                  : "px-4 py-1.5 rounded-lg text-xs font-bold text-indigo-300 hover:text-white transition-all hover:bg-white/5 active:scale-95"
                }
              >
                VJ
              </button>
            )}
          </div>
        )}
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
          onClick={toggleMode}
          className="p-2 text-indigo-300 hover:text-white hover:bg-white/10 rounded-full transition-colors"
          title={mode === 'dark' ? 'Cambiar a vista clara' : 'Cambiar a vista oscura'}
        >
          {mode === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>

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
