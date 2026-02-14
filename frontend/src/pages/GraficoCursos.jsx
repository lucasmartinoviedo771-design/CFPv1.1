import React, { useEffect, useState } from 'react';
import { Box, Card, CardContent, Typography, FormControl, InputLabel, Select, MenuItem, Accordion, AccordionSummary, AccordionDetails, CircularProgress, Button, Grid } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { listProgramas } from '../services/programasService';
import api from '../api/client';
import { getCoursesGraph } from '../services/estructuraService';
import { formatDateDisplay } from '../utils/dateFormat';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Select as AppSelect, Button as AppButton } from '../components/UI';

export default function GraficoCursos() {
  const [programas, setProgramas] = useState([]);
  const [bloques, setBloques] = useState([]);
  const [cohortesRaw, setCohortesRaw] = useState([]);
  const [cohortes, setCohortes] = useState([]);
  const [programaId, setProgramaId] = useState('');
  const [bloqueId, setBloqueId] = useState('');
  const [cohorteId, setCohorteId] = useState('');
  const [anio, setAnio] = useState('');
  const [tree, setTree] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const boot = async () => {
      try {
        const progs = await listProgramas();
        setProgramas(Array.isArray(progs) ? progs : []);
      } catch (e) {
        // ignore
      }
    };
    boot();
  }, []);

  useEffect(() => {
    const loadCohortes = async () => {
      if (!programaId) {
        setCohortesRaw([]);
        setCohortes([]);
        setCohorteId('');
        return;
      }
      try {
        const params = { programa_id: programaId };
        if (bloqueId) params.bloque_id = bloqueId;
        const res = await api.get('/inscripciones/cohortes', { params });
        const list = Array.isArray(res.data) ? res.data : [];
        setCohortesRaw(list);
      } catch (e) {
        setCohortesRaw([]);
        setCohortes([]);
      }
    };
    loadCohortes();
  }, [programaId, bloqueId]);

  useEffect(() => {
    const loadBloques = async () => {
      if (!programaId) {
        setBloques([]);
        setBloqueId('');
        return;
      }
      try {
        const res = await api.get('/bloques', { params: { programa_id: programaId } });
        setBloques(Array.isArray(res.data) ? res.data : []);
      } catch (e) {
        setBloques([]);
      }
    };
    loadBloques();
  }, [programaId]);

  useEffect(() => {
    const filtered = anio
      ? cohortesRaw.filter((c) => {
          const year = c?.fecha_inicio ? new Date(c.fecha_inicio).getFullYear() : null;
          return String(year) === String(anio);
        })
      : cohortesRaw;
    setCohortes(filtered);
    if (cohorteId && !filtered.some((c) => String(c.id) === String(cohorteId))) {
      setCohorteId('');
    }
  }, [cohortesRaw, anio, cohorteId]);

  const yearsOptions = Array.from(
    new Set(
      (cohortesRaw || [])
        .map((c) => (c?.fecha_inicio ? new Date(c.fecha_inicio).getFullYear() : null))
        .filter(Boolean)
    )
  )
    .sort((a, b) => b - a)
    .map((y) => ({ value: String(y), label: String(y) }));

  const loadTree = async () => {
    if (!programaId) return;
    setLoading(true);
    setError('');
    try {
      const data = await getCoursesGraph({
        programa_id: programaId,
        bloque_id: bloqueId || undefined,
        cohorte_id: cohorteId || undefined,
        anio: anio || undefined,
      });
      setTree(data);
    } catch (e) {
      setTree(null);
      setError('No se pudo cargar el gráfico de cohortes para el programa seleccionado.');
    } finally {
      setLoading(false);
    }
  };

  const accordionStyle = {
    bgcolor: 'rgba(255,255,255,0.05)',
    color: 'white',
    mb: 1,
    border: '1px solid rgba(255,255,255,0.1)',
    '&:before': { display: 'none' }
  };

  const subAccordionStyle = {
    bgcolor: 'rgba(0,0,0,0.2)',
    color: 'white',
    mb: 1,
    border: '1px solid rgba(255,255,255,0.05)',
    '&:before': { display: 'none' }
  };

  const renderTree = () => {
    if (!tree) return null;
    return (
      <Box>
        {(tree.tree || []).map(bat => (
          <Accordion key={`bat-${bat.id}`} sx={accordionStyle}>
            <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: 'white' }} />}>
              <Typography fontWeight={600}>{bat.nombre}</Typography>
            </AccordionSummary>
            <AccordionDetails>
              {(bat.children || []).map(blo => (
                <Accordion key={`blo-${blo.id}`} sx={subAccordionStyle}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: 'white' }} />}>
                    <Typography>{blo.nombre}</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    {(blo.children || []).map(mod => (
                      <Box key={`mod-${mod.id}`} sx={{ pl: 2, py: 0.5, borderLeft: '2px solid rgba(255,255,255,0.2)', mb: 1 }}>
                        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)' }}>
                          {mod.nombre} {mod.es_practica ? '(Practica)' : ''}
                          {(mod.fecha_inicio || mod.fecha_fin) && ` — ${formatDateDisplay(mod.fecha_inicio)}${mod.fecha_fin ? ' a ' + formatDateDisplay(mod.fecha_fin) : ''}`}
                        </Typography>
                      </Box>
                    ))}
                    {(!blo.children || blo.children.length === 0) && (
                      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)', fontStyle: 'italic' }}>Sin modulos</Typography>
                    )}
                    {/* Finales del bloque */}
                    {Array.isArray(blo.finales) && blo.finales.length > 0 && (
                      <Box sx={{ pl: 2, pt: 1 }}>
                        <Typography variant="subtitle2" sx={{ color: '#a5b4fc' }}>Finales del Bloque</Typography>
                        {blo.finales.map(fin => (
                          <Typography key={`fin-${fin.id}`} variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                            - {fin.tipo_examen} {fin.fecha ? `(${formatDateDisplay(fin.fecha)})` : ''}
                          </Typography>
                        ))}
                      </Box>
                    )}
                  </AccordionDetails>
                </Accordion>
              ))}
              {(!bat.children || bat.children.length === 0) && (
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)', fontStyle: 'italic' }}>Sin bloques</Typography>
              )}
            </AccordionDetails>
          </Accordion>
        ))}
      </Box>
    );
  };

  const cohortesData = Array.isArray(tree?.cohortes) ? tree.cohortes : [];

  const chartCohortes = cohortesData.map((c) => ({
    cohorte: c.nombre,
    estudiantes: c.estudiantes_total || 0,
    regulares: c.estatus_regular || 0,
    libres: c.estatus_libre || 0,
    bajas: c.estatus_baja || 0,
    inscriptos: c.estado_inscripto || 0,
    activos: c.estado_activo || 0,
    pausados: c.estado_pausado || 0,
    egresados: c.estado_egresado || 0,
  }));

  const cohorteSeleccionada = tree?.cohorte || null;
  const tiposSemanaData = cohorteSeleccionada?.stats?.tipos_semana
    ? Object.entries(cohorteSeleccionada.stats.tipos_semana).map(([tipo, total]) => ({ tipo, total }))
    : [];

  const pieColors = ['#22d3ee', '#38bdf8', '#60a5fa', '#818cf8', '#a78bfa', '#f472b6'];

  return (
    <Box>
      <h1 className="text-3xl font-bold text-white mb-6">Gráfico de Cohortes y Cursos</h1>
      <Card sx={{ mb: 4, bgcolor: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)' }}>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
            <AppSelect
              label="Programa"
              value={programaId}
              onChange={(e) => {
                setProgramaId(e.target.value);
                setBloqueId('');
                setCohorteId('');
                setAnio('');
                setTree(null);
              }}
              options={[{ value: '', label: 'Seleccionar...' }, ...(programas || []).map((p) => ({ value: p.id, label: p.nombre }))]}
              className="bg-indigo-950/50"
            />
            <AppSelect
              label="Bloque"
              value={bloqueId}
              onChange={(e) => { setBloqueId(e.target.value); setCohorteId(''); setTree(null); }}
              disabled={!programaId}
              options={[{ value: '', label: 'Todos' }, ...(bloques || []).map((b) => ({ value: b.id, label: b.nombre }))]}
              className="bg-indigo-950/50"
            />
            <AppSelect
              label="Cohorte"
              value={cohorteId}
              onChange={(e) => setCohorteId(e.target.value)}
              disabled={!programaId}
              options={[{ value: '', label: 'Todos' }, ...(cohortes || []).map((c) => ({ value: c.id, label: c.nombre }))]}
              className="bg-indigo-950/50"
            />
            <AppSelect
              label="Año"
              value={anio}
              onChange={(e) => { setAnio(e.target.value); setTree(null); }}
              disabled={!programaId}
              options={[{ value: '', label: 'Todos' }, ...yearsOptions]}
              className="bg-indigo-950/50"
            />
            <AppButton
              variant="primary"
              onClick={loadTree}
              disabled={!programaId}
              className="h-10 px-6 w-full"
            >
              Cargar
            </AppButton>
          </div>
        </CardContent>
      </Card>

      {loading && <CircularProgress />}
      {!!error && !loading && (
        <Typography sx={{ color: '#fca5a5', mb: 2 }}>{error}</Typography>
      )}

      {!loading && tree && (
        <>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} md={6}>
              <Card sx={{ bgcolor: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2 }}>Estudiantes por Cohorte</Typography>
                  <Box sx={{ width: '100%', height: 280 }}>
                    <ResponsiveContainer>
                      <BarChart data={chartCohortes}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.15)" />
                        <XAxis dataKey="cohorte" stroke="#c7d2fe" />
                        <YAxis stroke="#c7d2fe" allowDecimals={false} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="estudiantes" fill="#22d3ee" name="Total Estudiantes" />
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card sx={{ bgcolor: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2 }}>Estatus de Estudiantes por Cohorte</Typography>
                  <Box sx={{ width: '100%', height: 280 }}>
                    <ResponsiveContainer>
                      <BarChart data={chartCohortes}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.15)" />
                        <XAxis dataKey="cohorte" stroke="#c7d2fe" />
                        <YAxis stroke="#c7d2fe" allowDecimals={false} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="regulares" stackId="estatus" fill="#10b981" name="Regular" />
                        <Bar dataKey="libres" stackId="estatus" fill="#f59e0b" name="Libre" />
                        <Bar dataKey="bajas" stackId="estatus" fill="#ef4444" name="Baja" />
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {cohorteSeleccionada && (
            <Card sx={{ mb: 3, bgcolor: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)' }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 1 }}>
                  Cohorte: {cohorteSeleccionada.nombre}
                </Typography>
                <Typography sx={{ color: 'rgba(255,255,255,0.8)' }}>
                  Programa: {tree.programa?.nombre} | Calendario: {cohorteSeleccionada.bloque_fechas_nombre}
                </Typography>
                <Typography sx={{ color: 'rgba(255,255,255,0.8)', mb: 1 }}>
                  Inicio: {formatDateDisplay(cohorteSeleccionada.fecha_inicio)} | Fin: {formatDateDisplay(cohorteSeleccionada.fecha_fin)}
                </Typography>
                {!!cohorteSeleccionada.bloque_fechas_descripcion && (
                  <Typography sx={{ color: 'rgba(255,255,255,0.7)', mb: 2 }}>
                    Plantilla: {cohorteSeleccionada.bloque_fechas_descripcion}
                  </Typography>
                )}

                <Grid container spacing={2}>
                  <Grid item xs={12} md={5}>
                    <Box sx={{ width: '100%', height: 260 }}>
                      <ResponsiveContainer>
                        <PieChart>
                          <Pie
                            data={tiposSemanaData}
                            dataKey="total"
                            nameKey="tipo"
                            outerRadius={90}
                            label
                          >
                            {tiposSemanaData.map((entry, index) => (
                              <Cell key={`pie-${entry.tipo}`} fill={pieColors[index % pieColors.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={7}>
                    <Typography variant="subtitle1" sx={{ mb: 1 }}>Secuencia Semanal</Typography>
                    {(cohorteSeleccionada.secuencia || []).length === 0 ? (
                      <Typography sx={{ color: 'rgba(255,255,255,0.6)' }}>Sin secuencia definida.</Typography>
                    ) : (
                      <Box sx={{ maxHeight: 260, overflowY: 'auto', pr: 1 }}>
                        {(cohorteSeleccionada.secuencia || []).map((s) => (
                          <Box key={`sem-${s.orden}`} sx={{ py: 0.5, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                            <Typography variant="body2">
                              Semana {s.orden}: {s.tipo_label} {s.fecha ? `(${formatDateDisplay(s.fecha)})` : ''}
                            </Typography>
                          </Box>
                        ))}
                      </Box>
                    )}
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          )}

          <Typography variant="h6" sx={{ color: 'white', mb: 1 }}>Estructura Académica del Programa</Typography>
          {renderTree()}
        </>
      )}
    </Box>
  );
}
