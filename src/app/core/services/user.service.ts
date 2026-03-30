import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { CreateUserDTO, Page, UpdateUserDTO, UserDTO, Gender, UserRole } from '@models/index';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  constructor(private apiService: ApiService) {}

  getCurrentUser(): Observable<UserDTO> {
    return this.apiService.get<UserDTO>('/api/users/me');
  }

  getUserById(id: number): Observable<UserDTO> {
    return this.apiService.get<UserDTO>(`/api/users/${id}`);
  }

  getAllUsers(page: number = 0, size: number = 20): Observable<Page<UserDTO>> {
    return this.apiService.get<Page<UserDTO>>('/api/users', {
      page,
      size
    });
  }

  createUser(payload: CreateUserDTO): Observable<UserDTO> {
    return this.apiService.post<UserDTO>('/api/users', payload);
  }

  updateUser(id: number, payload: UpdateUserDTO): Observable<UserDTO> {
    return this.apiService.put<UserDTO>(`/api/users/${id}`, payload);
  }

  deleteUser(id: number): Observable<void> {
    return this.apiService.delete<void>(`/api/users/${id}`);
  }

  searchAdvancedUsers(keyword?: string, gender?: Gender, role?: UserRole, page: number = 0, size: number = 10): Observable<Page<UserDTO>> {
    const params: any = { page, size };
    if (keyword) params.keyword = keyword;
    if (gender) params.gender = gender;
    if (role) params.role = role;
    
    return this.apiService.get<Page<UserDTO>>('/api/users/search-advanced', params);
  }

  changePassword(id: number, oldPassword: string, newPassword: string): Observable<void> {
    return this.apiService.put<void>(`/api/users/${id}/change-password`, {
      oldPassword,
      newPassword
    });
  }
}
