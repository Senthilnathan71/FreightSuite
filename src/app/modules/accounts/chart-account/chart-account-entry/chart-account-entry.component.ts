import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { NgSelectModule } from '@ng-select/ng-select';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { DetailsComponent } from 'src/app/component/details/details.component';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { MasterService } from 'src/app/modules/master/master.service';
import { TermsAndConditionsComponent } from 'src/app/component/terms&conditions/terms&conditions.component';
import { EmailEntryComponent } from 'src/app/modules/settings/email/email-entry/email-entry.component';
import { AuthorityEntryComponent } from 'src/app/modules/master/authority/authority-entry/authority-entry.component';
import { EdocComponent } from 'src/app/modules/settings/edoc/edoc/edoc.component';
@Component({
  selector: 'app-chart-account-entry',
  standalone: true,
  imports: [NgSelectModule, ReactiveFormsModule, CommonModule],
  templateUrl: './chart-account-entry.component.html',
  styleUrl: './chart-account-entry.component.scss',
})
export class ChartAccountEntryComponent {
  chartForm!: FormGroup;
  chartData: any;
  isSubledgerRequired: boolean = false;
  TandCList: any;
  currentMenuId: number;
  chartMasterSid: number;
  isEditMode: boolean = false;

  modeOfCategory = [
    { id: 1, name: 'Category 1' },
    { id: 1, name: 'Category 2' },
  ];
  modeOfStatus = [
    { id: 1, name: 'Active' },
    { id: 2, name: 'Suspended' },
  ];
  modeOfReportType = [
    { id: 1, name: 'type 1' },
    { id: 2, name: 'type 2' },
  ];

  constructor(
    private masterServ: MasterService,
    private fb: FormBuilder,
    private route: Router,
    private appSettingService: AppSettingsService,
    private modalService: NgbModal
  ) {}

  ngOnInit(): void {
    this.initForm();
  }

  initForm() {
    this.chartForm = this.fb.group({
      Name: ['', [Validators.required, Validators.maxLength(100)]],
      code: ['', [Validators.required, Validators.maxLength(10)]],
      subGroup: ['', [Validators.maxLength(20)]],
      CurrencyCode: ['', [Validators.maxLength(10)]],
      Group: ['', [Validators.maxLength(100)]],
      Category: ['', [Validators.required]],
      reportType: ['', [Validators.required]],
      Remarks: ['', [Validators.maxLength(200)]],
      status: ['Active'],
      IsSubledgerRequired: [false],
      LedgerName: ['', [Validators.maxLength(20)]],
    });
  }

  loadChartAccount() {
    this.masterServ.fetchCoaById(this.chartMasterSid).subscribe(
      (data: any) => {
        this.chartData = data;
        this.isSubledgerRequired = data.IsSubledgerRequired;

        if (this.isSubledgerRequired) {
          this.chartForm
            .get('LedgerName')
            ?.setValidators([Validators.required, Validators.maxLength(20)]);
        }

        this.chartForm.patchValue({
          ...data,
          status: data.status === 'A' ? 'Active' : 'Suspended',
        });

        this.chartForm.get('LedgerName')?.updateValueAndValidity();
      },
      (error) => {
        this.appSettingService.showError('Error loading Chart Account', error);
      }
    );
  }

  onSubmit() {
    if (this.chartForm.invalid) {
      this.chartForm.markAllAsTouched();
      this.appSettingService.showWarning(
        'Please fill out all required fields correctly.'
      );
      return;
    }

    const formValue = this.chartForm.value;
    const payload = { ...formValue };

    if (this.isEditMode) {
      this.masterServ
        .updateCoaById(this.chartMasterSid, payload)
        .subscribe(
          (resp: any) => {
            if (resp.status) {
              this.appSettingService.showSuccess(
                'Chart Account Updated Successfully'
              );
              this.route.navigate(['/accounts/chart-accounts/list']);
            } else {
              this.appSettingService.showError(resp.message);
            }
          },
          (error) => {
            console.error('Error updating Chart Account', error);
          }
        );
    } else {
      this.masterServ.createNewCoa(payload).subscribe(
        (resp: any) => {
          if (resp.status) {
            this.appSettingService.showSuccess(
              'Chart Account Created Successfully'
            );
            this.route.navigate(['/accounts/chart-accounts/list']);
          } else {
            this.appSettingService.showError(resp.message);
          }
        },
        (error) => {
          console.error('Error creating Chart Account', error);
        }
      );
    }
  }

  //  checked box
  onSubledgerChange(event: Event): void {
    const checkbox = event.target as HTMLInputElement;
    this.isSubledgerRequired = checkbox.checked;

    const ledgerControl = this.chartForm.get('LedgerName');

    if (this.isSubledgerRequired) {
      ledgerControl?.setValidators([
        Validators.required,
        Validators.maxLength(20),
      ]);
    } else {
      ledgerControl?.clearValidators();
      ledgerControl?.setValue('');
    }

    ledgerControl?.updateValueAndValidity();
  }

  // info
  showInfo() {
    if (!this.chartData) return;
    const modalRef = this.modalService.open(DetailsComponent, {
      size: 'lg',
      centered: true,
      backdrop: 'static',
    });
    modalRef.componentInstance.item = this.chartData;
    modalRef.componentInstance.idLabel = 'Vessel Id';
    modalRef.componentInstance.idValue = this.chartData?.VesselMasterSid;
  }

  openTandC() {
    this.currentMenuId = Number(localStorage.getItem('currentMenuId'));
    const payload = { MenuMasterSid: this.currentMenuId };
    this.masterServ.getTandCByCondition(payload).subscribe(
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
          modalRef.componentInstance.DocumentSid = this.chartMasterSid;
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

  openEmail() {
    if (!this.chartData) return;
    const modalRef = this.modalService.open(EmailEntryComponent, {
      size: 'lg',
      centered: true,
      backdrop: 'static',
    });
  }

  openAuthority() {
    if (!this.chartData) return;
    const modalRef = this.modalService.open(AuthorityEntryComponent, {
      size: 'lg',
      centered: true,
      backdrop: 'static',
    });
    modalRef.componentInstance.item = this.chartData;
    modalRef.componentInstance.idLabel = 'Vessel Id';
    modalRef.componentInstance.idValue = this.chartData?.VesselMasterSid;
  }

  openEDoc() {
    if (!this.chartData) return;
    const modalRef = this.modalService.open(EdocComponent, {
      size: 'lg',
      centered: true,
      backdrop: 'static',
    });
    modalRef.componentInstance.item = this.chartData;
    modalRef.componentInstance.idLabel = 'Vessel Id';
    modalRef.componentInstance.idValue = this.chartData?.VesselMasterSid;
  }

  onReset(): void {
    this.chartForm.reset({
      Name: '',
      code: '',
      subGroup: '',
      CurrencyCode: '',
      Group: '',
      Category: '',
      reportType: '',
      PortType: '',
      Remarks: '',
      AccountType: '',
      IsSubledgerRequired: false,
    });

    this.chartForm.markAsPristine();
    this.chartForm.markAsUntouched();
  }

  nagivateback() {
    this.route.navigate(['accounts/chart-accounts/list']);
  }
}
