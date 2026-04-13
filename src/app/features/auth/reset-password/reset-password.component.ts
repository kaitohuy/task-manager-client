import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '@core/services/auth.service';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="min-h-screen relative flex items-center justify-center p-4">
      <!-- Dynamic Background with Overlay -->
      <div class="absolute inset-0 z-[-1] overflow-hidden bg-slate-900">
        <div class="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-100 scale-100" 
             style="background-image: url('/images/login_background.png');">
        </div>
        <div class="absolute inset-0 bg-gradient-to-tr from-white/60 via-blue-50/30 to-indigo-50/40"></div>
      </div>

      <div class="relative w-full max-w-xl animate-auth-fade-in group">
        <!-- Main Glass Card -->
        <div class="glass-card overflow-hidden bg-[#fafafa] rounded-[2.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] transition-all duration-500 border border-[#eaeaea]">
          
          <div class="p-8 text-center">
            <h2 class="text-4xl font-black text-slate-800 tracking-tighter mb-2">
              Đặt lại mật khẩu
            </h2>
            <p class="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em]">
              Vui lòng nhập mật khẩu mới của bạn
            </p>
          </div>

          <!-- Alerts -->
          <div class="px-8 mb-4">
            <div *ngIf="error" class="bg-rose-50 border border-rose-200 text-rose-700 px-6 py-4 rounded-2xl text-[11px] font-bold flex items-center gap-4 animate-shake shadow-sm">
              <svg class="h-5 w-5 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              {{ error }}
            </div>
            <div *ngIf="successMessage" class="bg-emerald-50 border border-emerald-200 text-emerald-700 px-6 py-4 rounded-2xl text-[11px] font-bold flex items-center gap-4 animate-auth-fade-in shadow-sm">
              <svg class="h-5 w-5 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              {{ successMessage }}
            </div>
          </div>

          <form class="p-8 pt-0 space-y-6" (ngSubmit)="onSubmit()" *ngIf="!successMessage">
            <div class="relative group">
              <label class="auth-label">Mật khẩu mới</label>
              <input name="password" type="password" [(ngModel)]="newPassword" required
                     class="auth-input" placeholder="••••••••" />
            </div>

            <div class="relative group">
              <label class="auth-label">Xác nhận mật khẩu</label>
              <input name="confirmPassword" type="password" [(ngModel)]="confirmPassword" required
                     class="auth-input" placeholder="••••••••" />
            </div>

            <button type="submit" [disabled]="isLoading" class="auth-btn-primary">
              <div *ngIf="isLoading" class="w-5 h-5 border-2 border-slate-900/30 border-t-slate-900 rounded-full animate-spin"></div>
              {{ isLoading ? 'Processing...' : 'Lưu mật khẩu mới' }}
            </button>
          </form>

          <div class="p-8 pt-0 text-center" *ngIf="successMessage">
             <a routerLink="/login" class="auth-btn-primary no-underline">
                Đăng nhập ngay
             </a>
          </div>

          <!-- Info -->
          <div class="p-8 pt-0 border-t border-slate-100 mt-4 flex items-center justify-center">
             <p class="text-[10px] font-black text-slate-300 uppercase tracking-widest text-center">Task Manager Engine v2.0</p>
          </div>
        </div>
      </div>
    </div>
  `
})
export class ResetPasswordComponent implements OnInit {
  token: string | null = null;
  newPassword = '';
  confirmPassword = '';
  isLoading = false;
  successMessage: string | null = null;
  error: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.token = this.route.snapshot.queryParamMap.get('token');
    if (!this.token) {
      this.error = 'Mã đặt lại mật khẩu không hợp lệ.';
    }
  }

  onSubmit() {
    if (!this.newPassword || this.newPassword !== this.confirmPassword) {
      this.error = 'Mật khẩu không khớp hoặc trống.';
      return;
    }

    if (!this.token) return;

    this.isLoading = true;
    this.error = null;

    this.authService.resetPassword(this.token, this.newPassword)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (res) => {
          this.successMessage = res.message || 'Thay đổi mật khẩu thành công!';
        },
        error: (err) => {
          this.error = err.error?.message || 'Có lỗi xảy ra, vui lòng thử lại sau.';
        }
      });
  }
}
