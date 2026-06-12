/// <reference types="vite/client" />

export const getMediaUrl = (path: string | null | undefined): string | undefined => {
    if (!path) return undefined;
    if (path.startsWith('http://') || path.startsWith('https://')) return path;

    const apiBase: string = import.meta.env.VITE_API_V2_BASE || '/api/v2';
    const root = apiBase.replace(/\/api\/v2\/?$/, '');
    const cleanPath = path.replace(/^\/?(media\/)?/, '');

    return `${root}/media/${cleanPath}`;
};
