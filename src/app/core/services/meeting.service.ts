import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { ApiService } from './api.service';
import { CreateMeetingDTO, MeetingResponseDTO } from '@models/index';

@Injectable({
  providedIn: 'root'
})
export class MeetingService {
  private meetingRefreshSource = new Subject<void>();
  private meetingCreateRequestSource = new Subject<{projectId?: number, startTime?: string}>();

  meetingRefresh$ = this.meetingRefreshSource.asObservable();
  meetingCreateRequest$ = this.meetingCreateRequestSource.asObservable();

  constructor(private apiService: ApiService) {}

  notifyMeetingRefresh(): void {
    this.meetingRefreshSource.next();
  }

  requestCreateMeeting(projectId?: number, startTime?: string): void {
    this.meetingCreateRequestSource.next({ projectId, startTime });
  }

  createMeeting(data: CreateMeetingDTO): Observable<MeetingResponseDTO> {
    return this.apiService.post<MeetingResponseDTO>('/api/meetings', data);
  }

  getMeetingsByProject(projectId: number): Observable<MeetingResponseDTO[]> {
    return this.apiService.get<MeetingResponseDTO[]>(`/api/meetings/project/${projectId}`);
  }

  deleteMeeting(id: number): Observable<void> {
    return this.apiService.delete<void>(`/api/meetings/${id}`);
  }

  updateMeeting(id: number, request: any): Observable<MeetingResponseDTO> {
    return this.apiService.patch<MeetingResponseDTO>(`/api/meetings/${id}`, request);
  }
}
