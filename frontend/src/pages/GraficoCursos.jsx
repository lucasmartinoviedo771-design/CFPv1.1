import React, { useEffect, useState } from 'react';
import { Box, Card, CardContent, Typography, FormControl, InputLabel, Select, MenuItem, Accordion, AccordionSummary, AccordionDetails, CircularProgress, Button } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { listProgramas } from '../services/programasService';
import api from '../api/client';
import { getCoursesGraph } from '../services/estructuraService';

export default function GraficoCursos() {
  const [programas, setProgramas] = useState([]);
  const [cohortes, setCohortes] = useState([]);
  const [programaId, setProgramaId] = useState('');
  const [cohorteId, setCohorteId] = useState('');
  const [tree, setTree] = useState(null);
  const [loading, setLoading] = useState(false);

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
      if (!programaId) { setCohortes([]); setCohorteId(''); return; }
      try {
        const res = await api.get('/inscripciones/cohortes', { params: { programa_id: programaId } });
        setCohortes(Array.isArray(res.data) ? res.data : []);
      } catch (e) {
        setCohortes([]);
      }
    }
    loadCohortes();
  }, [programaId]);

  const loadTree = async () => {
    if (!programaId) return;
    setLoading(true);
    try {
      const data = await getCoursesGraph({ programa_id: programaId, cohorte_id: cohorteId || undefined });
      setTree(data);
    } catch (e) {
      setTree(null);
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
                          {(mod.fecha_inicio || mod.fecha_fin) && ` — ${mod.fecha_inicio || ''} ${mod.fecha_fin ? 'a ' + mod.fecha_fin : ''}`}
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
                            - {fin.tipo_examen} {fin.fecha ? `(${fin.fecha})` : ''}
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

  return (
    <Box>
      <h1 className="text-3xl font-bold text-white mb-6">Gráfico de Cursos (Arbol)</h1>
      <Card sx={{ mb: 4, bgcolor: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)' }}>
        <CardContent>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            <FormControl size="small" sx={{ minWidth: 240 }}>
              <InputLabel id="prog-label" sx={{ color: 'rgba(255,255,255,0.7)' }}>Programa</InputLabel>
              <Select
                labelId="prog-label"
                label="Programa"
                value={programaId}
                onChange={(e) => { setProgramaId(e.target.value); setTree(null); }}
                sx={{ color: 'white', '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.3)' }, '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'white' }, '& .MuiSvgIcon-root': { color: 'white' } }}
              >
                <MenuItem value=""><em>Seleccione</em></MenuItem>
                {(programas || []).map(p => (
                  <MenuItem key={p.id} value={p.id}>{p.nombre}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 240 }} disabled={!programaId}>
              <InputLabel id="coh-label" sx={{ color: 'rgba(255,255,255,0.7)' }}>Cohorte</InputLabel>
              <Select
                labelId="coh-label"
                label="Cohorte"
                value={cohorteId}
                onChange={(e) => setCohorteId(e.target.value)}
                sx={{ color: 'white', '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.3)' }, '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'white' }, '& .MuiSvgIcon-root': { color: 'white' } }}
              >
                <MenuItem value=""><em>Opcional</em></MenuItem>
                {(cohortes || []).map(c => (
                  <MenuItem key={c.id} value={c.id}>{c.nombre}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button variant="contained" onClick={loadTree} disabled={!programaId} sx={{ bgcolor: '#4f46e5', '&:hover': { bgcolor: '#4338ca' } }}>Cargar</Button>
          </Box>
        </CardContent>
      </Card>

      {loading ? <CircularProgress /> : renderTree()}
    </Box>
  );
}
