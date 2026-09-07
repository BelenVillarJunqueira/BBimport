import { MercadoPagoConfig, Preference } from 'mercadopago';

// Vercel Serverless Function Handler
export default async function handler(req: any, res: any) {
    if (req.method === 'OPTIONS') {
        res.setHeader('Access-Control-Allow-Credentials', 'true');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
        res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { items, payer, installments, backUrls, customToken, trackingCode, storeUrl } = req.body || {};

        const token =
            (customToken && customToken.trim().length > 10 ? customToken.trim() : null) ||
            process.env.MERCADO_PAGO_ACCESS_TOKEN ||
            process.env.MERCADOPAGO_ACCESS_TOKEN ||
            process.env.MP_ACCESS_TOKEN;

        if (!token) {
            return res.status(400).json({
                success: false,
                error: 'TOKEN_NOT_CONFIGURED',
                message: 'No se encontró MERCADO_PAGO_ACCESS_TOKEN en las variables de entorno de Vercel/Render.'
            });
        }

        const host = req.headers?.host || 'localhost:3000';
        const protocol = req.headers?.['x-forwarded-proto'] || 'https';
        const appBaseUrl = storeUrl || process.env.APP_URL || `${protocol}://${host}`;

        const client = new MercadoPagoConfig({
            accessToken: token,
            options: { timeout: 10000 }
        });

        const preference = new Preference(client);

        const preferenceItems = (items && items.length > 0)
            ? items.map((it: any) => ({
                id: String(it.id || 'bb-prod'),
                title: String(it.title || 'Máquina Cortadora BB IMPORT'),
                quantity: Number(it.quantity || 1),
                unit_price: Number(it.unit_price || it.price || 42990),
                currency_id: 'ARS',
                picture_url: it.picture_url || undefined,
                description: it.description || 'Producto profesional BB IMPORT'
            }))
            : [
                {
                    id: 'bb-prod-1',
                    title: 'Máquina cortadora EXXTRA TECH BB IMPORT',
                    quantity: 1,
                    unit_price: 42990,
                    currency_id: 'ARS'
                }
            ];

        const maxInstallments = Number(installments) || 12;

        const body: any = {
            items: preferenceItems,
            payer: {
                name: payer?.name || 'Cliente BB IMPORT',
                email: payer?.email || 'cliente@bbimport.com',
                phone: {
                    number: payer?.phone ? String(payer.phone) : undefined
                },
                address: {
                    street_name: payer?.address || 'Dirección de entrega'
                }
            },
            payment_methods: {
                installments: maxInstallments
            },
            back_urls: {
                success: backUrls?.success || `${appBaseUrl}/?status=approved&tracking=${trackingCode || ''}`,
                failure: backUrls?.failure || `${appBaseUrl}/?status=failure&tracking=${trackingCode || ''}`,
                pending: backUrls?.pending || `${appBaseUrl}/?status=pending&tracking=${trackingCode || ''}`
            },
            auto_return: 'approved',
            external_reference: trackingCode || `BB-${Date.now()}`,
            statement_descriptor: 'BB IMPORT'
        };

        const response = await preference.create({ body });

        return res.status(200).json({
            success: true,
            preferenceId: response.id,
            initPoint: response.init_point,
            sandboxInitPoint: response.sandbox_init_point
        });
    } catch (error: any) {
        console.error('Error creating Mercado Pago preference on Vercel:', error);
        return res.status(500).json({
            success: false,
            error: 'MERCADO_PAGO_API_ERROR',
            message: error.message || 'Error al procesar en Mercado Pago',
            details: error.cause || error
        });
    }
}
