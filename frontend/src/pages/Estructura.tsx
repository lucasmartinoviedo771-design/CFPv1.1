import React, { useEffect, useState, useCallback } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box, Typography, Accordion, AccordionSummary, AccordionDetails, CircularProgress,
  List, ListItem, ListItemText, Grid, IconButton, Tooltip, Button,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, Checkbox, FormControlLabel,
  Snackbar, Alert, Select, MenuItem, FormControl, InputLabel, SelectChangeEvent
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import api from '../api/client';

import {
  ModuloEstructura, BloqueEstructura, ProgramaEstructura, ResolucionEstructura,
  ModuloForm, BloqueForm, ProgramaForm, ResolucionForm
} from '../components/Estructura/types';
import ModuloFormDialog from '../components/Estructura/ModuloFormDialog';
import BloqueFormDialog from '../components/Estructura/BloqueFormDialog';
import ProgramaFormDialog from '../components/Estructura/ProgramaFormDialog';
import ResolucionFormDialog from '../components/Estructura/ResolucionFormDialog';

// ============ ITEM COMPONENTS ============

interface ModuloItemProps {
  modulo: ModuloEstructura;
  onEdit: (modulo: ModuloEstructura) => void;
  onDelete: (modulo: ModuloEstructura) => void;
}

function ModuloItem({ modulo, onEdit, onDelete }: ModuloItemProps) {
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
            {modulo.es_practica ? '(Práctica)' : ''}
          </Typography>
        }
        sx={{ '& .MuiListItemText-primary': { color: 'white' } }}
      />
    </ListItem>
  );
}

interface BloqueItemProps {
  bloque: BloqueEstructura;
  programaBloques: BloqueEstructura[];
  onAddModulo: (bloqueId: number) => void;
  onEdit: (bloque: BloqueEstructura) => void;
  onDelete: (bloque: BloqueEstructura) => void;
  onEditModulo: (modulo: ModuloEstructura, bloqueId: number) => void;
  onDeleteModulo: (modulo: ModuloEstructura) => void;
  expandedBloque: string | boolean;
  handleBloqueChange: (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => void;
}

function BloqueItem({
  bloque, programaBloques = [], onAddModulo, onEdit, onDelete,
  onEditModulo, onDeleteModulo, expandedBloque, handleBloqueChange
}: BloqueItemProps) {
  const correlativasNombres = (bloque.correlativas_ids || [])
    .map((id) => programaBloques.find((b) => Number(b.id) === Number(id))?.nombre)
    .filter(Boolean);

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
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h6">Bloque: {bloque.nombre}</Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.72)' }}>
              Correlatividades: {correlativasNombres.length ? correlativasNombres.join(', ') : 'Sin correlatividades'}
            </Typography>
          </Box>
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

interface ProgramaItemProps {
  programa: ProgramaEstructura;
  onAddBloque: (programaId: number) => void;
  onEdit: (programa: ProgramaEstructura) => void;
  onDelete: (programa: ProgramaEstructura) => void;
  onAddModulo: (bloqueId: number) => void;
  onEditBloque: (bloque: BloqueEstructura) => void;
  onDeleteBloque: (bloque: BloqueEstructura) => void;
  onEditModulo: (modulo: ModuloEstructura, bloqueId: number) => void;
  onDeleteModulo: (modulo: ModuloEstructura) => void;
  expandedProgram: string | boolean;
  expandedBloque: string | boolean;
  handleProgramChange: (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => void;
  handleBloqueChange: (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => void;
}

function ProgramaItem({
  programa, onAddBloque, onEdit, onDelete, onAddModulo, onEditBloque,
  onDeleteBloque, onEditModulo, onDeleteModulo, expandedProgram,
  expandedBloque, handleProgramChange, handleBloqueChange
}: ProgramaItemProps) {
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
          <Tooltip title="Gestionar Exámenes">
            <IconButton size="small" component={RouterLink} to={`/cursos/${programa.id}`}>
              <MenuBookIcon sx={{ color: 'rgba(255,255,255,0.7)' }} />
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
              programaBloques={programa.bloques}
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
  const [resoluciones, setResoluciones] = useState<ResolucionEstruct[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedResolucion, setExpandedResolucion] = useState<string | boolean>(false);
  const [expandedProgram, setExpandedProgram] = useState<string | boolean>(false);
  const [expandedBloque, setExpandedBloque] = useState<string | boolean>(false);

  // Dialog states
  const [openModuloDialog, setOpenModuloDialog] = useState(false);
  const [currentModulo, setCurrentModulo] = useState<ModuloForm | null>(null);
  const [parentBloqueId, setParentBloqueId] = useState<number | null>(null);

  const [openBloqueDialog, setOpenBloqueDialog] = useState(false);
  const [currentBloque, setCurrentBloque] = useState<BloqueForm | null>(null);
  const [parentProgramaId, setParentProgramaId] = useState<number | null>(null);

  const [openProgramaDialog, setOpenProgramaDialog] = useState(false);
  const [currentPrograma, setCurrentPrograma] = useState<ProgramaForm | null>(null);
  const [parentResolucionId, setParentResolucionId] = useState<number | null>(null);

  const [openResolucionDialog, setOpenResolucionDialog] = useState(false);
  const [currentResolucion, setCurrentResolucion] = useState<ResolucionForm | null>(null);

  const [feedback, setFeedback] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  const fetchResoluciones = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get<ResolucionEstructura[]>('/resoluciones/estructura_completa');
      setResoluciones(Array.isArray(data) ? data : []);
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

  const handleResolucionChange = (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpandedResolucion(isExpanded ? panel : false);
    setExpandedProgram(false);
    setExpandedBloque(false);
  };

  const handleProgramChange = (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpandedProgram(isExpanded ? panel : false);
    setExpandedBloque(false);
  };

  const handleBloqueChange = (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpandedBloque(isExpanded ? panel : false);
  };

  // ============ RESOLUCIÓN CRUD ============

  const handleAddResolucion = () => {
    setCurrentResolucion(null);
    setOpenResolucionDialog(true);
  };

  const handleEditResolucion = (resolucion: ResolucionForm) => {
    setCurrentResolucion(resolucion);
    setOpenResolucionDialog(true);
  };

  const handleDeleteResolucion = async (resolucion: ResolucionForm) => {
    if (!resolucion.id) return;
    if (!window.confirm(`¿Eliminar resolución "${resolucion.numero}"?`)) return;
    try {
      await api.delete(`/resoluciones/${resolucion.id}`);
      setFeedback({ open: true, message: 'Resolución eliminada con éxito', severity: 'success' });
      fetchResoluciones();
    } catch (error) {
      const errorObj = error as { response?: { data?: { error?: string } }; message: string };
      const errorMsg = errorObj.response?.data?.error || errorObj.message;
      setFeedback({ open: true, message: `Error al eliminar resolución: ${errorMsg}`, severity: 'error' });
    }
  };

  const handleSaveResolucion = async (resolucionData: ResolucionForm) => {
    try {
      if (currentResolucion && currentResolucion.id) {
        await api.put(`/resoluciones/${currentResolucion.id}`, resolucionData);
        setFeedback({ open: true, message: 'Resolución actualizada con éxito', severity: 'success' });
      } else {
        await api.post('/resoluciones', resolucionData);
        setFeedback({ open: true, message: 'Resolución añadida con éxito', severity: 'success' });
      }
      setOpenResolucionDialog(false);
      fetchResoluciones();
    } catch (error) {
      const errorObj = error as { response?: { data?: unknown }; message: string };
      const errorMsg = errorObj.response?.data ? JSON.stringify(errorObj.response.data) : errorObj.message;
      setFeedback({ open: true, message: `Error al guardar resolución: ${errorMsg}`, severity: 'error' });
    }
  };

  const handleCloseResolucionDialog = () => {
    setOpenResolucionDialog(false);
    setCurrentResolucion(null);
  };

  // ============ PROGRAMA CRUD ============

  const handleAddPrograma = (resolucionId: number) => {
    setCurrentPrograma(null);
    setParentResolucionId(resolucionId);
    setOpenProgramaDialog(true);
  };

  const handleEditPrograma = (programa: ProgramaForm) => {
    setCurrentPrograma(programa);
    setOpenProgramaDialog(true);
  };

  const handleDeletePrograma = async (programa: ProgramaForm) => {
    if (!programa.id) return;
    if (!window.confirm(`¿Eliminar programa "${programa.nombre}"?`)) return;
    try {
      await api.delete(`/programas/${programa.id}`);
      setFeedback({ open: true, message: 'Programa eliminado con éxito', severity: 'success' });
      fetchResoluciones();
    } catch (error) {
      const errorObj = error as { response?: { data?: unknown }; message: string };
      const errorMsg = errorObj.response?.data ? JSON.stringify(errorObj.response.data) : errorObj.message;
      setFeedback({ open: true, message: `Error al eliminar programa: ${errorMsg}`, severity: 'error' });
    }
  };

  const handleSavePrograma = async (programaData: ProgramaForm) => {
    try {
      if (currentPrograma && currentPrograma.id) {
        await api.put(`/programas/${currentPrograma.id}`, { ...programaData, resolucion_id: parentResolucionId });
        setFeedback({ open: true, message: 'Programa actualizado con éxito', severity: 'success' });
      } else {
        await api.post('/programas', { ...programaData, resolucion_id: parentResolucionId });
        setFeedback({ open: true, message: 'Programa añadido con éxito', severity: 'success' });
      }
      setOpenProgramaDialog(false);
      fetchResoluciones();
    } catch (error) {
      const errorObj = error as { response?: { data?: unknown }; message: string };
      const errorMsg = errorObj.response?.data ? JSON.stringify(errorObj.response.data) : errorObj.message;
      setFeedback({ open: true, message: `Error al guardar programa: ${errorMsg}`, severity: 'error' });
    }
  };

  const handleCloseProgramaDialog = () => {
    setOpenProgramaDialog(false);
    setCurrentPrograma(null);
  };

  // ============ BLOQUE CRUD ============

  const handleAddBloque = (programaId: number) => {
    setCurrentBloque(null);
    setParentProgramaId(programaId);
    setOpenBloqueDialog(true);
  };

  const handleEditBloque = (bloque: BloqueForm) => {
    setCurrentBloque(bloque);
    setParentProgramaId(bloque.programa_id);
    setOpenBloqueDialog(true);
  };

  const handleDeleteBloque = async (bloque: BloqueForm) => {
    if (!bloque.id) return;
    if (!window.confirm(`¿Eliminar bloque "${bloque.nombre}"?`)) return;
    try {
      await api.delete(`/bloques/${bloque.id}`);
      setFeedback({ open: true, message: 'Bloque eliminado con éxito', severity: 'success' });
      fetchResoluciones();
    } catch (error) {
      const errorObj = error as { response?: { data?: unknown }; message: string };
      const errorMsg = errorObj.response?.data ? JSON.stringify(errorObj.response.data) : errorObj.message;
      setFeedback({ open: true, message: `Error al eliminar bloque: ${errorMsg}`, severity: 'error' });
    }
  };

  const handleSaveBloque = async (bloqueData: BloqueForm) => {
    try {
      if (currentBloque && currentBloque.id) {
        await api.put(`/bloques/${currentBloque.id}`, { ...bloqueData, programa_id: parentProgramaId });
        setFeedback({ open: true, message: 'Bloque actualizado con éxito', severity: 'success' });
      } else {
        await api.post('/bloques', { ...bloqueData, programa_id: parentProgramaId });
        setFeedback({ open: true, message: 'Bloque añadido con éxito', severity: 'success' });
      }
      setOpenBloqueDialog(false);
      fetchResoluciones();
    } catch (error) {
      const errorObj = error as { response?: { data?: unknown }; message: string };
      const errorMsg = errorObj.response?.data ? JSON.stringify(errorObj.response.data) : errorObj.message;
      setFeedback({ open: true, message: `Error al guardar bloque: ${errorMsg}`, severity: 'error' });
    }
  };

  const handleCloseBloqueDialog = () => {
    setOpenBloqueDialog(false);
    setCurrentBloque(null);
  };

  // ============ MÓDULO CRUD ============

  const handleAddModulo = (bloqueId: number) => {
    setCurrentModulo(null);
    setParentBloqueId(bloqueId);
    setOpenModuloDialog(true);
  };

  const handleEditModulo = (modulo: ModuloForm, bloqueId: number) => {
    setCurrentModulo(modulo);
    setParentBloqueId(bloqueId);
    setOpenModuloDialog(true);
  };

  const handleDeleteModulo = async (modulo: ModuloForm) => {
    if (!modulo.id) return;
    if (!window.confirm(`¿Eliminar módulo "${modulo.nombre}"?`)) return;
    try {
      await api.delete(`/modulos/${modulo.id}`);
      setFeedback({ open: true, message: 'Módulo eliminado con éxito', severity: 'success' });
      fetchResoluciones();
    } catch (error) {
      const errorObj = error as { response?: { data?: unknown }; message: string };
      const errorMsg = errorObj.response?.data ? JSON.stringify(errorObj.response.data) : errorObj.message;
      setFeedback({ open: true, message: `Error al eliminar módulo: ${errorMsg}`, severity: 'error' });
    }
  };

  const handleSaveModulo = async (moduloData: ModuloForm) => {
    try {
      if (currentModulo && currentModulo.id) {
        await api.put(`/modulos/${currentModulo.id}`, { ...moduloData, bloque_id: parentBloqueId });
        setFeedback({ open: true, message: 'Módulo actualizado con éxito', severity: 'success' });
      } else {
        await api.post('/modulos', { ...moduloData, bloque_id: parentBloqueId });
        setFeedback({ open: true, message: 'Módulo añadido con éxito', severity: 'success' });
      }
      setOpenModuloDialog(false);
      fetchResoluciones();
    } catch (error) {
      const errorObj = error as { response?: { data?: unknown }; message: string };
      const errorMsg = errorObj.response?.data ? JSON.stringify(errorObj.response.data) : errorObj.message;
      setFeedback({ open: true, message: `Error al guardar módulo: ${errorMsg}`, severity: 'error' });
    }
  };

  const handleCloseModuloDialog = () => {
    setOpenModuloDialog(false);
    setCurrentModulo(null);
  };

  const handleCloseFeedback = (event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') return;
    setFeedback(prev => ({ ...prev, open: false }));
  };

  const getBloquesByProgramaId = (programaId: number | null): BloqueEstructura[] => {
    if (!programaId) return [];
    for (const resolucion of resoluciones) {
      for (const programa of (resolucion.programas || [])) {
        if (Number(programa.id) === Number(programaId)) {
          return programa.bloques || [];
        }
      }
    }
    return [];
  };

  type ResolucionEstruct = ResolucionEstructura;

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
      <BloqueFormDialog
        open={openBloqueDialog}
        onClose={handleCloseBloqueDialog}
        onSave={handleSaveBloque}
        bloque={currentBloque}
        programaId={parentProgramaId}
        availableBloques={getBloquesByProgramaId(parentProgramaId)}
      />
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
