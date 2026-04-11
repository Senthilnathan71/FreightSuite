import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NgxSpinnerService } from 'ngx-spinner';
import { firstValueFrom } from 'rxjs';
import { PdfMakeService } from 'src/app/common/pdf/pdf-make.service';
import { generateSailingConfirmationDocument, transformSailingConfirmationApiData } from 'src/app/common/pdf/generators/sailing-confirmation-pdf.generator';
import { CustomDatePipe } from 'src/app/core/pipes/custom-date-format.pipe';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { LogoService } from 'src/app/core/services/logo.service';
import { MasterService } from 'src/app/modules/master/master.service';
import { MenuPermissionService } from 'src/app/core/services/menu-permission.service';
import { OperationService } from '../../../operation.service';

@Component({
  selector: 'app-sailing-confimation',
  standalone: true,
  imports: [CustomDatePipe, CommonModule],
  templateUrl: './sailing-confimation.component.html',
  styles: ``
})
export class SailingConfimationComponent {

  userData: any;
  currentCompany: any;
  currentBranch: any;
  currentBranchCityName: string | null;
  currentBranchCityId: number;
  currentDate = new Date();
  branchDetails: any;
  @Input() housejobData: any;
  @Input() masterJobData: any;
  @Input() containerTypeList: any[] = [];
  @Input() masterJobContainers: any[] = [];
  @Input() packageTypeList: any[] = [];
  @Input() agentList: any[] = [];
  @Input() yardList: any[] = [];
  @Input() portList: any[] = []; // Add this input
  showPrintLogo: boolean = false;
  showPdfLogo: boolean = true;

  constructor(
    private appSettingsService: AppSettingsService,
    private activeModal: NgbActiveModal,
    private masterService: MasterService,
    private appSettingService: AppSettingsService,
    private spinner: NgxSpinnerService,
    private pdfMakeService: PdfMakeService,
    public logoService: LogoService,
    public mps: MenuPermissionService,
    private operationService: OperationService
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
    this.currentBranchCityId = Number(this.branchDetails?.CityMasterSid);
    this.loadCityName();
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

  getContainerTypeName(ContainerTypeMasterSid: number): string {
    const containerType = this.containerTypeList.find(ct => ct.ContainerTypeMasterSid === ContainerTypeMasterSid);
    return containerType ? containerType.ContainerName : 'Unknown';
  }
  
   getPortName(portCode: string): string {
    if (!portCode || !this.portList || this.portList.length === 0) {
      return portCode || '';
    }
    
    const port = this.portList.find(p => p.PortCode === portCode);
    return port ? `${port.PortCode} - ${port.PortName}` : portCode;
  }
getUniqueContainers(): string[] {
  if (!this.housejobData?.Products) {
    return [];
  }

  return Array.from(
    new Set(
      this.housejobData.Products
        .map(p => p.ContainerNo)
        .filter(c => c) // remove null / empty
    )
  );
}


  modalClose() {
    this.activeModal.close();
  }



  async downloadPDF() {
    this.spinner.show();
    try {
      const logo = this.pdfMakeService.getReportLogo();
      const pdfData = transformSailingConfirmationApiData(
        this.housejobData,
        this.masterJobData,
        this.currentCompany,
        this.currentBranch,
        this.userData,
        logo,
        { ports: this.portList }
      );
      const docDefinition = generateSailingConfirmationDocument(pdfData);
      const fileName = `Sailing_Confirmation${this.masterJobData?.MasterJobNumber || 'Report'}`;
      this.pdfMakeService.download(docDefinition, fileName);
      this.appSettingService.showSuccess('PDF downloaded successfully!');
      const payload = {
        tableName: 'HouseJob',
        recordId: String(this.housejobData?.HouseJobSid),
        operation: 'PDF',
        changedBy: this.appSettingService.userSettingSource.value['userEmail'],
        changes: {
          action: 'PDF Downloaded'
        },
        newVal: {
          PDF: 'Sailing Confirmation PDF Downloaded'
        }
      };

      this.operationService.createAuditLog(payload).subscribe({
        next: () => { },
        error: (err) => console.error(err)
      });
    } catch (error) {
      console.error('Sailing Confirmation PDF generation error:', error);
      this.appSettingService.showError('Error generating PDF. Please try again.');
    } finally {
      this.spinner.hide();
    }
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
