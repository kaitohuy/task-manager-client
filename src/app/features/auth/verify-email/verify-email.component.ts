import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '@core/services/auth.service';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [CommonModule, RouterLink],
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
               Xác thực Email
            </h2>
            <p class="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em]">
               Trạng thái kích hoạt tài khoản
            </p>
          </div>

          <div class="p-8 text-center space-y-8">
            <!-- Verifying State -->
            <div *ngIf="isLoading" class="flex flex-col items-center gap-6 py-8">
               <div class="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
               <p class="text-slate-500 font-bold text-sm tracking-tight">Đang xác thực mã của bạn, vui lòng đợi...</p>
            </div>

            <!-- Success State -->
            <div *ngIf="verified" class="flex flex-col items-center gap-6 py-8 animate-auth-fade-in">
               <div class="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500 shadow-sm border border-emerald-100">
                  <svg class="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
                  </svg>
               </div>
               <div class="space-y-2">
                 <h3 class="text-2xl font-black text-slate-800 tracking-tight">Xác thực thành công!</h3>
                 <p class="text-slate-500 text-sm font-medium">Tài khoản của bạn đã được kích hoạt. Chào mừng bạn đến với Task Manager.</p>
               </div>
               <a routerLink="/login" class="auth-btn-primary no-underline mt-4">
                  Đăng nhập ngay
               </a>
            </div>

            <!-- Error State -->
            <div *ngIf="error" class="flex flex-col items-center gap-6 py-8 animate-shake">
               <div class="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center text-rose-500 shadow-sm border border-rose-100">
                  <svg class="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12" />
                  </svg>
               </div>
               <div class="space-y-2">
                 <h3 class="text-2xl font-black text-slate-800 tracking-tight">Xác thực thất bại</h3>
                 <p class="text-rose-600 text-sm font-bold">{{ error }}</p>
               </div>
               <a routerLink="/login" class="text-[10px] font-bold text-indigo-400 hover:text-indigo-600 transition-colors uppercase tracking-widest underline">
                  Quay lại đăng nhập
               </a>
            </div>
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
export class VerifyEmailComponent implements OnInit {
  isLoading = true;
  verified = false;
  error: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private authService: AuthService
  ) {}

  ngOnInit() {
    const token = this.route.snapshot.queryParamMap.get('token');
    if (!token) {
      this.isLoading = false;
      this.error = 'Mã xác thực không tồn tại hoặc đã hết hạn.';
      return;
    }

    this.authService.verifyEmail(token)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: () => {
          this.verified = true;
        },
        error: (err) => {
          this.error = err.error?.message || 'Liên kết xác thực không hợp lệ hoặc đã qua sử dụng.';
        }
      });
  }
}
