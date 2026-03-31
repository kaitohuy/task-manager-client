import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ActivityLogService } from '@core/services/activity-log.service';
import { ProjectService } from '@core/services/project.service';
import { AuthService } from '@core/services/auth.service';
import { ActivityLogDTO, ActivityAction, ActivityType } from '@models/index';
import { finalize, switchMap, of } from 'rxjs';

@Component({
  selector: 'app-activity-logs',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './activity-logs.component.html',
  styleUrl: './activity-logs.component.scss'
})
export class ActivityLogsComponent implements OnInit {
  logs: ActivityLogDTO[] = [];
  isLoading = true;
  error: string | null = null;

  currentPage = 0;
  pageSize = 20;
  totalPages = 0;
  sort = 'createdAt,desc';

  get role(): 'ADMIN' | 'MANAGER' | 'MEMBER' {
    if (this.authService.hasRole('ADMIN')) return 'ADMIN';
    if (this.authService.hasRole('MANAGER')) return 'MANAGER';
    return 'MEMBER';
  }

  get pageRange(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i);
  }

  constructor(
    private logService: ActivityLogService,
    private projectService: ProjectService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadLogs();
  }

  loadLogs(): void {
    this.isLoading = true;
    this.error = null;

    if (this.role === 'ADMIN') {
      this.logService.getAllLogs(this.currentPage, this.pageSize, this.sort)
        .pipe(finalize(() => this.isLoading = false))
        .subscribe({ next: res => this.handleResult(res), error: () => this.handleError() });

    } else if (this.role === 'MANAGER') {
      // Fetch all project IDs first, then load logs
      this.projectService.getMyProjects(0, 100)
        .pipe(
          switchMap(res => {
            const ids = (res?.content || []).map((p: any) => p.id);
            if (ids.length === 0) return of(null);
            return this.logService.getManagerLogs(ids, this.currentPage, this.pageSize, this.sort);
          }),
          finalize(() => this.isLoading = false)
        )
        .subscribe({ next: res => this.handleResult(res), error: () => this.handleError() });

    } else {
      this.logService.getMyLogs(this.currentPage, this.pageSize, this.sort)
        .pipe(finalize(() => this.isLoading = false))
        .subscribe({ next: res => this.handleResult(res), error: () => this.handleError() });
    }
  }

  private handleResult(res: any): void {
    if (!res) { this.logs = []; return; }
    this.logs = res.content || [];
    this.totalPages = res.totalPages ?? 0;
  }

  private handleError(): void {
    this.error = 'Failed to load activity logs.';
  }

  goToPage(page: number): void {
    this.currentPage = page;
    this.loadLogs();
  }

  onSortChange(): void {
    this.currentPage = 0;
    this.loadLogs();
  }

  /** Return icon + color config based on action */
  getActionStyle(action: ActivityAction): { color: string; bg: string; icon: string } {
    switch (action) {
      case 'CREATE':     return { color: 'text-emerald-700', bg: 'bg-emerald-100', icon: 'M12 4v16m8-8H4' };
      case 'UPDATE':     return { color: 'text-blue-700',    bg: 'bg-blue-100',    icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z' };
      case 'DELETE':     return { color: 'text-rose-700',    bg: 'bg-rose-100',    icon: 'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16' };
      case 'ASSIGN':     return { color: 'text-violet-700',  bg: 'bg-violet-100',  icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' };
      case 'STATUS_CHANGE': return { color: 'text-amber-700', bg: 'bg-amber-100', icon: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15' };
      case 'COMMENT':    return { color: 'text-cyan-700',    bg: 'bg-cyan-100',    icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z' };
      default:           return { color: 'text-amber-700',   bg: 'bg-amber-100',   icon: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15' };
    }
  }

  getTypeLabel(type: ActivityType): string {
    const map: Record<ActivityType, string> = {
      TASK: 'Task', PROJECT: 'Project', USER: 'User', MEMBER: 'Member',
      MEETING: 'Meeting', COMMENT: 'Comment', ATTACHMENT: 'Attachment', AUTH: 'Auth'
    };
    return map[type] ?? type;
  }

  getTypeBadgeClass(type: ActivityType): string {
    const map: Record<ActivityType, string> = {
      TASK: 'bg-blue-50 text-blue-700 ring-blue-200',
      PROJECT: 'bg-violet-50 text-violet-700 ring-violet-200',
      USER: 'bg-amber-50 text-amber-700 ring-amber-200',
      MEMBER: 'bg-pink-50 text-pink-700 ring-pink-200',
      MEETING: 'bg-cyan-50 text-cyan-700 ring-cyan-200',
      COMMENT: 'bg-teal-50 text-teal-700 ring-teal-200',
      ATTACHMENT: 'bg-orange-50 text-orange-700 ring-orange-200',
      AUTH: 'bg-slate-50 text-slate-700 ring-slate-200'
    };
    return map[type] ?? 'bg-slate-50 text-slate-700';
  }
}
