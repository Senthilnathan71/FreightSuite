import { Component, OnInit, TemplateRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NgSelectModule } from '@ng-select/ng-select';
import { FeatherModule } from 'angular-feather';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { MasterService } from '../../master.service';
import { NgbCalendar, NgbDate, NgbDateAdapter, NgbDateParserFormatter, NgbDatepickerModule, NgbDateStruct, NgbModal, NgbModalRef, NgbNavModule, NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { MatDialog } from '@angular/material/dialog';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { DeleteWarningComponent } from 'src/app/modules/crm-mobile/delete-warning.component';
import { CommonModule, DatePipe, UpperCasePipe } from '@angular/common';
import { OnlyNumbersDirective } from 'src/app/core/Directives/onlyNumbersOfLength';
import { OnlyTextDirective } from 'src/app/core/Directives/onlyStringOfLength';
import { TextWithNumbersDirective } from 'src/app/core/Directives/textWithNumbers';
import { CustomDateAdapter } from 'src/app/component/datepicker/custom-date-adapter';
import { CustomDateParserFormatter } from 'src/app/component/datepicker/custom-date-parser';
import { CustomDatePipe } from 'src/app/core/pipes/custom-date-format.pipe';
import { DetailsComponent } from 'src/app/component/details/details.component';

@Component({
    selector: 'app-sailing-schedule-entry',
    standalone: true,
    imports: [
        NgSelectModule, 
        FeatherModule,
        ReactiveFormsModule,
        NgbDatepickerModule,
        FormsModule,
        NgbNavModule,
        CommonModule,
        UpperCasePipe,
        NgbPaginationModule,
        OnlyNumbersDirective,
        OnlyTextDirective,
        TextWithNumbersDirective,
        CustomDatePipe,
        DatePipe
    ],
    templateUrl: './sailing-schedule-entry.component.html',
    styleUrl: './sailing-schedule-entry.component.scss',
    providers: [
        { provide: NgbDateAdapter, useClass: CustomDateAdapter },
        { provide: NgbDateParserFormatter, useClass: CustomDateParserFormatter },
    ],
})
export class SailingScheduleEntryComponent implements OnInit {

    scheduleDetailList : any[];
    slicedScheduleDetailList : any[];
    scheduleForm !: FormGroup;
    scheduleDetailForm !:FormGroup;
    VoyageMasterHeaderSid : number;
    VoyageMasterDetailSid : number;
    isEditMode : boolean;
    isModalEditMode : boolean;
    vesselList : any[];
    carrierList : any[];
    portList : any[];
    filteredPOLList : any[];
    filteredPODList : any[];
    active = 1;
    page=1;
    pageSize = 5;
    totalAmountOfCollections : number;
    modalRef: NgbModalRef
    model: NgbDateStruct;
    today = this.calendar.getToday();
    todayDate = new Date(this.today.year, this.today.month, this.today.day);
    sailHeadData: any;
    sailDetailData: any;


    modeOfStatus = [
        { id: "Active", name: "Active" },
        { id: "Suspended", name: "Suspended" },
    ]
    modeOfVoyageType = [
        { id: "1", name: "Sea" },
        { id: "2", name: "Air" },
        { id: "3", name: "Road" }
    ]

    constructor(
        private route : Router,
        private currentRoute : ActivatedRoute,
        private appSettingService : AppSettingsService,
        private masterService : MasterService,
        private modalService : NgbModal,
        private dialog : MatDialog,
        private fb : FormBuilder,
        private calendar: NgbCalendar,   
    ){}

    ngOnInit(): void {
        this.initScheduleForm();
        this.loadAllFields();
        this.currentRoute.paramMap.subscribe(
            (param)=>{
                this.VoyageMasterHeaderSid = +param.get('id');
                if(this.VoyageMasterHeaderSid){
                    this.isEditMode = true;
                    this.loadScheduleData();
                }
            }
        )
    }

    initScheduleForm(){
        this.scheduleForm = this.fb.group({
            VesselMasterSid : [,[Validators.required]],
            VoyageNo : ['',[Validators.required]],
            RotationNumber : ['',[Validators.required]],
            ShipIRN : ['',[Validators.required]],
            CrewIRN : ['',[Validators.required]],
            SCMETA : ['',[Validators.required]],
            SCMETD : [,[Validators.required]],
            SCMTCargoDescription : [,[Validators.required]],
            Remarks : ['',[Validators.required]],
            status : ['Active'],
            CoLoad : [false],
            VoyageType : [''],
            Carrier : []
        })
    }

    initScheduleDetailForm(){
        this.scheduleDetailForm = this.fb.group({
            POLSid : [,[Validators.required]],
            PODSid : [,[Validators.required]],
            ETA : [,[Validators.required]],
            ETD : [,[Validators.required]],
            PortCutoff : [,[Validators.required]],
            TransitDays : [,[Validators.required]],
            RotationNo : [,[Validators.required]],
            RotationDate : [,[Validators.required]],
            IGMNo : [,[Validators.required]],
            IGMDate : [,],
            EGMNo : [,[Validators.required]],
            EGMDate : [,[Validators.required]],
            detailstatus : ['Active']
        })
        this.scheduleDetailForm.get('PODSid')?.valueChanges.subscribe(() => {
            this.updatePOLList();
        });

        this.scheduleDetailForm.get('POLSid')?.valueChanges.subscribe(() => {
            this.updatePODList();
        });
        this.scheduleDetailForm.get('ETD').valueChanges.subscribe((value:Date)=>{
            if(!value){
                return;
            }
            const ETA : Date = this.scheduleDetailForm.get('ETA').value;
            if(ETA){
                const msPerDay = 1000 * 60 * 60 * 24;
                const dayDifference = Math.trunc((value.getTime() - ETA.getTime())/msPerDay);
                this.scheduleDetailForm.get('TransitDays').setValue(dayDifference);
            }
        })
    }

    loadAllFields(){
        forkJoin({
            vessels : this.masterService.getAllVessels(),
            carriers : this.masterService.getAllCustomers(),
        }).subscribe(({vessels,carriers})=>{
            this.vesselList = vessels.data,
            this.carrierList = carriers
        })
    }

    loadScheduleData(){
        this.masterService.getSailingScheduleById(this.VoyageMasterHeaderSid).subscribe(
            (resp:any)=>{
                if(resp.status){
                    this.sailHeadData = resp.data;
                    const scheduleData = resp.data;
                    this.scheduleForm.patchValue({
                        ...scheduleData,
                        SCMETA: new Date(scheduleData.SCMETA),
                        SCMETD: new Date(scheduleData.SCMETD),
                        CoLoad : scheduleData.CoLoad === 'Y' ? true : false,
                        status : scheduleData.status === 'A' ? 'Active' : 'Suspended'
                    })
                    this.loadScheduleDetails();
                } else {
                    this.appSettingService.showError('Error Loading Sailing Schedule');
                }
            },
            (error)=>{
                console.error('Error Loading Sailing Schedule',error);
            }
        )
    }

    loadScheduleDetails(){
        this.masterService.getAllSailingScheduleDetail().subscribe(
            (resp:any)=>{
                if(resp.status){
                    const allScheduleDetails = resp.data;
                    this.scheduleDetailList = allScheduleDetails.filter(scheduleDetail => scheduleDetail.VoyageMasterHeaderSid === this.VoyageMasterHeaderSid);
                    this.totalAmountOfCollections = this.scheduleDetailList.length;
                    this.updatePaginationData();
                }
            }
        )
    }

    deleteSailingScheduleDetail(VoyageMasterDetailSid){
        const modalRef = this.dialog.open(DeleteWarningComponent);
        modalRef.afterClosed().subscribe(
            (res)=>{
                if(res){
                    this.masterService.deleteSailingScheduleDetailById(VoyageMasterDetailSid).subscribe(
                        (resp:any)=>{
                            if(resp.status){
                                this.appSettingService.showSuccess('Sailing Schedule Details Successfully Deleted');
                                this.loadScheduleDetails();
                            } else {
                                this.appSettingService.showError('Error Deleting Sailing Schedule Details');
                            }
                        },
                        (error)=>{
                            console.error('Error Deleting Sailing Schedule Details',error);
                        }
                    )
                }
            }
        )
    }

    onSubmit(){
        if(this.scheduleForm.invalid){
            this.scheduleForm.markAllAsTouched();
            this.scheduleForm.updateValueAndValidity();
            this.appSettingService.showWarning('Please fill all the required fields');
            return;
        } 

        const createdBy = this.appSettingService.userSettingSource.value['userEmail'];
        const updatedBy = this.appSettingService.userSettingSource.value['userEmail'];
        const formValue = this.scheduleForm.value;

        const payload = {
            ...formValue,
            VesselMasterSid : parseInt(formValue.VesselMasterSid),
            SCMETA : formValue.SCMETA,
            SCMETD : formValue.SCMETD,
            Carrier : parseInt(formValue.Carrier),
            CoLoad : formValue.CoLoad ? 'Y' : 'N',
            status : formValue.status === 'Active' ? 'A' : 'S',
            ...(this.isEditMode ? {updatedBy : updatedBy} :{createdBy : createdBy} )
        }
        console.log(payload);
        if(this.isEditMode){
            this.masterService.updateSailingScheduleById(this.VoyageMasterHeaderSid,payload).subscribe(
                (resp:any)=>{
                    if(resp.status){
                        this.appSettingService.showSuccess('Sailing Schedule Updated Successfully');
                        this.route.navigate(['master/sailing-schedule/list']);
                    } else {
                        this.appSettingService.showError('Error Updating Sailing Schedule');
                    }
                },
                (error)=>{
                    console.error('Error Updating Sailing Schedule',error);
                }
            )
        } else {
            this.masterService.createNewSailingSchedule(payload).subscribe(
                (resp:any)=>{
                    if(resp.status){
                        this.appSettingService.showSuccess('Sailing Schedule Created Successfully');
                        this.route.navigate(['master/sailing-schedule/list']);
                    } else {
                        this.appSettingService.showError('Error Creating Sailing Schedule');
                    }
                },
                (error)=>{
                    console.error('Error Creating Sailing Schedule',error);
                }
            )
        }

    }

    openDetailEntryModal(content : TemplateRef<any>,data ?: any){
        this.initScheduleDetailForm();
        this.loadAllDetailFields();
        if(data){
            this.sailDetailData = data;
            this.isModalEditMode = true;
            this.scheduleDetailForm.patchValue({
                POLSid: data.POLSid || '',
                PODSid: data.PODSid || '',
                ETA: new Date(data.ETA) || '',
                ETD: new Date(data.ETD) || '',
                PortCutoff: new Date(data.PortCutoff) || '' ,
                TransitDays: data.TransitDays || '',
                RotationNo: data.RotationNo || '',
                RotationDate: new Date(data.RotationDate) || '',
                IGMNo: data.IGMNo || '' ,
                IGMDate: new Date(data.IGMDate) || '',
                EGMNo: data.EGMNo || '',
                EGMDate: new Date(data.EGMDate) || '',
                detailstatus: data.status === 'A' ? 'Active' : 'Suspended'
            })
            this.VoyageMasterDetailSid = data.VoyageMasterDetailSid;
        } 
        this.modalRef = this.modalService.open(content, { size: 'lg',centered:true , backdrop : 'static' });
    }

    onModalSubmit(){
        if(this.scheduleDetailForm.invalid){
            this.scheduleDetailForm.markAllAsTouched();
            this.scheduleDetailForm.updateValueAndValidity();
            this.appSettingService.showWarning('Please fill all the required fields');
            return;
        } 

        const createdBy = this.appSettingService.userSettingSource.value['userEmail'];
        const updatedBy = this.appSettingService.userSettingSource.value['userEmail'];
        const formValue = this.scheduleDetailForm.value;

        const payload = {
            POLSid: parseInt(formValue.POLSid),
            PODSid: parseInt(formValue.PODSid),
            ETA: formValue.ETA,
            ETD: formValue.ETD,
            PortCutoff: formValue.PortCutoff,
            TransitDays: parseInt(formValue.TransitDays),
            RotationNo: formValue.RotationNo,
            RotationDate: formValue.RotationDate,
            IGMNo: formValue.IGMNo,
            IGMDate: formValue.IGMDate,
            EGMNo: formValue.EGMNo,
            EGMDate: formValue.EGMDate,
            status: formValue.detailstatus === 'Active' ? 'A' : 'S',
            VoyageMasterHeaderSid : this.VoyageMasterHeaderSid ,
            ...(this.isModalEditMode ? { updatedBy: updatedBy} : { createdBy: createdBy })
        }
        console.log(payload);
        if(this.isModalEditMode){
            this.masterService.updateSailingScheduleDetailById(this.VoyageMasterDetailSid,payload).subscribe(
                (resp:any)=>{
                    if(resp.status){
                        this.closeDetailForm();
                        this.appSettingService.showSuccess('Sailing Schedule Detail Updated Successfully');
                        this.loadScheduleDetails();
                    } else {
                        this.appSettingService.showError('Error Updating Sailing Schedule Detail');
                    }
                },
                (error)=>{
                    console.error('Error Updating Sailing Schedule Detail',error);
                }
            )
        } else {
            this.masterService.createNewSailingScheduleDetail(payload).subscribe(
                (resp:any)=>{
                    if(resp.status){
                        this.closeDetailForm();
                        this.appSettingService.showSuccess('Sailing Schedule Detail Created Successfully');
                        this.loadScheduleDetails();
                    } else {
                        this.appSettingService.showError('Error Creating Sailing Schedule Details');
                    }
                },
                (error)=>{
                    console.error('Error Creating Sailing Schedule Details',error);
                }
            )
        }

    }

    loadAllDetailFields(){
        this.masterService.getAllPorts().subscribe(
            (resp:any)=>{
                if(resp.status){
                    this.portList = resp.data;
                    this.filteredPOLList = this.portList;
                    this.filteredPODList = this.portList;
                } else {
                    this.appSettingService.showError('Error Loading All Ports')
                }
            },
            (error)=>{
                console.error('Error Loading All Ports',error);
            }
        )
    }

    // toNgbDate(isoDateString: string): NgbDate | null {
    //     if (!isoDateString) return null;

    //     const date = new Date(isoDateString);

    //     if (isNaN(date.getTime())) return null;

    //     return NgbDate.from({
    //         year: date.getFullYear(),
    //         month: date.getMonth() + 1,
    //         day: date.getDate()
    //     });
    // }

    // toIsoDateString(ngbDate: NgbDate | null): string | null {
    //     if (!ngbDate) return null;

    //     // Create a JS Date (Note: month - 1 because JS months are 0-based)
    //     const jsDate = new Date(ngbDate.year, ngbDate.month - 1, ngbDate.day,12,0,0);
    //     return jsDate.toISOString();
    // }


    updatePOLList() {
        if(!this.portList) return;
        const selectedPOD = this.scheduleDetailForm.get('PODSid')?.value;
        if (selectedPOD) {
            this.filteredPOLList = this.portList.filter(
                port => port.PortMasterSid !== selectedPOD
            );
        }
    }

    updatePODList() {
        if(!this.portList) return;
        const selectedPOL = this.scheduleDetailForm.get('POLSid')?.value;
        if (selectedPOL) {
            this.filteredPODList = this.portList.filter(
                port => port.PortMasterSid !== selectedPOL
            );
        }
    }



    updatePaginationData(){
        let start = (this.page - 1)*this.pageSize;
        let end = start + this.pageSize;
        this.slicedScheduleDetailList = this.scheduleDetailList.slice(start,end);
    }

    closeDetailForm(){
        this.scheduleDetailForm.reset({
            detailstatus : 'Active'
        })
        this.modalRef.close();
        this.isModalEditMode = false;
    }
    
    resetForm(){
        this.scheduleForm.reset({
            status : 'Active'
        })
    }

    navigateBack() {
        history.back();
    }

    toNgbDateStruct(date: Date | null): NgbDateStruct | null {
		if (!date) return null;
		return {
			year: date.getFullYear(),
			month: date.getMonth() + 1,
			day: date.getDate()
		};
	}

    showHeaderInfo() {
        if (!this.sailHeadData) return;
        const modalRef = this.modalService.open(DetailsComponent, { size: 'lg', centered: true, backdrop: 'static' });
        modalRef.componentInstance.item = this.sailHeadData;
        modalRef.componentInstance.idLabel = 'Sailing Schedule Header Id';
        modalRef.componentInstance.idValue = this.sailHeadData?.VoyageMasterHeaderSid;
    }
    showDetailInfo() {
        if (!this.sailDetailData) return;
        const modalRef = this.modalService.open(DetailsComponent, { size: 'lg', centered: true, backdrop: 'static' });
        modalRef.componentInstance.item = this.sailDetailData;
        modalRef.componentInstance.idLabel = 'Sailing Schedule Detail Id';
        modalRef.componentInstance.idValue = this.sailDetailData?.VoyageMasterDetailSid;
    }
}

