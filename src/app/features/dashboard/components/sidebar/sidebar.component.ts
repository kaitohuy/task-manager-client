import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { UserDTO, ProjectDTO } from '@models/index';
import { AuthService } from '@core/services/auth.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent {
  @Input() projects: ProjectDTO[] = [];
  @Input() currentUser: UserDTO | null = null;
  @Input() taskCount = 0;
  
  isCollapsed = false;

  constructor(private authService: AuthService, private router: Router) {}

  get isAdmin(): boolean {
    return this.authService.hasRole('ADMIN');
  }

  get isManager(): boolean {
    return this.authService.hasRole('MANAGER');
  }

  get basePath(): string {
    return this.authService.getRoleBasePath();
  }

  get profilePath(): string {
    const url = this.router.url;
    if (url.startsWith('/admin')) return '/admin/profile';
    if (url.startsWith('/manager')) return '/manager/profile';
    return '/dashboard/profile';
  }

  toggleSidebar(): void {
    this.isCollapsed = !this.isCollapsed;
  }

  handleLogout(): void {
    this.authService.logout();
  }
}
