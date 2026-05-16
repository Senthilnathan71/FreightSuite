import { CommonModule, DatePipe } from '@angular/common';
import { Component, HostListener, OnDestroy, OnInit,TemplateRef } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbModal, NgbCalendar, NgbDateAdapter, NgbDateParserFormatter, NgbDatepickerModule ,NgbModalRef, NgbDropdownModule} from '@ng-bootstrap/ng-bootstrap';
import { MasterService } from '../../master.service';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { DetailsComponent } from 'src/app/component/details/details.component';
import { NgSelectModule } from '@ng-select/ng-select';
import { FeatherModule } from 'angular-feather';
import { CustomDateAdapter } from 'src/app/component/datepicker/custom-date-adapter';
import { CustomDateParserFormatter } from 'src/app/component/datepicker/custom-date-parser';
import { TermsAndConditionsComponent } from 'src/app/component/terms&conditions/terms&conditions.component';
import { EmailEntryComponent } from 'src/app/modules/settings/email/email-entry/email-entry.component';
import { AuthorityEntryComponent } from '../../authority/authority-entry/authority-entry.component';
import { EdocComponent } from 'src/app/modules/settings/edoc/edoc/edoc.component';
import { AuthorityLogComponent } from 'src/app/component/authority-log/authority-log.component';
import { CommonService } from 'src/app/common/common.service';
import { MenuPermissionService } from 'src/app/core/services/menu-permission.service';
import { FollowUpComponent } from 'src/app/modules/settings/follow-up/follow-up/follow-up.component';
import { getDefaultTodayDate } from 'src/app/common/helper';
import { DocReferenceComponent } from 'src/app/modules/operation/doc-reference/doc-reference.component';
import { HasUnsavedChanges } from 'src/app/core/interfaces/has-unsaved-changes.interface';
import { AuditLogComponent } from 'src/app/modules/operation/audit-log/audit-log.component';

@Component({
   selector: 'app-hawb-stock-entry',
  standalone: true,
  imports: [
    CommonModule, 
    FeatherModule, 
    NgSelectModule, 
    ReactiveFormsModule,
    NgbDatepickerModule,
    DatePipe,
    NgbDropdownModule
  ],
   templateUrl: './hawb-stock-entry.component.html',
  styleUrl: './hawb-stock-entry.component.scss',
  providers: [
    { provide: NgbDateAdapter, useClass: CustomDateAdapter },
    { provide: NgbDateParserFormatter, useClass: CustomDateParserFormatter },
  ],
})
export class HawbStockEntryComponent implements OnInit, OnDestroy, HasUnsavedChanges {
  hawbForm!: FormGroup;
  isEditMode = false;
  HawbStockSid: number | null = null;
  userData: any;
  today = this.calendar.getToday();
  todayDate = new Date(this.today.year, this.today.month - 1, this.today.day);
  
  // Updated company and branch handling
  companyList: any[] = [];
  branchesByCompany: {[key: number]: any[]} = {};
  selectedCompanyId: number | null = null;
  branchList: any[] = [];
  generatedAWBList: string[] = [];
  customerList: any[] = [];
  statusList = ["Active", "Suspended"];
  stockStatusList = ["Free", "Blocked", "Return", "Void", "Hold"];
  currentMenuId: number;
  TandCList: any[]=[];
  hawstockData: any;
  btnDisable: boolean = false;
  permissions: string[] = [];
  currentMenuPermissions: any = {};
  auditLogs: any[] = []; // Stores audit logs
  auditLogModalRef!: NgbModalRef;
  currentCompany: any;
  currentBranch:any;
  MenuMasterSid: any;
  isDirty: boolean = false;
  isSaving: boolean = false;
  private initialFormValue: any = null;
  constructor(
    private fb: FormBuilder,
    private masterService: MasterService,
    private appSettingsService: AppSettingsService,
    private route: ActivatedRoute,
    private router: Router,
    private modalService: NgbModal,
    private calendar: NgbCalendar,
    private appSettingService: AppSettingsService,
    private commonService: CommonService,
    public mps: MenuPermissionService,
    private ngbModal: NgbModal,
  ) {}

  ngOnInit(): void {
    
    this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));
    this.currentBranch = this.appSettingService.decrypt(localStorage.getItem('selected-branch'));
    this.MenuMasterSid =  sessionStorage.getItem('currentMenuId');
       this.appSettingService.getUser().subscribe(user => {
    if(user) {
      this.userData = user;

    }
  });
    this.initForm();
    this.initialFormValue = this.hawbForm.getRawValue();
    this.subscribeToFormChanges();
    this.loadUserData();
    this.loadCustomers();
    this.mps.init().subscribe();
    
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.HawbStockSid = +id;
        this.isEditMode = true;
        this.loadHawbData(this.HawbStockSid);
      }
    });
  }

 
hasAnyDropdownPermission(): boolean {
    const dropdownButtons = ['Edoc','Authority', 'Email', 'Document Reference'];
    return dropdownButtons.some((btn) => this.permissions?.includes(btn));
    }

get BLNumber(): string {
  if (this.isEditMode) {
    // In edit mode, just return the stored AirwayBillNumber  
    return this.hawbForm.get('AirwayBillNumber')?.value || '';
  }
  const airwayBill = this.hawbForm.get('AirwayBillNumber')?.value || '';
  const hawbSerial = this.hawbForm.get('HAWBSerial')?.value || '';
  const noOfHawb = this.hawbForm.get('NumberofHAWB')?.value || '';
  if (!airwayBill && !hawbSerial && !noOfHawb) return '';
  return `${airwayBill}-${hawbSerial}-${noOfHawb}`;
}

 
  loadCustomers(): void {
     const CompanyMasterSid = this.currentCompany?.CompanyMasterSid;
    this.masterService.getAllCustomers(CompanyMasterSid).subscribe(
      (resp: any) => {
        this.customerList = resp;
      },
      (error) => {
        console.error('Error loading customers:', error);
      }
    );
  }

  initForm(): void {
    const today = getDefaultTodayDate();
    this.hawbForm = this.fb.group({
      AirwayBillType: ['Airline', Validators.required],
      AirwayBillNumber: ['', Validators.required],
      Agent: [null],
      HAWBSerial: ['', Validators.required],
      NumberofHAWB: ['', Validators.required],
      ReceivedDate: [today, Validators.required],
      StockStatus: ['Free', Validators.required],
      status: ['Active'],
      
    });
    this.btnDisable = true;
     this.hawbForm.get('AirwayBillType').valueChanges.subscribe(value => {
    this.updateFormValidation(value);
  });
    this.hawbForm.statusChanges.subscribe(status => {
    this.btnDisable = status !== 'VALID';
  });
  }
  updateFormValidation(awbType: string): void {
  const agentControl = this.hawbForm.get('Agent');
  if (awbType === 'Other') {
    agentControl.setValidators([Validators.required]);
  } else {
    agentControl.clearValidators();
  }
  agentControl.updateValueAndValidity();
}
generateAWB(): void {
  if (this.hawbForm.invalid) {
    this.hawbForm.markAllAsTouched();
    this.appSettingsService.showWarning('Please fill all required fields correctly.');
    return;
  }

  const baseAWB = this.hawbForm.get('AirwayBillNumber').value;
  const serial = this.hawbForm.get('HAWBSerial').value;
  const count = this.hawbForm.get('NumberofHAWB').value;

  this.generatedAWBList = [];
  for (let i = 1; i <= count; i++) {
    // Customize this pattern based on your AWB numbering requirements
    this.generatedAWBList.push(`${baseAWB}-${serial}-${i.toString().padStart(3, '0')}`);
  }
}
  
  
  loadUserData(): void {
    this.appSettingsService.getUser().subscribe(user => {
      if (user) {
        this.userData = user;
        if (user.companyMaster) {
          this.hawbForm.patchValue({
          
          });
         
        }
      }
    });
  }

  loadHawbData(id: number): void {
  this.masterService.fetchHawbStockById(id).subscribe(
    (data: any) => {
      const hawbData = data.data;
      const receivedDate = hawbData.ReceivedDate ? new Date(hawbData.ReceivedDate) : this.todayDate;
      const airBillParts = hawbData.AirwayBillNumber ? hawbData.AirwayBillNumber.split('-') : [];
      
      let baseAWB = '';
      let serial = '';
      let numberPart = '';
      
      if (airBillParts.length >= 3) {
        // Reconstruct: everything except last 2 parts is baseAWB
        baseAWB = airBillParts.slice(0, -2).join('-');
        serial = airBillParts[airBillParts.length - 2];
        numberPart = airBillParts[airBillParts.length - 1];
      } else {
        // Fallback: use stored values as-is
        baseAWB = hawbData.AirwayBillNumber;
        serial = hawbData.HAWBSerial;
        numberPart = hawbData.NumberofHAWB;
      }
      // First patch common fields except branch
      this.hawbForm.patchValue({
        AirwayBillType: hawbData.AirwayBillType,
        AirwayBillNumber: hawbData.AirwayBillNumber,
        Agent: hawbData.Agent,
        HAWBSerial: serial,
        NumberofHAWB: numberPart,
        ReceivedDate: receivedDate,
        StockStatus: hawbData.StockStatus,
        status: hawbData.status === 'A' ? 'Active' : 'Suspended',
        CompanyMasterSid : this.currentCompany?.CompanyMasterSid,
			  BranchMasterSid : this.currentBranch?. BranchMasterSid,
      });
      this.hawstockData = hawbData;
      this.initialFormValue = this.hawbForm.getRawValue();
      this.isDirty = false;
      this.hawbForm.markAsPristine();
      this.hawbForm.markAsUntouched();
    },
    error => {
      this.appSettingsService.showError('Error loading HAWB data.');
    }
  );
}


  preparePayload(): any {
    const formValue = this.hawbForm.value;
    return {
      ...formValue,
      status: formValue.status === 'Active' || formValue.status === 'A' ? 'A' : 'S',
      CompanyMasterSid : this.currentCompany?.CompanyMasterSid,
			BranchMasterSid : this.currentBranch?. BranchMasterSid,
      AWBList: this.generatedAWBList,
      createdBy: this.isEditMode ? undefined : this.userData?.userEmail,
      updatedBy: this.isEditMode ? this.userData?.userEmail : undefined
    };
  }

  onSubmit(resolve?: (value: boolean) => void): void {
     if (this.btnDisable) {
      if (resolve) resolve(false);
      return;
    }
    if (this.isSaving) {
      if (resolve) resolve(false);
      return;
    }
    if (this.hawbForm.invalid) {
      this.hawbForm.markAllAsTouched();
      this.appSettingsService.showWarning('Please fill all required fields correctly.');
      if (resolve) resolve(false);
      return;
    }

    const raw = this.hawbForm.getRawValue();
    if (this.deepEqual(raw, this.initialFormValue) && !this.isDirty) {
      this.appSettingsService.showWarning('No changes to save');
      this.hawbForm.markAsUntouched();
      if (resolve) resolve(false);
      return;
    }

    this.btnDisable = true; 
    this.isSaving = true;

    const payload = this.preparePayload();
    
    if (this.isEditMode && this.HawbStockSid) {
      this.masterService.updateHawbStockById(this.HawbStockSid, payload).subscribe(
        (resp: any) => {
          this.handleResponse(resp, resolve);
        },
        (error: any) => {
          this.handleError(error, resolve);
        }
      );
    } else {
      this.masterService.createNewHawbStock(payload).subscribe(
        (resp: any) => {
          this.handleResponse(resp, resolve);
        },
        (error: any) => {
          this.handleError(error, resolve);
        }
      );
    }
  }

  handleResponse(resp: any, resolve?: (value: boolean) => void): void {
    if (resp.status) {
      this.initialFormValue = this.hawbForm.getRawValue();
      this.isDirty = false;
      this.hawbForm.markAsPristine();
      this.hawbForm.markAsUntouched();
      this.appSettingsService.showSuccess(resp.message);
      if (resolve) resolve(true);
      this.router.navigate(['master/hawbstock/list']);
    } else {
      this.appSettingsService.showError(resp.message);
      if (resolve) resolve(false);
    }
    this.btnDisable = false;
    this.isSaving = false;
  }

  handleError(error: any, resolve?: (value: boolean) => void): void {
    this.appSettingsService.showError(error.message);
    console.error('Error:', error);
    this.btnDisable = false;
    this.isSaving = false;
    if (resolve) resolve(false);
  }

  showInfo(): void {
    if (!this.hawstockData) return;
    const modalRef = this.modalService.open(DetailsComponent, { 
      size: 'lg', 
      centered: true, 
      backdrop: 'static' 
    });
    modalRef.componentInstance.item = this.hawstockData.value;
    modalRef.componentInstance.idLabel = 'HAWB Stock Id';
    modalRef.componentInstance.idValue = this.hawstockData?.HawbStockSid;
  }

  navigateBack(): void {
    history.back();
  }

  resetForm(): void {
    if (this.isEditMode && this.HawbStockSid) {
      this.loadHawbData(this.HawbStockSid);
    } else {
      this.hawbForm.reset({
        AirwayBillType: 'Airline',
        StockStatus: 'Free',
        status: 'Active',
        ReceivedDate: this.todayDate,
       
      });
     
    }
  }
  

  // openTandC() {
  //   this.currentMenuId = Number(sessionStorage.getItem('currentMenuId'));
  //   const payload = { MenuMasterSid: this.currentMenuId };
  //   this.masterService.getTandCByCondition(payload).subscribe(
  //     (resp: any) => {
  //       if (resp.status) {
  //         this.TandCList = resp.data;
  //         const modalRef = this.modalService.open(TermsAndConditionsComponent, {
  //           size: 'lg',
  //           backdrop: 'static',
  //           centered: true
  //         });
  //         modalRef.componentInstance.terms = this.TandCList;
  //         modalRef.componentInstance.MenuMasterSid = this.currentMenuId;
  //         modalRef.componentInstance.DocumentSid = this.HawbStockSid;

  //       } else {
  //         this.appSettingService.showError('Error loading Terms and Conditions');
  //       }
  //     },
  //     (error) => {
  //       this.appSettingService.showError('Error loading Terms and Conditions', error);
  //     }
  //   );
  // }
  openEmail() {
    if (!this.hawstockData) return;
    const modalRef = this.modalService.open(EmailEntryComponent, {
      size: 'lg',
      centered: true,
      backdrop: 'static'
    });
  }

  openAuthority() {
    const MenuMasterSid = sessionStorage.getItem('currentMenuId');
    if (!MenuMasterSid) return;
   const modalRef = this.modalService.open(AuthorityLogComponent, { 
    size: 'lg', 
    centered: true, 
    backdrop: 'static' 
  });
    modalRef.componentInstance.menuMasterSid = MenuMasterSid;
    modalRef.componentInstance.documentSid = this.HawbStockSid;
  }

openEDoc() {
  if (!this.hawstockData) return;
  const modalRef = this.modalService.open(EdocComponent, { 
    size: 'lg', 
    centered: true, 
    backdrop: 'static' 
  });
  modalRef.componentInstance.item = this.hawstockData;
  modalRef.componentInstance.idLabel = 'HAWB Stock Id';
  modalRef.componentInstance.idValue = this.hawstockData?.HawbStockSid;
  const data:any={
    CompanyMasterSid: this.currentCompany.CompanyMasterSid,
    BranchMasterSid: this.currentBranch.BranchMasterSid,
    MenuMasterSid : this.MenuMasterSid,
    DocumentSid: this.HawbStockSid
  }

      this.commonService.documentData.set(data)
}

openDocRef() {
    const modalRef = this.modalService.open(DocReferenceComponent, {
      size: 'lg',
      centered: true,
      backdrop: 'static'
    });
  
    modalRef.componentInstance.CompanyMasterSid = this.currentCompany.CompanyMasterSid;
    modalRef.componentInstance.BranchMasterSid = this.currentBranch.BranchMasterSid;
    modalRef.componentInstance.MenuMasterSid = Number(this.MenuMasterSid);  
    modalRef.componentInstance.DocumentSid = this.HawbStockSid;
  }

 openFollowup() {
    if (!this.hawstockData) return;
    const modalRef = this.ngbModal.open(FollowUpComponent, { size: 'lg', centered: true, backdrop: 'static' });
    modalRef.componentInstance.documentSid = this.hawstockData?.QuoteHeaderSid;
    modalRef.componentInstance.parentEmail = this.hawstockData.Email;
    modalRef.componentInstance.parentSubject = `Quotation No.${this.hawstockData.QuoteNumber} Date:${new Date(this.hawstockData.QuoteDate).toLocaleDateString()}`;
    modalRef.componentInstance.parentMailbody = `
    <div style="font-family: Arial, sans-serif; padding: 20px; line-height: 1.6; color: #333;">
      <p>Dear Sir/Madam,</p>
      <p>Please find enclosed the quotation as requested.</p>
      <p>Kindly review the details at your convenience.</p>
      <p>Looking forward to your feedback and the opportunity to work together.</p>
      <p>
        Approval Hyperlink: 
        <a href="https://xxxxxxxxx" target="_blank" style="color: #1a73e8;">Click here to approve</a>
      </p>
      <p>Best Regards,</p>
      <p>${this.userData['userEmail']}</p>
    </div>
  `;

  // Optionally, pass the quotation HTML content ID for PDF generation
  modalRef.componentInstance.pdfContentId = 'quotationContent';
  }


  
  openAuditLogs() {
    if (!this.hawstockData?.HawbStockSid) return;
    const modalRef = this.modalService.open(AuditLogComponent, {
      centered: true,
      scrollable: true,
      size: 'xl',
      windowClass: 'audit-log-modal'
    });
    modalRef.componentInstance.title = 'HAWB-Stock Logs';
    modalRef.componentInstance.tableName = 'HawbStock';
    modalRef.componentInstance.recordId = this.hawstockData?.HawbStockSid.toString();
    modalRef.componentInstance.screenName = 'HawbStock';
  }


 navigateToCreateGeneration() {
    this.router.navigate(['master/hawbstock/entry'])
  }

  private subscribeToFormChanges(): void {
    this.hawbForm.valueChanges.subscribe(() => {
      this.isDirty = !this.deepEqual(this.initialFormValue, this.hawbForm.getRawValue());
    });
  }

  private normalizeValue(value: any): any {
    if (value === null || value === undefined) return null;
    if (value instanceof Date) return value.toISOString().split('T')[0];
    if (typeof value === 'string' && value.trim() !== '' && !isNaN(+value)) {
      return Number(value);
    }
    if (typeof value === 'number') return Number(value.toFixed(6));
    if (Array.isArray(value)) return value.map(v => this.normalizeValue(v));
    if (typeof value === 'object') {
      return Object.keys(value)
        .sort()
        .reduce((acc: any, key) => {
          acc[key] = this.normalizeValue(value[key]);
          return acc;
        }, {});
    }
    return value;
  }

  private deepEqual(obj1: any, obj2: any): boolean {
    return JSON.stringify(this.normalizeValue(obj1)) === JSON.stringify(this.normalizeValue(obj2));
  }

  @HostListener('window:beforeunload', ['$event'])
  unloadNotification($event: BeforeUnloadEvent): void {
    if (this.hasUnsavedChanges()) {
      $event.preventDefault();
      $event.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
    }
  }

  hasUnsavedChanges(): boolean {
    return this.isDirty;
  }

  async saveChanges(): Promise<boolean> {
    if (this.hawbForm.invalid) {
      this.hawbForm.markAllAsTouched();
      this.appSettingsService.showWarning('Please fill all required fields correctly.');
      return false;
    }

    const raw = this.hawbForm.getRawValue();
    if (this.deepEqual(raw, this.initialFormValue) && !this.isDirty) {
      this.appSettingsService.showWarning('No changes to save');
      return false;
    }

    return new Promise((resolve) => {
      this.onSubmit(resolve);
    });
  }

  ngOnDestroy(): void {
    this.isSaving = false;
  }

}
