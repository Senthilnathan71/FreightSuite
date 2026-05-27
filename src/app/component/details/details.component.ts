import { CommonModule, DatePipe } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { NgbActiveModal, NgbModal, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { CustomDatePipe } from 'src/app/core/pipes/custom-date-format.pipe';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { normalizeTimezoneOffset, getOffsetMinutes } from 'src/app/common/helper';

@Component({
    standalone: true,
    imports: [
        DatePipe,
        NgbModalModule,
        CommonModule,
        CustomDatePipe
    ],
    selector: 'dofi-info',
    templateUrl: 'details.component.html'
})

export class DetailsComponent implements OnInit {

    @Input() item : any;
    @Input() idLabel : string = '';
    @Input() idValue : any = '';

    constructor(
        private activeModal : NgbActiveModal,
        private appSettingsService: AppSettingsService
    ) { }

    ngOnInit() { }

    closeModal(){
        this.activeModal.close();
    }

    formatDetailsDate(value: string | Date | null | undefined): string {
        if (!value) return '-';

        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return '-';

        const branch = this.appSettingsService.getCurrentBranchInfo();
        const offset = normalizeTimezoneOffset(branch?.timeZone);
        const shifted = new Date(date.getTime() + (getOffsetMinutes(offset) * 60 * 1000));
        const pad = (num: number) => String(num).padStart(2, '0');

        const day = pad(shifted.getUTCDate());
        const month = pad(shifted.getUTCMonth() + 1);
        const year = shifted.getUTCFullYear();
        const hours24 = shifted.getUTCHours();
        const hours12 = hours24 % 12 || 12;
        const minutes = pad(shifted.getUTCMinutes());
        const meridian = hours24 >= 12 ? 'PM' : 'AM';

        return `${day}-${month}-${year} ${pad(hours12)}:${minutes} ${meridian}`;
    }

}
