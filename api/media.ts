import fs from 'fs';
import path from 'path';

// Vercel Serverless Function: Persistent Media Store
export default async function handler(req: any, res: any) {
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const tmpDir = process.env.VERCEL ? '/tmp' : path.join(process.cwd(), 'uploads');
    const mediaStorePath = path.join(tmpDir, 'media_store.json');

    if (req.method === 'GET') {
        try {
            if (fs.existsSync(mediaStorePath)) {
                const data = fs.readFileSync(mediaStorePath, 'utf-8');
                const parsed = JSON.parse(data);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    return res.status(200).json({ success: true, media: parsed });
                }
            }
            return res.status(200).json({ success: true, media: null });
        } catch (e) {
            return res.status(200).json({ success: true, media: null });
        }
    }

    if (req.method === 'POST') {
        try {
            const { media } = req.body || {};
            if (Array.isArray(media)) {
                try {
                    if (!fs.existsSync(tmpDir)) {
                        fs.mkdirSync(tmpDir, { recursive: true });
                    }
                    fs.writeFileSync(mediaStorePath, JSON.stringify(media, null, 2), 'utf-8');
                } catch (_) { }
                return res.status(200).json({ success: true, count: media.length });
            }
            return res.status(400).json({ success: false, error: 'Formato de multimedia inválido' });
        } catch (e: any) {
            return res.status(500).json({ success: false, error: e.message });
        }
    }

    return res.status(405).json({ error: 'Method not allowed' });
}
