/**
 * MODELOS PARA CALIFICACIONES
 * Propósito: Definir estructura de datos académicos
 */
module.exports = (sequelize, Sequelize) => {
    
    // Modelo de Cursos
    const Curso = sequelize.define("curso", {
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        codigo_curso: {
            type: Sequelize.STRING(20),
            allowNull: false,
            unique: true,
            comment: 'Código único del curso'
        },
        nombre_curso: {
            type: Sequelize.STRING(200),
            allowNull: false,
            comment: 'Nombre completo del curso'
        },
        creditos: {
            type: Sequelize.INTEGER,
            allowNull: false,
            validate: { min: 1 },
            comment: 'Número de créditos del curso'
        },
        descripcion: {
            type: Sequelize.STRING(500),
            comment: 'Descripción del curso'
        },
        prerrequisitos: {
            type: Sequelize.STRING(200),
            comment: 'Prerrequisitos del curso'
        },
        activo: {
            type: Sequelize.BOOLEAN,
            defaultValue: true,
            comment: 'Estado del curso'
        }
    }, {
        tableName: 'cursos',
        timestamps: true,
        createdAt: 'fecha_creacion',
        updatedAt: false
    });

    // Modelo de Semestres
    const Semestre = sequelize.define("semestre", {
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        anio: {
            type: Sequelize.INTEGER,
            allowNull: false,
            comment: 'Año del semestre'
        },
        numero_semestre: {
            type: Sequelize.INTEGER,
            allowNull: false,
            validate: { min: 1, max: 2 },
            comment: '1 = Primer semestre, 2 = Segundo semestre'
        },
        fecha_inicio: {
            type: Sequelize.DATE,
            allowNull: false,
            comment: 'Fecha de inicio del semestre'
        },
        fecha_fin: {
            type: Sequelize.DATE,
            allowNull: false,
            comment: 'Fecha de fin del semestre'
        },
        activo: {
            type: Sequelize.BOOLEAN,
            defaultValue: true,
            comment: 'Estado del semestre'
        }
    }, {
        tableName: 'semestres',
        timestamps: true,
        createdAt: 'fecha_creacion',
        updatedAt: false,
        indexes: [
            {
                unique: true,
                fields: ['anio', 'numero_semestre']
            }
        ]
    });

    // Modelo de Inscripciones
    const Inscripcion = sequelize.define("inscripcion", {
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        id_estudiante: {
            type: Sequelize.INTEGER,
            allowNull: false,
            comment: 'ID del estudiante'
        },
        id_curso: {
            type: Sequelize.INTEGER,
            allowNull: false,
            comment: 'ID del curso'
        },
        id_semestre: {
            type: Sequelize.INTEGER,
            allowNull: false,
            comment: 'ID del semestre'
        },
        fecha_inscripcion: {
            type: Sequelize.DATE,
            defaultValue: Sequelize.NOW,
            comment: 'Fecha de inscripción'
        },
        estado: {
            type: Sequelize.ENUM('ACTIVO', 'RETIRADO', 'FINALIZADO'),
            defaultValue: 'ACTIVO',
            comment: 'Estado de la inscripción'
        }
    }, {
        tableName: 'inscripciones',
        timestamps: false,
        indexes: [
            {
                unique: true,
                fields: ['id_estudiante', 'id_curso', 'id_semestre']
            }
        ]
    });

    // Modelo de Calificaciones
    const Calificacion = sequelize.define("calificacion", {
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        id_inscripcion: {
            type: Sequelize.INTEGER,
            allowNull: false,
            comment: 'ID de la inscripción'
        },
        tipo_evaluacion: {
            type: Sequelize.STRING(50),
            allowNull: false,
            comment: 'Tipo de evaluación (Parcial, Final, Tarea, etc.)'
        },
        nota: {
            type: Sequelize.DECIMAL(5, 2),
            validate: { min: 0, max: 100 },
            comment: 'Nota obtenida (0-100)'
        },
        ponderacion: {
            type: Sequelize.DECIMAL(5, 2),
            allowNull: false,
            validate: { min: 0, max: 100 },
            comment: 'Ponderación de la evaluación (%)'
        },
        fecha_evaluacion: {
            type: Sequelize.DATE,
            comment: 'Fecha de la evaluación'
        },
        observaciones: {
            type: Sequelize.STRING(500),
            comment: 'Observaciones adicionales'
        },
        creado_por: {
            type: Sequelize.INTEGER,
            comment: 'Usuario que creó la calificación'
        }
    }, {
        tableName: 'calificaciones',
        timestamps: true,
        createdAt: 'fecha_creacion',
        updatedAt: false
    });

    // ===== DEFINIR RELACIONES =====
    
    // Relaciones de Inscripción
    Inscripcion.belongsTo(Curso, {
        foreignKey: 'id_curso',
        as: 'curso'
    });
    
    Inscripcion.belongsTo(Semestre, {
        foreignKey: 'id_semestre',
        as: 'semestre'
    });

    // Relaciones de Calificación
    Calificacion.belongsTo(Inscripcion, {
        foreignKey: 'id_inscripcion',
        as: 'inscripcion'
    });

    // Relaciones inversas
    Curso.hasMany(Inscripcion, {
        foreignKey: 'id_curso',
        as: 'inscripciones'
    });

    Semestre.hasMany(Inscripcion, {
        foreignKey: 'id_semestre',
        as: 'inscripciones'
    });

    Inscripcion.hasMany(Calificacion, {
        foreignKey: 'id_inscripcion',
        as: 'calificaciones'
    });

    return {
        Curso,
        Semestre,
        Inscripcion,
        Calificacion
    };
};