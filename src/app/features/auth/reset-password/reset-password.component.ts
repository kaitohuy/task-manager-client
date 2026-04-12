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
    <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div class="max-w-md w-full space-y-8 p-10 bg-white rounded-2xl shadow-xl border border-gray-100">
        <div>
          <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Đặt lại mật khẩu
          </h2>
          <p class="mt-2 text-center text-sm text-gray-600">
            Vui lòng nhập mật khẩu mới của bạn bên dưới.
          </p>
        </div>

        <form class="mt-8 space-y-4" (ngSubmit)="onSubmit()">
          <div>
            <label for="password" class="block text-sm font-medium text-gray-700">Mật khẩu mới</label>
            <input id="password" name="password" type="password" required
                   [(ngModel)]="newPassword"
                   class="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                   placeholder="Nhập mật khẩu mới">
          </div>

          <div>
            <label for="confirm-password" class="block text-sm font-medium text-gray-700">Xác nhận mật khẩu</label>
            <input id="confirm-password" name="confirmPassword" type="password" required
                   [(ngModel)]="confirmPassword"
                   class="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                   placeholder="Nhập lại mật khẩu mới">
          </div>

          <div *ngIf="error" class="text-red-500 text-sm text-center">
            {{ error }}
          </div>

          <div *ngIf="successMessage" class="text-green-500 text-sm text-center">
            {{ successMessage }}
          </div>

          <div>
            <button type="submit" [disabled]="isLoading || successMessage"
                    class="group relative w-full flex justify-center py-2 px-3 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400">
              <span *ngIf="isLoading" class="mr-2">
                <i class="fas fa-spinner fa-spin"></i>
              </span>
              Lưu mật khẩu mới
            </button>
          </div>

          <div class="text-center" *ngIf="successMessage">
             <a routerLink="/login" class="text-blue-600 hover:text-blue-500 font-medium text-sm">Quay lại trang đăng nhập</a>
          </div>
        </form>
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
        next: () => {
          this.successMessage = 'Thay đổi mật khẩu thành công!';
        },
        error: (err) => {
          this.error = err.error?.message || 'Có lỗi xảy ra, vui lòng thử lại sau.';
        }
      });
  }
}
