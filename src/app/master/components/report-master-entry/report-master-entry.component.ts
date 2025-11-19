import { Component, OnInit, TemplateRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { CommonModule } from '@angular/common';
import { MasterService } from 'src/app/modules/master/master.service';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { ActivatedRoute, Router } from '@angular/router';
import { MultiSelectComponent } from 'src/app/component/multiselect-dropdown/multiselect-dropdown.component';
import { NgbDropdownModule, NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { DetailsComponent } from 'src/app/component/details/details.component';
import { TermsAndConditionsComponent } from 'src/app/component/terms&conditions/terms&conditions.component';
import { EmailEntryComponent } from 'src/app/modules/settings/email/email-entry/email-entry.component';
import { EdocComponent } from 'src/app/modules/settings/edoc/edoc/edoc.component';
import { AuthorityLogComponent } from 'src/app/component/authority-log/authority-log.component';

@Component({
  selector: 'app-report-master-entry',
  standalone: true,
  imports: [NgSelectModule, ReactiveFormsModule, CommonModule, MultiSelectComponent, DetailsComponent, NgbDropdownModule],
  templateUrl: './report-master-entry.component.html',
  styleUrls: ['./report-master-entry.component.scss']
})
export class ReportMasterEntryComponent implements OnInit {
  reportForm!: FormGroup;
  isEditMode: boolean = false;
  ReportMasterSid!: number;
  currentCompany: any;
  reportData: any;
  auditLogs: any[] = [];
  auditLogModalRef!: NgbModalRef;
  currentMenuId: number;
  TandCList: any;
  permissions: string[] = [];
  currentMenuPermissions: any = {};
  userData: any;

  modeofreportFormat = [
    { id: 1, name: "XL" },
    { id: 2, name: "PDF" },
    { id: 3, name: "XML" }
  ];

  modeofreportType = [
    { id: 1, name: "Ope Report" },
    { id: 2, name: "Fin Report" },
    { id: 3, name: "Ana Report" }
  ];
  reportMenus: any[] = [];

  constructor(
    private fb: FormBuilder,
    private masterService: MasterService,
    private appSettingsService: AppSettingsService,
    private route: ActivatedRoute,
    private router: Router,
    private modalService: NgbModal,
    private appSettingService: AppSettingsService,
  ) { }

  ngOnInit(): void {
    this.currentCompany = this.appSettingsService.decrypt(localStorage.getItem('selected-company'));
    this.initForm();
    this.menuDropdown();

    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.ReportMasterSid = +id;
        this.isEditMode = true;
        this.loadReportData();
      }
    });
  }

  initForm() {
    this.reportForm = this.fb.group({
      reportName: ['', Validators.required],
      displayName: ['', Validators.required],
      reportMenuId: [null, Validators.required],
      reportFormatId: [null, Validators.required],
      reportType: ["", Validators.required],
      excludedCompanyIds: ['', [Validators.pattern(/^(\d+)(,\s*\d+)*$/)]],
      query: ['', Validators.required],
      Status: ['A']
    });
  }

  menuDropdown() {
    this.masterService.getAllMenu().subscribe({
      next: (resp: any) => {
        this.reportMenus = resp;
      },
      error: () => {
        this.appSettingsService.showError('Failed to load report menus');
      }
    });
  }

  formatExcludedCompanies(data: any): string {
    if (!data) return '';
    if (Array.isArray(data)) return data.join(',');
    if (typeof data === 'object' && data.company && Array.isArray(data.company)) {
      return data.company.join(',');
    }
    return '';
  }

  loadReportData() {
    this.masterService.getReportMasterById(this.ReportMasterSid).subscribe({
      next: (resp: any) => {
        this.reportData = resp.data;

        this.reportForm.patchValue({
          reportName: resp.data.ReportName,
          displayName: resp.data.ReportDisplayName,
          reportMenuId: resp.data.ReportMenuSid,
          reportFormatId: resp.data.ReportFormat,
          reportType: resp.data.ReportType,
          excludedCompanyIds: this.formatExcludedCompanies(resp.data.ReportExcludedCompany),
          query: resp.data.Query,
        });
      },
      error: () => {
        this.appSettingsService.showError('Failed to load report data');
      }
    });
  }

  onSubmit() {
    if (this.reportForm.invalid) {
      this.reportForm.markAllAsTouched();
      this.appSettingsService.showWarning('Please fill all required fields.');
      return;
    }
    const formValue = this.reportForm.value;

    const payload = {
      ReportName: formValue.reportName,
      ReportDisplayName: formValue.displayName,
      ReportMenuSid: formValue.reportMenuId,
      ReportFormat: formValue.reportFormatId,
      Query: formValue.query,
      ReportType: formValue.reportType,
      ReportExcludedCompany: formValue.excludedCompanyIds
        ? formValue.excludedCompanyIds.split(',').map((id: string) => parseInt(id.trim()))
        : null,
      CreatedBy: this.appSettingsService.userSettingSource.value?.userEmail,
      CompanySid: this.currentCompany?.CompanyMasterSid,
      Status: "A",
      reportDetails: []
    };

    if (this.isEditMode) {
      this.masterService.updateReportById(this.ReportMasterSid, payload).subscribe({
        next: (resp: any) => {
          if (resp.status) {
            this.appSettingsService.showSuccess(resp.message);
            this.router.navigate(['/master/report-master/list']);
          } else {
            this.appSettingsService.showError(resp.message);
          }
        },
        error: () => {
          this.appSettingsService.showError('Update failed');
        }
      });
    } else {
      this.masterService.createReportMaster(payload).subscribe({
        next: (resp: any) => {
          if (resp.status) {
            this.appSettingsService.showSuccess(resp.message);
            this.router.navigate(['/master/report-master/list']);
          } else {
            this.appSettingsService.showError(resp.message);
          }
        },
        error: () => {
          this.appSettingsService.showError('Creation failed');
        }
      });
    }
  }

  resetForm() {
    if (this.isEditMode) {
      this.loadReportData();
    } else {
      this.reportForm.reset();
    }
  }

  navigateback() {
    this.router.navigate(["/master/report-master/list"])
  }

  showInfo() {
    if (!this.reportData) return;
    const modalRef = this.modalService.open(DetailsComponent, { size: 'lg', centered: true, backdrop: 'static' });
    modalRef.componentInstance.item = this.reportData;
    modalRef.componentInstance.idLabel = 'Report Master Id';
    modalRef.componentInstance.idValue = this.reportData?.ReportMasterSid;
  }

  openTandC() {
    this.currentMenuId = Number(localStorage.getItem('currentMenuId'));
    const payload = { MenuMasterSid: this.currentMenuId };
    this.masterService.getTandCByCondition(payload).subscribe(
      (resp: any) => {
        if (resp.status) {
          this.TandCList = resp.data;
          const modalRef = this.modalService.open(TermsAndConditionsComponent, {
            size: 'lg',
            backdrop: 'static',
            centered: true
          });
          modalRef.componentInstance.terms = this.TandCList;
          modalRef.componentInstance.MenuMasterSid = this.currentMenuId;
          modalRef.componentInstance.DocumentSid = this.ReportMasterSid;
        } else {
          this.appSettingService.showError('Error loading Terms and Conditions');
        }
      },
      (error) => {
        this.appSettingService.showError('Error loading Terms and Conditions', error);
      }
    );
  }

  openEmail() {
    if (!this.reportData) return;
    const modalRef = this.modalService.open(EmailEntryComponent, {
      size: 'lg',
      centered: true,
      backdrop: 'static'
    });
  }

  openAuthority() {
    const MenuMasterSid = localStorage.getItem('currentMenuId');
    if (!MenuMasterSid) return;
    const modalRef = this.modalService.open(AuthorityLogComponent, {
      size: 'lg',
      centered: true,
      backdrop: 'static'
    });
    modalRef.componentInstance.menuMasterSid = MenuMasterSid;
    modalRef.componentInstance.documentSid = this.ReportMasterSid;
  }

  openEDoc() {
    if (!this.reportData) return;
    const modalRef = this.modalService.open(EdocComponent, {
      size: 'lg',
      centered: true,
      backdrop: 'static'
    });
    modalRef.componentInstance.item = this.reportData;
    modalRef.componentInstance.idLabel = 'Report Master Id';
    modalRef.componentInstance.idValue = this.reportData?.ReportMasterSid;
  }

  openAuditLogs(modal: TemplateRef<any>) {
    if (!this.ReportMasterSid) return;

    this.masterService.getAuditLogs('ReportMaster', this.ReportMasterSid.toString()).subscribe({
      next: (logs: any[]) => {
        const formatFields = (val: any) => {
          if (!val) return ['NA'];
          const obj = typeof val === 'string' ? JSON.parse(val) : val;
          delete obj.updatedOn;
          if (Object.keys(obj).length === 0) return ['NA'];
          return Object.entries(obj).map(
            ([key, value]) => `${key}: ${value !== null && value !== undefined ? value : 'NA'}`
          );
        };

        this.auditLogs = logs.map(log => ({
          ...log,
          oldValDisplay: formatFields(log.oldVal),
          newValDisplay: formatFields(log.newVal)
        }));

        this.auditLogModalRef = this.modalService.open(modal, { centered: true, scrollable: true, windowClass: 'audit-log-modal' });
      },
      error: err => console.error('Error fetching audit logs:', err)
    });
  }
}
