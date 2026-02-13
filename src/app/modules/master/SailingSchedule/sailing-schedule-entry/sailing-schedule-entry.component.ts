import { ChangeDetectorRef, Component, effect, OnInit, TemplateRef } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { NgSelectModule } from '@ng-select/ng-select';
import { FeatherModule } from 'angular-feather';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { MasterService } from '../../master.service';
import { NgbCalendar, NgbDate, NgbDateAdapter, NgbDateParserFormatter, NgbDatepickerModule, NgbDateStruct, NgbDropdownModule, NgbModal, NgbModalRef, NgbNavModule, NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { MatDialog } from '@angular/material/dialog';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { forkJoin, Subject } from 'rxjs';
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
import { AuthorityLogComponent } from 'src/app/component/authority-log/authority-log.component';
import { SearchableDropdown } from 'src/app/component/searchable-dropdown/searchable-dropdown.component';
import { DropdownStore } from 'src/app/shared/dropdown/dropdown.store';
import { DROPDOWN_CONFIGS } from 'src/app/common/lookup-config';
import { CommonService } from 'src/app/common/common.service';
import { MenuPermissionService } from 'src/app/core/services/menu-permission.service';
import { FollowUpComponent } from 'src/app/modules/settings/follow-up/follow-up/follow-up.component';

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
        RouterModule,
        NgbDropdownModule,
        SearchableDropdown,
    ],
    templateUrl: './sailing-schedule-entry.component.html',
    styleUrl: './sailing-schedule-entry.component.scss',
    providers: [
        { provide: NgbDateAdapter, useClass: CustomDateAdapter },
        { provide: NgbDateParserFormatter, useClass: CustomDateParserFormatter },
    ],
})
export class SailingScheduleEntryComponent implements OnInit {
    private destroy$ = new Subject<void>();
    // Header-only form and state
    scheduleForm !: FormGroup;

    VoyageMasterHeaderSid : number | null = null;
    isEditMode = false;
    MenuMasterSid: any;
    vesselList : any[] = [];
    carrierList : any[] = [];
    portList : any[] = [];
    filteredPOLList : any[] = [];
    filteredPODList : any[] = [];

    modalRef!: NgbModalRef;
    model: NgbDateStruct;
    today = this.calendar.getToday();
    todayDate = new Date(this.today.year, this.today.month-1, this.today.day);

    sailHeadData: any;
    permissions: string[] = [];
    currentMenuPermissions: any = {};
    userData:any;

    selectedTab = 'Details';
    tab=[ { name: 'Details', icon: 'fas fa-info-circle' } ];
    page=1;
    pageSize = 5;

    TandCList: any;
    auditLogs: any[] = [];
    auditLogModalRef!: NgbModalRef;
    currentCompany: any;
    currentBranch: any;
    currentMenuId: number;

    // validation helpers
    formErrors: any = {};
    modeOfVoyageType = [
        { id: "1", name: "Sea" },
        { id: "2", name: "Air" },
        { id: "3", name: "Road" }
    ]
    modeOfStatus = [
        { id: "Active", name: "Active" },
        { id: "Suspended", name: "Suspended" },
    ]

    customerLookupConfig = DROPDOWN_CONFIGS.CUSTOMER;
    portLookupConfig = DROPDOWN_CONFIGS.PORT;


    constructor(
        public mps : MenuPermissionService, 
        private route : Router,
        private currentRoute : ActivatedRoute,
        private appSettingService : AppSettingsService,
        private masterService : MasterService,
        private modalService : NgbModal,
        private dialog : MatDialog,
        private fb : FormBuilder,
        private calendar: NgbCalendar,  
        private cdr: ChangeDetectorRef,
        public dropdownStore: DropdownStore,
        private commonService: CommonService
    ){
        effect(()=>{
            const vesselData= this.dropdownStore.vesselData();
            const carrierData = this.dropdownStore.customerTypeData();
            const portData = this.dropdownStore.ports();
            this.vesselList = vesselData;
            this.carrierList  = carrierData
            this.portList  = (portData || []).map(p => ({...p,Country : p.countryMaster?.countryName}));
        })
    }

    ngOnInit(): void {
        this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));
        this.currentBranch = this.appSettingService.decrypt(localStorage.getItem('selected-branch'));
        this.MenuMasterSid =  sessionStorage.getItem('currentMenuId');
        const userProfile = this.appSettingService.getDecryptedUserProfile();
        if(userProfile){
            this.userData = userProfile;
        }
        this.mps.init().subscribe();
        this.initScheduleForm();
        this.loadAllFields();

        // Listen for VoyageType changes -> apply port filters
        this.scheduleForm.get('VoyageType')?.valueChanges.subscribe((vt) => {
            this.applyPortTypeFilter(vt);
        });
        this.scheduleForm.get('POLSid')?.valueChanges.subscribe(() => {
            this.applyPolPodExclusion();
        });

        this.scheduleForm.get('PODSid')?.valueChanges.subscribe(() => {
            this.applyPolPodExclusion();
        });

        this.currentRoute.paramMap.subscribe((param)=>{
            const idParam = param.get('id');
            if (idParam) {
                this.VoyageMasterHeaderSid = +idParam;
                if(this.VoyageMasterHeaderSid){
                    this.isEditMode = true;
                    this.loadScheduleData();
                }
            }
        });
    }



    
    initScheduleForm(){
        // Header-only fields (includes ports and key dates)
        this.scheduleForm = this.fb.group({
            VesselMasterSid : [null,[Validators.required]],
            VoyageNo : ['',[Validators.required]],
            RotationNumber : ['',[Validators.maxLength(10)]],
            ShipIRN : ['',[Validators.maxLength(10)]],
            CrewIRN : ['',[Validators.maxLength(10)]],
            SCMETA : [null],
            SCMETD : [null],
            SCMTCargoDescription : ['',[Validators.maxLength(200)]],
            Remarks : ['',[Validators.maxLength(200)]],
            status : ['Active'],
            CoLoad : [false],
            VoyageType : ['Sea'],
            Carrier : [null],

            // NEW header port/date fields (replaces detail table)
            POLSid: [null],
            PODSid: [null],
            ETA: [null],
            ETD: [null],
            ATA: [null],
            ATD: [null],
            PortCutoff: [null],
            TransitDays: [{ value: '', disabled: true }]
        });

        // auto-calc transit days when ETA/ETD change
        this.scheduleForm.get('ETA')?.valueChanges.subscribe((etaValue:Date) => {
            if(!etaValue) return;
            const etdVal : Date = this.scheduleForm.get('ETD')?.value;
            if(etdVal){
                const msPerDay = 1000 * 60 * 60 * 24;
                const dayDifference = Math.trunc((new Date(etaValue).getTime() - new Date(etdVal).getTime())/msPerDay);
                this.scheduleForm.get('TransitDays')?.setValue(isNaN(dayDifference) ? '' : dayDifference);
            }
        });

        // ensure ETD < ETA
        this.scheduleForm.get('ETD')?.valueChanges.subscribe(() => {
            const etd = this.scheduleForm.get('ETD')?.value;
            const eta = this.scheduleForm.get('ETA')?.value;
            if (etd && eta && new Date(etd) >= new Date(eta)) {
                this.formErrors.etaEtd = 'ETD must be less than ETA.';
            } else {
                delete this.formErrors.etaEtd;
            }
        });
    }

    loadAllFields() {
    const CompanyMasterSid = this.currentCompany?.CompanyMasterSid;
    const payload = {
        CompanyMasterSid: CompanyMasterSid,
        types: ['carrier']
    };

    // Load all required data first
    forkJoin({
        ports: this.dropdownStore.loadPorts(),
        vessels: this.dropdownStore.loadVessels(),
        carriers: this.dropdownStore.loadCustomerTypeData(payload)
    }).subscribe({
        next: () => {
            // Initialize port lists with ALL ports initially
            this.portList = [...this.dropdownStore.ports()];
            this.filteredPOLList = [...this.dropdownStore.ports()];
            this.filteredPODList = [...this.dropdownStore.ports()];

            // Apply voyage type filter if needed
            const currentVoyageType = this.scheduleForm.get('VoyageType')?.value;
            this.applyPortTypeFilter(currentVoyageType, true);
            
            // If we're in edit mode and have data, ensure POL/POD are displayed
            if (this.sailHeadData && this.VoyageMasterHeaderSid) {
                this.ensurePolPodDisplay();
            }
        },
        error: (error) => {
            console.error('Error loading fields:', error);
        }
    });
}

private ensurePolPodDisplay() {
    if (!this.sailHeadData) return;

    const polSid = this.sailHeadData.POLSid;
    const podSid = this.sailHeadData.PODSid;

    // If POL exists in data but not in filtered list, add it
    if (polSid && !this.filteredPOLList.some(p => p.PortMasterSid === polSid)) {
        const allPorts = this.dropdownStore.ports();
        const polPort = allPorts.find(p => p.PortMasterSid === polSid);
        if (polPort) {
            this.filteredPOLList = [polPort, ...this.filteredPOLList];
        }
    }

    // If POD exists in data but not in filtered list, add it
    if (podSid && !this.filteredPODList.some(p => p.PortMasterSid === podSid)) {
        const allPorts = this.dropdownStore.ports();
        const podPort = allPorts.find(p => p.PortMasterSid === podSid);
        if (podPort) {
            this.filteredPODList = [podPort, ...this.filteredPODList];
        }
    }

    this.cdr.detectChanges();
}

    applyPolPodExclusion() {
        // Always start from the base filtered lists (which may be full lists or already voyage-filtered lists)
        const basePOL = this.filteredPOLList.length ? [...this.filteredPOLList] : [...this.dropdownStore.ports()];
        const basePOD = this.filteredPODList.length ? [...this.filteredPODList] : [...this.dropdownStore.ports()];

        const selectedPOL = this.scheduleForm.get('POLSid')?.value;
        const selectedPOD = this.scheduleForm.get('PODSid')?.value;

        // Filter POD list: exclude selected POL
        this.filteredPODList = basePOD.filter(p => p.PortMasterSid !== selectedPOL);

        // Filter POL list: exclude selected POD  
        this.filteredPOLList = basePOL.filter(p => p.PortMasterSid !== selectedPOD);

        // Clear selections if they're no longer valid
        if (selectedPOD && !this.filteredPODList.some(p => p.PortMasterSid === selectedPOD)) {
            this.scheduleForm.get('PODSid')?.setValue(null);
        }
        if (selectedPOL && !this.filteredPOLList.some(p => p.PortMasterSid === selectedPOL)) {
            this.scheduleForm.get('POLSid')?.setValue(null);
        }

        this.cdr.markForCheck();
    }

    /**
     * Apply port filtering based on voyage type.
     * - Accepts voyageType string: 'Sea'|'Air'|'Road' or null to reset to all ports.
     * - Tries to detect port type via common keys: PortType, PortCategory, Type.
     */
    applyPortTypeFilter(voyageType: string | null | undefined, init = false) {
    // If no ports loaded yet, return
    if (!this.dropdownStore.ports() || this.dropdownStore.ports().length === 0) {
        return;
    }

    const allPorts = [...this.dropdownStore.ports()];
    
    // When voyageType is falsy, show all ports
    if (!voyageType) {
        this.filteredPOLList = allPorts;
        this.filteredPODList = allPorts;
        this.portList = allPorts;
        if (!init) {
            this.clearPolPodIfNotInList();
        }
        this.cdr.markForCheck();
        return;
    }

    // Apply voyage type filtering
    const vt = ('' + voyageType).toLowerCase();
    
    const portMatchesVoyageType = (port: any) => {
        if (!port) return true; // If we can't determine, include it
        
        const portType = (port.PortType || port.PortCategory || port.Type || '').toString().toLowerCase();
        
        if (vt === 'sea') {
            return !portType || portType.includes('sea') || portType.includes('port') || 
                   portType.includes('ocean') || portType.includes('harb');
        }
        if (vt === 'air') {
            return !portType || portType.includes('air') || portType.includes('aero');
        }
        if (vt === 'road') {
            return !portType || portType.includes('road') || portType.includes('inland') || 
                   portType.includes('truck') || portType.includes('rail');
        }
        
        return true; // Default to including if voyage type doesn't match known types
    };

    const filteredPorts = allPorts.filter(portMatchesVoyageType);
    
    // Use filtered ports, but fallback to all ports if filtering removes everything
    this.filteredPOLList = filteredPorts.length > 0 ? filteredPorts : allPorts;
    this.filteredPODList = filteredPorts.length > 0 ? filteredPorts : allPorts;
    this.portList = filteredPorts.length > 0 ? filteredPorts : allPorts;

    if (!init) {
        this.clearPolPodIfNotInList();
    }
    
    // Ensure current selections are still available
    this.ensurePolPodDisplay();
    this.cdr.markForCheck();
}

    // Clear POL/POD if they do not exist in currently filtered lists
    clearPolPodIfNotInList() {
        const pol = this.scheduleForm.get('POLSid')?.value;
        const pod = this.scheduleForm.get('PODSid')?.value;

        const polExists = this.filteredPOLList.some(p => p.PortMasterSid === pol);
        const podExists = this.filteredPODList.some(p => p.PortMasterSid === pod);

        if (pol && !polExists) {
            this.scheduleForm.get('POLSid')?.setValue(null);
        }
        if (pod && !podExists) {
            this.scheduleForm.get('PODSid')?.setValue(null);
        }
    }

    loadScheduleData() {
        if (!this.VoyageMasterHeaderSid) return;

        this.masterService.getSailingScheduleById(this.VoyageMasterHeaderSid).subscribe(
            (resp: any) => {
                if (resp.status) {
                    this.sailHeadData = resp.data;
                    const scheduleData = resp.data;
                    console.log('Loading schedule data:', scheduleData);
                    if (this.dropdownStore.ports().length === 0) {
                    this.dropdownStore.loadPorts().subscribe(() => {
                        this.patchFormData(scheduleData);
                    });
                } else {
                    this.patchFormData(scheduleData);
                }
            } else {
                this.appSettingService.showError('Error Loading Sailing Schedule');
            }
        },
        (error) => {
            console.error('Error Loading Sailing Schedule', error);
        }
    );
}
private patchFormData(scheduleData: any) {
                    // Patch the form first
                    this.scheduleForm.patchValue({
                        ...scheduleData,
                        SCMETA: scheduleData.SCMETA ? new Date(scheduleData.SCMETA) : null,
                        SCMETD: scheduleData.SCMETD ? new Date(scheduleData.SCMETD) : null,
                        CoLoad: scheduleData.CoLoad === 'Y',
                        status: scheduleData.status === 'A' ? 'Active' : 'Suspended',
                        POLSid: scheduleData.POLSid ?? null,
                        PODSid: scheduleData.PODSid ?? null,
                        ETA: scheduleData.ETA ? new Date(scheduleData.ETA) : null,
                        ETD: scheduleData.ETD ? new Date(scheduleData.ETD) : null,
                        ATA: scheduleData.ATA ? new Date(scheduleData.ATA) : null,
                        ATD: scheduleData.ATD ? new Date(scheduleData.ATD) : null,
                        PortCutoff: scheduleData.PortCutoff ? new Date(scheduleData.PortCutoff) : null,
                        TransitDays: scheduleData.TransitDays ?? '',
                        VoyageType: scheduleData.VoyageType ?? this.scheduleForm.get('VoyageType')?.value
                    });

                    // Ensure port lists are filtered after form patch
                     this.ensurePolPodDisplay();
    
    // Apply filters
    const currentVoyageType = this.scheduleForm.get('VoyageType')?.value;
    this.applyPortTypeFilter(currentVoyageType, true);
    this.applyPolPodExclusion();

    // Force change detection
    this.cdr.detectChanges();
}

    // ------- Save / Update header only -------
    onSubmit(){
        this.formErrors = {};

        if(this.scheduleForm.invalid){
            this.scheduleForm.markAllAsTouched();
            this.scheduleForm.updateValueAndValidity();
            this.appSettingService.showWarning('Please fill all the required fields');
            return;
        }

        // ETA/ETD validation
        const etdVal = this.scheduleForm.get('ETD')?.value;
        const etaVal = this.scheduleForm.get('ETA')?.value;
        if (etdVal && etaVal && new Date(etdVal) >= new Date(etaVal)) {
            this.appSettingService.showError('ETD must be less than ETA.');
            return;
        }

        const createdBy = this.appSettingService.userSettingSource.value['userEmail'];
        const updatedBy = this.appSettingService.userSettingSource.value['userEmail'];
        const formValue = this.scheduleForm.getRawValue();
        const CompanyMasterSid = this.currentCompany?.CompanyMasterSid;
        const BranchMasterSid = this.currentBranch?.BranchMasterSid;

        const payload: any = {
            ...formValue,
            CompanyMasterSid : this.currentCompany?.CompanyMasterSid,
			BranchMasterSid : this.currentBranch?. BranchMasterSid,
            VesselMasterSid : parseInt(formValue.VesselMasterSid),
            Carrier : formValue.Carrier ? parseInt(formValue.Carrier) : null,
            CoLoad : formValue.CoLoad ? 'Y' : 'N',
            status : formValue.status === 'Active' || formValue.status === 'A' ? 'A' : 'S',
            POLSid: formValue.POLSid ? parseInt(formValue.POLSid) : null,
            PODSid: formValue.PODSid ? parseInt(formValue.PODSid) : null,
            ETA: formValue.ETA,
            ETD: formValue.ETD,
            ATA: formValue.ATA,
            ATD: formValue.ATD,
            PortCutoff: formValue.PortCutoff,
            TransitDays: formValue.TransitDays ? parseInt(formValue.TransitDays) : null,
            ...(this.isEditMode ? { updatedBy } : { createdBy })
        };

        if(this.isEditMode && this.VoyageMasterHeaderSid){
            this.masterService.updateSailingScheduleById(this.VoyageMasterHeaderSid,payload).subscribe(
                (resp:any)=>{
                    if(resp.status){
                        this.appSettingService.showSuccess("Sailing Schedule saved successfully");
                        this.loadScheduleData();
                    } else {
                        this.appSettingService.showError(resp.message || 'Error updating sailing schedule');
                    }
                },
                (error)=>{
                    console.error('Error Updating Sailing Schedule',error);
                }
            );
        } else {
            this.masterService.createNewSailingSchedule(payload).subscribe(
                (resp:any)=>{
                    if(resp.status){
                        this.appSettingService.showSuccess('New SailingSchedule is successfully created');
                        const sailId = resp.data?.VoyageMasterHeaderSid;
                        if(sailId){
                            this.route.navigate(['master/sailing-schedule/entry',sailId]);
                        }
                    } else {
                        this.appSettingService.showError(resp.message || 'Error creating sailing schedule');
                    }
                },
                (error)=>{
                    console.error('Error Creating Sailing Schedule',error);
                }
            );
        }
    }

    resetForm() {
        if (this.isEditMode && this.VoyageMasterHeaderSid) {
            this.loadScheduleData();
            return;
        }

        this.scheduleForm.reset({
            VesselMasterSid: null,
            VoyageNo: '',
            RotationNumber: '',
            ShipIRN: '',
            CrewIRN: '',
            SCMETA: null,
            SCMETD: null,
            SCMTCargoDescription: '',
            Remarks: '',
            status: 'Active',
            CoLoad: false,
            VoyageType: null,
            Carrier: null,
            POLSid: null,
            PODSid: null,
            ETA: null,
            ETD: null,
            ATA: null,
            ATD: null,
            PortCutoff: null,
            TransitDays: ''
        });

        // restore full lists
        this.filteredPOLList = [...this.dropdownStore.ports()];
        this.filteredPODList = [...this.dropdownStore.ports()];

        this.scheduleForm.markAsUntouched();
        this.scheduleForm.markAsPristine();
        this.scheduleForm.updateValueAndValidity();

        this.sailHeadData = null;
        this.VoyageMasterHeaderSid = null;
        this.formErrors = {};
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

    openTandC() {
        this.currentMenuId = Number(sessionStorage.getItem('currentMenuId'));
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
        const MenuMasterSid = sessionStorage.getItem('currentMenuId');
        if (!MenuMasterSid) return;
        const modalRef = this.modalService.open(AuthorityLogComponent, { 
            size: 'lg', 
            centered: true, 
            backdrop: 'static' 
        });
        modalRef.componentInstance.menuMasterSid = MenuMasterSid;
        modalRef.componentInstance.documentSid = this.VoyageMasterHeaderSid;
    }

    openEDoc() {
        if (!this.sailHeadData) return;
        const modalRef = this.modalService.open(EdocComponent, { 
            size: 'lg', 
            centered: true, 
            backdrop: 'static' 
        });
        const data:any={
    CompanyMasterSid: this.currentCompany.CompanyMasterSid,
    BranchMasterSid: this.currentBranch.BranchMasterSid,
    MenuMasterSid : this.MenuMasterSid,
    DocumentSid: this.VoyageMasterHeaderSid
  }

      this.commonService.documentData.set(data)
    }

    toggleCoLoad(event:any){
        event.preventDefault();
        const checkbox = event.target as HTMLInputElement;
        checkbox.checked = !checkbox.checked;
        this.scheduleForm.get('CoLoad')?.setValue(checkbox.checked);
        this.scheduleForm.get('CoLoad')?.updateValueAndValidity();
    }

    getFormattedPort(PortMasterSid:any) {
        if (!PortMasterSid || this.dropdownStore.ports().length === 0) {
            return '';
        }
        const port = this.dropdownStore.ports().find(p => p.PortMasterSid === PortMasterSid)
        return port ? `${port.PortName} (${port.PortCode})` : '';
    }

    openAuditLogs(modal: TemplateRef<any>) {
        if (!this.VoyageMasterHeaderSid) return;

        this.masterService.getAuditLogsSailingSchedule('VoyageMasterHeader', this.VoyageMasterHeaderSid.toString()).subscribe({
            next: (logs: any[]) => {
                const formatFields = (val: any) => {
                    if (!val) return ['NA'];
                    const obj = typeof val === 'string' ? JSON.parse(val) : val;
                    delete obj.updatedOn; // Remove updatedOn field
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

    openFollowup(){
        const modalRef = this.modalService.open(FollowUpComponent,{
            size : 'lg',
            backdrop : 'static',
            centered : true
        })
    }

    ngOnDestroy(): void {
    this.dropdownStore.clearCache()
    this.destroy$.next();
    this.destroy$.complete();
  }
  navigateToCreate() {
    this.route.navigate(['/master/sailing-schedule/entry']);
  }
}
