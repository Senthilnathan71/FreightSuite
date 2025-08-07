import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  FormsModule,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { NgbModal, NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { MasterService } from '../../master.service';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { TermsAndConditionsComponent } from 'src/app/component/terms&conditions/terms&conditions.component';
import { EmailEntryComponent } from 'src/app/modules/settings/email/email-entry/email-entry.component';
import { AuthorityEntryComponent } from '../../authority/authority-entry/authority-entry.component';
import { EdocComponent } from 'src/app/modules/settings/edoc/edoc/edoc.component';
@Component({
  selector: 'app-documnet-generation-entry',
  standalone: true,
  imports: [
    RouterModule,
    NgSelectModule,
    FormsModule,
    CommonModule,
    ReactiveFormsModule,
    NgbPaginationModule,
  ],
  templateUrl: './documnet-generation-entry.component.html',
  styleUrl: './documnet-generation-entry.component.scss',
})
export class DocumnetGenerationEntryComponent {
  constructor(
    private router: Router,
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private masterService: MasterService,
    private appSettingService: AppSettingsService,
    private modalService: NgbModal
  ) {}

  DocumentGenerationForm: FormGroup;
  isEditMode: boolean = false;
  documentId: number;
  documentList: any[] = [];
  DocumentNumberGenerationMasterSid: number;
  documentData: any;

  // Pagination
  page = 1;
  pageSize = 15;
  totalLengthOfCollection = 0;

  currentMenuId: number;
  TandCList: any;
  ngOnInit(): void {
    this.initialForm();

    this.route.paramMap.subscribe((params) => {
      const id = +params.get('id');
      if (id) {
        this.documentId = id;
        this.isEditMode = true;
        // this.loadDocumentById(id);
      }
    });
  }

  // loadDocumentById(id: number) {
  //   this.masterService.getDocumentGenerationById(id).subscribe(
  //     (resp: any) => {
  //       if (resp.status) {
  //         const data = resp.data;
  //         this.DocumentGenerationForm.patchValue({
  //           ...data,
  //           Status: data.Status === 'A' ? 'Active' : 'Block',
  //           CompanyFlagReq: data.CompanyFlagReq === 'Y',
  //           BranchFlagReq: data.BranchFlagReq === 'Y',
  //           YearFlagReq: data.YearFlagReq === 'Y',
  //           MonthFlagReq: data.MonthFlagReq === 'Y',
  //         });
  //       }
  //     },
  //     (err) => {
  //       console.error('Failed to load document', err);
  //     }
  //   );
  // }

  onSubmit() {
    if (this.DocumentGenerationForm.invalid) {
      this.DocumentGenerationForm.markAllAsTouched();
      return;
    }

    // const form = this.DocumentGenerationForm.getRawValue();
    // const payload = {
    //   ...form,
    //   CompanyFlagReq: form.CompanyFlagReq ? 'Y' : 'N',
    //   BranchFlagReq: form.BranchFlagReq ? 'Y' : 'N',
    //   YearFlagReq: form.YearFlagReq ? 'Y' : 'N',
    //   MonthFlagReq: form.MonthFlagReq ? 'Y' : 'N',
    //   Status: form.Status === 'Active' ? 'A' : 'B',
    // };

    // if (this.isEditMode) {
    //   this.masterService.updateDocumentGenerationById(this.documentId, payload).subscribe(
    //     (resp: any) => {
    //       if (resp.status) {
    //         alert('Document updated successfully');
    //         this.router.navigate(['master/document-number-generation/list']);
    //       } else {
    //         alert('Failed to update');
    //       }
    //     }
    //   );
    // } else {
    //   this.masterService.createDocumentGeneration(payload).subscribe(
    //     (resp: any) => {
    //       if (resp.status) {
    //         alert('Document created successfully');
    //         this.router.navigate(['master/document-number-generation/list']);
    //       } else {
    //         alert('Failed to create');
    //       }
    //     }
    //   );
    // }
  }

  initialForm() {
    this.DocumentGenerationForm = this.fb.group({
      Company: [''],
      Branch: [''],
      Seperator: ['', [Validators.required]],
      SerialNoLength: ['', [Validators.required]],
      Type: ['', [Validators.required]],
      ResetValue: ['', [Validators.required]],
      Prefix: [''],
      Suffix: [''],
      StartingNo: ['', [Validators.required]],
      Status: ['Active'],
      SampleNumber: [''],
      CompanyFlagReq: [false],
      BranchFlagReq: [false],
      YearFlagReq: [false],
      MonthFlagReq: [false],
    });
  }
  navigateToBack() {
    this.router.navigate(['master/document-number-generation/list']);
  }

  modeOfStatus = [
    { id: 1, name: 'Active' },
    { id: 2, name: 'Block' },
  ];

  modeOfTypes = [
    { id: 1, name: 'ASN' },
    { id: 2, name: 'GRN' },
    { id: 3, name: 'GIO' },
    { id: 4, name: 'GDN' },
    { id: 5, name: 'STK' },
    { id: 6, name: 'ADJ' },
    { id: 7, name: 'RWK' },
  ];

  modeOfResetValues = [
    { id: 1, name: 'Monthwise' },
    { id: 2, name: 'Yearwise' },
    { id: 3, name: 'None' },
  ];

  modeOfSuffix = [
    { id: 1, name: 'Add' },
    { id: 2, name: 'Close' },
  ];

  resetForm() {
    this.DocumentGenerationForm.reset({
      Company: '',
      Branch: '',
      Seperator: '',
      SerialNoLength: '',
      Type: '',
      ResetValue: '',
      Prefix: '',
      Suffix: '',
      StartingNo: '',
      Status: 'Active',
    });
  }

  // Terms and conditions
  openTandC() {
    this.currentMenuId = Number(localStorage.getItem('currentMenuId'));
    const payload = { MenuMasterSid: this.currentMenuId };
    this.masterService.getTandCByCondition(payload).subscribe(
      (resp: any) => {
        if (resp.status) {
          this.TandCList = resp.data;
          const modalRef = this.modalService.open(TermsAndConditionsComponent, {
            size: 'lg',
            backdrop: 'static',
            centered: true,
          });
          modalRef.componentInstance.terms = this.TandCList;
          modalRef.componentInstance.MenuMasterSid = this.currentMenuId;
          modalRef.componentInstance.DocumentSid =
            this.DocumentNumberGenerationMasterSid;
        } else {
          this.appSettingService.showError(
            'Error loading Terms and Conditions'
          );
        }
      },
      (error) => {
        this.appSettingService.showError(
          'Error loading Terms and Conditions',
          error
        );
      }
    );
  }

  // Email
  openEmail() {
    if (!this.documentData) return;
    const modalRef = this.modalService.open(EmailEntryComponent, {
      size: 'lg',
      centered: true,
      backdrop: 'static',
    });
  }

  // Authority
  openAuthority() {
    if (!this.documentData) return;
    const modalRef = this.modalService.open(AuthorityEntryComponent, {
      size: 'lg',
      centered: true,
      backdrop: 'static',
    });
    modalRef.componentInstance.item = this.documentData;
    modalRef.componentInstance.idLabel = 'Document Type Id';
    modalRef.componentInstance.idValue =
      this.documentData?.DocumentNumberGenerationMasterSid;
  }

  // edco

  openEDoc() {
    if (!this.documentData) return;
    const modalRef = this.modalService.open(EdocComponent, {
      size: 'lg',
      centered: true,
      backdrop: 'static',
    });
    modalRef.componentInstance.item = this.documentData;
    modalRef.componentInstance.idLabel = 'Document Type Id';
    modalRef.componentInstance.idValue =
      this.documentData?.DocumentNumberGenerationMasterSid;
  }
}
