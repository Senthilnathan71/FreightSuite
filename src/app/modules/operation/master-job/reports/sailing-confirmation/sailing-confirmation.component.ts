import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NgxSpinnerService } from 'ngx-spinner';
import { firstValueFrom } from 'rxjs';
import { PdfDownloadService } from 'src/app/common/pdf-download.service';
import { CustomDatePipe } from 'src/app/core/pipes/custom-date-format.pipe';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { MasterService } from 'src/app/modules/master/master.service';


@Component({
  selector: 'app-sailing-confirmation',
  standalone: true,
  imports: [CommonModule, CustomDatePipe],
  templateUrl: './sailing-confirmation.component.html',
  styles: ``
})
export class SailingConfirmationComponent {
 userData: any;
  currentCompany: any;
  currentBranch: any;
  currentBranchCityName: string | null;
  currentBranchCityId: number;
  currentDate = new Date();
  branchDetails: any;
  @Input() masterJobData: any;
  @Input() containerTypeList: any[] = [];
  @Input() masterJobContainers: any[] = [];
  @Input() packageTypeList: any[] = [];
  @Input() agentList: any[] = [];
  @Input() yardList: any[] = [];
   constructor(
     private appSettingsService: AppSettingsService,
     private activeModal: NgbActiveModal,
     private masterService: MasterService,
     private appSettingService: AppSettingsService,
     private spinner: NgxSpinnerService,
     private pdfService: PdfDownloadService,
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

    getContainerTypeName(ContainerTypeMasterSid: number): string {
    const containerType = this.containerTypeList.find(ct => ct.ContainerTypeMasterSid === ContainerTypeMasterSid);
    return containerType ? containerType.ContainerName : 'Unknown';
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
        `Sailing_Confirmation`,
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
