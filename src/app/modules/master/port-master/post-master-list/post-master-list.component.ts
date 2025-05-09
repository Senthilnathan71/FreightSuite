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
import { Port } from 'src/app/modules/crm-mobile/Interfaces/port.interface';
import { DeleteWarningComponent } from 'src/app/modules/crm-mobile/delete-warning.component';
import { MasterService } from '../../master.service';
@Component({
  selector: 'app-post-master-list',
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
  templateUrl: './post-master-list.component.html',
  styleUrl: './post-master-list.component.scss'
})
export class PostMasterListComponent implements OnInit {
  ports: Port[] = [];
  errorMessage: string = '';
  page = 1;
  pageSize = 5;
  totalLengthOfCollection: number;
  searchText: string = '';
  filteredPorts: Port[] = [];
  isMobile: boolean = false;
  constructor(private masterService: MasterService, private route: Router, private appService: AppService, private dialog: MatDialog, private appSettingService: AppSettingsService) { }

  ngOnInit(): void {
    this.loadPorts();
    this.isMobile = this.appService.getDevice();
  }
  createNew() {
    this.route.navigate(['master/port-master/view'])
  }


  loadPorts(): void {
    this.masterService.getAllPorts().subscribe(
      (resp: Port[]) => {
        this.ports = resp['data'];
        console.log(this.ports);
        this.filteredPorts = [...this.ports];
        this.totalLengthOfCollection = this.ports.length || 0;
      },
      (error) => {
        this.errorMessage = error.message;
        console.error('Error loading ports:', error);
      }
    );
  }

  searchPorts(): void {
    const searchQuery = this.searchText?.toLowerCase().trim(); // Trim spaces and handle null/undefined

    if (!searchQuery) {
      this.filteredPorts = [...this.ports];
    } else {
      this.filteredPorts = this.ports.filter((port) => {
        return (
          port.PortName?.toLowerCase().includes(searchQuery) ||
          port.PortCode?.toLowerCase().includes(searchQuery) ||
          port.PortType?.toLowerCase().includes(searchQuery) ||
          String(port.TerminalCode).toLowerCase().includes(searchQuery) ||
          String((port.countryMaster) ? port.countryMaster.countryName : port.countryMaster).toLowerCase().includes(searchQuery) ||
          String((port.sectorMaster) ? port.sectorMaster.sectorName : port.sectorMaster).toLowerCase().includes(searchQuery) ||
          (port.status === 'A' ? 'Active' : 'Cancelled').toLowerCase().includes(searchQuery)
        );
      });
    }
  }


  deletePort(id: number) {
    const dialogRef = this.dialog.open(DeleteWarningComponent);

    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        this.masterService.deletePortById(id).subscribe((resp: any) => {

          this.appSettingService.showSuccess("Deleted!");
          console.log(resp);
          // if(resp.status){
          this.loadPorts();

          // }

        });
      }
    });
  }

}
