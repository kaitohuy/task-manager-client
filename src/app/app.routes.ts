import { Routes } from '@angular/router';
import { LoginComponent } from '@features/auth/login/login.component';
import { DashboardLayoutComponent } from '@features/dashboard/dashboard-layout/dashboard-layout.component';
import { DashboardHomeComponent } from '@features/dashboard/dashboard-home/dashboard-home.component';
import { MyTasksComponent } from '@features/dashboard/my-tasks/my-tasks.component';
import { authGuard } from '@core/guards/auth.guard';
import { roleGuard } from '@core/guards/role.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  
  // ADMIN Routes
  {
    path: 'admin',
    component: DashboardLayoutComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['ADMIN'] },
    children: [
      { path: '', redirectTo: 'board', pathMatch: 'full' },
      { path: 'board', component: DashboardHomeComponent },
      { 
        path: 'projects', 
        children: [
          { path: '', loadComponent: () => import('@features/dashboard/projects/projects.component').then(m => m.ProjectsComponent) },
          {
            path: ':id',
            loadComponent: () => import('@features/dashboard/project-workspace/project-workspace.component').then(m => m.ProjectWorkspaceComponent),
            children: [
              { path: '', redirectTo: 'board', pathMatch: 'full' },
              { path: 'board', loadComponent: () => import('@features/dashboard/project-workspace/tabs/project-board/project-board.component').then(m => m.ProjectBoardComponent) },
              { path: 'members', loadComponent: () => import('@features/dashboard/project-workspace/tabs/project-members-tab/project-members-tab.component').then(m => m.ProjectMembersTabComponent) }
            ]
          }
        ]
      },
      { path: 'calendar', loadComponent: () => import('@features/dashboard/calendar/calendar-home.component').then(m => m.CalendarHomeComponent) },
      { path: 'meetings', loadComponent: () => import('@features/dashboard/meetings/meetings-home.component').then(m => m.MeetingsHomeComponent) },
      { path: 'users', loadComponent: () => import('@features/admin/users/users.component').then(m => m.UsersComponent) },
      { path: 'profile', loadComponent: () => import('@features/dashboard/profile/profile').then(m => m.ProfileComponent) }
    ]
  },

  // MANAGER Routes
  {
    path: 'manager',
    component: DashboardLayoutComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['MANAGER', 'ADMIN'] },
    children: [
      { path: '', redirectTo: 'board', pathMatch: 'full' },
      { path: 'board', component: DashboardHomeComponent },
      { path: 'my-tasks', component: MyTasksComponent },
      { 
        path: 'projects', 
        children: [
          { path: '', loadComponent: () => import('@features/dashboard/projects/projects.component').then(m => m.ProjectsComponent) },
          {
            path: ':id',
            loadComponent: () => import('@features/dashboard/project-workspace/project-workspace.component').then(m => m.ProjectWorkspaceComponent),
            children: [
              { path: '', redirectTo: 'board', pathMatch: 'full' },
              { path: 'board', loadComponent: () => import('@features/dashboard/project-workspace/tabs/project-board/project-board.component').then(m => m.ProjectBoardComponent) },
              { path: 'members', loadComponent: () => import('@features/dashboard/project-workspace/tabs/project-members-tab/project-members-tab.component').then(m => m.ProjectMembersTabComponent) },
            ]
          }
        ]
      },
      { path: 'calendar', loadComponent: () => import('@features/dashboard/calendar/calendar-home.component').then(m => m.CalendarHomeComponent) },
<<<<<<< Updated upstream
=======
      { path: 'meetings', loadComponent: () => import('@features/dashboard/meetings/meetings-home.component').then(m => m.MeetingsHomeComponent) },
      { path: 'logs', loadComponent: () => import('@features/dashboard/activity-logs/activity-logs.component').then(m => m.ActivityLogsComponent) },
>>>>>>> Stashed changes
      { path: 'profile', loadComponent: () => import('@features/dashboard/profile/profile').then(m => m.ProfileComponent) }
    ]
  },

  // MEMBER/DASHBOARD Routes
  {
    path: 'dashboard',
    component: DashboardLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'board', pathMatch: 'full' },
      { path: 'board', component: DashboardHomeComponent },
      { path: 'my-tasks', component: MyTasksComponent },
      { 
        path: 'projects', 
        children: [
          { path: '', loadComponent: () => import('@features/dashboard/projects/projects.component').then(m => m.ProjectsComponent) },
          {
            path: ':id',
            loadComponent: () => import('@features/dashboard/project-workspace/project-workspace.component').then(m => m.ProjectWorkspaceComponent),
            children: [
              { path: '', redirectTo: 'board', pathMatch: 'full' },
              { path: 'board', loadComponent: () => import('@features/dashboard/project-workspace/tabs/project-board/project-board.component').then(m => m.ProjectBoardComponent) },
              { path: 'members', loadComponent: () => import('@features/dashboard/project-workspace/tabs/project-members-tab/project-members-tab.component').then(m => m.ProjectMembersTabComponent) },
            ]
          }
        ]
      },
      { path: 'calendar', loadComponent: () => import('@features/dashboard/calendar/calendar-home.component').then(m => m.CalendarHomeComponent) },
<<<<<<< Updated upstream
=======
      { path: 'meetings', loadComponent: () => import('@features/dashboard/meetings/meetings-home.component').then(m => m.MeetingsHomeComponent) },
      { path: 'logs', loadComponent: () => import('@features/dashboard/activity-logs/activity-logs.component').then(m => m.ActivityLogsComponent) },
>>>>>>> Stashed changes
      { path: 'profile', loadComponent: () => import('@features/dashboard/profile/profile').then(m => m.ProfileComponent) }
    ]
  }
];
