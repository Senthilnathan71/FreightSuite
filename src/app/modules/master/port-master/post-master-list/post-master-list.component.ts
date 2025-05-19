import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { FeatherModule } from 'angular-feather';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MasterService } from '../../master.service';
import { DeleteWarningComponent } from 'src/app/modules/crm-mobile/delete-warning.component';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';

@Component({
  selector: 'app-post-master-list',
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
  styleUrls: ['./post-master-list.component.scss']
})
export class PostMasterListComponent implements OnInit {
  // search controls
  searchType = 'PortName';
  filterValue = '';
  searchPerformed = false;

  // raw + paged data
  results: any[] = [];
  portList: any[] = [];
  totalLengthOfCollection = 0;

  // pagination
  page = 1;
  pageSize = 10;

  // lookup arrays
  countryOptions: any[] = [];
  sectorOptions: any[] = [];

  constructor(
    private masterService: MasterService,
    private router: Router,
    private dialog: MatDialog,
    private appSettingService: AppSettingsService
  ) { }

  ngOnInit(): void {
    this.loadMasterData();
  }

  /** Load all countries and sectors for lookup */
  loadMasterData(): void {
    this.masterService.getAllCountry().subscribe(countries => {
      this.countryOptions = countries.data || countries;
    });

    this.masterService.getAllSector().subscribe(sectors => {
      this.sectorOptions = sectors.data || sectors;
    });
  }

  /** Triggered when user clicks “Search” */
  search(): void {
    const payload = {
      searchType:
        this.searchType === 'countryName'
          ? 'CountryMasterSid'
          : this.searchType === 'sectorName'
            ? 'SectorMasterSid'
            : this.searchType,
      filterValue:
        this.searchType === 'status'
          ? this.filterValue === 'Active' ? 'A' : 'I'
          : this.filterValue
    };

    this.masterService.searchPortList(payload).subscribe(res => {
      // some APIs wrap in .data
      const items = Array.isArray(res) ? res : res.data || [];
      this.results = items.map((port: any) => {
        const country = this.countryOptions.find(c => c.CountryMasterSid === port.CountryMasterSid);
        const sector = this.sectorOptions.find(s => s.SectorMasterSid === port.SectorMasterSid);

        return {
          ...port,
          countryName: country?.countryName || '—',
          sectorName: sector?.sectorName || '—',
          statusText: port.status === 'A' ? 'Active' : 'Cancelled'
        };
      });

      this.searchPerformed = true;
      this.totalLengthOfCollection = this.results.length;
      this.page = 1;
      this.updatePaginatedData();
    });
  }

  /** Slice results for current page */
  updatePaginatedData(): void {
    const start = (this.page - 1) * this.pageSize;
    this.portList = this.results.slice(start, start + this.pageSize);
  }

  trackByIndex(_: number, __: any): number {
    return _;
  }

  deletePort(id: number): void {
    this.dialog.open(DeleteWarningComponent)
      .afterClosed()
      .subscribe(confirmed => {
        if (!confirmed) return;
        this.masterService.deletePortById(id).subscribe(() => {
          this.appSettingService.showSuccess('Deleted!');
          this.search();
        });
      });
  }

  navigateToCreatePort(): void {
    this.router.navigate(['master/port-master/view']);
  }

  resetPage(): void {
    this.page = 1;
    this.filterValue = '';
    this.searchPerformed = false;
    this.results = [];
    this.portList = [];
    this.totalLengthOfCollection = 0;
  }
  report() { }
}
