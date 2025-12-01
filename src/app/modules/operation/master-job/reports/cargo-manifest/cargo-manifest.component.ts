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
  selector: 'app-cargo-manifest',
  standalone: true,
  imports: [CommonModule, CustomDatePipe],
  templateUrl: './cargo-manifest.component.html',
  styles: ``
})
export class CargoManifestComponent {
  userData: any;
  currentCompany: any;
  currentBranch: any;
  branchDetails: any;
  currentBranchCityName: string | null;
  currentBranchCityId: number;
  currentDate = new Date();
  cityList: any;
  cityMasterList: any[] = [];
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

  async loadLookups() {
    this.spinner.show();
    const companyRaw = localStorage.getItem('selected-company');
    const company = companyRaw ? this.appSettingService.decrypt(companyRaw) : null;
    const filterOption = { CompanyMasterSid: company?.CompanyMasterSid, BranchMasterSid: company?.BranchMasterSid };
    Promise.all([
      firstValueFrom(this.masterService.getCityById(this.currentBranchCityId)),
    ]).then(([userCity]) => {
      this.currentBranchCityName = userCity ? userCity.cityName : null;
      this.spinner.hide();
    }).catch(error => {
      console.error('Error loading lookups:', error);
      this.spinner.hide();
      this.appSettingService.showError('Error loading lookup data');
    });
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



  getAgentName(AgentSid: number) {
    if (!AgentSid || this.agentList.length === 0) return '';
    const agent = this.agentList.find(agent => agent.CustomerMasterSid === AgentSid);
    return agent ? agent.CustomerName : '';
  }
  getAgentAddress(AgentSid: number) {
    if (!AgentSid || this.agentList.length === 0) return '';
    const agent = this.agentList.find(agent => agent.CustomerMasterSid === AgentSid);
    return agent ? agent.Address : '';
  }

  get totalNoOfPkg(): number {
    return this.masterJobContainers.reduce((sum, c) => {
      const value = Number(c.NoOfPkg) || 0;
      return sum + value;
    }, 0);
  }

  get totalGrossWeight(): number {
    return this.masterJobContainers.reduce((sum, c) => {
      const value = Number(c.GrossWeight) || 0;
      return sum + value;
    }, 0);
  }

  get totalVolume(): number {
    return this.masterJobContainers.reduce((sum, c) => {
      const value = Number(c.Volume) || 0;
      return sum + value;
    }, 0);
  }

  getYardName(yardSid: number): string {
    if (!yardSid || this.yardList.length === 0) return '';
    const yard = this.yardList.find(yard => yard.CustomerMasterSid === yardSid);
    return yard ? yard.CustomerName : '';
  }

  getPackageTypeName(pkgTypeSid: number): string {
    if (!pkgTypeSid) return 'Unknown';
    const packageType = this.packageTypeList.find(pt => pt.UOMMasterSid === pkgTypeSid);
    return packageType ? packageType.UOMName : 'Unknown';
  }

  getContainerTypeName(ContainerTypeMasterSid: number): string {
    if (!this.containerTypeList) return "";
    const containerType = this.containerTypeList.find(ct => ct.ContainerTypeMasterSid === ContainerTypeMasterSid);
    return containerType ? containerType.ContainerName : '';
  }


  getContainerSize(containerTypeMasterSid: number): string {
    console.log("SID RECEIVED:", containerTypeMasterSid);
    console.log("CONTAINER TYPE LIST:", this.containerTypeList);

    const containerType = this.containerTypeList?.find(
      ct => +ct.ContainerTypeMasterSid === +containerTypeMasterSid
    );

    return containerType?.ContainerSize?.trim() || '-';
  }

  getTareWeight(containerTypeMasterSid: number): string {
    const container = this.containerTypeList?.find(
      ct => +ct.ContainerTypeMasterSid === +containerTypeMasterSid
    );

    return container?.TareWeight || '-';
  }


  // Calculate total NoOfPackage for all houseJobs and their cargo
  getTotalPackages(): number {
    if (!this.masterJobData?.houseJob) return 0;
    return this.masterJobData.houseJob.reduce((totalH, h) => {
      const totalCargo = h.Cargo?.reduce((totalC, c) => totalC + (c.NoOfPackage || 0), 0) || 0;
      return totalH + totalCargo;
    }, 0);
  }

  // Calculate total GrossWeight
  getTotalGrossWeight(): number {
    if (!this.masterJobData?.houseJob) return 0;
    return this.masterJobData.houseJob.reduce((totalH, h) => {
      const totalCargo = h.Cargo?.reduce((totalC, c) => totalC + (+c.GrossWeight || 0), 0) || 0;
      return totalH + totalCargo;
    }, 0);
  }

  // Calculate total Volume
  getTotalVolume(): number {
    if (!this.masterJobData?.houseJob) return 0;
    return this.masterJobData.houseJob.reduce((totalH, h) => {
      const totalCargo = h.Cargo?.reduce((totalC, c) => totalC + (+c.Volume || 0), 0) || 0;
      return totalH + totalCargo;
    }, 0);
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
        `Cargo_manifest_${quotationNumber}`,
        () => this.appSettingService.showSuccess('PDF downloaded successfully!'),
        (error) => this.appSettingService.showError('Error generating PDF. Please try again.')
      );
    } finally {
      this.spinner.hide();
    }
  }
  
printCargoManifest(): void {
  this.spinner.show();
  
  // Get the print content element
  const printContent = document.getElementById('printContent');
  
  if (!printContent) {
    this.spinner.hide();
    return;
  }
  
  // Create a temporary div for printing
  const tempDiv = document.createElement('div');
  tempDiv.id = 'temp-print-container';
  tempDiv.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: white;
    z-index: 99999;
    overflow: auto;
    padding: 20px;
  `;
  
  // Clone and append the print content
  const clone = printContent.cloneNode(true) as HTMLElement;
  tempDiv.appendChild(clone);
  
  // Add print-specific styles
  const style = document.createElement('style');
  style.innerHTML = `
    #temp-print-container .print-a41 {
      width: 280mm;
      min-height: 402mm;
      margin: 10px;
      padding: 2mm 5mm;
      background: #fff;
      border: 1px solid #000;
      box-sizing: border-box;
      position: relative;
      color: #000;
      page-break-after: always;
    }
    
    #temp-print-container .company-header {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 1rem;
    }
    
    #temp-print-container .company-logo {
      display: flex;
      align-items: center;
      flex-direction: column;
    }
    
    #temp-print-container .company-logo img {
      width: 50px;
      height: 50px;
      object-fit: contain;
    }
    
    #temp-print-container .company-info {
      font-size: 14px !important;
      padding-left: 28%;
      text-align: center;
    }
    
    #temp-print-container h5, 
    #temp-print-container h4, 
    #temp-print-container h6 {
      margin: 0;
      padding: 0;
      font-weight: 600;
    }
    
    #temp-print-container p {
      margin: 2px 0;
      font-size: 12pt;
    }
    
    #temp-print-container .row {
      display: flex;
      flex-wrap: wrap;
      margin-bottom: 8px;
    }
    
    #temp-print-container .col-md-6 {
      flex: 0 0 50%;
      max-width: 50%;
    }
    
    #temp-print-container .text-end {
      text-align: right;
    }
    
    #temp-print-container table {
      width: 100%;
      border-collapse: collapse;
      margin: 10px 0;
      font-size: 14px;
    }
    
    #temp-print-container .tablebordered {
      border: 1px solid black;
    }
    
    #temp-print-container .tablebordered thead th {
      font-weight: 700 !important;
    }
    
    #temp-print-container .tablebordered th,
    #temp-print-container .tablebordered td {
      border: 1px solid black;
      padding: 2px 8px;
      color: #000;
      text-align: left;
      vertical-align: middle;
    }
    
    #temp-print-container .table-responsive {
      width: 100%;
      overflow-x: auto;
    }
    
    #temp-print-container footer {
      position: absolute;
      bottom: 2mm;
      left: 0;
      right: 0;
      text-align: center;
      font-size: 10pt;
    }
    
    #temp-print-container table,
    #temp-print-container tr,
    #temp-print-container td,
    #temp-print-container th {
      page-break-inside: avoid;
    }
    
    @media print {
      @page {
        size: A4;
        margin: 10mm;
      }
      
      body {
        margin: 0;
        padding: 0;
      }
      
      #temp-print-container {
        position: static;
        padding: 0;
      }
      
      #temp-print-container .print-a41 {
        margin: 10mm auto;
        padding: 10mm;
        border: none;
        page-break-after: always;
      }
      
      #temp-print-container .print-a41:last-child {
        page-break-after: auto;
      }
    }
  `;
  
  tempDiv.appendChild(style);
  document.body.appendChild(tempDiv);
  
  // Trigger print
  setTimeout(() => {
    window.print();
    
    // Clean up after printing
    setTimeout(() => {
      if (document.body.contains(tempDiv)) {
        document.body.removeChild(tempDiv);
      }
      this.spinner.hide();
    }, 500);
  }, 500);
}
}

interface ContainerDetails {
  tareWeight: number;
  size: string;
}