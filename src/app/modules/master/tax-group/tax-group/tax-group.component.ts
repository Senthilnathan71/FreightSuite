import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { FavoriteStarComponent } from 'src/app/component/favourite/favourite.component';
import { NgxSpinnerModule } from 'ngx-spinner';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';

interface TaxGroup {
  name: string;
  taxPercent: number | null;
  status: string | null;
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
    NgbPaginationModule
  ],
  templateUrl: './tax-group.component.html',
  styles: ``
})
export class TaxGroupComponent {

  // --- Status dropdown options
  statusOptions = [
    { id: 'A', name: 'Active' },
    { id: 'S', name: 'Suspended' }
  ];

  // --- Data list
  taxGroups: TaxGroup[] = [
    { name: '', taxPercent: null, status: 'A' }
  ];

  // --- Pagination variables
  page = 1;
  pageSize = 10;
  totalLengthOfCollection = 1;
  filterValue = '';

  // Allow Math.min in template
  mathMin = Math.min;

  // --- Add new row
  addRow() {
    this.taxGroups.push({ name: '', taxPercent: null, status: 'A' });
    this.totalLengthOfCollection = this.taxGroups.length;
  }

  // --- Delete specific row
  deleteRow(index: number) {
    this.taxGroups.splice(index, 1);
    this.totalLengthOfCollection = this.taxGroups.length;
  }

  // --- Reset form
  reset() {
    this.taxGroups = [{ name: '', taxPercent: null, status: 'A' }];
    this.totalLengthOfCollection = this.taxGroups.length;
  }

  // --- Pagination handler
  onPageChange(pageNumber: number) {
    this.page = pageNumber;
  }
}
