import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AttachmentResponseDTO, CreateAttachmentDTO } from '@models/index';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TaskAttachmentService {
  private apiUrl = `${environment.apiUrl}/api`;

  constructor(private http: HttpClient) {}

  getAttachments(taskId: number): Observable<AttachmentResponseDTO[]> {
    return this.http.get<AttachmentResponseDTO[]>(`${this.apiUrl}/tasks/${taskId}/attachments`);
  }

  addAttachment(taskId: number, request: CreateAttachmentDTO): Observable<AttachmentResponseDTO> {
    return this.http.post<AttachmentResponseDTO>(`${this.apiUrl}/tasks/${taskId}/attachments`, request);
  }

  uploadFile(taskId: number, file: File): Observable<AttachmentResponseDTO> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<AttachmentResponseDTO>(`${this.apiUrl}/tasks/${taskId}/attachments/upload`, formData);
  }

  deleteAttachment(attachmentId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/attachments/${attachmentId}`);
  }
}
