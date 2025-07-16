import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder,FormGroup, ReactiveFormsModule, Validators  } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { FeatherModule } from 'angular-feather';

@Component({
  selector: 'app-vendor-tds-entry',
  standalone: true,
  imports: [NgSelectModule,FeatherModule,ReactiveFormsModule,CommonModule],
  templateUrl: './vendor-tds-entry.component.html',
  styleUrl: './vendor-tds-entry.component.scss'
})
export class VendorTdsEntryComponent {
  tdsForm!: FormGroup;

   constructor(private fb: FormBuilder) {}

 ngOnInit(): void {
    this.tdsForm = this.fb.group({
      LedgerName: ['', Validators.required],
      VendorName: ['', Validators.required],
      PlanNO: ['', Validators.required],
      PersonType: ['', Validators.required],
      CountryName: ['', Validators.required],
      Status: [null, Validators.required]
    });
  }

  onSubmit() {
    if (this.tdsForm.invalid) {
      this.tdsForm.markAllAsTouched();
      return;
    }

    console.log('Submitted:', this.tdsForm.value);
  }
   modeOfStatus=[
    {id:"Active",name:"Active"},
    {id:"Suspended",name:"Suspended"},
  ]
  navigateBack() {
    history.back();
  }


  onReset() {
  this.tdsForm.reset();
}

}
