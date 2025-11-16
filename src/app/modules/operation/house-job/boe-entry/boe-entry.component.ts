import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output, SimpleChanges } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FeatherModule } from 'angular-feather';
import { OperationService } from '../../operation.service';

@Component({
  selector: 'app-boe-entry',
  standalone:true,
  imports:[
    FeatherModule,
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
  ],
  templateUrl: './boe-entry.component.html',
  styleUrls: ['./boe-entry.component.scss']
})
export class BoeEntryComponent implements OnInit {
  @Input() screenName: string = 'HouseJob';
  @Input() formData: any; // contains HouseJobSid, CompanyMasterSid, etc.
  @Input() resetTrigger: boolean = false;
  @Input() currencyList: any[] = [];
  @Input() customerList: any[] = [];
  @Input() agentList: any[] = [];
  @Input() dataItems: any[] = [];

  @Output() dataEmitter = new EventEmitter<any>();
  @Output() reloadParent = new EventEmitter<any>();

  boeForm!: FormGroup;
  loading = false;

  constructor(private fb: FormBuilder, private boeApi: OperationService) {}

  ngOnInit(): void {
    this.initForm();
  }

ngOnChanges(changes: SimpleChanges): void {
  console.log(changes, 'changes');

  // ✅ Always check for formData
  if (changes['formData']) {
    if (this.formData?.HouseJobSid) {
      console.log('✅ BOE received formData with HouseJobSid:', this.formData.HouseJobSid);
    } else {
      console.warn('⚠️ formData exists but missing HouseJobSid');
    }
  }

  // ✅ If we get new dataItems OR formData, check readiness
  if ((changes['dataItems'] || changes['formData']) && this.dataItems && this.dataItems.length) {
    this.tryPopulateForm();
  }

  // ✅ If reset trigger toggles, clear and repopulate
  if (changes['resetTrigger'] && this.resetTrigger) {
    console.log('🔄 Reset triggered');
    this.initForm();
    if (this.dataItems?.length) this.tryPopulateForm();
  }
}

/** ✅ Safe method to initialize + populate the form only when data is ready */
private tryPopulateForm() {
  // wait until both inputs exist
  if (!this.formData?.HouseJobSid) {
    console.warn('⏳ Waiting for HouseJobSid...');
    return;
  }

  console.log('📦 Populating BOE form with data:', this.dataItems);

  // Initialize form
  this.initForm();

  // Build the rows
  this.dataItems.forEach((item) => {
    this.boeDetails.push(this.createRow(item));
  });

  console.log('✅ BOE form populated with', this.boeDetails.length, 'rows');
}





  get boeDetails(): FormArray {
    return this.boeForm.get('boeDetails') as FormArray;
  }

  initForm() {
  this.boeForm = this.fb.group({
    boeDetails: this.fb.array([])
  });
}


  createRow(data?: any): FormGroup {
    return this.fb.group({
      HouseJobBOESid: [data?.HouseJobBOESid || null],
      CompanyMasterSid: [data?.CompanyMasterSid || this.formData?.CompanyMasterSid],
      HouseJobSid: [this.formData?.HouseJobSid || data?.HouseJobSid],
      DeclarationNo: [data?.DeclarationNo || ''],
      BOENo: [data?.BOENo || ''],
      BOEDate: [data?.BOEDate ? this.formatDate(data.BOEDate) : ''],
      BOEValue: [data?.BOEValue || null],
      BOEInvoiceValue: [data?.BOEInvoiceValue || ''],
      TransactionType: [data?.TransactionType || ''],
      Amount: [data?.Amount || null],
      ProcessDate: [data?.ProcessDate ? this.formatDate(data.ProcessDate) : ''],
      ReceivedDate: [data?.ReceivedDate ? this.formatDate(data.ReceivedDate) : ''],
      AckNo: [data?.AckNumber || ''],
      AckDate: [data?.AckDate ? this.formatDate(data.AckDate) : ''],
      AckStatus: [data?.AckStatus || ''],
      Note: [data?.Remarks || ''],
      isEdit: [false],
      CreatedBy: data?.CreatedBy,
      UpdatedBy: data?.UpdatedBy
    });
  }

  formatDate(date: string) {
    return date ? new Date(date).toISOString().slice(0, 10) : '';
  }

  

  addRow() {
    this.boeDetails.push(this.createRow());
  }

  editRow(i: number) {
    this.boeDetails.at(i).get('isEdit')?.setValue(true);
  }

 saveRow(i: number) {
  const row = this.boeDetails.at(i);
  const value = row.value;

  // ✅ Pull HouseJobSid safely from formData
  const houseJobSid = this.formData?.HouseJobSid;
  const companySid = this.formData?.CompanyMasterSid;

  if (!houseJobSid) {
    console.warn('⚠️ HouseJobSid is missing — cannot create BOE');
    console.log('Current formData:', this.formData);
    return;
  }

  const payload = {
    ...value,
    Sno: i + 1, // 👈 Automatically assign row number before sending
    HouseJobSid: houseJobSid,
    CompanyMasterSid: companySid,
    CreatedBy: this.formData?.CreatedBy || 'admin',
    Remarks: value.Note,
    AckNumber: value.AckNo,
  };

  // ✅ Update
  if (value.HouseJobBOESid) {
    this.boeApi.updateBoeById(value.HouseJobBOESid, payload).subscribe({
      next: (resp: any) => {
        row.patchValue({ isEdit: false });
        this.dataEmitter.emit(this.boeDetails.value);
      },
      error: (err) => console.error('Error updating BOE:', err)
    });
  } 
  // ✅ Create
  else {
    this.boeApi.createBoe(payload).subscribe({
      next: (resp: any) => {
        const created = resp?.data || resp;
        const newId = created?.HouseJobBOESid ?? null;

        if (newId) {
          row.patchValue({ HouseJobBOESid: newId, isEdit: false });
        }
        this.dataEmitter.emit(this.boeDetails.value);
      },
      error: (err) => console.error('Error creating BOE:', err)
    });
  }
}



  removeRow(i: number) {
    const row = this.boeDetails.at(i);
    const id = row.get('HouseJobBOESid')?.value;
    if (id) {
      this.boeApi.deleteBoeById(id).subscribe({
        next: () => {
          this.boeDetails.removeAt(i);
          this.dataEmitter.emit(this.boeDetails.value);
        },
        error: (err) => console.error(err)
      });
    } else {
      this.boeDetails.removeAt(i);
      this.dataEmitter.emit(this.boeDetails.value);
    }
  }
}
