import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { PreventMultiClickDirective } from 'src/app/core/Directives/prevent-multi-click.directive';
import { ElementStateGuardDirective } from 'src/app/core/Directives/element-state-guard.directive';

export interface DropdownMenuItem {
  label: string;
  icon: string;
  action: string;
  condition?: boolean;
  disabled?: boolean;
  cssClass?: string;
  divider?: boolean; 
}

@Component({
  selector: 'app-tools-dropdown',
  standalone: true,
  imports: [
    CommonModule,
    NgbDropdownModule,
    PreventMultiClickDirective,
    ElementStateGuardDirective
  ],
  templateUrl : './tools-dropdown.component.html',
  styleUrls: []
})
export class ToolsDropdownComponent {
  @Input() items: DropdownMenuItem[] = [];
  @Input() buttonClass: string = 'btn btn-light-secondary btn-sm has-arrow';
  @Input() buttonIcon: string = 'fas fa-ellipsis-v';
  @Input() containerClass: string = 'me-2';
  @Input() disabled: boolean = false;
  @Input() emptyMessage: string = 'No actions available';
  @Input() dropdownId: string = 'dropdownMenu';

  @Output() itemClick = new EventEmitter<string>();

  get visibleItems(): DropdownMenuItem[] {
    return this.items.filter(item => item.condition !== false);
  }

  onItemClick(action: string): void {
    const item = this.visibleItems.find(menuItem => menuItem.action === action);
    if (this.disabled || item?.disabled) {
      return;
    }
    this.itemClick.emit(action);
  }

  trackByAction(index: number, item: DropdownMenuItem): string {
    return item.action;
  }
}
