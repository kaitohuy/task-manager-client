import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '@core/services/auth.service';
import { CreateUserDTO, Gender } from '@models/index';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent implements OnInit {
  isLoginMode = true;
  isLoading = false;
  successMessage: string | null = null;
  error: string | null = null;
  fieldErrors: any = {};
  showPassword = false;
  showRegisterPassword = false;
  showResendVerification = false;
  resendEmail: string = '';

  // Login Model
  loginData = {
    identifier: '',
    password: ''
  };

  // Register Model
  registerData: CreateUserDTO = {
    username: '',
    password: '',
    email: '',
    fullName: '',
    phone: '',
    address: '',
    gender: 'MALE' as Gender,
    roles: []
  };

  constructor(
    private authService: AuthService, 
    private router: Router,
    private route: ActivatedRoute
  ) {}
  
  getErrorKeys() {
    return Object.keys(this.fieldErrors || {});
  }

  ngOnInit() {
    this.loginData = { identifier: '', password: '' };
    this.registerData = {
        username: '', password: '', email: '', fullName: '',
        phone: '', address: '', gender: 'MALE' as Gender, roles: []
    };

    // Check for error messages in URL (e.g. from OAuth2 redirect)
    this.route.queryParams.subscribe(params => {
      if (params['error']) {
        this.error = params['error'];
      }
    });

    if (this.authService.isAuthenticated()) {
      this.router.navigate([this.authService.getUserDashboardPath()]);
    }
  }

  toggleMode() {
    this.isLoginMode = !this.isLoginMode;
    this.error = null;
    this.successMessage = null;
    this.fieldErrors = {};
  }

  handleLogin() {
    this.error = null;
    this.fieldErrors = {};

    if (!this.loginData.identifier || !this.loginData.password) {
      this.error = 'Please enter both identifier and password';
      return;
    }

    this.isLoading = true;
    this.authService.login(this.loginData).subscribe({
      next: () => {
        this.isLoading = false;
        this.router.navigate([this.authService.getUserDashboardPath()]);
      },
      error: (err) => {
        this.isLoading = false;
        this.error = err.error?.message || 'Login failed. Please check your credentials.';
        if (this.error && this.error.includes('chưa được kích hoạt')) {
          this.showResendVerification = true;
          this.resendEmail = this.loginData.identifier; // Assuming identifier is email or username
        }
      }
    });
  }

  handleResendVerification() {
    if (!this.resendEmail) {
      this.error = 'Vui lòng nhập email để gửi lại mã xác thực.';
      return;
    }
    this.isLoading = true;
    this.authService.resendVerification(this.resendEmail).subscribe({
      next: () => {
        this.isLoading = false;
        this.successMessage = 'Email xác thực đã được gửi lại. Vui lòng kiểm tra hộp thư.';
        this.showResendVerification = false;
      },
      error: (err) => {
        this.isLoading = false;
        this.error = err.error?.message || 'Không thể gửi lại email xác thực.';
      }
    });
  }

  handleRegister() {
    this.error = null;
    this.fieldErrors = {};
    this.isLoading = true;

    // Format DOB if present (yyyy-mm-dd -> yyyy/mm/dd)
    const payload = { ...this.registerData };
    if (payload.dob) {
        payload.dob = (payload.dob as string).replace(/-/g, '/') as any;
    }

    this.authService.register(payload)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: () => {
          this.successMessage = 'Registration successful! You can now log in.';
          this.isLoginMode = true;
          this.loginData.identifier = this.registerData.username;
        },
        error: (err) => {
          if (err.status === 400 && err.error) {
            this.fieldErrors = err.error.fieldErrors || err.error;
            this.error = 'Registration details are invalid. Please check again.';
          } else {
            this.error = err.error?.message || 'Registration failed. Please try again.';
          }
        }
      });
  }


  onGoogleLogin() {
    this.authService.loginWithGoogle();
  }

  formatDate(event: any) {
    // Simple helper if needed for dd/mm/yyyy input
  }
}
