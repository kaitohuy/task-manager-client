import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { TaskDTO } from '@models/index';
import { TaskService } from '@core/services/task.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-task-card',
  standalone: true,
  imports: [CommonModule, DragDropModule],
  providers: [DatePipe],
  templateUrl: './task-card.component.html',
  styleUrl: './task-card.component.scss'
})
export class TaskCardComponent {

  @Input() task!: TaskDTO;
  @Input() itemIndex: number = 0;
  @Input() totalItems: number = 1;
  @Output() onClick = new EventEmitter<TaskDTO>();

  constructor(private datePipe: DatePipe, private taskService: TaskService) { }

  // ================= DATE =================
  get deadlineDate(): Date {
    return this.task?.deadline ? new Date(this.task.deadline) : new Date();
  }

  get isOverdue(): boolean {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const deadline = new Date(this.deadlineDate);
    deadline.setHours(0, 0, 0, 0);

    return deadline.getTime() < now.getTime();
  }

  get isDueSoon(): boolean {
    const now = new Date();
    const deadline = new Date(this.deadlineDate);

    const diffTime = deadline.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays <= 3 && diffDays >= 0;
  }

  // ================= UI =================
  getDeadlineStatusText(): string {
    if (this.isOverdue) return 'Overdue';
    if (this.isDueSoon) return 'Due Soon';
    return 'On Track';
  }

  formatDeadline(date: Date): string {
    return this.datePipe.transform(date, 'dd/MM/yyyy') || '';
  }

  getAssigneeAvatar(): string {
    if (this.task.assignee?.imageUrl) {
      return this.task.assignee.imageUrl;
    }

    const gender = this.task.assignee?.gender || 'MALE';
    return gender === 'FEMALE'
      ? '/images/female_avatar.png'
      : '/images/male_avatar.png';
  }

  onDeleteClick(event: Event): void {
    event.stopPropagation();
    Swal.fire({
      title: 'Xóa Task?',
      text: "Bạn có chắc chắn muốn xóa task này không?",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#94a3b8',
      confirmButtonText: 'Xóa',
      cancelButtonText: 'Hủy'
    }).then((result) => {
      if (result.isConfirmed) {
        this.taskService.deleteTask(this.task.id).subscribe({
          next: () => {
            Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Đã xóa task!', showConfirmButton: false, timer: 2000 });
            this.taskService.notifyTaskRefresh();
          },
          error: () => {
            Swal.fire({ toast: true, position: 'top-end', icon: 'error', title: 'Lỗi khi xóa task', showConfirmButton: false, timer: 2000 });
          }
        });
      }
    });
  }

  onSettingsClick(event: Event): void {
    event.stopPropagation();
    this.taskService.requestEditTask(this.task);
  }

 getCardBackground(): { [key: string]: string } {
  const gradients: Record<string, string> = {
    'TODO':        'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(186,230,255,0.85) 50%, rgba(125,211,252,0.7) 100%)',
    'IN_PROGRESS': 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(233,213,255,0.85) 50%, rgba(196,181,253,0.7) 100%)',
    'DONE':        'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(187,247,208,0.85) 50%, rgba(110,231,183,0.7) 100%)',
    'PAUSED':      'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(254,215,170,0.85) 50%, rgba(253,186,116,0.7) 100%)',
    'CANCELLED':   'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(254,205,211,0.85) 50%, rgba(253,164,175,0.7) 100%)',
  };

  const borders: Record<string, string> = {
    'TODO':        'rgba(125, 211, 252, 0.6)',
    'IN_PROGRESS': 'rgba(196, 181, 253, 0.6)',
    'DONE':        'rgba(110, 231, 183, 0.6)',
    'PAUSED':      'rgba(253, 186, 116, 0.6)',
    'CANCELLED':   'rgba(253, 164, 175, 0.6)',
  };

  const status = this.task.status;
    return {
      'background': gradients[status] ?? 'rgba(255,255,255,0.9)',
      'border-color': borders[status] ?? 'rgba(203,213,225,0.6)',
    };
  }
}