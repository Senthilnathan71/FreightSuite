import { CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { FeatherModule } from 'angular-feather';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { EmailValidators } from 'src/app/core/ValidationFn/email.validators';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { LogoService } from 'src/app/core/services/logo.service';
import { SettingsService } from '../../settings.service';

@Component({
  selector: 'app-email-entry',
  standalone: true,
  imports: [NgSelectModule, FeatherModule, ReactiveFormsModule, CommonModule, NgxSpinnerModule],
  templateUrl: './email-entry.component.html',
  styleUrl: './email-entry.component.scss',
})
export class EmailEntryComponent implements OnInit {
  emailForm: FormGroup;
  emailSending: boolean;
  parentMailContent: any;
  pendingPatchData: any = null;
  @Input() dataItems: any[] = [];
  @Input() resetTrigger: any;
  @Input() formData: any;
  @Input()
  set setContent(value: any) {
    this.parentMailContent = value;
    if (value) {
      if (this.emailForm) {
        this.patchFormData(value);
      } else {
        this.pendingPatchData = value;
      }
    }
  }
  @Output() dataChange = new EventEmitter<any>();

  @ViewChild('fileInput') fileInput: ElementRef<HTMLInputElement>;
  selectedFiles: File[] = [];
  userData: any;
  currentCompany: any;
  currentBranch: any;
  private reportLogoSrc = '';

  constructor(
    private fb: FormBuilder,
    private appSettingService: AppSettingsService,
    private settingsService: SettingsService,
    private activeModal: NgbActiveModal,
    private spinner: NgxSpinnerService,
    public logoService: LogoService
  ) {
    this.initMailForm();
  }

  ngOnInit(): void {
    if (this.pendingPatchData) {
      this.patchFormData(this.pendingPatchData);
      this.pendingPatchData = null;
    }

    this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));
    this.currentBranch = this.appSettingService.decrypt(localStorage.getItem('selected-branch'));

    const userProfile = this.appSettingService.getDecryptedUserProfile();
    if (userProfile) {
      this.userData = userProfile;
    }

    this.resolveCurrentCompanyContext();
    this.reportLogoSrc = this.getReportLogoSrc();
  }

  patchFormData(value: any) {
    this.emailForm.patchValue({
      EmailTo: Array.isArray(value.EmailTo) ? value.EmailTo.join(', ') : value.EmailTo || '',
      EmailCC: Array.isArray(value.EmailCC) ? value.EmailCC.join(', ') : value.EmailCC || '',
      EmailBCC: Array.isArray(value.EmailBCC) ? value.EmailBCC.join(', ') : value.EmailBCC || '',
      Subject: value.Subject || '',
      Mailbody: value.Mailbody || '',
    });

    if (value.attachments) {
      this.selectedFiles = value.attachments;
    }
  }

  initMailForm() {
    this.emailForm = this.fb.group({
      EmailTo: [
        '',
        [Validators.required, EmailValidators.multipleEmails(), Validators.maxLength(200)],
      ],
      EmailCC: ['', [EmailValidators.multipleEmails(), Validators.maxLength(200)]],
      EmailBCC: ['', [EmailValidators.multipleEmails(), Validators.maxLength(200)]],
      Subject: ['', [Validators.required, Validators.maxLength(500)]],
      Mailbody: ['', [Validators.required, Validators.maxLength(2000)]],
    });
  }

  closeModal() {
    this.activeModal.close();
  }

  resetForm() {
    this.emailForm.reset();
    this.selectedFiles = [];
  }

  onFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      const files = Array.from(input.files);
      this.selectedFiles = [...this.selectedFiles, ...files];
      input.value = '';
    }
  }

  removeFile(index: number) {
    this.selectedFiles.splice(index, 1);
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['formData'] && changes['formData'].currentValue) {
      this.patchFormData(changes['formData'].currentValue);
    }

    if (changes['resetTrigger'] && changes['resetTrigger'].currentValue) {
      this.resetForm();
    }
  }

  saveForm() {
    if (this.emailForm.invalid) {
      this.emailForm.markAllAsTouched();
      this.emailForm.updateValueAndValidity();
      this.appSettingService.showWarning('Please fill the required fields correctly');
      return;
    }

    this.emailSending = true;
    const formValue = this.emailForm.value;
    this.spinner.show();

    const companyMasterSid = this.currentCompany?.CompanyMasterSid;
    const branchMasterSid = this.currentBranch?.BranchMasterSid;
    const userEmail = this.userData.userEmail;

    const formData = new FormData();
    formData.append('CompanyMasterSid', companyMasterSid.toString());
    formData.append('BranchMasterSid', branchMasterSid.toString());
    formData.append('EmailTo', formValue.EmailTo);
    formData.append('EmailCC', formValue.EmailCC || '');
    formData.append('EmailBCC', formValue.EmailBCC || '');
    formData.append('Subject', formValue.Subject);
    formData.append(
      'Mailbody',
      this.buildCommonTemplate(formValue.Mailbody, formValue.Subject)
    );
    formData.append('CreatedBy', userEmail);

    this.selectedFiles.forEach((file) => {
      formData.append('attachments', file, file.name);
    });

    this.settingsService.createNewEmailLog(formData).subscribe(
      (resp: any) => {
        if (resp.status) {
          this.emailSending = false;
          this.appSettingService.showSuccess('Email Log created successfully.');
          this.spinner.hide();
          this.dataChange.emit({
            dataItems: this.dataItems,
            formData: this.emailForm.value,
          });
          this.closeModal();
        } else {
          this.emailSending = false;
          this.spinner.hide();
          this.appSettingService.showError('Email Log creation error.');
        }
      },
      (error) => {
        this.emailSending = false;
        this.spinner.hide();
        this.appSettingService.showError('Email Log creation error: ' + error.message);
      }
    );
  }
customEmailValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const email = control.value?.trim();

      if (!email) return null;

      const emailPattern = /^[a-zA-Z0-9]+@[a-zA-Z0-9]+\.[a-zA-Z]{2,}$/;
      return emailPattern.test(email) ? null : { emailInvalid: true };
    };
  }

  clearFiles() {
    this.selectedFiles = [];
  }

  downloadFile(file: File) {
    const url = URL.createObjectURL(file);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    a.click();
    URL.revokeObjectURL(url);
  }

  sendMail() {
    if (this.emailForm.valid) {
      this.emailForm.reset();
      this.selectedFiles = [];
      this.closeModal();
    }
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    if (event.dataTransfer?.files) {
      for (const file of Array.from(event.dataTransfer.files)) {
        this.selectedFiles.push(file);
      }
    }
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
  }

  ngAfterViewInit() {
    const textarea = document.querySelector('textarea[formControlName="Mailbody"]') as HTMLTextAreaElement;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = textarea.scrollHeight + 'px';
    }
  }

  private resolveCurrentCompanyContext(): void {
    this.currentCompany =
      ((this.userData?.userCompanyMaster || []).find(
        (ucm: any) => ucm.CompanyMasterSid === this.currentCompany?.CompanyMasterSid
      ))?.companyMaster || this.currentCompany;

    this.currentBranch =
      ((this.currentCompany?.userBranchMaster || []).find(
        (ubm: any) => ubm.BranchMasterSid === this.currentBranch?.BranchMasterSid
      ))?.branchMaster || this.currentBranch;
  }

  private getReportLogoSrc(): string {
    const reportLogo = localStorage.getItem('current_report_logo');
    if (reportLogo && reportLogo.startsWith('data:')) {
      return reportLogo;
    }

    const companyLogo = localStorage.getItem('current_company_logo');
    if (companyLogo && companyLogo.startsWith('data:')) {
      return companyLogo;
    }

    return '';
  }

  private buildHeaderTemplate(): string {
    const companyName = this.currentCompany?.companyName || 'Company Name';
    const branchName = this.currentBranch?.branchName || '';
    const logoHtml = this.reportLogoSrc
      ? `<img src="${this.reportLogoSrc}" alt="${companyName}" style="width:auto;height:56px;max-width:180px;margin-right:12px;display:block;">`
      : '';

    return `
      <div style="background:#fff;padding:16px 20px;border-bottom:1px solid #e5e7eb;">
        <div style="display:flex;align-items:center;gap:12px;">
          ${logoHtml}
          <div style="color:#05608D;">
            <div style="font-size:22px;font-weight:700;line-height:1.2;">${companyName}</div>
            ${branchName ? `<div style="font-size:14px;font-weight:600;line-height:1.4;">${branchName}</div>` : ''}
          </div>
        </div>
      </div>
    `;
  }

    private buildFooterTemplate(): string {
    return `
      <div style="background:#f5f7fb;padding:6px 22px 14px 22px">
        <div style="
          max-width:640px;
          margin:0 auto;
          background:#05608D;
          color:#fff;
          text-align:center;
          padding:12px 16px;
          border-radius:14px;
          font-size:13px;
        ">
          <div style="margin-bottom:8px">
            <a href="#" style="color:#fff;text-decoration:none;margin:0 8px">Terms</a>
            <span>|</span>
            <a href="#" style="color:#fff;text-decoration:none;margin:0 8px">Privacy</a>
            <span>|</span>
            <a href="#" style="color:#fff;text-decoration:none;margin:0 8px">Contact</a>
            <span>|</span>
            <a href="#" style="color:#fff;text-decoration:none;margin:0 8px">Unsubscribe</a>
          </div>
          <div style="opacity:0.8">
            Â© ${new Date().getFullYear()} Dofi Infosys. All rights reserved.
          </div>
        </div>
      </div>
    `;
  }

  private buildCommonTemplate(body: string, subject: string): string {
    const bodyHtml = this.formatEmailBody(body);
    const headerLabel = this.getHeaderLabel(subject || '');
    const summaryHtml = this.buildSummaryChips(body, subject, headerLabel);
    const formattedBody = this.buildFormattedBody(bodyHtml, summaryHtml, headerLabel);
    return this.buildHeaderTemplate() + formattedBody + this.buildFooterTemplate();
  }

  private buildFormattedBody(bodyHtml: string, summaryHtml: string, headerLabel: string): string {
    return `
      <div style="background:#f5f7fb;padding:28px 22px">
        
        <div style="
          max-width:700px;
          margin:0 auto;
          font-family:Arial, sans-serif;
        ">

          <!-- Summary Card -->
          <div style="
            background:#ffffff;
            border-radius:16px;
            border:1px solid #e6edf5;
            box-shadow:0 10px 26px rgba(5,96,141,0.10);
            overflow:hidden;
          ">
            <div style="
              background:linear-gradient(90deg,#0b6aa1,#1791d1);
              color:#fff;
              padding:16px 22px;
              display:flex;
              align-items:center;
              justify-content:space-between;
              gap:10px;
              flex-wrap:wrap;
            ">
              <span style="
                background:#ffffff;
                color:#0b6aa1;
                padding:6px 12px;
                border-radius:999px;
                font-size:12px;
                font-weight:800;
                letter-spacing:0.3px;
                text-transform:uppercase;
              ">${headerLabel}</span>
              
            </div>

            <div style="padding:18px 22px 20px 22px;">
              ${summaryHtml}
            </div>
          </div>

          <!-- Message Card -->
          <div style="
            margin-top:16px;
            background:#ffffff;
            border-radius:16px;
            border:1px solid #e6edf5;
            box-shadow:0 8px 20px rgba(5,96,141,0.08);
            overflow:hidden;
          ">
            <div style="
              padding:16px 20px 20px 20px;
              font-size:15px;
              line-height:1.75;
              color:#2b3a4a;
              background:#fbfdff;
            ">
              <div style="
                background:#ffffff;
                border:1px solid #e1eaf3;
                border-radius:12px;
                padding:16px 18px;
                box-shadow:0 6px 14px rgba(11,106,161,0.08);
                position:relative;
              ">
                <div style="
                  border-left:4px solid #0b6aa1;
                  padding-left:14px;
                ">
                  ${bodyHtml}
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>
    `;
  }

  private formatEmailBody(rawBody: string): string {
    if (!rawBody) return '';

    const normalizedRaw = this.normalizeUrlBreaks(rawBody);
    const withHighlight = this.applyHighlightMarkup(normalizedRaw);
    const hasHtml = /<\/?[a-z][\s\S]*>/i.test(withHighlight);

    if (hasHtml) {
      return this.linkifyText(withHighlight).replace(/\n/g, '<br>');
    }

    const lines = withHighlight
      .split(/\r?\n/)
      .map(line => line.trim())
      .filter(line => line.length > 0);

    const htmlParts: string[] = [];
    let detailRows: Array<{ label: string; value: string }> = [];

    const pushDetails = () => {
      if (detailRows.length === 0) return;

      const rowsHtml = detailRows
        .map(
          row => `
            <tr>
              <td style="padding:8px 12px;color:#516070;font-weight:700;width:160px;vertical-align:top;background:#f2f6fa;border-bottom:1px solid #e2e9f1;">
                ${row.label}
              </td>
              <td style="padding:8px 12px;color:#1f2d3d;border-bottom:1px solid #e2e9f1;">
                <span style="background:#e8f3fb;color:#0b6aa1;padding:3px 8px;border-radius:6px;font-weight:600;display:inline-block;">
                  ${row.value}
                </span>
              </td>
            </tr>
          `
        )
        .join('');

      htmlParts.push(`
        <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;border:1px solid #e2e9f1;border-radius:10px;overflow:hidden;margin:14px 0 6px 0;">
          ${rowsHtml}
        </table>
      `);

      detailRows = [];
    };

    for (const line of lines) {
      const match = line.match(/^([^:]{2,40}):\s*(.+)$/);
      const isUrlLine = /^(https?:\/\/|\/\/)/i.test(line.trim());
      const isUrlLabel = match?.[1] && /^(http|https)$/i.test(match[1].trim());

      if (match && !isUrlLine && !isUrlLabel) {
        detailRows.push({ label: match[1].trim(), value: match[2].trim() });
      } else {
        pushDetails();
        htmlParts.push(`<p style="margin:0 0 10px 0;">${this.linkifyText(line)}</p>`);
      }
    }

    pushDetails();

    return htmlParts.join('');
  }

  private applyHighlightMarkup(text: string): string {
    return text
      .replace(/<\s*mark\s*>/gi, '<span style="background:#fff2b3;color:#7a5b00;padding:2px 6px;border-radius:6px;font-weight:700;">')
      .replace(/<\s*\/\s*mark\s*>/gi, '</span>')
      .replace(/\*\*(.+?)\*\*/g, '<span style="background:#e7f1fb;color:#0b6aa1;padding:2px 6px;border-radius:6px;font-weight:700;">$1</span>');
  }

  private linkifyText(text: string): string {
    if (!text) return '';
    const normalized = this.normalizeUrlBreaks(text)
      .replace(/\bhttps?\s*:?\s*\/\//gi, (match) =>
        match.toLowerCase().startsWith('https') ? 'https://' : 'http://'
      );
    const urlRegex = /((https?:\/\/|\/\/)[^\s<]+)/gi;
    return normalized.replace(urlRegex, (match) => {
      const href = match.startsWith('//') ? `https:${match}` : match;
      return `<a href="${href}" style="color:#0b6aa1;text-decoration:none;background:#e8f3fb;padding:4px 8px;border-radius:6px;font-weight:700;display:inline-block;border:1px solid #cfe5f5;" target="_blank" rel="noopener noreferrer">${match}</a>`;
    });
  }

  private normalizeUrlBreaks(text: string): string {
    if (!text) return '';
    return text
      .replace(/https?\s*:\s*\n\s*\/\//gi, (match) =>
        match.toLowerCase().startsWith('https') ? 'https://' : 'http://'
      )
      .replace(/https?\s*\n\s*\/\//gi, (match) =>
        match.toLowerCase().startsWith('https') ? 'https://' : 'http://'
      )
      .replace(/http\s*\/\//gi, 'http://')
      .replace(/https\s*\/\//gi, 'https://')
      .replace(/http\s*:\s*\/\//gi, 'http://')
      .replace(/https\s*:\s*\/\//gi, 'https://');
  }

  private getHeaderLabel(subject: string): string {
    const candidates = [
      this.parentMailContent?.menuName,
      this.parentMailContent?.MenuName,
      subject
    ]
      .filter(Boolean)
      .map((value: string) => value.toString());

    const normalized = candidates.find((value: string) =>
      /booking|enquiry|quotation/i.test(value)
    );

    if (normalized) {
      if (/booking/i.test(normalized)) return 'Booking';
      if (/enquiry/i.test(normalized)) return 'Enquiry';
      if (/quotation/i.test(normalized)) return 'Quotation';
    }

    if (/booking/i.test(subject)) return 'Booking';
    if (/enquiry/i.test(subject)) return 'Enquiry';
    if (/quotation/i.test(subject)) return 'Quotation';

    return 'Notification';
  }

  private buildSummaryChips(rawBody: string, subject?: string, headerLabel?: string): string {
    if (!rawBody && !subject) return '';

    const combinedText = `${rawBody || ''}\n${subject || ''}`;
    const lines = combinedText
      .split(/\r?\n/)
      .map(line => line.trim())
      .filter(line => line.length > 0);

    const bookingMatch = combinedText.match(/Booking\s*No\.?\s*[:\-]?\s*(.*?)(?:\s+Date\b|$)/i);
    const quotationMatch = combinedText.match(/Quotation\s*No\.?\s*[:\-]?\s*(.*?)(?:\s+Date\b|$)/i);
    const enquiryDateMatch = combinedText.match(/Enquiry\s*Date\s*[:\-]?\s*([0-9]{1,2}\/[0-9]{1,2}\/[0-9]{2,4})/i);
    const dateMatch = combinedText.match(/Date\s*[:\-]?\s*([0-9]{1,2}\/[0-9]{1,2}\/[0-9]{2,4})/i);
    const pooMatch = combinedText.match(/POO\s*[:\-]?\s*([^\n]+)/i);
    const podMatch = combinedText.match(/POD\s*[:\-]?\s*([^\n]+)/i);

    let route = '';
    const cleanPlace = (value: string): string =>
      value
        .replace(/Booking\s*No\.?\s*.*?Date\s*[:\-]?\s*[0-9/]+/i, '')
        .replace(/Booking\s*No\.?\s*.*?$/i, '')
        .replace(/Quotation\s*No\.?\s*.*?Date\s*[:\-]?\s*[0-9/]+/i, '')
        .replace(/Quotation\s*No\.?\s*.*?$/i, '')
        .replace(/Enquiry\s*Date\s*[:\-]?\s*[0-9/]+/i, '')
        .replace(/Date\s*[:\-]?\s*[0-9/]+/i, '')
        .replace(/\s+/g, ' ')
        .trim();

    const stripRefAndDate = (text: string): string => {
      if (!text) return '';
      const dateOnlyMatch = text.match(/([0-9]{1,2}\/[0-9]{1,2}\/[0-9]{2,4})/);
      if (!dateOnlyMatch) return text;
      return text.split(dateOnlyMatch[1]).slice(1).join(dateOnlyMatch[1]).trim();
    };

    for (const line of lines) {
      const routeMatch = line.match(/([^-]+?)\s*-\s*([A-Z0-9]{3,5})\s*-\s*([^-]+?)\s*-\s*([A-Z0-9]{3,5})/);
      if (routeMatch) {
        const fromPlace = cleanPlace(routeMatch[1].trim());
        const toPlace = cleanPlace(routeMatch[3].trim());
        route = `${fromPlace} (${routeMatch[2]}) -> ${toPlace} (${routeMatch[4]})`;
        break;
      }

      const parenRouteMatch = line.match(/(.+?)\s*\(([A-Z0-9]{3,5})\)\s*-\s*(.+?)\s*\(([A-Z0-9]{3,5})\)/);
      if (parenRouteMatch) {
        const fromPlace = cleanPlace(parenRouteMatch[1].trim());
        const toPlace = cleanPlace(parenRouteMatch[3].trim());
        route = `${fromPlace} (${parenRouteMatch[2].trim()}) -> ${toPlace} (${parenRouteMatch[4].trim()})`;
        break;
      }
    }

    const rows: Array<{ label: string; value: string }> = [];

    if (subject) {
      const subjectPattern = /^(\S+)\s+([0-9]{1,2}\/[0-9]{1,2}\/[0-9]{2,4})\s+(.+?)\s*-\s*([A-Z0-9]{3,5})\s+(.+?)\s*-\s*([A-Z0-9]{3,5})/;
      const directMatch = subject.trim().match(subjectPattern);
      if (directMatch) {
        const isEnquiry = /enquiry/i.test(headerLabel || '');
        const isQuotation = /quotation/i.test(headerLabel || '');
        const refLabel = isEnquiry ? 'Enquiry No' : isQuotation ? 'Quotation No' : 'Reference No';
        const dateLabel = isQuotation ? 'Quotation Date' : 'Date';
        rows.push({ label: refLabel, value: directMatch[1].trim() });
        rows.push({ label: dateLabel, value: directMatch[2].trim() });
        rows.push({
          label: 'Route',
          value: `${directMatch[3].trim()} (${directMatch[4].trim()}) -> ${directMatch[5].trim()} (${directMatch[6].trim()})`
        });
      }
    }

    if (bookingMatch?.[1] && !rows.some(row => row.label === 'Booking No')) {
      rows.push({ label: 'Booking No', value: bookingMatch[1].trim() });
    }
    if (quotationMatch?.[1] && !rows.some(row => row.label === 'Quotation No')) {
      rows.push({ label: 'Quotation No', value: quotationMatch[1].trim() });
    }

    const isQuotationHeader = /quotation/i.test(headerLabel || '');
    const dateLabel = isQuotationHeader ? 'Quotation Date' : 'Date';
    const dateValue = enquiryDateMatch?.[1] || dateMatch?.[1];
    if (dateValue && !rows.some(row => row.label === dateLabel)) {
      rows.push({ label: dateLabel, value: dateValue.trim() });
    }

    if (route && !rows.some(row => row.label === 'Route')) {
      rows.push({ label: 'Route', value: route });
    } else {
      if (pooMatch?.[1] && !rows.some(row => row.label === 'POO')) {
        rows.push({ label: 'POO', value: pooMatch[1].trim() });
      }
      if (podMatch?.[1] && !rows.some(row => row.label === 'POD')) {
        rows.push({ label: 'POD', value: podMatch[1].trim() });
      }
    }

    if (subject && /enquiry/i.test(headerLabel || '')) {
      const dateOnlyMatch = subject.match(/([0-9]{1,2}\/[0-9]{1,2}\/[0-9]{2,4})/);
      const dateOnly = dateOnlyMatch?.[1];
      let refNo = '';
      let subjectRoute = '';

      if (dateOnlyMatch) {
        const parts = subject.split(dateOnly);
        refNo = parts[0]?.trim() || '';
        subjectRoute = parts.slice(1).join(dateOnly).trim();
      } else {
        refNo = subject.trim();
      }

      const refLabel = 'Enquiry No';
      if (refNo && !rows.some(row => row.label === refLabel)) {
        rows.unshift({ label: refLabel, value: refNo });
      }
      if (dateOnly && !rows.some(row => row.label === 'Date')) {
        rows.push({ label: 'Date', value: dateOnly });
      }

      if (!rows.some(row => row.label === 'Route')) {
        const parsedRoute = this.parseRouteText(stripRefAndDate(subjectRoute));
        if (parsedRoute) {
          rows.push({ label: 'Route', value: parsedRoute });
        }
      }
    }

    const normalizedRows: Array<{ label: string; value: string }> = [];
    const seenLabels = new Set<string>();
    const trimLabel = (label: string): string => label.trim();
    const labelKey = (label: string): string => trimLabel(label).toLowerCase();

    for (const row of rows) {
      row.label = trimLabel(row.label);

      if (row.label === 'Route') {
        const cleanedRoute = this.parseRouteText(stripRefAndDate(row.value));
        if (cleanedRoute) {
          row.value = cleanedRoute;
        }
      }

      const key = labelKey(row.label);
      if (seenLabels.has(key)) {
        if (key === 'route') {
          const existingIndex = normalizedRows.findIndex(r => labelKey(r.label) === 'route');
          if (existingIndex >= 0) {
            const existing = normalizedRows[existingIndex];
            const existingHasRef = /[0-9]{1,2}\/[0-9]{1,2}\/[0-9]{2,4}|\bWL\/|Booking\s*No/i.test(existing.value);
            const newHasRef = /[0-9]{1,2}\/[0-9]{1,2}\/[0-9]{2,4}|\bWL\/|Booking\s*No/i.test(row.value);
            if (existingHasRef && !newHasRef) {
              normalizedRows[existingIndex] = row;
            }
          }
        }
        continue;
      }

      seenLabels.add(key);
      normalizedRows.push(row);
    }

    if (normalizedRows.length === 0) return '';

    const rowHtml = normalizedRows
      .map(
        row => `
          <tr>
            <td style="padding:8px 12px;color:#516070;font-weight:700;width:120px;vertical-align:top;background:#f2f6fa;border-bottom:1px solid #e2e9f1;">
              ${row.label}
            </td>
            <td style="padding:8px 12px;color:#1f2d3d;border-bottom:1px solid #e2e9f1;">
              ${row.value}
            </td>
          </tr>
        `
      )
      .join('');

    return `
      <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;border:1px solid #e2e9f1;border-radius:12px;overflow:hidden;margin:0 0 14px 0;background:#ffffff;">
        ${rowHtml}
      </table>
    `;
  }
  private parseRouteText(routeText: string): string {
    if (!routeText) return '';

    const cleaned = routeText.replace(/\s+/g, ' ').trim();
    if (!cleaned) return '';

    const parenMatch = cleaned.match(/^(.+?)\s*\(([A-Z0-9]{3,5})\)\s*[-→]\s*(.+?)\s*\(([A-Z0-9]{3,5})\)$/);
    if (parenMatch) {
      return `${parenMatch[1].trim()} (${parenMatch[2].trim()}) → ${parenMatch[3].trim()} (${parenMatch[4].trim()})`;
    }

    const parts = cleaned.split('-').map(part => part.trim()).filter(Boolean);

    if (parts.length >= 4) {
      const fromName = parts[0];
      const fromCode = parts[1];
      const toName = parts[2];
      const toCode = parts[3];
      return `${fromName} (${fromCode}) → ${toName} (${toCode})`;
    }

    if (parts.length >= 2) {
      return `${parts[0]} → ${parts.slice(1).join(' - ')}`;
    }

    return cleaned;
  }

}




