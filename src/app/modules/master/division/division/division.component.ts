import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule, FormGroup, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { FeatherModule } from 'angular-feather';
import { NgbModalModule, NgbPagination, NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { DeleteWarningComponent } from 'src/app/modules/crm-mobile/delete-warning.component';
import { MasterService } from '../../master.service';
import { Division } from 'src/app/modules/crm-mobile/Interfaces/division.interface';
import { NgSelectModule } from '@ng-select/ng-select';
import { OnlyTextDirective } from 'src/app/core/Directives/onlyStringOfLength';
import { TextWithNumbersDirective } from 'src/app/core/Directives/textWithNumbers';
import { take } from 'rxjs';

@Component({
  selector: 'app-division',
  standalone: true,
  imports: [
    CommonModule, 
    FeatherModule, 
    FormsModule, 
    NgbPagination, 
    RouterModule,
    NgbModalModule,
    NgSelectModule,
    ReactiveFormsModule,
    OnlyTextDirective,
    TextWithNumbersDirective
  ],
  templateUrl: './division.component.html',
  styleUrl: './division.component.scss'
})
export class DivisionComponent {
  divisionForm!: FormGroup;
  isEditMode: boolean = false;
  divisions: Division[] = [];
  results: any[] = [];
  DivisionMasterSid!: number;
  errorMessage: string = '';
  btnDisable: boolean = false;
  divisionList: any[] = [];
  statusList = ["Active", "Suspended"]
  companyList: any;
  modalRef!: NgbModalRef;
  searchType = 'DivisionName';
  filterValue = '';
  searchPerformed = false;
  page = 1;
  pageSize = 5;
  totalLengthOfCollection = 0;

  constructor(
   private modalService: NgbModal,
   private fb: FormBuilder,
   private masterService: MasterService,
   private route: ActivatedRoute,
   private router: Router,
   private appSettingService: AppSettingsService,
   private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.getAllCompanies();
    // this.loadDivision();
    this.initForm();
    this.route.paramMap.subscribe(params => {
      this.DivisionMasterSid = +params.get('DivisionMasterSid');
      if (this.DivisionMasterSid) {
        this.isEditMode = true;
        this.loadDivisionData(this.DivisionMasterSid);
      }
    });
  }

  // loadDivision(): void {
  //   this.masterService.getAllDivisions().subscribe(
  //     (resp: Division[]) => {
  //       console.log(resp,'Divisions')
  //       this.divisions=resp['data'];
  //     },
  //     (error) => {
  //       this.errorMessage = error.message;
  //       console.error('Error loading:',error);
  //     }
  //   );
  // }

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

  resetForm(): void {
    this.divisionForm.reset();
  }

  openModal(content: any): void {
    this.isEditMode = false;
    this.resetForm();
    this.modalRef = this.modalService.open(content, { centered: false, size: 'lg'});
  }
  
  openEditModal(content: any, DivisionMasterSid: number): void {
    this.isEditMode = true;
    this.DivisionMasterSid = DivisionMasterSid;
    this.getDivisionById(DivisionMasterSid).add(() => {
      this.modalRef = this.modalService.open(content, { centered: false, size: 'lg'});
    });
  }

  updateDivisionById(DivisionMasterSid: number, content: any) {
    this.isEditMode = true;
    this.DivisionMasterSid = DivisionMasterSid;
    this.masterService.getDivisionById(DivisionMasterSid).pipe(take(1)).subscribe({
      next: (division: any) => {
        this.divisionForm.patchValue({
          DivisionName: division.DivisionName,
          DivisionCode: division.DivisionCode,
          CompanyMasterSid: Number(division.CompanyMasterSid),
          Remarks: division.Remarks,
          status: division.status === 'A' ? 'Active' : 'Suspended'
        });
        this.modalRef = this.modalService.open(content, { size: ' lg'});
      },
      error: (err) => {
        console.error('Error fetching', err);
        this.appSettingService.showError('Error fetching data for editing');
      }
    });
  }

  closeModal(): void {
    if (this.modalRef) {
      this.modalRef.close();
    }
  }

  getDivisionById(DivisionMasterSid: number) {
    this.resetForm();
    return this.masterService.getDivisionById(DivisionMasterSid).pipe(take(1)).subscribe(
      (division: any) => {
        console.log('Division from backend:', division);
        this.divisionForm.patchValue({
          DivisionName: division.DivisionName,
          DivisionCode: division.DivisionCode,
          CompanyMasterSid: Number(division.CompanyMasterSid),
          Remarks: division.Remarks,
          status: division.status === 'A' ? 'Active' : 'Suspended'
        });
      },
      (error) => {
        this.appSettingService.showError('Error loading');
      }
    );
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
            if (resp.status) {
              this.appSettingService.showSuccess(resp.message);
              this.closeModal();
              this.router.navigate(['master/division']);
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
            if (resp.status) {
              this.appSettingService.showSuccess(resp.message);
              this.closeModal();
              this.router.navigate(['master/division']);
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
    IA: 'Suspended'
  };

  loadDivisionData(DivisionMasterSid: number) {
    this.masterService.getDivisionById(DivisionMasterSid).subscribe(
      (divisionData) => {
        this.divisionForm.patchValue({
          ...divisionData,
          status: divisionData.status === 'A' ? 'Active' : 'Suspended'
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
      filterValue: this.filterValue
    };

    this.masterService.searchDivision(payload).subscribe((res: any) => {
      this.results = res;
      console.log(this.results)
      this.searchPerformed = true;
      this.updatePaginatedData();
      this.totalLengthOfCollection = this.results.length || 0;
    });
  }

  updatePaginatedData(): void {
    const startIndex = (this.page - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.divisionList = this.results.slice(startIndex, endIndex);
  }

  trackByIndex(index: number, item: any): number {
    return index;
  }

  deleteDivision(DivisionMasterSid) {
    const dialogRef = this.dialog.open(DeleteWarningComponent);
    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        this.masterService.deleteDivision(DivisionMasterSid).subscribe((resp: any) => {
          this.appSettingService.showSuccess("Deleted!");
          this.router.navigate(['master/division/list'])
          this.search();
        });
      }
    });
  }

  getAllCompanies() {
    this.masterService.getAllCompanies().subscribe((res)=> {
      this.companyList = res;
    })
  }

  resetPage(): void {
    this.filterValue = '';
    this.searchType = 'DivisionName';
    this.page = 1;
    this.divisions = [] ;
    this.divisionList = [];
    this.totalLengthOfCollection = 0;
    this.searchPerformed = false;
  }

  report() {  }

}
