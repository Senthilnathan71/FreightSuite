import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { NgSelectModule } from '@ng-select/ng-select';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { DropdownStore } from 'src/app/shared/dropdown/dropdown.store';
import { SearchableDropdown } from 'src/app/component/searchable-dropdown/searchable-dropdown.component';
import { DROPDOWN_CONFIGS } from 'src/app/common/lookup-config';
import { OperationService } from '../../operation.service';

@Component({
  selector: 'app-job-correction-entry',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    NgSelectModule,
    NgxSpinnerModule,
    RouterModule,
    SearchableDropdown,
  ],
  templateUrl: './job-correction-entry.component.html',
  styleUrl: './job-correction-entry.component.scss',
})
export class JobCorrectionEntryComponent implements OnInit {
  jobForm: FormGroup;

  // Job picker (searchable dropdown by Job No / MBL / MAWB No)
  jobOptions: any[] = [];
  jobInput$ = new Subject<string>();
  selectedJobSid: number | null = null;
  isSearching = false;
  hasLoaded = false;

  masterJobSid: number | null = null;
  masterJobNumber = '';
  masterMblNo = '';
  departmentName = '';
  departmentType = '';
  isAir = false;
  mblLabel = 'MBL / MAWB No';
  isSaving = false;

  currentCompany: any;
  currentBranch: any;
  currUserEmail = '';

  ports: any[] = [];
  filteredPorts: any[] = [];   // ports filtered by Sea/Air for POL/POD
  portLookupConfig = DROPDOWN_CONFIGS.PORT;
  // Vessel/Voyage list fetched from the same Master Job API (by POL/POD + segment).
  vesselVoyageList: any[] = [];
  vesselOptions: any[] = [];   // unique vessels for the Vessel dropdown
  voyageOptions: any[] = [];   // voyages for the currently-selected vessel
  // Manual-entry toggles (same as Master Job: switch dropdown <-> free text)
  isVesselFreeText = false;
  isVoyageFreeText = false;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private operationService: OperationService,
    private appSettingService: AppSettingsService,
    private dropdownStore: DropdownStore,
    private spinner: NgxSpinnerService,
  ) { }

  ngOnInit(): void {
    this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));
    this.currentBranch = this.appSettingService.decrypt(localStorage.getItem('selected-branch'));
    const profile = this.appSettingService.getDecryptedUserProfile();
    this.currUserEmail = profile?.userEmail || profile?.UserEmail || profile?.email || '';

    this.initForm();
    this.loadLookups();

    // Server-side typeahead for the Job No / MBL / MAWB dropdown.
    this.jobInput$
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe((term) => this.searchJobs(term));
  }

  private initForm(): void {
    this.jobForm = this.fb.group({
      MasterJobVoyageSid: [null],
      Department: [{ value: '', disabled: true }], // read-only
      MasterJobDate: [null, Validators.required],
      POL: [null, Validators.required],
      POD: [null, Validators.required],
      VoyageMasterSid: [null],
      VesselName: [null],
      VoyageNo: [null],
      ETD: [null],
      ETA: [null],
      containers: this.fb.array([]),
    });
  }

  get containers(): FormArray {
    return this.jobForm.get('containers') as FormArray;
  }

  private loadLookups(): void {
    this.dropdownStore.loadPorts().subscribe({
      next: () => {
        this.ports = this.dropdownStore.ports().map((p: any) => ({
          ...p,
          Country: p?.countryMaster?.countryName ?? p?.Country ?? '',
        }));
        this.applyPortFilter();
      },
      error: () => {
        this.ports = [];
        this.filteredPorts = [];
      },
    });
  }

  // Filter POL/POD ports by Sea vs Air (from the job's department), while always
  // keeping the currently-selected POL/POD visible.
  private applyPortFilter(): void {
    const wanted = this.isAir ? 'AIR' : 'SEA';
    let list = (this.ports || []).filter(
      (p) => String(p?.PortType || '').toUpperCase() === wanted,
    );
    const pol = this.jobForm?.get('POL')?.value;
    const pod = this.jobForm?.get('POD')?.value;
    [pol, pod].forEach((code) => {
      if (code && !list.some((p) => p.PortCode === code)) {
        const p = (this.ports || []).find((x) => x.PortCode === code);
        if (p) list = [p, ...list];
      }
    });
    this.filteredPorts = list;
  }

  private portSidByCode(code: any): number | null {
    if (!code) return null;
    const port = this.ports.find((p) => String(p?.PortCode) === String(code));
    return port?.PortMasterSid ? Number(port.PortMasterSid) : null;
  }

  // Same segment mapping Master Job uses to query vessels/voyages.
  private segmentFromDept(): string {
    const t = String(this.departmentType || '').trim().toUpperCase();
    switch (t) {
      case 'SEA': return 'Sea';
      case 'AIR': return 'Air';
      case 'ROAD':
      case 'TRANSPORT': return 'Road';
      default: return 'Others';
    }
  }

  // Fetch Vessel/Voyage options via the SAME Master Job API, keyed off POL/POD + segment.
  loadVesselVoyage(): void {
    const polCode = this.jobForm.get('POL')?.value;
    const podCode = this.jobForm.get('POD')?.value;
    const polSid = this.portSidByCode(polCode);
    const podSid = this.portSidByCode(podCode);
    const segment = this.segmentFromDept();
    if (!polSid || !podSid || !segment) {
      this.vesselVoyageList = [];
      this.buildVesselOptions();
      return;
    }
    this.operationService.getVesselVoyageBasedOnPorts({ POL: polSid, POD: podSid, segment }).subscribe({
      next: (resp: any) => {
        const list = Array.isArray(resp?.data) ? resp.data : [];
        this.vesselVoyageList = list.map((v: any) => ({
          ...v,
          originalETD: v.ETD,
          originalETA: v.ETA,
        }));
        this.afterVesselListLoaded();
      },
      error: () => {
        this.vesselVoyageList = [];
        this.afterVesselListLoaded();
      },
    });
  }

  private afterVesselListLoaded(): void {
    this.buildVesselOptions();
    this.buildVoyageOptions(this.jobForm.get('VesselName')?.value);
    this.evaluateVesselVoyageFreeText();
  }

  // Unique vessels for the Vessel dropdown.
  private buildVesselOptions(): void {
    const seen = new Set<string>();
    const options: any[] = [];
    this.vesselVoyageList.forEach((v) => {
      const name = v.VesselName;
      if (name && !seen.has(name)) {
        seen.add(name);
        options.push({ VesselName: name });
      }
    });
    this.vesselOptions = options;
  }

  // Voyages available for the given vessel.
  private buildVoyageOptions(vesselName: any): void {
    if (!vesselName) {
      this.voyageOptions = [];
      return;
    }
    this.voyageOptions = this.vesselVoyageList.filter((v) => v.VesselName === vesselName && v.VoyageNo);
  }

  // Same as Master Job's evaluateDropdownOrFreeText: if the loaded value isn't in
  // the fetched list, switch that field to manual (free-text) mode automatically.
  private evaluateVesselVoyageFreeText(): void {
    const vessel = this.jobForm.get('VesselName')?.value;
    const voyage = this.jobForm.get('VoyageNo')?.value;
    this.isVesselFreeText = !!vessel && !this.vesselOptions.some((v) => v.VesselName === vessel);
    this.isVoyageFreeText = !!voyage && !this.voyageOptions.some((v) => String(v.VoyageNo) === String(voyage));
  }

  // Refresh vessel options when POL/POD change.
  onPortChange(): void {
    this.loadVesselVoyage();
  }

  // Vessel selected from the dropdown → set name, refresh voyages, clear voyage.
  onVesselChange(item: any): void {
    if (!item) {
      this.jobForm.patchValue({ VesselName: null, VoyageNo: null, ETD: null, ETA: null });
      this.voyageOptions = [];
      return;
    }
    this.jobForm.patchValue({ VesselName: item.VesselName ?? null });
    this.buildVoyageOptions(item.VesselName);
    if (!this.isVoyageFreeText) {
      this.jobForm.patchValue({ VoyageNo: null });
    }
    // If exactly one voyage exists for the vessel, auto-populate it.
    if (this.voyageOptions.length === 1) {
      this.onVoyageChange(this.voyageOptions[0]);
    }
  }

  // Voyage selected → populate VoyageNo, ETD, ETA from the matching vessel/voyage row.
  onVoyageChange(item: any): void {
    if (!item) {
      this.jobForm.patchValue({ VoyageNo: null });
      return;
    }
    this.jobForm.patchValue({
      VoyageNo: item.VoyageNo ?? null,
      ETD: this.toDateInput(item.originalETD ?? item.ETD) ?? this.jobForm.get('ETD')?.value,
      ETA: this.toDateInput(item.originalETA ?? item.ETA) ?? this.jobForm.get('ETA')?.value,
    });
  }

  // Toggle a field between dropdown and manual free-text entry (like Master Job).
  toggleVesselEntry(): void {
    this.isVesselFreeText = !this.isVesselFreeText;
    this.jobForm.get('VesselName')?.reset();
    this.jobForm.get('VoyageNo')?.reset();
    this.voyageOptions = [];
  }

  toggleVoyageEntry(): void {
    this.isVoyageFreeText = !this.isVoyageFreeText;
    this.jobForm.get('VoyageNo')?.reset();
  }

  // Typeahead search: matches Job No or MBL / MAWB No across air + sea.
  private searchJobs(term: string): void {
    const search = String(term || '').trim();
    if (!search) {
      this.jobOptions = [];
      return;
    }
    const params = {
      search,
      CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
      BranchMasterSid: this.currentBranch?.BranchMasterSid,
    };
    this.isSearching = true;
    this.operationService.jobCorrectionSearch(params).subscribe({
      next: (resp: any) => {
        this.isSearching = false;
        const items = Array.isArray(resp?.data) ? resp.data : [];
        this.jobOptions = items.map((it: any) => ({
          ...it,
          displayLabel: this.buildJobLabel(it),
        }));
      },
      error: () => {
        this.isSearching = false;
        this.jobOptions = [];
      },
    });
  }

  private buildJobLabel(it: any): string {
    const jobNo = it?.MasterJobNumber || '';
    const mbl = it?.MBLNo || '';
    return mbl ? `${jobNo} / ${mbl}` : jobNo;
  }

  // Fired when a job is picked from the dropdown.
  onJobSelect(option: any): void {
    if (!option || !option.MasterJobSid) {
      this.clearLoaded();
      return;
    }
    this.isAir = !!option.isAir;
    this.mblLabel = this.isAir ? 'MAWB No' : 'MBL No';
    this.departmentName = option.departmentName || '';
    this.departmentType = option.departmentType || '';
    this.loadJob(option.MasterJobSid, this.isAir);
  }

  private loadJob(id: number, isAir = false): void {
    const payload = {
      MasterJobSid: id,
      screenName: isAir ? 'Master Air Waybill' : 'Master Job',
      CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
      BranchMasterSid: this.currentBranch?.BranchMasterSid,
    };
    this.spinner.show();
    this.operationService.getMasterJobById(payload).subscribe({
      next: (resp: any) => {
        this.spinner.hide();
        if (resp?.status && resp.data) {
          this.masterJobSid = id;
          this.patchValues(resp.data);
          this.hasLoaded = true;
        } else {
          this.appSettingService.showError(resp?.message || 'Error loading master job');
        }
      },
      error: () => {
        this.spinner.hide();
        this.appSettingService.showError('Error loading master job');
      },
    });
  }

  private patchValues(data: any): void {
    this.masterJobNumber = data?.MasterJobNumber || '';
    this.masterMblNo = data?.MBLNo || '';
    const voyage = Array.isArray(data?.voyages) && data.voyages.length ? data.voyages[0] : {};

    this.jobForm.patchValue({
      MasterJobVoyageSid: voyage?.MasterJobVoyageSid ?? null,
      Department: this.departmentName,
      MasterJobDate: this.toDateInput(data?.MasterJobDate),
      POL: data?.POL ?? null,
      POD: data?.POD ?? null,
      VoyageMasterSid: voyage?.VoyageMasterSid ?? null,
      VesselName: voyage?.VesselName ?? null,
      VoyageNo: voyage?.VoyageNo ?? null,
      ETD: this.toDateInput(voyage?.ETD),
      ETA: this.toDateInput(voyage?.ETA),
    });

    this.containers.clear();
    const containerList = Array.isArray(data?.containers) ? data.containers : [];
    containerList.forEach((c: any) => {
      this.containers.push(
        this.fb.group({
          MasterJobContainerSid: [c?.MasterJobContainerSid],
          ContainerNumber: [
            c?.ContainerNumber || '',
            [Validators.required, Validators.maxLength(11), this.containerNumberValidator],
          ],
        }),
      );
    });

    // Filter POL/POD ports for this job's mode (Sea/Air) and load Vessel/Voyage
    // options for the job's ports (same Master Job API).
    this.applyPortFilter();
    this.loadVesselVoyage();
  }

  // Normalises an ISO / Date value to the yyyy-MM-dd string an <input type="date"> expects.
  private toDateInput(value: any): string | null {
    if (!value) return null;
    const d = new Date(value);
    if (isNaN(d.getTime())) return null;
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${month}-${day}`;
  }

  // ----- Container number validation (same ISO 6346 rules as Master Job) -----

  private containerNumberValidator = (control: AbstractControl): ValidationErrors | null => {
    const value = String(control.value || '').toUpperCase().trim();
    if (!value) return null; // 'required' handles empties
    if (value.length !== 11) return { invalidContainerNumber: true };
    return this.validateContainerNumber(value).isValid ? null : { invalidContainerNumber: true };
  };

  // Uppercase + cap at 11 chars while typing, then flag duplicates.
  onContainerInput(index: number, event: any): void {
    const input = String(event?.target?.value || '');
    const upper = input.toUpperCase().substring(0, 11);
    const ctrl = this.containers.at(index).get('ContainerNumber');
    if (ctrl && ctrl.value !== upper) {
      ctrl.setValue(upper);
    }
    this.flagDuplicateContainers();
  }

  // Mark controls that duplicate another container number in the form.
  private flagDuplicateContainers(): void {
    const values = this.containers.controls.map((c) =>
      String(c.get('ContainerNumber')?.value || '').toUpperCase().trim(),
    );
    this.containers.controls.forEach((c, i) => {
      const ctrl = c.get('ContainerNumber');
      if (!ctrl) return;
      const val = values[i];
      const isDup = !!val && values.filter((v) => v === val).length > 1;
      const errors = { ...(ctrl.errors || {}) };
      if (isDup) {
        errors['duplicate'] = true;
        ctrl.setErrors(errors);
      } else if (errors['duplicate']) {
        delete errors['duplicate'];
        ctrl.setErrors(Object.keys(errors).length ? errors : null);
      }
    });
  }

  // ISO 6346 check-digit validation — copied from Master Job entry.
  validateContainerNumber(containerNumber: string): { isValid: boolean; checkDigit?: number } {
    if (!containerNumber || containerNumber.length !== 11) {
      return { isValid: false };
    }
    const charMap: { [key: string]: number } = {
      'A': 10, 'B': 12, 'C': 13, 'D': 14, 'E': 15, 'F': 16, 'G': 17, 'H': 18, 'I': 19,
      'J': 20, 'K': 21, 'L': 23, 'M': 24, 'N': 25, 'O': 26, 'P': 27, 'Q': 28, 'R': 29,
      'S': 30, 'T': 31, 'U': 32, 'V': 34, 'W': 35, 'X': 36, 'Y': 37, 'Z': 38,
    };
    const cleanNumber = containerNumber.toUpperCase().replace(/\s/g, '');
    if (cleanNumber.length !== 11) {
      return { isValid: false };
    }
    const baseNumber = cleanNumber.substring(0, 10);
    const providedCheckDigit = parseInt(cleanNumber.substring(10, 11), 10);
    let sum = 0;
    for (let i = 0; i < 10; i++) {
      const char = baseNumber[i];
      let value: number;
      if (/[A-Z]/.test(char)) {
        value = charMap[char] || 0;
      } else if (/[0-9]/.test(char)) {
        value = parseInt(char, 10);
      } else {
        return { isValid: false };
      }
      sum += value * Math.pow(2, i);
    }
    const remainder = sum % 11;
    const calculatedCheckDigit = remainder === 10 ? 0 : remainder;
    return { isValid: calculatedCheckDigit === providedCheckDigit, checkDigit: calculatedCheckDigit };
  }

  onSubmit(): void {
    if (!this.masterJobSid) {
      this.appSettingService.showError('Select a job first');
      return;
    }
    // Re-check container numbers (format, ISO check digit, duplicates) before saving.
    this.flagDuplicateContainers();
    this.containers.controls.forEach((c) => c.get('ContainerNumber')?.updateValueAndValidity());
    if (this.jobForm.invalid) {
      this.jobForm.markAllAsTouched();
      const hasContainerError = this.containers.controls.some((c) => c.get('ContainerNumber')?.invalid);
      this.appSettingService.showError(
        hasContainerError
          ? 'Invalid or duplicate container number. Use 4 letters + 6 digits + check digit (11 chars).'
          : 'Please fill all the required fields.',
      );
      return;
    }

    const raw = this.jobForm.getRawValue();
    const payload = {
      MasterJobSid: this.masterJobSid,
      MasterJobVoyageSid: raw.MasterJobVoyageSid,
      MasterJobDate: raw.MasterJobDate || null,
      POL: raw.POL,
      POD: raw.POD,
      VoyageMasterSid: raw.VoyageMasterSid,
      VesselName: raw.VesselName,
      VoyageNo: raw.VoyageNo,
      ETD: raw.ETD || null,
      ETA: raw.ETA || null,
      containers: (raw.containers || []).map((c: any) => ({
        MasterJobContainerSid: c.MasterJobContainerSid,
        ContainerNumber: String(c.ContainerNumber || '').trim(),
      })),
      screenName: 'Job Correction',
      CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
      BranchMasterSid: this.currentBranch?.BranchMasterSid,
      updatedBy: this.currUserEmail,
    };

    this.isSaving = true;
    this.spinner.show();
    this.operationService.jobCorrection(payload).subscribe({
      next: (resp: any) => {
        this.isSaving = false;
        this.spinner.hide();
        if (resp?.status) {
          this.appSettingService.showSuccess(resp?.message || 'Job corrected successfully');
          this.loadJob(this.masterJobSid!, this.isAir);
        } else {
          this.appSettingService.showError(resp?.message || 'Failed to correct job');
        }
      },
      error: () => {
        this.isSaving = false;
        this.spinner.hide();
        this.appSettingService.showError('Failed to correct job');
      },
    });
  }

  private clearLoaded(): void {
    this.hasLoaded = false;
    this.masterJobSid = null;
    this.masterJobNumber = '';
    this.masterMblNo = '';
    this.departmentName = '';
    this.isAir = false;
    this.mblLabel = 'MBL / MAWB No';
    this.containers.clear();
    this.jobForm.reset();
  }

  resetSearch(): void {
    this.selectedJobSid = null;
    this.jobOptions = [];
    this.clearLoaded();
  }

  goBack(): void {
    this.router.navigate(['operation']);
  }
}
