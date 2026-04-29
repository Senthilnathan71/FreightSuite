import { CommonModule } from '@angular/common';
import { Component, Input, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NgxSpinnerService } from 'ngx-spinner';
import { PdfMakeService } from 'src/app/common/pdf/pdf-make.service';
import { CustomDatePipe } from 'src/app/core/pipes/custom-date-format.pipe';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { EmailTriggerService } from 'src/app/modules/email/email-trigger.service';
import { MasterService } from 'src/app/modules/master/master.service';
import { LogoService } from 'src/app/core/services/logo.service';
import { OperationService } from '../../../operation.service';
import { PrintHeaderComponent } from 'src/app/shared/components/print-header/print-header.component';
import { PrintFooterComponent } from 'src/app/shared/components/print-footer/print-footer.component';
import { EmailEntryComponent } from 'src/app/modules/settings/email/email-entry/email-entry.component';
interface summaryDTO {
  revenue : any[];
  cost : any[];
}

@Component({
  selector: 'app-job-card',
  standalone: true,
  imports: [CommonModule, CustomDatePipe,PrintHeaderComponent,PrintFooterComponent],
  templateUrl: './job-card.component.html',
  styles: ``,
})
export class JobCardComponent implements AfterViewInit{
  @ViewChild('jobCardContainer') jobCardContainer!: ElementRef;
  @ViewChild('contentArea') contentArea!: ElementRef;
  isLargeData = false;
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
  @Input() profitSummary: any[] = [];
  @Input() customerWiseSummary : summaryDTO;
  @Input() chargeWiseSummary : any[] = [];
  chargeList: any[] =[];
  @Input() uomList: any[] = [];
  salemanList:any[] = [];
  @Input() portList: any[] = []; // Add this input
  @Input() currentMenuId: number | null = null;

  @Input() selectedFCLLCL: string = '';
  constructor(
    private appSettingsService: AppSettingsService,
    private activeModal: NgbActiveModal,
    private masterService: MasterService,
    private appSettingService: AppSettingsService,
    private spinner: NgxSpinnerService,
    private pdfMakeService: PdfMakeService,
    public logoService : LogoService,
    private operationService: OperationService,
    private emailTriggerService: EmailTriggerService,
    private modalService: NgbModal
  ) { }

  ngOnInit() {
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
    this.getSalespersons();
    this.currentBranchCityId = Number(this.branchDetails?.CityMasterSid);
    this.loadCityName();
    this.loadCharges();
  }

 ngAfterViewInit(): void {
  setTimeout(() => {
    this.checkContentHeight();
  }, 300);
}

checkContentHeight(): void {
  const container = this.jobCardContainer?.nativeElement;
  const content = this.contentArea?.nativeElement;

  if (!container || !content) return;

  const containerHeight = container.offsetHeight;
  const contentHeight = content.offsetHeight;

  // footer normal flow when content reaches near bottom
  this.isLargeData = contentHeight > (containerHeight - 120);
}

  loadCharges(): void {
    if (Array.isArray(this.chargeList) && this.chargeList.length > 0) {
      return;
    }

    const companyMasterSid = this.currentCompany?.CompanyMasterSid;
    if (!companyMasterSid) {
      this.chargeList = [];
      return;
    }

    this.operationService.getAllCharges(companyMasterSid).subscribe({
      next: (charges: any) => {
        this.chargeList = Array.isArray(charges) ? charges : (charges?.data || []);
      },
      error: (error) => {
        console.error('Failed to load charges for job card:', error);
        this.chargeList = [];
      }
    });
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
    const CompanyMasterSid = this.currentCompany?.CompanyMasterSid;
    if (!CompanyMasterSid) {
      this.salemanList = [];
      return;
    }

    this.masterService.getAllSalesmans(CompanyMasterSid).subscribe(
      (resp)=>{
        this.salemanList=resp;
      }
    )
  }

getSalesmanName(salesmanSid: number): string {
  const salesman = this.salemanList.find(s => s.UserMasterSid === salesmanSid);
  return salesman ? salesman.userName : '';
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
    console.log(uom);
    return uom ? uom.UOMCode : '';
  }

  getCurrencyName(CurrencyMasterSid: number): string {
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

  
 getPortName(portCode: string): string {
    if (!portCode || !this.portList || this.portList.length === 0) {
      return portCode || '';
    }
    
    const port = this.portList.find(p => p.PortCode === portCode);
    return port ? `${port.PortCode} - ${port.PortName}` : portCode;
  }

 getGroupedRevenueByParty(charges: any[] = []) {
  if (!Array.isArray(charges) || charges.length === 0) return [];

  const map = new Map<string, number>();

  charges.forEach(item => {
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

getGroupedExpenseByParty(charges: any[] = []) {
  if (!Array.isArray(charges) || charges.length === 0) return [];

  const map = new Map<string, number>();

  charges.forEach(item => {
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

getChargeColumnTotal(charges: any[] = [], field: 'RevenueRate' | 'RevenueLocalAmount' | 'CostRate' | 'CostLocalAmount') {
  if (!Array.isArray(charges) || charges.length === 0) return 0;

  return charges.reduce((total, item) => total + (Number(item?.[field]) || 0), 0);
}

getGrandChargeColumnTotal(field: 'RevenueRate' | 'RevenueLocalAmount' | 'CostRate' | 'CostLocalAmount') {
  const masterCharges = Array.isArray(this.masterJobData?.costRevenueCharges)
    ? this.masterJobData.costRevenueCharges
    : [];
  const houseCharges = Array.isArray(this.masterJobData?.houseJob)
    ? this.masterJobData.houseJob.flatMap((house: any) =>
        Array.isArray(house?.costRevenueCharges) ? house.costRevenueCharges : []
      )
    : [];

  return this.getChargeColumnTotal([...masterCharges, ...houseCharges], field);
}



  modalClose() {
    this.activeModal.close();
  }


   async downloadPDF() {
  setTimeout(async () => {
    this.spinner.show();
   try {
      const logo = this.pdfMakeService.getReportLogo();
      this.pdfMakeService.generateMasterJobCardFromApi(
        this.masterJobData,
        this.currentCompany,
        this.currentBranch,
        this.userData,
        logo,
        this.getMasterJobCardPdfOptions()
      );
      this.appSettingService.showSuccess('PDF downloaded successfully!');
    } finally {
      this.spinner.hide();
    }
  }, 50);
}

  async generatePDFBlob(): Promise<Blob | null> {
    try {
      const logo = this.pdfMakeService.getReportLogo();
      return await this.pdfMakeService.generateMasterJobCardBlobFromApi(
        this.masterJobData,
        this.currentCompany,
        this.currentBranch,
        this.userData,
        logo,
        this.getMasterJobCardPdfOptions()
      );
    } catch (error) {
      console.error('Error generating Job Card PDF blob:', error);
      return null;
    }
  }

  async openEmailModal(): Promise<void> {
    this.spinner.show();
    try {
      const blob = await this.generatePDFBlob();
      if (!blob) {
        this.appSettingService.showError('No data available to generate PDF');
        return;
      }

      const documentName = 'Job Card';
      const documentNo = this.masterJobData?.MasterJobNumber || '';
      const documentDate = this.formatEmailDate(this.masterJobData?.MasterJobDate);
      const destinationAgentSid = Number(this.masterJobData?.DestinationAgent);
      if (!Number.isFinite(destinationAgentSid) || destinationAgentSid <= 0) {
        this.appSettingService.showError('Destination Agent is required to send email.');
        return;
      }

      const emailRecipients = await this.emailTriggerService.resolveCustomerBranchEmailRecipientsByMenu({
        customerBranchSid: null,
        customerMasterSid: destinationAgentSid,
        menuMasterSid: this.getCurrentMenuMasterSidForEmail()
      });

      if (emailRecipients.toEmail.length === 0) {
        this.appSettingService.showError('No email found in customer branch email.');
        return;
      }

      const emailContent = this.emailTriggerService.buildOperationEmailContent({
        documentName,
        documentNoLabel: 'Master Job No.',
        documentNo,
        documentDate,
        pol: this.masterJobData?.POL || '',
        pod: this.masterJobData?.POD || '',
        fpd: this.masterJobData?.FPD || '',
        userName: this.userData?.userName || '',
        introLine: `Please find attached the ${documentName} for your reference.`,
        followupLine: 'Kindly review the attached details at your convenience.'
      });

      const file = new File([blob], `Job_Card_${documentNo || 'Report'}.pdf`, { type: 'application/pdf' });
      const emailRef = this.modalService.open(EmailEntryComponent, { size: 'lg' });
      emailRef.componentInstance.setContent = {
        EmailTo: emailRecipients.toEmail,
        EmailCC: emailRecipients.ccEmail,
        EmailBCC: [],
        Subject: emailContent.subject,
        Mailbody: emailContent.body,
        context: {
          documentName,
          documentNoLabel: 'Master Job No',
          menuName: documentName,
          documentNo,
          date: documentDate,
          pol: this.masterJobData?.POL || '',
          pod: this.masterJobData?.POD || '',
          fpd: this.masterJobData?.FPD || ''
        },
        attachments: [file]
      };
      emailRef.componentInstance.dataChange.subscribe(() => {
        this.createEmailAuditLog(documentName);
      });
    } catch (error) {
      console.error('Job Card email error:', error);
      this.appSettingService.showError('Error preparing email');
    } finally {
      this.spinner.hide();
    }
  }

  private createEmailAuditLog(documentName: string): void {
    const payload = {
      tableName: 'MasterJob',
      recordId: String(this.masterJobData?.MasterJobSid),
      operation: 'EMAIL',
      changedBy: this.appSettingService.userSettingSource.value['userEmail'],
      changes: {
        action: 'Send Mail'
      },
      newVal: {
        Email: `${documentName} Mail Send`
      }
    };

    this.operationService.createAuditLog(payload).subscribe({
      next: () => { },
      error: (err) => console.error(err)
    });
  }

  private getCurrentMenuMasterSidForEmail(): number | null {
    const sid = Number(
      this.currentMenuId ||
      this.masterJobData?.MenuMasterSid ||
      sessionStorage.getItem('currentMenuId')
    );

    return Number.isFinite(sid) && sid > 0 ? sid : null;
  }

  private formatEmailDate(value: any): string {
    if (!value) return '';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString('en-GB');
  }

  private getMasterJobCardPdfOptions() {
    return {
      containerTypeList: this.containerTypeList || [],
      currencyList: this.currencyList || [],
      chargeList: this.chargeList || [],
      profitSummary: this.profitSummary || [],
      salesmenList: this.salemanList || [],
      uomList: this.uomList || [],
      portList: this.portList || [],
      selectedFCLLCL: this.selectedFCLLCL || ''
    };
  }

  
printDiv(divId: string): void {


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
