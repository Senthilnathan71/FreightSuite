import { Component, effect, TemplateRef } from '@angular/core';
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
import { forkJoin, Subject } from 'rxjs';
import { NgbDropdownModule, NgbModal ,NgbModalRef} from '@ng-bootstrap/ng-bootstrap';
import { DetailsComponent } from 'src/app/component/details/details.component';
import { TermsAndConditionsComponent } from 'src/app/component/terms&conditions/terms&conditions.component';
import { PreventMultiClickDirective } from 'src/app/core/Directives/prevent-multi-click.directive';
import { EmailEntryComponent } from 'src/app/modules/settings/email/email-entry/email-entry.component';
import { AuthorityEntryComponent } from '../../authority/authority-entry/authority-entry.component';
import { EdocComponent } from 'src/app/modules/settings/edoc/edoc/edoc.component';
import { Port } from 'src/app/modules/crm-mobile/Interfaces/port.interface';
import { AuthorityLogComponent } from 'src/app/component/authority-log/authority-log.component';
import { DropdownStore } from 'src/app/shared/dropdown/dropdown.store';
import { DROPDOWN_CONFIGS } from 'src/app/common/lookup-config';
import { SearchableDropdown } from 'src/app/component/searchable-dropdown/searchable-dropdown.component';
import { CommonService } from 'src/app/common/common.service';
import { FollowUpComponent } from 'src/app/modules/settings/follow-up/follow-up/follow-up.component';
import { MenuPermissionService } from 'src/app/core/services/menu-permission.service';
import { City } from 'src/app/modules/crm-mobile/Interfaces/city.interface';
import { DocReferenceComponent } from 'src/app/modules/operation/doc-reference/doc-reference.component';



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
    PreventMultiClickDirective,
    NgbDropdownModule,
    SearchableDropdown
  ],
  templateUrl: './post-master-view.component.html',
  styleUrl: './post-master-view.component.scss'
})
export class PostMasterViewComponent {
  private destroy$ = new Subject<void>();
  portForm!: FormGroup;
  isEditMode = false;
  btnDisable: boolean = true;
  countryList: Country[] = [];
  stateList: State[] = [];
  cityList: City[] = [];
  filteredStateList: State[];
  filteredCityList: City[];
  regionList: any[] = [];
  portData: any;
  userData:any;
  currentCompany: any;
  currentBranch: any;
  MenuMasterSid: any;
  countryLookupConfig = DROPDOWN_CONFIGS.COUNTRY;
  stateLookupConfig = DROPDOWN_CONFIGS.STATE;
  cityLookupConfig = DROPDOWN_CONFIGS.CITY;
  zoneLookupConfig = DROPDOWN_CONFIGS.ZONE;
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
    private router: Router, private appSettingService: AppSettingsService, private masterService: MasterService, private modalService : NgbModal, public dropdownStore:DropdownStore,
  private commonService: CommonService, private ngbModal: NgbModal, public mps : MenuPermissionService,) { 
    // this.config.notFoundText = 'Custom not found';
    // this.config.appendTo = 'body';
    // this.config.bindValue = 'value';
    effect(()=> {
          const countryData = this.dropdownStore.countries();
          const stateData = this.dropdownStore.states();
          const cityData = this.dropdownStore.cities();
          const zoneData = this.dropdownStore.zone();
          this.countryList = countryData;
          this.filteredStateList = (stateData || []).map(s => ({...s,Country : s.countryMaster?.countryName}));
          this.filteredCityList =(cityData ||[]).map(c=>({...c, State : c.stateMaster?.stateName}))
          this.regionList = zoneData;
        })
  }
  ngOnInit() {
    this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));
    this.currentBranch = this.appSettingService.decrypt(localStorage.getItem('selected-branch'));
	this.MenuMasterSid =  sessionStorage.getItem('currentMenuId');
    this.initPortForm();
      this.portForm.get('PortType')?.valueChanges.subscribe(type => {
    this.setPortCodeValidation(type);
  });
  
    this.loadAllFields();
    this.mps.init().subscribe();
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
  //    
  //   }
  // });
  const userProfile = this.appSettingService.getDecryptedUserProfile();
		if(userProfile){
			this.userData = userProfile;
     
		}
    this.setPortCodeValidation(this.portForm.get('PortType')?.value);
  }

    
hasAnyDropdownPermission(): boolean {
    const dropdownButtons = ['Edoc', 'Authority', 'Email'];
    return dropdownButtons.some((btn) => this.permissions?.includes(btn));
    }

    setPortCodeValidation(portType: string) {
  const portCodeCtrl = this.portForm.get('PortCode');
  if (!portCodeCtrl) return;

  // ✅ Only required — no length validation
  portCodeCtrl.setValidators([Validators.required]);

  portCodeCtrl.updateValueAndValidity();
}


  initPortForm() {
    this.portForm = this.fb.group({
      PortName: ['', [Validators.required, Validators.maxLength(50)]],
      PortCode: ['', [Validators.required]],
      CountryMasterSid: ['', [Validators.required]],
      StateMasterSid: ['',],
      CityMasterSid: ['',],
      TimeZone: [''],
      ZoneMasterSid: [null],
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
        this.filterStateByCountry(resp.CountryMasterSid, true);
        this.filterCityByState(resp.StateMasterSid, true);
        this.portForm.patchValue({
          ...resp,
          PortCode : this.handlePortCodePatch(resp.PortCode,resp.PortType),
          CBMRequire: (resp.CBMRequire == 'Y' ? true : false),
          status: resp.status === 'A' ? 'Active' : 'Suspended'
        });
        
        console.log(this.portForm.value);
        this.setPortCodeValidation(resp.PortType?.toString());
      },
      (error) => {
        this.errorMessage = error.message;
        console.error('Error loading port:', error);
      }
    );
  }
  checkPortCodeLengthWarning() {
  const portType = this.portForm.get('PortType')?.value;
  const portCode = this.portForm.get('PortCode')?.value;

  if (!portCode) return;

  if (portType === 'Air' && portCode.length !== 3) {
    this.appSettingService.showWarning(
      'Air Port Code must be exactly 3 characters.'
    );
  }
}

  
  handlePortCodePatch(PortCode:String,PortType:String){
    if(PortType === 'Sea'){
      return PortCode
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
      // countries: this.masterService.getAllCountry(),
      // regions: this.masterService.getAllZones()
    }).subscribe(({   }) => {
      // this.countryList = countries.data,
        // this.regionList = regions
    });
    this.dropdownStore.loadCountries().subscribe(() => {
      this.dropdownStore.loadStates().subscribe();
    });
    this.dropdownStore.loadZones().subscribe();
  }

  filterStateByCountry(country, isPatch: boolean = false) {

    this.filteredStateList = [];
    this.filteredCityList = [];
    if(!isPatch && this.portForm.get('StateMasterSid').value){
      this.portForm.get('StateMasterSid').reset();
      this.portForm.get('StateMasterSid').markAsTouched();
    }
    if(!isPatch && this.portForm.get('CityMasterSid')?.value){
      this.portForm.get('CityMasterSid')?.reset();
      this.portForm.get('CityMasterSid')?.markAsTouched();
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
    if(!isPatch){
      this.portForm.get('StateMasterSid')?.reset();
    }
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

  filterCityByState(state: any, isPatch: boolean = false) {
    this.filteredCityList = [];

    if (!isPatch && this.portForm.get('CityMasterSid')?.value) {
      this.portForm.get('CityMasterSid')?.reset();
      this.portForm.get('CityMasterSid')?.markAsTouched();
    }

    let stateId: number;
    if (state instanceof Object) {
      stateId = state.StateMasterSid;
    } else {
      stateId = state;
    }

    if (!stateId) {
      return;
    }

    this.masterService.getCityByStateId(stateId).subscribe(
      (resp: any) => {
        if (resp.status) {
          this.filteredCityList = (resp.data || []).map(c => ({
            ...c,
            State: c.stateMaster?.stateName,
            Country: c.countryMaster?.countryName
          }));
        } else {
          console.error('Error Fetching City for State');
        }
      }
    );
  }


  // reset() {
  //   this.portForm.reset();
  // }

  reset(): void {
  // If editing an existing port, reload it (restore original state)
  if (this.isEditMode && this.idParam) {
    this.loadPort(this.idParam);
    return;
  }

  // Create-mode: reset form to sensible defaults
  this.portForm.reset({
    PortName: '',
    PortCode: '',
    CountryMasterSid: '',
    StateMasterSid: '',
    CityMasterSid: '',
    TimeZone: '',
    ZoneMasterSid: null,
    TerminalCode: '',
    PortType: 'Sea',
    ExportRestriction: '',
    ImportRestriction: '',
    SCMTPortCode: '',
    CBMRequire: false,
    status: 'Active',
    EdiPortCode: '',
    Remarks: ''
  });

  // Clear filtered state list
  this.filteredStateList = [];

  // Reset form validation state
  this.portForm.markAsUntouched();
  this.portForm.markAsPristine();

  // Clear port data reference
  this.portData = null;
}

  goBack() {
    history.back()
  }

  // Handle Form Submission
  onSubmit() {
      const portType = this.portForm.get('PortType')?.value;
  const portCode = this.portForm.get('PortCode')?.value?.trim();

  
  if (portType === 'Air' && portCode?.length !== 3) {
    this.appSettingService.showWarning(
      'Air Port Code must be exactly 3 characters.'
    );
    return; 
  }
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
          status: formValue.status === 'Active' || formValue.status === 'A' ? 'A' : 'S',
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
              this.appSettingService.showSuccess(resp.message);

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
              this.appSettingService.showSuccess(resp.message);

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

  // handlePortCodeSubmit(port:Port){
  //   if(port.PortType=== 'Sea'){
  //     const countryCode = (this.dropdownStore.countries().find(c => c.CountryMasterSid === port.CountryMasterSid)).countryCode;
  //     return countryCode+port.PortCode;
  //   } else {
  //     return port.PortCode;
  //   }
  // }

  handlePortCodeSubmit(port: Port) {
  if (port.PortType === 'Sea') {

    const portCode = port.PortCode?.trim();

    if (!portCode) return portCode;

    // If already full length (5) → do not add country code
    if (portCode.length === 5) {
      return portCode;
    }

    // If short length (3) → add country code prefix
    if (portCode.length === 3) {
      const country = this.dropdownStore
        .countries()
        .find(c => c.CountryMasterSid === port.CountryMasterSid);

      const countryCode = country?.countryCode || '';

      return countryCode + portCode;
    }

    // Fallback → return as entered
    return portCode;

  } else {
    // Non-Sea ports → no prefix logic
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

  // openTandC() {
	// 	this.currentMenuId = Number(sessionStorage.getItem('currentMenuId'));
	// 	const payload = { MenuMasterSid: this.currentMenuId };
	// 	this.masterService.getTandCByCondition(payload).subscribe(
	// 		(resp: any) => {
	// 			if (resp.status) {
	// 				this.TandCList = resp.data;
	// 				const modalRef = this.modalService.open(TermsAndConditionsComponent, {
	// 					size: 'lg',
	// 					backdrop: 'static',
	// 					centered: true
	// 				});
	// 				modalRef.componentInstance.terms = this.TandCList;
	// 				modalRef.componentInstance.MenuMasterSid = this.currentMenuId;
	// 				modalRef.componentInstance.DocumentSid = this.idParam;

	// 			} else {
	// 				this.appSettingService.showError('Error loading Terms and Conditions');
	// 			}
	// 		},
	// 		(error) => {
	// 			this.appSettingService.showError('Error loading Terms and Conditions', error);
	// 		}
	// 	);
	// }
  openEmail() {
    if (!this.portData) return;
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
    modalRef.componentInstance.documentSid = this.idParam;
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
  const data:any={
    CompanyMasterSid: this.currentCompany.CompanyMasterSid,
    BranchMasterSid: this.currentBranch.BranchMasterSid,
    MenuMasterSid : this.MenuMasterSid,
    DocumentSid: this.idParam
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
    modalRef.componentInstance.DocumentSid = this.idParam;
  }

 openFollowup() {
    if (!this.portData) return;
    const modalRef = this.ngbModal.open(FollowUpComponent, { size: 'lg', centered: true, backdrop: 'static' });
    modalRef.componentInstance.documentSid = this.portData?.QuoteHeaderSid;
    modalRef.componentInstance.parentEmail = this.portData.Email;
    modalRef.componentInstance.parentSubject = `Quotation No.${this.portData.QuoteNumber} Date:${new Date(this.portData.QuoteDate).toLocaleDateString()}`;
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
 OnDestroy(): void {
    this.commonService.clearDocumentData()
 }
//  openAuditLogs(modal: TemplateRef<any>) {
//   if (!this.idParam) return;

//   this.masterService.getAuditLogs('PortMaster', this.idParam.toString()).subscribe({
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
  if (!this.idParam) return;

  this.masterService.getAuditLogs(
    'PortMaster',
    this.idParam.toString()
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

ngOnDestroy(): void {
    this.dropdownStore.clearCache()
    this.destroy$.next();
    this.destroy$.complete();
  }
  navigateToCreatePort(): void {
    this.router.navigate(['master/port-master/view']);
  }
}

