import { Component } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { NgbDatepickerModule } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { FeatherModule } from 'angular-feather';

@Component({
  selector: 'app-follow-up',
  standalone: true,
  imports: [
    NgSelectModule,
    NgbDatepickerModule,
    FeatherModule,
    FormsModule,
    ReactiveFormsModule,
  ],
  templateUrl: './follow-up.component.html',
  styleUrl: './follow-up.component.scss',
})
export class FollowUpComponent {

  followupForm!: FormGroup;

  modeOfStatus = [
    { id: 'A', name: 'Active' },
    { id: 2, name: 'Suspended' },
  ];

  constructor(private fb: FormBuilder) {}
  ngOnInit(): void {
    this.initForm();
  }

  initForm() {
    this.followupForm = this.fb.group({
      followuprequired: [false], 
      FollowUpDate: ['', Validators.required], 
      FollowupAction: ['', Validators.required], 
      Remarks: [''], 
      Public: [false], 
      SentEmailSignature: [false], 
      Status: ['', Validators.required], 
    });
  }

 
  onSave() {
    if (this.followupForm.valid) {
      console.log('Form Data:', this.followupForm.value);
    } else {
      this.followupForm.markAllAsTouched();
    }
  }

  resetform(){
    this.followupForm.reset()
  }
}
