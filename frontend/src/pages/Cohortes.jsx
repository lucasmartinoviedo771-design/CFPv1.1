import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Button, CircularProgress, Paper,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Snackbar, Alert, TablePagination
} from '@mui/material';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import axios from 'axios';
import api from '../services/apiClient';
import authService from '../services/authService';
import CohorteFormDialog from '../components/CohorteFormDialog';


export default function Cohortes() {
  const [cohortes, setCohortes] = useState([]);
  const [programas, setProgramas] = useState([]);
  const [bloques, setBloques] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [feedback, setFeedback] = useState({ open: false, message: '', severity: 'success' });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [total, setTotal] = useState(0);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [cohortesRes, programasRes, bloquesRes] = await Promise.all([
        api.get('/inscripciones/cohortes', { params: { programa_id: undefined } }),
        api.get('/programas'),
        axios.get('/api/bloques-de-fechas/', {
          headers: authService.getAccessToken() ? { Authorization: `Bearer ${authService.getAccessToken()}` } : {},
        }),
      ]);
      const cohortesData = Array.isArray(cohortesRes.data) ? cohortesRes.data : [];
      setCohortes(cohortesData);
      setTotal(cohortesData.length);
      setProgramas(Array.isArray(programasRes.data) ? programasRes.data : []);
      const bloquesData = bloquesRes.data;
      const bloquesArr = Array.isArray(bloquesData) ? bloquesData : Array.isArray(bloquesData?.results) ? bloquesData.results : [];
      setBloques(bloquesArr);
    } catch (error) {
      console.error("Error fetching data:", error);
      setFeedback({ open: true, message: 'Error al cargar los datos.', severity: 'error' });
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSave = async (formData) => {
    try {
      const payload = {
        nombre: formData.nombre,
        programa_id: formData.programa,
        bloque_fechas_id: formData.bloque_fechas,
      };

      // Persist via DRF (aun no hay POST en Ninja para cohortes)
      const token = authService.getAccessToken();
      await axios.post('/api/cohortes/', payload, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      setFeedback({ open: true, message: 'Cohorte creada con éxito.', severity: 'success' });
      setOpenDialog(false);
      fetchData();
    } catch (error) {
      const errorMsg = error.response?.data ? JSON.stringify(error.response.data) : error.message;
      setFeedback({ open: true, message: `Error al guardar: ${errorMsg}`, severity: 'error' });
    }
  };

  const handleCloseFeedback = (event, reason) => {
    if (reason === 'clickaway') return;
    setFeedback({ ...feedback, open: false });
  };

  return (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <h1 className="text-3xl font-bold text-white">Gestión de Cohortes</h1>
        <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={() => setOpenDialog(true)}>
          Crear Cohorte
        </Button>
      </Box>
      <p className="text-indigo-200 mb-6 font-medium">
        Una cohorte representa una cursada específica, vinculando un Programa con un Calendario.
      </p>

      {loading ? <CircularProgress /> : (
        <>
          <TableContainer component={Paper} sx={{ bgcolor: 'rgba(255,255,255,0.05)', color: 'white' }}>
            <Table sx={{ '& .MuiTableCell-root': { color: 'white', borderBottom: '1px solid rgba(255,255,255,0.1)' } }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>Nombre Cohorte</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Programa</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Calendario</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {cohortes.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map(c => (
                  <TableRow key={c.id}>
                    <TableCell>{c.nombre}</TableCell>
                    <TableCell>{programas.find(p => p.id === c.programa_id)?.nombre || c.programa_id}</TableCell>
                    <TableCell>{bloques.find(b => b.id === c.bloque_fechas_id)?.nombre || c.bloque_fechas_id}</TableCell>
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
              count={total}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={(e, p) => setPage(p)}
              onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
              labelRowsPerPage="Filas por página:"
            />
          </Box>
        </>
      )}

      <CohorteFormDialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        onSave={handleSave}
        programas={programas}
        bloques={bloques}
      />

      <Snackbar open={feedback.open} autoHideDuration={6000} onClose={handleCloseFeedback} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert onClose={handleCloseFeedback} severity={feedback.severity} sx={{ width: '100%' }}>
          {feedback.message}
        </Alert>
      </Snackbar>
    </>
  );
}
