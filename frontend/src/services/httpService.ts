// HTTP Service with proper TypeScript generics
const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
  meta?: any;
}

interface RequestOptions {
  headers?: Record<string, string>;
}

// In Object-Oriented Programming (OOP), a class is like a blueprint to create objects.
// The object (also called an instance) contains:

// Properties (data → like variables inside the class)

// Methods (functions that belong to the class)

class HttpService {
  private getAuthHeaders(): Record<string, string> {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` })
    };
  }

  private getHeaders(auth: boolean = true): Record<string, string> {
    if (auth) {
      return this.getAuthHeaders();
    }
    return { 'Content-Type': 'application/json' };
  }

  private async makeRequest<T = any>(
    endpoint: string, 
    method: string, 
    body?: any, 
    auth: boolean = true,
    options?: RequestOptions
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${BASE_URL}${endpoint}`;
      const headers = {
        ...this.getHeaders(auth),
        ...options?.headers
      };

      const config: RequestInit = {
        method,
        headers,
        ...(body && { body: JSON.stringify(body) })
      };

      const response = await fetch(url, config);
      const data: ApiResponse<T> = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      return data;
    } catch (error: any) {
      console.error(`API Error [${method} ${endpoint}]:`, error);
      throw error;
    }
  }

  // Methods with authentication - properly typed
  async getWithAuth<T = any>(endpoint: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, 'GET', null, true, options);
  }

  async postWithAuth<T = any>(endpoint: string, body: any, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, 'POST', body, true, options);
  }

  async putWithAuth<T = any>(endpoint: string, body: any, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, 'PUT', body, true, options);
  }

  async deleteWithAuth<T = any>(endpoint: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, 'DELETE', null, true, options);
  }

  // Methods without authentication
  async postWithoutAuth<T = any>(endpoint: string, body: any, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, 'POST', body, false, options);
  }

  async getWithoutAuth<T = any>(endpoint: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, 'GET', null, false, options);
  }
}

// Export singleton instance
export const httpService = new HttpService();

// bind creates a new function where this is permanently set to a specific object.
// Export methods for direct use with proper typing
export const getWithAuth = httpService.getWithAuth.bind(httpService);
export const postWithAuth = httpService.postWithAuth.bind(httpService);
export const putWithAuth = httpService.putWithAuth.bind(httpService);
export const deleteWithAuth = httpService.deleteWithAuth.bind(httpService);
export const postWithoutAuth = httpService.postWithoutAuth.bind(httpService);
export const getWithoutAuth = httpService.getWithoutAuth.bind(httpService);
