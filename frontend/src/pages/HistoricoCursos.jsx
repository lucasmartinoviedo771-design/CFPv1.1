import React, { useState, useEffect, useRef } from 'react';
import apiClient from '../api/client';
import { Card, Select, Button, cn } from '../components/UI';
import { Search, AlertCircle, ChevronLeft, ChevronRight, ArrowUpDown, ChevronUp, ChevronDown } from 'lucide-react';
import { formatDateDisplay } from '../utils/dateFormat';
import { listProgramas } from '../services/programasService';

export default function HistoricoCursos() {
  const [programas, setProgramas] = useState([]);
  const [bloques, setBloques] = useState([]);
  const [cohortes, setCohortes] = useState([]);
  const [selectedPrograma, setSelectedPrograma] = useState('');
  const [selectedBloque, setSelectedBloque] = useState('');
  const [selectedCohorte, setSelectedCohorte] = useState('');
  const [tipoDato, setTipoDato] = useState('notas');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(50);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const tableContainerRef = useRef(null);
  const topScrollRef = useRef(null);
  const [tableWidth, setTableWidth] = useState(0);

  // Sincronizar scroll superior e inferior
  useEffect(() => {
    const tableContainer = tableContainerRef.current;
    const topScroll = topScrollRef.current;

    if (!tableContainer || !topScroll) return;

    const syncTop = () => { topScroll.scrollLeft = tableContainer.scrollLeft; };
    const syncTable = () => { tableContainer.scrollLeft = topScroll.scrollLeft; };

    tableContainer.addEventListener('scroll', syncTop);
    topScroll.addEventListener('scroll', syncTable);

    return () => {
      tableContainer.removeEventListener('scroll', syncTop);
      topScroll.removeEventListener('scroll', syncTable);
    };
  }, [data]); // data is enough here as refs are persistent

  // Cálculo de datos filtrados y paginados (elevado al componente)
  const allRows = data?.rows || [];
  const filteredRows = allRows.filter(row => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    const estudiante = String(row.Estudiante || '').toLowerCase();
    const dni = String(row.DNI || '').toLowerCase();
    return estudiante.includes(searchLower) || dni.includes(searchLower);
  });

  // NUEVO: Lógica de ordenación
  const sortedRows = [...filteredRows].sort((a, b) => {
    if (!sortConfig.key) return 0;
    
    const aValue = a[sortConfig.key];
    const bValue = b[sortConfig.key];

    if (aValue === bValue) return 0;
    
    // Manejo de valores nulos
    if (aValue === null || aValue === undefined) return 1;
    if (bValue === null || bValue === undefined) return -1;

    // Comparación según tipo
    let comparison = 0;
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      comparison = aValue - bValue;
    } else {
      comparison = String(aValue).localeCompare(String(bValue), undefined, { numeric: true, sensitivity: 'base' });
    }

    return sortConfig.direction === 'asc' ? comparison : -comparison;
  });

  const totalResults = sortedRows.length;
  const totalPages = Math.ceil(totalResults / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const paginatedRows = sortedRows.slice(startIndex, startIndex + rowsPerPage);

  // Actualizar el ancho del scroll ficticio
  useEffect(() => {
    if (tableContainerRef.current) {
      const table = tableContainerRef.current.querySelector('table');
      if (table) {
        setTableWidth(table.scrollWidth);
      }
    }
  }, [data, paginatedRows, rowsPerPage, searchTerm]);

  useEffect(() => {
    (async () => {
      try {
        const progs = await listProgramas();
        setProgramas(Array.isArray(progs) ? progs : []);
      } catch (err) {
        console.error("Error al cargar programas:", err);
        setError("No se pudieron cargar los programas.");
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const [cohortesRes, bloquesRes] = await Promise.all([
          apiClient.get('/inscripciones/cohortes', { 
            params: { 
              programa_id: selectedPrograma || undefined,
              bloque_id: selectedBloque || undefined
            } 
          }),
          apiClient.get('/bloques', { params: { programa_id: selectedPrograma || undefined } }),
        ]);
        setCohortes(Array.isArray(cohortesRes.data) ? cohortesRes.data : []);
        setBloques(Array.isArray(bloquesRes.data) ? bloquesRes.data : []);
      } catch (err) {
        console.error("Error al cargar cohortes/bloques:", err);
        setError("No se pudieron cargar cohortes y bloques.");
      }
    })();
  }, [selectedPrograma, selectedBloque]);

  const handleBuscar = () => {
    setLoading(true);
    setError(null);
    setData(null);
    setCurrentPage(1);

    apiClient.get('/historico-cursos', {
      params: {
        tipo_dato: tipoDato,
        programa_id: selectedPrograma || undefined,
        bloque_id: selectedBloque || undefined,
        cohorte_id: selectedCohorte || undefined,
      },
    })
      .then(response => {
        setData(response.data);
      })
      .catch(err => {
        console.error("Error al buscar datos:", err);
        setError("Ocurrió un error al obtener los datos.");
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const programasOptions = programas.map(p => ({ value: p.id, label: p.nombre }));
  const bloquesOptions = bloques.map(b => ({ value: b.id, label: b.nombre }));
  const cohorteOptions = cohortes.map(c => ({ value: c.id, label: c.nombre }));
  const tipoOptions = [
    { value: 'notas', label: 'Notas' },
    { value: 'asistencia', label: 'Asistencia' }
  ];
  const looksLikeDate = (value) => typeof value === 'string'
    && (
      /^\d{4}-\d{2}-\d{2}$/.test(value)
      || /^\d{4}-\d{2}-\d{2}T/.test(value)
      || /^\d{2}\/\d{2}\/\d{4}$/.test(value)
    );

  const renderCellValue = (header, rawValue) => {
    if (rawValue === null || rawValue === undefined) return '-';
    if (looksLikeDate(rawValue)) return formatDateDisplay(rawValue);
    if (typeof header === 'string' && header.toLowerCase().includes('fecha') && typeof rawValue === 'string') {
      return formatDateDisplay(rawValue);
    }
    return String(rawValue);
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Histórico por Cursos</h1>
          <p className="text-indigo-300">Consulta de calificaciones y asistencia por cohorte.</p>
        </div>
      </div>

      {/* Panel de Filtros */}
      <Card className="bg-indigo-900/20 border-indigo-500/30">
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="w-full md:w-64">
            <Select
              label="Programa"
              id="programa-select"
              value={selectedPrograma}
              onChange={e => {
                setSelectedPrograma(e.target.value);
                setSelectedBloque('');
                setSelectedCohorte('');
              }}
              options={[{ value: '', label: 'Todos' }, ...programasOptions]}
              className="bg-indigo-950/50 border-indigo-500/30 text-white"
            />
          </div>
          <div className="w-full md:w-64">
            <Select
              label="Bloque"
              id="bloque-select"
              value={selectedBloque}
              onChange={e => {
                setSelectedBloque(e.target.value);
                setSelectedCohorte('');
              }}
              options={[{ value: '', label: 'Todos' }, ...bloquesOptions]}
              className="bg-indigo-950/50 border-indigo-500/30 text-white"
            />
          </div>
          <div className="w-full md:w-64">
            <Select
              label="Cohorte"
              id="cohorte-select"
              value={selectedCohorte}
              onChange={e => setSelectedCohorte(e.target.value)}
              options={[{ value: '', label: 'Todos' }, ...cohorteOptions]}
              className="bg-indigo-950/50 border-indigo-500/30 text-white"
            />
          </div>

          <div className="w-full md:w-48">
            <Select
              label="Tipo de Dato"
              id="tipo-dato-select"
              value={tipoDato}
              onChange={e => setTipoDato(e.target.value)}
              options={tipoOptions}
              className="bg-indigo-950/50 border-indigo-500/30 text-white"
            />
          </div>

          <div className="flex-none">
            <Button
              onClick={handleBuscar}
              isLoading={loading}
              className="bg-brand-accent hover:bg-orange-600 text-white border-none shadow-lg shadow-orange-500/20"
              startIcon={<Search size={18} />}
            >
              Buscar
            </Button>
          </div>
        </div>
      </Card>

      {/* Mensajes de Error */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex items-center text-red-200">
          <AlertCircle className="mr-2" size={20} />
          {error}
        </div>
      )}

      {/* Resultados */}
      {data && (() => {
          const rowsPerPageOptions = [
            { value: 25, label: '25' },
            { value: 50, label: '50' },
            { value: 75, label: '75' },
            { value: 100, label: '100' },
          ];

        return (
          <Card className="bg-indigo-900/20 border-indigo-500/30 overflow-hidden">
            <div className="p-4 border-b border-indigo-500/30 bg-indigo-950/30 flex justify-between items-center">
              <div className="relative w-full md:w-96">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-400" size={18} />
                <input
                  type="text"
                  placeholder="Filtrar por Apellido, Nombre o DNI..."
                  value={searchTerm}
                   onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full bg-indigo-900/40 border border-indigo-500/30 rounded-lg py-2 pl-10 pr-4 text-white placeholder-indigo-400/50 focus:outline-none focus:border-brand-cyan transition-colors"
                />
              </div>
              <span className="text-sm text-indigo-300 hidden md:inline-block">
                Mostrando {Math.min(startIndex + 1, totalResults)} - {Math.min(startIndex + rowsPerPage, totalResults)} de {totalResults} resultados
              </span>
            </div>
            {/* Top Scrollbar */}
            {totalResults > 0 && (
              <div 
                ref={topScrollRef}
                className="overflow-x-auto h-4 w-full bg-indigo-950/20 border-b border-indigo-500/10"
                style={{ scrollbarWidth: 'thin' }}
              >
                <div style={{ width: tableWidth, height: '1px' }} />
              </div>
            )}

            <div ref={tableContainerRef} className="overflow-x-auto">
              <table className="min-w-full divide-y divide-indigo-500/30">
              <thead className="bg-indigo-950/50">
                <tr>
                  {data.headers && data.headers.map(header => (
                    <th 
                      key={header} 
                      scope="col" 
                      onClick={() => handleSort(header)}
                      className="px-6 py-3 text-left text-xs font-medium text-indigo-300 uppercase tracking-wider cursor-pointer hover:bg-white/5 transition-colors group"
                    >
                      <div className="flex items-center gap-1">
                        {header}
                        <span className="text-indigo-500 group-hover:text-indigo-300 transition-colors">
                          {sortConfig.key === header ? (
                            sortConfig.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                          ) : (
                            <ArrowUpDown size={14} className="opacity-0 group-hover:opacity-100" />
                          )}
                        </span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-indigo-500/10 bg-transparent">
                {paginatedRows.map((row, idx) => (
                  <tr key={idx} className="hover:bg-white/5 transition-colors">
                    {data.headers.map(header => (
                      <td key={`${idx}-${header}`} className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {renderCellValue(header, row[header])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredRows.length === 0 && (
              <div className="p-8 text-center text-indigo-300">
                {searchTerm ? 'No hay resultados para la búsqueda actual.' : 'No se encontraron datos para la selección.'}
              </div>
            )}
          </div>

          {/* Pagination Controls */}
          {totalResults > 0 && (
            <div className="p-4 border-t border-indigo-500/30 bg-indigo-950/30 flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-indigo-300">Filas por página:</span>
                <select
                  value={rowsPerPage}
                  onChange={(e) => {
                    setRowsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="bg-indigo-900/40 border border-indigo-500/30 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-brand-cyan"
                >
                  {rowsPerPageOptions.map(opt => (
                    <option key={opt.value} value={opt.value} className="bg-indigo-950 text-white">
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="text-indigo-300 disabled:opacity-30"
                >
                  <ChevronLeft size={20} />
                </Button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) pageNum = i + 1;
                    else if (currentPage <= 3) pageNum = i + 1;
                    else if (currentPage > totalPages - 2) pageNum = totalPages - 4 + i;
                    else pageNum = currentPage - 2 + i;

                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={cn(
                          "w-8 h-8 rounded-md text-sm font-medium transition-colors",
                          currentPage === pageNum 
                            ? "bg-brand-accent text-white shadow-lg shadow-orange-500/20" 
                            : "text-indigo-300 hover:bg-white/5"
                        )}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="text-indigo-300 disabled:opacity-30"
                >
                  <ChevronRight size={20} />
                </Button>
              </div>

              <div className="text-sm text-indigo-300">
                Página {currentPage} de {totalPages}
              </div>
            </div>
          )}
        </Card>
        );
      })()}
    </div>
  );
}
