import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NgxSpinnerService } from 'ngx-spinner';
import { PdfMakeService } from 'src/app/common/pdf/pdf-make.service';
import { CustomDatePipe } from 'src/app/core/pipes/custom-date-format.pipe';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { MasterService } from 'src/app/modules/master/master.service';
import { LogoService } from 'src/app/core/services/logo.service';
import { PrintFooterComponent } from 'src/app/shared/components/print-footer/print-footer.component';
import { PrintHeaderComponent } from 'src/app/shared/components/print-header/print-header.component';
import { MenuPermissionService } from 'src/app/core/services/menu-permission.service';

interface summaryDTO {
  revenue : any[];
  cost : any[];
}


@Component({
  selector: 'app-job-card',
  standalone: true,
  imports: [CommonModule, CustomDatePipe,PrintFooterComponent,PrintHeaderComponent],
  templateUrl: './job-card.component.html',
  styles: ``
})
export class JobCardComponent implements OnChanges {
 userData: any;
  currentCompany: any;
  currentBranch: any;
  branchDetails: any;
  currentBranchCityName: string | null;
  currentBranchCityId: number;
  currentDate = new Date();
  @Input() housejobData: any;
  @Input() masterJobData: any;
  @Input() containerTypeList: any[] = [];
  @Input() masterJobContainers: any[] = [];
  @Input() packageTypeList: any[] = [];
  @Input() agentList: any[] = [];
  @Input() currencyList: any[] = [];
   profitSummary: any[] = [];
  @Input() customerWiseSummary : summaryDTO;
  @Input() chargeWiseSummary : any[] = [];
  @Input() chargeList: any[] =[];
  @Input() uomList: any[] = [];
  salemanList:any[] = [];
  @Input() portList: any[] = []; // Add this input
  @Input() selectedDepartmentType : any;
   showPrintLogo: boolean = false;
    showPdfLogo: boolean = true;

  constructor(
    private appSettingsService: AppSettingsService,
    private activeModal: NgbActiveModal,
    private masterService: MasterService,
    private appSettingService: AppSettingsService,
    private spinner: NgxSpinnerService,
    private pdfMakeService: PdfMakeService,
    public logoService : LogoService,
    public mps: MenuPermissionService
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
    this.currentCompany = ((this.userData.userCompanyMaster || []).find(ucm => ucm.CompanyMasterSid === this.currentCompany?.CompanyMasterSid))?.companyMaster;
    this.currentBranch = ((this.currentCompany.userBranchMaster || []).find(ubm => ubm.BranchMasterSid === this.currentBranch?.BranchMasterSid))?.branchMaster;
    this.currentBranchCityId = Number(this.branchDetails?.CityMasterSid);
    this.loadCityName();
    this.calculateChargeWiseProfit();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if(
      changes['housejobData'].previousValue !== changes['housejobData'].currentValue && 
      !changes['housejobData'].firstChange
    ){
      this.calculateChargeWiseProfit();
    }
  }

  loadCityName(): void {
    if (!this.currentBranchCityId) return;

    this.spinner.show();

    this.masterService.getCityById(this.currentBranch?.CityMasterSid).subscribe({
      next: (response: any) => {

        if (response) {
          const ourCity = response;

          this.currentBranchCityName = ourCity ? ourCity.cityName : '';
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
    const CompanyMasterSid = this.currentCompany?.CompanyMasterSid;
    this.masterService.getAllSalesmans(CompanyMasterSid).subscribe(
      (resp)=>{
        this.salemanList=resp;
      }
    )
  }

  getSalespersonName(UserMasterSid:number){

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
    return containerType ? containerType.ContainerName : '';
  }

  getChargeName(ChargeMasterSid: number): string {
    if (!ChargeMasterSid || !this.chargeList || this.chargeList.length === 0) {
      return ' ';
    }
    const charge = this.chargeList.find(
      (c) => c.ChargeMasterSid === ChargeMasterSid
    );
    return charge ? charge.chargeName || charge.ChargeName || 'N/A' : 'N/A';
  }

  getUnitCode(ChargeUomSid: number):string {
   
    if (!ChargeUomSid || !this.uomList || this.uomList.length === 0) {
      return '';
    }
    const uom = this.uomList.find(item => item.UOMMasterSid === ChargeUomSid);
    return uom ? uom.UOMCode : '';
  }

  getCurrencyName(CurrencyMasterSid: number): string {

    if (
      !CurrencyMasterSid ||
      !this.currencyList ||
      this.currencyList.length === 0
    ) {
      return '';
    }

    const currency = this.currencyList.find(
      (c) => c.CurrencyMasterSid === CurrencyMasterSid
    );
    return currency
      ? currency.currencyCode || currency.CurrencyCode || ''
      : 'N/A';
  }

    get totalLength(): number {
    return this.housejobData?.Products?.reduce((sum, c) => {
      const value = Number(c.Length) || 0;
      return sum + value;
    }, 0);
  }
      get totalWidth(): number {
    return this.housejobData?.Products?.reduce((sum, c) => {
      const value = Number(c.Width) || 0;
      return sum + value;
    }, 0);
  }
      get totalHeight(): number {
    return this.housejobData?.Products?.reduce((sum, c) => {
      const value = Number(c.Height) || 0;
      return sum + value;
    }, 0);
  }
      get totalVolumteric(): number {
    return this.housejobData?.Products?.reduce((sum, c) => {
      const value = Number(c.Volumetric) || 0;
      return sum + value;
    }, 0);
  }

  get totalNoOfPkg(): number {
    return this.housejobData?.Products?.reduce((sum, c) => {
      const value = Number(c.ExternlQty) || 0;
      return sum + value;
    }, 0);
  }

  get totalGrossWeight(): number {
    return this.housejobData?.Products?.reduce((sum, c) => {
      const value = Number(c.GrossWeight) || 0;
      return sum + value;
    }, 0);
  }

  get totalVolume(): number {
    return this.housejobData?.Products?.reduce((sum, c) => {
      const value = Number(c.Volume) || 0;
      return sum + value;
    }, 0);
  }

  get totalNetWeight(): number {
    return this.housejobData?.Products?.reduce((sum, c) => {
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

 calculateChargeWiseProfit() {
    this.profitSummary = [];
    const rateFormValue = this.housejobData?.costRevenueCharges|| [];
    const data = [...rateFormValue];

    data.forEach(item => {
      const costAmt = parseFloat(item.CostLocalAmount);
      const revenueAmt = parseFloat(item.RevenueLocalAmount);
      const charge = this.chargeList.find(c => c.ChargeMasterSid === item.ChargeMasterSid);
      const chargeName = charge ? charge.chargeName : "";

      let existing = this.profitSummary.find(p => p.chargeName === chargeName);

      if (!existing) {
        existing = {
          chargeName,
          totalSales: 0,
          totalCost: 0,
          profit: 0,
          profitPercent: "0%"
        };
        this.profitSummary.push(existing);
      }

      // if (item.CostRevenue === "Cost") {
        existing.totalCost += item.CostDrCr === "D" ? costAmt : -costAmt;
      // }

      // if (item.CostRevenue === "Revenue") {
        existing.totalSales += item.RevenueDrCr === "C" ? revenueAmt : -revenueAmt;
      // }
    });

    this.profitSummary.forEach(p => {
      let profit: number;
      let profitPercent: number;

      if (p.totalSales > p.totalCost) {
        profit = p.totalSales - p.totalCost;
        profitPercent = p.totalSales !== 0 ? (profit / p.totalSales) * 100 : 0;
      } else {
        profit = -(p.totalCost - p.totalSales);
        profitPercent = p.totalCost !== 0 ? (profit / p.totalCost) * 100 : 0;
      }

      p.profit = profit.toFixed(2);
      p.profitPercent = profitPercent.toFixed(2) + "%";
      p.totalSales = p.totalSales.toFixed(2);
      p.totalCost = p.totalCost.toFixed(2);
    });

  }

  
 getPortName(portCode: string): string {
    if (!portCode || !this.portList || this.portList.length === 0) {
      return portCode || '';
    }
    
    const port = this.portList.find(p => p.PortCode === portCode);
    return port ? `${port.PortCode} - ${port.PortName}` : portCode;
  }

 getGroupedRevenueByParty() {
  if (!this.housejobData?.costRevenueCharges) return [];

  const map = new Map<string, number>();

  this.housejobData.costRevenueCharges.forEach(item => {
    const party = item?.revenueCustomerMaster?.CustomerName;
    const amount = Number(item?.RevenueLocalAmount) || 0;

    if (party && amount) {
      map.set(party, (map.get(party) || 0) + amount);
    }
  });

  return Array.from(map.entries()).map(([party, amount]) => ({
    party,
    amount
  }));
}

getGroupedExpenseByParty() {
  if (!this.housejobData?.costRevenueCharges) return [];

  const map = new Map<string, number>();

  this.housejobData.costRevenueCharges.forEach(item => {
    const party = item?.costCustomerMaster?.CustomerName;
    const amount = Number(item?.CostLocalAmount) || 0;

    if (party && amount) {
      map.set(party, (map.get(party) || 0) + amount);
    }
  });

  return Array.from(map.entries()).map(([party, amount]) => ({
    party,
    amount
  }));
}



  modalClose() {
    this.activeModal.close();
  }


   async downloadPDF() {


  setTimeout(async () => {
    this.spinner.show();
   try {
      const logo = this.pdfMakeService.getReportLogo();
      this.pdfMakeService.generateJobCardFromApi(
        this.housejobData,
        this.currentCompany,
        this.currentBranch,
        this.userData,
        logo,
        this.getJobCardPdfOptions()
      );
      this.appSettingService.showSuccess('PDF downloaded successfully!');
    } catch (error) {
      console.error('Job card PDF generation failed:', error);
      this.appSettingService.showError('Error generating PDF. Please try again.');
    } finally {
      this.spinner.hide();
    }
  }, 50);
}

  private getJobCardPdfOptions() {
    return {
      containerTypeList: this.containerTypeList || [],
      currencyList: this.currencyList || [],
      chargeList: this.chargeList || [],
      profitSummary: this.profitSummary || [],
      salesmenList: this.salemanList || [],
      uomList: this.uomList || [],
      portList: this.portList || [],
      selectedDepartmentType: this.selectedDepartmentType || ''
    };
  }

  
printDiv(divId: string): void {
  this.showPrintLogo = true;
  this.showPdfLogo = false;

  setTimeout(() => {
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
  }, 50); 
}


}
