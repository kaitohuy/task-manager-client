import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '@core/services/auth.service';
import { toObservable } from '@angular/core/rxjs-interop';
import { filter, map, take } from 'rxjs';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Nếu đang loading session, đợi đến khi hoàn tất
  if (authService.isLoading()) {
    return toObservable(authService.isLoading).pipe(
      filter(loading => !loading),
      take(1),
      map(() => {
        if (authService.isAuthenticated()) return true;
        return router.createUrlTree(['/login']);
      })
    );
  }

  if (authService.isAuthenticated()) {
    return true;
  }

  return router.createUrlTree(['/login']);
};
