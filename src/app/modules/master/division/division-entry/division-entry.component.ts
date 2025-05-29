import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { FeatherModule } from 'angular-feather';
import { MasterService } from '../../master.service';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { Division } from 'src/app/modules/crm-mobile/Interfaces/division.interface';
import { OnlyTextDirective } from 'src/app/core/Directives/onlyStringOfLength';
import { TextWithNumbersDirective } from 'src/app/core/Directives/textWithNumbers';

@Component({
  selector: 'app-division-entry',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    FeatherModule,
    OnlyTextDirective,
    TextWithNumbersDirective
  ],
  templateUrl: './division-entry.component.html',
  styleUrls: ['./division-entry.component.scss']
})
export class DivisionEntryComponent {
  divisionForm!: FormGroup;
  isEditMode = false;
  divisions: Division[] =[];
  DivisionMasterSid: number;
  errorMessage: string = '';
  btnDisable: boolean = false;
  companyList: any
  statusList = ["Active", "Inactive"]

  constructor(
    private fb: FormBuilder,
    private masterService: MasterService,
    private appSettingService: AppSettingsService,
    private route: ActivatedRoute,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.getAllCompanies()
    this.loadDivision()
    this.initForm();
    this.route.paramMap.subscribe(params => {
      this.DivisionMasterSid = +params.get('id');
      if (this.DivisionMasterSid) {
        this.isEditMode = true;
        this.loadDivisionData(this.DivisionMasterSid);
      }
    });
  }

  loadDivision(): void {
    this.masterService.getAllDivisions().subscribe(
      (resp: Division[]) => {
        console.log(resp,'Divisions')
        this.divisions=resp['data'];
      },
      (error) => {
        this.errorMessage = error.message;
        console.error('Error loading:',error);
      }
    );
  }

  // Initialize the Form
  initForm() {
    this.divisionForm = this.fb.group({
      DivisionName: ['', [Validators.required]],
      DivisionCode: ['', [Validators.required]],
      // address: ['', [Validators.required]],
      CompanyMasterSid: ['',Validators.required],
      Remarks: ['', [Validators.required]],
      status: ['Active']
    });
  }

  onSubmit() {
    if (this.divisionForm.invalid) {
      this.divisionForm.markAllAsTouched();
      this.divisionForm.updateValueAndValidity();
      this.appSettingService.showWarning('Please fill all required fields correctly.');
      return;
    } else {
      let createdBy = { createdBy: this.appSettingService.userSettingSource.value['userEmail'] };
      let updatedBy = { updatedBy: this.appSettingService.userSettingSource.value['userEmail'] };
      const formValue = this.divisionForm.value;

      const payload = (this.isEditMode) ? {
        ...formValue,
        CompanyMasterSid:Number(formValue.CompanyMasterSid),
        ...updatedBy,
        status: formValue.status === "Active" ? "A" : "I"
      } : {
        ...formValue,
        CompanyMasterSid:Number(formValue.CompanyMasterSid),
        ...createdBy,
        status: formValue.status === "Active" ? "A" : "I"
      };

      console.log('payload', payload);

      if (this.isEditMode) {
        this.masterService.updateDivisionById(this.DivisionMasterSid, payload).subscribe(
          (resp: any) => {

            console.log(resp.message);
            if (resp.status) {
              this.appSettingService.showSuccess(resp.message);
              this.router.navigate(['master/division/list']);
            } else {
              this.appSettingService.showError(resp.message);
            }
          },
          (error) => {
            this.errorMessage = error.message;
            console.error('Update Division Error:', error);
          }
        );
      } else {
        this.masterService.createNewDivision(payload).subscribe(
          (resp: any) => {

            console.log(resp);
            if (resp.status) {
              this.appSettingService.showSuccess(resp.message);
              this.router.navigate(['master/division/list']);
            } else {
              this.appSettingService.showError(resp.message);
            }
          },
          (error) => {
            this.errorMessage = error.message;
            console.error('Create Division Error:', error);
          }
        );
      }
    }
  }

  statusMap: { [key: string]: string } = {
    A: 'Active',
    IA: 'Inactive',
  };

  // Fetch division data and patch the form
  loadDivisionData(divisionId: number) {
    this.masterService.getDivisionById(divisionId).subscribe(
      (divisionData) => {
        this.divisionForm.patchValue({
          ...divisionData,
          status: divisionData.status ==='A' ? 'Active' : 'Inactive'
        },
        );
      },
      (error) => {
        this.appSettingService.showError('Error loading division data.');
      }
    );
  }

  getAllCompanies() {
    this.masterService.getAllCompanies().subscribe((res)=> {
      this.companyList = res;
    })
  }

  reset() {
    this.divisionForm.reset();
  }

  goBack() {
    this.router.navigate(['master/division/list'])
  }
}
