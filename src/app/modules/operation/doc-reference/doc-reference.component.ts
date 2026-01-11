
import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit, TemplateRef } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormArray,
  Validators,
  ReactiveFormsModule,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { NgSelectModule } from '@ng-select/ng-select';
import {
  NgbDatepickerModule,
  NgbDropdownModule,
  NgbModal,
  NgbModalRef,
  NgbCalendar,
  NgbDateAdapter,
  NgbDateParserFormatter, NgbDateStruct,
} from '@ng-bootstrap/ng-bootstrap';
import { FeatherModule } from 'angular-feather';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { MasterService } from '../../master/master.service';
import { CustomDateAdapter } from 'src/app/component/datepicker/custom-date-adapter';
import { CustomDateParserFormatter } from 'src/app/component/datepicker/custom-date-parser';
import { TextWithNumbersDirective } from 'src/app/core/Directives/textWithNumbers';
import { TermsAndConditionsComponent } from 'src/app/component/terms&conditions/terms&conditions.component';
import { AuthorityLogComponent } from 'src/app/component/authority-log/authority-log.component';
import { EdocComponent } from '../../settings/edoc/edoc/edoc.component';
import { EmailEntryComponent } from '../../settings/email/email-entry/email-entry.component';


@Component({
  selector: 'app-doc-reference',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NgSelectModule,
    NgbDatepickerModule,
    NgbDropdownModule,
    FeatherModule,
    TextWithNumbersDirective,
  ],
  templateUrl: './doc-reference.component.html',
  styleUrls: ['./doc-reference.component.scss'],
  providers: [
    { provide: NgbDateAdapter, useClass: CustomDateAdapter },
    { provide: NgbDateParserFormatter, useClass: CustomDateParserFormatter },
    DatePipe,
  ],
})
export class DocReferenceComponent implements OnInit {
  docRefForm!: FormGroup;
  isEditMode = false;
  btnDisable = false;
  loading = false;
  docRefId!: number;
  docRefData: any;
  userData: any;
  permissions: string[] = [
    'View',
    'Edit',
    'Add',
    'Delete',
    'Edoc',
    'Terms and Condition',
    'Authority',
    'Email',
  ];
  currentMenuPermissions: any = {};
  currentMenuId: any;
  MenuMasterSid!: number;
  TandCList: any;


  auditLogs: any[] = [];
  auditLogModalRef!: NgbModalRef;


  currentCompany: any;
  currentBranch: any;
  today = this.calendar.getToday();
  minDate: NgbDateStruct;


  private isSubmitting = false;


  statusOptions = [
    { id: 'Active', name: 'Active', value: 'A' },
    { id: 'Inactive', name: 'Inactive', value: 'I' },
  ];


  constructor(
    private fb: FormBuilder,
    private masterService: MasterService,
    private http: HttpClient,
    private route: ActivatedRoute,
    private router: Router,
    private appSettingService: AppSettingsService,
    private calendar: NgbCalendar,
    private modalService: NgbModal,
    private datePipe: DatePipe,
  ) {
    this.initForm();
    const today = new Date();
    this.minDate = { year: today.getFullYear(), month: today.getMonth() + 1, day: today.getDate() };
  }


  ngOnInit(): void {
    this.currentCompany = this.appSettingService.decrypt(
      localStorage.getItem('selected-company'),
    );
    this.currentBranch = this.appSettingService.decrypt(
      localStorage.getItem('selected-branch'),
    );


    const menuIdRaw = localStorage.getItem('currentMenuId');
    this.MenuMasterSid = menuIdRaw ? Number(menuIdRaw) : 0;


    if (!this.MenuMasterSid || isNaN(this.MenuMasterSid)) {
      this.appSettingService.showError(
        'MenuMasterSid is missing or invalid. Please set currentMenuId in localStorage.',
      );
    }


    this.route.params.subscribe((params) => {
      if (params['id']) {
        this.docRefId = +params['id'];
        this.isEditMode = true;
        this.loadDocumentData();
      } else {
        this.addDocumentRow();
      }
    });


    const userProfile =
      this.appSettingService.getDecryptedUserProfile();
    if (userProfile) {
      this.userData = userProfile;
     
    }
  }


  initForm() {
    this.docRefForm = this.fb.group({
      documentReferences: this.fb.array([]),
    });
  }


  get documentReferences(): FormArray {
    return this.docRefForm.get('documentReferences') as FormArray;
  }


  private maxLengthValidator(max: number) {
    return (control: AbstractControl): ValidationErrors | null => {
      if (control.value && control.value.length > max) {
        return { maxLengthExceeded: { value: control.value.length, max } };
      }
      return null;
    };
  }


 
  createDocumentFormGroup(data?: any): FormGroup {
    return this.fb.group({
      refDocumentNo: [
        data?.refDocumentNo || '',
        [Validators.required, this.maxLengthValidator(20)],
      ],
      documentDate: [data?.documentDate || '', Validators.required],
      remarks: [data?.remarks || ''],
      isPublic: [data?.isPublic ?? true],
      status: [data?.status || 'Active', Validators.required],
      documentReferenceSid: [data?.documentReferenceSid || null],
    });
  }


  addDocumentRow(data?: any) {
    this.documentReferences.push(this.createDocumentFormGroup(data));
  }


  removeDocumentRow(index: number) {
    if (this.documentReferences.length > 1) {
      this.documentReferences.removeAt(index);
    } else {
      this.appSettingService.showWarning(
        'At least one document reference is required',
      );
    }
  }


  loadDocumentData() {
    if (!this.docRefId) return;


    this.loading = true;
    this.http
      .get<any>(`doc-reference/fetch/${this.docRefId}`)
      .subscribe({
        next: (response) => {
          if (
            (response.status === true || response.Status === true) &&
            response.data
          ) {
            this.docRefData = response.data;
            this.populateForm(response.data);
            this.docRefForm.markAsPristine();
            this.docRefForm.markAsUntouched();
          } else {
            this.appSettingService.showError(
              response.message || 'Failed to load document data',
            );
          }
          this.loading = false;
        },
        error: () => {
          this.appSettingService.showError('Error loading document data');
          this.loading = false;
        },
      });
  }


  populateForm(data: any) {
    this.clearFormArray();


    let docDate = null;
    if (data.RefDocumentDate) {
      const d = new Date(data.RefDocumentDate);
      docDate = {
        year: d.getFullYear(),
        month: d.getMonth() + 1,
        day: d.getDate(),
      };
    }


    const statusChar = (data.Status || 'A').toUpperCase();
    const statusValue = statusChar === 'I' ? 'Inactive' : 'Active';


    const formData = {
      refDocumentNo: data.RefDocumentNo,
      documentDate: docDate,
      remarks: data.Remarks || '',
      isPublic: data.Public === 'Y',
      status: statusValue,
      documentReferenceSid: data.RefDocumentSid,
    };


    this.addDocumentRow(formData);
  }


 

  hasAnyDropdownPermission(): boolean {
    const dropdownButtons = [
      'Edoc',
      'Terms and Condition',
      'Authority',
      'Email',
    ];
    return dropdownButtons.some((btn) =>
      this.permissions.includes(btn),
    );
  }


  private preventDuplicateSubmit(): boolean {
    if (this.isSubmitting) {
      this.appSettingService.showWarning(
        'Please wait, previous save is still processing',
      );
      return false;
    }
    this.isSubmitting = true;
    setTimeout(() => {
      this.isSubmitting = false;
    }, 3000);
    return true;
  }


  private toStatusChar(status: string): 'A' | 'I' {
    if (!status) return 'A';
    if (status === 'Inactive' || status === 'I') return 'I';
    return 'A';
  }


  onSubmit() {
    if (!this.preventDuplicateSubmit()) return;


    if (this.docRefForm.invalid) {
      this.markFormGroupTouched(this.docRefForm);
      this.appSettingService.showWarning(
        'Please fill all required fields correctly',
      );
      this.isSubmitting = false;
      return;
    }


    if (this.documentReferences.length === 0) {
      this.appSettingService.showError(
        'Please add at least one document reference',
      );
      this.isSubmitting = false;
      return;
    }


    const validationErrors: string[] = [];
    this.documentReferences.controls.forEach((control, index) => {
      const value = control.value;
      if (!value.refDocumentNo || value.refDocumentNo.trim() === '') {
        validationErrors.push(
          `Reference ${index + 1}: Document No is required`,
        );
      }
      if (
        value.refDocumentNo &&
        value.refDocumentNo.trim().length > 20
      ) {
        validationErrors.push(
          `Reference ${index + 1}: Document No cannot exceed 20 characters (${value.refDocumentNo.trim().length} provided)`,
        );
      }
      if (!value.documentDate) {
        validationErrors.push(
          `Reference ${index + 1}: Document Date is required`,
        );
      }
      if (!value.status) {
        validationErrors.push(
          `Reference ${index + 1}: Status is required`,
        );
      }
    });


    if (validationErrors.length) {
      this.appSettingService.showError(
        `Validation errors:\n${validationErrors.join('\n')}`,
      );
      this.isSubmitting = false;
      return;
    }


    const currentUserEmail =
      this.appSettingService.userSettingSource.value['userEmail'];


    try {
      const documentReferencesData = this.documentReferences
        .getRawValue()
        .map((doc: any) => {
          const refDocNo = (doc.refDocumentNo || '').trim();
          const dateFormatted = this.formatDate(doc.documentDate);
          const remarksVal = (doc.remarks || '').trim();


          let publicVal: boolean;
          if (typeof doc.isPublic === 'boolean') {
            publicVal = doc.isPublic;
          } else if (typeof doc.isPublic === 'string') {
            const v = doc.isPublic.toLowerCase();
            publicVal = ['true', '1', 'y', 'yes'].includes(v);
          } else {
            publicVal = !!doc.isPublic;
          }


          const statusChar = this.toStatusChar(doc.status);


          if (!refDocNo) {
            throw new Error(
              'Document No cannot be empty after trimming',
            );
          }
          if (refDocNo.length > 20) {
            throw new Error(
              `Document No cannot exceed 20 characters (${refDocNo.length} provided)`,
            );
          }
          if (!dateFormatted) {
            throw new Error('Document Date is required');
          }


          return {
            refDocumentNo: refDocNo,
            documentDate: dateFormatted,
            remarks: remarksVal,
            isPublic: publicVal,
            status: statusChar,
            ...(doc.documentReferenceSid
              ? { documentReferenceSid: doc.documentReferenceSid }
              : {}),
          };
        });


      const payload = {
        CompanyMasterSid:
          this.currentCompany?.CompanyMasterSid,
        BranchMasterSid:
          this.currentBranch?.BranchMasterSid,
        MenuMasterSid: this.MenuMasterSid, 
        DocumentSid: this.isEditMode ? this.docRefId : 0,
        documentReferences: documentReferencesData,
        ...(this.isEditMode
          ? { updatedBy: currentUserEmail }
          : { createdBy: currentUserEmail }),
      };


      if (
        !payload.CompanyMasterSid ||
        !payload.BranchMasterSid ||
        !payload.MenuMasterSid
      ) {
        this.appSettingService.showError(
          'Missing company, branch or menu information',
        );
        this.isSubmitting = false;
        return;
      }


      this.btnDisable = true;


      this.http
        .post<any>('doc-reference/create', payload)
        .subscribe({
          next: (response) => {
            const successStatus =
              response?.Status === true || response?.status === true;
            const hasData =
              response?.data &&
              (!Array.isArray(response.data) ||
                response.data.length > 0);


            if (successStatus && hasData) {
              this.appSettingService.showSuccess(
                this.isEditMode
                  ? 'Document Reference updated successfully!'
                  : 'Document Reference created successfully!',
              );
              setTimeout(() => {
                this.router.navigate([
                  '/operation/doc-reference/list',
                ]);
              }, 1000);
            } else {
              const errorMsg =
                response?.message ||
                'Save operation failed. Please check all fields and try again.';
              this.appSettingService.showError(errorMsg);
              this.btnDisable = false;
              this.isSubmitting = false;
            }
          },
          error: (error) => {
            let errorMessage = 'Error saving Document Reference';
            if (error.error?.message) {
              errorMessage = error.error.message;
            } else if (error.message) {
              errorMessage = error.message;
            }
            this.appSettingService.showError(errorMessage);
            this.btnDisable = false;
            this.isSubmitting = false;
          },
        });
    } catch (err: any) {
      this.appSettingService.showError(
        `Error preparing data: ${err.message}`,
      );
      this.btnDisable = false;
      this.isSubmitting = false;
    }
  }


  resetForm() {
    if (this.isEditMode && this.docRefId) {
      this.loadDocumentData();
    } else {
      this.clearFormArray();
      this.addDocumentRow();
    }
  }


  clearFormArray() {
    while (this.documentReferences.length !== 0) {
      this.documentReferences.removeAt(0);
    }
  }


  goBack() {
    history.back();
  }


  private markFormGroupTouched(formGroup: FormGroup) {
    Object.values(formGroup.controls).forEach((control) => {
      control.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      } else if (control instanceof FormArray) {
        control.controls.forEach((c) =>
          this.markFormGroupTouched(c as FormGroup),
        );
      }
    });
  }


  private formatDate(dateValue: any): string | null {
    if (!dateValue) return null;


    if (dateValue.year && dateValue.month && dateValue.day) {
      const date = new Date(
        dateValue.year,
        dateValue.month - 1,
        dateValue.day,
      );
      return this.datePipe.transform(date, 'yyyy-MM-dd');
    }


    return this.datePipe.transform(dateValue, 'yyyy-MM-dd');
  }

}

