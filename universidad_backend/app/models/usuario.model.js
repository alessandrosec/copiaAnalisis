//Utilizamos module.export para exportar objetos para que puedan ser utilizados en otras clases
module.exports = (sequelize, Sequelize) => {
// usamos el sequelize.defina para "definir" el nombre de la entity en la BD, en este caso "cliente"
// Usamos type.Sequelize para definir el tipo de datos de cada atributo de la entidad 
    const Usuario = sequelize.define("usuario", {
        correo: {
            type: Sequelize.STRING,
            unique: true
        },
        contrasena: {
            type: Sequelize.STRING
        },
        role: {
            type: Sequelize.ENUM("admin", "docente", "estudiante", "user"),
            defaultValue: "user"
        }
    });
    return Usuario;
};