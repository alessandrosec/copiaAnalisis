module.exports = (sequelize, Sequelize) => {
    const Usuario = require("./usuario.model")(sequelize, Sequelize);
    const Estudiante = sequelize.define("estudiante", {
        primer_nombre: {
            type: Sequelize.STRING
        },
        segundo_nombre: {
            type: Sequelize.STRING
        },
        primer_apellido: {
            type: Sequelize.STRING
        }
    });

        Estudiante.belongsTo(Usuario, {
        foreignKey: "id_usuario",
        targetKey: "id",
    });

    Usuario.hasOne(Estudiante, {
        foreignKey: "id_usuario",
        sourceKey: "id",
    });

    return Estudiante;
};