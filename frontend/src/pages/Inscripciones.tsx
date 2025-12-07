import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Checkbox,
  FormControlLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  TablePagination,
  Snackbar,
  Alert,
  Stack,
  type SelectChangeEvent,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import {
  useCohortes,
  useDeleteInscripcion,
  useInscripciones,
  useProgramas,
  useSaveInscripcion,
  useEstudiantes,
} from "../api/hooks";
import type { Bloque, Cohorte, Estudiante, Inscripcion, Modulo, Programa } from "../api/types";
import { apiClientV2 } from "../api/client";

type BloqueConModulos = Bloque & { modulos: Modulo[] };
type Feedback = { open: boolean; message: string; severity: "success" | "error" | "info" };

export default function Inscripciones() {
  const [selectedStudent, setSelectedStudent] = useState<number | "">("");
  const [selectedCohortes, setSelectedCohortes] = useState<number[]>([]);
  const [selectedModulos, setSelectedModulos] = useState<Record<number, number[]>>({});
  const [cohorteBloques, setCohorteBloques] = useState<Record<number, BloqueConModulos[]>>({});
  const [approvedModuleIds, setApprovedModuleIds] = useState<Set<number>>(new Set());
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [feedback, setFeedback] = useState<Feedback>({ open: false, message: "", severity: "success" });
  const [loadingBloques, setLoadingBloques] = useState<Record<number, boolean>>({});

  const { data: estudiantes = [] } = useEstudiantes();
  const { data: cohortes = [] } = useCohortes();
  const { data: programas = [] } = useProgramas();
  const { data: inscripciones = [], isLoading: loadingInscripciones, refetch: refetchInscripciones } = useInscripciones();
  const saveInscripcion = useSaveInscripcion();
  const deleteInscripcion = useDeleteInscripcion();

  const programaMap = useMemo<Record<number, Programa>>(
    () => Object.fromEntries(programas.map((p) => [p.id, p])),
    [programas]
  );

  const inscripcionesAlumnoSet = useMemo(() => {
    if (!selectedStudent) return new Set<number>();
    const set = new Set<number>();
    inscripciones
      .filter((i) => i.estudiante_id === selectedStudent && i.modulo_id)
      .forEach((i) => set.add(i.modulo_id as number));
    return set;
  }, [inscripciones, selectedStudent]);

  useEffect(() => {
    // Cada vez que cambia el alumno, refrescamos módulos aprobados
    if (!selectedStudent) {
      setApprovedModuleIds(new Set());
      return;
    }
    const fetchApproved = async () => {
      try {
        const { data } = await apiClientV2.get("/examenes/notas", { params: { estudiante_id: selectedStudent, aprobado: true } });
        const modIds = new Set<number>();
        (data || []).forEach((nota: any) => {
          if (nota.examen_modulo_id) modIds.add(nota.examen_modulo_id);
        });
        setApprovedModuleIds(modIds);
      } catch (error: any) {
        const msg = error?.response?.data ? JSON.stringify(error.response.data) : error?.message || "Error";
        setFeedback({ open: true, message: `No se pudieron cargar notas aprobadas: ${msg}`, severity: "error" });
      }
    };
    fetchApproved();
  }, [selectedStudent]);

  const loadBloquesForCohorte = async (cohorteId: number) => {
    const cohorte = cohortes.find((c) => c.id === cohorteId);
    if (!cohorte) return;
    setLoadingBloques((prev) => ({ ...prev, [cohorteId]: true }));
    try {
      const bloquesRes = await apiClientV2.get<Bloque[]>("/bloques", { params: { programa_id: cohorte.programa_id } });
      const bloques = bloquesRes.data || [];
      const bloquesConModulos: BloqueConModulos[] = await Promise.all(
        bloques.map(async (b) => {
          const modRes = await apiClientV2.get<Modulo[]>("/modulos", { params: { bloque_id: b.id } });
          return { ...b, modulos: modRes.data || [] };
        })
      );
      setCohorteBloques((prev) => ({ ...prev, [cohorteId]: bloquesConModulos }));
    } catch (error: any) {
      const msg = error?.response?.data ? JSON.stringify(error.response.data) : error?.message || "Error";
      setFeedback({ open: true, message: `Error cargando bloques/modulos: ${msg}`, severity: "error" });
    } finally {
      setLoadingBloques((prev) => ({ ...prev, [cohorteId]: false }));
    }
  };

  const handleStudentChange = (event: SelectChangeEvent<number | "">) => {
    const rawValue = event.target.value as string;
    const studentId = rawValue === "" ? "" : Number(rawValue);
    setSelectedStudent(studentId);
    setSelectedCohortes([]);
    setSelectedModulos({});
    setApprovedModuleIds(new Set());
  };

  const handleCohorteToggle = async (cohorteId: number) => {
    const isSelected = selectedCohortes.includes(cohorteId);
    if (isSelected) {
      setSelectedCohortes((prev) => prev.filter((id) => id !== cohorteId));
      setCohorteBloques((prev) => {
        const copy = { ...prev };
        delete copy[cohorteId];
        return copy;
      });
      setSelectedModulos((prev) => {
        const copy = { ...prev };
        delete copy[cohorteId];
        return copy;
      });
    } else {
      setSelectedCohortes((prev) => [...prev, cohorteId]);
      await loadBloquesForCohorte(cohorteId);
    }
  };

  const handleModuloToggle = (cohorteId: number, moduloId: number) => {
    setSelectedModulos((prev) => {
      const cohorteMods = prev[cohorteId] || [];
      const newMods = cohorteMods.includes(moduloId)
        ? cohorteMods.filter((id) => id !== moduloId)
        : [...cohorteMods, moduloId];
      return { ...prev, [cohorteId]: newMods };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) {
      setFeedback({ open: true, message: "Selecciona un estudiante.", severity: "error" });
      return;
    }
    type InscripcionPayload = { estudiante_id: number; cohorte_id: number; modulo_id?: number | null; estado?: string };
    const inscripcionesACrear: InscripcionPayload[] = [];
    Object.entries(selectedModulos).forEach(([cohorteIdStr, mods]) => {
      const cohorteId = Number(cohorteIdStr);
      mods.forEach((moduloId) => {
        inscripcionesACrear.push({
          estudiante_id: Number(selectedStudent),
          cohorte_id: cohorteId,
          modulo_id: moduloId,
          estado: "ACTIVO",
        });
      });
    });
    if (!inscripcionesACrear.length) {
      setFeedback({ open: true, message: "Selecciona al menos un modulo para inscribir.", severity: "error" });
      return;
    }
    try {
      await Promise.all(inscripcionesACrear.map((insc) => saveInscripcion.mutateAsync(insc)));
      setFeedback({ open: true, message: "Inscripcion/es creadas", severity: "success" });
      setSelectedCohortes([]);
      setSelectedModulos({});
      await refetchInscripciones();
    } catch (error: any) {
      const msg = error?.response?.data ? JSON.stringify(error.response.data) : error?.message || "Error";
      setFeedback({ open: true, message: `Error al inscribir: ${msg}`, severity: "error" });
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("¿Seguro que deseas eliminar esta inscripcion?")) return;
    try {
      await deleteInscripcion.mutateAsync(id);
      setFeedback({ open: true, message: "Inscripcion eliminada", severity: "success" });
      refetchInscripciones();
    } catch (error: any) {
      const msg = error?.response?.data ? JSON.stringify(error.response.data) : error?.message || "Error";
      setFeedback({ open: true, message: `No se pudo eliminar: ${msg}`, severity: "error" });
    }
  };

  const paginatedInscripciones = useMemo(() => {
    const start = page * rowsPerPage;
    const end = start + rowsPerPage;
    return inscripciones.slice(start, end);
  }, [inscripciones, page, rowsPerPage]);

  const handleCloseFeedback = (_: any, reason?: string) => {
    if (reason === "clickaway") return;
    setFeedback((f) => ({ ...f, open: false }));
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Gestionar Inscripciones</Typography>

      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>Inscribir Estudiante a Modulos</Typography>
        <Box component="form" onSubmit={handleSubmit} sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <FormControl fullWidth size="small">
            <InputLabel id="student-select-label">Estudiante</InputLabel>
            <Select
              labelId="student-select-label"
              value={selectedStudent}
              label="Estudiante"
              onChange={handleStudentChange}
            >
              <MenuItem value="">
                <em>Selecciona un estudiante</em>
              </MenuItem>
              {estudiantes.map((student: Estudiante) => (
                <MenuItem key={student.id} value={student.id}>
                  {student.apellido}, {student.nombre} ({student.dni})
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {selectedStudent && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle1">Selecciona Cohortes:</Typography>
              {cohortes.map((cohorte: Cohorte) => (
                <FormControlLabel
                  key={cohorte.id}
                  control={
                    <Checkbox
                      checked={selectedCohortes.includes(cohorte.id)}
                      onChange={() => handleCohorteToggle(cohorte.id)}
                    />
                  }
                  label={`${programaMap[cohorte.programa_id]?.nombre || "Programa"} - ${cohorte.nombre}`}
                />
              ))}
            </Box>
          )}

          {selectedCohortes.map((cohorteId) => (
            <Box key={cohorteId} sx={{ mt: 2, ml: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                Modulos para {cohortes.find((c) => c.id === cohorteId)?.nombre}:
              </Typography>
              {loadingBloques[cohorteId] && <CircularProgress size={20} />}
              {cohorteBloques[cohorteId]?.map((bloque) => (
                <Accordion key={bloque.id} sx={{ mt: 1 }} defaultExpanded>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography>{bloque.nombre}</Typography>
                  </AccordionSummary>
                  <AccordionDetails sx={{ display: "flex", flexDirection: "column" }}>
                    {[...bloque.modulos].sort((a, b) => a.orden - b.orden).map((modulo) => {
                      const isApproved = approvedModuleIds.has(modulo.id);
                      const alreadyEnrolled = inscripcionesAlumnoSet.has(modulo.id);
                      const checked = isApproved || alreadyEnrolled || (selectedModulos[cohorteId]?.includes(modulo.id) ?? false);
                      return (
                        <FormControlLabel
                          key={modulo.id}
                          sx={{ ml: 2 }}
                          control={
                            <Checkbox
                              checked={checked}
                              onChange={() => handleModuloToggle(cohorteId, modulo.id)}
                              disabled={isApproved || alreadyEnrolled}
                            />
                          }
                          label={`${modulo.nombre} ${isApproved ? "(Aprobado)" : ""} ${alreadyEnrolled ? "(Inscripto)" : ""}`}
                        />
                      );
                    })}
                  </AccordionDetails>
                </Accordion>
              ))}
            </Box>
          ))}

          <Button
            type="submit"
            variant="contained"
            sx={{ mt: 2, alignSelf: "flex-start" }}
            disabled={!selectedStudent || selectedCohortes.length === 0 || saveInscripcion.isPending}
          >
            Inscribir
          </Button>
        </Box>
      </Paper>

      <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>Inscripciones Existentes</Typography>
      {loadingInscripciones ? (
        <CircularProgress />
      ) : (
        <>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Estudiante</TableCell>
                  <TableCell>Cohorte</TableCell>
                  <TableCell>Modulo</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell align="right">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedInscripciones.map((r: Inscripcion) => (
                  <TableRow key={r.id}>
                    <TableCell>{r.estudiante ? `${r.estudiante.apellido}, ${r.estudiante.nombre}` : r.estudiante_id}</TableCell>
                    <TableCell>{r.cohorte ? `${programaMap[r.cohorte.programa_id]?.nombre || ""} - ${r.cohorte.nombre}` : r.cohorte_id}</TableCell>
                    <TableCell>{r.modulo?.nombre || r.modulo_id || "N/A"}</TableCell>
                    <TableCell>{r.estado}</TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={1} justifyContent="flex-end">
                        <Button
                          size="small"
                          color="error"
                          startIcon={<DeleteOutlineRoundedIcon />}
                          onClick={() => handleDelete(r.id)}
                        >
                          Eliminar
                        </Button>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
                {!paginatedInscripciones.length && (
                  <TableRow>
                    <TableCell colSpan={5}>
                      <Typography color="text.secondary">No hay inscripciones cargadas.</Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            component="div"
            count={inscripciones.length}
            page={page}
            onPageChange={(_, p) => setPage(p)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
            rowsPerPageOptions={[10, 25, 50, 100]}
            labelRowsPerPage="Filas por pagina:"
          />
        </>
      )}

      <Snackbar
        open={feedback.open}
        autoHideDuration={5000}
        onClose={handleCloseFeedback}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert onClose={handleCloseFeedback} severity={feedback.severity} sx={{ width: "100%" }}>
          {feedback.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
