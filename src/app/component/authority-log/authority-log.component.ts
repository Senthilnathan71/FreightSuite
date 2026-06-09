import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { CustomDatePipe } from 'src/app/core/pipes/custom-date-format.pipe';
import { LeadService } from 'src/app/modules/crm-mobile/Services/lead.service';

@Component({
  selector: 'app-authority-log',
  standalone: true,
  imports: [CustomDatePipe,CommonModule],
  templateUrl: './authority-log.component.html',
  styleUrl: './authority-log.component.scss'
})
export class AuthorityLogComponent implements OnInit {
  @Input() documentSid: number;
  @Input() menuMasterSid: number;
  @Input() CompanyMasterSid: number;
  @Input() BranchMasterSid: number;
  @Input() DepartmentMasterSid: number;
  @Input() DepartmentMaster: string;

  isApproved = false;
  approvalLogs: any[] = [];
  waitingMessage = 'Checking approval status...';

  constructor(private modalRef: NgbActiveModal, private leadService : LeadService) {}

  ngOnInit(): void {
    this.fetchApprovalStatus();
  }

  fetchApprovalStatus() {
    this.leadService.getApprovalStatusByMenuAndDocument(
      this.menuMasterSid,
      this.documentSid,
      this.CompanyMasterSid,
      this.BranchMasterSid,
      this.DepartmentMasterSid,
      this.DepartmentMaster
    )
      .subscribe((resp : any) => {
        if (resp.status) {
          this.approvalLogs = resp.data.logData || [];
        }
      });
  }

  closeModal() {
    this.modalRef.close();
  }
}
