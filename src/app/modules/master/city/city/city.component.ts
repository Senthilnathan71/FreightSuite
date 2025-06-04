import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { FeatherModule } from 'angular-feather';
import { City } from 'src/app/modules/crm-mobile/Interfaces/city.interface';
import { MasterService } from '../../master.service';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { OnlyTextDirective } from 'src/app/core/Directives/onlyStringOfLength';
import { TextWithNumbersDirective } from 'src/app/core/Directives/textWithNumbers';
import { NgbModal, NgbModalModule, NgbModalRef, NgbPagination } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { MatDialog } from '@angular/material/dialog';
import { forkJoin, take } from 'rxjs';
import { DeleteWarningComponent } from 'src/app/modules/crm-mobile/delete-warning.component';

@Component({
  selector: 'app-city',
  standalone: true,
  imports: [
    FeatherModule,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    OnlyTextDirective,
    TextWithNumbersDirective,
    NgbPagination,
    RouterModule,
    NgbModalModule,
    NgSelectModule,
  ],
  templateUrl: './city.component.html',
  styleUrl: './city.component.scss'
})
export class CityComponent {
  cityForm!: FormGroup;
  isEditMode: boolean = false;
  citys: City[] = [];        // Array to store the leads
  results: any[] = [];
  CityMasterSid!: number;
  errorMessage: string = '';  // To store any error messages
  btnDisable: boolean = false;
  cityList: any[] = [];
  statusList = ["Active", "Suspended"]
  countryList: any;
  stateList: any;
  modalRef!: NgbModalRef;
  searchType = 'cityName';
  filterValue = '';
  searchPerformed = false;
  page = 1;
  pageSize = 5;
  totalLengthOfCollection = 0;

  
  constructor(
    private modalService: NgbModal,
    private fb: FormBuilder,
    private masterService: MasterService,
    private appSettingService: AppSettingsService,
    private route: ActivatedRoute,
    private router: Router,
    private dialog: MatDialog
  ) { }

  ngOnInit(): void {
    this.getAllCountries()
    this.getAllState()
    // this.loadCity()
    this.loadCountryAndStateData();
    this.initForm();
    this.route.paramMap.subscribe(params => {
      this.CityMasterSid = +params.get('id');
      if (this.CityMasterSid) {
        this.isEditMode = true;
        this.loadLeadData(this.CityMasterSid);
      }
    });
  }

  // loadCity(): void {
  //   this.masterService.getAllCity().subscribe(
  //     (resp: City[]) => {
  //       console.log(resp, 'Cities')
  //       this.citys = resp['data'];  // On success, store the leads data in the component
  //     },
  //     (error) => {
  //       this.errorMessage = error.message;  // On error, store the error message
  //       console.error('Error loading leads:', error);  // Optionally log the error
  //     }
  //   );
  // }

  // Initialize the Form
  initForm() {
    this.cityForm = this.fb.group({
      cityName: ['', [Validators.required]],
      cityCode: ['', [Validators.required]],
      StateMasterSid: ['', [Validators.required]],
      CountryMasterSid: ['', [Validators.required]], // Dropdown
      status: ['Active']
    });
  }

  resetForm(): void {
    this.cityForm.reset();
  }

  openModal(content: any): void {
    this.isEditMode = false;
    this.resetForm();
    this.modalRef = this.modalService.open(content, { centered: true, size: 'lg', backdrop: 'static'});
  }

  openEditModal(content: any, id: number): void {
    this.isEditMode = true;
    this.CityMasterSid = id;
    this.getCityById(id).add(() => {
      this.modalRef = this.modalService.open(content, { centered: true, size: 'lg' , backdrop: 'static'});
    });
  }

  updateCityById(id: number, content: any) {
    this.isEditMode = true;
    this.CityMasterSid = id;
    this.masterService.getCityById(id).pipe(take(1)).subscribe({
      next: (city: any) => {
        this.cityForm.patchValue({
          cityName: city.cityName,
          cityCode: city.cityCode,
          CountryMasterSid: Number(city.CountryMasterSid),
          StateMasterSid: Number(city.StateMasterSid),
          status: city.status === 'A' ? 'Active' : 'Suspended'
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

  getCityById(id: number) {
    this.resetForm();
    return this.masterService.getCityById(id).pipe(take(1)).subscribe(
      (city: any) => {
        console.log('City from backend:', city);
        this.cityForm.patchValue({
          cityName: city.cityName,
          cityCode: city.cityCode,
          CountryMasterSid: Number(city.CountryMasterSid),
          StateMasterSid: Number(city.StateMasterSid),
          status: city.status === 'A' ? 'Active' : 'Suspended'
        });
      },
      (error) => {
        this.appSettingService.showError('Error loading');
      }
    );
  }

  onSubmit() {
    if (this.cityForm.invalid) {
      this.cityForm.markAllAsTouched(); // Force validation messages to show
      this.cityForm.updateValueAndValidity(); // Ensure validation is refreshed
      this.appSettingService.showWarning('Please fill all required fields correctly.')
      return;
    } else {
      let createdBy = { createdBy: this.appSettingService.userSettingSource.value['userEmail'] };
      let updatedBy = { updatedBy: this.appSettingService.userSettingSource.value['userEmail'] };
      const formValue = this.cityForm.value;

      const payload = (this.isEditMode) ? {
        ...formValue,
        StateMasterSid: Number(formValue.StateMasterSid),
        CountryMasterSid: Number(formValue.CountryMasterSid),
        ...updatedBy,
        status: formValue.status === "Active" ? "A" : "I"
      } : {
        ...formValue,
        StateMasterSid: Number(formValue.StateMasterSid),
        CountryMasterSid: Number(formValue.CountryMasterSid),
        ...createdBy,
        status: formValue.status === "Active" ? "A" : "I"
      };

      console.log('payload', payload);

      if (this.isEditMode) {
        this.masterService.updateCityById(this.CityMasterSid, payload).subscribe(
          (resp: any) => {
            console.log(resp.message);
            if (resp.status) {
              this.appSettingService.showSuccess(resp.message);
              this.closeModal();
              this.router.navigate(['master/city']);
            } else {
              this.appSettingService.showError(resp.message);
            }
          },
          (error) => {
            this.errorMessage = error.message;
            console.error('Error loading :', error);
          }
        );
      } else {
        this.masterService.createCity(payload).subscribe(
          (resp: any) => {
            console.log(resp);
            if (resp.status) {
              this.appSettingService.showSuccess(resp.message);
              this.closeModal();
              this.router.navigate(['master/city']);
            } else {
              this.appSettingService.showError(resp.message);
            }
          },
          (error) => {
            this.errorMessage = error.message;
            console.error('Error loading :', error);
          }
        );
      }
    }
  }

  // Mapping for API status values
  statusMap: { [key: string]: string } = {
    A: 'Active',
    S: 'Suspended'
  };

  // Fetch lead data and patch the form
  loadLeadData(id: number) {
    this.masterService.getCityById(id).subscribe(
      (leadData) => {
        this.cityForm.patchValue({
          ...leadData,
          CountryMasterSid: leadData.CountryMasterSid,
          StateMasterSid: leadData.StateMasterSid,
          status: leadData.status === 'A' ? 'Active' : 'Suspended'
        });
      },
      (error) => {
        this.appSettingService.showError('Error loading lead data.');
      }
    );
  }

  search() {
    const payload = {
      searchType: this.searchType,
      filterValue: this.filterValue
    };

    this.masterService.searchCityList(payload).subscribe((res: any) => {
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
    this.cityList = this.results.slice(startIndex, endIndex);
  }

  trackByIndex(index: number, item: any): number {
    return index;
  }

  deleteCityById(id) {
      const dialogRef = this.dialog.open(DeleteWarningComponent);
      dialogRef.afterClosed().subscribe(result => {
        if (result === true) {
          this.masterService.deleteCityById(id).subscribe((resp: any) => {
            this.appSettingService.showSuccess("Deleted!");
            this.router.navigate(['master/city'])
            this.search(); 
          });
        }
      });
  }

  getAllCountries() {
    this.masterService.getAllCountry().subscribe((res) => {
      this.countryList = res;
    })
  }

  getAllState() {
    this.masterService.getAllState().subscribe((res) => {
      this.stateList = res;
    })
  }

  loadCountryAndStateData() {
      forkJoin({
        countries: this.masterService.getAllCountry(),
        states: this.masterService.getAllState(),
        city: this.masterService.getAllCity()
      }).subscribe(({ countries, states, city }) => {
        this.countryList = countries.data;  // assuming res.data format
        this.stateList = states.data;
        this.cityList = city.map(city => {
          const country = this.countryList.find(c => c.CountryMasterSid === city.CountryMasterSid);
          const state = this.stateList.find(s => s.StateMasterSid === city.StateMasterSid);
          return {
            ...city,
            countryName: country ? country.countryName : '',
            stateName: state ? state.stateName : ''
          };
        });
      });
    }

  resetPage(): void {
    this.filterValue = '';
    this.searchType = 'cityName';
    this.page = 1;
    this.citys = [] ;
    this.cityList = [];
    this.totalLengthOfCollection = 0;
    this.searchPerformed = false;
  }

  report() {  }
  
}