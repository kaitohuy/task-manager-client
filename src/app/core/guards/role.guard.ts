import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { AuthService } from '@core/services/auth.service';

export const roleGuard: CanActivateFn = (route, state): boolean | UrlTree => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const requiredRoles = route.data['roles'] as Array<'ADMIN' | 'MANAGER' | 'MEMBER'>;

  if (!authService.isAuthenticated()) {
    return router.createUrlTree(['/login']);
  }

  if (!requiredRoles || requiredRoles.length === 0) {
    return true;
  }

  const hasAccess = requiredRoles.some(role => authService.hasRole(role));

  if (!hasAccess) {
    return router.createUrlTree(['/dashboard']);
  }

  return true;
};