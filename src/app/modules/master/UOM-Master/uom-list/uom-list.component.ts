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
import { Uom } from 'src/app/modules/crm-mobile/Interfaces/uom.interface';
import { DeleteWarningComponent } from 'src/app/modules/crm-mobile/delete-warning.component';
import { MasterService } from '../../master.service';

@Component({
  selector: 'app-uom-list',
  standalone: true,
  imports: [
    CommonModule,
    FeatherModule,
    NgbPaginationModule,
    FormsModule,
    RouterModule,
    MatDialogModule,
    MatButtonModule
  ],
  templateUrl: './uom-list.component.html',
  styleUrl: './uom-list.component.scss'
})
export class UOMListComponent {
  uom: Uom[] = [];
  errorMessage: string = '';
  page = 1;
  pageSize = 5;
  totalLengthOfCollection: number;
  searchText: string = '';
  filteredUom: Uom[] = [];
  isMobile: boolean = false;
  constructor(private masterService: MasterService, private route: Router, private appService: AppService, private dialog: MatDialog, private appSettingService: AppSettingsService) { }

  ngOnInit(): void {
    this.loadUom();
    this.isMobile = this.appService.getDevice();
  }

  createNew() {
    this.route.navigate(['crm/uom-master/view'])
  }

  loadUom(): void {
    this.masterService.getAllUom().subscribe(
      (resp: Uom[]) => {
        this.uom = resp['data'];
        console.log(this.uom);
        this.filteredUom = [...this.uom];
        this.totalLengthOfCollection = this.uom.length || 0;
      },
      (error) => {
        this.errorMessage = error.message;
        console.error('Error loading uom:', error);
      }
    );
  }

  searchUom(): void {
    const searchQuery = this.searchText?.toLowerCase().trim(); // Trim spaces and handle null/undefined

    if (!searchQuery) {
      this.filteredUom = [...this.uom];
    } else {
      this.filteredUom = this.uom.filter((uom) => {
        return (
          uom.UOMName?.toLowerCase().includes(searchQuery) ||
          uom.UOMCode?.toLowerCase().includes(searchQuery) ||
          (uom.status === 'A' ? 'Active' : 'Cancelled').toLowerCase().includes(searchQuery)
        );
      });
    }
  }

  deleteUom(id: number) {
    const dialogRef = this.dialog.open(DeleteWarningComponent);

    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        this.masterService.deleteUomById(id).subscribe((resp: any) => {

          this.appSettingService.showSuccess("Deleted!");
          console.log(resp);
          // if(resp.status){
          this.loadUom();

          // }

        });
      }
    });
  }
}
