import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NgxSpinnerService } from 'ngx-spinner';
import { firstValueFrom } from 'rxjs';
import { take } from 'rxjs/operators';
import {
  generateLoadingPlanMasterDocument,
  transformLoadingPlanMasterApiData,
} from 'src/app/common/pdf/generators/loading-plan-master-pdf.generator';
import { CustomDatePipe } from 'src/app/core/pipes/custom-date-format.pipe';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { LogoService } from 'src/app/core/services/logo.service';
import { MenuPermissionService } from 'src/app/core/services/menu-permission.service';
import { MasterService } from 'src/app/modules/master/master.service';
import { PrintFooterComponent } from 'src/app/shared/components/print-footer/print-footer.component';
import { PrintHeaderComponent } from 'src/app/shared/components/print-header/print-header.component';
import { OperationService } from '../../../operation.service';

@Component({
  selector: 'app-loading-plan-master',
  standalone: true,
  imports: [CommonModule, CustomDatePipe,PrintHeaderComponent,PrintFooterComponent],
  templateUrl: './loading-plan-master.component.html',
  styles: ``
})
export class LoadingPlanMasterComponent {
  userData: any;
  currentCompany: any;
  currentBranch: any;
  branchDetails: any;
  currentBranchCityName: string | null;
  currentBranchCityId: number;
  currentDate = new Date();

   @Input() housejobData: any;
  @Input() masterJobData: any;
  @Input() masterJobContainers: any[] = [];
  @Input() packageTypeList: any[] = [];
  @Input() TandCList: any;
  @Input() selectedFCLLCL: string = 'LCL';
  @Input() portList: any[] = []; 
  showPrintLogo: boolean = false;
  showPdfLogo: boolean = true;
  private pdfDepsPromise?: Promise<{ pdfMake: any }>;

     constructor(
    private appSettingsService: AppSettingsService,
    private activeModal: NgbActiveModal,
    private masterService: MasterService,
    private appSettingService: AppSettingsService,
    private spinner: NgxSpinnerService,
    public logoService : LogoService,
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
    // this.loadCityName();
  }

     getPortName(portCode: string): string {
    if (!portCode || !this.portList || this.portList.length === 0) {
      return portCode || '';
    }
    
    const port = this.portList.find(p => p.PortCode === portCode);
    return port ? `${port.PortCode} - ${port.PortName}` : portCode;
  }

//     getParseInteger(value: any): string {
//   if (!value && value !== 0) return '0.000';
//   const num = parseFloat(value);
//   return isNaN(num) ? '0.000' : num.toFixed(3);
// }
//     getParseIntegerNoDecimal(value: any): string {
//   if (!value && value !== 0) return '0';
//   const num = parseFloat(value);
//   return isNaN(num) ? '0' : num.toString();
// }

    async downloadPDF() {
    this.showPrintLogo = false;
    this.showPdfLogo = true;
    this.spinner.show();

    try {
      const { pdfMake } = await this.getPdfDependencies();
      const logo = await this.resolveReportLogo();
      const pdfData = transformLoadingPlanMasterApiData(
        this.masterJobData,
        this.currentCompany,
        this.currentBranch,
        this.userData,
        logo,
        {
          portList: this.portList,
        },
      );
      const docDefinition = generateLoadingPlanMasterDocument(pdfData);

      pdfMake
        .createPdf(docDefinition)
        .download(`Loading_Plan_${this.masterJobData?.MasterJobNumber || 'Report'}.pdf`);
      this.appSettingService.showSuccess('PDF downloaded successfully!');
      const payload = {
        tableName: 'MasterJob',
        recordId: String(this.masterJobData?.MasterJobSid),
        operation: 'PDF',
        changedBy: this.appSettingService.userSettingSource.value['userEmail'],
        changes: {
          action: 'PDF Downloaded'
        },
        newVal: {
          PDF: 'Loading Plan PDF Downloaded',
        }
      };

      this.operationService.createAuditLog(payload).subscribe({
        next: () => { },
        error: (err) => console.error(err)
      });
    } catch (error) {
      console.error('Loading Plan PDF generation error:', error);
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
