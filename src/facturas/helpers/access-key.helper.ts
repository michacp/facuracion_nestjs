export function generarClaveAccesoFactura(
    ruc: string,
    ambiente: string,
    serie: string,
    numeroComprobante: number,
): string {
    const hoy = new Date();
    const dd = String(hoy.getDate()).padStart(2, '0');
    const mm = String(hoy.getMonth() + 1).padStart(2, '0');
    const yyyy = hoy.getFullYear();

    const fechaEmision = `${dd}${mm}${yyyy}`;
    const tipoComprobante = '01';
    const tipoEmision = '1';
    const codigoNumerico = String(Math.floor(10000000 + Math.random() * 90000000));

    const cadena =
        fechaEmision +
        tipoComprobante +
        ruc +
        ambiente +
        serie +
        numeroComprobante.toString().padStart(9, '0') +
        codigoNumerico +
        tipoEmision;

    const factores = [2, 3, 4, 5, 6, 7];
    let suma = 0;
    let factorIndex = 0;

    for (let i = cadena.length - 1; i >= 0; i--) {
        suma += parseInt(cadena[i], 10) * factores[factorIndex];
        factorIndex = (factorIndex + 1) % factores.length;
    }

    let digito = 11 - (suma % 11);
    if (digito === 11) digito = 0;
    else if (digito === 10) digito = 1;

    return cadena + digito;
}