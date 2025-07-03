import { Component,EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FavoriteStarComponent } from '../favourite/favourite.component';

@Component({
  selector: 'app-listpage',
  standalone: true,
  imports: [CommonModule, FormsModule,FavoriteStarComponent],
  templateUrl: './listpage.component.html',
  styleUrl: './listpage.component.scss'
})
export class ListpageComponent {
  @Input() title: string = 'Title';
  @Input() searchPerformed: boolean = false;
  @Input() searchOptions: { value: string, label: string }[] = [];
  @Input() defaultSearchType: string = '';

  @Output() onCreateClick = new EventEmitter<void>();
  @Output() onReportClick = new EventEmitter<void>();
  @Output() onResetClick = new EventEmitter<void>();
  @Output() onSearchClick = new EventEmitter<{ type: string, value: string }>();

  searchType: string = '';
  filterValue: string = '';

  ngOnInit() {
    this.searchType = this.defaultSearchType || (this.searchOptions.length > 0 ? this.searchOptions[0].value : '');
  }

  emitSearch() {
    this.onSearchClick.emit({ type: this.searchType, value: this.filterValue });
  } 

  emitReset() {
    this.filterValue = '';
    this.searchType = this.defaultSearchType || (this.searchOptions.length > 0 ? this.searchOptions[0].value : '');
    this.onResetClick.emit();
  }
}
