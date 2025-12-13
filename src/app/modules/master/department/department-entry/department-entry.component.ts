import { Component, NgZone, TemplateRef } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { FeatherModule } from 'angular-feather';
import { MasterService } from '../../master.service';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule, DatePipe } from '@angular/common';
import { TextWithNumbersDirective } from 'src/app/core/Directives/textWithNumbers';
import { OnlyNumbersDirective } from 'src/app/core/Directives/onlyNumbersOfLength';
import { OnlyTextDirective } from 'src/app/core/Directives/onlyStringOfLength';
import { NgSelectModule } from '@ng-select/ng-select';
import { Division } from 'src/app/modules/crm-mobile/Interfaces/division.interface';
import { NgbDropdownModule, NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { DetailsComponent } from 'src/app/component/details/details.component';
import { TermsAndConditionsComponent } from 'src/app/component/terms&conditions/terms&conditions.component';
import { EmailEntryComponent } from 'src/app/modules/settings/email/email-entry/email-entry.component';
import { AuthorityEntryComponent } from '../../authority/authority-entry/authority-entry.component';
import { EdocComponent } from 'src/app/modules/settings/edoc/edoc/edoc.component';
import { AuthorityLogComponent } from 'src/app/component/authority-log/authority-log.component';
import { CommonService } from 'src/app/common/common.service';
import { MenuPermissionService } from 'src/app/core/services/menu-permission.service';
interface IWindow extends Window {
  webkitSpeechRecognition: any;
}
@Component({
  selector: 'app-department-entry',
  standalone: true,
  imports: [
    NgSelectModule,
    FeatherModule,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    OnlyNumbersDirective,
    OnlyTextDirective,
    TextWithNumbersDirective,
    DatePipe,
    NgbDropdownModule
  ],
  templateUrl: './department-entry.component.html',
  styleUrl: './department-entry.component.scss'
})
export class DepartmentEntryComponent {
  departmentForm!: FormGroup;
  isEditMode = false; // Flag for edit mode
  errorMessage: string = '';  // To store any error messages
  btnDisable: boolean = false;
  DepartmentMasterSid: number;
  divisionList : Division[];
  departmentData : any;
  permissions: string[] = [];
  currentMenuPermissions: any = {};
  userData: any;
  countryList: any
  stateList: any
  statusList = ["Active", "Suspended"]
  currentMenuId: any;

  TandCList: any[]=[];
  departmentTypeOptions = ['Sea', 'Air', 'Road', 'Transport', 'Others'];
  auditLogs: any[] = []; // Stores audit logs
  auditLogModalRef!: NgbModalRef;
  currentCompany: any;
  currentBranch: any;
  recognition: any;
  isListening = false;
  activeControl: string | null = null;
  MenuMasterSid: any;

  constructor(
    private fb: FormBuilder,
    private masterService: MasterService,
    private appSettingService: AppSettingsService,
    private route: ActivatedRoute,
    private router: Router,
    private modalService : NgbModal,
    private ngZone: NgZone,
    private commonService: CommonService,
    public mps : MenuPermissionService
  ) { 
    const { webkitSpeechRecognition }: IWindow = window as any;
    this.recognition = new webkitSpeechRecognition() || new (window as any).SpeechRecognition();
    this.recognition.lang = 'en-IN'; // Language
    this.recognition.interimResults = false;
    this.recognition.maxAlternatives = 1;
 
    // Event when recognition result comes
    this.recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
 
      this.ngZone.run(() => {
        console.log('🎤 Recognized Speech:', transcript);
        if (this.activeControl) {
          console.log(this.activeControl)
          this.departmentForm.get(this.activeControl)?.setValue(transcript);
        }
      });
    };
 
    this.recognition.onerror = (event: any) => {
      console.error('Voice recognition error:', event);
    };
 
    this.recognition.onend = () => {
      console.log('🛑 Voice recognition stopped');
      this.ngZone.run(() => (this.isListening = false));
    };
  }

  startVoiceRecognitionFor(controlName: string) {
  if (this.isListening) {
    this.recognition.stop();
    this.isListening = false;
  } else {
    this.activeControl = controlName;
    this.isListening = true;
    console.log(`🎙️ Listening for ${controlName}...`);
    this.recognition.start();

    this.recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript.trim();
      console.log(`✅ Recognized for ${controlName}: ${transcript}`);

      let value: any = transcript;

      // 🔑 Define numeric fields (from your Prisma model)
      const numericFields = [
        
      ];

      // Convert to number if field is numeric
      if (numericFields.includes(controlName)) {
        const parsed = parseFloat(transcript.replace(/[^0-9.]/g, ''));
        value = isNaN(parsed) ? null : parsed;
      }

      const dropdownOptions: Record<string, string[]> = {
        departmentType: this.departmentTypeOptions || [],
        ExportImport: ["Export", "Import"],
        FCLLCL: ["FCL", "LCL"],
        Division: this.divisionList?.map((d: any) => d.DivisionName) || []
      };

      // Synonyms (extend as needed)
      const synonyms: Record<string, string> = {
        sea: "Sea",
        seaway: "Sea",
        ocean: "Sea",
        air: "Air",
        flight: "Air",
        sky: "Air",
        road: "Road",
        land: "Road",
        export: "Export",
        import: "Import",
        fcl: "FCL",
        full: "FCL",
        lcl: "LCL",
        less: "LCL"
      };

        if (dropdownOptions[controlName]) {
        const spoken = transcript.toLowerCase();
        let matchedOption: string | null = null;

        // ✅ Check synonyms first
        for (const [key, val] of Object.entries(synonyms)) {
          if (spoken.includes(key.toLowerCase())) {
            matchedOption = dropdownOptions[controlName].find(
              opt => opt.toLowerCase() === val.toLowerCase()
            ) || null;
            break;
          }
        }

        // ✅ Fuzzy match with actual dropdown options
        if (!matchedOption) {
          matchedOption = dropdownOptions[controlName].find(
            opt =>
              opt.toLowerCase() === spoken ||
              opt.toLowerCase().includes(spoken) ||
              spoken.includes(opt.toLowerCase())
          ) || null;
        }

        if (matchedOption) {
          value = matchedOption;
          console.log(`🎯 Matched ${controlName}: ${matchedOption}`);
        } else {
          console.warn(`⚠️ No matching option found for "${spoken}" in ${controlName}`);
          value = null;
        }
      }

      // Patch value into form
      this.departmentForm.get(controlName)?.setValue(value);
      this.departmentForm.get(controlName)?.markAsDirty();

      // Stop listening after first result
      this.recognition.stop();
      this.isListening = false;
    };

    this.recognition.onerror = (event: any) => {
      console.error('❌ Voice recognition error:', event.error);
      this.isListening = false;
    };

    this.recognition.onend = () => {
      this.isListening = false;
    };
  }
}

  ngOnInit(): void {
     this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));
       this.currentBranch = this.appSettingService.decrypt(localStorage.getItem('selected-branch'));
       this.MenuMasterSid =  localStorage.getItem('currentMenuId');
       this.mps.init().subscribe();
    this.initForm();
    this.getAllDivisions();
    // Subscribe to route params and load lead if ID exists
    this.route.paramMap.subscribe(params => {
      this.DepartmentMasterSid = +params.get('id');
      if (this.DepartmentMasterSid) {
        this.isEditMode = true;
        this.loadDepartmentData(this.DepartmentMasterSid);
      }
    });
    // this.appSettingService.getUser().subscribe(
    //   user => {
    //     if (user) {
    //       this.userData = user;
    //       
    //     }
    //   }
    // );
    const userProfile = this.appSettingService.getDecryptedUserProfile();
		if(userProfile){
			this.userData = userProfile;
      
		}

  }

 
hasAnyDropdownPermission(): boolean {
    const dropdownButtons = ['Edoc', 'Terms and Condition', 'Authority', 'Email'];
    return dropdownButtons.some((btn) => this.permissions?.includes(btn));
    }

  // Initialize the Form
  initForm() {
    this.departmentForm = this.fb.group({
      departmentName: ['', [Validators.required]],
      departmentCode: ['', [Validators.required]],
      departmentType: ['', [Validators.required]],
      ExportImport: ['', [Validators.required]],
      FCLLCL: ['', [Validators.required]],
      Division : [''],
      Remarks : [''],
      Status: ['Active']
    });
  }

  onSubmit() {
    if (this.departmentForm.invalid) {
      this.departmentForm.markAllAsTouched(); // Force validation messages to show
      this.departmentForm.updateValueAndValidity(); // Ensure validation is refreshed
      this.appSettingService.showWarning('Please fill all required fields correctly.')
      return;
    } else {
      let createdBy = { createdBy: this.appSettingService.userSettingSource.value['userEmail'] };
      let updatedBy = { updatedBy: this.appSettingService.userSettingSource.value['userEmail'] };
      const formValue = this.departmentForm.value;

      const payload = (this.isEditMode) ? {
        ...formValue,
        ...updatedBy,
        Status: formValue.Status === "Active" ? "A" : "S",
        
        CompanyMasterSid : this.currentCompany?.CompanyMasterSid,
      } : {
        ...formValue,
        ...createdBy,
        Status: formValue.Status === "Active" ? "A" : "S",
        CompanyMasterSid : this.currentCompany?.CompanyMasterSid,
      };


      console.log('payload', payload);

      if (this.isEditMode) {
        this.masterService.updateDepartmentById(this.DepartmentMasterSid, payload).subscribe(
          (resp: any) => {

            console.log(resp.message);
            if (resp.status) {
              this.appSettingService.showSuccess(resp.message);
              this.router.navigate(['master/department/list']);
            } else {
              this.appSettingService.showError(resp.message);
            }

          },
          (error) => {
            this.errorMessage = error.message;
            console.error('Error loading country:', error);
          }
        );
      } else {

        this.masterService.createDepartment(payload).subscribe(
          (resp: any) => {

            console.log(resp);
            if (resp.status) {
              this.appSettingService.showSuccess(resp.message);
              this.router.navigate(['master/department/list']);

            } else {
              this.appSettingService.showError(resp.message);
            }

          },
          (error) => {
            this.errorMessage = error.message;
            console.error('Error loading country:', error);
          }
        );
      }
    }
  }

  // Mapping for API status values
  statusMap: { [key: string]: string } = {
    A: 'Active',
    S: 'Suspended',
    
  };

  getAllDivisions(){
     const CompanyMasterSid = this.currentCompany?.CompanyMasterSid;
    this.masterService.getAllDivisions(CompanyMasterSid).subscribe(
      (resp:any)=>{
        this.divisionList=resp;
      }
    )
  }

  // Fetch lead data and patch the form
  loadDepartmentData(deptId: number) {
    this.masterService.getDepartmentById(deptId).subscribe(
      (deptData: any) => {
        this.departmentData = deptData;
        this.departmentForm.patchValue({
          ...deptData,
          Status: deptData.Status === 'A' ? 'Active' : 'Suspended'
        },
        );
      },
      (error) => {
        this.appSettingService.showError('Error loading lead data.');
      }
    );
  }

//  openAuditLogs(modal: TemplateRef<any>) {
//    if (!this.DepartmentMasterSid) return;
 
//    this.masterService.getAuditLogs('DepartmentMaster', this.DepartmentMasterSid.toString()).subscribe({
//      next: (logs: any[]) => {
//        const formatFields = (val: any) => {
//          if (!val) return [];
//          const obj = typeof val === 'string' ? JSON.parse(val) : val;
//          if (Object.keys(obj).length === 0) return [];
//          return Object.entries(obj).map(
//            ([key, value]) => `${key}: ${value !== null && value !== undefined ? value : 'NA'}`
//          );
//        };
 
//        // ✅ Filter out rows where both old & new values are empty (no change)
//        this.auditLogs = logs
//          .map(log => ({
//            ...log,
//            oldValDisplay: formatFields(log.oldVal),
//            newValDisplay: formatFields(log.newVal),
//          }))
//          .filter(log => log.oldValDisplay.length > 0 || log.newValDisplay.length > 0);
 
//        this.auditLogModalRef = this.modalService.open(modal, {
//          centered: true,
//          scrollable: true,
//          windowClass: 'audit-log-modal'
//        });
//      },
//      error: err => console.error('Error fetching audit logs:', err)
//    });
//  }

openAuditLogs(modal: TemplateRef<any>) {
  if (!this.DepartmentMasterSid) return;

  this.masterService.getAuditLogs(
    'DepartmentMaster',
    this.DepartmentMasterSid.toString()
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



  reset() {
  // If we're editing, reload original record from server to restore original values
  if (this.isEditMode && this.DepartmentMasterSid) {
    this.loadDepartmentData(this.DepartmentMasterSid);
    return;
  }

  // Create-mode: reset to sensible defaults
  this.departmentForm.reset({
    departmentName: '',
    departmentCode: '',
    departmentType: '',
    ExportImport: '',
    FCLLCL: '',
    Division: '',
    Remarks: '',
    Status: 'Active'
  });

  // Mirror init behaviour: if status should be disabled in create mode, disable it
  const statusCtrl = this.departmentForm.get('Status');
  if (statusCtrl) {
    statusCtrl.disable();
  }

  // Clear local state
  this.departmentData = null;
  this.DepartmentMasterSid = null;

  // Reset any UI button state you track
  this.btnDisable = false;
}

  goBack() {
    history.back()
  }

  showInfo() {
    if(!this.departmentData) return;
    const modalRef = this.modalService.open(DetailsComponent, { size: 'lg', centered: true, backdrop: 'static' });
    modalRef.componentInstance.item = this.departmentData;
    modalRef.componentInstance.idLabel = 'Department Id';
    modalRef.componentInstance.idValue = this.departmentData?.DepartmentMasterSid;
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
            modalRef.componentInstance.DocumentSid = this.DepartmentMasterSid;
  
          } else {
            this.appSettingService.showError('Error loading Terms and Conditions');
          }
        },
        (error) => {
          this.appSettingService.showError('Error loading Terms and Conditions',error);
        }
      );
    }
  openEmail() {
    if (!this.departmentData) return;
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
    modalRef.componentInstance.documentSid = this.DepartmentMasterSid;
  }

openEDoc() {
  if (!this.departmentData) return;
  const modalRef = this.modalService.open(EdocComponent, { 
    size: 'lg', 
    centered: true, 
    backdrop: 'static' 
  });
  modalRef.componentInstance.item = this.departmentData;
  modalRef.componentInstance.idLabel = 'Department Id';
  modalRef.componentInstance.idValue = this.departmentData?.DepartmentMasterSid;
   const data:any={
    CompanyMasterSid: this.currentCompany.CompanyMasterSid,
    BranchMasterSid: this.currentBranch.BranchMasterSid,
    MenuMasterSid : this.MenuMasterSid,
    DocumentSid: this.DepartmentMasterSid
  }

      this.commonService.documentData.set(data)
}
 ngOnDestroy(): void {
    this.commonService.clearDocumentData()
 }

}
