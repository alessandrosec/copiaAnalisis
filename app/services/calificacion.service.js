/**
 * SERVICIO DE CALIFICACIONES
 * Propósito: Lógica de negocio para manejo de calificaciones
 */
const db = require("../models");
const { Curso, Semestre, Inscripcion, Calificacion } = db.calificaciones || {};
const { Estudiante } = db.estudiantes || {};
const DateHelper = require("../utils/dateHelper");
const FormatHelper = require("../utils/formatHelper");

class CalificacionService {

    /**
     * Obtiene las calificaciones de un estudiante en un semestre específico
     * @param {number} idEstudiante - ID del estudiante
     * @param {number} año - Año del semestre
     * @param {number} numeroSemestre - Número del semestre (1 o 2)
     * @returns {Object} Datos completos de calificaciones
     */
    static async obtenerCalificacionesPorSemestre(idEstudiante, año, numeroSemestre) {
        try {
            // 1. Validar parámetros
            if (!idEstudiante || !año || !numeroSemestre) {
                throw new Error('Parámetros requeridos: idEstudiante, año, numeroSemestre');
            }

            if (![1, 2].includes(numeroSemestre)) {
                throw new Error('Número de semestre debe ser 1 o 2');
            }

            // 2. Buscar el semestre
            const semestre = await Semestre.findOne({
                where: {
                    anio: año,
                    numero_semestre: numeroSemestre
                }
            });

            if (!semestre) {
                throw new Error(`Semestre ${numeroSemestre}/${año} no encontrado`);
            }

            // 3. Buscar el estudiante
            const estudiante = await Estudiante.findByPk(idEstudiante);
            if (!estudiante) {
                throw new Error('Estudiante no encontrado');
            }

            // 4. Obtener inscripciones del estudiante en el semestre
            const inscripciones = await Inscripcion.findAll({
                where: {
                    id_estudiante: idEstudiante,
                    id_semestre: semestre.id
                },
                include: [
                    {
                        model: Curso,
                        as: 'curso',
                        attributes: ['id', 'codigo_curso', 'nombre_curso', 'creditos']
                    },
                    {
                        model: Calificacion,
                        as: 'calificaciones',
                        attributes: ['id', 'tipo_evaluacion', 'nota', 'ponderacion', 'fecha_evaluacion', 'observaciones']
                    }
                ],
                order: [['id', 'ASC']]
            });

            // 5. Procesar datos y calcular notas finales
            const cursosConCalificaciones = await Promise.all(
                inscripciones.map(async (inscripcion) => {
                    const curso = inscripcion.curso;
                    const calificaciones = inscripcion.calificaciones;

                    // Calcular nota final del curso
                    const notaFinal = this._calcularNotaFinal(calificaciones);
                    const estadoAprobacion = this._determinarEstadoAprobacion(notaFinal);

                    return {
                        inscripcionId: inscripcion.id,
                        curso: {
                            id: curso.id,
                            codigo: curso.codigo_curso,
                            nombre: curso.nombre_curso,
                            creditos: curso.creditos
                        },
                        calificaciones: calificaciones.map(cal => ({
                            id: cal.id,
                            tipo: cal.tipo_evaluacion,
                            nota: cal.nota,
                            ponderacion: cal.ponderacion,
                            fecha: DateHelper.formatearFecha(cal.fecha_evaluacion),
                            observaciones: cal.observaciones
                        })),
                        notaFinal: notaFinal,
                        estado: estadoAprobacion,
                        estadoInscripcion: inscripcion.estado
                    };
                })
            );

            // 6. Calcular estadísticas generales
            const estadisticas = this._calcularEstadisticasGenerales(cursosConCalificaciones);

            // 7. Preparar datos para el reporte
            const datosReporte = {
                estudiante: {
                    id: estudiante.id,
                    nombreCompleto: `${estudiante.primer_nombre} ${estudiante.segundo_nombre || ''} ${estudiante.primer_apellido}`.trim(),
                    primerNombre: estudiante.primer_nombre,
                    segundoNombre: estudiante.segundo_nombre,
                    primerApellido: estudiante.primer_apellido
                },
                semestre: {
                    id: semestre.id,
                    año: semestre.anio,
                    numero: semestre.numero_semestre,
                    descripcion: `${semestre.numero_semestre}° Semestre ${semestre.anio}`,
                    fechaInicio: DateHelper.formatearFecha(semestre.fecha_inicio),
                    fechaFin: DateHelper.formatearFecha(semestre.fecha_fin)
                },
                cursos: cursosConCalificaciones,
                estadisticas,
                fechaGeneracion: new Date()
            };

            return {
                success: true,
                data: datosReporte,
                mensaje: `Calificaciones obtenidas para ${cursosConCalificaciones.length} cursos`
            };

        } catch (error) {
            console.error('Error al obtener calificaciones:', error);
            return {
                success: false,
                mensaje: error.message,
                error: error.message
            };
        }
    }

    /**
     * Calcula la nota final de un curso basada en las calificaciones y ponderaciones
     * @private
     * @param {Array} calificaciones - Array de calificaciones
     * @returns {number|null} Nota final calculada
     */
    static _calcularNotaFinal(calificaciones) {
        if (!calificaciones || calificaciones.length === 0) {
            return null;
        }

        // Filtrar calificaciones que tienen nota
        const calificacionesConNota = calificaciones.filter(cal => cal.nota !== null && cal.nota !== undefined);
        
        if (calificacionesConNota.length === 0) {
            return null;
        }

        // Calcular suma ponderada
        let sumaPonderada = 0;
        let sumaPonderaciones = 0;

        calificacionesConNota.forEach(cal => {
            sumaPonderada += (parseFloat(cal.nota) * parseFloat(cal.ponderacion)) / 100;
            sumaPonderaciones += parseFloat(cal.ponderacion);
        });

        if (sumaPonderaciones === 0) {
            return null;
        }

        // Calcular nota final proporcional
        const notaFinal = (sumaPonderada * 100) / sumaPonderaciones;
        return Math.round(notaFinal * 100) / 100; // Redondear a 2 decimales
    }

    /**
     * Determina el estado de aprobación basado en la nota final
     * @private
     * @param {number|null} notaFinal - Nota final del curso
     * @returns {Object} Estado de aprobación
     */
    static _determinarEstadoAprobacion(notaFinal) {
        if (notaFinal === null || notaFinal === undefined) {
            return {
                codigo: 'SIN_CALIFICAR',
                descripcion: 'Sin Calificar',
                aprobado: false,
                color: 'warning'
            };
        }

        if (notaFinal >= 61) {
            return {
                codigo: 'APROBADO',
                descripcion: 'Aprobado',
                aprobado: true,
                color: 'success'
            };
        } else {
            return {
                codigo: 'REPROBADO',
                descripcion: 'Reprobado',
                aprobado: false,
                color: 'danger'
            };
        }
    }

    /**
     * Calcula estadísticas generales del semestre
     * @private
     * @param {Array} cursosConCalificaciones - Cursos con sus calificaciones
     * @returns {Object} Estadísticas calculadas
     */
    static _calcularEstadisticasGenerales(cursosConCalificaciones) {
        const cursosConNota = cursosConCalificaciones.filter(curso => curso.notaFinal !== null);
        
        if (cursosConNota.length === 0) {
            return {
                totalCursos: cursosConCalificaciones.length,
                cursosCalificados: 0,
                cursosAprobados: 0,
                cursosReprobados: 0,
                promedioGeneral: null,
                creditosTotales: cursosConCalificaciones.reduce((sum, curso) => sum + curso.curso.creditos, 0),
                creditosAprobados: 0
            };
        }

        const cursosAprobados = cursosConNota.filter(curso => curso.estado.aprobado);
        const cursosReprobados = cursosConNota.filter(curso => !curso.estado.aprobado);
        
        // Calcular promedio ponderado por créditos
        let sumaNotasPonderadas = 0;
        let creditosTotales = 0;
        let creditosAprobados = 0;

        cursosConNota.forEach(curso => {
            sumaNotasPonderadas += curso.notaFinal * curso.curso.creditos;
            creditosTotales += curso.curso.creditos;
            
            if (curso.estado.aprobado) {
                creditosAprobados += curso.curso.creditos;
            }
        });

        const promedioGeneral = creditosTotales > 0 ? sumaNotasPonderadas / creditosTotales : 0;

        return {
            totalCursos: cursosConCalificaciones.length,
            cursosCalificados: cursosConNota.length,
            cursosAprobados: cursosAprobados.length,
            cursosReprobados: cursosReprobados.length,
            promedioGeneral: Math.round(promedioGeneral * 100) / 100,
            creditosTotales: cursosConCalificaciones.reduce((sum, curso) => sum + curso.curso.creditos, 0),
            creditosAprobados: creditosAprobados
        };
    }

    /**
     * Obtiene los semestres disponibles para un estudiante
     * @param {number} idEstudiante - ID del estudiante
     * @returns {Array} Lista de semestres con inscripciones
     */
    static async obtenerSemestresDisponibles(idEstudiante) {
        try {
            const semestres = await Semestre.findAll({
                include: [{
                    model: Inscripcion,
                    as: 'inscripciones',
                    where: { id_estudiante: idEstudiante },
                    required: true,
                    attributes: []
                }],
                attributes: ['id', 'anio', 'numero_semestre', 'fecha_inicio', 'fecha_fin'],
                order: [['anio', 'DESC'], ['numero_semestre', 'DESC']]
            });

            return {
                success: true,
                data: semestres.map(sem => ({
                    id: sem.id,
                    año: sem.anio,
                    numero: sem.numero_semestre,
                    descripcion: `${sem.numero_semestre}° Semestre ${sem.anio}`,
                    fechaInicio: DateHelper.formatearFecha(sem.fecha_inicio),
                    fechaFin: DateHelper.formatearFecha(sem.fecha_fin)
                })),
                mensaje: `${semestres.length} semestres encontrados`
            };

        } catch (error) {
            console.error('Error al obtener semestres:', error);
            return {
                success: false,
                mensaje: 'Error al obtener semestres disponibles',
                error: error.message
            };
        }
    }

/**
    * Valida si un estudiante tiene calificaciones en un semestre
    * @param {number} idEstudiante - ID del estudiante
    * @param {number} año - Año del semestre
    * @param {number} numeroSemestre - Número del semestre
    * @returns {Object} Resultado de la validación
    */
    static async validarCalificacionesExistentes(idEstudiante, año, numeroSemestre) {
        try {
            const resultado = await this.obtenerCalificacionesPorSemestre(idEstudiante, año, numeroSemestre);
            
            if (!resultado.success) {
                return {
                    valido: false,
                    mensaje: resultado.mensaje
                    };
            }

            const cursosConCalificaciones = resultado.data.cursos.filter(curso => 
                curso.calificaciones && curso.calificaciones.length > 0
            );

            return {
                valido: cursosConCalificaciones.length > 0,
                mensaje: cursosConCalificaciones.length > 0 
                    ? `${cursosConCalificaciones.length} cursos con calificaciones encontrados`
                    : 'No se encontraron calificaciones para este período',
                totalCursos: resultado.data.cursos.length,
                cursosConCalificaciones: cursosConCalificaciones.length
            };

        } catch (error) {
            return {
                valido: false,
                mensaje: 'Error al validar calificaciones',
                error: error.message
            };
        }
    }
    }

module.exports = CalificacionService;