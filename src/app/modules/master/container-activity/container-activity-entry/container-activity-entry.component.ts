import { CommonModule, DatePipe } from '@angular/common';
import { Component, HostListener, OnDestroy, OnInit, TemplateRef } from '@angular/core';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FeatherModule } from 'angular-feather';
import { NgSelectModule } from '@ng-select/ng-select';
import { ActivatedRoute, Router } from '@angular/router';
import { MasterService } from '../../master.service';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { OnlyTextDirective } from 'src/app/core/Directives/onlyStringOfLength';
import { TextWithNumbersDirective } from 'src/app/core/Directives/textWithNumbers';
import { NgbDropdownModule, NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { DetailsComponent } from 'src/app/component/details/details.component';
import { PreventMultiClickDirective } from 'src/app/core/Directives/prevent-multi-click.directive';
import { TermsAndConditionsComponent } from 'src/app/component/terms&conditions/terms&conditions.component';
import { EmailEntryComponent } from 'src/app/modules/settings/email/email-entry/email-entry.component';
import { AuthorityEntryComponent } from '../../authority/authority-entry/authority-entry.component';
import { EdocComponent } from 'src/app/modules/settings/edoc/edoc/edoc.component';
import { AuthorityLogComponent } from 'src/app/component/authority-log/authority-log.component';
import { CommonService } from 'src/app/common/common.service';
import { MenuPermissionService } from 'src/app/core/services/menu-permission.service';
import { DocReferenceComponent } from 'src/app/modules/operation/doc-reference/doc-reference.component';
import { HasUnsavedChanges } from 'src/app/core/interfaces/has-unsaved-changes.interface';
import { Subject, debounceTime, takeUntil } from 'rxjs';
import { ElementStateGuardDirective } from 'src/app/core/Directives/element-state-guard.directive';
import { FormStateGuardDirective } from 'src/app/core/Directives/form-state-guard.directive';

@Component({
  selector: 'app-container-activity-entry',
  standalone: true,
  imports: [
    FeatherModule,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    OnlyTextDirective,
    TextWithNumbersDirective,
    NgSelectModule,
    DatePipe,
    PreventMultiClickDirective,
    NgbDropdownModule,
    ElementStateGuardDirective,
    FormStateGuardDirective
  ],
  templateUrl: './container-activity-entry.component.html',
  styleUrl: './container-activity-entry.component.scss'
})
export class ContainerActivityEntryComponent implements OnInit, OnDestroy, HasUnsavedChanges {

  containerActivityForm!: FormGroup;
  isEditMode = false;
  containerActivities: any[] = [];
  errorMessage: string = '';
  btnDisable: boolean = false;
  ContainerActivityMasterSid: number;
  containerActivityData: any;
  userData: any;
  permissions: string[] = [];
  currentMenuPermissions: any = {};
  isLoading: boolean = false;
  currentCompany: any;
currentBranch: any;
MenuMasterSid: any;
  
  // Track original values for comparison
  originalFormValues: any;
  originalNextActivities: any[] = [];
  isDirty: boolean = false;
  isSaving: boolean = false;
  private destroy$ = new Subject<void>();
  
  statusList = [
    { id: 'A', name: 'Active' },
    { id: 'S', name: 'Suspended' }
  ];

  containerMoveStatusList = [
    { id: 'Empty', name: 'Empty' },
    { id: 'Full', name: 'Full' }
  ];

  moveTypeList = [
    { id: 'Inbound', name: 'Inbound' },
    { id: 'Outbound', name: 'Outbound' }
  ];

  damageMoveOptions = [
    { id: 'Y', name: 'Yes' },
    { id: 'N', name: 'No' }
  ];

  availableActivities: any[] = [];
  nextActivities: any[] = [];
  selectedAvailableActivities: Set<number> = new Set();
  selectedNextActivities: Set<number> = new Set();
  
  companyList: any[] = [];
  currentMenuId: number;
  TandCList: any;
  auditLogs: any[] = [];
  auditLogModalRef!: NgbModalRef;

  constructor(
    private fb: FormBuilder,
    private masterService: MasterService,
    private appSettingService: AppSettingsService,
    private route: ActivatedRoute,
    private router: Router,
    private modalService: NgbModal,
    private commonService: CommonService,
    public mps : MenuPermissionService
  ) { }

  ngOnInit(): void {
    this.getAllCompanies();
    this.loadContainerActivities();
    this.mps.init().subscribe();
    this.initForm();
    this.subscribeToFormChanges();
    this.captureInitialState();
    this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));
    this.currentBranch = this.appSettingService.decrypt(localStorage.getItem('selected-branch'));
	this.MenuMasterSid =  sessionStorage.getItem('currentMenuId');
    this.route.paramMap.subscribe(params => {
      this.ContainerActivityMasterSid = +params.get('id');
      if (this.ContainerActivityMasterSid) {
        this.isEditMode = true;
        this.loadContainerActivityData(this.ContainerActivityMasterSid);
        this.containerActivityForm.get('Status')?.enable(); // Enable status in edit mode
      }
    });

    const userProfile = this.appSettingService.getDecryptedUserProfile();
    if (userProfile) {
      this.userData = userProfile;
     
    }
  }

 
  hasAnyDropdownPermission(): boolean {
    const dropdownButtons = ['Edoc', 'Authority', 'Email','Document Reference'];
    return dropdownButtons.some((btn) => this.permissions?.includes(btn));
    }

  loadContainerActivities(): void {
    this.isLoading = true;
    this.masterService.getAllContainerActivities().subscribe(
      (resp: any) => {
        this.isLoading = false;
        if (resp.status) {
          this.containerActivities = resp.data || [];
          this.availableActivities = [...this.containerActivities];
          this.nextActivities = [];
        } else {
          this.errorMessage = resp.message;
          this.appSettingService.showError(resp.message);
        }
      },
      (error) => {
        this.isLoading = false;
        this.errorMessage = error.message;
        this.appSettingService.showError('Error loading container activities');
        console.error('Error loading container activities:', error);
      }
    );
  }

  loadContainerActivityData(id: number): void {
    this.isLoading = true;
    
    this.masterService.getContainerActivityById(id).subscribe(
      (resp: any) => {
        this.isLoading = false;
        this.debugResponse(resp, 'getContainerActivityById');
        
        if (resp.status) {
          this.containerActivityData = resp.data;
          this.populateForm(this.containerActivityData);
          
          // Store original values for change detection
          this.originalFormValues = {...this.containerActivityForm.value};
          
          // Load next activities if editing
          if (this.containerActivityData.nextActivities && this.containerActivityData.nextActivities.length > 0) {
            // Store original next activities for change detection
            this.originalNextActivities = [...this.containerActivityData.nextActivities];
            
            // Map next activities to match the structure of available activities
            this.nextActivities = this.containerActivityData.nextActivities.map((nextAct: any) => {
              // Try to find the full activity object from the containerActivities list
              const fullActivity = this.containerActivities.find(
                a => a.ActivityCode === nextAct.ActivityCode || 
                     a.ContainerActivityMasterSid === nextAct.ContainerActivityMasterSid
              );
              return fullActivity || nextAct; // Use the full object if found, otherwise use the basic one
            });
            
            // Filter available activities to exclude those already in nextActivities
            this.availableActivities = this.containerActivities.filter(
              a => !this.nextActivities.some(na => 
                na.ActivityCode === a.ActivityCode || 
                na.ContainerActivityMasterSid === a.ContainerActivityMasterSid
              )
            );
          } else {
            // If no next activities, all activities are available
            this.availableActivities = [...this.containerActivities];
            this.nextActivities = [];
            this.originalNextActivities = [];
          }
          this.captureInitialState();
        } else {
          this.errorMessage = resp.message;
          this.appSettingService.showError(resp.message);
        }
      },
      (error) => {
        this.isLoading = false;
        this.errorMessage = error.message;
        this.appSettingService.showError('Error loading container activity data');
        console.error('Error loading container activity data:', error);
      }
    );
  }

  populateForm(data: any): void {
    this.containerActivityForm.patchValue({
      ActivityCode: data.ActivityCode,
      ActivityName: data.ActivityName,
      ContainerMoveStatus: data.ContainerMoveStatus,
      MoveType: data.MoveType,
      IsDamageMove: data.IsDamageMove === 'Y', 
      Remarks: data.Remarks,
      Status: data.Status || 'A'
    });
    
    // Enable status field in edit mode
    if (this.isEditMode) {
      this.containerActivityForm.get('Status')?.enable();
    }
  }

  initForm() {
    this.containerActivityForm = this.fb.group({
      ActivityCode: ['', [
        Validators.required,
        Validators.maxLength(5)
      ]],
      ActivityName: ['', [
        Validators.required,
        Validators.maxLength(100)
      ]],
      ContainerMoveStatus: ['', Validators.required],
      MoveType: ['', Validators.required],
      IsDamageMove: [false],
      Remarks: ['', Validators.maxLength(100)],
      Status: [{ value: 'A', disabled: true }, Validators.required], 
    });
  }

  // Check if form has changes
  hasFormChanges(): boolean {
    if (!this.isEditMode) return true;
    return this.isDirty;
  }

  // Check if activity mapping has changed
  hasActivityMappingChanged(): boolean {
    if (this.nextActivities.length !== this.originalNextActivities.length) {
      return true;
    }
    
    // Check if the same activities are in the same order
    for (let i = 0; i < this.nextActivities.length; i++) {
      const currentActivity = this.nextActivities[i];
      const originalActivity = this.originalNextActivities[i];
      
      if (!originalActivity || 
          currentActivity.ActivityCode !== originalActivity.ActivityCode ||
          currentActivity.ContainerActivityMasterSid !== originalActivity.ContainerActivityMasterSid) {
        return true;
      }
    }
    
    return false;
  }

  resetForm(): void {
    this.containerActivityForm.reset({
      IsDamageMove: 'N',
      Status: 'A'
    });
    
    // Disable status field in create mode
    if (!this.isEditMode) {
      this.containerActivityForm.get('Status')?.disable();
    }
    
    this.availableActivities = [...this.containerActivities];
    this.nextActivities = [];
    this.selectedAvailableActivities.clear();
    this.selectedNextActivities.clear();
    this.errorMessage = '';
    
    // Reset original values if in edit mode
    if (this.isEditMode && this.containerActivityData) {
      this.populateForm(this.containerActivityData);
      this.originalFormValues = {...this.containerActivityForm.value};
      
      // Reset next activities
      if (this.containerActivityData.nextActivities && this.containerActivityData.nextActivities.length > 0) {
        this.nextActivities = this.containerActivityData.nextActivities.map((nextAct: any) => {
          const fullActivity = this.containerActivities.find(
            a => a.ActivityCode === nextAct.ActivityCode || 
                 a.ContainerActivityMasterSid === nextAct.ContainerActivityMasterSid
          );
          return fullActivity || nextAct;
        });
        
        this.availableActivities = this.containerActivities.filter(
          a => !this.nextActivities.some(na => 
            na.ActivityCode === a.ActivityCode || 
            na.ContainerActivityMasterSid === a.ContainerActivityMasterSid
          )
        );
        
        this.originalNextActivities = [...this.containerActivityData.nextActivities];
      } else {
        this.availableActivities = [...this.containerActivities];
        this.nextActivities = [];
        this.originalNextActivities = [];
      }
    }
  }

  onSubmit(resolve?: (saved: boolean) => void) {
    // Enable status temporarily for validation
    if (this.containerActivityForm.get('Status')?.disabled) {
      this.containerActivityForm.get('Status')?.enable();
    }
    
    if (this.containerActivityForm.invalid) {
      this.containerActivityForm.markAllAsTouched();
      this.containerActivityForm.updateValueAndValidity();
      this.appSettingService.showWarning('Please fill all required fields correctly.');
      
      // Re-disable status if not in edit mode
      if (!this.isEditMode) {
        this.containerActivityForm.get('Status')?.disable();
      }
      if (resolve) resolve(false);
      return;
    }

    if (this.isSaving) {
      if (resolve) resolve(false);
      return;
    }

    if (this.isEditMode && !this.hasFormChanges()) {
      this.appSettingService.showWarning('No changes to save');
      if (resolve) resolve(false);
      return;
    }

    this.btnDisable = true;
    this.isSaving = true;
    const userEmail = this.appSettingService.userSettingSource.value['userEmail'];
    const formValue = this.containerActivityForm.value;
    const processedValue = {
      ...formValue,
      IsDamageMove: formValue.IsDamageMove ? 'Y' : 'N'
    };

    // Prepare next activities in the format expected by the backend
    const nextActivities = this.nextActivities.map((nextAct) => ({
      ActivityCode: nextAct.ActivityCode
    }));

    const payload = this.isEditMode ? {
      ...processedValue,
      UpdatedBy: userEmail,
      Status: processedValue.Status,
      TransactionSid: 0,
      nextActivities: nextActivities
    } : {
      ...processedValue,
      CreatedBy: userEmail,
      Status: processedValue.Status,
      TransactionSid: 0,
      nextActivities: nextActivities
    };

    console.log('Submitting payload:', payload);

    // Re-disable status if not in edit mode (after using the value)
    if (!this.isEditMode) {
      this.containerActivityForm.get('Status')?.disable();
    }

    if (this.isEditMode) {
      this.masterService.updateContainerActivityById(this.ContainerActivityMasterSid, payload).subscribe(
        (resp: any) => {
          this.btnDisable = false;
          this.isSaving = false;
          this.debugResponse(resp, 'updateContainerActivityById');
          
          if (resp.status) {
            this.captureInitialState();
            this.appSettingService.showSuccess(resp.message);
            this.router.navigate(['master/container-activity/entry',resp.data.ContainerActivityMasterSid]);
            if (resolve) resolve(true);
          } else {
            this.appSettingService.showError(resp.message);
            if (resolve) resolve(false);
          }
        },
        (error) => {
          this.btnDisable = false;
          this.isSaving = false;
          this.errorMessage = error.message;
          this.appSettingService.showError('Error updating container activity');
          console.error('Error updating container activity:', error);
          if (resolve) resolve(false);
        }
      );
    } else {
      this.masterService.createNewContainerActivity(payload).subscribe(
        (resp: any) => {
          this.btnDisable = false;
          this.isSaving = false;
          this.debugResponse(resp, 'createNewContainerActivity');
          
          if (resp.status) {
            this.loadContainerActivityData(resp.data.ContainerActivityMasterSid);
            this.captureInitialState();
            this.appSettingService.showSuccess(resp.message);
            this.router.navigate(['master/container-activity/entry',resp.data.ContainerActivityMasterSid]);
            if (resolve) resolve(true);
          } else {
            this.appSettingService.showError(resp.message);
            if (resolve) resolve(false);
          }
        },
        (error) => {
          this.btnDisable = false;
          this.isSaving = false;
          this.errorMessage = error.message;
          this.appSettingService.showError('Error creating container activity');
          console.error('Error creating container activity:', error);
          if (resolve) resolve(false);
        }
      );
    }
  }

  // Activity mapping methods
  toggleActivitySelection(activity: any, type: 'available' | 'next'): void {
    const activityId = activity.ContainerActivityMasterSid || activity.ActivityCode;
    
    if (type === 'available') {
      if (this.selectedAvailableActivities.has(activityId)) {
        this.selectedAvailableActivities.delete(activityId);
      } else {
        this.selectedAvailableActivities.add(activityId);
      }
    } else {
      if (this.selectedNextActivities.has(activityId)) {
        this.selectedNextActivities.delete(activityId);
      } else {
        this.selectedNextActivities.add(activityId);
      }
    }
  }

  isActivitySelected(activity: any, type: 'available' | 'next'): boolean {
    const activityId = activity.ContainerActivityMasterSid || activity.ActivityCode;
    return type === 'available' 
      ? this.selectedAvailableActivities.has(activityId)
      : this.selectedNextActivities.has(activityId);
  }

  moveSelectedToNext(): void {
    const activitiesToMove = this.availableActivities.filter(activity => 
      this.selectedAvailableActivities.has(activity.ContainerActivityMasterSid || activity.ActivityCode)
    );
    
    activitiesToMove.forEach(activity => {
      this.nextActivities.push(activity);
      this.availableActivities = this.availableActivities.filter(a => 
        a.ContainerActivityMasterSid !== activity.ContainerActivityMasterSid && 
        a.ActivityCode !== activity.ActivityCode
      );
    });
    
    this.selectedAvailableActivities.clear();
    this.updateDirtyState();
  }

  moveSelectedToAvailable(): void {
    const activitiesToMove = this.nextActivities.filter(activity => 
      this.selectedNextActivities.has(activity.ContainerActivityMasterSid || activity.ActivityCode)
    );
    
    activitiesToMove.forEach(activity => {
      this.availableActivities.push(activity);
      this.nextActivities = this.nextActivities.filter(a => 
        a.ContainerActivityMasterSid !== activity.ContainerActivityMasterSid && 
        a.ActivityCode !== activity.ActivityCode
      );
    });
    
    this.selectedNextActivities.clear();
    this.updateDirtyState();
  }

  moveActivityToNext(activity: any): void {
    this.nextActivities.push(activity);
    this.availableActivities = this.availableActivities.filter(a => 
      a.ContainerActivityMasterSid !== activity.ContainerActivityMasterSid && 
      a.ActivityCode !== activity.ActivityCode
    );
    this.updateDirtyState();
  }

  moveActivityToAvailable(activity: any): void {
    this.availableActivities.push(activity);
    this.nextActivities = this.nextActivities.filter(a => 
      a.ContainerActivityMasterSid !== activity.ContainerActivityMasterSid && 
      a.ActivityCode !== activity.ActivityCode
    );
    this.updateDirtyState();
  }

  // openAuditLogs(modal: TemplateRef<any>) {
  //   if (!this.ContainerActivityMasterSid) return;

  //   this.masterService.getAuditLogsContainer('ContainerActivityMaster', this.ContainerActivityMasterSid.toString()).subscribe({
  //     next: (logs: any[]) => {
  //       const formatFields = (val: any) => {
  //         if (!val) return ['NA'];
  //         const obj = typeof val === 'string' ? JSON.parse(val) : val;
  //         delete obj.updatedOn; // Remove updatedOn field
  //         // If no fields exist after deleting updatedOn
  //         if (Object.keys(obj).length === 0) return ['NA'];
  //         return Object.entries(obj).map(
  //           ([key, value]) => `${key}: ${value !== null && value !== undefined ? value : 'NA'}`
  //         );
  //       };

  //       this.auditLogs = logs.map(log => ({
  //         ...log,
  //         oldValDisplay: formatFields(log.oldVal),
  //         newValDisplay: formatFields(log.newVal)
  //       }));

  //       this.auditLogModalRef = this.modalService.open(modal, { centered: true, scrollable: true, windowClass: 'audit-log-modal' });
  //     },
  //     error: err => console.error('Error fetching audit logs:', err)
  //   });
  // }

  openAuditLogs(modal: TemplateRef<any>) {
  if (!this.ContainerActivityMasterSid) return;

  this.masterService.getAuditLogsContainer(
    'ContainerActivityMaster',
    this.ContainerActivityMasterSid.toString()
  ).subscribe({
    next: (logs: any[]) => {
      const ignoredFields = ['UpdatedOn','UpdatedBy']; // ✅ add more if needed later

      const formatFields = (val: any) => {
        if (!val) return [];
        const obj = typeof val === 'string' ? JSON.parse(val) : val;
        if (Object.keys(obj).length === 0) return [];
        return Object.entries(obj)
          .filter(([key]) => !ignoredFields.includes(key)) // 🚫 exclude fields
          .map(([key, value]) => `${key}: ${value ?? 'NA'}`);
      };

      this.auditLogs = logs
        .map(log => ({
          ...log,
          oldValDisplay: formatFields(log.oldVal),
          newValDisplay: formatFields(log.newVal),
        }))
        .filter(log => log.oldValDisplay.length > 0 || log.newValDisplay.length > 0);

      this.auditLogModalRef = this.modalService.open(modal, {
        centered: true,
        scrollable: true,
        windowClass: 'audit-log-modal'
      });
    },
    error: err => console.error('Error fetching audit logs:', err)
  });
}

  getAllCompanies() {
    this.masterService.getAllCompanies().subscribe({
      next: (res: any[]) => {
        this.companyList = res;
      },
      error: (error) => {
        console.error('Error loading companies:', error);
      }
    });
  }

  reset() {
    this.resetForm();
  }

  goBack() {
    this.router.navigate(['master/container-activity/list']);
  }

  showInfo() {
    if (!this.containerActivityData) return;
    const modalRef = this.modalService.open(DetailsComponent, { size: 'lg', centered: true, backdrop: 'static' });
    modalRef.componentInstance.item = this.containerActivityData;
    modalRef.componentInstance.idLabel = 'Container Activity Id';
    modalRef.componentInstance.idValue = this.containerActivityData?.ContainerActivityMasterSid;
  }

  // openTandC() {
  //   this.currentMenuId = Number(sessionStorage.getItem('currentMenuId'));
  //   const payload = { MenuMasterSid: this.currentMenuId };
  //   this.masterService.getTandCByCondition(payload).subscribe(
  //     (resp: any) => {
  //       if (resp.status) {
  //         this.TandCList = resp.data;
  //         const modalRef = this.modalService.open(TermsAndConditionsComponent, {
  //           size: 'lg',
  //           backdrop: 'static',
  //           centered: true
  //         });
  //         modalRef.componentInstance.terms = this.TandCList;
  //         modalRef.componentInstance.MenuMasterSid = this.currentMenuId;
  //         modalRef.componentInstance.DocumentSid = this.ContainerActivityMasterSid;
  //       } else {
  //         this.appSettingService.showError('Error loading Terms and Conditions');
  //       }
  //     },
  //     (error) => {
  //       this.appSettingService.showError('Error loading Terms and Conditions', error);
  //     }
  //   );
  // }

  openEmail() {
    if (!this.containerActivityData) return;
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
    modalRef.componentInstance.documentSid = this.ContainerActivityMasterSid;
  }

  openEDoc() {
    if (!this.containerActivityData) return;
    const modalRef = this.modalService.open(EdocComponent, { 
      size: 'lg', 
      centered: true, 
      backdrop: 'static' 
    });
    modalRef.componentInstance.item = this.containerActivityData;
    modalRef.componentInstance.idLabel = 'Container Activity Id';
    modalRef.componentInstance.idValue = this.containerActivityData?.ContainerActivityMasterSid;
    const data:any={
    CompanyMasterSid: this.currentCompany.CompanyMasterSid,
    BranchMasterSid: this.currentBranch.BranchMasterSid,
    MenuMasterSid : this.MenuMasterSid,
    DocumentSid: this.ContainerActivityMasterSid
  }

      this.commonService.documentData.set(data)
  }

  openDocRef() {
    const modalRef = this.modalService.open(DocReferenceComponent, {
      size: 'lg',
      centered: true,
      backdrop: 'static'
    });
  
    modalRef.componentInstance.CompanyMasterSid = this.currentCompany.CompanyMasterSid;
    modalRef.componentInstance.BranchMasterSid = this.currentBranch.BranchMasterSid;
    modalRef.componentInstance.MenuMasterSid = Number(this.MenuMasterSid);  
    modalRef.componentInstance.DocumentSid = this.ContainerActivityMasterSid;
  }
  @HostListener('window:beforeunload', ['$event'])
  unloadNotification($event: BeforeUnloadEvent): void {
    if (this.hasUnsavedChanges()) {
      $event.preventDefault();
      $event.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
    }
  }

  hasUnsavedChanges(): boolean {
    return this.isDirty;
  }

  async saveChanges(): Promise<boolean> {
    return new Promise((resolve) => {
      this.onSubmit(resolve);
    });
  }

  private subscribeToFormChanges(): void {
    this.containerActivityForm.valueChanges
      .pipe(takeUntil(this.destroy$), debounceTime(300))
      .subscribe(() => {
        this.updateDirtyState();
      });
  }

  private captureInitialState(): void {
    this.originalFormValues = this.containerActivityForm.getRawValue();
    this.originalNextActivities = this.serializeActivities(this.nextActivities);
    this.isDirty = false;
  }

  private updateDirtyState(): void {
    const formChanged = !this.deepEqual(
      this.containerActivityForm.getRawValue(),
      this.originalFormValues
    );
    const activitiesChanged = !this.deepEqual(
      this.serializeActivities(this.nextActivities),
      this.originalNextActivities
    );
    this.isDirty = formChanged || activitiesChanged;
  }

  private serializeActivities(activities: any[]): any[] {
    return (activities || []).map((a: any) => ({
      ActivityCode: a.ActivityCode,
      ContainerActivityMasterSid: a.ContainerActivityMasterSid
    }));
  }

  private normalizeValue(value: any): any {
    if (value === null || value === undefined) return null;
    if (value instanceof Date) return value.toISOString();
    if (typeof value === 'string' && value.trim() !== '' && !isNaN(+value)) return Number(value);
    if (typeof value === 'number') return Number(value.toFixed(6));
    if (Array.isArray(value)) return value.map(v => this.normalizeValue(v));
    if (typeof value === 'object') {
      return Object.keys(value)
        .sort()
        .reduce((acc: any, key) => {
          acc[key] = this.normalizeValue(value[key]);
          return acc;
        }, {});
    }
    return value;
  }

  private deepEqual(obj1: any, obj2: any): boolean {
    return JSON.stringify(this.normalizeValue(obj1)) === JSON.stringify(this.normalizeValue(obj2));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.commonService.clearDocumentData()
 }
  // Debug method to check API responses
  private debugResponse(resp: any, method: string) {
    console.log(`${method} Response:`, resp);
    console.log('Response status:', resp.status);
    console.log('Response data:', resp.data);
    console.log('Response message:', resp.message);
  }
  navigateToAddNewContainerActivity() {
    this.router.navigate(['master/container-activity/entry']);
  }
}
