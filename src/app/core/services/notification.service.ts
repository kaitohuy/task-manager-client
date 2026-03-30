import { Injectable, signal, OnDestroy } from '@angular/core';
import { Observable, tap, Subscription, filter } from 'rxjs';
import { ApiService } from './api.service';
import { NotificationResponseDTO } from '@models/notification.model';
import { WebsocketService } from './websocket.service';
import { StompSubscription } from '@stomp/stompjs';

export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService implements OnDestroy {
  notifications = signal<NotificationResponseDTO[]>([]);
  unreadCount = signal<number>(0);
  
  private wsSubscription: StompSubscription | null = null;
  private connectionSub: Subscription | null = null;

  constructor(
    private apiService: ApiService,
    private wsService: WebsocketService
  ) {}

  init(): void {
    this.loadUnreadCount();
    this.subscribeToWs();
  }

  getNotifications(page: number = 0, size: number = 10): Observable<PaginatedResponse<NotificationResponseDTO>> {
    return this.apiService.get<PaginatedResponse<NotificationResponseDTO>>('/api/notifications', { page, size }).pipe(
      tap(res => {
        if (page === 0) {
          this.notifications.set(res.content);
        } else {
          this.notifications.update(prev => [...prev, ...res.content]);
        }
      })
    );
  }

  loadUnreadCount(): void {
    this.apiService.get<number>('/api/notifications/unread-count').subscribe(count => {
      this.unreadCount.set(count);
    });
  }

  markAllAsRead(): Observable<void> {
    return this.apiService.put<void>('/api/notifications/mark-read', {}).pipe(
      tap(() => {
        this.unreadCount.set(0);
        this.notifications.update(prev => prev.map(n => ({ ...n, isRead: true })));
      })
    );
  }

  markAsRead(id: number): Observable<void> {
    return this.apiService.put<void>(`/api/notifications/${id}/mark-read`, {}).pipe(
      tap(() => {
        this.notifications.update(prev => 
          prev.map(n => n.id === id ? { ...n, isRead: true } : n)
        );
        this.unreadCount.update(count => Math.max(0, count - 1));
      })
    );
  }

  deleteNotification(id: number): Observable<void> {
    return this.apiService.delete<void>(`/api/notifications/${id}`).pipe(
      tap(() => {
        const deletedNotification = this.notifications().find(n => n.id === id);
        if (deletedNotification && !deletedNotification.isRead) {
          this.unreadCount.update(count => Math.max(0, count - 1));
        }
        this.notifications.update(prev => prev.filter(n => n.id !== id));
      })
    );
  }

  deleteAllNotifications(): Observable<void> {
    return this.apiService.delete<void>('/api/notifications').pipe(
      tap(() => {
        this.notifications.set([]);
        this.unreadCount.set(0);
      })
    );
  }

  private subscribeToWs(): void {
    // Wait for connection to be true before subscribing
    if (this.connectionSub) this.connectionSub.unsubscribe();
    
    this.connectionSub = this.wsService.connection$.pipe(
      filter(connected => connected === true)
    ).subscribe(() => {
      if (this.wsSubscription) {
        this.wsSubscription.unsubscribe();
      }
      
      this.wsSubscription = this.wsService.subscribeToNotifications();
      console.log('Subscribed to real-time notifications');
    });

    // Also subscribe to the stream itself
    this.wsService.getNotificationStream().subscribe(notification => {
      console.log('Received real-time notification:', notification);
      this.notifications.update(prev => [notification, ...prev]);
      this.unreadCount.update(count => count + 1);
      
      if (this.notifications().length > 50) {
        this.notifications.update(prev => prev.slice(0, 50));
      }
    });
  }

  ngOnDestroy(): void {
    if (this.wsSubscription) {
      this.wsSubscription.unsubscribe();
    }
    if (this.connectionSub) {
      this.connectionSub.unsubscribe();
    }
  }
}
