import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Router, RouterModule } from '@angular/router';
import { FeatherModule } from 'angular-feather';
import { MasterService } from '../../master.service';
import { forkJoin } from 'rxjs';
import { DeleteWarningComponent } from 'src/app/modules/crm-mobile/delete-warning.component';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';

@Component({
  selector: 'app-container-type-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    FeatherModule,
    MatDialogModule
  ],
  templateUrl: './container-type-list.component.html',
  styleUrl: './container-type-list.component.scss'
})
export class ContainerTypeListComponent {
  containerTypeList: any[] = [];
  searchText: string = '';

  constructor(
    private masterService: MasterService,
    private router: Router,
    private dialog: MatDialog,
    private appSettingService: AppSettingsService
  ){}

  ngOnInit() {
    this.loadContainerTypes();
  }

  loadContainerTypes() {
    this.masterService.getAllContainerType().subscribe((res:any)=> {
      this.containerTypeList = res.data || [];
    });
  }

  addNew() {
    this.router.navigate(['master/container-type/entry']);
  }

  editContainer(container:any) {
    this.router.navigate(['master/container-type/entry'], {
      queryParams: {id: container.ContainerTypeMasterSid}
    });
  }

  deleteContainer(container:any) {
    const dialogRef = this.dialog.open(DeleteWarningComponent);
    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        this.masterService.deleteContainerTypeById(container.ContainerTypeMasterSid).subscribe(() => {
          this.appSettingService.showSuccess("Deleted!");
          this.loadContainerTypes();
        });
      }
    });
  }
}
