/**
 * PLALLA PARA DOCUMENTO DE CALIFICACIONES
 * Propósito: Generar estructura de datos para reporte de calificaciones
 */
const DateHelper = require("../utils/dateHelper");
const FormatHelper = require("../utils/formatHelper");

class CalificacionesTemplate {

    /**
     * Genera los datos estructurados para el reporte de calificaciones
     * @param {Object} datosCalificaciones - Datos obtenidos del servicio
     * @param {Object} parametros - Parámetros adicionales del reporte
     * @returns {Object} Datos estructurados para el reporte
     */
    static generarDatos(datosCalificaciones, parametros = {}) {
        const datos = datosCalificaciones.data;
        
        return {
            // Información del encabezado
            titulo: 'CERTIFICACIÓN DE CALIFICACIONES',
            subtitulo: 'Reporte Individual de Notas por Semestre',
            fechaGeneracion: DateHelper.formatearFechaHora(new Date()),
            
            // Información del estudiante
            estudiante: {
                nombre: datos.estudiante.nombreCompleto,
                id: datos.estudiante.id
            },
            
            // Información del período académico
            periodo: {
                descripcion: datos.semestre.descripcion,
                año: datos.semestre.año,
                semestre: datos.semestre.numero,
                fechaInicio: datos.semestre.fechaInicio,
                fechaFin: datos.semestre.fechaFin
            },
            
            // Tabla principal de calificaciones
            datos: this._generarTablaPrincipal(datos.cursos),
            
            // Resumen estadístico
            resumen: this._generarResumen(datos.estadisticas),
            
            // Detalles por curso
            detallesCursos: this._generarDetallesCursos(datos.cursos),
            
            // Información adicional
            observaciones: this._generarObservaciones(datos, parametros),
            
            // Datos para gráficos (si se requieren)
            graficos: this._generarDatosGraficos(datos.cursos)
        };
    }

    /**
     * Genera la tabla principal con resumen por curso
     * @private
     * @param {Array} cursos - Lista de cursos con calificaciones
     * @returns {Array} Datos para tabla principal
     */
    static _generarTablaPrincipal(cursos) {
        return cursos.map((curso, index) => ({
            'No.': index + 1,
            'Código': curso.curso.codigo,
            'Nombre del Curso': curso.curso.nombre,
            'Créditos': curso.curso.creditos,
            'Nota Final': curso.notaFinal !== null 
                ? FormatHelper.formatearNumero(curso.notaFinal, 2)
                : 'Pendiente',
            'Estado': curso.estado.descripcion,
            'Observaciones': this._generarObservacionesCurso(curso)
        }));
    }

    /**
     * Genera el resumen estadístico
     * @private
     * @param {Object} estadisticas - Estadísticas calculadas
     * @returns {Object} Resumen formateado
     */
    static _generarResumen(estadisticas) {
        return {
            'Total de Cursos': estadisticas.totalCursos,
            'Cursos Calificados': estadisticas.cursosCalificados,
            'Cursos Aprobados': estadisticas.cursosAprobados,
            'Cursos Reprobados': estadisticas.cursosReprobados,
            'Promedio General': estadisticas.promedioGeneral !== null 
                ? FormatHelper.formatearNumero(estadisticas.promedioGeneral, 2)
                : 'N/A',
            'Créditos Totales': estadisticas.creditosTotales,
            'Créditos Aprobados': estadisticas.creditosAprobados,
            'Porcentaje de Aprobación': estadisticas.cursosCalificados > 0
                ? FormatHelper.formatearPorcentaje(estadisticas.cursosAprobados / estadisticas.cursosCalificados)
                : '0%'
        };
    }

    /**
     * Genera detalles expandidos por curso
     * @private
     * @param {Array} cursos - Lista de cursos
     * @returns {Array} Detalles por curso
     */
    static _generarDetallesCursos(cursos) {
        return cursos.map(curso => ({
            curso: {
                codigo: curso.curso.codigo,
                nombre: curso.curso.nombre,
                creditos: curso.curso.creditos
            },
            evaluaciones: curso.calificaciones.map(cal => ({
                'Tipo de Evaluación': cal.tipo,
                'Nota': cal.nota !== null ? FormatHelper.formatearNumero(cal.nota, 2) : 'Pendiente',
                'Ponderación (%)': FormatHelper.formatearNumero(cal.ponderacion, 1),
                'Fecha': cal.fecha || 'No registrada',
                'Observaciones': cal.observaciones || ''
            })),
            notaFinal: curso.notaFinal !== null 
                ? FormatHelper.formatearNumero(curso.notaFinal, 2)
                : 'Pendiente',
            estado: curso.estado.descripcion
        }));
    }

    /**
     * Genera observaciones generales del reporte
     * @private
     * @param {Object} datos - Datos completos
     * @param {Object} parametros - Parámetros adicionales
     * @returns {Array} Lista de observaciones
     */
    static _generarObservaciones(datos, parametros) {
        const observaciones = [];
        
        // Observación sobre la escala de calificación
        observaciones.push('• Las calificaciones están expresadas en escala de 0 a 100 puntos.');
        observaciones.push('• La nota mínima de aprobación es 61 puntos.');
        
        // Observación sobre el período
        observaciones.push(`• Este reporte corresponde al ${datos.semestre.descripcion}.`);
        observaciones.push(`• Período: ${datos.semestre.fechaInicio} al ${datos.semestre.fechaFin}.`);
        
        // Observaciones sobre el estado
        const cursosAprobados = datos.cursos.filter(c => c.estado.aprobado).length;
        const cursosReprobados = datos.cursos.filter(c => !c.estado.aprobado && c.notaFinal !== null).length;
        const cursosPendientes = datos.cursos.filter(c => c.notaFinal === null).length;
        
        if (cursosAprobados > 0) {
            observaciones.push(`• El estudiante aprobó ${cursosAprobados} curso(s) en este período.`);
        }
        
        if (cursosReprobados > 0) {
            observaciones.push(`• El estudiante reprobó ${cursosReprobados} curso(s) en este período.`);
        }
        
        if (cursosPendientes > 0) {
            observaciones.push(`• ${cursosPendientes} curso(s) tienen calificaciones pendientes.`);
        }
        
        // Observación sobre promedio
        if (datos.estadisticas.promedioGeneral !== null) {
            const nivelRendimiento = this._determinarNivelRendimiento(datos.estadisticas.promedioGeneral);
            observaciones.push(`• Promedio general: ${FormatHelper.formatearNumero(datos.estadisticas.promedioGeneral, 2)} (${nivelRendimiento}).`);
        }
        
        return observaciones;
    }

    /**
     * Genera observaciones específicas por curso
     * @private
     * @param {Object} curso - Datos del curso
     * @returns {string} Observaciones del curso
     */
    static _generarObservacionesCurso(curso) {
        const observaciones = [];
        
        if (curso.notaFinal === null) {
            observaciones.push('Calificación pendiente');
        }
        
        if (curso.estadoInscripcion === 'RETIRADO') {
            observaciones.push('Curso retirado');
        }
        
        // Verificar si hay evaluaciones pendientes
        const evaluacionesConNota = curso.calificaciones.filter(cal => cal.nota !== null);
        const totalPonderacion = curso.calificaciones.reduce((sum, cal) => sum + cal.ponderacion, 0);
        
        if (totalPonderacion < 100 && evaluacionesConNota.length < curso.calificaciones.length) {
            observaciones.push('Evaluaciones incompletas');
        }
        
        return observaciones.join(', ');
    }

    /**
     * Determina el nivel de rendimiento basado en el promedio
     * @private
     * @param {number} promedio - Promedio general
     * @returns {string} Nivel de rendimiento
     */
    static _determinarNivelRendimiento(promedio) {
        if (promedio >= 90) return 'Excelente';
        if (promedio >= 80) return 'Muy Bueno';
        if (promedio >= 70) return 'Bueno';
        if (promedio >= 61) return 'Satisfactorio';
        return 'Insatisfactorio';
    }

    /**
     * Genera datos para gráficos opcionales
     * @private
     * @param {Array} cursos - Lista de cursos
     * @returns {Object} Datos para gráficos
     */
    static _generarDatosGraficos(cursos) {
        const cursosConNota = cursos.filter(c => c.notaFinal !== null);
        
        return {
            distribucionNotas: {
                labels: cursosConNota.map(c => c.curso.codigo),
                datos: cursosConNota.map(c => c.notaFinal)
            },
            estadosAprobacion: {
                labels: ['Aprobados', 'Reprobados', 'Pendientes'],
                datos: [
                    cursos.filter(c => c.estado.aprobado).length,
                    cursos.filter(c => !c.estado.aprobado && c.notaFinal !== null).length,
                    cursos.filter(c => c.notaFinal === null).length
                ]
            }
        };
    }
}

module.exports = CalificacionesTemplate;