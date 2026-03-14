import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
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
    console.log(formValue);
    const payload = {
      CompanyMasterSid : currentCompanyMasterSid,
      BranchMasterSid : currentBranchMasterSid,
      MenuMasterSid: this.MenuMasterSid,
      createdBy: currentUserEmail,
      TandC: formValue.newTerm,
      IsDefaut: formValue.IsDefaut ? 'S' : 'N',
      DocumentSid: this.DocumentSid,
      ...(this.DepartmentMasterSid != null && { DepartmentMasterSid: this.DepartmentMasterSid }),
      ...(this.POL && { POL: this.POL }),
      ...(this.POD && { POD: this.POD }),
      ...(this.Carrier != null && { Carrier: this.Carrier }),
    };

    try {
      const resp: any = await this.masterService.createTandCTransaction(payload).toPromise();
      if (resp.status) {
        this.appSettingService.showSuccess('New Term is successfully created');
        this.termsUpdated.emit();
        this.terms.push(
          {
            TandC: this.addForm.get('newTerm').value,
            IsDefaut: this.addForm.get('IsDefaut').value ? 'S' : 'N'
          }
        )
        this.showAddRow = !this.showAddRow;
        this.addForm.reset({ newTerm: '', IsDefaut: false });
      } else {
        this.appSettingService.showError('Error Creating New Terms');
      }
    } catch (error) {
      console.error('Error Creating New Terms', error);
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

  this.masterService.getTandCByNCondition(payload).subscribe(
    (resp: any) => {

      if (resp.status) {

        if (resp.data?.length) {
          const newTerms = resp.data.filter(
  (newItem: any) =>
    !this.terms.some(
      (existing: any) => existing.TandCTransactionSid === newItem.TandCTransactionSid
    )
);

this.terms = [...this.terms, ...newTerms];
          this.showEmptyTemplate = false;
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
    TandC: item.TandC,
    IsDefaut: item.IsDefaut === 'S'
  });

}

cancelEdit() {
  this.editIndex = null;
  this.editForm.reset();
}

updateTerm(item: any, index: number) {

  if (this.editForm.invalid) {
    this.editForm.markAllAsTouched();
    return;
  }

  const formValue = this.editForm.value;

  const payload = {
    TandCTransactionSid: item.TandCTransactionSid,
    Terms: formValue.TandC,
    IsDefaut: formValue.IsDefaut ? 'S' : 'N',
    DocumentSid: this.DocumentSid
  };

  this.masterService.updateTerms(item.TandCTransactionSid, payload).subscribe(
    (resp: any) => {

      if (resp.status) {

        this.appSettingService.showSuccess('Term updated successfully');

        this.terms[index].TandC = formValue.TandC;
        this.terms[index].IsDefaut = formValue.IsDefaut ? 'S' : 'N';

        this.cancelEdit();

      } else {
        this.appSettingService.showError('Error updating term');
      }

    },
    (error) => {
      console.error(error);
      this.appSettingService.showError('Error updating term');
    }
  );
}
}