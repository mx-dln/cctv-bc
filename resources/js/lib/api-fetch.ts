export function apiFetch(url: string, init: RequestInit = {}) {
    const headers = new Headers(init.headers);
    headers.set('Accept', 'application/json');
    const token = document.cookie.split('; ').find(cookie => cookie.startsWith('XSRF-TOKEN='))?.slice(11);
    if (token) headers.set('X-XSRF-TOKEN', decodeURIComponent(token));
    return fetch(url, { ...init, headers, credentials: 'same-origin' }).then(response => {
        if (!response.ok) throw new Error(`Request failed (${response.status})`);
        return response;
    });
}
