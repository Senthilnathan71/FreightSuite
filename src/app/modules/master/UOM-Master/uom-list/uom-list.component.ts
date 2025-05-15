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
import { AppService } from 'src/app/service/app.service';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-uom-list',
  standalone: true,
  imports: [
    CommonModule, 
    FeatherModule, 
    FormsModule, 
    NgbPaginationModule, 
    RouterModule,
    MatDialogModule,
    MatButtonModule
  ],
  templateUrl: './uom-list.component.html',
  styleUrl: './uom-list.component.scss'
})
export class UOMListComponent {
  searchType = 'UOMName';
  filterValue = '';
  results: any[] = [];
  uomList: any[] = [];
  errorMessage: string = '';
  searchPerformed = false;

  // pagination
  page = 1;
  pageSize = 5;
  totalLengthOfCollection: number = 0;
  loading: boolean = false;
  isMobile: boolean = false;

  constructor(
    private masterService: MasterService, 
    private router: Router,
    private route: ActivatedRoute,
    private dialog: MatDialog,
    private appSettingService: AppSettingsService,
    private appService: AppService
  ) { }

  ngOnInit() {
    this.isMobile = this.appService.getDevice();
    this.route.queryParams.subscribe(params => {
      if (params['refresh']) {
        this.loadUom();
      }
    });
    this.loadUom();
  }

  loadUom() {
    this.loading = true;
    this.masterService.getAllUom().subscribe({
      next: (resp: any) => {
        this.results = resp.data || resp;
        this.updatePaginatedData();
        this.totalLengthOfCollection = this.results.length;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading UOM:', err);
        this.appSettingService.showError('Failed to load UOM');
        this.loading = false;
      }
    });
  }

  search() {
    this.filterValue = this.filterValue?.trim();
    
    if (!this.filterValue) {
      this.loadUom();
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
    this.masterService.searchUomList(payload).subscribe({
      next: (res: any) => {
        this.results = res.data || res;
        this.searchPerformed = true;
        this.updatePaginatedData();
        this.totalLengthOfCollection = this.results.length;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error searching UOM:', err);
        this.appSettingService.showError('Failed to search UOM');
        this.loading = false;
      }
    });
  }

  updatePaginatedData(): void {
    const startIndex = (this.page - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.uomList = this.results.slice(startIndex, endIndex);
  }

  trackByIndex(index: number, item: any): number {
    return index;
  }

  deleteUom(id: number) {
    const dialogRef = this.dialog.open(DeleteWarningComponent);

    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        this.masterService.deleteUomById(id).subscribe((resp: any) => {

          this.appSettingService.showSuccess("Deleted!");
          console.log(resp);
          // if(resp.status){
          this.loadUom();

          // }

        });
      }
    });
  }

  createNew() {
    this.router.navigate(['master/uom-master/view']);
  }

  resetSearch() {
    this.searchType = 'UOMName';
    this.filterValue = '';
    this.searchPerformed = false;
    this.page = 1;
    this.loadUom();
  }

  getStatusText(status: string): string {
    return status === 'A' ? 'Active' : 'Inactive';
  }
}