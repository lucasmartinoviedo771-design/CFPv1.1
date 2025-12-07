import React, { useState, useEffect, createContext } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider, CircularProgress, Box } from "@mui/material";
import theme from "./theme";
import AppLayout from "./layout/AppLayout";

// Page Components
import Asistencia from "./pages/Asistencia";
import Estudiantes from "./pages/Estudiantes";
import Notas from "./pages/Notas";
import CursoDetail from "./pages/CursoDetail";
import DashboardPage from "./pages/Dashboard";
import Login from "./pages/Login";
import SetPassword from './pages/SetPassword';
import Inscripciones from './pages/Inscripciones';
import Programas from './pages/Programas';
import Estructura from './pages/Estructura';
import Calendario from './pages/Calendario';
import Cohortes from './pages/Cohortes';
import HistoricoCursos from './pages/HistoricoCursos';
import HistoricoEstudiante from './pages/HistoricoEstudiante';
import GraficoCursos from './pages/GraficoCursos';
import Egresados from './pages/Egresados';
import Usuarios from './pages/Usuarios';

// Services
import authService from "./services/authService";

// Create a UserContext
export const UserContext = createContext(null);

// PrivateRoute component
const PrivateRoute = ({ children }) => {
  const isAuthenticated = authService.getAccessToken();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

// Layout wrapper helper
const WithLayout = ({ title, children }) => (
  <AppLayout title={title}>{children}</AppLayout>
);

export default function App() {
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        const access = authService.getAccessToken();
        const refresh = authService.getRefreshToken();
        if (!access && refresh) {
          await authService.refresh(refresh);
        }
        const accessNow = authService.getAccessToken();
        if (accessNow) {
          const me = await authService.getUserDetails();
          if (me) setUser(me);
        }
      } catch (e) {
        // ignore; interceptor will handle redirects on 401
      } finally {
        setInitializing(false);
      }
    };
    init();
  }, []);

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
      <UserContext.Provider value={{ user, setUser }}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          {/* Protected Routes */}
          <Route path="/set-password" element={<PrivateRoute><WithLayout title="Actualizar Contraseña"><SetPassword /></WithLayout></PrivateRoute>} />
          <Route path="/dashboard" element={<PrivateRoute><WithLayout title="Dashboard"><DashboardPage /></WithLayout></PrivateRoute>} />
          <Route path="/estudiantes" element={<PrivateRoute><WithLayout title="Estudiantes"><Estudiantes /></WithLayout></PrivateRoute>} />
          <Route path="/asistencia" element={<PrivateRoute><WithLayout title="Asistencia"><Asistencia /></WithLayout></PrivateRoute>} />
          <Route path="/notas" element={<PrivateRoute><WithLayout title="Notas / Equivalencias"><Notas /></WithLayout></PrivateRoute>} />
          <Route path="/cursos/:id" element={<PrivateRoute><WithLayout title="Detalle del Curso"><CursoDetail /></WithLayout></PrivateRoute>} />
          <Route path="/inscripciones" element={<PrivateRoute><WithLayout title="Inscripciones"><Inscripciones /></WithLayout></PrivateRoute>} />
          <Route path="/programas" element={<PrivateRoute><WithLayout title="Programas"><Programas /></WithLayout></PrivateRoute>} />
          <Route path="/estructura" element={<PrivateRoute><WithLayout title="Estructura Académica"><Estructura /></WithLayout></PrivateRoute>} />
          <Route path="/calendario" element={<PrivateRoute><WithLayout title="Calendario Académico"><Calendario /></WithLayout></PrivateRoute>} />
          <Route path="/cohortes" element={<PrivateRoute><WithLayout title="Cohortes"><Cohortes /></WithLayout></PrivateRoute>} />
          <Route path="/historico-cursos" element={<PrivateRoute><WithLayout title="Histórico por Cursos"><HistoricoCursos /></WithLayout></PrivateRoute>} />
          <Route path="/historico-estudiante" element={<PrivateRoute><WithLayout title="Histórico por Estudiante"><HistoricoEstudiante /></WithLayout></PrivateRoute>} />
          <Route path="/grafico-cursos" element={<PrivateRoute><WithLayout title="Gráfico de Cursos"><GraficoCursos /></WithLayout></PrivateRoute>} />
          <Route path="/egresados" element={<PrivateRoute><WithLayout title="Egresados"><Egresados /></WithLayout></PrivateRoute>} />
          <Route path="/usuarios" element={<PrivateRoute><WithLayout title="Usuarios"><Usuarios /></WithLayout></PrivateRoute>} />

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </UserContext.Provider>
    </ThemeProvider>
  );
}
