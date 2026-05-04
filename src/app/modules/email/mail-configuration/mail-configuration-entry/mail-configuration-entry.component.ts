import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { NgSelectModule } from '@ng-select/ng-select';
import { FeatherModule } from 'angular-feather';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';

import { EmailModuleService } from '../../email.service';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { SettingsService } from 'src/app/modules/settings/settings.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { MailBodyModalComponent } from '../mail-body-modal/mail-body-modal.component';
import { MailSubjectModalComponent } from '../mail-subject-modal/mail-subject-modal.component';
import { PlaceholderAutocompleteDirective } from 'src/app/core/Directives/placeholder-autocomplete.directive';
import { ALL_PLACEHOLDERS } from '../../mail-placeholder.constants';

interface MailConfigRow {
  MailConfigurationMasterSid?: number;
  Sno: number;
  MailName: string;
  MenuMasterSid: number | null;
  MailSubject: string;
  MailBody: string;
  ToEmailidFrom: string;
  CcEmailidFrom: string;
  AttachmentRequire: string;
  Action: string;
  Trigger: string;
  AutoPopup: string;
  Status: string;
  UpdateFields?: string[];
  selectedActions: string[];
  selectedUpdateFields: string[];
  isEditing: boolean;
  isNew: boolean;
}

@Component({
  selector: 'app-mail-configuration-entry',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NgSelectModule,
    FeatherModule,
    NgxSpinnerModule,
    PlaceholderAutocompleteDirective
  ],
  templateUrl: './mail-configuration-entry.component.html',
  styleUrl: './mail-configuration-entry.component.scss'
})
export class MailConfigurationEntryComponent implements OnInit {
  mailConfigForm!: FormGroup;
  currentCompany: any;
  userData: any;
  menuList: any[] = [];

  rows: MailConfigRow[] = [];

  editingIndex: number | null = null;
  editingSnapshot: MailConfigRow | null = null;
  editingRow: MailConfigRow | null = null;

  statusOptions = [
    { value: 'A', label: 'Active' },
    { value: 'I', label: 'Inactive' }
  ];

  @ViewChild('detailFormSection') detailFormSection!: ElementRef;

  attachmentOptions = [
    { value: 'Y', label: 'Yes' },
    { value: 'N', label: 'No' }
  ];

  triggerOptions = [
    { value: 'A', label: 'Auto' },
    { value: 'M', label: 'Manual' }
  ];

  autoPopupOptions = [
    { value: 'A', label: 'Auto' },
    { value: 'P', label: 'Popup' }
  ];

  actionOptions = [
    { value: 'CREATE', label: 'Create' },
    { value: 'UPDATE', label: 'Update' },
    { value: 'SendSIMail', label: 'Send SI Mail' }
  ];

  filteredActionOptions = this.actionOptions.filter(o => o.value !== 'SendSIMail');

  // Form fields per menu for "Trigger on Fields" dropdown
  private menuFieldsMap: { [menuName: string]: { key: string; label: string }[] } = {
    'booking': [
      { key: 'CustomerMasterSid', label: 'Customer' },
      { key: 'ShipperName', label: 'Shipper' },
      { key: 'ConsigneeName', label: 'Consignee' },
      { key: 'POO', label: 'Place of Origin' },
      { key: 'POL', label: 'Port of Loading' },
      { key: 'POD', label: 'Port of Discharge' },
      { key: 'FPD', label: 'Final Place of Delivery' },
      { key: 'CarrierName', label: 'Carrier' },
      { key: 'VesselName', label: 'Vessel' },
      { key: 'VoyageNo', label: 'Voyage' },
      { key: 'ETD', label: 'ETD' },
      { key: 'ETA', label: 'ETA' },
      { key: 'BookingDateTime', label: 'Booking Date' },
      { key: 'BookingStatus', label: 'Booking Status' },
      { key: 'DepartmentMasterSid', label: 'Department' },
      { key: 'NominatedBy', label: 'Nominated By' },
      { key: 'FreightTerms', label: 'Freight Terms' },
      { key: 'IncoTerms', label: 'Inco Terms' },
      { key: 'DestinationAgent', label: 'Destination Agent' },
      { key: 'ShipmentNo', label: 'Shipment No' },
    ],
    'house job': [
      { key: 'CustomerMasterSid', label: 'Customer' },
      { key: 'ShipperName', label: 'Shipper' },
      { key: 'ConsigneeName', label: 'Consignee' },
      { key: 'Notify', label: 'Notify Party' },
      { key: 'POO', label: 'Place of Origin' },
      { key: 'POL', label: 'Port of Loading' },
      { key: 'POD', label: 'Port of Discharge' },
      { key: 'FPD', label: 'Final Place of Delivery' },
      { key: 'CarrierName', label: 'Carrier' },
      { key: 'VesselName', label: 'Vessel' },
      { key: 'VoyageNo', label: 'Voyage' },
      { key: 'ETD', label: 'ETD' },
      { key: 'ETA', label: 'ETA' },
      { key: 'HBLDate', label: 'HBL Date' },
      { key: 'HBLNo', label: 'HBL No' },
      { key: 'HouseStatus', label: 'House Status' },
      { key: 'DestinationAgent', label: 'Destination Agent' },
      { key: 'FreightTerms', label: 'Freight Terms' },
      { key: 'IncoTerms', label: 'Inco Terms' },
      { key: 'MovementType', label: 'Movement Type' },
    ],
    'enquiry': [
      { key: 'CustomerMasterSid', label: 'Customer' },
      { key: 'ShipperName', label: 'Shipper' },
      { key: 'ConsigneeName', label: 'Consignee' },
      { key: 'EnquiryDate', label: 'Enquiry Date' },
      { key: 'shipmentDate', label: 'Exp. Shipment Date' },
      { key: 'PORSid', label: 'Place of Origin' },
      { key: 'POLSid', label: 'Port of Loading' },
      { key: 'PODSid', label: 'Port of Discharge' },
      { key: 'FDCSid', label: 'Final Place of Delivery' },
      { key: 'IncoTerms', label: 'Inco Terms' },
      { key: 'FreightPPCC', label: 'Freight PP/CC' },
      { key: 'CargoType', label: 'Cargo Type' },
      { key: 'GrossWeight', label: 'Gross Weight' },
      { key: 'ClearanceBy', label: 'Clearance By' },
      { key: 'UserMasterSid', label: 'Salesman' },
    ],
    'quotation': [
      { key: 'CustomerMasterSid', label: 'Customer' },
      { key: 'CustomerAddress', label: 'Customer Address' },
      { key: 'PORSid', label: 'Place of Origin' },
      { key: 'POLSid', label: 'Port of Loading' },
      { key: 'PODSid', label: 'Port of Discharge' },
      { key: 'FPODSid', label: 'Final Place of Delivery' },
      { key: 'effDate', label: 'Effective Date' },
      { key: 'expDate', label: 'Expiry Date' },
      { key: 'FreightPPCC', label: 'Freight PP/CC' },
      { key: 'CargoType', label: 'Cargo Type' },
      { key: 'CarrierMasterSid', label: 'Carrier' },
      { key: 'SalesmanSid', label: 'Salesman' },
      { key: 'AgreedRate', label: 'Rate Agreed' },
      { key: 'segmentType', label: 'Mode of Transport' },
    ],
    'master job': [
      { key: 'POO', label: 'Place of Origin' },
      { key: 'POL', label: 'Port of Loading' },
      { key: 'POD', label: 'Port of Discharge' },
      { key: 'FPD', label: 'Final Place of Delivery' },
      { key: 'CarrierName', label: 'Carrier' },
      { key: 'VesselName', label: 'Vessel' },
      { key: 'VoyageNo', label: 'Voyage' },
      { key: 'ETD', label: 'ETD' },
      { key: 'ETA', label: 'ETA' },
      { key: 'MBLNo', label: 'MBL No' },
      { key: 'MBLDate', label: 'MBL Date' },
      { key: 'MasterJobDate', label: 'Master Job Date' },
      { key: 'JobStatus', label: 'Job Status' },
      { key: 'DepartmentMasterSid', label: 'Department' },
      { key: 'DestinationAgent', label: 'Destination Agent' },
      { key: 'FreightPPCC', label: 'Freight PPCC' },
      { key: 'MovementType', label: 'Movement Type' },
    ],
    'service job': [
      { key: 'DepartmentMasterSid', label: 'Department' },
      { key: 'CustomerMasterSid', label: 'Customer' },
      { key: 'CustomerBranchSid', label: 'Customer Branch' },
      { key: 'CustomerName', label: 'Customer Name' },
      { key: 'CustomerAddress', label: 'Customer Address' },
      { key: 'ShipperName', label: 'Shipper Name' },
      { key: 'ConsigneeName', label: 'Consignee Name' },
      { key: 'ShipmentNo', label: 'Shipment No' },
      { key: 'HBLNo', label: 'HBL No' },
      { key: 'JobType', label: 'Job Type' },
      { key: 'HBLDate', label: 'HBL Date' },
      { key: 'MBLNo', label: 'MBL No' },
      { key: 'MBLDate', label: 'MBL Date' },
      { key: 'POL', label: 'Port of Loading' },
      { key: 'POD', label: 'Port of Discharge' },
    ],
    'cargo receipt': [
      { key: 'BookingNo', label: 'Booking No' },
      { key: 'BookingDateTime', label: 'Booking Date/Time' },
      { key: 'departmentName', label: 'Department' },
      { key: 'CustomerName', label: 'Customer Name' },
      { key: 'HBLNo', label: 'HBL No' },
      { key: 'VesselName', label: 'Vessel Name' },
      { key: 'VoyageNo', label: 'Voyage No' },
      { key: 'POO', label: 'Port of Origin' },
      { key: 'POL', label: 'Port of Loading' },
      { key: 'POD', label: 'Port of Discharge' },
      { key: 'FPD', label: 'Final Port Discharge' },
    ],
    'invoice': [
      { key: 'VoucherNumber', label: 'Voucher Number' },
      { key: 'VoucherDate', label: 'Voucher Date' },
      { key: 'CustomerMasterSid', label: 'Customer' },
      { key: 'PartyName', label: 'Party Name' },
      { key: 'PartyAddress', label: 'Party Address' },
      { key: 'DepartmentMasterSid', label: 'Department' },
      { key: 'DocumentNumber', label: 'Document Number' },
      { key: 'IRNNumber', label: 'IRN Number' },
      { key: 'MasterJobSid', label: 'Master Job' },
      { key: 'HBLNo', label: 'HBL No' },
      { key: 'MBLNo', label: 'MBL No' },
      { key: 'CurrencyCode', label: 'Currency' },
      { key: 'GST_VAT', label: 'GST/VAT' },
      { key: 'InvoiceType', label: 'Invoice Type' },
      { key: 'status', label: 'Status' },
    ],
    'vendor invoice': [
      { key: 'VoucherNumber', label: 'Voucher Number' },
      { key: 'VoucherDate', label: 'Voucher Date' },
      { key: 'PartyMasterSid', label: 'Vendor' },
      { key: 'PartyName', label: 'Vendor Name' },
      { key: 'PartyAddress', label: 'Vendor Address' },
      { key: 'DepartmentMasterSid', label: 'Department' },
      { key: 'BillNo', label: 'Bill No' },
      { key: 'BillDate', label: 'Bill Date' },
      { key: 'BillAmt', label: 'Bill Amount' },
      { key: 'CurrencyCode', label: 'Currency' },
      { key: 'ExchangeRate', label: 'Exchange Rate' },
      { key: 'GST_VAT', label: 'GST/VAT' },
      { key: 'InvoiceType', label: 'Invoice Type' },
      { key: 'Status', label: 'Status' },
      { key: 'Narration', label: 'Narration' },
    ],
    'credit note': [
      { key: 'VoucherNumber', label: 'Voucher Number' },
      { key: 'VoucherDate', label: 'Voucher Date' },
      { key: 'CustomerMasterSid', label: 'Customer' },
      { key: 'PartyName', label: 'Party Name' },
      { key: 'PartyAddress', label: 'Party Address' },
      { key: 'CreditNoteReason', label: 'Credit Note Reason' },
      { key: 'ReversalVoucherNumber', label: 'Reversal Voucher No' },
      { key: 'Salesman', label: 'Salesman' },
      { key: 'COAMasterSid', label: 'Chart of Accounts' },
      { key: 'MBLNo', label: 'MBL No' },
      { key: 'HBLNo', label: 'HBL No' },
      { key: 'Status', label: 'Status' },
      { key: 'PostStatus', label: 'Post Status' },
      { key: 'InvoiceType', label: 'Invoice Type' },
      { key: 'IRNNumber', label: 'IRN Number' },
    ],
    'vendor credit note': [
      { key: 'VoucherNumber', label: 'Voucher Number' },
      { key: 'VoucherDate', label: 'Voucher Date' },
      { key: 'PartyName', label: 'Vendor Name' },
      { key: 'CreditNoteReason', label: 'Credit Note Reason' },
      { key: 'ReversalVoucherNumber', label: 'Reversal Voucher No' },
      { key: 'Salesman', label: 'Salesman' },
      { key: 'COAMasterSid', label: 'Chart of Accounts' },
      { key: 'MBLNo', label: 'MBL No' },
      { key: 'HBLNo', label: 'HBL No' },
      { key: 'Status', label: 'Status' },
      { key: 'GST_VAT', label: 'GST/VAT' },
      { key: 'InvoiceType', label: 'Invoice Type' },
      { key: 'IRNNumber', label: 'IRN Number' },
      { key: 'Narration', label: 'Narration' },
    ],
    'credit request': [
      { key: 'CustomerName', label: 'Customer Name' },
      { key: 'CountryMasterSid', label: 'Country' },
      { key: 'status', label: 'Status' },
      { key: 'CustomerBranchSid', label: 'Customer Branch' },
      { key: 'DepartmentMasterSid', label: 'Department' },
      { key: 'SalesmanSid', label: 'Salesman' },
      { key: 'CreditDays', label: 'Credit Days' },
      { key: 'CreditLimit', label: 'Credit Limit' },
      { key: 'PublishedDays', label: 'Published Days' },
      { key: 'PublishedLimit', label: 'Published Limit' },
      { key: 'EffectiveFrom', label: 'Effective From' },
      { key: 'EffectiveTo', label: 'Effective To' },
      { key: 'ApprovalStatus', label: 'Approval Status' },
    ],
    'master air waybill': [
      { key: 'DepartmentMasterSid', label: 'Department' },
      { key: 'MBLNo', label: 'MBL Number' },
      { key: 'MBLDate', label: 'MBL Date' },
      { key: 'POL', label: 'Port of Loading' },
      { key: 'POD', label: 'Port of Discharge' },
      { key: 'FPD', label: 'Final Place of Delivery' },
      { key: 'FreightPPCC', label: 'Freight Prepaid/Collect' },
      { key: 'Status', label: 'Status' },
      { key: 'VesselName', label: 'Vessel Name' },
      { key: 'VoyageNo', label: 'Voyage Number' },
      { key: 'ETD', label: 'ETD' },
      { key: 'ETA', label: 'ETA' },
      { key: 'CarrierName', label: 'Carrier Name' },
      { key: 'DestinationAgent', label: 'Destination Agent' },
    ],
    'agent master air waybill': [
      { key: 'DepartmentMasterSid', label: 'Department' },
      { key: 'CustomerMasterSid', label: 'Customer' },
      { key: 'ShipperName', label: 'Shipper' },
      { key: 'ConsigneeName', label: 'Consignee' },
      { key: 'Notify', label: 'Notify Party' },
      { key: 'HBLNo', label: 'HBL Number' },
      { key: 'HBLDate', label: 'HBL Date' },
      { key: 'MBLNo', label: 'MBL Number' },
      { key: 'MBLDate', label: 'MBL Date' },
      { key: 'VesselName', label: 'Vessel Name' },
      { key: 'VoyageNo', label: 'Voyage Number' },
      { key: 'POL', label: 'Port of Loading' },
      { key: 'POD', label: 'Port of Discharge' },
      { key: 'IncoTerms', label: 'Inco Terms' },
      { key: 'FreightTerms', label: 'Freight Terms' },
      { key: 'Status', label: 'Status' },
    ],
    'house air waybill': [
      { key: 'CustomerMasterSid', label: 'Customer' },
      { key: 'ShipperName', label: 'Shipper' },
      { key: 'ConsigneeName', label: 'Consignee' },
      { key: 'Notify', label: 'Notify Party' },
      { key: 'HBLNo', label: 'HBL Number' },
      { key: 'HBLDate', label: 'HBL Date' },
      { key: 'MBLNo', label: 'MBL Number' },
      { key: 'POL', label: 'Port of Loading' },
      { key: 'POD', label: 'Port of Discharge' },
      { key: 'VesselName', label: 'Vessel Name' },
      { key: 'VoyageNo', label: 'Voyage Number' },
      { key: 'ETD', label: 'ETD' },
      { key: 'ETA', label: 'ETA' },
      { key: 'IncoTerms', label: 'Inco Terms' },
      { key: 'FreightTerms', label: 'Freight Terms' },
    ],
    'split booking': [
      { key: 'DepartmentMasterSid', label: 'Department' },
      { key: 'BookingHeaderSid', label: 'Booking' },
      { key: 'CustomerMasterSid', label: 'Customer' },
      { key: 'ShipperName', label: 'Shipper' },
      { key: 'ConsigneeName', label: 'Consignee' },
      { key: 'POL', label: 'Port of Loading' },
      { key: 'POD', label: 'Port of Discharge' },
    ],
    'merge booking': [
      { key: 'DepartmentMasterSid', label: 'Department' },
      { key: 'BookingHeaderSid', label: 'Booking' },
      { key: 'CustomerMasterSid', label: 'Customer' },
      { key: 'ShipperName', label: 'Shipper' },
      { key: 'ConsigneeName', label: 'Consignee' },
      { key: 'POL', label: 'Port of Loading' },
      { key: 'POD', label: 'Port of Discharge' },
      { key: 'FPD', label: 'Final Place of Delivery' },
    ],
    'loading plan': [
      { key: 'dept', label: 'Department' },
      { key: 'pol', label: 'Port of Loading' },
      { key: 'pod', label: 'Port of Discharge' },
      { key: 'vesselVoyage', label: 'Vessel/Voyage' },
      { key: 'carrier', label: 'Carrier' },
      { key: 'ETD', label: 'ETD' },
      { key: 'ETA', label: 'ETA' },
    ],
    'shipment instruction': [
      { key: 'HBLNo', label: 'HBL No' },
      { key: 'BookingNo', label: 'Booking No' },
      { key: 'CustomerName', label: 'Customer Name' },
      { key: 'ShipperName', label: 'Shipper' },
      { key: 'ConsigneeName', label: 'Consignee' },
      { key: 'POL', label: 'Port of Loading' },
      { key: 'POD', label: 'Port of Discharge' },
      { key: 'SIConfirmationDate', label: 'SI Confirmation Date' },
    ],
    'manifest': [
      { key: 'manifestNumber', label: 'Manifest Number' },
      { key: 'vesselName', label: 'Vessel Name' },
      { key: 'voyageNumber', label: 'Voyage Number' },
      { key: 'portOfLoading', label: 'Port of Loading' },
      { key: 'portOfDischarge', label: 'Port of Discharge' },
      { key: 'dateOfDeparture', label: 'Date of Departure' },
      { key: 'dateOfArrival', label: 'Date of Arrival' },
      { key: 'agent', label: 'Agent' },
      { key: 'carrier', label: 'Carrier' },
      { key: 'totalContainers', label: 'Total Containers' },
      { key: 'totalWeight', label: 'Total Weight' },
      { key: 'totalVolume', label: 'Total Volume' },
    ],
  };

  updateFieldOptions: { key: string; label: string }[] = [];

  constructor(
    private fb: FormBuilder,
    private emailService: EmailModuleService,
    private settingsService: SettingsService,
    private appSettingService: AppSettingsService,
    private router: Router,
    private spinner: NgxSpinnerService,
    private ngbModal: NgbModal
  ) { }

  ngOnInit(): void {
    this.currentCompany = this.appSettingService.getCurrentCompanyInfo();
    this.userData = this.appSettingService.getDecryptedUserProfile();

    this.loadMenuList();
    this.loadExistingData();
  }

  private loadMenuList(): void {
    this.settingsService.getAllMenu().subscribe({
      next: (menus) => {
        this.menuList = (menus || []).filter((m: any) =>
          m.ModuleName?.toLowerCase().startsWith('operation') ||
          (m.ModuleName?.toLowerCase() === 'crm' && ['Enquiry', 'Quotation'].includes(m.MenuName))
        );
        // If already editing, recompute field options now that menuList is available
        if (this.editingRow?.MenuMasterSid) {
          const menuName = this.getMenuName(this.editingRow.MenuMasterSid);
          this.updateFieldOptionsForMenu(menuName);
          const isHouseJob = menuName?.toLowerCase().includes('house job');
          this.filteredActionOptions = isHouseJob
            ? this.actionOptions
            : this.actionOptions.filter(o => o.value !== 'SendSIMail');
        }
      },
      error: (err) => {
        this.appSettingService.showError('Error loading menu list.');
        console.error('Error loading menus:', err);
      }
    });
  }

  private loadExistingData(): void {
    if (!this.currentCompany?.CompanyMasterSid) return;

    this.spinner.show();
    this.emailService.getAllByCompany(this.currentCompany.CompanyMasterSid).subscribe({
      next: (resp) => {
        this.spinner.hide();
        if (resp.status && resp.data) {
          this.rows = resp.data.map((item: any) => {
            const actionStr = item.Action || '';
            const selectedActions = actionStr ? actionStr.split(',').map((a: string) => a.trim()).filter((a: string) => a) : [];
            const selectedUpdateFields = Array.isArray(item.UpdateFields) ? item.UpdateFields : [];
            return {
              MailConfigurationMasterSid: item.MailConfigurationMasterSid,
              Sno: Number(item.Sno),
              MailName: item.MailName,
              MenuMasterSid: item.MenuMasterSid,
              MailSubject: item.MailSubject,
              MailBody: item.MailBody,
              ToEmailidFrom: item.ToEmailidFrom || '',
              CcEmailidFrom: item.CcEmailidFrom || '',
              AttachmentRequire: item.AttachmentRequire,
              Action: actionStr,
              Trigger: item.Trigger || 'A',
              AutoPopup: item.AutoPopup,
              Status: item.Status,
              UpdateFields: selectedUpdateFields,
              selectedActions,
              selectedUpdateFields,
              isEditing: false,
              isNew: false
            };
          });
        }
      },
      error: (err) => {
        this.spinner.hide();
        console.error('Error loading data:', err);
      }
    });
  }

  private readonly defaultMailSubjects: { [key: string]: string } = {
    'Enquiry': 'Enquiry Received | No: {{EnquiryNo}} | Date: {{date}} | {{POO}} -> {{POD}}',
    'Quotation': 'Quotation Ready | No: {{quotationNumber}} | Date: {{date}} | {{POO}} -> {{POD}}',
    'Booking': 'Booking Confirmed | No: {{BookingNo}} | Date: {{date}} | {{POO}} -> {{POD}}',
  };

  private readonly defaultMailSubject = 'Notification | {{date}} | {{POO}} -> {{POD}}';

  getDefaultMailSubject(menuName: string): string {
    return this.defaultMailSubjects[menuName] || this.defaultMailSubject;
  }

  private readonly defaultMailBodies: { [key: string]: string } = {
    'Quotation': `Dear Sir/Madam,\n\nPlease find enclosed the quotation as requested.\nKindly review the details at your convenience.\nLooking forward to your feedback and the opportunity to work together.\n{{approvalLink}}\n\nBest Regards,\n\n{{userName}}`,
    'Enquiry': `Dear Sir/Madam,\n\nThank you for your enquiry. Please find the details below.\nKindly review and let us know if you need any further information.\n\nBest Regards,\n\n{{userName}}`,
    'Booking': `Dear Sir/Madam,\n\nPlease find the booking confirmation details below.\nKindly review the details at your convenience.\n\nBest Regards,\n\n{{userName}}`,
  };

  private readonly defaultMailBody = `Dear Sir/Madam,\n\nPlease find the details as requested.\nKindly review at your convenience.\n\nBest Regards,\n\n{{userName}}`;

  getDefaultMailBody(menuName: string): string {
    return this.defaultMailBodies[menuName] || this.defaultMailBody;
  }

  scrollToDetailForm(): void {
    setTimeout(() => {
      this.detailFormSection?.nativeElement?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  }

  getTriggerLabel(value: string): string {
    return value === 'A' ? 'Auto' : 'Manual';
  }

  getStatusLabel(value: string): string {
    return value === 'A' ? 'Active' : 'Inactive';
  }

  addRow(): void {
    /* OLD UI addRow() body:
    const newSno = this.rows.length > 0 ? Math.max(...this.rows.map(r => r.Sno)) + 1 : 1;
    this.rows.push({
      Sno: newSno, MailName: '', MenuMasterSid: null, MailSubject: '', MailBody: '',
      ToEmailidFrom: '{{toEmail}}', CcEmailidFrom: '{{ccEmail}}, {{userEmail}}',
      AttachmentRequire: 'Y', Action: '', Trigger: 'A', AutoPopup: 'A', Status: 'A',
      isEditing: true, isNew: true
    });
    */

    if (this.editingIndex !== null) {
      this.appSettingService.showWarning('Please save or cancel the current edit before adding a new row.');
      return;
    }

    const newSno = this.rows.length > 0 ? Math.max(...this.rows.map(r => r.Sno)) + 1 : 1;

    this.rows.push({
      Sno: newSno,
      MailName: '',
      MenuMasterSid: null,
      MailSubject: '',
      MailBody: '',
      ToEmailidFrom: '{{toEmail}}',
      CcEmailidFrom: '{{ccEmail}}, {{userEmail}}',
      AttachmentRequire: 'Y',
      Action: '',
      Trigger: 'A',
      AutoPopup: 'A',
      Status: 'A',
      UpdateFields: [],
      selectedActions: [],
      selectedUpdateFields: [],
      isEditing: true,
      isNew: true
    });

    this.editingIndex = this.rows.length - 1;
    this.editingRow = this.rows[this.editingIndex];
    this.editingSnapshot = null;
    this.scrollToDetailForm();
  }

  onMenuChange(row: MailConfigRow, menuMasterSid: number | null): void {
    row.MenuMasterSid = menuMasterSid;
    if (!menuMasterSid) return;

    const menuName = this.getMenuName(menuMasterSid);
    // Only auto-fill MailBody if it's empty or still matches a default template
    const isDefaultBody = !row.MailBody ||
      row.MailBody === this.defaultMailBody ||
      Object.values(this.defaultMailBodies).includes(row.MailBody);

    if (isDefaultBody) {
      row.MailBody = this.getDefaultMailBody(menuName);
    }

    const isDefaultSubject = !row.MailSubject ||
      row.MailSubject === this.defaultMailSubject ||
      Object.values(this.defaultMailSubjects).includes(row.MailSubject);

    if (isDefaultSubject) {
      row.MailSubject = this.getDefaultMailSubject(menuName);
    }

    // Filter action options: show SendSIMail only for House Job
    const isHouseJob = menuName?.toLowerCase().includes('house job');
    this.filteredActionOptions = isHouseJob
      ? this.actionOptions
      : this.actionOptions.filter(o => o.value !== 'SendSIMail');

    // If switching away from House Job, remove SendSIMail from selections
    if (!isHouseJob && row.selectedActions?.includes('SendSIMail')) {
      row.selectedActions = row.selectedActions.filter(a => a !== 'SendSIMail');
      row.Action = row.selectedActions.join(',');
    }

    // Update trigger field options based on selected menu
    this.updateFieldOptionsForMenu(menuName);

    // Clear selected update fields when menu changes
    row.selectedUpdateFields = [];
    row.UpdateFields = [];
  }

  private updateFieldOptionsForMenu(menuName: string): void {
    const lower = menuName?.toLowerCase() || '';
    // Prefer the longest matching key so "Vendor Invoice" matches 'vendor invoice', not 'invoice'.
    const key = Object.keys(this.menuFieldsMap)
      .filter(k => lower.includes(k))
      .sort((a, b) => b.length - a.length)[0];
    this.updateFieldOptions = key ? this.menuFieldsMap[key] : [];
  }

  editRow(index: number): void {
    /* OLD UI editRow() body:
    this.rows[index].isEditing = true;
    */

    if (this.editingIndex !== null && this.editingIndex !== index) {
      this.appSettingService.showWarning('Please save or cancel the current edit first.');
      return;
    }

    this.editingSnapshot = { ...this.rows[index] };
    this.editingIndex = index;
    this.editingRow = this.rows[index];
    this.rows[index].isEditing = true;

    // Update filtered action options and trigger fields based on selected menu
    const menuName = this.editingRow.MenuMasterSid ? this.getMenuName(this.editingRow.MenuMasterSid) : '';
    const isHouseJob = menuName?.toLowerCase().includes('house job');
    this.filteredActionOptions = isHouseJob
      ? this.actionOptions
      : this.actionOptions.filter(o => o.value !== 'SendSIMail');
    this.updateFieldOptionsForMenu(menuName);

    this.scrollToDetailForm();
  }

  cancelEdit(index: number): void {
    /* OLD UI cancelEdit() body:
    if (this.rows[index].isNew) {
      this.rows.splice(index, 1);
    } else {
      this.loadExistingData();
    }
    */

    if (this.rows[index].isNew) {
      this.rows.splice(index, 1);
    } else if (this.editingSnapshot) {
      this.rows[index] = { ...this.editingSnapshot };
      this.rows[index].isEditing = false;
    }

    this.editingIndex = null;
    this.editingRow = null;
    this.editingSnapshot = null;
  }

  saveRow(index: number): void {
    const row = this.rows[index];

    // Check for duplicate MenuMasterSid (excluding current row)
    const isDuplicate = this.rows.some((r, idx) =>
      idx !== index &&
      r.MenuMasterSid === row.MenuMasterSid
    );
    if (isDuplicate) {
      this.appSettingService.showWarning('A mail configuration already exists for this menu.');
      return;
    }

    // Validation
    if (!row.Sno || !row.MailName || !row.MenuMasterSid || !row.MailSubject || !row.MailBody || !row.selectedActions?.length) {
      this.appSettingService.showWarning('Please fill all required fields (Sno, Mail Name, Menu, Subject, Body, Action).');
      return;
    }

    // Sync selectedActions back to Action CSV
    row.Action = (row.selectedActions || []).join(',');
    row.UpdateFields = row.selectedUpdateFields || [];

    const payload: any = {
      CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
      Sno: row.Sno,
      MailName: row.MailName,
      MenuMasterSid: row.MenuMasterSid,
      MailSubject: row.MailSubject,
      MailBody: row.MailBody,
      ToEmailidFrom: row.ToEmailidFrom || '',
      CcEmailidFrom: row.CcEmailidFrom || '',
      AttachmentRequire: row.AttachmentRequire,
      Action: row.Action,
      Trigger: row.Trigger,
      AutoPopup: row.AutoPopup,
      Status: row.Status,
      UpdateFields: row.UpdateFields || []
    };

    this.spinner.show();

    if (row.isNew) {
      this.emailService.createMailConfiguration(payload).subscribe({
        next: (resp) => {
          this.spinner.hide();
          if (resp.status) {
            this.appSettingService.showSuccess('Mail configuration saved successfully.');
            row.MailConfigurationMasterSid = resp.data.MailConfigurationMasterSid;
            row.isEditing = false;
            row.isNew = false;
            this.editingIndex = null;
            this.editingRow = null;
            this.editingSnapshot = null;
          } else {
            this.appSettingService.showError(resp.message || 'Error saving mail configuration.');
          }
        },
        error: (err) => {
          this.spinner.hide();
          this.appSettingService.showError('Error saving mail configuration.');
          console.error('Save error:', err);
        }
      });
    } else {
      this.emailService.updateMailConfiguration(row.MailConfigurationMasterSid!, payload).subscribe({
        next: (resp) => {
          this.spinner.hide();
          if (resp.status) {
            this.appSettingService.showSuccess('Mail configuration updated successfully.');
            row.isEditing = false;
            this.editingIndex = null;
            this.editingRow = null;
            this.editingSnapshot = null;
          } else {
            this.appSettingService.showError(resp.message || 'Error updating mail configuration.');
          }
        },
        error: (err) => {
          this.spinner.hide();
          this.appSettingService.showError('Error updating mail configuration.');
          console.error('Update error:', err);
        }
      });
    }
  }

  deleteRow(index: number): void {
    const row = this.rows[index];

    if (row.isNew) {
      this.rows.splice(index, 1);
      if (this.editingIndex === index) {
        this.editingIndex = null;
        this.editingRow = null;
        this.editingSnapshot = null;
      }
      return;
    }

    if (!confirm('Are you sure you want to delete this mail configuration?')) {
      return;
    }

    this.spinner.show();
    this.emailService.deleteMailConfiguration(row.MailConfigurationMasterSid!).subscribe({
      next: (resp) => {
        this.spinner.hide();
        if (resp.status) {
          this.appSettingService.showSuccess('Mail configuration deleted successfully.');
          if (this.editingIndex === index) {
            this.editingIndex = null;
            this.editingRow = null;
            this.editingSnapshot = null;
          } else if (this.editingIndex !== null && this.editingIndex > index) {
            this.editingIndex--;
            this.editingRow = this.rows[this.editingIndex];
          }
          this.rows.splice(index, 1);
        } else {
          this.appSettingService.showError(resp.message || 'Error deleting mail configuration.');
        }
      },
      error: (err) => {
        this.spinner.hide();
        this.appSettingService.showError('Error deleting mail configuration.');
        console.error('Delete error:', err);
      }
    });
  }

  onTriggerChange(row: MailConfigRow): void {
    if (row.Trigger === 'A') {
      row.AutoPopup = 'A';
    }
  }

  onActionChange(row: MailConfigRow): void {
    row.Action = (row.selectedActions || []).join(',');
    if (!row.selectedActions?.includes('UPDATE')) {
      row.selectedUpdateFields = [];
      row.UpdateFields = [];
    }
  }

  onUpdateFieldsChange(row: MailConfigRow): void {
    row.UpdateFields = row.selectedUpdateFields || [];
  }

  getMenuName(menuMasterSid: number | null): string {
    if (!menuMasterSid) return '';
    const menu = this.menuList.find(m => m.MenuMasterSid === menuMasterSid);
    return menu?.MenuName || '';
  }

  openMailSubjectModal(row: MailConfigRow): void {
    const modalRef = this.ngbModal.open(MailSubjectModalComponent, {
      size: 'lg',
      centered: true,
      backdrop: 'static'
    });
    modalRef.componentInstance.mailSubject = row.MailSubject;
    modalRef.result.then((result: string) => {
      row.MailSubject = result;
    }).catch(() => {});
  }

  openMailBodyModal(row: MailConfigRow): void {
    const modalRef = this.ngbModal.open(MailBodyModalComponent, {
      size: 'lg',
      centered: true,
      backdrop: 'static'
    });
    modalRef.componentInstance.mailBody = row.MailBody;
    modalRef.result.then((result: string) => {
      row.MailBody = result;
    }).catch(() => {});
  }

  navigateBack(): void {
    const userProfile = this.appSettingService.getDecryptedUserProfile();
    const salespersonFlag = String(userProfile?.isSalesperson || '').toUpperCase();

    if (salespersonFlag === '1' || salespersonFlag === 'Y') {
      this.router.navigate(['/dashboard/sales']);
    } else {
      this.router.navigate(['/dashboard']);
    }
  }

  get activeCount(): number {
    return (this.rows?.filter(r => r.Status === 'A')?.length) || 0;
  }

  get manualTriggerCount(): number {
    return (this.rows?.filter(r => r.Trigger === 'M')?.length) || 0;
  }
}
