import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

const BASE_API_URL = 'http://localhost:8080';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private baseUrl = BASE_API_URL;

  constructor(private http: HttpClient) {}

  private buildUrl(path: string): string {
    if (!path.startsWith('/')) {
      path = `/${path}`;
    }
    return `${this.baseUrl}${path}`;
  }

  private buildParams(params?: Record<string, unknown>): HttpParams {
    let httpParams = new HttpParams();
    if (!params) {
      return httpParams;
    }

    Object.entries(params).forEach(([key, value]) => {
      if (value === null || value === undefined) {
        return;
      }
      if (Array.isArray(value)) {
        value.forEach(item => {
          httpParams = httpParams.append(key, String(item));
        });
      } else if (typeof value === 'object' && !(value instanceof Date)) {
        httpParams = httpParams.append(key, JSON.stringify(value));
      } else {
        httpParams = httpParams.append(key, String(value));
      }
    });

    return httpParams;
  }

  get<T>(path: string, params?: Record<string, unknown>, options: any = {}): Observable<T> {
    return this.http.get(this.buildUrl(path), {
      params: this.buildParams(params),
      ...options
    }) as Observable<T>;
  }

  post<T>(path: string, body: unknown, params?: Record<string, unknown>, options: any = {}): Observable<T> {
    return this.http.post(this.buildUrl(path), body, {
      params: this.buildParams(params),
      ...options
    }) as Observable<T>;
  }

  put<T>(path: string, body: unknown, params?: Record<string, unknown>, options: any = {}): Observable<T> {
    return this.http.put(this.buildUrl(path), body, {
      params: this.buildParams(params),
      ...options
    }) as Observable<T>;
  }

  patch<T>(path: string, body: unknown, params?: Record<string, unknown>, options: any = {}): Observable<T> {
    return this.http.patch(this.buildUrl(path), body, {
      params: this.buildParams(params),
      ...options
    }) as Observable<T>;
  }

  delete<T>(path: string, params?: Record<string, unknown>, options: any = {}): Observable<T> {
    return this.http.delete(this.buildUrl(path), {
      params: this.buildParams(params),
      ...options
    }) as Observable<T>;
  }
}

