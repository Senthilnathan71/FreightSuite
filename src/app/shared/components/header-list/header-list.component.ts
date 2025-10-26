import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FavoriteStarComponent } from 'src/app/component/favourite/favourite.component';
import { NgbDropdownModule, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';

export interface HeaderAction {
  label: string;
  icon: string;
  action: string;
  disabled?: boolean;
  condition?: boolean;
  cssClass?: string;
  children?: HeaderAction[];  // Support for dropdown items
  tooltip?: string;            // Tooltip text for info icon
}

@Component({
  selector: 'app-page-header',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    FavoriteStarComponent,
    NgbDropdownModule,
    NgbTooltipModule
  ],
  templateUrl:'./header-list.component.html',
  styleUrls: []
})
export class PageHeaderComponent implements OnInit {
  @Input() title: string = '';
  @Input() showFavorite: boolean = true;
  @Input() showSearch: boolean = true;
  @Input() searchPlaceholder: string = 'Search';
  @Input() searchButtonText: string = 'Search';
  @Input() searchValue: string = '';
  @Input() actions: HeaderAction[] = [];

  @Output() searchValueChange = new EventEmitter<string>();
  @Output() searchTriggered = new EventEmitter<string>();
  @Output() searchCleared = new EventEmitter<void>();
  @Output() actionTriggered = new EventEmitter<string>();

  ngOnInit(): void {
    // Component initialization
  }

  onSearch(): void {
    this.searchTriggered.emit(this.searchValue);
  }

  onClearSearch(): void {
    this.searchValue = '';
    this.searchValueChange.emit(this.searchValue);
    this.searchCleared.emit();
  }

  onActionClick(action: string): void {
    this.actionTriggered.emit(action);
  }
}