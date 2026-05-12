import { CommonModule, DatePipe } from '@angular/common';
import { Component, HostListener, NgZone, OnDestroy, OnInit, TemplateRef } from '@angular/core';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FeatherModule } from 'angular-feather';
import { NgSelectModule } from '@ng-select/ng-select';
import { ActivatedRoute, Router } from '@angular/router';
import { ContainerType } from 'src/app/modules/crm-mobile/Interfaces/container-type.interface';
import { MasterService } from '../../master.service';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { OnlyTextDirective } from 'src/app/core/Directives/onlyStringOfLength';
import { TextWithNumbersDirective } from 'src/app/core/Directives/textWithNumbers';
import { NgbDropdownModule, NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { DetailsComponent } from 'src/app/component/details/details.component';
import { PreventMultiClickDirective } from 'src/app/core/Directives/prevent-multi-click.directive';
import { TermsAndConditionsComponent } from 'src/app/component/terms&conditions/terms&conditions.component';
import { EmailEntryComponent } from 'src/app/modules/settings/email/email-entry/email-entry.component';
import { AuthorityEntryComponent } from '../../authority/authority-entry/authority-entry.component';
import { EdocComponent } from 'src/app/modules/settings/edoc/edoc/edoc.component';
import { AuthorityLogComponent } from 'src/app/component/authority-log/authority-log.component';
import { DecimalPrecisionDirective } from 'src/app/core/Directives/decimalWithPrecision';
import { OnlyNumbersDirective } from 'src/app/core/Directives/onlyNumbersOfLength';
import { CommonEntryHeaderComponent } from 'src/app/shared/components/common-entry-header/common-entry-header.component';
import { CommonService } from 'src/app/common/common.service';
import { MenuPermissionService } from 'src/app/core/services/menu-permission.service';
import { DocReferenceComponent } from 'src/app/modules/operation/doc-reference/doc-reference.component';
import { HasUnsavedChanges } from 'src/app/core/interfaces/has-unsaved-changes.interface';
import { Subject, debounceTime, finalize, takeUntil } from 'rxjs';
import { AuditLogComponent } from 'src/app/modules/operation/audit-log/audit-log.component';

interface IWindow extends Window {
  webkitSpeechRecognition: any;
}
@Component({
  selector: 'app-container-type-entry',
  standalone: true,
  imports: [
    FeatherModule,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    OnlyTextDirective,
    TextWithNumbersDirective,
    NgSelectModule,
    DatePipe,
    PreventMultiClickDirective,
    NgbDropdownModule,
    DecimalPrecisionDirective,
    OnlyNumbersDirective,
    CommonEntryHeaderComponent
  ],
  templateUrl: './container-type-entry.component.html',
  styleUrl: './container-type-entry.component.scss'
})
export class ContainerTypeEntryComponent implements OnInit, OnDestroy, HasUnsavedChanges {

  containertypeForm!: FormGroup;
  isEditMode = false;
  containertypes: ContainerType[] = [];
  errorMessage: string = '';
  btnDisable: boolean = false;
  ContainerTypeMasterSid: number;
  containerData : any;
  currentCompany: any;
  currentBranch: any; 
  MenuMasterSid: any;
    userData:any;
   permissions: string[] = [];
  currentMenuPermissions: any = {};
  statusList = [
    { id: 'A', name: 'Active' },
    { id: 'S', name: 'Suspended' }
  ];
  
containerCategories = [
  'Dry storage container',
  'Flat rack container',
  'Open top container',
  'Open side storage container',
  'Refrigerated ISO containers',
  'ISO Tanks',
  'Half height containers',
  'Special purpose container',
  'General'
];

containerSizes = [
  "20' STD",
  "40' STD",
  "40' HC",
  "45' HC",
  "20' OT",
  "40' OT",
  "20' FR",
  "40' FR",
  "20' RFC",
  "40' RFC",
  "20' BULK",
  "20' TANK",
  "45' PW"
];

noOfTeuOptions = [
  {value: 1, label: '1'},
  {value: 2, label: '2'}
];

  companyList: any[] =[];
  currentMenuId: number;
  TandCList: any;
  auditLogs: any[] = []; // Stores audit logs
  auditLogModalRef!: NgbModalRef;
  recognition: any;
  isListening = false;
  activeControl: string | null = null;
  isDirty: boolean = false;
  isSaving: boolean = false;
  private initialFormValue: any = null;
  private destroy$ = new Subject<void>();

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
          this.containertypeForm.get(this.activeControl)?.setValue(transcript);
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
        'Length',
        'Width',
        'Height',
        'MaxVolume',
        'TareWeight',
        'GrossWeight',
        'NoOfTeu'
      ];

      // Convert to number if field is numeric
      if (numericFields.includes(controlName)) {
        const parsed = parseFloat(transcript.replace(/[^0-9.]/g, ''));
        value = isNaN(parsed) ? null : parsed;
      }

      // Patch value into form
      this.containertypeForm.get(controlName)?.setValue(value);
      this.containertypeForm.get(controlName)?.markAsDirty();

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
    this.mps.init().subscribe();
    this.getAllCompanies()
    this.loadContainerTypes();
    this.initForm();
    this.subscribeToFormChanges();
    this.captureInitialState();
    this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));
    this.currentBranch = this.appSettingService.decrypt(localStorage.getItem('selected-branch'));
	  this.MenuMasterSid =  sessionStorage.getItem('currentMenuId');
    this.route.paramMap.subscribe(params => {
      this.ContainerTypeMasterSid = +params.get('id');
      if(this.ContainerTypeMasterSid) {
        this.isEditMode = true;
        this.loadContainerData(this.ContainerTypeMasterSid);
      }else {
        // Disable status field for create mode
        this.containertypeForm.get('status')?.disable();
        this.captureInitialState();
      }
    });

    //   this.appSettingService.getUser().subscribe(
    //   user => {
    //     if (user) {
    //       this.userData = user;
    //      
    //     }
    //   }
    // )
    const userProfile = this.appSettingService.getDecryptedUserProfile();
		if(userProfile){
			this.userData = userProfile;
     
		}
  }

   

hasAnyDropdownPermission(): boolean {
    const dropdownButtons = ['Edoc', 'Authority', 'Email', 'Document Reference'];
    return dropdownButtons.some((btn) => this.permissions?.includes(btn));
    }

  loadContainerTypes(): void {
    this.masterService.getAllContainerTypes().subscribe(
      (resp: ContainerType[]) => {
        console.log(resp, 'Container-Type');
        this.containertypes = resp['data'];
      },
      (error) => {
        this.errorMessage = error.message;
        console.error('Error loading container types:', error);
      }
    );
  }

  initForm() {
    this.containertypeForm = this.fb.group({
      // CompanyMasterSid: ['', [Validators.required]],
      ContainerCode: ['', [
        Validators.required,
        Validators.maxLength(4),
        // Add pattern validation if needed for format
      ]],
      ContainerSize: ['', [
      Validators.required 
    ]],
      ContainerIsoCode: ['', [
        Validators.required,
      ]],
      ContainerName: ['', [
        Validators.required,
        Validators.maxLength(30)
      ]],
      ContainerCategory: ['', [
        Validators.required,
        Validators.maxLength(100)
      ]],
       Length: [null],
    Width: [null],
    Height: [null],
    MaxVolume: [null],
    TareWeight: [null],
    GrossWeight: [null],
      NoOfTeu: [null, [
        Validators.required,
       
      ]],
      Remarks: [''],
      status: [{ value: 'A', disabled: false }, Validators.required],
    });
}

createNewRecord(): void {
  this.resetForm();
  this.isEditMode = false;
  this.ContainerTypeMasterSid = null;
  this.containerData = null;
  this.router.navigate(['master/container-type/entry']); 
}
navigateToaddNewContainerType() {
    this.router.navigate(['master/container-type/entry']);
  }   
resetForm(): void {
   
    this.containertypeForm.get('status')?.disable();
    this.containertypeForm.reset({
      status: 'A'
    });
    this.containertypeForm.get('status')?.disable();
  }

  onSubmit(resolve?: (saved: boolean) => void) {
  if (this.isSaving) {
    resolve?.(false);
    return;
  }

  if (this.initialFormValue && this.deepEqual(this.containertypeForm.getRawValue(), this.initialFormValue) && !this.isDirty) {
    this.appSettingService.showWarning('No changes to save');
    resolve?.(false);
    return;
  }

  if (this.containertypeForm.get('status')?.disabled) {
    this.containertypeForm.get('status')?.enable();
  }
  if (this.containertypeForm.invalid) {
    this.containertypeForm.markAllAsTouched();
    this.containertypeForm.updateValueAndValidity();
    this.appSettingService.showWarning('Please fill all required fields correctly.');
    resolve?.(false);
    return;
  } else {
    let createdBy = { createdBy: this.appSettingService.userSettingSource.value['userEmail']};
    let updatedBy = { updatedBy: this.appSettingService.userSettingSource.value['userEmail']};
    const formValue = this.containertypeForm.value;

    // Convert numeric fields from string to number
    const numericFields = ['Length', 'Width', 'Height', 'MaxVolume', 'TareWeight', 'GrossWeight', 'NoOfTeu'];
    const processedFormValue = { ...formValue };
    
    numericFields.forEach(field => {
      if (processedFormValue[field]) {
        // Convert to number, handle decimal values for TareWeight and GrossWeight
        if (field === 'TareWeight' || field === 'GrossWeight') {
          processedFormValue[field] = parseFloat(processedFormValue[field]);
        } else {
          processedFormValue[field] = parseInt(processedFormValue[field], 10);
        }
      } else {
        processedFormValue[field] = null; // Set to null if empty
      }
    });

    const payload = (this.isEditMode) ? {
      ...processedFormValue,
      ...updatedBy,
      status: processedFormValue.status === 'Active' || processedFormValue.status === 'A' ? 'A' : 'S',
    } : {
      ...processedFormValue,
      ...createdBy,
      status: processedFormValue.status === 'Active' || processedFormValue.status === 'A' ? 'A' : 'S', 
    };

    console.log('payload', payload);

    this.isSaving = true;
    if (this.isEditMode) {
      this.masterService.editContainerTypeById(this.ContainerTypeMasterSid, payload)
      .pipe(finalize(() => { this.isSaving = false; }))
      .subscribe(
        (resp: any) => {
          try {
            console.log(resp.message);
            if(resp.status) {
              this.captureInitialState();
              this.containertypeForm.markAsPristine();
              this.containertypeForm.markAsUntouched();
              this.appSettingService.showSuccess('ContainerType is successfully updated');
              this.router.navigate(['master/container-type/entry',resp.data.ContainerTypeMasterSid]);
              if (this.ContainerTypeMasterSid) {
                this.loadContainerData(this.ContainerTypeMasterSid);
              }
              resolve?.(true);
            } else {
              this.appSettingService.showError(resp.message);
              resolve?.(false);
            }
          } catch (e) {
            console.error('Post-save handling error:', e);
            resolve?.(false);
          }
        },
        (error) => {
          this.errorMessage = error.message;
          console.error('Error loading:', error);
          resolve?.(false);
        }
      );
    } else {
      this.masterService.addNewContainerType(payload)
      .pipe(finalize(() => { this.isSaving = false; }))
      .subscribe(
        (resp: any) => {
          try {
            console.log(resp);
            if (resp.status) {
              this.captureInitialState();
              this.containertypeForm.markAsPristine();
              this.containertypeForm.markAsUntouched();
              this.appSettingService.showSuccess('New ContainerType is successfully created');
              this.router.navigate(['master/container-type/entry',resp.data.ContainerTypeMasterSid]);
              this.loadContainerData(resp.data.ContainerTypeMasterSid);
              resolve?.(true);
            } else {
              this.appSettingService.showError(resp.message);
              resolve?.(false);
            }
          } catch (e) {
            console.error('Post-save handling error:', e);
            resolve?.(false);
          }
        },
        (error) => {
          this.errorMessage = error.message;
          console.error('Error loading:', error);
          resolve?.(false);
        }
      );
    }
  }
}

  // Mapping for API status to display
  statusMap: { [key: string]: string } = {
    A: 'Active',
    S: 'Suspended'
  };

  loadContainerData(id: number) {
  this.masterService.getContainerTypeById(id).subscribe(
    (data) => {
      this.containerData = data;
      console.log('API Data:', data); // Debug log
      console.log('NoOfTeu value:', data.NoOfTeu, 'Type:', typeof data.NoOfTeu); // Debug log
      
      // Convert NoOfTeu to number if needed
      const patchData = {
        ...data,
        NoOfTeu: typeof data.NoOfTeu === 'string' ? parseInt(data.NoOfTeu, 10) : data.NoOfTeu,
        status: data.status
      };
      
      console.log('Patch Data:', patchData); // Debug log
      
      this.containertypeForm.patchValue(patchData);
      this.captureInitialState();
    },
    (error) => {
      this.appSettingService.showError('Error loading container data.');
    }
  );
}

openAuditLogs() {
              if (!this.containerData?.ContainerTypeMasterSid) return;
              const modalRef = this.modalService.open(AuditLogComponent, {
                centered: true,
                scrollable: true,
                size: 'xl',
                windowClass: 'audit-log-modal'
              });
              modalRef.componentInstance.title = 'Container-type Logs';
              modalRef.componentInstance.tableName = 'ContainerTypeMaster';
              modalRef.componentInstance.recordId = this.containerData?.ContainerTypeMasterSid.toString();
              modalRef.componentInstance.screenName = 'ContainerType';
            }

  getAllCompanies() {
    this.masterService.getAllCompanies().subscribe((res: any[]) => {
      this.companyList = res;
    })
  }

  reset() {
  // If editing an existing record, reload it from server to restore original values
  if (this.isEditMode && this.ContainerTypeMasterSid) {
    this.loadContainerData(this.ContainerTypeMasterSid);
    this.captureInitialState();
    return;
  }

  // Create-mode: reset form to sensible defaults
  this.containertypeForm.reset({
    ContainerCode: '',
    ContainerSize: '',
    ContainerIsoCode: '',
    ContainerName: '',
    ContainerCategory: '',
    Length: '',
    Width: '',
    Height: '',
    MaxVolume: '',
    TareWeight: '',
    GrossWeight: '',
    NoOfTeu: '',
    Remarks: '',
    status: 'A'
  });

  // Mirror init behaviour: disable status control in create mode
  this.containertypeForm.get('status')?.disable();

  // Clear local state
  this.containerData = null;
  this.ContainerTypeMasterSid = null;

  // reset button state if you use it
  this.btnDisable = false;
  this.captureInitialState();
}


  goBack() {
    this.router.navigate(['master/container-type/list']);
  }

  showInfo() {
    if(!this.containerData) return;
    const modalRef = this.modalService.open(DetailsComponent, { size: 'lg', centered: true, backdrop: 'static' });
    modalRef.componentInstance.item = this.containerData;
    modalRef.componentInstance.idLabel = 'Container Type Id';
    modalRef.componentInstance.idValue = this.containerData?.ContainerTypeMasterSid;
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
  //         modalRef.componentInstance.DocumentSid = this.ContainerTypeMasterSid;

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
    if (!this.containerData) return;
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
    modalRef.componentInstance.documentSid = this.ContainerTypeMasterSid;
  }

openEDoc() {
  if (!this.containerData) return;
  const modalRef = this.modalService.open(EdocComponent, { 
    size: 'lg', 
    centered: true, 
    backdrop: 'static' 
  });
  modalRef.componentInstance.item = this.containerData;
  modalRef.componentInstance.idLabel = 'Container Type Id';
  modalRef.componentInstance.idValue = this.containerData?.ContainerTypeMasterSid;
  const data:any={
    CompanyMasterSid: this.currentCompany.CompanyMasterSid,
    BranchMasterSid: this.currentBranch.BranchMasterSid,
    MenuMasterSid : this.MenuMasterSid,
    DocumentSid: this.ContainerTypeMasterSid
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
    modalRef.componentInstance.DocumentSid = this.ContainerTypeMasterSid;
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
    return new Promise((resolve) => {
      this.onSubmit(resolve);
    });
  }

  private subscribeToFormChanges(): void {
    this.containertypeForm.valueChanges
      .pipe(takeUntil(this.destroy$), debounceTime(300))
      .subscribe(() => {
        this.isDirty = !this.deepEqual(
          this.initialFormValue,
          this.containertypeForm.getRawValue()
        );
      });
  }

  private captureInitialState(): void {
    this.initialFormValue = this.containertypeForm.getRawValue();
    this.isDirty = false;
  }

  private normalizeValue(value: any): any {
    if (value === null || value === undefined) return null;
    if (value instanceof Date) return value.toISOString();
    if (typeof value === 'string' && value.trim() !== '' && !isNaN(+value)) return Number(value);
    if (typeof value === 'number') return Number(value.toFixed(6));
    if (Array.isArray(value)) return value.map((v) => this.normalizeValue(v));
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

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.commonService.clearDocumentData()
  }
}

