import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { NgbAccordionModule } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';

@Component({
  selector: 'app-config',
  standalone: true,
  imports: [CommonModule,NgbAccordionModule,NgSelectModule],
  templateUrl: './config.component.html',
  styleUrl: './config.component.scss'
})
export class ConfigComponent {

    hovered: string = '';
    activeSection: string = 'master';

    setSection(section: string): void {
      this.activeSection = section;
    }


    modeOfStatus=[
      {id:1,name:"ACtive"},
      {id:2,name:"Inactive"}
    ]
}
