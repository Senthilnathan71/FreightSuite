
import { CommonModule, DatePipe } from '@angular/common';
import { Component, TemplateRef } from '@angular/core';
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
import { ExcelExportService } from 'src/app/shared/excel-report-service';
import { DetailsComponent } from 'src/app/component/details/details.component';
import { ListpageComponent} from 'src/app/component/listpage/listpage.component';
import { TermsAndConditionsComponent } from 'src/app/component/terms&conditions/terms&conditions.component';
import { PreventMultiClickDirective } from 'src/app/core/Directives/prevent-multi-click.directive';
import { EmailEntryComponent } from 'src/app/modules/settings/email/email-entry/email-entry.component';
import { AuthorityEntryComponent } from '../../authority/authority-entry/authority-entry.component';
import { EdocComponent } from 'src/app/modules/settings/edoc/edoc/edoc.component';
import { FavoriteStarComponent } from 'src/app/component/favourite/favourite.component';

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
    DatePipe,
    ListpageComponent,
    PreventMultiClickDirective,
    FavoriteStarComponent
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
  isViewMode = false;
  cityList: any[] = [];
  statusList = ["Active", "Suspended"]
  countryList: any[] = [];
  currentMenuId: number;
  TandCList: any;
  stateList: any [] = [];
  countryMap: { [id: number]: string} = {};
  stateMap: { [id: number]: string} = {};
  modalRef!: NgbModalRef;
  searchType = 'cityName';
  filterValue = '';
  searchPerformed = false;
  page = 1;
  pageSize = 10;
  totalLengthOfCollection = 0;
  userData: any;
  cityData : any;
  isFavorite: boolean = false;
  sortColumn: string = 'cityName'; 
  sortDirection: string = 'asc'; 
  allCities: any[] = [];

  toggleFavorite() {
    this.isFavorite = !this.isFavorite;
  } 
  
  constructor(
    private modalService: NgbModal,
    private fb: FormBuilder,
    private masterService: MasterService,
    private appSettingService: AppSettingsService,
    private route: ActivatedRoute,
    private router: Router,
    private dialog: MatDialog,
    private excelReportService: ExcelExportService
  ) { }

  ngOnInit(): void {
     this.appSettingService.getUser().subscribe(user => {
    if (user) {
      this.userData = user;
    }
  });
    this.getAllCountries();
    this.getAllState();
    this.loadCities();
    this.loadCountryAndStateData();
    this.initForm();
    this.route.paramMap.subscribe(params => {
      this.CityMasterSid = +params.get('id');
      if (this.CityMasterSid) {
        this.isEditMode = true;
        // Check if we're in view mode (from query params)
        this.route.queryParams.subscribe(queryParams => {
          this.isViewMode = queryParams['mode'] === 'view';
          this.loadLeadData(this.CityMasterSid);
          // In edit mode, update statusList to include both options
          this.statusList = ["Active", "Suspended"];
          // Enable the status control in edit mode
          this.cityForm.get('status')?.enable();
        });
      }
    });
  }
  loadCities(): void {
  const params = {
    search: this.filterValue?.trim() || '',
    page: this.page,
    pageSize: this.pageSize
  };

  this.masterService.searchCityList(params).subscribe({
    next: (response: any) => {
      if (response) {
        this.cityList = response.items.map((city: any) => {
          const country = this.countryList.find(c => c.CountryMasterSid === city.CountryMasterSid);
          const state = this.stateList.find(s => s.StateMasterSid === city.StateMasterSid);
          return {
            ...city,
            countryName: country ? country.countryName : 'N/A',
            stateName: state ? state.stateName : 'N/A'
          };
        });
        this.totalLengthOfCollection = response.totalCount;
        this.applySorting();
      } else {
        this.cityList = [];
        this.totalLengthOfCollection = 0;
      }
      this.searchPerformed = true;
    },
    error: (err) => {
      console.error('Error loading cities:', err);
    }
  });
}



  loadCountryAndStateData() {
    forkJoin({
      countries: this.masterService.getAllCountry(),
      states: this.masterService.getAllState(),
      city: this.masterService.getAllCity()
    }).subscribe(({ countries, states, city }) => {
      this.countryList = countries.data; 
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

   // Method to load the city data
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
       status: [{value: 'Active', disabled: false}, Validators.required],
    });
  }

  resetForm(): void {
    this.cityForm.get('status')?.disable();
    this.cityForm.reset({
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
        this.cityData = city;
        this.cityForm.get('status')?.enable();
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
  clearFilterValue() {
    this.filterValue = '';
    this.loadCities();
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
    if (this.cityForm.get('status')?.disabled) {
      this.cityForm.get('status')?.enable();
    }
    if (this.cityForm.invalid) {
      this.cityForm.markAllAsTouched(); // Force validation messages to show
      this.cityForm.updateValueAndValidity(); // Ensure validation is refreshed
      this.appSettingService.showWarning('Please fill all required fields correctly.')
      return;
    } else {
      let createdBy = { createdBy: this.appSettingService.userSettingSource.value['userEmail'] };
      let updatedBy = { updatedBy: this.appSettingService.userSettingSource.value['userEmail'] };
      const formValue = this.cityForm.getRawValue(); // Use getRawValue() to get disabled values too

      const payload = (this.isEditMode) ? {
        ...formValue,
        StateMasterSid: Number(formValue.StateMasterSid),
        CountryMasterSid: Number(formValue.CountryMasterSid),
        ...updatedBy,
        status: formValue.status === "Active" ? "A" : "S"
      } : {
        ...formValue,
        StateMasterSid: Number(formValue.StateMasterSid),
        CountryMasterSid: Number(formValue.CountryMasterSid),
        ...createdBy,
        status: "A" // Always Active for create mode
      };

      console.log('payload', payload);

      if (this.isEditMode) {
        this.masterService.updateCityById(this.CityMasterSid, payload).subscribe(
          (resp: any) => {
            console.log(resp.message);
            if (resp.status) {
              this.appSettingService.showSuccess(resp.message);
               this.closeModal();             // <-- Close the modal here
               this.resetForm();              // <-- Reset the form here
              this.router.navigate(['master/city/list']);
            } else {
              this.appSettingService.showError(resp.message);
            }
          },
          (error) => {
            this.errorMessage = error.message;
            console.error('Error loading country:', error);
          }
        );
      } else {
        this.masterService.createCity(payload).subscribe(
          (resp: any) => {
            console.log(resp);
            if (resp.status) {
              this.appSettingService.showSuccess(resp.message);
               this.closeModal();             // <-- Close the modal here
               this.resetForm();              // <-- Reset the form here
              this.router.navigate(['master/city/list']);
            } else {
              this.appSettingService.showError(resp.message);
            }
          },
          (error) => {
            this.errorMessage = error.message;
            console.error('Error loading country:', error);
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
  loadLeadData(leadId: number) {
    this.masterService.getCityById(leadId).subscribe(
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

  
  sort(column: string) {
  if (this.sortColumn === column) {
    // Reverse the sort direction if clicking the same column
    this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
  } else {
    // Set new sort column and default to ascending
    this.sortColumn = column;
    this.sortDirection = 'asc';
  }
  
  this.applySorting();
  this.updatePaginatedData();
}

applySorting() {
    this.cityList.sort((a, b) => {
      let valueA: any;
      let valueB: any;

      // Handle special cases for mapped fields
      if (this.sortColumn === 'countryName') {
        valueA = a.countryName;
        valueB = b.countryName;
      } else if (this.sortColumn === 'stateName') {
        valueA = a.stateName;
        valueB = b.stateName;
      } else {
        valueA = a[this.sortColumn];
        valueB = b[this.sortColumn];
      }

      // Handle null/undefined values
      if (valueA == null) valueA = '';
      if (valueB == null) valueB = '';

      // Convert to string for case-insensitive comparison
      valueA = valueA.toString().toLowerCase();
      valueB = valueB.toString().toLowerCase();

      if (valueA < valueB) {
        return this.sortDirection === 'asc' ? -1 : 1;
      }
      if (valueA > valueB) {
        return this.sortDirection === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }


  updatePaginatedData(): void {
    const startIndex = (this.page - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.loadCities();
  }

  trackByIndex(index: number, item: any): number {
    return index;
  }

  deleteCity(id: number) {
    const dialogRef = this.dialog.open(DeleteWarningComponent);
    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        this.masterService.deleteCityById(id).subscribe((resp: any) => {
          this.appSettingService.showSuccess("Deleted!");
          
        });
      }
    });
  }

  getAllCountries() {
    this.masterService.getAllCountry().subscribe((res) => {
      this.countryList = res.data;
    })
  }

  
  getAllState() {
    this.masterService.getAllState().subscribe((res) => {
      this.stateList = res.data;
    })
  }

  resetPage(): void {
    this.filterValue = '';
    this.searchType = 'cityName';
    this.page = 1;
    this.citys = [] ;
    this.cityList = [];
    this.totalLengthOfCollection = 0;
    this.searchPerformed = false;
    this.sortColumn = 'cityName';
    this.sortDirection = 'asc';
  }

  report(): void {
  const formattedData = this.cityList.map(item => ({
    ...item,
    status: item.status === 'A' ? 'Active' : 'Suspended'
  }));

  const companyName = this.userData?.userBranchMaster?.[0]?.companyMaster?.companyName ?? 'Company';

  this.excelReportService.exportAsExcel({
    data: formattedData,
    headers: [
      { key: 'cityName', label: 'City Name' },
      { key: 'cityCode', label: 'City Code' },
      { key: 'countryName', label: 'Country' },
      { key: 'stateName', label: 'State' },
      { key: 'status', label: 'Status' }
    ],
    fileName: 'City-Report',
    title: companyName
  });
}

  showInfo() {
    if (!this.cityData) return;
    const modalRef = this.modalService.open(DetailsComponent, { size: 'lg', centered: true, backdrop: 'static' });
    modalRef.componentInstance.item = this.cityData;
    modalRef.componentInstance.idLabel = 'City Id';
    modalRef.componentInstance.idValue = this.cityData?.CountryMasterSid;
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
          modalRef.componentInstance.DocumentSid = this.CityMasterSid;

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
  if (!this.cityData) return;
  const modalRef = this.modalService.open(EmailEntryComponent, { 
    size: 'lg', 
    centered: true, 
    backdrop: 'static' 
  });
  modalRef.componentInstance.item = this.cityData;
  modalRef.componentInstance.idLabel = 'City Id';
  modalRef.componentInstance.idValue = this.cityData?.CityMasterSid;
}

openAuthority() {
  if (!this.cityData) return;
  const modalRef = this.modalService.open(AuthorityEntryComponent, { 
    size: 'lg', 
    centered: true, 
    backdrop: 'static' 
  });
  modalRef.componentInstance.item = this.cityData;
  modalRef.componentInstance.idLabel = 'City Id';
  modalRef.componentInstance.idValue = this.cityData?.CityMasterSid;
}

openEDoc() {
  if (!this.cityData) return;
  const modalRef = this.modalService.open(EdocComponent, { 
    size: 'lg', 
    centered: true, 
    backdrop: 'static' 
  });
  modalRef.componentInstance.item = this.cityData;
  modalRef.componentInstance.idLabel = 'City Id';
  modalRef.componentInstance.idValue = this.cityData?.CityMasterSid;
}

  
}
