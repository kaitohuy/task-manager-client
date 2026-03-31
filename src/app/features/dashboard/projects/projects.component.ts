import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProjectService } from '@core/services/project.service';
import { AuthService } from '@core/services/auth.service';
import { ProjectDTO, CreateProjectDTO, UserDTO } from '@models/index';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject, finalize, takeUntil } from 'rxjs';

@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './projects.component.html',
  styleUrl: './projects.component.scss'
})
export class ProjectsComponent implements OnInit, OnDestroy {
  projects: ProjectDTO[] = [];
  isLoading = false;
  isSaving = false;
  showForm = false;
  error: string | null = null;
  success: string | null = null;

  model: CreateProjectDTO = { name: '', description: '' };
  selectedProject: ProjectDTO | null = null;
  

  searchQuery = '';
  statusFilter = 'all';
  sortOption = 'createdAt,desc';
  
  // For UI dropdowns
  activeActionMenuId: number | null = null;

  // Pagination
  currentPage = 0;
  pageSize = 10;
  totalElements = 0;
  totalPages = 0;

  private destroy$ = new Subject<void>();

  constructor(
    private projectService: ProjectService,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.loadProjects();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadProjects(): void {
    this.isLoading = true;
    this.error = null;

    const projectsRequest$ = this.authService.hasRole('ADMIN')
      ? this.projectService.getAllProjects(this.currentPage, this.pageSize, this.sortOption)
      : this.projectService.getMyProjects(this.currentPage, this.pageSize, this.sortOption);

    projectsRequest$
      .pipe(
        finalize(() => this.isLoading = false),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (page) => {
          this.projects = page.content;
          this.totalElements = page.totalElements;
          this.totalPages = page.totalPages;
        },
        error: () => this.error = 'Failed to load project list.'
      });
  }

  toggleForm(): void {
    this.showForm = !this.showForm;
    if (!this.showForm) this.resetForm();
  }

  onSubmit(): void {
    if (!this.model.name) return;
    
    this.isSaving = true;
    const request$ = this.selectedProject 
      ? this.projectService.updateProject(this.selectedProject.id, this.model)
      : this.projectService.createProject(this.model);

    request$.pipe(finalize(() => this.isSaving = false)).subscribe({
      next: () => {
        this.success = this.selectedProject ? 'Project updated successfully!' : 'New project created successfully!';
        this.loadProjects();
        this.toggleForm();
        setTimeout(() => this.success = null, 3000);
      },
      error: (err) => {
        this.error = err?.error?.message || 'An error occurred while saving the project.';
      }
    });
  }

  editProject(project: ProjectDTO): void {
    this.selectedProject = project;
    this.model = { name: project.name, description: project.description };
    this.showForm = true;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  viewProject(id: number): void {
    this.router.navigate([id], { relativeTo: this.route });
  }

  viewProjectMembers(project: ProjectDTO): void {
    this.router.navigate([project.id, 'members'], { relativeTo: this.route });
  }

  deleteProject(id: number): void {
    import('sweetalert2').then((Swal) => {
      Swal.default.fire({
        title: 'Are you sure?',
        text: "You won't be able to revert this project!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#64748b',
        confirmButtonText: 'Yes, delete it!',
        cancelButtonText: 'Cancel',
        reverseButtons: true,
        customClass: {
          confirmButton: 'px-5 py-2.5 rounded-xl font-bold text-sm',
          cancelButton: 'px-5 py-2.5 rounded-xl font-bold text-sm'
        }
      }).then((result) => {
        if (result.isConfirmed) {
          this.projectService.deleteProject(id).subscribe({
            next: () => {
              Swal.default.fire({
                title: 'Deleted!',
                text: 'Project has been deleted.',
                icon: 'success',
                timer: 2000,
                showConfirmButton: false
              });
              this.loadProjects();
            },
            error: () => {
              Swal.default.fire({
                title: 'Error!',
                text: 'Failed to delete this project.',
                icon: 'error'
              });
            }
          });
        }
      });
    });
  }

  resetForm(): void {
    this.model = { name: '', description: '' };
    this.selectedProject = null;
    this.error = null;
  }

  // Pagination helpers
  goToPage(p: number): void {
    this.currentPage = p;
    this.loadProjects();
  }

  get pageRange(): number[] {
    return Array.from({length: this.totalPages}, (_, i) => i);
  }

  get filteredProjects(): ProjectDTO[] {
    let filtered = [...this.projects];
    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(q) || 
        p.description.toLowerCase().includes(q)
      );
    }
    // Note: Project currently doesn't have a status on BE, 
    // but we can add filter logic here if needed in the future.
    return filtered;
  }

  toggleMoreActions(id: number, event: Event): void {
    event.stopPropagation();
    this.activeActionMenuId = this.activeActionMenuId === id ? null : id;
  }

  @HostListener('document:click')
  closeMenus(): void {
    this.activeActionMenuId = null;
  }

  isAdmin(): boolean {
    return this.authService.hasRole('ADMIN');
  }

  isMember(): boolean {
    return this.authService.hasRole('MEMBER');
  }
}
