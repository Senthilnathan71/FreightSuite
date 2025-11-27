import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { NgbDatepickerModule } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { FeatherModule } from 'angular-feather';
import { CommonModule } from '@angular/common';
import { DateTimePickerComponent } from 'src/app/component/datetimepicker/datetimepicker.component';

@Component({
  selector: 'app-voucher-matching-entry',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NgbDatepickerModule,
    FeatherModule,
    NgSelectModule,
    DateTimePickerComponent
  ],
  templateUrl: './voucher-matching-entry.component.html',
  styles: ``,
})
export class VoucherMatchingEntryComponent implements OnInit {
  constructor(private router: Router, private fb: FormBuilder) {}

    tab = [
  { name: "Inter Branch"},
  { name: "Ex.JV"},
  {name:"TDS"}
];
  // dropdown sample
  status = [
    { id: 'A', name: 'Active' },
    { id: 'S', name: 'Suspended' },
  ];

    selectTab(tab: string) {
  this.selectedTab = tab;
}


selectedTab = this.tab[0].name;

  // main form
  form = this.fb.group({
    MatchingNo: [''],
    MatchingDate: [''],
    Ledger: [''],
    SubLedger: [''],
    PostedDate: [''],
    status: [''],
    voucherMatching: this.fb.array([]),
  });

  // getter
  get voucherMatching() {
    return this.form.get('voucherMatching') as FormArray;
  }

  ngOnInit(): void {
    // add one default row
    this.addDetails();
  }

  // add row
  addDetails() {
    const row = this.fb.group({
      branch: [''],
      ledger: [''],
      voucherNo: [''],
      voucherType: [''],
      voucherDate: [''],
      drCr: [''],
      curr: [''],
      exRate: [''],
      currAmt: [''],
      localAmt: [''],
      osCurrAmt: [''],
      osLocalAmt: [''],
      matchCurr: [''],
      matchExRate: [''],
      matchCurrAmt: [''],
      matchLocalAmt: [''],
      tdsAmt: [''],
      balance: [''],
    });

    this.voucherMatching.push(row);
  }

  // add inter brsnch row details

  addInterBranch() {
    const row = this.fb.group({
      branch:[],
      curAmt:[],
      interBranch:[],
      voucherType:[]
    });
    this.voucherMatching.push(row);
  }

  // delete row
  deleteRow(index: number) {
    this.voucherMatching.removeAt(index);
  }

  // back navigation
  navigateToBack() {
    // this.router.navigate(['accounts/journal-voucher/list']);
  }
}
