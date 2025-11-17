import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { FavoriteStarComponent } from 'src/app/component/favourite/favourite.component';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { NgbPaginationModule, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { MasterService } from '../../master.service';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { ExcelExportService } from 'src/app/shared/excel-report-service';
import { MatDialog } from '@angular/material/dialog';
import { DeleteWarningComponent } from 'src/app/modules/crm-mobile/delete-warning.component';

interface TaxGroup {
  TaxGroupMasterSid?: number;
  name: string;
  taxPercent: number | null;
  status: string;
  hasChanges?: boolean;
}

@Component({
  selector: 'app-tax-group',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NgSelectModule,
    FavoriteStarComponent,
    NgxSpinnerModule,
    NgbPaginationModule,
    NgbTooltipModule
  ],
  templateUrl: './tax-group.component.html',
  styles: ``
})
export class TaxGroupComponent implements OnInit {

  statusOptions = [
    { id: 'A', name: 'Active' },
    { id: 'S', name: 'Suspended' }
  ];

  taxGroups: TaxGroup[] = [];
  filteredTaxGroups: TaxGroup[] = [];

  page = 1;
  pageSize = 10;
  totalLengthOfCollection = 0;
  filterValue = '';
  loading = false;
  isSaving = false;

  // Company and user data
  currentCompany: any;
  currentBranch: any;
  userData: any;

  mathMin = Math.min;
  sortColumn: string = "name";
  sortDirection: 'asc' | 'desc' = 'asc';
  constructor(
    private spinner: NgxSpinnerService,
    private masterService: MasterService,
    private appSettingService: AppSettingsService,
    private excelReportService: ExcelExportService,
    private dialog: MatDialog,
  ) { }

  ngOnInit(): void {
    this.loadCompanyData();
    this.loadTaxGroups();
  }

  loadCompanyData() {
    this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));
    this.currentBranch = this.appSettingService.decrypt(localStorage.getItem('selected-branch'));

    const userProfile = this.appSettingService.getDecryptedUserProfile();
    if (userProfile) {
      this.userData = userProfile;
    }
  }

  // Load existing tax groups from API
  loadTaxGroups() {
    this.loading = true;
    this.spinner.show();

    const params = {
      page: this.page,
      pageSize: this.pageSize,
      search: this.filterValue,
      activeCompanyId: this.currentCompany?.CompanyMasterSid,
      activeBranchId: this.currentBranch?.BranchMasterSid
    };

    this.masterService.searchTaxGroupMaster(params).subscribe({
      next: (response: any) => {
        this.loading = false;
        this.spinner.hide();

        if (response.status) {
          const items = response.data?.items || [];

          // Map API response properties to component properties
          this.taxGroups = items.map((item: any) => ({
            TaxGroupMasterSid: item.TaxGroupSid,
            name: item.TaxGroup || '',
            taxPercent: item.TaxRate ? Number(item.TaxRate) : null,
            status: item.Status || 'A',
            hasChanges: false
          }));

          this.totalLengthOfCollection = response.data?.totalCount || this.taxGroups.length;
          this.applyFilter();
        } else {
          this.appSettingService.showError(response.message || 'Error loading tax groups');
        }
      },
      error: (error) => {
        this.loading = false;
        this.spinner.hide();
        console.error('Error loading tax groups:', error);
        this.appSettingService.showError('Error loading tax groups');
      }
    });
  }

  // Search functionality
  search(): void {
    this.page = 1;
    this.applyFilter();
  }

  clearSearch(): void {
    this.filterValue = '';
    this.applyFilter();
  }



  addRow() {
    this.taxGroups.push({
      name: '',
      taxPercent: null,
      status: 'A',
      hasChanges: true // Mark new rows as having changes
    });
    this.applyFilter();
  }

  deleteRow(index: number) {
    const filteredItem = this.filteredTaxGroups[index];

    if (filteredItem.TaxGroupMasterSid) {
      // For existing records - calls API via deleteTaxGroup
      this.deleteTaxGroup(filteredItem.TaxGroupMasterSid);
    } else {
      // For new rows - removes from UI immediately
      const actualIndex = this.taxGroups.findIndex(item =>
        item.name === filteredItem.name &&
        item.taxPercent === filteredItem.taxPercent
      );

      if (actualIndex !== -1) {
        this.taxGroups.splice(actualIndex, 1);
        this.applyFilter();
      }
    }
  }

  deleteTaxGroup(TaxGroupSid: number) {
    const dialogRef = this.dialog.open(DeleteWarningComponent);
    dialogRef.afterClosed().subscribe((res) => {
      if (res) {
        this.spinner.show();
        this.masterService.deleteTaxGroupById(TaxGroupSid).subscribe({
          next: (resp: any) => {
            this.spinner.hide();
            if (resp.status) {
              this.appSettingService.showSuccess("Tax group deleted successfully!");
              this.loadTaxGroups(); // Reload data - removes from UI
            } else {
              this.appSettingService.showError(resp.message || "Error deleting tax group");
            }
          },
          error: (error) => {
            this.spinner.hide();
            console.error('Error deleting tax group:', error);
            this.appSettingService.showError("Error deleting tax group");
          }
        });
      }
    });
  }
  reset() {
    this.taxGroups = [{ name: '', taxPercent: null, status: 'A', hasChanges: true }];
    this.filterValue = '';
    this.page = 1;
    this.loadTaxGroups();
  }

  onPageChange(pageNumber: number) {
    this.page = pageNumber;
    this.loadTaxGroups();
  }

  // Input change handlers to track changes
  onNameChange(item: any, name: string): void {
    item.name = name;
    item.hasChanges = true;
  }

  onTaxPercentChange(item: any, taxPercent: number): void {
    item.taxPercent = taxPercent;
    item.hasChanges = true;
  }

  onStatusChange(item: any, status: string): void {
    item.status = status;
    item.hasChanges = true;
  }

  // Save method following ledger mapping pattern
  saveChanges(): void {
    const itemsToSave = this.taxGroups.filter(item => item.hasChanges);

    if (itemsToSave.length === 0) {
      this.appSettingService.showInfo('No changes to save');
      return;
    }

    this.isSaving = true;
    this.spinner.show();

    // Separate new records and updates
    const newTaxGroups = itemsToSave.filter(group => !group.TaxGroupMasterSid);
    const updatedTaxGroups = itemsToSave.filter(group => group.TaxGroupMasterSid);

    let completedOperations = 0;
    const totalOperations = newTaxGroups.length + updatedTaxGroups.length;
    let hasError = false;

    // Validate all groups before saving
    const invalidGroups = itemsToSave.filter(group =>
      !group.name || group.name.trim() === '' || group.taxPercent === null
    );

    if (invalidGroups.length > 0) {
      this.isSaving = false;
      this.spinner.hide();
      this.appSettingService.showWarning('Please fill all tax groups with name and tax percentage');
      return;
    }

    const invalidTaxPercent = itemsToSave.find(group =>
      group.taxPercent! < 0 || group.taxPercent! > 100
    );

    if (invalidTaxPercent) {
      this.isSaving = false;
      this.spinner.hide();
      this.appSettingService.showWarning('Tax percentage must be between 0 and 100');
      return;
    }

    // Create new tax groups
    newTaxGroups.forEach(group => {
      const payload = {
        TaxGroup: group.name.trim(),
        TaxRate: group.taxPercent,
        Status: group.status,
        CreatedBy: this.userData?.userEmail || this.appSettingService.userSettingSource.value['userEmail'] || 'system'
      };

      this.masterService.createNewTaxGroup(payload).subscribe({
        next: (response: any) => {
          completedOperations++;
          if (response.status) {
            console.log('Tax group created successfully:', response);
          } else {
            hasError = true;
            this.appSettingService.showError(`Error creating tax group "${group.name}": ${response.message}`);
          }
          this.checkSaveCompletion(completedOperations, totalOperations, hasError);
        },
        error: (error) => {
          completedOperations++;
          hasError = true;
          console.error('Error creating tax group:', error);
          this.appSettingService.showError(`Error creating tax group "${group.name}"`);
          this.checkSaveCompletion(completedOperations, totalOperations, hasError);
        }
      });
    });

    // Update existing tax groups
    updatedTaxGroups.forEach(group => {
      const payload = {
        TaxGroup: group.name.trim(),
        TaxRate: group.taxPercent,
        Status: group.status,
        UpdatedBy: this.userData?.userEmail || this.appSettingService.userSettingSource.value['userEmail'] || 'system'
      };

      this.masterService.updateTaxGroupById(group.TaxGroupMasterSid!, payload).subscribe({
        next: (response: any) => {
          completedOperations++;
          if (response.status) {
            console.log('Tax group updated successfully:', response);
          } else {
            hasError = true;
            this.appSettingService.showError(`Error updating tax group "${group.name}": ${response.message}`);
          }
          this.checkSaveCompletion(completedOperations, totalOperations, hasError);
        },
        error: (error) => {
          completedOperations++;
          hasError = true;
          console.error('Error updating tax group:', error);
          this.appSettingService.showError(`Error updating tax group "${group.name}"`);
          this.checkSaveCompletion(completedOperations, totalOperations, hasError);
        }
      });
    });

    // If no operations to perform
    if (totalOperations === 0) {
      this.isSaving = false;
      this.spinner.hide();
    }
  }

  private checkSaveCompletion(completed: number, total: number, hasError: boolean) {
    if (completed === total) {
      this.isSaving = false;
      this.spinner.hide();

      if (!hasError) {
        this.appSettingService.showSuccess('Tax groups saved successfully!');
        // Clear changes flag and reload data
        this.taxGroups.forEach(item => item.hasChanges = false);
        this.loadTaxGroups();
      }
    }
  }

  // Check if there are any changes (for button disable state)
  hasChanges(): boolean {
    return this.taxGroups.some(item => item.hasChanges);
  }

  report() {
    const formattedData = this.filteredTaxGroups
      .filter(group => group.name && group.taxPercent !== null)
      .map(group => ({
        'Tax Group Name': group.name,
        'Tax Percentage': group.taxPercent,
        'Status': group.status === 'A' ? 'Active' : 'Suspended'
      }));

    if (formattedData.length === 0) {
      this.appSettingService.showWarning('No data to export');
      return;
    }

    const companyName = this.currentCompany?.companyName ?? 'Company';

    this.excelReportService.exportAsExcel({
      data: formattedData,
      headers: [
        { key: 'Tax Group Name', label: 'Tax Group Name' },
        { key: 'Tax Percentage', label: 'Tax Percentage' },
        { key: 'Status', label: 'Status' }
      ],
      fileName: 'Tax-Group-Report',
      title: companyName
    });
  }

  getCurrentData(): TaxGroup[] {
    const startIndex = (this.page - 1) * this.pageSize;
    return this.filteredTaxGroups.slice(startIndex, startIndex + this.pageSize);
  }

  trackBy(index: number, item: TaxGroup): number {
    return item.TaxGroupMasterSid || index;
  }


  // Sorting functionality
  sort(column: string): void {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    this.applyFilter(); // This will trigger sorting
  }

  // Update the applyFilter method to include sorting
  applyFilter(): void {
    if (!this.filterValue.trim()) {
      this.filteredTaxGroups = [...this.taxGroups];
    } else {
      const searchTerm = this.filterValue.toLowerCase();
      this.filteredTaxGroups = this.taxGroups.filter(item =>
        item.name?.toLowerCase().includes(searchTerm) ||
        item.taxPercent?.toString().toLowerCase().includes(searchTerm) ||
        (item.status === 'A' ? 'active' : 'suspended').includes(searchTerm)
      );
    }

    // Apply sorting to filtered results
    this.applySorting();

    this.totalLengthOfCollection = this.filteredTaxGroups.length;
  }

  // Helper method to apply sorting
  private applySorting(): void {
    this.filteredTaxGroups.sort((a, b) => {
      let valueA = this.getSortValue(a, this.sortColumn);
      let valueB = this.getSortValue(b, this.sortColumn);

      // Handle null/undefined values
      valueA = valueA ?? '';
      valueB = valueB ?? '';

      // Convert to string for case-insensitive comparison
      valueA = valueA.toString().toLowerCase();
      valueB = valueB.toString().toLowerCase();

      if (valueA < valueB) {
        return this.sortDirection === 'asc' ? -1 : 1;
      }
      if (valueA > valueB) {
        return this.sortDirection === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }

  // Helper method to get sort value based on column
  private getSortValue(item: any, column: string): any {
    switch (column) {
      case 'name':
        return item.name;
      case 'taxPercent':
        return item.taxPercent;
      case 'status':
        return item.status === 'A' ? 'Active' : 'Suspended';
      default:
        return item[column];
    }
  }

  // Get sort icon based on current sort state
  getSortIcon(column: string): string {
    if (this.sortColumn !== column) {
      return 'fas fa-sort';
    }
    return this.sortDirection === 'asc' ? 'fas fa-sort-up' : 'fas fa-sort-down';
  }
}