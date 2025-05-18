import { Component, OnInit } from '@angular/core';
import { FeatherModule } from 'angular-feather';
import { Zone } from 'src/app/modules/crm-mobile/Interfaces/zone.interface';
import { MasterService } from '../../master.service';
import { MatDialog } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { DeleteWarningComponent } from 'src/app/modules/crm-mobile/delete-warning.component';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-zone-list',
  standalone: true,
  imports: [FeatherModule, FormsModule, RouterLink],
  templateUrl: './zone-list.component.html',
  styleUrl: './zone-list.component.scss',
})
export class ZoneListComponent implements OnInit {
  allZones: Zone[];
  filteredZones: Zone[];
  searchText: string = '';

  constructor(
    private masterService: MasterService,
    private matdig: MatDialog,
    private route: Router
  ) {}

  ngOnInit() {
    this.loadAllZones();
  }

  navigateToCreate() {
    this.route.navigateByUrl('master/zone/entry');
  }

  loadAllZones() {
    this.masterService.getAllZones().subscribe((res: Zone[]) => {
      this.allZones = res;
      this.filteredZones = res;
    });
  }

  loadZoneWithQuery() {
    const query = this.searchText.toLowerCase().trim();
    if (!query) {
      this.filteredZones = [...this.allZones];
    } else {
      this.filteredZones = this.allZones.filter((zone: Zone) => {
        return (
          zone.ZoneCode?.toLowerCase().includes(query) ||
          zone.ZoneName?.toLowerCase().includes(query)
        );
      });
    }
  }

  async deleteZone(zoneMasterSId: number) {
    const dialogRef = this.matdig.open(DeleteWarningComponent);
    dialogRef.afterClosed().subscribe((res) => {
      if (res) {
        this.masterService.deleteZone(zoneMasterSId).subscribe((res) => {
          console.log(`Deleted ${JSON.stringify(res)}`);
          this.loadAllZones();
        });
      }
    });
  }

 
}
