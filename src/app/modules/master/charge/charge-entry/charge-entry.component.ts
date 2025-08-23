import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit, TemplateRef } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators, FormArray } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { FeatherModule } from 'angular-feather';
import { NgSelectModule } from '@ng-select/ng-select';
import { NgbCalendar, NgbDateAdapter, NgbDateParserFormatter, NgbDatepickerModule, NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
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

@Component({
  selector: 'app-charge-entry',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FeatherModule,
    NgSelectModule,
    NgbDatepickerModule,
    DatePipe,
    FormsModule,
    MultiSelectComponent
  ],
  templateUrl: './charge-entry.component.html',
  styleUrls: ['./charge-entry.component.scss'],
  providers: [
    { provide: NgbDateAdapter, useClass: CustomDateAdapter },
    { provide: NgbDateParserFormatter, useClass: CustomDateParserFormatter },
  ],
})
export class ChargeEntryComponent implements OnInit {
  chargeForm: FormGroup;
  gstForm: FormGroup;
  tdsForm: FormGroup;
  
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
  
  // Modal references
  gstModalRef: NgbModalRef;
  tdsModalRef: NgbModalRef;
  
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
  gstList: any[] = [];
  tdsList: any[] = [];
  currentGstIndex: number;
  currentTdsIndex: number;
  isGstEditMode = false;
  isTdsEditMode = false;
   auditLogs: any[] = []; // Stores audit logs
  auditLogModalRef!: NgbModalRef;
  constructor(
    private fb: FormBuilder,
    private masterService: MasterService,
    private route: ActivatedRoute,
    private router: Router,
    private appSettingService: AppSettingsService,
    private calendar: NgbCalendar,
    private modalService: NgbModal
  ) {
    this.initForms();
  }

  ngOnInit(): void {
    this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));
       this.currentBranch = this.appSettingService.decrypt(localStorage.getItem('selected-branch'));
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.chargeID = +params['id'];
        this.isEditMode = true;
        this.getChargeById(this.chargeID);
      }
    });

    // this.appSettingService.getUser().subscribe(
    //   user => {
    //     if (user) {
    //       this.userData = user;
    //       this.checkPermissions();
    //     }
    //   }
    // );
    const userProfile = this.appSettingService.getDecryptedUserProfile();
		if(userProfile){
			this.userData = userProfile;
      this.checkPermissions();
		}

    this.loadLookupData();
  }

  initForms() {
    // Main charge form
    this.chargeForm = this.fb.group({
      chargeCode: ['', [
        Validators.required,
        Validators.maxLength(5),
        Validators.pattern(/^[A-Z0-9]+$/)
      ]],
      chargeName: ['', [
        Validators.required,
        Validators.maxLength(100)
      ]],
      UOM: ['', Validators.required],
      ChargeGroupSid: ['', Validators.required],
      CurrencyMasterSid: ['', Validators.required],
      DepartmentMasterSid: [[], Validators.required],
      Status: [{value: 'A', disabled: !this.isEditMode}, Validators.required],
      chargeTaxMasters: this.fb.array([]),
      chargeTds: this.fb.array([])
    });

    // GST form
    this.gstForm = this.fb.group({
      HSNCode: ['', Validators.required],
      description: [''],
      TaxGroup: ['', Validators.required],
      TaxRate: ['', [Validators.required, Validators.min(0), Validators.max(100)]],
      Status: ['A', Validators.required]
    });

    // TDS form
    this.tdsForm = this.fb.group({
      TDSSet: ['', Validators.required],
      EffectiveFrom: ['', Validators.required],
      Status: ['A', Validators.required]
    });
  }

  get chargeTaxMasters(): FormArray {
    return this.chargeForm.get('chargeTaxMasters') as FormArray;
  }

  get chargeTds(): FormArray {
    return this.chargeForm.get('chargeTds') as FormArray;
  }

  checkPermissions() {
    const currentMenuId = Number(localStorage.getItem('currentMenuId'));
    const userRole = this.userData?.userRoleMaster[0]?.RoleMasterSid;
    if (currentMenuId && userRole) {
      this.masterService.getRoleMenuPermissions(currentMenuId, userRole).subscribe({
        next: (response) => {
          this.currentMenuPermissions = response.data.MenuPermissions || {};
          this.permissions = Object.keys(this.currentMenuPermissions)
            .filter(key => this.currentMenuPermissions[key] === 'isTrue');
        }
      });
    }
  }

  hasPermission(permission: string): boolean {
    return this.permissions.includes(permission);
  }

  loadLookupData() {
    const CompanyMasterSid = this.currentCompany?.CompanyMasterSid;
    forkJoin([
      this.masterService.getAllChargeGroups(CompanyMasterSid),
      this.masterService.getAllCurrencies(),
      this.masterService.getAllDepartments(CompanyMasterSid),
      this.masterService.getAllUom(),
      this.masterService.getAllHssac(),
      this.masterService.getAllTds(CompanyMasterSid)
    ]).subscribe({
      next: ([chargeGroups, currencies, departments, uoms, hsnsacs, tdsSets]) => {
        this.chargeGroupOptions = Array.isArray(chargeGroups) ? chargeGroups : chargeGroups.data;
        this.currencyOptions = currencies.data || currencies;
        this.departmentOptions = departments.data || departments;
        this.uomOptions = uoms.data || uoms;
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
        ChargeGroupSid: charge.ChargeGroupSid,
        CurrencyMasterSid: charge.CurrencyMasterSid,
        DepartmentMasterSid: charge.DepartmentMasterSid,
        Status: charge.Status || 'A'
      });
      this.chargeForm.get('Status')?.enable();

      // Load GST data
      if (charge.chargeTaxMaster && charge.chargeTaxMaster.length > 0) {
        charge.chargeTaxMaster.forEach(gst => {
          this.addGstToForm(gst);
        });
      }

      // Load TDS data
      if (charge.chargeTds && charge.chargeTds.length > 0) {
        charge.chargeTds.forEach(tds => {
          this.addTdsToForm(tds);
        });
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

  addGstToForm(gstData?: any) {
    const gstGroup = this.fb.group({
      HSNCode: [gstData?.HSNCode || '', Validators.required],
      description: [gstData?.description || ''],
      TaxGroup: [gstData?.TaxGroup || '', Validators.required],
      TaxRate: [gstData?.TaxRate || '', [Validators.required, Validators.min(0), Validators.max(100)]],
      Status: [gstData?.Status || 'A', Validators.required],
      ChargeTaxMasterSid: [gstData?.ChargeTaxMasterSid || null]
    });
    this.chargeTaxMasters.push(gstGroup);
  }

  addTdsToForm(tdsData?: any) {
    const tdsGroup = this.fb.group({
      TDSSet: [tdsData?.TDSSet || '', Validators.required],
      EffectiveFrom: [tdsData?.EffectiveFrom ? new Date(tdsData.EffectiveFrom) : '', Validators.required],
      Status: [tdsData?.status || 'A', Validators.required],
      ChargeTdsSid: [tdsData?.ChargeTdsSid || null]
    });
    this.chargeTds.push(tdsGroup);
  }

  openGstModal(content: TemplateRef<any>, gstIndex?: number) {
    if (gstIndex !== undefined) {
      this.isGstEditMode = true;
      this.currentGstIndex = gstIndex;
      const gstData = this.chargeTaxMasters.at(gstIndex).value;
      this.gstForm.patchValue(gstData);
    } else {
      this.isGstEditMode = false;
      this.currentGstIndex = null;
      this.gstForm.reset({
        HSNCode: '',
        description: '',
        TaxGroup: '',
        TaxRate: '',
        Status: 'A'
      });
    }

    this.gstModalRef = this.modalService.open(content, {
      size: 'lg',
      centered: true,
      backdrop: 'static'
    });
  }

  openTdsModal(content: TemplateRef<any>, tdsIndex?: number) {
    if (tdsIndex !== undefined) {
      this.isTdsEditMode = true;
      this.currentTdsIndex = tdsIndex;
      const tdsData = this.chargeTds.at(tdsIndex).value;
      this.tdsForm.patchValue({
        TDSSet: tdsData.TDSSet,
        EffectiveFrom: tdsData.EffectiveFrom,
        Status: tdsData.Status
      });
    } else {
      this.isTdsEditMode = false;
      this.currentTdsIndex = null;
      this.tdsForm.reset({
        TDSSet: '',
        EffectiveFrom: '',
        Status: 'A'
      });
    }

    this.tdsModalRef = this.modalService.open(content, {
      size: 'lg',
      centered: true,
      backdrop: 'static'
    });
  }

  submitGstForm() {
    if (this.gstForm.invalid) {
      this.gstForm.markAllAsTouched();
      return;
    }

    const gstValue = this.gstForm.value;
    
    if (this.isGstEditMode && this.currentGstIndex !== null) {
      this.chargeTaxMasters.at(this.currentGstIndex).patchValue(gstValue);
    } else {
      this.addGstToForm(gstValue);
    }

    this.gstModalRef.close();
    this.appSettingService.showSuccess('GST details saved successfully');
  }

  submitTdsForm() {
    if (this.tdsForm.invalid) {
      this.tdsForm.markAllAsTouched();
      return;
    }

    const tdsValue = this.tdsForm.value;
    
    if (this.isTdsEditMode && this.currentTdsIndex !== null) {
      this.chargeTds.at(this.currentTdsIndex).patchValue(tdsValue);
    } else {
      this.addTdsToForm(tdsValue);
    }

    this.tdsModalRef.close();
    this.appSettingService.showSuccess('TDS details saved successfully');
  }

  deleteGst(index: number) {
    this.chargeTaxMasters.removeAt(index);
    this.appSettingService.showSuccess('GST record removed');
  }

  deleteTds(index: number) {
    this.chargeTds.removeAt(index);
    this.appSettingService.showSuccess('TDS record removed');
  }
  getTdsSetName(tdsSetId: number): string {
  const tdsSet = this.tdsOptions.find(item => item.TDSSetHeaderSid === tdsSetId);
  return tdsSet ? tdsSet.TDSSetName : '';
}

  onSubmit() {
    if (this.chargeForm.invalid) {
        this.markFormGroupTouched(this.chargeForm);
        return;
    }

    // Check if at least one GST record exists
    if (this.chargeTaxMasters.controls.length === 0) {
        this.appSettingService.showError('Please add at least one GST record before saving');
        return;
    }

    // Check if at least one TDS record exists when GST exists
    if (this.chargeTaxMasters.controls.length > 0 && this.chargeTds.controls.length === 0) {
        this.appSettingService.showError('Please add at least one TDS record before saving');
        return;
    }

    this.btnDisable = true;
    this.loading = true;

    const currentUserEmail = this.appSettingService.userSettingSource.value['userEmail'];
    
    const payload = {
      CompanyMasterSid : this.currentCompany?.CompanyMasterSid,
        chargeCode: this.chargeForm.value.chargeCode,
        chargeName: this.chargeForm.value.chargeName,
        UOM: this.chargeForm.value.UOM,
        ChargeGroupSid: this.chargeForm.value.ChargeGroupSid,
        CurrencyMasterSid: this.chargeForm.value.CurrencyMasterSid,
        DepartmentMasterSid: this.chargeForm.value.DepartmentMasterSid,
        Status: 'A',
        chargeTaxMaster: this.chargeTaxMasters.value.map(gst => ({
            HSNCode: gst.HSNCode,
            description: gst.description,
            TaxGroup: gst.TaxGroup,
            TaxRate: gst.TaxRate,
            Status: gst.Status,
            ...(gst.ChargeTaxMasterSid ? { ChargeTaxMasterSid: gst.ChargeTaxMasterSid } : {})
        })),
        chargeTds: this.chargeTds.value.map(tds => ({
            TDSSet: tds.TDSSet,
            EffectiveFrom: tds.EffectiveFrom,
            status: tds.status,
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
            const message = this.isEditMode 
                ? 'Charge updated successfully!' 
                : 'Charge created successfully!';
            
            this.appSettingService.showSuccess(message);
            
            if (!this.isEditMode && resp.data?.ChargeMasterSid) {
                this.router.navigate(['/master/charge/entry', resp.data.ChargeMasterSid]);
            } else {
                this.router.navigate(['/master/charge/list']);
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

openAuditLogs(modal: TemplateRef<any>) {
  if (!this.chargeData?.ChargeMasterSid) return;

  this.masterService.getAuditLogsCharge('ChargeMaster', this.chargeData?.ChargeMasterSid.toString()).subscribe({
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

isChargeFormValid(): boolean {
    return this.chargeForm.valid;
}
canSaveCharge(): boolean {
    
    if (this.chargeForm.invalid) return false;
    
    // Must have at least one GST record
    if (this.chargeTaxMasters.controls.length === 0) return false;
    
    // Must have at least one TDS record if GST exists
    if (this.chargeTaxMasters.controls.length > 0 && this.chargeTds.controls.length === 0) return false;
    
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
      ChargeGroupSid: null,
      CurrencyMasterSid: null,
      DepartmentMasterSid: [],
      Status: 'A'
    });
    this.chargeForm.get('Status')?.disable();
    this.selectedDepartments = [];
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

  openTandC() {
    this.currentMenuId = Number(localStorage.getItem('currentMenuId'));
    const payload = { MenuMasterSid: this.currentMenuId };
    this.masterService.getTandCByCondition(payload).subscribe(
      (resp: any) => {
        if (resp.Status) {
          this.TandCList = resp.data;
          const modalRef = this.modalService.open(TermsAndConditionsComponent, {
            size: 'lg',
            backdrop: 'static',
            centered: true
          });
          modalRef.componentInstance.terms = this.TandCList;
          modalRef.componentInstance.MenuMasterSid = this.currentMenuId;
          modalRef.componentInstance.DocumentSid = this.chargeID;
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
    if (!this.chargeData) return;
    const modalRef = this.modalService.open(EmailEntryComponent, {
      size: 'lg',
      centered: true,
      backdrop: 'static'
    });
  }

  openAuthority() {
    if (!this.chargeData) return;
    const modalRef = this.modalService.open(AuthorityEntryComponent, { 
      size: 'lg', 
      centered: true, 
      backdrop: 'static' 
    });
    modalRef.componentInstance.item = this.chargeData;
    modalRef.componentInstance.idLabel = 'Charge Id';
    modalRef.componentInstance.idValue = this.chargeData?.ChargeMasterSid;
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
  }

  onDepartmentChange(selectedNames: string[]) {
  this.selectedDepartments = selectedNames;

  const selectedIds = this.departmentOptions
    .filter(dept => selectedNames.includes(dept.departmentName))
    .map(dept => dept.DepartmentMasterSid);

  this.chargeForm.get('DepartmentMasterSid')?.setValue(selectedIds);
}
  

  onHsnsacSelect(event: any) {
    if (event) {
      const selectedHsnsac = this.hsnsacOptions.find(item => item.HSSACCode === event);
      if (selectedHsnsac) {
        this.gstForm.patchValue({
          TaxRate: selectedHsnsac.rate,
          description: selectedHsnsac.description
        });
      }
    }
  }
}