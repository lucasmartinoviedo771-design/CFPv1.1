import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Button, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, CircularProgress, Checkbox, Tooltip,
  Grid, Tabs, Tab, Select, MenuItem, FormControl, InputLabel, Snackbar, Alert, TextField
} from "@mui/material";
import FileUpload from "../components/FileUpload";
import ResultPanel from "../components/ResultPanel";
import { uploadFile } from "../services/uploadService";
import { listAsistencias, createAsistencia, updateAsistencia } from "../services/asistenciasService";
import api from '../services/apiClient';

function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index) {
  return {
    id: `simple-tab-${index}`,
    'aria-controls': `simple-tabpanel-${index}`,
  };
}

export default function Asistencia() {
  const [tabValue, setTabValue] = useState(0);
  const [uploadResult, setUploadResult] = useState(null);
  const [programas, setProgramas] = useState([]);
  const [cohortes, setCohortes] = useState([]);
  const [selectedCohorteId, setSelectedCohorteId] = useState('');
  const [bloques, setBloques] = useState([]);
  const [selectedProgramaId, setSelectedProgramaId] = useState('');
  const [selectedBloqueId, setSelectedBloqueId] = useState('');
  const [selectedClaseDate, setSelectedClaseDate] = useState('');
  const [students, setStudents] = useState([]);
  const [modulos, setModulos] = useState([]);
  const [attendanceGrid, setAttendanceGrid] = useState({});
  const [studentEnrolledModules, setStudentEnrolledModules] = useState({});
  const [loadingData, setLoadingData] = useState(false);
  const [feedback, setFeedback] = useState({ open: false, message: '', severity: 'success' });

  const fetchProgramas = useCallback(async () => {
    try {
      const { data } = await api.get('/programas');
      setProgramas(Array.isArray(data) ? data : []);
    } catch (error) {
      setFeedback({ open: true, message: 'Error al cargar programas.', severity: 'error' });
    }
  }, []);

  const fetchCohortes = useCallback(async (programaId) => {
    if (!programaId) return;
    try {
      const { data } = await api.get(`/inscripciones/cohortes`, { params: { programa_id: programaId } });
      setCohortes(Array.isArray(data) ? data : []);
    } catch (error) {
      setFeedback({ open: true, message: 'Error al cargar cohortes.', severity: 'error' });
    }
  }, []);

  const fetchBloques = useCallback(async (programaId) => {
    if (!programaId) return;
    try {
      const { data } = await api.get(`/bloques`, { params: { programa_id: programaId } });
      const bloquesData = Array.isArray(data) ? data : [];
      setBloques(bloquesData);
      if (bloquesData.length === 1) {
        setSelectedBloqueId(bloquesData[0].id);
      }
    } catch (error) {
      setFeedback({ open: true, message: 'Error al cargar bloques.', severity: 'error' });
    }
  }, []);

  const fetchStudentsAndModulos = useCallback(async (cohorteId, bloqueId, fecha) => {
    if (!cohorteId || !bloqueId || !fecha) return;
    setLoadingData(true);
    try {
      const [inscriptionsResponse, modulesRes, attendanceData] = await Promise.all([
        api.get(`/inscripciones`, { params: { cohorte_id: cohorteId } }),
        api.get(`/modulos`, { params: { bloque_id: bloqueId } }),
        listAsistencias({ bloque_id: bloqueId, fecha }),
      ]);

      const inscriptions = Array.isArray(inscriptionsResponse.data) ? inscriptionsResponse.data : [];
      const existingAttendance = Array.isArray(attendanceData) ? attendanceData : [];
      const modulosBloque = Array.isArray(modulesRes.data) ? modulesRes.data : [];

      const studentMap = new Map();
      const enrolledModulesMap = {};

      inscriptions
        .filter(insc => insc.modulo && insc.modulo.bloque_id === Number(bloqueId))
        .forEach(insc => {
          if (insc.estudiante && insc.modulo) {
            studentMap.set(insc.estudiante.id, insc.estudiante);
            if (!enrolledModulesMap[insc.estudiante.id]) {
              enrolledModulesMap[insc.estudiante.id] = [];
            }
            enrolledModulesMap[insc.estudiante.id].push(insc.modulo.id);
          }
        });

      const uniqueStudents = Array.from(studentMap.values());
      const uniqueModulos = modulosBloque;

      const grid = {};
      uniqueStudents.forEach(student => {
        grid[student.id] = {};
        uniqueModulos.forEach(mod => {
          grid[student.id][mod.id] = { status: 'none', id: null }; // none, present, absent
        });
      });

      existingAttendance.forEach(att => {
        if (grid[att.estudiante] && grid[att.estudiante][att.modulo]) {
          grid[att.estudiante][att.modulo] = { status: att.presente ? 'present' : 'absent', id: att.id };
        }
      });
      
      setStudents(uniqueStudents);
      setModulos(uniqueModulos);
      setStudentEnrolledModules(enrolledModulesMap);
      setAttendanceGrid(grid);

    } catch (error) {
      console.error("Error fetching students and modules:", error);
      setFeedback({ open: true, message: 'Error al cargar estudiantes y módulos.', severity: 'error' });
      setStudents([]);
      setModulos([]);
      setStudentEnrolledModules({});
      setAttendanceGrid({});
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => { fetchProgramas(); }, [fetchProgramas]);
  useEffect(() => { fetchCohortes(selectedProgramaId); }, [fetchCohortes, selectedProgramaId]);
  useEffect(() => { fetchBloques(selectedProgramaId); }, [fetchBloques, selectedProgramaId]);

  useEffect(() => {
    if (selectedCohorteId && selectedBloqueId && selectedClaseDate) {
      fetchStudentsAndModulos(selectedCohorteId, selectedBloqueId, selectedClaseDate);
    }
  }, [selectedCohorteId, selectedBloqueId, selectedClaseDate, fetchStudentsAndModulos]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleProgramaChange = (e) => {
    setSelectedProgramaId(e.target.value);
    setSelectedCohorteId('');
    setSelectedBloqueId('');
    setSelectedClaseDate('');
    setStudents([]);
    setModulos([]);
    setAttendanceGrid({});
    setStudentEnrolledModules({});
  };

  const handleCohorteChange = (e) => {
    setSelectedCohorteId(e.target.value);
    setSelectedBloqueId('');
    setSelectedClaseDate('');
    setStudents([]);
    setModulos([]);
    setAttendanceGrid({});
    setStudentEnrolledModules({});
  };

  const handleBloqueChange = (e) => {
    setSelectedBloqueId(e.target.value);
    setSelectedClaseDate('');
  };

  const handleClaseChange = (e) => {
    setSelectedClaseDate(e.target.value);
  };

  const handleStatusChange = (studentId, moduloId, newStatus) => {
    setAttendanceGrid(prevGrid => {
      const newGrid = { ...prevGrid };
      if (newGrid[studentId] && newGrid[studentId][moduloId]) {
        const current = newGrid[studentId][moduloId];
        const finalStatus = current.status === newStatus ? 'none' : newStatus;
        newGrid[studentId][moduloId] = { ...current, status: finalStatus };
      } else {
        console.error("Inconsistent state in handleStatusChange", { studentId, moduloId, prevGrid });
      }
      return newGrid;
    });
  };

  const handleSaveAttendance = async () => {
    setLoadingData(true);
    try {
      for (const studentId in attendanceGrid) {
        for (const moduloId in attendanceGrid[studentId]) {
          const { status, id } = attendanceGrid[studentId][moduloId];
          const isEnrolled = studentEnrolledModules[studentId]?.includes(parseInt(moduloId));

          if (!isEnrolled) continue;

          if (status === 'none' && id) {
            await api.delete(`/examenes/asistencias/${id}`);
          } else if (status === 'present' || status === 'absent') {
            const payload = { 
              estudiante: Number(studentId), 
              modulo: Number(moduloId), 
              fecha: selectedClaseDate, 
              presente: status === 'present' 
            };
            if (id) {
              await updateAsistencia(id, payload);
            } else {
              await createAsistencia(payload);
            }
          }
        }
      }
      setFeedback({ open: true, message: 'Asistencias guardadas con éxito', severity: 'success' });
      fetchStudentsAndModulos(selectedCohorteId, selectedBloqueId, selectedClaseDate);
    } catch (error) {
      const errorMsg = error.response?.data ? JSON.stringify(error.response.data) : error.message;
      setFeedback({ open: true, message: `Error al guardar asistencias: ${errorMsg}`, severity: 'error' });
    } finally {
      setLoadingData(false);
    }
  };

  const handleCloseFeedback = (event, reason) => {
    if (reason === 'clickaway') return;
    setFeedback({ ...feedback, open: false });
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="h4" gutterBottom>Gestión de Asistencias</Typography>

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="Asistencia tabs">
          <Tab label="Tomar Asistencia" {...a11yProps(0)} />
          <Tab label="Carga por Archivo" {...a11yProps(1)} />
        </Tabs>
      </Box>

      <TabPanel value={tabValue} index={0}>
        {programas.length > 0 && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Programa</InputLabel>
              <Select value={selectedProgramaId} label="Programa" onChange={handleProgramaChange}>
                <MenuItem value=""><em>Seleccionar Programa</em></MenuItem>
                {programas.map(p => (
                  <MenuItem key={p.id} value={p.id}>{p.nombre}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth disabled={!selectedProgramaId}>
              <InputLabel>Cohorte</InputLabel>
              <Select value={selectedCohorteId} label="Cohorte" onChange={handleCohorteChange}>
                <MenuItem value=""><em>Seleccionar Cohorte</em></MenuItem>
                {cohortes.map(c => (
                  <MenuItem key={c.id} value={c.id}>{c.nombre}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth disabled={!selectedProgramaId}>
              <InputLabel>Bloque</InputLabel>
              <Select value={selectedBloqueId} label="Bloque" onChange={handleBloqueChange}>
                <MenuItem value=""><em>Seleccionar Bloque</em></MenuItem>
                {bloques.map(b => (
                  <MenuItem key={b.id} value={b.id}>{b.nombre}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label="Fecha"
              type="date"
              value={selectedClaseDate}
              onChange={handleClaseChange}
              InputLabelProps={{ shrink: true }}
              disabled={!selectedCohorteId}
            />
          </Grid>
        </Grid>
        )}

        {loadingData ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>
        ) : (selectedBloqueId && students.length > 0 && modulos.length > 0 ? (
          <TableContainer component={Paper}>
            <Table size="small" sx={{ minWidth: 650 }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>Estudiante</TableCell>
                  {modulos.map(mod => (
                    <TableCell key={mod.id} align="center" sx={{ fontWeight: 'bold' }}>{mod.nombre}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {students.map(student => (
                  <TableRow key={student.id}>
                    <TableCell>{student.apellido}, {student.nombre}</TableCell>
                    {modulos.map(mod => {
                      const isEnrolled = studentEnrolledModules[student.id]?.includes(mod.id);
                      const status = attendanceGrid[student.id]?.[mod.id]?.status || 'none';
                      return (
                        <TableCell key={mod.id} align="center">
                          <Tooltip title="Presente">
                            <Checkbox
                              size="small"
                              checked={isEnrolled && status === 'present'}
                              disabled={!isEnrolled}
                              onChange={() => handleStatusChange(student.id, mod.id, 'present')}
                              sx={{ color: 'success.main', '&.Mui-checked': { color: 'success.main' } }}
                            />
                          </Tooltip>
                          <Tooltip title="Ausente">
                            <Checkbox
                              size="small"
                              checked={isEnrolled && status === 'absent'}
                              disabled={!isEnrolled}
                              onChange={() => handleStatusChange(student.id, mod.id, 'absent')}
                              sx={{ color: 'error.main', '&.Mui-checked': { color: 'error.main' } }}
                            />
                          </Tooltip>
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (selectedBloqueId && selectedClaseDate && <Typography sx={{ mt: 2 }}>No hay estudiantes inscriptos en módulos para este bloque.</Typography>))}

        {selectedBloqueId && students.length > 0 && modulos.length > 0 && (
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
            <Button variant="contained" onClick={handleSaveAttendance} disabled={loadingData}>Guardar Asistencias</Button>
          </Box>
        )}
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <FileUpload
          title="Cargar asistencia semanal (Moodle)"
          description={<>Nombre recomendado <b>SemanaYYYY-MM-DD.csv/xlsx</b>. Formato normalizado: <code>DNI, Módulo, Fecha, Presente</code>.</>}
          endpoint="/api/import-asistencia/"
          doUpload={(file, onProgress) => uploadFile("/api/import-asistencia/", file, onProgress)}
          onUpload={setUploadResult}
        />
        <ResultPanel result={uploadResult} />
      </TabPanel>

      <Snackbar open={feedback.open} autoHideDuration={6000} onClose={handleCloseFeedback} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert onClose={handleCloseFeedback} severity={feedback.severity} sx={{ width: '100%' }}>
          {feedback.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
