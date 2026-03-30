import { Component, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { SidebarComponent } from '@features/dashboard/components/sidebar/sidebar.component';
import { DashboardHeaderComponent } from '@features/dashboard/components/header/header.component';
import { TaskFormComponent } from '@shared/components/task-form/task-form.component';
import { MeetingFormComponent } from '@shared/components/meeting-form/meeting-form.component';
import { ProjectService } from '@core/services/project.service';
import { TaskService } from '@core/services/task.service';
import { MeetingService } from '@core/services/meeting.service';
import { AuthService } from '@core/services/auth.service';
import { ProjectDTO, UserDTO, Page, TaskDTO } from '@models/index';

@Component({
  selector: 'app-dashboard-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, SidebarComponent, DashboardHeaderComponent, TaskFormComponent, MeetingFormComponent],
  templateUrl: './dashboard-layout.component.html',
  styleUrl: './dashboard-layout.component.scss'
})
export class DashboardLayoutComponent implements OnInit {
  projects: ProjectDTO[] = [];
  myTasksCount = 0;
  loading = true;
  showTaskModal = false;
  editingTask: TaskDTO | null = null;
  selectedProjectId?: number;
  defaultDeadline?: string;

  currentUser = computed(() => this.authService.currentUser());

  constructor(
    private projectService: ProjectService,
    private taskService: TaskService,
    private meetingService: MeetingService,
    private authService: AuthService,
    private router: Router
  ) {}

  get activeBreadcrumb(): string {
    const url = this.router.url;
    if (url.includes('/projects')) return 'Projects';
    if (url.includes('/users')) return 'Users Center';
    if (url.includes('/my-tasks')) return 'My Tasks';
    if (url.includes('/calendar')) return 'Project Calendar';
    if (url.includes('/meetings')) return 'Meetings Hub';
    return '';
  }

  ngOnInit() {
    this.loadInitialData();

    // Global listeners for task modals
    this.taskService.taskCreateRequest$.subscribe(req => {
      this.selectedProjectId = req.projectId;
      this.defaultDeadline = req.deadline;
      this.editingTask = null;
      this.showTaskModal = true;
    });

    this.taskService.taskEditRequest$.subscribe(task => {
      this.editingTask = task;
      this.selectedProjectId = task.projectId;
      this.showTaskModal = true;
    });
  }

  loadInitialData() {
    if (this.authService.hasRole('ADMIN')) {
      this.loading = false;
      return;
    }

    this.projectService.getMyProjects(0, 50).subscribe({
      next: (page: Page<ProjectDTO>) => {
        this.projects = page.content;
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  handleCreateTask() {
    this.taskService.requestCreateTask();
  }

  handleCreateProject() {
    // Navigate to the Projects page so user can create a project there
    const base = this.router.url.split('/')[1]; // admin, manager, or dashboard
    this.router.navigate([`/${base}/projects`]);
  }

  handleLogout() {
    this.authService.logout();
  }

  handleTaskSuccess() {
    this.closeTaskModal();
    this.taskService.notifyTaskRefresh();
  }

  closeTaskModal() {
    this.showTaskModal = false;
    this.editingTask = null;
  }
}
