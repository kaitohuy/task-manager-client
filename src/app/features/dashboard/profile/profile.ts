import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '@core/services/auth.service';
import { UserDTO } from '@models/index';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile.html',
  styleUrl: './profile.scss'
})
export class ProfileComponent implements OnInit {
  currentUser: UserDTO | null = null;

  // Edit profile form
  fullName = '';
  email = '';
  phone = '';
  address = '';
  dob = '';
  isSavingProfile = false;

  // Change password form
  currentPassword = '';
  newPassword = '';
  confirmPassword = '';
  isSavingPassword = false;

  // Password visibility toggles
  showCurrentPw = false;
  showNewPw = false;
  showConfirmPw = false;

  constructor(private authService: AuthService) {}

  ngOnInit() {
    this.currentUser = this.authService.currentUser();
    this.fullName = this.currentUser?.fullName || '';
    this.email = this.currentUser?.email || '';
    this.phone = this.currentUser?.phone || '';
    this.address = this.currentUser?.address || '';
    this.dob = this.currentUser?.dob || '';
  }

  get avatarUrl(): string {
    if (this.currentUser?.imageUrl) return this.currentUser.imageUrl;
    const gender = this.currentUser?.gender || 'MALE';
    return gender === 'FEMALE' ? 'images/female_avatar.png' : 'images/male_avatar.png';
  }

  get userInitials(): string {
    const name = this.currentUser?.fullName || this.currentUser?.username || '';
    return name.slice(0, 2).toUpperCase();
  }

  get roleLabel(): string {
    const role = this.currentUser?.roles?.[0] || '';
    const map: Record<string, string> = { ADMIN: 'Administrator', MANAGER: 'Project Manager', MEMBER: 'Team Member' };
    return map[role] || role;
  }

  get roleBadgeColor(): string {
    const role = this.currentUser?.roles?.[0] || '';
    const map: Record<string, string> = { ADMIN: 'bg-red-100 text-red-700', MANAGER: 'bg-blue-100 text-blue-700', MEMBER: 'bg-green-100 text-green-700' };
    return map[role] || 'bg-slate-100 text-slate-700';
  }

  saveProfile() {
    if (!this.fullName.trim() || !this.email.trim()) {
      Swal.fire({ toast: true, position: 'top-end', icon: 'warning', title: 'Full name and email are required', showConfirmButton: false, timer: 2500 });
      return;
    }
    this.isSavingProfile = true;
    // Simulating API call (real implementation would call a user service)
    setTimeout(() => {
      this.isSavingProfile = false;
      Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Profile updated successfully!', showConfirmButton: false, timer: 2500 });
    }, 800);
  }

  changePassword() {
    if (!this.currentPassword || !this.newPassword || !this.confirmPassword) {
      Swal.fire({ toast: true, position: 'top-end', icon: 'warning', title: 'All password fields are required', showConfirmButton: false, timer: 2500 });
      return;
    }
    if (this.newPassword !== this.confirmPassword) {
      Swal.fire({ toast: true, position: 'top-end', icon: 'error', title: 'New passwords do not match', showConfirmButton: false, timer: 2500 });
      return;
    }
    if (this.newPassword.length < 8) {
      Swal.fire({ toast: true, position: 'top-end', icon: 'warning', title: 'Password must be at least 8 characters', showConfirmButton: false, timer: 2500 });
      return;
    }
    this.isSavingPassword = true;
    setTimeout(() => {
      this.isSavingPassword = false;
      this.currentPassword = '';
      this.newPassword = '';
      this.confirmPassword = '';
      Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Password changed successfully!', showConfirmButton: false, timer: 2500 });
    }, 800);
  }
}
