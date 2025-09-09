module.exports = app => {
    const Verificador = require("../middlewares/autorizacion.middleware.js")
    const soloadmin = Verificador(["admin"])

    const usuario = require("../controllers/usuario.controller.js");
    var router = require("express").Router();
    // Create a new Client
    router.post("/register/", usuario.create);
    // Retrieve all Client
    router.get("/", soloadmin, usuario.findAll);
    // Retrieve all published Client
    router.get("/status", soloadmin, usuario.findAllStatus);
    // Retrieve a single Client with id
    router.get("/login", usuario.findOne);
    // Update a Client with id
    router.put("/update/:id", soloadmin, usuario.update);
    // Delete a Client with id
    router.delete("/delete/:id", Verificador(["admin"]),  usuario.delete);
    // Delete all Cliente
    router.delete("/delete/", Verificador(["admin"]),  usuario.deleteAll);
    // Podemos utilizar como una ocpion app.use("EndPoint",router" para simplicar el URI
    // Ej.  http://localhost:Puerto/api/cliente/
    app.use("/api/usuario", router);
};