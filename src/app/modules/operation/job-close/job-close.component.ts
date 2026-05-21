import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { CustomDatePipe } from 'src/app/core/pipes/custom-date-format.pipe';
import { OperationService } from '../operation.service';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';

@Component({
  selector: 'app-job-close',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NgxSpinnerModule,
    CustomDatePipe
  ],
  providers: [CustomDatePipe],
  templateUrl: './job-close.component.html',
  styleUrls: ['./job-close.component.scss']
})
export class JobCloseComponent implements OnInit {
  @ViewChild('validationModal') validationModal!: TemplateRef<any>;

  masterJobSid!: number;
  userData: any;

  masterJob: any = {};
  containers: any[] = [];
  hblData: any[] = [];
  closureStatus: any = {};
  private initialClosureStatus: any = {};
  milestoneChecks: any = {
    documentation: [],
    operation: [],
    accounts: [],
    jobClose: []
  };
  departmentType = '';
  loading = false;

  // Closure form model
  docClose = false;
  opsClose = false;
  accClose = false;
  jobCloseCheck = false;

  // Validation modal state
  validationModalTitle = '';
  validationModalMilestones: { label: string; failedLabel: string; passed: boolean }[] = [];
  showJobCloseLossReasonValidation = false;
  readonly jobLossReasonRequiredMessage = 'GP is negative/zero. Please update Job Loss Reason before closing the job.';
  readonly jobLossReasonApprovedMessage = 'GP is negative/zero. Job Loss Reason is updated, so Job Close is allowed.';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private operationService: OperationService,
    private appSettingService: AppSettingsService,
    private spinner: NgxSpinnerService,
    private datePipe: CustomDatePipe,
    private modalService: NgbModal
  ) {}

  ngOnInit(): void {
    this.masterJobSid = Number(this.route.snapshot.paramMap.get('id'));
    this.appSettingService.getUser().subscribe((user) => {
      if (user) {
        this.userData = user;
      }
    });
    this.loadJobCloseDetail();
  }

  loadJobCloseDetail(): void {
    this.loading = true;
    this.spinner.show('jobCloseSpinner');
    this.operationService.getJobCloseDetail(this.masterJobSid).subscribe({
      next: (resp: any) => {
        this.loading = false;
        this.spinner.hide('jobCloseSpinner');
        if (resp.status && resp.data) {
          const data = resp.data;
          this.masterJob = data.masterJob || {};
          this.containers = data.containers || [];
          this.hblData = data.hblData || [];
          this.closureStatus = data.closureStatus || {};
          this.milestoneChecks = data.milestoneChecks || {
            documentation: [], operation: [], accounts: [], jobClose: []
          };
          this.departmentType = this.masterJob.departmentType || '';
          this.showJobCloseLossReasonValidation = false;

          this.docClose = this.closureStatus.DocCloseStatus === 'Closed';
          this.opsClose = this.closureStatus.OpsCloseStatus === 'Closed';
          this.accClose = this.closureStatus.AccCloseStatus === 'Closed';
          this.jobCloseCheck = this.closureStatus.JobCloseStatus === 'Closed';

          this.initialClosureStatus = { ...this.closureStatus };
        } else {
          this.appSettingService.showError('Failed to load Job Close details');
        }
      },
      error: (err) => {
        this.loading = false;
        this.spinner.hide('jobCloseSpinner');
        this.appSettingService.showError('Error loading Job Close details');
        console.error('Error loading job close detail', err);
      }
    });
  }

  get hasChanges(): boolean {
    return this.closureStatus.DocCloseStatus !== this.initialClosureStatus.DocCloseStatus ||
           this.closureStatus.OpsCloseStatus !== this.initialClosureStatus.OpsCloseStatus ||
           this.closureStatus.AccCloseStatus !== this.initialClosureStatus.AccCloseStatus ||
           this.closureStatus.JobCloseStatus !== this.initialClosureStatus.JobCloseStatus;
  }

  get allDocMilestonesPassed(): boolean {
    return this.milestoneChecks.documentation?.every((m: any) => m.passed) ?? false;
  }

  get allOpsMilestonesPassed(): boolean {
    return this.milestoneChecks.operation?.every((m: any) => m.passed) ?? false;
  }

  get allAccMilestonesPassed(): boolean {
    return this.milestoneChecks.accounts?.every((m: any) => m.passed) ?? false;
  }

  get allJobMilestonesPassed(): boolean {
    return this.canPassJobCloseValidation;
  }

  get hasJobLossReason(): boolean {
    return !!String(this.masterJob?.others?.JobLossReason || '').trim();
  }

  get hblTotals(): any {
    return (this.hblData || []).reduce((total: any, h: any) => {
      total.GrossWt += Number(h?.GrossWt || 0);
      total.Volumetric += Number(h?.Volumetric || 0);
      total.CBM += Number(h?.CBM || 0);
      total.ProvCost += Number(h?.ProvCost || 0);
      total.ProvRevenue += Number(h?.ProvRevenue || 0);
      total.ActualCost += Number(h?.ActualCost || 0);
      total.ActualRevenue += Number(h?.ActualRevenue || 0);
      total.GP += Number(h?.GP || 0);
      return total;
    }, {
      GrossWt: 0,
      Volumetric: 0,
      CBM: 0,
      ProvCost: 0,
      ProvRevenue: 0,
      ActualCost: 0,
      ActualRevenue: 0,
      GP: 0
    });
  }

  get jobCloseMilestonesPassedWithoutBypass(): boolean {
    return this.milestoneChecks.jobClose?.every((m: any) => m.passed) ?? false;
  }

  get isGpLossReasonRequired(): boolean {
    return Number(this.hblTotals.GP || 0) <= 0;
  }

  get failedJobCloseMilestones(): any[] {
    return (this.milestoneChecks.jobClose || []).filter((m: any) => !m.nonBlocking && !m.passed);
  }

  isProfitLossMilestone(milestone: any): boolean {
    return milestone?.code === 'JOB_PROFIT_LOSS';
  }

  isApprovedGpLossMilestone(milestone: any): boolean {
    return this.isProfitLossMilestone(milestone)
      && !milestone.passed
      && this.isGpLossReasonRequired
      && this.hasJobLossReason;
  }

  isJobCloseMilestonePassed(milestone: any): boolean {
    return !!milestone?.passed
      || (this.isProfitLossMilestone(milestone) && !this.isGpLossReasonRequired)
      || this.isApprovedGpLossMilestone(milestone);
  }

  get blockingJobCloseMilestones(): any[] {
    return this.failedJobCloseMilestones.filter((m: any) => !this.isJobCloseMilestonePassed(m));
  }

  get isJobProfitLossFailed(): boolean {
    return this.isGpLossReasonRequired
      && this.failedJobCloseMilestones.some((m: any) => this.isProfitLossMilestone(m));
  }

  get hasNonLossJobCloseFailure(): boolean {
    return this.blockingJobCloseMilestones.some((m: any) => m.code !== 'JOB_PROFIT_LOSS');
  }

  get canPassJobCloseValidation(): boolean {
    return this.blockingJobCloseMilestones.length === 0
      || (this.isJobProfitLossFailed && !this.hasNonLossJobCloseFailure && this.hasJobLossReason);
  }

  get jobLossReasonBoxClass(): string {
    if (this.isJobProfitLossFailed && !this.hasJobLossReason) {
      return 'border border-danger bg-light text-danger';
    }
    if (this.isJobProfitLossFailed && this.hasJobLossReason) {
      return 'border border-warning bg-light text-warning';
    }
    return 'border bg-light text-muted';
  }

  get canSave(): boolean {
    if (!this.hasChanges) {
      return false;
    }
    if (this.isClosing('DocCloseStatus') && !this.allDocMilestonesPassed) {
      return false;
    }
    if (this.isClosing('OpsCloseStatus') && !this.allOpsMilestonesPassed) {
      return false;
    }
    if (this.isClosing('AccCloseStatus') && !this.allAccMilestonesPassed) {
      return false;
    }
    if (this.isClosing('JobCloseStatus') && !this.allJobMilestonesPassed) {
      return false;
    }
    if (this.jobCloseCheck && !this.canPassJobCloseValidation) {
      return false;
    }
    return true;
  }

  get allClosersClosed(): boolean {
    return this.closureStatus.DocCloseStatus === 'Closed'
        && this.closureStatus.OpsCloseStatus === 'Closed'
        && this.closureStatus.AccCloseStatus === 'Closed'
        && this.closureStatus.JobCloseStatus === 'Closed';
  }

  get persistedAllClosersClosed(): boolean {
    return this.initialClosureStatus.DocCloseStatus === 'Closed'
        && this.initialClosureStatus.OpsCloseStatus === 'Closed'
        && this.initialClosureStatus.AccCloseStatus === 'Closed'
        && this.initialClosureStatus.JobCloseStatus === 'Closed';
  }

  private tryClose(
    closerName: string,
    milestones: { label: string; failedLabel: string; passed: boolean }[],
    onSuccess: () => void,
    onRevert: () => void
  ): void {
    const allPassed = milestones?.every(m => m.passed) ?? false;
    if (allPassed) {
      onSuccess();
    } else {
      this.validationModalTitle = closerName;
      this.validationModalMilestones = milestones || [];
      this.modalService.open(this.validationModal, { centered: true, size: 'md' });
      onRevert();
    }
  }

  private isClosing(statusField: string): boolean {
    return this.closureStatus?.[statusField] === 'Closed'
      && this.initialClosureStatus?.[statusField] !== 'Closed';
  }

  private resetJobClose(): void {
    this.jobCloseCheck = false;
    this.closureStatus.JobCloseStatus = 'Open';
    this.closureStatus.JobClosedDate = null;
    this.closureStatus.JobClosedBy = null;
  }

  onDocCloseChange(): void {
    if (this.docClose) {
      this.tryClose('Documentation Closer', this.milestoneChecks.documentation,
        () => {
          this.closureStatus.DocCloseStatus = 'Closed';
          this.closureStatus.DocClosedDate = new Date().toISOString();
          this.closureStatus.DocClosedBy = this.userData?.email || this.userData?.userName || '';
        },
        () => { this.docClose = false; }
      );
    } else {
      this.closureStatus.DocCloseStatus = 'Open';
      this.closureStatus.DocClosedDate = null;
      this.closureStatus.DocClosedBy = null;
    }
    this.updateJobCloseMilestone();
  }

  onOpsCloseChange(): void {
    if (this.opsClose) {
      this.tryClose('Operation Closer', this.milestoneChecks.operation,
        () => {
          this.closureStatus.OpsCloseStatus = 'Closed';
          this.closureStatus.OpsClosedDate = new Date().toISOString();
          this.closureStatus.OpsClosedBy = this.userData?.email || this.userData?.userName || '';
        },
        () => { this.opsClose = false; }
      );
    } else {
      this.closureStatus.OpsCloseStatus = 'Open';
      this.closureStatus.OpsClosedDate = null;
      this.closureStatus.OpsClosedBy = null;
    }
    this.updateJobCloseMilestone();
  }

  onAccCloseChange(): void {
    if (this.accClose) {
      this.tryClose('Accounts Closer', this.milestoneChecks.accounts,
        () => {
          this.closureStatus.AccCloseStatus = 'Closed';
          this.closureStatus.AccClosedDate = new Date().toISOString();
          this.closureStatus.AccClosedBy = this.userData?.email || this.userData?.userName || '';
        },
        () => { this.accClose = false; }
      );
    } else {
      this.closureStatus.AccCloseStatus = 'Open';
      this.closureStatus.AccClosedDate = null;
      this.closureStatus.AccClosedBy = null;
    }
    this.updateJobCloseMilestone();
  }

  onJobCloseChange(): void {
    if (this.jobCloseCheck) {
      if (this.canPassJobCloseValidation) {
        this.showJobCloseLossReasonValidation = false;
        this.closureStatus.JobCloseStatus = 'Closed';
        this.closureStatus.JobClosedDate = new Date().toISOString();
        this.closureStatus.JobClosedBy = this.userData?.email || this.userData?.userName || '';
      } else if (this.isJobProfitLossFailed && !this.hasNonLossJobCloseFailure && !this.hasJobLossReason) {
        this.showJobCloseLossReasonValidation = true;
        this.appSettingService.showError(this.jobLossReasonRequiredMessage);
        this.validationModalTitle = 'Job Closer';
        this.validationModalMilestones = this.milestoneChecks.jobClose || [];
        this.modalService.open(this.validationModal, { centered: true, size: 'md' });
        this.resetJobClose();
      } else {
        this.showJobCloseLossReasonValidation = false;
        this.validationModalTitle = 'Job Closer';
        this.validationModalMilestones = this.milestoneChecks.jobClose || [];
        this.modalService.open(this.validationModal, { centered: true, size: 'md' });
        this.resetJobClose();
      }
    } else {
      this.showJobCloseLossReasonValidation = false;
      this.resetJobClose();
    }
  }

  private updateJobCloseMilestone(): void {
    const allPreviousClosed =
      this.closureStatus.DocCloseStatus === 'Closed' &&
      this.closureStatus.OpsCloseStatus === 'Closed' &&
      this.closureStatus.AccCloseStatus === 'Closed';

    const milestone = this.milestoneChecks.jobClose?.find(
      (m: any) => m.code === 'ALL_PREVIOUS_CLOSED'
    );
    if (milestone) {
      milestone.passed = allPreviousClosed;
    }

    if (!allPreviousClosed && this.jobCloseCheck) {
      this.resetJobClose();
    }
  }

  save(): void {
    if (!this.hasChanges) {
      this.appSettingService.showError('No changes to save');
      return;
    }
    if (this.jobCloseCheck && !this.canPassJobCloseValidation) {
      this.validationModalTitle = 'Job Closer';
      this.validationModalMilestones = this.milestoneChecks.jobClose || [];
      this.modalService.open(this.validationModal, { centered: true, size: 'md' });
      this.resetJobClose();
      return;
    }
    if (this.closureStatus.JobCloseStatus === 'Closed'
      && this.isJobProfitLossFailed
      && !this.hasNonLossJobCloseFailure
      && !this.hasJobLossReason) {
      this.showJobCloseLossReasonValidation = true;
      this.appSettingService.showError(this.jobLossReasonRequiredMessage);
      return;
    }
    this.spinner.show('jobCloseSpinner');
    const payload = {
      MasterJobSid: this.masterJobSid,
      DocCloseStatus: this.closureStatus.DocCloseStatus || 'Open',
      DocClosedDate: this.closureStatus.DocClosedDate,
      DocClosedBy: this.closureStatus.DocClosedBy,
      OpsCloseStatus: this.closureStatus.OpsCloseStatus || 'Open',
      OpsClosedDate: this.closureStatus.OpsClosedDate,
      OpsClosedBy: this.closureStatus.OpsClosedBy,
      AccCloseStatus: this.closureStatus.AccCloseStatus || 'Open',
      AccClosedDate: this.closureStatus.AccClosedDate,
      AccClosedBy: this.closureStatus.AccClosedBy,
      JobCloseStatus: this.closureStatus.JobCloseStatus || 'Open',
      JobClosedDate: this.closureStatus.JobClosedDate,
      JobClosedBy: this.closureStatus.JobClosedBy,
      UpdatedBy: this.userData?.email || this.userData?.userName || ''
    };

    this.operationService.saveJobCloseStatus(payload).subscribe({
      next: (resp: any) => {
        this.spinner.hide('jobCloseSpinner');
        if (resp.status) {
          this.appSettingService.showSuccess('Job Close status saved successfully');
          this.loadJobCloseDetail();
        } else {
          this.appSettingService.showError(resp.message || 'Failed to save Job Close status');
        }
      },
      error: (err) => {
        this.spinner.hide('jobCloseSpinner');
        this.appSettingService.showError('Error saving Job Close status');
        console.error('Error saving job close status', err);
      }
    });
  }

  onReopen(): void {
    if (!this.masterJobSid) return;
    if (!confirm('Reopen this job? All four closures will be reset to Open and you will be able to edit the job again.')) {
      return;
    }
    this.spinner.show('jobCloseSpinner');
    const payload = {
      MasterJobSid: this.masterJobSid,
      ReopenBy: this.userData?.email || this.userData?.userName || '',
      ReopenReason: 'Reopened from Job Close screen',
    };
    this.operationService.reopenJobClose(payload).subscribe({
      next: (resp: any) => {
        this.spinner.hide('jobCloseSpinner');
        if (resp.status !== false) {
          this.appSettingService.showSuccess('Job reopened successfully');
          this.loadJobCloseDetail();
        } else {
          this.appSettingService.showError(resp.message || 'Failed to reopen job');
        }
      },
      error: (err) => {
        this.spinner.hide('jobCloseSpinner');
        this.appSettingService.showError('Error reopening job');
        console.error('Error reopening job', err);
      }
    });
  }

  formatDate(date: any): string {
    if (!date) return '-';
    return this.datePipe.transform(date) || '-';
  }

  cancel(): void {
    this.router.navigate(['operation/master-job/list']);
  }
}
