// eslint-disable-next-line @typescript-eslint/no-var-requires
const bwipjs = require('bwip-js');

export async function generarBarcode(
    texto: string,
    scale: number = 2,
    height: number = 8,
): Promise<Buffer> {
    // bwip-js v4+: toBuffer es async sin callback
    try {
        const png = await bwipjs.toBuffer({
            bcid: 'code128',
            text: texto,
            scale,
            height,
            includetext: false,
        });
        return png;
    } catch {
        // Fallback para versiones anteriores con callback
        return new Promise((resolve, reject) => {
            bwipjs.toBuffer(
                { bcid: 'code128', text: texto, scale, height, includetext: false },
                (err: any, png: Buffer) => err ? reject(err) : resolve(png),
            );
        });
    }
}