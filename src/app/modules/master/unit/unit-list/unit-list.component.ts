import { Component, OnInit } from '@angular/core';
import { FeatherModule } from 'angular-feather';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { Router, RouterModule } from '@angular/router';
import { AppService } from 'src/app/service/app.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { Unit } from 'src/app/modules/crm-mobile/Interfaces/unit.interface';
import { DeleteWarningComponent } from 'src/app/modules/crm-mobile/delete-warning.component';
import { MasterService } from '../../master.service';


@Component({
  selector: 'app-unit-list',
  standalone: true,
  imports: [
    CommonModule,
    FeatherModule,
    NgbPaginationModule,
    FormsModule,
    RouterModule
  ],
  templateUrl: './unit-list.component.html',
  styleUrl: './unit-list.component.scss'
})
export class UnitListComponent {
  unit: Unit[] = [];
  errorMessage: string = '';
  page = 1;
  pageSize = 5;
  totalLengthOfCollection: number;
  searchText: string = '';
  filteredUnit: Unit[] = [];
  isMobile: boolean = false;
  constructor(private masterService: MasterService, private route: Router, private appService: AppService, private appSettingService: AppSettingsService) { }

  ngOnInit(): void {
    this.loadUnit();
    this.isMobile = this.appService.getDevice();
  }
  createNew() {
    this.route.navigate(['crm/unit/entry'])
  }

  loadUnit(): void {
    this.masterService.getAllUnits().subscribe(
      (resp: Unit[]) => {
        this.unit = resp['data'];
        console.log(this.unit);
        this.filteredUnit = [...this.unit];
        this.totalLengthOfCollection = this.unit.length || 0;
      },
      (error) => {
        this.errorMessage = error.message;
        console.error('Error loading unit:', error);
      }
    );
  }

  searchUnit(): void {
    const searchQuery = this.searchText?.toLowerCase().trim(); // Trim spaces and handle null/undefined

    if (!searchQuery) {
      this.filteredUnit = [...this.unit];
    } else {
      this.filteredUnit = this.unit.filter((unit) => {
        return (
          unit.unitName?.toLowerCase().includes(searchQuery) ||
          unit.unitCode?.toLowerCase().includes(searchQuery) ||
          unit.jobType?.toLowerCase().includes(searchQuery) ||
          unit.containerType?.toLowerCase().includes(searchQuery) ||
          unit.measurementType?.toLowerCase().includes(searchQuery) ||
          unit.remarks?.toLowerCase().includes(searchQuery) ||
          (unit.status === 'A' ? 'Active' : 'Cancelled').toLowerCase().includes(searchQuery)
        );
      });
    }
  }


  // deleteUnit(id: number) {
  //   const dialogRef = this.dialog.open(DeleteWarningComponent);

  //   dialogRef.afterClosed().subscribe(result => {
  //     if (result === true) {
  //       this.masterService.deleteUnitById(id).subscribe((resp: any) => {

  //         this.appSettingService.showSuccess("Deleted!");
  //         console.log(resp);
  //         // if(resp.status){
  //         this.loadUnit();

  //         // }

  //       });
  //     }
  //   });
  // }

}
