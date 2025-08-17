import { CommonModule } from '@angular/common';
import { Component, TemplateRef } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router ,ActivatedRoute } from '@angular/router';
import { NgSelectModule } from '@ng-select/ng-select';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { DetailsComponent } from 'src/app/component/details/details.component';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { MasterService } from 'src/app/modules/master/master.service';
import { TermsAndConditionsComponent } from 'src/app/component/terms&conditions/terms&conditions.component';
import { EmailEntryComponent } from 'src/app/modules/settings/email/email-entry/email-entry.component';
import { AuthorityEntryComponent } from 'src/app/modules/master/authority/authority-entry/authority-entry.component';
import { EdocComponent } from 'src/app/modules/settings/edoc/edoc/edoc.component';
@Component({
  selector: 'app-chart-account-entry',
  standalone: true,
  imports: [NgSelectModule, ReactiveFormsModule, CommonModule],
  templateUrl: './chart-account-entry.component.html',
  styleUrl: './chart-account-entry.component.scss',
})
export class ChartAccountEntryComponent {
  chartForm!: FormGroup;
  chartData: any;
  isSubledgerRequired: boolean = false;
  TandCList: any;
  currentMenuId: number;
  chartMasterSid: number;
  isEditMode: boolean = false;
  currencyList: any[] = [];


  modeOfCategory = [
    { id: 1, name: 'Category 1' },
    { id: 1, name: 'Category 2' },
  ];
  modeOfStatus = [
  { id: 'A', name: 'Active' },
  { id: 'S', name: 'Suspended' },
];

  modeOfReportType = [
    { id: 1, name: 'Expense' },
    { id: 2, name: 'Asset' },
  ];

  
auditLogs: any[] = []; // Stores audit logs
  auditLogModalRef!: NgbModalRef;


  constructor(
    private masterServ: MasterService,
    private fb: FormBuilder,
    private route: Router,
     private activatedRoute: ActivatedRoute,
    private appSettingService: AppSettingsService,
    private modalService: NgbModal
  ) {}

   ngOnInit(): void {
    this.initForm();
     this.getCurrencies();
    this.activatedRoute.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.chartMasterSid = +id;
        this.isEditMode = true;
        this.loadChartAccount();
      }
    });
  }

 getCurrencies(): void {
  this.masterServ.getAllCurrencies().subscribe({
    next: (data) => {
      console.log('Currency List:', data); 
      this.currencyList = data;
    },
    error: (err) => {
      console.error('Failed to load currencies', err);
      this.currencyList = [];
    }
  });
}



  initForm() {
    this.chartForm = this.fb.group({
      LedgerName: ['', [Validators.required, Validators.maxLength(100)]],
      LedgerCode: ['', [Validators.required, Validators.maxLength(10)]],
      SubGroupName: ['', [Validators.maxLength(20)]],
      LedgerCurrency: ['', [Validators.maxLength(10)]],
      GroupName: ['', [Validators.maxLength(100)]],
      Category: ['', [Validators.required]],
      LedgerType: ['', [Validators.required]],
      Remarks: ['', [Validators.maxLength(200)]],
      Status: ['Active'],
      // IsSubledgerRequired: [false],
      SubledgerName: ['', [Validators.maxLength(20)]],
    });
  }

  loadChartAccount() {
    this.masterServ.fetchCoaById(this.chartMasterSid).subscribe(
      (data: any) => {
        this.chartData = data;
        this.isSubledgerRequired = data.IsSubledgerRequired;

        if (this.isSubledgerRequired) {
          this.chartForm
            .get('LedgerName')
            ?.setValidators([Validators.required, Validators.maxLength(20)]);
        }

          this.chartForm.patchValue({
          LedgerName: data.LedgerName,
          LedgerCode: data.LedgerCode,
          SubGroupName: data.SubGroupName,
          LedgerCurrency: data.LedgerCurrency,
          GroupName: data.GroupName,
          Category: data.Category,
          LedgerType: data.LedgerType,
          Remarks: data.Remarks,
          Status: data.Status === 'A' ? 'Active' : 'Suspended',
          SubledgerName: data.SubledgerName,
        });

        this.chartForm.get('LedgerName')?.updateValueAndValidity();
      },
      (error) => {
        this.appSettingService.showError('Error loading Chart Account', error);
      }
    );
  }

 onSubmit(): void {
  if (this.chartForm.invalid) {
    this.chartForm.markAllAsTouched();
    this.appSettingService.showWarning('Please fill out all required fields correctly.');
    return;
  }


  const formValue = this.chartForm.value;

  
 const mappedStatus = formValue.Status === 'Active' ? 'A' : 'S';

  const currentuseremail=this.appSettingService.userSettingSource.value['userEmail']
  const payload = this.isEditMode?{
    ...this.chartForm.value,
      Status: mappedStatus,
      UpdatedBy:currentuseremail,
  //   CreatedBy: this.appSettingService.userSettingSource.value['userEmail'],
  //  UpdatedBy: this.isEditMode ? this.appSettingService.userSettingSource.value['userEmail']
  }:{
     ...this.chartForm.value,
      Status: mappedStatus,
      CreatedBy:currentuseremail,
  };

  if (this.isEditMode) {
    this.masterServ.updateCoaById(this.chartMasterSid, payload).subscribe(
      (resp: any) => {
        if (resp.status) {
          this.appSettingService.showSuccess('Chart Account Updated Successfully');
          this.route.navigate(['/accounts/chart-accounts/list']);
        } else {
          this.appSettingService.showError(resp.message);
        }
      },
      (error) => {
        console.error('Error updating Chart Account', error);
      }
    );
  } else {
    this.masterServ.createNewCoa(payload).subscribe(
      (resp: any) => {
        if (resp.status) {
          this.appSettingService.showSuccess('Chart Account Created Successfully');
          this.route.navigate(['/accounts/chart-accounts/list']);
        } else {
          this.appSettingService.showError(resp.message);
        }
      },
      (error) => {
        console.error('Error creating Chart Account', error);
      }
    );
  }
}



openAuditLogs(modal: TemplateRef<any>) {
  if (!this.chartMasterSid) return;

  this.masterServ.getAuditLogsCOA('COAMaster', this.chartMasterSid.toString()).subscribe({
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


  //  checked box
  // onSubledgerChange(event: Event): void {
  //   const checkbox = event.target as HTMLInputElement;
  //   this.isSubledgerRequired = checkbox.checked;

  //   const ledgerControl = this.chartForm.get('LedgerName');

  //   if (this.isSubledgerRequired) {
  //     ledgerControl?.setValidators([
  //       Validators.required,
  //       Validators.maxLength(20),
  //     ]);
  //   } else {
  //     ledgerControl?.clearValidators();
  //     ledgerControl?.setValue('');
  //   }

  //   ledgerControl?.updateValueAndValidity();
  // }

  // info
  showInfo() {
    if (!this.chartData) return;
    const modalRef = this.modalService.open(DetailsComponent, {
      size: 'lg',
      centered: true,
      backdrop: 'static',
    });
    modalRef.componentInstance.item = this.chartData;
    modalRef.componentInstance.idLabel = 'Vessel Id';
    modalRef.componentInstance.idValue = this.chartData?.VesselMasterSid;
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
            centered: true,
          });
          modalRef.componentInstance.terms = this.TandCList;
          modalRef.componentInstance.MenuMasterSid = this.currentMenuId;
          modalRef.componentInstance.DocumentSid = this.chartMasterSid;
        } else {
          this.appSettingService.showError(
            'Error loading Terms and Conditions'
          );
        }
      },
      (error) => {
        this.appSettingService.showError(
          'Error loading Terms and Conditions',
          error
        );
      }
    );
  }

  openEmail() {
    if (!this.chartData) return;
    const modalRef = this.modalService.open(EmailEntryComponent, {
      size: 'lg',
      centered: true,
      backdrop: 'static',
    });
  }

  openAuthority() {
    if (!this.chartData) return;
    const modalRef = this.modalService.open(AuthorityEntryComponent, {
      size: 'lg',
      centered: true,
      backdrop: 'static',
    });
    modalRef.componentInstance.item = this.chartData;
    modalRef.componentInstance.idLabel = 'Vessel Id';
    modalRef.componentInstance.idValue = this.chartData?.VesselMasterSid;
  }

  openEDoc() {
    if (!this.chartData) return;
    const modalRef = this.modalService.open(EdocComponent, {
      size: 'lg',
      centered: true,
      backdrop: 'static',
    });
    modalRef.componentInstance.item = this.chartData;
    modalRef.componentInstance.idLabel = 'Vessel Id';
    modalRef.componentInstance.idValue = this.chartData?.VesselMasterSid;
  }

  onReset(): void {
    this.chartForm.reset({
      Name: '',
      code: '',
      subGroup: '',
      CurrencyCode: '',
      Group: '',
      Category: '',
      reportType: '',
      PortType: '',
      Remarks: '',
      AccountType: '',
      IsSubledgerRequired: false,
    });

    this.chartForm.markAsPristine();
    this.chartForm.markAsUntouched();
  }

  nagivateback() {
    this.route.navigate(['accounts/chart-accounts/list']);
  }
}
