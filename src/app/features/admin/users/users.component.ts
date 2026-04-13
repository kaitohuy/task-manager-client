import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserDTO, UserRole, CreateUserDTO, UpdateUserDTO, Gender, Permission, UserPermissionOverride } from '@models/index';
import { UserService } from '@core/services/user.service';
import { DashboardService } from '@core/services/dashboard.service';
import { finalize, Subject, debounceTime, distinctUntilChanged, takeUntil, forkJoin } from 'rxjs';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.css']
})
export class UsersComponent implements OnInit, OnDestroy {
  users: UserDTO[] = [];
  selectedUser: UserDTO | null = null;
  isSaving = false;
  showForm = false;
  showPassword = false;
  
  // Permission Management
  showPermissionModal = false;
  allPermissions: Permission[] = [];
  effectivePermissionNames: string[] = []; // Current effective permissions (Role + Overrides)
  permissionOverrides: UserPermissionOverride[] = []; // Explicit settings
  selectedUserForPermission: UserDTO | null = null;
  permissionLoading = false;
  savePermissionLoading = false;

  error: string | null = null;
  success: string | null = null;
  fieldErrors: any = {};
  
  // Pagination
  currentPage = 0;
  pageSize = 10;
  totalElements = 0;
  totalPages = 0;

  // Filters
  searchTerm = '';
  filters = {
    gender: '' as Gender | '',
    role: '' as UserRole | ''
  };
  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();

  stats = {
    admins: 0,
    managers: 0,
    members: 0
  };

  roleOptions: UserRole[] = ['ADMIN', 'MANAGER', 'MEMBER'];

  model: any = {
    username: '', email: '', phone: '', fullName: '', password: '', 
    roles: [], address: '', gender: 'MALE', dob: ''
  };

  constructor(
    private userService: UserService,
    private dashboardService: DashboardService
  ) {}

  ngOnInit(): void {
    this.setupSearch();
    this.loadUsers();
    this.loadStats();
    this.loadAllPermissions();
  }

  loadAllPermissions(): void {
    this.userService.getPermissions().subscribe({
      next: (perms) => this.allPermissions = perms
    });
  }

  openPermissionModal(user: UserDTO): void {
    this.selectedUserForPermission = user;
    this.showPermissionModal = true;
    this.permissionLoading = true;
    this.permissionOverrides = [];
    this.effectivePermissionNames = [];
    
    forkJoin({
      effective: this.userService.getEffectivePermissions(user.id),
      overrides: this.userService.getIndividualPermissionOverrides(user.id)
    }).subscribe({
      next: (res) => {
        this.effectivePermissionNames = res.effective;
        this.permissionOverrides = res.overrides;
        this.permissionLoading = false;
      },
      error: () => {
        this.error = 'Failed to load permissions';
        this.permissionLoading = false;
      }
    });
  }

  getOverride(permissionId: number): UserPermissionOverride | undefined {
    return this.permissionOverrides.find(o => o.permissionId === permissionId);
  }

  setOverride(permissionId: number, state: 'ALLOW' | 'DENY' | 'NONE'): void {
    const index = this.permissionOverrides.findIndex(o => o.permissionId === permissionId);
    
    if (state === 'NONE') {
      if (index > -1) this.permissionOverrides.splice(index, 1);
    } else {
      const isDenied = state === 'DENY';
      if (index > -1) {
        this.permissionOverrides[index].isDenied = isDenied;
      } else {
        this.permissionOverrides.push({ permissionId, isDenied });
      }
    }
  }

  savePermissions(): void {
    if (!this.selectedUserForPermission) return;
    this.savePermissionLoading = true;
    this.userService.updateUserPermissions(this.selectedUserForPermission.id, this.permissionOverrides).subscribe({
      next: () => {
        this.success = 'Permissions updated successfully!';
        this.showPermissionModal = false;
        this.savePermissionLoading = false;
        setTimeout(() => this.success = null, 3000);
      },
      error: () => {
        this.error = 'Failed to save permissions';
        this.savePermissionLoading = false;
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  setupSearch(): void {
    this.searchSubject.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.currentPage = 0;
      this.loadUsers();
    });
  }

  onSearchChange(value: string): void {
    this.searchSubject.next(value);
  }

  loadUsers(): void {
    this.error = null;
    const genderParam = this.filters.gender || undefined;
    const roleParam = this.filters.role || undefined;
    
    this.userService.searchAdvancedUsers(this.searchTerm, genderParam, roleParam, this.currentPage, this.pageSize).subscribe({
      next: (page) => {
        this.users = page.content;
        this.totalElements = page.totalElements;
        this.totalPages = page.totalPages;
      },
      error: () => this.error = 'Server connection error.'
    });
  }

  loadStats(): void {
    this.dashboardService.getAdminStats().subscribe({
      next: (res) => {
        this.stats.admins = res.totalAdmins;
        this.stats.managers = res.totalManagers;
        this.stats.members = res.totalMembers;
      }
    });
  }

  calculateStats(): void {
    // Logic removed - stats are now fetched from Backend
  }

  resetFilters(): void {
    this.searchTerm = '';
    this.filters.gender = '';
    this.filters.role = '';
    this.currentPage = 0;
    this.loadUsers();
  }

  onPageSizeChange(): void {
    this.currentPage = 0;
    this.loadUsers();
  }

  prevPage(): void {
    if (this.currentPage > 0) {
      this.currentPage--;
      this.loadUsers();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages - 1) {
      this.currentPage++;
      this.loadUsers();
    }
  }

  goToPage(p: number): void {
    this.currentPage = p;
    this.loadUsers();
  }

  get pageRange(): number[] {
    const range: number[] = [];
    const maxVisible = 5;
    let start = Math.max(0, this.currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(this.totalPages, start + maxVisible);
    if (end - start < maxVisible) start = Math.max(0, end - maxVisible);
    for (let i = start; i < end; i++) range.push(i);
    return range;
  }

  openCreateForm(): void {
    this.resetForm();
    this.showForm = !this.showForm;
  }

  onEditUser(user: UserDTO): void {
    this.selectedUser = user;
    this.model = {
      username: user.username,
      email: user.email,
      phone: user.phone,
      fullName: user.fullName,
      address: user.address,
      gender: user.gender,
      dob: user.dob ? user.dob.split('T')[0] : '',
      roles: [...user.roles]
    };
    this.showForm = true;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  closeForm(): void {
    this.showForm = false;
    this.resetForm();
  }

  onFormSubmit(): void {
    this.selectedUser ? this.updateUser() : this.createUser();
  }

  toggleRole(role: UserRole, checked: boolean): void {
    if (!this.model.roles) this.model.roles = [];
    this.model.roles = checked
      ? [...(this.model.roles as UserRole[]), role]
      : (this.model.roles as UserRole[]).filter((r) => r !== role);
  }

  private createUser(): void {
    if (!this.model.fullName) {
      this.error = 'Please enter full name!';
      return;
    }
    this.isSaving = true;
    this.fieldErrors = {};
    const payload: CreateUserDTO = {
      ...this.model,
      dob: this.parseDateToBE(this.model.dob)
    };
    this.userService.createUser(payload).pipe(finalize(() => this.isSaving = false)).subscribe({
      next: () => {
        this.success = 'Account created successfully!';
        this.closeForm();
        this.loadUsers();
        setTimeout(() => this.success = null, 3000);
      },
      error: (err) => this.handleError(err)
    });
  }

  private updateUser(): void {
    if (!this.selectedUser) return;
    if (!this.model.fullName) {
      this.error = 'Please enter full name!';
      return;
    }
    this.isSaving = true;
    this.fieldErrors = {};
    const payload: UpdateUserDTO = {
      ...this.model,
      dob: this.parseDateToBE(this.model.dob)
    };
    this.userService.updateUser(this.selectedUser.id, payload).pipe(finalize(() => this.isSaving = false)).subscribe({
      next: () => {
        this.success = 'Update successful!';
        this.closeForm();
        this.loadUsers();
        setTimeout(() => this.success = null, 3000);
      },
      error: (err) => this.handleError(err)
    });
  }

  deleteUser(user: UserDTO): void {
    if (!confirm(`Confirm delete account @${user.username}?`)) return;
    this.userService.deleteUser(user.id).subscribe({
      next: () => {
        this.success = 'User deleted.';
        this.loadUsers();
        setTimeout(() => this.success = null, 3000);
      },
      error: () => alert('Failed to delete this user.')
    });
  }

  private handleError(err: any): void {
    const errorBody = err.error || {};
    
    if (err.status === 400 && typeof errorBody === 'object') {
      if (errorBody.fieldErrors) {
        this.fieldErrors = errorBody.fieldErrors;
      } else if (errorBody.message) {
        this.error = errorBody.message;
      } else {
        // Fallback for flat error objects
        this.fieldErrors = errorBody;
      }
    } else {
      this.error = errorBody.message || 'An unexpected error occurred. Please try again.';
    }
    
    // Auto-scroll to error if in form
    if (this.showForm) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  resetForm(): void {
    this.selectedUser = null;
    this.showPassword = false;
    this.model = {
      username: '', email: '', phone: '', fullName: '', password: '', 
      roles: [], address: '', gender: 'MALE', dob: ''
    };
    this.fieldErrors = {};
    this.error = null;
  }

  private parseDateToBE(dob: string): string | undefined {
    if (!dob) return undefined;
    // Native <input type="date"> provides yyyy-mm-dd
    return dob.replace(/\//g, '-'); 
  }
}
