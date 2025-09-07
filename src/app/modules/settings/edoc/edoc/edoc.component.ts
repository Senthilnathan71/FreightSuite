import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Optional, Output, SimpleChanges } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
@Component({
  selector: 'app-edoc',
  standalone: true,
  imports: [NgSelectModule, ReactiveFormsModule, CommonModule],
  templateUrl: './edoc.component.html',
  styleUrl: './edoc.component.scss',
})
export class EdocComponent {
  @Input() dataItems: any[] = [];
  @Input() resetTrigger: boolean = false;
  @Input() formData: any = null;
  @Output() dataEmitter = new EventEmitter<any>();
  edocform: FormGroup;

  constructor(private fb: FormBuilder,private appSettingService: AppSettingsService,@Optional() public activeModal: NgbActiveModal ) {
    this.initYearForm();
  }
   ngOnChanges(changes: SimpleChanges) {
    if (changes['resetTrigger'] && this.resetTrigger) {
      this.resetForm();
    }
    
    if (changes['dataItems'] && this.dataItems && this.dataItems.length > 0) {
      // If you need to handle pre-loaded data
    }
  }
  initYearForm() {
    this.edocform = this.fb.group({
      DocuNo: ['', Validators.required],
      Date: ['', Validators.required],
      file: ['', Validators.required],
      Filename: ['', Validators.required],
      Type: ['', Validators.required],
      ReceivedDate: ['', Validators.required],
      SentDate: ['', Validators.required],
      FollowupDate: ['', Validators.required],
      FollowupAction: ['', Validators.required],
      Remarks: [''],
      Status: ['', Validators.required],
    });
  }

   onSubmit() {
    if (this.edocform.invalid) {
      this.edocform.markAllAsTouched();
      this.appSettingService.showWarning('Please fill all the required fields');
      return;
    }
    const formData = this.edocform.value;
    
    this.dataEmitter.emit({
      dataItems: [formData], 
      formData: this.formData
    });
    console.log(this.edocform.value);
  }

  resetForm() {
  this.edocform.reset();
}

  modeOfType = [
    { id: '1', name: 'Type 1' },
    { id: '2', name: 'Type 2' },
  ];

  modeOfStatus = [
    { id: '1', name: 'Active' },
    { id: '2', name: 'Suspended' },
  ];

  closeModal(){
    this.activeModal.close();
  }
}
