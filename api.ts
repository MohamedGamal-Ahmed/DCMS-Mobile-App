export const API_BASE = import.meta.env.VITE_API_URL || 'https://mr-mohamed-gamal.tail1acc6c.ts.net';

/**
 * Global API Client that acts as a fetch interceptor.
 * It automatically attaches the Bearer token to all outgoing requests.
 */
export async function apiClient(endpoint: string, options: RequestInit = {}) {
  // Extract token
  const token = localStorage.getItem('dcms_token');
  
  // Setup headers
  const headers = new Headers(options.headers || {});
  headers.set('Accept', 'application/json');
  
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // Determine if it's hitting our backend
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;

  // Merge options
  const config: RequestInit = {
    ...options,
    headers,
    // Cross-origin Tailscale setups sometimes rely on cookies if JWT fails
    // or for SignalR. While JWT is in the header, 'include' ensures complete auth context.
    credentials: 'include', 
  };

  const response = await fetch(url, config);

  // If token expired or unauthorized, we can handle it globally here
  if (response.status === 401) {
    console.error('API Unauthorized: Token might be expired or missing');
    // Optionally trigger a logout event here if needed
  }

  return response;
}
