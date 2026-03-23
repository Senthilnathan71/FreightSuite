import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit, TemplateRef } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators, FormArray, AbstractControl } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { FeatherModule } from 'angular-feather';
import { NgSelectModule } from '@ng-select/ng-select';
import { NgbCalendar, NgbDateAdapter, NgbDateParserFormatter, NgbDatepickerModule, NgbDropdownModule, NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { MasterService } from '../../master.service';
import { CustomDateAdapter } from 'src/app/component/datepicker/custom-date-adapter';
import { CustomDateParserFormatter } from 'src/app/component/datepicker/custom-date-parser';
import { DetailsComponent } from 'src/app/component/details/details.component';
import { TermsAndConditionsComponent } from 'src/app/component/terms&conditions/terms&conditions.component';
import { AuthorityEntryComponent } from '../../authority/authority-entry/authority-entry.component';
import { EdocComponent } from 'src/app/modules/settings/edoc/edoc/edoc.component';
import { EmailEntryComponent } from 'src/app/modules/settings/email/email-entry/email-entry.component';
import { MultiSelectComponent } from 'src/app/component/multiselect-dropdown/multiselect-dropdown.component';
import { forkJoin } from 'rxjs';
import { AuthorityLogComponent } from 'src/app/component/authority-log/authority-log.component';
import { TextWithNumbersDirective } from 'src/app/core/Directives/textWithNumbers';
import { DecimalPrecisionDirective } from 'src/app/core/Directives/decimalWithPrecision';
import { SearchableDropdown } from 'src/app/component/searchable-dropdown/searchable-dropdown.component';
import { DROPDOWN_CONFIGS } from 'src/app/common/lookup-config';
import { CommonService } from 'src/app/common/common.service';
import { MenuPermissionService } from 'src/app/core/services/menu-permission.service';

@Component({
  selector: 'app-charge-entry',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FeatherModule,
    NgSelectModule,
    NgbDatepickerModule,
    FormsModule,
    MultiSelectComponent,
    NgbDropdownModule,
    TextWithNumbersDirective,
    DecimalPrecisionDirective,
    SearchableDropdown
  ],
  templateUrl: './charge-entry.component.html',
  styleUrls: ['./charge-entry.component.scss'],
  providers: [
    { provide: NgbDateAdapter, useClass: CustomDateAdapter },
    { provide: NgbDateParserFormatter, useClass: CustomDateParserFormatter },
    DatePipe
  ],
})
export class ChargeEntryComponent implements OnInit {
  tab = [
  { name: "Tax"},
  { name: "TDS Details"}
];
unitQtyOptions = [
  { value: 'Per Cont', name: 'Per Cont' },
  { value: 'Per CBM', name: 'Per CBM' },
  { value: 'Per BL', name: 'Per BL' },
  { value: 'ChargeableWeight', name: 'Chargeable Weight ' },
  { value: 'Per Shipment', name: 'Per Shipment' },
  { value: 'Per GrossWeight', name: 'Per Gross Weight ' }
];

selectedTab = this.tab[0].name;
  chargeForm: FormGroup;
  isEditMode = false;
  btnDisable = false;
  loading = false;
  chargeID: number;
  chargeData: any;
  userData: any;
  permissions: string[] = [];
  currentMenuPermissions: any = {};
  currentMenuId: any;
  TandCList: any;
  MenuMasterSid:any;
  
  // Lookup data
  chargeGroupOptions: any[] = [];
  currencyOptions: any[] = [];
  departmentOptions: any[] = [];
  uomOptions: any[] = [];
  hsnsacOptions: any[] = [];
  tdsOptions: any[] = [];
  selectedDepartments: any[] = [];
  today = this.calendar.getToday();

  statusOptions = [
    { id: 'A', name: 'Active' },
    { id: 'S', name: 'Suspended' }
  ];
  currentCompany: any;
  currentBranch: any;

  // GST and TDS lists
  auditLogs: any[] = [];
  auditLogModalRef!: NgbModalRef;
   HSSACLookupConfig = {
    displayFields : ['HSSACCode', 'HSSACName'],
    displayLabels : ['Code', 'Name'],
    labelFields :['HSSACCode'],
  };
  UOMLookupConfig = DROPDOWN_CONFIGS.UOM;
  CurrencyLookupConfig = {
    displayFields: ['currencyCode', 'currencyName', 'countryName'],
    displayLabels: ['Code', 'Name', 'Country'],
    labelFields: ['currencyCode'],
  };

  constructor(
    private fb: FormBuilder,
    private masterService: MasterService,
    private route: ActivatedRoute,
    private router: Router,
    private appSettingService: AppSettingsService,
    private calendar: NgbCalendar,
    private modalService: NgbModal,
    private datePipe: DatePipe,
    private commonService: CommonService,
    public mps : MenuPermissionService,
  ) {
    this.initForms();
  }

  ngOnInit(): void {
    this.mps.init().subscribe();
    this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));
    this.currentBranch = this.appSettingService.decrypt(localStorage.getItem('selected-branch'));
    this.MenuMasterSid = Number(sessionStorage.getItem('currentMenuId'));
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.chargeID = +params['id'];
        this.isEditMode = true;
        this.getChargeById(this.chargeID);
      }
    });

    const userProfile = this.appSettingService.getDecryptedUserProfile();
    if(userProfile){
      this.userData = userProfile;
      
    }

    this.loadLookupData();
  }

  initForms() {
    // Main charge form
    this.chargeForm = this.fb.group({
      chargeCode: ['', [
        Validators.required,
        
      ]],
      chargeName: ['', [
        Validators.required,
        Validators.maxLength(100)
      ]],
      UOM: ['', Validators.required],
      UnitQty: ['', Validators.required],
      ChargeGroupSid: ['', Validators.required],
      CurrencyMasterSid: ['', Validators.required],
      DepartmentMasterSid: [[], Validators.required],
      Status: [{value: 'A', disabled: !this.isEditMode}, Validators.required],
      chargeTaxMasters: this.fb.array([]),
      chargeTds: this.fb.array([])
    });
  }

  get chargeTaxMasters(): FormArray {
    return this.chargeForm.get('chargeTaxMasters') as FormArray;
  }

  get chargeTds(): FormArray {
    return this.chargeForm.get('chargeTds') as FormArray;
  }

  // GST Form Controls
  createGstFormGroup(gstData?: any): FormGroup {
    return this.fb.group({
      HSNCode: [gstData?.HSNCode || '', Validators.required],
      HSSACMasterSid: [gstData?.HSSACMasterSid || null],
      description: [gstData?.description || ''],
      TaxGroup: [gstData?.TaxGroup || '', Validators.required],
      TaxGroupSid: [gstData?.TaxGroupSid || null],
      TaxRate: [gstData?.TaxRate || '', [Validators.required, Validators.min(0), Validators.max(100)]],
      Status: [gstData?.Status || 'A', Validators.required],
      ChargeTaxMasterSid: [gstData?.ChargeTaxMasterSid || null]
    });
  }

  // TDS Form Controls
  createTdsFormGroup(tdsData?: any): FormGroup {
        let effDate = '';
  if (tdsData?.EffectiveFrom) {
    const dateObj = new Date(tdsData.EffectiveFrom);
    effDate = this.datePipe.transform(dateObj, 'dd-MMM-yyyy')?.toUpperCase() || '';
  }

  const statusVal = tdsData?.Status ?? tdsData?.status ?? 'A';
    return this.fb.group({
      TDSSet: [tdsData?.TDSSet || '' ],
      // EffectiveFrom: [(tdsData?.EffectiveFrom ? new Date(tdsData?.EffectiveFrom) : '') || '' ],
      EffectiveFrom: [effDate],
      Status: [statusVal],
      ChargeTdsSid: [tdsData?.ChargeTdsSid || null]
    });
  }

  onTdsSetChange(tdsIndex: number, tdsSetValue: any) {
  const tdsArray = this.chargeForm.get('chargeTds') as FormArray;
  const tdsControl = tdsArray.at(tdsIndex) as FormGroup;

  // Patch TDSSet
  tdsControl.patchValue({ TDSSet: tdsSetValue });

  // Auto-patch EffectiveFrom to today and make it readonly
  tdsControl.patchValue({ EffectiveFrom: new Date() });
  tdsControl.get('EffectiveFrom')?.disable(); // makes it readonly
}


  // Add new GST row
  addGstRow(gstData?: any) {
    this.chargeTaxMasters.push(this.createGstFormGroup(gstData));
  }

  // Add new TDS row
  addTdsRow(tdsData?: any) {
    this.chargeTds.push(this.createTdsFormGroup(tdsData));
  }

  // Remove GST row
  removeGstRow(index: number) {
    this.chargeTaxMasters.removeAt(index);
  }

  // Remove TDS row
  removeTdsRow(index: number) {
    this.chargeTds.removeAt(index);
  }

  

    hasAnyDropdownPermission(): boolean {
  const dropdownButtons = ['Edoc','Authority', 'Email'];
  return dropdownButtons.some((btn) => this.permissions?.includes(btn));
}
  loadLookupData() {
    const CompanyMasterSid = this.currentCompany?.CompanyMasterSid;
    forkJoin([
      this.masterService.getAllChargeGroups(CompanyMasterSid),
      this.masterService.getAllCurrencies(),
      this.masterService.getAllDepartments(CompanyMasterSid),
      this.masterService.getUOMsByType('C'), // CHANGED: Use new API
      this.masterService.getAllHssac(),
      this.masterService.getAllTds(CompanyMasterSid)
    ]).subscribe({
      next: ([chargeGroups, currencies, departments, chargeUoms, hsnsacs, tdsSets]) => {
        this.chargeGroupOptions = Array.isArray(chargeGroups) ? chargeGroups : chargeGroups.data;
       const rawCurrencies = currencies.data || currencies || [];
     
      this.currencyOptions = rawCurrencies.map((c: any) => ({
        ...c,
        countryName: c?.countryMaster?.countryName || ''  
      }));

        this.departmentOptions = departments.data || departments;
        
        // UPDATED: Use charge UOM data from new API
        this.uomOptions = chargeUoms.data || chargeUoms || [];
        
        this.hsnsacOptions = hsnsacs.data || hsnsacs;
        this.tdsOptions = tdsSets.data || tdsSets;
      },
      error: (err) => {
        console.error('Error loading lookup data:', err);
        this.appSettingService.showError('Failed to load required data');
      }
    });
  }

  getChargeById(id: number) {
  this.loading = true;
  this.masterService.getChargeById(id).subscribe({
    next: (charge: any) => {
      this.chargeData = charge;
      
      // Clear existing arrays first
      this.clearFormArrays();
      
      // Patch main charge form
      this.chargeForm.patchValue({
        chargeCode: charge.chargeCode,
        chargeName: charge.chargeName,
        UOM: charge.UOM,
        UnitQty: charge.UnitQty,
        ChargeGroupSid: charge.ChargeGroupSid,
        CurrencyMasterSid: charge.CurrencyMasterSid,
        DepartmentMasterSid: charge.DepartmentMasterSid,
        Status: charge.Status || 'A'
      });
      this.chargeForm.get('Status')?.enable();

      // Load GST data
      if (charge.chargeTaxMaster && charge.chargeTaxMaster.length > 0) {
        charge.chargeTaxMaster.forEach(gst => {
          this.addGstRow(gst);
          // Keep fields enabled for existing records
          const lastIndex = this.chargeTaxMasters.length - 1;
          const gstGroup = this.chargeTaxMasters.at(lastIndex) as FormGroup;
          gstGroup.get('TaxGroup')?.enable();
          gstGroup.get('TaxRate')?.enable();
        });
      } else {
        this.addGstRow(); // Add empty row if no GST data
      }

      // Load TDS data
      if (charge.chargeTds && charge.chargeTds.length > 0) {
        charge.chargeTds.forEach(tds => {
          this.addTdsRow(tds);
          const lastIndex = this.chargeTds.length - 1;
          const tdsGroup = this.chargeTds.at(lastIndex) as FormGroup;
          tdsGroup.get('EffectiveFrom')?.enable();
        });
      } else {
        this.addTdsRow(); // Add empty row if no TDS data
      }

      this.loading = false;
    },
    error: (err) => {
      console.error('Error loading charge:', err);
      this.loading = false;
      this.appSettingService.showError('Failed to load charge data');
    }
  });
}

validateUOMDepartmentCompatibility(): boolean {
  const selectedUOMId = this.chargeForm.get('UOM')?.value;
  console.log('UOM:',selectedUOMId);
    const selectedUOM = this.uomOptions.find(uom => uom.UOMMasterSid === selectedUOMId)?.UOMCode;
  console.log('UOM Code:', selectedUOM);
  const selectedDepartmentIds = this.chargeForm.get('DepartmentMasterSid')?.value;
  console.log('Departments:',selectedDepartmentIds);
  if (!selectedUOM || !selectedDepartmentIds || selectedDepartmentIds.length === 0) {
    return true; // No validation needed if either field is empty
  }

  // Get department objects from selected IDs
  const selectedDepartments = this.departmentOptions
    .filter(dept => selectedDepartmentIds.includes(dept.departmentName));
    console.log('Selected Departments:', selectedDepartments);
  // Check for FCL departments (both Export and Import)
  const hasFCLExport = selectedDepartments.some(dept => 
    dept.FCLLCL === 'FCL' && dept.ExportImport === 'Export'
  );
  console.log('hasFCLexp:',hasFCLExport)
  const hasFCLImport = selectedDepartments.some(dept => 
    dept.FCLLCL === 'FCL' && dept.ExportImport === 'Import'
  );
  console.log('hasFCLimp:',hasFCLImport)
  const hasFCL = hasFCLExport || hasFCLImport;
  console.log('fcl',hasFCL)
  // Check for LCL departments (both Export and Import)
  const hasLCLExport = selectedDepartments.some(dept => 
    dept.FCLLCL === 'LCL' && dept.ExportImport === 'Export'
  );
  console.log('lclexp',hasLCLExport)
  const hasLCLImport = selectedDepartments.some(dept => 
    dept.FCLLCL === 'LCL' && dept.ExportImport === 'Import'
  );
  console.log('lclimp',hasLCLImport)
  const hasLCL = hasLCLExport || hasLCLImport;


  // Validation 1: FCL department (both Export and Import) cannot have CBM UOM
  if (hasFCL && selectedUOM === 'CBM') {
    this.appSettingService.showError('CBM is not applicable for FCL');
    this.chargeForm.get('UOM')?.setErrors({ invalidCombination: true });
    return false;
  }

  // Validation 2: LCL department (both Export and Import) cannot have CON UOM
  if (hasLCL && selectedUOM === 'CON') {
    this.appSettingService.showError('CON is not applicable for LCL');
    this.chargeForm.get('UOM')?.setErrors({ invalidCombination: true });
    return false;
  }

  // Clear any previous errors if validation passes
  if (this.chargeForm.get('UOM')?.errors?.['invalidCombination']) {
    this.chargeForm.get('UOM')?.setErrors(null);
  }
  return true;
}

// Call this method when UOM changes
onUOMChange() {
  this.validateUOMDepartmentCompatibility();
}


  onSubmit() {
      if (!this.validateUOMDepartmentCompatibility()) {
    return;
  }
    if (this.chargeForm.invalid) {
        this.markFormGroupTouched(this.chargeForm);
        return;
    }

    // Check if at least one GST record exists
    if (this.chargeTaxMasters.controls.length === 0) {
        this.appSettingService.showError('Please add at least one GST record before saving');
        return;
    }

    // // Check if at least one TDS record exists when GST exists
    // if (this.chargeTaxMasters.controls.length > 0 && this.chargeTds.controls.length === 0) {
    //     this.appSettingService.showError('Please add at least one TDS record before saving');
    //     return;
    // }

    this.btnDisable = true;
    this.loading = true;

    const currentUserEmail = this.appSettingService.userSettingSource.value['userEmail'];
    const statusValue = this.chargeForm.get('Status')?.value ?? 'A';
    
    const payload = {
      CompanyMasterSid : this.currentCompany?.CompanyMasterSid,
        chargeCode: this.chargeForm.value.chargeCode,
        chargeName: this.chargeForm.value.chargeName,
        UOM: this.chargeForm.value.UOM,
         UnitQty: this.chargeForm.value.UnitQty,
        ChargeGroupSid: this.chargeForm.value.ChargeGroupSid,
        CurrencyMasterSid: this.chargeForm.value.CurrencyMasterSid,
        DepartmentMasterSid: this.chargeForm.value.DepartmentMasterSid,
        Status: statusValue,
        chargeTaxMaster: this.chargeTaxMasters.getRawValue().map(gst => ({
    HSNCode: gst.HSNCode,
    HSSACMasterSid: gst.HSSACMasterSid,
    EffectiveFrom:gst.EffectiveFrom,
    description: gst.description,
    TaxGroup: gst.TaxGroup,
    TaxGroupSid: gst.TaxGroupSid,
    TaxRate: gst.TaxRate,
    Status: gst.Status,
    ...(gst.ChargeTaxMasterSid ? { ChargeTaxMasterSid: gst.ChargeTaxMasterSid } : {})
})),
        chargeTds: this.chargeTds.getRawValue().map(tds => ({
  TDSSet: tds.TDSSet,
  EffectiveFrom: tds.EffectiveFrom,
  Status: tds.Status,
  ...(tds.ChargeTdsSid ? { ChargeTdsSid: tds.ChargeTdsSid } : {})
})),

        ...(this.isEditMode ? 
            { updatedBy: currentUserEmail } : 
            { createdBy: currentUserEmail })
    };

    const operation = this.isEditMode 
        ? this.masterService.updateChargeById(this.chargeID, payload)
        : this.masterService.createCharge(payload);

    operation.subscribe({
        next: (resp) => {
            this.loading = false;
            this.btnDisable = false;
            if (resp.status) {
                this.appSettingService.showSuccess(resp.message);
            } else {
                this.appSettingService.showError(resp.message);
            }

            if (!this.isEditMode && resp.data?.charge?.ChargeMasterSid) {
                this.router.navigate(['/master/charge/entry', resp.data.charge.ChargeMasterSid]);
            }
        },
        error: (err) => {
            console.error(err);
            this.loading = false;
            this.btnDisable = false;
            
            if (err.status === 400) {
                // Handle duplicate errors
                if (err.error.message.includes('Charge name')) {
                    this.chargeForm.get('chargeName').setErrors({ duplicate: true });
                    this.appSettingService.showError(err.error.message);
                } else if (err.error.message.includes('Charge code')) {
                    this.chargeForm.get('chargeCode').setErrors({ duplicate: true });
                    this.appSettingService.showError(err.error.message);
                } else {
                    this.appSettingService.showError(err.error.message || 'Failed to process charge');
                }
            } else {
                this.appSettingService.showError('Failed to process charge. Please try again.');
            }
        }
    });
  }

  // openAuditLogs(modal: any) {
  //   if (!this.chargeData?.ChargeMasterSid) return;

  //   this.masterService.getAuditLogsCharge('ChargeMaster', this.chargeData?.ChargeMasterSid.toString()).subscribe({
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
    if (!this.chargeData?.ChargeMasterSid) return;
  
    this.masterService.getAuditLogsCharge(
      'ChargeMaster',
      this.chargeData?.ChargeMasterSid.toString()
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

  isChargeFormValid(): boolean {
      return this.chargeForm.valid;
  }

  canSaveCharge(): boolean {
      if (this.chargeForm.invalid) return false;
      
      // Must have at least one GST record
      if (this.chargeTaxMasters.controls.length === 0) return false;
      
      
      
      return true;
  }

  resetForm() {
    if (this.isEditMode) {
      this.clearFormArrays();
      this.getChargeById(this.chargeID);
    } else {
      this.clearFormArrays();
      this.chargeForm.reset({
        chargeCode: '',
        chargeName: '',
        UOM: null,
         UnitQty: null,
        ChargeGroupSid: null,
        CurrencyMasterSid: null,
        DepartmentMasterSid: [],
        Status: 'A'
      });
      this.chargeForm.get('Status')?.disable();
      this.selectedDepartments = [];
      
      // Add empty rows for GST and TDS
      this.addGstRow();
      this.addTdsRow();
    }
  }

  clearFormArrays() {
    while (this.chargeTaxMasters.length !== 0) {
      this.chargeTaxMasters.removeAt(0);
    }
    
    while (this.chargeTds.length !== 0) {
      this.chargeTds.removeAt(0);
    }
  }

  goBack() {
    this.router.navigate(['master/charge/list']);
  }

  private markFormGroupTouched(formGroup: FormGroup) {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      } else if (control instanceof FormArray) {
        control.controls.forEach(arrayControl => {
          this.markFormGroupTouched(arrayControl as FormGroup);
        });
      }
    });
  }

  showInfo() {
    if (!this.chargeData) return;
    const modalRef = this.modalService.open(DetailsComponent, { size: 'lg', centered: true, backdrop: 'static' });
    modalRef.componentInstance.item = this.chargeData;
    modalRef.componentInstance.idLabel = 'Charge Id';
    modalRef.componentInstance.idValue = this.chargeData?.ChargeMasterSid;
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
  //         modalRef.componentInstance.DocumentSid = this.chargeID;
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
    if (!this.chargeData) return;
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
    modalRef.componentInstance.documentSid = this.chargeID;
  }
  
  openEDoc() {
    if (!this.chargeData) return;
    const modalRef = this.modalService.open(EdocComponent, { 
      size: 'lg', 
      centered: true, 
      backdrop: 'static' 
    });
    modalRef.componentInstance.item = this.chargeData;
    modalRef.componentInstance.idLabel = 'Charge Id';
    modalRef.componentInstance.idValue = this.chargeData?.ChargeMasterSid;
    const data:any={
    CompanyMasterSid: this.currentCompany.CompanyMasterSid,
    BranchMasterSid: this.currentBranch.BranchMasterSid,
    MenuMasterSid : this.MenuMasterSid,
    DocumentSid: this.chargeID
  }

      this.commonService.documentData.set(data)
  }
  ngOnDestroy(): void {
    this.commonService.clearDocumentData()
 }

  onDepartmentChange(selectedNames?: string[]) {
    this.selectedDepartments = selectedNames;

    const selectedIds = this.departmentOptions
      .filter(dept => selectedNames.includes(dept.departmentName))
      .map(dept => dept.DepartmentMasterSid);

    this.chargeForm.get('DepartmentMasterSid')?.setValue(selectedIds);
    this.validateUOMDepartmentCompatibility();
  }

  onHsnsacSelect(event: any, index: number) {
  if (event) {
    console.log('event')
    const selectedHsnsac = this.hsnsacOptions.find(item => item.HSSACCode === event.HSSACCode);
    if (selectedHsnsac) {
      const gstGroup = this.chargeTaxMasters.at(index) as FormGroup;
      gstGroup.patchValue({
        HSNCode: selectedHsnsac.HSSACCode,
        HSSACMasterSid: selectedHsnsac.HSSACMasterSid,
        TaxGroupSid: selectedHsnsac.TaxGroupSid,
        TaxGroup: selectedHsnsac.TaxType,    
        TaxRate: selectedHsnsac.TaxRate,     
        description: selectedHsnsac.HSNSACDescription || selectedHsnsac.ServiceName
      });
      
      // Disable the fields since they're auto-populated
      gstGroup.get('TaxGroup')?.disable();
      gstGroup.get('TaxRate')?.disable();
    }
  }
}
enableGstFields(index: number) {
  const gstGroup = this.chargeTaxMasters.at(index) as FormGroup;
  gstGroup.get('TaxGroup')?.enable();
  gstGroup.get('TaxRate')?.enable();
}

onTdsSelect(event: any, index: number) {
  if (event) {
    console.log('event')
    const selectedTds = this.tdsOptions.find(item => item.TDSSetHeaderSid === event.TDSSetHeaderSid);
    if (selectedTds) {
      const tdsGroup = this.chargeTds.at(index) as FormGroup;
            const formattedDate = selectedTds.EffectiveFrom 
        ? this.datePipe.transform(new Date(selectedTds.EffectiveFrom), 'dd-MMM-yyyy')?.toUpperCase() 
        : '';
      
        tdsGroup.patchValue({ EffectiveFrom: formattedDate });
      
      // Disable the fields since they're auto-populated
      tdsGroup.get('EffectiveFrom')?.disable();
    }
  }
}

enableTdsFields(index: number) {
  const tdsGroup = this.chargeTds.at(index) as FormGroup;
  tdsGroup.get('EffectiveFrom')?.enable();
}

  getTdsSetName(tdsSetId: number): string {
    const tdsSet = this.tdsOptions.find(item => item.TDSSetHeaderSid === tdsSetId);
    return tdsSet ? tdsSet.TDSSetName : '';
  }
  selectTab(tab: string) {
  this.selectedTab = tab;
}
// convert various date inputs (string / Date) -> NgbDateStruct
private toNgbDateStruct(value: any): { year: number; month: number; day: number } | null {
  if (!value) return null;
  const d = (value instanceof Date) ? value : new Date(value);
  if (isNaN(d.getTime())) return null;
  return { year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate() };
}

// convert NgbDateStruct -> ISO string (yyyy-mm-ddT00:00:00.000Z)
// returns null when no valid value
private fromNgbDateStructToIso(n: any): string | null {
  if (!n || !n.year || !n.month || !n.day) return null;
  const dt = new Date(n.year, n.month - 1, n.day);
  return dt.toISOString();
}
navigateToCreateCharge() {
    this.router.navigate(['master/charge/entry']);
  }
}