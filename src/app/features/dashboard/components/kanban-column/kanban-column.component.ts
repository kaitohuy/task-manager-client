import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TaskDTO, TaskStatus } from '@models/index';
import { TaskCardComponent } from '@features/dashboard/components/task-card/task-card.component';
import { EmptyStateComponent } from '@shared/components/empty-state/empty-state.component';
import { CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';

@Component({
  selector: 'app-kanban-column',
  standalone: true,
  imports: [CommonModule, TaskCardComponent, EmptyStateComponent, DragDropModule],
  templateUrl: './kanban-column.component.html',
  styleUrl: './kanban-column.component.scss'
})
export class KanbanColumnComponent {
  @Input() status!: TaskStatus;
  @Input() label: string = '';
  @Input() tasks: TaskDTO[] = [];
  @Input() bgClass: string = '';
  @Input() textClass: string = '';
  @Input() badgeClass: string = '';
  @Output() onTaskClick = new EventEmitter<TaskDTO>();
  @Output() onDrop = new EventEmitter<CdkDragDrop<TaskDTO[]>>();

  statusConfig: Record<TaskStatus, { color: string; bgColor: string }> = {
    TODO: { color: '!bg-blue-100 !text-blue-800 dark:!bg-blue-900 dark:!text-blue-200', bgColor: 'bg-blue-50/50 dark:bg-blue-950/20' },
    IN_PROGRESS: { color: '!bg-purple-100 !text-purple-800 dark:!bg-purple-900 dark:!text-purple-200', bgColor: 'bg-purple-50/50 dark:bg-purple-950/20' },
    DONE: { color: '!bg-green-100 !text-green-800 dark:!bg-green-900 dark:!text-green-200', bgColor: 'bg-green-50/50 dark:bg-green-950/20' },
    PAUSED: { color: '!bg-orange-100 !text-orange-800 dark:!bg-orange-900 dark:!text-orange-200', bgColor: 'bg-orange-50/50 dark:bg-orange-950/20' },
    CANCELLED: { color: '!bg-red-100 !text-red-800 dark:!bg-red-900 dark:!text-red-200', bgColor: 'bg-red-50/50 dark:bg-red-950/20' },
  };

  get colorClass(): string {
    return this.statusConfig[this.status]?.color || '';
  }

  get bgColorClass(): string {
    return this.statusConfig[this.status]?.bgColor || '';
  }
}
