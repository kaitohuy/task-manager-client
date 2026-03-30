import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { AdminDashboardStatsDTO, ManagerDashboardStatsDTO } from '@models/index';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  constructor(private apiService: ApiService) {}

  getAdminStats(): Observable<AdminDashboardStatsDTO> {
    return this.apiService.get<AdminDashboardStatsDTO>('/api/dashboard/admin/stats');
  }

  getManagerStats(): Observable<ManagerDashboardStatsDTO> {
    return this.apiService.get<ManagerDashboardStatsDTO>('/api/dashboard/manager/stats');
  }
}
