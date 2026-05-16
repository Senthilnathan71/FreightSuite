import { CommonModule, DatePipe } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { NgbActiveModal, NgbModal, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { CustomDatePipe } from 'src/app/core/pipes/custom-date-format.pipe';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';

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

    private normalizeTimezoneOffset(offset?: string | null): string {
        if (!offset) return '+00:00';

        let value = String(offset).trim();
        if (!value) return '+00:00';

        if (!['+', '-'].includes(value[0])) {
            value = `+${value}`;
        }

        const match = value.match(/^([+-])(\d{1,2})(?::?(\d{2}))?$/);
        if (!match) return '+00:00';

        const sign = match[1];
        const hours = match[2].padStart(2, '0');
        const minutes = match[3] || '00';

        return `${sign}${hours}:${minutes}`;
    }

    private getOffsetMinutes(offset: string): number {
        const match = offset.match(/^([+-])(\d{2}):(\d{2})$/);
        if (!match) return 0;

        const sign = match[1] === '-' ? -1 : 1;
        const hours = Number(match[2]);
        const minutes = Number(match[3]);

        return sign * ((hours * 60) + minutes);
    }

    formatDetailsDate(value: string | Date | null | undefined): string {
        if (!value) return '-';

        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return '-';

        const branch = this.appSettingsService.getCurrentBranchInfo();
        const offset = this.normalizeTimezoneOffset(branch?.timeZone);
        const shifted = new Date(date.getTime() + (this.getOffsetMinutes(offset) * 60 * 1000));
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
