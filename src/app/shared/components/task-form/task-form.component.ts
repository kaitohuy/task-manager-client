import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin, finalize } from 'rxjs';
import { ProjectService } from '@core/services/project.service';
import { TaskService } from '@core/services/task.service';
import { AuthService } from '@core/services/auth.service';
import { ProjectDTO, CreateTaskDTO, TaskStatus, TaskDTO, ProjectMemberDTO } from '@models/index';

@Component({
  selector: 'app-task-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './task-form.component.html',
  styleUrl: './task-form.component.scss'
})
export class TaskFormComponent implements OnInit {
  @Input() task: TaskDTO | null = null;
  @Input() projectId?: number;
  @Input() defaultDeadline?: string;
  @Output() onSubmitSuccess = new EventEmitter<void>();
  @Output() onCancel = new EventEmitter<void>();

  projects: ProjectDTO[] = [];
  projectMembers: ProjectMemberDTO[] = [];
  isLoadingProjects = false;
  isLoadingMembers = false;
  isSaving = false;
  error: string | null = null;

  model: CreateTaskDTO = {
    title: '',
    description: '',
    status: 'TODO',
    deadline: '',
    projectId: 0,
    assigneeId: undefined
  };

  statusOptions: TaskStatus[] = ['TODO', 'IN_PROGRESS', 'DONE', 'PAUSED', 'CANCELLED'];

  constructor(
    private projectService: ProjectService,
    private taskService: TaskService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadProjects();
    if (this.task) {
      this.model = {
        title: this.task.title,
        description: this.task.description,
        status: this.task.status,
        deadline: this.task.deadline ? this.task.deadline.substring(0, 16) : '',
        projectId: this.task.projectId,
        assigneeId: this.task.assignee?.id
      };
      this.loadProjectMembers(this.task.projectId);
    } else {
      if (this.projectId) {
        this.model.projectId = this.projectId;
        this.loadProjectMembers(this.projectId);
      }
      if (this.defaultDeadline) {
        // If it's just a date (YYYY-MM-DD), append T09:00 for a default start time
        this.model.deadline = this.defaultDeadline.length === 10 
          ? `${this.defaultDeadline}T09:00` 
          : this.defaultDeadline.substring(0, 16);
      }
    }
  }

  onProjectChange(): void {
    if (this.model.projectId) {
      this.loadProjectMembers(this.model.projectId);
      this.model.assigneeId = undefined;
    }
  }

  loadProjectMembers(projectId: number): void {
    this.isLoadingMembers = true;
    this.projectService.getProjectMembers(projectId)
      .pipe(finalize(() => this.isLoadingMembers = false))
      .subscribe({
        next: (res: any) => {
          this.projectMembers = Array.isArray(res) ? res : (res?.content || []);
        },
        error: () => this.projectMembers = []
      });
  }

  loadProjects(): void {
    this.isLoadingProjects = true;
    const request$ = this.authService.hasRole('ADMIN')
      ? this.projectService.getAllProjects(0, 100)
      : this.projectService.getMyProjects(0, 100);

    request$.subscribe({
      next: (page) => {
        this.projects = page.content;
        if (!this.model.projectId && this.projects.length > 0) {
          this.model.projectId = this.projects[0].id;
          this.loadProjectMembers(this.model.projectId);
        }
      },
      complete: () => this.isLoadingProjects = false
    });
  }

  handleSubmit(): void {
    if (!this.model.title || !this.model.projectId) return;

    this.isSaving = true;
    
    // Format payload for backend LocalDateTime expected format
    const payload = { ...this.model };
    if (!payload.deadline) {
      payload.deadline = undefined as any;
    } else {
      // Ensure it's exactly YYYY-MM-DDTHH:mm if the browser format varies
      payload.deadline = payload.deadline.substring(0, 16);
    }

    const request$ = this.task 
      ? this.taskService.updateTask(this.task.id, payload)
      : this.taskService.createTask(payload);

    request$.pipe(finalize(() => this.isSaving = false)).subscribe({
      next: () => {
        this.onSubmitSuccess.emit();
      },
      error: (err) => {
        console.error('Task save error:', err);
        const errorBody = err?.error;
        
        if (errorBody && typeof errorBody === 'object') {
          if (errorBody.errors) {
            // Case: { errors: { field: "message" } }
            this.error = Object.values(errorBody.errors).join('. ');
          } else if (errorBody.message) {
            // Case: { message: "Something went wrong" }
            this.error = errorBody.message;
          } else {
            // Case: { field: "message" } directly
            const messages = Object.values(errorBody).filter(v => typeof v === 'string');
            if (messages.length > 0) {
              this.error = messages.join('. ');
            } else {
              this.error = 'An error occurred while saving the task.';
            }
          }
        } else if (typeof errorBody === 'string' && errorBody) {
          this.error = errorBody;
        } else {
          this.error = 'An error occurred while saving the task.';
        }
      }
    });
  }


  cancel(): void {
    this.onCancel.emit();
  }
}
