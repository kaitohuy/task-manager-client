import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MeetingService } from '@core/services/meeting.service';
import { ProjectService } from '@core/services/project.service';
import { AuthService } from '@core/services/auth.service';
import { MeetingResponseDTO, UserDTO } from '@models/index';
import { Subscription, forkJoin, of, catchError, map, switchMap, combineLatest } from 'rxjs';
import { MeetingDetailPanelComponent } from '@shared/components/meeting-detail-panel/meeting-detail-panel.component';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-meetings-home',
  standalone: true,
  imports: [CommonModule, MeetingDetailPanelComponent],
  templateUrl: './meetings-home.component.html',
  styleUrl: './meetings-home.component.scss'
})
export class MeetingsHomeComponent implements OnInit, OnDestroy {
  meetings = signal<MeetingResponseDTO[]>([]);
  isLoading = signal<boolean>(false);
  selectedMeeting: MeetingResponseDTO | null = null;
  currentUser: UserDTO | null = null;
  
  private subscription?: Subscription;

  constructor(
    public meetingService: MeetingService,
    private projectService: ProjectService,
    private authService: AuthService
  ) {
    this.currentUser = this.authService.currentUser();
  }

  ngOnInit(): void {
    this.loadMeetings();
    this.subscription = this.meetingService.meetingRefresh$.subscribe(() => this.loadMeetings());
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  loadMeetings(): void {
    this.isLoading.set(true);
    const isAdmin = this.authService.hasRole('ADMIN');

    const projects$ = isAdmin 
      ? this.projectService.getAllProjects(0, 100).pipe(map(p => p.content))
      : this.projectService.getMyProjects(0, 100).pipe(map(p => p.content));

    projects$.pipe(
      switchMap(projects => {
        if (!projects.length) return of([]);
        
        const requests = projects.map(p => 
          this.meetingService.getMeetingsByProject(p.id).pipe(
            catchError(() => of([]))
          )
        );
        return forkJoin(requests).pipe(map(res => res.flat()));
      }),
      map(meetings => {
        // Sort by start time descending
        return meetings.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
      })
    ).subscribe({
      next: (data) => {
        this.meetings.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading meetings:', err);
        this.isLoading.set(false);
      }
    });
  }

  handleDelete(meeting: MeetingResponseDTO, event: Event): void {
    event.stopPropagation();
    
    const canDelete = this.authService.hasRole('ADMIN') || 
                      this.authService.hasRole('MANAGER') || 
                      meeting.organizer.id === this.currentUser?.id;

    if (!canDelete) {
      Swal.fire('Access Denied', 'You do not have permission to delete this meeting.', 'error');
      return;
    }

    Swal.fire({
      title: 'Delete Meeting?',
      text: `Are you sure you want to cancel "${meeting.title}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it',
      confirmButtonColor: '#ef4444',
      reverseButtons: true,
      customClass: {
        popup: 'rounded-[1.5rem] p-6'
      }
    }).then((result) => {
      if (result.isConfirmed) {
        this.meetingService.deleteMeeting(meeting.id).subscribe({
          next: () => {
            Swal.fire({
              title: 'Deleted!',
              icon: 'success',
              timer: 1500,
              showConfirmButton: false,
              customClass: { popup: 'rounded-[1.5rem]' }
            });
            this.meetingService.notifyMeetingRefresh();
          },
          error: () => Swal.fire('Error', 'Failed to delete meeting.', 'error')
        });
      }
    });
  }

  isLive(meeting: MeetingResponseDTO): boolean {
    const now = new Date();
    const start = new Date(meeting.startTime);
    const end = new Date(meeting.endTime);
    return now >= start && now <= end;
  }

  isUpcoming(meeting: MeetingResponseDTO): boolean {
    return new Date(meeting.startTime) > new Date();
  }
}
