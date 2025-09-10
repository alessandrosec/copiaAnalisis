class FormatHelper {
    static formatearNumero(numero, decimales = 2) {
        return Number(numero || 0).toFixed(decimales);
    }
    static formatearPorcentaje(valor) {
        return `${((valor || 0) * 100).toFixed(1)}%`;
    }
}
module.exports = FormatHelper;