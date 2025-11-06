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
@Component({
  selector: 'app-network-entry',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgSelectModule,SearchableDropdown],
  templateUrl: './network-entry.component.html',
  styles: ``,
})
export class NetworkEntryComponent {
  countryResults: Country[];
    countryLookupConfig = DROPDOWN_CONFIGS.COUNTRY;
  constructor(public dropdownStore: DropdownStore,     private fb: FormBuilder,
      private masterService: MasterService,) {
    this.networkForm = this.fb.group({
      networks: this.fb.array([]),
    });
    effect(() => {
      const countryData = this.dropdownStore.countries();
      this.countryResults = countryData;
    });
  }

  networkForm!: FormGroup;

  statusOptions = [
    { id: 'A', name: 'Active' },
    { id: 'S', name: 'Suspend' },
  ];

  ngOnInit(): void {
		this.loadAllFields();
	}
  networkType = [
    { id: 1, name: 'Forwarders' },
    { id: 2, name: 'Carrier' },
    { id: 3, name: 'Agents' },
    { id: 4, name: 'Liner' },
    { id: 5, name: 'NVOCC' },
    { id: 6, name: 'Feeder' },
  ];

  countryList = [
    { id: 1, name: 'India' },
    { id: 2, name: 'USA' },
    { id: 3, name: 'UK' },
  ];

  get networkArray(): FormArray {
    return this.networkForm.get('networks') as FormArray;
  }

  addNetwork() {
    const networkGroup = this.fb.group({
      name: [''],
      CountryMasterSid: [],
      type: [1],
      status: ['A'],
    });
    this.networkArray.push(networkGroup);
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
  
      // this.currencyResults = (this.dropdownStore.currencies() || []).map(c => ({...c,Country : c.countryMaster?.countryName}));
    }

}
