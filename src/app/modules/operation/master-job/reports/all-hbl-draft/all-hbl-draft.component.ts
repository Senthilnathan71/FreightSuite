import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NgxSpinnerService } from 'ngx-spinner';
import { firstValueFrom } from 'rxjs';
import { take } from 'rxjs/operators';
import {
  generateAllHblDocument,
  transformAllHblItemApiData,
} from 'src/app/common/pdf/generators/all-hbl-pdf.generator';
import { CustomDatePipe } from 'src/app/core/pipes/custom-date-format.pipe';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { OperationService } from '../../../operation.service';
import { LogoService } from 'src/app/core/services/logo.service';

@Component({
  selector: 'app-all-hbl-draft',
  standalone: true,
  imports: [CustomDatePipe, CommonModule],
  templateUrl: './all-hbl-draft.component.html',
  styles: ``,
})
export class AllHBLDraftComponent {
  currentCompany: any;
  currentBranch: any;
  userData: any;
  currentDate = new Date();
  branchDetails: any;
  currentBranchCityName: string | null;
  currentBranchCityId: number;

  @Input() housejobData: any;
  @Input() masterJobContainers: any[];
  @Input() withOrWithoutCharge: boolean;
  @Input() selectedFCLLCL: any;
  @Input() agentList: any;
  @Input() currencyList: any;
  @Input() uomList: any;
  @Input() containerTypeList: any;

  showPrintLogo: boolean = false;
  showPdfLogo: boolean = true;
  @Input() masterJobSid: number;

  masterJobData: any;
  masterJobHouseJobs: any;
  private pdfDepsPromise?: Promise<{ pdfMake: any }>;

  constructor(
    private activeModal: NgbActiveModal,
    private appSettingService: AppSettingsService,
    private spinner: NgxSpinnerService,
    private operationService: OperationService,
    public logoService: LogoService,
  ) {}

  ngOnInit() {
    this.userData = this.appSettingService.getDecryptedUserProfile();
    this.currentCompany = this.appSettingService.decrypt(
      localStorage.getItem('selected-company'),
    );
    this.currentBranch = this.appSettingService.decrypt(
      localStorage.getItem('selected-branch'),
    );
    this.branchDetails = this.appSettingService.getCurrentBranchInfo();
    this.currentCompany = ((this.userData.userCompanyMaster || []).find(
      (ucm) => ucm.CompanyMasterSid === this.currentCompany?.CompanyMasterSid,
    ))?.companyMaster;
    this.currentBranch = ((this.currentCompany.userBranchMaster || []).find(
      (ubm) => ubm.BranchMasterSid === this.currentBranch?.BranchMasterSid,
    ))?.branchMaster;
    this.currentBranchCityId = Number(this.branchDetails?.CityMasterSid);
    this.loadMasterJobWithAllHouseJob(this.masterJobSid);
  }

  loadMasterJobWithAllHouseJob(MasterJobSid: number) {
    this.spinner.show();
    this.operationService.getAllHouseJobById(MasterJobSid).subscribe({
      next: (response: any) => {
        if (response.status && response.data) {
          this.masterJobData = response.data;
          this.masterJobHouseJobs = response.data.houseJob || [];
          this.housejobData = this.masterJobHouseJobs[0];
        }
        this.spinner.hide();
      },
      error: (error) => {
        console.error('Error loading master job details:', error);
        this.spinner.hide();
      },
    });
  }

  getTotalGrossWeight(housejobData: any): number {
    return this.getContainerMappedProducts(housejobData).reduce(
      (total: number, item: any) => {
        return total + (Number(item?.GrossWeight) || 0);
      },
      0,
    );
  }

  getTotalVolume(housejobData: any): number {
    return this.getContainerMappedProducts(housejobData).reduce(
      (total: number, item: any) => {
        return total + (Number(item?.Volume) || 0);
      },
      0,
    );
  }

  getContainerMappedProducts(housejobData: any) {
    return housejobData?.Products || [];
  }

  getDestinationAgentName(CustomerMasterSid: number | string): string {
    const agent = this.agentList.find((a) => a.CustomerMasterSid == CustomerMasterSid);
    return agent ? agent.CustomerName : '';
  }

  async downloadPDF() {
    this.showPrintLogo = false;
    this.showPdfLogo = true;
    this.spinner.show();

    try {
      const draftHouseJobs = (this.masterJobHouseJobs || []).filter(
        (house: any) => !house?.Others?.[0]?.ReleaseType,
      );

      if (!draftHouseJobs.length) {
        this.appSettingService.showError('No Record Found');
        return;
      }

      const { pdfMake } = await this.getPdfDependencies();
      const logo = await this.resolveReportLogo();

      const items = draftHouseJobs.map((houseJob: any) =>
        transformAllHblItemApiData(
          houseJob,
          {
            company: this.currentCompany,
            branch: this.currentBranch,
            userData: this.userData,
            currentDate: this.currentDate,
            currentBranchCityName: this.currentBranchCityName,
            agentList: this.agentList,
            masterJobData: this.masterJobData,
            isDraft: true,
            title: 'House Bill of Lading',
          },
          logo,
        ),
      );

      const docDefinition = generateAllHblDocument(items);
      const fileRef = this.masterJobData?.MasterJobNumber || this.masterJobSid || 'ALL_HBL_DRAFT';
      pdfMake.createPdf(docDefinition).download(`ALL_HBL_DRAFT_${fileRef}.pdf`);
      this.appSettingService.showSuccess('PDF downloaded successfully!');
    } catch (error) {
      console.error('All HBL Draft PDF generation error:', error);
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

  modalClose() {
    this.activeModal.close();
  }

  hasDraftHouseBL(): boolean {
    return this.masterJobHouseJobs?.some(
      (house) => !house?.Others?.[0]?.ReleaseType,
    );
  }

  private async getPdfDependencies(): Promise<{ pdfMake: any }> {
    if (this.pdfDepsPromise) {
      return this.pdfDepsPromise;
    }

    this.pdfDepsPromise = (async () => {
      const pdfMakeModule = await import('pdfmake/build/pdfmake');
      const pdfFontsModule = await import('pdfmake/build/vfs_fonts');

      const pdfMake: any = (pdfMakeModule as any).default || pdfMakeModule;
      const pdfFonts: any = (pdfFontsModule as any).default || pdfFontsModule;
      pdfMake.vfs = pdfFonts?.pdfMake?.vfs || pdfFonts;

      return { pdfMake };
    })();

    return this.pdfDepsPromise;
  }

  private async resolveReportLogo(): Promise<string | undefined> {
    const logoFromStream = await firstValueFrom(
      this.logoService.reportLogo$.pipe(take(1)),
    );
    const logoSource =
      logoFromStream || localStorage.getItem('current_report_logo') || '';

    if (!logoSource) return undefined;
    if (logoSource.startsWith('data:image')) return logoSource;

    return this.imageUrlToBase64(logoSource);
  }

  private imageUrlToBase64(url: string): Promise<string | undefined> {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';

      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          resolve(undefined);
          return;
        }

        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      };

      img.onerror = () => resolve(undefined);
      img.src = url;
    });
  }
}
