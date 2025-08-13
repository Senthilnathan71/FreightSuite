import { CommonModule } from '@angular/common';
import { Component, TemplateRef, ViewChild } from '@angular/core';
import { NgbModal, NgbNavModule, NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { LeadService } from '../../Services/lead.service';
import { Router } from '@angular/router';
import { AppService } from 'src/app/service/app.service';
import { FormsModule } from '@angular/forms';
import { FeatherModule } from 'angular-feather';
import { DateFormatPipe } from 'src/app/core/pipes/date-format.pipe';
import { CustomDatePipe } from 'src/app/core/pipes/custom-date-format.pipe';
import * as html2pdf from 'html2pdf.js';
import { ToastrService } from 'ngx-toastr';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-quotation-view',
  standalone: true,
  imports: [
    CommonModule,
    FeatherModule,
    NgbPaginationModule,
    FormsModule,
    NgbNavModule,
    CustomDatePipe
  ],
  templateUrl: './quotation-view.component.html',
  styleUrl: './quotation-view.component.scss'
})
export class QuotationViewComponent {
  isLoading = false;

  active = 1;
  @ViewChild('nav', { static: true }) nav!: NgbNavModule;
  errorMessage: string = '';  // To store any error messages
  // pagination
  page = 1;
  pageSize = 15;
  totalLengthOfCollection: number;
  page1 = 1;
  pageSize1 = 15;
  totalLengthOfCollection1: number;
  searchText: string = '';
  quoteItems: any[] = [];
  isMobile: boolean = false;
  quoteData: any
  enquiryItems: any[] = [];
  unitList : any[] = [];
  enquiryData: any
  ports: any[] = []
  selectedItem: any;
  currentDate = new Date().toLocaleDateString(); // or any formatted string
  filterValue : any = ''
  userData : any
  currentCompany: any;
  currentBranch: any;

  constructor(private toastr: ToastrService, private modalService: NgbModal, private leadService: LeadService, private route: Router, private appService: AppService,private appSettingService : AppSettingsService) { }

  ngOnInit(): void {
    this.isMobile = this.appService.getDevice()
    this.loadPorts()
    this.loadEnquiries()
    this.loadUnits();
    // this.loadQuotes();
    this.searchQuotation();
    this.appSettingService.getUser().subscribe(
      (res)=>{
        this.userData = res;
      }
    )
    const storedCompany = localStorage.getItem('selected-company');
    this.currentCompany = storedCompany ? this.appSettingService.decrypt(storedCompany) : null;
    const storedBranch = localStorage.getItem('selected-branch');
    this.currentBranch = storedBranch ? this.appSettingService.decrypt(storedBranch) : null;
  }

  searchQuotation() {
    const params = {
      search: this.filterValue.trim() || '',
      page: this.page,
      pageSize: this.pageSize,
    }
    this.leadService.searchQuotation(params).subscribe({
      next: (resp: any) => {
        if (resp.status) {
          this.quoteItems = resp.data?.items;
          console.log(this.quoteItems);
          this.totalLengthOfCollection = resp.data?.totalCount || 0;
        } else {
          this.appSettingService.showError('Error searching Quotation.');
          console.error('Error searching Quotation', resp.message)
          this.quoteItems = [];
          this.totalLengthOfCollection1 = 0;
        }
      }, error: (error: any) => {
        console.error(error);
      }
    })
  }


  // Method to load the leads
  loadQuotes(): void {
    this.leadService.getAllQuotes().subscribe(
      (resp: any[]) => {
        console.log(resp)
        this.quoteData = resp['data'];  // On success, store the leads data in the component

        this.quoteItems = [...this.quoteData]
        this.updatePaginatedData();  // Update paginated data

        this.totalLengthOfCollection = this.quoteData.length || 0;
      },
      (error) => {
        this.errorMessage = error.message;  // On error, store the error message
        console.error('Error loading enquiry:', error);  // Optionally log the error
      }
    );
  }
  searchEnquiry(): void {
    const searchQuery = this.searchText?.toLowerCase().trim(); // Trim spaces and handle null/undefined

    if (!searchQuery) {
      this.quoteItems = [...this.quoteData]; // Reset to original leads when search is empty
    } else {
      this.quoteItems = this.quoteData.filter((enq) => {
        // Convert date to a standardized format (YYYY-MM-DD)
        const formattedDate = enq.ShipmentExpectedDate
          ? new Date(enq.ShipmentExpectedDate).toISOString().split('T')[0]
          : '';

        return (
          enq.CustomerName?.toLowerCase().includes(searchQuery) ||
          formattedDate.includes(searchQuery) ||  // Date search
          enq.ShipmentType?.toLowerCase().includes(searchQuery) ||
          enq.EnquiryNumber?.toLowerCase().includes(searchQuery)
        );
      });
    }


    this.totalLengthOfCollection = this.quoteItems.length;
  }



  loadEnquiries(): void {
    this.leadService.getAllEnquiries().subscribe(
      (resp: any[]) => {
        console.log(resp)
        this.enquiryData = resp['data'];  // On success, store the leads data in the component

        this.enquiryItems = [...this.enquiryData]
        this.totalLengthOfCollection1 = this.enquiryData.length || 0;
        this.updateEnquiryPaginatedData();  // Update paginated data
        this.mapPortsToEnquiries();

      },
      (error) => {
        this.errorMessage = error.message;  // On error, store the error message
        console.error('Error loading enquiry:', error);  // Optionally log the error
      }
    );
  }

  loadPorts(): void {
    this.leadService.getAllPorts().subscribe(
      (resp: any) => {
        this.ports = resp
      });
  }

  loadUnits(){
    this.leadService.getAllUnits().subscribe(
      (resp:any) => {
        if(resp.status){
          this.unitList = resp.data;
        }
      }
    )
  }



  mapPortsToEnquiries(): void {
    if (!this.ports || !this.enquiryItems) return;

    this.enquiryItems = this.enquiryItems.map((enq) => {
      return {
        ...enq,
        POLCode: this.getPortCode(enq.enquiryRoute['0'].POLSid), // Get PortCode for POLSid
        PODCode: this.getPortCode(enq.enquiryRoute['0'].PODSid), // Get PortCode for PODSid
      };
    });
    console.log(this.enquiryItems, 'enquiryItems')
  }

  getPortCode(portMasterSid: number): string | null {
    const port = this.ports.find((p) => p.PortMasterSid === portMasterSid);
    console.log(port)
    return port ? port.PortCode : null;
  }

  updateEnquiryPaginatedData(): void {
    const startIndex = (this.page1 - 1) * this.pageSize1;
    const endIndex = startIndex + this.pageSize1;
    this.enquiryItems = this.enquiryData.slice(startIndex, endIndex);
    this.mapPortsToEnquiries()
  }

  updatePaginatedData(): void {
    this.searchQuotation();
  }

  clearFilterValue(){
    this.filterValue = '';
    this.searchQuotation();
  }

  createNew() {
    this.route.navigate(['crm/quotation/entry'])
  }

  editEnquiry(id) {
    this.route.navigate(['crm/quotation/entry', id])
  }

  createQuotation(enq: any) {
    console.log(enq);

    const polList = enq.enquiryRoute.map(route => route.POLSid);
    const podList = enq.enquiryRoute.map(route => route.PODSid);

    // Extract cargo types from both root-level enquiryCargo and nested enquiryCargo inside enquiryRoute
    let cargoTypeList: string[] = [];

    // Extract from root-level enquiryCargo
    if (Array.isArray(enq.enquiryCargo)) {
      cargoTypeList.push(...enq.enquiryCargo.map(cargo => cargo.CargoType));
    }

    // Extract from nested enquiryCargo inside enquiryRoute
    enq.enquiryRoute.forEach(route => {
      if (Array.isArray(route.enquiryCargo)) {
        cargoTypeList.push(...route.enquiryCargo.map(cargo => cargo.CargoType));
      }
    });

    // Remove duplicates (optional)
    cargoTypeList = [...new Set(cargoTypeList)];
    this.leadService.clearQuotationData();  // <-- Add this line to clear previous data

    this.leadService.setQuotationData({
      customerId: enq.CustomerMasterSid,
      departmentId: enq.DepartmentMasterSid,
      polList: polList,  // Sending as an array
      podList: podList,  // Sending as an array
      cargoTypeList: cargoTypeList,  // Merging from both possible sources
      rateRequest: true,
      active: 2
    });

    this.route.navigate(['crm/quotation/entry']);
  }

  getFormattedPort(PortMasterSid){
    if(!PortMasterSid || PortMasterSid === undefined || this.ports.length === 0 ){
      return '';
    }
    const ourPort = this.ports.find(p=>p.PortMasterSid === PortMasterSid);
    return `${ourPort.PortName} (${ourPort.PortCode})`
  }

  findUnitName(UnitMasterSid:number){
    if(!UnitMasterSid || this.unitList.length === 0){
      return;
    }
    return (this.unitList.find(u => u.UnitMasterSid === UnitMasterSid)).unitName;
  }

  findEnquiryName(EnquiryId: number) {
    if (!EnquiryId) return;
    return (this.enquiryData.find(data => data.EnquiryHeaderSid === EnquiryId)).EnquiryNumber;
  }

  reportAndEmailModel(data: any, content: TemplateRef<any>) {
    this.selectedItem = data;
    this.modalService.open(content, {
      size: 'xl', // or omit this to avoid interference
      scrollable: false,
      windowClass: 'custom-wide-modal'
    });
  }

  downloadPDF(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const element = document.getElementById('pdfContent');

      const opt = {
        margin: 0.5,
        filename: (this.selectedItem?.QuotationName || 'quotation') + '.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
      };
      
      if (!element) return reject('No element found');
      
      html2pdf().from(element).set(opt).outputPdf('blob')
      .then((blob: Blob) => resolve(blob))
      .catch((err: any) => reject(err));
    });
  }
  

  orgEmail: any
  quotationEmail: any
  loggedInUserEmail: any
  async sendEmail() {
    try {
      this.isLoading = true;
      
      const pdfBlob = await this.downloadPDF();
      
      const formData = new FormData();
      const toEmailSet = new Set<string>();
      
      if (this.selectedItem?.Email) {
        toEmailSet.add(this.selectedItem.Email);
      }

      if (toEmailSet.size === 0 && this.selectedItem?.CustomerBranchSid) {
        const resp: any = await firstValueFrom(
          this.leadService.getCustomerBranchEmail(this.selectedItem.CustomerBranchSid)
        );

        if (resp?.status && resp.data?.Email) {
          toEmailSet.add(resp.data.Email);
        }
      }

      if(toEmailSet.size === 0){
        this.appSettingService.showError('To Email is missing.')
        this.isLoading = false;
        return;
      }

      const toEmail = Array.from(toEmailSet);
      toEmail.forEach(email => {
        if (email) {
          formData.append("EmailTo[]", email);
        }
      });

      const ccEmailSet = new Set<string>([this.userData['userEmail']]);
      const ccEmail = Array.from(ccEmailSet);

      ccEmail.forEach(email => {
        if (email) {
          formData.append("EmailCC[]", email);
        }
      });
      formData.append('Subject', `Quotation No.${this.selectedItem.QuoteNumber} Date:${new Date(this.selectedItem.QuoteDate)} ${this.getFormattedPort(this.selectedItem.quoteRoute[0].POLSid)} - ${this.getFormattedPort(this.selectedItem.quoteRoute[0].PODSid)}`);
      formData.append('Mailbody', `
      <div style="font-family: Arial, sans-serif; padding: 20px; line-height: 1.6; color: #333;">
        <p>Dear Sir/Madam,</p>
        <p>Please find enclosed the quotation as requested.</p>
        <p>Kindly review the details at your convenience.</p>
        <p>Looking forward to your feedback and the opportunity to work together.</p>
        <p>
          Approval Hyperlink: 
          <a href="https://xxxxxxxxx" target="_blank" style="color: #1a73e8;">Click here to approve</a>
        </p>
        <p>Best Regards,</p>
        <p>${this.userData['userEmail']}</p>
      </div>
    `);
      formData.append('file', pdfBlob, (this.selectedItem?.QuotationName || 'quotation') + '.pdf');

      console.log(formData)
      this.leadService.quotationReport(formData).subscribe((resp: any) => {
        this.isLoading = false;
        if (resp?.data) {
          this.toastr.success('Report Email Sent successfully!');
        }
      }, error => {
        this.isLoading = false;
        this.toastr.error('Failed to send email.');
      });

    } catch (err) {
      this.isLoading = false;
      console.error('PDF generation error:', err);
      this.toastr.error('Error generating PDF.');
    }
  }

  goForBookingCreation(QuoteHeaderSid){
    this.route.navigate(['crm/booking/entry'])
  }



}
