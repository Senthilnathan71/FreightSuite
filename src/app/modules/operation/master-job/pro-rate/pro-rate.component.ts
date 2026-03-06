import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { NgbDate, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { CustomDatePipe } from 'src/app/core/pipes/custom-date-format.pipe';
// import { OperationService } from '../operation.service';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { SearchableDropdown } from 'src/app/component/searchable-dropdown/searchable-dropdown.component';
import { NgbDatepickerModule } from '@ng-bootstrap/ng-bootstrap';
import { FeatherModule } from 'angular-feather';
@Component({
  selector: 'app-pro-rate',
  standalone: true,
  imports: [CommonModule,
    FormsModule,
    NgxSpinnerModule,
    CustomDatePipe, SearchableDropdown,NgbDatepickerModule, FeatherModule,],
  providers: [CustomDatePipe],
  templateUrl: './pro-rate.component.html',
  styles: ``
})
export class ProRateComponent {


  constructor(
    private route: ActivatedRoute,
    private router: Router,
    // private operationService: OperationService,
    private appSettingService: AppSettingsService,
    private spinner: NgxSpinnerService,
    private datePipe: CustomDatePipe,
    private modalService: NgbModal
  ) { }


}
