// Vercel Serverless Function: Check Mercado Pago Configuration Status
export default async function handler(req: any, res: any) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    const token =
        process.env.MERCADO_PAGO_ACCESS_TOKEN ||
        process.env.MERCADOPAGO_ACCESS_TOKEN ||
        process.env.MP_ACCESS_TOKEN;

    return res.status(200).json({
        configured: Boolean(token && token.trim().length > 10),
        isProduction: token ? token.startsWith('APP_USR-') : false,
        environmentTokenHint: token
            ? `${token.slice(0, 8)}...${token.slice(-4)}`
            : null
    });
}
