/**
 * SERVICIO DE VALIDACIÓN DE CURSOS
 * Propósito: Lógica de negocio para validación de cursos cursados
 */
const db = require("../models");
const { Curso, Semestre, Inscripcion, Calificacion } = db.calificaciones || {};
const { Estudiante } = db.estudiantes || {};
const DateHelper = require("../utils/dateHelper");
const FormatHelper = require("../utils/formatHelper");

class ValidacionService {

    /**
     * Obtiene y valida todos los cursos de un estudiante
     * @param {number} idEstudiante - ID del estudiante
     * @returns {Object} Datos completos de validación
     */
    static async obtenerValidacionCompleta(idEstudiante) {
        try {
            // 1. Validar parámetros
            if (!idEstudiante) {
                throw new Error('ID de estudiante requerido');
            }

            // 2. Buscar el estudiante
            const estudiante = await Estudiante.findByPk(idEstudiante);
            if (!estudiante) {
                throw new Error('Estudiante no encontrado');
            }

            // 3. Obtener todas las inscripciones del estudiante
            const inscripciones = await Inscripcion.findAll({
                where: {
                    id_estudiante: idEstudiante
                },
                include: [
                    {
                        model: Curso,
                        as: 'curso',
                        attributes: ['id', 'codigo_curso', 'nombre_curso', 'creditos']
                    },
                    {
                        model: Semestre,
                        as: 'semestre',
                        attributes: ['id', 'anio', 'numero_semestre', 'fecha_inicio', 'fecha_fin']
                    },
                    {
                        model: Calificacion,
                        as: 'calificaciones',
                        attributes: ['id', 'nota', 'ponderacion'],
                        required: false
                    }
                ],
                order: [
                    ['id_semestre', 'ASC'],
                    [{ model: Curso, as: 'curso' }, 'codigo_curso', 'ASC']
                ]
            });

            // 4. Procesar datos por semestre
            const cursosPorSemestre = this._agruparCursosPorSemestre(inscripciones);
            
            // 5. Calcular estadísticas generales
            const estadisticasGenerales = this._calcularEstadisticasGenerales(inscripciones);

            // 6. Validar prerrequisitos y progresión
            const validacionProgresion = this._validarProgresionAcademica(cursosPorSemestre);

            // 7. Preparar datos para el reporte
            const datosValidacion = {
                estudiante: {
                    id: estudiante.id,
                    nombreCompleto: `${estudiante.primer_nombre} ${estudiante.segundo_nombre || ''} ${estudiante.primer_apellido}`.trim(),
                    primerNombre: estudiante.primer_nombre,
                    segundoNombre: estudiante.segundo_nombre,
                    primerApellido: estudiante.primer_apellido
                },
                cursosPorSemestre,
                estadisticasGenerales,
                validacionProgresion,
                fechaGeneracion: new Date()
            };

            return {
                success: true,
                data: datosValidacion,
                mensaje: `Validación completa para ${inscripciones.length} inscripciones`
            };

        } catch (error) {
            console.error('Error al obtener validación:', error);
            return {
                success: false,
                mensaje: error.message,
                error: error.message
            };
        }
    }

    /**
     * Agrupa cursos por semestre y calcula notas finales
     * @private
     * @param {Array} inscripciones - Array de inscripciones
     * @returns {Array} Cursos agrupados por semestre
     */
    static _agruparCursosPorSemestre(inscripciones) {
        const grupos = {};

        inscripciones.forEach(inscripcion => {
            const semestre = inscripcion.semestre;
            const curso = inscripcion.curso;
            const calificaciones = inscripcion.calificaciones;

            const claveS emestre = `${semestre.anio}-${semestre.numero_semestre}`;

            if (!grupos[claveSemestre]) {
                grupos[claveSemestre] = {
                    semestre: {
                        id: semestre.id,
                        año: semestre.anio,
                        numero: semestre.numero_semestre,
                        descripcion: `${semestre.numero_semestre}° Semestre ${semestre.anio}`,
                        fechaInicio: DateHelper.formatearFecha(semestre.fecha_inicio),
                        fechaFin: DateHelper.formatearFecha(semestre.fecha_fin)
                    },
                    cursos: []
                };
            }

            // Calcular nota final del curso
            const notaFinal = this._calcularNotaFinal(calificaciones);
            const estadoAprobacion = this._determinarEstadoAprobacion(notaFinal);

            grupos[claveSemestre].cursos.push({
                inscripcionId: inscripcion.id,
                curso: {
                    id: curso.id,
                    codigo: curso.codigo_curso,
                    nombre: curso.nombre_curso,
                    creditos: curso.creditos
                },
                notaFinal: notaFinal,
                estado: estadoAprobacion,
                estadoInscripcion: inscripcion.estado,
                cantidadEvaluaciones: calificaciones.length,
                validado: notaFinal !== null && notaFinal >= 61
            });
        });

        // Convertir objeto a array y ordenar por año/semestre
        return Object.values(grupos).sort((a, b) => {
            if (a.semestre.año !== b.semestre.año) {
                return a.semestre.año - b.semestre.año;
            }
            return a.semestre.numero - b.semestre.numero;
        });
    }

    /**
     * Calcula la nota final de un curso
     * @private
     * @param {Array} calificaciones - Array de calificaciones
     * @returns {number|null} Nota final calculada
     */
    static _calcularNotaFinal(calificaciones) {
        if (!calificaciones || calificaciones.length === 0) {
            return null;
        }

        const calificacionesConNota = calificaciones.filter(cal => cal.nota !== null);
        if (calificacionesConNota.length === 0) {
            return null;
        }

        let sumaPonderada = 0;
        let sumaPonderaciones = 0;

        calificacionesConNota.forEach(cal => {
            sumaPonderada += (parseFloat(cal.nota) * parseFloat(cal.ponderacion)) / 100;
            sumaPonderaciones += parseFloat(cal.ponderacion);
        });

        if (sumaPonderaciones === 0) {
            return null;
        }

        const notaFinal = (sumaPonderada * 100) / sumaPonderaciones;
        return Math.round(notaFinal * 100) / 100;
    }

    /**
     * Determina el estado de aprobación
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
     * Calcula estadísticas generales del estudiante
     * @private
     * @param {Array} inscripciones - Array de inscripciones
     * @returns {Object} Estadísticas calculadas
     */
    static _calcularEstadisticasGenerales(inscripciones) {
        const totalCursos = inscripciones.length;
        let cursosAprobados = 0;
        let cursosReprobados = 0;
        let cursosPendientes = 0;
        let creditosTotales = 0;
        let creditosAprobados = 0;
        let sumaNotasPonderadas = 0;
        let creditosConNota = 0;

        inscripciones.forEach(inscripcion => {
            const curso = inscripcion.curso;
            const calificaciones = inscripcion.calificaciones;
            const notaFinal = this._calcularNotaFinal(calificaciones);
            
            creditosTotales += curso.creditos;

            if (notaFinal === null) {
                cursosPendientes++;
            } else if (notaFinal >= 61) {
                cursosAprobados++;
                creditosAprobados += curso.creditos;
                sumaNotasPonderadas += notaFinal * curso.creditos;
                creditosConNota += curso.creditos;
            } else {
                cursosReprobados++;
                sumaNotasPonderadas += notaFinal * curso.creditos;
                creditosConNota += curso.creditos;
            }
        });

        const promedioGeneral = creditosConNota > 0 ? sumaNotasPonderadas / creditosConNota : null;

        // Agrupar por semestre para progresión
        const semestres = [...new Set(inscripciones.map(i => `${i.semestre.anio}-${i.semestre.numero_semestre}`))];

        return {
            totalCursos,
            cursosAprobados,
            cursosReprobados,
            cursosPendientes,
            creditosTotales,
            creditosAprobados,
            promedioGeneral: promedioGeneral ? Math.round(promedioGeneral * 100) / 100 : null,
            porcentajeAprobacion: totalCursos > 0 ? (cursosAprobados / totalCursos) * 100 : 0,
            porcentajeCreditos: creditosTotales > 0 ? (creditosAprobados / creditosTotales) * 100 : 0,
            totalSemestres: semestres.length,
            eficienciaAcademica: this._calcularEficienciaAcademica(cursosAprobados, totalCursos, semestres.length)
        };
    }

    /**
     * Valida la progresión académica del estudiante
     * @private
     * @param {Array} cursosPorSemestre - Cursos agrupados por semestre
     * @returns {Object} Validación de progresión
     */
    static _validarProgresionAcademica(cursosPorSemestre) {
        const alertas = [];
        const observaciones = [];
        let semestresBajoCursos = 0;
        let semestresConReprobados = 0;
        let totalCreditosPrograma = 0; // Este valor debería venir del plan de estudios

        cursosPorSemestre.forEach((semestre, index) => {
            const cursos = semestre.cursos;
            const cursosAprobados = cursos.filter(c => c.validado).length;
            const cursosReprobados = cursos.filter(c => c.notaFinal !== null && !c.validado).length;
            const creditosSemestre = cursos.reduce((sum, c) => sum + c.curso.creditos, 0);

            // Validar carga académica mínima (12 créditos por semestre)
            if (creditosSemestre < 12) {
                alertas.push(`${semestre.semestre.descripcion}: Carga académica baja (${creditosSemestre} créditos)`);
                semestresBajoCursos++;
            }

            // Validar cursos reprobados
            if (cursosReprobados > 0) {
                alertas.push(`${semestre.semestre.descripcion}: ${cursosReprobados} curso(s) reprobado(s)`);
                semestresConReprobados++;
            }

            // Validar progresión normal (debería aprobar al menos 75% de cursos)
            const porcentajeAprobacion = cursos.length > 0 ? (cursosAprobados / cursos.length) * 100 : 0;
            if (porcentajeAprobacion < 75 && cursos.length > 0) {
                alertas.push(`${semestre.semestre.descripcion}: Bajo porcentaje de aprobación (${FormatHelper.formatearNumero(porcentajeAprobacion, 1)}%)`);
            }
        });

        // Evaluación general de progresión
        let nivelProgresion = 'EXCELENTE';
        if (alertas.length === 0) {
            observaciones.push('Progresión académica excelente sin observaciones');
        } else if (alertas.length <= 2) {
            nivelProgresion = 'BUENA';
            observaciones.push('Progresión académica buena con observaciones menores');
        } else if (alertas.length <= 4) {
            nivelProgresion = 'REGULAR';
            observaciones.push('Progresión académica regular, requiere atención');
        } else {
            nivelProgresion = 'DEFICIENTE';
            observaciones.push('Progresión académica deficiente, requiere intervención académica');
        }

        return {
            nivel: nivelProgresion,
            alertas,
            observaciones,
            semestresBajoCursos,
            semestresConReprobados,
            requiereAtencion: alertas.length > 2,
            recomendaciones: this._generarRecomendaciones(alertas, semestresConReprobados)
        };
    }

    /**
     * Calcula la eficiencia académica
     * @private
     * @param {number} cursosAprobados - Cursos aprobados
     * @param {number} totalCursos - Total de cursos
     * @param {number} totalSemestres - Total de semestres
     * @returns {Object} Métricas de eficiencia
     */
    static _calcularEficienciaAcademica(cursosAprobados, totalCursos, totalSemestres) {
        const eficiencia = totalCursos > 0 ? (cursosAprobados / totalCursos) * 100 : 0;
        const promedio CursosPorSemestre = totalSemestres > 0 ? totalCursos / totalSemestres : 0;

        let clasificacion = '';
        if (eficiencia >= 90) clasificacion = 'Excelente';
        else if (eficiencia >= 80) clasificacion = 'Muy Buena';
        else if (eficiencia >= 70) clasificacion = 'Buena';
        else if (eficiencia >= 60) clasificacion = 'Regular';
        else clasificacion = 'Deficiente';

        return {
            porcentaje: Math.round(eficiencia * 100) / 100,
            clasificacion,
            promedioCursosPorSemestre: Math.round(promedioCursosPorSemestre * 100) / 100
        };
    }

    /**
     * Genera recomendaciones basadas en alertas
     * @private
     * @param {Array} alertas - Array de alertas
     * @param {number} semestresConReprobados - Semestres con reprobados
     * @returns {Array} Array de recomendaciones
     */
    static _generarRecomendaciones(alertas, semestresConReprobados) {
        const recomendaciones = [];

        if (semestresConReprobados > 0) {
            recomendaciones.push('Considerar repetir cursos reprobados en próximas oportunidades');
            recomendaciones.push('Solicitar tutoría académica para materias de mayor dificultad');
        }

        if (alertas.some(a => a.includes('Carga académica baja'))) {
            recomendaciones.push('Incrementar la carga académica para mantener progresión normal');
        }

        if (alertas.some(a => a.includes('Bajo porcentaje'))) {
            recomendaciones.push('Revisar métodos de estudio y técnicas de aprendizaje');
            recomendaciones.push('Considerar apoyo psicopedagógico si es necesario');
        }

        if (recomendaciones.length === 0) {
            recomendaciones.push('Mantener el excelente desempeño académico');
            recomendaciones.push('Considerar participar en actividades extracurriculares');
        }

        return recomendaciones;
    }
}

module.exports = ValidacionService;