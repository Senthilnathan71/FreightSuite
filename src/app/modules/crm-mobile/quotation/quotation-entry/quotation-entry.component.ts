import { CommonModule } from '@angular/common';
import { Component, ViewChild } from '@angular/core';
import {
  NgbAccordionModule,
  NgbDatepickerModule,
} from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { FeatherModule } from 'angular-feather';
import { NgbAccordionDirective } from '@ng-bootstrap/ng-bootstrap';
@Component({
  selector: 'app-quotation-entry',
  standalone: true,
  imports: [
    CommonModule,
    NgSelectModule,
    NgbAccordionModule,
    FeatherModule,
    NgbDatepickerModule,
    NgbAccordionDirective,
  ],
  templateUrl: './quotation-entry.component.html',
  styleUrl: './quotation-entry.component.scss',
})
export class QuotationEntryComponent {
  // activeTab = 'quotation';

  // setTab(tab: string) {
  //   this.activeTab = tab;
  // }

  // panels = [
  //   { title: 'Section 1', content: 'Content for Section 1', open: false },
  //   { title: 'Section 2', content: 'Content for Section 2', open: false },
  //   { title: 'Section 3', content: 'Content for Section 3', open: false },
  // ];

  // togglePanel(index: number) {
  //   this.panels[index].open = !this.panels[index].open;
  // }

  // toggleAll(openAll: boolean) {
  //   this.panels.forEach((panel) => (panel.open = openAll));
  // }

  routeSections: any[] = [{ id: 'sectionOne', index: 1 }];

  addRoute() {
    const newIndex = this.routeSections.length + 1;
    const newId = `section${newIndex}`;
    this.routeSections.push({ id: newId, index: newIndex });
  }

  tabs: string[] = ['Quotation', 'Charge Details', 'Others'];
  selectedTab = 'Quotation';

  selectTab(tab: string) {
    this.selectedTab = tab;
  }

  selectedDept: string = '';

  onDeptChange(event: any) {
    this.selectedDept = event.name;
  }

  containerTypes = [
    { name: '20FT', value: '20ft' },
    { name: '40FT', value: '40ft' },
  ];

  modeOfCargoType = [
    { id: 1, name: 'Gerenal' },
    { id: 2, name: 'Haz' },
    { id: 3, name: 'Refer' },
    { id: 4, name: 'Tanker' },
    { id: 5, name: 'OOG' },
  ];
  modeOfStatus = [
    { id: 1, name: 'Active' },
    { id: 2, name: 'Suspended' },
  ];

  modeOfCustomer = [
    { id: 1, name: 'Vijay' },
    { id: 2, name: 'Ajith' },
  ];

  modeOfSalesman = [
    { id: 1, name: 'Vijay' },
    { id: 2, name: 'Ajith' },
  ];

  modeOfDept = [
    { id: 1, name: 'FCL' },
    { id: 2, name: 'LCL' },
    { id: 3, name: 'Air' },
  ];
}
