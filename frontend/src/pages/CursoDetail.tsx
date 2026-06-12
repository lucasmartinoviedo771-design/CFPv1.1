import { useEffect, useState, useCallback } from "react";
import { useParams, Link as RouterLink } from "react-router-dom";
import {
  Box, Typography, CircularProgress, Breadcrumbs, Paper, TextField, Button,
  Table, TableBody, TableCell, TableContainer, TableRow, Accordion,
  AccordionSummary, AccordionDetails, Select, MenuItem, FormControl, InputLabel, Divider
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { getCurso, listCohortes } from "../services/cursosService";
import {
  listBloques, createBloque, deleteBloque,
  listModulos, createModulo, deleteModulo,
  listExamenes, createExamen, deleteExamen,
  getCoursesGraph
} from "../services/estructuraService";
import { formatDateDisplay } from "../utils/dateFormat";
import type { Programa, Cohorte, Bloque, Modulo, Examen } from "../api/types";

interface ExamenFormState {
  tipo_examen: string;
  fecha: string;
  modulo: number | null;
  bloque: number | null;
}

interface ModuloFormState {
  nombre: string;
  orden: number;
  bloque: number;
}

interface BloqueFormState {
  nombre: string;
  orden: number;
  programa_id: number;
}

interface GraphChild {
  id: number;
  orden: number;
  nombre: string;
  es_practica: boolean;
}

interface GraphFinal {
  id: number;
  tipo_examen: string;
  fecha?: string | null;
}

interface GraphBloque {
  id: number;
  orden: number;
  nombre: string;
  children?: GraphChild[];
  finales?: GraphFinal[];
}

interface CourseGraph {
  tree: GraphBloque[];
}

// --- ModuloExamenManager (for Parcial/Recup) ---
function ModuloExamenManager({ modulo }: { modulo: Modulo }) {
  const [examenes, setExamenes] = useState<Examen[]>([]);
  const [form, setForm] = useState<ExamenFormState>({ tipo_examen: 'PARCIAL', fecha: '', modulo: modulo.id, bloque: null });
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  const fetchExamenes = useCallback(async () => {
    try {
      const res = await listExamenes({ modulo_id: modulo.id });
      setExamenes(Array.isArray(res) ? res : []);
    } catch (err) { console.error("Error fetching module examenes:", err); }
  }, [modulo.id]);

  useEffect(() => { fetchExamenes(); }, [fetchExamenes]);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | { target: { name: string; value: unknown } }) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaveStatus('saving');
    try {
      const payload: Partial<Examen> & { fecha: string | null } = {
        tipo_examen: form.tipo_examen,
        fecha: form.fecha === '' ? null : form.fecha,
        modulo_id: form.modulo,
        bloque_id: form.bloque,
        peso: 1
      };
      await createExamen(payload);
      setForm({ tipo_examen: 'PARCIAL', fecha: '', modulo: modulo.id, bloque: null });
      fetchExamenes();
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (err) {
      console.error("Error creating module examen:", err);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 2000);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("¿Eliminar examen?")) {
      setSaveStatus('saving');
      try {
        await deleteExamen(id);
        fetchExamenes();
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      } catch (err) {
        console.error("Error deleting module examen:", err);
        setSaveStatus('error');
        setTimeout(() => setSaveStatus('idle'), 2000);
      }
    }
  };

  return (
    <Box>
      <Typography variant="subtitle2" sx={{ mt: 1 }}>Exámenes del Módulo (Parciales)</Typography>
      <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', gap: 1, my: 1, alignItems: 'center' }}>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Tipo</InputLabel>
          <Select name="tipo_examen" value={form.tipo_examen} label="Tipo" onChange={(e) => handleFormChange(e)}>
            <MenuItem value="PARCIAL">Parcial</MenuItem>
            <MenuItem value="RECUP">Recuperatorio</MenuItem>
          </Select>
        </FormControl>
        <TextField name="fecha" type="date" value={form.fecha} onChange={handleFormChange} size="small" InputLabelProps={{ shrink: true }} />
        <Button type="submit" variant="outlined" size="small" disabled={saveStatus === 'saving'}>Agregar Examen</Button>
        {saveStatus === 'saving' && <CircularProgress size={20} />}
        {saveStatus === 'saved' && <Typography sx={{ color: 'success.main' }}>Guardado ✓</Typography>}
        {saveStatus === 'error' && <Typography color="error">Error al guardar</Typography>}
      </Box>
      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableBody>
            {examenes.map(ex => (
              <TableRow key={ex.id}>
                <TableCell>{ex.tipo_examen}</TableCell>
                <TableCell>{formatDateDisplay(ex.fecha)}</TableCell>
                <TableCell align="right"><Button onClick={() => handleDelete(ex.id)} size="small" color="error">X</Button></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

// --- BloqueExamenManager (for Finals/Equiv) ---
function BloqueExamenManager({ bloque }: { bloque: Bloque }) {
  const [examenes, setExamenes] = useState<Examen[]>([]);
  const [form, setForm] = useState<ExamenFormState>({ tipo_examen: 'FINAL_SINC', fecha: '', bloque: bloque.id, modulo: null });
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  const fetchExamenes = useCallback(async () => {
    try {
      const res = await listExamenes({ bloque_id: bloque.id });
      setExamenes(Array.isArray(res) ? res : []);
    } catch (err) { console.error("Error fetching bloque examenes:", err); }
  }, [bloque.id]);

  useEffect(() => { fetchExamenes(); }, [fetchExamenes]);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | { target: { name: string; value: unknown } }) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaveStatus('saving');
    try {
      const payload: Partial<Examen> & { fecha: string | null } = {
        tipo_examen: form.tipo_examen,
        fecha: form.fecha === '' ? null : form.fecha,
        modulo_id: form.modulo,
        bloque_id: form.bloque,
        peso: 1
      };
      await createExamen(payload);
      setForm({ tipo_examen: 'FINAL_SINC', fecha: '', bloque: bloque.id, modulo: null });
      fetchExamenes();
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (err) {
      console.error("Error creating bloque examen:", err);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 2000);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("¿Eliminar examen final?")) {
      setSaveStatus('saving');
      try {
        await deleteExamen(id);
        fetchExamenes();
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      } catch (err) {
        console.error("Error deleting bloque examen:", err);
        setSaveStatus('error');
        setTimeout(() => setSaveStatus('idle'), 2000);
      }
    }
  };

  return (
    <Box>
      <Typography variant="subtitle1" sx={{ mt: 2 }}>Exámenes Finales del Bloque</Typography>
      <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', gap: 1, my: 1, alignItems: 'center' }}>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Tipo</InputLabel>
          <Select name="tipo_examen" value={form.tipo_examen} label="Tipo" onChange={(e) => handleFormChange(e)}>
            <MenuItem value="FINAL_VIRTUAL">Final Virtual</MenuItem>
            <MenuItem value="FINAL_SINC">Final Sincrónico</MenuItem>
            <MenuItem value="EQUIVALENCIA">Equivalencia</MenuItem>
          </Select>
        </FormControl>
        <TextField name="fecha" type="date" value={form.fecha} onChange={handleFormChange} size="small" InputLabelProps={{ shrink: true }} />
        <Button type="submit" variant="outlined" size="small" disabled={saveStatus === 'saving'}>Agregar Examen Final</Button>
        {saveStatus === 'saving' && <CircularProgress size={20} />}
        {saveStatus === 'saved' && <Typography sx={{ color: 'success.main' }}>Guardado ✓</Typography>}
        {saveStatus === 'error' && <Typography color="error">Error al guardar</Typography>}
      </Box>
      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableBody>
            {examenes.map(ex => (
              <TableRow key={ex.id}>
                <TableCell>{ex.tipo_examen}</TableCell>
                <TableCell>{formatDateDisplay(ex.fecha)}</TableCell>
                <TableCell align="right"><Button onClick={() => handleDelete(ex.id)} size="small" color="error">X</Button></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

// --- ModuloManager ---
function ModuloManager({ bloque }: { bloque: Bloque }) {
  const [modulos, setModulos] = useState<Modulo[]>([]);
  const [form, setForm] = useState<ModuloFormState>({ nombre: '', orden: 10, bloque: bloque.id });
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  const fetchModulos = useCallback(async () => {
    try {
      const res = await listModulos({ bloque_id: bloque.id });
      setModulos(Array.isArray(res) ? res : []);
    } catch (err) { console.error("Error fetching modulos:", err); }
  }, [bloque.id]);

  useEffect(() => { fetchModulos(); }, [fetchModulos]);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const val = e.target.name === 'orden' ? Number(e.target.value) : e.target.value;
    setForm(f => ({ ...f, [e.target.name]: val }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaveStatus('saving');
    try {
      await createModulo({
        nombre: form.nombre,
        orden: form.orden,
        bloque_id: form.bloque,
        es_practica: false,
        asistencia_requerida_practica: 80
      });
      setForm({ nombre: '', orden: 10, bloque: bloque.id });
      fetchModulos();
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (err) {
      console.error("Error creating modulo:", err);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 2000);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("¿Eliminar módulo? Se borrarán sus exámenes.")) {
      setSaveStatus('saving');
      try {
        await deleteModulo(id);
        fetchModulos();
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      } catch (err) {
        console.error("Error deleting modulo:", err);
        setSaveStatus('error');
        setTimeout(() => setSaveStatus('idle'), 2000);
      }
    }
  };

  return (
    <Box>
      <Typography variant="subtitle1" sx={{ mt: 1 }}>Módulos del Bloque</Typography>
      <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', gap: 1, my: 1, alignItems: 'center' }}>
        <TextField name="nombre" value={form.nombre} onChange={handleFormChange} label="Nombre del Módulo" size="small" required />
        <TextField name="orden" value={form.orden} onChange={handleFormChange} label="Orden" type="number" size="small" required />
        <Button type="submit" variant="outlined" size="small" disabled={saveStatus === 'saving'}>Agregar Módulo</Button>
        {saveStatus === 'saving' && <CircularProgress size={20} />}
        {saveStatus === 'saved' && <Typography sx={{ color: 'success.main' }}>Guardado ✓</Typography>}
        {saveStatus === 'error' && <Typography color="error">Error al guardar</Typography>}
      </Box>
      {modulos.map(m => (
        <Accordion key={m.id} sx={{ my: 1 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography sx={{ flexShrink: 0, mr: 2 }}>Orden: {m.orden}</Typography>
            <Typography sx={{ flexGrow: 1 }}>{m.nombre}</Typography>
            <Button onClick={(e) => { e.stopPropagation(); handleDelete(m.id); }} size="small" color="error">Eliminar Módulo</Button>
          </AccordionSummary>
          <AccordionDetails>
            <ModuloExamenManager modulo={m} />
          </AccordionDetails>
        </Accordion>
      ))}
    </Box>
  );
}

interface BloqueManagerProps {
  curso: Programa;
  bloques: Bloque[];
  setBloques: React.Dispatch<React.SetStateAction<Bloque[]>>;
}

// --- BloqueManager ---
function BloqueManager({ curso, bloques, setBloques }: BloqueManagerProps) {
  const [form, setForm] = useState<BloqueFormState>({ nombre: '', orden: 10, programa_id: curso.id });
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  useEffect(() => {
    setForm(f => ({ ...f, programa_id: curso.id }));
  }, [curso.id]);

  const fetchBloques = useCallback(async () => {
    try {
      const res = await listBloques({ programa_id: curso.id });
      setBloques(Array.isArray(res) ? res : []);
    } catch (err) { console.error("Error fetching bloques:", err); }
  }, [curso.id, setBloques]);

  useEffect(() => { fetchBloques(); }, [fetchBloques, setBloques]);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const val = e.target.name === 'orden' ? Number(e.target.value) : e.target.value;
    setForm(f => ({ ...f, [e.target.name]: val }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaveStatus('saving');
    try {
      await createBloque({
        nombre: form.nombre,
        orden: form.orden,
        programa_id: form.programa_id,
        correlativas_ids: []
      });
      setForm({ nombre: '', orden: 10, programa_id: curso.id });
      fetchBloques();
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (err) {
      console.error("Error creating bloque:", err);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 2000);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("¿Eliminar bloque? Se borrarán sus módulos y exámenes.")) {
      setSaveStatus('saving');
      try {
        await deleteBloque(id);
        fetchBloques();
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      } catch (err) {
        console.error("Error deleting bloque:", err);
        setSaveStatus('error');
        setTimeout(() => setSaveStatus('idle'), 2000);
      }
    }
  };

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="h6">Bloques del Curso</Typography>
      <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', gap: 2, my: 2, alignItems: 'center' }}>
        <TextField name="nombre" value={form.nombre} onChange={handleFormChange} label="Nombre del Bloque" size="small" required />
        <TextField name="orden" value={form.orden} onChange={handleFormChange} label="Orden" type="number" size="small" required />
        <Button type="submit" variant="contained" disabled={saveStatus === 'saving'}>Agregar Bloque</Button>
        {saveStatus === 'saving' && <CircularProgress size={20} />}
        {saveStatus === 'saved' && <Typography sx={{ color: 'success.main' }}>Guardado ✓</Typography>}
        {saveStatus === 'error' && <Typography color="error">Error al guardar</Typography>}
      </Box>

      {bloques && bloques.length > 0 ? (
        bloques.map(b => (
          <Accordion key={b.id}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography sx={{ flexShrink: 0, mr: 2 }}>Orden: {b.orden}</Typography>
              <Typography sx={{ flexGrow: 1 }}>{b.nombre}</Typography>
              <Button onClick={(e) => { e.stopPropagation(); handleDelete(b.id); }} size="small" color="error">Eliminar Bloque</Button>
            </AccordionSummary>
            <AccordionDetails>
              <BloqueExamenManager bloque={b} />
              <Divider sx={{ my: 2 }} />
              <ModuloManager bloque={b} />
            </AccordionDetails>
          </Accordion>
        ))
      ) : (
        <Typography>No hay bloques definidos.</Typography>
      )}
    </Box>
  );
}

function ModuloExamenPreview({ modulo }: { modulo: Modulo }) {
  const [examenes, setExamenes] = useState<Examen[]>([]);

  useEffect(() => {
    async function fetchModuloExamenes() {
      try {
        const res = await listExamenes({ modulo_id: modulo.id });
        const arr = Array.isArray(res) ? res : [];
        setExamenes(arr.filter(ex => ['PARCIAL', 'RECUP'].includes(ex.tipo_examen)));
      } catch (err) {
        console.error("Error fetching module examenes for preview:", err);
      }
    }
    fetchModuloExamenes();
  }, [modulo.id]);

  if (examenes.length === 0) return null;

  return (
    <Box sx={{ mt: 1, ml: 2 }}>
      <Typography variant="subtitle2">Exámenes del Módulo:</Typography>
      <TableContainer component={Paper} variant="outlined" sx={{ mt: 0.5 }}>
        <Table size="small">
          <TableBody>
            {examenes.map(ex => (
              <TableRow key={ex.id}>
                <TableCell>{ex.tipo_examen}</TableCell>
                <TableCell>{formatDateDisplay(ex.fecha)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

function ModuloPreview({ bloque }: { bloque: Bloque }) {
  const [modulos, setModulos] = useState<Modulo[]>([]);

  useEffect(() => {
    async function fetchModulos() {
      try {
        const res = await listModulos({ bloque_id: bloque.id });
        setModulos(Array.isArray(res) ? res : []);
      } catch (err) {
        console.error("Error fetching modulos for preview:", err);
      }
    }
    fetchModulos();
  }, [bloque.id]);

  if (modulos.length === 0) return null;

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="subtitle1">Módulos:</Typography>
      {modulos.map(modulo => (
        <Accordion key={modulo.id} defaultExpanded sx={{ ml: 2, my: 1 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>Módulo {modulo.orden}: {modulo.nombre}</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <ModuloExamenPreview modulo={modulo} />
          </AccordionDetails>
        </Accordion>
      ))}
    </Box>
  );
}

function BloqueExamenPreview({ bloque }: { bloque: Bloque }) {
  const [examenes, setExamenes] = useState<Examen[]>([]);

  useEffect(() => {
    async function fetchBloqueExamenes() {
      try {
        const res = await listExamenes({ bloque_id: bloque.id });
        const arr = Array.isArray(res) ? res : [];
        setExamenes(arr.filter(ex => ['FINAL_SINC', 'FINAL_VIRTUAL', 'EQUIVALENCIA'].includes(ex.tipo_examen)));
      } catch (err) {
        console.error("Error fetching bloque examenes for preview:", err);
      }
    }
    fetchBloqueExamenes();
  }, [bloque.id]);

  if (examenes.length === 0) return null;

  return (
    <Box sx={{ mt: 2, ml: 2 }}>
      <Typography variant="subtitle1">Exámenes Finales del Bloque:</Typography>
      <TableContainer component={Paper} variant="outlined" sx={{ mt: 1 }}>
        <Table size="small">
          <TableBody>
            {examenes.map(ex => (
              <TableRow key={ex.id}>
                <TableCell>{ex.tipo_examen}</TableCell>
                <TableCell>{formatDateDisplay(ex.fecha)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

interface CoursePreviewProps {
  curso: Programa;
  bloques: Bloque[];
}

function CoursePreview({ curso, bloques }: CoursePreviewProps) {
  return (
    <Box>
      <Typography variant="h5" gutterBottom>Vista Previa del Curso: {curso.nombre}</Typography>
      {bloques.length > 0 ? (
        bloques.map(bloque => (
          <Accordion key={bloque.id} defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle1">Bloque {bloque.orden}: {bloque.nombre}</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <ModuloPreview bloque={bloque} />
              <BloqueExamenPreview bloque={bloque} />
            </AccordionDetails>
          </Accordion>
        ))
      ) : (
        <Typography>No hay bloques definidos para este curso.</Typography>
      )}
    </Box>
  );
}

// --- Main Component ---
export default function CursoDetail() {
  const { id } = useParams<{ id: string }>();
  const [curso, setCurso] = useState<Programa | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'edit' | 'preview'>('edit'); // 'edit' or 'preview'
  const [bloques, setBloques] = useState<Bloque[]>([]);
  // Inline graph (API-based)
  const [cohortes, setCohortes] = useState<Cohorte[]>([]);
  const [cohorteId, setCohorteId] = useState<string>('');
  const [graph, setGraph] = useState<CourseGraph | null>(null);
  const [graphLoading, setGraphLoading] = useState(false);

  const fetchData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const currentCurso = await getCurso(Number(id));
      setCurso(currentCurso);

      const bloquesData = await listBloques({ programa_id: currentCurso.id });
      setBloques(Array.isArray(bloquesData) ? bloquesData : []);

    } catch (err) {
      console.error("Failed to fetch course structure:", err);
      setError("Ocurrió un error al cargar la estructura del curso.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) fetchData();
  }, [id, fetchData]);

  useEffect(() => {
    const loadCohorts = async () => {
      if (!id) return;
      try {
        const res = await listCohortes({ programa_id: Number(id) });
        setCohortes(Array.isArray(res) ? res : []);
      } catch (e) {
        setCohortes([]);
      }
    };
    if (id) loadCohorts();
  }, [id]);

  const handleLoadGraph = async () => {
    if (!id) return;
    setGraphLoading(true);
    try {
      const data = await getCoursesGraph({ programa_id: Number(id), cohorte_id: cohorteId || undefined }) as CourseGraph;
      setGraph(data);
    } catch (e) {
      setGraph(null);
    } finally {
      setGraphLoading(false);
    }
  };

  if (loading) return <CircularProgress />;
  if (error) return <Typography color="error">{error}</Typography>;
  if (!curso) return <Typography>No se encontró el curso.</Typography>;

  return (
    <Box>
      <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
        <RouterLink to="/cursos">Capacitaciones / Cursos</RouterLink>
        <Typography color="text.primary">{curso.nombre}</Typography>
      </Breadcrumbs>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4" gutterBottom>{curso.nombre}</Typography>
        <Button variant="outlined" onClick={() => setViewMode(viewMode === 'edit' ? 'preview' : 'edit')}>
          {viewMode === 'edit' ? 'Vista Previa' : 'Volver a Edición'}
        </Button>
      </Box>

      <Paper sx={{ p: 2, mt: 2 }}>
        {/* Grafico de Curso (API) */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 1 }}>Gráfico del Curso (API)</Typography>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap', mb: 1 }}>
            <FormControl size="small" sx={{ minWidth: 240 }}>
              <InputLabel id="coh-label">Cohorte (opcional)</InputLabel>
              <Select labelId="coh-label" label="Cohorte (opcional)" value={cohorteId} onChange={(e) => setCohorteId(e.target.value as string)}>
                <MenuItem value=""><em>Todas</em></MenuItem>
                {(cohortes || []).map(c => (
                  <MenuItem key={c.id} value={c.id}>{c.nombre}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button variant="outlined" size="small" onClick={handleLoadGraph} disabled={graphLoading}>Cargar</Button>
            {graphLoading && <CircularProgress size={20} />}
          </Box>
          {graph && (
            <Box>
              {(graph.tree || []).map(blo => (
                <Accordion key={`blo-${blo.id}`} sx={{ my: 1 }}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography>Bloque {blo.orden}: {blo.nombre}</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    {(blo.children || []).map(mod => (
                      <Box key={`mod-${mod.id}`} sx={{ pl: 2, py: 0.5 }}>
                        <Typography variant="body2">Módulo {mod.orden}: {mod.nombre} {mod.es_practica ? '(Práctica)' : ''}</Typography>
                      </Box>
                    ))}
                    {Array.isArray(blo.finales) && blo.finales.length > 0 && (
                      <Box sx={{ pl: 2, pt: 1 }}>
                        <Typography variant="subtitle2">Finales del Bloque</Typography>
                        {blo.finales.map(fin => (
                          <Typography key={`fin-${fin.id}`} variant="body2" color="text.secondary">- {fin.tipo_examen} {fin.fecha ? `(${formatDateDisplay(fin.fecha)})` : ''}</Typography>
                        ))}
                      </Box>
                    )}
                  </AccordionDetails>
                </Accordion>
              ))}
            </Box>
          )}
        </Box>

        {viewMode === 'edit' ? (
          <BloqueManager curso={curso} bloques={bloques} setBloques={setBloques} />
        ) : (
          <CoursePreview curso={curso} bloques={bloques} />
        )}
      </Paper>

    </Box>
  );
}
