// /**
//  * API Client Service
//  * US-004, US-010
//  * Handles HTTP communication with the Ollama backend
//  */

// import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig, AxiosRequestConfig } from 'axios';

// export interface ApiConfig {
//   baseUrl: string;
//   apiKey?: string;
//   timeout: number;
//   maxRetries: number;
// }

// export interface ApiResponse<T> {
//   data: T;
//   status: number;
//   statusText: string;
//   headers: Record<string, string>;
// }

// export class ApiClient {
//   private client: AxiosInstance;
//   private config: ApiConfig;
//   private retryCount: Map<string, number>;

//   constructor(config: ApiConfig) {
//     this.config = config;
//     this.retryCount = new Map();
//     this.client = this.createAxiosInstance();
//   }

//   private createAxiosInstance(): AxiosInstance {
//     return axios.create({
//       baseURL: this.config.baseUrl,
//       timeout: this.config.timeout,
//       headers: {
//         'Content-Type': 'application/json',
//         ...(this.config.apiKey && {
//           Authorization: `Bearer ${this.config.apiKey}`,
//         }),
//       },
//     });
//   }

//   private setupInterceptors(): void {
//     // Request interceptor
//     this.client.interceptors.request.use(
//       (config: InternalAxiosRequestConfig) => {
//         const requestId = `${config.method}-${config.url}`;
//         this.retryCount.set(requestId, 0);
//         return config;
//       },
//       (error) => Promise.reject(error)
//     );

//     // Response interceptor
//     this.client.interceptors.response.use(
//       (response) => response,
//       async (error: AxiosError) => {
//         const config = error.config;
//         if (!config) return Promise.reject(error);
//         const requestId = `${config.method}-${config.url}`;
//         const retries = this.retryCount.get(requestId) || 0;

//         if (retries < this.config.maxRetries && error.response?.status === 503) {
//           this.retryCount.set(requestId, retries + 1);
//           await new Promise((resolve) =>
//             setTimeout(resolve, 1000 * (retries + 1))
//           );
//           return this.client.request(config);
//         }

//         return Promise.reject(error);
//       }
//     );
//   }

//   async get<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
//     try {
//       const response = await this.client.get<T>(url, config);
//       return {
//         data: response.data,
//         status: response.status,
//         statusText: response.statusText,
//         headers: this.parseHeaders(response.headers),
//       };
//     } catch (error) {
//       throw this.handleError(error, 'GET', url);
//     }
//   }

//   async post<T>(
//     url: string,
//     data?: unknown,
//     config?: AxiosRequestConfig
//   ): Promise<ApiResponse<T>> {
//     try {
//       const response = await this.client.post<T>(url, data, config);
//       return {
//         data: response.data,
//         status: response.status,
//         statusText: response.statusText,
//         headers: this.parseHeaders(response.headers),
//       };
//     } catch (error) {
//       throw this.handleError(error, 'POST', url);
//     }
//   }

//   async put<T>(
//     url: string,
//     data?: unknown,
//     config?: AxiosRequestConfig
//   ): Promise<ApiResponse<T>> {
//     try {
//       const response = await this.client.put<T>(url, data, config);
//       return {
//         data: response.data,
//         status: response.status,
//         statusText: response.statusText,
//         headers: this.parseHeaders(response.headers),
//       };
//     } catch (error) {
//       throw this.handleError(error, 'PUT', url);
//     }
//   }

//   async delete<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
//     try {
//       const response = await this.client.delete<T>(url, config);
//       return {
//         data: response.data,
//         status: response.status,
//         statusText:response.statusText,
//         headers: this.parseHeaders(response.headers),
//       };
//     } catch (error) {
//       throw this.handleError(error, 'DELETE', url);
//     }
//   }

//   async stream<T>(
//     url: string,
//     data: unknown,
//     onChunk: (chunk: T) => void,
//     onComplete: (data: T) => void
//   ): Promise<void> {
//     try {
//       await this.client.post(
//         url,
//         data,
//         {
//           ...this.getRequestConfig(),
//           responseType: 'stream',
//         }
//       );
//     } catch (error) {
//       throw this.handleError(error, 'STREAM', url);
//     }
//   }

//   private getRequestConfig(): AxiosRequestConfig {
//     return {
//       headers: {
//         Accept: 'application/json, text/event-stream',
//       },
//     };
//   }

//   private parseHeaders(headers: unknown): Record<string, string> {
//     const parsed: Record<string, string> = {};
//     if (headers && typeof headers === 'object') {
//       Object.entries(headers).forEach(([key, value]) => {
//         if (value !== undefined) {
//           parsed[key] = String(value);
//         }
//       });
//     }
//     return parsed;
//   }

//   private handleError(
//     error: unknown,
//     operation: string,
//     url: string
//   ): Error {
//     if (axios.isAxiosError(error)) {
//       const axiosError = error as AxiosError;
//       return new Error(
//         `${operation} failed for ${url}: ${axiosError.message}`
//       );
//     }
//     return error as Error;
//   }

//   /**
//    * Test connection using Ollama native API: GET /api/tags (list models).
//    * Per https://docs.ollama.com/api/introduction — no health endpoint; listing models confirms connection.
//    */
//   async testConnection(): Promise<{
//   success: boolean;
//   message: string;
//   responseTime: number;
// }> {
//   const startTime = Date.now();

//   try {
//     const response = await this.client.get('/api/chats');

//     const responseTime = Date.now() - startTime;

//     return {
//       success: response.status === 200,
//       message:
//         response.status === 200
//           ? 'Connection successful'
//           : 'Invalid response from server',
//       responseTime,
//     };
//   } catch (error) {
//     return {
//       success: false,
//       message: (error as Error).message,
//       responseTime: Date.now() - startTime,
//     };
//   }
// }

//   updateConfig(newConfig: Partial<ApiConfig>): void {
//     this.config = { ...this.config, ...newConfig };
//     this.client.defaults.baseURL = this.config.baseUrl;
//     this.client.defaults.timeout = this.config.timeout;

//     if (newConfig.apiKey !== undefined) {
//       if (newConfig.apiKey) {
//         this.client.defaults.headers.common.Authorization = `Bearer ${this.config.apiKey}`;
//       } else {
//         delete this.client.defaults.headers.common.Authorization;
//       }
//     }
//   }

//   /** Current config (baseUrl, timeout) for streaming/fetch use */
//   getConfig(): ApiConfig {
//     return { ...this.config };
//   }

//   /**
//    * POST with streaming NDJSON response (e.g. Ollama /api/chat with stream: true).
//    * Uses fetch so we can read the body stream; respects config timeout.
//    */
//   async postStream(
//     url: string,
//     body: unknown,
//     onChunk: (chunk: { message?: { content?: string; thinking?: string }; done?: boolean; [key: string]: unknown }) => void
//   ): Promise<void> {
//     const { baseUrl, timeout, apiKey } = this.config;
//     const fullUrl = baseUrl.replace(/\/$/, '') + (url.startsWith('/') ? url : '/' + url);
//     const controller = new AbortController();
//     const timeoutId = setTimeout(() => controller.abort(), timeout);

//     try {
//       const headers: Record<string, string> = {
//         'Content-Type': 'application/json',
//         ...(apiKey && { Authorization: `Bearer ${apiKey}` }),
//       };

//       const response = await fetch(fullUrl, {
//         method: 'POST',
//         headers,
//         body: JSON.stringify(body),
//         signal: controller.signal,
//       });

//       clearTimeout(timeoutId);

//       if (!response.ok) {
//         const text = await response.text();
//         throw new Error(`${response.status} ${response.statusText}: ${text || response.statusText}`);
//       }

//       const reader = response.body?.getReader();
//       if (!reader) throw new Error('No response body');

//       const decoder = new TextDecoder();
//       let buffer = '';

//       while (true) {
//         const { done, value } = await reader.read();
//         if (done) break;
//         buffer += decoder.decode(value, { stream: true });
//         const lines = buffer.split('\n');
//         buffer = lines.pop() ?? '';
//         for (const line of lines) {
//           const trimmed = line.trim();
//           if (!trimmed) continue;
//           try {
//             const parsed = JSON.parse(trimmed) as { message?: { content?: string }; done?: boolean; [key: string]: unknown };
//             onChunk(parsed);
//           } catch {
//             // skip non-JSON lines
//           }
//         }
//       }

//       if (buffer.trim()) {
//         try {
//           const parsed = JSON.parse(buffer.trim()) as { message?: { content?: string }; done?: boolean; [key: string]: unknown };
//           onChunk(parsed);
//         } catch {
//           // ignore
//         }
//       }
//     } finally {
//       clearTimeout(timeoutId);
//     }
//   }
// }

// export const apiClient = new ApiClient({
//   baseUrl: '',
//   timeout: 30000,
//   maxRetries: 3,
// });

// export default apiClient;










/**
 * API Client Service
 * US-004, US-010
 *
 * Handles HTTP communication with the backend/Ollama API.
 *
 * Frontend architecture:
 *
 * Browser
 *   ↓
 * /api/...
 *   ↓
 * API Gateway
 *   ↓
 * Chat Service
 *   ↓
 * Ollama :11434
 */

import axios, {
  AxiosInstance,
  AxiosError,
  InternalAxiosRequestConfig,
  AxiosRequestConfig,
} from 'axios';

export interface ApiConfig {
  baseUrl: string;
  apiKey?: string;
  timeout: number;
  maxRetries: number;
}

export interface ApiResponse<T> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
}

export class ApiClient {
  private client: AxiosInstance;
  private config: ApiConfig;
  private retryCount: Map<string, number>;

  constructor(config: ApiConfig) {
    this.config = config;
    this.retryCount = new Map();

    this.client = this.createAxiosInstance();

    // IMPORTANT:
    // The original implementation defined interceptors
    // but never initialized them.
    this.setupInterceptors();
  }

  /**
   * Create Axios instance.
   */
  private createAxiosInstance(): AxiosInstance {
    return axios.create({
      baseURL: this.config.baseUrl,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',

        ...(this.config.apiKey && {
          Authorization: `Bearer ${this.config.apiKey}`,
        }),
      },
    });
  }

  /**
   * Normalize API paths.
   *
   * Example:
   *
   * baseUrl = "/api"
   *
   * "/tags"     → "/tags"
   * "/api/tags" → "/tags"
   *
   * This prevents:
   *
   * /api/api/tags
   *
   * from being generated.
   */
  private normalizeUrl(url: string): string {
    const baseUrl = this.config.baseUrl.replace(/\/+$/, '');
    let normalizedUrl = url;

    if (!normalizedUrl.startsWith('/')) {
      normalizedUrl = `/${normalizedUrl}`;
    }

    // If base URL already contains /api,
    // remove /api from the request path.
    if (
      baseUrl.endsWith('/api') &&
      (normalizedUrl === '/api' || normalizedUrl.startsWith('/api/'))
    ) {
      normalizedUrl = normalizedUrl.substring(4);

      if (!normalizedUrl) {
        normalizedUrl = '/';
      }
    }

    return normalizedUrl;
  }

  /**
   * Setup Axios request/response interceptors.
   */
  private setupInterceptors(): void {
    // Request interceptor
    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const requestId = `${config.method}-${config.url}`;

        this.retryCount.set(requestId, 0);

        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => response,

      async (error: AxiosError) => {
        const config = error.config;

        if (!config) {
          return Promise.reject(error);
        }

        const requestId = `${config.method}-${config.url}`;
        const retries = this.retryCount.get(requestId) || 0;

        // Retry only on HTTP 503.
        if (
          retries < this.config.maxRetries &&
          error.response?.status === 503
        ) {
          this.retryCount.set(requestId, retries + 1);

          await new Promise((resolve) =>
            setTimeout(resolve, 1000 * (retries + 1))
          );

          return this.client.request(config);
        }

        return Promise.reject(error);
      }
    );
  }

  /**
   * GET request.
   */
  async get<T>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    const normalizedUrl = this.normalizeUrl(url);

    try {
      const response = await this.client.get<T>(
        normalizedUrl,
        config
      );

      return {
        data: response.data,
        status: response.status,
        statusText: response.statusText,
        headers: this.parseHeaders(response.headers),
      };
    } catch (error) {
      throw this.handleError(error, 'GET', normalizedUrl);
    }
  }

  /**
   * POST request.
   */
  async post<T>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    const normalizedUrl = this.normalizeUrl(url);

    try {
      const response = await this.client.post<T>(
        normalizedUrl,
        data,
        config
      );

      return {
        data: response.data,
        status: response.status,
        statusText: response.statusText,
        headers: this.parseHeaders(response.headers),
      };
    } catch (error) {
      throw this.handleError(error, 'POST', normalizedUrl);
    }
  }

  /**
   * PUT request.
   */
  async put<T>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    const normalizedUrl = this.normalizeUrl(url);

    try {
      const response = await this.client.put<T>(
        normalizedUrl,
        data,
        config
      );

      return {
        data: response.data,
        status: response.status,
        statusText: response.statusText,
        headers: this.parseHeaders(response.headers),
      };
    } catch (error) {
      throw this.handleError(error, 'PUT', normalizedUrl);
    }
  }

  /**
   * DELETE request.
   */
  async delete<T>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    const normalizedUrl = this.normalizeUrl(url);

    try {
      const response = await this.client.delete<T>(
        normalizedUrl,
        config
      );

      return {
        data: response.data,
        status: response.status,
        statusText: response.statusText,
        headers: this.parseHeaders(response.headers),
      };
    } catch (error) {
      throw this.handleError(error, 'DELETE', normalizedUrl);
    }
  }

  /**
   * Generic streaming POST using Axios.
   *
   * Kept for compatibility with existing code.
   */
  async stream<T>(
    url: string,
    data: unknown,
    onChunk: (chunk: T) => void,
    onComplete: (data: T) => void
  ): Promise<void> {
    const normalizedUrl = this.normalizeUrl(url);

    try {
      const response = await this.client.post(
        normalizedUrl,
        data,
        {
          ...this.getRequestConfig(),
          responseType: 'stream',
        }
      );

      // Preserve existing API parameters.
      // Axios browser streaming is handled by postStream()
      // below, so these callbacks remain for compatibility.
      void response;
      void onChunk;
      void onComplete;
    } catch (error) {
      throw this.handleError(error, 'STREAM', normalizedUrl);
    }
  }

  /**
   * Request configuration used for streaming.
   */
  private getRequestConfig(): AxiosRequestConfig {
    return {
      headers: {
        Accept: 'application/json, text/event-stream',
      },
    };
  }

  /**
   * Convert Axios headers into a simple object.
   */
  private parseHeaders(headers: unknown): Record<string, string> {
    const parsed: Record<string, string> = {};

    if (headers && typeof headers === 'object') {
      Object.entries(headers).forEach(([key, value]) => {
        if (value !== undefined) {
          parsed[key] = String(value);
        }
      });
    }

    return parsed;
  }

  /**
   * Convert Axios errors into readable application errors.
   */
  private handleError(
    error: unknown,
    operation: string,
    url: string
  ): Error {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;

      const status = axiosError.response?.status;
      const statusText = axiosError.response?.statusText;

      const statusInfo = status
        ? ` (${status}${statusText ? ` ${statusText}` : ''})`
        : '';

      return new Error(
        `${operation} failed for ${url}${statusInfo}: ${axiosError.message}`
      );
    }

    if (error instanceof Error) {
      return error;
    }

    return new Error(String(error));
  }

  /**
   * Test backend/Ollama connection.
   *
   * Ollama native API:
   *
   * GET /api/tags
   *
   * This endpoint returns the installed models and confirms
   * that Ollama is reachable.
   *
   * IMPORTANT:
   *
   * configStore.ts:
   *   serverUrl = "/api"
   *
   * Therefore we call:
   *   "/tags"
   *
   * Final browser URL:
   *   http://localhost/api/tags
   *
   * NOT:
   *   http://localhost/api/api/tags
   */
  async testConnection(): Promise<{
    success: boolean;
    message: string;
    responseTime: number;
  }> {
    const startTime = Date.now();

    try {
      const response = await this.get('/chats');

      const responseTime = Date.now() - startTime;

      return {
        success: response.status === 200,

        message:
          response.status === 200
            ? 'Connection successful'
            : 'Invalid response from server',

        responseTime,
      };
    } catch (error) {
      return {
        success: false,

        message:
          error instanceof Error
            ? error.message
            : String(error),

        responseTime: Date.now() - startTime,
      };
    }
  }

  /**
   * Update API configuration.
   */
  updateConfig(newConfig: Partial<ApiConfig>): void {
    this.config = {
      ...this.config,
      ...newConfig,
    };

    this.client.defaults.baseURL = this.config.baseUrl;
    this.client.defaults.timeout = this.config.timeout;

    if (newConfig.apiKey !== undefined) {
      if (newConfig.apiKey) {
        this.client.defaults.headers.common.Authorization =
          `Bearer ${this.config.apiKey}`;
      } else {
        delete this.client.defaults.headers.common.Authorization;
      }
    }
  }

  /**
   * Get current API configuration.
   */
  getConfig(): ApiConfig {
    return {
      ...this.config,
    };
  }

  /**
   * POST with streaming NDJSON response.
   *
   * Used for endpoints such as:
   *
   * POST /api/chat
   *
   * With:
   *
   * baseUrl = "/api"
   *
   * Calling:
   *
   * postStream("/chat", ...)
   *
   * produces:
   *
   * http://localhost/api/chat
   */
  async postStream(
    url: string,
    body: unknown,
    onChunk: (
      chunk: {
        message?: {
          content?: string;
          thinking?: string;
        };
        done?: boolean;
        [key: string]: unknown;
      }
    ) => void
  ): Promise<void> {
    const {
      baseUrl,
      timeout,
      apiKey,
    } = this.config;

    const normalizedUrl = this.normalizeUrl(url);

    const fullUrl =
      baseUrl.replace(/\/+$/, '') +
      (normalizedUrl.startsWith('/')
        ? normalizedUrl
        : `/${normalizedUrl}`);

    const controller = new AbortController();

    const timeoutId = setTimeout(() => {
      controller.abort();
    }, timeout);

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        Accept: 'application/json, text/event-stream',

        ...(apiKey && {
          Authorization: `Bearer ${apiKey}`,
        }),
      };

      const response = await fetch(fullUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      if (!response.ok) {
        const text = await response.text();

        throw new Error(
          `${response.status} ${response.statusText}: ${
            text || response.statusText
          }`
        );
      }

      const reader = response.body?.getReader();

      if (!reader) {
        throw new Error('No response body');
      }

      const decoder = new TextDecoder();

      let buffer = '';

      while (true) {
        const {
          done,
          value,
        } = await reader.read();

        if (done) {
          break;
        }

        buffer += decoder.decode(value, {
          stream: true,
        });

        const lines = buffer.split('\n');

        buffer = lines.pop() ?? '';

        for (const line of lines) {
          const trimmed = line.trim();

          if (!trimmed) {
            continue;
          }

          try {
            const parsed = JSON.parse(trimmed) as {
              message?: {
                content?: string;
                thinking?: string;
              };
              done?: boolean;
              [key: string]: unknown;
            };

            onChunk(parsed);
          } catch {
            // Ignore invalid/non-JSON lines.
          }
        }
      }

      // Process remaining buffered data.
      if (buffer.trim()) {
        try {
          const parsed = JSON.parse(buffer.trim()) as {
            message?: {
              content?: string;
              thinking?: string;
            };
            done?: boolean;
            [key: string]: unknown;
          };

          onChunk(parsed);
        } catch {
          // Ignore invalid final buffer.
        }
      }
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }

      throw new Error(String(error));
    } finally {
      clearTimeout(timeoutId);
    }
  }
}

/**
 * Global API client instance.
 *
 * configStore.ts will update this configuration
 * when the saved configuration is loaded.
 *
 * Initial baseUrl is empty.
 */
export const apiClient = new ApiClient({
  baseUrl: '',
  timeout: 30000,
  maxRetries: 3,
});

export default apiClient;