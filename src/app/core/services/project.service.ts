import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { CreateProjectDTO, Page, ProjectDTO, ProjectMemberDTO, UserDTO } from '@models/index';

@Injectable({
  providedIn: 'root'
})
export class ProjectService {
  constructor(private apiService: ApiService) {}

  getAllProjects(page: number = 0, size: number = 10, sort: string = 'createdAt,desc'): Observable<Page<ProjectDTO>> {
    return this.apiService.get<Page<ProjectDTO>>('/api/projects', { page, size, sort });
  }

  getMyProjects(page: number = 0, size: number = 10, sort: string = 'createdAt,desc'): Observable<Page<ProjectDTO>> {
    return this.apiService.get<Page<ProjectDTO>>('/api/projects/me', { page, size, sort });
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

  getProjectMembers(projectId: number, page: number = 0, size: number = 100, sort: string = 'joinedAt,desc'): Observable<Page<ProjectMemberDTO> | ProjectMemberDTO[]> {
    return this.apiService.get<Page<ProjectMemberDTO> | ProjectMemberDTO[]>(`/api/projects/${projectId}/members`, { page, size, sort });
  }

  addProjectMember(projectId: number, userId: number, role: string): Observable<ProjectMemberDTO> {
    return this.apiService.post<ProjectMemberDTO>(`/api/projects/${projectId}/members`, { userId, role });
  }

  addProjectMembersBulk(projectId: number, userIds: number[]): Observable<any> {
    return this.apiService.post<any>(`/api/projects/${projectId}/members/bulk`, { userIds });
  }

  removeProjectMember(projectId: number, userId: number): Observable<void> {
    return this.apiService.delete<void>(`/api/projects/${projectId}/members/${userId}`);
  }

  updateProjectMemberRole(projectId: number, userId: number, role: string): Observable<ProjectMemberDTO> {
    return this.apiService.put<ProjectMemberDTO>(`/api/projects/${projectId}/members/${userId}/role`, {}, { role });
  }

  getAvailableUsersToAdd(projectId: number, page: number = 0, size: number = 10, sort: string = 'username,asc'): Observable<Page<UserDTO> | UserDTO[]> {
    return this.apiService.get<Page<UserDTO> | UserDTO[]>(`/api/projects/${projectId}/available-users`, { page, size, sort });
  }
}
