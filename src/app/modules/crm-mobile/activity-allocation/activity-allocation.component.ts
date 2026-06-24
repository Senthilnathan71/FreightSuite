import {
  Component,
  OnInit,
  ElementRef,
  OnDestroy,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  ActivityAllocationService,
  ResourceSummaryRow,
  SummaryMode,
} from './activity-allocation.service';
import { Router, ActivatedRoute } from '@angular/router';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { forkJoin, Subject, of } from 'rxjs';
import { takeUntil, switchMap, tap, catchError, map, filter } from 'rxjs/operators';

type SummarySortColumn =
  | 'userName'
  | 'rateRequestCount'
  | 'quotationCount'
  | 'bookingCount'
  | 'masterJobCount'
  | 'houseJobCount'
  | 'jobCount'
  | 'blCount'
  | 'siCount'
  | 'invoiceCount'
  | 'total';

@Component({
  selector: 'app-activity-allocation',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './activity-allocation.component.html',
  styleUrls: ['./activity-allocation.component.scss'],
})
export class ActivityAllocationComponent implements OnInit, OnDestroy {
  mode: SummaryMode = 'Pending';

  rows: ResourceSummaryRow[] = [];
  displayRows: (ResourceSummaryRow & { total: number })[] = [];

  private filteredRows: ResourceSummaryRow[] = [];

  private cachedPendingRows: ResourceSummaryRow[] = [];
  private cachedProcessedRows: ResourceSummaryRow[] = [];

  cachedGlobalPendingCount = 0;
  cachedGlobalProcessedCount = 0;
  isGlobalCountsLoaded = false;

  private loadGlobalTrigger$ = new Subject<void>();

  private loadModeTrigger$ = new Subject<SummaryMode>();

  isLoading = false;
  isLoadingGlobalCounts = false;
  error: string | null = null;
  successMessage: string | null = null;
  animatedTotalActivities = 0;
  animatedPendingCount = 0;
  animatedProcessedCount = 0;
  animatedTotalUsersCount = 0;
  animatedCompletedThisWeek = 0;

  sortColumn: SummarySortColumn = 'userName';
  sortDirection: 'asc' | 'desc' = 'asc';
  searchText = '';

  private destroy$ = new Subject<void>();
  private searchDebounceTimeout: any;
  private animationTimers: Partial<Record<string, any>> = {};

  constructor(
    private activityService: ActivityAllocationService,
    private router: Router,
    private appSettingService: AppSettingsService,
    private route: ActivatedRoute,
    private elementRef: ElementRef,
    private cdr: ChangeDetectorRef,
  ) {
    this.setupGlobalDataLoader();
    this.setupModeLoader();
  }

  ngOnInit(): void {
    console.log('🔄 [ngOnInit] Component initialized');

    this.checkNavigationReturn();

    // This screen only ever shows the Pending workload
    this.mode = 'Pending';
    this.loadSummaryForMode(this.mode);
  }

  ngOnDestroy(): void {
    console.log('🧹 [ngOnDestroy] Component destroyed');
    this.destroy$.next();
    this.destroy$.complete();
    this.clearTimeouts();
    this.clearAnimationTimers();
  }

 

  private setupGlobalDataLoader(): void {
    this.loadGlobalTrigger$
      .pipe(
        takeUntil(this.destroy$),
        filter(() => !this.isGlobalCountsLoaded),
        tap(() => {
          this.isLoadingGlobalCounts = true;
          console.log('🔄 [GlobalLoad] Starting...');
        }),
        switchMap(() =>
          forkJoin({
            pending: this.activityService.getResourceSummary('Pending'),
            processed: this.activityService.getResourceSummary('Processed'),
          }).pipe(
            catchError(err => {
              console.error('❌ [GlobalLoad] Failed:', err);
              return of(null);
            }),
          ),
        ),
      )
      .subscribe(result => {
        this.isLoadingGlobalCounts = false;

        if (result) {
          this.cachedPendingRows = result.pending || [];
          this.cachedProcessedRows = result.processed || [];

          this.cachedGlobalPendingCount = this.calculateTotalActivities(this.cachedPendingRows);
          this.cachedGlobalProcessedCount = this.calculateTotalActivities(this.cachedProcessedRows);

          this.isGlobalCountsLoaded = true;
          console.log(
            '✅ [GlobalLoad] Complete. Total:',
            this.cachedGlobalPendingCount + this.cachedGlobalProcessedCount,
          );

          if (this.mode === 'All') {
            this.syncAnimatedCounts();
            this.cdr.detectChanges();
          }
        } else {
          
          this.isGlobalCountsLoaded = false;
          this.cachedPendingRows = [];
          this.cachedProcessedRows = [];
          this.cachedGlobalPendingCount = 0;
          this.cachedGlobalProcessedCount = 0;
          this.syncAnimatedCounts();
          this.cdr.detectChanges();
        }
      });
  }

  

  private setupModeLoader(): void {
    this.loadModeTrigger$
      .pipe(
        takeUntil(this.destroy$),
        tap(mode => {
          this.isLoading = true;
          this.error = null;
          this.clearTimeouts();
          console.log('🔄 [ModeLoad] Starting for mode:', mode);
        }),
        switchMap(mode =>
          this.activityService.getResourceSummary(mode).pipe(
            map(data => ({ mode, data })),
            catchError(err => {
              console.error('❌ [ModeLoad] Error:', err);
              this.appSettingService.showError('Failed to load Activity Allocation summary.');
              return of({ mode, data: [] as ResourceSummaryRow[] });
            }),
          ),
        ),
      )
      .subscribe(({ mode, data }) => {
        if (this.mode !== mode) {
          console.warn(
            `⚠️ [ModeLoad] Ignored result for ${mode} because current mode is ${this.mode}`,
          );
          return;
        }

        this.rows = data || [];
        this.applySortingAndFiltering();
        this.isLoading = false;
        this.syncAnimatedCounts();
        this.cdr.detectChanges();
        console.log('✅ [ModeLoad] Complete for mode:', mode);
      });
  }

  private triggerGlobalLoad(): void {
    if (!this.isGlobalCountsLoaded) {
      this.loadGlobalTrigger$.next();
    }
  }

  private resetGlobalCounts(): void {
    this.isGlobalCountsLoaded = false;
    this.cachedGlobalPendingCount = 0;
    this.cachedGlobalProcessedCount = 0;
    this.cachedPendingRows = [];
    this.cachedProcessedRows = [];
    console.log('🗑️ [Cache] Global counts reset');
  }

 

  private checkNavigationReturn(): void {
    const navigation = this.router.getCurrentNavigation();
    const state = navigation?.extras?.state;

    if (state?.['returnFromDetail']) {
      console.log('🔙 [Navigation] Detected return from Detail');
      this.invalidateCache();
    }
  }

  private invalidateCache(): void {
    console.log('🗑️ [Cache] Invalidating all cache');
    this.resetGlobalCounts();
    this.rows = [];
    this.displayRows = [];
    this.filteredRows = [];
  }

  private calculateTotalActivities(rows: ResourceSummaryRow[]): number {
    if (!rows || rows.length === 0) return 0;
    return rows.reduce(
      (sum, r) =>
        sum +
        (r.rateRequestCount || 0) +
        (r.quotationCount || 0) +
        (r.bookingCount || 0) +
        (r.masterJobCount || 0) +
        (r.houseJobCount || 0),
      0,
    );
  }

 

  private loadSummaryForMode(mode: SummaryMode): void {
    this.loadModeTrigger$.next(mode);
  }

 


  


  

  get totalActivities(): number {
    if (!this.displayRows.length) return 0;
    return this.displayRows.reduce((sum, r) => sum + (r.total || 0), 0);
  }

  get totalUsersCount(): number {
    return this.displayRows.length;
  }

  get pendingCount(): number {
    if (this.mode === 'Pending') return this.totalActivities;
    if (this.mode === 'Processed') return 0;

    if (this.mode === 'All') {
     
      if (this.searchText.trim() && this.isGlobalCountsLoaded) {
        const matching = this.filterDataBySearch(this.cachedPendingRows);
        return this.calculateTotalActivities(matching);
      }
      
      if (this.isGlobalCountsLoaded) {
        return this.cachedGlobalPendingCount;
      }
      
      return 0;
    }
    return 0;
  }

  get pendingPercent(): number {
    if (this.mode === 'Pending') return 100;
    const total = this.allModeTotalActivities;
    if (total === 0) return 0;
    return (this.pendingCount / total) * 100;
  }

  get processedCount(): number {
    if (this.mode === 'Processed') return this.totalActivities;
    if (this.mode === 'Pending') return 0;

    if (this.mode === 'All') {
      if (this.searchText.trim() && this.isGlobalCountsLoaded) {
        const matching = this.filterDataBySearch(this.cachedProcessedRows);
        return this.calculateTotalActivities(matching);
      }
      if (this.isGlobalCountsLoaded) {
        return this.cachedGlobalProcessedCount;
      }
      return 0;
    }
    return 0;
  }

  get processedPercent(): number {
    if (this.mode === 'Processed') return 100;
    const total = this.allModeTotalActivities;
    if (total === 0) return 0;
    return (this.processedCount / total) * 100;
  }

  get completedThisWeek(): number {
    if (this.mode === 'Processed') return Math.floor(this.totalActivities * 0.18);
    return 0;
  }

  get allModeTotalActivities(): number {
    if (this.mode !== 'All') return 0;
    if (this.searchText.trim()) {
      return this.pendingCount + this.processedCount;
    }
    return this.cachedGlobalPendingCount + this.cachedGlobalProcessedCount;
  }

  getTotal(row: ResourceSummaryRow): number {
    return (
      (row.rateRequestCount || 0) +
      (row.quotationCount || 0) +
      (row.bookingCount || 0) +
      (row.masterJobCount || 0) +
      (row.houseJobCount || 0)
    );
  }

  

  getSearchPlaceholder(): string {
    if (this.searchText && this.displayRows.length) {
      return `${this.displayRows.length} result${this.displayRows.length === 1 ? '' : 's'} found`;
    }
    return 'Search by user or activity count...';
  }

  onSearchTextChange(): void {
    if (this.searchDebounceTimeout) clearTimeout(this.searchDebounceTimeout);
    this.searchDebounceTimeout = setTimeout(() => {
      this.applySortingAndFiltering();
    }, 300);
  }

  clearSearch(): void {
    this.searchText = '';
    this.applySortingAndFiltering();
    this.syncAnimatedCounts();
  }

  private filterDataBySearch(data: ResourceSummaryRow[]): ResourceSummaryRow[] {
    const search = this.searchText.trim().toLowerCase();
    if (!search) return data;

    return data.filter(r => {
      const values = [
        r.userName,
        r.rateRequestCount,
        r.quotationCount,
        r.bookingCount,
        r.masterJobCount,
        r.houseJobCount
      ];
      return values.map(v => String(v ?? '').toLowerCase()).some(v => v.includes(search));
    });
  }

  private applySortingAndFiltering(): void {
    this.filteredRows = this.filterDataBySearch(this.rows);

    const rowsWithTotal = this.filteredRows.map(r => ({
      ...r,
      total: this.getTotal(r),
    }));

    rowsWithTotal.sort((a: any, b: any) => {
      const col = this.sortColumn;
      let av = a[col];
      let bv = b[col];

      if (col === 'userName') {
        av = String(av || '');
        bv = String(bv || '');
        const cmp = av.localeCompare(bv);
        return this.sortDirection === 'asc' ? cmp : -cmp;
      }

      if (col === 'total') {
        av = a.total;
        bv = b.total;
      }

      av = Number(av) || 0;
      bv = Number(bv) || 0;
      const cmp = av - bv;
      return this.sortDirection === 'asc' ? cmp : -cmp;
    });

    this.displayRows = rowsWithTotal;
    this.syncAnimatedCounts();
    this.cdr.detectChanges();
  }

  changeSort(column: SummarySortColumn): void {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    this.applySortingAndFiltering();
  }

  

  getBadgeClass(): string {
    switch (this.mode) {
      case 'Pending':
        return 'badge-warning';
      case 'Processed':
        return 'badge-success';
      case 'All':
        return 'badge-info';
      default:
        return 'badge-secondary';
    }
  }

  getSortIcon(column: SummarySortColumn): string {
    if (this.sortColumn !== column) return 'fa-sort text-muted';
    return this.sortDirection === 'asc' ? 'fa-sort-up' : 'fa-sort-down';
  }

  getAriaSortState(column: SummarySortColumn): 'ascending' | 'descending' | 'none' {
    if (this.sortColumn !== column) return 'none';
    return this.sortDirection === 'asc' ? 'ascending' : 'descending';
  }

  getStageButtonLabel(stage: string, count: number, userName: string): string {
    if (count === 0) return `No ${stage} activities`;
    return `View ${count} ${stage} ${count === 1 ? 'activity' : 'activities'} for ${userName}`;
  }

  

  openWorkload(stage: string, row: ResourceSummaryRow): void {
    if (!row.userSid) {
      this.appSettingService.showWarning('User ID not available');
      return;
    }
    this.router.navigate(['/settings/activity-allocation/entry'], {
      state: {
        userSid: row.userSid,
        userName: row.userName,
        stage: stage,
        mode: this.mode,
      },
    });
  }

  onResetClick(): void {
    this.searchText = '';
    this.sortColumn = 'userName';
    this.sortDirection = 'asc';

    
    if (this.mode === 'All') {
      this.resetGlobalCounts();
      this.syncAnimatedCounts(true);
      this.triggerGlobalLoad();
    }

    this.loadSummaryForMode(this.mode);
  }

  

  private syncAnimatedCounts(reset = false): void {
    if (reset) {
      this.clearAnimationTimers();
      this.animatedTotalActivities = 0;
      this.animatedPendingCount = 0;
      this.animatedProcessedCount = 0;
      this.animatedTotalUsersCount = 0;
      this.animatedCompletedThisWeek = 0;
    }

    this.animateCount('animatedTotalActivities', this.totalActivities);
    this.animateCount('animatedPendingCount', this.pendingCount);
    this.animateCount('animatedProcessedCount', this.processedCount);
    this.animateCount('animatedTotalUsersCount', this.totalUsersCount);
    this.animateCount('animatedCompletedThisWeek', this.completedThisWeek);
  }

  private animateCount(
    key:
      | 'animatedTotalActivities'
      | 'animatedPendingCount'
      | 'animatedProcessedCount'
      | 'animatedTotalUsersCount'
      | 'animatedCompletedThisWeek',
    target: number,
  ): void {
    if (this.animationTimers[key]) {
      clearInterval(this.animationTimers[key]);
      this.animationTimers[key] = null;
    }

    const safeTarget = Math.max(0, Math.floor(target || 0));
    const start = Number(this[key]) || 0;

    if (start === safeTarget) {
      return;
    }

    if (safeTarget < start) {
      this[key] = safeTarget;
      this.cdr.detectChanges();
      return;
    }

    const durationMs = 800;
    const steps = 30;
    const increment = Math.max(1, Math.ceil((safeTarget - start) / steps));
    const intervalMs = Math.max(20, Math.floor(durationMs / steps));

    this.animationTimers[key] = setInterval(() => {
      const nextValue = Math.min(safeTarget, (Number(this[key]) || 0) + increment);
      this[key] = nextValue;

      if (nextValue >= safeTarget) {
        clearInterval(this.animationTimers[key]);
        this.animationTimers[key] = null;
      }

      this.cdr.detectChanges();
    }, intervalMs);
  }

  private clearTimeouts(): void {
    if (this.searchDebounceTimeout) {
      clearTimeout(this.searchDebounceTimeout);
      this.searchDebounceTimeout = null;
    }
  }

  private clearAnimationTimers(): void {
    Object.keys(this.animationTimers).forEach(key => {
      const timer = this.animationTimers[key];
      if (timer) {
        clearInterval(timer);
      }
      this.animationTimers[key] = null;
    });
  }
}
