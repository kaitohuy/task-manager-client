export enum NotificationType {
    PROJECT_INVITE = 'PROJECT_INVITE',
    TASK_ASSIGNED = 'TASK_ASSIGNED',
    TASK_STATUS_CHANGED = 'TASK_STATUS_CHANGED',
    NEW_COMMENT = 'NEW_COMMENT',
    FILE_UPLOAD = 'FILE_UPLOAD'
}

export interface NotificationResponseDTO {
    id: number;
    senderUsername: string;
    senderAvatar: string | null;
    senderGender?: string; // Optional if not yet in BE
    senderRole?: string;   // Optional if not yet in BE
    type: NotificationType;
    message: string;
    targetId: number | null;
    isRead: boolean;
    createdAt: string;
}
