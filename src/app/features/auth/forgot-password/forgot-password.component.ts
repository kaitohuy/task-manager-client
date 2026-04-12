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
    <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div class="max-w-md w-full space-y-8 p-10 bg-white rounded-2xl shadow-xl border border-gray-100">
        <div>
          <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Quên mật khẩu?
          </h2>
          <p class="mt-2 text-center text-sm text-gray-600">
            Nhập email của bạn để nhận liên kết đặt lại mật khẩu.
          </p>
        </div>

        <form class="mt-8 space-y-6" (ngSubmit)="onSubmit()">
          <div class="rounded-md shadow-sm -space-y-px">
            <div>
              <label for="email-address" class="sr-only">Email address</label>
              <input id="email-address" name="email" type="email" autocomplete="email" required
                     [(ngModel)]="email"
                     class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                     placeholder="Email address">
            </div>
          </div>

          <div *ngIf="error" class="text-red-500 text-sm text-center">
            {{ error }}
          </div>

          <div *ngIf="successMessage" class="text-green-500 text-sm text-center">
            {{ successMessage }}
          </div>

          <div>
            <button type="submit" [disabled]="isLoading"
                    class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400">
              <span *ngIf="isLoading" class="mr-2">
                <i class="fas fa-spinner fa-spin"></i>
              </span>
              Gửi yêu cầu
            </button>
          </div>

          <div class="text-center">
            <a routerLink="/login" class="font-medium text-blue-600 hover:text-blue-500 text-sm">
              Quay lại đăng nhập
            </a>
          </div>
        </form>
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
        next: () => {
          this.successMessage = 'Một email hướng dẫn đặt lại mật khẩu đã được gửi đến bạn.';
        },
        error: (err) => {
          this.error = err.error?.message || 'Có lỗi xảy ra, vui lòng thử lại sau.';
        }
      });
  }
}
