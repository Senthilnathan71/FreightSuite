import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { NgbDatepickerModule } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { FeatherModule } from 'angular-feather';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-journal-voucher-entry',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NgbDatepickerModule,
    FeatherModule,
    NgSelectModule,
  ],
  templateUrl: './journal-voucher-entry.component.html',
  styles: [``],
})
export class JournalVoucherEntryComponent implements OnInit {
  constructor(private router: Router, private fb: FormBuilder) {}

  status = [
    { id: 'A', name: 'Active' },
    { id: 'S', name: 'Suspended' },
  ];


  form = this.fb.group({
    voucherNo: [''],
    voucherDate: [''],
    postedOn: [''],
    postedStatus: [''],
    remarks: [''],
    status: [''],
    journal: this.fb.array([]),
  });

  
  get journal() {
    return this.form.get('journal') as FormArray;
  }

  ngOnInit(): void {

    this.addDetails();
  }

  // Add a new journal entry row
  addDetails() {
    const row = this.fb.group({
      subledger: [''],
      ledger: [''],
      currency: [''],
      exRate: [''],
      currAmt: [''],
      localAmt: [''],
      drCr: [''],
      narration: [''],
      dept: [''],
      charge: [''],
      hssac: [''],
      houseJob: [''],
      masterJob: [''],
      tax: [''],
      taxAmt: [''],
      costCenter: [''], 
      profitCenter: [''],
    });

    this.journal.push(row);
  }

  deleteRow(index: number) {
    this.journal.removeAt(index);
  }


  navigateToBack() {
    this.router.navigate(['accounts/journal-voucher/list']);
  }
}
