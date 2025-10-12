import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { NgbDatepickerModule } from '@ng-bootstrap/ng-bootstrap';
import { FeatherModule } from 'angular-feather';

@Component({
  selector: 'app-receipt-entry',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgbDatepickerModule, FeatherModule],
  templateUrl: './receipt-entry.component.html',
  styleUrl: './receipt-entry.component.scss'
})
export class ReceiptEntryComponent {
 tabs = [
  { name: 'Detail', icon: 'fas fa-address-card' },
  { name: 'Voucher', icon: 'fas fa-code-branch' },
  { name: 'Interbranch', icon: 'fas fa-flag-checkered' }
];

  selectTab(tab: string) {
    this.selectedTab = tab;
  }
  selectedTab = 'Detail';
  receiptForm: FormGroup;
  activeTab: 'detail' | 'voucher' | 'voucher' = 'detail';

  constructor(private fb: FormBuilder) {
    this.receiptForm = this.fb.group({
      bank: [''],
      party: [''],
      currency: [''],
      exchangeRate: [],
      Receipt_no: [''],
      Receipt_date: [''],
      inst_mode: [''],
      inst_no: [''],
      address: [''],
      gst_no: [''],
      narration: [''],
      remarks: [''],
      details: this.fb.array([]),
      vouchers: this.fb.array([]),
      interBranches: this.fb.array([])
    });

    // this.addDetail();
    this.addVoucher();
    this.addInterBranch(); // 👈 initialize with default rows
  }

  // === getters ===
  get details(): FormArray {
    return this.receiptForm.get('details') as FormArray;
  }
  get vouchers(): FormArray {
    return this.receiptForm.get('vouchers') as FormArray;
  }
  get interBranches(): FormArray {
    return this.receiptForm.get('interBranches') as FormArray;
  }

  // === detail methods ===
  addDetail() {
    this.details.push(this.fb.group({
      ledgerName: [''],
      branch: [''],
      drCr: [''],
      curr: ['INR'],
      exRate: [1],
      currAmt: [0],
      localAmt: [0],
      narration: [''],
      costCenter: [''],
      profitCenter: [''],
      charge: [''],
      master: [''],
      house: ['']
    }));
  }

  removeDetail(index: number) {
    this.details.removeAt(index);
  }

  // === voucher methods ===
  addVoucher() {
    this.vouchers.push(this.fb.group({
      voucherNo: [''],
      voucherType: [''],
      voucherDate: [''],
      drCr: [''],
      curr: ['INR'],
      exRate: [1],
      currAmt: [0],
      localAmt: [0],
      osCurrAmt: [0],
      osLocalAmt: [0],
      matchCurr: ['INR'],
      matchExRate: [1],
      matchCurrAmt: [0],
      matchLocalAmt: [0],
      tdsAmt: [0]
    }));
  }

  // === inter branch methods ===
  addInterBranch() {
    this.interBranches.push(this.fb.group({
      branch: [''],
      currAmt: [0],
      interBranchJV: [''],
      voucherType: ['']
    }));
  }

  removeInterBranch(index: number) {
    this.interBranches.removeAt(index);
  }
}
