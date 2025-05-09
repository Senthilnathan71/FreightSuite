// state-list.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FeatherModule } from 'angular-feather';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { Router, ActivatedRoute } from '@angular/router';
import { AppService } from 'src/app/service/app.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { State } from 'src/app/modules/crm-mobile/Interfaces/state.interface';
import { MasterService } from '../../master.service';
import { Subject, takeUntil } from 'rxjs';

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
  styleUrls: ['./state-list.component.scss']
})
export class StateListComponent implements OnInit, OnDestroy {
  state: State[] = [];
  errorMessage: string = '';
  page = 1;
  pageSize = 5;
  totalLengthOfCollection: number;
  searchText: string = '';
  filteredState: State[] = [];
  isMobile: boolean = false;
  highlightedId: number | null = null;
  loading = false;
  private destroy$ = new Subject<void>();

  constructor(
    private masterService: MasterService, 
    private router: Router,
    private route: ActivatedRoute,
    private appService: AppService,
  ) { }

  // In state-list.component.ts, modify ngOnInit():
ngOnInit(): void {
  // Always load data when component initializes
  this.loadState();
  
  this.isMobile = this.appService.getDevice();

  // Check for highlighted record in query params
  // Replace the existing queryParams subscription with this:
this.route.queryParams.pipe(
  takeUntil(this.destroy$)
).subscribe(params => {
  // Always check for refresh first
  if (params['refresh']) {
    this.loadState(); // Force data reload
  }

  // Then handle highlight if present
  if (params['highlight']) {
    this.highlightedId = +params['highlight'];
    
    // Scroll to the highlighted record after data loads
    setTimeout(() => {
      const element = document.getElementById(`state-${this.highlightedId}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        element.classList.add('highlight-row');
        setTimeout(() => element.classList.remove('highlight-row'), 3000);
      }
    }, 500);
  }
});

  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  createNew() {
    this.router.navigate(['/master/state/entry']);
  }

  loadState() {
    console.log('Loading state data...'); // Add this
    this.loading = true;
    this.masterService.getAllState().pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (resp: any) => {
        console.log('State data received:', resp); // Add this
        this.state = resp.data || resp;
        this.filteredState = [...this.state];
        this.totalLengthOfCollection = this.state.length || 0;
        this.loading = false;
      },
      error: (error) => {
        this.errorMessage = error.message;
        console.error('Error loading states:', error);
        this.loading = false;
      }
    });
  }

  onSearch() {
    if (!this.searchText) {
      this.filteredState = [...this.state];
      return;
    }

    const searchTextLower = this.searchText.toLowerCase();
    this.filteredState = this.state.filter(state => 
      (state.stateName && state.stateName.toLowerCase().includes(searchTextLower)) ||
      (state.stateCode && state.stateCode.toLowerCase().includes(searchTextLower)) ||
      (state.countryMaster?.countryName && state.countryMaster.countryName.toLowerCase().includes(searchTextLower))
    );
  }

  editState(stateId: number) {
    this.router.navigate(['/master/state/entry', stateId]);
  }

  deleteState(stateId: number) {
    if (confirm('Are you sure you want to delete this state?')) {
        this.loading = true;
        this.masterService.deleteStateById(stateId).subscribe({
            next: () => {
                this.state = this.state.filter(state => state.StateMasterSid !== stateId);
                this.filteredState = this.filteredState.filter(state => state.StateMasterSid !== stateId);
                this.totalLengthOfCollection = this.state.length;
                this.loading = false;
                alert('State deleted successfully!');
            },
            error: (err) => {
                this.loading = false;
                console.error('Detailed error:', err);
                
                let errorMessage = 'Error deleting state';
                if (err.error?.message) {
                    errorMessage += `: ${err.error.message}`;
                } else if (err.status === 500) {
                    errorMessage = 'Server error occurred while deleting state';
                }
                alert(errorMessage);
            }
        });
    }
}
}