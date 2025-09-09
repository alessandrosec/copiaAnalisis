module.exports = (app) => {
  const estudiante = require("../controllers/estudiante.controller.js");
  var router = require("express").Router();

  //Nuevo Estudiante
  /**
   * @swagger
   * /api/estudiante/create/:
   *   post:
   *     summary: Crear estudiante
   *     tags: [Estudiante]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *                primer_nombre:
   *                  type: string
   *                segundo_nombre:
   *                  type: string
   *                primer_apellido:
   *                  type: string
   *     responses:
   *       200:
   *         description: Estudiante creado
   *       400:
   *         description: Error al crear estudiante
   */
  router.post("/create/", estudiante.create);

  //Obtener todos los estudiantes
  /**
   * @swagger
   * /api/estudiante/:
   *   get:
   *     summary: Obtener estudiantes
   *     tags: [Estudiante]
   *     description: Obtener todos los estudiantes
   *     responses:
   *       200:
   *         description: Listado de estudiantes
   */
  router.get("/", estudiante.getAll);

    //Obtener estudiante por id
    /**
   * @swagger
   * /api/estudiante/{id}:
   *   get:
   *     summary: Obtener estudiante por id
   *     tags: [Estudiante]
   *     parameters:
   *        - in: path
   *          name: id
   *          type: string
   *     description: Obtener estudiante por id
   *     responses:
   *       200:
   *         description: Estudiante encontrado
   */
  //Obtener por id estudiante
  router.get("/:id", estudiante.getById);

  //Actualizar estudiante
    /**
   * @swagger
   * /api/estudiante/update/{id}:
   *   put:
   *     summary: Actualizar estudiante por id
   *     tags: [Estudiante]
   *     parameters:
   *        - in: path
   *          name: id
   *          type: string
   *     description: Obtener estudiante por id
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *                primer_nombre:
   *                  type: string
   *                segundo_nombre:
   *                  type: string
   *                primer_apellido:
   *                  type: string
   *     responses:
   *       200:
   *         description: Estudiante actualizado
   */  
  router.put("/update/:id", estudiante.update);

  //Eliminar estudiante
    /**
   * @swagger
   * /api/estudiante/delete/{id}:
   *   delete:
   *     summary: Eliminar estudiante por id
   *     tags: [Estudiante]
   *     parameters:
   *        - in: path
   *          name: id
   *          type: string
   *     description: Obtener estudiante por id
   *     responses:
   *       200:
   *         description: Estudiante encontrado
   */  
  router.delete("/delete/:id", estudiante.delete);
  app.use("/api/estudiante", router);
};
