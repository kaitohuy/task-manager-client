import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationResponseDTO, NotificationType } from '@models/notification.model';

@Component({
  selector: 'app-notification-item',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div (click)="onClick()" 
         class="flex gap-4 p-4 hover:bg-slate-50 cursor-pointer transition-all border-b border-slate-100 last:border-none relative group"
         [class.bg-blue-50/40]="!notification.isRead">
      <!-- Unread Indicator (Bar) -->
      <div *ngIf="!notification.isRead" class="absolute left-0 top-0 bottom-0 w-1 bg-blue-600"></div>

      <!-- Avatar/Icon -->
      <div class="relative shrink-0">
        <img [src]="getAvatarUrl()" 
             class="h-12 w-12 rounded-full object-cover border-2 border-slate-100 shadow-sm group-hover:border-blue-200 transition-colors" 
             [alt]="notification.senderUsername">
             
        <!-- Type Badge -->
        <div class="absolute -bottom-1 -right-1 h-6 w-6 rounded-full flex items-center justify-center shadow-md border-2 border-white transition-transform group-hover:scale-110"
             [ngClass]="getTypeClass()">
           <ng-container [ngSwitch]="notification.type">
             <svg *ngSwitchCase="'PROJECT_INVITE'" class="h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"><path d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/></svg>
             <svg *ngSwitchCase="'TASK_ASSIGNED'" class="h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"><path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
             <svg *ngSwitchCase="'TASK_STATUS_CHANGED'" class="h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"><path d="M9 12l2 2 4-4m6 2a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"/></svg>
             <svg *ngSwitchCase="'NEW_COMMENT'" class="h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"><path d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/></svg>
             <svg *ngSwitchCase="'FILE_UPLOAD'" class="h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"><path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>
           </ng-container>
        </div>
      </div>

      <!-- Content -->
      <div class="flex-1 min-w-0 pt-0.5">
        <div class="flex items-center justify-between mb-1">
          <p class="text-[13px] font-black text-slate-900 truncate tracking-tight">{{ notification.senderUsername || 'System' }}</p>
          <span class="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{{ formatTime(notification.createdAt) }}</span>
        </div>
        <p class="text-[13px] text-slate-600 line-clamp-2 leading-snug font-medium">
          {{ notification.message }}
        </p>
        <div *ngIf="!notification.isRead" class="mt-2.5 flex items-center gap-1.5">
           <div class="h-2 w-2 rounded-full bg-blue-600 shadow-[0_0_8px_rgba(37,99,235,0.6)]"></div>
           <span class="text-[10px] font-black text-blue-600 uppercase tracking-widest">New</span>
        </div>
      </div>

      <!-- Actions -->
      <div class="hidden group-hover:flex items-center absolute right-4 top-1/2 -translate-y-1/2">
        <button (click)="onDelete($event)"
                class="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                title="Delete notification">
          <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
        </button>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
  `]
})
export class NotificationItemComponent {
  @Input({ required: true }) notification!: NotificationResponseDTO;
  @Output() navigate = new EventEmitter<NotificationResponseDTO>();
  @Output() delete = new EventEmitter<number>();

  getAvatarUrl(): string {
    if (this.notification.senderAvatar) return this.notification.senderAvatar;
    
    // Fallback based on gender or role
    if (this.notification.senderGender === 'FEMALE') return 'images/female_avatar.png';
    if (this.notification.senderGender === 'MALE') return 'images/male_avatar.png';
    
    // Fallback based on role if gender not available
    if (this.notification.senderRole === 'ADMIN') return 'images/male_avatar.png';
    if (this.notification.senderRole === 'MANAGER') return 'images/male_avatar.png';
    
    return 'images/male_avatar.png'; // Default
  }

  getTypeClass(): string {
    switch(this.notification.type) {
      case NotificationType.PROJECT_INVITE: return 'bg-cyan-500';
      case NotificationType.TASK_ASSIGNED: return 'bg-blue-600';
      case NotificationType.TASK_STATUS_CHANGED: return 'bg-amber-500';
      case NotificationType.NEW_COMMENT: return 'bg-emerald-500';
      case NotificationType.FILE_UPLOAD: return 'bg-indigo-500';
      default: return 'bg-slate-500';
    }
  }

  formatTime(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return date.toLocaleDateString();
  }

  onClick(): void {
    this.navigate.emit(this.notification);
  }

  onDelete(event: Event): void {
    event.stopPropagation();
    this.delete.emit(this.notification.id);
  }
}
