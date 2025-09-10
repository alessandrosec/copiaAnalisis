/**
 * CONTROLLER DE VALIDACIÓN DE CURSOS
 * Propósito: Manejar endpoints específicos para documento de validación
 */
const ValidacionService = require("../services/validacion.service");
const ReporteService = require("../services/reporte.service");
const ValidacionTemplate = require("../templates/validacion.template");
const { validationResult, body, param } = require('express-validator');

class ValidacionController {

    /**
     * Genera documento de validación de cursos para un estudiante
     * POST /api/reportes/validacion/generar
     */
    static async generarDocumentoValidacion(req, res) {
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
                formato = 'PDF',
                incluirDetalles = true 
            } = req.body;
            const idUsuario = req.user?.id;

            // 1. Obtener validación completa del estudiante
            const resultadoValidacion = await ValidacionService.obtenerValidacionCompleta(idEstudiante);

            if (!resultadoValidacion.success) {
                return res.status(400).json({
                    success: false,
                    mensaje: resultadoValidacion.mensaje,
                    error: resultadoValidacion.error
                });
            }

            // 2. Validar que el estudiante tenga cursos
            if (resultadoValidacion.data.estadisticasGenerales.totalCursos === 0) {
                return res.status(400).json({
                    success: false,
                    mensaje: 'El estudiante no tiene cursos registrados para validar'
                });
            }

            // 3. Preparar datos usando la plantilla
            const datosReporte = ValidacionTemplate.generarDatos(
                resultadoValidacion,
                { incluirDetalles }
            );

            // 4. Buscar configuración del reporte de validación
            const db = require("../models");
            const { ReporteConfig } = db.reportes || {};
            
            const configuracion = await ReporteConfig.findOne({
                where: { plantilla: 'validacion', activo: true }
            });

            if (!configuracion) {
                return res.status(500).json({
                    success: false,
                    mensaje: 'Configuración de reporte de validación no encontrada'
                });
            }
            // 5. Generar el reporte usando el servicio base
            const parametrosReporte = {
                idEstudiante,
                nombreEstudiante: datosReporte.estudiante.nombre,
                totalCursos: datosReporte.resumen['Total de Cursos'],
                cursosAprobados: datosReporte.resumen['Cursos Aprobados'],
                promedioGeneral: datosReporte.resumen['Promedio General'],
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
                            totalCursos: datosReporte.resumen['Total de Cursos'],
                            cursosAprobados: datosReporte.resumen['Cursos Aprobados'],
                            promedioGeneral: datosReporte.resumen['Promedio General'],
                            eficienciaAcademica: datosReporte.resumen['Eficiencia Académica'],
                            nivelProgresion: datosReporte.progresion['Nivel de Progresión']
                        }
                    },
                    mensaje: 'Documento de validación generado exitosamente'
                });
            } else {
                res.status(400).json({
                    success: false,
                    mensaje: resultadoGeneracion.mensaje,
                    error: resultadoGeneracion.error
                });
            }

        } catch (error) {
            console.error('Error al generar documento de validación:', error);
            res.status(500).json({
                success: false,
                mensaje: 'Error interno del servidor',
                error: error.message
            });
        }
    }

    /**
     * Obtiene vista previa de validación sin generar documento
     * GET /api/reportes/validacion/preview/:idEstudiante
     */
    static async obtenerVistaPrevia(req, res) {
        try {
            const { idEstudiante } = req.params;

            // Validar parámetros
            const idEst = parseInt(idEstudiante);
            if (isNaN(idEst)) {
                return res.status(400).json({
                    success: false,
                    mensaje: 'ID de estudiante inválido'
                });
            }

            // Obtener validación
            const resultado = await ValidacionService.obtenerValidacionCompleta(idEst);

            if (resultado.success) {
                // Generar vista previa usando plantilla
                const vistaPrevia = ValidacionTemplate.generarDatos(resultado);
                
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
            console.error('Error al obtener vista previa de validación:', error);
            res.status(500).json({
                success: false,
                mensaje: 'Error al generar vista previa',
                error: error.message
            });
        }
    }

    /**
     * Obtiene resumen ejecutivo de validación
     * GET /api/reportes/validacion/resumen/:idEstudiante
     */
    static async obtenerResumenValidacion(req, res) {
        try {
            const { idEstudiante } = req.params;
            const idEst = parseInt(idEstudiante);

            if (isNaN(idEst)) {
                return res.status(400).json({
                    success: false,
                    mensaje: 'ID de estudiante inválido'
                });
            }

            const resultado = await ValidacionService.obtenerValidacionCompleta(idEst);

            if (resultado.success) {
                const datos = resultado.data;
                
                // Generar resumen ejecutivo
                const resumen = {
                    estudiante: datos.estudiante.nombreCompleto,
                    estadisticasGenerales: datos.estadisticasGenerales,
                    progresion: {
                        nivel: datos.validacionProgresion.nivel,
                        requiereAtencion: datos.validacionProgresion.requiereAtencion,
                        totalAlertas: datos.validacionProgresion.alertas.length
                    },
                    ultimoSemestre: datos.cursosPorSemestre.length > 0 
                        ? datos.cursosPorSemestre[datos.cursosPorSemestre.length - 1].semestre
                        : null
                };

                res.status(200).json({
                    success: true,
                    data: resumen,
                    mensaje: 'Resumen de validación obtenido correctamente'
                });
            } else {
                res.status(400).json({
                    success: false,
                    mensaje: resultado.mensaje,
                    error: resultado.error
                });
            }

        } catch (error) {
            console.error('Error al obtener resumen de validación:', error);
            res.status(500).json({
                success: false,
                mensaje: 'Error al obtener resumen',
                error: error.message
            });
        }
    }
}

module.exports = ValidacionController;