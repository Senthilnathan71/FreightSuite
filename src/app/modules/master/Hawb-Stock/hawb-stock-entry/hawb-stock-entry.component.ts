import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit,TemplateRef } from '@angular/core';
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
export class HawbStockEntryComponent implements OnInit {
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

  onSubmit(): void {
     if (this.btnDisable) return; 
    if (this.hawbForm.invalid) {
      this.hawbForm.markAllAsTouched();
      this.appSettingsService.showWarning('Please fill all required fields correctly.');
      return;
    }
    this.btnDisable = true; 

    const payload = this.preparePayload();
    
    if (this.isEditMode && this.HawbStockSid) {
      this.masterService.updateHawbStockById(this.HawbStockSid, payload).subscribe(
        (resp: any) => {
          this.handleResponse(resp);
        },
        (error: any) => {
          this.handleError(error);
        }
      );
    } else {
      this.masterService.createNewHawbStock(payload).subscribe(
        (resp: any) => {
          this.handleResponse(resp);
        },
        (error: any) => {
          this.handleError(error);
        }
      );
    }
  }

  handleResponse(resp: any): void {
    if (resp.status) {
      this.appSettingsService.showSuccess(resp.message);
      this.router.navigate(['master/hawbstock/list']);
    } else {
      this.appSettingsService.showError(resp.message);
    }
  }

  handleError(error: any): void {
    this.appSettingsService.showError(error.message);
    console.error('Error:', error);
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

//  openAuditLogs(modal: TemplateRef<any>) {
//   if (!this.HawbStockSid) return;

//   this.masterService.getAuditLogs('HawbStock', this.HawbStockSid.toString()).subscribe({
//     next: (logs: any[]) => {
//       const formatFields = (val: any) => {
//         if (!val) return ['NA'];
//         const obj = typeof val === 'string' ? JSON.parse(val) : val;
//         delete obj.updatedOn; // Remove updatedOn field
//         // If no fields exist after deleting updatedOn
//         if (Object.keys(obj).length === 0) return ['NA'];
//         return Object.entries(obj).map(
//           ([key, value]) => `${key}: ${value !== null && value !== undefined ? value : 'NA'}`
//         );
//       };

//       this.auditLogs = logs.map(log => ({
//         ...log,
//         oldValDisplay: formatFields(log.oldVal),
//         newValDisplay: formatFields(log.newVal)
//       }));

//       this.auditLogModalRef = this.modalService.open(modal, { centered: true, scrollable: true, windowClass: 'audit-log-modal' });
//     },
//     error: err => console.error('Error fetching audit logs:', err)
//   });
// }
openAuditLogs(modal: TemplateRef<any>) {
  if (!this.HawbStockSid) return;

  this.masterService.getAuditLogs(
    'HawbStock',
    this.HawbStockSid.toString()
  ).subscribe({
    next: (logs: any[]) => {
      const ignoredFields = ['updatedOn','updatedBy']; // ✅ add more if needed later

      const formatFields = (val: any) => {
        if (!val) return [];
        const obj = typeof val === 'string' ? JSON.parse(val) : val;
        if (Object.keys(obj).length === 0) return [];
        return Object.entries(obj)
          .filter(([key]) => !ignoredFields.includes(key)) // 🚫 exclude fields
          .map(([key, value]) => `${key}: ${value ?? 'NA'}`);
      };

      this.auditLogs = logs
        .map(log => ({
          ...log,
          oldValDisplay: formatFields(log.oldVal),
          newValDisplay: formatFields(log.newVal),
        }))
        .filter(log => log.oldValDisplay.length > 0 || log.newValDisplay.length > 0);

      this.auditLogModalRef = this.modalService.open(modal, {
        centered: true,
        scrollable: true,
        windowClass: 'audit-log-modal'
      });
    },
    error: err => console.error('Error fetching audit logs:', err)
  });
}
 navigateToCreateGeneration() {
    this.router.navigate(['master/hawbstock/entry'])
  }

}