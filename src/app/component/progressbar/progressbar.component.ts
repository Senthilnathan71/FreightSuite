import { Component } from '@angular/core';
import { NgbProgressbarModule, NgbProgressbarConfig } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-ngbd-progressbar',
  standalone: true,
	imports: [NgbProgressbarModule],
  templateUrl: './progressbar.component.html',
  providers: [NgbProgressbarConfig]
})
export class NgbdpregressbarBasicComponent {
  height = '20px';

  // global progressbar
  constructor(config: NgbProgressbarConfig) {
		// customize default values of progress bars used by this component tree
		config.max = 1000;
		config.striped = true;
		config.animated = true;
		config.type = 'success';
		config.height = '20px';
	}
}
