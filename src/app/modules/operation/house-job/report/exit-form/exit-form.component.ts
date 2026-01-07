import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { NgxSpinnerService } from 'ngx-spinner';
import { PdfDownloadService } from 'src/app/common/pdf-download.service';
import { CustomDatePipe } from 'src/app/core/pipes/custom-date-format.pipe';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { LogoService } from 'src/app/core/services/logo.service';
import { MasterService } from 'src/app/modules/master/master.service';

@Component({
  selector: 'app-exit-form',
  standalone: true,
  imports: [CustomDatePipe, CommonModule],
  templateUrl: './exit-form.component.html',
  styles: ``
})
export class ExitFormComponent {


  currentCompany: any
  currentBranch: any;
  userData: any
  currentDate = new Date()
  branchDetails: any;
  currentBranchCityName: string | null;
  currentBranchCityId: number;

  @Input() housejobData: any;
  @Input() masterJobContainers: any[];
  @Input() withOrWithoutCharge: boolean;
  @Input() selectedFCLLCL: any;

  @Input() currencyList: any;
  @Input() uomList: any;
  @Input() containerTypeList: any;
  containerList: string[] = [];
  showPrintLogo: boolean = false;
  showPdfLogo: boolean = true;

  ngOnInit() {
    this.userData = this.appSettingService.getDecryptedUserProfile();
    this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));
    this.currentBranch = this.appSettingService.decrypt(localStorage.getItem('selected-branch'));
    this.branchDetails = this.appSettingService.getCurrentBranchInfo();
    console.log(this.branchDetails, "BRANCH DETAILS");
    this.currentCompany = ((this.userData.userCompanyMaster || []).find(ucm => ucm.CompanyMasterSid === this.currentCompany?.CompanyMasterSid))?.companyMaster;
    this.currentBranch = ((this.currentCompany.userBranchMaster || []).find(ubm => ubm.BranchMasterSid === this.currentBranch?.BranchMasterSid))?.branchMaster;
    this.currentBranchCityId = Number(this.branchDetails?.CityMasterSid);
    this.prepareContainers();
  }

  prepareContainers() {
    if (this.housejobData?.Products?.length) {
      const set = new Set<string>();
      this.housejobData.Products.forEach((p: any) => {
        if (p.ContainerNo) {
          set.add(p.ContainerNo);
        }
      });
      this.containerList = Array.from(set);
    } else {
      this.containerList = ['—'];
    }
  }

  constructor(
    private activeModal: NgbActiveModal,
    private appSettingService: AppSettingsService,
    private masterService: MasterService,
    private pdfService: PdfDownloadService,
    private spinner: NgxSpinnerService,
    public logoService: LogoService
  ) { }

  modalClose() {
    this.activeModal.close()
  }

  async downloadPDF() {
    this.showPrintLogo = false;
    this.showPdfLogo = true;

    setTimeout(async () => {
      this.spinner.show();
      try {
        const HouseJob = this.housejobData?.ShipmentNo || '';
        await this.pdfService.downloadBalancedPDF(
          'printContent',
          `Indemnity_${HouseJob}`,
          () => this.appSettingService.showSuccess('PDF downloaded successfully!'),
          (error) => this.appSettingService.showError('Error generating PDF. Please try again.')
        );
      } finally {
        this.spinner.hide();
      }
    }, 50);
  }

get hblDateParts() {
  if (!this.housejobData?.HBLDate) {
    return { day: '', month: '', year: '' };
  }

  const dateOnly = new Date(this.housejobData.HBLDate)
    .toISOString()
    .split('T')[0];

  const [year, month, day] = dateOnly.split('-');

  return { day, month, year };
}

get hblETAdate(){
   if (!this.housejobData?.ETA) {
    return { day: '', month: '', year: '' };
  }

  const dateOnly = new Date(this.housejobData.ETA)
    .toISOString()
    .split('T')[0];

  const [year, month, day] = dateOnly.split('-');

  return { day, month, year };
}


get containerNumbers(): string {
  if (!this.housejobData?.Products || this.housejobData.Products.length === 0) {
    return '';
  }

  return this.housejobData.Products
    .map(p => p?.ContainerNo)
    .filter(v => !!v)
    .join(', ');
}

get customsSealNumbers(): string {
  if (!this.housejobData?.masterJob?.containers || this.housejobData.masterJob.containers.length === 0) {
    return '';
  }

  return this.housejobData.masterJob.containers
    .map(c => c?.CustomsSeal)
    .filter(v => !!v)
    .join(', ');
}




  async generatePDFBlob(): Promise<Blob | null> {
    const printContent = document.getElementById('printContent');
    if (!printContent) {
      return null;
    }

    try {
      const canvas = await html2canvas(printContent, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgData = canvas.toDataURL('image/png');

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      return pdf.output('blob');
    } catch (error) {
      console.error('Error generating PDF blob:', error);
      return null;
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
    }, 50); // small timeout so Angular updates DOM
  }

}
