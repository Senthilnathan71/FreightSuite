import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Subject, Subscription, timer, switchMap, takeUntil } from 'rxjs';
import { SessionStateService } from './session-state.service';

@Injectable({
  providedIn: 'root'
})
export class SessionReadOnlyPollService implements OnDestroy {
  private destroy$ = new Subject<void>();
  private pollingSub?: Subscription;

  constructor(
    private http: HttpClient,
    private sessionState: SessionStateService
  ) {}

  startPolling(screenId: string, intervalMs = 15000): void {
    this.stopPolling();

    this.pollingSub = timer(0, intervalMs)
      .pipe(
        switchMap(() => this.http.get<any>(`/api/session/status?screenId=${encodeURIComponent(screenId)}`)),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (response) => {
          const readOnly = !!response?.readOnly || response?.message === 'SESSION_ACTIVE_ELSEWHERE';
          this.sessionState.setReadOnly(readOnly);
        },
        error: () => {
          // Ignore polling errors until the backend endpoint is available.
        }
      });
  }

  stopPolling(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.destroy$ = new Subject<void>();
    this.pollingSub?.unsubscribe();
    this.pollingSub = undefined;
  }

  ngOnDestroy(): void {
    this.stopPolling();
  }
}
