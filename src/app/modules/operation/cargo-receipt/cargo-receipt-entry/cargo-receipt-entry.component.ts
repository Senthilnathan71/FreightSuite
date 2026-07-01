import { Component, effect, HostListener, OnDestroy, OnInit, TemplateRef } from '@angular/core';
import { FormGroup, FormBuilder, Validators, FormArray, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { NgbModalRef, NgbCalendar, NgbDateAdapter, NgbDateParserFormatter, NgbDatepickerModule, NgbModal, NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectConfig, NgSelectModule } from '@ng-select/ng-select';
import { CustomDatePipe } from 'src/app/core/pipes/custom-date-format.pipe';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { OperationService } from '../../operation.service';
import { DropdownStore } from 'src/app/shared/dropdown/dropdown.store';
import { CustomDateAdapter } from 'src/app/component/datepicker/custom-date-adapter';
import { CustomDateParserFormatter } from 'src/app/component/datepicker/custom-date-parser';
import { CommonModule } from '@angular/common';
import { FeatherModule } from 'angular-feather';
import { Subject } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs/operators';
import { DROPDOWN_CONFIGS } from 'src/app/common/lookup-config';
import { SearchableDropdown } from "src/app/component/searchable-dropdown/searchable-dropdown.component";
import { CommonService } from 'src/app/common/common.service';
import { MenuPermissionService } from 'src/app/core/services/menu-permission.service';
import { MasterService } from 'src/app/modules/master/master.service';
import { DetailsComponent } from 'src/app/component/details/details.component';
import { TermsAndConditionsComponent } from 'src/app/component/terms&conditions/terms&conditions.component';
import { AuthorityEntryComponent } from 'src/app/modules/master/authority/authority-entry/authority-entry.component';
import { EdocComponent } from 'src/app/modules/settings/edoc/edoc/edoc.component';
import { EmailEntryComponent } from 'src/app/modules/settings/email/email-entry/email-entry.component';
import { EmailTriggerService } from 'src/app/modules/email/email-trigger.service';
import { DocReferenceComponent } from '../../doc-reference/doc-reference.component';
import { HasUnsavedChanges } from 'src/app/core/interfaces/has-unsaved-changes.interface';
import { ElementStateGuardDirective } from 'src/app/core/Directives/element-state-guard.directive';
import { FormStateGuardDirective } from 'src/app/core/Directives/form-state-guard.directive';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';

@Component({
  selector: 'app-cargo-receipt-entry',
  standalone: true,
  imports: [
    NgSelectModule,
    FeatherModule,
    NgbDatepickerModule,
    CommonModule,
    ReactiveFormsModule,
    CustomDatePipe,
    FormsModule,
    SearchableDropdown,
    NgbDropdownModule,
    ElementStateGuardDirective,
    FormStateGuardDirective,
    NgxSpinnerModule,
],
  templateUrl: './cargo-receipt-entry.component.html',
  styleUrl: './cargo-receipt-entry.component.scss',
  providers: [
    CustomDatePipe, // ✅ add this line
    { provide: NgbDateAdapter, useClass: CustomDateAdapter },
    { provide: NgbDateParserFormatter, useClass: CustomDateParserFormatter },
  ],
})
export class CargoReceiptEntryComponent implements OnInit, OnDestroy, HasUnsavedChanges {
      private destroy$ = new Subject<void>();
  isDirty = false;
  private initialFormValue: any = null;

  cargoForm!: FormGroup;
  bookingProductsForm!: FormGroup;
  bookingProducts: any[] = [];
  BookingHeaderSid!: number;
  BookingProductSid!: number;
  bookingData: any;
  MenuMasterSid: any;
    currentMenuId: number;
  TandCList: any[]=[];
  currentClauseId: any;
  isEditMode = false;
  modalRef: NgbModalRef;
  today = this.calendar.getToday();
  minDate = this.today;
  todayDate = new Date(this.today.year, this.today.month - 1, this.today.day);
  currentDate = new Date();
  currentCompany: any;
  currentBranch: any;
  cfsList:any[] = [];
  packageTypeList: any[] = [];
  customerLookupConfig = DROPDOWN_CONFIGS.CUSTOMER;
  auditLogs: any[] = []; // Stores audit logs
  auditLogModalRef!: NgbModalRef;

  constructor(
    private config: NgSelectConfig,
    private router: Router,
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private operationService: OperationService,
    private appSettingService: AppSettingsService,
    private calendar: NgbCalendar,
    private datePipe: CustomDatePipe,
    public dropdownStore: DropdownStore,
    public mps: MenuPermissionService,
    private commonService: CommonService,
    private masterService: MasterService,
    private modalService: NgbModal,
    private emailTriggerService: EmailTriggerService,
    private spinner: NgxSpinnerService,
  ) {
    effect(() => {
      const cfsData = this.dropdownStore.customerTypeData();
      this.cfsList = cfsData
    })
    this.initForm();
  }

  copyDocumentNumber(controlName: string, label: string, event?: Event): void {
    event?.preventDefault();
    event?.stopPropagation();
    const documentNo = this.cargoForm?.get(controlName)?.value;
    if (!documentNo) {
      return;
    }
    navigator.clipboard.writeText(String(documentNo)).then(() => {
      this.appSettingService.showSuccess(`${label} copied to clipboard.`);
    });
  }

  ngOnInit(): void {
    this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));
    this.currentBranch = this.appSettingService.decrypt(localStorage.getItem('selected-branch'));
    this.MenuMasterSid =  sessionStorage.getItem('currentMenuId');
      this.mps.init().subscribe();
    this.initForm();
    this.loadAllFields();
    this.route.paramMap.subscribe((param) => {
      this.BookingHeaderSid = +param.get('BookingHeaderSid');
      if (this.BookingHeaderSid) {
        this.isEditMode = true;
        this.loadBooking(this.BookingHeaderSid);
      } else {
        this.initialFormValue = this.cargoForm.getRawValue();
      }
    });
    this.subscribeToFormChanges();
  }

  initForm() {
    this.cargoForm = this.fb.group({
      BookingNo: [''],
      BookingDateTime: [''],
      departmentName: [''],
      CustomerName: [''],
      HBLNo: [''],
      VesselName: [''],
      VoyageNo: [''],
      POO: [''],
      POD: [''],
      POL: [''],
      FPD: [''],
      bookingProducts: this.fb.array([])
    });
  }

  get bookingProductsArray(): FormArray {
    return this.cargoForm.get('bookingProducts') as FormArray;
  }

  // CargoRecDate and CFS are mandatory only when a Recd Pack is entered for that product.
  private setupRecdPackValidation(group: FormGroup): void {
    const recdPackCtrl = group.get('RecdPack');
    const cargoRecDateCtrl = group.get('CargoRecDate');
    const cfsCtrl = group.get('CFS');

    const applyValidators = () => {
      const hasRecdPack = (Number(recdPackCtrl?.value) || 0) > 0;
      if (hasRecdPack) {
        cargoRecDateCtrl?.setValidators([Validators.required]);
        cfsCtrl?.setValidators([Validators.required]);
      } else {
        cargoRecDateCtrl?.clearValidators();
        cfsCtrl?.clearValidators();
      }
      cargoRecDateCtrl?.updateValueAndValidity({ emitEvent: false });
      cfsCtrl?.updateValueAndValidity({ emitEvent: false });
    };

    applyValidators();
    recdPackCtrl?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => applyValidators());
  }

  loadAllFields() {
    const payload = {
      CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
      types: ['cFS']
    }
    this.dropdownStore.loadCustomerTypeData(payload).subscribe();

    // Load package types so the External Pkg id can be shown as its UOM name.
    this.operationService.getUOMsByType('P').subscribe({
      next: (resp: any) => { this.packageTypeList = resp?.data || []; },
      error: () => { this.packageTypeList = []; }
    });
  }

  // Resolve an External Pkg value (stored as a package-type id) to its UOM name.
  getExternalPkgName(value: any): string {
    if (value === null || value === undefined || value === '') {
      return '';
    }
    const match = (this.packageTypeList || []).find(
      (type: any) => String(type?.UOMMasterSid) === String(value)
    );
    return match ? (match.UOMName || match.UOMCode || String(value)) : String(value);
  }


  loadBooking(BookingHeaderSid: number) {
    const CompanyMasterSid = this.currentCompany?.CompanyMasterSid;
    const BranchMasterSid = this.currentBranch?.BranchMasterSid;
    const payload = {
      BookingHeaderSid,
      CompanyMasterSid,
      BranchMasterSid
    };
    this.operationService.getLCLExportBookingById(payload).subscribe({
      next: (resp: any) => {
        if (resp && resp.status === false) {
    this.appSettingService.showError(
      resp.message || 'Access denied.'
    );
    return;
  }
        const booking = resp?.data || resp;
        if (!booking) {
          this.appSettingService.showError('No booking details found.');
          return;
        }

        this.bookingData = booking;

        // Patch main booking info
        this.cargoForm.patchValue({
          BookingNo: booking.BookingNo,
          BookingDateTime: this.formatDateTo_ddMMyyyy(booking.BookingDateTime),
          departmentName: booking.departmentMaster?.departmentName,
          CustomerName: booking.CustomerName,
          HBLNo: booking.HBLNo,
          VesselName: booking.VesselName,
          VoyageNo: booking.VoyageNo,
          POO: booking.POO,
          POD: booking.POD,
          POL: booking.POL,
          FPD: booking.FPD,
        });

        // Clear existing FormArray
        this.bookingProductsArray.clear();

        // Patch booking products
        (booking.bookingProduct || []).forEach(prod => {
          const group = this.fb.group({
            BookingProductSid: [prod.BookingProductSid],
            ProductName: [prod.ProductName],
            ShippingBillNo: [prod.ShippingBillNo],
            ShippingBillDate: [prod.ShippingBillDate ? this.formatDateTo_ddMMyyyy(prod.ShippingBillDate) : ''],
            ExternaPkg: [prod.ExternaPkg],
            ExternlQty: [+prod.ExternlQty || 0, [Validators.required, Validators.pattern("^[0-9]*$")]],
            GrossWeight: [prod.GrossWeight != null ? parseFloat(prod.GrossWeight).toFixed(3) : '0.000', Validators.required],
            NetWeight: [prod.NetWeight != null ? parseFloat(prod.NetWeight).toFixed(3) : '0.000', Validators.required],
            Volume: [prod.Volume != null ? parseFloat(prod.Volume).toFixed(3) : '0.000', Validators.required],
            // CargoRecDate / CFS are required only when RecdPack is entered — see setupRecdPackValidation.
            CargoRecDate: [(prod.CargoRecDate ? new Date(prod.CargoRecDate) : null) || null],
            CFS: [prod.CFS],
            RecdPack: [+prod.RecdPack || 0, [Validators.required, Validators.pattern("^[0-9]*$")]],
          });
          this.setupRecdPackValidation(group);
          this.bookingProductsArray.push(group);
        });

        this.initialFormValue = this.cargoForm.getRawValue();
        this.isDirty = false;
      },
      error: err => {
        console.error('Error loading booking:', err);
        this.appSettingService.showError('Error loading booking details.');
      }
    });
  }


  save() {
    this.saveWithCallback();
  }

  async saveChanges(): Promise<boolean> {
    return new Promise((resolve) => {
      this.saveWithCallback(resolve);
    });
  }

  private saveWithCallback(resolve?: (value: boolean) => void): void {
    const raw = this.cargoForm.getRawValue();
    if (this.deepEqual(raw, this.initialFormValue) && !this.isDirty) {
      this.appSettingService.showWarning('No changes to save');
      this.cargoForm.markAsUntouched();
      if (resolve) resolve(false);
      return;
    }

    if (this.cargoForm.invalid) {
      this.cargoForm.markAllAsTouched();
      this.appSettingService.showWarning('Please fill all required fields correctly.');
      if (resolve) resolve(false);
      return;
    }

    const currUserEmail = this.appSettingService.userSettingSource.value['userEmail'];

    const payload = this.bookingProductsArray.controls.map(control => {
      const value = control.value;
      return {
        BookingProductSid: value.BookingProductSid,
        ProductName: value.ProductName,
        ShippingBillNo: value.ShippingBillNo,
        ShippingBillDate: value.ShippingBillDate,
        ExternaPkg: value.ExternaPkg,
        ExternlQty: Number(value.ExternlQty),
        GrossWeight: value.GrossWeight,
        NetWeight: value.NetWeight,
        Volume: value.Volume,
        CargoRecDate: value.CargoRecDate,
        CFS: value.CFS,
        RecdPack: Number(value.RecdPack),
        updatedBy: currUserEmail
      };
    });

    console.log('Sending payload:', JSON.stringify(payload, null, 2));

    this.operationService.updateBookingProductsById(this.BookingHeaderSid, payload).subscribe({
      next: (resp: any) => {
        console.log('Full server response:', resp);
        console.log('Response status:', resp?.status);
        console.log('Response message:', resp?.message);
        console.log('Response data:', resp?.data);

        if (resp && resp.status === true) {
          this.initialFormValue = this.cargoForm.getRawValue();
          this.isDirty = false;
          this.appSettingService.showSuccess('Cargo receipt saved successfully.');
          this.router.navigate(['/operation/cargo-receipt/list']);
          if (resolve) resolve(true);
        } else {
          const errorMessage = resp?.message || 'Unknown error occurred';
          console.error('Error response:', resp);
          this.appSettingService.showError(errorMessage);
          if (resolve) resolve(false);
        }
      },
      error: (err) => {
        console.error('HTTP error details:', err);
        console.error('Error status:', err.status);
        console.error('Error message:', err.message);
        console.error('Error response body:', err.error);

        const errorMessage = err.error?.message || err.message || 'Something went wrong';
        this.appSettingService.showError(errorMessage);
        if (resolve) resolve(false);
      },
    });
  }


  goBack() {
    this.router.navigate(['operation/cargo-receipt/list']);
  }

  resetForm() {
    // If editing an existing booking, reload it (restore original state)
    if (this.isEditMode && this.BookingHeaderSid) {
      this.loadBooking(this.BookingHeaderSid);
      return;
    }

    // Create-mode: reset form to initial state
    this.cargoForm.reset({
      BookingNo: '',
      BookingDateTime: '',
      departmentName: '',
      CustomerName: '',
      HBLNo: '',
      VesselName: '',
      VoyageNo: '',
      POO: '',
      POD: '',
      POL: '',
      FPD: ''
    });

    // Clear the booking products array
    this.bookingProductsArray.clear();

    // Reset any additional state variables if needed
    this.bookingData = null;
    this.BookingProductSid = null;
    this.initialFormValue = this.cargoForm.getRawValue();
    this.isDirty = false;
  }



  formatDateForInput(date: any): string {
    const d = new Date(date);
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    const year = d.getFullYear();
    return `${year}-${month}-${day}`; // yyyy-MM-dd format for <input type="date">
  }

  formatDateTo_ddMMyyyy(date: any): string {
    if (!date) return '';

    const d = new Date(date);
    const day = d.getDate().toString().padStart(2, '0');
    const monthNames = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN",
      "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
    const month = monthNames[d.getMonth()];
    const year = d.getFullYear();

    return `${day}-${month}-${year}`; // 10-JAN-2025
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

  private subscribeToFormChanges(): void {
    this.cargoForm.valueChanges
      .pipe(takeUntil(this.destroy$), debounceTime(300))
      .subscribe(() => {
        this.isDirty = !this.deepEqual(this.initialFormValue, this.cargoForm.getRawValue());
      });
  }

  private normalizeValue(value: any): any {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    if (value instanceof Date) {
      return value.toISOString().split('T')[0];
    }

    if (typeof value === 'string' && value.trim() !== '' && !isNaN(+value)) {
      return Number(value);
    }

    if (typeof value === 'number') {
      return Number(value.toFixed(6));
    }

    if (Array.isArray(value)) {
      return value.map(v => this.normalizeValue(v));
    }

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
    const normalizedObj1 = this.normalizeValue(obj1);
    const normalizedObj2 = this.normalizeValue(obj2);
    return JSON.stringify(normalizedObj1) === JSON.stringify(normalizedObj2);
  }

  ngOnDestroy(): void {
    this.dropdownStore.clearCache()
    this.destroy$.next();
    this.destroy$.complete();
  }

  showInfo() {
        if(!this.bookingData) return;
        const modalRef = this.modalService.open(DetailsComponent, { size: 'lg', centered: true, backdrop: 'static' });
        modalRef.componentInstance.item = this.bookingData;
        modalRef.componentInstance.idLabel = 'Cargo Receipt Id';
        modalRef.componentInstance.idValue = this.bookingData?.BookingHeaderSid;
      }
      // openTandC() {
      //   this.currentMenuId = Number(sessionStorage.getItem('currentMenuId'));
      //   const departmentSid = this.bookingData?.departmentMaster?.DepartmentMasterSid;
      //   const pol = this.bookingData?.POL;
      //   const pod = this.bookingData?.POD;
      //   const fdc = this.bookingData?.FPD;
      //   const payload = { 
      //     MenuMasterSid: this.currentMenuId,
      //     DepartmentMasterSid: departmentSid,
      //     POL: pol,
      //     POD: pod,
      //     FDC: fdc,
      //    };
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
      //         modalRef.componentInstance.DocumentSid = this.currentClauseId;
      //         modalRef.componentInstance.DepartmentMasterSid = departmentSid;
      //         modalRef.componentInstance.POL = pol;
      //         modalRef.componentInstance.POD = pod;
      //         modalRef.componentInstance.FDC = fdc;
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
      if (!this.bookingData) return;
      const modalRef = this.modalService.open(EmailEntryComponent, { 
        size: 'lg', 
        centered: true, 
        backdrop: 'static' 
      });
      modalRef.componentInstance.item = this.bookingData;
      modalRef.componentInstance.idLabel = 'Cargo Receipt Id';
      modalRef.componentInstance.idValue = this.bookingData?.BookingHeaderSid;
    }
    
    openAuthority() {
      if (!this.bookingData) return;
      const modalRef = this.modalService.open(AuthorityEntryComponent, { 
        size: 'lg', 
        centered: true, 
        backdrop: 'static' 
      });
      modalRef.componentInstance.item = this.bookingData;
      modalRef.componentInstance.idLabel = 'Cargo Receipt Id';
      modalRef.componentInstance.idValue = this.bookingData?.BookingHeaderSid;
    }
    
    openEDoc() {
      if (!this.bookingData) return;
      const modalRef = this.modalService.open(EdocComponent, { 
        size: 'lg', 
        centered: true, 
        backdrop: 'static' 
      });
      modalRef.componentInstance.item = this.bookingData;
      modalRef.componentInstance.idLabel = 'Cargo Receipt Id';
      modalRef.componentInstance.idValue = this.bookingData.BookingHeaderSid;
    const data:any={
        CompanyMasterSid: this.currentCompany.CompanyMasterSid,
        BranchMasterSid: this.currentBranch.BranchMasterSid,
        MenuMasterSid : this.MenuMasterSid,
        DocumentSid: this.bookingData?.BookingHeaderSid
      }
    
          this.commonService.documentData.set(data)
    }

    openDocRef() {
    const currentMenuId = this.bookingData?.MenuMasterSid;
    const modalRef = this.modalService.open(DocReferenceComponent, {
      size: 'lg',
      centered: true,
      backdrop: 'static'
    });
  
    modalRef.componentInstance.CompanyMasterSid = this.currentCompany.CompanyMasterSid;
    modalRef.componentInstance.BranchMasterSid = this.currentBranch.BranchMasterSid;
    modalRef.componentInstance.MenuMasterSid = Number(this.MenuMasterSid);
    modalRef.componentInstance.DocumentSid = this.bookingData?.BookingHeaderSid;
  }
  
    openFollowup() {

    }

  async sendManualMail(): Promise<void> {
    this.spinner.show();
    const menuMasterSid = this.currentMenuId || Number(this.MenuMasterSid || sessionStorage.getItem('currentMenuId'));
    const customerBranchSid =
      this.bookingData?.CustomerBranchSid ||
      this.bookingData?.customerBranch?.CustomerBranchSid ||
      this.bookingData?.CustomerBranch?.CustomerBranchSid ||
      null;
    const customerMasterSid =
      this.bookingData?.CustomerMasterSid ||
      this.bookingData?.customerMaster?.CustomerMasterSid ||
      this.bookingData?.CustomerMaster?.CustomerMasterSid ||
      this.bookingData?.customerBranch?.CustomerMasterSid ||
      this.bookingData?.CustomerBranch?.CustomerMasterSid ||
      null;
    const recipients = await this.emailTriggerService.resolveCustomerBranchEmailRecipientsByMenu({
      customerBranchSid,
      customerMasterSid,
      menuMasterSid
    });
    const organizationEmail = recipients.toEmail.join(', ');
    const ccEmail = Array.from(
      new Set(
        (recipients.ccEmail || [])
          .filter((email): email is string => !!email)
          .map(email => email.trim())
      )
    ).join(', ');

    this.emailTriggerService.triggerManualEmails({
      companyId: this.currentCompany?.CompanyMasterSid,
      branchId: this.currentBranch?.BranchMasterSid,
      menuMasterSid,
      action: 'UPDATE',
      context: {
        allowManualEmailEntry: true,
        requireToEmail: false,
        menuMasterSid,
        resourceSid: this.bookingData?.BookingHeaderSid || this.BookingHeaderSid,
        toEmail: organizationEmail,
        ccEmail,
        organizationEmail,
        customerEmail: organizationEmail,
        customerBranchSid,
        customerMasterSid
      }
    });
    this.spinner.hide();
  }

}
