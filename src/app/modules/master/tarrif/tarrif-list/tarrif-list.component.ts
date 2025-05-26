import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FeatherModule } from 'angular-feather';
import { MasterService } from '../../master.service';
import { MatDialog } from '@angular/material/dialog';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { Tariff } from 'src/app/modules/crm-mobile/Interfaces/tariff.interface';
import { Router, RouterModule } from '@angular/router';
import { DeleteWarningComponent } from 'src/app/modules/crm-mobile/delete-warning.component';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-tarrif-list',
  standalone: true,
  imports: [
    FeatherModule,
    CommonModule,
    FormsModule,
    RouterModule,
    NgbPaginationModule
  ],
  templateUrl: './tarrif-list.component.html',
  styleUrl: './tarrif-list.component.scss'
})
export class TarrifListComponent implements OnInit {

  searchType: string = "POLTerminal";
  filterValue: string;
  results: Tariff[];
  tariffList: any[];
  searchPerformed : boolean;

  // pagination values
  page = 1;
  pageSize = 10;
  totalNumberOfCollection: number;


  constructor(
    private masterServ: MasterService,
    private dialog: MatDialog,
    private appSettingServ: AppSettingsService,
    private router: Router
  ) { }

  ngOnInit() {
   }

  search() {
    const intFields = ['Carrier', 'AgentSid'];
    const payload = {
      searchType: this.searchType,
      filterValue: intFields.includes(this.searchType) ? Number(this.filterValue) : this.filterValue
    }
    this.masterServ.searchTariff(payload).subscribe(
      (res) => {
        this.results = res.data;
        this.searchPerformed = true;
        this.updatePaginationData();
        this.totalNumberOfCollection = this.results.length || 0;
      }
    )
  }

  updatePaginationData() {
    let start = (this.page - 1) * this.pageSize;
    let end = start + this.pageSize;
    this.tariffList = this.results.slice(start, end)
  }

  trackByIndex(index: number, item: any): number {
    return index;
  }

  deleteTariff(TariffHeaderSid) {
    const dialogRef = this.dialog.open(DeleteWarningComponent);
    dialogRef.afterClosed().subscribe((res) => {
      if (res) {
        this.masterServ.deleteTariffById(TariffHeaderSid).subscribe(
          (resp: any) => {
            this.appSettingServ.showSuccess("Deleted!");
            // this.router.navigate([`master/tarrif/list`]);
            this.search()
          });
      }
    })
  }

  navigateToCreateTariff() {
    this.router.navigate(['master/tarrif/entry']);
  }

  report() { }

  reset() {
    this.tariffList = [];
    this.searchPerformed = false;
    this.totalNumberOfCollection = 0;
  }

}
