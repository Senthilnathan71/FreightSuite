import { Component, TemplateRef } from '@angular/core';
import { FeatherModule } from 'angular-feather';
import { FormsModule, FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormControl } from '@angular/forms';
import { NgSelectConfig, NgSelectModule } from '@ng-select/ng-select';
import { RouterModule } from '@angular/router';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { Country } from 'src/app/modules/crm-mobile/Interfaces/country.interface';
import { State } from 'src/app/modules/crm-mobile/Interfaces/state.interface';
import { Sector } from 'src/app/modules/crm-mobile/Interfaces/sector.interface';
import { MasterService } from '../../master.service';
import { OnlyNumbersDirective } from 'src/app/core/Directives/onlyNumbersOfLength';
import { OnlyTextDirective } from 'src/app/core/Directives/onlyStringOfLength';
import { TextWithNumbersDirective } from 'src/app/core/Directives/textWithNumbers';
import { forkJoin } from 'rxjs';
import { NgbModal ,NgbModalRef} from '@ng-bootstrap/ng-bootstrap';
import { DetailsComponent } from 'src/app/component/details/details.component';
import { TermsAndConditionsComponent } from 'src/app/component/terms&conditions/terms&conditions.component';
import { PreventMultiClickDirective } from 'src/app/core/Directives/prevent-multi-click.directive';
import { EmailEntryComponent } from 'src/app/modules/settings/email/email-entry/email-entry.component';
import { AuthorityEntryComponent } from '../../authority/authority-entry/authority-entry.component';
import { EdocComponent } from 'src/app/modules/settings/edoc/edoc/edoc.component';
import { Port } from 'src/app/modules/crm-mobile/Interfaces/port.interface';



@Component({
  selector: 'app-post-master-view',
  standalone: true,
  imports: [
    FeatherModule,
    CommonModule,
    RouterModule,
    NgSelectModule,
    FormsModule,
    ReactiveFormsModule,
    OnlyNumbersDirective,
    OnlyTextDirective,
    TextWithNumbersDirective,
    DatePipe,
    PreventMultiClickDirective
  ],
  templateUrl: './post-master-view.component.html',
  styleUrl: './post-master-view.component.scss'
})
export class PostMasterViewComponent {
  portForm!: FormGroup;
  isEditMode = false;
  btnDisable: boolean = true;
  countryList: Country[] = [];
  stateList: State[] = [];
  filteredStateList: State[];
  regionList: any[] = [];
  portData: any;
  userData:any;
  permissions: string[] = [];
  currentMenuPermissions: any = {};
  modeOfStatus = [
    { name: 'Active', value: 'Active' },
    { name: 'Suspended', value: 'Suspended' },
  ]

  errorMessage: any;
  idParam: number;
  statusOptions = [
    { value: 'A', name: 'Active' },
    { value: 'S', name: 'Suspended' }
  ];
  currentMenuId: number;
  TandCList: any;
  portCodeLimit : number;
  auditLogs: any[] = []; // Stores audit logs
  auditLogModalRef!: NgbModalRef;
  constructor(private config: NgSelectConfig, private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router, private appSettingService: AppSettingsService, private masterService: MasterService, private modalService : NgbModal) {
    this.config.notFoundText = 'Custom not found';
    this.config.appendTo = 'body';
    this.config.bindValue = 'value';
  }
  ngOnInit() {
    this.initPortForm();
    this.loadAllFields();
      // Enable Save button only if form is valid
    this.portForm.statusChanges.subscribe(status => {
      this.btnDisable = status !== 'VALID';
    });
    this.route.paramMap.subscribe(params => {
      this.idParam = Number(params.get('id'));
      if (this.idParam) {
        this.isEditMode = true;
        this.loadPort(this.idParam);
      }
    })
  //   this.appSettingService.getUser().subscribe(user => {
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

  initPortForm() {
    this.portForm = this.fb.group({
      PortName: ['', [Validators.required, Validators.maxLength(50)]],
      PortCode: ['', [Validators.required, Validators.maxLength(3)]],
      CountryMasterSid: ['', [Validators.required]],
      StateMasterSid: ['',],
      TimeZone: [''],
      ZoneMasterSid: [''],
      TerminalCode: ['', [Validators.maxLength(10)]],
      PortType: ['Sea', [Validators.maxLength(10)]],
      ExportRestriction: ['', [Validators.maxLength(100)]],
      ImportRestriction: ['', [Validators.maxLength(100)]],
      SCMTPortCode: ['', [Validators.maxLength(10)]],
      CBMRequire: [false],
      status: ['Active'],
      EdiPortCode: ['', [Validators.maxLength(10)]],
      Remarks: ['', [Validators.maxLength(100)]]
    });
  }

  loadPort(PortMasterSid): void {
    this.masterService.getPortById(PortMasterSid).subscribe(
      (resp) => {
        console.log(resp, 'portdata')
        this.portData = resp;
        this.filterStateByCountry(resp.CountryMasterSid);
        this.portForm.patchValue({
          ...resp,
          PortCode : this.handlePortCodePatch(resp.PortCode,resp.PortType),
          CBMRequire: (resp.CBMRequire == 'Y' ? true : false),
          status: resp.status === 'A' ? 'Active' : 'Suspended'
        });
        console.log(this.portForm.value);
      },
      (error) => {
        this.errorMessage = error.message;
        console.error('Error loading port:', error);
      }
    );
  }
  
  handlePortCodePatch(PortCode:String,PortType:String){
    if(PortType === 'Sea'){
      return PortCode.substring(2,5)
    } else {
      return PortCode
    }
  }

  // loadCountry(): void {
  //   this.masterService.getAllCountry().subscribe(
  //     (resp: Country[]) => {
  //       console.log(resp, 'Countries')
  //       this.countries = resp['data'];
  //     },
  //     (error) => {
  //       this.errorMessage = error.message;
  //       console.error('Error loading leads:', error);
  //     }
  //   );
  // }

  // loadSector(): void {
  //   this.masterService.getAllSector().subscribe(
  //     (resp: Country[]) => {
  //       console.log(resp, 'Sectors')
  //       this.sectors = resp['data'];
  //     },
  //     (error) => {
  //       this.errorMessage = error.message;
  //       console.error('Error loading leads:', error);
  //     }
  //   );
  // }

  // loadStates(): void {

  // }

  loadAllFields() {
    forkJoin({
      countries: this.masterService.getAllCountry(),
      regions: this.masterService.getAllZones()
    }).subscribe(({ countries, regions }) => {
      this.countryList = countries.data,
        this.regionList = regions
    })
  }

  filterStateByCountry(country) {

    this.filteredStateList = [];
    if(this.portForm.get('StateMasterSid').value){
      this.portForm.get('StateMasterSid').reset();
      this.portForm.get('StateMasterSid').markAsTouched();
    }
    if(!country){
      return;
    }
    let countryId :number;
    // Ng-select Change Event Emits the whole "Object"
    if(country instanceof Object){
      countryId = country.CountryMasterSid;
    } 
    // While Patching It will be a type of Number
    else {
      countryId = country;
    }
    this.portForm.get('StateMasterSid')?.reset();
    this.masterService.getStateByCountryId(countryId).subscribe(
      (resp:any)=>{
        if(resp.status){
          this.filteredStateList = resp.data;
        } else { 
          console.error('Error Fetching State for Country')
        }
      }
    )
  }


  reset() {
    this.portForm.reset();
  }

  goBack() {
    history.back()
  }

  // Handle Form Submission
  onSubmit() {
    if (this.portForm.invalid) {
      this.portForm.markAllAsTouched(); // Force validation messages to show
      this.portForm.updateValueAndValidity(); // Ensure validation is refreshed
      this.appSettingService.showWarning('Please fill all required fields correctly.')
      return;
    } else {

      let formValue = this.portForm.value;

      let createdBy = this.appSettingService.userSettingSource.value['userEmail'];
      let updatedBy = this.appSettingService.userSettingSource.value['userEmail'];
      const payload = (this.isEditMode) ?
        {
          ...formValue,
          PortCode : this.handlePortCodeSubmit(formValue),
          status: formValue.status === 'Active' ? 'A' : 'S',
          CBMRequire: formValue.CBMRequire ? 'Y' : 'N',
          updatedBy: updatedBy
        }
        :
        {
          ...formValue,
          PortCode : this.handlePortCodeSubmit(formValue),
          status: formValue.status === 'Active' ? 'A' : 'S',
          CBMRequire: formValue.CBMRequire ? 'Y' : 'N',
          createdBy: createdBy
        }


      if (this.isEditMode) {
        this.masterService.updatePortById(this.idParam, payload).subscribe(
          (resp: any) => {

            console.log(resp);
            if (resp.status) {
              this.appSettingService.showSuccess("Port Updated Successfully");
              this.router.navigate(['master/port-master/list']);

            } else {
              this.appSettingService.showError(resp.message);
            }

          },
          (error) => {
            this.errorMessage = error.message;
            console.error('Error loading ports:', error);
          }
        );
      } else {
        this.masterService.createPort(payload).subscribe(
          (resp: any) => {

            console.log(resp);
            if (resp.status) {
              this.appSettingService.showSuccess("Port Created Successfully");
              this.router.navigate(['master/port-master/list']);

            } else {
              this.appSettingService.showError(resp.message);
            }

          },
          (error) => {
            this.errorMessage = error.message;
            console.error('Error loading ports:', error);
          }
        );
      }


    }
  }

  handlePortCodeSubmit(port:Port){
    if(port.PortType=== 'Sea'){
      const countryCode = (this.countryList.find(c => c.CountryMasterSid === port.CountryMasterSid)).countryCode;
      return countryCode+port.PortCode;
    } else {
      return port.PortCode;
    }
  }

  showInfo() {
    if(!this.portData) return;
    const modalRef = this.modalService.open(DetailsComponent, { size: 'lg', centered: true, backdrop: 'static' });
    modalRef.componentInstance.item = this.portData;
    modalRef.componentInstance.idLabel = 'Port Id';
    modalRef.componentInstance.idValue = this.portData?.PortMasterSid;
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
    if (!this.portData) return;
    const modalRef = this.modalService.open(EmailEntryComponent, {
      size: 'lg',
      centered: true,
      backdrop: 'static'
    });
  }

openAuthority() {
  if (!this.portData) return;
  const modalRef = this.modalService.open(AuthorityEntryComponent, { 
    size: 'lg', 
    centered: true, 
    backdrop: 'static' 
  });
  modalRef.componentInstance.item = this.portData;
  modalRef.componentInstance.idLabel = 'Port Id';
  modalRef.componentInstance.idValue = this.portData?.PortMasterSid;
}

openEDoc() {
  if (!this.portData) return;
  const modalRef = this.modalService.open(EdocComponent, { 
    size: 'lg', 
    centered: true, 
    backdrop: 'static' 
  });
  modalRef.componentInstance.item = this.portData;
  modalRef.componentInstance.idLabel = 'Port Id';
  modalRef.componentInstance.idValue = this.portData?.PortMasterSid;
}

 openAuditLogs(modal: TemplateRef<any>) {
  if (!this.idParam) return;

  this.masterService.getAuditLogs('PortMaster', this.idParam.toString()).subscribe({
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
