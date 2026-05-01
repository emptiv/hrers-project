/**
 * Global API helper — automatically attaches JWT Authorization header to every
 * fetch() call that targets our own origin (/api/…).
 * Loaded via render_role_page injection in main.py.
 */
(function () {
    const originalFetch = window.fetch;

    window.fetch = function (input, init) {
        // Only inject for same-origin /api/* and /auth/* routes
        const url = typeof input === 'string' ? input : (input instanceof Request ? input.url : String(input));
        const isSameOriginApi = url.startsWith('/api/') || url.startsWith('/auth/') || url.startsWith('/api');

        if (isSameOriginApi) {
            const token = localStorage.getItem('hrers_access_token');
            if (token) {
                init = init || {};
                const existingHeaders = init.headers || {};
                // Support Headers object, plain object, or array
                let merged;
                if (existingHeaders instanceof Headers) {
                    merged = new Headers(existingHeaders);
                    if (!merged.has('Authorization')) {
                        merged.set('Authorization', `Bearer ${token}`);
                    }
                } else if (Array.isArray(existingHeaders)) {
                    const hasAuth = existingHeaders.some(([k]) => k.toLowerCase() === 'authorization');
                    merged = hasAuth ? existingHeaders : [...existingHeaders, ['Authorization', `Bearer ${token}`]];
                } else {
                    // Plain object — check case-insensitively
                    const keys = Object.keys(existingHeaders).map(k => k.toLowerCase());
                    if (!keys.includes('authorization')) {
                        merged = { ...existingHeaders, 'Authorization': `Bearer ${token}` };
                    } else {
                        merged = existingHeaders;
                    }
                }
                init = { ...init, headers: merged };
            }
        }

        return originalFetch.call(this, input, init);
    };
})();
