import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NgxSpinnerService } from 'ngx-spinner';
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import {
  generateExitFormDocument,
  transformExitFormApiData,
} from 'src/app/common/pdf/generators/exit-form-pdf.generator';
import { CustomDatePipe } from 'src/app/core/pipes/custom-date-format.pipe';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { LogoService } from 'src/app/core/services/logo.service';
import { MasterService } from 'src/app/modules/master/master.service';

(pdfMake as any).vfs = (pdfFonts as any).pdfMake?.vfs || pdfFonts;

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
        const logo = localStorage.getItem('current_report_logo') || undefined;
        const pdfData = transformExitFormApiData(
          this.housejobData,
          this.currentCompany,
          this.currentBranch,
          this.userData,
          logo,
        );
        const docDefinition = generateExitFormDocument(pdfData);
        pdfMake.createPdf(docDefinition).download(`Exit_Form_${this.housejobData?.HBLNo || 'Report'}.pdf`);
        this.appSettingService.showSuccess('PDF downloaded successfully!');
      } catch (error) {
        console.error('Exit form PDF generation failed:', error);
        this.appSettingService.showError('Error generating PDF. Please try again.');
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
    try {
      const logo = localStorage.getItem('current_report_logo') || undefined;
      const pdfData = transformExitFormApiData(
        this.housejobData,
        this.currentCompany,
        this.currentBranch,
        this.userData,
        logo,
      );
      const docDefinition = generateExitFormDocument(pdfData);

      return await new Promise<Blob>((resolve, reject) => {
        try {
          pdfMake.createPdf(docDefinition).getBlob((blob: Blob) => resolve(blob));
        } catch (error) {
          reject(error);
        }
      });
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
