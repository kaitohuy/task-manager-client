import { Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, catchError, of, switchMap, tap } from 'rxjs';
import { ApiService } from './api.service';
import { TokenService } from './token.service';
import { AuthResponse, LoginRequest, UserDTO, UserRole, CreateUserDTO } from '@models/index';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  currentUser = signal<UserDTO | null>(null);
  isLoading = signal<boolean>(true);

  constructor(
    private apiService: ApiService, 
    private router: Router,
    private tokenService: TokenService
  ) {
    this.restoreSession();
    
    // Listen for logout events from interceptor or other sources
    this.tokenService.logout$.subscribe(() => {
      this.logout(false); // logout without notifying tokenService again
    });
  }

  loginWithGoogle(): void {
    window.location.href = `${environment.apiUrl}/oauth2/authorization/google`;
  }

  getToken(): string | null {
    return this.tokenService.getToken();
  }

  isAuthenticated(): boolean {
    return !!this.getToken() && !!this.currentUser();
  }

  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.apiService.post<AuthResponse>('/auth/login', credentials).pipe(
      tap(response => {
        if (response.token) {
          this.tokenService.setToken(response.token);
        }
      }),
      switchMap(response => {
        if (response.mfaRequired) {
          return of(response);
        }
        return this.fetchCurrentUser().pipe(switchMap(() => of(response)));
      })
    );
  }

  register(userData: CreateUserDTO): Observable<{message: string}> {
    return this.apiService.post<{message: string}>('/auth/register', userData);
  }

  logout(notifyTokenService: boolean = true): void {
    if (notifyTokenService) {
      this.tokenService.removeToken();
    }
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }

  verifyEmail(token: string): Observable<{message: string}> {
    return this.apiService.get<{message: string}>(`/auth/verify-email?token=${token}`);
  }

  forgotPassword(email: string): Observable<{message: string}> {
    return this.apiService.post<{message: string}>(`/auth/forgot-password?email=${email}`, {});
  }

  resetPassword(token: string, newPassword: string): Observable<{message: string}> {
    return this.apiService.post<{message: string}>(`/auth/reset-password?token=${token}&newPassword=${newPassword}`, {});
  }

  resendVerification(email: string): Observable<{message: string}> {
    return this.apiService.post<{message: string}>(`/auth/resend-verification?email=${email}`, {});
  }

  verifyOtp(mfaToken: string, code: string): Observable<AuthResponse> {
    return this.apiService.post<AuthResponse>(`/auth/verify-otp?mfaToken=${mfaToken}&code=${code}`, {}).pipe(
      tap(response => {
        if (response.token) {
          this.tokenService.setToken(response.token);
        }
      }),
      switchMap(response => this.fetchCurrentUser().pipe(switchMap(() => of(response))))
    );
  }

  setupMfa(username: string): Observable<{message: string}> {
    return this.apiService.get<{message: string}>(`/auth/mfa/setup?username=${username}`);
  }

  enableMfa(username: string, code: string): Observable<{message: string}> {
    return this.apiService.post<{message: string}>(`/auth/mfa/enable?username=${username}&code=${code}`, {});
  }

  disableMfa(username: string): Observable<{message: string}> {
    return this.apiService.post<{message: string}>(`/auth/mfa/disable?username=${username}`, {});
  }

  hasRole(role: UserRole): boolean {
    const user = this.currentUser();
    return user ? user.roles.includes(role) : false;
  }

  hasAnyRole(roles: UserRole[]): boolean {
    const user = this.currentUser();
    return user ? user.roles.some((r) => roles.includes(r)) : false;
  }

  getRoleBasePath(): string {
    if (this.hasRole('ADMIN')) return '/admin';
    if (this.hasRole('MANAGER')) return '/manager';
    return '/dashboard';
  }

  getUserDashboardPath(): string {
    return this.getRoleBasePath() + '/board';
  }

  private restoreSession(): void {
    const token = this.getToken();
    if (token) {
      this.fetchCurrentUser().subscribe({
        next: () => this.isLoading.set(false),
        error: () => this.isLoading.set(false)
      });
    } else {
      this.isLoading.set(false);
    }
  }

  refreshSession(): Observable<UserDTO | null> {
    return this.fetchCurrentUser();
  }

  private fetchCurrentUser(): Observable<UserDTO | null> {
    return this.apiService.get<UserDTO>('/api/users/me').pipe(
      tap(user => {
        console.log('Session restored successfully for task-manager-angular:', user.username);
        this.currentUser.set(user);
      }),
      catchError((error) => {
        console.error('Error fetching current user:', error);
        // Only logout if it's a 401 Unauthorized or 403 Forbidden
        if (error.status === 401 || error.status === 403) {
          console.warn('Session invalid or expired. Logging out.');
          this.tokenService.notifyLogout();
        } else {
          console.warn('Transient error fetching current user. Retaining token.');
        }
        return of(null);
      })
    );
  }
}
