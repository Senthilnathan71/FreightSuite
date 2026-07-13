import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { CustomDatePipe } from 'src/app/core/pipes/custom-date-format.pipe';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { LeadService } from 'src/app/modules/crm-mobile/Services/lead.service';

@Component({
  selector: 'app-authority-log',
  standalone: true,
  imports: [CustomDatePipe, CommonModule, FormsModule],
  templateUrl: './authority-log.component.html',
  styleUrl: './authority-log.component.scss'
})
export class AuthorityLogComponent implements OnInit {
  @Input() documentSid: number;
  @Input() menuMasterSid: number;
  @Input() CompanyMasterSid: number;
  @Input() BranchMasterSid: number;
  @Input() DepartmentMasterSid: number;
  @Input() DepartmentMaster: string;
  // Opt-in: only screens that pass allowAction=true get inline Approve/Reject buttons.
  // Screens with their own approval flow (e.g. Credit Request) leave this false → read-only log.
  @Input() allowAction = false;

  isApproved = false;
  approvalLogs: any[] = [];
  waitingMessage = 'Checking approval status...';

  // Current authorizer context (resolved from check-authorizer)
  private userData: any;
  canAuthorize = false;
  alreadyApproved = false;
  myAuthorityLevel: number | null = null;
  isFinalAuthorizer = false;

  // Inline approve/reject action state (only one row actionable at a time)
  actionRowLevel: number | null = null;
  actionDecision: 'Approved' | 'Rejected' | null = null;
  actionRemarks = '';
  submitting = false;

  constructor(
    private modalRef: NgbActiveModal,
    private leadService: LeadService,
    private appSettingService: AppSettingsService
  ) {}

  ngOnInit(): void {
    const selectedCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));
    const selectedBranch = this.appSettingService.decrypt(localStorage.getItem('selected-branch'));
    this.CompanyMasterSid = this.CompanyMasterSid || selectedCompany?.CompanyMasterSid;
    this.BranchMasterSid = this.BranchMasterSid || selectedBranch?.BranchMasterSid;
    this.userData = this.appSettingService.getDecryptedUserProfile();
    this.fetchApprovalStatus();
    if (this.allowAction) {
      this.checkAuthorizer();
    }
  }

  fetchApprovalStatus() {
    this.leadService.getApprovalStatusByMenuAndDocument(
      this.menuMasterSid,
      this.documentSid,
      this.CompanyMasterSid,
      this.BranchMasterSid,
      this.DepartmentMasterSid,
      this.DepartmentMaster
    )
      .subscribe((resp : any) => {
        if (resp.status) {
          this.approvalLogs = resp.data.logData || [];
          this.isApproved = resp.data.status === 'Approved';
        }
      });
  }

  /** Resolve whether the logged-in user may act on this document, and at which level. */
  private checkAuthorizer() {
    if (!this.menuMasterSid || !this.documentSid || !this.CompanyMasterSid || !this.BranchMasterSid) {
      return;
    }
    const payload: any = {
      CompanyMasterSid: this.CompanyMasterSid,
      BranchMasterSid: this.BranchMasterSid,
      MenuMasterSid: this.menuMasterSid,
      UserMasterSid: this.userData?.UserMasterSid,
      DocumentSid: this.documentSid,
    };
    if (this.DepartmentMasterSid) payload.DepartmentMasterSid = this.DepartmentMasterSid;
    if (this.DepartmentMaster) payload.DepartmentMaster = this.DepartmentMaster;

    this.leadService.isUserAuthorizer(payload).subscribe({
      next: (resp: any) => {
        const data = resp?.data || {};
        this.canAuthorize = !!data.canAuthorize;
        this.alreadyApproved = !!data.alreadyApproved;
        this.myAuthorityLevel = data.AuthorityLevel != null ? Number(data.AuthorityLevel) : null;
        this.isFinalAuthorizer = data.FinalAuthority === 'Y' || data.FinalAuthority === true;
      },
      error: () => {
        this.canAuthorize = false;
      }
    });
  }

  /** A row is actionable only for the current user's own level, when pending and it is their turn. */
  canActOnRow(log: any): boolean {
    if (!this.allowAction) return false;
    if (!this.canAuthorize || this.alreadyApproved) return false;
    if (this.myAuthorityLevel == null) return false;
    if (Number(log.approvalLevel) !== this.myAuthorityLevel) return false;
    if (log.approvalStatus !== 'Pending') return false;
    return this.isMyTurn(log);
  }

  /**
   * Sequential gate: no row rejected, and every lower level already Approved.
   * Exception: the Final authorizer may approve directly, regardless of lower-level progress
   * (the backend then auto-marks skipped levels as approved).
   */
  private isMyTurn(log: any): boolean {
    const myLevel = Number(log.approvalLevel);
    if (this.approvalLogs.some(r => r.approvalStatus === 'Rejected')) return false;
    if (this.isFinalAuthorizer) return true;
    return this.approvalLogs
      .filter(r => Number(r.approvalLevel) < myLevel)
      .every(r => r.approvalStatus === 'Approved');
  }

  /** Lower levels that still block the current user, ordered by level. */
  private myBlockingLevels(): any[] {
    if (this.myAuthorityLevel == null || this.isFinalAuthorizer) return [];
    return this.approvalLogs
      .filter(r => Number(r.approvalLevel) < Number(this.myAuthorityLevel) && r.approvalStatus !== 'Approved')
      .sort((a, b) => Number(a.approvalLevel) - Number(b.approvalLevel));
  }

  /** Personal, human-readable status shown as a banner at the top of the modal. */
  get myStatusBanner(): { cssClass: string; text: string } | null {
    if (!this.allowAction) return null;

    if (this.myAuthorityLevel == null || !this.canAuthorize) {
      return { cssClass: 'alert-secondary', text: 'You are not an approver for this document. View only.' };
    }

    if (this.approvalLogs.some(r => r.approvalStatus === 'Rejected')) {
      return { cssClass: 'alert-danger', text: 'This document has been rejected. No further action is possible.' };
    }

    const myRow = this.approvalLogs.find(r => Number(r.approvalLevel) === Number(this.myAuthorityLevel));
    if (this.alreadyApproved || myRow?.approvalStatus === 'Approved') {
      return { cssClass: 'alert-success', text: `You have already approved at Level ${this.myAuthorityLevel}.` };
    }

    if (myRow && this.canActOnRow(myRow)) {
      return { cssClass: 'alert-info', text: `It's your turn — approve or reject at Level ${this.myAuthorityLevel}.` };
    }

    const blocking = this.myBlockingLevels();
    if (blocking.length) {
      const next = blocking[0];
      return {
        cssClass: 'alert-warning',
        text: `Level ${next.approvalLevel} (${next.approvedBy}) must approve before you can act at Level ${this.myAuthorityLevel}.`
      };
    }

    return null;
  }

  /** Inline hint for the Action column on the current user's own blocked row. */
  rowActionHint(log: any): string {
    if (this.myAuthorityLevel == null || Number(log.approvalLevel) !== Number(this.myAuthorityLevel)) return '';
    if (log.approvalStatus !== 'Pending' || this.canActOnRow(log)) return '';
    const blocking = this.myBlockingLevels();
    return blocking.length ? `Awaiting Level ${blocking[0].approvalLevel}` : '';
  }

  startAction(log: any, decision: 'Approved' | 'Rejected') {
    this.actionRowLevel = Number(log.approvalLevel);
    this.actionDecision = decision;
    this.actionRemarks = '';
  }

  cancelAction() {
    this.actionRowLevel = null;
    this.actionDecision = null;
    this.actionRemarks = '';
  }

  confirmAction() {
    if (this.submitting || !this.actionDecision) return;
    if (this.actionDecision === 'Rejected' && !this.actionRemarks.trim()) {
      this.appSettingService.showWarning('Please enter remarks before rejecting.');
      return;
    }

    const payload: any = {
      CompanyMasterSid: this.CompanyMasterSid,
      BranchMasterSid: this.BranchMasterSid,
      MenuMasterSid: this.menuMasterSid,
      UserMasterSid: this.userData?.UserMasterSid,
      DocumentSid: this.documentSid,
      decision: this.actionDecision,
      Remarks: this.actionRemarks.trim() || null,
      ApprovedBy: this.userData?.userName || this.userData?.userEmail || 'system',
    };
    if (this.DepartmentMasterSid) payload.DepartmentMasterSid = this.DepartmentMasterSid;
    if (this.DepartmentMaster) payload.DepartmentMaster = this.DepartmentMaster;

    this.submitting = true;
    this.leadService.authorizeDocument(payload).subscribe({
      next: (resp: any) => {
        this.submitting = false;
        if (resp.status) {
          this.appSettingService.showSuccess(resp.message || 'Approval recorded successfully.');
          this.approvalLogs = resp.data?.logData || [];
          this.isApproved = resp.data?.status === 'Approved';
          this.cancelAction();
          // Refresh the authorizer context (the user has now acted).
          this.checkAuthorizer();
        } else {
          this.appSettingService.showError(resp.message || 'Failed to record approval.');
        }
      },
      error: (err) => {
        this.submitting = false;
        this.appSettingService.showError(err?.error?.message || 'Failed to record approval.');
      }
    });
  }

  closeModal() {
    this.modalRef.close();
  }
}
