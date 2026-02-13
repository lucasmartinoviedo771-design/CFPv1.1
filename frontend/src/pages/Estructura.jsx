import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Accordion, AccordionSummary, AccordionDetails, CircularProgress,
  List, ListItem, ListItemText, Grid, IconButton, Tooltip, Button,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, Checkbox, FormControlLabel,
  Snackbar, Alert, Select, MenuItem, FormControl, InputLabel
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import api from '../api/client';

const formatDate = (dateString) => {
  if (!dateString) return '-';
  const parts = dateString.split('-');
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  const date = new Date(Date.UTC(year, month, day));
  return date.toLocaleDateString('es-AR', { timeZone: 'UTC' });
};

const initialModuloFormState = {
  nombre: '',
  fecha_inicio: '',
  fecha_fin: '',
  es_practica: false,
  asistencia_requerida_practica: 80,
  bloque_id: null,
};

const initialBloqueFormState = {
  nombre: '',
  programa_id: null,
};

const initialProgramaFormState = {
  nombre: '',
  codigo: '',
  resolucion_id: null,
};

const initialResolucionFormState = {
  numero: '',
  nombre: '',
  fecha_publicacion: '',
  vigente: true,
  observaciones: '',
};

// ============ DIALOGS ============

function ModuloFormDialog({ open, onClose, onSave, modulo, bloqueId }) {
  const [form, setForm] = useState(initialModuloFormState);

  useEffect(() => {
    if (modulo) {
      setForm({
        ...modulo,
        fecha_inicio: modulo.fecha_inicio || '',
        fecha_fin: modulo.fecha_fin || '',
        bloque_id: modulo.bloque_id || (modulo.bloque ? modulo.bloque.id : null)
      });
    } else {
      setForm({ ...initialModuloFormState, bloque_id: bloqueId });
    }
  }, [modulo, bloqueId, open]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSave = () => {
    onSave(form);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{modulo ? 'Editar Módulo' : 'Añadir Módulo'}</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12}><TextField name="nombre" label="Nombre del Módulo" fullWidth value={form.nombre} onChange={handleChange} /></Grid>
          <Grid item xs={12} sm={6}><TextField name="fecha_inicio" label="Fecha de Inicio" type="date" fullWidth InputLabelProps={{ shrink: true }} value={form.fecha_inicio} onChange={handleChange} /></Grid>
          <Grid item xs={12} sm={6}><TextField name="fecha_fin" label="Fecha de Fin" type="date" fullWidth InputLabelProps={{ shrink: true }} value={form.fecha_fin} onChange={handleChange} /></Grid>
          <Grid item xs={12} sm={6}><FormControlLabel control={<Checkbox name="es_practica" checked={form.es_practica} onChange={handleChange} />} label="Es Práctica" /></Grid>
          {form.es_practica && (
            <Grid item xs={12}><TextField name="asistencia_requerida_practica" label="Asistencia Requerida (%)" type="number" fullWidth value={form.asistencia_requerida_practica} onChange={handleChange} /></Grid>
          )}
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button onClick={handleSave} variant="contained">{modulo ? 'Guardar Cambios' : 'Añadir'}</Button>
      </DialogActions>
    </Dialog>
  );
}

function BloqueFormDialog({ open, onClose, onSave, bloque, programaId }) {
  const [form, setForm] = useState(initialBloqueFormState);

  useEffect(() => {
    if (bloque) {
      setForm(bloque);
    } else {
      setForm({ ...initialBloqueFormState, programa_id: programaId });
    }
  }, [bloque, programaId, open]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    onSave(form);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{bloque ? 'Editar Bloque' : 'Añadir Bloque'}</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12}><TextField name="nombre" label="Nombre del Bloque" fullWidth value={form.nombre} onChange={handleChange} /></Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button onClick={handleSave} variant="contained">{bloque ? 'Guardar Cambios' : 'Añadir'}</Button>
      </DialogActions>
    </Dialog>
  );
}

function ProgramaFormDialog({ open, onClose, onSave, programa, resolucionId }) {
  const [form, setForm] = useState(initialProgramaFormState);

  useEffect(() => {
    if (programa) {
      setForm(programa);
    } else {
      setForm({ ...initialProgramaFormState, resolucion_id: resolucionId });
    }
  }, [programa, resolucionId, open]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    onSave(form);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{programa ? 'Editar Programa' : 'Añadir Programa'}</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12}><TextField name="nombre" label="Nombre del Programa" fullWidth value={form.nombre} onChange={handleChange} /></Grid>
          <Grid item xs={12}><TextField name="codigo" label="Código del Programa" fullWidth value={form.codigo} onChange={handleChange} /></Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button onClick={handleSave} variant="contained">{programa ? 'Guardar Cambios' : 'Añadir'}</Button>
      </DialogActions>
    </Dialog>
  );
}

function ResolucionFormDialog({ open, onClose, onSave, resolucion }) {
  const [form, setForm] = useState(initialResolucionFormState);

  useEffect(() => {
    if (resolucion) {
      setForm(resolucion);
    } else {
      setForm(initialResolucionFormState);
    }
  }, [resolucion, open]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSave = () => {
    onSave(form);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{resolucion ? 'Editar Resolución' : 'Añadir Resolución'}</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12}><TextField name="numero" label="Número de Resolución" fullWidth value={form.numero} onChange={handleChange} /></Grid>
          <Grid item xs={12}><TextField name="nombre" label="Nombre" fullWidth value={form.nombre} onChange={handleChange} /></Grid>
          <Grid item xs={12}><TextField name="fecha_publicacion" label="Fecha de Publicación" type="date" fullWidth InputLabelProps={{ shrink: true }} value={form.fecha_publicacion} onChange={handleChange} /></Grid>
          <Grid item xs={12}><FormControlLabel control={<Checkbox name="vigente" checked={form.vigente} onChange={handleChange} />} label="Vigente" /></Grid>
          <Grid item xs={12}><TextField name="observaciones" label="Observaciones" fullWidth multiline rows={3} value={form.observaciones} onChange={handleChange} /></Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button onClick={handleSave} variant="contained">{resolucion ? 'Guardar Cambios' : 'Añadir'}</Button>
      </DialogActions>
    </Dialog>
  );
}

// ============ ITEM COMPONENTS ============

function ModuloItem({ modulo, onEdit, onDelete }) {
  return (
    <ListItem
      disablePadding
      secondaryAction={
        <Box>
          <Tooltip title="Editar Módulo">
            <IconButton size="small" onClick={() => onEdit(modulo)}>
              <EditOutlinedIcon sx={{ color: 'rgba(255,255,255,0.7)' }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Eliminar Módulo">
            <IconButton size="small" onClick={() => onDelete(modulo)}>
              <DeleteOutlineRoundedIcon sx={{ color: 'rgba(255,255,255,0.7)' }} />
            </IconButton>
          </Tooltip>
        </Box>
      }
    >
      <ListItemText
        primary={modulo.nombre}
        secondary={
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
            {modulo.es_practica && '(Práctica) '}
            {modulo.fecha_inicio && `${formatDate(modulo.fecha_inicio)}`}
            {modulo.fecha_fin && ` a ${formatDate(modulo.fecha_fin)}`}
          </Typography>
        }
        sx={{ '& .MuiListItemText-primary': { color: 'white' } }}
      />
    </ListItem>
  );
}

function BloqueItem({ bloque, onAddModulo, onEdit, onDelete, onEditModulo, onDeleteModulo, expandedBloque, handleBloqueChange }) {
  return (
    <Accordion expanded={expandedBloque === `bloque-${bloque.id}`} onChange={handleBloqueChange(`bloque-${bloque.id}`)}
      sx={{
        bgcolor: 'rgba(0,0,0,0.2)',
        color: 'white',
        border: '1px solid rgba(255,255,255,0.1)',
        '&:before': { display: 'none' }
      }}>
      <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: 'white' }} />}>
        <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>Bloque: {bloque.nombre}</Typography>
          <Tooltip title="Añadir Módulo">
            <IconButton size="small" onClick={(e) => { e.stopPropagation(); onAddModulo(bloque.id); }}>
              <AddRoundedIcon sx={{ color: 'rgba(255,255,255,0.7)' }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Editar Bloque">
            <IconButton size="small" onClick={(e) => { e.stopPropagation(); onEdit(bloque); }}>
              <EditOutlinedIcon sx={{ color: 'rgba(255,255,255,0.7)' }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Eliminar Bloque">
            <IconButton size="small" onClick={(e) => { e.stopPropagation(); onDelete(bloque); }}>
              <DeleteOutlineRoundedIcon sx={{ color: 'rgba(255,255,255,0.7)' }} />
            </IconButton>
          </Tooltip>
        </Box>
      </AccordionSummary>
      <AccordionDetails>
        <List dense>
          {bloque.modulos.length === 0 ? (
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)', fontStyle: 'italic' }}>No hay módulos en este bloque.</Typography>
          ) : (
            bloque.modulos.map((modulo) => (
              <ModuloItem key={modulo.id} modulo={modulo} onEdit={(m) => onEditModulo(m, bloque.id)} onDelete={onDeleteModulo} />
            ))
          )}
        </List>
      </AccordionDetails>
    </Accordion>
  );
}

function ProgramaItem({ programa, onAddBloque, onEdit, onDelete, onAddModulo, onEditBloque, onDeleteBloque, onEditModulo, onDeleteModulo, expandedProgram, expandedBloque, handleProgramChange, handleBloqueChange }) {
  return (
    <Accordion expanded={expandedProgram === `programa-${programa.id}`} onChange={handleProgramChange(`programa-${programa.id}`)}
      sx={{
        bgcolor: 'rgba(0,0,0,0.3)',
        color: 'white',
        mb: 1,
        border: '1px solid rgba(99, 102, 241, 0.2)',
        '&:before': { display: 'none' }
      }}
    >
      <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: 'white' }} />}>
        <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>{programa.codigo} - {programa.nombre}</Typography>
          <Tooltip title="Añadir Bloque">
            <IconButton size="small" onClick={(e) => { e.stopPropagation(); onAddBloque(programa.id); }}>
              <AddRoundedIcon sx={{ color: 'rgba(255,255,255,0.7)' }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Editar Programa">
            <IconButton size="small" onClick={(e) => { e.stopPropagation(); onEdit(programa); }}>
              <EditOutlinedIcon sx={{ color: 'rgba(255,255,255,0.7)' }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Eliminar Programa">
            <IconButton size="small" onClick={(e) => { e.stopPropagation(); onDelete(programa); }}>
              <DeleteOutlineRoundedIcon sx={{ color: 'rgba(255,255,255,0.7)' }} />
            </IconButton>
          </Tooltip>
        </Box>
      </AccordionSummary>
      <AccordionDetails>
        {programa.bloques.length === 0 ? (
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)', fontStyle: 'italic' }}>No hay bloques en este programa.</Typography>
        ) : (
          programa.bloques.map((bloque) => (
            <BloqueItem
              key={bloque.id}
              bloque={bloque}
              onAddModulo={onAddModulo}
              onEdit={onEditBloque}
              onDelete={onDeleteBloque}
              onEditModulo={onEditModulo}
              onDeleteModulo={onDeleteModulo}
              expandedBloque={expandedBloque}
              handleBloqueChange={handleBloqueChange}
            />
          ))
        )}
      </AccordionDetails>
    </Accordion>
  );
}

// ============ MAIN COMPONENT ============

export default function Estructura() {
  const [resoluciones, setResoluciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedResolucion, setExpandedResolucion] = useState(false);
  const [expandedProgram, setExpandedProgram] = useState(false);
  const [expandedBloque, setExpandedBloque] = useState(false);

  // Dialog states
  const [openModuloDialog, setOpenModuloDialog] = useState(false);
  const [currentModulo, setCurrentModulo] = useState(null);
  const [parentBloqueId, setParentBloqueId] = useState(null);

  const [openBloqueDialog, setOpenBloqueDialog] = useState(false);
  const [currentBloque, setCurrentBloque] = useState(null);
  const [parentProgramaId, setParentProgramaId] = useState(null);

  const [openProgramaDialog, setOpenProgramaDialog] = useState(false);
  const [currentPrograma, setCurrentPrograma] = useState(null);
  const [parentResolucionId, setParentResolucionId] = useState(null);

  const [openResolucionDialog, setOpenResolucionDialog] = useState(false);
  const [currentResolucion, setCurrentResolucion] = useState(null);

  const [feedback, setFeedback] = useState({ open: false, message: '', severity: 'success' });

  const fetchResoluciones = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/resoluciones');
      const resolucionesList = Array.isArray(data) ? data : [];

      // Para cada resolución, cargar sus programas
      const resolucionesConProgramas = await Promise.all(resolucionesList.map(async (resolucion) => {
        const programasRes = await api.get('/programas', { params: { resolucion_id: resolucion.id } });
        const programas = Array.isArray(programasRes.data) ? programasRes.data : [];

        // Para cada programa, cargar bloques y módulos
        const programasConBloques = await Promise.all(programas.map(async (programa) => {
          const bloquesRes = await api.get('/bloques', { params: { programa_id: programa.id } });
          const bloques = Array.isArray(bloquesRes.data) ? bloquesRes.data : [];

          const bloquesConModulos = await Promise.all(
            bloques.map(async (b) => {
              const modRes = await api.get('/modulos', { params: { bloque_id: b.id } });
              const mods = Array.isArray(modRes.data) ? modRes.data : [];
              return { ...b, modulos: mods };
            })
          );
          return { ...programa, bloques: bloquesConModulos };
        }));

        return { ...resolucion, programas: programasConBloques };
      }));

      setResoluciones(resolucionesConProgramas);
    } catch (error) {
      console.error("Error al cargar resoluciones:", error);
      setFeedback({ open: true, message: 'Error al cargar resoluciones.', severity: 'error' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchResoluciones();
  }, [fetchResoluciones]);

  const handleResolucionChange = (panel) => (event, isExpanded) => {
    setExpandedResolucion(isExpanded ? panel : false);
    setExpandedProgram(false);
    setExpandedBloque(false);
  };

  const handleProgramChange = (panel) => (event, isExpanded) => {
    setExpandedProgram(isExpanded ? panel : false);
    setExpandedBloque(false);
  };

  const handleBloqueChange = (panel) => (event, isExpanded) => {
    setExpandedBloque(isExpanded ? panel : false);
  };

  // ============ RESOLUCIÓN CRUD ============

  const handleAddResolucion = () => {
    setCurrentResolucion(null);
    setOpenResolucionDialog(true);
  };

  const handleEditResolucion = (resolucion) => {
    setCurrentResolucion(resolucion);
    setOpenResolucionDialog(true);
  };

  const handleDeleteResolucion = async (resolucion) => {
    if (!window.confirm(`¿Eliminar resolución "${resolucion.numero}"?`)) return;
    try {
      await api.delete(`/resoluciones/${resolucion.id}`);
      setFeedback({ open: true, message: 'Resolución eliminada con éxito', severity: 'success' });
      fetchResoluciones();
    } catch (error) {
      const errorMsg = error.response?.data?.error || error.message;
      setFeedback({ open: true, message: `Error al eliminar resolución: ${errorMsg}`, severity: 'error' });
    }
  };

  const handleSaveResolucion = async (resolucionData) => {
    try {
      if (currentResolucion) {
        await api.put(`/resoluciones/${currentResolucion.id}`, resolucionData);
        setFeedback({ open: true, message: 'Resolución actualizada con éxito', severity: 'success' });
      } else {
        await api.post('/resoluciones', resolucionData);
        setFeedback({ open: true, message: 'Resolución añadida con éxito', severity: 'success' });
      }
      setOpenResolucionDialog(false);
      fetchResoluciones();
    } catch (error) {
      const errorMsg = error.response?.data ? JSON.stringify(error.response.data) : error.message;
      setFeedback({ open: true, message: `Error al guardar resolución: ${errorMsg}`, severity: 'error' });
    }
  };

  const handleCloseResolucionDialog = () => {
    setOpenResolucionDialog(false);
    setCurrentResolucion(null);
  };

  // ============ PROGRAMA CRUD ============

  const handleAddPrograma = (resolucionId) => {
    setCurrentPrograma(null);
    setParentResolucionId(resolucionId);
    setOpenProgramaDialog(true);
  };

  const handleEditPrograma = (programa) => {
    setCurrentPrograma(programa);
    setOpenProgramaDialog(true);
  };

  const handleDeletePrograma = async (programa) => {
    if (!window.confirm(`¿Eliminar programa "${programa.nombre}"?`)) return;
    try {
      await api.delete(`/programas/${programa.id}`);
      setFeedback({ open: true, message: 'Programa eliminado con éxito', severity: 'success' });
      fetchResoluciones();
    } catch (error) {
      const errorMsg = error.response?.data ? JSON.stringify(error.response.data) : error.message;
      setFeedback({ open: true, message: `Error al eliminar programa: ${errorMsg}`, severity: 'error' });
    }
  };

  const handleSavePrograma = async (programaData) => {
    try {
      if (currentPrograma) {
        await api.put(`/programas/${currentPrograma.id}`, programaData);
        setFeedback({ open: true, message: 'Programa actualizado con éxito', severity: 'success' });
      } else {
        await api.post('/programas', programaData);
        setFeedback({ open: true, message: 'Programa añadido con éxito', severity: 'success' });
      }
      setOpenProgramaDialog(false);
      fetchResoluciones();
    } catch (error) {
      const errorMsg = error.response?.data ? JSON.stringify(error.response.data) : error.message;
      setFeedback({ open: true, message: `Error al guardar programa: ${errorMsg}`, severity: 'error' });
    }
  };

  const handleCloseProgramaDialog = () => {
    setOpenProgramaDialog(false);
    setCurrentPrograma(null);
  };

  // ============ BLOQUE CRUD ============

  const handleAddBloque = (programaId) => {
    setCurrentBloque(null);
    setParentProgramaId(programaId);
    setOpenBloqueDialog(true);
  };

  const handleEditBloque = (bloque) => {
    setCurrentBloque(bloque);
    setOpenBloqueDialog(true);
  };

  const handleDeleteBloque = async (bloque) => {
    if (!window.confirm(`¿Eliminar bloque "${bloque.nombre}"?`)) return;
    try {
      await api.delete(`/bloques/${bloque.id}`);
      setFeedback({ open: true, message: 'Bloque eliminado con éxito', severity: 'success' });
      fetchResoluciones();
    } catch (error) {
      const errorMsg = error.response?.data ? JSON.stringify(error.response.data) : error.message;
      setFeedback({ open: true, message: `Error al eliminar bloque: ${errorMsg}`, severity: 'error' });
    }
  };

  const handleSaveBloque = async (bloqueData) => {
    try {
      if (currentBloque) {
        await api.put(`/bloques/${currentBloque.id}`, bloqueData);
        setFeedback({ open: true, message: 'Bloque actualizado con éxito', severity: 'success' });
      } else {
        await api.post('/bloques', bloqueData);
        setFeedback({ open: true, message: 'Bloque añadido con éxito', severity: 'success' });
      }
      setOpenBloqueDialog(false);
      fetchResoluciones();
    } catch (error) {
      const errorMsg = error.response?.data ? JSON.stringify(error.response.data) : error.message;
      setFeedback({ open: true, message: `Error al guardar bloque: ${errorMsg}`, severity: 'error' });
    }
  };

  const handleCloseBloqueDialog = () => {
    setOpenBloqueDialog(false);
    setCurrentBloque(null);
  };

  // ============ MÓDULO CRUD ============

  const handleAddModulo = (bloqueId) => {
    setCurrentModulo(null);
    setParentBloqueId(bloqueId);
    setOpenModuloDialog(true);
  };

  const handleEditModulo = (modulo, bloqueId) => {
    setCurrentModulo(modulo);
    setParentBloqueId(bloqueId);
    setOpenModuloDialog(true);
  };

  const handleDeleteModulo = async (modulo) => {
    if (!window.confirm(`¿Eliminar módulo "${modulo.nombre}"?`)) return;
    try {
      await api.delete(`/modulos/${modulo.id}`);
      setFeedback({ open: true, message: 'Módulo eliminado con éxito', severity: 'success' });
      fetchResoluciones();
    } catch (error) {
      const errorMsg = error.response?.data ? JSON.stringify(error.response.data) : error.message;
      setFeedback({ open: true, message: `Error al eliminar módulo: ${errorMsg}`, severity: 'error' });
    }
  };

  const handleSaveModulo = async (moduloData) => {
    try {
      if (currentModulo) {
        await api.put(`/modulos/${currentModulo.id}`, moduloData);
        setFeedback({ open: true, message: 'Módulo actualizado con éxito', severity: 'success' });
      } else {
        await api.post('/modulos', moduloData);
        setFeedback({ open: true, message: 'Módulo añadido con éxito', severity: 'success' });
      }
      setOpenModuloDialog(false);
      fetchResoluciones();
    } catch (error) {
      const errorMsg = error.response?.data ? JSON.stringify(error.response.data) : error.message;
      setFeedback({ open: true, message: `Error al guardar módulo: ${errorMsg}`, severity: 'error' });
    }
  };

  const handleCloseModuloDialog = () => {
    setOpenModuloDialog(false);
    setCurrentModulo(null);
  };

  const handleCloseFeedback = (event, reason) => {
    if (reason === 'clickaway') return;
    setFeedback({ ...feedback, open: false });
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Estructura Académica</h1>
          <p className="text-indigo-200 mt-2">Gestiona la jerarquía completa: Resoluciones → Programas → Bloques → Módulos</p>
        </div>
        <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={handleAddResolucion} sx={{ bgcolor: '#4f46e5', '&:hover': { bgcolor: '#4338ca' } }}>Añadir Resolución</Button>
      </div>

      <Box>
        {resoluciones.length === 0 ? (
          <div className="text-white text-center py-10 opacity-70">No hay resoluciones cargadas. Crea una para empezar.</div>
        ) : (
          resoluciones.map((resolucion) => (
            <Accordion key={resolucion.id} expanded={expandedResolucion === `resolucion-${resolucion.id}`} onChange={handleResolucionChange(`resolucion-${resolucion.id}`)}
              sx={{
                bgcolor: 'rgba(30, 27, 75, 0.6)',
                backdropFilter: 'blur(10px)',
                color: 'white',
                mb: 2,
                borderRadius: '8px !important',
                border: '1px solid rgba(99, 102, 241, 0.5)',
                '&:before': { display: 'none' }
              }}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: 'white' }} />}>
                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                  <Typography variant="h5" sx={{ flexGrow: 1 }}>📜 {resolucion.numero} - {resolucion.nombre}</Typography>
                  <Tooltip title="Añadir Programa">
                    <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleAddPrograma(resolucion.id); }}>
                      <AddRoundedIcon sx={{ color: 'rgba(255,255,255,0.7)' }} />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Editar Resolución">
                    <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleEditResolucion(resolucion); }}>
                      <EditOutlinedIcon sx={{ color: 'rgba(255,255,255,0.7)' }} />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Eliminar Resolución">
                    <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleDeleteResolucion(resolucion); }}>
                      <DeleteOutlineRoundedIcon sx={{ color: 'rgba(255,255,255,0.7)' }} />
                    </IconButton>
                  </Tooltip>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                {resolucion.programas.length === 0 ? (
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)', fontStyle: 'italic' }}>No hay programas en esta resolución.</Typography>
                ) : (
                  resolucion.programas.map((programa) => (
                    <ProgramaItem
                      key={programa.id}
                      programa={programa}
                      onAddBloque={handleAddBloque}
                      onEdit={handleEditPrograma}
                      onDelete={handleDeletePrograma}
                      onAddModulo={handleAddModulo}
                      onEditBloque={handleEditBloque}
                      onDeleteBloque={handleDeleteBloque}
                      onEditModulo={handleEditModulo}
                      onDeleteModulo={handleDeleteModulo}
                      expandedProgram={expandedProgram}
                      expandedBloque={expandedBloque}
                      handleProgramChange={handleProgramChange}
                      handleBloqueChange={handleBloqueChange}
                    />
                  ))
                )}
              </AccordionDetails>
            </Accordion>
          ))
        )}
      </Box>

      {/* Dialogs */}
      <ResolucionFormDialog open={openResolucionDialog} onClose={handleCloseResolucionDialog} onSave={handleSaveResolucion} resolucion={currentResolucion} />
      <ProgramaFormDialog open={openProgramaDialog} onClose={handleCloseProgramaDialog} onSave={handleSavePrograma} programa={currentPrograma} resolucionId={parentResolucionId} />
      <BloqueFormDialog open={openBloqueDialog} onClose={handleCloseBloqueDialog} onSave={handleSaveBloque} bloque={currentBloque} programaId={parentProgramaId} />
      <ModuloFormDialog open={openModuloDialog} onClose={handleCloseModuloDialog} onSave={handleSaveModulo} modulo={currentModulo} bloqueId={parentBloqueId} />

      {/* Feedback */}
      <Snackbar open={feedback.open} autoHideDuration={6000} onClose={handleCloseFeedback} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert onClose={handleCloseFeedback} severity={feedback.severity} sx={{ width: '100%' }}>
          {feedback.message}
        </Alert>
      </Snackbar>
    </>
  );
}
