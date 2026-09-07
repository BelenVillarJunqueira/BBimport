import express from 'express';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { MercadoPagoConfig, Preference } from 'mercadopago';

// Load .env variables
dotenv.config();

const app = express();
const PORT = 3000;

// Set payload limits for high-resolution images and reel videos up to 100MB
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));

// Automatically redirect any accidental /public/* requests to /* so assets in the public folder resolve seamlessly
app.use((req, res, next) => {
  if (req.path.startsWith('/public/')) {
    const cleanedUrl = req.url.replace(/^\/public\//, '/');
    return res.redirect(301, cleanedUrl);
  }
  next();
});

// Ensure uploads folder exists and serve it statically with video range streaming support
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

app.use(
  '/uploads',
  express.static(uploadsDir, {
    acceptRanges: true,
    setHeaders: (res, filePath) => {
      const lower = filePath.toLowerCase();
      if (lower.endsWith('.mp4')) {
        res.setHeader('Content-Type', 'video/mp4');
      } else if (lower.endsWith('.webm')) {
        res.setHeader('Content-Type', 'video/webm');
      } else if (lower.endsWith('.mov')) {
        res.setHeader('Content-Type', 'video/mp4');
      }
    }
  })
);

// File path for persistent media storage on server
const mediaStorePath = path.join(uploadsDir, 'media_store.json');

// API: Get persistent media store
app.get('/api/media', (req, res) => {
  try {
    if (fs.existsSync(mediaStorePath)) {
      const data = fs.readFileSync(mediaStorePath, 'utf-8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        return res.json({ success: true, media: parsed });
      }
    }
    return res.json({ success: true, media: null });
  } catch (error) {
    console.warn('Error reading media_store.json:', error);
    return res.json({ success: true, media: null });
  }
});

// API: Save persistent media store
app.post('/api/media', (req, res) => {
  try {
    const { media } = req.body;
    if (Array.isArray(media)) {
      fs.writeFileSync(mediaStorePath, JSON.stringify(media, null, 2), 'utf-8');
      return res.json({ success: true, count: media.length });
    }
    return res.status(400).json({ success: false, error: 'Formato de multimedia inválido' });
  } catch (error: any) {
    console.error('Error saving media_store.json:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// File path for persistent reviews storage on server
const reviewsStorePath = path.join(uploadsDir, 'reviews_store.json');

// API: Get persistent reviews store
app.get('/api/reviews', (req, res) => {
  try {
    if (fs.existsSync(reviewsStorePath)) {
      const data = fs.readFileSync(reviewsStorePath, 'utf-8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return res.json({ success: true, reviews: parsed });
      }
    }
    return res.json({ success: true, reviews: null });
  } catch (error) {
    console.warn('Error reading reviews_store.json:', error);
    return res.json({ success: true, reviews: null });
  }
});

// API: Save persistent reviews store
app.post('/api/reviews', (req, res) => {
  try {
    const { reviews } = req.body;
    if (Array.isArray(reviews)) {
      fs.writeFileSync(reviewsStorePath, JSON.stringify(reviews, null, 2), 'utf-8');
      return res.json({ success: true, count: reviews.length });
    }
    return res.status(400).json({ success: false, error: 'Formato de reseñas inválido' });
  } catch (error: any) {
    console.error('Error saving reviews_store.json:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// API: Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API: Forward BB IMPORT order to ISAMER OS webhook (server-side proxy avoids browser CORS issues)
app.post('/api/notify-isamer', async (req, res) => {
  try {
    const orderData = req.body;
    const isamerUrl = 'https://ais-dev-fsl5wbs5s56qu4qnlrxp3i-591938336003.us-west2.run.app/api/webhooks/bbimport-orders';
    
    const response = await fetch(isamerUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Store-Origin': 'bbimport.onrender.com'
      },
      body: JSON.stringify(orderData)
    });

    const respText = await response.text();
    console.log('[ISAMER OS Sync] Response code:', response.status);
    return res.json({ success: true, status: response.status, data: respText });
  } catch (error: any) {
    console.warn('[ISAMER OS Sync] Warning forwarding order:', error.message);
    return res.json({ success: false, error: error.message });
  }
});

// Helper to get Mercado Pago Token from environment
function getMercadoPagoToken(customToken?: string): string | null {
  if (customToken && customToken.trim().length > 10) {
    return customToken.trim();
  }
  return (
    process.env.MERCADO_PAGO_ACCESS_TOKEN ||
    process.env.MERCADOPAGO_ACCESS_TOKEN ||
    process.env.MP_ACCESS_TOKEN ||
    null
  );
}

// API: Check if Mercado Pago token is configured in .env or via custom token
app.get('/api/mercadopago/status', (req, res) => {
  const token = getMercadoPagoToken();
  res.json({
    configured: Boolean(token && token.trim().length > 10),
    isProduction: token ? token.startsWith('APP_USR-') : false,
    environmentTokenHint: token
      ? `${token.slice(0, 8)}...${token.slice(-4)}`
      : null
  });
});

// API: Test Mercado Pago connection dynamically
app.post('/api/mercadopago/test-connection', async (req, res) => {
  try {
    const { token: customToken } = req.body;
    const token = getMercadoPagoToken(customToken);

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

    return res.json({
      success: true,
      message: '¡Conexión exitosa! Las credenciales de Mercado Pago son válidas.',
      isProduction: token.startsWith('APP_USR-'),
      preferenceId: testPref.id
    });
  } catch (err: any) {
    return res.status(400).json({
      success: false,
      message: err.message || 'Credenciales inválidas o error de conexión con Mercado Pago',
      details: err.cause || err
    });
  }
});

// API: Create Preference Endpoint
async function handleCreatePreference(req: express.Request, res: express.Response) {
  try {
    const { items, payer, installments, backUrls, customToken, trackingCode, storeUrl } = req.body;

    const token = getMercadoPagoToken(customToken);

    if (!token) {
      return res.status(400).json({
        success: false,
        error: 'TOKEN_NOT_CONFIGURED',
        message: 'No se encontró MERCADO_PAGO_ACCESS_TOKEN en tu archivo .env ni en la configuración.'
      });
    }

    const host = req.get('host') || 'localhost:3000';
    const protocol = req.protocol === 'https' || req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
    const appBaseUrl = storeUrl || process.env.APP_URL || `${protocol}://${host}`;

    // Initialize Mercado Pago Client
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
          unit_price: Number(it.unit_price || it.price || 29999),
          currency_id: 'ARS',
          picture_url: it.picture_url || undefined,
          description: it.description || 'Producto profesional BB IMPORT'
        }))
      : [
          {
            id: 'bb-prod-1',
            title: 'Máquina cortadora EXXTRA TECH BB IMPORT',
            quantity: 1,
            unit_price: 29999,
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

    return res.json({
      success: true,
      preferenceId: response.id,
      initPoint: response.init_point,
      sandboxInitPoint: response.sandbox_init_point
    });
  } catch (error: any) {
    console.error('Error creating Mercado Pago preference:', error);
    return res.status(500).json({
      success: false,
      error: 'MERCADO_PAGO_API_ERROR',
      message: error.message || 'Error al conectar con la API de Mercado Pago',
      details: error.cause || error
    });
  }
}

app.post('/api/mercadopago/create-preference', handleCreatePreference);
app.post('/api/create-preference', handleCreatePreference);

// API: File Upload Endpoint (Pure Node.js - Zero external dependencies, native streaming)
app.post('/api/upload', (req, res) => {
  try {
    const queryFilename = req.query.filename ? String(req.query.filename) : null;
    const queryType = req.query.type ? String(req.query.type) : null;
    const isOctetStream = req.headers['content-type']?.includes('application/octet-stream') || Boolean(queryFilename);

    // 1. Direct Binary Stream Upload (Ideal for video reels & large files - zero RAM overhead, 100% video integrity)
    if (isOctetStream) {
      const originalName = queryFilename || 'media.mp4';
      let ext = path.extname(originalName).toLowerCase();
      if (!ext) {
        if (queryType?.includes('mp4') || queryType?.startsWith('video/')) ext = '.mp4';
        else if (queryType?.includes('webm')) ext = '.webm';
        else if (queryType?.includes('quicktime') || queryType?.includes('mov')) ext = '.mov';
        else ext = '.jpg';
      }

      const cleanName = `media-${Date.now()}-${Math.random().toString(36).substring(2, 7)}${ext}`;
      const filePath = path.join(uploadsDir, cleanName);
      const writeStream = fs.createWriteStream(filePath);

      req.pipe(writeStream);

      writeStream.on('finish', () => {
        try {
          const stats = fs.statSync(filePath);
          return res.json({
            success: true,
            url: `/uploads/${cleanName}`,
            fileName: cleanName,
            size: stats.size
          });
        } catch (e: any) {
          return res.status(500).json({ success: false, error: e.message });
        }
      });

      writeStream.on('error', (err) => {
        console.error('Error writing upload stream:', err);
        return res.status(500).json({
          success: false,
          error: 'WRITE_ERROR',
          message: err.message || 'Error al escribir el archivo en el servidor'
        });
      });
      return;
    }

    // 2. Base64 JSON payload (for images or backwards compatibility)
    const { fileData, fileName, fileType } = req.body || {};
    if (!fileData) {
      return res.status(400).json({ success: false, error: 'No se envió archivo' });
    }

    let ext = 'jpg';
    const lowerType = (fileType || '').toLowerCase();
    const lowerName = (fileName || '').toLowerCase();

    if (lowerType.includes('quicktime') || lowerName.endsWith('.mov')) {
      ext = 'mov';
    } else if (lowerType.includes('webm') || lowerName.endsWith('.webm')) {
      ext = 'webm';
    } else if (lowerType.includes('mp4') || lowerName.endsWith('.mp4') || lowerType.startsWith('video/')) {
      ext = 'mp4';
    } else if (lowerType.includes('png') || lowerName.endsWith('.png')) {
      ext = 'png';
    } else if (lowerType.includes('webp') || lowerName.endsWith('.webp')) {
      ext = 'webp';
    } else if (lowerType.includes('gif') || lowerName.endsWith('.gif')) {
      ext = 'gif';
    } else if (fileName && fileName.includes('.')) {
      ext = fileName.split('.').pop()?.toLowerCase() || 'jpg';
    }

    // Robust base64 splitting without regex failure or truncation
    const commaIndex = fileData.indexOf(',');
    const base64Content = commaIndex !== -1 ? fileData.slice(commaIndex + 1) : fileData;
    const buffer = Buffer.from(base64Content, 'base64');

    const cleanName = `media-${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${ext}`;
    const filePath = path.join(uploadsDir, cleanName);

    fs.writeFileSync(filePath, buffer);

    const publicUrl = `/uploads/${cleanName}`;
    return res.json({
      success: true,
      url: publicUrl,
      fileName: cleanName,
      size: buffer.length
    });
  } catch (error: any) {
    console.error('Error saving upload:', error);
    return res.status(500).json({
      success: false,
      error: 'UPLOAD_ERROR',
      message: error.message || 'Error al guardar el archivo en el servidor'
    });
  }
});

// Handle payload too large errors gracefully without throwing unhandled exceptions
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (err && (err.type === 'entity.too.large' || err.status === 413)) {
    return res.status(413).json({
      error: 'Payload too large',
      message: 'El tamaño de los datos enviados excede el límite permitido. Por favor sube archivos menores a 65MB.'
    });
  }
  next(err);
});

async function startServer() {
  // Vite middleware in dev; static dist serving in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        watch: {
          ignored: ['**/uploads/**', '**/media_store.json', '**/.git/**', '**/dist/**']
        }
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`BB IMPORT Server running on port ${PORT}`);
  });
}

startServer();
