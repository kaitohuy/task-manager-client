import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { ActivityLogDTO, ActivityType, Page } from '@models/index';

@Injectable({
  providedIn: 'root'
})
export class ActivityLogService {
  constructor(private apiService: ApiService) {}

  /** Member: my personal logs */
  getMyLogs(page = 0, size = 20, sort = 'createdAt,desc'): Observable<Page<ActivityLogDTO>> {
    return this.apiService.get<Page<ActivityLogDTO>>('/api/activities/me', { page, size, sort });
  }

  /** Admin: all system logs */
  getAllLogs(page = 0, size = 20, sort = 'createdAt,desc'): Observable<Page<ActivityLogDTO>> {
    return this.apiService.get<Page<ActivityLogDTO>>('/api/activities/admin', { page, size, sort });
  }

  /** Manager: logs for given project IDs */
  getManagerLogs(projectIds: number[], page = 0, size = 20, sort = 'createdAt,desc'): Observable<Page<ActivityLogDTO>> {
    return this.apiService.get<Page<ActivityLogDTO>>('/api/activities/manager', { projectIds, page, size, sort });
  }

  /** Entity-level logs (e.g. logs for a specific task or project) */
  getByEntity(type: ActivityType, entityId: number, page = 0, size = 20): Observable<Page<ActivityLogDTO>> {
    return this.apiService.get<Page<ActivityLogDTO>>('/api/activities/entity', { type, entityId, page, size });
  }
}
