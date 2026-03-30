import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TaskDTO, CommentResponseDTO, AttachmentResponseDTO, CreateCommentDTO, CreateAttachmentDTO, ProjectMemberDTO, CreateTaskDTO, TaskStatus } from '@models/index';
import { TaskCommentService } from '@core/services/task-comment.service';
import { TaskAttachmentService } from '@core/services/task-attachment.service';
import { TaskService } from '@core/services/task.service';
import { ProjectService } from '@core/services/project.service';
import { AuthService } from '@core/services/auth.service';
import { WebsocketService } from '@core/services/websocket.service';
import { StompSubscription } from '@stomp/stompjs';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-task-detail-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './task-detail-panel.component.html',
  styleUrl: './task-detail-panel.component.scss'
})
export class TaskDetailPanelComponent implements OnChanges, OnDestroy {
  @Input() task: TaskDTO | null = null;
  @Output() closePanel = new EventEmitter<void>();

  isOpen = false;
  newComment = '';

  // Inline Editing State
  isEditingTitle = false;
  isEditingDescription = false;
  isEditingStatus = false;
  isEditingAssignee = false;
  isEditingDeadline = false;
  
  tempTitle = '';
  tempDescription = '';
  tempDeadline = '';
  
  projectMembers: ProjectMemberDTO[] = [];
  readonly statuses: TaskStatus[] = ['TODO', 'IN_PROGRESS', 'DONE', 'PAUSED', 'CANCELLED'];

  // Data
  comments: CommentResponseDTO[] = [];
  attachments: AttachmentResponseDTO[] = [];

  // Loading States
  isLoadingComments = false;
  isLoadingAttachments = false;
  isSubmittingComment = false;
  isSubmittingAttachment = false;
  isUploadingFile = false;
  isDragOver = false;

  // Attachment Link Form
  showAttachmentForm = false;
  newAttachment: CreateAttachmentDTO = { name: '', url: '', type: 'OTHER' };

  // Reply State
  replyingTo: CommentResponseDTO | null = null;
  replyContent = '';
  isSubmittingReply = false;
  repliesMap: Map<number, CommentResponseDTO[]> = new Map();
  expandedReplies: Set<number> = new Set();
  loadingReplies: Set<number> = new Set();
  private wsSubscription: StompSubscription | null = null;
  private commentStreamSubscription: any = null;

  constructor(
    private commentService: TaskCommentService,
    private attachmentService: TaskAttachmentService,
    private taskService: TaskService,
    private projectService: ProjectService,
    public authService: AuthService,
    private wsService: WebsocketService
  ) {
    this.commentStreamSubscription = this.listenToRealTimeComments();
  }

  get canEdit(): boolean {
    return this.authService.hasAnyRole(['ADMIN', 'MANAGER']);
  }

  get currentUserId(): number | undefined {
    return this.authService.currentUser()?.id;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['task']) {
      if (this.task) {
        setTimeout(() => this.isOpen = true, 10);
        this.resetState();
        this.loadData();
        this.loadProjectMembers();
        this.subscribeToTaskWs();
        
        // Initialize temp fields
        this.tempTitle = this.task.title;
        this.tempDescription = this.task.description;
        this.tempDeadline = this.task.deadline ? this.task.deadline.substring(0, 16) : '';
      } else {
        this.isOpen = false;
        this.unsubscribeWs();
      }
    }
  }

  ngOnDestroy(): void {
    this.unsubscribeWs();
    if (this.commentStreamSubscription) {
      this.commentStreamSubscription.unsubscribe();
    }
  }

  private listenToRealTimeComments(): any {
    return this.wsService.getCommentStream().subscribe((newComment: CommentResponseDTO) => {
      if (this.task && newComment.taskId === this.task.id) {
        if (!newComment.parentCommentId) {
          // Top-level comment
          const exists = this.comments.some(c => c.id === newComment.id);
          if (!exists) {
            this.comments.unshift(newComment);
          }
        } else {
          // Reply
          const parentId = newComment.parentCommentId;
          const replies = this.repliesMap.get(parentId) || [];
          const exists = replies.some(r => r.id === newComment.id);
          if (!exists) {
            replies.push(newComment);
            this.repliesMap.set(parentId, [...replies]); // Spread to trigger change detection if needed
            
            // Update reply count on parent if not already expanded
            const parent = this.comments.find(c => c.id === parentId);
            if (parent) {
              parent.replyCount = (this.repliesMap.get(parentId)?.length || parent.replyCount);
            }
          }
        }
      }
    });
  }

  private subscribeToTaskWs(): void {
    this.unsubscribeWs();
    if (this.task) {
      this.wsService.connect();
      // Wait for connection to be ready before subscribing
      setTimeout(() => {
        this.wsSubscription = this.wsService.subscribeToTaskComments(this.task!.id);
      }, 1000);
    }
  }

  private unsubscribeWs(): void {
    if (this.wsSubscription) {
      this.wsSubscription.unsubscribe();
      this.wsSubscription = null;
    }
  }

  resetState(): void {
    this.replyingTo = null;
    this.replyContent = '';
    this.repliesMap = new Map();
    this.expandedReplies = new Set();
    this.loadingReplies = new Set();
    this.newComment = '';
    this.showAttachmentForm = false;
  }

  close(): void {
    this.isOpen = false;
    setTimeout(() => this.closePanel.emit(), 300);
  }

  handleBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('backdrop')) {
      this.close();
    }
  }

  copyLink(): void {
    if (this.task) {
      const url = `${window.location.origin}${window.location.pathname}?taskId=${this.task.id}`;
      navigator.clipboard.writeText(url).then(() => {
        Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Link copied!', showConfirmButton: false, timer: 2000 });
      });
    }
  }

  getStatusColorClass(status: string): string {
    switch (status) {
      case 'TODO': return 'bg-slate-100 text-slate-700';
      case 'IN_PROGRESS': return 'bg-blue-100 text-blue-700';
      case 'DONE': return 'bg-emerald-100 text-emerald-700';
      case 'PAUSED': return 'bg-amber-100 text-amber-700';
      case 'CANCELLED': return 'bg-rose-100 text-rose-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  }

  formatStatus(status: string): string {
    return status.replace('_', ' ');
  }

  getAssigneeInitials(name: string): string {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  }

  // =============================================
  // DATA LOADING
  // =============================================

  loadData(): void {
    if (!this.task) return;
    const taskId = this.task.id;

    this.isLoadingComments = true;
    this.commentService.getTopLevelComments(taskId).subscribe({
      next: (res) => { this.comments = res.content; this.isLoadingComments = false; },
      error: () => { this.isLoadingComments = false; }
    });

    this.isLoadingAttachments = true;
    this.attachmentService.getAttachments(taskId).subscribe({
      next: (res) => { this.attachments = res; this.isLoadingAttachments = false; },
      error: () => { this.isLoadingAttachments = false; }
    });
  }

  loadProjectMembers(): void {
    if (!this.task) return;
    this.projectService.getProjectMembers(this.task.projectId).subscribe({
      next: (res: any) => {
        // Handle both Array and Page responses
        if (Array.isArray(res)) {
          this.projectMembers = res;
        } else if (res && res.content) {
          this.projectMembers = res.content;
        }
      },
      error: (err) => console.error('Error loading project members:', err)
    });
  }

  // =============================================
  // TASK UPDATES (INLINE EDITING)
  // =============================================

  toggleEditTitle(): void {
    if (!this.canEdit) return;
    this.isEditingTitle = true;
    this.tempTitle = this.task?.title || '';
  }

  saveTitle(): void {
    if (!this.task || !this.tempTitle.trim() || this.tempTitle === this.task.title) {
      this.isEditingTitle = false;
      return;
    }
    this.updateTaskField({ title: this.tempTitle.trim() });
    this.isEditingTitle = false;
  }

  toggleEditDescription(): void {
    if (!this.canEdit) return;
    this.isEditingDescription = true;
    this.tempDescription = this.task?.description || '';
  }

  saveDescription(): void {
    if (!this.task || this.tempDescription === this.task.description) {
      this.isEditingDescription = false;
      return;
    }
    this.updateTaskField({ description: this.tempDescription });
    this.isEditingDescription = false;
  }

  updateStatus(status: TaskStatus): void {
    if (!this.task || status === this.task.status) return;
    this.updateTaskField({ status });
    this.isEditingStatus = false;
  }

  updateAssignee(assigneeId: number | undefined): void {
    if (!this.task) return;
    this.updateTaskField({ assigneeId: assigneeId || null } as any);
    this.isEditingAssignee = false;
  }

  updateDeadline(): void {
    if (!this.task || !this.tempDeadline) return;
    this.updateTaskField({ deadline: this.tempDeadline });
    this.isEditingDeadline = false;
  }

  private updateTaskField(changes: Partial<CreateTaskDTO>): void {
    if (!this.task) return;

    const updateData: CreateTaskDTO = {
      title: this.task.title,
      description: this.task.description,
      status: this.task.status,
      deadline: this.task.deadline ? this.task.deadline.substring(0, 16) : '',
      projectId: this.task.projectId,
      assigneeId: this.task.assignee?.id,
      ...changes
    };

    // Ensure deadline is always in yyyy-MM-ddTHH:mm format
    if (updateData.deadline && updateData.deadline.length > 16) {
      updateData.deadline = updateData.deadline.substring(0, 16);
    }

    this.taskService.updateTask(this.task.id, updateData).subscribe({
      next: (updatedTask) => {
        this.task = updatedTask;
        this.taskService.notifyTaskRefresh();
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'success',
          title: 'Task updated!',
          showConfirmButton: false,
          timer: 1500
        });
      },
      error: (err) => {
        console.error('Update failed:', err);
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'error',
          title: 'Update failed',
          showConfirmButton: false,
          timer: 2000
        });
      }
    });
  }

  // =============================================
  // COMMENTS
  // =============================================

  postComment(): void {
    if (!this.task || !this.newComment.trim() || this.isSubmittingComment) return;

    this.isSubmittingComment = true;
    const req: CreateCommentDTO = { content: this.newComment.trim() };

    this.commentService.addComment(this.task.id, req).subscribe({
      next: (res) => {
        const exists = this.comments.some(c => c.id === res.id);
        if (!exists) {
          this.comments.unshift(res);
        }
        this.newComment = '';
        this.isSubmittingComment = false;
        Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Comment added!', showConfirmButton: false, timer: 1500 });
      },
      error: () => {
        this.isSubmittingComment = false;
        Swal.fire({ toast: true, position: 'top-end', icon: 'error', title: 'Failed to post comment', showConfirmButton: false, timer: 2000 });
      }
    });
  }

  deleteComment(commentId: number): void {
    Swal.fire({
      title: 'Delete comment?',
      text: 'This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#94a3b8',
      confirmButtonText: 'Delete',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        this.commentService.deleteComment(commentId).subscribe({
          next: () => {
            this.comments = this.comments.filter(c => c.id !== commentId);
            // Also remove from replies map
            this.repliesMap.forEach((replies, parentId) => {
              this.repliesMap.set(parentId, replies.filter(r => r.id !== commentId));
            });
            Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Comment deleted!', showConfirmButton: false, timer: 1500 });
          },
          error: () => {
            Swal.fire({ toast: true, position: 'top-end', icon: 'error', title: 'Failed to delete comment', showConfirmButton: false, timer: 2000 });
          }
        });
      }
    });
  }

  // =============================================
  // COMMENT REPLIES
  // =============================================

  startReply(comment: CommentResponseDTO): void {
    this.replyingTo = comment;
    this.replyContent = '';
  }

  cancelReply(): void {
    this.replyingTo = null;
    this.replyContent = '';
  }

  postReply(): void {
    if (!this.task || !this.replyingTo || !this.replyContent.trim() || this.isSubmittingReply) return;

    this.isSubmittingReply = true;
    const req: CreateCommentDTO = { content: this.replyContent.trim(), parentCommentId: this.replyingTo.id };

    this.commentService.addComment(this.task.id, req).subscribe({
      next: (res) => {
        // Add reply to the replies map
        const parentId = this.replyingTo!.id;
        const replies = this.repliesMap.get(parentId) || [];
        const exists = replies.some(r => r.id === res.id);
        if (!exists) {
          replies.push(res);
          this.repliesMap.set(parentId, [...replies]);
          this.expandedReplies.add(parentId);

          // Update reply count on parent
          const parent = this.comments.find(c => c.id === parentId);
          if (parent) parent.replyCount = replies.length;
        }

        this.replyContent = '';
        this.replyingTo = null;
        this.isSubmittingReply = false;
        Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Reply sent!', showConfirmButton: false, timer: 1500 });
      },
      error: () => {
        this.isSubmittingReply = false;
        Swal.fire({ toast: true, position: 'top-end', icon: 'error', title: 'Failed to reply', showConfirmButton: false, timer: 2000 });
      }
    });
  }

  toggleReplies(comment: CommentResponseDTO): void {
    if (this.expandedReplies.has(comment.id)) {
      this.expandedReplies.delete(comment.id);
    } else {
      this.expandedReplies.add(comment.id);
      if (!this.repliesMap.has(comment.id)) {
        this.loadReplies(comment.id);
      }
    }
  }

  loadReplies(parentId: number): void {
    this.loadingReplies.add(parentId);
    this.commentService.getReplies(parentId).subscribe({
      next: (res) => {
        this.repliesMap.set(parentId, res.content);
        this.loadingReplies.delete(parentId);
      },
      error: () => {
        this.loadingReplies.delete(parentId);
      }
    });
  }

  // =============================================
  // ATTACHMENTS (LINK + FILE UPLOAD)
  // =============================================

  toggleAttachmentForm(): void {
    this.showAttachmentForm = !this.showAttachmentForm;
    if (!this.showAttachmentForm) {
      this.newAttachment = { name: '', url: '', type: 'OTHER' };
    }
  }

  addAttachment(): void {
    if (!this.task || this.isSubmittingAttachment || !this.newAttachment.name || !this.newAttachment.url) return;

    this.isSubmittingAttachment = true;
    this.attachmentService.addAttachment(this.task.id, this.newAttachment).subscribe({
      next: (res) => {
        this.attachments.push(res);
        this.isSubmittingAttachment = false;
        this.toggleAttachmentForm();
        Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Link added!', showConfirmButton: false, timer: 1500 });
      },
      error: () => {
        this.isSubmittingAttachment = false;
        Swal.fire({ toast: true, position: 'top-end', icon: 'error', title: 'Failed to add link', showConfirmButton: false, timer: 2000 });
      }
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length || !this.task) return;
    this.uploadFiles(Array.from(input.files));
    input.value = '';
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;
    if (!this.task || !event.dataTransfer?.files?.length) return;
    this.uploadFiles(Array.from(event.dataTransfer.files));
  }

  private uploadFiles(files: File[]): void {
    if (!this.task) return;
    for (const file of files) {
      this.isUploadingFile = true;
      this.attachmentService.uploadFile(this.task.id, file).subscribe({
        next: (res) => {
          this.attachments.push(res);
          this.isUploadingFile = false;
          Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: `"${file.name}" uploaded!`, showConfirmButton: false, timer: 2000 });
        },
        error: () => {
          this.isUploadingFile = false;
          Swal.fire({ toast: true, position: 'top-end', icon: 'error', title: `Failed to upload "${file.name}"`, showConfirmButton: false, timer: 2000 });
        }
      });
    }
  }

  deleteAttachment(attachmentId: number): void {
    Swal.fire({
      title: 'Remove attachment?',
      text: 'This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#94a3b8',
      confirmButtonText: 'Remove',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        this.attachmentService.deleteAttachment(attachmentId).subscribe({
          next: () => {
            this.attachments = this.attachments.filter(a => a.id !== attachmentId);
            Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Removed!', showConfirmButton: false, timer: 1500 });
          },
          error: () => {
            Swal.fire({ toast: true, position: 'top-end', icon: 'error', title: 'Failed to remove', showConfirmButton: false, timer: 2000 });
          }
        });
      }
    });
  }

  // =============================================
  // DELETE TASK
  // =============================================

  deleteTask(): void {
    if (!this.task) return;

    Swal.fire({
      title: 'Delete Task?',
      text: 'Are you sure you want to permanently delete this task?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#94a3b8',
      confirmButtonText: 'Delete',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        this.taskService.deleteTask(this.task!.id).subscribe({
          next: () => {
            Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Task deleted!', showConfirmButton: false, timer: 2000 });
            this.close();
            this.taskService.notifyTaskRefresh();
          },
          error: () => {
            Swal.fire({ toast: true, position: 'top-end', icon: 'error', title: 'Failed to delete task', showConfirmButton: false, timer: 2000 });
          }
        });
      }
    });
  }
}
