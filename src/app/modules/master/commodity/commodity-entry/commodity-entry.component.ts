import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FeatherModule } from 'angular-feather';
import { NgSelectModule } from '@ng-select/ng-select';
import { MasterService } from '../../master.service';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { DeleteWarningComponent } from 'src/app/modules/crm-mobile/delete-warning.component';

@Component({
  selector: 'app-commodity-entry',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FeatherModule,
    NgSelectModule
  ],
  templateUrl: './commodity-entry.component.html',
  styleUrls: ['./commodity-entry.component.scss']
})
export class CommodityEntryComponent implements OnInit {
  commodityForm: FormGroup;
  isEditMode = false;
  commodityId: number;
  loading = false;
  btnDisable = false;

  statusOptions = [
    { id: 'A', name: 'Active' },
    { id: 'I', name: 'Inactive' }
  ];

  commodityAttributes = [
    { id: 'Timber', name: 'Timber' },
    { id: 'Flamable', name: 'Flamable' },
    { id: 'Perishable', name: 'Perishable' },
    { id: 'Haz', name: 'Haz' },
    { id: 'ContainerVentRequired', name: 'Container Vent Required' }
  ];

  constructor(
    private fb: FormBuilder,
    private masterService: MasterService,
    private route: ActivatedRoute,
    private router: Router,
    private appSettingService: AppSettingsService,
    private modalService: NgbModal
  ) {
    this.initForm();
  }

  ngOnInit() {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.commodityId = +params['id'];
        this.isEditMode = true;
        this.loadCommodity(this.commodityId);
        this.commodityForm.get('status')?.enable();
      }
    });
  }

  initForm() {
    this.commodityForm = this.fb.group({
      CommodityName: ['', [Validators.required, Validators.maxLength(50)]],
      CommodityCode: ['', [Validators.required, Validators.maxLength(10)]],
      CommodityNameLL: ['', [Validators.maxLength(50)]],
      CommodityType: ['', Validators.required],
      UOMSid: [null],
      ImcoName: ['', [Validators.maxLength(10)]],
      UNNo: ['', [Validators.maxLength(10)]],
      PackingGroup: ['', [Validators.maxLength(10)]],
      HSSACCode: [null],
      FlashPoint: ['', [Validators.maxLength(5)]],
      status: [{value: 'A', disabled: !this.isEditMode}, Validators.required],
      Remarks: ['', [Validators.maxLength(300)]],
      // Add attribute controls
      Timber: [false],
      Flamable: [false],
      Perishable: [false],
      Haz: [false],
      ContainerVentRequired: [false]
    });
  }

  loadCommodity(id: number) {
    this.loading = true;
    this.masterService.getCommodityById(id).subscribe({
      next: (commodity) => {
        this.commodityForm.patchValue({
          ...commodity,
          UOMSid: commodity.UOMSid ? commodity.UOMSid.toString() : null,
          // Patch attribute values
          Timber: commodity.Timber || false,
          Flamable: commodity.Flamable || false,
          Perishable: commodity.Perishable || false,
          Haz: commodity.Haz || false,
          ContainerVentRequired: commodity.ContainerVentRequired || false
        });
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.loading = false;
        this.appSettingService.showError('Failed to load commodity data');
      }
    });
  }

  onSubmit() {
    if (this.commodityForm.invalid) {
      this.commodityForm.markAllAsTouched();
      return;
    }
  
    this.btnDisable = true;
    this.loading = true;
    const formValue = this.commodityForm.value;
    
    const payload = {
      ...formValue,
      HSSACCode: formValue.HSSACCode ? Number(formValue.HSSACCode) : null,
      UOMSid: formValue.UOMSid ? Number(formValue.UOMSid) : null,
      status: this.isEditMode ? formValue.status : 'A'
    };
  
    const operation = this.isEditMode
      ? this.masterService.updateCommodityById(this.commodityId, payload)
      : this.masterService.createNewCommodity(payload);
  
    operation.subscribe({
      next: (resp: any) => {
        this.loading = false;
        this.btnDisable = false;
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
    this.loading = false;
    this.btnDisable = false;
    
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
        CommodityName: '',
        CommodityCode: '',
        CommodityNameLL: '',
        CommodityType: '',
        UOMSid: null,
        ImcoName: '',
        UNNo: '',
        PackingGroup: '',
        HSSACCode: null,
        FlashPoint: '',
        status: 'A',
        Remarks: '',
        Timber: false,
        Flamable: false,
        Perishable: false,
        Haz: false,
        ContainerVentRequired: false
      });
    }
  }

  goBack() {
    if (this.commodityForm.dirty) {
      const modalRef = this.modalService.open(DeleteWarningComponent);
      modalRef.componentInstance.message = 'You have unsaved changes. Are you sure you want to leave?';
      modalRef.result.then((result) => {
        if (result === true) {
          this.router.navigate(['/master/commodity/list']);
        }
      }).catch(() => {});
    } else {
      this.router.navigate(['/master/commodity/list']);
    }
  }
}