import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NgxSpinnerService } from 'ngx-spinner';
import { PdfDownloadService } from 'src/app/common/pdf-download.service';
import { CustomDatePipe } from 'src/app/core/pipes/custom-date-format.pipe';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { MasterService } from 'src/app/modules/master/master.service';

interface summaryDTO {
  revenue : any[];
  cost : any[];
}

@Component({
  selector: 'app-job-card',
  standalone: true,
  imports: [CommonModule, CustomDatePipe],
  templateUrl: './job-card.component.html',
  styles: ``,
})
export class JobCardComponent {
   userData: any;
  currentCompany: any;
  currentBranch: any;
  branchDetails: any;
  currentBranchCityName: string | null;
  currentBranchCityId: number;
  currentDate = new Date();
  @Input() masterJobData: any;
  @Input() containerTypeList: any[] = [];
  @Input() masterJobContainers: any[] = [];
  @Input() packageTypeList: any[] = [];
  @Input() agentList: any[] = [];
  @Input() currencyList: any[] = [];
  @Input() profitSummary: any[] = [];
  @Input() customerWiseSummary : summaryDTO;
  @Input() chargeWiseSummary : any[] = [];
  @Input() chargeList: any[] =[];
  salemanList:any[] = [];

  constructor(
    private appSettingsService: AppSettingsService,
    private activeModal: NgbActiveModal,
    private masterService: MasterService,
    private appSettingService: AppSettingsService,
    private spinner: NgxSpinnerService,
    private pdfService: PdfDownloadService,
  ) { }

  ngOnInit() {
    this.getSalespersons()
    this.userData = this.appSettingsService.getDecryptedUserProfile();
    this.currentCompany = this.appSettingsService.decrypt(
      localStorage.getItem('selected-company')
    );
    this.currentBranch = this.appSettingsService.decrypt(
      localStorage.getItem('selected-branch')
    );
     this.branchDetails = this.appSettingService.getCurrentBranchInfo();
    console.log(this.branchDetails, "BRANCH DETAILS");
    this.currentCompany = ((this.userData.userCompanyMaster || []).find(ucm => ucm.CompanyMasterSid === this.currentCompany?.CompanyMasterSid))?.companyMaster;
    this.currentBranch = ((this.currentCompany.userBranchMaster || []).find(ubm => ubm.BranchMasterSid === this.currentBranch?.BranchMasterSid))?.branchMaster;
    this.currentBranchCityId = Number(this.branchDetails?.CityMasterSid);
    this.loadCityName();
  }

  loadCityName(): void {
    if (!this.currentBranchCityId) return;

    this.spinner.show();

    this.masterService.getCityById(this.currentBranch?.CityMasterSid).subscribe({
      next: (response: any) => {
        console.log("City API response:", response);

        if (response) {
          const ourCity = response;

          this.currentBranchCityName = ourCity ? ourCity.cityName : '';
          console.log("Final City Name:", this.currentBranchCityName);
        }

        this.spinner.hide();
      },
      error: (error) => {
        console.error("Failed to load city:", error);
        this.spinner.hide();
      }
    });
  }

  getSalespersons(){
    this.masterService.getAllSalesperson().subscribe(
      (resp)=>{
        this.salemanList=resp.data;
      }
    )
  }

  getSalespersonName(UserMasterSid:number){
    console.log("GetUserName",{
      id : UserMasterSid,
      list : this.salemanList
    })
    if(!UserMasterSid||this.salemanList.length===0){
      return "";
    }
    return this.salemanList.find(user =>user.UserMasterSid === UserMasterSid)?.userName || ""
  }

  // Helper methods

  getContainerTypeName(ContainerTypeMasterSid: number): string {
    const containerType = this.containerTypeList.find(
      (ct) => ct.ContainerTypeMasterSid === ContainerTypeMasterSid
    );
    return containerType ? containerType.ContainerName : 'Unknown';
  }

  getChargeName(ChargeMasterSid: number): string {
    if (!ChargeMasterSid || !this.chargeList || this.chargeList.length === 0) {
      return 'N/A';
    }
    const charge = this.chargeList.find(
      (c) => c.ChargeMasterSid === ChargeMasterSid
    );
    return charge ? charge.chargeCode || charge.ChargeCode || 'N/A' : 'N/A';
  }

  getCurrencyName(CurrencyMasterSid: number): string {
    console.log('🔍 getCurrencyName called with:', CurrencyMasterSid);
    console.log('📋 currencyList:', this.currencyList);

    if (
      !CurrencyMasterSid ||
      !this.currencyList ||
      this.currencyList.length === 0
    ) {
      return 'N/A';
    }

    const currency = this.currencyList.find(
      (c) => c.CurrencyMasterSid === CurrencyMasterSid
    );
    return currency
      ? currency.currencyCode || currency.CurrencyCode || 'N/A'
      : 'N/A';
  }

  get totalNoOfPkg(): number {
    return this.masterJobContainers.reduce((sum, c) => {
      const value = Number(c.NoOfPkg) || 0;
      return sum + value;
    }, 0);
  }

  get totalGrossWeight(): number {
    return this.masterJobContainers.reduce((sum, c) => {
      const value = Number(c.GrossWeight) || 0;
      return sum + value;
    }, 0);
  }

  get totalVolume(): number {
    return this.masterJobContainers.reduce((sum, c) => {
      const value = Number(c.Volume) || 0;
      return sum + value;
    }, 0);
  }

  get totalNetWeight(): number {
    return this.masterJobContainers.reduce((sum, c) => {
      const value = Number(c.NetWeight) || 0;
      return sum + value;
    }, 0);
  }

  get totalSales() {
    if (!this.profitSummary || !Array.isArray(this.profitSummary)) {
      return 0;
    }

    return this.profitSummary.reduce((sum, c) => {
      const value = Number(c.totalSales) || 0;
      return sum + value;
    }, 0);
  }

  get totalCost() {
    if (!this.profitSummary || !Array.isArray(this.profitSummary)) {
      return 0;
    }

    return this.profitSummary.reduce((sum, c) => {
      const value = Number(c.totalCost) || 0;
      return sum + value;
    }, 0);
  }

  get profit() {
    if (!this.profitSummary || !Array.isArray(this.profitSummary)) {
      return 0;
    }

    return this.profitSummary.reduce((sum, c) => {
      const value = Number(c.profit) || 0;
      return sum + value;
    }, 0);
  }

  modalClose() {
    this.activeModal.close();
  }

    async downloadPDF() {
    this.spinner.show();
    try {
      const quotationNumber = this.masterJobData?.MasterJobNumber;

      await this.pdfService.downloadBalancedPDF(
        'printContent',
        `Job_Card_${quotationNumber}`,
        () => this.appSettingService.showSuccess('PDF downloaded successfully!'),
        (error) => this.appSettingService.showError('Error generating PDF. Please try again.')
      );
    } finally {
      this.spinner.hide();
    }
  }

    printDiv(divId: string): void {
  const printContents = document.getElementById(divId)?.innerHTML;
  if (!printContents) return;

  const popupWin = window.open('', '_blank', 'width=900,height=600');
  if (popupWin) {
    popupWin.document.open();
    popupWin.document.write(`
      <html>
        <head>
          <title>Print</title>
        </head>
        <body onload="window.print(); window.close();">
          ${printContents}
        </body>
      </html>
    `);
    popupWin.document.close();
  }
}
}
