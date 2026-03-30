import { Component, OnInit, signal, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FullCalendarModule } from '@fullcalendar/angular';
import { CalendarOptions, EventClickArg, DateSelectArg, EventDropArg, EventInput } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { TaskService } from '@core/services/task.service';
import { ProjectService } from '@core/services/project.service';
import { MeetingService } from '@core/services/meeting.service';
import { AuthService } from '@core/services/auth.service';
import { TaskDTO, TaskStatus, Page, MeetingResponseDTO } from '@models/index';
import { TaskDetailPanelComponent } from '@shared/components/task-detail-panel/task-detail-panel.component';
import { MeetingDetailPanelComponent } from '@shared/components/meeting-detail-panel/meeting-detail-panel.component';
import { Subscription, forkJoin, of, catchError, map, switchMap, combineLatest } from 'rxjs';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-calendar-home',
  standalone: true,
  imports: [CommonModule, FullCalendarModule, TaskDetailPanelComponent, MeetingDetailPanelComponent],
  templateUrl: './calendar-home.component.html',
  styleUrl: './calendar-home.component.scss'
})
export class CalendarHomeComponent implements OnInit, OnDestroy {
  calendarOptions = signal<CalendarOptions>({
    plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
    initialView: 'timeGridWeek',
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'timeGridDay,timeGridWeek,dayGridMonth'
    },
    slotMinTime: '06:00:00',
    slotMaxTime: '22:00:00',
    dayHeaderFormat: { weekday: 'short', day: '2-digit', month: '2-digit' },
    dayHeaderContent: (arg: any) => {
      const date = arg.date;
      const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
      const dayName = days[date.getDay()];
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      return `${dayName}, ${day}/${month}`;
    },
    allDaySlot: false,
    nowIndicator: false,
    editable: true,
    selectable: true,
    selectMirror: false,
    slotEventOverlap: true, // Allow tasks to float over meetings
    dayMaxEvents: true,
    weekends: true,
    eventClassNames: (arg: any) => {
      const type = arg.event.extendedProps['type'];
      return type === 'TASK' ? ['task-event'] : ['meeting-event'];
    },
    eventDidMount: (info: any) => {
      const type = info.event.extendedProps['type'];
      if (type === 'TASK') {
        // Find the parent harness and add a specific class to override width
        const harness = info.el.closest('.fc-timegrid-event-harness');
        if (harness) {
          harness.classList.add('task-harness');
        }
      }
    },
    eventClick: this.handleEventClick.bind(this),
    select: this.handleDateSelect.bind(this),
    eventDrop: this.handleEventDrop.bind(this),
    eventContent: this.renderEventContent.bind(this),
    events: []
  });

  selectedTask: TaskDTO | null = null;
  selectedMeeting: MeetingResponseDTO | null = null;
  activeTab: 'ALL' | 'MEETINGS' | 'TASKS' = 'ALL';
  
  private refreshSub?: Subscription;

  constructor(
    public taskService: TaskService,
    public meetingService: MeetingService,
    private projectService: ProjectService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadEvents();
    this.refreshSub = combineLatest([
      this.taskService.taskRefresh$,
      this.meetingService.meetingRefresh$
    ]).pipe(catchError(() => of(null))).subscribe(() => this.loadEvents());
    
    // Also listen individually for better reactivity
    this.taskService.taskRefresh$.subscribe(() => this.loadEvents());
    this.meetingService.meetingRefresh$.subscribe(() => this.loadEvents());
  }

  ngOnDestroy(): void {
    this.refreshSub?.unsubscribe();
  }

  setActiveTab(tab: 'ALL' | 'MEETINGS' | 'TASKS'): void {
    this.activeTab = tab;
    this.loadEvents();
  }

  loadEvents(): void {
    const isAdmin = this.authService.hasRole('ADMIN');
    
    // 1. Get Projects
    const projects$ = isAdmin 
      ? this.projectService.getAllProjects(0, 100).pipe(map(p => p.content))
      : this.projectService.getMyProjects(0, 100).pipe(map(p => p.content));

    // 2. Map to Tasks and Meetings
    projects$.pipe(
      switchMap(projects => {
        if (!projects.length) return of({ tasks: [], meetings: [] });

        const tasksRequests = projects.map(p => 
          this.taskService.getTasksByProject(p.id, 0, 200).pipe(
            map(res => (Array.isArray(res) ? res : res.content)),
            catchError(() => of([]))
          )
        );

        const meetingsRequests = projects.map(p => 
          this.meetingService.getMeetingsByProject(p.id).pipe(
            catchError(() => of([]))
          )
        );

        return forkJoin([
          forkJoin(tasksRequests).pipe(map(res => res.flat())),
          forkJoin(meetingsRequests).pipe(map(res => res.flat()))
        ]).pipe(
          map(([tasks, meetings]) => ({ tasks, meetings }))
        );
      })
    ).subscribe({
      next: ({ tasks, meetings }) => {
        const events: EventInput[] = [];

        // Add Tasks if applicable
        if (this.activeTab === 'ALL' || this.activeTab === 'TASKS') {
          tasks.forEach(task => {
            const deadline = task.deadline || task.createdAt;
            const endDate = new Date(deadline);
            const startDate = new Date(endDate.getTime() - (60 * 60 * 1000));
            const statusConfig = this.getStatusConfig(task.status);
            
            events.push({
              id: `task-${task.id}`,
              title: task.title,
              start: startDate.toISOString(),
              end: endDate.toISOString(),
              borderColor: statusConfig.border,
              extendedProps: { type: 'TASK', data: task, gradient: statusConfig.gradient }
            });
          });
        }

        // Add Meetings if applicable
        if (this.activeTab === 'ALL' || this.activeTab === 'MEETINGS') {
          meetings.forEach(meeting => {
            events.push({
              id: `meeting-${meeting.id}`,
              title: meeting.title,
              start: meeting.startTime,
              end: meeting.endTime,
              borderColor: '#6366f1', // Indigo 500
              extendedProps: { 
                type: 'MEETING', 
                data: meeting, 
                gradient: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(199,210,254,0.85) 50%, rgba(165,180,252,0.7) 100%)' 
              }
            });
          });
        }

        this.calendarOptions.update(options => ({ ...options, events }));
      },
      error: (err) => console.error('Error loading calendar events:', err)
    });
  }

  getStatusConfig(status: TaskStatus): { gradient: string; border: string } {
    const configs: Record<TaskStatus, { gradient: string; border: string }> = {
      'TODO': {
        gradient: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(186,230,255,0.85) 50%, rgba(125,211,252,0.7) 100%)',
        border: 'rgba(125, 211, 252, 0.6)'
      },
      'IN_PROGRESS': {
        gradient: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(233,213,255,0.85) 50%, rgba(196,181,253,0.7) 100%)',
        border: 'rgba(196, 181, 253, 0.6)'
      },
      'DONE': {
        gradient: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(187,247,208,0.85) 50%, rgba(110,231,183,0.7) 100%)',
        border: 'rgba(110, 231, 183, 0.6)'
      },
      'PAUSED': {
        gradient: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(254,215,170,0.85) 50%, rgba(253,186,116,0.7) 100%)',
        border: 'rgba(253, 186, 116, 0.6)'
      },
      'CANCELLED': {
        gradient: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(254,205,211,0.85) 50%, rgba(253,164,175,0.7) 100%)',
        border: 'rgba(253, 164, 175, 0.6)'
      }
    };
    return configs[status] || { 
      gradient: 'linear-gradient(135deg, #ffffff 0%, #f1f5f9 100%)', 
      border: 'rgba(203,213,225,0.6)' 
    };
  }

  renderEventContent(eventInfo: any) {
    const type = eventInfo.event.extendedProps['type'];
    const data = eventInfo.event.extendedProps['data'];
    const gradient = eventInfo.event.extendedProps['gradient'];
    const timeText = eventInfo.timeText;
    
    if (type === 'MEETING') {
      const meeting = data as MeetingResponseDTO;
      return {
        html: `
          <div class="h-full w-full flex flex-col p-3 overflow-hidden shadow-inner" 
               style="background: ${gradient}; border-radius: inherit;">
            <div class="flex items-center justify-between mb-2">
              <span class="text-[10px] font-black text-indigo-900 uppercase tracking-widest opacity-70">${timeText}</span>
              <div class="h-7 w-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-md shrink-0">
                <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"><path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
              </div>
            </div>
            <div class="text-[13px] font-black text-indigo-950 leading-tight mb-1 uppercase tracking-tight line-clamp-2">
              ${meeting.title}
            </div>
            <div class="text-[11px] text-indigo-800 font-bold line-clamp-2 leading-snug italic opacity-85">
              ${meeting.participants.length + 1} participants
            </div>
          </div>
        `
      };
    }

    // TASK rendering (original)
    const task = data as TaskDTO;
    const avatarUrl = task.assignee?.imageUrl || (task.assignee?.gender === 'FEMALE' ? '/images/female_avatar.png' : '/images/male_avatar.png');
    const initials = task.assignee?.username?.substring(0, 2).toUpperCase() || '??';

    return {
      html: `
        <div class="h-full w-full flex flex-col p-3 overflow-hidden shadow-inner" 
             style="background: ${gradient}; border-radius: inherit;">
          <div class="flex items-center justify-between mb-2">
            <span class="text-[10px] font-black text-slate-800 uppercase tracking-widest opacity-70">${timeText}</span>
            <div class="h-8 w-8 rounded-full overflow-hidden border-2 border-white shadow-md flex items-center justify-center bg-white/50 shrink-0">
              ${task.assignee 
                ? `<img src="${avatarUrl}" class="h-full w-full object-cover">`
                : `<div class="h-full w-full bg-slate-300 flex items-center justify-center text-[10px] font-bold text-slate-600">${initials}</div>`
              }
            </div>
          </div>
          <div class="text-[13px] font-black text-slate-900 leading-tight mb-1 uppercase tracking-tight line-clamp-2">
            ${task.title}
          </div>
          <div class="text-[11px] text-slate-700 font-bold line-clamp-2 leading-snug italic opacity-85">
            ${task.description || 'No description provided'}
          </div>
        </div>
      `
    };
  }

  handleEventClick(arg: EventClickArg): void {
    const type = arg.event.extendedProps['type'];
    const data = arg.event.extendedProps['data'];
    
    if (type === 'MEETING') {
      this.selectedMeeting = data;
      this.selectedTask = null;
    } else {
      this.selectedTask = data;
      this.selectedMeeting = null;
    }
  }

  handleDateSelect(selectInfo: DateSelectArg): void {
    const calendarApi = selectInfo.view.calendar;
    calendarApi.unselect();

    const date = new Date(selectInfo.startStr);
    const formattedDate = date.toLocaleString('vi-VN', { 
      day: '2-digit', month: '2-digit', year: 'numeric', 
      hour: '2-digit', minute: '2-digit' 
    });

    setTimeout(() => {
      Swal.fire({
        title: 'Choose Action',
        text: `Schedule for ${formattedDate}`,
        icon: 'question',
        showDenyButton: true,
        showCancelButton: true,
        confirmButtonText: 'Schedule Task',
        denyButtonText: 'Schedule Meeting',
        cancelButtonText: 'Cancel',
        confirmButtonColor: '#0f172a', // slate-900
        denyButtonColor: '#4f46e5',    // indigo-600
        reverseButtons: false,
        customClass: {
          popup: 'rounded-[2rem] p-8 shadow-2xl overflow-hidden',
        }
      }).then((result) => {
        const dateTime = selectInfo.startStr.includes('T') 
          ? selectInfo.startStr.substring(0, 16)
          : `${selectInfo.startStr}T09:00`;

        if (result.isConfirmed) {
          this.taskService.requestCreateTask(undefined, dateTime);
        } else if (result.isDenied) {
          this.meetingService.requestCreateMeeting(undefined, dateTime);
        }
      });
    }, 10);
  }

  handleEventDrop(dropInfo: EventDropArg): void {
    const task = dropInfo.event.extendedProps['task'] as TaskDTO;
    
    // Use END date as the new deadline, because our tasks are visualized as blocks ending at the deadline
    // If endStr is missing (shouldn't happen with our config), fallback to startStr
    const newDeadlineStr = dropInfo.event.endStr || dropInfo.event.startStr;
    const newDateTime = newDeadlineStr.substring(0, 16);

    // Format date to dd/mm/yyyy, HH:mm for the prompt
    const date = new Date(newDeadlineStr);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const formattedDate = `${day}/${month}/${year}, ${hours}:${minutes}`;

    Swal.fire({
      title: 'Reschedule Task',
      text: `Update "${task.title}" deadline to ${formattedDate}?`,
      icon: 'info',
      showCancelButton: true,
      confirmButtonText: 'Update Deadline',
      cancelButtonText: 'Revert',
      confirmButtonColor: '#1e40af',
      reverseButtons: true,
      customClass: {
        container: 'rounded-[2rem]',
        popup: 'rounded-[1.5rem] p-6 shadow-2xl'
      }
    }).then((result) => {
      if (result.isConfirmed) {
        const payload = {
          title: task.title,
          description: task.description,
          status: task.status,
          deadline: newDateTime,
          projectId: task.projectId,
          assigneeId: task.assignee?.id
        } as any;
        
        this.taskService.updateTask(task.id, payload).subscribe({
          next: () => {
             Swal.fire({
               title: 'Updated!',
               text: 'Task has been rescheduled.',
               icon: 'success',
               timer: 1500,
               showConfirmButton: false,
               customClass: {
                 popup: 'rounded-[1.5rem]'
               }
             });
             this.loadEvents();
          },
          error: () => {
            Swal.fire({
              title: 'Error',
              text: 'Failed to update task.',
              icon: 'error',
              customClass: {
                popup: 'rounded-[1.5rem]'
              }
            });
            dropInfo.revert();
          }
        });
      } else {
        dropInfo.revert();
      }
    });
  }
}
