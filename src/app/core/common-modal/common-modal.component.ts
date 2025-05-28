import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-common-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './common-modal.component.html',
  styleUrls: ['./common-modal.component.scss']
})
export class CommonModalComponent {
  @Input() title: string = 'Message';
  @Input() message: string = '';
  @Input() isError: boolean = false; // To differentiate between success and error
  @Input() icon: string = ''; // Icon class


  constructor(public activeModal: NgbActiveModal) { }
}
