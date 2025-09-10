module.exports = (app) => {
  var router = require("express").Router();

  // Ruta de prueba simple
  router.get("/test", (req, res) => {
    res.json({ 
      message: "API de calificaciones funcionando",
      timestamp: new Date().toISOString()
    });
  });

  /**
   * @swagger
   * /api/reportes/calificaciones/test:
   *   get:
   *     summary: Prueba de API de calificaciones
   *     tags: [Calificaciones]
   *     responses:
   *       200:
   *         description: API funcionando correctamente
   */

  app.use("/api/reportes/calificaciones", router);
};