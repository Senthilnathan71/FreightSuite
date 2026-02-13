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
import { CommonService } from 'src/app/common/common.service';
import { MenuPermissionService } from 'src/app/core/services/menu-permission.service';
import { FollowUpComponent } from 'src/app/modules/settings/follow-up/follow-up/follow-up.component';
import { getDefaultTodayDate } from 'src/app/common/helper';
import { catchError, of } from 'rxjs';
import { TextWithNumbersDirective } from 'src/app/core/Directives/textWithNumbers';
@Component({
  selector: 'app-mawb-stock',
  standalone: true,
  imports: [CommonModule, 
      FeatherModule, 
      NgSelectModule, 
      ReactiveFormsModule,
      NgbDatepickerModule,
      DatePipe,
      TextWithNumbersDirective,
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
    agentList: any[] = [];  // For "Other" type
    airlineList: any[] = [];
    companyList: any[] = [];
    branchesByCompany: {[key: number]: any[]} = {};
    selectedCompanyId: number | null = null;
    branchList: any[] = [];
    generatedAWBList: string[] = [];
    customerList: any[] = [];
    clientList: any[] = [];
    statusList = ["Active", "Suspended"];
    stockStatusList = ["Free", "Utilised", "Return", "Void", "Hold"];
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
      private ngbModal: NgbModal,
      public mps: MenuPermissionService,
      
    ){}
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
    this.loadCustomersByType();
    
    // Listen to AirwayBillType changes
    this.mawbForm.get('AirwayBillType').valueChanges.subscribe(value => {
      this.updateFormValidation(value);
      this.updateAgentDropdown(value);
    });
      this.mps.init().subscribe();
      
      this.route.paramMap.subscribe(params => {
        const id = params.get('id');
        if (id) {
          this.MawbStockSid = +id;
          this.isEditMode = true;
          this.loadMawbData(this.MawbStockSid);
        }
      });
       this.mawbForm.get('Agent').valueChanges.subscribe(customerId => {
      if (this.mawbForm.get('AirwayBillType').value === 'Airline') {
        this.updateMasterBillNumberFromAirline(customerId);
      }
    });
    }
  loadCustomersByType(): void {
    const CompanyMasterSid = this.currentCompany?.CompanyMasterSid;
    
    if (!CompanyMasterSid) return;
    
    // Load agents
    this.masterService.getCustomerByItsType({ CompanyMasterSid, types: ['agent'] })
      .pipe(catchError(err => of([])))
      .subscribe((resp: any) => {
        this.agentList = resp.data;
        // If form is in "Other" mode initially, update the dropdown
        if (this.mawbForm.get('AirwayBillType').value === 'Other') {
          this.customerList = this.agentList;
        }
      });
    
    // Load airlines
    this.masterService.getCustomerByItsType({ CompanyMasterSid, types: ['airLine'] })
      .pipe(catchError(err => of([])))
      .subscribe((resp: any) => {
        this.airlineList = resp.data;
        // If form is in "Airline" mode initially, update the dropdown
        if (this.mawbForm.get('AirwayBillType').value === 'Airline') {
          this.customerList = this.airlineList;
        }
      });

      this. masterService.getCustomerByItsType({ CompanyMasterSid, types: ['customer'] })
        .pipe(catchError(err => of([])))
        .subscribe((resp: any) => {
          this.clientList = resp.data;

        });
  }
  updateMasterBillNumberFromAirline(customerId: number): void {
    if (!customerId) return;
    
    // Find the selected airline
    const selectedAirline = this.airlineList.find(airline => 
      airline.CustomerMasterSid === customerId
    );
    
    // If found and has AirlineNumber, set it to MasterBillNumber
    if (selectedAirline?.AirlineNumber) {
      this.mawbForm.get('MasterBillNumber').setValue(selectedAirline.AirlineNumber);
    }
  }
  updateAgentDropdown(awbType: string): void {
    if (awbType === 'Airline') {
      this.customerList = this.airlineList;
      // Clear Agent and MasterBillNumber when switching to Airline
      this.mawbForm.get('Agent').setValue(null);
      this.mawbForm.get('MasterBillNumber').setValue('');
    } else if (awbType === 'Other') {
      this.customerList = this.agentList;
      // Clear MasterBillNumber when switching to Other
      this.mawbForm.get('MasterBillNumber').setValue('');
    }
  }
     

  hasAnyDropdownPermission(): boolean {
    const dropdownButtons = ['Edoc', 'Terms and Condition', 'Authority', 'Email'];
    return dropdownButtons.some((btn) => this.permissions?.includes(btn));
    }
  
 get BLNumber(): string {
  if (this.isEditMode) {
    // In edit mode, just return the stored MasterBillNumber
    return this.mawbForm.get('MasterBillNumber')?.value || '';
  }
  
  // In create mode, format it
  const airwayBill = this.mawbForm.get('MasterBillNumber')?.value || '';
  const hawbSerial = this.mawbForm.get('MAWBSerial')?.value || '';
  const noOfHawb = this.mawbForm.get('NumberofMAWB')?.value || '';
  
  if (!airwayBill && !hawbSerial && !noOfHawb) return '';
  return `${airwayBill}-${hawbSerial}-${noOfHawb}`;
}

   
    // loadCustomers(): void {
    //    const CompanyMasterSid = this.currentCompany?.CompanyMasterSid;
    //   this.masterService.getAllCustomers(CompanyMasterSid).subscribe(
    //     (resp: any) => {
    //       this.customerList = resp;
    //     },
    //     (error) => {
    //       console.error('Error loading customers:', error);
    //     }
    //   );
    // }
  
    initForm(): void {
      const today = getDefaultTodayDate();
      this.mawbForm = this.fb.group({
        AirwayBillType: ['Airline', Validators.required],
        MasterBillNumber: ['', [Validators.required, Validators.pattern(/^[0-9]{3}$/)]],
        Agent: [null, Validators.required],
        MAWBSerial: ['', [Validators.required, Validators.pattern(/^[0-9]{7}$/)]],
        NumberofMAWB: ['', Validators.required],
        ReceivedDate: [today, Validators.required],
        StockStatus: ['Free', Validators.required],
        AvailableStatus: ['Available'],
        Customer:[null],
        status: ['Active'],
        
      });
       if (this.mawbForm.get('AirwayBillType').value === 'Airline') {
    this.customerList = this.airlineList;
  }
  
  this.btnDisable = true;
  
  this.mawbForm.get('AirwayBillType').valueChanges.subscribe(value => {
    this.updateFormValidation(value);
    this.updateAgentDropdown(value);
  });
  
  this.mawbForm.statusChanges.subscribe(status => {
    this.btnDisable = status !== 'VALID';
  });
    }
    updateFormValidation(awbType: string): void {
  const agentControl = this.mawbForm.get('Agent');
  // Both "Airline" and "Other" require Agent field, just with different dropdown options
  if (awbType === 'Airline' || awbType === 'Other') {
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

  const prefix = this.mawbForm.get('MasterBillNumber')?.value; // 3 digit airline prefix
  let serial = Number(this.mawbForm.get('MAWBSerial')?.value); // starting 7 digit serial
  const count = Number(this.mawbForm.get('NumberofMAWB')?.value);

  this.generatedAWBList = [];

  for (let i = 0; i < count; i++) {

    const currentSerial = (serial + i).toString().padStart(7, '0');

    // ✅ IATA check digit calculation
    const checkDigit = Number(currentSerial) % 7;

    // Final AWB format
    const fullAWB = `${prefix}${currentSerial}${checkDigit}`;

    this.generatedAWBList.push(fullAWB);
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

      // Parse the MasterBillNumber to extract parts
      // Format: EA123-20-002 (baseAWB-serial-number)
      const masterBillParts = mawbData.MasterBillNumber ? mawbData.MasterBillNumber.split('-') : [];
      
      let baseAWB = '';
      let serial = '';
      let numberPart = '';
      
      if (masterBillParts.length >= 3) {
        // Reconstruct: everything except last 2 parts is baseAWB
        baseAWB = masterBillParts.slice(0, -2).join('-');
        serial = masterBillParts[masterBillParts.length - 2];
        numberPart = masterBillParts[masterBillParts.length - 1];
      } else {
        // Fallback: use stored values as-is
        baseAWB = mawbData.MasterBillNumber;
        serial = mawbData.MAWBSerial;
        numberPart = mawbData.NumberofMAWB;
      }
        const airwayBillType = mawbData.AirwayBillType || 'Airline';
      
      // Update dropdown based on AirwayBillType
      if (airwayBillType === 'Airline') {
        this.customerList = this.airlineList;
      } else if (airwayBillType === 'Other') {
        this.customerList = this.agentList;
      }


      this.mawbForm.patchValue({
        AirwayBillType: mawbData.AirwayBillType,
        MasterBillNumber: baseAWB,  // Keep the full formatted value
        Agent: mawbData.Agent,
        MAWBSerial: serial, // Extracted serial
        NumberofMAWB: numberPart, // Extracted number
        ReceivedDate: receivedDate,
        StockStatus: mawbData.StockStatus,
        Customer: mawbData.Customer,
        status: mawbData.status === 'A' ? 'Active' : 'Suspended',
        AvailableStatus: mawbData.AvailableStatus || 'Available',
        CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
        BranchMasterSid: this.currentBranch?.BranchMasterSid,
      });

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
          AvailableStatus: 'Available',
          status: 'Active',
          ReceivedDate: this.todayDate,
         
        });
       
      }
    }
    
  
    openTandC() {
      this.currentMenuId = Number(sessionStorage.getItem('currentMenuId'));
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
      const MenuMasterSid = sessionStorage.getItem('currentMenuId');
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
    const data:any={
    CompanyMasterSid: this.currentCompany.CompanyMasterSid,
    BranchMasterSid: this.currentBranch.BranchMasterSid,
    MenuMasterSid : this.MenuMasterSid,
    DocumentSid: this.MawbStockSid
  }

      this.commonService.documentData.set(data)
  }

   openFollowup() {
      if (!this.MawbStockSid) return;
      const modalRef = this.ngbModal.open(FollowUpComponent, { size: 'lg', centered: true, backdrop: 'static' });
      // modalRef.componentInstance.documentSid = this.MawbStockSid?.MawbStockSid;
      // modalRef.componentInstance.parentEmail = this.MawbStockSid.Email;
      // modalRef.componentInstance.parentSubject = `Quotation No.${this.MawbStockSid.QuoteNumber} Date:${new Date(this.MawbStockSid.QuoteDate).toLocaleDateString()}`;
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
   navigateToCreateGeneration() {
    this.router.navigate(['master/mawb-stock/entry'])
  }

}
