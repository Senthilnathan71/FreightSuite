
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
  import { forkJoin } from 'rxjs';

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
    departmentList : any[] = [];
    containerTypeList : any[] = [];

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
    // Company
    currentCompany : any;
    currentBranch : any;
    constructor(
      private leadService: LeadService, 
      private route: Router, 
      private appService: AppService,
      private appSettingService:AppSettingsService,
      private excelReportService : ExcelExportService,
      private datePipe : CustomDatePipe
    ) { }

    ngOnInit(): void {
      this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));
      this.currentBranch = this.appSettingService.decrypt(localStorage.getItem('selected-branch'));
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
      let CompanyMasterSid = this.currentCompany?.CompanyMasterSid;
      let BranchMasterSid = this.currentBranch?.BranchMasterSid;
      const params = {
        search: this.filterValue.trim() || '',
        page: this.page,
        pageSize: this.pageSize,
        activeCompanyId : CompanyMasterSid,
        activeBranchId : BranchMasterSid,
      }
      this.leadService.searchEnquiry(params).subscribe({
        next: (resp: any) => {
          if (resp.status) {
            this.enquiryItems = resp.data?.items;
            this.totalLengthOfCollection = resp.data?.totalCount || 0;
            this.applySorting();
            this.searchPerformed = true;
          } else {
            this.appSettingService.showError(resp.message);
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
      QuotationNO: item.quoteNo ? item.quoteNo : 'N/A',
      ShipmentExpectedDate : this.datePipe.transform(item.ShipmentExpectedDate),
      status: item.status === 'A' ? 'Active' : 'Inactive'
    }));

    // const companyName = this.userData?.userCompanyMaster?.[0]?.companyMaster?.companyName ?? 'Company';
    const companyName = this.currentCompany?.companyName ?? 'Company';
    this.excelReportService.exportAsExcel({
      data: formattedData,
      headers: [
        { key: 'EnquiryNumber', label: 'Enquiry Number' },
        { key: 'QuotationNO', label: 'Quotation No' },
        { key: 'CustomerName', label: 'Customer Name' },
        { key: 'ShipmentType', label: 'Department' },
        { key: 'ShipmentExpectedDate', label: 'Expected Shipment Date' },
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

    goForQuotationCreation(EnquiryHeaderSid) {
      const CompanyMasterSid = this.currentCompany?.CompanyMasterSid;
      this.loadingEnquiry = true;
      forkJoin({
        
        containerTypes: this.leadService.getAllContainerTypes(),
        departments: this.leadService.getAllDepartments(CompanyMasterSid)
      }).subscribe(({ containerTypes, departments }) => {
        this.containerTypeList = containerTypes;
        this.departmentList = departments;

        this.leadService.getEnquiryById(EnquiryHeaderSid).subscribe(
          (resp: any) => {
            if (resp) {
              const enquiryData = resp.data;
              this.navigateQuotation(enquiryData);
              this.loadingEnquiry = false;
            }
          }
        )
      })
    }


    navigateQuotation(response: any) {
      console.log(response);
      const dept = this.departmentList.find(dep => dep.DepartmentMasterSid === response.DepartmentMasterSid);
      console.log(dept);
      let selectedFCLLCL;
      if (dept?.departmentType === "Sea") {
        selectedFCLLCL = dept?.FCLLCL;
      } else {
        selectedFCLLCL = dept?.departmentType?.toUpperCase();
      }

      let routeDetails = response.enquiryRoute.flatMap(route => {
        return route.enquiryCargo.map(cargo => {
          const containerTypeId = this.containerTypeList.find(
            con => con.ContainerName === cargo.ContainerType
          )?.ContainerTypeMasterSid || null;
          return {
            PORSid: route.PORSid,
            POLSid: route.POLSid,
            PODSid: route.PODSid,
            FPODSid: route.FDPSid,
            CargoType: cargo.CargoType,
            CBM: cargo.Volume,
            ContainerType: containerTypeId,
            ChargeableWeight : cargo.ChargeableWeight,
            ContainerQty: cargo.Qty
          };
        });
      });

      const enqData = {
        EnquirySid: response?.EnquiryHeaderSid,
        EnquiryNumber: response?.EnquiryNumber,
        CustomerMasterSid: response?.CustomerMasterSid,
        CustomerName: response?.CustomerName,
        CustomerAddress: response?.CustomerAddress,
        Email: response?.Email,
        DepartmentMasterSid: response.DepartmentMasterSid,
        segment: selectedFCLLCL,
        rateReq: true,
        enqRoutes: routeDetails
      };
      this.leadService.clearQuotationData();
      this.leadService.setQuotationData(enqData);
      this.route.navigate(['crm/quotation/entry']);
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
