import { CommonModule, DatePipe } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder,FormGroup,Validators,ReactiveFormsModule, FormsModule,} from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { FeatherModule } from 'angular-feather';
import { OnlyNumbersDirective } from 'src/app/core/Directives/onlyNumbersOfLength';
import { OnlyTextDirective } from 'src/app/core/Directives/onlyStringOfLength';
import { TextWithNumbersDirective } from 'src/app/core/Directives/textWithNumbers';
import { MasterService } from '../../master.service';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbCalendar, NgbDateAdapter, NgbDateParserFormatter, NgbDatepickerModule, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { TermsAndConditionsComponent } from 'src/app/component/terms&conditions/terms&conditions.component';
import { PreventMultiClickDirective } from 'src/app/core/Directives/prevent-multi-click.directive';
import { DetailsComponent } from 'src/app/component/details/details.component';
import { Year } from 'src/app/modules/crm-mobile/Interfaces/year.interfaces';
import { CustomDateAdapter } from 'src/app/component/datepicker/custom-date-adapter';
import { CustomDateParserFormatter } from 'src/app/component/datepicker/custom-date-parser';
import { CustomDatePipe } from 'src/app/core/pipes/custom-date-format.pipe';
import { EmailEntryComponent } from 'src/app/modules/settings/email/email-entry/email-entry.component';
import { AuthorityEntryComponent } from '../../authority/authority-entry/authority-entry.component';
import { EdocComponent } from 'src/app/modules/settings/edoc/edoc/edoc.component';

@Component({
  selector: 'app-year-entry',
  standalone: true,
  imports: [
    NgSelectModule, 
    ReactiveFormsModule, 
    CommonModule,
    FeatherModule,
    FormsModule,
    OnlyNumbersDirective,
    OnlyTextDirective,
    TextWithNumbersDirective,
    DatePipe,
    NgbDatepickerModule,
    PreventMultiClickDirective
  ],
  templateUrl: './year-entry.component.html',
  styleUrl: './year-entry.component.scss',
  providers: [
      { provide: NgbDateAdapter, useClass: CustomDateAdapter },
      { provide: NgbDateParserFormatter, useClass: CustomDateParserFormatter },
    ],
})
export class YearEntryComponent {
  yearForm!: FormGroup;
  isEditMode = false; // Flag for edit mode
  errorMessage: string = '';  // To store any error messages
  years: Year[] = [];
  btnDisable: boolean = true;
  YearMasterSid: number;
  yearData: any;
  today = this.calendar.getToday();
  todayDate = new Date(this.today.year, this.today.month - 1, this.today.day);
  companyList: any;
  statusList = [
    { id: 'A', name: 'Active' },
    { id: 'S', name: 'Suspended' }
  ];
  currentMenuId: any;
  TandCList: any[]=[];
  
  constructor(
    private fb: FormBuilder,
    private masterService: MasterService,
    private appSettingService: AppSettingsService,
    private route: ActivatedRoute,
    private router: Router,
    private modalService: NgbModal,
    private calendar : NgbCalendar
  ) {  }
  ngOnInit(): void {
    this.getAllCompanies();
    this.loadYear();
    this.initForm();
      this.yearForm.valueChanges.subscribe(() => {
    this.btnDisable = !this.yearForm.valid;
  });
    this.route.paramMap.subscribe(params => {
      this.YearMasterSid = +params.get('YearMasterSid');
      if(this.YearMasterSid){
        this.isEditMode = true;
        this.loadYearData(this.YearMasterSid);
      }else {
        this.yearForm.get('status')?.disable();
      }
    });
  }

  loadYear(): void{
    this.masterService.getAllYears().subscribe(
      (resp: Year[])=> {
        console.log(resp,'year');
        this.years = resp['data'];
      },
      (error)=> {
        this.errorMessage = error.message;
        console.error('Error loading years:', error);
      }
    );
  }

  initForm() {
    this.yearForm = this.fb.group({
      CompanyMasterSid: ['',[Validators.required]],
      YearName: ['', Validators.required],
      YearCode: ['', Validators.required],
      StartDate: [this.todayDate, Validators.required],
      EndDate: [this.todayDate, Validators.required],
      CurrentYear: ['', Validators.required],
      YearEndCompleted: ['', Validators.required],
      Remarks: [''],
      status: [{value: 'Active', disabled: false}, Validators.required],
    });
  }

  resetForm(): void {
    this.yearForm.get('status')?.disable();
    this.yearForm.reset({
      status: 'Active'
    });
  }

  onSubmit() {
    if (this.yearForm.get('status')?.disabled) {
      this.yearForm.get('status')?.enable();
    }
    if (this.yearForm.invalid) {
      this.yearForm.markAllAsTouched();
      this.yearForm.updateValueAndValidity();
      this.appSettingService.showWarning('Please fill all required fields correctly.');
      return;
    } else {
      let createdBy = { createdBy: this.appSettingService.userSettingSource.value['userEmail']};
      let updatedBy = { updatedBy: this.appSettingService.userSettingSource.value['userEmail']};
      const formValue = this.yearForm.value;

      const payload = (this.isEditMode) ? {
        ...formValue,
        YearCode: Number(formValue.YearCode),
        CompanyMasterSid: Number(formValue.CompanyMasterSid),
        ...updatedBy,
        status: formValue.status === "Active" ? "A" : "C"
      } : {
        ...formValue,
        YearCode: Number(formValue.YearCode),
        CompanyMasterSid: Number(formValue.CompanyMasterSid),
        ...createdBy,
        status: formValue.status === "Active" ? "A" : "C"
      };

      console.log('payload', payload);

      if (this.isEditMode) {
        this.masterService.updateYearById(this.YearMasterSid, payload).subscribe(
          (resp: any) => {
            console.log(resp.message);
            if(resp.status) {
              this.appSettingService.showSuccess(resp.message);
              this.router.navigate(['master/year/list']);
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
        this.masterService.createNewYear(payload).subscribe(
          (resp: any) => {
            console.log(resp);
            if (resp.status) {
              this.appSettingService.showSuccess(resp.message);
              this.router.navigate(['master/year/list']);
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

  loadYearData(id: number) {
    this.masterService.getYearById(id).subscribe(
      (data) => {
        const startDate = data.StartDate? new Date(data.StartDate) : this.todayDate;
        const endDate = data.EndDate? new Date(data.EndDate) : this.todayDate;
        this.yearForm.patchValue({
          ...data,
          StartDate:startDate,
          EndDate: endDate,
          CompanyMasterSid: data.CompanyMasterSid,
          status: data.status
        },
      );
      this.yearData = data;
      },
      (error) => {
        this.appSettingService.showError('Error loading year data.');
      }
    );
  }

  getAllCompanies() {
    this.masterService.getAllCompanies().subscribe((res: any[]) => {
      this.companyList = res;
    })
  }



  goBack() {
    this.router.navigate(['master/year/list']);
  }

  showInfo() {
    if(!this.yearData) return;
    const modalRef = this.modalService.open(DetailsComponent, { size: 'lg', centered: true, backdrop: 'static' });
    modalRef.componentInstance.item = this.yearData;
    modalRef.componentInstance.idLabel = 'Year Id';
    modalRef.componentInstance.idValue = this.yearData?.YearMasterSid;
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
          modalRef.componentInstance.DocumentSid = this.YearMasterSid;

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
		if (!this.yearData) return;
		const modalRef = this.modalService.open(EmailEntryComponent, {
			size: 'lg',
			centered: true,
			backdrop: 'static'
		});
	}

	openAuthority() {
		if (!this.yearData) return;
		const modalRef = this.modalService.open(AuthorityEntryComponent, {
			size: 'lg',
			centered: true,
			backdrop: 'static'
		});
	}

	openEDoc() {
		if (!this.yearData) return;
		const modalRef = this.modalService.open(EdocComponent, {
			size: 'lg',
			centered: true,
			backdrop: 'static'
		});
	}

  reset() {
  this.yearForm.reset({
    CompanyMasterSid: '',
    YearName: '',
    YearCode: '',
    StartDate: this.todayDate,
    EndDate: this.todayDate,
    CurrentYear: '',
    YearEndCompleted: '',
    Remarks: '',
    status: 'Active'
  });

  // Re-disable the status field
  this.yearForm.get('status')?.disable();

  // Disable the save button again
  this.btnDisable = true;
}


}
