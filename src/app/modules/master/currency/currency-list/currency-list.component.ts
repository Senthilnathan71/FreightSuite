import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Router, RouterModule } from '@angular/router';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { FeatherModule } from 'angular-feather';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { DeleteWarningComponent } from 'src/app/modules/crm-mobile/delete-warning.component';
import { MasterService } from '../../master.service';


@Component({
  selector: 'app-currency-list',
  standalone: true,
  imports: [
    CommonModule,
    FeatherModule,
    FormsModule,
    NgbPaginationModule,
    RouterModule
  ],
  templateUrl: './currency-list.component.html',
  styleUrl: './currency-list.component.scss'
})
export class CurrencyListComponent {
  searchType = 'currencyName';
  filterValue = '';
  results: any[] = [];
  currencyList: any[] = [];
  searchPerformed = false;

  // pagination
  page = 1;
  pageSize = 10;
  totalLengthOfCollection: number;

  constructor(
    private masterService: MasterService,
    private router: Router,
    private appSettingService: AppSettingsService,
    private dialog: MatDialog
  ) { }

  ngOnInit() { }

  search() {
    const payload = {
      searchType: this.searchType,
      filterValue: this.searchType === 'status'
        ? this.filterValue === 'Active' ? 'A' : 'S'
        : this.filterValue,
    }
    this.masterService.searchCurrencyList(payload).subscribe((res: any) => {
      this.results = res;
      this.searchPerformed = true;
      this.updatePaginatedData();
      this.totalLengthOfCollection = this.results.length || 0;
    });
  }

  updatePaginatedData(): void {
    const startIndex = (this.page - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.currencyList = this.results.slice(startIndex, endIndex);
  }

  trackByIndex(index: number, item: any): number {
    return index;
  }

  deleteCurrency(id: number) {
    const dialogRef = this.dialog.open(DeleteWarningComponent);
    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        this.masterService.softDelete(id).subscribe((resp: any) => {
          this.appSettingService.showSuccess("Deleted!");
          this.search(); // Refresh the list after deletion
        });
      }
    });
  }

  navigateToCreateCurrency() {
    this.router.navigate(['master/currency/entry']);
  }

  resetPage() {
    this.currencyList = [];
    this.totalLengthOfCollection = 0;
    this.searchPerformed = false;
    this.filterValue = '';
  }

  report() { }

  getStatusText(status: string): string {
    return status === 'A' ? 'Active' : 'Suspended';
  }
}
