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
import { PrintFooterComponent } from 'src/app/shared/components/print-footer/print-footer.component';
import { PrintHeaderComponent } from 'src/app/shared/components/print-header/print-header.component';
@Component({
  selector: 'app-commerical-invoice',
  standalone: true,
  imports: [CommonModule,CustomDatePipe,PrintFooterComponent,PrintHeaderComponent],
  templateUrl: './commerical-invoice.component.html',
  styles: ``
})
export class CommericalInvoiceComponent {
  currentCompany: any
    currentBranch: any;
    userData: any
    currentDate = new Date()
    branchDetails: any;
  currentBranchCityName: string | null;
  currentBranchCityId: number;

    showPrintLogo: boolean = false;
  showPdfLogo: boolean = true;
  
    @Input() housejobData: any;
    @Input() masterJobContainers: any[];
    @Input() withOrWithoutCharge: boolean;
    @Input() selectedFCLLCL: any;
  
    @Input() currencyList: any;
    @Input() uomList: any;
    @Input() containerTypeList: any;

  
    ngOnInit() {
      this.userData = this.appSettingService.getDecryptedUserProfile();
      this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));
      this.currentBranch = this.appSettingService.decrypt(localStorage.getItem('selected-branch'));
           this.branchDetails = this.appSettingService.getCurrentBranchInfo();
    this.currentCompany = ((this.userData.userCompanyMaster || []).find(ucm => ucm.CompanyMasterSid === this.currentCompany?.CompanyMasterSid))?.companyMaster;
    this.currentBranch = ((this.currentCompany.userBranchMaster || []).find(ubm => ubm.BranchMasterSid === this.currentBranch?.BranchMasterSid))?.branchMaster;
    this.currentBranchCityId = Number(this.branchDetails?.CityMasterSid);
    // this.loadCityName();
    }


  //   loadCityName(): void {
  //   if (!this.currentBranchCityId) return;


  //   this.masterService.getCityById(this.currentBranch?.CityMasterSid).subscribe({
  //     next: (response: any) => {
  //       console.log("City API response:", response);

  //       if (response) {
  //         const ourCity = response;

  //         this.currentBranchCityName = ourCity ? ourCity.cityName : '';
  //         console.log("Final City Name:", this.currentBranchCityName);
  //       }

 
  //     },
  //     error: (error) => {
  //       console.error("Failed to load city:", error);
   
  //     }
  //   });
  // }
  
  
    constructor(
      private activeModal: NgbActiveModal,
      private appSettingService: AppSettingsService,
      private masterService: MasterService,
      private pdfService: PdfDownloadService,
      private spinner: NgxSpinnerService,
      public logoService : LogoService
    ) { }
 

      getContainerName(ContainerTypeMasterSid: number) {
    if (!ContainerTypeMasterSid || this.containerTypeList.length === 0) {
      return "";
    }
    return this.containerTypeList.find(con => con.ContainerTypeMasterSid === ContainerTypeMasterSid)?.ContainerName || ""
  }



  async downloadPDF() {
  this.showPrintLogo = false;
  this.showPdfLogo = true;

  setTimeout(async () => {
    this.spinner.show();
   try {
       const HouseJob = this.housejobData?.ShipmentNo || 'Receipt';
      await this.pdfService.downloadBalancedPDF(
        'printContent',
        `Commercial_Invoice`,
        () => this.appSettingService.showSuccess('PDF downloaded successfully!'),
        (error) => this.appSettingService.showError('Error generating PDF. Please try again.'),
        'landscape'
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
  }, 50); // small timeout so Angular updates DOM
}


    
  modalClose() {
    this.activeModal.close()
  }

  getTotalPkg(){
     const noofPkgs = this.housejobData?.Products || [];
    return noofPkgs.reduce((sum: number, item: any) => {
      const volume = parseFloat(item?.ExternlQty) || 0;
      return sum + volume;
    }, 0);
  }

  getGrossWeight(){
    const grossWeight  = this.housejobData?.Products || [];
    return grossWeight.reduce((sum:number,item:any)=>{
      const grossAmount = parseFloat(item?.GrossWeight)
      return sum + grossAmount;
    },0)
  }

  NetWeightTotal(){
    const netWeight = this.housejobData?.Products || [];
    return netWeight.reduce((sum:number,item:any)=>{
      const totalNetWeight = parseFloat(item?.NetWeight)
      return sum + totalNetWeight
    },0)
  }

  voluemTotal(){
    const vol =this.housejobData?.Products ;
    return vol.reduce((sum:number, item:any)=>{
      const totalVol = parseFloat(item?.Volume)
      return sum + totalVol
    },0)
  }
}
