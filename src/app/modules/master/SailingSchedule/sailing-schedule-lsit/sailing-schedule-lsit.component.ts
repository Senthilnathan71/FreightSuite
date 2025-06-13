import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { FeatherModule } from 'angular-feather';
import { MasterService } from '../../master.service';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { FormsModule } from '@angular/forms';
import { CommonModule, DatePipe } from '@angular/common';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { MatDialog } from '@angular/material/dialog';
import { DeleteWarningComponent } from 'src/app/modules/crm-mobile/delete-warning.component';
import { NgSelectModule } from '@ng-select/ng-select';
import { authService } from 'src/app/modules/authentication/auth.service';
import { ExcelExportService } from 'src/app/shared/excel-report-service';
import { CustomDatePipe } from 'src/app/core/pipes/custom-date-format.pipe';

@Component({
    selector: 'app-sailing-schedule-lsit',
    standalone: true,
    imports: [
        FeatherModule,
        RouterModule,
        FormsModule,
        CommonModule,
        DatePipe,
        NgbPaginationModule,
        NgSelectModule,
        CustomDatePipe
    ],
    templateUrl: './sailing-schedule-lsit.component.html',
    styleUrl: './sailing-schedule-lsit.component.scss'
})
export class SailingScheduleLsitComponent implements OnInit {

    searchType : string = 'VoyageNo';
    portList : any[];
    filterValue :any;
    searchPerformed : boolean;
    scheduleList : any[];
    slicedScheduleList : any[];
    portOfLoading :"" ;
    portOfDeparture :"";
    userData : any;

    page = 1;
    pageSize = 10;
    totalAmountOfCollections : number;

    constructor(
        private router: Router,
        private masterService:MasterService,
        private appSettingService : AppSettingsService,
        private dialog : MatDialog ,
        private userService : authService,
        private excelReportService : ExcelExportService      
    ) { }

    ngOnInit(): void {
        this.loadAllPorts();
        this.appSettingService.getUser().subscribe(
            user=>{
                if(user){
                    this.userData = user;
                }
            }
        )
    }

    onSearch(){
        const intFields = [
            "VesselMasterSid",
            "Carrier",
        ];
        const payload = {
            searchType : this.searchType,
            filterValue : intFields.includes(this.searchType) ? Number(this.filterValue) : this.filterValue
        }

        this.masterService.searchSailingSchedule(payload).subscribe(
            (resp:any)=>{
                if(resp.status){
                    this.searchPerformed = true;
                    this.scheduleList = resp.data;
                    this.totalAmountOfCollections = this.scheduleList.length;
                    this.updatePaginationData();
                }
            }
        )
    }

    onSpecialSearch(){

        // When Both are unselected , we go for getAll
        if (!this.portOfLoading && !this.portOfDeparture) {
            const payload = { searchType: 'VoyageNo', filterValue: '' }
            this.masterService.searchSailingSchedule(payload).subscribe(
                (resp: any) => {
                    if (resp.status) {
                        this.searchPerformed = true;
                        this.scheduleList = resp.data;
                        this.totalAmountOfCollections = this.scheduleList.length;
                        this.updatePaginationData();
                    }
                }
            )
            return;
        }

        // Either one is selected

        if(!this.portOfLoading && this.portOfDeparture || this.portOfLoading && !this.portOfDeparture){
            this.appSettingService.showWarning('Select both Loading and Departure Port');
            return;
        }
        const payload = {
            POLSid : parseInt(this.portOfLoading),
            PODSid : parseInt(this.portOfDeparture)
        }
        this.masterService.specialScheduleSearch(payload).subscribe(
            (resp:any)=>{
                if (resp.status) {
                    this.searchPerformed = true;
                    this.scheduleList = resp.data;
                    this.totalAmountOfCollections = this.scheduleList.length;
                    this.updatePaginationData();
                }
            }
        )
    }

    updatePaginationData(){
        let start = (this.page-1)*this.pageSize;
        let end = start + this.pageSize;
        this.slicedScheduleList = this.scheduleList.slice(start,end);
    }

    nagivateTocreateSailingSchedule() {
        this.router.navigate(['master/sailing-schedule/entry'])
    }

    deleteSchedule(VoyageMasterHeaderSid){
        const modalRef = this.dialog.open(DeleteWarningComponent);
        modalRef.afterClosed().subscribe(
            (res)=>{
                if(res){
                    this.masterService.deleteSailingScheduleById(VoyageMasterHeaderSid).subscribe(
                        (resp:any)=>{
                            if(resp.status){
                                this.appSettingService.showSuccess('Sailing Schedule Deleted Successfully');
                                this.onSearch();
                            } else {
                                this.appSettingService.showError('Error Deleting Sailing Schedule');
                            }
                        },
                        (error)=>{
                            console.error('Error Deleting Sailing Schedule',error);
                        }
                    )
                }
            }
        )
    }

    loadAllPorts(){
        this.masterService.getAllPorts().subscribe(
            (resp:any)=>{
                if(resp.status){
                    this.portList = resp.data;
                } else { 
                    this.appSettingService.showError('Error Loading Ports')
                }
            },
            (error)=>{
                console.error('Error Loading Ports',error);
            }
        )
    }

    report(): void {
        const formattedData = this.scheduleList.flatMap(item => {
            if (!item.voyageMasterDetail || item.voyageMasterDetail.length === 0) {
                return [{
                    vessel: item.vesselMaster?.VesselName,
                    POL: '',
                    POD: '',
                    ETA: '',
                    ETD: ''
                }];
            }
            return item.voyageMasterDetail.map(detail => ({
                vessel: item.vesselMaster?.VesselName,
                POL: detail?.portMasterPOL?.PortCode || '',
                POD: detail?.portMasterPOD?.PortCode  || '',
                ETA: detail?.ETA || '',
                ETD: detail?.ETD || ''
            }));
        });

        const companyName = this.userData?.userBranchMaster?.[0]?.companyMaster?.companyName ?? 'Company';

        this.excelReportService.exportAsExcel({
            data: formattedData,
            headers: [
                { key: 'vessel', label: 'Vsl/Voy' },
                { key: 'POL', label: 'POL' },
                { key: 'POD', label: 'POD' },
                { key: 'ETA', label: 'ETA' },
                { key: 'ETD', label: 'ETD' },
            ],
            fileName: 'Sailing-Schedule-Report', 
            title: companyName
        });
    }

    reset(){
        this.searchPerformed = false;
        this.scheduleList = [];
        this.slicedScheduleList = [];
        this.totalAmountOfCollections = 0;
        this.filterValue = '';
        this.searchType = 'VoyageNo';
        this.page = 1;
        
    }

}
