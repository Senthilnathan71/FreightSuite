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
  selector: 'app-charge-list',
  standalone: true,
  imports: [
    CommonModule,
    FeatherModule,
    FormsModule,
    NgbPaginationModule,
    RouterModule,
    MatDialogModule
  ],
  templateUrl: './charge-list.component.html',
  styleUrls: ['./charge-list.component.scss']
})
export class ChargeListComponent implements OnInit {
  // search controls
  searchType = 'chargeName';
  filterValue = '';
  searchPerformed = false;

  // raw + paged data
  results: any[] = [];
  chargeList: any[] = [];
  totalLengthOfCollection = 0;

  // pagination
  page = 1;
  pageSize = 10;

  // lookup arrays
  chargeGroupOptions: any[] = [];
  companyOptions: any[] = [];
  currencyOptions: any[] = [];
  departmentOptions: any[] = [];
  uomOptions: any[] = [];
  tdsOptions: any[] = [];

  constructor(
    private masterService: MasterService,
    private router: Router,
    private dialog: MatDialog,
    private appSettingService: AppSettingsService
  ) { }

  ngOnInit(): void {
    this.loadMasterData();
  }

  /** Load all lookup data */
  loadMasterData(): void {
    this.masterService.getAllChargeGroups().subscribe(groups => {
      this.chargeGroupOptions = groups;
    });

    this.masterService.getAllCompanies().subscribe(companies => {
      this.companyOptions = companies;
    });

    this.masterService.getAllCurrencies().subscribe(currencies => {
      this.currencyOptions = currencies;
    });

    this.masterService.getAllDepartments().subscribe(departments => {
      this.departmentOptions = departments;
    });

    this.masterService.getAllUom().subscribe(uoms => {
      this.uomOptions = uoms;
    });

    // this.masterService.getAllTdsSets().subscribe(tdsSets => {
    //   this.tdsOptions = tdsSets;
    // });
  }

  /** Triggered when user clicks "Search" */
  search(): void {
    const payload = {
      searchType: this.searchType,
      filterValue: this.searchType === 'Status' 
        ? this.filterValue === 'Active' ? 'A' : 'S' 
        : this.filterValue
    };

    this.masterService.searchChargeList(payload).subscribe(res => {
      const items = Array.isArray(res) ? res : res.data || [];
      this.results = items.map((charge: any) => {
        const chargeGroup = this.chargeGroupOptions.find(c => c.ChargeGroupSid === charge.ChargeGroupSid);
        const company = this.companyOptions.find(c => c.CompanyMasterSid === charge.CompanyMasterSid);
        const currency = this.currencyOptions.find(c => c.CurrencyMasterSid === charge.CurrencyMasterSid);
        const department = this.departmentOptions.find(d => d.DepartmentMasterSid === charge.DepartmentMasterSid);
        const uom = this.uomOptions.find(u => u.UOMMasterSid === charge.UOM);
        const tdsSet = this.tdsOptions.find(t => t.TDSSetHeaderSid === charge.TDSMasterSid);

        return {
          ...charge,
          chargeGroupName: chargeGroup?.chargeGroupName || '—',
          companyName: company?.companyName || '—',
          currencyName: currency?.currencyName || '—',
          departmentName: department?.departmentName || '—',
          uomName: uom?.uomName || '—',
          tdsSetName: tdsSet?.tdsSetName || '—',
          statusText: charge.Status === 'A' ? 'Active' : 'Suspended'
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
    this.chargeList = this.results.slice(start, start + this.pageSize);
  }

  trackByIndex(_: number, __: any): number {
    return _;
  }

  deleteCharge(id: number): void {
    this.dialog.open(DeleteWarningComponent)
      .afterClosed()
      .subscribe(confirmed => {
        if (!confirmed) return;
        this.masterService.deleteChargeById(id).subscribe(() => {
          this.appSettingService.showSuccess('Deleted!');
          this.search();
        });
      });
  }

  navigateToCreateCharge(): void {
    this.router.navigate(['master/charge/entry']);
  }

  resetPage(): void {
    this.page = 1;
    this.filterValue = '';
    this.searchPerformed = false;
    this.results = [];
    this.chargeList = [];
    this.totalLengthOfCollection = 0;
  }
  
  report() { }
}