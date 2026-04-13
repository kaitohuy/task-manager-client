import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { ApiService } from './api.service';
import { CreateTaskDTO, Page, TaskDTO, TaskStatus, SearchTaskDTO } from '@models/index';

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private taskRefreshSource = new Subject<void>();
  private taskEditRequestSource = new Subject<TaskDTO>();
  private taskCreateRequestSource = new Subject<{projectId?: number, deadline?: string}>();

  taskRefresh$ = this.taskRefreshSource.asObservable();
  taskEditRequest$ = this.taskEditRequestSource.asObservable();
  taskCreateRequest$ = this.taskCreateRequestSource.asObservable();

  constructor(private apiService: ApiService) {}

  notifyTaskRefresh(): void {
    this.taskRefreshSource.next();
  }

  requestCreateTask(projectId?: number, deadline?: string): void {
    this.taskCreateRequestSource.next({ projectId, deadline });
  }

  requestEditTask(task: TaskDTO): void {
    this.taskEditRequestSource.next(task);
  }

  getTasksByProject(projectId: number, page: number = 0, size: number = 100, sort: string = 'id,desc'): Observable<Page<TaskDTO>> {
    return this.apiService.get<Page<TaskDTO>>(`/api/tasks/project/${projectId}`, {
      page,
      size,
      sort
    });
  }

  getTaskById(id: number): Observable<TaskDTO> {
    return this.apiService.get<TaskDTO>(`/api/tasks/${id}`);
  }

  createTask(data: CreateTaskDTO): Observable<TaskDTO> {
    return this.apiService.post<TaskDTO>('/api/tasks', data);
  }

  updateTask(id: number, data: CreateTaskDTO): Observable<TaskDTO> {
    return this.apiService.put<TaskDTO>(`/api/tasks/${id}`, data);
  }

  deleteTask(id: number): Observable<void> {
    return this.apiService.delete<void>(`/api/tasks/${id}`);
  }

  updateTaskStatus(id: number, status: TaskStatus, version?: number): Observable<TaskDTO> {
    return this.apiService.patch<TaskDTO>(`/api/tasks/${id}/status`, null, { status, version });
  }

  searchTasks(projectId: number, keyword: string, page: number = 0, size: number = 10, sort?: string): Observable<Page<TaskDTO>> {
    return this.apiService.get<Page<TaskDTO>>('/api/tasks/search', {
      projectId,
      keyword,
      page, size, sort
    });
  }

  filterTasksByStatus(projectId: number, status: TaskStatus, page: number = 0, size: number = 10, sort?: string): Observable<Page<TaskDTO>> {
    return this.apiService.get<Page<TaskDTO>>('/api/tasks/filter', {
      projectId,
      status,
      page, size, sort
    });
  }

  getAllTasks(page: number = 0, size: number = 20, sort?: string): Observable<Page<TaskDTO>> {
    return this.apiService.get<Page<TaskDTO>>('/api/tasks', { page, size, sort });
  }
}
