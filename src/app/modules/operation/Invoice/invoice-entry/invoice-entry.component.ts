
import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import {
  FormBuilder,
  FormGroup,
  FormArray,
  Validators,
  AbstractControl,
  ReactiveFormsModule,
  FormsModule
} from '@angular/forms';
import { NgbModal, NgbDatepickerModule } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { FeatherModule } from 'angular-feather';
import { CommonModule } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';

import { OperationService } from 'src/app/modules/operation/operation.service';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { CompanySettingsManagerService } from 'src/app/core/services/company-settings-manager.service';
import { NumberFormatPipe } from 'src/app/core/pipes/number-format.pipe';

interface NgbDateStructLike { day: number; month: number; year: number; }

@Component({
  selector: 'app-invoice-entry',
  standalone: true,
  imports: [
    CommonModule,
    NgSelectModule,
    FeatherModule,
    NgbDatepickerModule,
    ReactiveFormsModule,
    FormsModule,
    NgxSpinnerModule,
    NumberFormatPipe
  ],
  templateUrl: './invoice-entry.component.html',
  styleUrls: ['./invoice-entry.component.scss'],
})
export class InvoiceEntryComponent implements OnInit {
  invoiceForm!: FormGroup;
  headerId: number | null = null;
  currentCompany: any;
  currentBranch: any;

  // current user email to send CreatedBy / UpdatedBy
  currUserEmail: string | null = null;
  get isEditMode() { return !!this.headerId; }

  // lookups
  customerList: any[] = [];
  customerBranchList: any[] = [];
  currencyList: any[] = [];
  chargeList: any[] = [];
  hssacList: any[] = [];
  subledgerList: any[] = [];
  uomList: any[] = []; // <-- NEW: UOM lookup
  voucherTypesList: any[] = [
    { id: '1', name: 'Type 1' },
    { id: '2', name: 'Type 2' },
    { id: '3', name: 'Type 3' },
  ];

  // master jobs
  masterJobList: any[] = [];
  houseJobListByMasterJob: { [key: number]: any[] } = {};

  // UI state
  selectedTab = 'Invoice';
  selectTab(tab: string): void {
    this.selectedTab = tab;
  }
  tabs = [
    { name: 'Invoice', icon: 'fas fa-file-invoice' },
    { name: 'Others', icon: 'fas fa-ellipsis-h' }
  ];

  ModeofStatus = [
    { id: 'A', name: 'Active' },
    { id: 'S', name: 'Suspended' },
  ];

  invoiceTypes = [
    { id: 'REG', name: 'Regular' },
    { id: 'REIMB', name: 'Reimbursement' },
    { id: 'BOS', name: 'Bill of Supply' },
    { id: 'NONGST', name: 'Non GST/Zero' },
  ];

  bookingModeCountry: string = '';

  private pendingBranchToSelect: number | null = null;

  get f(): { [key: string]: AbstractControl } {
    return this.invoiceForm.controls;
  }
  get details(): FormArray {
    return this.invoiceForm.get('voucherDetails') as FormArray;
  }

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private modalService: NgbModal,
    private operationService: OperationService,
    private appSettingService: AppSettingsService,
    private spinner: NgxSpinnerService,
    private companySettings: CompanySettingsManagerService
  ) {}

  ngOnInit(): void {
    try {
      this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));
      this.currentBranch = this.appSettingService.decrypt(localStorage.getItem('selected-branch'));
    } catch (e) {
      this.currentCompany = null;
      this.currentBranch = null;
    }

    this.initForm();
    this.loadLookups();

    try {
      const profile = (this.appSettingService as any).getProfile ? (this.appSettingService as any).getProfile() : null;
      const decryptedProfileRaw = localStorage.getItem('user-profile');
      const decryptedProfile = decryptedProfileRaw ? this.appSettingService.decrypt(decryptedProfileRaw) : null;
      this.currUserEmail = profile?.email || decryptedProfile?.email || localStorage.getItem('user-email') || null;
    } catch (err) {
      this.currUserEmail = localStorage.getItem('user-email') || null;
    }

    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (id) {
        this.headerId = Number(id);
        this.loadInvoiceById(this.headerId);
      } else {
        // New invoice - set default currency from company config
        const currencySettings = this.companySettings.getCurrencySettings();
        this.invoiceForm.patchValue({
          PartyMasterSid: 3,
          CurrencyCode: currencySettings.code,
          ExchangeRate: 1 // Home currency always has exchange rate of 1
        });
      }
    });

    this.invoiceForm.get('CurrencyCode')?.valueChanges.subscribe(() => {
      this.recalculateAllRows();
    });

    this.invoiceForm.get('ExchangeRate')?.valueChanges.subscribe(() => {
      this.recalculateAllRows();
    });
  }

  initForm() {
    this.invoiceForm = this.fb.group({
      VoucherNumber: [{ value: '', disabled: true }],
      VoucherDate: [null, Validators.required],
      CustomerMasterSid: [null],
      PartyMasterSid: [null],
      PartyName: [null, Validators.required],
      PartyAddress: [{ value: '', disabled: true }, Validators.required],
      DocumentNumber: [''],
      IRNNumber: [''],
      MasterJobSid: [''],
      HBLNo: [''],
      CurrencyCode: ['', Validators.required],
      ExchangeRate: [1, [Validators.required, Validators.min(0)]],
      GSTNo: [''],
      InvoiceType: [null],
      VoucherType: [1],
      Narration: ['hi'],
      Remarks: [''],
      IRNStatus: [''],
      MBLNo: [{ value: '', disabled: true }],
      status: ['A', Validators.required],
      voucherOthers: this.fb.group({
        ContainerNumber: [''],
        VoucherNote: [''],
        Footer: [''],
        ReverseCreditNote: [''],
        DueDate: [null],
        IRNNumber: [''],
        IRNStatus: [''],
        IRNQRCode: [''],
        VoucherReverseSid: [null]
      }),
      voucherDetails: this.fb.array([]),
    });
  }

  async loadLookups() {
    try {
      this.spinner.show();

      const companyRaw = localStorage.getItem('selected-company');
      const company = companyRaw ? this.appSettingService.decrypt(companyRaw) : null;
      const filterOption = { CompanyMasterSid: company?.CompanyMasterSid, BranchMasterSid: company?.BranchMasterSid };

      const countryName = company?.countryName || company?.country?.countryName;
      this.bookingModeCountry = countryName ? String(countryName).trim().toLowerCase() : '';

      try {
        const custResp: any = await firstValueFrom(this.operationService.getAllCustomerRelatedLookups(filterOption));
        this.customerList = custResp?.customers || [];
      } catch (e) {
        this.customerList = [];
      }

      try {
        const currencies: any = await firstValueFrom(this.operationService.getAllCurrencies().pipe());
        this.currencyList = (currencies && currencies.data) ? currencies.data : [];
      } catch (e) {
        this.currencyList = [];
      }

      try {
        this.chargeList = await firstValueFrom(this.operationService.getAllCharges(company?.CompanyMasterSid));
      } catch (e) {
        this.chargeList = [];
      }

      try {
        const hs: any = await firstValueFrom(this.operationService.getAllHssac());
        this.hssacList = hs || [];
      } catch (e) {
        this.hssacList = [];
      }

      try {
        const subledgers: any = await firstValueFrom(this.operationService.getAllSuledgermaster());
        this.subledgerList = subledgers || [];
      } catch (e) {
        this.subledgerList = [];
      }

      // NEW: load UOM list
      try {
        const uoms: any = await firstValueFrom(this.operationService.getAllUom());
        if (uoms && Array.isArray(uoms)) this.uomList = uoms;
        else if (uoms && Array.isArray((uoms as any).data)) this.uomList = (uoms as any).data;
        else this.uomList = uoms || [];
      } catch (e) {
        this.uomList = [];
      }

      // load master jobs for dropdown
      try {
        await this.loadMasterJobs();
      } catch (e) {
        // handled in loadMasterJobs
      }

      this.spinner.hide();
    } catch (error) {
      this.spinner.hide();
      console.error('Error loading lookups', error);
      this.appSettingService.showError('Error loading lookups.');
    }
  }

  async loadMasterJobs() {
    try {
      const companyRaw = localStorage.getItem('selected-company');
      const company = companyRaw ? this.appSettingService.decrypt(companyRaw) : null;

      const payload = {
        CompanyMasterSid: company?.CompanyMasterSid,
        BranchMasterSid: company?.BranchMasterSid,
        limit: 200,
        offset: 0
      };

      const resp: any = await firstValueFrom(this.operationService.getAllMasterJobs(payload));
      let items: any[] = [];
      if (resp?.data && Array.isArray(resp.data)) {
        items = resp.data;
      } else if (Array.isArray(resp)) {
        items = resp;
      } else if (resp?.data?.data && Array.isArray(resp.data.data)) {
        items = resp.data.data;
      }

      this.masterJobList = items.map((it: any) => {
        const mj = {
          ...it,
          MasterJobSid: it.MasterJobSid ?? it.masterJobSid ?? it.MasterJobId ?? null,
          MasterJobNumber: it.MasterJobNumber ?? it.masterJobNumber ?? it.JobNumber ?? it.JobNo ?? '',
          MBLNo: it.MBLNo ?? it.mblNo ?? it.MBL ?? '',
          HBLNo: it.HBLNo ?? it.hblNo ?? it.HouseJob ?? '',
        };
        mj.displayLabel = `${mj.MasterJobNumber || ('#' + (mj.MasterJobSid ?? ''))}`;
        return mj;
      });
    } catch (err) {
      console.error('Error loading master jobs', err);
      this.masterJobList = [];
    }
  }

  onCustomerMasterChange(selected: any) {
    const customerMasterSid = (typeof selected === 'object' && selected !== null)
      ? (selected.CustomerMasterSid ?? selected)
      : selected;
    if (!customerMasterSid) {
      this.customerBranchList = [];
      this.invoiceForm.get('PartyName')?.setValue(null);
      this.invoiceForm.get('PartyAddress')?.setValue('');
      this.invoiceForm.get('PartyMasterSid')?.setValue(null);
      return;
    }

    this.pendingBranchToSelect = null;
    this.getCustomerBranchByCustomer(Number(customerMasterSid));
    this.invoiceForm.get('PartyName')?.setValue(null);
    this.invoiceForm.get('PartyAddress')?.setValue('');

    const customer = this.customerList.find(c => c.CustomerMasterSid === customerMasterSid);
    if (customer && customer.SubledgerMasterSid) {
      this.invoiceForm.get('PartyMasterSid')?.setValue(Number(customer.SubledgerMasterSid));
    } else {
      const sub = this.subledgerList.find(s => s.CustomerMasterSid === customerMasterSid);
      if (sub && sub.SubledgerMasterSid) {
        this.invoiceForm.get('PartyMasterSid')?.setValue(Number(sub.SubledgerMasterSid));
      }
    }
  }

  onBranchChange(selectedBranch: any) {
    const branchSid = (typeof selectedBranch === 'object' && selectedBranch !== null)
      ? (selectedBranch.CustomerBranchSid ?? selectedBranch)
      : selectedBranch;

    if (!branchSid) {
      // clear the branch selection & dependent values
      this.invoiceForm.get('PartyAddress')?.setValue('');
      this.invoiceForm.get('CustomerBranchSid')?.setValue(null);
      this.invoiceForm.get('PartyName')?.setValue(null); // set null (not empty string)
      return;
    }

    const found = this.customerBranchList.find(b => Number(b.CustomerBranchSid) === Number(branchSid));
    if (found) {
      // IMPORTANT: PartyName holds the CustomerBranchSid (ng-select bindValue), not the display name
      this.invoiceForm.get('CustomerBranchSid')?.setValue(Number(branchSid));
      this.invoiceForm.get('PartyName')?.setValue(Number(branchSid)); // set id so ng-select shows it as selected
      this.invoiceForm.get('PartyAddress')?.setValue(found.Address || found.CustomerAddress1 || '');

      if (found.SubledgerMasterSid) {
        this.invoiceForm.get('PartyMasterSid')?.setValue(Number(found.SubledgerMasterSid));
      }
    } else {
      // if branch not found in current list, still set the control to the id (so ng-select can show emptiness)
      this.invoiceForm.get('PartyName')?.setValue(Number(branchSid));
      this.invoiceForm.get('PartyAddress')?.setValue('');
    }
  }
  getCustomerBranchByCustomer(CustomerMasterSid: number) {
    if (!CustomerMasterSid) {
      this.customerBranchList = [];
      return;
    }
    this.operationService.getCustomerBranchByCustomer(CustomerMasterSid).subscribe({
      next: (resp: any) => {
        if (resp?.status && resp.data) {
          this.customerBranchList = Array.isArray(resp.data) ? resp.data : resp.data;
        } else if (Array.isArray(resp)) {
          this.customerBranchList = resp;
        } else if (resp?.data) {
          this.customerBranchList = resp.data;
        } else {
          this.customerBranchList = [];
        }

        if (this.pendingBranchToSelect) {
          const branchId = this.pendingBranchToSelect;
          this.pendingBranchToSelect = null;
          const found = this.customerBranchList.find((b: any) => Number(b.CustomerBranchSid) === Number(branchId));
          this.invoiceForm.get('PartyName')?.setValue(branchId);
          if (found) {
            this.invoiceForm.get('PartyAddress')?.setValue(found.Address || found.CustomerAddress1 || '');
            if (found.SubledgerMasterSid) this.invoiceForm.get('PartyMasterSid')?.setValue(Number(found.SubledgerMasterSid));
          }
        }
      },
      error: (err) => {
        console.error('Error fetching customer branches', err);
        this.customerBranchList = [];
      }
    });
  }

  loadInvoiceById(id: number) {
    this.operationService.getInvoiceById(id).subscribe({
      next: (resp: any) => {
        if (resp?.status && resp.data) {
          this.patchValues(resp.data);
        } else {
          this.appSettingService.showError('Error loading invoice');
        }
      },
      error: (err) => {
        console.error(err);
        this.appSettingService.showError('Error loading invoice');
      },
    });
  }

  private toNgbDate(d: any): NgbDateStructLike | null {
    if (!d) return null;
    const dt = (typeof d === 'string' || typeof d === 'number') ? new Date(d) : d instanceof Date ? d : new Date(d);
    if (isNaN(dt.getTime())) return null;
    return { year: dt.getFullYear(), month: dt.getMonth() + 1, day: dt.getDate() };
  }

  private fromNgbDate(s: NgbDateStructLike | null): Date | null {
    if (!s || !s.year) return null;
    return new Date(s.year, (s.month || 1) - 1, s.day || 1);
  }

  patchValues(data: any) {
    const header = data;
    const voucherTypeForControl = header?.VoucherType != null ? [String(header.VoucherType)] : null;

    const customerMasterSidFromBranch = header?.customerBranch?.CustomerMasterSid
      || header?.CustomerBranch?.CustomerMasterSid
      || null;

    this.invoiceForm.patchValue({
      VoucherNumber: header.VoucherNumber,
      VoucherDate: this.toNgbDate(header.VoucherDate),
      CustomerMasterSid: header.CustomerMasterSid || customerMasterSidFromBranch || null,
      PartyMasterSid: header.PartyMasterSid || null,
      PartyName: header.PartyName || '',
      PartyAddress: header.PartyAddress || '',
      DocumentNumber: header.DocumentNumber || '',
      IRNNumber: header.IRNNumber || '',
      MasterJobSid: header.MasterJobSid || null,
      HBLNo: header.HouseJob || header.HBLNo || '',
      CurrencyCode: header.currencyMaster?.currencyCode || header.CurrencyCode || null,
      ExchangeRate: header.ExchangeRate || header.ExRate || 1,
      GSTNo: header.GSTNo || '',
      InvoiceType: header.InvoiceType || null,
      VoucherType: voucherTypeForControl,
      Narration: header.Narration || '',
      Remarks: header.Remarks || '',
      IRNStatus: header.IRNStatus || '',
      MBLNo: header.MBLNo || '',
      status: header.status || 'A'
    });

    const cm = header.CustomerMasterSid || customerMasterSidFromBranch || null;
    const branchSid = header.CustomerBranchSid || header.PartyName || (header.customerBranch ? header.customerBranch.CustomerBranchSid : null) || null;

    if (cm) {
      this.pendingBranchToSelect = branchSid ? Number(branchSid) : null;
      this.getCustomerBranchByCustomer(cm);
    } else if (branchSid) {
      this.pendingBranchToSelect = Number(branchSid);
      const currentCustomer = this.invoiceForm.get('CustomerMasterSid')?.value;
      if (currentCustomer) {
        this.getCustomerBranchByCustomer(Number(currentCustomer));
      } else {
        const found = this.customerBranchList.find((b: any) => Number(b.CustomerBranchSid) === Number(branchSid));
        if (found) {
          this.invoiceForm.get('PartyName')?.setValue(Number(branchSid));
          this.invoiceForm.get('PartyAddress')?.setValue(found.Address || found.CustomerAddress1 || '');
        }
      }
    }

    const detailsFromResp = data.voucherDetails
      || data.voucherDetail
      || data.VoucherDetail
      || data.VoucherDetails
      || [];

    this.details.clear();
    for (const det of detailsFromResp) {
      // Tax logic: If TaxPercentage2 is 0/null, then TaxPercentage1 is IGST
      // Otherwise TaxPercentage1 is CGST and TaxPercentage2 is SGST
      const taxPerc2 = det.TaxPercentage2 != null ? Number(det.TaxPercentage2) : 0;
      const taxAmt2 = det.TaxAmount2 != null ? Number(det.TaxAmount2) : 0;
      const taxPerc1 = det.TaxPercentage1 != null ? Number(det.TaxPercentage1) : 0;
      const taxAmt1 = det.TaxAmount1 != null ? Number(det.TaxAmount1) : 0;

      const isIGST = taxPerc2 === 0 && taxAmt2 === 0 && (taxPerc1 > 0 || taxAmt1 > 0);

      this.details.push(this.createDetailGroup({
        ChargeMasterSid: det.ChargeMasterSid,
        ChargeDescription: det.ChargeDescription,
        HSSACMasterSid: det.HSSACMasterSid,
        ChargeUOMSid: det.ChargeUOMSid,
        NumberOfUnit: det.NumberOfUnit,
        DrCr: det.DrCr,
        CurrencyCode: det.CurrencyCode || this.invoiceForm.get('CurrencyCode')?.value,
        Rate: det.Rate,
        ExchangeRate: det.ExchangeRate || this.invoiceForm.get('ExchangeRate')?.value,
        Amount: det.Amount,
        TaxableAmount: det.TaxableAmount,
        // If IGST (Tax2 is 0), clear CGST/SGST and populate IGST
        TaxPercentage1: isIGST ? 0 : taxPerc1,
        TaxAmount1: isIGST ? 0 : taxAmt1,
        TaxPercentage2: isIGST ? 0 : taxPerc2,
        TaxAmount2: isIGST ? 0 : taxAmt2,
        TaxPercentageIGST: isIGST ? taxPerc1 : 0,
        TaxAmountIGST: isIGST ? taxAmt1 : 0,
        LocalAmount: det.LocalAmount,
        MasterJobSid: det.MasterJobSid,
        HouseJobSid: det.HouseJobSid
      }));
    }

    // Don't recalculate when loading existing invoice - preserve the stored tax amounts

    const voucherOthersSource = (data.VoucherOthers && Array.isArray(data.VoucherOthers)) ? data.VoucherOthers[0]
      : data.VoucherOthers || data.voucherOthers || (Array.isArray(data.voucherOthers) ? data.voucherOthers[0] : undefined);

    const vg = this.invoiceForm.get('voucherOthers') as FormGroup;
    if (voucherOthersSource) {
      vg.patchValue({
        ContainerNumber: voucherOthersSource.ContainerNumber || '',
        VoucherNote: voucherOthersSource.VoucherNote || '',
        Footer: voucherOthersSource.Footer || '',
        ReverseCreditNote: voucherOthersSource.ReverseCreditNote || '',
        DueDate: this.toNgbDate(voucherOthersSource.DueDate),
        IRNNumber: voucherOthersSource.IRNNumber || voucherOthersSource.IRNNo || '',
        IRNStatus: voucherOthersSource.IRNStatus || '',
        IRNQRCode: voucherOthersSource.IRNQRCode || ''
      });
    } else {
      vg.reset({
        ContainerNumber: '',
        VoucherNote: '',
        Footer: '',
        ReverseCreditNote: '',
        DueDate: null,
        IRNNumber: '',
        IRNStatus: '',
        IRNQRCode: '',
        VoucherReverseSid: null
      });
    }
  }

  addDetailRow() {
    this.details.push(this.createDetailGroup());
  }

  createDetailGroup(data?: any): FormGroup {
    return this.fb.group({
      ChargeMasterSid: [data?.ChargeMasterSid || null, Validators.required],
      ChargeDescription: [data?.ChargeDescription || ''],
      HSSACMasterSid: [data?.HSSACMasterSid || null],
      ChargeUOMSid: [data?.ChargeUOMSid || null], // will hold the UOM id (UOMMasterSid)
      NumberOfUnit: [data?.NumberOfUnit || 1, [Validators.required, Validators.min(0)]],
      DrCr: [data?.DrCr || 'Cr', Validators.required], // Default to Cr for Invoice (revenue)
      CurrencyCode: [data?.CurrencyCode || this.invoiceForm.get('CurrencyCode')?.value || null],
      Rate: [data?.Rate || 0, [Validators.required, Validators.min(0)]],
      ExchangeRate: [data?.ExchangeRate || this.invoiceForm.get('ExchangeRate')?.value || 1],
      Amount: [data?.Amount || 0],
      TaxableAmount: [data?.TaxableAmount || 0],
      TaxPercentage1: [data?.TaxPercentage1 || 0],
      TaxAmount1: [data?.TaxAmount1 || 0],
      TaxPercentage2: [data?.TaxPercentage2 || 0],
      TaxAmount2: [data?.TaxAmount2 || 0],
      TaxPercentageIGST: [data?.TaxPercentageIGST || 0],
      TaxAmountIGST: [data?.TaxAmountIGST || 0],
      LocalAmount: [data?.LocalAmount || 0],
      MasterJobSid: [data?.MasterJobSid || null],
      HouseJobSid: [data?.HouseJobSid || null]
    });
  }

  removeDetailRow(index: number) {
    if (this.details.length > index) this.details.removeAt(index);
    this.recalculateAllRows();
  }

  onDetailChange(index: number, field?: string) {
    if (['NumberOfUnit', 'Rate', 'ExchangeRate', 'TaxPercentage1', 'TaxPercentage2', 'TaxPercentageIGST', 'CurrencyCode'].includes(field || '')) {
      this.recalcRow(index);
    } else if (field === 'ChargeMasterSid') {
      const chargeSid = this.details.at(index).get('ChargeMasterSid')?.value;
      const selectedCharge = this.chargeList?.find((c: any) => c.ChargeMasterSid === chargeSid);
      if (selectedCharge) {
        const description = selectedCharge.ChargeDescription || selectedCharge.chargeName || selectedCharge.ChargeName || '';

        let hssacId = selectedCharge.HSSACMasterSid ?? selectedCharge.HSSACMasterSid ?? null;
        if (!hssacId && Array.isArray(selectedCharge.chargeTaxMaster) && selectedCharge.chargeTaxMaster.length > 0) {
          const firstTax = selectedCharge.chargeTaxMaster[0];
          hssacId = firstTax?.ChargeTaxMasterSid ?? firstTax?.chargeTaxMasterSid ?? null;
        }

        const chargeUomId = selectedCharge.ChargeUOMSid ?? selectedCharge.UOM ?? selectedCharge.UOMMasterSid ?? null;

        this.details.at(index).patchValue({
          ChargeDescription: description,
          HSSACMasterSid: hssacId || null,
          ChargeUOMSid: chargeUomId || null,
          Rate: selectedCharge.DefaultRate || selectedCharge.Rate || this.details.at(index).get('Rate')?.value || 0
        });

        this.recalcRow(index);
      }
    }
  }

  recalcRow(index: number) {
    const row = this.details.at(index);
    if (!row) return;
    const val = row.value;

    const unit = Number(val.NumberOfUnit || 0);
    const rate = Number(val.Rate || 0);
    const exRateRow = Number(val.ExchangeRate || this.invoiceForm.get('ExchangeRate')?.value || 1);

    const amount = unit * rate;
    const localAmount = amount * (exRateRow || 1);

    const companyRaw = localStorage.getItem('selected-company');
    const company = companyRaw ? this.appSettingService.decrypt(companyRaw) : null;
    const loginBranchState = company?.stateName || company?.branchState || '';
    const partyBranchId = this.invoiceForm.get('PartyName')?.value;
    const party = this.customerBranchList.find((b: any) => b.CustomerBranchSid === partyBranchId);
    const partyState = party?.StateName || party?.stateName || '';

    let taxPerc1 = 0, taxAmt1 = 0, taxPerc2 = 0, taxAmt2 = 0, igstPerc = 0, igstAmt = 0;

    if (this.bookingModeCountry === 'india') {
      const isSameState = loginBranchState && partyState && (String(loginBranchState).trim().toLowerCase() === String(partyState).trim().toLowerCase());
      const isUnionTerritory = (loginBranchState && String(loginBranchState).toLowerCase().includes('union'));
      const configuredCGST = Number(row.get('TaxPercentage1')?.value || 0);
      const configuredSGST = Number(row.get('TaxPercentage2')?.value || 0);
      const configuredIGST = Number(row.get('TaxPercentageIGST')?.value || 0);

      if (isUnionTerritory) {
        taxPerc1 = configuredCGST;
        taxAmt1 = (amount * taxPerc1) / 100;
        taxPerc2 = configuredSGST;
        taxAmt2 = (amount * taxPerc2) / 100;
      } else if (isSameState) {
        taxPerc1 = configuredCGST;
        taxAmt1 = (amount * taxPerc1) / 100;
        taxPerc2 = configuredSGST;
        taxAmt2 = (amount * taxPerc2) / 100;
      } else {
        igstPerc = configuredIGST;
        igstAmt = (amount * igstPerc) / 100;
      }
    } else if (this.bookingModeCountry === 'uae' || this.bookingModeCountry === 'dubai') {
      const vatPerc = Number(row.get('TaxPercentage1')?.value || row.get('TaxPercentageIGST')?.value || 0);
      taxPerc1 = vatPerc;
      taxAmt1 = (amount * taxPerc1) / 100;
    }

    row.get('Amount')?.setValue(this.round(amount));
    row.get('TaxableAmount')?.setValue(this.round(amount));
    row.get('TaxPercentage1')?.setValue(this.round(taxPerc1));
    row.get('TaxAmount1')?.setValue(this.round(taxAmt1));
    row.get('TaxPercentage2')?.setValue(this.round(taxPerc2));
    row.get('TaxAmount2')?.setValue(this.round(taxAmt2));
    row.get('TaxPercentageIGST')?.setValue(this.round(igstPerc));
    row.get('TaxAmountIGST')?.setValue(this.round(igstAmt));
    row.get('LocalAmount')?.setValue(this.round(localAmount + taxAmt1 + taxAmt2 + igstAmt));
  }

  recalculateAllRows() {
    for (let i = 0; i < this.details.length; i++) {
      const exRateCtrl = this.details.at(i).get('ExchangeRate');
      if (exRateCtrl && (exRateCtrl.value === null || exRateCtrl.value === undefined)) {
        exRateCtrl.setValue(this.invoiceForm.get('ExchangeRate')?.value || 1);
      }
      const currCtrl = this.details.at(i).get('CurrencyCode');
      if (currCtrl && !currCtrl.value) {
        currCtrl.setValue(this.invoiceForm.get('CurrencyCode')?.value || null);
      }
      this.recalcRow(i);
    }
  }

  // Calculate total currency amount (sum of all amounts)
  getTotalCurrencyAmount(): number {
    let total = 0;
    for (let i = 0; i < this.details.length; i++) {
      const amount = Number(this.details.at(i).get('Amount')?.value || 0);
      total += amount;
    }
    return this.round(total);
  }

  // Calculate total tax amount (CGST + SGST + IGST)
  getTotalTaxAmount(): number {
    let total = 0;
    for (let i = 0; i < this.details.length; i++) {
      const taxAmt1 = Number(this.details.at(i).get('TaxAmount1')?.value || 0);
      const taxAmt2 = Number(this.details.at(i).get('TaxAmount2')?.value || 0);
      const igstAmt = Number(this.details.at(i).get('TaxAmountIGST')?.value || 0);
      total += taxAmt1 + taxAmt2 + igstAmt;
    }
    return this.round(total);
  }

  // Calculate grand total (Currency Amount + Tax Amount)
  getGrandTotal(): number {
    return this.round(this.getTotalCurrencyAmount() + this.getTotalTaxAmount());
  }

  round(val: number) {
    return Math.round((val + Number.EPSILON) * 100) / 100;
  }

  private normalizeParty(raw: any) {
    const customerMasterSid = raw.CustomerMasterSid != null ? Number(raw.CustomerMasterSid) : null;
    const partyControl = raw.PartyName;
    let customerBranchSid: number | null = null;
    let partyNameStr = '';
    let partyAddressStr = raw.PartyAddress || '';

    if (partyControl == null) {
      customerBranchSid = null;
      partyNameStr = raw.PartyName || '';
    } else if (typeof partyControl === 'object') {
      customerBranchSid = partyControl.CustomerBranchSid != null ? Number(partyControl.CustomerBranchSid) : null;
      partyNameStr = partyControl.CustomerBranchName || partyControl.PartyName || partyControl.CustomerBranch || String(customerBranchSid || '');
      partyAddressStr = partyControl.Address || partyControl.CustomerAddress1 || partyAddressStr;
    } else {
      const asNum = Number(partyControl);
      if (!isNaN(asNum) && String(partyControl).trim() !== '') {
        customerBranchSid = asNum;
        const found = this.customerBranchList.find(b => Number(b.CustomerBranchSid) === asNum);
        if (found) {
          partyNameStr = found.CustomerBranchName || found.PartyName || found.CustomerAddress1 || '';
          partyAddressStr = found.Address || found.CustomerAddress1 || partyAddressStr;
        } else {
          partyNameStr = String(partyControl);
        }
      } else {
        const found = this.customerBranchList.find(b =>
          String(b.CustomerBranchName || b.PartyName || '').trim().toLowerCase() === String(partyControl).trim().toLowerCase()
          || String(b.Address || b.CustomerAddress1 || '').trim().toLowerCase() === String(partyControl).trim().toLowerCase()
        );
        if (found) {
          customerBranchSid = found.CustomerBranchSid ? Number(found.CustomerBranchSid) : null;
          partyNameStr = found.CustomerBranchName || found.PartyName || partyControl;
          partyAddressStr = found.Address || found.CustomerAddress1 || partyAddressStr;
        } else {
          partyNameStr = String(partyControl);
        }
      }
    }

    let partyMasterSid = customerMasterSid;
    if (!partyMasterSid && customerBranchSid) {
      const found = this.customerBranchList.find(b => Number(b.CustomerBranchSid) === Number(customerBranchSid));
      if (found && found.CustomerMasterSid) partyMasterSid = Number(found.CustomerMasterSid);
    }

    return {
      PartyMasterSid: partyMasterSid,
      CustomerBranchSid: customerBranchSid,
      PartyName: partyNameStr,
      PartyAddress: partyAddressStr
    };
  }

  getCurrencyId(CurrencyCode: string): number | null {
    if(!CurrencyCode || !this.currencyList){
      return null;
    } else {
      const currency = this.currencyList.find(c => c.currencyCode === CurrencyCode);
      return currency ? currency.CurrencyMasterSid : null
    }
  }

  private buildVoucherOthersPayload(rawVoucherOthers: any): any | undefined {
    if (!rawVoucherOthers || typeof rawVoucherOthers !== 'object') return undefined;

    const allowedKeys = [
      'ContainerNumber',
      'VoucherNote',
      'Footer',
      'ReverseCreditNote',
      'DueDate',
      'IRNNumber',
      'IRNStatus',
      'IRNQRCode',
      'VoucherReverseSid'
    ];

    const cleaned: any = {};

    for (const k of allowedKeys) {
      const val = rawVoucherOthers[k];
      if (val === null || val === undefined) continue;
      if (typeof val === 'string') {
        if (val.trim() === '') continue;
        cleaned[k] = val;
      } else if (val instanceof Date) {
        cleaned[k] = val;
      } else {
        cleaned[k] = val;
      }
    }

    if (Object.keys(cleaned).length === 0) return undefined;

    if (!('Footer' in cleaned)) {
      cleaned['Footer'] = '';
    }

    if (cleaned.DueDate && !(cleaned.DueDate instanceof Date)) {
      const parsed = new Date(cleaned.DueDate);
      if (!isNaN(parsed.getTime())) cleaned.DueDate = parsed;
      else delete cleaned.DueDate;
    }

    if ('VoucherReverseSid' in cleaned) {
      const v = Number(cleaned.VoucherReverseSid);
      cleaned.VoucherReverseSid = isNaN(v) ? null : v;
    }

    return cleaned;
  }

  // Called when user selects master job in main Job No control
  onMasterJobSelected(selected: any) {
    if (!selected) {
      this.invoiceForm.get('MBLNo')?.setValue('');
      this.invoiceForm.get('HBLNo')?.setValue('');
      return;
    }
    const masterJob = typeof selected === 'object' ? selected : this.masterJobList.find(m => m.MasterJobSid === selected);
    if (masterJob) {
      if (masterJob.MBLNo !== undefined) this.invoiceForm.get('MBLNo')?.setValue(masterJob.MBLNo || '');
      if (masterJob.HBLNo !== undefined) this.invoiceForm.get('HBLNo')?.setValue(masterJob.HBLNo || masterJob.HouseJob || '');
      this.invoiceForm.get('MasterJobSid')?.setValue(Number(masterJob.MasterJobSid));
      // optional: apply to all detail rows
      // this.applyMasterJobToAllDetails(Number(masterJob.MasterJobSid));
    }
  }

  applyMasterJobToAllDetails(masterJobSid: number | null) {
    if (!masterJobSid) return;
    for (let i = 0; i < this.details.length; i++) {
      const grp = this.details.at(i);
      if (grp) grp.get('MasterJobSid')?.setValue(masterJobSid);
    }
  }

  async onSave() {
    if (this.invoiceForm.invalid) {
      this.invoiceForm.markAllAsTouched();
      this.appSettingService.showWarning('Please fill required invoice fields.');
      return;
    }
    this.recalculateAllRows();

    const raw = this.invoiceForm.getRawValue();

    const userEmailFromSettings = (this.appSettingService as any).userSettingSource?.value?.['userEmail'] || null;
    const createdByValue = userEmailFromSettings || this.currUserEmail || null;
    const updatedByValue = this.isEditMode ? (userEmailFromSettings || this.currUserEmail || null) : null;

    let normalizedVoucherType: number | null = null;
    const vt = raw.VoucherType;
    if (Array.isArray(vt) && vt.length > 0) {
      normalizedVoucherType = Number(vt[0]);
    } else if (vt !== null && vt !== undefined && vt !== '') {
      normalizedVoucherType = Number(vt);
    }
    if (isNaN(normalizedVoucherType)) normalizedVoucherType = null;

    let voucherDate: Date;
    if (!raw.VoucherDate) {
      voucherDate = new Date();
    } else if ((raw.VoucherDate as NgbDateStructLike).year) {
      const converted = this.fromNgbDate(raw.VoucherDate as NgbDateStructLike);
      voucherDate = converted ?? new Date();
    } else {
      const parsed = new Date(raw.VoucherDate);
      voucherDate = isNaN(parsed.getTime()) ? new Date() : parsed;
    }

    const normalizedParty = this.normalizeParty(raw);

    const currencyMasterId = this.getCurrencyId(raw.CurrencyCode);

    const masterJobSid = raw.MasterJobSid ? Number(raw.MasterJobSid) : null;

    const rawPartyControl = this.invoiceForm.get('PartyMasterSid')?.value;
    const partyMasterSid = rawPartyControl != null && rawPartyControl !== ''
      ? Number(rawPartyControl)
      : (normalizedParty.PartyMasterSid != null ? Number(normalizedParty.PartyMasterSid) : null);

    const voucherDetailArray = (raw.voucherDetails || []).map((d: any) => ({
      ChargeMasterSid: d.ChargeMasterSid != null ? Number(d.ChargeMasterSid) : null,
      ChargeDescription: d.ChargeDescription || '',
      HSSACMasterSid: d.HSSACMasterSid != null ? Number(d.HSSACMasterSid) : null,
      ChargeUOMSid: d.ChargeUOMSid != null ? Number(d.ChargeUOMSid) : null,
      NumberOfUnit: d.NumberOfUnit != null ? Number(d.NumberOfUnit) : 0,
      DrCr: d.DrCr || 'Dr',
      CurrencyCode: d.CurrencyCode || raw.CurrencyCode,
      CurrencyMasterSid: this.getCurrencyId(d.CurrencyCode || raw.CurrencyCode),
      Rate: d.Rate != null ? Number(d.Rate) : 0,
      ExchangeRate: d.ExchangeRate != null ? Number(d.ExchangeRate) : (raw.ExchangeRate != null ? Number(raw.ExchangeRate) : 1),
      Amount: d.Amount != null ? Number(d.Amount) : 0,
      TaxableAmount: d.TaxableAmount != null ? Number(d.TaxableAmount) : (d.Amount != null ? Number(d.Amount) : 0),
      TaxPercentage1: d.TaxPercentage1 != null ? Number(d.TaxPercentage1) : 0,
      TaxAmount1: d.TaxAmount1 != null ? Number(d.TaxAmount1) : 0,
      TaxPercentage2: d.TaxPercentage2 != null ? Number(d.TaxPercentage2) : 0,
      TaxAmount2: d.TaxAmount2 != null ? Number(d.TaxAmount2) : 0,
      TaxPercentageIGST: d.TaxPercentageIGST != null ? Number(d.TaxPercentageIGST) : 0,
      TaxAmountIGST: d.TaxAmountIGST != null ? Number(d.TaxAmountIGST) : 0,
      LocalAmount: d.LocalAmount != null ? Number(d.LocalAmount) : 0,
      MasterJobSid: d.MasterJobSid ? Number(d.MasterJobSid) : masterJobSid,
      HouseJobSid: d.HouseJobSid ? Number(d.HouseJobSid) : null
    }));

    const rawVoucherOthers = raw.voucherOthers ? { ...raw.voucherOthers } : null;
    if (rawVoucherOthers && rawVoucherOthers.DueDate && (rawVoucherOthers.DueDate as NgbDateStructLike).year) {
      rawVoucherOthers.DueDate = this.fromNgbDate(rawVoucherOthers.DueDate as NgbDateStructLike);
    }

    const voucherOthersCandidate = this.buildVoucherOthersPayload(rawVoucherOthers);

    const payload: any = {
      ...(this.isEditMode ? { UpdatedBy: updatedByValue } : { CreatedBy: createdByValue }),
      CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
      BranchMasterSid: this.currentBranch?.BranchMasterSid,
      VoucherNumber: raw.VoucherNumber || null,
      VoucherDate: voucherDate,
      PostDate: voucherDate,
      PartyMasterSid: partyMasterSid,
      PartyName: normalizedParty.PartyName || raw.PartyName || '',
      PartyAddress: normalizedParty.PartyAddress || raw.PartyAddress || '',
      CustomerBranchSid: normalizedParty.CustomerBranchSid ?? null,
      COAMasterSid: raw.COAMasterSid ?? 1,
      VoucherType: normalizedVoucherType,
      VoucherTypeMasterSid: raw.VoucherTypeMasterSid ? Number(raw.VoucherTypeMasterSid) : (normalizedVoucherType ?? undefined),
      InvoiceType: raw.InvoiceType || 'REG',
      CurrencyMasterSid: currencyMasterId,
      CurrencyCode: raw.CurrencyCode || undefined,
      ExchangeRate: raw.ExchangeRate != null ? Number(raw.ExchangeRate) : undefined,
      MasterJobSid: masterJobSid,
      HouseJobSid: raw.HouseJobSid ? Number(raw.HouseJobSid) : null,
      DocumentNumber: raw.DocumentNumber || undefined,
      Remarks: raw.Remarks || undefined,
      Narration: (raw.Narration !== undefined ? raw.Narration : undefined),
      status: (raw.status != null ? raw.status : 'A'),
      VoucherDetail: voucherDetailArray.length > 0 ? voucherDetailArray : undefined,
    };

    if (voucherOthersCandidate) {
      payload.VoucherOthers = voucherOthersCandidate;
    }

    Object.keys(payload).forEach(k => {
      if (payload[k] === undefined) delete payload[k];
    });

    console.debug('DEBUG - payload PartyMasterSid (will send):', payload.PartyMasterSid);
    console.debug('DEBUG - full payload', payload);

    if (this.headerId) {
      payload.UpdatedBy = updatedByValue;
      this.operationService.updateInvoiceById(this.headerId, payload).subscribe({
        next: (resp: any) => {
          if (resp?.status) {
            this.appSettingService.showSuccess('Invoice updated successfully.');
            this.router.navigate(['operation/invoice/list']);
          } else {
            this.appSettingService.showError('Error updating invoice.');
            console.error('updateInvoice resp', resp);
          }
        },
        error: (err) => {
          console.error('updateInvoice error', err);
          this.appSettingService.showError('Failed to update invoice.');
        }
      });
    } else {
      payload.CreatedBy = createdByValue;
      this.operationService.createInvoice(payload).subscribe({
        next: (resp: any) => {
          if (resp?.status) {
            this.appSettingService.showSuccess('Invoice created successfully.');
            const id = resp.data?.newVoucher?.VoucherHeaderSid || resp.data?.VoucherHeaderSid || resp.data?.voucherHeaderSid || null;
            if (id) this.router.navigate(['operation/invoice/entry', id]);
            else this.router.navigate(['operation/invoice/list']);
          } else {
            this.appSettingService.showError('Error creating invoice.');
            console.error('createInvoice resp', resp);
          }
        },
        error: (err) => {
          console.error('createInvoice error', err);
          this.appSettingService.showError('Failed to create invoice.');
        }
      });
    }
  }

  onReset() {
      this.invoiceForm.reset({ status: 'A', ExchangeRate: 1 });
  }

  goBack() {
    this.router.navigate(['operation/invoice/list']);
  }
}
