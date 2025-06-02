import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidatorFn, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FeatherModule } from 'angular-feather';
import { MasterService } from '../../master.service';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { NgSelectModule } from '@ng-select/ng-select';

import { map } from 'rxjs/operators';
import { Zone } from 'src/app/modules/crm-mobile/Interfaces/zone.interface';
import { Sector } from 'src/app/modules/crm-mobile/Interfaces/sector.interface';

@Component({
  selector: 'app-sector-entry',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FeatherModule,
    NgSelectModule
  ],
  templateUrl: './sector-entry.component.html',
  styleUrls: ['./sector-entry.component.scss']
})
export class SectorEntryComponent implements OnInit {
  sectorForm: FormGroup;
  isEditMode = false;
  btnDisable = false;
  sectorId: number;
  zones: Zone[] = [];
  filteredZones: Zone[] = [];
  isLoading = false;

  statusOptions = [
    { id: 'A', name: 'Active' },
    { id: 'S', name: 'Suspended' }
  ];

  constructor(
    private fb: FormBuilder,
    private masterService: MasterService,
    private route: ActivatedRoute,
    private router: Router,
    private appSettingService: AppSettingsService
  ) {
    this.initForm();
  }

  ngOnInit(): void {
    this.loadZones();
    
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.sectorId = +params['id'];
        this.isEditMode = true;
        this.getSectorById(this.sectorId);
      }
    });
  }

  initForm() {
    this.sectorForm = this.fb.group({
      sectorName: ['', [Validators.required, Validators.maxLength(50)]],
      sectorCode: ['', [Validators.required, Validators.maxLength(10), 
                       this.alphaNumericValidator(), this.uppercaseValidator()]],
      RegionName: [null, [Validators.maxLength(50)]],
      RegionCode: [null, [Validators.maxLength(10)]],
      status: [{value: 'A', disabled: !this.isEditMode}, Validators.required],
    });

    this.sectorForm.get('sectorCode')?.valueChanges.subscribe(val => {
      if (val) {
        this.sectorForm.get('sectorCode')?.setValue(val.toUpperCase(), { emitEvent: false });
      }
    });

    this.sectorForm.get('RegionName')?.valueChanges.subscribe(zoneName => {
      if (zoneName) {
        const selectedZone = this.zones.find(z => z.ZoneName === zoneName);
        if (selectedZone) {
          this.sectorForm.get('RegionCode')?.setValue(selectedZone.ZoneCode, { emitEvent: false });
        }
      } else {
        this.sectorForm.get('RegionCode')?.setValue(null);
      }
    });
  }

  private alphaNumericValidator(): ValidatorFn {
    return (control: AbstractControl): {[key: string]: any} | null => {
      if (!control.value) return null;
      const valid = /^[A-Za-z0-9]+$/.test(control.value);
      return valid ? null : { invalidAlphaNumeric: true };
    };
  }

  private uppercaseValidator(): ValidatorFn {
    return (control: AbstractControl): {[key: string]: any} | null => {
      if (!control.value) return null;
      return control.value === control.value.toUpperCase() ? null : { notUppercase: true };
    };
  }

  loadZones() {
    this.isLoading = true;
    this.masterService.getAllZones().subscribe({
      next: (response: any) => {
        // Handle different possible response structures
        this.zones = response.data || response || [];
        this.filteredZones = [...this.zones];
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading zones:', err);
        this.appSettingService.showError('Failed to load zone data');
        this.isLoading = false;
        
        // Fallback to mock data if API fails
        this.zones = [
          { ZoneMasterSid: 1, ZoneCode: 'ZONE1', ZoneName: 'North Zone' },
          { ZoneMasterSid: 2, ZoneCode: 'ZONE2', ZoneName: 'South Zone' },
          { ZoneMasterSid: 3, ZoneCode: 'ZONE3', ZoneName: 'East Zone' },
          { ZoneMasterSid: 4, ZoneCode: 'ZONE4', ZoneName: 'West Zone' }
        ];
        this.filteredZones = [...this.zones];
      }
    });
  }

  getSectorById(id: number) {
    this.masterService.getSectorById(id).subscribe({
      next: (sector: any) => {
        this.sectorForm.patchValue({
          sectorName: sector.sectorName,
          sectorCode: sector.sectorCode,
         RegionName: sector.RegionName || '',
          RegionCode: sector.RegionCode || '',
          status: sector.status || 'A',
        });
        this.sectorForm.get('status')?.enable();
      },
      error: (err) => {
        console.error('Error loading sector:', err);
        this.appSettingService.showError('Failed to load sector data');
      }
    });
  }

  // In onSubmit method
onSubmit() {
  if (this.sectorForm.invalid) {
    this.markFormGroupTouched(this.sectorForm);
    this.appSettingService.showWarning('Please fill all required fields correctly.');
    return;
  }

  this.btnDisable = true;
  
  const formValue = this.sectorForm.getRawValue();
  
  // Prepare the payload with all required fields
  const payload: Omit<Sector, 'SectorMasterSid'> = {
    sectorName: formValue.sectorName,
    sectorCode: formValue.sectorCode,
    RegionName: formValue.RegionName || null,
    RegionCode: formValue.RegionCode || null,
    status: this.isEditMode ? formValue.status : 'A',
    createdBy: this.appSettingService.userSettingSource.value['userEmail'],
    updatedBy: this.isEditMode ? this.appSettingService.userSettingSource.value['userEmail'] : undefined,
    // LoginSid: '',
    // createdOn: '',
    // updatedOn: '',
    // LoginSid: ''
  };

  console.log('Submitting payload:', payload); // Debug log

  const operation = this.isEditMode 
    ? this.masterService.updateSector(this.sectorId, payload)
    : this.masterService.createSector(payload);

  operation.subscribe({
    next: (resp: any) => {
      this.btnDisable = false;
      if (resp?.status !== false) {
        this.appSettingService.showSuccess(
          this.isEditMode ? 'Sector updated successfully!' : 'Sector created successfully!'
        );
        this.router.navigate(['/master/sector/list']);
      } else {
        this.appSettingService.showError(resp.message || 'Operation failed');
      }
    },
    error: (err) => {
      this.btnDisable = false;
      console.error('API Error:', err);
      const errorMessage = err.error?.message || 
        `Error ${this.isEditMode ? 'updating' : 'creating'} sector`;
      this.appSettingService.showError(errorMessage);
    }
  });
}

  resetForm() {
    if (this.isEditMode) {
      this.getSectorById(this.sectorId);
    } else {
      this.sectorForm.reset({
        sectorName: '',
        sectorCode: '',
        RegionName: null,
        RegionCode: null,
        status: 'A',
      });
    }
  }

  goBack() {
    this.router.navigate(['master/sector/list']);
  }

  private markFormGroupTouched(formGroup: FormGroup) {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }
}