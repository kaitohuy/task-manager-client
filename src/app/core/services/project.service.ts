import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { CreateProjectDTO, Page, ProjectDTO, ProjectMemberDTO, UserDTO } from '@models/index';

@Injectable({
  providedIn: 'root'
})
export class ProjectService {
  constructor(private apiService: ApiService) {}

  getAllProjects(page: number = 0, size: number = 10): Observable<Page<ProjectDTO>> {
    return this.apiService.get<Page<ProjectDTO>>('/api/projects', { page, size });
  }

  getMyProjects(page: number = 0, size: number = 10): Observable<Page<ProjectDTO>> {
    return this.apiService.get<Page<ProjectDTO>>('/api/projects/me', { page, size });
  }

  getProjectById(id: number): Observable<ProjectDTO> {
    return this.apiService.get<ProjectDTO>(`/api/projects/${id}`);
  }

  createProject(data: CreateProjectDTO): Observable<ProjectDTO> {
    return this.apiService.post<ProjectDTO>('/api/projects', data);
  }

  updateProject(id: number, data: CreateProjectDTO): Observable<ProjectDTO> {
    return this.apiService.put<ProjectDTO>(`/api/projects/${id}`, data);
  }

  deleteProject(id: number): Observable<void> {
    return this.apiService.delete<void>(`/api/projects/${id}`);
  }

  getProjectMembers(projectId: number): Observable<ProjectMemberDTO[]> {
    return this.apiService.get<ProjectMemberDTO[]>(`/api/projects/${projectId}/members`);
  }

  addProjectMember(projectId: number, userId: number, role: string): Observable<ProjectMemberDTO> {
    return this.apiService.post<ProjectMemberDTO>(`/api/projects/${projectId}/members`, { userId, role });
  }

  removeProjectMember(projectId: number, userId: number): Observable<void> {
    return this.apiService.delete<void>(`/api/projects/${projectId}/members/${userId}`);
  }

  updateProjectMemberRole(projectId: number, userId: number, role: string): Observable<ProjectMemberDTO> {
    return this.apiService.put<ProjectMemberDTO>(`/api/projects/${projectId}/members/${userId}/role`, {}, { role });
  }

  getAvailableUsersToAdd(projectId: number): Observable<UserDTO[]> {
    return this.apiService.get<UserDTO[]>(`/api/projects/${projectId}/available-users`);
  }
}
