import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { FeatherModule } from 'angular-feather';
import { MasterService } from '../../master.service';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { DeleteWarningComponent } from 'src/app/modules/crm-mobile/delete-warning.component';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { AppService } from 'src/app/service/app.service';

@Component({
  selector: 'app-port-master-list',
  standalone: true,
  imports: [
    CommonModule, 
    FeatherModule, 
    FormsModule, 
    NgbPaginationModule, 
    RouterModule,
    MatDialogModule
  ],
  templateUrl: './post-master-list.component.html',
  styleUrl: './post-master-list.component.scss'
})
export class PostMasterListComponent {
  searchType = 'PortName';
  filterValue = '';
  results: any[] = [];
  portList: any[] = [];
  errorMessage: string = '';
  searchPerformed = false;
  isMobile: boolean = false;

  // pagination
  page = 1;
  pageSize = 5;
  totalLengthOfCollection: number = 0;
  loading: boolean = false;

  constructor(
    private masterService: MasterService, 
    private router: Router,
    private appService: AppService,
    private dialog: MatDialog,
    private appSettingService: AppSettingsService
  ) { }

  ngOnInit() {
    this.loadPorts();
    this.isMobile = this.appService.getDevice();
  }

  loadPorts() {
    this.loading = true;
    this.masterService.getAllPorts().subscribe({
      next: (resp: any) => {
        this.results = resp.data || resp;
        this.updatePaginatedData();
        this.totalLengthOfCollection = this.results.length;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading ports:', err);
        this.appSettingService.showError('Failed to load ports');
        this.loading = false;
      }
    });
  }

  search() {
    this.filterValue = this.filterValue?.trim();
    
    if (!this.filterValue) {
      this.loadPorts();
      this.page = 1;
      this.searchPerformed = false;
      return;
    }
    
    const payload = {
      searchType: this.searchType,
      filterValue: this.searchType === 'status' 
        ? this.filterValue === 'Active' ? 'A' : 'C' 
        : this.filterValue,
    }
    
    this.loading = true;
    this.page = 1;
    this.masterService.searchPortList(payload).subscribe({
      next: (res: any) => {
        this.results = res.data || res;
        this.searchPerformed = true;
        this.updatePaginatedData();
        this.totalLengthOfCollection = this.results.length;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error searching ports:', err);
        this.appSettingService.showError('Failed to search ports');
        this.loading = false;
      }
    });
  }

  updatePaginatedData(): void {
    const startIndex = (this.page - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.portList = this.results.slice(startIndex, endIndex);
  }

  trackByIndex(index: number, item: any): number {
    return index;
  }

  deletePort(id: number) {
    const dialogRef = this.dialog.open(DeleteWarningComponent);

    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        this.masterService.deletePortById(id).subscribe((resp: any) => {

          this.appSettingService.showSuccess("Deleted!");
          console.log(resp);
          // if(resp.status){
          this.loadPorts();

          // }

        });
      }
    });
  }
  
  navigateToCreatePort() {
    this.router.navigate(['master/port-master/view']);
  }

  resetSearch() {
    this.searchType = 'PortName';
    this.filterValue = '';
    this.searchPerformed = false;
    this.page = 1;
    this.loadPorts();
  }

  getStatusText(status: string): string {
    return status === 'A' ? 'Active' : 'Cancelled';
  }
}