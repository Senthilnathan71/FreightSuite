import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit, TemplateRef } from '@angular/core';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FeatherModule } from 'angular-feather';
import { NgSelectModule } from '@ng-select/ng-select';
import { ActivatedRoute, Router } from '@angular/router';
import { MasterService } from '../../master.service';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { OnlyTextDirective } from 'src/app/core/Directives/onlyStringOfLength';
import { TextWithNumbersDirective } from 'src/app/core/Directives/textWithNumbers';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { DetailsComponent } from 'src/app/component/details/details.component';
import { PreventMultiClickDirective } from 'src/app/core/Directives/prevent-multi-click.directive';
import { TermsAndConditionsComponent } from 'src/app/component/terms&conditions/terms&conditions.component';
import { EmailEntryComponent } from 'src/app/modules/settings/email/email-entry/email-entry.component';
import { AuthorityEntryComponent } from '../../authority/authority-entry/authority-entry.component';
import { EdocComponent } from 'src/app/modules/settings/edoc/edoc/edoc.component';

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
    PreventMultiClickDirective
  ],
  templateUrl: './container-activity-entry.component.html',
  styleUrl: './container-activity-entry.component.scss'
})
export class ContainerActivityEntryComponent implements OnInit {

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
  selectedAvailableActivities: any[] = [];
  selectedNextActivities: any[] = [];
  
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
    private modalService: NgbModal
  ) { }

  ngOnInit(): void {
    this.getAllCompanies();
    this.loadContainerActivities();
    this.initForm();

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
      this.checkPermissions();
    }
  }

  checkPermissions() {
    const currentMenuId = Number(localStorage.getItem('currentMenuId'));
    const userRole = this.userData?.userRoleMaster[0]?.RoleMasterSid;
    
    if (currentMenuId && userRole) {
      this.masterService.getRoleMenuPermissions(currentMenuId, userRole).subscribe({
        next: (response) => {
          this.currentMenuPermissions = response.data.MenuPermissions || {};
          this.permissions = Object.keys(this.currentMenuPermissions)
            .filter(key => this.currentMenuPermissions[key] === 'isTrue');
        },
        error: (error) => {
          console.error('Error fetching permissions:', error);
        }
      });
    }
  }

  hasPermission(permission: string): boolean {
    return this.permissions.includes(permission);
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
          
          // Load next activities if editing
          if (this.containerActivityData.nextActivities) {
            this.nextActivities = [...this.containerActivityData.nextActivities];
            this.availableActivities = this.containerActivities.filter(
              a => !this.nextActivities.some(na => na.ActivityCode === a.ActivityCode)
            );
          }
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
      IsDamageMove: ['N'],
      Remarks: ['', Validators.maxLength(100)],
      Status: [{ value: 'A', disabled: true }, Validators.required], 
    });
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
    this.errorMessage = '';
  }

  onSubmit() {
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
      return;
    }
    
    this.btnDisable = true;
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
      ...formValue,
      UpdatedBy: userEmail,
      Status: formValue.Status,
      TransactionSid: 0,
      nextActivities: nextActivities
    } : {
      ...formValue,
      CreatedBy: userEmail,
      Status: formValue.Status,
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
          this.debugResponse(resp, 'updateContainerActivityById');
          
          if (resp.status) {
            this.appSettingService.showSuccess(resp.message);
            this.router.navigate(['master/container-activity/list']);
          } else {
            this.appSettingService.showError(resp.message);
          }
        },
        (error) => {
          this.btnDisable = false;
          this.errorMessage = error.message;
          this.appSettingService.showError('Error updating container activity');
          console.error('Error updating container activity:', error);
        }
      );
    } else {
      this.masterService.createNewContainerActivity(payload).subscribe(
        (resp: any) => {
          this.btnDisable = false;
          this.debugResponse(resp, 'createNewContainerActivity');
          
          if (resp.status) {
            this.appSettingService.showSuccess(resp.message);
            this.router.navigate(['master/container-activity/list']);
          } else {
            this.appSettingService.showError(resp.message);
          }
        },
        (error) => {
          this.btnDisable = false;
          this.errorMessage = error.message;
          this.appSettingService.showError('Error creating container activity');
          console.error('Error creating container activity:', error);
        }
      );
    }
  }

  moveActivityToNext(activity: any) {
    this.nextActivities.push(activity);
    this.availableActivities = this.availableActivities.filter(a => a.ActivityCode !== activity.ActivityCode);
  }

  moveActivityToAvailable(activity: any) {
    this.availableActivities.push(activity);
    this.nextActivities = this.nextActivities.filter(a => a.ActivityCode !== activity.ActivityCode);
  }

  openAuditLogs(modal: TemplateRef<any>) {
    if (!this.ContainerActivityMasterSid) return;

    this.masterService.getAuditLogsContainerType('ContainerActivityMaster', this.ContainerActivityMasterSid.toString()).subscribe({
      next: (logs: any[]) => {
        const formatFields = (val: any) => {
          if (!val) return ['NA'];
          const obj = typeof val === 'string' ? JSON.parse(val) : val;
          delete obj.updatedOn;
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
      error: err => {
        console.error('Error fetching audit logs:', err);
        this.appSettingService.showError('Error loading audit logs');
      }
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
          modalRef.componentInstance.DocumentSid = this.ContainerActivityMasterSid;
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
    if (!this.containerActivityData) return;
    const modalRef = this.modalService.open(EmailEntryComponent, {
      size: 'lg',
      centered: true,
      backdrop: 'static'
    });
  }

  openAuthority() {
    if (!this.containerActivityData) return;
    const modalRef = this.modalService.open(AuthorityEntryComponent, { 
      size: 'lg', 
      centered: true, 
      backdrop: 'static' 
    });
    modalRef.componentInstance.item = this.containerActivityData;
    modalRef.componentInstance.idLabel = 'Container Activity Id';
    modalRef.componentInstance.idValue = this.containerActivityData?.ContainerActivityMasterSid;
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
  }

  // Debug method to check API responses
  private debugResponse(resp: any, method: string) {
    console.log(`${method} Response:`, resp);
    console.log('Response status:', resp.status);
    console.log('Response data:', resp.data);
    console.log('Response message:', resp.message);
  }
}