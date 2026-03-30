import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { forkJoin, of, catchError, map, switchMap, tap, Subscription } from 'rxjs';
import { KanbanBoardComponent } from '@features/dashboard/components/kanban-board/kanban-board.component';
import { TaskDetailPanelComponent } from '@shared/components/task-detail-panel/task-detail-panel.component';
import { FormsModule } from '@angular/forms';
import { TaskService } from '@core/services/task.service';
import { ProjectService } from '@core/services/project.service';
import { AuthService } from '@core/services/auth.service';
import { TaskDTO, ProjectDTO } from '@models/index';
import { WebsocketService } from '@core/services/websocket.service';
import { StompSubscription } from '@stomp/stompjs';

@Component({
  selector: 'app-my-tasks',
  standalone: true,
  imports: [CommonModule, KanbanBoardComponent, FormsModule, TaskDetailPanelComponent],
  templateUrl: './my-tasks.component.html',
  styleUrl: './my-tasks.component.scss'
})
export class MyTasksComponent implements OnInit, OnDestroy {
  projects: ProjectDTO[] = [];
  allTasks: TaskDTO[] = [];
  isLoading = false;
  error: string | null = null;
  selectedTask: TaskDTO | null = null;
  
  searchQuery = '';
  statusFilter = 'all';
  sortBy = 'deadline-asc';

  private projectSubscriptions: StompSubscription[] = [];
  private taskStreamSubscription: Subscription = new Subscription();

  constructor(
    private taskService: TaskService,
    private projectService: ProjectService,
    private authService: AuthService,
    private wsService: WebsocketService
  ) {}

  ngOnInit() {
    this.loadData();
    this.taskService.taskRefresh$.subscribe(() => {
      this.loadData(true);
    });

    this.taskStreamSubscription.add(
      this.wsService.getTaskStream().subscribe(newTask => {
        const currentUserId = this.authService.currentUser()?.id;
        const index = this.allTasks.findIndex(t => t.id === newTask.id);
        
        if (newTask.assignee?.id === currentUserId) {
          if (index !== -1) {
            // Update existing task
            this.allTasks[index] = newTask;
          } else {
            // New task assigned to me
            this.allTasks.push(newTask);
          }
          this.allTasks = [...this.allTasks];
        } else if (index !== -1) {
          // Was assigned to me, but no longer is
          this.allTasks.splice(index, 1);
          this.allTasks = [...this.allTasks];
        }
      })
    );

    this.taskStreamSubscription.add(
      this.wsService.getTaskDeleteStream().subscribe(deletedTaskId => {
        this.allTasks = this.allTasks.filter(t => t.id !== deletedTaskId);
      })
    );
  }

  ngOnDestroy(): void {
    this.unsubscribeAllProjects();
    if (this.taskStreamSubscription) {
      this.taskStreamSubscription.unsubscribe();
    }
  }

  private subscribeToAllProjects(): void {
    this.unsubscribeAllProjects();
    this.wsService.connect();
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

  private unsubscribeAllProjects(): void {
    this.projectSubscriptions.forEach(sub => sub.unsubscribe());
    this.projectSubscriptions = [];
  }

  loadData(silent: boolean = false) {
    this.error = null;
    if (!silent) {
      this.isLoading = true;
    }

    this.projectService.getMyProjects(0, 50).pipe(
      tap(projectResult => {
        this.projects = projectResult.content;
        this.subscribeToAllProjects();
      }),
      switchMap(projectResult => {
        if (!projectResult.content.length) {
          return of<TaskDTO[][]>([]);
        }

        const tasksRequests = projectResult.content.map(project =>
          this.taskService.getTasksByProject(project.id, 0, 50).pipe(
            map(page => page.content),
            catchError(() => of<TaskDTO[]>([]))
          )
        );

        return forkJoin(tasksRequests);
      }),
      map(projectTasks => projectTasks.flat()),
      tap(tasks => {
        this.allTasks = tasks;
      }),
      catchError(error => {
        console.error(error);
        this.error = 'Failed to load tasks';
        return of<TaskDTO[]>([]);
      }),
      tap(() => {
        this.isLoading = false;
      })
    ).subscribe();
  }

  get myTasks(): TaskDTO[] {
    const currentUserId = this.authService.currentUser()?.id;
    if (!currentUserId) return [];
    
    // Lọc lại các Tasks mà User đang được assign
    return this.allTasks.filter(t => t.assignee?.id === currentUserId);
  }

  get filteredAndSortedTasks(): TaskDTO[] {
    let filtered = [...this.myTasks];

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

    // Sort
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
