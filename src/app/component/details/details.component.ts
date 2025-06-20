import { DatePipe } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { NgbActiveModal, NgbModal, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';

@Component({
    standalone: true,
    imports: [
        DatePipe,
        NgbModalModule
    ],
    selector: 'dofi-info',
    templateUrl: 'details.component.html'
})

export class DetailsComponent implements OnInit {

    @Input() item : any;
    @Input() idLabel : string = '';
    @Input() idValue : any = '';

    constructor(private activeModal : NgbActiveModal) { }

    ngOnInit() { }

    closeModal(){
        this.activeModal.close();
    }

}