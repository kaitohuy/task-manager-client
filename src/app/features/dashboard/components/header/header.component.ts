import { Component, Input, Output, EventEmitter, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ProjectDTO, UserDTO } from '@models/index';
import { AuthService } from '@core/services/auth.service';
import { NotificationService } from '@core/services/notification.service';
import { NotificationItemComponent } from '@shared/components/notification-item/notification-item.component';
import { NotificationResponseDTO } from '@models/notification.model';

@Component({
  selector: 'app-dashboard-header',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, NotificationItemComponent],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class DashboardHeaderComponent {
  @Input() searchQuery = '';
  @Input() statusFilter = 'all';
  @Input() sortFilter = 'deadline-asc';
  @Input() projects: ProjectDTO[] = [];
  @Input() showCreateTask = true;
  @Input() currentUser: UserDTO | null = null;
  @Input() activeProjectName = '';
  @Input() notificationCount = 0;

  @Output() onSearch = new EventEmitter<string>();
  @Output() onStatusChange = new EventEmitter<string>();
  @Output() onSortChange = new EventEmitter<string>();
  @Output() onCreateTask = new EventEmitter<void>();
  @Output() onCreateProject = new EventEmitter<void>();
  @Output() onLogout = new EventEmitter<void>();

  isCreateDropdownOpen = false;
  isProfileDropdownOpen = false;
  isNotificationDropdownOpen = false;

  constructor(
    private authService: AuthService, 
    private router: Router,
    public notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.notificationService.init();
    this.notificationService.getNotifications(0, 10).subscribe();
  }

  get isAdmin(): boolean {
    return this.authService.hasRole('ADMIN');
  }

  get isMember(): boolean {
    return this.authService.hasRole('MEMBER');
  }

  get basePath(): string {
    return this.authService.getUserDashboardPath();
  }

  get profilePath(): string {
    const url = this.router.url;
    if (url.startsWith('/admin')) return '/admin/profile';
    if (url.startsWith('/manager')) return '/manager/profile';
    return '/dashboard/profile';
  }

  get userAvatarUrl(): string {
    if (this.currentUser?.imageUrl) return this.currentUser.imageUrl;
    const gender = this.currentUser?.gender || 'MALE';
    return gender === 'FEMALE' ? 'images/female_avatar.png' : 'images/male_avatar.png';
  }

  handleStatusChange(val: string) { this.onStatusChange.emit(val); }
  handleSortChange(val: string) { this.sortFilter = val; this.onSortChange.emit(val); }

  toggleCreateDropdown(event: Event) {
    event.stopPropagation();
    this.isCreateDropdownOpen = !this.isCreateDropdownOpen;
    this.isProfileDropdownOpen = false;
  }

  toggleProfileDropdown(event: Event) {
    event.stopPropagation();
    this.isProfileDropdownOpen = !this.isProfileDropdownOpen;
    this.isCreateDropdownOpen = false;
    this.isNotificationDropdownOpen = false;
  }

  toggleNotificationDropdown(event: Event) {
    event.stopPropagation();
    this.isNotificationDropdownOpen = !this.isNotificationDropdownOpen;
    this.isCreateDropdownOpen = false;
    this.isProfileDropdownOpen = false;
  }

  markAllAsRead(event: Event) {
    event.stopPropagation();
    this.notificationService.markAllAsRead().subscribe();
  }

  deleteAllNotifications(event: Event) {
    event.stopPropagation();
    this.notificationService.deleteAllNotifications().subscribe();
  }

  onDeleteNotification(id: number) {
    this.notificationService.deleteNotification(id).subscribe();
  }

  handleNotificationClick(notification: NotificationResponseDTO) {
    this.isNotificationDropdownOpen = false;
    
    // Mark as read immediately on click
    if (!notification.isRead) {
      this.notificationService.markAsRead(notification.id).subscribe();
    }

    // Navigation logic based on notification type
    if (notification.targetId) {
      if (notification.type === 'PROJECT_INVITE') {
        this.router.navigate(['/dashboard/projects', notification.targetId]);
      } else {
        // For task related notifications, we ideally want to go to the project board and open the task
        // For now, we'll navigate to the project board if we can determine the projectId,
        // or just stay on current page and set query param.
        
        // If we're already on a project board, this might work if we implement query param handling there.
        this.router.navigate([], { 
          queryParams: { taskId: notification.targetId },
          queryParamsHandling: 'merge' 
        });
      }
    }
  }

  goToProfile() {
    this.isProfileDropdownOpen = false;
    this.router.navigate([this.profilePath]);
  }

  onCreateTaskClick() {
    this.isCreateDropdownOpen = false;
    this.onCreateTask.emit();
  }

  onCreateProjectClick() {
    this.isCreateDropdownOpen = false;
    this.onCreateProject.emit();
  }

  onLogoutClick() {
    this.isProfileDropdownOpen = false;
    this.onLogout.emit();
  }

  @HostListener('document:click')
  closeAllDropdowns() {
    this.isCreateDropdownOpen = false;
    this.isProfileDropdownOpen = false;
    this.isNotificationDropdownOpen = false;
  }
}
