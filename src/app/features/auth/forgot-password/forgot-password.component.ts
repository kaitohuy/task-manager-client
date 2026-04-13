import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '@core/services/auth.service';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-forgot-password',
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
              Quên mật khẩu?
            </h2>
            <p class="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em]">
              Nhập email để nhận liên kết đặt lại mật khẩu
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

          <form class="p-8 pt-0 space-y-6" (ngSubmit)="onSubmit()">
            <div class="relative group">
              <label class="auth-label">Email Address</label>
              <input name="email" type="email" [(ngModel)]="email" required
                     class="auth-input" placeholder="example@email.com" />
            </div>

            <button type="submit" [disabled]="isLoading" class="auth-btn-primary">
              <div *ngIf="isLoading" class="w-5 h-5 border-2 border-slate-900/30 border-t-slate-900 rounded-full animate-spin"></div>
              {{ isLoading ? 'Processing...' : 'Gửi yêu cầu' }}
            </button>

            <div class="text-center">
              <a routerLink="/login" class="text-[10px] font-bold text-indigo-400 hover:text-indigo-600 transition-colors uppercase tracking-widest underline">
                Quay lại đăng nhập
              </a>
            </div>
          </form>

          <!-- Info -->
          <div class="p-8 pt-0 border-t border-slate-100 mt-4 flex items-center justify-center">
             <p class="text-[10px] font-black text-slate-300 uppercase tracking-widest text-center">Task Manager Engine v2.0</p>
          </div>
        </div>
      </div>
    </div>
  `
})
export class ForgotPasswordComponent {
  email: string = '';
  isLoading = false;
  successMessage: string | null = null;
  error: string | null = null;

  constructor(private authService: AuthService) {}

  onSubmit() {
    if (!this.email) {
      this.error = 'Vui lòng nhập email';
      return;
    }

    this.isLoading = true;
    this.error = null;
    this.successMessage = null;

    this.authService.forgotPassword(this.email)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (res) => {
          this.successMessage = res.message || 'Một email hướng dẫn đặt lại mật khẩu đã được gửi đến bạn.';
        },
        error: (err) => {
          this.error = err.error?.message || 'Có lỗi xảy ra, vui lòng thử lại sau.';
        }
      });
  }
}
