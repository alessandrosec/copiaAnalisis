const db = require("../models");
const Estudiante = db.estudiante;
const Op = db.Sequelize.Op;

exports.create = (req, res) => {
  if (!req.body.primer_nombre) {
    res.status(400).send({
      message: "No puede estar vacio.",
    });
    return;
  }

  const estudiante = {
    primer_nombre: req.body.primer_nombre,
    segundo_nombre: req.body.segundo_nombre,
    primer_apellido: req.body.primer_apellido,
  };

  Estudiante.create(estudiante)
    .then((data) => {
      res.send(data);
    })
    .catch((err) => {
      res.status(500).send({
        message: err.message || "Error ocurrido al crear estudiante.",
      });
    });
};

exports.getAll = (req, res) => {
  Estudiante.findAll()
    .then((data) => {
      res.send(data);
    })
    .catch((err) => {
      res.status(500).send({
        message: err.message || "Error ocurrido al obtener estudiantes.",
      });
    });
};

exports.getById = (req, res) => {
  const idEstudiante = req.params.id;

  Estudiante.findAll({ where: { id: idEstudiante } })
    .then((data) => {
      res.send(data);
    })
    .catch((err) => {
      res.status(500).send({
        message: err.message || "Error ocurrido al obtener estudiante.",
      });
    });
};

exports.update = (req, res) => {
  const id = req.params.id;

  Estudiante.update(req.body, {
    where: { id: id },
  })
    .then((num) => {
      if (num == 1) {
        res.send({
          message: "Estudiante Actualizado.",
        });
      } else {
        res.send({
          message: `No se actualizo estudiante con ID=${id}. Estudiante no existe o error en la peticion.`,
        });
      }
    })
    .catch((err) => {
      res.status(500).send({
        message: "Error al actualizar estudiante con ID=" + id,
      });
    });
};

exports.delete = (req, res) => {
  const id = req.params.id;
  Estudiante.destroy({
    where: { id: id },
  })
    .then((num) => {
      if (num == 1) {
        res.send({
          message: "Estudiante eliminado exitosamente",
        });
      } else {
        res.send({
          message: `No se puede eliminar estudiante con ID=${id}. Estudiante no existe o error en la peticion.`,
        });
      }
    })
    .catch((err) => {
      res.status(500).send({
        message: "Error al eliminar estudiante con ID=" + id,
      });
    });
};
