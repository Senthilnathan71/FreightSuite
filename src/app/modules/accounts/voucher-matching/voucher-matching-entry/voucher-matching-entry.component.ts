import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AbstractControl, FormArray, FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { NgbDateAdapter, NgbDateParserFormatter, NgbDatepickerModule } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { FeatherModule } from 'angular-feather';
import { CommonModule } from '@angular/common';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { AccountsService } from '../../accounts.service';
import { CustomDatePipe } from 'src/app/core/pipes/custom-date-format.pipe';
import { forkJoin, catchError, of } from 'rxjs';
import { CustomDateAdapter } from 'src/app/component/datepicker/custom-date-adapter';
import { CustomDateParserFormatter } from 'src/app/component/datepicker/custom-date-parser';

interface NgbDateStructLike { day: number; month: number; year: number; }

@Component({
  selector: 'app-voucher-matching-entry',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NgbDatepickerModule,
    FeatherModule,
    NgSelectModule,
    CustomDatePipe
  ],
  templateUrl: './voucher-matching-entry.component.html',
  styles: ``,
  providers: [
    { provide: NgbDateAdapter, useClass: CustomDateAdapter },
    { provide: NgbDateParserFormatter, useClass: CustomDateParserFormatter },
  ],
})
export class VoucherMatchingEntryComponent implements OnInit {
  voucherMatchingForm!: FormGroup;
  userData: any;
  currentCompany: any;
  currentBranch: any;
  MenuMasterSid: any;
  VoucherMatchingHeaderSid!: number;
  isEditMode: boolean = false;
  voucherMatchingData : any;
  currentDate = new Date();
  ledgerList: any[][] = [];
  status = [
    { id: 'A', name: 'Active' },
    { id: 'S', name: 'Suspended' },
  ];
  constructor(
    private router: Router, 
    private fb: FormBuilder,
    private appSettingService: AppSettingsService,
    private route: ActivatedRoute,
    private accountsService: AccountsService
  ) {}

ngOnInit(): void {
  const userProfile = this.appSettingService.getDecryptedUserProfile();
  if (userProfile) {
    this.userData = userProfile;
  } try {
    this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));
    this.currentBranch = this.appSettingService.decrypt(localStorage.getItem('selected-branch'));
    this.MenuMasterSid =  localStorage.getItem('currentMenuId');
  }catch (e) {
      console.error('Error loading company data:', e);
      this.currentCompany = null;
      this.currentBranch = null;
    }
    this.initForm();
    this.route.paramMap.subscribe(params => {
      this.VoucherMatchingHeaderSid = +params.get('VoucherMatchingHeaderSid');
      if (this.VoucherMatchingHeaderSid) {
        this.isEditMode = true;
        this.loadVoucherMatchingData(this.VoucherMatchingHeaderSid);
      }
    });
}

loadVoucherMatchingData(VoucherMatchingHeaderSid: number) {
  this.accountsService.getVoucherMatching(VoucherMatchingHeaderSid).subscribe({
    next: (resp: any) => {
      if (resp?.status && resp.data) {
        this.voucherMatchingData = resp.data;
        console.log(this.voucherMatchingData, this.voucherMatchingData);
        this.patchValues(this.voucherMatchingData);
      } else {
        this.appSettingService.showError('Error Loading Data');
      }
    },
    error: (err) => {
      console.error(err);
      this.appSettingService.showError('Error Loading Data');
    },
  });
}

initForm() {
  this.voucherMatchingForm = this.fb.group({
    VoucherMatchingNo: [{ value: '', disabled: true }],
    VoucherMatchingDate: [{value: null, disabled: true}],
    LedgerName: [{value: null, disabled: true}],
    SubledgerName: [{value: null, disabled: true}],
    PostDate: [{value: null, disabled: true}],
    Status: [{ value: 'A', disabled: true }],
    voucherMatching: this.fb.array([]),
  });
}

get f(): { [key: string]: AbstractControl } {
      return this.voucherMatchingForm.controls;
    }
  get detail() : FormArray {
    return this.voucherMatchingForm.get('voucherMatching') as FormArray;
  }


  createDetailGroup(item: any): FormGroup {
  return this.fb.group({
    BranchName: [{ value: item?.branch?.branchName ?? '', disabled: true }],
    LedgerName: [{ value: item?.CoaMaster?.LedgerName ?? '', disabled: true }],
    SubledgerName: [{ value: item?.subledgerMaster?.SubledgerName ?? '', disabled: true }],
    VoucherNumber: [{ value: item?.VoucherHeader?.VoucherNumber ?? '', disabled: true }],
    VoucherType: [{ value: item?.VoucherHeader?.voucherTypeMaster?.DocumentTypeName ?? '', disabled: true }],
    VoucherDate: [{ value: item?.VoucherHeader?.VoucherDate ? new Date(item?.VoucherHeader?.VoucherDate) : null, disabled: true }],
    DrCr: [{ value: item?.DrCr ?? '', disabled: true }],
    CurrencyCode: [{ value: item?.CurrencyCode ?? '', disabled: true }],
    ExchangeRate: [{ value: item?.ExchangeRate ?? '', disabled: true }],
    Amount: [{ value: item?.Amount ?? '', disabled: true }],
    LocalAmount: [{ value: item?.LocalAmount ?? '', disabled: true }],
    MatchingType: [{ value: item?.MatchingType ?? '', disabled: true }],
  });
}



  patchValues(data: any) {

  // 🔹 Use FIRST ROW for HEADER display
    const sourceRow = data?.voucherMatchings?.find(
    (x: any) => x.MatchingType === 'Source'
  );

  this.voucherMatchingForm.patchValue({
    VoucherMatchingNo: data.VoucherMatchingNo,
    VoucherMatchingDate: data.VoucherMatchingDate ? new Date(data.VoucherMatchingDate) : null,
    LedgerName: sourceRow?.CoaMaster?.LedgerName ?? '',
    SubledgerName: sourceRow?.subledgerMaster?.SubledgerName ?? '',
    PostDate: sourceRow?.VoucherHeader?.PostDate ? new Date(sourceRow?.VoucherHeader?.PostDate) : null,
    Status: data.Status === 'A' ? 'Active' : 'Suspended'
  });

  this.detail.clear();

  data?.voucherMatchings?.forEach((item: any) => {
    this.detail.push(this.createDetailGroup(item));
  });
  console.log("Form value after patching",this.voucherMatchingForm.getRawValue())
}


  navigateToBack() {
    this.router.navigate(['accounts/voucher-matching/list']);
  }
}
