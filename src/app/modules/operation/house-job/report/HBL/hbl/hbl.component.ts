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
  selector: 'app-hbl',
  standalone: true,
  imports: [CommonModule, CustomDatePipe],
  templateUrl: './hbl.component.html',
  styles: ``
})
export class HblComponent {

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
  @Input() selectedReport: 'HBL' | 'HBLDraft' = 'HBL'; 
  showPrintLogo: boolean = false;
  showPdfLogo: boolean = true;


  ngOnInit() {
    this.userData = this.appSettingService.getDecryptedUserProfile();
    this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));
    this.currentBranch = this.appSettingService.decrypt(localStorage.getItem('selected-branch'));
    this.branchDetails = this.appSettingService.getCurrentBranchInfo();
    this.currentCompany = ((this.userData.userCompanyMaster || []).find(ucm => ucm.CompanyMasterSid === this.currentCompany?.CompanyMasterSid))?.companyMaster;
    this.currentBranch = ((this.currentCompany.userBranchMaster || []).find(ubm => ubm.BranchMasterSid === this.currentBranch?.BranchMasterSid))?.branchMaster;
    this.currentBranchCityId = Number(this.branchDetails?.CityMasterSid);
    this.loadCityName();
  }

  
    loadCityName(): void {
    if (!this.currentBranchCityId) return;


    this.masterService.getCityById(this.currentBranch?.CityMasterSid).subscribe({
      next: (response: any) => {

        if (response) {
          const ourCity = response;

          this.currentBranchCityName = ourCity ? ourCity.cityName : '';
        }

 
      },
      error: (error) => {
        console.error("Failed to load city:", error);
   
      }
    });
  }

  constructor(
    private activeModal: NgbActiveModal,
    private appSettingService: AppSettingsService,
    private masterService: MasterService,
          private pdfService: PdfDownloadService,
          private spinner: NgxSpinnerService,
          public logoService : LogoService
  ) { }


  grossAmount(): number {

    const cargoList = this.housejobData?.Cargo || [];

     return cargoList.reduce((sum: number, item: any) => {
 
      const weight = parseFloat(item?.GrossWeight) || 0;
 
      return sum + weight;
 
    }, 0);

  }

  volumeAmount(): number {

   const cargoList = this.housejobData?.Cargo || [];
 
    return cargoList.reduce((sum: number, item: any) => {
 
      const volume = parseFloat(item?.Volume) || 0;
 
      return sum + volume;
 
    }, 0);
  }

  // container details only show

  get containerMappedProducts() {
  return (this.housejobData?.Products || []).filter(
    (p: any) => !!p.MasterJobContainerSid
  );
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
       const HouseJob = this.housejobData?.HBLNo || 'Receipt';
      await this.pdfService.downloadBalancedPDF(
        'printContent',
        `HBL - ${HouseJob}`,
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




}
