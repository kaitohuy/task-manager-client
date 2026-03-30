import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { ProjectService } from '@core/services/project.service';
import { TaskService } from '@core/services/task.service';
import { AuthService } from '@core/services/auth.service';
import { ProjectDTO, ProjectMemberDTO, TaskDTO } from '@models/index';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-project-workspace',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './project-workspace.component.html',
  styleUrl: './project-workspace.component.scss'
})
export class ProjectWorkspaceComponent implements OnInit {
  projectId!: number;
  project: ProjectDTO | null = null;
  members: ProjectMemberDTO[] = [];
  isLoading = true;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private projectService: ProjectService,
    private taskService: TaskService,
    private authService: AuthService
  ) {}

  get isMember(): boolean {
    return this.authService.hasRole('MEMBER');
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.projectId = +id;
        this.loadProjectData();
      }
    });

  }

  loadProjectData(): void {
    this.isLoading = true;
    forkJoin({
      project: this.projectService.getProjectById(this.projectId),
      members: this.projectService.getProjectMembers(this.projectId)
    }).subscribe({
      next: (res: any) => {
        this.project = res.project;
        this.members = Array.isArray(res.members) ? res.members : (res.members?.content || []);
        this.isLoading = false;
      },
      error: () => this.isLoading = false
    });
  }

  openTaskModal(): void {
    this.taskService.requestCreateTask(this.projectId);
  }

  onTaskCreated(): void {
    this.taskService.notifyTaskRefresh();
  }
}
