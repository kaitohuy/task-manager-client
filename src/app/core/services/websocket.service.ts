import { Injectable } from '@angular/core';
import { Client, StompSubscription } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { Subject, Observable } from 'rxjs';
import { TokenService } from './token.service';

@Injectable({
  providedIn: 'root'
})
export class WebsocketService {
  private stompClient: Client | null = null;
  private commentSubject = new Subject<any>();
  private taskSubject = new Subject<any>();
  private taskDeleteSubject = new Subject<number>();
  private adminStatsSubject = new Subject<any>();
  private managerStatsSubject = new Subject<any>();
  private notificationSubject = new Subject<any>();
  private connectionSubject = new Subject<boolean>();
  public connection$ = this.connectionSubject.asObservable();

  constructor(private tokenService: TokenService) {
    this.initStompClient();
  }

  private initStompClient() {
    this.stompClient = new Client({
      webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
      debug: (str) => {
        // console.log('STOMP: ' + str);
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    this.stompClient.onConnect = (frame) => {
      console.log('✅ WebSocket Connected');
      this.connectionSubject.next(true);
    };

    this.stompClient.onStompError = (frame) => {
      console.error('❌ WebSocket Error: ' + frame.headers['message']);
    };
  }

  public connect() {
    if (!this.stompClient) {
      this.initStompClient();
    }
    
    const token = this.tokenService.getToken();
    if (token && this.stompClient) {
      this.stompClient.connectHeaders = {
        Authorization: `Bearer ${token}`
      };
      if (!this.stompClient.active) {
        this.stompClient.activate();
      }
    }
  }

  public disconnect() {
    if (this.stompClient) {
      this.stompClient.deactivate();
    }
  }

  public subscribeToTaskComments(taskId: number): StompSubscription | null {
    if (!this.stompClient || !this.stompClient.connected) {
      console.warn('WebSocket not connected, cannot subscribe');
      // Try to connect if not connected
      this.connect();
      return null;
    }

    return this.stompClient.subscribe(`/topic/tasks/${taskId}/comments`, (message) => {
      const newComment = JSON.parse(message.body);
      this.commentSubject.next(newComment);
    });
  }

  public getCommentStream(): Observable<any> {
    return this.commentSubject.asObservable();
  }

  public subscribeToProjectTasks(projectId: number): StompSubscription | null {
    if (!this.stompClient || !this.stompClient.connected) {
      this.connect();
      return null;
    }

    return this.stompClient.subscribe(`/topic/projects/${projectId}/tasks`, (message) => {
      const newTask = JSON.parse(message.body);
      this.taskSubject.next(newTask);
    });
  }

  public getTaskStream(): Observable<any> {
    return this.taskSubject.asObservable();
  }

  public subscribeToProjectTaskDeletions(projectId: number): StompSubscription | null {
    if (!this.stompClient || !this.stompClient.connected) {
      this.connect();
      return null;
    }

    return this.stompClient.subscribe(`/topic/projects/${projectId}/tasks/delete`, (message) => {
      const deletedTaskId = Number(message.body);
      this.taskDeleteSubject.next(deletedTaskId);
    });
  }

  public getTaskDeleteStream(): Observable<number> {
    return this.taskDeleteSubject.asObservable();
  }

  public subscribeToAdminStats(): StompSubscription | null {
    if (!this.stompClient || !this.stompClient.connected) {
      this.connect();
      return null;
    }

    return this.stompClient.subscribe('/topic/dashboard/admin', (message) => {
      this.adminStatsSubject.next(JSON.parse(message.body));
    });
  }

  public getAdminStatsStream(): Observable<any> {
    return this.adminStatsSubject.asObservable();
  }

  public subscribeToManagerStats(): StompSubscription | null {
    if (!this.stompClient || !this.stompClient.connected) {
      this.connect();
      return null;
    }

    // Spring's convertAndSendToUser uses /user prefix for dedicated queues
    return this.stompClient.subscribe('/user/queue/dashboard/manager', (message) => {
      this.managerStatsSubject.next(JSON.parse(message.body));
    });
  }

  public getManagerStatsStream(): Observable<any> {
    return this.managerStatsSubject.asObservable();
  }

  public subscribeToNotifications(): StompSubscription | null {
    if (!this.stompClient || !this.stompClient.connected) {
      this.connect();
      return null;
    }

    return this.stompClient.subscribe('/user/queue/notifications', (message) => {
      this.notificationSubject.next(JSON.parse(message.body));
    });
  }

  public getNotificationStream(): Observable<any> {
    return this.notificationSubject.asObservable();
  }
}
