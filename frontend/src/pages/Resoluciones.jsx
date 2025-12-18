import React, { useState, useCallback, useEffect } from 'react';
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
    IconButton,
    Tooltip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Checkbox,
    FormControlLabel,
    Grid,
    Chip,
    Snackbar,
    Alert,
    TablePagination,
} from '@mui/material';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import api from '../api/client';

const initialFormState = {
    numero: '',
    nombre: '',
    fecha_publicacion: '',
    vigente: true,
    observaciones: '',
};

export default function Resoluciones() {
    const [resoluciones, setResoluciones] = useState([]);
    const [loading, setLoading] = useState(true);
    const [openDialog, setOpenDialog] = useState(false);
    const [currentResolucion, setCurrentResolucion] = useState(null);
    const [form, setForm] = useState(initialFormState);
    const [feedback, setFeedback] = useState({ open: false, message: '', severity: 'success' });
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(25);

    const fetchResoluciones = useCallback(async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/resoluciones');
            setResoluciones(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error al cargar resoluciones:', error);
            setFeedback({ open: true, message: 'Error al cargar resoluciones.', severity: 'error' });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchResoluciones();
    }, [fetchResoluciones]);

    const handleOpenDialog = (resolucion = null) => {
        if (resolucion) {
            setCurrentResolucion(resolucion);
            setForm({
                numero: resolucion.numero,
                nombre: resolucion.nombre,
                fecha_publicacion: resolucion.fecha_publicacion,
                vigente: resolucion.vigente,
                observaciones: resolucion.observaciones || '',
            });
        } else {
            setCurrentResolucion(null);
            setForm(initialFormState);
        }
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setCurrentResolucion(null);
        setForm(initialFormState);
    };

    const handleFormChange = (e) => {
        const { name, value, type, checked } = e.target;
        setForm((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    const handleSave = async () => {
        try {
            if (!form.numero || !form.nombre || !form.fecha_publicacion) {
                setFeedback({ open: true, message: 'Completa los campos requeridos.', severity: 'error' });
                return;
            }

            if (currentResolucion) {
                await api.put(`/resoluciones/${currentResolucion.id}`, form);
                setFeedback({ open: true, message: 'Resolución actualizada con éxito', severity: 'success' });
            } else {
                await api.post('/resoluciones', form);
                setFeedback({ open: true, message: 'Resolución creada con éxito', severity: 'success' });
            }

            handleCloseDialog();
            fetchResoluciones();
        } catch (error) {
            const errorMsg = error.response?.data ? JSON.stringify(error.response.data) : error.message;
            setFeedback({ open: true, message: `Error al guardar: ${errorMsg}`, severity: 'error' });
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('¿Estás seguro de eliminar esta resolución?')) return;

        try {
            const response = await api.delete(`/resoluciones/${id}`);

            if (response.data.error) {
                setFeedback({
                    open: true,
                    message: response.data.error,
                    severity: 'warning'
                });
            } else {
                setFeedback({ open: true, message: 'Resolución eliminada con éxito', severity: 'success' });
                fetchResoluciones();
            }
        } catch (error) {
            const errorMsg = error.response?.data?.error || error.message;
            setFeedback({ open: true, message: `Error al eliminar: ${errorMsg}`, severity: 'error' });
        }
    };

    const handleCloseFeedback = (event, reason) => {
        if (reason === 'clickaway') return;
        setFeedback({ ...feedback, open: false });
    };

    const paginatedResoluciones = resoluciones.slice(
        page * rowsPerPage,
        page * rowsPerPage + rowsPerPage
    );

    return (
        <>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <div>
                    <h1 className="text-3xl font-bold text-white">Gestión de Resoluciones</h1>
                    <p className="text-indigo-200 mt-2">Marco legal que habilita la oferta de capacitaciones</p>
                </div>
                <Button
                    variant="contained"
                    startIcon={<AddRoundedIcon />}
                    onClick={() => handleOpenDialog()}
                    sx={{ bgcolor: '#4f46e5', '&:hover': { bgcolor: '#4338ca' } }}
                >
                    Nueva Resolución
                </Button>
            </Box>

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                    <CircularProgress />
                </Box>
            ) : (
                <>
                    <TableContainer
                        component={Paper}
                        sx={{
                            bgcolor: 'rgba(255,255,255,0.05)',
                            backdropFilter: 'blur(10px)',
                            border: '1px solid rgba(99, 102, 241, 0.3)',
                        }}
                    >
                        <Table sx={{ '& .MuiTableCell-root': { color: 'white', borderBottom: '1px solid rgba(255,255,255,0.1)' } }}>
                            <TableHead>
                                <TableRow sx={{ bgcolor: 'rgba(79, 70, 229, 0.1)' }}>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Número</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Nombre</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Fecha Publicación</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Estado</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>Acciones</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {paginatedResoluciones.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} align="center">
                                            <Typography sx={{ color: 'rgba(255,255,255,0.5)', py: 4 }}>
                                                No hay resoluciones cargadas. Crea una para empezar.
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    paginatedResoluciones.map((resolucion) => (
                                        <TableRow key={resolucion.id} hover sx={{ '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' } }}>
                                            <TableCell>
                                                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                                    {resolucion.numero}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>{resolucion.nombre}</TableCell>
                                            <TableCell>
                                                {new Date(resolucion.fecha_publicacion).toLocaleDateString('es-AR')}
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={resolucion.vigente ? 'Vigente' : 'No vigente'}
                                                    size="small"
                                                    color={resolucion.vigente ? 'success' : 'default'}
                                                    sx={{
                                                        bgcolor: resolucion.vigente ? 'rgba(76, 175, 80, 0.2)' : 'rgba(158, 158, 158, 0.2)',
                                                        color: resolucion.vigente ? '#4caf50' : '#9e9e9e',
                                                    }}
                                                />
                                            </TableCell>
                                            <TableCell align="right">
                                                <Tooltip title="Editar">
                                                    <IconButton size="small" onClick={() => handleOpenDialog(resolucion)}>
                                                        <EditOutlinedIcon sx={{ color: 'rgba(255,255,255,0.7)' }} />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Eliminar">
                                                    <IconButton size="small" onClick={() => handleDelete(resolucion.id)}>
                                                        <DeleteOutlineRoundedIcon sx={{ color: 'rgba(255,255,255,0.7)' }} />
                                                    </IconButton>
                                                </Tooltip>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>

                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                        <TablePagination
                            sx={{
                                color: 'white',
                                '& .MuiTablePagination-selectIcon': { color: 'white' },
                                '& .MuiIconButton-root': { color: 'white' },
                            }}
                            rowsPerPageOptions={[10, 25, 50]}
                            component="div"
                            count={resoluciones.length}
                            rowsPerPage={rowsPerPage}
                            page={page}
                            onPageChange={(e, p) => setPage(p)}
                            onRowsPerPageChange={(e) => {
                                setRowsPerPage(parseInt(e.target.value, 10));
                                setPage(0);
                            }}
                            labelRowsPerPage="Filas por página:"
                        />
                    </Box>
                </>
            )}

            {/* Dialog para crear/editar resolución */}
            <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
                <DialogTitle>{currentResolucion ? 'Editar Resolución' : 'Nueva Resolución'}</DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={12}>
                            <TextField
                                name="numero"
                                label="Número de Resolución *"
                                fullWidth
                                value={form.numero}
                                onChange={handleFormChange}
                                placeholder="Ej: 3601/2023"
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                name="nombre"
                                label="Nombre *"
                                fullWidth
                                value={form.nombre}
                                onChange={handleFormChange}
                                placeholder="Ej: Resolución de Capacitaciones Técnicas"
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                name="fecha_publicacion"
                                label="Fecha de Publicación *"
                                type="date"
                                fullWidth
                                InputLabelProps={{ shrink: true }}
                                value={form.fecha_publicacion}
                                onChange={handleFormChange}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        name="vigente"
                                        checked={form.vigente}
                                        onChange={handleFormChange}
                                    />
                                }
                                label="Vigente"
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                name="observaciones"
                                label="Observaciones"
                                fullWidth
                                multiline
                                rows={3}
                                value={form.observaciones}
                                onChange={handleFormChange}
                                placeholder="Notas adicionales sobre la resolución"
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>Cancelar</Button>
                    <Button onClick={handleSave} variant="contained">
                        {currentResolucion ? 'Guardar Cambios' : 'Crear'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Feedback Snackbar */}
            <Snackbar
                open={feedback.open}
                autoHideDuration={6000}
                onClose={handleCloseFeedback}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert onClose={handleCloseFeedback} severity={feedback.severity} sx={{ width: '100%' }}>
                    {feedback.message}
                </Alert>
            </Snackbar>
        </>
    );
}
