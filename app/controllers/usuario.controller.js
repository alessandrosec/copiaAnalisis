// importamos db los modelos en este caso si tenemos uno o mas, se puede referenciar db."nombreModelo".   
const db = require("../models");
const Usuario = db.usuarios;
const Op = db.Sequelize.Op;
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");


// Create and Save a new Client
exports.create = async (req, res) => {
    try{
    // Validamos que dentro del  request no venga vacio el nombre, de lo contrario returna error
    if (!req.body.correo || !req.body.contrasena) {
        res.status(400).send({
            message: "Necesita ingresar el correo o la contraseña!"
        });
        return;
    }

    const hashedPassword = await bcrypt.hash(req.body.contrasena, 10);

    // Create a Client, definiendo una variable con la estructura del reques para luego solo ser enviada como parametro mas adelante. 
    const usuario = {
        correo: req.body.correo,
        contrasena: hashedPassword,
        role: req.body.role || "user",
        // utilizando ? nos ayuda a indicar que el paramatro puede ser opcional dado que si no viene, le podemos asignar un valor default
        status: req.body.status ? req.body.status : false
    };

    // Save a new Client into the database
    Usuario.create(usuario)
        .then(data => {
            res.send(data);
        })
        .catch(err => {
            res.status(500).send({
                message:
                    err.message || "Some error occurred while creating the User."
            });
        });
    } catch(err){
        res.status(500).send({ message: err.message });
        console.log("hubo un error inesperado", err.message)
    }
};

// Retrieve all Client from the database.
exports.findAll = (req, res) => {
    const nombre = req.query.correo;
    var condition = nombre ? { nombre: { [Op.iLike]: `%${nombre}%` } } : null;

    Usuario.findAll({ where: condition })
        .then(data => {
            res.send(data);
        })
        .catch(err => {
            res.status(500).send({
                message:
                    err.message || "Some error occurred while retrieving Users."
            });
        });
};

// Find a single Tutorial with an id
exports.findOne = async (req, res) => {
    try {
        const usuario = await Usuario.findOne({ where: { correo: req.body.correo } });
        if (!usuario) {
            return res.status(404).send({ message: "Usuario no encontrado" });
        }

        const validPassword = await bcrypt.compare(req.body.contrasena, usuario.contrasena);
        if (!validPassword) {
            return res.status(401).send({ message: "Contraseña incorrecta" });
        }

        const token = jwt.sign(
            { id: usuario.id, role: usuario.role },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );

        res.send({ message: "Login exitoso", token });
    } catch (err) {
        res.status(500).send({ message: err.message });
    }
};

// Update a Tutorial by the id in the request
exports.update = (req, res) => {
    const id = req.params.id;

    Usuario.update(req.body, {
        where: { id: id }
    })
        .then(num => {
            if (num == 1) {
                res.send({
                    message: "User was updated successfully."
                });
            } else {
                res.send({
                    message: `Cannot update User with id=${id}. Maybe User was not found or req.body is empty!`
                });
            }
        })
        .catch(err => {
            res.status(500).send({
                message: "Error updating User with id=" + id
            });
        });
};

// Delete a Client with the specified id in the request
exports.delete = (req, res) => {
    const id = req.params.id;
    // utilizamos el metodo destroy para eliminar el objeto mandamos la condicionante where id = parametro que recibimos 
    Usuario.destroy({
        where: { id: id }
    })
        .then(num => {
            if (num == 1) {
                res.send({
                    message: "User was deleted successfully!"
                });
            } else {
                res.send({
                    message: `Cannot delete User with id=${id}. El usuario no fue encontado!`
                });
            }
        })
        .catch(err => {
            res.status(500).send({
                message: "Could not delete User with id=" + id
            });
        });
};

// Delete all Clients from the database.
exports.deleteAll = (req, res) => {
    Usuario.destroy({
        where: {},
        truncate: false
    })
        .then(nums => {
            res.send({ message: `${nums} User were deleted successfully!` });
        })
        .catch(err => {
            res.status(500).send({
                message:
                    err.message || "Some error occurred while removing all users."
            });
        });
};

// find all active Client, basado en el atributo status vamos a buscar que solo los clientes activos
exports.findAllStatus = (req, res) => {
    Usuario.findAll({ where: { status: true } })
        .then(data => {
            res.send(data);
        })
        .catch(err => {
            res.status(500).send({
                message:
                    err.message || "Some error occurred while retrieving User."
            });
        }); 
};