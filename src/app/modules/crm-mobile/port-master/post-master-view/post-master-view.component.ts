import { Component } from '@angular/core';
import { FeatherModule } from 'angular-feather';
import { FormsModule } from '@angular/forms';
import { NgSelectConfig, NgSelectModule } from '@ng-select/ng-select';
import { CommonModule } from '@angular/common';


@Component({
  selector: 'app-post-master-view',
  standalone: true,
  imports: [
    FeatherModule,
    CommonModule,
    NgSelectModule, 
    FormsModule
  ],
  templateUrl: './post-master-view.component.html',
  styleUrl: './post-master-view.component.scss'
})
export class PostMasterViewComponent {
  selectedState: number;
  selectedCountry: number;
  selectedTransport: number;

  states = [
    { id: 1,  name: 'State 1' },
    { id: 2,  name: 'State 2' },
    { id: 3,  name: 'State 3' },
    { id: 4,  name: 'State 4' },
    { id: 5,  name: 'State 5' },
    { id: 6,  name: 'State 6' },
    { id: 7,  name: 'State 7' },
    { id: 8,  name: 'State 8' },
    { id: 9,  name: 'State 9' },
    { id: 10, name: 'State 10' },
    { id: 11, name: 'State 11' },
    { id: 12, name: 'State 12' },
    { id: 13, name: 'State 13' },
    { id: 14, name: 'State 14' },
    { id: 15, name: 'State 15' },
    { id: 16, name: 'State 16' },
    { id: 17, name: 'State 17' },
    { id: 18, name: 'State 18' },
    { id: 19, name: 'State 19' },
    { id: 20, name: 'State 20' },
    { id: 21, name: 'State 21' },
    { id: 22, name: 'State 22' },
    { id: 23, name: 'State 23' },
    { id: 24, name: 'State 24' },
];
countries = [
    { id: 1,  name: 'Country 1' },
    { id: 2,  name: 'Country 2' },
    { id: 3,  name: 'Country 3' },
    { id: 4,  name: 'Country 4' },
    { id: 5,  name: 'Country 5' },
    { id: 6,  name: 'Country 6' },
    { id: 7,  name: 'Country 7' },
    { id: 8,  name: 'Country 8' },
    { id: 9,  name: 'Country 9' },
    { id: 10, name: 'Country 10' },
    { id: 11, name: 'Country 11' },
    { id: 12, name: 'Country 12' },
    { id: 13, name: 'Country 13' },
    { id: 14, name: 'Country 14' },
    { id: 15, name: 'Country 15' },
    { id: 16, name: 'Country 16' },
    { id: 17, name: 'Country 17' },
    { id: 18, name: 'Country 18' },
    { id: 19, name: 'Country 19' },
    { id: 20, name: 'Country 20' },
    { id: 21, name: 'Country 21' },
    { id: 22, name: 'Country 22' },
    { id: 23, name: 'Country 23' },
    { id: 24, name: 'Country 24' },
];
modeOfTransports = [
    { id: 1,  name: 'Sea' },
    { id: 2,  name: 'Air' },
    { id: 3,  name: 'ICD' },
    { id: 4,  name: 'Terminal' },
    { id: 5,  name: 'Road' },
    { id: 6,  name: 'Rail' },
];

  constructor(private config: NgSelectConfig) {
    this.config.notFoundText = 'Custom not found';
    this.config.appendTo = 'body';
    this.config.bindValue = 'value';
  }
  toggleDisabled() {
    const car2: any = this.states[1];
    car2.disabled = !car2.disabled;
  }

  ngOnInit() { }
}
