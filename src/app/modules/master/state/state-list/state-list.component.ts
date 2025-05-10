import { Component } from '@angular/core';
import { FeatherModule } from 'angular-feather';
import { MasterService } from '../../master.service';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { DeleteWarningComponent } from 'src/app/modules/crm-mobile/delete-warning.component';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';

@Component({
  selector: 'app-state-list',
  standalone: true,
  imports: [
    FeatherModule,
    CommonModule,
    RouterModule,
    FormsModule,
    MatDialogModule
  ],
  templateUrl: './state-list.component.html',
  styleUrl: './state-list.component.scss'
})
export class StateListComponent {
  states: any;
  searchText: string = '';
  filterStateList: any[] = [];
  totalLengthofCollection: number = 0;
  countryList: any;

  constructor(
    private masterService: MasterService, 
    private router: Router, 
    private dialog: MatDialog,
    private appSettingService: AppSettingsService
  ) { }

  ngOnInit() {
    this.loadState();
  }

  loadState() {
    forkJoin({
      countries: this.masterService.getAllCountry(),
      states: this.masterService.getAllState()
    }).subscribe(({ countries, states }) => {
      this.countryList = countries.data;
      this.states = states.data.map(state => {
        const country = this.countryList.find(c => c.CountryMasterSid === state.CountryMasterSid);
        return {
          ...state,
          countryName: country ? country.countryName : ''
        };
      });
    });
  }

  deleteState(id: number) {
    const dialogRef = this.dialog.open(DeleteWarningComponent);

    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        this.masterService.deleteStateById(id).subscribe((resp: any) => {
          this.appSettingService.showSuccess("Deleted!");
          this.loadState();
        });
      }
    });
  }

  navigateToCreateState() {
    this.router.navigate(['master/state/entry']);
  }
}