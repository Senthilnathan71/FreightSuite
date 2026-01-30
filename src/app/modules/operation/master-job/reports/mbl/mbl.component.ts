import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NgxSpinnerService } from 'ngx-spinner';
import { PdfDownloadService } from 'src/app/common/pdf-download.service';
import { TermsAndConditionsComponent } from 'src/app/component/terms&conditions/terms&conditions.component';
import { CustomDatePipe } from 'src/app/core/pipes/custom-date-format.pipe';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { LogoService } from 'src/app/core/services/logo.service';
import { MasterService } from 'src/app/modules/master/master.service';

@Component({
  selector: 'app-mbl',
  standalone: true,
  imports: [CommonModule, CustomDatePipe],
  templateUrl: './mbl.component.html',
  styles: ``,
})
export class MblComponent {
  currentCompany: any;
  currentBranch: any;
  userData: any;
  currentDate = new Date();
  branchDetails: any;
  currentMenuId: any;
  TandCList: any[] = [];
  
  currentBranchCityName: string | null;
  currentBranchCityId: number;
  @Input() masterJobData: any;
  @Input() masterJobContainers: any[];
  @Input() withOrWithoutCharge: boolean;
  @Input() selectedFCLLCL: any;
  @Input() agentList: any;
  @Input() currencyList: any;
  @Input() uomList: any;
  @Input() containerTypeList: any;
  @Input() packageTypeList: any[] = [];
  @Input() selectedReport: 'MBL' | 'MBLDraft' = 'MBL'; 

  ngOnInit() {
    this.userData = this.appSettingService.getDecryptedUserProfile();
    this.currentCompany = this.appSettingService.decrypt(
      localStorage.getItem('selected-company')
    );
    this.currentBranch = this.appSettingService.decrypt(
      localStorage.getItem('selected-branch')
    );
    this.branchDetails = this.appSettingService.getCurrentBranchInfo();
    this.currentCompany = ((this.userData.userCompanyMaster || []).find(ucm => ucm.CompanyMasterSid === this.currentCompany?.CompanyMasterSid))?.companyMaster;
    this.currentBranch = ((this.currentCompany.userBranchMaster || []).find(ubm => ubm.BranchMasterSid === this.currentBranch?.BranchMasterSid))?.branchMaster;
    this.currentBranchCityId = Number(this.branchDetails?.CityMasterSid);
    this.loadCityName();
  }

  constructor(
    private activeModal: NgbActiveModal,
    private masterService: MasterService,
    private appSettingService: AppSettingsService,
    private spinner: NgxSpinnerService,
    private pdfService: PdfDownloadService,
    private modalService: NgbModal,
    public logoService : LogoService
  ) { }

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

  getDestinationAgentName(CustomerMasterSid: number | string): string {
    const agent = this.agentList.find(
      (a) => a.CustomerMasterSid == CustomerMasterSid
    );
    return agent ? agent.CustomerName : '';
  }

  getAgentName(AgentSid: number) {
    if (!AgentSid || this.agentList.length === 0) return '';
    const agent = this.agentList.find(
      (agent) => agent.CustomerMasterSid === AgentSid
    );
    return agent ? agent.CustomerName : '';
  }

  gettotalNoOfPkg(): number {
    return this.masterJobContainers.reduce((sum, c) => {
      const value = Number(c.NoOfPkg) || 0;
      return sum + value;
    }, 0);
  }

  totalGrossWeight(): number {
    const containers = this.masterJobData?.containers || [];

    return containers.reduce((sum: number, item: any) => {
      const weight = Number(item?.GrossWeight) || 0;
      return sum + weight;
    }, 0);
  }

  totalVolume(): number {
    const containers = this.masterJobData?.containers || [];

    return containers.reduce((sum: number, item: any) => {
      const volume = Number(item?.Volume) || 0;
      return sum + volume;
    }, 0);
  }

  getPackageTypeName(pkgTypeSid: number): string {
    if (!pkgTypeSid) return 'Unknown';
    const packageType = this.packageTypeList.find(pt => pt.UOMMasterSid === pkgTypeSid);
    return packageType ? packageType.UOMName : 'Unknown';
  }
  modalClose() {
    this.activeModal.close();
  }


   async downloadPDF() {
  this.showPrintLogo = false;
  this.showPdfLogo = true;

  setTimeout(async () => {
    this.spinner.show();
   try {
     const quotationNumber = this.masterJobData?.MBLNo;
      await this.pdfService.downloadBalancedPDF(
        'printContent',
        `MBL_${quotationNumber}`,
        () => this.appSettingService.showSuccess('PDF downloaded successfully!'),
        (error) => this.appSettingService.showError('Error generating PDF. Please try again.')
      );
    } finally {
      this.spinner.hide();
    }
  }, 50);
}


  showPrintLogo: boolean = false;
  showPdfLogo: boolean = true;

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
  }, 50); // small timeout so Angular updates DOM
}


openTandC(){
    this.currentMenuId=Number(localStorage.getItem('currentMenuId'));
    const payload = { MenuMasterSid: this.currentMenuId };
    this.masterService.getTandCByCondition(payload).subscribe((resp: any) => {
      if(resp.status) {
        this.TandCList = resp.data;
        const modelRef = this.modalService.open(TermsAndConditionsComponent,{
          size: 'lg',
          backdrop: 'static',
          centered: true,
        });
        modelRef.componentInstance.terms = this.TandCList;
        modelRef.componentInstance.MenuMasterSid = this.currentMenuId;
        modelRef.componentInstance.DocumentSid = this.masterJobData?.MasterJobSid;
      } else {
        this.appSettingService.showError('Error loading Terms and Conditions');
      }
  },(error)=>{
    this.appSettingService.showError('Error loading Terms and Conditions',error);
  });
}

}