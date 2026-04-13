export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE' | 'PAUSED' | 'CANCELLED';
export type UserRole = 'ADMIN' | 'MANAGER' | 'MEMBER';
export type ProjectRole = 'LEADER' | 'MEMBER';
export type Gender = 'MALE' | 'FEMALE' | 'OTHER';
export type AttachmentType = 'IMAGE' | 'DOCUMENT' | 'VIDEO' | 'PDF' | 'WORD' | 'EXCEL' | 'OTHER';

export interface UserDTO {
  id: number;
  roles: UserRole[];
  username: string;
  email: string;
  phone: string;
  fullName: string;
  address: string;
  gender: Gender;
  dob: string;
  imageUrl?: string;
  mfaEnabled: boolean;
}

export interface AuthResponse {
  username: string;
  token?: string;
  mfaRequired?: boolean;
  mfaToken?: string;
}

export interface LoginRequest {
  identifier: string;
  password?: string;
}

export interface CreateUserDTO {
  username: string;
  password?: string;
  email: string;
  phone?: string;
  fullName: string;
  address?: string;
  gender?: Gender;
  dob?: string;
  roles?: UserRole[];
}

export interface UpdateUserDTO {
  email?: string;
  phone?: string;
  fullName?: string;
  address?: string;
  gender?: Gender;
  dob?: string;
  roles?: UserRole[];
}

export interface MemberAvatarDTO {
  userName: string;
  imageUrl: string | null;
  gender: Gender;
}

export interface ProjectDTO {
  id: number;
  name: string;
  description: string;
  createdAt: string;
  createdBy?: UserDTO | null;
  memberCount: number;
  memberAvatars?: MemberAvatarDTO[];
}

export interface TaskDTO {
  id: number;
  title: string;
  description: string;
  status: TaskStatus;
  deadline: string;
  createdAt: string;
  projectId: number;
  projectName: string;
  assignee?: UserDTO;
  priority?: string;
  version?: number;
}

export interface CreateTaskDTO {
  title: string;
  description: string;
  status: TaskStatus;
  deadline: string;
  projectId: number;
  assigneeId?: number;
  version?: number;
}

export interface CreateProjectDTO {
  name: string;
  description: string;
}

export interface ProjectMemberDTO {
  id: number;
  user: UserDTO;
  role: ProjectRole;
  joinedAt: string;
}


export interface SearchTaskDTO {
  projectId: number;
  keyword?: string;
  status?: TaskStatus;
}

export interface Page<T> {
  content: T[];
  pageable: {
    pageNumber: number;
    pageSize: number;
    sort: {
      empty: boolean;
      sorted: boolean;
      unsorted: boolean;
    };
    offset: number;
    paged: boolean;
    unpaged: boolean;
  };
  last: boolean;
  totalPages: number;
  totalElements: number;
  first: boolean;
  size: number;
  number: number;
  sort: {
    empty: boolean;
    sorted: boolean;
    unsorted: boolean;
  };
  numberOfElements: number;
  empty: boolean;
}
export interface AdminDashboardStatsDTO {
  totalUsers: number;
  totalAdmins: number;
  totalManagers: number;
  totalMembers: number;
  totalProjects: number;
  tasksTodo: number;
  tasksInProgress: number;
  tasksDone: number;
  tasksPaused: number;
  tasksCanceled: number;
}

export interface ManagerDashboardStatsDTO {
  totalManagedProjects: number;
  teamTasksTodo: number;
  teamTasksInProgress: number;
  teamTasksDone: number;
  teamTaskPaused: number;
  teamTaskCancelled: number;
  myTasksTodo: number;
  myTasksInProgress: number;
  myTasksDone: number;
  myTaskPaused: number;
  myTaskCancelled: number;
}

export interface CreateAttachmentDTO {
  name: string;
  url: string;
  type: AttachmentType;
}

export interface CreateCommentDTO {
  content: string;
  parentCommentId?: number;
}

export interface AttachmentResponseDTO {
  id: number;
  taskId: number;
  userId: number;
  username: string;
  name: string;
  url: string;
  type: AttachmentType;
  uploadedAt: string;
}

export interface CommentResponseDTO {
  id: number;
  content: string;
  taskId: number;
  userId: number;
  username: string;
  userAvatarUrl?: string;
  parentCommentId?: number;
  createdAt: string;
  replyCount: number;
}

export interface CreateMeetingDTO {
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  projectId: number;
  participantIds: number[];
}

export interface MeetingResponseDTO {
  id: number;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  roomCode: string;
  projectId: number;
  organizer: UserDTO;
  participants: UserDTO[];
}

export type ActivityAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'ASSIGN' | 'UNASSIGN' | 'STATUS_CHANGE' | 'ROLE_CHANGE' | 'LOGIN' | 'LOGOUT' | 'COMMENT' | 'ATTACH';
export type ActivityType = 'TASK' | 'PROJECT' | 'USER' | 'MEMBER' | 'MEETING' | 'COMMENT' | 'ATTACHMENT' | 'AUTH';

export interface ActivityLogDTO {
  id: number;
  userId: number;
  username: string;
  action: ActivityAction;
  type: ActivityType;
  entityId: number;
  entityName: string;
  description: string;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

export interface Permission {
  id: number;
  name: string;
  description: string;
}

export interface UserPermissionOverride {
  permissionId: number;
  isDenied: boolean;
}
