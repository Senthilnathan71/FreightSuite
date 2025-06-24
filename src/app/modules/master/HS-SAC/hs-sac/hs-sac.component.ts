import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit, TemplateRef } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators, } from '@angular/forms';
import { NgbCalendar, NgbDateAdapter, NgbDateParserFormatter, NgbDatepickerModule, NgbModal, NgbModalModule, NgbModalRef, NgbPagination, } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { MatDialog } from '@angular/material/dialog';
import { MasterService } from '../../master.service';
import { ActivatedRoute, Router, RouterLink, RouterModule } from '@angular/router';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { DeleteWarningComponent } from 'src/app/modules/crm-mobile/delete-warning.component';
import { FeatherModule } from 'angular-feather';
import { HSSAC } from 'src/app/modules/crm-mobile/Interfaces/hs-sac.interfaces';
import { OnlyTextDirective } from 'src/app/core/Directives/onlyStringOfLength';
import { TextWithNumbersDirective } from 'src/app/core/Directives/textWithNumbers';
import { take } from 'rxjs';
import { authService } from 'src/app/modules/authentication/auth.service';
import { ExcelExportService } from 'src/app/shared/excel-report-service';
import { CustomDatePipe } from 'src/app/core/pipes/custom-date-format.pipe';
import { CustomDateAdapter } from 'src/app/component/datepicker/custom-date-adapter';
import { CustomDateParserFormatter } from 'src/app/component/datepicker/custom-date-parser';
import { DetailsComponent } from 'src/app/component/details/details.component';

@Component({
  selector: 'app-hs-sac',
  standalone: true,
  imports: [
    NgbModalModule,
    FeatherModule,
    NgSelectModule,
    CommonModule,
    ReactiveFormsModule,
    NgbPagination,
    RouterModule,
    FormsModule,
    OnlyTextDirective,
    TextWithNumbersDirective,
    CustomDatePipe,
    NgbDatepickerModule,
    DatePipe
  ],
  templateUrl: './hs-sac.component.html',
  styleUrl: './hs-sac.component.scss',
  providers: [
    { provide: NgbDateAdapter, useClass: CustomDateAdapter },
    { provide: NgbDateParserFormatter, useClass: CustomDateParserFormatter },
  ],
})
export class HSSACComponent {
  hssacForm!: FormGroup;
  isEditMode: boolean = false;
  hssacs: HSSAC[] = [];
  results: any[] = [];
  HSSACMasterSid!: number;
  errorMessage: string = '';
  btnDisable: boolean = false;
  hssacList: any[] = [];
  statusList = ["Active", "Suspended"]
  modeOfTaxType = [
    { id: 'VAT', name: 'VAT' },
    { id: 'UGST', name: 'UGST' },
    { id: 'CGST', name: 'CGST' },
    { id: 'IGST', name: 'IGST' },
    { id: 'Default', name: 'Default' },
  ];
  modalRef!: NgbModalRef;
  searchType = 'HSSACCode';
  filterValue = '';
  searchPerformed = false;
  page = 1;
  pageSize = 5;
  totalLengthOfCollection = 0;
	userData : any;
	today = this.calendar.getToday();
	todayDate = new Date(this.today.year,this.today.month,this.today.day);
  hssacData : any;


  constructor(
    private modalService: NgbModal,
    private fb: FormBuilder,
    private masterService: MasterService,
    private route: ActivatedRoute,
    private router: Router,
    private appSettingService: AppSettingsService,
    private dialog: MatDialog,
    private userService: authService,
    private excelReportService: ExcelExportService,
    private calendar : NgbCalendar
  ) { }

  ngOnInit(): void {
    // this.loadHssac()
    this.initForm();
    this.appSettingService.getUser().subscribe(
      user => {
        if (user) {
          this.userData = user;
        }
      }
    )
    this.route.paramMap.subscribe(params => {
      this.HSSACMasterSid = +params.get('id');
      if (this.HSSACMasterSid) {
        this.isEditMode = true;
        this.loadHssacData(this.HSSACMasterSid);
      }
    });
  }

  // loadHssac(): void {
  //   this.masterService.getAllHssac().subscribe(
  //     (resp: HSSAC[]) => {
  //       console.log(resp, 'Hssac')
  //       this.hssacs = resp['data'];
  //     },
  //     (error) => {
  //       this.errorMessage = error.message;
  //       console.error('Error loading:', error);
  //     }
  //   );
  // }

  initForm() {
    this.hssacForm = this.fb.group({
      HSSACCode: ['', [Validators.required]],
      HSSACName: ['', [Validators.required]],
      ServiceName: ['', [Validators.required]],
      TaxRate: ['Default', [Validators.required]],
      TaxType: ['', [Validators.required]],
      EffectiveFrom: ['', [Validators.required]],
      Remarks: ['', [Validators.required]],
      status: [{value: 'Active', disabled: false}, Validators.required], 
    });
  }

  resetForm(): void {
    this.hssacForm.get('status')?.disable();
    this.hssacForm.reset({
      status: 'Active'
    });
  }

  openModal(content: any): void {
    this.isEditMode = false;
    this.resetForm();
    this.modalRef = this.modalService.open(content, { centered: true, size: 'lg', backdrop: 'static' });
  }

  openEditModal(content: any, id: number): void {
  this.isEditMode = true;
  this.HSSACMasterSid = id;
  this.getHssacById(id).add(() => {
    this.modalRef = this.modalService.open(content, { centered: true, size: 'lg', backdrop: 'static' });
  });
}

editHssac(id: number, content: any) {
  this.isEditMode = true;
  this.HSSACMasterSid = id;
  this.masterService.getHssacById(id).pipe(take(1)).subscribe({
    next: (hssac: any) => {
      this.hssacData = hssac;
      this.hssacForm.get('status')?.enable();
      this.hssacForm.patchValue({
        HSSACCode: hssac.HSSACCode,
        HSSACName: hssac.HSSACName,
        ServiceName: hssac.ServiceName,
        TaxRate: hssac.TaxRate,
        TaxType: hssac.TaxType,
        EffectiveFrom: new Date(hssac.EffectiveFrom),
        Remarks: hssac.Remarks,
        status: hssac.status === 'A' ? 'Active' : 'Suspended'
      });
      this.modalRef = this.modalService.open(content, {centered: true, size: 'lg', backdrop: 'static'});
    },
    error: (err) => {
      console.error('Error fetching HSSAC', err);
      this.appSettingService.showError('Error fetching data for editing');
    }
  });
}


  closeModal(): void {
    if (this.modalRef) {
      this.modalRef.close();
    }
  }

  getHssacById(id: number) {
  this.resetForm();
  return this.masterService.getHssacById(id).pipe(take(1)).subscribe(
    (hssac: any) => {
      console.log('HSSAC from backend:', hssac);
      this.hssacForm.patchValue({
        HSSACCode: hssac.HSSACCode,
        HSSACName: hssac.HSSACName,
        ServiceName: hssac.ServiceName,
        TaxRate: hssac.TaxRate,
        TaxType: hssac.TaxType,
        EffectiveFrom: hssac.EffectiveFrom,
        Remarks: hssac.Remarks,
        status: hssac.status === 'A' ? 'Active' : 'Suspended'
      });
    },
    (error) => {
      this.appSettingService.showError('Error loading');
    }
  );
}

  onSubmit() {
    if (this.hssacForm.get('status')?.disabled) {
      this.hssacForm.get('status')?.enable();
    }
    if (this.hssacForm.invalid) {
      this.hssacForm.markAllAsTouched();
      this.hssacForm.updateValueAndValidity();
      this.appSettingService.showWarning('Please fill all required fields correctly.');
      return;
    } else {
      let createdBy = { createdBy: this.appSettingService.userSettingSource.value['userEmail'] };
      let updatedBy = { updatedBy: this.appSettingService.userSettingSource.value['userEmail'] };
      const formValue = this.hssacForm.value;

      const payload = (this.isEditMode) ? {
        ...formValue,
        ...updatedBy,
        EffectiveFrom: new Date(formValue.EffectiveFrom),
        status: formValue.status === "Active" ? "A" : "S"
      } : {
        ...formValue,
        ...createdBy,
        EffectiveFrom: new Date(formValue.EffectiveFrom),
        status: formValue.status === "Active" ? "A" : "S"
      };

      console.log('payload', payload);

      if (this.isEditMode) {
        this.masterService.editHssac(this.HSSACMasterSid, payload).subscribe(
          (resp: any) => {
            console.log(resp.message);
            if (resp.status) {
              this.appSettingService.showSuccess(resp.message);
              this.closeModal();
              this.router.navigate(['master/hs-sac']);
            } else {
              this.appSettingService.showError(resp.message);
            }
          },
          (error) => {
            this.errorMessage = error.message;
            console.error('Error loading:', error);
          }
        );
      } else {
        this.masterService.createHssac(payload).subscribe(
          (resp: any) => {
            console.log(resp);
            if (resp.status) {
              this.appSettingService.showSuccess(resp.message);
              this.closeModal();
              this.router.navigate(['master/hs-sac']);
            } else {
              this.appSettingService.showError(resp.message);
            }
          },
          (error) => {
            this.errorMessage = error.message;
            console.error('Error loading:', error);
          }
        );
      }
    }
  }

  statusMap: { [key: string]: string } = {
    A: 'Active',
    S: 'Suspended'
  };

  loadHssacData(id: number) {
    this.masterService.getHssacById(id).subscribe(
      (data) => {
        this.hssacForm.patchValue({
          ...data,
          status: data.status === 'A' ? 'Active' : 'Suspended'
        },
        );
      },
      (error) => {
        this.appSettingService.showError('Error loading data.');
      }
    );
  }

  search() {
    const payload = {
      searchType: this.searchType,
      filterValue: this.filterValue,
    };

    this.masterService.searchHssac(payload).subscribe((res: any) => {
      this.results = res;
      console.log(this.results)
      this.searchPerformed = true;
      this.updatePaginationData();
      this.totalLengthOfCollection = this.results.length || 0;
    });
  }

  updatePaginationData(): void {
    const startIndex = (this.page - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.hssacList = this.results.slice(startIndex, endIndex);
  }

  trackByIndex(index: number, item: any): number {
    return index;
  }

  softDeleteHssac(id) {
    const dialogRef = this.dialog.open(DeleteWarningComponent);
    dialogRef.afterClosed().subscribe((result) => {
      if (result === true) {
        this.masterService.softDeleteHssac(id).subscribe((resp: any) => {
          this.appSettingService.showSuccess('Deleted!');
          this.router.navigate(['master/hs-sac']);
          this.search();
        });
      }
    });
  }

  resetPage(): void {
    this.hssacList = [];
    this.totalLengthOfCollection = 0;
    this.searchPerformed = false;
    this.filterValue = '';
    this.searchType = 'HSSACCode';
    this.page = 1;
    this.hssacs = [];
  }

  report(): void {
    const formattedData = this.hssacList.map(item => ({
      ...item,
      status: item.status === 'A' ? 'Active' : 'Suspended'
    }));

    const companyName = this.userData?.userBranchMaster?.[0]?.companyMaster?.companyName ?? 'Company';

    this.excelReportService.exportAsExcel({
      data: formattedData,
      headers: [
        { key: 'HSSACCode', label: 'HS-SAC Code' },
        { key: 'HSSACName', label: 'HS-SAC Name' },
        { key: 'ServiceName', label: 'Service Name' },
        { key: 'TaxRate', label: 'Tax Rate' },
        { key: 'TaxType', label: 'Tax Type' },
        { key: 'EffectiveFrom', label: 'Effective From' },
        { key: 'Remarks', label: 'Remarks' },
        { key: 'status', label: 'Status' },
      ],
      fileName: 'HSSAC-Report',
      title: companyName
    });
  }

  showInfo() {
    if(!this.hssacData) return;
    const modalRef = this.modalService.open(DetailsComponent, { size: 'lg', centered: true, backdrop: 'static' });
    modalRef.componentInstance.item = this.hssacData;
    modalRef.componentInstance.idLabel = 'HSSAC Id';
    modalRef.componentInstance.idValue = this.hssacData?.HSSACMasterSid;
  }

}
