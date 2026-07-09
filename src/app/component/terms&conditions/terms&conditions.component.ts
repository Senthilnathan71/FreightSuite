import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { forkJoin } from 'rxjs';
import { NgbActiveModal, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule, ReactiveFormsModule, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FeatherModule } from 'angular-feather';
import { TogglerComponent } from '../simple-toggler/toggle.component';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { MasterService } from 'src/app/modules/master/master.service';
import { PreventMultiClickDirective } from 'src/app/core/Directives/prevent-multi-click.directive';

@Component({
  standalone: true,
  imports: [NgbModalModule, FormsModule, CommonModule, FeatherModule, ReactiveFormsModule, TogglerComponent,PreventMultiClickDirective],
  selector: 'dofi-terms-and-conditions',
  templateUrl: './termsAndConditions.component.html'
})
export class TermsAndConditionsComponent implements OnInit {
  @Input() terms: any[] = [];
  @Input() MenuMasterSid: number;
  @Input() DocumentSid: number;
  @Input() DepartmentMasterSid?: number;
  @Input() POL?: string;
  @Input() POD?: string;
  @Input() Carrier?: number;
  @Input() loadAllOnGet: boolean = false;
  @Output() termsUpdated = new EventEmitter<void>(); // Event to notify parent
  isAgreed: boolean = false;
  toggleBtn: boolean;
  showAddRow: boolean = false;
  addForm: FormGroup;
  showEmptyTemplate : boolean;
  userData : any;
  currentCompany : any;
  currentBranch: any;
  editIndex: number | null = null;
editForm: FormGroup;

  /** Terms.Terms is VarChar(1000) — longer text is split across multiple terms. */
  private readonly MAX_TERM_LENGTH = 1000;

  constructor(
    private activeModal: NgbActiveModal,
    private fb: FormBuilder,
    private appSettingService: AppSettingsService,
    private masterService: MasterService
  ) {
    this.addForm = this.fb.group({
      newTerm: ['', [Validators.required]],
      IsDefaut: [false]
    });
    this.editForm = this.fb.group({
  TandC: ['', Validators.required],
  IsDefaut: [false]
});
  }

  ngOnInit() {
    const userProfile = this.appSettingService.getDecryptedUserProfile();
    if (userProfile) {
      this.userData = userProfile;
    }
    const storedCompany = localStorage.getItem('selected-company');
    this.currentCompany = storedCompany ? this.appSettingService.decrypt(storedCompany) : null;
    const storedBranch = localStorage.getItem('selected-branch');
    this.currentBranch = storedBranch ? this.appSettingService.decrypt(storedBranch) : null;
    this.showEmptyTemplate = this.terms.length === 0 && !this.showAddRow;
  }

  onCheckboxChange() {}

  toggleAddRow() {
    this.showAddRow = !this.showAddRow;
    if (!this.showAddRow) {
      this.addForm.reset({ newTerm: '', IsDefaut: false });
    }
    this.showEmptyTemplate = this.terms.length === 0 && !this.showAddRow;
  }

  /**
   * Breaks text into chunks of at most MAX_TERM_LENGTH characters, cutting at the
   * last full stop inside the limit so each chunk stays a complete sentence. Falls
   * back to the last space, then to a hard cut, when no full stop is available.
   */
  private splitTerm(text: string): string[] {
    const chunks: string[] = [];
    let remaining = (text ?? '').trim();

    while (remaining.length > this.MAX_TERM_LENGTH) {
      const window = remaining.slice(0, this.MAX_TERM_LENGTH);
      const fullStop = window.lastIndexOf('.');
      const space = window.lastIndexOf(' ');

      let cutEnd: number;
      if (fullStop > 0) {
        cutEnd = fullStop + 1;
      } else if (space > 0) {
        cutEnd = space;
      } else {
        cutEnd = this.MAX_TERM_LENGTH;
      }

      const chunk = remaining.slice(0, cutEnd).trim();
      if (chunk) {
        chunks.push(chunk);
      }
      remaining = remaining.slice(cutEnd).trim();
    }

    if (remaining) {
      chunks.push(remaining);
    }
    return chunks;
  }

  async addNewTerm() {
    if (this.addForm.invalid) {
      this.addForm.markAllAsTouched();
      this.addForm.updateValueAndValidity();
      this.appSettingService.showWarning('Please fill all the required fields');
      return;
    }
    const currentUserEmail = this.appSettingService.userSettingSource.value['userEmail'];
    let currentCompanyMasterSid = this.currentCompany?.CompanyMasterSid;
    let currentBranchMasterSid = this.currentBranch?.BranchMasterSid;
    const formValue = this.addForm.value;

    const chunks = this.splitTerm(formValue.newTerm);
    if (!chunks.length) {
      this.appSettingService.showWarning('Please fill all the required fields');
      return;
    }

    const payload = {
      CompanyMasterSid : currentCompanyMasterSid,
      BranchMasterSid : currentBranchMasterSid,
      MenuMasterSid: this.MenuMasterSid,
      createdBy: currentUserEmail,
      DocumentSid: this.DocumentSid,
    };

    const created: any[] = [];
    try {
      for (const chunk of chunks) {
        const resp: any = await this.masterService
          .createTandCTransaction({ ...payload, TandC: chunk })
          .toPromise();

        if (!resp?.status) {
          throw new Error(resp?.message || 'Error Creating New Terms');
        }

        created.push({
          TandCTransactionSid: resp?.data?.TandCTransactionSid,
          TandC: chunk,
          Terms: chunk,
          DocumentSid: this.DocumentSid
        });
      }

      this.appSettingService.showSuccess(
        created.length > 1
          ? `Term exceeded ${this.MAX_TERM_LENGTH} characters and was saved as ${created.length} terms`
          : 'New Term is successfully created'
      );
      this.termsUpdated.emit();
      this.terms.push(...created);
      this.showAddRow = false;
      this.addForm.reset({ newTerm: '', IsDefaut: false });
      this.showEmptyTemplate = this.terms.length === 0 && !this.showAddRow;
    } catch (error) {
      console.error('Error Creating New Terms', error);
      // Rows saved before the failure stay in the list so they aren't silently lost.
      if (created.length) {
        this.termsUpdated.emit();
        this.terms.push(...created);
      }
      this.appSettingService.showError('Error Creating New Terms');
    }
  }

  closeModal() {
    this.activeModal.close(false);
  }

  getTermsAndConditions() {

  const payload = {
    MenuMasterSid: this.MenuMasterSid,
    BranchMasterSid: this.currentBranch?.BranchMasterSid,
    DepartmentMasterSid: this.DepartmentMasterSid,
    POL: this.POL,
    POD: this.POD,
    Carrier: this.Carrier,
    DocumentSid: this.DocumentSid
  };

  const getTermText = (item: any): string =>
    (item?.Terms || item?.TandC || '').trim().toLowerCase();

  const isSameTerm = (a: any, b: any): boolean =>
    (
      a?.TandCTransactionSid &&
      b?.TandCTransactionSid &&
      a.TandCTransactionSid === b.TandCTransactionSid
    ) ||
    (
      getTermText(a) === getTermText(b) &&
      (a?.DocumentSid ?? this.DocumentSid ?? null) ===
      (b?.DocumentSid ?? this.DocumentSid ?? null)
    );

  if (this.loadAllOnGet) {
    forkJoin({
      defaults: this.masterService.getTandCByCondition(payload),
      nonDefaults: this.masterService.getTandCByNCondition(payload)
    }).subscribe(
      (resp: any) => {
        const defaultData = resp?.defaults?.status ? (resp.defaults.data || []) : [];
        const nonDefaultData = resp?.nonDefaults?.status ? (resp.nonDefaults.data || []) : [];
        const combined = [...defaultData, ...nonDefaultData];

        if (!combined.length) {
          this.appSettingService.showWarning('No Terms Found');
          this.showEmptyTemplate = this.terms.length === 0 && !this.showAddRow;
          return;
        }

        const newTerms = combined.filter(
          (newItem: any) => !this.terms.some((existing: any) => isSameTerm(existing, newItem))
        );

        this.terms = [...this.terms, ...newTerms];
        this.showEmptyTemplate = this.terms.length === 0 && !this.showAddRow;

        if (!newTerms.length) {
          this.appSettingService.showWarning('Terms already added');
        }
      },
      (error) => {
        console.error(error);
        this.appSettingService.showError('Error loading Terms');
      }
    );
    return;
  }

  this.masterService.getTandCByNCondition(payload).subscribe(
    (resp: any) => {

      if (resp.status) {

        if (resp.data?.length) {
            const newTerms = resp.data.filter(
            (newItem: any) => !this.terms.some((existing: any) => isSameTerm(existing, newItem))
          );;

            this.terms = [...this.terms, ...newTerms];
            this.showEmptyTemplate = this.terms.length === 0 && !this.showAddRow;

            if (!newTerms.length) {
              this.appSettingService.showWarning('Terms already added');
            }
             } else {
            this.appSettingService.showWarning('No Non Default Terms Found');
          }
      } else {
        this.appSettingService.showError('Error loading Non Default Terms');
      }

    },
    (error) => {
      console.error(error);
      this.appSettingService.showError('Error loading Non Default Terms');
    }
  );
}

deleteTerm(item: any, index: number) {

  if (!item?.TandCTransactionSid) {
    this.terms.splice(index, 1);
    return;
  }

  this.masterService.deleteTerms(
    item.TandCTransactionSid,
    { DocumentSid: this.DocumentSid }
  ).subscribe(
    (resp: any) => {

      if (resp.status) {

        this.appSettingService.showSuccess('Term deleted successfully');

        this.terms.splice(index, 1);

      } else {
        this.appSettingService.showError('Error deleting term');
      }

    },
    (error) => {
      console.error('Delete error', error);
      this.appSettingService.showError('Error deleting term');
    }
  );
}



editTerm(item: any, index: number) {
  this.editIndex = index;

  this.editForm.patchValue({
    TandC: item?.Terms || item?.TandC || '',
    IsDefaut: item?.IsDefaut === 'S'
  });
}

cancelEdit() {
  this.editIndex = null;
  this.editForm.reset();
}

async updateTerm(item: any, index: number) {

  if (this.editForm.invalid) {
    this.editForm.markAllAsTouched();
    return;
  }

  const formValue = this.editForm.value;

  const chunks = this.splitTerm(formValue.TandC);
  if (!chunks.length) {
    this.editForm.markAllAsTouched();
    return;
  }

  const [firstChunk, ...overflowChunks] = chunks;

  const payload = {
    TandCTransactionSid: item.TandCTransactionSid,
    Terms: firstChunk,
    DocumentSid: this.DocumentSid
  };

  try {
    const resp: any = await this.masterService
      .updateTerms(item.TandCTransactionSid, payload)
      .toPromise();

    if (!resp?.status) {
      throw new Error(resp?.message || 'Error updating term');
    }

    this.terms[index].TandC = firstChunk;
    this.terms[index].Terms = firstChunk;
    this.terms[index].IsDefaut = formValue.IsDefaut ? 'S' : 'N';

    // Anything past the column limit becomes new terms right after this one.
    const createdBy = this.appSettingService.userSettingSource.value['userEmail'];
    const basePayload = {
      CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
      BranchMasterSid: this.currentBranch?.BranchMasterSid,
      MenuMasterSid: this.MenuMasterSid,
      createdBy,
      DocumentSid: this.DocumentSid
    };

    let insertAt = index;
    for (const chunk of overflowChunks) {
      const createResp: any = await this.masterService
        .createTandCTransaction({ ...basePayload, TandC: chunk })
        .toPromise();

      if (!createResp?.status) {
        throw new Error(createResp?.message || 'Error updating term');
      }

      this.terms.splice(++insertAt, 0, {
        TandCTransactionSid: createResp?.data?.TandCTransactionSid,
        TandC: chunk,
        Terms: chunk,
        DocumentSid: this.DocumentSid
      });
    }

    if (overflowChunks.length) {
      this.termsUpdated.emit();
      this.appSettingService.showSuccess(
        `Term exceeded ${this.MAX_TERM_LENGTH} characters and was split into ${chunks.length} terms`
      );
    } else {
      this.appSettingService.showSuccess('Term updated successfully');
    }

    this.cancelEdit();

  } catch (error) {
    console.error(error);
    this.appSettingService.showError('Error updating term');
  }
}
}
