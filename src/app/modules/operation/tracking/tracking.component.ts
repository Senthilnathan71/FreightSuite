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
  noShipmentFound = false;
  userData: any;
  currentCompany: any;
  currentBranch: any;
  isPaused = false;

  matchResults: any[] = [];
  showMatchModal = false;
  matchSearchType = '';
  matchedReference = '';

  readonly quickSearches = ['Booking No', 'HBL / HAWB', 'MBL / MAWB', 'Job No', 'Container No'];
  selectedSearchType = 'HBL / HAWB';

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
    this.noShipmentFound = false;
    this.showMatchModal = false;
    this.matchResults = [];

    if (!referenceNo) {
      this.trackingResult = null;
      this.errorMessage = 'Enter a booking, HBL/HAWB, MBL/MAWB, job, shipment, or container number.';
      return;
    }

    const context = { ...this.buildTrackingContext(), searchType: this.searchTypeCode() };
    this.runTracking(referenceNo, context);
  }

  /** Load tracking for a specific House Job chosen from the MULTIPLE_MATCH grid. */
  viewTracking(match: any): void {
    if (!match?.houseJobSid) {
      return;
    }

    this.showMatchModal = false;
    const referenceNo = this.searchText?.trim() || match.hblNo || String(match.houseJobSid);
    const context = {
      ...this.buildTrackingContext(),
      searchType: 'hbl',
      houseJobSid: match.houseJobSid,
    };
    this.runTracking(referenceNo, context);
  }

  closeMatchModal(): void {
    this.showMatchModal = false;
  }

  private runTracking(referenceNo: string, context: any): void {
    this.isLoading = true;
    this.operationService
      .trackShipment(referenceNo, context)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => this.handleTrackingResponse(response),
        error: (error: any) => {
          this.trackingResult = null;
          this.errorMessage = error?.error?.message || 'Unable to fetch tracking details right now.';
          this.isLoading = false;
        },
      });
  }

  private handleTrackingResponse(response: any): void {
    this.isLoading = false;
    const data = response?.data;

    if (response?.success === false || response?.status === false || !data) {
      this.trackingResult = null;
      this.errorMessage = response?.message || 'No tracking details found.';
      return;
    }

    const resultType = String(data.resultType || '').toUpperCase();

    if (resultType === 'MULTIPLE_MATCH') {
      this.trackingResult = null;
      this.matchResults = data.matches || [];
      this.matchSearchType = String(data.searchType || '').toUpperCase();
      this.matchedReference = String(data.searchedReference || '');
      this.showMatchModal = true;
      this.errorMessage = '';
      return;
    }

    if (resultType === 'NOT_FOUND') {
      this.trackingResult = null;
      this.noShipmentFound = true;
      this.errorMessage = '';
      return;
    }

    this.trackingResult = data;
    this.noShipmentFound = false;
    this.errorMessage = '';
  }

  applyQuickSearch(type: string): void {
    this.selectedSearchType = type;
  }

  private searchTypeCode(): string {
    switch (this.selectedSearchType) {
      case 'Booking No':
        return 'booking';
      case 'HBL / HAWB':
        return 'hbl';
      case 'MBL / MAWB':
        return 'mbl';
      case 'Job No':
        return 'job';
      case 'Container No':
        return 'container';
      default:
        return '';
    }
  }

  trackByMatch(index: number, match: any): string {
    return match?.houseJobSid || `${index}`;
  }

  matchModalTitle(): string {
    const type = this.matchSearchType;
    if (type === 'CONTAINER') return 'Select a House Job for this Container';
    if (type === 'MBL' || type === 'MAWB' || type === 'JOB') return 'Select a House Job';
    return 'Select the correct shipment';
  }

  matchModalSubtitle(): string {
    const type = this.matchSearchType;
    if (type === 'HBL' || type === 'HAWB') {
      return 'This HBL / HAWB is shared across multiple House Jobs. Pick the one you want to track.';
    }
    if (type === 'MBL' || type === 'MAWB') {
      return 'This MBL / MAWB master has multiple House Jobs. Pick the one you want to track.';
    }
    if (type === 'JOB') {
      return 'This Master Job has multiple House Jobs. Pick the one you want to track.';
    }
    if (type === 'CONTAINER') {
      return 'This container is mapped to multiple House Jobs. Pick the one you want to track.';
    }
    return 'Multiple House Jobs matched. Pick the one you want to track.';
  }

  /** Shared fields shown once in the modal header for Master Job / MBL / Container searches. */
  matchCommonItems(): Array<{ label: string; value: string }> {
    const first = this.matchResults[0] || {};
    const items: Array<{ label: string; value: string }> = [];
    const push = (label: string, value: any) => {
      const display = this.displayValue(value, '');
      if (display) items.push({ label, value: display });
    };
    const type = this.matchSearchType;

    if (type === 'CONTAINER') {
      push('Container No', this.matchedReference);
      push('Master Job', first.masterJobNumber);
      push('MBL / MAWB', first.mblNo);
    } else if (type === 'JOB') {
      push('Master Job', first.masterJobNumber || this.matchedReference);
      push('MBL / MAWB', first.mblNo);
    } else if (type === 'MBL' || type === 'MAWB') {
      push('MBL / MAWB', first.mblNo || this.matchedReference);
      push('Master Job', first.masterJobNumber);
    }

    return items;
  }

  /** Master Job & MBL columns stay in each row only when they differ per row (HBL search). */
  matchShowMasterMbl(): boolean {
    const type = this.matchSearchType;
    return !(type === 'CONTAINER' || type === 'JOB' || type === 'MBL' || type === 'MAWB');
  }

  matchRoute(match: any): string {
    return [match?.pol, match?.pod].filter((value) => this.hasDisplayValue(value)).join(' → ') || 'Route pending';
  }

  formatMatchDate(value: any): string {
    return this.formatDisplayDate(value);
  }

  formatLegDate(value: any): string {
    return this.formatDisplayDate(value);
  }

  /** Voyage legs for the summary table; synthesize a single leg from shipmentInfo if none. */
  summaryLegs(tracking: any): any[] {
    const legs = this.voyageLegs(tracking);
    if (legs.length) {
      return legs;
    }

    const info = tracking?.shipmentInfo || {};
    if (this.hasDisplayValue(info.vesselName || info.voyageNo || info.etd || info.eta || info.atd || info.ata)) {
      return [
        {
          legType: 'Main',
          vesselName: info.vesselName,
          voyageNo: info.voyageNo,
          vesselVoyage: info.vesselVoyage,
          etd: info.etd,
          eta: info.eta,
          atd: info.atd,
          ata: info.ata,
        },
      ];
    }

    return [];
  }

  hasScheduleTable(tracking: any): boolean {
    return this.summaryLegs(tracking).length > 0;
  }

  /**
   * Per-port schedule under each port node, following cargo business logic:
   *   POO  = Cargo Received   |  POL = ETD / ATD
   *   POD  = ETA / ATA        |  FPOD = Delivered
   * Transhipment: the T/S hub shows Leg-1 arrival and Leg-2 departure.
   */
  portScheduleItems(tracking: any, index: number): Array<{ label: string; value: string }> {
    const legs = this.voyageLegs(tracking);
    const route = tracking?.routeInfo || {};
    const items: Array<{ label: string; value: string }> = [];
    const add = (label: string, value: any) => {
      const formatted = this.formatDisplayDate(value);
      if (formatted !== '-') items.push({ label, value: formatted });
    };

    if (legs.length > 1) {
      const first = legs[0];
      const last = legs[legs.length - 1];
      if (index === 0) {
        add('Cargo Received', route.cargoReceivedDate);
        add('ETD', first?.etd);
        add('ATD', first?.atd);
      } else if (index === 1) {
        add('ETA', first?.eta);
        add('ATA', first?.ata);
      } else if (index === 2) {
        add('ETD', last?.etd);
        add('ATD', last?.atd);
      } else {
        add('ETA', last?.eta);
        add('ATA', last?.ata);
        add('Delivered', route.deliveryDate);
      }
      return items;
    }

    const info = tracking?.shipmentInfo || {};
    if (index === 0) {
      add(this.isAirShipment(tracking) ? 'Cargo Accepted' : 'Cargo Received', route.cargoReceivedDate);
    } else if (index === 1) {
      add('ETD', info.etd);
      add('ATD', info.atd);
    } else if (index === 2) {
      add('ETA', info.eta);
      add('ATA', info.ata);
    } else {
      add('Delivered', route.deliveryDate);
    }
    return items;
  }

  /**
   * Ordered shipment-detail fields. Booking No is hidden when empty and
   * Movement is intentionally excluded (it duplicates Dept. + Job Type).
   */
  summaryFields(tracking: any): Array<{ label: string; value: string }> {
    const fields = [
      { label: 'Booking No', value: this.shipmentInfoValue(tracking, 'bookingNumber', 'bookingNo') },
      { label: this.hblLabel(tracking), value: this.shipmentInfoValue(tracking, 'hblHawbNumber', 'hblNo') },
      { label: 'Job Type', value: this.shipmentInfoValue(tracking, 'jobType', 'movementType') },
      { label: 'Dept.', value: this.displayValue(tracking?.shipmentInfo?.department) },
      { label: 'Master Job', value: this.shipmentInfoValue(tracking, 'jobNumber') },
      { label: this.mblLabel(tracking), value: this.shipmentInfoValue(tracking, 'mblMawbNumber', 'mblNo') },
    ];
    // The searched reference is already shown in the header — hide the matching card
    // below so the same number is not shown twice (e.g. HBL search hides the HBL card).
    const searched = this.normalizeCardValue(this.searchedReferenceValue(tracking));
    return fields.filter(
      (field) =>
        field.value &&
        field.value !== '-' &&
        this.normalizeCardValue(field.value) !== searched,
    );
  }

  /** Overview "Shipment Progress" — info NOT already shown in the header. */
  progressItems(tracking: any): Array<{ label: string; value: string }> {
    return [
      { label: 'Current Stage', value: this.currentRouteStageValue(tracking) },
      { label: 'Milestones', value: this.milestoneProgressValue(tracking) },
      { label: 'Next Milestone', value: this.nextMilestoneLabel(tracking) },
      { label: 'Last Update', value: this.currentStatusDate(tracking) },
    ].filter((item) => item.value && item.value !== '-');
  }

  compactCargoItems(tracking: any): Array<{ label: string; value: string }> {
    return this.cargoDetailItems(tracking).filter((item) => !['Department', 'Commodities'].includes(item.label));
  }

  routeSummaryItems(tracking: any): Array<{ label: string; value: string }> {
    // Movement is intentionally excluded — it restates Dept. + Job Type from the header.
    return [
      { label: this.scheduleLabel(tracking), value: this.vesselVoyageValue(tracking) },
      { label: this.departureDateLabel(tracking), value: this.departureDateValue(tracking) },
      { label: this.arrivalDateLabel(tracking), value: this.arrivalDateValue(tracking) },
    ].filter((item) => item.value && item.value !== '-');
  }

  valueSourceItems(tracking: any): Array<{ source: string; description: string; active: boolean }> {
    return [
      { source: 'shipmentInfo', description: 'references, customer, job type', active: !!tracking?.shipmentInfo },
      { source: 'currentStatus', description: 'status badge and last update', active: !!tracking?.currentStatus },
      {
        source: 'routeInfo',
        description: this.isAirShipment(tracking) ? 'origin, airport, final delivery route' : 'POO, POL, POD, FPOD route',
        active: !!tracking?.routeInfo,
      },
      { source: 'cargoSummary', description: 'packages, weight, volume', active: !!tracking?.cargoSummary },
      { source: 'milestones', description: 'timeline events', active: !!tracking?.milestones?.length },
      { source: 'containers', description: 'container table for sea shipments', active: !!tracking?.containers?.length },
      { source: 'documents', description: 'document cards and downloads', active: !!tracking?.documents?.length },
    ];
  }

  nextMilestoneLabel(tracking: any): string {
    const next =
      tracking?.summary?.nextMilestone ||
      (tracking?.milestones || []).find((milestone: any) => milestone.state === 'pending');
    return this.displayValue(next?.eventName || next?.title, '-');
  }

  /** Overview summary table columns, ordered by the active search type (horizontal-scroll table). */
  overviewColumns(tracking: any): Array<{ label: string; value: string }> {
    const type = this.activeSearchType();
    const info = tracking?.shipmentInfo || {};
    const cols: Array<{ label: string; value: string }> = [];
    const push = (label: string, value: any) => cols.push({ label, value: this.displayValue(value, '-') });

    // Lead columns driven by the search type the user used.
    if (type === 'Booking No') {
      push('Booking No', this.shipmentInfoValue(tracking, 'bookingNumber', 'bookingNo'));
    } else if (type === 'HBL / HAWB') {
      push(this.hblLabel(tracking), this.shipmentInfoValue(tracking, 'hblHawbNumber', 'hblNo'));
    } else if (type === 'MBL / MAWB') {
      push(this.mblLabel(tracking), this.shipmentInfoValue(tracking, 'mblMawbNumber', 'mblNo'));
    } else if (type === 'Job No') {
      push('Master Job', this.shipmentInfoValue(tracking, 'jobNumber'));
    } else if (type === 'Container No') {
      push('Container', this.overviewContainerNo(tracking));
      push('Packages', this.totalPackages(tracking));
      push('Gross Weight', this.totalWeight(tracking));
      push('Volume', this.totalVolume(tracking));
    }

    // Common columns shown for every search.
    push('Status', tracking?.currentStatus?.label || tracking?.currentStatus?.eventName || info.shipmentStatus);
    push('Current Stage', this.currentRouteStageValue(tracking));
    push('Milestones', this.milestoneProgressValue(tracking));
    push(this.scheduleLabel(tracking), this.vesselVoyageValue(tracking));
    push('ETD', this.departureDateValue(tracking));
    push('ETA', this.arrivalDateValue(tracking));
    push('Movement', this.movementOverviewValue(tracking));
    if (this.showContainerSection(tracking)) {
      push('Containers', this.containerCount(tracking));
    }

    // Drop empty columns and de-duplicate by label.
    const seen = new Set<string>();
    return cols.filter((col) => {
      if (!col.value || col.value === '-') return false;
      const key = col.label.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  cargoDetailItems(tracking: any): Array<{ label: string; value: string }> {
    // Department is shown in the header detail grid — omitted here to avoid duplication.
    const items: Array<{ label: string; value: string }> = [
      { label: 'Total Packages', value: this.totalPackages(tracking) },
      { label: 'Gross Weight', value: this.totalWeight(tracking) },
    ];

    // FCL is charged per container, so Chargeable Weight does not apply — show
    // Containers instead. LCL / Air are charged on Chargeable Weight.
    if (this.isFclShipment(tracking)) {
      items.push({ label: 'Containers', value: this.totalContainers(tracking) });
    } else {
      items.push({ label: 'Chargeable Wt', value: this.totalChargeable(tracking) });
    }

    items.push({ label: 'Volume', value: this.totalVolume(tracking) });
    items.push({ label: 'Commodities', value: this.totalCommodities(tracking) });
    return items;
  }

  /** FCL = full container load (charged per container, not by chargeable weight). */
  isFclShipment(tracking: any): boolean {
    const segment = String(tracking?.shipmentInfo?.segment || '').toUpperCase();
    const department = String(tracking?.shipmentInfo?.department || '').toUpperCase();
    if (segment.includes('LCL') || department.includes('LCL')) return false;
    return segment.includes('FCL') || department.includes('FCL');
  }

  hasCargoDetail(tracking: any): boolean {
    return this.cargoDetailItems(tracking).some((item) => item.value !== '-' && item.value !== '0');
  }

  totalChargeable(tracking: any): string {
    const value = tracking?.cargoSummary?.totalChargeableWeight;
    return value !== null && value !== undefined && value !== ''
      ? `${Number(value).toLocaleString(undefined, { maximumFractionDigits: 2 })}kg`
      : '-';
  }

  /** Declared No. of Containers from the cargo blocks; falls back to actual container records. */
  totalContainers(tracking: any): string {
    const declared = tracking?.cargoSummary?.totalContainers;
    if (declared !== null && declared !== undefined && declared !== '' && Number(declared) > 0) {
      return String(declared);
    }
    const actual = this.containerCount(tracking);
    return actual ? String(actual) : '-';
  }

  totalCommodities(tracking: any): string {
    const summaryCount = tracking?.cargoSummary?.totalCommodities;
    if (summaryCount !== null && summaryCount !== undefined && summaryCount !== '') {
      return String(summaryCount);
    }
    // Fallback: count from container commodity rows.
    const total = (tracking?.containers || []).reduce(
      (sum: number, container: any) => sum + (Number(container?.commodityCount) || 0),
      0
    );
    return total ? String(total) : '-';
  }

  scheduleVesselLabel(tracking: any): string {
    return this.isAirShipment(tracking) ? 'Flight' : 'Vsl';
  }

  /** The voyage leg that serves a given port node (first leg = departure ports, final leg = arrival ports). */
  portLeg(tracking: any, index: number): any {
    const legs = this.voyageLegs(tracking);
    if (legs.length > 1) {
      return index <= 1 ? legs[0] : legs[legs.length - 1];
    }
    return this.summaryLegs(tracking)[0] || null;
  }

  /**
   * "Vessel / Voyage" (or Airline / Flight) for a port's leg. POO (origin) is
   * pre-carriage, so no vessel is shown there. Builds the label from the name +
   * number (vesselVoyage is only a fallback — never combined, to avoid repeats).
   */
  portVesselLabel(tracking: any, index: number): string {
    if (index === 0) {
      return ''; // POO / place of receipt — pre-carriage, no vessel yet
    }

    const leg = this.portLeg(tracking, index);
    const info = tracking?.shipmentInfo || {};
    const source = leg || info;

    if (this.isAirShipment(tracking)) {
      const airline = source?.airlineName || source?.carrierName || source?.vesselName;
      const flightNo = source?.flightNo || source?.voyageNo;
      const label = [airline, flightNo].filter((value) => this.hasDisplayValue(value)).join(' / ');
      return label || (this.hasDisplayValue(source?.vesselVoyage) ? source.vesselVoyage : '');
    }

    const label = [source?.vesselName, source?.voyageNo].filter((value) => this.hasDisplayValue(value)).join(' / ');
    return label || (this.hasDisplayValue(source?.vesselVoyage) ? source.vesselVoyage : '');
  }

  portVesselIcon(tracking: any): string {
    return this.isAirShipment(tracking) ? 'fa-plane' : 'fa-ship';
  }

  /** Full port name for a port code (e.g. DXB → Dubai), from the resolved PortMaster map. */
  portName(tracking: any, code: string): string {
    const names = tracking?.routeInfo?.portNames || {};
    const name = names[String(code || '').trim()];
    return name && name !== code ? name : '';
  }

  routePointIcon(tracking: any, index: number): string {
    if (this.isAirShipment(tracking)) {
      return ['fa-box', 'fa-plane-departure', 'fa-plane-arrival', 'fa-map-marker-alt'][index] || 'fa-plane';
    }

    return ['fa-warehouse', 'fa-ship', 'fa-anchor', 'fa-map-marker-alt'][index] || 'fa-map-marker-alt';
  }

  routeModeTitle(tracking: any): string {
    return this.isAirShipment(tracking) ? 'Air Freight Routing' : 'Sea Freight Routing';
  }

  routeModeHint(tracking: any): string {
    return this.isAirShipment(tracking)
      ? 'Airport movement with flight schedule, departure, arrival, and final delivery checkpoints.'
      : 'Port movement with vessel schedule, loading, arrival, and final destination checkpoints.';
  }

  /** Leg row title — single-leg shipments read "Voyage"/"Flight", transhipment reads First/Final Leg. */
  legTitle(tracking: any, leg: any, index: number, isLast: boolean): string {
    if (this.summaryLegs(tracking).length <= 1) {
      return this.isAirShipment(tracking) ? 'Flight' : 'Voyage';
    }
    return this.transhipmentLegTitle(leg, index, isLast);
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

    const roles = this.isAirShipment(tracking)
      ? ['Origin', 'Departure Airport', 'Arrival Airport', 'Final Delivery']
      : ['POO', 'POL', 'POD', 'FPOD'];

    return [origin, pol, pod, finalDestination].map((point, index) => ({
      label: this.routeLabel(point, index),
      role: roles[index],
    }));
  }

  private transhipmentRoutePoints(tracking: any): Array<{ label: string; role: string }> {
    const legs = this.voyageLegs(tracking);
    if (legs.length < 2) {
      return [];
    }

    const firstLeg = legs[0];
    const finalLeg = legs[legs.length - 1];
    const points = this.isAirShipment(tracking)
      ? [
          { label: this.displayValue(firstLeg?.pol), role: 'Origin' },
          { label: this.displayValue(firstLeg?.pod), role: 'First Arrival' },
          { label: this.displayValue(finalLeg?.pol), role: 'Final Departure' },
          { label: this.displayValue(finalLeg?.pod), role: 'Final Delivery' },
        ]
      : [
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

  /** Status chip text shown under each route port. */
  routeStopStatus(index: number, tracking: any): string {
    const state = this.routePointClass(index, tracking);
    if (state === 'completed') return 'Completed';
    if (state === 'active') return 'In Progress';
    return 'Pending';
  }

  /** Single primary date under each port: actual when available, else estimated with an ETD/ETA prefix. */
  portPrimaryDate(tracking: any, index: number): { label: string; value: string } {
    const items = this.portScheduleItems(tracking, index);
    if (!items.length) {
      return { label: '', value: '-' };
    }
    const actual = items.find((item) =>
      ['ATD', 'ATA', 'Delivered', 'Cargo Received', 'Cargo Accepted'].includes(item.label)
    );
    const chosen = actual || items[0];
    const prefix = chosen.label === 'ETD' || chosen.label === 'ETA' ? `${chosen.label} ` : '';
    return { label: prefix, value: chosen.value };
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
    switch (milestone.state) {
      case 'completed':
        return 'Completed';
      case 'current':
        return 'In Progress';
      case 'exception':
        return 'Exception';
      default:
        return 'Pending';
    }
  }

  /** Event-type icon (mode-aware): plane for air legs, ship/anchor for sea, etc. */
  milestoneIcon(milestone: TrackingMilestone): string {
    const name = String((milestone as any)?.eventName || milestone?.title || '').toLowerCase();
    if (name.includes('booking')) return 'fa-clipboard-list';
    if (name.includes('received')) return 'fa-box';
    if (name.includes('stuffing')) return 'fa-boxes';
    if (name.includes('gate')) return 'fa-warehouse';
    if (name.includes('custom')) return 'fa-stamp';
    if (name.includes('airline') || name.includes('loaded') || name.includes('departed')) {
      return name.includes('flight') || name.includes('airline') ? 'fa-plane' : 'fa-ship';
    }
    if (name.includes('transship') || name.includes('tranship')) return 'fa-exchange-alt';
    if (name.includes('arrived')) return name.includes('flight') ? 'fa-plane' : 'fa-anchor';
    if (name.includes('discharg')) return 'fa-dolly';
    if (name.includes('out for delivery')) return 'fa-truck';
    if (name.includes('delivered')) return 'fa-check-circle';

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
    const summaryWeight = tracking?.cargoSummary?.totalGrossWeight;
    const total =
      summaryWeight !== null && summaryWeight !== undefined
        ? Number(summaryWeight)
        : (tracking?.containers || []).reduce(
            (sum: number, container: any) => sum + (Number(container?.weight) || 0),
            0
          );

    return total ? `${total.toLocaleString(undefined, { maximumFractionDigits: 2 })}kg` : '-';
  }

  totalPackages(tracking: any): string {
    const value = tracking?.cargoSummary?.totalPackages;
    return value !== null && value !== undefined && value !== '' ? String(value) : '-';
  }

  totalVolume(tracking: any): string {
    const value = tracking?.cargoSummary?.totalVolume;
    return value !== null && value !== undefined && value !== ''
      ? `${Number(value).toLocaleString(undefined, { maximumFractionDigits: 3 })} cbm`
      : '-';
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
    // NOTE: "Shipment Status" intentionally omitted here — it duplicates the
    // header "Current status" card. (Tracking requirement 4c)
    const rawCards: OverviewCard[] = [
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
    const value = milestone?.eventDate;
    if (!value) {
      return 'Pending';
    }
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return this.displayValue(value, 'Pending');
    }
    // Milestone dates are stored UTC-naive (the date-time picker saves the picked
    // wall-clock as UTC), so read UTC components to show exactly what was entered —
    // matching the milestone screen, with no timezone shift. Date-only values are at
    // UTC midnight, so only show a time when one was actually set.
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const day = String(parsed.getUTCDate()).padStart(2, '0');
    const month = months[parsed.getUTCMonth()];
    const year = parsed.getUTCFullYear();
    const hasTime = parsed.getUTCHours() !== 0 || parsed.getUTCMinutes() !== 0;
    if (!hasTime) {
      return `${day} ${month} ${year}`;
    }
    const hour = String(parsed.getUTCHours()).padStart(2, '0');
    const minute = String(parsed.getUTCMinutes()).padStart(2, '0');
    return `${day} ${month} ${year}, ${hour}:${minute}`;
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


