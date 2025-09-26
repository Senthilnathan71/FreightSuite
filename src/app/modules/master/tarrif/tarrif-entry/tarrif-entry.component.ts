import { Component, OnInit, TemplateRef } from '@angular/core';
import { NgbAlertModule, NgbCalendar, NgbDate, NgbDateAdapter, NgbDateParserFormatter, NgbDatepickerModule, NgbDateStruct, NgbDropdownModule, NgbModal, NgbModalModule, NgbModalRef, NgbNavModule, NgbPaginationModule, NgbPopoverModule, NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { FeatherModule } from 'angular-feather';
import { MasterService } from '../../master.service';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { ActivatedRoute, Router } from '@angular/router';
import { AbstractControl, FormArray, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, ValidatorFn, Validators } from '@angular/forms';
import { OnlyNumbersDirective } from 'src/app/core/Directives/onlyNumbersOfLength';
import { OnlyTextDirective } from 'src/app/core/Directives/onlyStringOfLength';
import { TextWithNumbersDirective } from 'src/app/core/Directives/textWithNumbers';
import { Port } from 'src/app/modules/crm-mobile/Interfaces/port.interface';
import { forkJoin } from 'rxjs';
import { NgSelectModule } from '@ng-select/ng-select';
import { CommonModule, DatePipe } from '@angular/common';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { DeleteWarningComponent } from 'src/app/modules/crm-mobile/delete-warning.component';
import { DecimalPrecisionDirective } from 'src/app/core/Directives/decimalWithPrecision';
import { CustomDateAdapter } from 'src/app/component/datepicker/custom-date-adapter';
import { CustomDateParserFormatter } from 'src/app/component/datepicker/custom-date-parser';
import { CustomDatePipe } from 'src/app/core/pipes/custom-date-format.pipe';
import { SearchableDropdown } from 'src/app/component/searchable-dropdown/searchable-dropdown.component';
import { DetailsComponent } from 'src/app/component/details/details.component';
import { PreventMultiClickDirective } from 'src/app/core/Directives/prevent-multi-click.directive';
import { TermsAndConditionsComponent } from 'src/app/component/terms&conditions/terms&conditions.component';
import { Charge } from 'src/app/modules/crm-mobile/Interfaces/charge.interface';
import { EmailEntryComponent } from 'src/app/modules/settings/email/email-entry/email-entry.component';
import { EdocComponent } from 'src/app/modules/settings/edoc/edoc/edoc.component';
import { AuthorityLogComponent } from 'src/app/component/authority-log/authority-log.component';

@Component({
  selector: 'app-tarrif-entry',
  standalone: true,
  imports: [
    FeatherModule,
    NgbTooltip,
    ReactiveFormsModule,
    OnlyNumbersDirective,
    OnlyTextDirective,
    TextWithNumbersDirective,
    NgSelectModule,
    NgbDatepickerModule,
    FormsModule,
    NgbNavModule,
    NgbAlertModule,
    CommonModule,
    MatDialogModule,
    DatePipe,
    DecimalPrecisionDirective,
    NgbPopoverModule,
    NgbPaginationModule,
    CustomDatePipe,
    SearchableDropdown,
    PreventMultiClickDirective,
    NgbDropdownModule
  ],
  templateUrl: './tarrif-entry.component.html',
  styleUrl: './tarrif-entry.component.scss',
  providers: [
    { provide: NgbDateAdapter, useClass: CustomDateAdapter },
    { provide: NgbDateParserFormatter, useClass: CustomDateParserFormatter },
  ],
})
export class TarrifEntryComponent implements OnInit {
  selectedDepartment: any;
  selectedDepartmentType: string = '';
  selectedFCLLCL: string = '';
  filteredPorts: any[] = [];
  filteredPOL: any[] = [];
  filteredPOD: any[] = [];
  departments: any[] = [];

  active = 1;
  modalRef: NgbModalRef;
  tariffHeaderForm!: FormGroup;
  tariffDetailsForm!: FormGroup;
  isEditMode: boolean = false;
  isModalEditMode: boolean = false;
  setErrorMessage: boolean = false;
  TariffHeaderSid: number | null = null;
  TariffDetailSid: number | null = null;
  TariffDetailsList: any[] = [];
  filteredTariffDetail: any[] = [];
  portList: Port[] = [];
  polList: Port[] = [];
  podList: Port[] = [];
  chargeList: any[] = [];
  UOMList: any[] = [];
  departmentList: any[] = [];
  agentList: any[] = [];
  carrierList: any[] = [];
  companyList: any[] = [];
  currencyList: any[] = [];
  incoList: any[] = [];
  isDataLoading: boolean = false;
  tariffData: any;
  tariffDetailData: any;

  userData: any;
  permissions: string[] = [];
  currentMenuPermissions: any = {};
  currentCompany: any;
  currentBranch: any;

  auditLogs: any[] = [];
  auditLogModalRef!: NgbModalRef;

  selectedTab = 'Tariff Details';
  tab = [{ name: 'Tariff Details', icon: 'fas fa-info-circle' }];
  page = 1;
  pageSize = 5;
  totalNumberOfCollection: number = 0;
  today = this.calendar.getToday();
  todayDate = new Date(this.today.year, this.today.month - 1, this.today.day);
  minEffectiveDate = this.toNgbDateStruct(this.todayDate);
  minEffectiveFrom: NgbDateStruct | null;
  currentMenuId: number | null = null;
  TandCList: any;
  chargeTaxes: any[] = [];
  btnDisable: boolean = true;

  // Status-only edit flags
  isStatusEditable: boolean = false;
  isModalStatusEditable: boolean = false;

  cargoTypes = ['General', 'Haz', 'Reefer', 'Flexi', 'ODC', 'Empty', 'RORO', 'OOG', 'Tanker'];
  serviceLevel = ['BreakBulk', 'OOG', 'Tanker']

  constructor(
    private masterServ: MasterService,
    private appSettingServ: AppSettingsService,
    private currRoute: ActivatedRoute,
    private appSettingService: AppSettingsService,
    private route: Router,
    private fb: FormBuilder,
    private modalService: NgbModal,
    private matdial: MatDialog,
    private calendar: NgbCalendar
  ) { }

  ngOnInit(): void {
    this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));
    this.currentBranch = this.appSettingService.decrypt(localStorage.getItem('selected-branch'));
    this.initHeaderForm();
    this.loadAllFields();

    this.tariffHeaderForm.statusChanges.subscribe(status => {
      this.btnDisable = status !== 'VALID';
    });

    this.tariffHeaderForm.get('DepartmentMasterSid')?.valueChanges.subscribe((deptValue) => {
      this.onDeptChange(deptValue);
    });

    this.currRoute.paramMap.subscribe(param => {
      this.TariffHeaderSid = Number(param.get('id'));
      if (this.TariffHeaderSid) {
        this.isEditMode = true;
        this.minEffectiveDate = undefined as any;
        this.loadTariff(this.TariffHeaderSid);
        this.loadTariffDetails();
      } else {
        this.minEffectiveDate = this.toNgbDateStruct(this.todayDate);
      }
    });

    const userProfile = this.appSettingServ.getDecryptedUserProfile();
    if (userProfile) {
      this.userData = userProfile;
      this.checkPermissions();
    }
  }

  checkPermissions() {
    const currentMenuId = Number(localStorage.getItem('currentMenuId'));
    const userRole = this.userData?.userRoleMaster[0]?.RoleMasterSid;
    if (currentMenuId && userRole) {
      this.masterServ.getRoleMenuPermissions(currentMenuId, userRole).subscribe({
        next: (response) => {
          this.currentMenuPermissions = response.data.MenuPermissions || {};
          this.permissions = Object.keys(this.currentMenuPermissions).filter(
            (key) => this.currentMenuPermissions[key] === 'isTrue'
          );
        },
      });
    }
  }

  hasPermission(permission: string): boolean {
    return this.permissions.includes(permission);
  }

  initHeaderForm() {
    this.tariffHeaderForm = this.fb.group({
      DepartmentMasterSid: [null, [Validators.required]],
      POOSid: [],
      POLSid: [, [Validators.required]],
      PODSid: [, [Validators.required]],
      FDCSid: [],
      ViaPortSid: [],
      POLTerminal: [, [Validators.required]],
      PODTerminal: [, [Validators.required]],
      Carrier: [null],
    //   MovementType: [null],
      AgentSid: [null],
      IncoTerms: [null],
      // StuffingAt: [null,[Validators.required]],
      status: ['Active'],
      Remarks: [''],
    });
    this.tariffHeaderForm.get('POLTerminal')?.disable();
    this.tariffHeaderForm.get('PODTerminal')?.disable();
  }

  initDetailsForm() {
    this.tariffDetailsForm = this.fb.group({
      detailisSlabApplicable: [false, [Validators.required]],
      detailSlabFrom: ['', this.slabConditionalValidator()],
      detailSlabTo: ['', this.slabConditionalValidator()],
      // ⬇️ Attach custom validator; it auto-bypasses in edit mode
      detailEffectiveDate: ['', [Validators.required, this.effectiveDateValidator()]],
      detailExpiredOn: ['', [Validators.required]],
      detailChargeCode: [null, [Validators.required]],
      detailDescription: [''],
      detailCargoType: [null, [Validators.required]],
      detailUOMSid: [null, [Validators.required]],
      detailSaleCurrency: [null, Validators.required],
      detailSalePerUnitPrice: ['', [Validators.required]],
      detailBuyCurrency: [null, [Validators.required]],
      detailBuyPerUnitPrice: ['', [Validators.required]],
      detailMinSale: [''],
      detailstatus: ['Active'],
      detailRemarks: [''],
      chargeTaxMasters: this.fb.array([]),
      chargeTds: this.fb.array([])
    });

    this.tariffDetailsForm.get('detailisSlabApplicable')?.valueChanges.subscribe(() => {
      this.updateSlabValidators();
    });

    // Charge code change: only apply "next-day" rule in CREATE mode
    this.tariffDetailsForm.get('detailChargeCode')?.valueChanges.subscribe(chargeCode => {
      if (!chargeCode) {
        if (!this.isModalEditMode) {
          this.tariffDetailsForm.get('detailEffectiveDate')?.setValue(null);
          this.minEffectiveFrom = this.toNgbDateStruct(this.todayDate);
        }
        return;
      }
      if (!this.isModalEditMode) {
        this.onChargeCodeChange(chargeCode);
      } else {
        // Edit: keep date as-is, just update description/UOM if needed
        this.setChargeDetails(this.chargeList.find(c => c.chargeCode === chargeCode));
      }
    });
  }

  get tariffDetails(): FormArray {
    return this.tariffDetailsForm.get('tariffDetails') as FormArray;
  }

  createTariffDetailFormGroup(tariffData?: any): FormGroup {
    return this.fb.group({
      detailisSlabApplicable: [tariffData?.IsSlabApplicable === 'Y' ? true : false || false, [Validators.required]],
      detailSlabFrom: [tariffData?.SlabFrom || '', this.slabConditionalValidator()],
      detailSlabTo: [tariffData?.SlabTo || '', this.slabConditionalValidator()],
      detailEffectiveDate: [tariffData?.EffectiveDate ? new Date(tariffData.EffectiveDate) : '', [Validators.required, this.effectiveDateValidator()]],
      detailExpiredOn: [tariffData?.ExpiredOn ? new Date(tariffData.ExpiredOn) : '', [Validators.required]],
      detailChargeCode: [tariffData?.ChargeCode || '', [Validators.required]],
      detailDescription: [tariffData?.Description || ''],
      detailCargoType: [tariffData?.CargoType || '', [Validators.required]],
      detailUOMSid: [tariffData?.UOMSid || '', [Validators.required]],
      detailSaleCurrency: [tariffData?.SaleCurrency || '', Validators.required],
      detailSalePerUnitPrice: [tariffData?.SalePerUnitPrice || '', [Validators.required]],
      detailBuyCurrency: [tariffData?.BuyCurrency || '', [Validators.required]],
      detailBuyPerUnitPrice: [tariffData?.BuyPerUnitPrice || '', [Validators.required]],
      detailMinSale: [tariffData?.MinSale || ''],
      detailstatus: [tariffData?.status ? (tariffData.status === 'A' ? 'Active' : 'Suspended') : 'Active'],
      detailRemarks: [tariffData?.Remarks || ''],
      TariffDetailSid: [tariffData?.TariffDetailSid || null]
    });
  }

  slabConditionalValidator(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } | null => {
      const parent = control.parent;
      if (!parent) return null;

      const isSlabApplicable = parent.get('detailisSlabApplicable')?.value;
      if (isSlabApplicable && !control.value) {
        return { required: true };
      }
      return null;
    };
  }

  updateSlabValidators() {
    const isApplicable = this.tariffDetailsForm.get('detailisSlabApplicable')?.value;
    const slabFromCtrl = this.tariffDetailsForm.get('detailSlabFrom');
    const slabToCtrl = this.tariffDetailsForm.get('detailSlabTo');

    if (isApplicable) {
      slabFromCtrl?.setValidators([this.slabConditionalValidator()]);
      slabToCtrl?.setValidators([this.slabConditionalValidator()]);
    } else {
      slabFromCtrl?.clearValidators();
      slabToCtrl?.clearValidators();
    }
    slabFromCtrl?.updateValueAndValidity();
    slabToCtrl?.updateValueAndValidity();
  }

  openTariffDetailEntryModal(content: TemplateRef<any>, data?: any) {
  if (!this.TariffHeaderSid) {
    this.appSettingServ.showError('Adding tariff details requires creation of tariff header.');
    return;
  }

  this.isModalEditMode = !!data;
  this.initDetailsForm();
  this.loadModalFields();

  if (data) {
    // Edit mode logic remains the same...
    this.tariffDetailData = data;
    this.minEffectiveFrom = null;
    
    // Patch form values
    this.tariffDetailsForm.patchValue({
      detailisSlabApplicable: data.IsSlabApplicable === 'Y',
      detailSlabFrom: data.SlabFrom || '',
      detailSlabTo: data.SlabTo || '',
      detailEffectiveDate: new Date(data.EffectiveDate),
      detailExpiredOn: new Date(data.ExpiredOn),
      detailChargeCode: data.ChargeCode,
      detailDescription: data.Description || '',
      detailCargoType: data.CargoType,
      detailUOMSid: data.UOMSid,
      detailSaleCurrency: data.SaleCurrency,
      detailSalePerUnitPrice: data.SalePerUnitPrice,
      detailBuyCurrency: data.BuyCurrency,
      detailBuyPerUnitPrice: data.BuyPerUnitPrice,
      detailMinSale: data.MinSale || '',
      detailstatus: data.status === 'A' ? 'Active' : 'Suspended',
      detailRemarks: data.Remarks || ''
    });

    if (data.TariffDetailSid) this.TariffDetailSid = data.TariffDetailSid;

    this.isModalStatusEditable = false;
    this.setDetailControlsReadOnly(true);
  } else {
    // Create mode - ensure min date is set correctly
    this.minEffectiveFrom = this.toNgbDateStruct(this.todayDate);
    
    // Set default effective date based on initially selected charge code (if any)
    const initialChargeCode = this.tariffDetailsForm.get('detailChargeCode')?.value;
    if (initialChargeCode) {
      this.setEffectiveDateBasedOnChargeCode(initialChargeCode);
    }
  }

  this.modalRef = this.modalService.open(content, { size: 'lg', centered: true, backdrop: 'static' });
}

  // --- LOAD TARIFF AND SET READONLY VIEW ---
  loadTariff(TariffHeaderSid: number) {
    this.masterServ.getTariffById(TariffHeaderSid).subscribe(
      (tariffData) => {
        if (tariffData.data) {
          this.tariffData = tariffData.data;

          this.tariffHeaderForm.patchValue({
            ...tariffData.data,
            DepartmentMasterSid: Number(tariffData.data.DepartmentMasterSid),
            status: tariffData.data.status === 'A' ? 'Active' : 'Suspended'
          });

          const deptSid = Number(tariffData.data.DepartmentMasterSid);
          const deptObj = this.departments?.find(d => Number(d.DepartmentMasterSid) === deptSid) || null;
          this.onDeptChange(deptObj ?? deptSid);

          this.isStatusEditable = false;
          this.setHeaderControlsReadOnly(true);
        }
      },
      (error) => {
        this.appSettingServ.showError('Error Loading Tariff ', error);
      }
    );
  }

  loadAllFields() {
    const CompanyMasterSid = this.currentCompany?.CompanyMasterSid;
    forkJoin({
      ports: this.masterServ.getAllPorts(),
      agents: this.masterServ.getAllAgents(CompanyMasterSid),
      carriers: this.masterServ.getAllCarriers(CompanyMasterSid),
      departments: this.masterServ.getAllDepartments(this.currentCompany?.CompanyMasterSid),
      companies: this.masterServ.getAllCompanies(),
      currencies: this.masterServ.getAllCurrencies(),
      incos: this.masterServ.getAllInco(),
      chargeTax: this.masterServ.getAllChargeTax(CompanyMasterSid)
    }).subscribe(({ ports, agents, carriers, departments, companies, currencies, incos, chargeTax }) => {
      this.departments = departments || [];
      this.portList = (ports.data || []).map(p => ({
        ...p,
        CountryName: p.countryMaster?.countryName
      }));

      this.filteredPorts = [...this.portList];
      this.filteredPOL = [...this.filteredPorts];
      this.filteredPOD = [...this.filteredPorts];

      this.polList = [...this.filteredPOL];
      this.podList = [...this.filteredPOD];
      this.agentList = agents;
      this.carrierList = carriers;
      this.departmentList = departments;
      this.companyList = companies;
      this.currencyList = currencies;
      this.incoList = incos;
      this.chargeTaxes = chargeTax.data;
      this.isDataLoading = false;

      if (this.isEditMode && this.tariffData?.DepartmentMasterSid) {
        const deptSid = Number(this.tariffData.DepartmentMasterSid);
        const deptObj = this.departments.find(d => Number(d.DepartmentMasterSid) === deptSid) || null;
        this.onDeptChange(deptObj ?? deptSid);
      }
    }, err => console.error('loadAllFields error', err));
  }

   openAuditLogs(modal: TemplateRef<any>) {
  if (!this.TariffHeaderSid) return;
 
  this.masterServ.getAuditLogsTariff(
    'TariffHeader',
    this.TariffHeaderSid.toString()
  ).subscribe({
    next: (logs: any[]) => {
      const ignoredFields = ['UpdatedOn']; // ✅ add more if needed later
 
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
 

  loadModalFields() {
    const CompanyMasterSid = this.currentCompany?.CompanyMasterSid;
    forkJoin({
      charges: this.masterServ.getAllCharges(CompanyMasterSid),
      UOMs: this.masterServ.getAllUom(),
    }).subscribe(({ charges, UOMs }) => {
      this.chargeList = charges;
      this.UOMList = UOMs.data;
    });
  }

  navigateBack() {
    history.back();
  }

  private setHeaderControlsReadOnly(readOnly: boolean) {
    Object.keys(this.tariffHeaderForm.controls).forEach(key => {
      const ctrl = this.tariffHeaderForm.get(key);
      if (!ctrl) return;
      if (readOnly) {
        ctrl.disable({ emitEvent: false });
      } else {
        ctrl.enable({ emitEvent: false });
      }
    });

    this.tariffHeaderForm.get('POLTerminal')?.disable({ emitEvent: false });
    this.tariffHeaderForm.get('PODTerminal')?.disable({ emitEvent: false });

    if (this.isStatusEditable) {
      this.tariffHeaderForm.get('status')?.enable({ emitEvent: false });
    } else {
      this.tariffHeaderForm.get('status')?.disable({ emitEvent: false });
    }
  }

  onEditStatusClick() {
    if (!this.isEditMode) return;
    this.isStatusEditable = true;
    this.setHeaderControlsReadOnly(true);
    this.tariffHeaderForm.get('status')?.enable({ emitEvent: false });
    this.btnDisable = false;
  }

  private setDetailControlsReadOnly(readOnly: boolean) {
    if (!this.tariffDetailsForm) return;
    Object.keys(this.tariffDetailsForm.controls).forEach(key => {
      const ctrl = this.tariffDetailsForm.get(key);
      if (!ctrl) return;
      if (readOnly) ctrl.disable({ emitEvent: false });
      else ctrl.enable({ emitEvent: false });
    });

    if (this.isModalStatusEditable) {
      this.tariffDetailsForm.get('detailstatus')?.enable({ emitEvent: false });
    } else {
      this.tariffDetailsForm.get('detailstatus')?.disable({ emitEvent: false });
    }
  }

  onEditDetailStatusClick() {
    if (!this.isModalEditMode) return;
    this.isModalStatusEditable = true;
    this.setDetailControlsReadOnly(true);
    this.tariffDetailsForm.get('detailstatus')?.enable({ emitEvent: false });
  }

  onSave() {
    if (this.isEditMode && this.isStatusEditable) {
      const updatedBy = this.appSettingServ.userSettingSource.value['userEmail'];
      const statusVal = this.tariffHeaderForm.get('status')?.value;
      const payload: any = {
        status: statusVal === 'Active' ? 'A' : 'S',
        updatedBy
      };

      this.masterServ.updateTariffById(this.TariffHeaderSid as number, payload).subscribe({
        next: (resp: any) => {
          if (resp.status) {
            this.appSettingService.showSuccess(resp.message);
            this.isStatusEditable = false;
            this.setHeaderControlsReadOnly(true);
            this.loadTariff(this.TariffHeaderSid as number);
            this.btnDisable = true;
          } else {
            this.appSettingServ.showError(resp.message || 'Error updating status');
          }
        },
        error: (error) => {
          console.error('Error updating status: ', error);
          this.appSettingServ.showError('Error updating status');
        }
      });
      return;
    }

    this.fullOnSaveFlow();
  }

  fullOnSaveFlow() {
    if (this.tariffHeaderForm.invalid) {
      this.tariffHeaderForm.markAllAsTouched();
      this.tariffHeaderForm.updateValueAndValidity();
      this.appSettingServ.showWarning('Please fill all required fields correctly');
      return;
    } else {
      const formValue = this.tariffHeaderForm.getRawValue();
      const payload = this.coerceIntoRequiredFormat(formValue);

      if (this.isEditMode) {
        this.masterServ.updateTariffById(this.TariffHeaderSid as number, payload).subscribe(
          (resp: any) => {
            if (resp.status) {
              this.appSettingService.showSuccess(resp.message);
              this.loadTariff(this.TariffHeaderSid as number);
            } else {
              this.appSettingServ.showError(resp.message);
            }
          },
          (error) => {
            console.error('Error loading Tariff : ', error);
          }
        );
      } else {
        this.masterServ.createTariff(payload).subscribe(
          (resp: any) => {
            if (resp.status) {
              this.appSettingService.showSuccess(resp.message);
              const tariffId = resp?.data?.TariffHeaderSid;
              if (tariffId) {
                this.route.navigate(['master/tarrif/entry', tariffId]);
              }
            } else {
              this.appSettingServ.showError(resp.message);
            }
          },
          (error) => {
            console.error('Error loading Tariff : ', error);
          }
        );
      }
    }
  }

  onModalSave() {
    // Detail status-only update in edit mode
    if (this.isModalEditMode && this.isModalStatusEditable) {
      const updatedBy = this.appSettingServ.userSettingSource.value['userEmail'];
      const statusVal = this.tariffDetailsForm.get('detailstatus')?.value;
      const payload = {
        status: statusVal === 'Active' ? 'A' : 'S',
        updatedBy
      };

      this.masterServ.updateTariffDetailById(this.TariffDetailSid as number, payload).subscribe(
        (resp: any) => {
          if (resp.status) {
            this.appSettingService.showSuccess(resp.message);
            this.tariffDetailsForm.reset();
            this.modalRef.close();
            this.loadTariffDetails();
          } else {
            this.appSettingServ.showError(resp.message || 'Error updating tariff detail status');
          }
        },
        (error) => {
          console.error('Error updating tariff detail status', error);
          this.appSettingServ.showError('Error updating tariff detail status');
        }
      );
      return;
    }

    // Create/update full flow
    if (this.tariffDetailsForm.invalid) {
      this.tariffDetailsForm.markAllAsTouched();
      this.tariffDetailsForm.updateValueAndValidity();
      this.appSettingServ.showWarning('Please fill all the required fields');
      return;
    } else {
      const createdBy = this.appSettingServ.userSettingSource.value['userEmail'];
      const updatedBy = this.appSettingServ.userSettingSource.value['userEmail'];
      const formValue = this.tariffDetailsForm.getRawValue();
      const payload = {
        TariffHeaderSid: this.TariffHeaderSid || parseInt(formValue.TariffHeaderSid, 10),
        IsSlabApplicable: formValue.detailisSlabApplicable ? 'Y' : 'N',
        SlabFrom: formValue.detailisSlabApplicable ? parseInt(formValue.detailSlabFrom, 10) : null,
        SlabTo: formValue.detailisSlabApplicable ? parseInt(formValue.detailSlabTo, 10) : null,
        EffectiveDate: formValue.detailEffectiveDate,
        ExpiredOn: formValue.detailExpiredOn,
        ChargeCode: formValue.detailChargeCode,
        Description: formValue.detailDescription,
        CargoType: formValue.detailCargoType,
        UOMSid: parseInt(formValue.detailUOMSid, 10),
        SaleCurrency: parseInt(formValue.detailSaleCurrency, 10),
        SalePerUnitPrice: parseFloat(formValue.detailSalePerUnitPrice),
        BuyCurrency: parseInt(formValue.detailBuyCurrency, 10),
        BuyPerUnitPrice: parseFloat(formValue.detailBuyPerUnitPrice),
        MinSale: formValue.detailMinSale,
        status: formValue.detailstatus === 'Active' ? 'A' : 'S',
        Remarks: formValue.detailRemarks,
        ...(this.isModalEditMode ? { updatedBy } : { createdBy })
      };

      if (this.isModalEditMode) {
        this.masterServ.updateTariffDetailById(this.TariffDetailSid as number, payload).subscribe(
          (resp: any) => {
            if (resp.status) {
              this.appSettingService.showSuccess(resp.message);
              this.tariffDetailsForm.reset();
              this.modalRef.close();
              this.loadTariffDetails();
            } else {
              this.appSettingServ.showError('Error Updating Tariff Detail');
            }
          },
          (error) => {
            console.error('Error Updating Tariff Detail', error);
          }
        );
      } else {
        this.masterServ.createNewTariffDetail(payload).subscribe(
          (resp: any) => {
            if (resp.status) {
              this.appSettingService.showSuccess('New Tariff Detail Created');
              this.tariffDetailsForm.reset();
              this.modalRef.close();
              this.loadTariffDetails();
            } else {
              this.appSettingServ.showError('Error Creating Tariff Detail');
            }
          },
          (error) => {
            console.error('Error Creating Tariff Detail', error);
          }
        );
      }
    }
  }

  coerceIntoRequiredFormat(formValue: any) {
    const createdBy = this.appSettingServ.userSettingSource.value['userEmail'];
    const updatedBy = this.appSettingServ.userSettingSource.value['userEmail'];
    return (this.isEditMode) ? {
      ...formValue,
      CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
      POOSid: formValue.POOSid,
      POLSid: formValue.POLSid,
      PODSid: formValue.PODSid,
      FDCSid:formValue.FDCSid,
      ViaPortSid: formValue.ViaPortSid,
      AgentSid: formValue.AgentSid,
      Carrier: formValue.Carrier,
      updatedBy,
      status: formValue.status === 'Active' ? 'A' : 'S'
    } : {
      ...formValue,
      CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
      POOSid: formValue.POOSid,
      POLSid: formValue.POLSid,
      PODSid: formValue.PODSid,
      FDCSid: formValue.FDCSid,
      ViaPortSid: formValue.ViaPortSid,
      AgentSid: formValue.AgentSid,
      Carrier: formValue.Carrier,
      createdBy,
      status: formValue.status === 'Active' ? 'A' : 'S'
    };
  }

  deleteTariffDetail(TariffDetailSid: number) {
    const dialRef = this.matdial.open(DeleteWarningComponent);
    dialRef.afterClosed().subscribe(
      (res) => {
        if (res) {
          this.masterServ.deleteTariffDetailById(TariffDetailSid).subscribe(
            (resp) => {
              if (resp.data) {
                this.appSettingServ.showSuccess('Tariff Detail Deleted Successfully');
                this.loadTariffDetails();
              } else {
                this.appSettingServ.showError('Error Deleting Tariff Detail');
              }
            },
            (error) => {
              console.error('Error Deleting Tariff Detail', error);
            }
          );
        }
      }
    );
  }

  onDeptChange(department: any): void {
    if (!department) {
      this.selectedDepartment = null;
      this.selectedDepartmentType = '';
      this.selectedFCLLCL = 'LCL';
      this.filteredPorts = [...(this.portList || [])];
      this.filteredPOL = [...this.filteredPorts];
      this.filteredPOD = [...this.filteredPorts];
      this.polList = [...this.filteredPOL];
      this.podList = [...this.filteredPOD];
      this.tariffHeaderForm.get('POOSid')?.setValue(null);
      this.tariffHeaderForm.get('POLSid')?.setValue(null);
      this.tariffHeaderForm.get('PODSid')?.setValue(null);
      this.tariffHeaderForm.get('FDCSid')?.setValue(null);
      this.tariffHeaderForm.get('MovementType')?.setValue(null);
      return;
    }

    let deptObj = department;
    if (typeof department === 'number' || typeof department === 'string') {
      deptObj = this.departments?.find(d => Number(d.DepartmentMasterSid) === Number(department)) || { departmentType: '', FCLLCL: 'LCL' };
    }

    this.selectedDepartment = deptObj;
    this.selectedDepartmentType = (deptObj.departmentType || '').toUpperCase();
    this.selectedFCLLCL = this.selectedDepartmentType === 'SEA'
      ? (deptObj.FCLLCL?.toUpperCase() || 'LCL')
      : 'AIR';

    this.filteredPorts = this.getFilteredPortsBySegment(this.selectedFCLLCL);
    this.filteredPOL = [...this.filteredPorts];
    this.filteredPOD = [...this.filteredPorts];
    this.polList = [...this.filteredPOL];
    this.podList = [...this.filteredPOD];

    if (this.selectedDepartmentType === 'SEA') {
      this.tariffHeaderForm.get('MovementType')?.setValue('Sea');
    } else if (this.selectedDepartmentType === 'AIR') {
      this.tariffHeaderForm.get('MovementType')?.setValue('Air');
    }
  }

  getFilteredPortsBySegment(segment: string): any[] {
    if (segment === 'AIR') {
      return this.portList.filter(port => port.PortType === 'Air');
    } else if (segment === 'FCL' || segment === 'LCL') {
      return this.portList.filter(port => port.PortType === 'Sea');
    }
    return this.portList;
  }

  handlePOLChange(selectedPort: any): void {
    if (!selectedPort) {
      this.filteredPOD = [...this.filteredPorts];
      return;
    }
    const selectedPortSid = selectedPort.PortMasterSid ?? selectedPort;
    this.filteredPOD = this.filteredPorts.filter(port => port.PortMasterSid !== selectedPortSid);
    this.tariffHeaderForm.get('POLSid')?.setValue(selectedPortSid, { emitEvent: false });
  }

  handlePODChange(selectedPort: any): void {
    if (!selectedPort) {
      this.filteredPOL = [...this.filteredPorts];
      return;
    }
    const selectedPortSid = selectedPort.PortMasterSid ?? selectedPort;
    this.filteredPOL = this.filteredPorts.filter(port => port.PortMasterSid !== selectedPortSid);
    this.tariffHeaderForm.get('PODSid')?.setValue(selectedPortSid, { emitEvent: false });
  }

  updatePaginationData() {
    const start = (this.page - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.filteredTariffDetail = this.TariffDetailsList.slice(start, end);
  }

  resetForm() {
    this.filteredPorts = [...this.portList];
    this.filteredPOL = [...this.filteredPorts];
    this.filteredPOD = [...this.filteredPorts];

    if (this.isEditMode && this.TariffHeaderSid) {
      this.loadTariff(this.TariffHeaderSid);
      this.loadTariffDetails();
      return;
    }

    this.tariffHeaderForm.reset({
      DepartmentMasterSid: null,
      POOSid: '',
      POLSid: '',
      PODSid: '',
      FDCSid: '',
      ViaPortSid: '',
      POLTerminal: '',
      PODTerminal: '',
      Carrier: null,
    //   MovementType: null,
      AgentSid: null,
      IncoTerms: null,
    //   StuffingAt: null,
      status: 'Active',
      Remarks: ''
    });

    this.TariffDetailsList = [];
    this.filteredTariffDetail = [];
    this.totalNumberOfCollection = 0;
    this.page = 1;

    this.tariffHeaderForm.markAsUntouched();
    this.tariffHeaderForm.markAsPristine();
    this.tariffHeaderForm.updateValueAndValidity();

    this.tariffData = null;
    this.tariffDetailData = null;
    this.TariffHeaderSid = null;
    this.TariffDetailSid = null;
    this.isModalEditMode = false;
    this.btnDisable = true;

    this.polList = [...this.portList];
    this.podList = [...this.portList];

    this.minEffectiveDate = this.toNgbDateStruct(this.todayDate);
    this.minEffectiveFrom = null;

    this.tariffHeaderForm.get('POLTerminal')?.disable();
    this.tariffHeaderForm.get('PODTerminal')?.disable();
  }

  setPOLTerminal(event: any) {
    if (event) {
      const found = this.portList.find(port => port.PortMasterSid === event);
      const POLTerminal = found ? found.PortCode : '';
      this.tariffHeaderForm.get('POLTerminal')?.setValue(POLTerminal);
    }
  }

  setPODTerminal(event: any) {
    if (event) {
      const found = this.portList.find(port => port.PortMasterSid === event);
      const PODTerminal = found ? found.PortCode : '';
      this.tariffHeaderForm.get('PODTerminal')?.setValue(PODTerminal);
    }
  }

  setChargeCode(chargeCode: any) {
    const requiredCharge = this.chargeList.find(charge => charge.chargeCode === chargeCode);
    // (kept for future use)
  }

  loadTariffDetails() {
    this.masterServ.getAllTariffDetail().subscribe(
      (resp) => {
        const allTariffDetails = resp.data;
        if (this.TariffHeaderSid) {
          this.TariffDetailsList = allTariffDetails.filter(
            tariffDetail => tariffDetail.TariffHeaderSid === this.TariffHeaderSid
          );
        }
        this.totalNumberOfCollection = this.TariffDetailsList.length;
        this.updatePaginationData();
      },
      (error) => {
        console.error('Error Loading All Tariff Details', error);
      }
    );
  }

  toNgbDateStruct(date: Date | null): NgbDateStruct | null {
  if (!date) return null;
  return {
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate()
  };
}

  filterPodList(port: any) {
    if (!port) {
      this.tariffHeaderForm.get('POLTerminal')?.setValue('');
      this.podList = [...(this.filteredPorts || this.portList || [])];
      return;
    }
    this.tariffHeaderForm.get('POLTerminal')?.setValue(port.PortCode);
    this.podList = (this.filteredPorts || this.portList).filter(each => each.PortMasterSid !== port.PortMasterSid);
  }

  filterPolList(port: any) {
    if (!port) {
      this.tariffHeaderForm.get('PODTerminal')?.setValue('');
      this.polList = [...(this.filteredPorts || this.portList || [])];
      return;
    }
    this.tariffHeaderForm.get('PODTerminal')?.setValue(port.PortCode);
    this.polList = (this.filteredPorts || this.portList).filter(each => each.PortMasterSid !== port.PortMasterSid);
  }

  showHeaderInfo() {
    if (!this.tariffData) return;
    const modalRef = this.modalService.open(DetailsComponent, { size: 'lg', centered: true, backdrop: 'static' });
    modalRef.componentInstance.item = this.tariffData;
    modalRef.componentInstance.idLabel = 'Tariff Header Id';
    modalRef.componentInstance.idValue = this.tariffData?.TariffHeaderSid;
  }

  showDetailInfo() {
    if (!this.tariffDetailData) return;
    const modalRef = this.modalService.open(DetailsComponent, { size: 'lg', centered: true, backdrop: 'static' });
    modalRef.componentInstance.item = this.tariffDetailData;
    modalRef.componentInstance.idLabel = 'Tariff Detail Id';
    modalRef.componentInstance.idValue = this.tariffDetailData?.TariffDetailSid;
  }

  openTandC() {
    this.currentMenuId = Number(localStorage.getItem('currentMenuId'));
    const payload = { MenuMasterSid: this.currentMenuId };
    this.masterServ.getTandCByCondition(payload).subscribe(
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
          modalRef.componentInstance.DocumentSid = this.TariffHeaderSid;
        } else {
          this.appSettingServ.showError('Error loading Terms and Conditions');
        }
      },
      (error) => {
        this.appSettingServ.showError('Error loading Terms and Conditions', error);
      }
    );
  }

  openEmail() {
    if (!this.tariffData) return;
    this.modalService.open(EmailEntryComponent, { size: 'lg', centered: true, backdrop: 'static' });
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
    modalRef.componentInstance.documentSid = this.TariffHeaderSid;
  }

  openEDoc() {
    if (!this.tariffData) return;
    this.modalService.open(EdocComponent, { size: 'lg', centered: true, backdrop: 'static' });
  }

  setChargeDetails(charge?: Charge) {
    if (!charge || this.chargeTaxes.length === 0) {
      this.tariffDetailsForm.get('detailDescription')?.setValue('');
      this.tariffDetailsForm.get('detailUOMSid')?.setValue(null);
      return;
    }

    const ChargeMasterSid = (charge as any)?.ChargeMasterSid;
    this.tariffDetailsForm.get('detailUOMSid')?.setValue((charge as any)?.UOM);

    const reqTaxes = this.chargeTaxes.filter(t => t.chargeTaxMasterSid === ChargeMasterSid);
    if (reqTaxes.length > 0) {
      this.tariffDetailsForm.get('detailDescription')?.setValue(reqTaxes[0].description);
    }

    // DO NOT auto-adjust EffectiveDate here (only create flow does that in onChargeCodeChange)
  }

  setEffectiveDateBasedOnChargeCode(chargeCode?: string) {
  if (!chargeCode) {
    this.tariffDetailsForm.get('detailEffectiveDate')?.setValue(null);
    this.minEffectiveFrom = this.toNgbDateStruct(this.todayDate);
    return;
  }

  // Filter only active records with same charge code
  const sameChargeDetails = this.TariffDetailsList.filter(
    detail => detail.ChargeCode === chargeCode && detail.status === 'A'
  );

  if (sameChargeDetails.length === 0) {
    // Different charge code - set to today
    this.tariffDetailsForm.get('detailEffectiveDate')?.setValue(this.todayDate);
    this.minEffectiveFrom = this.toNgbDateStruct(this.todayDate);
  } else {
    // Same charge code - set to next day after last expired date
    const expiredDates = sameChargeDetails.map(detail => new Date(detail.ExpiredOn));
    const maxExpiredDate = new Date(Math.max(...expiredDates.map(date => date.getTime())));
    const nextDay = new Date(maxExpiredDate);
    nextDay.setDate(nextDay.getDate() + 1);
    
    this.tariffDetailsForm.get('detailEffectiveDate')?.setValue(nextDay);
    this.minEffectiveFrom = this.toNgbDateStruct(nextDay);
  }
}
  onChargeCodeChange(chargeCode: string) {
  // Skip auto date logic while editing
  if (this.isModalEditMode) {
    this.setChargeDetails(this.chargeList.find(c => c.chargeCode === chargeCode));
    return;
  }
  
  // CREATE flow - apply the business logic
  this.setEffectiveDateBasedOnChargeCode(chargeCode);
  this.setChargeDetails(this.chargeList.find(c => c.chargeCode === chargeCode));
}

  calculateMinEffectiveFrom(chargeCode?: string) {
  if (!chargeCode) {
    this.minEffectiveFrom = this.toNgbDateStruct(this.todayDate);
    return;
  }

  // Filter only active records
  const sameChargeDetails = this.TariffDetailsList.filter(
    detail => detail.ChargeCode === chargeCode && detail.status === 'A'
  );

  if (sameChargeDetails.length === 0) {
    this.minEffectiveFrom = this.toNgbDateStruct(this.todayDate);
  } else {
    const expiredDates = sameChargeDetails.map(detail => new Date(detail.ExpiredOn));
    const maxExpiredDate = new Date(Math.max(...expiredDates.map(date => date.getTime())));
    const nextDay = new Date(maxExpiredDate);
    nextDay.setDate(nextDay.getDate() + 1);
    this.minEffectiveFrom = this.toNgbDateStruct(nextDay);
  }
}
  effectiveDateValidator(): ValidatorFn {
  return (control: AbstractControl): { [key: string]: any } | null => {
    // Bypass rule in EDIT mode
    if (this.isModalEditMode) return null;

    if (!control.value) return null;

    const chargeCode = control.parent?.get('detailChargeCode')?.value;
    const effectiveDate = new Date(control.value);
    
    if (!chargeCode) return null;

    // Reset time part for accurate date comparison
    effectiveDate.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // For different charge code - must be today or future
    const sameChargeDetails = this.TariffDetailsList.filter(
      detail => detail.ChargeCode === chargeCode && detail.status === 'A'
    );

    if (sameChargeDetails.length === 0) {
      // Different charge code - must be today or future
      if (effectiveDate < today) {
        return { invalidEffectiveDate: 'Effective date cannot be in the past for new charge codes' };
      }
      return null;
    } else {
      // Same charge code - must be next day after last expired date
      const expiredDates = sameChargeDetails.map(detail => new Date(detail.ExpiredOn));
      const maxExpiredDate = new Date(Math.max(...expiredDates.map(date => date.getTime())));
      maxExpiredDate.setHours(0, 0, 0, 0);
      
      const requiredEffectiveDate = new Date(maxExpiredDate);
      requiredEffectiveDate.setDate(requiredEffectiveDate.getDate() + 1);

      if (effectiveDate < requiredEffectiveDate) {
        return {
          invalidEffectiveDate: `Effective date must be ${requiredEffectiveDate.toLocaleDateString()} or later for this charge code`
        };
      }
      return null;
    }
  };
}

  selectTab(tab: string) {
    this.selectedTab = tab;
  }
}
