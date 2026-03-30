import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ProjectService } from '@core/services/project.service';
import { AuthService } from '@core/services/auth.service';
import { ProjectMemberDTO, UserDTO, ProjectRole } from '@models/index';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-project-members-tab',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [DatePipe],
  templateUrl: './project-members-tab.component.html',
  styleUrl: './project-members-tab.component.scss'
})
export class ProjectMembersTabComponent implements OnInit {
  projectId!: number;
  members: ProjectMemberDTO[] = [];
  filteredMembers: ProjectMemberDTO[] = [];
  searchQuery: string = '';
  availableUsers: UserDTO[] = [];
  
  isLoading = true;
  isLoadingAvailable = false;
  isAdding = false;
  isAddModalOpen = false;
  error: string | null = null;

  selectedUserId: number | null = null;
  selectedRole: ProjectRole = 'MEMBER';

  isAdminOrManager = false;

  constructor(
    private route: ActivatedRoute,
    private projectService: ProjectService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.isAdminOrManager = this.authService.hasRole('ADMIN') || this.authService.hasRole('MANAGER');
    
    this.route.parent?.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.projectId = +id;
        this.loadMembers();
      }
    });
  }

  loadMembers(): void {
    this.isLoading = true;
    this.projectService.getProjectMembers(this.projectId)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (res: any) => {
          this.members = Array.isArray(res) ? res : (res?.content || []);
          this.filterMembers();
        },
        error: () => this.error = 'Failed to load members'
      });
  }

  filterMembers(): void {
    if (!this.searchQuery) {
      this.filteredMembers = [...this.members];
      return;
    }
    const q = this.searchQuery.toLowerCase();
    this.filteredMembers = this.members.filter(m => 
      m.user.username.toLowerCase().includes(q) || 
      m.user.fullName?.toLowerCase().includes(q) ||
      m.user.email.toLowerCase().includes(q)
    );
  }

  openAddModal(): void {
    if (!this.isAdminOrManager) return;
    this.isAddModalOpen = true;
    this.selectedUserId = null;
    this.selectedRole = 'MEMBER';
    this.loadAvailableUsers();
  }

  closeAddModal(): void {
    this.isAddModalOpen = false;
  }

  loadAvailableUsers(): void {
    this.isLoadingAvailable = true;
    this.projectService.getAvailableUsersToAdd(this.projectId)
      .pipe(finalize(() => this.isLoadingAvailable = false))
      .subscribe({
        next: (users) => this.availableUsers = users,
        error: () => this.error = 'Failed to load configurable users'
      });
  }

  onAddMember(): void {
    if (!this.selectedUserId) return;
    this.isAdding = true;
    this.projectService.addProjectMember(this.projectId, this.selectedUserId, this.selectedRole)
      .pipe(finalize(() => this.isAdding = false))
      .subscribe({
        next: () => {
          this.closeAddModal();
          this.loadMembers();
          this.showSuccess('Member added successfully!');
        },
        error: (err) => this.showError(err?.error?.message || 'Failed to add member')
      });
  }

  onRoleChange(member: ProjectMemberDTO, newRole: string): void {
    if (!this.isAdminOrManager) return;
    this.projectService.updateProjectMemberRole(this.projectId, member.user.id, newRole)
      .subscribe({
        next: () => {
          member.role = newRole as ProjectRole;
          this.showSuccess('Role updated successfully!');
        },
        error: () => this.showError('Failed to update role')
      });
  }

  removeMember(userId: number): void {
    if (!this.isAdminOrManager) return;
    
    import('sweetalert2').then(Swal => {
      Swal.default.fire({
        title: 'Remove member?',
        text: 'They will lose access to this project.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#cbd5e1',
        confirmButtonText: 'Remove',
        reverseButtons: true,
        customClass: {
          confirmButton: 'px-5 py-2.5 rounded-xl font-bold text-sm',
          cancelButton: 'px-5 py-2.5 rounded-xl font-bold text-sm text-slate-700'
        }
      }).then((result) => {
        if (result.isConfirmed) {
          this.projectService.removeProjectMember(this.projectId, userId).subscribe({
            next: () => {
              this.members = this.members.filter(m => m.user.id !== userId);
              this.filterMembers();
              this.showSuccess('Member removed.');
            },
            error: () => this.showError('Failed to remove member')
          });
        }
      });
    });
  }

  private showSuccess(msg: string) {
    import('sweetalert2').then(Swal => {
      Swal.default.fire({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        title: msg,
        icon: 'success'
      });
    });
  }

  private showError(msg: string) {
    import('sweetalert2').then(Swal => {
      Swal.default.fire({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        title: msg,
        icon: 'error'
      });
    });
  }
}
