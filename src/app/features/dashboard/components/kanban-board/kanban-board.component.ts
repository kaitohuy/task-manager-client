import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TaskDTO, TaskStatus } from '@models/index';
import { KanbanColumnComponent } from '@features/dashboard/components/kanban-column/kanban-column.component';
import { DragDropModule, CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { TaskService } from '@core/services/task.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-kanban-board',
  standalone: true,
  imports: [CommonModule, KanbanColumnComponent, DragDropModule],
  templateUrl: './kanban-board.component.html',
  styleUrl: './kanban-board.component.scss'
})
export class KanbanBoardComponent implements OnChanges {
  @Input() tasks: TaskDTO[] = [];
  @Output() onTaskClick = new EventEmitter<TaskDTO>();
  @Output() onTaskStatusChange = new EventEmitter<void>();

  constructor(private taskService: TaskService) {}

  statuses: Array<{ status: TaskStatus; label: string }> = [
    { status: 'TODO', label: 'To Do' },
    { status: 'IN_PROGRESS', label: 'In Progress' },
    { status: 'DONE', label: 'Done' },
    { status: 'PAUSED', label: 'Paused' },
    { status: 'CANCELLED', label: 'Cancelled' },
  ];

  columns: Array<{ title: string; status: TaskStatus; tasks: TaskDTO[]; bgClass: string; textClass: string; badgeClass: string; }> = [
    { title: 'To Do', status: 'TODO', tasks: [], bgClass: 'bg-blue-50 border border-blue-200', textClass: 'text-blue-600', badgeClass: 'bg-blue-100' },
    { title: 'In Progress', status: 'IN_PROGRESS', tasks: [], bgClass: 'bg-purple-100 border border-purple-200', textClass: 'text-purple-600', badgeClass: 'bg-purple-100' },
    { title: 'Done', status: 'DONE', tasks: [], bgClass: 'bg-emerald-100 border border-emerald-200', textClass: 'text-emerald-600', badgeClass: 'bg-emerald-100' },
    { title: 'Paused', status: 'PAUSED', tasks: [], bgClass: 'bg-orange-100 border border-orange-200', textClass: 'text-orange-600', badgeClass: 'bg-orange-100' },
    { title: 'Cancelled', status: 'CANCELLED', tasks: [], bgClass: 'bg-rose-100 border border-rose-200', textClass: 'text-rose-600', badgeClass: 'bg-rose-100' }
  ];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['tasks']) {
      this.distributeTasks();
    }
  }

  distributeTasks(): void {
    this.columns.forEach(col => {
      col.tasks = this.tasks.filter(t => t.status === col.status).sort((a,b) => {
         // optional standard sort if needed, but filter is enough
         return 0;
      });
    });
  }

  onDrop(event: CdkDragDrop<TaskDTO[]>): void {
    if (event.previousContainer === event.container) {
      // Re-ordering within same column (not implemented in backend, so just front-end visual)
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      const task = event.item.data as TaskDTO;
      const oldStatus = task.status;
      const newStatus = event.container.id as TaskStatus;

      // 1. Optimistic UI update: move item visually immediately
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
      
      // Update local object
      task.status = newStatus;

      // 2. Call API to persist
      this.taskService.updateTaskStatus(task.id, newStatus, task.version).subscribe({
        next: (updatedTask) => {
          task.version = updatedTask.version;
          this.onTaskStatusChange.emit();
          // We can notify refresh so parent re-syncs
          this.taskService.notifyTaskRefresh();
          Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'success',
            title: 'Đã cập nhật trạng thái',
            showConfirmButton: false,
            timer: 2000
          });
        },
        error: (err) => {
          // 3. Revert if API fails
          transferArrayItem(
            event.container.data,
            event.previousContainer.data,
            event.currentIndex,
            event.previousIndex
          );
          task.status = oldStatus;
          
          if (err.status === 409) {
            Swal.fire({
              toast: true,
              position: 'top-end',
              icon: 'error',
              title: 'Lỗi đồng bộ! Task đã bị thay đổi, vui lòng tải lại.',
              showConfirmButton: false,
              timer: 3000
            });
            this.taskService.notifyTaskRefresh();
          } else {
            Swal.fire({
              toast: true,
              position: 'top-end',
              icon: 'error',
              title: 'Lỗi cập nhật trạng thái! Đã hoàn tác.',
              showConfirmButton: false,
              timer: 3000
            });
          }
        }
      });
    }
  }
}
