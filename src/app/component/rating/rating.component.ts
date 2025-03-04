import { Component } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators, UntypedFormControl } from '@angular/forms';
import { NgbRatingModule } from '@ng-bootstrap/ng-bootstrap';

@Component({
	selector: 'app-ngbd-rating',
	standalone: true,
	imports: [NgbRatingModule, ReactiveFormsModule],
	templateUrl: './rating.component.html',
	styles: [
		`
			.star {
				font-size: 1.5rem;
				color: #b0c4de;
			}
			.filled {
				color: #1e90ff;
			}
			.heart {
				position: relative;
				display: inline-block;
				font-size: 3rem;
				color: #d3d3d3;
			}
			.full {
				color: red;
			}
			.half {
				position: absolute;
				display: inline-block;
				overflow: hidden;
				color: red;
			}
			.bad {
			color: #deb0b0;
		}
		.filled.bad {
			color: #ff1e1e;
		}
		`
	]
})
export class NgbdratingBasicComponent {
	currentRate = 8;
	customcurrentRate = 6;
	currentRate2 = 2;

	// events and read only 
	selected = 0;
	hovered = 0;
	readonly = false;

	// custom decimal 
	decimalcurrentRate = 3.14;

	ariaValueText(current: number, max: number) {
		return `${current} out of ${max} hearts`;
	}


	// for form integration
	ctrl = new FormControl<number | null>(null, Validators.required);

	toggle() {
		if (this.ctrl.disabled) {
			this.ctrl.enable();
		} else {
			this.ctrl.disable();
		}
	}


}
