
import { ChangeDetectorRef, Component, OnInit, TemplateRef } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
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
import { TermsAndConditionsComponent } from 'src/app/component/terms&conditions/terms&conditions.component';
import { EmailEntryComponent } from 'src/app/modules/settings/email/email-entry/email-entry.component';
import { AuthorityEntryComponent } from '../../authority/authority-entry/authority-entry.component';
import { EdocComponent } from 'src/app/modules/settings/edoc/edoc/edoc.component';

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
        DatePipe,
        RouterModule
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
    portList : any[]=[];
    filteredPOLList : any[];
    filteredPODList : any[];
    active = 1;
    page=1;
    pageSize = 5;
    totalAmountOfCollections : number;
    modalRef: NgbModalRef
    model: NgbDateStruct;
    today = this.calendar.getToday();
    todayDate = new Date(this.today.year, this.today.month-1, this.today.day);
    sailHeadData: any;
    sailDetailData: any;
    minETADate : any;
    permissions: string[] = [];
  currentMenuPermissions: any = {};
  userData:any;
  etaEtdMustChange = false;
  snoChanged = false;
previousSnoEtd: Date | null = null;
formErrors: any = {}; 
originalSno: number | null = null;
isSnoDuplicate: boolean = false;


    modeOfStatus = [
        { id: "Active", name: "Active" },
        { id: "Suspended", name: "Suspended" },
    ]
    modeOfVoyageType = [
        { id: "1", name: "Sea" },
        { id: "2", name: "Air" },
        { id: "3", name: "Road" }
    ]
    currentMenuId: number;
    TandCList: any;
    
auditLogs: any[] = []; // Stores audit logs
  auditLogModalRef!: NgbModalRef;
currentCompany: any;
currentBranch: any



    constructor(
        private route : Router,
        private currentRoute : ActivatedRoute,
        private appSettingService : AppSettingsService,
        private masterService : MasterService,
        private modalService : NgbModal,
        private dialog : MatDialog,
        private fb : FormBuilder,
        private calendar: NgbCalendar,  
        private cdr: ChangeDetectorRef 
    ){}

    ngOnInit(): void {
        // this.appSettingService.getUser().subscribe(
        //    user => {
        //      if (user) {
        //        this.userData = user;
        //         this.checkPermissions();
        //      }
        //    }
        //  )
        this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));
       this.currentBranch = this.appSettingService.decrypt(localStorage.getItem('selected-branch'));
        const userProfile = this.appSettingService.getDecryptedUserProfile();
		if(userProfile){
			this.userData = userProfile;
      this.checkPermissions();
		}
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
        this.scheduleDetailForm.get('Sno').valueChanges.subscribe((value: number) => {
    if (!value) {
        this.isSnoDuplicate = false;
        return;
    }

    const duplicate = this.scheduleDetailList.find(
        item => item.Sno === value && item.VoyageMasterDetailSid !== this.VoyageMasterDetailSid
    );

    if (duplicate) {
        this.formErrors.sno = `Duplicate SNO not allowed (SNO ${value} already exists)`;
        this.isSnoDuplicate = true;
    } else {
        this.formErrors.sno = null;
        this.isSnoDuplicate = false;
    }
});

    }
    checkPermissions() {
    const currentMenuId = Number(localStorage.getItem('currentMenuId'));
    const userRole = this.userData?.userRoleMaster[0]?.RoleMasterSid;
    console.log(currentMenuId)
    console.log(userRole)
    if (currentMenuId && userRole) {
     this.masterService.getRoleMenuPermissions(currentMenuId, userRole).subscribe({
  next: (response) => {
    this.currentMenuPermissions = response.data.MenuPermissions || {};
    this.permissions = Object.keys(this.currentMenuPermissions)
      .filter(key => this.currentMenuPermissions[key] === 'isTrue');
      console.log(this.permissions)
  }
});
    }
  }
 
  hasPermission(permission: string): boolean {
  return this.permissions.includes(permission);
}

    initScheduleForm(){
        this.scheduleForm = this.fb.group({
            VesselMasterSid : [,[Validators.required]],
            VoyageNo : ['',[Validators.required]],
            RotationNumber : [''],
            ShipIRN : [''],
            CrewIRN : [''],
            SCMETA : [null],
            SCMETD : [null],
            SCMTCargoDescription : [''],
            Remarks : [''],
            status : ['Active'],
            CoLoad : [false],
            VoyageType : [null],
            Carrier : [null]
        })
    }

    initScheduleDetailForm(){
        this.scheduleDetailForm = this.fb.group({
            Sno: [null, [Validators.required, Validators.pattern(/^[0-9]+$/)]],
            POLSid : [,[Validators.required]],
            // PODSid : [,[Validators.required]],
            ETA : [,[Validators.required]],
            ETD : [,[Validators.required]],
            PortCutoff : [null],
            TransitDays : [''],
            RotationNo : [''],
            RotationDate : [null],
            IGMNo : [''],
            IGMDate : [null],
            EGMNo : [''],
            EGMDate : [null],
            detailstatus : ['Active']
        })
        this.scheduleDetailForm.get('TransitDays').disable()
        // this.scheduleDetailForm.get('PODSid')?.valueChanges.subscribe(() => {
        //     this.updatePOLList();
        // });

        // this.scheduleDetailForm.get('POLSid')?.valueChanges.subscribe(() => {
        //     this.updatePODList();
        // });

   
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
        const CompanyMasterSid = this.currentCompany?.CompanyMasterSid;
        forkJoin({
            vessels : this.masterService.getAllVessels(),
            carriers : this.masterService.getAllCarriers(CompanyMasterSid),
            ports : this.masterService.getAllPorts()
        }).subscribe(({vessels,carriers,ports})=>{
            this.vesselList = vessels.data,
            this.carrierList = carriers,
            this.portList = ports.data,
            this.filteredPOLList = ports.data,
            this.filteredPODList = ports.data
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
        this.masterService.getVoyageDetailByHeader(this.VoyageMasterHeaderSid).subscribe(
            (resp:any)=>{
                if(resp.status){
                     this.scheduleDetailList = resp.data.sort((a, b) => a.Sno - b.Sno);
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
        this.formErrors = {};
        if(this.scheduleForm.invalid){
            this.scheduleForm.markAllAsTouched();
            this.scheduleForm.updateValueAndValidity();
            this.appSettingService.showWarning('Please fill all the required fields');
            return;
        } 

        const createdBy = this.appSettingService.userSettingSource.value['userEmail'];
        const updatedBy = this.appSettingService.userSettingSource.value['userEmail'];
        const formValue = this.scheduleForm.value;

        if (this.etaEtdMustChange) {
    if (!formValue.ETA || !formValue.ETD) {
      this.appSettingService.showError(
        'Please update ETA and ETD before saving.'
      );
      return;
    }
  }

  // 🆕 Validate ETA > previous ETD and ETA < ETD
  const eta = new Date(formValue.ETA);
  const etd = new Date(formValue.ETD);

  if (this.previousSnoEtd && eta <= this.previousSnoEtd) {
    this.appSettingService.showError(
      'ETA must be greater than the previous Sno ETD.'
    );
    return;
  }

  if (eta >= etd) {
    this.appSettingService.showError('ETA must be less than ETD.');
    return;
  }

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
                        this.loadScheduleData()
                    } else {
                        this.appSettingService.showError(resp.message);
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
                        const sailId = resp.data.VoyageMasterHeaderSid;
                        if(sailId){
                            this.route.navigate(['master/sailing-schedule/entry',sailId]);
                        }
                    } else {
                        this.appSettingService.showError(resp.message);
                    }
                },
                (error)=>{
                    console.error('Error Creating Sailing Schedule',error);
                }
            )
        }
        this.etaEtdMustChange = false;
        this.sortScheduleDetails();
    }

    openDetailEntryModal(content : TemplateRef<any>,data ?: any, uiSno?: number){
        this.initScheduleDetailForm();
        // this.loadAllDetailFields();
        if(data){
            this.sailDetailData = data;
            this.isModalEditMode = true;
            this.VoyageMasterDetailSid = data.VoyageMasterDetailSid;
            this.originalSno = data.Sno;
            this.scheduleDetailForm.patchValue({
                Sno: uiSno ?? data.Sno,
                POLSid: data.POLSid || '',
                // PODSid: data.PODSid || '',
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
            this.minETADate = null
            this.VoyageMasterDetailSid = data.VoyageMasterDetailSid;
            this.filterPortList(data.POLSid);
        } else {
            const validSnos = this.slicedScheduleDetailList.map((d, i) => i + 1);
    const nextSno = validSnos.length > 0 ? Math.max(...validSnos) + 1 : 1;
    this.scheduleDetailForm.patchValue({ Sno: nextSno });
    this.originalSno = null;
            this.calculateMinETA();
            this.filterPortList();
        }
        this.modalRef = this.modalService.open(content, { size: 'lg',centered:true , backdrop : 'static' });
    }

    onModalSubmit() {
    this.formErrors = {};

    if (this.scheduleDetailForm.invalid) {
        this.scheduleDetailForm.markAllAsTouched();
        this.scheduleDetailForm.updateValueAndValidity();
        this.appSettingService.showWarning('Please fill all the required fields');
        return;
    }

    const createdBy = this.appSettingService.userSettingSource.value['userEmail'];
    const updatedBy = this.appSettingService.userSettingSource.value['userEmail'];
    const formValue = this.scheduleDetailForm.getRawValue();
    const newSno = parseInt(formValue.Sno);

    // --- DUPLICATE SNO VALIDATION ---
    const duplicate = this.scheduleDetailList.find(
        item => item.Sno === newSno && item.VoyageMasterDetailSid !== this.VoyageMasterDetailSid
    );
    if (duplicate) {
        this.formErrors.sno = `Duplicate SNO not allowed (SNO ${newSno} already exists)`;
        return;
    }

    // --- ETA/ETD VALIDATION ---
    const eta = new Date(formValue.ETA);
    const etd = new Date(formValue.ETD);

    const prev = this.scheduleDetailList.find(
        r => r.Sno === newSno - 1 && r.VoyageMasterDetailSid !== this.VoyageMasterDetailSid
    );
    const next = this.scheduleDetailList.find(
        r => r.Sno === newSno + 1 && r.VoyageMasterDetailSid !== this.VoyageMasterDetailSid
    );

    if (prev && eta <= new Date(prev.ETD)) {
        this.formErrors.etaOrder = `ETA must be after ETD of Sno ${prev.Sno}`;
        return;
    }

    if (next && etd >= new Date(next.ETA)) {
        this.formErrors.etaOrder = `ETD must be before ETA of Sno ${next.Sno}`;
        return;
    }

    if (eta >= etd) {
        this.formErrors.etaOrder = 'ETA must be less than ETD.';
        return;
    }

    // --- PREPARE PAYLOAD ---
    const payload = {
        Sno: newSno,
        POLSid: parseInt(formValue.POLSid),
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
        VoyageMasterHeaderSid: this.VoyageMasterHeaderSid,
        ...(this.isModalEditMode ? { updatedBy: updatedBy } : { createdBy: createdBy })
    };

    const request$ = this.isModalEditMode
        ? this.masterService.updateSailingScheduleDetailById(this.VoyageMasterDetailSid, payload)
        : this.masterService.createNewSailingScheduleDetail(payload);

    request$.subscribe(
        (resp: any) => {
            if (resp.status) {
                this.closeDetailForm();
                this.appSettingService.showSuccess(
                    this.isModalEditMode
                        ? 'Sailing Schedule Detail Updated Successfully'
                        : 'Sailing Schedule Detail Created Successfully'
                );
                this.loadScheduleDetails(); // reload to sync with backend
            } else {
                this.appSettingService.showError(resp.message || 'Error saving Sailing Schedule Detail');
            }
        },
        (error) => {
            console.error('Error in Sailing Schedule Detail API', error);
        }
    );

    // Re-sort list locally
    this.scheduleDetailList.sort((a, b) => a.Sno - b.Sno);
    this.updatePaginationData();
}




    sortScheduleDetails() {
    // Sort the schedule detail list after Sno change
    if (this.scheduleDetailList && this.scheduleDetailList.length > 0) {
        this.scheduleDetailList.sort((a, b) => a.Sno - b.Sno);
        this.updatePaginationData();
    }
    this.cdr.detectChanges(); // Trigger change detection manually
}

trackBySno(index: number, item: any): any {
    return item.Sno;  // Track by Sno to optimize rendering
  }


openAuditLogs(modal: TemplateRef<any>) {
  if (!this.VoyageMasterHeaderSid) return;

  this.masterService.getAuditLogsSailingSchedule('VoyageMasterHeader', this.VoyageMasterHeaderSid.toString()).subscribe({
    next: (logs: any[]) => {
      const formatFields = (val: any) => {
        if (!val) return ['NA'];
        const obj = typeof val === 'string' ? JSON.parse(val) : val;
        delete obj.updatedOn; // Remove updatedOn field
        // If no fields exist after deleting updatedOn
        if (Object.keys(obj).length === 0) return ['NA'];
        return Object.entries(obj).map(
          ([key, value]) => `${key}: ${value !== null && value !== undefined ? value : 'NA'}`
        );
      };

      this.auditLogs = logs.map(log => ({
        ...log,
        oldValDisplay: formatFields(log.oldVal),
        newValDisplay: formatFields(log.newVal)
      }));

      this.auditLogModalRef = this.modalService.open(modal, { centered: true, scrollable: true, windowClass: 'audit-log-modal' });
    },
    error: err => console.error('Error fetching audit logs:', err)
  });
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

    openTandC() {
		this.currentMenuId = Number(localStorage.getItem('currentMenuId'));
		const payload = { MenuMasterSid: this.currentMenuId };
		this.masterService.getTandCByCondition(payload).subscribe(
			(resp: any) => {
				if (resp.status) {
					this.TandCList = resp.data;
					const modalRef = this.modalService.open(TermsAndConditionsComponent, {
						size: 'lg',
						backdrop: 'static',
						centered: true
					});
					modalRef.componentInstance.terms = this.TandCList;
					modalRef.componentInstance.MenuMasterSid = this.currentMenuId;
					modalRef.componentInstance.DocumentSid = this.VoyageMasterHeaderSid;

				} else {
					this.appSettingService.showError('Error loading Terms and Conditions');
				}
			},
			(error) => {
				this.appSettingService.showError('Error loading Terms and Conditions', error);
			}
		);
	}

    openEmail() {
        if (!this.sailHeadData) return;
        const modalRef = this.modalService.open(EmailEntryComponent, {
            size: 'lg',
            centered: true,
            backdrop: 'static'
        });
    }

    openAuthority() {
      if (!this.sailHeadData) return;
      const modalRef = this.modalService.open(AuthorityEntryComponent, { 
        size: 'lg', 
        centered: true, 
        backdrop: 'static' 
      });
    }
    
    openEDoc() {
      if (!this.sailHeadData) return;
      const modalRef = this.modalService.open(EdocComponent, { 
        size: 'lg', 
        centered: true, 
        backdrop: 'static' 
      });
    }

    toggleCoLoad(event){
        event.preventDefault();
		const checkbox = event.target as HTMLInputElement;
		checkbox.checked = !checkbox.checked;
		this.scheduleForm.get('CoLoad')?.setValue(checkbox.checked);
		this.scheduleForm.get('CoLoad')?.updateValueAndValidity();
    }

    filterPortList(PortId ?: number){
        if(this.scheduleDetailList.length === 0){
			return;
		}
        let onlyPortId = this.scheduleDetailList.map(m => m.POLSid);
        if(PortId){
            onlyPortId = onlyPortId.filter(id => id !== PortId);
        }
        this.filteredPOLList = this.portList.filter( p => !onlyPortId.includes(p.PortMasterSid))
    }

    getFormattedPort(PortMasterSid) {
        if (!PortMasterSid || this.portList.length === 0) {
            return '';
        }
        const port = this.portList.find(p => p.PortMasterSid === PortMasterSid)
        return `${port.PortName} (${port.PortCode})`
    }

    calculateMinETA(){
		if(this.scheduleDetailList.length === 0){
			this.minETADate = this.toNgbDateStruct(this.todayDate);
			return;
		}
		const onlyETDDates = this.scheduleDetailList.map( m => m.ETD);
		onlyETDDates.sort((a,b)=>new Date(a).getTime() - new Date(b).getTime())
		const maxETA = onlyETDDates[onlyETDDates.length-1];
		this.minETADate = this.toNgbDateStruct(new Date(maxETA));
	}

}

