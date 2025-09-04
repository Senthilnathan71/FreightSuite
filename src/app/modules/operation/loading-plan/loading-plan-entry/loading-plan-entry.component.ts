import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { FeatherModule } from 'angular-feather';

@Component({
  selector: 'app-loading-plan-entry',
  standalone: true,
  imports: [
    NgSelectModule,
    FeatherModule,
    FormsModule,
    ReactiveFormsModule,
    CommonModule,
  ],
  templateUrl: './loading-plan-entry.component.html',
  styleUrl: './loading-plan-entry.component.scss',
})
export class LoadingPlanEntryComponent {
  isLoadChecked = false;
  loadingPlanForm: FormGroup;
  constructor(private fb: FormBuilder, private modalService: NgbModal) {}

  ngOnInit() {
    this.onInitForm();
  }
  onInitForm() {
    this.loadingPlanForm = this.fb.group({
      dept: ['', Validators.required],
      pol: ['', Validators.required],
      pod: ['', Validators.required],
      vesselVoyage: ['', Validators.required],
      carrier: [''],
      pkg: [''],
      weight: [''],
      cbm: [''],
      totalPkg: ['0'],
      totalGrossWeight: ['0'],
      totalNetWeight: ['0'],
      totalRevenue: ['0'],
      totalCost: ['0'],
      gp: ['0'],
      gpPercent: ['0'],
      load: [false],
    });
  }

  selectedTab = 'Container';
  selectTab(tab: string) {
    this.selectedTab = tab;
  }

  tabs = [{ name: 'Container', icon: 'fas fa-box' }];

  toggleLoad(event: any) {
    this.isLoadChecked = event.target.checked;
  }

  openContainerModal(content: any) {
    this.modalService.open(content, { centered: true, size: 'lg' });
  }

  onSubmit() {
    if (this.loadingPlanForm.invalid) {
      this.loadingPlanForm.markAllAsTouched();
      return;
    }
    console.log(this.loadingPlanForm.value);
  }

  onReset() {
    this.loadingPlanForm.reset({
      load: false,
    });
    this.isLoadChecked = false;
  }
}
