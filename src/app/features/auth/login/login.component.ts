import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '@core/services/auth.service';
import { CreateUserDTO, Gender } from '@models/index';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
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

  constructor(private authService: AuthService, private router: Router) {}
  
  getErrorKeys() {
    return Object.keys(this.fieldErrors || {});
  }

  ngOnInit() {
    this.loginData = { identifier: '', password: '' };
    this.registerData = {
        username: '', password: '', email: '', fullName: '',
        phone: '', address: '', gender: 'MALE' as Gender, roles: []
    };
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

  onForgotPassword(event: Event) {
    event.preventDefault();
    alert('Forgot Password feature is under development. Please contact the Admin.');
  }

  formatDate(event: any) {
    // Simple helper if needed for dd/mm/yyyy input
  }
}
