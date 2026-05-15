import { CommonModule, DatePipe } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import {
  NgbDatepickerModule,
  NgbDropdownModule,
  NgbActiveModal,
  NgbDateAdapter,
  NgbDateParserFormatter,
} from '@ng-bootstrap/ng-bootstrap';
import { FeatherModule } from 'angular-feather';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { MasterService } from '../../master/master.service';
import { CustomDateAdapter } from 'src/app/component/datepicker/custom-date-adapter';
import { CustomDateParserFormatter } from 'src/app/component/datepicker/custom-date-parser';
import { TextWithNumbersDirective } from 'src/app/core/Directives/textWithNumbers';
import { TogglerComponent } from 'src/app/component/simple-toggler/toggle.component';
import { ElementStateGuardDirective } from 'src/app/core/Directives/element-state-guard.directive';

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
    TogglerComponent,
    ElementStateGuardDirective
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
  @Input() docRef: any[] = [];
  @Input() MenuMasterSid: number;
  @Input() DocumentSid: number;
  @Input() CompanyMasterSid: number;
  @Input() BranchMasterSid: number;
  @Output() docRefUpdated = new EventEmitter<void>();

  showAddRow = false;
  showEmptyTemplate: boolean;
  userData: any;
  currentCompany: any;
  currentBranch: any;
  editIndex: number | null = null;

  addForm: FormGroup;
  editForm: FormGroup;

  statusList = [
    { id: 'A', name: 'Active' },
    { id: 'S', name: 'Suspended' }
  ];

  constructor(
    private fb: FormBuilder,
    private appSettingService: AppSettingsService,
    private masterService: MasterService,
    private activeModal: NgbActiveModal,
  ) {
    this.addForm = this.fb.group({
      RefDocumentNo: ['', Validators.required],
      DocumentDate: [null, Validators.required],
      Remarks: [''],
      Public: [false],
      Status: ['A', Validators.required]
    });

    this.editForm = this.fb.group({
      RefDocumentNo: ['', Validators.required],
      DocumentDate: [null, Validators.required],
      Remarks: [''],
      Public: [false],
      Status: ['A', Validators.required]
    });
  }

  ngOnInit(): void {
    const userProfile = this.appSettingService.getDecryptedUserProfile();
    if (userProfile) {
      this.userData = userProfile;
    }

    const storedCompany = localStorage.getItem('selected-company');
    this.currentCompany = storedCompany ? this.appSettingService.decrypt(storedCompany) : null;

    const storedBranch = localStorage.getItem('selected-branch');
    this.currentBranch = storedBranch ? this.appSettingService.decrypt(storedBranch) : null;

    this.getDocReference();
    this.showEmptyTemplate = this.docRef.length === 0 && !this.showAddRow;
  }

  toggleAddRow() {
    this.showAddRow = !this.showAddRow;

    if (!this.showAddRow) {
      this.addForm.reset({
        RefDocumentNo: '',
        DocumentDate: null,
        Remarks: '',
        Public: false,
        Status: 'A'
      });
    }

    this.editIndex = null;
    this.showEmptyTemplate = this.docRef.length === 0 && !this.showAddRow;
  }

  async addNewDocRef() {
    if (this.addForm.invalid) {
      this.addForm.markAllAsTouched();
      this.addForm.updateValueAndValidity();
      this.appSettingService.showWarning('Please fill all the required fields');
      return;
    }

    const currentUserEmail = this.appSettingService.userSettingSource.value['userEmail'];
    const formValue = this.addForm.value;

    const payload = {
      CompanyMasterSid: this.CompanyMasterSid,
      BranchMasterSid: this.BranchMasterSid,
      MenuMasterSid: this.MenuMasterSid,
      DocumentSid: this.DocumentSid,
      RefDocumentNo: formValue.RefDocumentNo,
      RefDocumentDate: formValue.DocumentDate ? new Date(formValue.DocumentDate) : null,
      Remarks: formValue.Remarks,
      Public: formValue.Public ? 'Y' : 'N',
      Status: formValue.Status,
      CreatedBy: currentUserEmail,
    };

    try {
      const resp: any = await this.masterService.createDocReference(payload).toPromise();

      if (resp.status) {
        this.appSettingService.showSuccess('New Doc Reference is successfully created');
        this.getDocReference();
        this.showAddRow = false;
        this.addForm.reset({
          RefDocumentNo: '',
          DocumentDate: null,
          Remarks: '',
          Public: false,
          Status: 'A'
        });
      } else {
        this.appSettingService.showError('Error Creating New Doc Reference');
      }
    } catch (error) {
      console.error('Error Creating New Doc Reference', error);
      this.appSettingService.showError('Error Creating New Doc Reference');
    }
  }

  closeModal() {
    this.activeModal.close(false);
  }

  getDocReference() {
    const payload = {
      MenuMasterSid: this.MenuMasterSid,
      DocumentSid: this.DocumentSid,
      CompanyMasterSid: this.CompanyMasterSid,
      BranchMasterSid: this.BranchMasterSid,
      Status: 'A'
    };

    this.masterService.getDocReference(payload).subscribe(
      (resp: any) => {
        if (resp.status) {
          this.docRef = resp.data || [];
          this.showEmptyTemplate = this.docRef.length === 0 && !this.showAddRow;
        } else {
          this.appSettingService.showError('Error loading Doc Reference');
        }
      },
      (error) => {
        console.error('Error loading Doc Reference', error);
        this.appSettingService.showError('Error loading Doc Reference');
      }
    );
  }

  deleteDocRef(item: any, index: number) {
    if (!item?.RefDocumentSid) {
      this.docRef.splice(index, 1);
      this.showEmptyTemplate = this.docRef.length === 0 && !this.showAddRow;
      return;
    }

    this.masterService.deleteDocReference(item.RefDocumentSid).subscribe(
      (resp: any) => {
        if (resp.status) {
          this.appSettingService.showSuccess('Doc Reference deleted successfully');
          this.docRef.splice(index, 1);
          this.showEmptyTemplate = this.docRef.length === 0 && !this.showAddRow;
        } else {
          this.appSettingService.showError('Error deleting Doc Reference');
        }
      },
      (error) => {
        console.error('Error deleting Doc Reference', error);
        this.appSettingService.showError('Error deleting Doc Reference');
      }
    );
  }

  editDocRef(item: any, index: number) {
    this.editIndex = index;
    this.showAddRow = false;

    this.editForm.patchValue({
      RefDocumentNo: item.RefDocumentNo || '',
      DocumentDate: item.RefDocumentDate ? new Date(item.RefDocumentDate) : null,
      Remarks: item.Remarks || '',
      Public: item.Public === 'Y',
      Status: item.Status || 'A'
    });
  }

  cancelEdit() {
    this.editIndex = null;
    this.editForm.reset({
      RefDocumentNo: '',
      DocumentDate: null,
      Remarks: '',
      Public: false,
      Status: 'A'
    });
  }

  updateDocRef(item: any, index: number) {
    if (this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      return;
    }

    const currentUserEmail = this.appSettingService.userSettingSource.value['userEmail'];
    const formValue = this.editForm.value;

    const payload = {
      RefDocumentSid: item.RefDocumentSid,
      RefDocumentNo: formValue.RefDocumentNo,
      RefDocumentDate: formValue.DocumentDate ? new Date(formValue.DocumentDate) : null,
      Remarks: formValue.Remarks,
      Public: formValue.Public ? 'Y' : 'N',
      Status: formValue.Status,
      UpdatedBy: currentUserEmail,
    };

    this.masterService.updateDocReferenceById(item.RefDocumentSid, payload).subscribe(
      (resp: any) => {
        if (resp.status) {
          this.appSettingService.showSuccess('Doc Reference updated successfully');

          this.docRef[index].RefDocumentNo = formValue.RefDocumentNo;
          this.docRef[index].RefDocumentDate = formValue.DocumentDate ? new Date(formValue.DocumentDate) : null;
          this.docRef[index].Remarks = formValue.Remarks;
          this.docRef[index].Public = formValue.Public ? 'Y' : 'N';
          this.docRef[index].Status = formValue.Status;

          this.cancelEdit();
        } else {
          this.appSettingService.showError('Error updating Doc Reference');
        }
      },
      (error) => {
        console.error('Error updating Doc Reference', error);
        this.appSettingService.showError('Error updating Doc Reference');
      }
    );
  }
}