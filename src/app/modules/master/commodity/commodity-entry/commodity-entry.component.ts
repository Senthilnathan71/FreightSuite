import { Component, OnInit } from '@angular/core';
import { 
  FormControl, 
  FormGroup, 
  ReactiveFormsModule, 
  Validators 
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { FeatherModule } from 'angular-feather';
import { NgSelectModule } from '@ng-select/ng-select';
import { MasterService } from '../../master.service';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { Commodity, CommodityForm } from 'src/app/modules/crm-mobile/Interfaces/commodity.interface';

@Component({
  selector: 'app-commodity-entry',
  standalone: true,
  imports: [FeatherModule, ReactiveFormsModule, NgSelectModule],
  templateUrl: './commodity-entry.component.html',
  styleUrl: './commodity-entry.component.scss'
})
export class CommodityEntryComponent implements OnInit {
  inputForm: FormGroup;
  isEditMode: boolean = false;
  CommodityMasterSid: number;
  btnDisable: boolean = false;
  
  statusOptions = [
    { id: 'A', name: 'Active' },
    { id: 'I', name: 'Inactive' }
  ];

  commodityTypes = [
    { id: 'General', name: 'General' },
    { id: 'Haz', name: 'Hazardous' },
    { id: 'Reefer', name: 'Reefer' }
  ];

  constructor(
    private currentRoute: ActivatedRoute,
    private masterService: MasterService,
    private appSettingService: AppSettingsService,
    private route: Router
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.currentRoute.paramMap.subscribe(params => {
      const param = params.get('id');
      if (param) {
        this.CommodityMasterSid = +param;
        if (!isNaN(this.CommodityMasterSid)) {
          this.isEditMode = true;
          this.loadCommodityById(this.CommodityMasterSid);
        }
      }
    });
  }

  initForm() {
    this.inputForm = new FormGroup({CommodityCode: new FormControl('', [Validators.required,Validators.maxLength(10)]),
      CommodityName: new FormControl('', [Validators.required,Validators.maxLength(50)]),
      CommodityNameLL: new FormControl('', [Validators.maxLength(50)]),
      UOMSid: new FormControl(null),
      HSSACCode: new FormControl(null),
      CommodityType: new FormControl(null),
      ImcoName: new FormControl('', [Validators.maxLength(25)]),
      UNNo: new FormControl('', [Validators.maxLength(10)]),
      PackingGroup: new FormControl('', [Validators.maxLength(10)]),
      FlashPoint: new FormControl('', [Validators.maxLength(5)]),
      status: new FormControl('A', Validators.required),
      Remarks: new FormControl('', [Validators.maxLength(300)])
    });
  }

  loadCommodityById(CommodityMasterSid: number) {
    this.masterService.getCommodityById(CommodityMasterSid).subscribe(
      (resp: Commodity) => {
        this.inputForm.patchValue({
          ...resp,
          status: resp.status
        });
      },
      (error) => {
        this.appSettingService.showError('Error loading commodity data');
        this.route.navigate(['master/commodity/list']);
      }
    );
  }

  saveCommodity() {
    if (this.inputForm.invalid) {
      this.inputForm.markAllAsTouched();
      this.appSettingService.showError('Please fill all required fields correctly');
      return;
    }

    this.btnDisable = true;
    const formValue = this.inputForm.value;
    const userEmail = this.appSettingService.userSettingSource.value['userEmail'];
    
    const payload: CommodityForm = {
      ...formValue,
      createdBy: this.isEditMode ? undefined : userEmail,
      updatedBy: this.isEditMode ? userEmail : undefined
    };

    const operation$ = this.isEditMode
      ? this.masterService.updateCommodityById(this.CommodityMasterSid, payload)
      : this.masterService.createCommodity(payload);

    operation$.subscribe({
      next: (resp) => {
        this.btnDisable = false;
        const action = this.isEditMode ? 'updated' : 'created';
        this.appSettingService.showSuccess(`Commodity ${action} successfully!`);
        this.route.navigate(['master/commodity/list']);
      },
      error: (error) => {
        this.btnDisable = false;
        this.appSettingService.showError(error.error?.message || 
          `Error ${this.isEditMode ? 'updating' : 'creating'} commodity`);
      }
    });
  }

  goBack() {
    this.route.navigate(['master/commodity/list']);
  }
}