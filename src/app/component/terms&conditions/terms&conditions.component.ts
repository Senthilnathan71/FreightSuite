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
  @Output() termsUpdated = new EventEmitter<void>(); // Event to notify parent
  isAgreed: boolean = false;
  toggleBtn: boolean;
  showAddRow: boolean = false;
  addForm: FormGroup;
  showEmptyTemplate : boolean;
  userData : any;
  currentCompany : any;
  currentBranch: any;

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
      IsDefaut: formValue.IsDefaut ? 'A' : 'S',
      DocumentSid: this.DocumentSid,
    };

    try {
      const resp: any = await this.masterService.createTandCTransaction(payload).toPromise();
      if (resp.status) {
        this.appSettingService.showSuccess('New Term is successfully created');
        this.termsUpdated.emit();
        this.terms.push(
          {
            TandC: this.addForm.get('newTerm').value,
            IsDefaut: this.addForm.get('IsDefaut').value ? 'A' : 'S'
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
}