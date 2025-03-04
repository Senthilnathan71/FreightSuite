import { Component, ViewChild } from '@angular/core';
import { NgbCarouselModule , NgbCarouselConfig, NgbSlideEvent, NgbSlideEventSource, NgbCarousel} from '@ng-bootstrap/ng-bootstrap';

import { FormsModule } from '@angular/forms';

@Component({
	selector: 'app-ngbd-buttons-radio',
	standalone: true,
	imports: [NgbCarouselModule, FormsModule],
	templateUrl: './carousel.component.html',
	providers: [NgbCarouselConfig],
})
export class NgbdCarouselBasicComponent {
	images = [944, 1011, 984].map((n) => `https://picsum.photos/id/${n}/900/500`);

	// navigation arrowa
	showNavigationArrows = false;
	showNavigationIndicators = false;
	images2 = [1055, 194, 368].map((n) => `https://picsum.photos/id/${n}/900/500`);

	constructor(config: NgbCarouselConfig) {
		// customize default values of carousels used by this component tree
		config.showNavigationArrows = true;
		config.showNavigationIndicators = true;
	}

	// pause-cycle
	images3 = [62, 83, 466, 965, 982, 1043, 738].map((n) => `https://picsum.photos/id/${n}/900/500`);

	paused = false;
	unpauseOnArrow = false;
	pauseOnIndicator = false;
	pauseOnHover = true;
	pauseOnFocus = true;

	@ViewChild('carousel', { static: true }) carousel: NgbCarousel = Object.create(null);

	togglePaused() {
		if (this.paused) {
			this.carousel.cycle();
		} else {
			this.carousel.pause();
		}
		this.paused = !this.paused;
	}

	onSlide(slideEvent: NgbSlideEvent) {
		if (
			this.unpauseOnArrow &&
			slideEvent.paused &&
			(slideEvent.source === NgbSlideEventSource.ARROW_LEFT || slideEvent.source === NgbSlideEventSource.ARROW_RIGHT)
		) {
			this.togglePaused();
		}
		if (this.pauseOnIndicator && !slideEvent.paused && slideEvent.source === NgbSlideEventSource.INDICATOR) {
			this.togglePaused();
		}
	}
}
