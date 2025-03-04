import { Component, ViewEncapsulation } from '@angular/core';
import { NgbModule, NgbPopoverModule } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-ngbd-popover-tooltip',
  standalone: true,
  imports: [NgbPopoverModule, NgbModule],
  templateUrl: './popover-tooltip.component.html',
  encapsulation: ViewEncapsulation.None,
  host: { class: 'd-block' },
  styles: [
    `
      .my-custom-class .tooltip-inner {
        background-color: darkgreen;
        font-size: 125%;
      }
      .my-custom-class.bs-tooltip-end .tooltip-arrow::before {
        border-right-color: darkgreen;
      }
      .my-custom-class.bs-tooltip-start .tooltip-arrow::before {
        border-left-color: darkgreen;
      }
      .my-custom-class.bs-tooltip-top .tooltip-arrow::before {
        border-top-color: darkgreen;
      }
      .my-custom-class.bs-tooltip-bottom .tooltip-arrow::before {
        border-bottom-color: darkgreen;
      }
    `,
  ],
})
export class NgbdPopTooltipComponent {



  // popover - HTML/Binding

  name = 'World';

  // popover - context and manual triggers
  name2 = 'World';

  toggleWithGreeting(popover: any, greeting: string, language: string) {
    if (popover.isOpen()) {
      popover.close();
    } else {
      popover.open({ greeting, language });
    }
  }

  // popover visibility events
  lastShown:any =  Date.now();
  lastHidden:any =  Date.now();

  recordShown() {
    this.lastShown = new Date();
  }

  recordHidden() {
    this.lastHidden = new Date();
  }

  // tooltip
  name3 = 'World';

  // tooltip - context and manual triggers
  name4 = 'World';

  toggleWithGreeting2(tooltip: any, greeting: string) {
    if (tooltip.isOpen()) {
      tooltip.close();
    } else {
      tooltip.open({ greeting });
    }
  }
}
