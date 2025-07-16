import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgbModal, NgbModalModule, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { FeatherModule } from 'angular-feather';
import { FavoriteStarComponent } from 'src/app/component/favourite/favourite.component';

@Component({
  selector: 'app-ledger-mapping',
  standalone: true,
  imports: [
    FavoriteStarComponent,
    NgbModalModule,
    FeatherModule,
    ReactiveFormsModule,
    NgSelectModule
  ],
  templateUrl: './ledger-mapping.component.html',
  styleUrl: './ledger-mapping.component.scss'
})
export class LedgerMappingComponent {
  modalRef!: NgbModalRef;
  ledgerForm!: FormGroup;

  constructor(private modalService: NgbModal, private fb: FormBuilder) {}



   modeOfStatus=[
    {id:"Active",name:"Active"},
    {id:"Suspended",name:"Suspended"},
  ]
  openModal(content: any): void {
    this.initForm(); 
    this.modalRef = this.modalService.open(content, {
      centered: true,
      size: 'lg',
      backdrop: 'static'
    });
  }

  initForm(): void {
    this.ledgerForm = this.fb.group({
      Name: ['', Validators.required],
      Code: ['', Validators.required],
      Remarks:['']
    });
  }

  onSubmit() {
    if (this.ledgerForm.invalid) {
      this.ledgerForm.markAllAsTouched();
      return;
    }

    console.log('Form Submitted:', this.ledgerForm.value);
    this.modalRef.close();
  }
}
