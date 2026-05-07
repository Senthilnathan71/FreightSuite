import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
} from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { CommonModule } from '@angular/common';
import { DropdownStore } from 'src/app/shared/dropdown/dropdown.store';
import { debounceTime, forkJoin, Subject, takeUntil } from 'rxjs';
import { MasterService } from '../../master.service';
import { DROPDOWN_CONFIGS } from 'src/app/common/lookup-config';
import { SearchableDropdown } from 'src/app/component/searchable-dropdown/searchable-dropdown.component';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { DeleteWarningComponent } from 'src/app/modules/crm-mobile/delete-warning.component';
import { MatDialog } from '@angular/material/dialog';
import { HasUnsavedChanges } from 'src/app/core/interfaces/has-unsaved-changes.interface';
@Component({
  selector: 'app-network-entry',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgSelectModule,SearchableDropdown],
  templateUrl: './network-entry.component.html',
  styles: ``,
})
export class NetworkEntryComponent implements OnInit, OnDestroy, HasUnsavedChanges {
  countryResults: any[];
  countryLookupConfig = DROPDOWN_CONFIGS.COUNTRY;
  page = 1;
  pageSize = 10;
  totalLengthOfCollection = 0;
  userData: any;
  currentCompany: any;
  searchTerm = '';
  isDirty: boolean = false;
  isSaving: boolean = false;
  private initialFormValue: any = null;
  private destroy$ = new Subject<void>();
  private isFormChangeSubscribed = false;
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
    this.appSettingsService.getUser().subscribe((user) => {
      if (user) this.userData = user;
    });
		this.loadAllFields();
    this.loadNetworks();
	}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
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

  @HostListener('window:beforeunload', ['$event'])
  unloadNotification($event: BeforeUnloadEvent): void {
    if (this.hasUnsavedChanges()) {
      $event.preventDefault();
      $event.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
    }
  }

  hasUnsavedChanges(): boolean {
    return this.isDirty;
  }

  async saveChanges(): Promise<boolean> {
    return this.saveNetworks();
  }

  private subscribeToFormChanges(): void {
    if (this.isFormChangeSubscribed) return;

    this.networkForm.valueChanges
      .pipe(takeUntil(this.destroy$), debounceTime(300))
      .subscribe(() => {
        this.isDirty = !this.deepEqual(this.initialFormValue, this.networkForm.getRawValue());
      });
    this.isFormChangeSubscribed = true;
  }

  private normalizeValue(value: any): any {
    if (value === null || value === undefined) return null;
    if (value instanceof Date) return value.toISOString().split('T')[0];
    if (typeof value === 'string' && value.trim() !== '' && !isNaN(+value)) return Number(value);
    if (typeof value === 'number') return Number(value.toFixed(6));
    if (Array.isArray(value)) return value.map((v) => this.normalizeValue(v));
    if (typeof value === 'object') {
      return Object.keys(value)
        .sort()
        .reduce((acc: any, key) => {
          acc[key] = this.normalizeValue(value[key]);
          return acc;
        }, {});
    }
    return value;
  }

  private deepEqual(obj1: any, obj2: any): boolean {
    const normalizedObj1 = this.normalizeValue(obj1);
    const normalizedObj2 = this.normalizeValue(obj2);
    return JSON.stringify(normalizedObj1) === JSON.stringify(normalizedObj2);
  }

  loadNetworks() {

  this.masterService.getAllNetwork().subscribe({
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

      this.initialFormValue = this.networkForm.getRawValue();
      this.isDirty = false;
      this.subscribeToFormChanges();
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

  saveNetworks(): Promise<boolean> {
  return new Promise((resolve) => {
  if (this.networkArray.length === 0) {
    this.appSettingsService.showError("Please add at least one network.");
    resolve(false);
    return;
  }

  const raw = this.networkForm.getRawValue();
  if (this.deepEqual(raw, this.initialFormValue) && !this.isDirty) {
    this.appSettingsService.showWarning('No changes to save');
    resolve(false);
    return;
  }

  if (this.isSaving) {
    resolve(false);
    return;
  }

  this.isSaving = true;

  const payload = this.networkArray.getRawValue().map(x => ({
  ...x,
  CreatedBy: this.userData?.userEmail || 'system',
  UpdatedBy: this.userData?.userEmail || 'system'
}));
  this.masterService.updateNetwork(payload).subscribe({
    next: (resp: any) => {
      this.isSaving = false;
      if (resp.status) {
        this.appSettingsService.showSuccess("Network saved successfully");
        this.loadNetworks();
        this.loadAllFields();
        this.isDirty = false;
        this.initialFormValue = this.networkForm.getRawValue();
        resolve(true);
      } else {
        this.appSettingsService.showError(resp.message || "Save failed");
        resolve(false);
      }
    },
    error: (err) => {
      this.isSaving = false;
      console.error(err);
      this.appSettingsService.showError("Something went wrong while saving.");
      resolve(false);
    }
  });
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
