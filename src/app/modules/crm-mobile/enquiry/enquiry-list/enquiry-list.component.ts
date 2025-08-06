
import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FeatherModule } from 'angular-feather';
import { LeadService } from '../../Services/lead.service';
import { Router } from '@angular/router';
import { AppService } from 'src/app/service/app.service';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { DateFormatPipe } from 'src/app/core/pipes/date-format.pipe';
import { FavoriteStarComponent } from 'src/app/component/favourite/favourite.component';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { CustomDatePipe } from 'src/app/core/pipes/custom-date-format.pipe';
import { ExcelExportService } from 'src/app/shared/excel-report-service';
import { PreventMultiClickDirective } from 'src/app/core/Directives/prevent-multi-click.directive';

@Component({
  selector: 'app-enquiry-list',
  standalone: true,
  imports: [
    CommonModule,
    FeatherModule,
    FormsModule,
    NgbPaginationModule,
    DateFormatPipe,
    FavoriteStarComponent,
    CustomDatePipe,
    PreventMultiClickDirective
  ],
  providers : [CustomDatePipe],
  templateUrl: './enquiry-list.component.html',
  styleUrl: './enquiry-list.component.scss'
})
export class EnquiryListComponent {

  filterValue = ''
  errorMessage: string = '';
  searchPerformed : boolean;

  sortColumn = "EnquiryNumber"
  sortDirection = "asc"

  // pagination
  page = 1;
  pageSize = 10;
  totalLengthOfCollection: number;
  enquiryItems: any[] = [];
  isMobile: boolean = false;
  isDataLoaded: boolean = false;
  enquiryData: any
  userData : any;
  loadingEnquiry :boolean

  constructor(
    private leadService: LeadService, 
    private route: Router, 
    private appService: AppService,
    private appSettingService:AppSettingsService,
    private excelReportService : ExcelExportService,
    private datePipe : CustomDatePipe
  ) { }

  ngOnInit(): void {
    this.searchEnquiry();
    this.isMobile = this.appService.getDevice()
    this.appSettingService.userSettingSource.subscribe(
      (res)=> {
        this.userData = res;
      }
    )
  }

  // Search
  searchEnquiry() {
    const params = {
      search: this.filterValue.trim() || '',
      page: this.page,
      pageSize: this.pageSize,
    }
    this.leadService.searchEnquiry(params).subscribe({
      next: (resp: any) => {
        if (resp.status) {
          this.enquiryItems = resp.data?.items;
          this.totalLengthOfCollection = resp.data?.totalCount || 0;
          this.applySorting();
          this.searchPerformed = true;
        } else {
          this.appSettingService.showError('Error searching Enquiry.');
          console.error('Error searching Enquiry', resp.message)
          this.enquiryItems = [];
          this.totalLengthOfCollection = 0;
        }
      }, error: (error: any) => {
        console.error(error);
      }
    })
  }

  clearFilterValue(){
    this.filterValue = "";
    this.page = 1;
    this.searchEnquiry();
  }

  sort(column: string) {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    this.applySorting();
  }

  applySorting() {
    this.enquiryItems.sort((a, b) => {
      let valueA = a[this.sortColumn];
      let valueB = b[this.sortColumn];
      
      if (valueA == null) valueA = '';
      if (valueB == null) valueB = '';

      if (this.sortColumn === 'ShipmentExpectedDate') {
        valueA = new Date(valueA).getTime();
        valueB = new Date(valueB).getTime();
      }
      
      if (typeof valueA !== 'number' && !(valueA instanceof Date)) {
        valueA = valueA.toString().toLowerCase();
        valueB = valueB.toString().toLowerCase();
      }
      
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
    this.searchEnquiry()
  }

  report(): void {
  const formattedData = this.enquiryItems.map(item => ({
    ...item,
    ShipmentExpectedDate : this.datePipe.transform(item.ShipmentExpectedDate),
    status: item.status === 'A' ? 'Active' : 'Inactive'
  }));

  const companyName = this.userData?.userCompanyMaster?.[0]?.companyMaster?.companyName ?? 'Company';

  this.excelReportService.exportAsExcel({
    data: formattedData,
    headers: [
      { key: 'EnquiryNumber', label: 'Enquiry Number' },
      { key: 'CustomerName', label: 'Customer Name' },
      { key: 'ShipmentType', label: 'Department' },
      { key: 'ShipmentExpectedDate', label: 'Expected Shipment Date' },
      { key: 'TDSset', label: 'Quotation No' },
      { key: 'status', label: 'Status' }
    ],
    fileName: 'Enquiry-Report',
    title: companyName
  });
}



  createNew() {
    this.route.navigate(['crm/enquiry'])
  }

  editEnquiry(id) {
    this.route.navigate(['crm/enquiry', id])
  }

  goForQuotationCreation(EnquiryHeaderSid){
    this.loadingEnquiry = true;
    this.leadService.getEnquiryById(EnquiryHeaderSid).subscribe(
      (resp:any)=>{
        if (resp) {
          const enquiryData = resp;
          const polList = enquiryData?.enquiryRoute.map((route) => route.POLSid);
          const podList = enquiryData?.enquiryRoute.map((route) => route.PODSid);

          const cargoTypeList = enquiryData?.enquiryRoute.flatMap((route) =>
            route.enquiryCargo.map((cargoItem) => cargoItem.cargoType)
          );
          this.leadService.clearQuotationData();

          this.leadService.setQuotationData({
            customerId: enquiryData?.CustomerMasterSid,
            departmentId: enquiryData?.DepartmentMasterSid,
            EnquirySid: enquiryData?.EnquiryHeaderSid,
            EnquiryNumber: enquiryData?.EnquiryNumber,
            polList: polList, 
            podList: podList,
            cargoTypeList: cargoTypeList,
            rateRequest: true,
            active: 2,
          });
          this.loadingEnquiry= false;
          this.route.navigate(['crm/quotation/view']);
        }
      }
    )
  }

    resetFilters(): void {
    this.filterValue = '';
    this.sortColumn = "EnquiryNumber"
    this.sortDirection = "asc"
    this.enquiryItems = [];
    this.totalLengthOfCollection = this.enquiryItems.length;
    this.page = 1;
    this.searchPerformed = false;
  }
}
