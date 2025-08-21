import { Component, TemplateRef, ViewChild } from '@angular/core';
import { NgbDatepickerModule, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { FeatherModule } from 'angular-feather';

@Component({
  selector: 'app-milestone',
  standalone: true,
  imports: [NgbDatepickerModule, FeatherModule],
  templateUrl: './milestone.component.html',
  styleUrl: './milestone.component.scss',
})
export class MilestoneComponent {
  @ViewChild('milestoneModal') milestoneModal!: TemplateRef<any>;
  constructor(private modalService: NgbModal) {}

  openMilestoneModal() {
    this.modalService.open(this.milestoneModal, {
      size: 'lg',
      backdrop: 'static',
      centered: true,
    });
  }
}
