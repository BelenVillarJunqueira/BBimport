export interface EmbedInfo {
    isEmbed: boolean;
    platform: 'instagram' | 'youtube' | 'tiktok' | 'native_video' | 'image';
    embedUrl?: string;
    directUrl: string;
    titleHint?: string;
}

/**
 * Checks whether a given URL points to a video or social reel
 */
export function isUrlVideo(url: string): boolean {
    if (!url) return false;
    const clean = url.trim().toLowerCase();

    // Social platforms
    if (clean.includes('instagram.com/reel/') || clean.includes('instagram.com/p/') || clean.includes('instagram.com/tv/')) {
        return true;
    }
    if (clean.includes('youtube.com/shorts/') || clean.includes('youtu.be/') || clean.includes('youtube.com/watch')) {
        return true;
    }
    if (clean.includes('tiktok.com/')) {
        return true;
    }

    // Native video extensions or uploads containing video files
    if (/\.(mp4|webm|mov|m4v|ogg)(\?.*)?$/i.test(clean)) {
        return true;
    }
    if (clean.startsWith('data:video/')) {
        return true;
    }

    return false;
}

/**
 * Parses any media URL and returns embed parameters if applicable
 */
export function getMediaEmbedInfo(url: string, declaredType?: 'image' | 'video'): EmbedInfo {
    if (!url) {
        return { isEmbed: false, platform: 'image', directUrl: '' };
    }

    const clean = url.trim();
    const lower = clean.toLowerCase();

    // 1. Instagram Reel / Post
    const instaMatch = clean.match(/instagram\.com\/(?:reel|p|tv)\/([a-zA-Z0-9_-]+)/i);
    if (instaMatch && instaMatch[1]) {
        const reelId = instaMatch[1];
        return {
            isEmbed: true,
            platform: 'instagram',
            embedUrl: `https://www.instagram.com/reel/${reelId}/embed/`,
            directUrl: clean,
            titleHint: 'Reel de Instagram'
        };
    }

    // 2. YouTube Shorts or standard YouTube video
    const ytMatch = clean.match(/(?:youtube\.com\/(?:shorts\/|watch\?v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i);
    if (ytMatch && ytMatch[1]) {
        const videoId = ytMatch[1];
        return {
            isEmbed: true,
            platform: 'youtube',
            embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}&controls=1&rel=0`,
            directUrl: clean,
            titleHint: 'Video de YouTube'
        };
    }

    // 3. TikTok
    const tiktokMatch = clean.match(/tiktok\.com\/@[^/]+\/video\/(\d+)/i);
    if (tiktokMatch && tiktokMatch[1]) {
        const ttId = tiktokMatch[1];
        return {
            isEmbed: true,
            platform: 'tiktok',
            embedUrl: `https://www.tiktok.com/embed/v2/${ttId}`,
            directUrl: clean,
            titleHint: 'Video de TikTok'
        };
    }

    // Check file extensions
    const hasVideoExtension = /\.(mp4|webm|mov|m4v|ogg)(\?.*)?$/i.test(lower) || lower.startsWith('data:video/');
    const hasImageExtension = /\.(jpg|jpeg|png|webp|gif|avif|svg)(\?.*)?$/i.test(lower) || lower.startsWith('data:image/');

    // If explicitly declared as 'image' and does not have an explicit video extension, it is definitely an image
    if (declaredType === 'image' && !hasVideoExtension) {
        return {
            isEmbed: false,
            platform: 'image',
            directUrl: clean
        };
    }

    // If it has a known image extension and is not explicitly declared as a video, it is definitely an image
    if (hasImageExtension && declaredType !== 'video') {
        return {
            isEmbed: false,
            platform: 'image',
            directUrl: clean
        };
    }

    // 4. Native Video file (local upload, MP4, MOV, WebM, or declaredType === 'video')
    const isNative = declaredType === 'video' || hasVideoExtension;

    if (isNative) {
        return {
            isEmbed: false,
            platform: 'native_video',
            directUrl: clean,
            titleHint: 'Reel de Video BB IMPORT'
        };
    }

    // 5. Standard Image
    return {
        isEmbed: false,
        platform: 'image',
        directUrl: clean
    };
}

/**
 * Syncs media array with server-side persistent storage
 */
export async function syncMediaWithServer(media: any[]): Promise<boolean> {
    if (!Array.isArray(media) || media.length === 0) return false;

    try {
        // Sanitize media items: remove any legacy base64 data strings that might exceed payload limits
        const sanitized = media
            .filter((item) => item && typeof item === 'object' && item.url)
            .map((item) => {
                const url = String(item.url || '');
                // If an item has an obsolete giant base64 video string, do not sync that string to JSON endpoint
                if (url.startsWith('data:video/')) {
                    return null;
                }
                // If it's a huge base64 image over 200KB, skip syncing to JSON
                if (url.startsWith('data:image/') && url.length > 250000) {
                    return null;
                }
                return item;
            })
            .filter(Boolean);

        if (sanitized.length === 0) return false;

        const bodyString = JSON.stringify({ media: sanitized });

        // Safety boundary: if body exceeds 5MB, do not send
        if (bodyString.length > 5 * 1024 * 1024) {
            console.warn('Media payload exceeds 5MB, skipping server sync to avoid PayloadTooLargeError.');
            return false;
        }

        const response = await fetch('/api/media', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: bodyString
        });
        return response.ok;
    } catch (e) {
        console.warn('Could not sync media with server:', e);
        return false;
    }
}

/**
 * Loads media array from server-side persistent storage
 */
export async function loadMediaFromServer(): Promise<any[] | null> {
    try {
        const response = await fetch('/api/media');
        if (response.ok) {
            const json = await response.json();
            if (json.success && Array.isArray(json.media) && json.media.length > 0) {
                return json.media;
            }
        }
    } catch (e) {
        console.warn('Could not load media from server:', e);
    }
    return null;
}

/**
 * Saves reviews array to server-side persistent storage
 */
export async function syncReviewsWithServer(reviews: any[]): Promise<boolean> {
    if (!Array.isArray(reviews)) return false;

    try {
        const response = await fetch('/api/reviews', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reviews })
        });
        return response.ok;
    } catch (e) {
        console.warn('Could not sync reviews with server:', e);
        return false;
    }
}

/**
 * Loads reviews array from server-side persistent storage
 */
export async function loadReviewsFromServer(): Promise<any[] | null> {
    try {
        const response = await fetch('/api/reviews');
        if (response.ok) {
            const json = await response.json();
            if (json.success && Array.isArray(json.reviews) && json.reviews.length > 0) {
                return json.reviews;
            }
        }
    } catch (e) {
        console.warn('Could not load reviews from server:', e);
    }
    return null;
}

