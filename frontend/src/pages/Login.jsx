import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import { UserContext } from '../App';
import { Button } from '../components/UI';
import { User, Lock, ArrowRight, Info, Eye, EyeOff } from 'lucide-react';

export default function Login() {
    const [username, setUsername] = useState('admin');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { setUser } = useContext(UserContext);

    const [showChoice, setShowChoice] = useState(false);
    const [pendingUser, setPendingUser] = useState(null);

    const GRUPOS_TERCIARIO = ['Admin', 'Terciario', 'Rector'];
    const GRUPOS_CFP = ['Admin', 'Secretaría', 'Regencia', 'Coordinación Docente', 'Docente', 'Preceptor', 'Bedel', 'Rector'];

    const resolveDestino = (userData) => {
        const groups = userData?.groups || [];
        const isSuperuser = userData?.is_superuser || userData?.is_staff;
        const isTerciario = isSuperuser || groups.some(g => GRUPOS_TERCIARIO.includes(g));
        const isCFP = isSuperuser || (groups.some(g => GRUPOS_CFP.includes(g)) && !groups.includes("Sin CFP"));
        if (isTerciario && !isCFP) return '/admin-terciario';
        if (isCFP && !isTerciario) return '/dashboard';
        if (isTerciario && isCFP) return null; // mostrar elección
        return '/dashboard';
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await authService.login(username, password);
            const userData = await authService.getUserDetails();
            setUser(userData);
            const destino = resolveDestino(userData);
            if (destino) {
                navigate(destino);
            } else {
                setPendingUser(userData);
                setShowChoice(true);
            }
        } catch (err) {
            const msg = err.response?.data?.detail || err.message || 'Credenciales inválidas';
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    if (showChoice) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-4">
                <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-3xl p-10 max-w-sm w-full text-center space-y-6">
                    <h2 className="text-2xl font-black text-white">¿Dónde querés ingresar?</h2>
                    <p className="text-indigo-200 text-sm">Tu usuario tiene acceso a ambos paneles.</p>
                    <div className="space-y-3">
                        <button onClick={() => navigate('/dashboard')}
                            className="w-full py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm transition-colors">
                            Panel CFP Malvinas Argentinas
                        </button>
                        <button onClick={() => navigate('/admin-terciario')}
                            className="w-full py-4 rounded-2xl font-bold text-sm transition-colors"
                            style={{ background: '#1a1f4e', color: '#f5c518' }}>
                            Panel Terciario — Politécnico
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 relative overflow-hidden">
            {/* Background decorations */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-indigo-500/10 blur-3xl"></div>
                <div className="absolute top-[30%] -right-[10%] w-[40%] h-[40%] rounded-full bg-purple-500/10 blur-3xl"></div>
            </div>

            <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
                <div className="flex justify-center mb-6">
                    <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
                        <span className="text-4xl font-bold text-white">CFP</span>
                    </div>
                </div>
                <h2 className="mt-2 text-center text-4xl font-extrabold text-white tracking-tight">
                    Gestión Académica
                </h2>
                <p className="mt-2 text-center text-sm text-indigo-200">
                    Centro de Formación Profesional Malvinas Argentinas
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
                <div className="bg-white/5 backdrop-blur-lg border border-white/10 py-8 px-4 shadow-2xl sm:rounded-2xl sm:px-10">
                    <form className="space-y-6" onSubmit={handleLogin}>
                        <div>
                            <label htmlFor="username" className="block text-sm font-medium text-gray-200">
                                Usuario
                            </label>
                            <div className="mt-1 relative rounded-md shadow-sm">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <User className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    id="username"
                                    name="username"
                                    type="text"
                                    required
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="block w-full pl-10 pr-3 py-3 border border-gray-600 rounded-xl leading-5 bg-gray-800/50 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-all"
                                    placeholder="Ingrese su usuario"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-200">
                                Contraseña
                            </label>
                            <div className="mt-1 relative rounded-md shadow-sm">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    id="password"
                                    name="password"
                                    type={showPassword ? "text" : "password"}
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="block w-full pl-10 pr-10 py-3 border border-gray-600 rounded-xl leading-5 bg-gray-800/50 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-all"
                                    placeholder="Ingrese su contraseña"
                                />
                                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="text-gray-400 hover:text-gray-200 focus:outline-none"
                                    >
                                        {showPassword ? (
                                            <EyeOff className="h-5 w-5" />
                                        ) : (
                                            <Eye className="h-5 w-5" />
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {error && (
                            <div className="rounded-md bg-red-500/10 border border-red-500/20 p-4">
                                <div className="flex">
                                    <div className="ml-3">
                                        <h3 className="text-sm font-medium text-red-200">Error</h3>
                                        <div className="mt-1 text-sm text-red-300">
                                            <p>{error}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div>
                            <Button
                                type="submit"
                                isLoading={loading}
                                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all hover:scale-[1.02]"
                            >
                                Ingresar <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </div>

                        <div className="mt-4 flex items-center justify-center space-x-2 text-xs text-indigo-200 bg-indigo-900/30 py-2 rounded-lg border border-indigo-500/20">
                            <Info size={14} />
                            <p>
                                Soporte: <span className="font-mono font-bold text-white">soporte@cfp.edu.ar</span>
                            </p>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
