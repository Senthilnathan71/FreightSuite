import { Component } from '@angular/core';
import { FeatherModule } from 'angular-feather';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MasterService } from '../../master.service';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { DeleteWarningComponent } from 'src/app/modules/crm-mobile/delete-warning.component';
import { Division } from 'src/app/modules/crm-mobile/Interfaces/division.interface';

@Component({
  selector: 'app-division-list',
  standalone: true,
  templateUrl: './division-list.component.html',
  styleUrl: './division-list.component.scss',
  imports: [
    FeatherModule,
    CommonModule,
    RouterModule,
    FormsModule,
    MatDialogModule
  ]
})
export class DivisionListComponent {
  divisionList: Division[] = [];
  searchType: string = '';
  searchName: string = '';

  constructor(
    private masterService: MasterService,
    private router: Router,
    private dialog: MatDialog,
    private appSettingService: AppSettingsService
  ) {}

  ngOnInit() {
    this.loadDivisions();
  }

  loadDivisions() {
    this.masterService.getAllDivisions().subscribe((response: any) => {
      if (response && response.data) {
        this.divisionList = response.data;
      }
    });
  }

  deleteDivision(id: number) {
    const dialogRef = this.dialog.open(DeleteWarningComponent);

    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        this.masterService.deleteDivisionById(id).subscribe((resp: any) => {
          this.appSettingService.showSuccess('Division deleted successfully.');
          this.loadDivisions();
        });
      }
    });
  }

  navigateToCreateDivision() {
    this.router.navigate(['master/division/entry']);
  }

  filterDivisionList() {
    const name = this.searchName.trim().toLowerCase();
    const type = this.searchType.trim().toLowerCase();

    this.masterService.getAllDivisions().subscribe((response: any) => {
      if (response && response.data) {
        this.divisionList = response.data.filter((division: Division) =>
          (!name || division.divisionName?.toLowerCase().includes(name)) &&
          (!type || division.divisionCode?.toLowerCase().includes(type))
        );
      }
    });
  }

  resetFilters() {
    this.searchName = '';
    this.searchType = '';
    this.loadDivisions();
  }
}
