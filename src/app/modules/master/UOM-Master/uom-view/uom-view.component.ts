import { CommonModule, DatePipe } from '@angular/common';
import { Component, TemplateRef } from '@angular/core';
import { FeatherModule } from 'angular-feather';
import { FormsModule, FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormControl } from '@angular/forms';
import { NgSelectConfig, NgSelectModule } from '@ng-select/ng-select';
import { RouterModule } from '@angular/router';
import { ActivatedRoute, Router } from '@angular/router';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { MasterService } from '../../master.service';
import { NgbDropdownModule, NgbModal,NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { DetailsComponent } from 'src/app/component/details/details.component';
import { PreventMultiClickDirective } from 'src/app/core/Directives/prevent-multi-click.directive';
import { TermsAndConditionsComponent } from 'src/app/component/terms&conditions/terms&conditions.component';
import { EmailEntryComponent } from 'src/app/modules/settings/email/email-entry/email-entry.component';
import { AuthorityEntryComponent } from '../../authority/authority-entry/authority-entry.component';
import { EdocComponent } from 'src/app/modules/settings/edoc/edoc/edoc.component';
import { AuthorityLogComponent } from 'src/app/component/authority-log/authority-log.component';

@Component({
  selector: 'app-uom-view',
  standalone: true,
  imports: [
    FeatherModule,
    CommonModule,
    RouterModule,
    NgSelectModule,
    FormsModule,
    ReactiveFormsModule,
    DatePipe,
    PreventMultiClickDirective,
    NgbDropdownModule
  ],
  templateUrl: './uom-view.component.html',
  styleUrl: './uom-view.component.scss'
})
export class UOMViewComponent {
  uomForm!: FormGroup;
  isEditMode = false;
  selectedShipmentType: number;
  btnDisable: boolean = true;
  uomData: any;
  permissions: string[] = [];
  currentMenuPermissions: any = {};
  userData:any;
  auditLogs: any[] = []; // Stores audit logs
  auditLogModalRef!: NgbModalRef;
  shipmenttypes = [
    { id: 'FCL', name: 'FCL' },
    { id: 'LCL', name: 'LCL' },
    { id: 'Air', name: 'Air' },
    { id: 'All', name: 'All' },
  ];

  modeofUOMtype=[
    {id:1,name:"P"},
    {id:2,name:"C"}
  ]
  errorMessage: any;
  idParam: number;
  statusMap: { [key: string]: string } = {
  A: 'Active',
  S: 'Suspended'
};
uomTypes = [
  { id: 'pack', name: 'Pack' },
  { id: 'charge', name: 'Charge' }
];

statusOptions = [
  { id: 'A', name: 'Active' },
  { id: 'S', name: 'Suspended' }
];
  currentMenuId: number;
  TandCList: any;

  constructor(private config: NgSelectConfig, private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router, private appSettingService: AppSettingsService, private masterService: MasterService,private modalService:NgbModal) {
    this.config.notFoundText = 'Custom not found';
    this.config.appendTo = 'body';
    this.config.bindValue = 'value';
  }

  ngOnInit() {
    this.uomForm = new FormGroup({
      UOMName: new FormControl('', [Validators.required, Validators.maxLength(20)]),
      UOMCode: new FormControl('', [Validators.required, Validators.maxLength(3)]),
      UOMType: new FormControl('', [Validators.required]),
      DimensionReq: new FormControl('', []),
      WeightReq: new FormControl(null, []),
      VolumeReq: new FormControl('', []),
      ShipmentType: new FormControl(null, [Validators.required]),
      status: new FormControl({value: 'A', disabled: !this.isEditMode}, [Validators.required]),
      Remarks: new FormControl('', [Validators.maxLength(300)])
    });

      //Dynamically disable/enable Save button based on form validity
  this.uomForm.statusChanges.subscribe(status => {
    this.btnDisable = status !== 'VALID';
  });

    
  // Enable status control when in edit mode
  if (this.isEditMode) {
    this.uomForm.get('status')?.enable();
  }

  this.route.paramMap.subscribe(params => {
    this.idParam = Number(params.get('id'));
    if (this.idParam) {
      this.isEditMode = true;
      this.loadUom(this.idParam);
      // Enable status control when in edit mode
      this.uomForm.get('status')?.enable();
    }
  });

    // this.appSettingService.getUser().subscribe((user) => {
    //   if (user) {
    //     this.userData = user;
    //     this.checkPermissions();
    //   }
    // });
     const userProfile = this.appSettingService.getDecryptedUserProfile();
		if(userProfile){
			this.userData = userProfile;
      this.checkPermissions();
		}
}



  checkPermissions() {
    const currentMenuId = Number(localStorage.getItem('currentMenuId'));
    const userRole = this.userData?.userRoleMaster[0]?.RoleMasterSid;
    console.log(currentMenuId);
    console.log(userRole);
    if (currentMenuId && userRole) {
      this.masterService
        .getRoleMenuPermissions(currentMenuId, userRole)
        .subscribe({
          next: (response) => {
            this.currentMenuPermissions = response.data.MenuPermissions || {};
            this.permissions = Object.keys(this.currentMenuPermissions).filter(
              (key) => this.currentMenuPermissions[key] === 'isTrue'
            );
            console.log(this.permissions);
          },
        });
    }
  }

  hasPermission(permission: string): boolean {
    return this.permissions.includes(permission);
  }

  loadUom(UomMasterSid): void {
  this.masterService.getUomById(UomMasterSid).subscribe(
    (resp) => {
      console.log(resp, 'uomdata')
      this.uomData = resp;
      this.uomForm.patchValue(resp);
      this.uomForm.patchValue({ 
        WeightReq: (resp.WeightReq == 'Y' ? true : false),
        DimensionReq: (resp.DimensionReq == 'Y' ? true : false),
        VolumeReq: (resp.VolumeReq == 'Y' ? true : false),
        status: resp.status || 'A',
        UOMType: resp.UOMType
      });
      // Enable status control when in edit mode
      this.uomForm.get('status')?.enable();
    },
    (error) => {
      this.errorMessage = error.message;
      console.error('Error loading port:', error);
    }
  );
}

  // reset() {
  //   this.uomForm.reset();
  // }

  reset() {
  // If editing an existing UOM, reload it (restore original state)
  if (this.isEditMode && this.idParam) {
    this.loadUom(this.idParam);
    return;
  }

  // Create-mode: reset form to sensible defaults
  this.uomForm.reset({
    UOMName: '',
    UOMCode: '',
    UOMType: '',
    DimensionReq: false,  // Changed from '' to false
    WeightReq: false,     // Changed from null to false
    VolumeReq: false,     // Changed from '' to false
    ShipmentType: null,
    status: 'A',
    Remarks: ''
  });

  // Disable status field for new records
  this.uomForm.get('status')?.disable();

  // Clear error message
  this.errorMessage = '';

  // Reset any additional state variables if needed
  this.uomData = null;
}

  goBack() {
    history.back()
  }

  // Handle Form Submission
  onSubmit() {
    if (this.uomForm.invalid) {
      this.uomForm.markAllAsTouched(); // Force validation messages to show
      this.uomForm.updateValueAndValidity(); // Ensure validation is refreshed
      this.appSettingService.showWarning('Please fill all required fields correctly.')
      return;
    } else {
      let createdBy = { createdBy: this.appSettingService.userSettingSource.value['userEmail'] };
      let updatedBy = { updatedBy: this.appSettingService.userSettingSource.value['userEmail'] };
       const payload = (this.isEditMode) ? { 
      ...this.uomForm.value, 
      ...updatedBy,
      status: this.uomForm.value.status || 'A' // Include status in payload
    } : { 
      ...this.uomForm.value, 
      ...createdBy,
      status: 'A' // Default to Active for new records
    };

    payload.DimensionReq = (this.uomForm.value.DimensionReq) ? 'Y' : 'N';
    payload.WeightReq = (this.uomForm.value.WeightReq) ? 'Y' : 'N';
    payload.VolumeReq = (this.uomForm.value.VolumeReq) ? 'Y' : 'N';
    console.log('payload', payload);

      if (this.isEditMode) {
        this.masterService.updateUomById(this.idParam, payload).subscribe(
          (resp: any) => {

            console.log(resp.message);
            if (resp.status) {
              this.appSettingService.showSuccess(resp.message);
              this.router.navigate(['master/uom-master/list']);

            } else {
              this.appSettingService.showError(resp.message);
            }

          },
          (error) => {
            this.errorMessage = error.message;
            console.error('Error loading uom:', error);
          }
        );
      } else {
        this.masterService.createUom(payload).subscribe(
          (resp: any) => {

            console.log(resp);
            if (resp.status) {
              this.appSettingService.showSuccess(resp.message);
              this.router.navigate(['master/uom-master/list']);

            } else {
              this.appSettingService.showError(resp.message);
            }

          },
          (error) => {
            this.errorMessage = error.message;
            console.error('Error loading uom:', error);
          }
        );
      }
    }
  }
  showInfo() {
      if(!this.uomData) return;
      const modalRef = this.modalService.open(DetailsComponent, { size: 'lg', centered: true, backdrop: 'static' });
      modalRef.componentInstance.item = this.uomData;
      modalRef.componentInstance.idLabel = 'UOM Id';
      modalRef.componentInstance.idValue = this.uomData?.UOMMasterSid;
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
					modalRef.componentInstance.DocumentSid = this.idParam;

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
  if (!this.uomData) return;
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
    modalRef.componentInstance.documentSid = this.idParam;
  }

openEDoc() {
  if (!this.uomData) return;
  const modalRef = this.modalService.open(EdocComponent, { 
    size: 'lg', 
    centered: true, 
    backdrop: 'static' 
  });
  modalRef.componentInstance.item = this.uomData;
  modalRef.componentInstance.idLabel = 'UOM Id';
  modalRef.componentInstance.idValue = this.uomData?.UOMMasterSid;
}

 openAuditLogs(modal: TemplateRef<any>) {
  if (!this.idParam) return;

  this.masterService.getAuditLogs('UOMMaster', this.idParam.toString()).subscribe({
    next: (logs: any[]) => {
      const formatFields = (val: any) => {
        if (!val) return ['NA'];
        const obj = typeof val === 'string' ? JSON.parse(val) : val;
        delete obj.updatedOn; // Remove updatedOn field
        // If no fields exist after deleting updatedOn
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
