import { Component, TemplateRef } from '@angular/core';

import { ToastService } from './toast.service';
import { NgbToastModule } from '@ng-bootstrap/ng-bootstrap';

@Component({
	selector: 'app-toasts',
	standalone: true,
	imports: [NgbToastModule],
	template: `
		@for(toast of toastService.toasts; track toast) {
			<ngb-toast
			[class]="toast.classname"
			[autohide]="true"
			[delay]="toast.delay || 5000"
			(hidden)="toastService.remove(toast)"
			>
			@if(isTemplate(toast)) {
				<ng-template [ngTemplateOutlet]="toast.textOrTpl"></ng-template>
			} @else {
				<ng-template>{{ toast.textOrTpl }}</ng-template>
			}			
		</ngb-toast>
		}
		
	`,
	host: { class: 'toast-container position-fixed top-0 end-0 p-3', style: 'z-index: 1200' },
})
export class ToastsContainer {
	constructor(public toastService: ToastService) { }

	isTemplate(toast: any) {
		return toast.textOrTpl instanceof TemplateRef;
	}
}