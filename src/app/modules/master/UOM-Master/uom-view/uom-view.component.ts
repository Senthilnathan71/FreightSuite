import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FeatherModule } from 'angular-feather';
import { FormsModule, FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormControl } from '@angular/forms';
import { NgSelectConfig, NgSelectModule } from '@ng-select/ng-select';
import { RouterModule } from '@angular/router';
import { ActivatedRoute, Router } from '@angular/router';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { MasterService } from '../../master.service';

@Component({
  selector: 'app-uom-view',
  standalone: true,
  imports: [
    FeatherModule,
    CommonModule,
    RouterModule,
    NgSelectModule,
    FormsModule,
    ReactiveFormsModule,
  ],
  templateUrl: './uom-view.component.html',
  styleUrl: './uom-view.component.scss'
})
export class UOMViewComponent {
  uomForm!: FormGroup;
  isEditMode = false;
  selectedShipmentType: number;
  btnDisable: boolean = false;


  shipmenttypes = [
    { id: 'FCL', name: 'FCL' },
    { id: 'LCL', name: 'LCL' },
    { id: 'Air', name: 'Air' },
    { id: 'All', name: 'All' },
  ];

  errorMessage: any;
  idParam: number;

  constructor(private config: NgSelectConfig, private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router, private appSettingService: AppSettingsService, private masterService: MasterService) {
    this.config.notFoundText = 'Custom not found';
    this.config.appendTo = 'body';
    this.config.bindValue = 'value';
  }

  ngOnInit() {
    this.uomForm = new FormGroup({
      UOMName: new FormControl('', [Validators.required, Validators.maxLength(20)]),
      UOMCode: new FormControl('', [Validators.required, Validators.maxLength(3)]),
      UOMType: new FormControl('', [Validators.required, Validators.maxLength(10)]),
      EdiCode: new FormControl('', [Validators.required, Validators.maxLength(3)]),
      DimensionReq: new FormControl('', []),
      WeightReq: new FormControl(null, []),
      VolumeReq: new FormControl('', []),
      ShipmentType: new FormControl(null, [Validators.required]),
      CostPerUnitPrice: new FormControl('', [Validators.required, Validators.maxLength(10)]),
      SlabFrom: new FormControl('', [Validators.required, Validators.maxLength(4)]),
      SlabTo: new FormControl('', [Validators.required, Validators.maxLength(4)]),
      Remarks: new FormControl('', [Validators.maxLength(300)])
    });

    this.route.paramMap.subscribe(params => {
      this.idParam = Number(params.get('id'));
      if (this.idParam) {
        this.isEditMode = true;
        this.loadUom(this.idParam);
      }
    })



  }

  loadUom(UomMasterSid): void {
    this.masterService.getUomById(UomMasterSid).subscribe(
      (resp) => {
        console.log(resp, 'uomdata')
        this.uomForm.patchValue(resp);
        this.uomForm.patchValue({ WeightReq: (resp.WeightReq == 'Y' ? true : false) });
        this.uomForm.patchValue({ DimensionReq: (resp.DimensionReq == 'Y' ? true : false) });
        this.uomForm.patchValue({ VolumeReq: (resp.VolumeReq == 'Y' ? true : false) });
      },
      (error) => {
        this.errorMessage = error.message;
        console.error('Error loading port:', error);
      }
    );
  }

  reset() {
    this.uomForm.reset();
  }

  goBack() {
    history.back()
  }

  // Handle Form Submission
  onSubmit() {
    if (this.uomForm.invalid) {
      this.uomForm.markAllAsTouched(); // Force validation messages to show
      this.uomForm.updateValueAndValidity(); // Ensure validation is refreshed
      this.appSettingService.showWarning('Please fill all required fields correctly.')
      return;
    } else {
      let createdBy = { createdBy: this.appSettingService.userSettingSource.value['userEmail'] };
      let updatedBy = { updatedBy: this.appSettingService.userSettingSource.value['userEmail'] };
      const payload = (this.isEditMode) ? { ...this.uomForm.value, ...updatedBy } : { ...this.uomForm.value, ...createdBy };


      payload.DimensionReq = (this.uomForm.value.DimensionReq) ? 'Y' : 'N';
      payload.WeightReq = (this.uomForm.value.WeightReq) ? 'Y' : 'N';
      payload.VolumeReq = (this.uomForm.value.VolumeReq) ? 'Y' : 'N';
      console.log('payload', payload);

      if (this.isEditMode) {
        this.masterService.updateUomById(this.idParam, payload).subscribe(
          (resp: any) => {

            console.log(resp.message);
            if (resp.status) {
              this.appSettingService.showSuccess(resp.message);
              this.router.navigate(['crm/uom-master/list']);

            } else {
              this.appSettingService.showError(resp.message);
            }

          },
          (error) => {
            this.errorMessage = error.message;
            console.error('Error loading uom:', error);
          }
        );
      } else {
        this.masterService.createUom(payload).subscribe(
          (resp: any) => {

            console.log(resp);
            if (resp.status) {
              this.appSettingService.showSuccess(resp.message);
              this.router.navigate(['crm/uom-master/list']);

            } else {
              this.appSettingService.showError(resp.message);
            }

          },
          (error) => {
            this.errorMessage = error.message;
            console.error('Error loading uom:', error);
          }
        );
      }
    }
  }
}
