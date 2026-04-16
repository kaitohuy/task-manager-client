import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CommentResponseDTO, CreateCommentDTO } from '@models/index';
import { environment } from '../../../environments/environment';

export interface PageResponse<T> {
  content: T[];
  pageable: any;
  last: boolean;
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
  sort: any;
  first: boolean;
  numberOfElements: number;
  empty: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class TaskCommentService {
  private apiUrl = `${environment.apiUrl}/api`;

  constructor(private http: HttpClient) {}

  getTopLevelComments(taskId: number, page: number = 0, size: number = 50): Observable<PageResponse<CommentResponseDTO>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sort', 'createdAt,desc'); // Match controller default
    return this.http.get<PageResponse<CommentResponseDTO>>(`${this.apiUrl}/tasks/${taskId}/comments`, { params });
  }

  getReplies(parentId: number, page: number = 0, size: number = 50): Observable<PageResponse<CommentResponseDTO>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sort', 'createdAt,asc');
    return this.http.get<PageResponse<CommentResponseDTO>>(`${this.apiUrl}/comments/${parentId}/replies`, { params });
  }

  addComment(taskId: number, request: CreateCommentDTO): Observable<CommentResponseDTO> {
    return this.http.post<CommentResponseDTO>(`${this.apiUrl}/tasks/${taskId}/comments`, request);
  }

  deleteComment(commentId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/comments/${commentId}`);
  }
}
