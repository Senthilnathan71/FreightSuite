import { Component } from '@angular/core';
import { NgbNavModule, NgbNavChangeEvent, NgbDropdownModule, NgbAlertModule } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-ngbd-nav',
  standalone: true,
  imports: [NgbNavModule, NgbDropdownModule, NgbAlertModule ],
  templateUrl: './nav.component.html',
  styles: [
		`
			.close {
				font-size: 1.4rem;
				opacity: 0.1;
				transition: opacity 0.3s;
			}
			.nav-link:hover > .close {
				opacity: 0.8;
			}
		`,
	],
})
export class NgbdnavBasicComponent {
  //  basic navs
  active = 1;

  // vertical 
  active2 = 'top';

  // selecting navs
  active3: any;
	disabled = true;

	onNavChange(changeEvent: NgbNavChangeEvent) {
		if (changeEvent.nextId === 3) {
			changeEvent.preventDefault();
		}
	}

	toggleDisabled() {
		this.disabled = !this.disabled;
		if (this.disabled) {
			this.active = 1;
		}
	}

  // keep content
  active4 = 1;  

  // dynamic tabs
  tabs = [1, 2, 3, 4, 5];
	counter = this.tabs.length + 1;
	active5: any;

	close(event: MouseEvent, toRemove: number) {
		this.tabs = this.tabs.filter((id) => id !== toRemove);
		event.preventDefault();
		event.stopImmediatePropagation();
	}

	add(event: MouseEvent) {
		this.tabs.push(this.counter++);
		event.preventDefault();
	}
}
