import fs from 'fs';
import path from 'path';

// Vercel Serverless Function: Persistent Reviews Store
export default async function handler(req: any, res: any) {
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const tmpDir = process.env.VERCEL ? '/tmp' : path.join(process.cwd(), 'uploads');
    const reviewsStorePath = path.join(tmpDir, 'reviews_store.json');

    if (req.method === 'GET') {
        try {
            if (fs.existsSync(reviewsStorePath)) {
                const data = fs.readFileSync(reviewsStorePath, 'utf-8');
                const parsed = JSON.parse(data);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    return res.status(200).json({ success: true, reviews: parsed });
                }
            }
            return res.status(200).json({ success: true, reviews: null });
        } catch (e) {
            return res.status(200).json({ success: true, reviews: null });
        }
    }

    if (req.method === 'POST') {
        try {
            const { reviews } = req.body || {};
            if (Array.isArray(reviews)) {
                try {
                    if (!fs.existsSync(tmpDir)) {
                        fs.mkdirSync(tmpDir, { recursive: true });
                    }
                    fs.writeFileSync(reviewsStorePath, JSON.stringify(reviews, null, 2), 'utf-8');
                } catch (_) { }
                return res.status(200).json({ success: true, count: reviews.length });
            }
            return res.status(400).json({ success: false, error: 'Formato de reseñas inválido' });
        } catch (e: any) {
            return res.status(500).json({ success: false, error: e.message });
        }
    }

    return res.status(405).json({ error: 'Method not allowed' });
}
