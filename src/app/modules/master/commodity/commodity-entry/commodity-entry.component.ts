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

    // Add input filtering for CommodityName
    this.commodityForm.get('CommodityName')?.valueChanges.subscribe(value => {
      if (value) {
        // Remove any non-alphabetic characters and extra spaces
        const filteredValue = value.replace(/[^a-zA-Z\s]/g, '').replace(/\s+/g, ' ').trim();
        if (filteredValue !== value) {
          this.commodityForm.get('CommodityName')?.setValue(filteredValue, { emitEvent: false });
        }
      }
    });
  }

  initForm() {
    this.commodityForm = this.fb.group({
      CommodityName: ['', [
        Validators.required,
        Validators.maxLength(50),
        Validators.pattern(/^[a-zA-Z\s]+$/) // Only alphabets and spaces allowed
      ]],
      CommodityCode: ['', [Validators.required, Validators.maxLength(10), Validators.pattern(/^[a-zA-Z0-9]{5,12}$/)]],
      CommodityNameLL: ['', [Validators.maxLength(50)]],
      CommodityType: ['', [
      Validators.required,
      Validators.maxLength(100)  
    ]],
      // UOMSid: [null],
      ImcoName: ['', [Validators.maxLength(10)]],
      UNNo: ['', [Validators.maxLength(10)]],
      PackingGroup: ['', [Validators.maxLength(10)]],
      // HSSACCode: [null],
      FlashPoint: ['', [Validators.maxLength(5)]],
      status: [{ value: 'A', disabled: !this.isEditMode }, Validators.required],
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
        this.commodityForm.patchValue({
          ...commodity,
          UOMSid: commodity.UOMSid ? commodity.UOMSid.toString() : null,
          Timber: commodity.Timber || false,
          Flamable: commodity.Flamable || false,
          Perishable: commodity.Perishable || false,
          Haz: commodity.Haz || false,
          ContainerVentRequired: commodity.ContainerVentRequired || false
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
      UOMSid: formValue.UOMSid ? Number(formValue.UOMSid) : null,
      status: this.isEditMode ? formValue.status : 'A'
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
        CommodityName: '',
        CommodityCode: '',
        CommodityNameLL: '',
        CommodityType: '',
        // UOMSid: null,
        ImcoName: '',
        UNNo: '',
        PackingGroup: '',
        // HSSACCode: null,
        FlashPoint: '',
        status: 'A',
        Remarks: '',
        // Timber: false,
        // Flamable: false,
        // Perishable: false,
        // Haz: false,
        // ContainerVentRequired: false
      });
    }
  }

  goBack() {
    this.router.navigate(['/master/commodity/list']);
  }
}