import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MeetingResponseDTO, UserDTO } from '@models/index';
import { AuthService } from '@core/services/auth.service';
import { MeetingService } from '@core/services/meeting.service';
import { ProjectService } from '@core/services/project.service';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';

declare var JitsiMeetExternalAPI: any;

@Component({
  selector: 'app-meeting-detail-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './meeting-detail-panel.component.html',
  styleUrl: './meeting-detail-panel.component.scss'
})
export class MeetingDetailPanelComponent implements OnInit, OnDestroy {
  @Input() meeting!: MeetingResponseDTO;
  @Output() closePanel = new EventEmitter<void>();

  @ViewChild('jitsiContainer') jitsiContainer!: ElementRef;

  isOpen = false;
  isJoined = false;
  jitsiApi: any;

  isEditingTitle = false;
  isEditingDescription = false;
  isEditingTime = false;
  canEdit = false;

  showInvitePanel = false;
  availableUsers: UserDTO[] = [];
  isLoadingUsers = false;

  constructor(
    private authService: AuthService,
    private meetingService: MeetingService,
    private projectService: ProjectService
  ) {}

  ngOnInit(): void {
    setTimeout(() => this.isOpen = true, 10);
    const currentUser = this.authService.currentUser();
    this.canEdit = this.authService.hasRole('ADMIN') || 
                   this.authService.hasRole('MANAGER') || 
                   this.meeting.organizer.id === currentUser?.id;
    
    // Format dates for datetime-local input (yyyy-MM-ddTHH:mm)
    if (this.meeting.startTime) this.meeting.startTime = this.meeting.startTime.substring(0, 16);
    if (this.meeting.endTime) this.meeting.endTime = this.meeting.endTime.substring(0, 16);
  }

  ngOnDestroy(): void {
    if (this.jitsiApi) {
      this.jitsiApi.dispose();
    }
  }

  close(): void {
    this.isOpen = false;
    if (this.jitsiApi) {
      this.jitsiApi.dispose();
      this.jitsiApi = null;
    }
    setTimeout(() => this.closePanel.emit(), 300);
  }

  updateField(field: string, value: string): void {
    if (!this.canEdit) return;
    
    // Using PATCH allows us to send only the modified field,
    // which avoids @Future validation errors on existing start/end times.
    const payload: any = {};
    payload[field] = value;

    this.meetingService.updateMeeting(this.meeting.id, payload).subscribe({
      next: (updated) => {
        this.meeting = updated;
        if (this.meeting.startTime) this.meeting.startTime = this.meeting.startTime.substring(0, 16);
        if (this.meeting.endTime) this.meeting.endTime = this.meeting.endTime.substring(0, 16);
        
        this.isEditingTitle = false;
        this.isEditingDescription = false;
        this.meetingService.notifyMeetingRefresh();
        Swal.fire({
          title: 'Updated!',
          icon: 'success',
          timer: 1000,
          showConfirmButton: false,
          customClass: { popup: 'rounded-[1.5rem]' }
        });
      },
      error: (err) => {
        console.error('Update failed:', err);
        Swal.fire('Error', 'Failed to update meeting. Check console for details.', 'error');
      }
    });
  }

  toggleInvitePanel(): void {
    this.showInvitePanel = !this.showInvitePanel;
    if (this.showInvitePanel) {
      this.loadAvailableUsers();
    }
  }

  loadAvailableUsers(): void {
    this.isLoadingUsers = true;
    this.projectService.getAvailableUsersToAdd(this.meeting.projectId).subscribe({
      next: (users) => {
        // Filter out users already in meeting
        const participantIds = this.meeting.participants.map(p => p.id);
        participantIds.push(this.meeting.organizer.id);
        this.availableUsers = users.filter(u => !participantIds.includes(u.id));
        this.isLoadingUsers = false;
      },
      error: () => this.isLoadingUsers = false
    });
  }

  inviteUser(userId: number): void {
    const participantIds = this.meeting.participants.map(p => p.id);
    participantIds.push(userId);

    this.meetingService.updateMeeting(this.meeting.id, { participantIds }).subscribe({
      next: (updated) => {
        this.meeting = updated;
        this.loadAvailableUsers(); // Refresh the list
        this.meetingService.notifyMeetingRefresh();
        Swal.fire({
          title: 'Member Invited!',
          icon: 'success',
          timer: 1000,
          showConfirmButton: false,
          customClass: { popup: 'rounded-[1.5rem]' }
        });
      }
    });
  }

  deleteMeeting(): void {
    if (!this.canEdit) return;

    Swal.fire({
      title: 'Delete Meeting?',
      text: 'This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it',
      confirmButtonColor: '#ef4444',
      reverseButtons: true,
      customClass: { popup: 'rounded-[1.5rem] p-6' }
    }).then((result) => {
      if (result.isConfirmed) {
        this.meetingService.deleteMeeting(this.meeting.id).subscribe({
          next: () => {
             this.meetingService.notifyMeetingRefresh();
             this.close();
          },
          error: () => Swal.fire('Error', 'Failed to delete meeting.', 'error')
        });
      }
    });
  }

  joinMeeting(): void {
    const currentUser = this.authService.currentUser();
    if (!currentUser) return;

    this.isJoined = true;

    // Small delay to let the container render if it was hidden
    setTimeout(() => {
      const domain = 'meet.jit.si';
      const options = {
        roomName: this.meeting.roomCode,
        width: '100%',
        height: '100%',
        parentNode: this.jitsiContainer.nativeElement,
        userInfo: {
          email: currentUser.email,
          displayName: currentUser.username
        },
        configOverwrite: {
          prejoinPageEnabled: false,
          disableDeepLinking: true,
        },
        interfaceConfigOverwrite: {
          // Tweak UI if needed
          TOOLBAR_BUTTONS: [
            'microphone', 'camera', 'closedcaptions', 'desktop', 'fullscreen',
            'fodeviceselection', 'hangup', 'profile', 'chat', 'recording',
            'livestreaming', 'etherpad', 'sharedvideo', 'settings', 'raisehand',
            'videoquality', 'filmstrip', 'invite', 'feedback', 'stats', 'shortcuts',
            'tileview', 'videobackgroundblur', 'download', 'help', 'mute-everyone',
            'security'
          ],
        }
      };

      this.jitsiApi = new JitsiMeetExternalAPI(domain, options);
      
      // Handle hangup event to close the "Joined" state
      this.jitsiApi.addEventListener('videoConferenceLeft', () => {
        this.isJoined = false;
        if (this.jitsiApi) {
          this.jitsiApi.dispose();
          this.jitsiApi = null;
        }
      });
    }, 100);
  }

  formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleString('vi-VN', {
      weekday: 'long',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getDuration(): string {
    const start = new Date(this.meeting.startTime);
    const end = new Date(this.meeting.endTime);
    const diffMs = end.getTime() - start.getTime();
    const diffMins = Math.round(diffMs / 60000);
    
    if (diffMins < 60) return `${diffMins} minutes`;
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours} hours`;
  }
}
