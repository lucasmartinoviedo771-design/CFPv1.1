import React, { useState, useEffect, createContext } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { ThemeProvider, CircularProgress, Box } from "@mui/material";
import theme from "./theme";
import AppLayout from "./layout/AppLayout";

// Page Components
import Landing from "./pages/Landing";
import Asistencia from "./pages/Asistencia";
import Estudiantes from "./pages/Estudiantes.jsx";
import Notas from "./pages/Notas.jsx";
import CursoDetail from "./pages/CursoDetail";
import DashboardPage from "./pages/Dashboard"; // Check extension if needed, safe to add .jsx if it is jsx
import Login from "./pages/Login";
import SetPassword from './pages/SetPassword.jsx';
import Inscripciones from './pages/Inscripciones.jsx';
import Programas from './pages/Programas'; // Still .tsx based on file list
import Estructura from './pages/Estructura'; // Still .jsx based on file list
import Calendario from './pages/Calendario';
import Cohortes from './pages/Cohortes';
import HorariosCursada from './pages/HorariosCursada';
import HistoricoCursos from './pages/HistoricoCursos';
import HistoricoEstudiante from './pages/HistoricoEstudiante.jsx';
import GraficoCursos from './pages/GraficoCursos';
import Egresados from './pages/Egresados.jsx';
import Usuarios from './pages/Usuarios.jsx';
import Resoluciones from './pages/Resoluciones';
import PreinscripcionPublica from './pages/PreinscripcionPublica.jsx';
import PreinscripcionTerciario from './pages/PreinscripcionTerciario.jsx';
import PreinscripcionVideojuegos from './pages/PreinscripcionVideojuegos.jsx';
import GestionPreinscripciones from './pages/GestionPreinscripciones';
import GestionPreinscripcionesTerciario from './pages/GestionPreinscripcionesTerciario';
import GestionPreinscripcionesVideojuegos from './pages/GestionPreinscripcionesVideojuegos.jsx';
import AdminTerciario from './pages/AdminTerciario';
import AutorizacionParental from './pages/AutorizacionParental';
import NivelacionDigital from './pages/NivelacionDigital';

// Services
import authService from "./services/authService";
import type { UserDetails } from "./api/types";

export interface ThemeModeContextType {
  mode: "light" | "dark";
  toggleMode: () => void;
}

export interface UserContextType {
  user: UserDetails | null;
  setUser: React.Dispatch<React.SetStateAction<UserDetails | null>>;
}

export interface ActivePanelContextType {
  activePanel: "cfp" | "terciario" | "videojuegos";
  setActivePanel: React.Dispatch<React.SetStateAction<"cfp" | "terciario" | "videojuegos">>;
}

export const UserContext = createContext<UserContextType>({
  user: null,
  setUser: () => {},
});

export const ThemeModeContext = createContext<ThemeModeContextType>({
  mode: "dark",
  toggleMode: () => { },
});

export const ActivePanelContext = createContext<ActivePanelContextType>({
  activePanel: "cfp",
  setActivePanel: () => {},
});

const THEME_STORAGE_KEY = "cfp_theme_mode";

// PrivateRoute component
interface PrivateRouteProps {
  children: React.ReactNode;
}

const PrivateRoute = ({ children }: PrivateRouteProps) => {
  const isAuthenticated = authService.isLoggedIn();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

// Layout wrapper helper
interface WithLayoutProps {
  title: string;
  children: React.ReactNode;
}

const WithLayout = ({ title, children }: WithLayoutProps) => (
  <AppLayout title={title}>{children}</AppLayout>
);

export default function App() {
  const [user, setUser] = useState<UserDetails | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [themeMode, setThemeMode] = useState<"light" | "dark">((() => {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    return saved === "light" ? "light" : "dark";
  }) as () => "light" | "dark");
  const [activePanel, setActivePanel] = useState<"cfp" | "terciario" | "videojuegos">("cfp");
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname;
    if (path.startsWith('/admin-terciario')) {
      setActivePanel('terciario');
    } else if (path.startsWith('/admin-videojuegos')) {
      setActivePanel('videojuegos');
    } else {
      setActivePanel('cfp');
    }
  }, [location.pathname]);

  useEffect(() => {
    const init = async () => {
      try {
        // Intenta refrescar el token via cookie (silencioso)
        await authService.refresh().catch(() => null);
        const me = await authService.getUserDetails();
        if (me) {
          setUser(me);
          sessionStorage.setItem('cfp_session', '1');
        } else {
          sessionStorage.removeItem('cfp_session');
        }
      } catch (e) {
        sessionStorage.removeItem('cfp_session');
      } finally {
        setInitializing(false);
      }
    };
    init();
  }, []);

  useEffect(() => {
    localStorage.setItem(THEME_STORAGE_KEY, themeMode);
  }, [themeMode]);

  const toggleThemeMode = () => {
    setThemeMode((prev) => (prev === "dark" ? "light" : "dark"));
  };

  if (initializing) {
    return (
      <ThemeProvider theme={theme}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
          <CircularProgress />
        </Box>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <ThemeModeContext.Provider value={{ mode: themeMode, toggleMode: toggleThemeMode }}>
        <ActivePanelContext.Provider value={{ activePanel, setActivePanel }}>
          <UserContext.Provider value={{ user, setUser }}>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/preinscripcion" element={<PreinscripcionPublica />} />
            <Route path="/preinscripcion-terciario" element={<PreinscripcionTerciario />} />
            <Route path="/preinscripcion-videojuegos" element={<PreinscripcionVideojuegos />} />
            <Route path="/autorizar/:token" element={<AutorizacionParental />} />
            <Route path="/nivelacion/:token" element={<NivelacionDigital />} />

            <Route path="/admin-terciario" element={<PrivateRoute><AdminTerciario /></PrivateRoute>} />

            {/* Protected Routes */}
            <Route path="/set-password" element={<PrivateRoute><WithLayout title="Actualizar Contraseña"><SetPassword /></WithLayout></PrivateRoute>} />
            <Route path="/dashboard" element={<PrivateRoute><WithLayout title="Dashboard"><DashboardPage /></WithLayout></PrivateRoute>} />
            <Route path="/estudiantes" element={<PrivateRoute><WithLayout title="Estudiantes"><Estudiantes /></WithLayout></PrivateRoute>} />
            <Route path="/gestion-preinscripciones" element={<PrivateRoute><WithLayout title="Preinscripciones CFP"><GestionPreinscripciones /></WithLayout></PrivateRoute>} />
            <Route path="/preinscripciones-terciario" element={<PrivateRoute><WithLayout title="Preinscripciones Terciario"><GestionPreinscripcionesTerciario /></WithLayout></PrivateRoute>} />
            <Route path="/admin-videojuegos" element={<PrivateRoute><GestionPreinscripcionesVideojuegos /></PrivateRoute>} />
            <Route path="/asistencia" element={<PrivateRoute><WithLayout title="Asistencia"><Asistencia /></WithLayout></PrivateRoute>} />
            <Route path="/notas" element={<PrivateRoute><WithLayout title="Notas / Equivalencias"><Notas /></WithLayout></PrivateRoute>} />
            <Route path="/cursos/:id" element={<PrivateRoute><WithLayout title="Detalle del Curso"><CursoDetail /></WithLayout></PrivateRoute>} />
            <Route path="/inscripciones" element={<PrivateRoute><WithLayout title="Inscripciones"><Inscripciones /></WithLayout></PrivateRoute>} />
            <Route path="/programas" element={<PrivateRoute><WithLayout title="Programas"><Programas /></WithLayout></PrivateRoute>} />
            <Route path="/estructura" element={<PrivateRoute><WithLayout title="Estructura Académica"><Estructura /></WithLayout></PrivateRoute>} />
            <Route path="/calendario" element={<PrivateRoute><WithLayout title="Calendario Académico"><Calendario /></WithLayout></PrivateRoute>} />
            <Route path="/cohortes" element={<PrivateRoute><WithLayout title="Cohortes"><Cohortes /></WithLayout></PrivateRoute>} />
            <Route path="/horarios-cursada" element={<PrivateRoute><WithLayout title="Horarios de Cursada"><HorariosCursada /></WithLayout></PrivateRoute>} />
            <Route path="/historico-cursos" element={<PrivateRoute><WithLayout title="Histórico por Cursos"><HistoricoCursos /></WithLayout></PrivateRoute>} />
            <Route path="/historico-estudiante" element={<PrivateRoute><WithLayout title="Histórico por Estudiante"><HistoricoEstudiante /></WithLayout></PrivateRoute>} />
            <Route path="/grafico-cursos" element={<PrivateRoute><WithLayout title="Gráfico de Cursos"><GraficoCursos /></WithLayout></PrivateRoute>} />
            <Route path="/egresados" element={<PrivateRoute><WithLayout title="Egresados"><Egresados /></WithLayout></PrivateRoute>} />
            <Route path="/usuarios" element={<PrivateRoute><WithLayout title="Usuarios"><Usuarios /></WithLayout></PrivateRoute>} />
            <Route path="/resoluciones" element={<PrivateRoute><WithLayout title="Resoluciones"><Resoluciones /></WithLayout></PrivateRoute>} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          </UserContext.Provider>
        </ActivePanelContext.Provider>
      </ThemeModeContext.Provider>
    </ThemeProvider>
  );
}
