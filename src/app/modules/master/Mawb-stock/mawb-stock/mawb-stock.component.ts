import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit, TemplateRef } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { NgbCalendar, NgbDateAdapter, NgbDateParserFormatter, NgbDatepickerModule, NgbDropdownModule, NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { FeatherModule } from 'angular-feather';
import { CustomDateAdapter } from 'src/app/component/datepicker/custom-date-adapter';
import { CustomDateParserFormatter } from 'src/app/component/datepicker/custom-date-parser';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { MasterService } from '../../master.service';
import { AuthorityLogComponent } from 'src/app/component/authority-log/authority-log.component';
import { DetailsComponent } from 'src/app/component/details/details.component';
import { TermsAndConditionsComponent } from 'src/app/component/terms&conditions/terms&conditions.component';
import { EdocComponent } from 'src/app/modules/settings/edoc/edoc/edoc.component';
import { EmailEntryComponent } from 'src/app/modules/settings/email/email-entry/email-entry.component';
@Component({
  selector: 'app-mawb-stock',
  standalone: true,
  imports: [CommonModule, 
      FeatherModule, 
      NgSelectModule, 
      ReactiveFormsModule,
      NgbDatepickerModule,
      DatePipe,
      NgbDropdownModule],
  templateUrl: './mawb-stock.component.html',
  styles: ``,
  providers: [
      { provide: NgbDateAdapter, useClass: CustomDateAdapter },
      { provide: NgbDateParserFormatter, useClass: CustomDateParserFormatter },
    ],
})
export class MawbStockComponent implements OnInit{
  mawbForm!: FormGroup;
    isEditMode = false;
    MawbStockSid: number | null = null;
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
    mawstockData: any;
    btnDisable: boolean = false;
    permissions: string[] = [];
    currentMenuPermissions: any = {};
    auditLogs: any[] = []; // Stores audit logs
    auditLogModalRef!: NgbModalRef;
    currentCompany: any;
    currentBranch:any;
  constructor(  
    private fb: FormBuilder,
      private masterService: MasterService,
      private appSettingsService: AppSettingsService,
      private route: ActivatedRoute,
      private router: Router,
      private modalService: NgbModal,
      private calendar: NgbCalendar,
      private appSettingService: AppSettingsService,
    ){}
  ngOnInit(): void {
      
      this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));
      this.currentBranch = this.appSettingService.decrypt(localStorage.getItem('selected-branch'));
         this.appSettingService.getUser().subscribe(user => {
      if(user) {
        this.userData = user;
        this.checkPermissions();
      }
    });
      this.initForm();
      this.loadUserData();
      this.loadCustomers();
      
      
      this.route.paramMap.subscribe(params => {
        const id = params.get('id');
        if (id) {
          this.MawbStockSid = +id;
          this.isEditMode = true;
          this.loadMawbData(this.MawbStockSid);
        }
      });
    }
  
          checkPermissions() {
      const currentMenuId = Number(localStorage.getItem('currentMenuId'));
      const userRole = this.userData?.userRoleMaster[0]?.RoleMasterSid;
      console.log(currentMenuId)
      console.log(userRole)
      if (currentMenuId && userRole) {
       this.masterService.getRoleMenuPermissions(currentMenuId, userRole).subscribe({
    next: (response) => {
      this.currentMenuPermissions = response.data.MenuPermissions || {};
      this.permissions = Object.keys(this.currentMenuPermissions)
        .filter(key => this.currentMenuPermissions[key] === 'isTrue');
        console.log(this.permissions)
    }
  });
      }
    }
  
    hasPermission(permission: string): boolean {
    return this.permissions.includes(permission);
  }
  
  get BLNumber(): string {
  const airwayBill = this.mawbForm.get('MasterBillNumber')?.value || '';
  const hawbSerial = this.mawbForm.get('MAWBSerial')?.value || '';
  const noOfHawb = this.mawbForm.get('NumberofMAWB')?.value || '';
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
      this.mawbForm = this.fb.group({
        AirwayBillType: ['Airline', Validators.required],
        MasterBillNumber: ['', Validators.required],
        Agent: [null],
        MAWBSerial: ['', Validators.required],
        NumberofMAWB: ['', Validators.required],
        ReceivedDate: [this.todayDate, Validators.required],
        StockStatus: ['Free', Validators.required],
        status: ['Active'],
        
      });
      this.btnDisable = true;
       this.mawbForm.get('AirwayBillType').valueChanges.subscribe(value => {
      this.updateFormValidation(value);
    });
      this.mawbForm.statusChanges.subscribe(status => {
      this.btnDisable = status !== 'VALID';
    });
    }
    updateFormValidation(awbType: string): void {
    const agentControl = this.mawbForm.get('Agent');
    if (awbType === 'Other') {
      agentControl.setValidators([Validators.required]);
    } else {
      agentControl.clearValidators();
    }
    agentControl.updateValueAndValidity();
  }
  generateAWB(): void {
    if (this.mawbForm.invalid) {
      this.mawbForm.markAllAsTouched();
      this.appSettingsService.showWarning('Please fill all required fields correctly.');
      return;
    }
  
    const baseAWB = this.mawbForm.get('MasterBillNumber').value;
    const serial = this.mawbForm.get('MAWBSerial').value;
    const count = this.mawbForm.get('NumberofMAWB').value;
  
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
            this.mawbForm.patchValue({
            
            });
           
          }
        }
      });
    }
  
    loadMawbData(id: number): void {
    this.masterService.fetchMawbStockById(id).subscribe(
      (data: any) => {
        const mawbData = data.data;
        const receivedDate = mawbData.ReceivedDate ? new Date(mawbData.ReceivedDate) : this.todayDate;
  
        // First patch common fields except branch
        this.mawbForm.patchValue({
          AirwayBillType: mawbData.AirwayBillType,
          MasterBillNumber: mawbData.MasterBillNumber,
          Agent: mawbData.Agent,
          MAWBSerial: mawbData.MAWBSerial,
          NumberofMAWB: mawbData.NumberofMAWB,
          ReceivedDate: receivedDate,
          StockStatus: mawbData.StockStatus,
          status: mawbData.status === 'A' ? 'Active' : 'Suspended',
          CompanyMasterSid : this.currentCompany?.CompanyMasterSid,
          BranchMasterSid : this.currentBranch?. BranchMasterSid,
        });
  
        // Ensure branches are loaded first, then patch BranchMasterSid
        try {
          this.generatedAWBList = mawbData.AWBList ? JSON.parse(mawbData.AWBList) : [];
        } catch (e) {
          console.warn("Invalid AWBList JSON:", mawbData.AWBList);
          this.generatedAWBList = [];
        }
  
        this.mawstockData = mawbData;
      },
      error => {
        this.appSettingsService.showError('Error loading MAWB data.');
      }
    );
  }
  
  
    preparePayload(): any {
      const formValue = this.mawbForm.value;
      return {
        ...formValue,
        status: formValue.status === "Active" ? "A" : "S",
        CompanyMasterSid : this.currentCompany?.CompanyMasterSid,
        BranchMasterSid : this.currentBranch?. BranchMasterSid,
        AWBList: this.generatedAWBList,
        createdBy: this.isEditMode ? undefined : this.userData?.userEmail,
        updatedBy: this.isEditMode ? this.userData?.userEmail : undefined
      };
    }
  
    onSubmit(): void {
       if (this.btnDisable) return; 
      if (this.mawbForm.invalid) {
        this.mawbForm.markAllAsTouched();
        this.appSettingsService.showWarning('Please fill all required fields correctly.');
        return;
      }
      this.btnDisable = true; 
  
      const payload = this.preparePayload();
      
      if (this.isEditMode && this.MawbStockSid) {
        this.masterService.updateMawbStockById(this.MawbStockSid, payload).subscribe(
          (resp: any) => {
            this.handleResponse(resp);
          },
          (error: any) => {
            this.handleError(error);
          }
        );
      } else {
        this.masterService.createNewMawbStock(payload).subscribe(
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
        this.router.navigate(['master/mawb-stock/list']);
      } else {
        this.appSettingsService.showError(resp.message);
      }
    }
  
    handleError(error: any): void {
      this.appSettingsService.showError(error.message);
      console.error('Error:', error);
    }
  
    showInfo(): void {
      if (!this.mawstockData) return;
      const modalRef = this.modalService.open(DetailsComponent, { 
        size: 'lg', 
        centered: true, 
        backdrop: 'static' 
      });
      modalRef.componentInstance.item = this.mawstockData.value;
      modalRef.componentInstance.idLabel = 'MAWB Stock Id';
      modalRef.componentInstance.idValue = this.mawstockData?.MawbStockSid;
    }
  
    navigateBack(): void {
      history.back();
    }
  
    resetForm(): void {
      if (this.isEditMode && this.MawbStockSid) {
        this.loadMawbData(this.MawbStockSid);
      } else {
        this.mawbForm.reset({
          AirwayBillType: 'Airline',
          StockStatus: 'Free',
          status: 'Active',
          ReceivedDate: this.todayDate,
         
        });
       
      }
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
            modalRef.componentInstance.DocumentSid = this.MawbStockSid;
  
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
      if (!this.mawstockData) return;
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
      modalRef.componentInstance.documentSid = this.MawbStockSid;
    }
  
  openEDoc() {
    if (!this.mawstockData) return;
    const modalRef = this.modalService.open(EdocComponent, { 
      size: 'lg', 
      centered: true, 
      backdrop: 'static' 
    });
    modalRef.componentInstance.item = this.mawstockData;
    modalRef.componentInstance.idLabel = 'MAWB Stock Id';
    modalRef.componentInstance.idValue = this.mawstockData?.MawbStockSid;
  }
  
  openAuditLogs(modal: TemplateRef<any>) {
    if (!this.MawbStockSid) return;
  
    this.masterService.getAuditLogs(
      'MawbStock',
      this.MawbStockSid.toString()
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
}
