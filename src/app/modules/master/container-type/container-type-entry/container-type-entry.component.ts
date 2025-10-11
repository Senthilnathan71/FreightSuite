import { CommonModule, DatePipe } from '@angular/common';
import { Component, NgZone, OnInit, TemplateRef } from '@angular/core';
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
  ],
  templateUrl: './container-type-entry.component.html',
  styleUrl: './container-type-entry.component.scss'
})
export class ContainerTypeEntryComponent {

  containertypeForm!: FormGroup;
  isEditMode = false;
  containertypes: ContainerType[] = [];
  errorMessage: string = '';
  btnDisable: boolean = false;
  ContainerTypeMasterSid: number;
  containerData : any;
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

  constructor(
    private fb: FormBuilder,
    private masterService: MasterService,
    private appSettingService: AppSettingsService,
    private route: ActivatedRoute,
    private router: Router,
    private modalService : NgbModal,
    private ngZone: NgZone
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
    this.getAllCompanies()
    this.loadContainerTypes();
    this.initForm();

    this.route.paramMap.subscribe(params => {
      this.ContainerTypeMasterSid = +params.get('id');
      if(this.ContainerTypeMasterSid) {
        this.isEditMode = true;
        this.loadContainerData(this.ContainerTypeMasterSid);
      }else {
        // Disable status field for create mode
        this.containertypeForm.get('status')?.disable();
      }
    });

    //   this.appSettingService.getUser().subscribe(
    //   user => {
    //     if (user) {
    //       this.userData = user;
    //       this.checkPermissions();
    //     }
    //   }
    // )
    const userProfile = this.appSettingService.getDecryptedUserProfile();
		if(userProfile){
			this.userData = userProfile;
      this.checkPermissions();
		}
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

hasAnyDropdownPermission(): boolean {
    const dropdownButtons = ['Edoc', 'Terms and Condition', 'Authority', 'Email'];
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
      Length: [''],
      Width: [''],
      Height: [''],
      MaxVolume: [''],
      TareWeight: [''],
      GrossWeight: [''],
      NoOfTeu: ['', [
        Validators.required,
       
      ]],
      Remarks: [''],
      status: [{ value: 'A', disabled: false }, Validators.required],
    });
}

resetForm(): void {
   
    this.containertypeForm.get('status')?.disable();
    this.containertypeForm.reset({
      status: 'A'
    });
    this.containertypeForm.get('status')?.disable();
  }

  onSubmit() {
    if (this.containertypeForm.get('status')?.disabled) {
      this.containertypeForm.get('status')?.enable();
    }
    if (this.containertypeForm.invalid) {
      this.containertypeForm.markAllAsTouched();
      this.containertypeForm.updateValueAndValidity();
      this.appSettingService.showWarning('Please fill all required fields correctly.');
      return;
    } else {
      let createdBy = { createdBy: this.appSettingService.userSettingSource.value['userEmail']};
      let updatedBy = { updatedBy: this.appSettingService.userSettingSource.value['userEmail']};
      const formValue = this.containertypeForm.value;

      const payload = (this.isEditMode) ? {
        ...formValue,
        // CompanyMasterSid: Number(formValue.CompanyMasterSid),
        ...updatedBy,
        status: formValue.status === 'Active' || formValue.status === 'A' ? 'A' : 'S',
      } : {
        ...formValue,
        // CompanyMasterSid: Number(formValue.CompanyMasterSid),
        ...createdBy,
        status: formValue.status === 'Active' || formValue.status === 'A' ? 'A' : 'S', 
      };

      console.log('payload', payload);

      if (this.isEditMode) {
        this.masterService.editContainerTypeById(this.ContainerTypeMasterSid, payload).subscribe(
          (resp: any) => {
            console.log(resp.message);
            if(resp.status) {
              this.appSettingService.showSuccess(resp.message);
              this.router.navigate(['master/container-type/entry',resp.data.ContainerTypeMasterSid]);
              if (this.ContainerTypeMasterSid) {
            this.loadContainerData(this.ContainerTypeMasterSid);
          }
            } else {
              this.appSettingService.showError(resp.message);
            }
          },
          (error) => {
            this.errorMessage = error.message;
            console.error('Error loading:', error);
          }
        );
      } else {
        this.masterService.addNewContainerType(payload).subscribe(
          (resp: any) => {
            console.log(resp);
            if (resp.status) {
              
              this.loadContainerData(resp.data.ContainerTypeMasterSid);
              this.appSettingService.showSuccess(resp.message);
              this.router.navigate(['master/container-type/entry',resp.data.ContainerTypeMasterSid]);
            } else {
              this.appSettingService.showError(resp.message);
            }
          },
          (error) => {
            this.errorMessage = error.message;
            console.error('Error loading:', error);
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
    },
    (error) => {
      this.appSettingService.showError('Error loading container data.');
    }
  );
}
//   openAuditLogs(modal: TemplateRef<any>) {
//   if (!this.ContainerTypeMasterSid) return;

//   this.masterService.getAuditLogsContainerType('ContainerTypeMaster', this.ContainerTypeMasterSid.toString()).subscribe({
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
  if (!this.ContainerTypeMasterSid) return;

  this.masterService.getAuditLogsContainerType(
    'ContainerTypeMaster',
    this.ContainerTypeMasterSid.toString()
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

  getAllCompanies() {
    this.masterService.getAllCompanies().subscribe((res: any[]) => {
      this.companyList = res;
    })
  }

  reset() {
  // If editing an existing record, reload it from server to restore original values
  if (this.isEditMode && this.ContainerTypeMasterSid) {
    this.loadContainerData(this.ContainerTypeMasterSid);
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
          modalRef.componentInstance.DocumentSid = this.ContainerTypeMasterSid;

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
    if (!this.containerData) return;
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
}


}
