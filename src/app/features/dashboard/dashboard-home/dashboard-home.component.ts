import { Component, OnInit, signal, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { forkJoin, of, catchError, map, switchMap, tap, Observable, finalize, Subscription } from 'rxjs';
import { TaskService } from '@core/services/task.service';
import { ProjectService } from '@core/services/project.service';
import { AuthService } from '@core/services/auth.service';
import { DashboardService } from '@core/services/dashboard.service';
import { TaskDTO, ProjectDTO, AdminDashboardStatsDTO, ManagerDashboardStatsDTO } from '@models/index';

import { FormsModule } from '@angular/forms';
import { KanbanBoardComponent } from '@features/dashboard/components/kanban-board/kanban-board.component';
import { TaskDetailPanelComponent } from '@shared/components/task-detail-panel/task-detail-panel.component';
import { WebsocketService } from '@core/services/websocket.service';
import { StompSubscription } from '@stomp/stompjs';

@Component({
  selector: 'app-dashboard-home',
  standalone: true,
  imports: [CommonModule, KanbanBoardComponent, FormsModule, TaskDetailPanelComponent],
  templateUrl: './dashboard-home.component.html',
  styleUrl: './dashboard-home.component.scss'
})
export class DashboardHomeComponent implements OnInit, OnDestroy {
  projects: ProjectDTO[] = [];
  tasks: TaskDTO[] = [];
  isLoading = false;
  error: string | null = null;
  selectedTask: TaskDTO | null = null;
  
  stats = signal<AdminDashboardStatsDTO | null>(null);
  managerStats = signal<ManagerDashboardStatsDTO | null>(null);

  searchQuery = '';
  statusFilter = 'all';
  sortBy = 'deadline-asc';

  private projectSubscriptions: StompSubscription[] = [];
  private taskStreamSubscription: Subscription | null = null;
  private adminStatsWsSubscription: StompSubscription | null = null;
  private managerStatsWsSubscription: StompSubscription | null = null;
  private statsStreamSubscription: Subscription = new Subscription();

  constructor(
    private projectService: ProjectService,
    private taskService: TaskService,
    private authService: AuthService,
    private dashboardService: DashboardService,
    private wsService: WebsocketService
  ) {}

  ngOnInit() {
    this.loadDashboardData();
    if (this.authService.hasRole('ADMIN')) {
      this.loadStats();
    } else if (this.authService.hasRole('MANAGER')) {
      this.loadManagerStats();
    }

    this.taskService.taskRefresh$.subscribe(() => {
      this.loadDashboardData(true);
    });

    this.taskStreamSubscription = this.wsService.getTaskStream().subscribe(newTask => {
      // Update existing task or add new one
      const index = this.tasks.findIndex(t => t.id === newTask.id);
      if (index !== -1) {
        this.tasks[index] = newTask;
        this.tasks = [...this.tasks];
      } else {
        this.tasks = [...this.tasks, newTask];
      }
    });

    this.statsStreamSubscription.add(
      this.wsService.getTaskDeleteStream().subscribe(deletedTaskId => {
        this.tasks = this.tasks.filter(t => t.id !== deletedTaskId);
      })
    );

    this.setupDashboardRealTimeStats();
  }

  private setupDashboardRealTimeStats() {
    this.wsService.connect();
    
    if (this.authService.hasRole('ADMIN')) {
      this.statsStreamSubscription.add(
        this.wsService.getAdminStatsStream().subscribe(stats => this.stats.set(stats))
      );
      setTimeout(() => {
        this.adminStatsWsSubscription = this.wsService.subscribeToAdminStats();
      }, 1500);
    } else if (this.authService.hasRole('MANAGER')) {
      this.statsStreamSubscription.add(
        this.wsService.getManagerStatsStream().subscribe(stats => this.managerStats.set(stats))
      );
      setTimeout(() => {
        this.managerStatsWsSubscription = this.wsService.subscribeToManagerStats();
      }, 1500);
    }
  }

  ngOnDestroy() {
    this.unsubscribeAllProjects();
    if (this.taskStreamSubscription) {
      this.taskStreamSubscription.unsubscribe();
    }
    if (this.adminStatsWsSubscription) {
      this.adminStatsWsSubscription.unsubscribe();
    }
    if (this.managerStatsWsSubscription) {
      this.managerStatsWsSubscription.unsubscribe();
    }
    this.statsStreamSubscription.unsubscribe();
  }

  private subscribeToAllProjects() {
    this.unsubscribeAllProjects();
    this.wsService.connect();
    // Wait for connection to be ready before subscribing to multiple topics
    setTimeout(() => {
      this.projects.forEach(p => {
        const sub = this.wsService.subscribeToProjectTasks(p.id);
        if (sub) {
          this.projectSubscriptions.push(sub);
        }
        const delSub = this.wsService.subscribeToProjectTaskDeletions(p.id);
        if (delSub) {
          this.projectSubscriptions.push(delSub);
        }
      });
    }, 1000);
  }

  private unsubscribeAllProjects() {
    this.projectSubscriptions.forEach(sub => sub.unsubscribe());
    this.projectSubscriptions = [];
  }

  loadStats() {
    this.dashboardService.getAdminStats().subscribe({
      next: (res) => this.stats.set(res),
      error: (err) => console.error('Failed to load admin stats', err)
    });
  }

  loadManagerStats() {
    this.dashboardService.getManagerStats().subscribe({
      next: (res) => this.managerStats.set(res),
      error: (err) => console.error('Failed to load manager stats', err)
    });
  }

  loadDashboardData(silent: boolean = false) {
    this.error = null;
    if (!silent) {
      this.isLoading = true;
    }

    if (this.authService.hasRole('ADMIN')) {
      this.projectService.getAllProjects(0, 100).subscribe(res => {
        this.projects = res.content;
        this.subscribeToAllProjects();
      });

      this.taskService.getAllTasks(0, 100).pipe(
        finalize(() => this.isLoading = false),
        tap(res => {
          this.tasks = res.content;
        }),
        catchError(error => {
          this.error = 'Failed to load system dashboard tasks.';
          console.error(error);
          return of(null);
        })
      ).subscribe();
      return;
    }

    this.projectService.getMyProjects(0, 50).pipe(
      map(res => res.content),
      tap(projects => this.projects = projects),
      switchMap((projects: ProjectDTO[]): Observable<TaskDTO[][]> => {
        if (!projects || !projects.length) {
          return of([]);
        }
        const tasksByProject$ = projects.map((project: ProjectDTO) =>
          this.taskService.getTasksByProject(project.id, 0, 50).pipe(
            map(res => res.content),
            catchError(() => of<TaskDTO[]>([]))
          )
        );
        return forkJoin(tasksByProject$);
      }),
      map((parcel: TaskDTO[][]) => parcel.flat()),
      tap(tasks => {
        this.tasks = tasks;
        this.subscribeToAllProjects();
      }),
      catchError(error => {
        this.error = 'Failed to load dashboard data.';
        console.error(error);
        return of<TaskDTO[]>([]);
      }),
      finalize(() => this.isLoading = false)
    ).subscribe();
  }

  getUsername(): string {
    return this.authService.currentUser()?.username || 'User';
  }

  get filteredAndSortedTasks(): TaskDTO[] {
    let filtered = [...this.tasks];

    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      filtered = filtered.filter(task => 
        task.title.toLowerCase().includes(q) || 
        task.description.toLowerCase().includes(q)
      );
    }

    if (this.statusFilter !== 'all') {
      filtered = filtered.filter(task => task.status === this.statusFilter);
    }

    return filtered.sort((a, b) => {
      switch (this.sortBy) {
        case 'deadline-asc':
          return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
        case 'deadline-desc':
          return new Date(b.deadline).getTime() - new Date(a.deadline).getTime();
        case 'priority-high': {
          const order: Record<string, number> = { HIGH: 0, MEDIUM: 1, LOW: 2 };
          return (order[a.priority || 'MEDIUM'] || 99) - (order[b.priority || 'MEDIUM'] || 99);
        }
        case 'created-new':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'created-old':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        default:
          return 0;
      }
    });
  }

  setSearchQuery(q: string) { this.searchQuery = q; }
  setStatusFilter(s: string) { this.statusFilter = s; }
  setSortBy(s: string) { this.sortBy = s; }

  handleTaskClick(task: TaskDTO) {
    this.selectedTask = task;
  }

  closeTaskDetail() {
    this.selectedTask = null;
  }
}
