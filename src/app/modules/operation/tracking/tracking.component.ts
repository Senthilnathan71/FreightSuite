import { CommonModule } from '@angular/common';
import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgbNavModule } from '@ng-bootstrap/ng-bootstrap';
import { Subject, takeUntil } from 'rxjs';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { OperationService } from '../operation.service';

interface TrackingMilestone {
  code: string;
  title: string;
  status: string;
  state: 'completed' | 'current' | 'pending' | 'exception';
  location?: string | null;
  eventDate?: string | null;
  remarks?: string | null;
}

interface OverviewCard {
  key: string;
  label: string;
  value: string;
  meta: string;
  primary?: boolean;
}

interface DetailCard {
  key: string;
  label: string;
  value: string;
}

@Component({
  selector: 'app-tracking',
  standalone: true,
  imports: [CommonModule, FormsModule, NgbNavModule],
  templateUrl: './tracking.component.html',
  styleUrls: ['./tracking.component.scss'],
})
export class TrackingComponent implements OnInit, OnDestroy {
  activeTab = 1;
  searchText = '';
  trackingResult: any | null = null;
  isLoading = false;
  hasSearched = false;
  errorMessage = '';
  userData: any;
  currentCompany: any;
  currentBranch: any;
  isPaused = false;

  readonly quickSearches = ['Booking No', 'HBL / HAWB', 'MBL / MAWB', 'Job No', 'Container No'];
  selectedSearchType = 'Booking No';

  private readonly destroy$ = new Subject<void>();

  @HostListener('touchstart')
  onTouchStart(): void {
    this.isPaused = true;
  }

  @HostListener('touchend')
  onTouchEnd(): void {
    this.isPaused = false;
  }

  constructor(
    private readonly operationService: OperationService,
    private readonly appSettings: AppSettingsService
  ) {}

  ngOnInit(): void {
    this.currentCompany = this.appSettings.getCurrentCompanyInfo();
    this.currentBranch = this.appSettings.getCurrentBranchInfo();

    this.appSettings.getUser().pipe(takeUntil(this.destroy$)).subscribe((userData) => {
      this.userData = userData;
    });
  }

  onSearchClick(): void {
    const referenceNo = this.searchText?.trim();
    this.hasSearched = true;
    this.errorMessage = '';

    if (!referenceNo) {
      this.trackingResult = null;
      this.errorMessage = 'Enter a booking, HBL/HAWB, MBL/MAWB, job, shipment, or container number.';
      return;
    }

    this.isLoading = true;
    this.operationService
      .trackShipment(referenceNo, this.buildTrackingContext())
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          if (response?.success === false || response?.status === false) {
            this.trackingResult = null;
            this.errorMessage = response?.message || 'No tracking details found.';
            this.isLoading = false;
            return;
          }

          this.trackingResult = response?.data || null;
          this.errorMessage = this.trackingResult ? '' : 'No tracking details found.';
          this.isLoading = false;
        },
        error: (error: any) => {
          this.trackingResult = null;
          this.errorMessage = error?.error?.message || 'Unable to fetch tracking details right now.';
          this.isLoading = false;
        },
      });
  }

  applyQuickSearch(type: string): void {
    this.selectedSearchType = type;
  }

  activeSearchType(): string {
    return this.trackingResult?.summary?.detectedReferenceType
      ? this.searchTypeFromDetectedType(this.trackingResult.summary.detectedReferenceType)
      : this.selectedSearchType;
  }

  private searchTypeFromDetectedType(type: string): string {
    const normalized = String(type || '').toUpperCase();

    if (['HBL', 'HAWB'].includes(normalized)) return 'HBL / HAWB';
    if (['MBL', 'MAWB'].includes(normalized)) return 'MBL / MAWB';
    if (normalized === 'JOB') return 'Job No';
    if (normalized === 'CONTAINER') return 'Container No';
    return 'Booking No';
  }

  transportMode(tracking: any): string {
    const info = tracking?.shipmentInfo || {};
    const mode = String(info.transportMode || info.departmentType || info.movementType || '').toUpperCase();
    if (mode.includes('AIR')) return 'AIR';
    if (mode.includes('SEA')) return 'SEA';
    if (mode.includes('ROAD') || mode.includes('TRANSPORT')) return 'ROAD';
    return mode || 'SEA';
  }

  isAirShipment(tracking: any): boolean {
    return this.transportMode(tracking) === 'AIR';
  }

  isSeaShipment(tracking: any): boolean {
    return this.transportMode(tracking) === 'SEA';
  }

  hblLabel(tracking: any): string {
    return this.isAirShipment(tracking) ? 'HAWB' : 'HBL / HAWB';
  }

  mblLabel(tracking: any): string {
    return this.isAirShipment(tracking) ? 'MAWB' : 'MBL / MAWB';
  }

  scheduleLabel(tracking: any): string {
    return this.isAirShipment(tracking) ? 'Airline / Flight' : 'Vessel / Voyage';
  }

  showContainerSection(tracking: any): boolean {
    return !this.isAirShipment(tracking) && this.containerCount(tracking) > 0;
  }

  voyageLegs(tracking: any): any[] {
    return (tracking?.shipmentInfo?.voyageLegs || [])
      .filter((leg: any) => this.hasDisplayValue(leg?.vesselVoyage || leg?.vesselName || leg?.voyageNo || leg?.etd || leg?.eta));
  }

  isMultiLegSchedule(tracking: any): boolean {
    return this.voyageLegs(tracking).length > 1;
  }

  transhipmentLegRoute(leg: any): string {
    return [leg?.pol, leg?.pod].filter((value) => this.hasDisplayValue(value)).join(' -> ') || 'Route pending';
  }

  transhipmentLegSchedule(leg: any): string {
    const etd = this.formatDisplayDate(leg?.etd);
    const eta = this.formatDisplayDate(leg?.eta);
    return [etd !== '-' ? `ETD ${etd}` : '', eta !== '-' ? `ETA ${eta}` : '']
      .filter(Boolean)
      .join(' / ') || 'Schedule pending';
  }

  transhipmentLegEtd(leg: any): string {
    return this.formatDisplayDate(leg?.etd);
  }

  transhipmentLegEta(leg: any): string {
    return this.formatDisplayDate(leg?.eta);
  }

  transhipmentLegTitle(leg: any, index: number, isLast: boolean): string {
    if (leg?.legType) {
      return leg.legType;
    }

    if (index === 0) {
      return 'First Leg';
    }

    return isLast ? 'Final Leg' : `Leg ${index + 1}`;
  }

  transhipmentLegVessel(leg: any): string {
    return this.displayValue(leg?.vesselVoyage || [leg?.vesselName, leg?.voyageNo].filter(Boolean).join(' / '));
  }

  trackByVoyageLeg(index: number, leg: any): string {
    return `${leg?.sequence || index}-${leg?.vesselVoyage || leg?.pol || 'leg'}`;
  }

  routeLabel(point: any, index?: number): string {
    if (!point) {
      return ['Origin', 'POL', 'POD', 'Final Destination'][index || 0] || '-';
    }

    if (typeof point === 'string') {
      return point;
    }

    return [point.portCode, point.portName, point.countryCode].filter(Boolean).join(' - ') || '-';
  }

  routePoints(tracking: any): Array<{ label: string; role: string }> {
    const legRoute = this.transhipmentRoutePoints(tracking);
    if (legRoute.length) {
      return legRoute;
    }

    const route = tracking?.routeInfo?.route || [];
    const origin = tracking?.routeInfo?.origin || route[0];
    const pol = tracking?.routeInfo?.pol || route[1];
    const pod = tracking?.routeInfo?.pod || route[2];
    const finalDestination = tracking?.routeInfo?.finalDestination || route[3];

    return [
      { label: this.routeLabel(origin, 0), role: 'Origin' },
      { label: this.routeLabel(pol, 1), role: 'POL' },
      { label: this.routeLabel(pod, 2), role: 'POD' },
      { label: this.routeLabel(finalDestination, 3), role: 'Final' },
    ];
  }

  private transhipmentRoutePoints(tracking: any): Array<{ label: string; role: string }> {
    const legs = this.voyageLegs(tracking);
    if (legs.length < 2) {
      return [];
    }

    const firstLeg = legs[0];
    const finalLeg = legs[legs.length - 1];
    const points = [
      { label: this.displayValue(firstLeg?.pol), role: 'Origin' },
      { label: this.displayValue(firstLeg?.pod), role: 'First POD' },
      { label: this.displayValue(finalLeg?.pol), role: 'Final POL' },
      { label: this.displayValue(finalLeg?.pod), role: 'Final' },
    ];

    return points.map((point, index) => ({
      label: this.hasDisplayValue(point.label) ? point.label : this.routeLabel(null, index),
      role: point.role,
    }));
  }

  routeProgressIndex(tracking: any): number {
    const status = String(tracking?.currentStatus?.label || tracking?.currentStatus?.eventName || tracking?.shipmentInfo?.shipmentStatus || '').toLowerCase();

    if (status.includes('delivered') || status.includes('completed')) {
      return 3;
    }

    if (status.includes('pod') || status.includes('arrived') || status.includes('destination')) {
      return 2;
    }

    if (status.includes('transit') || status.includes('sailing') || status.includes('departed')) {
      return 1;
    }

    return 0;
  }

  routeProgressPercent(tracking: any): number {
    return [0, 33.33, 66.66, 100][this.routeProgressIndex(tracking)] || 0;
  }

  routePointClass(index: number, tracking: any): string {
    const progressIndex = this.routeProgressIndex(tracking);

    if (index < progressIndex) {
      return 'completed';
    }

    if (index === progressIndex) {
      return 'active';
    }

    return 'pending';
  }

  milestoneClass(milestone: TrackingMilestone): Record<string, boolean> {
    return {
      completed: milestone.state === 'completed',
      current: milestone.state === 'current',
      pending: milestone.state === 'pending',
      exception: milestone.state === 'exception',
    };
  }

  statusClass(status?: string): string {
    const normalized = String(status || '').toLowerCase();

    if (normalized.includes('confirm') || normalized.includes('complete') || normalized.includes('delivered')) {
      return 'success';
    }

    if (normalized.includes('cancel') || normalized.includes('hold') || normalized.includes('exception')) {
      return 'danger';
    }

    if (normalized.includes('pending') || normalized.includes('unknown')) {
      return 'warning';
    }

    return 'info';
  }

  displayValue(value: any, fallback = '-'): string {
    return value === null || value === undefined || value === '' ? fallback : String(value);
  }

  milestoneStatusLabel(milestone: TrackingMilestone): string {
    if (milestone.eventDate) {
      return milestone.status;
    }

    return milestone.state === 'current' ? 'Current' : milestone.status || 'Pending';
  }

  milestoneIcon(milestone: TrackingMilestone): string {
    if (milestone.state === 'completed') {
      return 'fa-check';
    }

    if (milestone.state === 'current') {
      return 'fa-dot-circle';
    }

    if (milestone.state === 'exception') {
      return 'fa-exclamation';
    }

    return 'fa-circle';
  }

  completedMilestoneCount(tracking: any): number {
    return (tracking?.milestones || []).filter((milestone: TrackingMilestone) =>
      ['completed', 'current'].includes(milestone.state)
    ).length;
  }

  containerCount(tracking: any): number {
    return tracking?.containers?.length || 0;
  }

  totalWeight(tracking: any): string {
    const total = (tracking?.containers || []).reduce((sum: number, container: any) => {
      return sum + (Number(container?.weight) || 0);
    }, 0);

    return total ? `${total.toLocaleString(undefined, { maximumFractionDigits: 2 })}kg` : '-';
  }

  formatMeasure(value: any, unit: string): string {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
      return '-';
    }

    return `${parsed.toLocaleString(undefined, { maximumFractionDigits: 3 })} ${unit}`;
  }

  currentStatusDate(tracking: any): string {
    return this.formatDisplayDateTime(tracking?.currentStatus?.eventDate || tracking?.summary?.lastUpdated, 'Date pending');
  }

  shipmentInfoValue(tracking: any, ...keys: string[]): string {
    const info = tracking?.shipmentInfo || {};
    const value = keys.map((key) => info[key]).find((item) => item !== null && item !== undefined && item !== '');
    return this.displayValue(value);
  }

  shipmentDetailCards(tracking: any): DetailCard[] {
    const rawCards: DetailCard[] = [
      {
        key: 'booking',
        label: 'Booking No',
        value: this.shipmentInfoValue(tracking, 'bookingNumber', 'bookingNo'),
      },
      {
        key: 'job',
        label: 'Job No',
        value: this.shipmentInfoValue(tracking, 'jobNumber', 'jobNo'),
      },
      {
        key: 'hbl',
        label: this.hblLabel(tracking),
        value: this.shipmentInfoValue(tracking, 'hblHawbNumber', 'hblNo'),
      },
      {
        key: 'mbl',
        label: this.mblLabel(tracking),
        value: this.shipmentInfoValue(tracking, 'mblMawbNumber', 'mblNo'),
      },
      {
        key: 'department',
        label: 'Department',
        value: this.displayValue(tracking?.shipmentInfo?.department),
      },
      {
        key: 'jobType',
        label: 'Job Type',
        value: this.shipmentInfoValue(tracking, 'jobType', 'movementType', 'movement'),
      },
    ];

    return this.uniqueValueCards(rawCards);
  }

  searchedReferenceValue(tracking: any): string {
    const type = this.activeSearchType();

    if (type === 'HBL / HAWB') {
      return this.shipmentInfoValue(tracking, 'hblHawbNumber', 'hblNo');
    }

    if (type === 'MBL / MAWB') {
      return this.shipmentInfoValue(tracking, 'mblMawbNumber', 'mblNo');
    }

    if (type === 'Job No') {
      return this.shipmentInfoValue(tracking, 'jobNumber', 'jobNo');
    }

    if (type === 'Container No') {
      return this.overviewContainerNo(tracking);
    }

    return this.shipmentInfoValue(tracking, 'bookingNumber', 'bookingNo');
  }

  overviewContainerNo(tracking: any): string {
    const searchedReference = this.displayValue(tracking?.summary?.searchedReference, '').toUpperCase();
    const matchedContainer = (tracking?.containers || []).find((container: any) =>
      String(container?.containerNo || '').toUpperCase() === searchedReference
    );
    const container = matchedContainer || tracking?.containers?.[0];

    return this.displayValue(container?.containerNo, 'Pending container assignment');
  }

  overviewCards(tracking: any): OverviewCard[] {
    const info = tracking?.shipmentInfo || {};
    const containerCount = this.containerCount(tracking);
    const rawCards: OverviewCard[] = [
      {
        key: 'shipmentStatus',
        label: 'Shipment Status',
        value: this.displayValue(tracking?.currentStatus?.label || tracking?.currentStatus?.eventName || info.shipmentStatus, 'Pending'),
        meta: this.currentStatusDate(tracking),
        primary: true,
      },
      {
        key: 'routeStage',
        label: 'Current Route Stage',
        value: this.currentRouteStageValue(tracking),
        meta: this.currentRouteStageMeta(tracking),
      },
      {
        key: 'milestoneProgress',
        label: 'Milestone Progress',
        value: this.milestoneProgressValue(tracking),
        meta: this.milestoneProgressMeta(tracking),
      },
      {
        key: 'movement',
        label: 'Movement',
        value: this.movementOverviewValue(tracking),
        meta: this.displayValue(info.customerName, 'Customer pending'),
      },
      ...(this.showContainerSection(tracking)
        ? [{
            key: 'container',
            label: 'Container Summary',
            value: `${containerCount} container${containerCount === 1 ? '' : 's'}`,
            meta: `${containerCount} container${containerCount === 1 ? '' : 's'} linked.`,
          }]
        : []),
    ];

    const headerValues = this.shipmentDetailCards(tracking).map((card) => card.value);
    return this.uniqueOverviewCards(rawCards, headerValues);
  }

  currentRouteStageValue(tracking: any): string {
    const point = this.routePoints(tracking)[this.routeProgressIndex(tracking)];
    return this.displayValue(point?.label);
  }

  currentRouteStageMeta(tracking: any): string {
    const point = this.routePoints(tracking)[this.routeProgressIndex(tracking)];
    return this.displayValue(point?.role, 'Route stage');
  }

  milestoneProgressValue(tracking: any): string {
    const total = tracking?.milestones?.length || 0;
    const completed = this.completedMilestoneCount(tracking);
    return total ? `${completed} / ${total}` : '-';
  }

  milestoneProgressMeta(tracking: any): string {
    const total = tracking?.milestones?.length || 0;
    if (!total) {
      return 'Milestone updates pending';
    }

    const completed = this.completedMilestoneCount(tracking);
    return `${completed} milestone${completed === 1 ? '' : 's'} completed or active`;
  }

  movementOverviewValue(tracking: any): string {
    const department = this.displayValue(tracking?.shipmentInfo?.department, '');
    const jobType = this.shipmentInfoValue(tracking, 'jobType', 'movementType', 'movement');
    const values = [department, jobType].filter((value) => this.hasDisplayValue(value));
    return this.joinUnique(values);
  }

  trackByDetailCard(index: number, card: DetailCard): string {
    return card?.key || `${index}`;
  }

  trackByOverviewCard(index: number, card: OverviewCard): string {
    return card?.key || `${index}`;
  }

  hasVoyageSchedule(tracking: any): boolean {
    const info = tracking?.shipmentInfo || {};
    return this.voyageLegs(tracking).length > 0 || [info.vesselVoyage, info.vesselName, info.voyageNo, info.etd, info.eta, info.atd, info.ata]
      .some((value) => this.hasDisplayValue(value));
  }

  vesselVoyageValue(tracking: any): string {
    const info = tracking?.shipmentInfo || {};
    return this.displayValue(info.vesselVoyage || [info.vesselName, info.voyageNo].filter(Boolean).join(' / '));
  }

  departureDateLabel(tracking: any): string {
    return 'ETD';
  }

  departureDateValue(tracking: any): string {
    const info = tracking?.shipmentInfo || {};
    return this.formatDisplayDate(info.etd || info.atd);
  }

  departureDateMeta(tracking: any): string {
    const info = tracking?.shipmentInfo || {};
    return info.atd ? `ATD ${this.formatDisplayDate(info.atd)}` : 'Estimated departure';
  }

  arrivalDateLabel(tracking: any): string {
    return 'ETA';
  }

  arrivalDateValue(tracking: any): string {
    const info = tracking?.shipmentInfo || {};
    return this.formatDisplayDate(info.eta || info.ata);
  }

  arrivalDateMeta(tracking: any): string {
    const info = tracking?.shipmentInfo || {};
    return info.ata ? `ATA ${this.formatDisplayDate(info.ata)}` : 'Estimated arrival';
  }

  scheduleLegLabel(tracking: any): string {
    const legs = tracking?.shipmentInfo?.voyageLegs || [];
    if (legs.length > 1) {
      return `${legs.length} connected ${this.isAirShipment(tracking) ? 'flight' : 'voyage'} legs`;
    }

    return 'Connected schedule';
  }

  private uniqueOverviewCards(cards: OverviewCard[], excludedValues: string[] = []): OverviewCard[] {
    const seenValues = new Set<string>(excludedValues.map((value) => this.normalizeCardValue(value)).filter(Boolean));

    return cards.filter((card) => {
      const value = this.displayValue(card?.value, '').trim();
      if (!value || value === '-' || value.toLowerCase().includes('pending container assignment')) {
        return false;
      }

      const normalized = this.normalizeCardValue(value);
      if (seenValues.has(normalized)) {
        return false;
      }

      seenValues.add(normalized);
      return true;
    });
  }

  private uniqueValueCards<T extends { value: string }>(cards: T[]): T[] {
    const seenValues = new Set<string>();

    return cards.filter((card) => {
      const value = this.displayValue(card?.value, '').trim();
      if (!value || value === '-') {
        return false;
      }

      const normalized = this.normalizeCardValue(value);
      if (seenValues.has(normalized)) {
        return false;
      }

      seenValues.add(normalized);
      return true;
    });
  }

  private normalizeCardValue(value: any): string {
    return this.displayValue(value, '')
      .trim()
      .replace(/\s+/g, ' ')
      .toLowerCase();
  }

  private joinUnique(values: any[], separator = ' / '): string {
    const seen = new Set<string>();
    const items = values
      .map((value) => this.displayValue(value, '').trim())
      .filter((value) => {
        if (!value || value === '-') {
          return false;
        }

        const normalized = this.normalizeCardValue(value);
        if (seen.has(normalized)) {
          return false;
        }

        seen.add(normalized);
        return true;
      });

    return items.join(separator) || '-';
  }

  private hasDisplayValue(value: any): boolean {
    const display = this.displayValue(value, '').trim();
    return !!display && display !== '-' && !display.toLowerCase().includes('pending');
  }

  private voyageLegSummary(info: any): string {
    const legs = info?.voyageLegs || [];
    if (legs.length > 1) {
      return `${legs.length} voyage legs`;
    }

    return [this.formatDisplayDate(info?.etd), this.formatDisplayDate(info?.eta)]
      .filter((value) => value !== '-')
      .join(' to ') || 'Schedule pending';
  }

  milestoneTitle(milestone: any): string {
    return this.displayValue(milestone?.title || milestone?.eventName, 'Milestone');
  }

  milestoneDateTime(milestone: any): string {
    return this.formatDisplayDateTime(milestone?.eventDate, 'Pending');
  }

  private formatDisplayDateTime(value: any, fallback = '-'): string {
    if (!value) {
      return fallback;
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return this.displayValue(value, fallback);
    }

    return parsed.toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  }

  private formatDisplayDate(value: any, fallback = '-'): string {
    if (!value) {
      return fallback;
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return this.displayValue(value, fallback);
    }

    return parsed.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  downloadDocument(document: any): void {
    const downloadUrl = document?.downloadUrl;
    if (!downloadUrl) {
      return;
    }

    this.operationService.downloadTrackingDocument(downloadUrl).subscribe({
      next: (response: any) => {
        const blob = response.body;
        if (!blob) {
          return;
        }

        const objectUrl = window.URL.createObjectURL(blob);
        const anchor = window.document.createElement('a');
        anchor.href = objectUrl;
        anchor.download = document?.fileName || document?.documentName || 'document';
        anchor.click();
        window.URL.revokeObjectURL(objectUrl);
      },
      error: () => {
        this.errorMessage = 'Unable to download document right now.';
      },
    });
  }
  documentDateLabel(document: any): string {
    return this.formatDisplayDateTime(document?.uploadedOn || document?.documentDate, 'Date pending');
  }

  trackByDocument(index: number, document: any): string {
    return document?.attachDocumentSid || document?.filePath || `${document?.fileName || 'document'}-${index}`;
  }
  trackByMilestone(index: number, milestone: TrackingMilestone): string {
    return milestone.code || `${(milestone as any).sequence || index}-${(milestone as any).title || (milestone as any).eventName || 'milestone'}`;
  }

  trackByContainer(index: number, container: any): string {
    return container?.containerNo || `${index}`;
  }

  goBack(): void {
    history.back();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private buildTrackingContext(): any {
    return {
      CompanyMasterSid: this.currentCompany?.CompanyMasterSid || this.userData?.CompanyMasterSid || this.userData?.companyMasterSid || '',
      BranchMasterSid: this.currentBranch?.BranchMasterSid || this.userData?.BranchMasterSid || this.userData?.branchMasterSid || '',
      CustomerMasterSid: this.userData?.CustomerMasterSid || this.userData?.customerMasterSid || '',
    };
  }
}


