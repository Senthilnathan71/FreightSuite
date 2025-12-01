import { Component, effect } from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
} from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { CommonModule } from '@angular/common';
import { DropdownStore } from 'src/app/shared/dropdown/dropdown.store';
import { Country } from 'src/app/modules/crm-mobile/Interfaces/country.interface';
import { forkJoin } from 'rxjs';
import { MasterService } from '../../master.service';
import { DROPDOWN_CONFIGS } from 'src/app/common/lookup-config';
import { SearchableDropdown } from 'src/app/component/searchable-dropdown/searchable-dropdown.component';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { DeleteWarningComponent } from 'src/app/modules/crm-mobile/delete-warning.component';
import { MatDialog } from '@angular/material/dialog';
@Component({
  selector: 'app-network-entry',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgSelectModule,SearchableDropdown],
  templateUrl: './network-entry.component.html',
  styles: ``,
})
export class NetworkEntryComponent {
  countryResults: any[];
  countryLookupConfig = DROPDOWN_CONFIGS.COUNTRY;
  page = 1;
  pageSize = 10;
  totalLengthOfCollection = 0;
  userData: any;
  currentCompany: any;
  constructor(
    public dropdownStore: DropdownStore,    
    private fb: FormBuilder,
    private masterService: MasterService,
    private appSettingsService: AppSettingsService,
    private dialog: MatDialog
  ) {
    this.networkForm = this.fb.group({
      networks: this.fb.array([]),
    });
  }

  networkForm!: FormGroup;

  statusOptions = [
    { id: 'A', name: 'Active' },
    { id: 'S', name: 'Suspend' },
  ];

  ngOnInit(): void {
    this.currentCompany = this.appSettingsService.decrypt(localStorage.getItem('selected-company'));
    
    this.appSettingsService.getUser().subscribe((user) => {
      if (user) this.userData = user;
    });
		this.loadAllFields();
    this.loadNetworks();
	}
  networkType = [
    { id: 1, name: 'Forwarders' },
    { id: 2, name: 'Carrier' },
    { id: 3, name: 'Agents' },
    { id: 4, name: 'Liner' },
    { id: 5, name: 'NVOCC' },
    { id: 6, name: 'Feeder' },
  ];

  get networkArray(): FormArray {
    return this.networkForm.get('networks') as FormArray;
  }

  loadNetworks() {
  const companySid = this.currentCompany?.CompanyMasterSid;
  if (!companySid) return;

  this.masterService.getAllNetworks(companySid).subscribe({
    next: (response: any) => {
      if (!response?.status) {
        this.appSettingsService.showError(response.message || "Failed to load networks");
        return;
      }

      const data = response.data || [];

      this.networkArray.clear();   // reset array before loading

      data.forEach((item: any) => {
        const group = this.fb.group({
          NetworkMasterSid: [item.NetworkMasterSid],
          NetworkName: [item.NetworkName],
          CountrySid: [item.CountrySid],
          NetworkType: [item.NetworkType],
          Status: [item.Status],
        });

        this.networkArray.push(group);
      });
    },

    error: (err: any) => {
      console.error("Network load error", err);
      this.appSettingsService.showError("Error while loading networks");
    }
  });
}


  addNetwork() {
    const networkGroup = this.fb.group({
      NetworkName: [''],
      CountrySid: [],
      NetworkType: ['Forwarders'],
      Status: ['A'],
    });
    this.networkArray.push(networkGroup);
  }

  saveNetworks() {
  if (this.networkArray.length === 0) {
    // If no rows added
    this.appSettingsService.showError("Please add at least one network.");
    return;
  }

  const payload = this.networkArray.getRawValue().map(x => ({
  ...x,
  CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
  CreatedBy: this.userData?.userEmail || 'system',
  UpdatedBy: this.userData?.userEmail || 'system'
}));
  this.masterService.updateNetwork(payload).subscribe({
    next: (resp: any) => {
      if (resp.status) {
        this.appSettingsService.showSuccess("Network saved successfully");
        this.loadNetworks();
        this.loadAllFields();   
        this.networkArray.clear();  
      } else {
        this.appSettingsService.showError(resp.message || "Save failed");
      }
    },
    error: (err) => {
      console.error(err);
      this.appSettingsService.showError("Something went wrong while saving.");
    }
  });
}

delete(index: number) {
  const row = this.networkArray.at(index)?.value;

  // If item not saved yet → just remove from UI
  if (!row.NetworkMasterSid) {
    this.networkArray.removeAt(index);
    return;
  }

  const id = row.NetworkMasterSid;
 const dialogRef = this.dialog.open(DeleteWarningComponent);
 dialogRef.afterClosed().subscribe((result) => {
      if (result === true) {
  this.masterService.deleteNetworkById(id).subscribe((resp: any) => {
      this.appSettingsService.showSuccess("Network deleted successfully");
      this.loadNetworks();  // reload table
      this.loadAllFields();
    });
    }
  });
}




  removeNetwork(index: number) {
    this.networkArray.removeAt(index);
  }

  loadAllFields() {
      forkJoin({
        countries : this.dropdownStore.loadCountries(),
   
      }).subscribe(({  countries  }) => {
        this.countryResults = countries;
      });
    }

    onPageChange(page: number): void {
      this.page = page;
    }

    trackBy(index:number, item:any): number {
      return item.NetworkMasterSid || index;

    }
}
