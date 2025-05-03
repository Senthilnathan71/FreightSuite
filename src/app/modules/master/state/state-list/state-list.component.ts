import { Component, OnInit } from '@angular/core';
import { FeatherModule } from 'angular-feather';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { Router } from '@angular/router';
import { AppService } from 'src/app/service/app.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { State } from 'src/app/modules/crm-mobile/Interfaces/state.interface';
import { MasterService } from '../../master.service';

@Component({
  selector: 'app-state-list',
  standalone: true,
  imports: [
    CommonModule,
    FeatherModule,
    NgbPaginationModule,
    FormsModule
  ],
  templateUrl: './state-list.component.html',
  styleUrl: './state-list.component.scss'
})
export class StateListComponent {
  state: State[] = [];
  errorMessage: string = '';
  page = 1;
  pageSize = 5;
  totalLengthOfCollection: number;
  searchText: string = '';
  filteredState: State[] = [];
  isMobile: boolean = false;
  constructor(private masterService: MasterService, private route: Router, private appService: AppService) { }

  ngOnInit(): void {
    this.loadState();
    this.isMobile = this.appService.getDevice();
  }
  createNew() {
    this.route.navigate(['crm/state/entry'])
  }

  loadState() {
    this.masterService.getAllState().subscribe(
      (resp: State[]) => {
        this.state = resp['data'];
        console.log(this.state);
        this.filteredState = [...this.state];
        this.totalLengthOfCollection = this.state.length || 0;
      },
      (error) => {
        this.errorMessage = error.message;
        console.error('Error loading ports:', error);
      }
    );
  }
}
