import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '@core/services/auth.service';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div class="max-w-md w-full space-y-8 p-10 bg-white rounded-2xl shadow-xl border border-gray-100 text-center">
        <div *ngIf="status === 'verifying'">
          <i class="fas fa-spinner fa-spin text-4xl text-blue-600 mb-4"></i>
          <h2 class="text-2xl font-bold text-gray-900">Đang xác thực email...</h2>
        </div>

        <div *ngIf="status === 'success'">
          <i class="fas fa-check-circle text-4xl text-green-500 mb-4"></i>
          <h2 class="text-2xl font-bold text-gray-900 text-green-600">Xác thực thành công!</h2>
          <p class="mt-2 text-gray-600">Email của bạn đã được xác thực. Bây giờ bạn có thể đăng nhập vào hệ thống.</p>
          <div class="mt-8">
            <a routerLink="/login" class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700">
              Đăng nhập ngay
            </a>
          </div>
        </div>

        <div *ngIf="status === 'error'">
          <i class="fas fa-exclamation-circle text-4xl text-red-500 mb-4"></i>
          <h2 class="text-2xl font-bold text-gray-900 text-red-600">Xác thực thất bại</h2>
          <p class="mt-2 text-gray-600">{{ errorMessage || 'Mã xác thực không hợp lệ hoặc đã hết hạn.' }}</p>
          <div class="mt-8">
             <a routerLink="/login" class="text-blue-600 hover:text-blue-500 font-medium">Quay lại trang đăng nhập</a>
          </div>
        </div>
      </div>
    </div>
  `
})
export class VerifyEmailComponent implements OnInit {
  status: 'verifying' | 'success' | 'error' = 'verifying';
  errorMessage: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private authService: AuthService
  ) {}

  ngOnInit() {
    const token = this.route.snapshot.queryParamMap.get('token');
    if (!token) {
      this.status = 'error';
      this.errorMessage = 'Mã xác thực không tìm thấy.';
      return;
    }

    this.authService.verifyEmail(token).subscribe({
      next: () => {
        this.status = 'success';
      },
      error: (err) => {
        this.status = 'error';
        this.errorMessage = err.error?.message || 'Có lỗi xảy ra trong quá trình xác thực.';
      }
    });
  }
}
