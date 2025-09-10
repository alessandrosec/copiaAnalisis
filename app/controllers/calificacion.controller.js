/**
 * CONTROLLER DE CALIFICACIONES
 * Propósito: Manejar endpoints específicos para documento de calificaciones
 */
const CalificacionService = require("../services/calificacion.service");
const ReporteService = require("../services/reporte.service");
const CalificacionesTemplate = require("../templates/calificaciones.template");
const { validationResult, body, param, query } = require('express-validator');

class CalificacionController {

    /**
     * Genera documento de calificaciones para un estudiante
     * POST /api/reportes/calificaciones/generar
     */
    static async generarDocumentoCalificaciones(req, res) {
        try {
            // Validar errores de entrada
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    mensaje: 'Datos de entrada inválidos',
                    errores: errors.array()
                });
            }

            const { 
                idEstudiante, 
                año, 
                numeroSemestre, 
                formato = 'PDF',
                incluirDetalles = true 
            } = req.body;
            const idUsuario = req.user?.id;

            // 1. Obtener calificaciones del estudiante
            const resultadoCalificaciones = await CalificacionService.obtenerCalificacionesPorSemestre(
                idEstudiante, 
                año, 
                numeroSemestre
            );

            if (!resultadoCalificaciones.success) {
                return res.status(400).json({
                    success: false,
                    mensaje: resultadoCalificaciones.mensaje,
                    error: resultadoCalificaciones.error
                });
            }

            // 2. Validar que existan calificaciones
            const validacion = await CalificacionService.validarCalificacionesExistentes(
                idEstudiante, 
                año, 
                numeroSemestre
            );

            if (!validacion.valido) {
                return res.status(400).json({
                    success: false,
                    mensaje: validacion.mensaje,
                    detalles: {
                        totalCursos: validacion.totalCursos,
                        cursosConCalificaciones: validacion.cursosConCalificaciones
                    }
                });
            }

            // 3. Preparar datos usando la plantilla
            const datosReporte = CalificacionesTemplate.generarDatos(
                resultadoCalificaciones,
                { incluirDetalles }
            );

            // 4. Buscar configuración del reporte de calificaciones
            const db = require("../models");
            const { ReporteConfig } = db.reportes || {};
            
            const configuracion = await ReporteConfig.findOne({
                where: { plantilla: 'calificaciones', activo: true }
            });

            if (!configuracion) {
                return res.status(500).json({
                    success: false,
                    mensaje: 'Configuración de reporte de calificaciones no encontrada'
                });
            }

            // 5. Generar el reporte usando el servicio base
            const parametrosReporte = {
                idEstudiante,
                año,
                numeroSemestre,
                nombreEstudiante: datosReporte.estudiante.nombre,
                periodo: datosReporte.periodo.descripcion,
                incluirDetalles
            };

            const resultadoGeneracion = await ReporteService.generarReporte(
                configuracion.id,
                parametrosReporte,
                formato.toUpperCase(),
                idUsuario
            );

            if (resultadoGeneracion.success) {
                res.status(200).json({
                    success: true,
                    data: {
                        archivo: resultadoGeneracion.data.archivo.nombre,
                        tiempoGeneracion: resultadoGeneracion.data.tiempoGeneracion,
                        tamaño: resultadoGeneracion.data.archivo.tamaño,
                        downloadUrl: `/api/reportes/descargar/${resultadoGeneracion.data.historialId}`,
                        resumen: {
                            estudiante: datosReporte.estudiante.nombre,
                            periodo: datosReporte.periodo.descripcion,
                            totalCursos: datosReporte.resumen['Total de Cursos'],
                            cursosAprobados: datosReporte.resumen['Cursos Aprobados'],
                            promedioGeneral: datosReporte.resumen['Promedio General']
                        }
                    },
                    mensaje: 'Documento de calificaciones generado exitosamente'
                });
            } else {
                res.status(400).json({
                    success: false,
                    mensaje: resultadoGeneracion.mensaje,
                    error: resultadoGeneracion.error
                });
            }

        } catch (error) {
            console.error('Error al generar documento de calificaciones:', error);
            res.status(500).json({
                success: false,
                mensaje: 'Error interno del servidor',
                error: error.message
            });
        }
    }

    /**
     * Obtiene vista previa de calificaciones sin generar documento
     * GET /api/reportes/calificaciones/preview/:idEstudiante/:año/:numeroSemestre
     */
    static async obtenerVistaPrevia(req, res) {
        try {
            const { idEstudiante, año, numeroSemestre } = req.params;

            // Convertir a números
            const idEst = parseInt(idEstudiante);
            const añoNum = parseInt(año);
            const semestreNum = parseInt(numeroSemestre);

            // Validar parámetros
            if (isNaN(idEst) || isNaN(añoNum) || isNaN(semestreNum)) {
                return res.status(400).json({
                    success: false,
                    mensaje: 'Parámetros inválidos'
                });
            }

            // Obtener calificaciones
            const resultado = await CalificacionService.obtenerCalificacionesPorSemestre(
                idEst, 
                añoNum, 
                semestreNum
            );

            if (resultado.success) {
                // Generar vista previa usando plantilla
                const vistaPrevia = CalificacionesTemplate.generarDatos(resultado);
                
                res.status(200).json({
                    success: true,
                    data: vistaPrevia,
                    mensaje: 'Vista previa generada correctamente'
                });
            } else {
                res.status(400).json({
                    success: false,
                    mensaje: resultado.mensaje,
                    error: resultado.error
                });
            }

        } catch (error) {
            console.error('Error al obtener vista previa:', error);
            res.status(500).json({
                success: false,
                mensaje: 'Error al generar vista previa',
                error: error.message
            });
        }
    }

    /**
     * Obtiene los semestres disponibles para un estudiante
     * GET /api/reportes/calificaciones/semestres/:idEstudiante
     */
    static async obtenerSemestresEstudiante(req, res) {
        try {
            const { idEstudiante } = req.params;
            const idEst = parseInt(idEstudiante);

            if (isNaN(idEst)) {
                return res.status(400).json({
                    success: false,
                    mensaje: 'ID de estudiante inválido'
                });
            }

            const resultado = await CalificacionService.obtenerSemestresDisponibles(idEst);

            if (resultado.success) {
                res.status(200).json({
                    success: true,
                    data: resultado.data,
                    mensaje: resultado.mensaje
                });
            } else {
                res.status(400).json({
                    success: false,
                    mensaje: resultado.mensaje,
                    error: resultado.error
                });
            }

        } catch (error) {
            console.error('Error al obtener semestres:', error);
            res.status(500).json({
                success: false,
                mensaje: 'Error al obtener semestres disponibles',
                error: error.message
            });
        }
    }

    /**
     * Valida si existen calificaciones para generar el documento
     * POST /api/reportes/calificaciones/validar
     */
    static async validarCalificaciones(req, res) {
        try {
            const { idEstudiante, año, numeroSemestre } = req.body;

            const validacion = await CalificacionService.validarCalificacionesExistentes(
                idEstudiante, 
                año, 
                numeroSemestre
            );

            res.status(200).json({
                success: true,
                data: validacion,
                mensaje: validacion.mensaje
            });

        } catch (error) {
            console.error('Error al validar calificaciones:', error);
            res.status(500).json({
                success: false,
                mensaje: 'Error al validar calificaciones',
                error: error.message
            });
        }
    }
}

module.exports = CalificacionController;