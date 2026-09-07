import { MercadoPagoConfig, Preference } from 'mercadopago';

// Vercel Serverless Function: Test Mercado Pago credentials
export default async function handler(req: any, res: any) {
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { token: customToken } = req.body || {};

        const token =
            (customToken && customToken.trim().length > 10 ? customToken.trim() : null) ||
            process.env.MERCADO_PAGO_ACCESS_TOKEN ||
            process.env.MERCADOPAGO_ACCESS_TOKEN ||
            process.env.MP_ACCESS_TOKEN;

        if (!token) {
            return res.status(400).json({
                success: false,
                message: 'No se ingresó ningún Access Token para probar.'
            });
        }

        const client = new MercadoPagoConfig({
            accessToken: token,
            options: { timeout: 8000 }
        });
        const preference = new Preference(client);

        // Create a temporary test preference to verify API credentials
        const testPref = await preference.create({
            body: {
                items: [
                    {
                        id: 'test-ping',
                        title: 'Test Verificación Mercado Pago BB IMPORT',
                        quantity: 1,
                        unit_price: 10,
                        currency_id: 'ARS'
                    }
                ]
            }
        });

        return res.status(200).json({
            success: true,
            message: '¡Conexión exitosa! Las credenciales de Mercado Pago son válidas.',
            isProduction: token.startsWith('APP_USR-'),
            preferenceId: testPref.id
        });
    } catch (err: any) {
        console.error('Error verifying Mercado Pago on Vercel:', err);
        return res.status(400).json({
            success: false,
            message: err.message || 'Credenciales inválidas o error de conexión con Mercado Pago',
            details: err.cause || err
        });
    }
}
