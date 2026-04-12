import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '@core/services/auth.service';
import { TokenService } from '@core/services/token.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-oauth2-redirect',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex flex-col items-center justify-center min-h-screen bg-slate-50">
      <div class="p-8 bg-white rounded-3xl shadow-xl border border-slate-100 flex flex-col items-center gap-6 animate-pulse">
        <div class="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
        <div class="text-center">
          <h2 class="text-xl font-black text-slate-800 uppercase tracking-tighter">Authenticating</h2>
          <p class="text-sm text-slate-400 font-medium tracking-tight">Please wait while we set up your session...</p>
        </div>
      </div>
    </div>
  `
})
export class OAuth2RedirectComponent implements OnInit {
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private tokenService: TokenService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token');

    if (token) {
      this.tokenService.setToken(token);
      
      // We need to fetch the current user to populate the session in AuthService
      // AuthService.login() logic usually calls fetchCurrentUser() after setting token.
      // We can use a private method or just rely on restoreSession if we re-init, 
      // but AuthService is already instantiated.
      
      // Let's trigger fetchCurrentUser (it's private, but we can call a method that uses it)
      // Actually, isAuthenticated() checks token + currentUser.
      
      // Let's use the same logic as authService.login() but without the API call.
      this.authService.isLoading.set(true);
      
      this.authService.refreshSession().subscribe({
        next: () => {
          this.authService.isLoading.set(false);
          this.router.navigate([this.authService.getUserDashboardPath()]);
        },
        error: (err: any) => {
          this.authService.isLoading.set(false);
          this.router.navigate(['/login'], { queryParams: { error: 'Failed to authenticate with Google' } });
        }
      });
    } else {
      this.router.navigate(['/login'], { queryParams: { error: 'No token found in redirect' } });
    }
  }
}
