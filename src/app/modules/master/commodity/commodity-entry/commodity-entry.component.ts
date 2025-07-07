import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule, DatePipe } from '@angular/common';
import { FeatherModule } from 'angular-feather';
import { NgSelectModule } from '@ng-select/ng-select';
import { MasterService } from '../../master.service';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { DeleteWarningComponent } from 'src/app/modules/crm-mobile/delete-warning.component';
import { take } from 'rxjs';
import { map } from 'rxjs/operators';
import { DetailsComponent } from 'src/app/component/details/details.component';
import { TermsAndConditionsComponent } from 'src/app/component/terms&conditions/terms&conditions.component';
import { PreventMultiClickDirective } from 'src/app/core/Directives/prevent-multi-click.directive';
import { EmailEntryComponent } from 'src/app/modules/settings/email/email-entry/email-entry.component';
import { AuthorityEntryComponent } from '../../authority/authority-entry/authority-entry.component';
import { EdocComponent } from 'src/app/modules/settings/edoc/edoc/edoc.component';

@Component({
  selector: 'app-commodity-entry',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FeatherModule,
    NgSelectModule,
    DatePipe,
    PreventMultiClickDirective
  ],
  templateUrl: './commodity-entry.component.html',
  styleUrls: ['./commodity-entry.component.scss']
})
export class CommodityEntryComponent implements OnInit {
  commodityForm: FormGroup;
  isEditMode = false;
  commodityId: number;
  hssacOptions: any[] = [];
  loadingHSSAC = false;
  commodityData: any;

  statusOptions = [
    { id: 'Active', name: 'Active' },
    { id: 'Suspended', name: 'Suspended' }
  ];

  commodityAttributes = [
    { id: 'Timber', name: 'Timber' },
    { id: 'Flamable', name: 'Flamable' },
    { id: 'Perishable', name: 'Perishable' },
    { id: 'Haz', name: 'Haz' },
    { id: 'ContainerVentRequired', name: 'Container Vent Required' }
  ];
  commodityTypeOptions = [
  { value: 'General', label: 'General' },
  { value: 'Haz', label: 'Hazardous' },
  { value: 'Reefer', label: 'Reefer' }
];
  currentMenuId: number;
  TandCList: any[]=[];

  constructor(
    private fb: FormBuilder,
    private masterService: MasterService,
    private route: ActivatedRoute,
    private router: Router,
    private appSettingService: AppSettingsService,
    private modalService: NgbModal
  ) {
    this.commodityForm = this.initForm();
  }

  ngOnInit() {
    this.loadHSSACOptions();
    
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.commodityId = +params['id'];
        this.isEditMode = true;
        this.loadCommodity(this.commodityId);
      }
    });

    this.commodityForm.get('CommodityName')?.valueChanges.subscribe(value => {
      if (value) {
        const filteredValue = value.replace(/[^a-zA-Z\s]/g, '').replace(/\s+/g, ' ').trim();
        if (filteredValue !== value) {
          this.commodityForm.get('CommodityName')?.setValue(filteredValue, { emitEvent: false });
        }
      }
    });
  }

  private loadHSSACOptions() {
    this.loadingHSSAC = true;
    this.masterService.getAllHssac().pipe(
      take(1)
    ).subscribe({
      next: (response: any) => {
        this.hssacOptions = response.map((item: any) => ({
          id: item.HSSACMasterSid,
          code: item.HSSACCode,
          name: item.HSSACName,
          fullDisplay: `${item.HSSACCode} - ${item.HSSACName}`
        }));
        this.loadingHSSAC = false;
      },
      error: (err) => {
        console.error('Error loading HS-SAC options', err);
        this.appSettingService.showError('Failed to load HS-SAC options');
        this.loadingHSSAC = false;
      }
    });
  }

  initForm() {
    return this.fb.group({
      CommodityName: ['', [
        Validators.required,
        Validators.maxLength(50),
        Validators.pattern(/^[a-zA-Z\s]+$/)
      ]],
      CommodityCode: ['', [Validators.required, Validators.maxLength(10), Validators.pattern(/^[a-zA-Z0-9]{5,12}$/)]],
      CommodityNameLL: ['', [Validators.maxLength(50)]],
      CommodityType: ['General', [Validators.required]],
      // UOMSid: [null],
      // ImcoName: ['', [Validators.maxLength(10)]],
      // UNNo: ['', [Validators.maxLength(10)]],
      PackingGroup: ['', [Validators.maxLength(10)]],
      HSSACCode: [null],
      // FlashPoint: ['', [Validators.maxLength(5)]],
      status: [{value: 'Active', disabled: true}],
      Remarks: ['', [Validators.maxLength(200)]],
      // Timber: [false],
      // Flamable: [false],
      // Perishable: [false],
      // Haz: [false],
      // ContainerVentRequired: [false]
    });
  }

  loadCommodity(id: number) {
    this.masterService.getCommodityById(id).subscribe({
      next: (commodity) => {
        // Enable status field for editing
        this.commodityForm.get('status')?.enable();
        this.commodityData = commodity;
        this.commodityForm.patchValue({
          ...commodity,
          status: commodity.status === 'A' ? 'Active' : 'Suspended',
          HSSACCode: commodity.HSSACCode ? Number(commodity.HSSACCode) : null,
          // UOMSid: commodity.UOMSid ? Number(commodity.UOMSid) : null,
          // Timber: commodity.Timber || false,
          // Flamable: commodity.Flamable || false,
          // Perishable: commodity.Perishable || false,
          // Haz: commodity.Haz || false,
          // ContainerVentRequired: commodity.ContainerVentRequired || false
        });
      },
      error: (err) => {
        console.error(err);
        this.appSettingService.showError('Failed to load commodity data');
      }
    });
  }

  onSubmit() {
    if (this.commodityForm.invalid) {
      this.commodityForm.markAllAsTouched();
      return;
    }

    const formValue = this.commodityForm.value;

    const payload = {
      ...formValue,
      HSSACCode: formValue.HSSACCode ? Number(formValue.HSSACCode) : null,
      // UOMSid: formValue.UOMSid ? Number(formValue.UOMSid) : null,
      status: formValue.status === 'Active' ? 'A' : 'S'
    };

    const operation = this.isEditMode
      ? this.masterService.updateCommodityById(this.commodityId, payload)
      : this.masterService.createNewCommodity(payload);

    operation.subscribe({
      next: (resp: any) => {
        const message = this.isEditMode
          ? 'Commodity updated successfully!'
          : 'Commodity created successfully!';

        this.appSettingService.showSuccess(message);
        this.router.navigate(['/master/commodity/list']);
      },
      error: (err) => {
        this.handleError(err);
      }
    });
  }

  private handleError(err: any) {
    console.error(err);
    let errorMessage = `Error ${this.isEditMode ? 'updating' : 'creating'} commodity`;

    if (err.error?.message) {
      errorMessage = err.error.message;
    } else if (err.status === 400) {
      errorMessage = 'Validation error - please check your inputs';
    }

    this.appSettingService.showError(errorMessage);
  }

  resetForm() {
    if (this.isEditMode) {
      this.loadCommodity(this.commodityId);
    } else {
      this.commodityForm.reset({
        status: 'Active',
        Timber: false,
        Flamable: false,
        Perishable: false,
        Haz: false,
        ContainerVentRequired: false
      });
    }
  }

  goBack() {
    this.router.navigate(['/master/commodity/list']);
  }

  showInfo() {
    if(!this.commodityData) return;
    const modalRef = this.modalService.open(DetailsComponent, { size: 'lg', centered: true, backdrop: 'static' });
    modalRef.componentInstance.item = this.commodityData;
    modalRef.componentInstance.idLabel = 'Commodity Id';
    modalRef.componentInstance.idValue = this.commodityData?.CommodityMasterSid;
  }

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
            centered: true
          });
          modalRef.componentInstance.terms = this.TandCList;
          modalRef.componentInstance.MenuMasterSid = this.currentMenuId;
          modalRef.componentInstance.DocumentSid = this.commodityId;

        } else {
          this.appSettingService.showError('Error loading Terms and Conditions');
        }
      },
      (error) => {
        this.appSettingService.showError('Error loading Terms and Conditions', error);
      }
    );
  }
  openEmail() {
    if (!this.commodityData) return;
    const modalRef = this.modalService.open(EmailEntryComponent, {
      size: 'lg',
      centered: true,
      backdrop: 'static'
    });
  }

openAuthority() {
  if (!this.commodityData) return;
  const modalRef = this.modalService.open(AuthorityEntryComponent, { 
    size: 'lg', 
    centered: true, 
    backdrop: 'static' 
  });
  modalRef.componentInstance.item = this.commodityData;
  modalRef.componentInstance.idLabel = 'Commodity Id';
  modalRef.componentInstance.idValue = this.commodityData?.CommodityMasterSid;
}

openEDoc() {
  if (!this.commodityData) return;
  const modalRef = this.modalService.open(EdocComponent, { 
    size: 'lg', 
    centered: true, 
    backdrop: 'static' 
  });
  modalRef.componentInstance.item = this.commodityData;
  modalRef.componentInstance.idLabel = 'Commodity Id';
  modalRef.componentInstance.idValue = this.commodityData?.CommodityMasterSid;
}

}