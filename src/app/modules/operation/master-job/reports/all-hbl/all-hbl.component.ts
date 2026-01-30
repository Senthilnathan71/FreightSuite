import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { NgxSpinnerService } from 'ngx-spinner';
import { PdfDownloadService } from 'src/app/common/pdf-download.service';
import { CustomDatePipe } from 'src/app/core/pipes/custom-date-format.pipe';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { MasterService } from 'src/app/modules/master/master.service';
import { OperationService } from '../../../operation.service';
import { LogoService } from 'src/app/core/services/logo.service';

@Component({
  selector: 'app-all-hbl',
  standalone: true,
  imports: [CustomDatePipe, CommonModule],
  templateUrl: './all-hbl.component.html',
  styles: ``
})
export class AllHBLComponent {

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
  @Input() agentList: any;
  @Input() currencyList: any;
  @Input() uomList: any;
  @Input() containerTypeList: any;
  showPrintLogo: boolean = false;
  showPdfLogo: boolean = true;
  @Input() masterJobSid: number;

  masterJobData: any;
  masterJobHouseJobs: any;



  ngOnInit() {
    this.userData = this.appSettingService.getDecryptedUserProfile();
    this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));
    this.currentBranch = this.appSettingService.decrypt(localStorage.getItem('selected-branch'));
    this.branchDetails = this.appSettingService.getCurrentBranchInfo();
    this.currentCompany = ((this.userData.userCompanyMaster || []).find(ucm => ucm.CompanyMasterSid === this.currentCompany?.CompanyMasterSid))?.companyMaster;
    this.currentBranch = ((this.currentCompany.userBranchMaster || []).find(ubm => ubm.BranchMasterSid === this.currentBranch?.BranchMasterSid))?.branchMaster;
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
      },
    });
  }


  constructor(
    private activeModal: NgbActiveModal,
    private appSettingService: AppSettingsService,
    private masterService: MasterService,
    private pdfService: PdfDownloadService,
    private spinner: NgxSpinnerService,
    private operationService: OperationService,
    public logoService : LogoService
  ) { }


  getTotalGrossWeight(housejobData: any): number {
    return this.getContainerMappedProducts(housejobData)
      .reduce((total: number, item: any) => {
        return total + (Number(item?.GrossWeight) || 0);
      }, 0);
  }


  getTotalVolume(housejobData: any): number {
    return this.getContainerMappedProducts(housejobData)
      .reduce((total: number, item: any) => {
        return total + (Number(item?.Volume) || 0);
      }, 0);
  }




  // container details only show

  getContainerMappedProducts(housejobData: any) {
    return housejobData?.Products || [];
  }


  // All container details  show

  // get containerMappedProducts() {
  //   const products = this.housejobData?.Products || [];

  //   const map = new Map<number, any>();

  //   products.forEach((p: any) => {
  //     if (!p.MasterJobContainerSid) return; // ❌ skip unmapped

  //     if (!map.has(p.MasterJobContainerSid)) {
  //       map.set(p.MasterJobContainerSid, {
  //         MasterJobContainerSid: p.MasterJobContainerSid,
  //         ContainerNo: p.ContainerNo,
  //         GrossWeight: Number(p.GrossWeight) || 0,
  //         Volume: Number(p.Volume) || 0,
  //         ExternlQty: Number(p.ExternlQty) || 0,
  //         ExternaPkg: p.ExternaPkg
  //       });
  //     } else {
  //       const existing = map.get(p.MasterJobContainerSid);
  //       existing.GrossWeight += Number(p.GrossWeight) || 0;
  //       existing.Volume += Number(p.Volume) || 0;
  //       existing.ExternlQty += Number(p.ExternlQty) || 0;
  //     }
  //   });

  //   return Array.from(map.values());
  // }
  getDestinationAgentName(CustomerMasterSid: number | string): string {
    const agent = this.agentList.find(a => a.CustomerMasterSid == CustomerMasterSid);
    return agent ? agent.CustomerName : '';
  }

  async downloadPDF() {
    this.showPrintLogo = false;
    this.showPdfLogo = true;



    setTimeout(async () => {
      this.spinner.show();
      try {
        const HouseJob = this.housejobData?.HBLNo || '';
        await this.pdfService.downloadBalancedPDF(
          'printContent',
          `HBL-Draft ${HouseJob}`,
          () => this.appSettingService.showSuccess('PDF downloaded successfully!'),
          (error) => this.appSettingService.showError('Error generating PDF. Please try again.')
        );
      } finally {
        this.spinner.hide();
      }
    }, 50);
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
    }, 50);

  }

  modalClose() {
    this.activeModal.close()
  }


  hasDraftHouseBL(): boolean {
    return this.masterJobHouseJobs?.some(
      house => house?.Others?.[0]?.ReleaseType
    );
  }


  get printableHouseJobs() {
    return (this.masterJobHouseJobs || []).filter(
      house => house?.Others?.[0]?.ReleaseType
    );
  }


}
