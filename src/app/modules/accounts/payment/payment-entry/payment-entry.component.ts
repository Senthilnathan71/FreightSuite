import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { NgbDatepickerModule } from '@ng-bootstrap/ng-bootstrap';
import { FeatherModule } from 'angular-feather';

@Component({
  selector: 'app-payment-entry',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgbDatepickerModule, FeatherModule],
  templateUrl: './payment-entry.component.html',
  styles: ``
})
export class PaymentEntryComponent {
  form!: FormGroup;

  constructor(private fb: FormBuilder) { }
  tab = [
    { name: "Detail", icon: "fas fa-file-alt" },              // For details/info
    { name: "TDS", icon: "fas fa-file-invoice-dollar" },      // For tax/TDS section
    { name: "Voucher", icon: "fas fa-receipt" },              // For voucher section
    { name: "Interbranch", icon: "fas fa-exchange-alt" }      // For inter-branch transactions
  ];


  selectTab(tab: string) {
    this.selectedTab = tab;
  }
  selectedTab = this.tab[0].name;
  ngOnInit(): void {

  }

  submit() {
    console.log(this.form.value);
  }
}
