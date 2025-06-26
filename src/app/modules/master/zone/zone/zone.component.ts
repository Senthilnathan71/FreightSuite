import { CommonModule, DatePipe } from '@angular/common';
import { Component, TemplateRef } from '@angular/core';
import { FormsModule, FormGroup, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { FeatherModule } from 'angular-feather';
import { NgbModalModule, NgbPagination, NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { DeleteWarningComponent } from 'src/app/modules/crm-mobile/delete-warning.component';
import { MasterService } from '../../master.service';
import { Zone } from 'src/app/modules/crm-mobile/Interfaces/zone.interface';
import { NgSelectModule } from '@ng-select/ng-select';
import { OnlyTextDirective } from 'src/app/core/Directives/onlyStringOfLength';
import { TextWithNumbersDirective } from 'src/app/core/Directives/textWithNumbers';
import { take } from 'rxjs';
import { authService } from 'src/app/modules/authentication/auth.service';
import { ExcelExportService } from 'src/app/shared/excel-report-service';
import { DetailsComponent } from 'src/app/component/details/details.component';
import { ListpageComponent } from 'src/app/component/listpage/listpage.component';
import { PreventMultiClickDirective } from 'src/app/core/Directives/prevent-multi-click.directive';
import { TermsAndConditionsComponent } from 'src/app/component/terms&conditions/terms&conditions.component';

@Component({
  selector: 'app-zone',
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
    TextWithNumbersDirective,
    DatePipe,
    ListpageComponent,
    PreventMultiClickDirective
  ],
  templateUrl: './zone.component.html',
  styleUrl: './zone.component.scss'
})
export class ZoneComponent {
  zoneForm!: FormGroup;
  isEditMode: boolean = false;
  zones: Zone[] = [];
  results: any[] = [];
  ZoneMasterSid!: number;
  errorMessage: string = '';
  btnDisable: boolean = false;
  zoneList: any[] = [];
  statusList = ["Active", "Suspended"]
  modalRef!: NgbModalRef;
  searchType = 'ZoneName';
  filterValue = '';
  searchPerformed = false;
  page = 1;
  pageSize = 10;
  totalLengthOfCollection = 0;
  userData : any;
  zoneData : any;
  currentMenuId: number;
  TandCList: any;

  constructor(
   private modalService: NgbModal,
   private fb: FormBuilder,
   private masterService: MasterService,
   private route: ActivatedRoute,
   private router: Router,
   private appSettingService: AppSettingsService,
   private dialog: MatDialog,
   private userService : authService,
   private excelReportService : ExcelExportService
  ) {}

  ngOnInit(): void {
    // this.loadZone();
    this.appSettingService.getUser().subscribe(user=>{
      if (user) {
        this.userData = user;
      }
    })
    this.initForm();
    this.route.paramMap.subscribe(params => {
      this.ZoneMasterSid = +params.get('id');
      if (this.ZoneMasterSid) {
        this.isEditMode = true;
        this.loadZoneData(this.ZoneMasterSid);
      }
    });
  }

  // loadZone(): void {
  //   this.masterService.getAllZone().subscribe(
  //     (resp: Zone[]) => {
  //       console.log(resp,'Zones')
  //       this.zones=resp['data'];
  //     },
  //     (error) => {
  //       this.errorMessage = error.message;
  //       console.error('Error loading:',error);
  //     }
  //   );
  // }

  initForm() {
    this.zoneForm = this.fb.group({
      ZoneCode: ['', [Validators.required]],
      ZoneName: ['', [Validators.required]],
      status: [{value: 'Active', disabled: false}, Validators.required],
    });
  }

   resetForm(): void {

    this.zoneForm.get('status')?.disable();
    this.zoneForm.reset({
      status: 'Active'
    });
  }

  openModal(content: any): void {
    this.isEditMode = false;
    this.resetForm();
    this.modalRef = this.modalService.open(content, { centered: true, size: 'lg', backdrop: 'static'});
  }
  
  openEditModal(content: any, id: number): void {
    this.isEditMode = true;
    this.ZoneMasterSid = id;
    this.getZoneById(id).add(() => {
      this.modalRef = this.modalService.open(content, { centered: true, size: 'lg', backdrop: 'static'});
    });
  }

  updateZoneById(id: number, content: any) {
    this.isEditMode = true;
    this.ZoneMasterSid = id;
    this.masterService.getZoneById(id).pipe(take(1)).subscribe({
      next: (zone: any) => {
        this.zoneData = zone;
        this.zoneForm.get('status')?.enable();
        this.zoneForm.patchValue({
          ZoneName: zone.ZoneName,
          ZoneCode: zone.ZoneCode,
          status: zone.status === 'A' ? 'Active' : 'Suspended'
        });
        this.modalRef = this.modalService.open(content, { centered: true, size: 'lg', backdrop: 'static'});
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

  getZoneById(id: number) {
    this.resetForm();
    return this.masterService.getZoneById(id).pipe(take(1)).subscribe(
      (zone: any) => {
        console.log('Zone from backend:', zone);
        this.zoneForm.patchValue({
          ZoneName: zone.ZoneName,
          ZoneCode: zone.ZoneCode,
          status: zone.status === 'A' ? 'Active' : 'Suspended'
        });
      },
      (error) => {
        this.appSettingService.showError('Error loading');
      }
    );
  }

  onSubmit() {
    if (this.zoneForm.get('status')?.disabled) {
      this.zoneForm.get('status')?.enable();
    }
    if (this.zoneForm.invalid) {
      this.zoneForm.markAllAsTouched();
      this.zoneForm.updateValueAndValidity();
      this.appSettingService.showWarning('Please fill all required fields correctly.');
      return;
    } else {
      let createdBy = { createdBy: this.appSettingService.userSettingSource.value['userEmail'] };
      let updatedBy = { updatedBy: this.appSettingService.userSettingSource.value['userEmail'] };
      const formValue = this.zoneForm.value;

      const payload = (this.isEditMode) ? {
        ...formValue,
        ...updatedBy,
        status: formValue.status === "Active" ? "A" : "I"
      } : {
        ...formValue,
        ...createdBy,
        status: formValue.status === "Active" ? "A" : "I"
      };

      console.log('payload', payload);

      if (this.isEditMode) {
        this.masterService.updateZoneById(this.ZoneMasterSid, payload).subscribe(
          (resp: any) => {
            if (resp.status) {
              this.appSettingService.showSuccess(resp.message);
              this.closeModal();
              this.router.navigate(['master/zone']);
            } else {
              this.appSettingService.showError(resp.message);
            }
          },
          (error) => {
            this.errorMessage = error.message;
            console.error('Update Zone Error:', error);
          }
        );
      } else {
        this.masterService.createNewZone(payload).subscribe(
          (resp: any) => {
            if (resp.status) {
              this.appSettingService.showSuccess(resp.message);
              this.closeModal();
              this.router.navigate(['master/zone']);
            } else {
              this.appSettingService.showError(resp.message);
            }
          },
          (error) => {
            this.errorMessage = error.message;
            console.error('Create Zone Error:', error);
          }
        );
      }
    }
  }

  statusMap: { [key: string]: string } = {
    A: 'Active',
    IA: 'Suspended'
  };

  loadZoneData(id: number) {
    this.masterService.getZoneById(id).subscribe(
      (zoneData) => {
        this.zoneForm.patchValue({
          ...zoneData,
          status: zoneData.status === 'A' ? 'Active' : 'Suspended'
        },
        );
      },
      (error) => {
        this.appSettingService.showError('Error loading data.');
      }
    );
  }

  onSearch(event: { type: string, value: string }) {
  this.searchType = event.type;
  this.filterValue = event.value;
  console.log('Searching with:', this.searchType, this.filterValue);
  this.search();
}

  search() {
    const payload = {
      searchType: this.searchType,
      filterValue: this.filterValue
    };

    this.masterService.searchZone(payload).subscribe((res: any) => {
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
    this.zoneList = this.results.slice(startIndex, endIndex);
  }

  trackByIndex(index: number, item: any): number {
    return index;
  }

  softDeleteZone(id) {
    const dialogRef = this.dialog.open(DeleteWarningComponent);
    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        this.masterService.softDeleteZone(id).subscribe((resp: any) => {
          this.appSettingService.showSuccess("Deleted!");
          this.router.navigate(['master/zone'])
          this.search();
        });
      }
    });
  }

  resetPage(): void {
    this.filterValue = '';
    this.searchType = 'ZoneName';
    this.page = 1;
    this.zones = [] ;
    this.zoneList = [];
    this.totalLengthOfCollection = 0;
    this.searchPerformed = false;
  }

  report() {
    const formattedData = this.zoneList.map(item => ({
      ...item,
      status : item.status === 'A' ? "Active" : "Suspended"
    }));
    const companyName = this.userData?.userBranchMaster?.[0]?.companyMaster?.companyName ?? 'Company';

    this.excelReportService.exportAsExcel({
      data: formattedData,
      headers: [
        { key: 'ZoneName', label: 'Zone Name' },
        { key: 'ZoneCode', label: 'Zone Code' },
        { key: 'status', label: 'Status' }
      ],
      fileName: 'Zone-Report', 
      title: companyName
    });
  }

  showInfo() {
    if (!this.zoneData) return;
    const modalRef = this.modalService.open(DetailsComponent, { size: 'lg', centered: true, backdrop: 'static' });
    modalRef.componentInstance.item = this.zoneData;
    modalRef.componentInstance.idLabel = 'Zone Id';
    modalRef.componentInstance.idValue = this.zoneData?.ZoneMasterSid;
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
					modalRef.componentInstance.DocumentSid = this.ZoneMasterSid;

				} else {
					this.appSettingService.showError('Error loading Terms and Conditions');
				}
			},
			(error) => {
				this.appSettingService.showError('Error loading Terms and Conditions', error);
			}
		);
	}

}
