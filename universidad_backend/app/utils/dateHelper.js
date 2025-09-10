class DateHelper {
    static formatearFechaHora(fecha) {
        return new Date().toLocaleString('es-GT');
    }
    static formatearFecha(fecha) {
        return new Date().toLocaleDateString('es-GT');
    }
}
module.exports = DateHelper;