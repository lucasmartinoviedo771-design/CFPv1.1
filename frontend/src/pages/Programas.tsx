import React, { useMemo, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
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
  TextField,
  Checkbox,
  FormControlLabel,
  Link,
  TablePagination,
  Stack,
  Snackbar,
  Alert,
} from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import { useDeletePrograma, useProgramas, useSavePrograma } from "../api/hooks";
import type { Programa } from "../api/types";

type Feedback = { open: boolean; message: string; severity: "success" | "error" | "info" };

const initialForm: Partial<Programa> = { codigo: "", nombre: "", activo: true };

export default function Programas() {
  const [form, setForm] = useState<Partial<Programa>>(initialForm);
  const [editing, setEditing] = useState<Programa | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [feedback, setFeedback] = useState<Feedback>({ open: false, message: "", severity: "success" });

  const { data: programas = [], isLoading, refetch } = useProgramas();
  const savePrograma = useSavePrograma();
  const deletePrograma = useDeletePrograma();

  const paginatedRows = useMemo(() => {
    const start = page * rowsPerPage;
    const end = start + rowsPerPage;
    return programas.slice(start, end);
  }, [programas, page, rowsPerPage]);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.codigo || !form.nombre) {
      setFeedback({ open: true, message: "Completa codigo y nombre.", severity: "error" });
      return;
    }
    try {
      await savePrograma.mutateAsync({ id: editing?.id, ...form });
      setFeedback({ open: true, message: editing ? "Programa actualizado" : "Programa creado", severity: "success" });
      setForm(initialForm);
      setEditing(null);
      refetch();
    } catch (error: any) {
      const msg = error?.response?.data ? JSON.stringify(error.response.data) : error?.message || "Error";
      setFeedback({ open: true, message: `Error al guardar: ${msg}`, severity: "error" });
    }
  };

  const handleEdit = (row: Programa) => {
    setEditing(row);
    setForm({ codigo: row.codigo, nombre: row.nombre, activo: row.activo });
  };

  const handleCancel = () => {
    setEditing(null);
    setForm(initialForm);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("¿Seguro que deseas eliminar el programa?")) return;
    try {
      await deletePrograma.mutateAsync(id);
      setFeedback({ open: true, message: "Programa eliminado", severity: "success" });
      refetch();
    } catch (error: any) {
      const msg = error?.response?.data ? JSON.stringify(error.response.data) : error?.message || "Error";
      setFeedback({ open: true, message: `Error al eliminar: ${msg}`, severity: "error" });
    }
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleCloseFeedback = (_: any, reason?: string) => {
    if (reason === "clickaway") return;
    setFeedback((f) => ({ ...f, open: false }));
  };

  return (
    <Box>
      <h1 className="text-3xl font-bold text-white mb-6">Programas</h1>

      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{ mb: 4, display: "flex", gap: 2, alignItems: "center", flexWrap: "wrap" }}
      >
        <TextField
          label="Codigo"
          name="codigo"
          value={form.codigo || ""}
          onChange={handleFormChange}
          variant="outlined"
          size="small"
          required
        />
        <TextField
          label="Nombre"
          name="nombre"
          value={form.nombre || ""}
          onChange={handleFormChange}
          variant="outlined"
          size="small"
          required
          sx={{ flexGrow: 1, minWidth: 240 }}
        />
        <FormControlLabel
          control={<Checkbox name="activo" checked={!!form.activo} onChange={handleFormChange} sx={{ color: 'white' }} />}
          label="Activo"
          sx={{ '& .MuiFormControlLabel-label': { color: 'white' } }}
        />

        <Stack direction="row" spacing={1}>
          <Button
            type="submit"
            variant="contained"
            startIcon={<AddRoundedIcon />}
            disabled={savePrograma.isPending}
          >
            {editing ? "Guardar" : "Crear"}
          </Button>
          {editing && (
            <Button variant="outlined" onClick={handleCancel}>
              Cancelar
            </Button>
          )}
        </Stack>
      </Box>

      {isLoading ? (
        <CircularProgress />
      ) : (
        <>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Codigo</TableCell>
                  <TableCell>Nombre</TableCell>
                  <TableCell>Activo</TableCell>
                  <TableCell align="right">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedRows.map((r) => (
                  <TableRow key={r.id} hover>
                    <TableCell>{r.codigo}</TableCell>
                    <TableCell>
                      <Link component={RouterLink} to={`/cursos/${r.id}`}>
                        {r.nombre}
                      </Link>
                    </TableCell>
                    <TableCell>{r.activo ? "Si" : "No"}</TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={1} justifyContent="flex-end">
                        <Button size="small" startIcon={<EditOutlinedIcon />} onClick={() => handleEdit(r)}>
                          Editar
                        </Button>
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
                {!paginatedRows.length && (
                  <TableRow>
                    <TableCell colSpan={4}>
                      <Typography sx={{ color: 'white' }}>No hay programas cargados.</Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
            <TablePagination
              rowsPerPageOptions={[10, 25, 50]}
              component="div"
              count={programas.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={(_, p) => setPage(p)}
              onRowsPerPageChange={handleChangeRowsPerPage}
              labelRowsPerPage="Filas por pagina:"
            />
          </Box>
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
