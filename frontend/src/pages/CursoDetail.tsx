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

import {
  ExamenFormState, ModuloFormState, BloqueFormState, GraphChild, GraphFinal, GraphBloque, CourseGraph
} from "../components/CursoDetail/types";
import BloqueManager from "../components/CursoDetail/BloqueManager";
import CoursePreview from "../components/CursoDetail/CoursePreview";

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
