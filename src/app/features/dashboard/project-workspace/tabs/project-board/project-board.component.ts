import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { TaskService } from '@core/services/task.service';
import { TaskDTO } from '@models/index';
import { FormsModule } from '@angular/forms';
import { KanbanBoardComponent } from '@features/dashboard/components/kanban-board/kanban-board.component';
import { TaskDetailPanelComponent } from '@shared/components/task-detail-panel/task-detail-panel.component';
import { WebsocketService } from '@core/services/websocket.service';
import { StompSubscription } from '@stomp/stompjs';
import { finalize, Subscription as RxSubscription } from 'rxjs';

@Component({
  selector: 'app-project-board',
  standalone: true,
  imports: [CommonModule, FormsModule, KanbanBoardComponent, TaskDetailPanelComponent],
  templateUrl: './project-board.component.html',
  styleUrl: './project-board.component.scss'
})
export class ProjectBoardComponent implements OnInit, OnDestroy {
  projectId!: number;
  tasks: TaskDTO[] = [];
  isLoading = true;
  error: string | null = null;
  selectedTask: TaskDTO | null = null;

  // Filter states
  searchQuery = '';
  statusFilter = 'all';
  sortBy = 'deadline,asc';

  private projectSubscriptions: StompSubscription[] = [];
  private taskStreamSubscription: RxSubscription | null = null;
  private taskDeleteStreamSubscription: RxSubscription | null = null;

  constructor(
    private route: ActivatedRoute,
    private taskService: TaskService,
    private wsService: WebsocketService
  ) {}

  ngOnInit(): void {
    // Get projectId from parent route (project-workspace)
    this.route.parent?.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.projectId = +id;
        this.loadTasks();
        this.subscribeToProjectWs(this.projectId);
      }
    });

    // Subscribe to task refresh events from TaskService
    this.taskService.taskRefresh$.subscribe(() => {
      if (this.projectId) {
        this.loadTasks(true);
      }
    });

    this.taskStreamSubscription = this.wsService.getTaskStream().subscribe(newTask => {
      if (this.projectId && newTask.projectId === this.projectId) {
        const index = this.tasks.findIndex(t => t.id === newTask.id);
        if (index !== -1) {
          // Update existing task
          this.tasks[index] = newTask;
          this.tasks = [...this.tasks];
        } else {
          // Add new task
          this.tasks = [...this.tasks, newTask];
        }
      }
    });

    this.taskDeleteStreamSubscription = this.wsService.getTaskDeleteStream().subscribe(deletedTaskId => {
      this.tasks = this.tasks.filter(t => t.id !== deletedTaskId);
    });

    // Handle deep-linking to task detail panel
    this.route.queryParams.subscribe(params => {
      const taskIdToOpen = params['taskId'];
      if (taskIdToOpen) {
        // Try to find in current list
        this.openTaskById(+taskIdToOpen);
      }
    });
  }

  private openTaskById(id: number): void {
    if (this.tasks.length > 0) {
      const task = this.tasks.find(t => t.id === id);
      if (task) {
        this.selectedTask = task;
      }
    }
  }

  ngOnDestroy(): void {
    this.unsubscribeWs();
    if (this.taskStreamSubscription) {
      this.taskStreamSubscription.unsubscribe();
    }
    if (this.taskDeleteStreamSubscription) {
      this.taskDeleteStreamSubscription.unsubscribe();
    }
  }

  private subscribeToProjectWs(projectId: number): void {
    this.unsubscribeWs(); // Unsubscribe existing project-specific subscriptions
    this.wsService.connect();
    setTimeout(() => {
      const taskSub = this.wsService.subscribeToProjectTasks(projectId);
      if (taskSub) {
        this.projectSubscriptions.push(taskSub);
      }
      const deleteSub = this.wsService.subscribeToProjectTaskDeletions(projectId);
      if (deleteSub) {
        this.projectSubscriptions.push(deleteSub);
      }
    }, 1000);
  }

  private unsubscribeWs(): void {
    this.projectSubscriptions.forEach(sub => sub.unsubscribe());
    this.projectSubscriptions = [];
  }

  loadTasks(silent: boolean = false): void {
    if (!silent) {
      this.isLoading = true;
    }
    this.error = null;
    this.taskService.getTasksByProject(this.projectId, 0, 100, this.sortBy)
      .pipe(finalize(() => {
        if (!silent) {
          this.isLoading = false;
        }
      }))
      .subscribe({
        next: (page) => {
          this.tasks = page.content;
          // Check if we need to open a task from query params after load
          const taskId = this.route.snapshot.queryParamMap.get('taskId');
          if (taskId) {
            this.openTaskById(+taskId);
          }
        },
        error: (err) => {
          this.error = 'Failed to load project tasks.';
          console.error(err);
        }
      });
  }

  get filteredAndSortedTasks(): TaskDTO[] {
    let result = [...this.tasks];

    // Status filter
    if (this.statusFilter !== 'all') {
      result = result.filter(t => t.status === this.statusFilter);
    }

    // Search filter
    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      result = result.filter(t => 
        t.title.toLowerCase().includes(q) || 
        t.description?.toLowerCase().includes(q)
      );
    }

    return result;
  }

  setSearchQuery(q: string) { this.searchQuery = q; }
  setStatusFilter(s: string) { this.statusFilter = s; }
  setSortBy(s: string) { 
    this.sortBy = s;
    this.loadTasks(); 
  }

  onTaskClick(task: TaskDTO): void {
    this.selectedTask = task;
  }

  closeTaskDetail(): void {
    this.selectedTask = null;
  }
}
