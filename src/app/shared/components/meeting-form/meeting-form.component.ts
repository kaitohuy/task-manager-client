import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MeetingService } from '@core/services/meeting.service';
import { ProjectService } from '@core/services/project.service';
import { AuthService } from '@core/services/auth.service';
import { ProjectDTO, ProjectMemberDTO, CreateMeetingDTO, UserDTO } from '@models/index';
import { Subscription } from 'rxjs';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-meeting-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './meeting-form.component.html',
  styleUrl: './meeting-form.component.scss'
})
export class MeetingFormComponent implements OnInit, OnDestroy {
  showModal = false;
  isSubmitting = false;

  projects: ProjectDTO[] = [];
  projectMembers: ProjectMemberDTO[] = [];
  selectedMemberIds: Set<number> = new Set();

  meetingData: CreateMeetingDTO = {
    title: '',
    description: '',
    startTime: '',
    endTime: '',
    projectId: 0,
    participantIds: []
  };

  private subscription?: Subscription;

  constructor(
    private meetingService: MeetingService,
    private projectService: ProjectService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.subscription = this.meetingService.meetingCreateRequest$.subscribe(req => {
      this.resetForm();
      if (req.startTime) {
        // datetime-local expects yyyy-MM-ddTHH:mm
        this.meetingData.startTime = req.startTime.substring(0, 16);
        // Default end time is 1 hour later
        const start = new Date(req.startTime);
        const end = new Date(start.getTime() + 60 * 60 * 1000);
        this.meetingData.endTime = end.toISOString().substring(0, 16);
      }
      
      if (req.projectId) {
        this.meetingData.projectId = req.projectId;
        this.onProjectChange();
      }
      this.loadProjects();
      this.showModal = true;
    });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  loadProjects(): void {
    const isAdmin = this.authService.hasRole('ADMIN');
    const projectObs = isAdmin 
      ? this.projectService.getAllProjects(0, 100)
      : this.projectService.getMyProjects(0, 100);

    projectObs.subscribe(res => {
      this.projects = res.content;
    });
  }

  onProjectChange(): void {
    if (!this.meetingData.projectId || this.meetingData.projectId == 0) {
      this.projectMembers = [];
      return;
    }
    this.projectService.getProjectMembers(this.meetingData.projectId).subscribe(res => {
      if (Array.isArray(res)) {
        this.projectMembers = res;
      } else if ((res as any).content) {
        this.projectMembers = (res as any).content;
      }
    });
  }

  toggleParticipant(userId: number): void {
    if (this.selectedMemberIds.has(userId)) {
      this.selectedMemberIds.delete(userId);
    } else {
      this.selectedMemberIds.add(userId);
    }
  }

  resetForm(): void {
    this.meetingData = {
      title: '',
      description: '',
      startTime: '',
      endTime: '',
      projectId: 0,
      participantIds: []
    };
    this.selectedMemberIds.clear();
  }

  close(): void {
    this.showModal = false;
  }

  onSubmit(): void {
    if (this.isSubmitting) return;

    this.meetingData.participantIds = Array.from(this.selectedMemberIds);
    this.isSubmitting = true;

    // Final check for dates format
    if (this.meetingData.startTime.length > 16) {
      this.meetingData.startTime = this.meetingData.startTime.substring(0, 16);
    }
    if (this.meetingData.endTime.length > 16) {
      this.meetingData.endTime = this.meetingData.endTime.substring(0, 16);
    }

    this.meetingService.createMeeting(this.meetingData).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.showModal = false;
        this.meetingService.notifyMeetingRefresh();
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'success',
          title: 'Meeting scheduled!',
          showConfirmButton: false,
          timer: 2000
        });
      },
      error: (err) => {
        this.isSubmitting = false;
        console.error('Error creating meeting:', err);
        Swal.fire({
          icon: 'error',
          title: 'Failed to schedule meeting',
          text: err.error?.message || 'Please try again.'
        });
      }
    });
  }
}
