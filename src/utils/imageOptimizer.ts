import { MediaItem } from '../types';

export async function compressAndResizeImage(
    file: File,
    maxWidth = 1400,
    maxHeight = 1400,
    quality = 0.84
): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onerror = () => reject(new Error('Error al leer el archivo de imagen'));

        reader.onload = (e) => {
            const img = new Image();
            img.onerror = () => reject(new Error('No se pudo decodificar la imagen'));

            img.onload = () => {
                try {
                    let { width, height } = img;

                    // Scale proportionally if larger than maximums
                    if (width > maxWidth || height > maxHeight) {
                        const ratio = Math.min(maxWidth / width, maxHeight / height);
                        width = Math.round(width * ratio);
                        height = Math.round(height * ratio);
                    }

                    const canvas = document.createElement('canvas');
                    canvas.width = width;
                    canvas.height = height;

                    const ctx = canvas.getContext('2d');
                    if (!ctx) {
                        // Fallback to original read result if canvas context not available
                        return resolve(e.target?.result as string);
                    }

                    // High quality image smoothing
                    ctx.imageSmoothingEnabled = true;
                    ctx.imageSmoothingQuality = 'high';
                    ctx.drawImage(img, 0, 0, width, height);

                    // Try exporting as WebP, fallback to JPEG
                    let dataUrl = canvas.toDataURL('image/webp', quality);
                    if (!dataUrl || !dataUrl.startsWith('data:image/webp')) {
                        dataUrl = canvas.toDataURL('image/jpeg', quality);
                    }

                    resolve(dataUrl);
                } catch (err) {
                    console.warn('Canvas compression failed, falling back to original dataURL:', err);
                    resolve(e.target?.result as string);
                }
            };

            img.src = e.target?.result as string;
        };

        reader.readAsDataURL(file);
    });
}

/**
 * Uploads a file (compressed image or video) to the server /api/upload.
 * If server is available, returns the permanent `/uploads/...` URL.
 * If server is unavailable, returns the compressed base64 dataURL fallback.
 */
export async function uploadMediaItem(
    file: File,
    customTitle?: string
): Promise<MediaItem> {
    const isVideo = file.type.startsWith('video') || /\.(mp4|webm|mov|m4v|3gp|quicktime)$/i.test(file.name);
    const title = customTitle?.trim() || file.name.replace(/\.[^/.]+$/, '').trim() || 'Multimedia BB IMPORT';
    const id = `media-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

    // For video files: direct binary streaming to /api/upload (zero external dependencies, 100% integrity)
    if (isVideo) {
        if (file.size > 80 * 1024 * 1024) {
            throw new Error('El reel o video excede el límite de 80MB. Te recomendamos subir un clip de hasta 80MB.');
        }

        const uploadUrl = `/api/upload?filename=${encodeURIComponent(file.name)}&type=${encodeURIComponent(file.type || 'video/mp4')}`;
        const response = await fetch(uploadUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/octet-stream'
            },
            body: file
        });

        if (!response.ok) {
            const errText = await response.text().catch(() => '');
            throw new Error(`Error en el servidor al guardar el video (${response.status}). ${errText ? 'Verifica el tamaño o formato del reel.' : ''}`);
        }

        const json = await response.json();
        if (!json.success || !json.url) {
            throw new Error(json.message || 'No se pudo guardar el reel de video en el servidor.');
        }

        return {
            id,
            type: 'video',
            url: json.url,
            title,
            alt: title
        };
    }

    // For image files: Compress on client first!
    const compressedDataUrl = await compressAndResizeImage(file, 1400, 1400, 0.85);

    // Attempt server upload for clean `/uploads/...` URL
    try {
        const formData = new FormData();
        formData.append('fileData', compressedDataUrl);
        formData.append('fileName', file.name);
        formData.append('fileType', 'image/jpeg');

        const response = await fetch('/api/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                fileData: compressedDataUrl,
                fileName: file.name,
                fileType: 'image/jpeg'
            })
        });

        if (response.ok) {
            const json = await response.json();
            if (json.success && json.url) {
                return {
                    id,
                    type: 'image',
                    url: json.url,
                    title,
                    alt: title
                };
            }
        }
    } catch (e) {
        console.warn('Server upload not reachable, using compressed DataURL locally:', e);
    }

    // Safe fallback: Return compressed image dataURL (only ~70-120KB)
    return {
        id,
        type: 'image',
        url: compressedDataUrl,
        title,
        alt: title
    };
}

/**
 * Optimized helper for uploading a review customer photo.
 * Compresses the image and uploads to /api/upload, returning the permanent URL.
 */
export async function uploadReviewImage(file: File): Promise<string> {
    const compressedDataUrl = await compressAndResizeImage(file, 900, 900, 0.82);

    try {
        const response = await fetch('/api/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                fileData: compressedDataUrl,
                fileName: `review-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`,
                fileType: 'image/jpeg'
            })
        });

        if (response.ok) {
            const json = await response.json();
            if (json.success && json.url) {
                return json.url;
            }
        }
    } catch (e) {
        console.warn('Server upload not reachable for review photo, using compressed DataURL fallback:', e);
    }

    return compressedDataUrl;
}

