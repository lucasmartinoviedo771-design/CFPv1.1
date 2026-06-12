import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box, Typography, Button, CircularProgress, Paper,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Snackbar, Alert, TablePagination, Tooltip, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import api from '../api/client';
import CohorteFormDialog from '../components/CohorteFormDialog';
import { formatDateDisplay } from '../utils/dateFormat';
import { Select as AppSelect } from '../components/UI';
import { Programa, Cohorte, Bloque, Modulo, Inscripcion } from '../api/types';
import axios from 'axios';

interface Calendario {
  id: number;
  nombre: string;
  descripcion?: string | null;
}

interface DetalleModuloStats {
  total: number;
  activos: number;
  pausados: number;
  egresados: number;
  baja: number;
}

interface DetalleModulo extends Modulo {
  stats: DetalleModuloStats;
}

interface FeedbackState {
  open: boolean;
  message: string;
  severity: 'success' | 'error';
}

interface SaveFormData {
  nombre: string;
  programa: string | number;
  bloque: string | number;
  bloque_fechas: string | number;
  fecha_inicio: string;
}

export default function Cohortes() {
  const [cohortes, setCohortes] = useState<Cohorte[]>([]);
  const [programas, setProgramas] = useState<Programa[]>([]);
  const [calendarios, setCalendarios] = useState<Calendario[]>([]);
  const [bloquesPrograma, setBloquesPrograma] = useState<Bloque[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [openDialog, setOpenDialog] = useState<boolean>(false);
  const [currentCohorte, setCurrentCohorte] = useState<Cohorte | null>(null);
  const [feedback, setFeedback] = useState<FeedbackState>({ open: false, message: '', severity: 'success' });
  const [page, setPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(25);
  const [filterProgramaId, setFilterProgramaId] = useState<string>('');
  const [filterBloqueId, setFilterBloqueId] = useState<string>('');
  const [filterCohorteNombre, setFilterCohorteNombre] = useState<string>('');
  const [filterInicio, setFilterInicio] = useState<string>('');
  const [openDetalle, setOpenDetalle] = useState<boolean>(false);
  const [detalleCohorte, setDetalleCohorte] = useState<Cohorte | null>(null);
  const [detalleModulos, setDetalleModulos] = useState<DetalleModulo[]>([]);
  const [detalleLoading, setDetalleLoading] = useState<boolean>(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [cohortesRes, programasRes, calendariosRes, bloquesRes] = await Promise.all([
        api.get<Cohorte[]>('/inscripciones/cohortes', { params: { programa_id: undefined } }),
        api.get<Programa[]>('/programas'),
        api.get<Calendario[] | { results?: Calendario[] }>('/bloques-de-fechas'),
        api.get<Bloque[]>('/bloques'),
      ]);
      const cohortesData = Array.isArray(cohortesRes.data) ? cohortesRes.data : [];
      setCohortes(cohortesData);
      setProgramas(Array.isArray(programasRes.data) ? programasRes.data : []);

      const calendariosData = calendariosRes.data;
      const calendariosArr = Array.isArray(calendariosData)
        ? calendariosData
        : Array.isArray((calendariosData as { results?: Calendario[] })?.results)
          ? ((calendariosData as { results?: Calendario[] })?.results as Calendario[])
          : [];
      setCalendarios(calendariosArr);
      setBloquesPrograma(Array.isArray(bloquesRes.data) ? bloquesRes.data : []);
    } catch (error: unknown) {
      console.error("Error fetching data:", error);
      setFeedback({ open: true, message: 'Error al cargar los datos.', severity: 'error' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSave = async (formData: SaveFormData) => {
    try {
      if (!formData.nombre || !formData.programa || !formData.bloque_fechas || !formData.fecha_inicio) {
        setFeedback({ open: true, message: 'Completa nombre, fecha, programa, bloque y calendario.', severity: 'error' });
        return;
      }
      const payload = {
        nombre: formData.nombre,
        programa_id: Number(formData.programa),
        bloque_id: formData.bloque ? Number(formData.bloque) : null,
        bloque_fechas_id: Number(formData.bloque_fechas),
        fecha_inicio: formData.fecha_inicio || null,
      };

      if (currentCohorte?.id) {
        await api.put(`/inscripciones/cohortes/${currentCohorte.id}`, payload);
        setFeedback({ open: true, message: 'Cohorte actualizada con éxito.', severity: 'success' });
      } else {
        await api.post('/inscripciones/cohortes', payload);
        setFeedback({ open: true, message: 'Cohorte creada con éxito.', severity: 'success' });
      }
      setOpenDialog(false);
      setCurrentCohorte(null);
      fetchData();
    } catch (error: unknown) {
      let errorMsg = 'Error desconocido';
      if (axios.isAxiosError(error)) {
        errorMsg = error.response?.data ? JSON.stringify(error.response.data) : error.message;
      } else if (error instanceof Error) {
        errorMsg = error.message;
      }
      setFeedback({ open: true, message: `Error al guardar: ${errorMsg}`, severity: 'error' });
    }
  };

  const handleEdit = (cohorte: Cohorte) => {
    setCurrentCohorte(cohorte);
    setOpenDialog(true);
  };

  const handleDelete = async (cohorteId: number) => {
    if (!window.confirm('¿Estás seguro de eliminar esta cohorte?')) return;

    try {
      await api.delete(`/inscripciones/cohortes/${cohorteId}`);
      setFeedback({ open: true, message: 'Cohorte eliminada con éxito.', severity: 'success' });
      fetchData();
    } catch (error: unknown) {
      let errorMsg = 'Error desconocido';
      if (axios.isAxiosError(error)) {
        errorMsg = error.response?.data ? JSON.stringify(error.response.data) : error.message;
      } else if (error instanceof Error) {
        errorMsg = error.message;
      }
      setFeedback({ open: true, message: `Error al eliminar: ${errorMsg}`, severity: 'error' });
    }
  };

  const handleCloseFeedback = (event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') return;
    setFeedback({ ...feedback, open: false });
  };

  const handleOpenDetalle = async (cohorte: Cohorte) => {
    setDetalleCohorte(cohorte);
    setOpenDetalle(true);
    setDetalleLoading(true);
    try {
      const [modulosRes, inscripcionesRes] = await Promise.all([
        cohorte?.bloque_id ? api.get<Modulo[]>('/modulos', { params: { bloque_id: cohorte.bloque_id } }) : Promise.resolve({ data: [] }),
        api.get<Inscripcion[]>('/inscripciones', { params: { cohorte_id: cohorte.id } }),
      ]);
      const modulos = Array.isArray(modulosRes.data) ? modulosRes.data : [];
      const inscriptions = Array.isArray(inscripcionesRes.data) ? inscripcionesRes.data : [];

      const counters = inscriptions.reduce<Record<number, DetalleModuloStats>>((acc, i) => {
        if (!i?.modulo_id) return acc;
        if (!acc[i.modulo_id]) {
          acc[i.modulo_id] = { total: 0, activos: 0, pausados: 0, egresados: 0, baja: 0 };
        }
        acc[i.modulo_id].total += 1;
        const estado = String(i.estado || '').toUpperCase();
        if (estado === 'CURSANDO') acc[i.modulo_id].activos += 1;
        if (estado === 'PAUSADO') acc[i.modulo_id].pausados += 1;
        if (estado === 'EGRESADO') acc[i.modulo_id].egresados += 1;
        if (estado === 'BAJA') acc[i.modulo_id].baja += 1;
        return acc;
      }, {});

      const detalle: DetalleModulo[] = modulos.map((m) => ({
        ...m,
        stats: counters[m.id] || { total: 0, activos: 0, pausados: 0, egresados: 0, baja: 0 },
      }));
      setDetalleModulos(detalle);
    } catch (error: unknown) {
      console.error('Error cargando detalle de cohorte:', error);
      setDetalleModulos([]);
      setFeedback({ open: true, message: 'No se pudo cargar el detalle de la cohorte.', severity: 'error' });
    } finally {
      setDetalleLoading(false);
    }
  };

  const bloquesOptions = useMemo(() => {
    const filtered = filterProgramaId
      ? bloquesPrograma.filter((b) => String(b.programa_id) === String(filterProgramaId))
      : bloquesPrograma;
    return [{ value: '', label: 'Todos' }, ...filtered.map((b) => ({ value: String(b.id), label: b.nombre }))];
  }, [bloquesPrograma, filterProgramaId]);

  const cohortesForFilters = useMemo(() => {
    return cohortes.filter((c) => {
      if (filterProgramaId && String(c.programa_id) !== String(filterProgramaId)) return false;
      if (filterBloqueId && String(c.bloque_id) !== String(filterBloqueId)) return false;
      return true;
    });
  }, [cohortes, filterProgramaId, filterBloqueId]);

  const cohortesOptions = useMemo(() => {
    const uniqueNames = Array.from(
      new Set(cohortesForFilters.map((c) => (c.nombre || '').trim()).filter(Boolean))
    ).sort((a, b) => a.localeCompare(b, 'es'));
    return [{ value: '', label: 'Todas' }, ...uniqueNames.map((nombre) => ({ value: nombre, label: nombre }))];
  }, [cohortesForFilters]);

  const inicioOptions = useMemo(() => {
    const base = cohortesForFilters.filter((c) => {
      if (filterCohorteNombre && String(c.nombre) !== String(filterCohorteNombre)) return false;
      return true;
    });
    const values = Array.from(new Set(base.map((c) => c.fecha_inicio).filter(Boolean))) as string[];
    values.sort((a, b) => (a < b ? 1 : -1));
    return [{ value: '', label: 'Todos' }, ...values.map((v) => ({ value: v, label: formatDateDisplay(v) }))];
  }, [cohortesForFilters, filterCohorteNombre]);

  const cohortesFiltradas = useMemo(() => {
    return cohortes.filter((c) => {
      if (filterProgramaId && String(c.programa_id) !== String(filterProgramaId)) return false;
      if (filterBloqueId && String(c.bloque_id) !== String(filterBloqueId)) return false;
      if (filterCohorteNombre && String(c.nombre) !== String(filterCohorteNombre)) return false;
      if (filterInicio && String(c.fecha_inicio) !== String(filterInicio)) return false;
      return true;
    });
  }, [cohortes, filterProgramaId, filterBloqueId, filterCohorteNombre, filterInicio]);

  return (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <h1 className="text-3xl font-bold text-white">Gestión de Cohortes</h1>
        <Button
          variant="contained"
          startIcon={<AddRoundedIcon />}
          onClick={() => { setCurrentCohorte(null); setOpenDialog(true); }}
        >
          Crear Cohorte
        </Button>
      </Box>
      <p className="text-indigo-200 mb-6 font-medium">
        Una cohorte representa una cursada específica, vinculando un Programa con un Calendario.
      </p>

      {loading ? <CircularProgress /> : (
        <>
          <Paper sx={{ p: 2, mb: 2, bgcolor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <AppSelect
                label="Programa"
                value={filterProgramaId}
                onChange={(e) => {
                  setFilterProgramaId(e.target.value);
                  setFilterBloqueId('');
                  setFilterCohorteNombre('');
                  setFilterInicio('');
                  setPage(0);
                }}
                options={[{ value: '', label: 'Todos' }, ...programas.map((p) => ({ value: String(p.id), label: p.nombre }))]}
                className="bg-indigo-950/50"
              />
              <AppSelect
                label="Bloque"
                value={filterBloqueId}
                onChange={(e) => {
                  setFilterBloqueId(e.target.value);
                  setFilterCohorteNombre('');
                  setFilterInicio('');
                  setPage(0);
                }}
                options={bloquesOptions}
                className="bg-indigo-950/50"
              />
              <AppSelect
                label="Cohorte"
                value={filterCohorteNombre}
                onChange={(e) => {
                  setFilterCohorteNombre(e.target.value);
                  setPage(0);
                }}
                options={cohortesOptions}
                className="bg-indigo-950/50"
              />
              <AppSelect
                label="Inicio"
                value={filterInicio}
                onChange={(e) => {
                  setFilterInicio(e.target.value);
                  setPage(0);
                }}
                options={inicioOptions}
                className="bg-indigo-950/50"
              />
            </div>
          </Paper>

          <TableContainer component={Paper} sx={{ bgcolor: 'rgba(255,255,255,0.05)', color: 'white' }}>
            <Table sx={{ '& .MuiTableCell-root': { color: 'white', borderBottom: '1px solid rgba(255,255,255,0.1)' } }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>Programa</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Bloque</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Calendario</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Nombre Cohorte</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Inicio</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Fin</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }} align="right">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {cohortesFiltradas.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map(c => (
                  <TableRow key={c.id}>
                    <TableCell>{programas.find(p => p.id === c.programa_id)?.nombre || c.programa_id}</TableCell>
                    <TableCell>{bloquesPrograma.find(b => b.id === c.bloque_id)?.nombre || '-'}</TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2">
                          {calendarios.find(b => b.id === c.bloque_fechas_id)?.nombre || c.bloque_fechas_id}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', display: 'block' }}>
                          {calendarios.find(b => b.id === c.bloque_fechas_id)?.descripcion || ''}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>{c.nombre}</TableCell>
                    <TableCell>{formatDateDisplay(c.fecha_inicio)}</TableCell>
                    <TableCell>{formatDateDisplay(c.fecha_fin)}</TableCell>
                    <TableCell align="right">
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<VisibilityOutlinedIcon />}
                        onClick={() => handleOpenDetalle(c)}
                        sx={{ mr: 1, color: 'inherit', borderColor: 'rgba(255,255,255,0.35)' }}
                      >
                        Ver
                      </Button>
                      <Tooltip title="Editar">
                        <IconButton size="small" onClick={() => handleEdit(c)}>
                          <EditOutlinedIcon sx={{ color: 'rgba(255,255,255,0.7)' }} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Eliminar">
                        <IconButton size="small" onClick={() => handleDelete(c.id)}>
                          <DeleteOutlineRoundedIcon sx={{ color: 'rgba(255,255,255,0.7)' }} />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
            <TablePagination
              sx={{ color: 'white', '& .MuiTablePagination-selectIcon': { color: 'white' }, '& .MuiIconButton-root': { color: 'white' } }}
              rowsPerPageOptions={[10, 25, 50]}
              component="div"
              count={cohortesFiltradas.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={(_e, p: number) => setPage(p)}
              onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
              labelRowsPerPage="Filas por página:"
            />
          </Box>
        </>
      )}

      <CohorteFormDialog
        open={openDialog}
        onClose={() => { setOpenDialog(false); setCurrentCohorte(null); }}
        onSave={handleSave}
        programas={programas}
        calendarios={calendarios}
        bloquesPrograma={bloquesPrograma}
        existingNames={cohortes.map((c) => c.nombre)}
        cohorte={currentCohorte}
      />

      <Dialog open={openDetalle} onClose={() => setOpenDetalle(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Detalle de Cohorte: {detalleCohorte?.nombre || '-'}
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Programa: <strong>{programas.find((p) => p.id === detalleCohorte?.programa_id)?.nombre || '-'}</strong> | Bloque:{' '}
            <strong>{bloquesPrograma.find((b) => b.id === detalleCohorte?.bloque_id)?.nombre || '-'}</strong> | Inicio:{' '}
            <strong>{formatDateDisplay(detalleCohorte?.fecha_inicio)}</strong> | Fin:{' '}
            <strong>{formatDateDisplay(detalleCohorte?.fecha_fin)}</strong>
          </Typography>
          {detalleLoading ? (
            <CircularProgress size={24} />
          ) : (
            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>Módulo</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Total</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Activos</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Pausados</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Egresados</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Baja</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {detalleModulos.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell>{m.nombre}</TableCell>
                      <TableCell>{m.stats.total}</TableCell>
                      <TableCell>{m.stats.activos}</TableCell>
                      <TableCell>{m.stats.pausados}</TableCell>
                      <TableCell>{m.stats.egresados}</TableCell>
                      <TableCell>{m.stats.baja}</TableCell>
                    </TableRow>
                  ))}
                  {detalleModulos.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6}>No hay módulos/incripciones para mostrar en esta cohorte.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDetalle(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={feedback.open} autoHideDuration={6000} onClose={handleCloseFeedback} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert onClose={handleCloseFeedback} severity={feedback.severity} sx={{ width: '100%' }}>
          {feedback.message}
        </Alert>
      </Snackbar>
    </>
  );
}
