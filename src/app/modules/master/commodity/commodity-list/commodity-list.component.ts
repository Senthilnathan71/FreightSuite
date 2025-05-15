import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { FeatherModule } from 'angular-feather';
import { MasterService } from '../../master.service';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { DeleteWarningComponent } from 'src/app/modules/crm-mobile/delete-warning.component';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';

@Component({
  selector: 'app-commodity-list',
  standalone: true,
  imports: [
    CommonModule, 
    FeatherModule, 
    FormsModule, 
    NgbPaginationModule, 
    RouterModule,
    MatDialogModule
  ],
  templateUrl: './commodity-list.component.html',
  styleUrl: './commodity-list.component.scss'
})
export class CommodityListComponent {
  searchType = 'commodityName';
  filterValue = '';
  results: any[] = [];
  commodityList: any[] = [];
  errorMessage: string = '';
  searchPerformed = false;

  // pagination
  page = 1;
  pageSize = 5;
  totalLengthOfCollection: number = 0;
  loading: boolean = false;

  constructor(
    private masterService: MasterService, 
    private router: Router,
    private route: ActivatedRoute,
    private dialog: MatDialog,
    private appSettingService: AppSettingsService
  ) { }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['refresh']) {
        this.loadCommodities();
      }
    });
    this.loadCommodities();
  }

  loadCommodities() {
    this.loading = true;
    this.masterService.getAllCommodity().subscribe({
      next: (resp: any) => {
        this.results = resp.data || resp;
        this.updatePaginatedData();
        this.totalLengthOfCollection = this.results.length;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading commodities:', err);
        this.appSettingService.showError('Failed to load commodities');
        this.loading = false;
      }
    });
  }

  search() {
    this.filterValue = this.filterValue?.trim();
    
    if (!this.filterValue) {
      this.loadCommodities();
      this.page = 1;
      this.searchPerformed = false;
      return;
    }
    
    const payload = {
      searchType: this.searchType,
      filterValue: this.searchType === 'status' 
        ? this.filterValue === 'Active' ? 'A' : 'I' 
        : this.filterValue,
    }
    
    this.loading = true;
    this.page = 1;
    this.masterService.searchCommodity(payload).subscribe({
      next: (res: any) => {
        this.results = res.data || res;
        this.searchPerformed = true;
        this.updatePaginatedData();
        this.totalLengthOfCollection = this.results.length;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error searching commodities:', err);
        this.appSettingService.showError('Failed to search commodities');
        this.loading = false;
      }
    });
  }

  updatePaginatedData(): void {
    const startIndex = (this.page - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.commodityList = this.results.slice(startIndex, endIndex);
  }

  trackByIndex(index: number, item: any): number {
    return index;
  }

  deleteCommodity(id: number) {
    const dialogRef = this.dialog.open(DeleteWarningComponent);
  
    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        this.loading = true;
        this.masterService.deleteCommodityById(id).subscribe({
          next: (resp: any) => {
            if (resp && (resp.success || resp.status)) {
              this.appSettingService.showSuccess("Commodity deleted successfully!");
              this.loadCommodities();
            } else {
              this.appSettingService.showError(resp.message || "Failed to delete commodity");
            }
            this.loading = false;
          },
          error: (err) => {
            console.error('Error deleting commodity:', err);
            this.appSettingService.showError(err.error?.message || "Failed to delete commodity");
            this.loading = false;
          }
        });
      }
    });
  }

  navigateToCreateCommodity() {
    this.router.navigate(['master/commodity/entry']);
  }

  resetSearch() {
    this.searchType = 'commodityName';
    this.filterValue = '';
    this.searchPerformed = false;
    this.page = 1;
    this.loadCommodities();
  }

  getStatusText(status: string): string {
    return status === 'A' ? 'Active' : 'Inactive';
  }
}