import { Component, ViewChild, TemplateRef } from '@angular/core';
import { NgbDatepickerModule, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { FeatherModule } from 'angular-feather';

@Component({
  selector: 'app-connection',
  standalone: true,
  imports: [NgSelectModule, NgbDatepickerModule, FeatherModule],
  templateUrl: './connection.component.html',
  styleUrl: './connection.component.scss',
})
export class ConnectionComponent {

  typeofmodes = [
    { id: 1, name: 'Sea' },
    { id: 2, name: 'Air' },
    { id: 3, name: 'Road' },
  ];

  modeOfStatus = [
    { id: 1, name: 'Active' },
    { id: 2, name: 'Suspended' },
  ];
  @ViewChild('connectionModal') connectionModal!: TemplateRef<any>;

  constructor(private modalService: NgbModal) {}
  
  openConnectionModal(content: any) {
    this.modalService.open(content, {
      size: 'lg',
      backdrop: 'static',
      centered: true,
    });
  }
}
