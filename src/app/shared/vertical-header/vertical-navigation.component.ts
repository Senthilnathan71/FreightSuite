import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { CommonModule } from '@angular/common';
import { Component, AfterViewInit, EventEmitter, Output, ViewChild, TemplateRef, NgModule, OnInit, ChangeDetectorRef, ViewChildren, QueryList, ElementRef } from '@angular/core';
import { NgbAccordionModule, NgbCarouselModule, NgbDropdown, NgbDropdownModule, NgbModal, NgbModalRef, NgbModule, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { TranslateService } from '@ngx-translate/core';
import { FeatherModule } from 'angular-feather';
import { NgScrollbarModule } from 'ngx-scrollbar';
import { Router, RouterModule } from '@angular/router';
import { VerticalNavService } from './vertical-navigation.service';
import { TimeAgoPipe } from 'src/app/core/pipes/timeAgo.pipe';
import { FormsModule } from '@angular/forms';
import { Branch } from 'src/app/modules/crm-mobile/Interfaces/branch.interface';
import { CompanySettingsManagerService } from 'src/app/core/services/company-settings-manager.service';
import { Subject, takeUntil, debounceTime, distinctUntilChanged, switchMap, of, catchError, take } from 'rxjs';
import { MasterService } from 'src/app/modules/master/master.service';
import { DocumentSearchResult } from './document-search.interface';
import { VerticalSidebarService } from '../vertical-sidebar/vertical-sidebar.service';
import { RouteInfo } from '../vertical-sidebar/vertical-sidebar.metadata';
import { LogoService } from 'src/app/core/services/logo.service';

declare var $: any;


interface notifications {
  btn: string;
  icon: string;
  title: string;
  subject: string;
  time: string;
}

interface messages {
  useravatar: string;
  status: string;
  from: string;
  subject: string;
  time: string;
}

@Component({
  selector: 'app-vertical-navigation',
  standalone: true,
  imports: [NgbDropdownModule, RouterModule, FeatherModule, NgScrollbarModule, CommonModule, NgbAccordionModule, NgbCarouselModule, NgbModule, TimeAgoPipe, FormsModule,NgbTooltipModule],
  templateUrl: './vertical-navigation.component.html'
})
export class VerticalNavigationComponent implements OnInit, AfterViewInit {
  recentList: any[] = [];
  favouriteList: any[] = [];
  outside = 'outside'
  
  @Output() toggleSidebar = new EventEmitter<void>();
  userData:any;
  branchName: string = '';
  companyName: string = '';
  public showSearch = false;
  filteredBranchList: any[] = [];
  companyList: any[] = [];
branchList: any[] = [];
  selectedBranchCompany: any;
  selectedBranchId: any;
  selectedCompanyId: any = null;
  @ViewChild('branchSwitchModal') branchSwitchModal!: TemplateRef<any>;
  private modalRef!: NgbModalRef;
  financialYears: any[] = [];
  selectedYearId: number | null = null;
  private unsubscribe$ = new Subject<void>();


  // Menu Search Related Variable Declaration
  menuSearchResults : any[] = [];
  allMenus : any[] = [];
  isLoadingMenu = false ;
  menuSearchError = '';
  private menuSearchSubject = new Subject<string>();
  @ViewChild('searchMenuInput') searchMenuInput!: ElementRef<HTMLInputElement>;
  @ViewChild('menuSearchDropdown') menuSearchDropdown!: NgbDropdown;
  menuActiveIndex = -1;

  // Document Search Related Variables
  docSearchResults: DocumentSearchResult[] = [];
  isSearchingDocs = false;
  docSearchError = '';
  private docSearchSubject = new Subject<string>();
  @ViewChild('docSearchInput') docSearchInput!: ElementRef<HTMLInputElement>;
  @ViewChild('docSearchDropdown') docSearchDropdown!: NgbDropdown;
  docActiveIndex = -1;

  constructor(
    private router: Router,
    private appSettingsService: AppSettingsService,
    private translate: TranslateService,
    private verticalNavService: VerticalNavService,
    private modalService: NgbModal,
    private cdr: ChangeDetectorRef,
    private companySettingsManager: CompanySettingsManagerService,
    private logoService : LogoService,
    private masterService : MasterService,
    private verticalSidebarService : VerticalSidebarService
  ) {
    // translate.setDefaultLang('en');
  }
ngOnInit(): void {
  this.userData = this.appSettingsService.getDecryptedUserProfile();
  console.log('Decrypted userData:', this.userData);
  let storedCompany = null;
  let storedBranch = null;
  this.getMenusFromSideBar();

  try {
    const encryptedCompany = localStorage.getItem('selected-company');
    const encryptedBranch = localStorage.getItem('selected-branch');
    const storedYearId = localStorage.getItem('current-year-id');
    storedCompany = encryptedCompany ? this.appSettingsService.decrypt(encryptedCompany) : null;
    storedBranch = encryptedBranch ? this.appSettingsService.decrypt(encryptedBranch) : null;
    this.selectedYearId = storedYearId ? +storedYearId : null;
  } catch (err) {
    console.warn('Decryption failed for selected company/branch:', err);
  }

  if (this.userData?.userCompanyMaster?.length) {
    this.companyList = this.userData.userCompanyMaster.map(ucm => ({
      CompanyMasterSid: ucm.CompanyMasterSid,
      companyName: ucm.companyMaster?.companyName || 'Unnamed Company',
      companyMaster: ucm.companyMaster,
      IsDefault: ucm.IsDefault
    }));

    const defaultCompany = this.companyList.find(c => c.IsDefault === 'Y') || this.companyList[0];
    const companyToUse = storedCompany?.CompanyMasterSid
      ? this.companyList.find(c => c.CompanyMasterSid === storedCompany.CompanyMasterSid) || defaultCompany
      : defaultCompany;
      console.log(companyToUse,'companyToUse')

    this.selectedCompanyId = companyToUse.CompanyMasterSid;

    this.branchList = (companyToUse.companyMaster?.userBranchMaster || [])
      .filter(ubm => ubm.GiveAccess === 'Y') // ✅ Only include branches with GiveAccess = 'Y'
    .map(ubm => ({
      UserBranchMasterSid: ubm.UserBranchMasterSid,
      branchMaster: ubm.branchMaster,
      companyMaster: companyToUse.companyMaster,
      IsDefault: ubm.IsDefault 
    }));
    console.log(this.branchList,'this.branchList')

    const defaultBranch = this.branchList.find(b => b.IsDefault === 'Y') || this.branchList[0];
    const branchToUse = storedBranch?.UserBranchMasterSid
      ? this.branchList.find(b => b.UserBranchMasterSid === storedBranch.UserBranchMasterSid) || defaultBranch
      : defaultBranch;

    if (branchToUse) {
      this.selectedBranchId = branchToUse.UserBranchMasterSid;
      this.selectedBranchCompany = {
        companyMaster: companyToUse.companyMaster,
        branchMaster: branchToUse.branchMaster
      };

      this.branchName = branchToUse.branchMaster.branchName;
      this.companyName = companyToUse.companyMaster.companyName;

      if (!storedCompany || !storedBranch) {
        try {
          const companyToStore = {
            CompanyMasterSid: companyToUse.CompanyMasterSid,
            companyName: companyToUse.companyMaster.companyName,
            CountryName: companyToUse.companyMaster.countryMaster.countryName
          };

          const branchToStore = {
            UserBranchMasterSid: branchToUse.UserBranchMasterSid,
            BranchMasterSid: branchToUse.branchMaster.BranchMasterSid,
            branchName: branchToUse.branchMaster.branchName
          };

          localStorage.setItem('selected-company', this.appSettingsService.encrypt(companyToStore));
          localStorage.setItem('selected-branch', this.appSettingsService.encrypt(branchToStore));

          // Load company configuration and store in localStorage
          this.companySettingsManager.setCurrentCompany(companyToStore.CompanyMasterSid);
        } catch (e) {
          console.error('Error encrypting default company/branch:', e);
        }
      } else {
        // Company/branch already stored, just load the config
        this.companySettingsManager.setCurrentCompany(companyToUse.CompanyMasterSid);
      }
    }
  } else {
    console.warn('No user company data found in user profile');
  }

  // Setup document search subscription
  this.setupDocumentSearchSubscription();

  this.logoService.loadInitialBothLogos();
}



  extractCompanies(): void {
    const companyMasterList = this.userData?.userCompanyMaster || [];

    this.companyList = companyMasterList.map((ucm: any) => ucm.companyMaster);
    console.log('Extracted companies:', this.companyList);
  }

  onCompanyChange(companyId: number,resetYear : boolean = true) {
  const selectedCompany = this.companyList.find(c => c.CompanyMasterSid === companyId);

  // Extract branch list from companyMaster.userBranchMaster
this.branchList = (selectedCompany?.companyMaster?.userBranchMaster || [])
  .filter(ubm => ubm.GiveAccess === 'Y'); // ✅ Only show GiveAccess = Y
  this.selectedBranchId = null;
    if (resetYear) {
      this.financialYears = [];
      this.selectedYearId = null;
    }

  if (companyId) {
    this.getFinancialYears(companyId);
  }

  console.log('Selected Company:', selectedCompany);
  console.log('Branch List:', this.branchList);
}

  getFinancialYears(companyId: number) {
    this.masterService.getFinancialYearsByCompany(companyId)
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((resp: any) => {
        if (resp.status && resp.data) {
          this.financialYears = resp.data;
          const existInList = this.financialYears.find(fy => fy.YearMasterSid === this.selectedYearId);
          this.selectedYearId = existInList ? this.selectedYearId : this.financialYears.find(fy => fy.CurrentYear === 'Y')?.YearMasterSid;
          console.log({
            'Financial Years' : this.financialYears,
            'selectedYearId' : this.selectedYearId
          });
        } else {
          this.appSettingsService.showError(resp.message);
        }
      });
  }

 openBranchSwitchModal(content: TemplateRef<any>): void {
  console.log({
    'Financial Years': this.financialYears,
    'selectedYearId': this.selectedYearId
  });
  if (this.selectedBranchCompany) {
    // Get company and branch SIDs from selectedBranchCompany
    const company = this.companyList.find(
      c => c.companyMaster.CompanyMasterSid === this.selectedBranchCompany.companyMaster.CompanyMasterSid
    );

    if (company) {
      this.selectedCompanyId = company.CompanyMasterSid;
      this.onCompanyChange(this.selectedCompanyId,false); // Load branch list
    }

    console.log({
      'Financial Years': this.financialYears,
      'selectedYearId': this.selectedYearId
    });

    const branch = (company?.companyMaster?.userBranchMaster || []).find(
      b => b.branchMaster.BranchMasterSid === this.selectedBranchCompany.branchMaster.BranchMasterSid
    );

    if (branch) {
      this.selectedBranchId = branch.UserBranchMasterSid;
    }
  }

  //  if (this.selectedCompanyId) {
  //    this.getFinancialYears(this.selectedCompanyId);
  //  }

  this.modalRef = this.modalService.open(content, {
    centered: true,
    size: 'md',
    backdrop: 'static',
  });

  this.cdr.detectChanges(); // Ensure Angular detects updates before rendering modal
}


  onBranchChangeFromModal(branchId: number, modalRef: NgbModalRef): void {
  const oldCompany = this.appSettingsService.getCurrentCompanyInfo();
  const oldBranch = this.appSettingsService.getCurrentBranchInfo();
  const selectedCompany = this.companyList.find(c => c.CompanyMasterSid === this.selectedCompanyId);
  const selectedBranch = this.branchList.find(b => b.UserBranchMasterSid === branchId);

  if (!selectedCompany || !selectedBranch) {
    this.appSettingsService.showError('Invalid company or branch selected');
    return;
  }

  if (!this.selectedYearId) {
    this.appSettingsService.showError('Please select a financial year.');
    return;
  }

  const updatedBranchCompany = {
    companyMaster: selectedCompany.companyMaster,
    branchMaster: selectedBranch.branchMaster
  };

  // ✅ Step 1: Update full user object
  const updatedUserData = {
    ...this.userData,
    selectedBranchCompany: updatedBranchCompany
  };

  // ✅ Step 2: Store to localStorage (encrypted)
  this.appSettingsService.storeUserProfile(updatedUserData);
  try {
    const companyToStore = {
      CompanyMasterSid: updatedBranchCompany.companyMaster.CompanyMasterSid,
      companyName: updatedBranchCompany.companyMaster.companyName,
      CountryName: updatedBranchCompany.companyMaster.countryMaster.countryName
    };

    const branchToStore = {
      UserBranchMasterSid: selectedBranch.UserBranchMasterSid,
      BranchMasterSid: updatedBranchCompany.branchMaster.BranchMasterSid,
      branchName: updatedBranchCompany.branchMaster.branchName
    };

    localStorage.setItem('selected-company', this.appSettingsService.encrypt(companyToStore));
    localStorage.setItem('selected-branch', this.appSettingsService.encrypt(branchToStore));
    localStorage.setItem('current-year-id', this.selectedYearId.toString());

    // Load company configuration and store in localStorage
    this.companySettingsManager.setCurrentCompany(companyToStore.CompanyMasterSid);

    this.selectedBranchCompany = updatedBranchCompany;
  } catch (e) {
    console.error('Error encrypting selected company/branch:', e);
  }

  // ✅ Step 3: Update observable in service for other subscribers
  this.appSettingsService.setUserSettings(updatedUserData);

  // ✅ Step 4: Update component state
  this.selectedBranchCompany = updatedBranchCompany;
  this.branchName = updatedBranchCompany.branchMaster.branchName;
  this.companyName = updatedBranchCompany.companyMaster.companyName;
  this.userData = updatedUserData;

  // this.appSettingsService.showSuccess('Switched to new branch and company');
  // this.logoService.refreshBothLogos();

  // ✅ Step 5: Reload the page
    if (
        oldCompany?.CompanyMasterSid === updatedBranchCompany?.companyMaster?.CompanyMasterSid && 
        oldBranch?.BranchMasterSid === updatedBranchCompany?.branchMaster?.BranchMasterSid
    ) {
      console.info("Switched to same branch and company.");
    } else {
      this.appSettingsService.showSuccess('Switched to new branch and company');
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 300);
    }

  modalRef.close();
}



  onBranchChange(event: Event): void {
    const selectedId = +(event.target as HTMLSelectElement).value;

    const selectedBranch = this.userData.userCompanyMaster
      .flatMap((ucm: any) => ucm.userBranchMaster || [])
      .find((b: any) => b.UserBranchMasterSid === selectedId);

    if (selectedBranch) {
      this.selectedBranchId = selectedBranch.UserBranchMasterSid;
      this.selectedCompanyId = selectedBranch.CompanyMasterSid;

      this.onCompanyChange(this.selectedCompanyId);
      this.selectedBranchCompany = selectedBranch;

      this.userData.branchMaster = selectedBranch.branchMaster;
      this.userData.companyMaster = this.companyList.find(
        (c: any) => c.CompanyMasterSid === selectedBranch.CompanyMasterSid
      );

      this.branchName = selectedBranch.branchMaster?.branchName || '';
      this.companyName = this.userData.companyMaster?.companyName || '';

      console.log('Switched to Branch:', this.branchName);
      console.log('Switched to Company:', this.companyName);
    }
  }



  loadRecentList(event: boolean) {
    if (event) {
      this.recentList = JSON.parse(localStorage.getItem('recentlyVisited')) || [];
    }
  }
  loadFavouriteList(event: boolean) {
    if (event) {
      this.verticalNavService.getAllFavouriteScreens().subscribe(
        (resp: any) => {
          if (resp.status) {
            this.favouriteList = resp.data;
            console.log('Favourite', this.favouriteList);
          } else {
            this.appSettingsService.showError('Error loading Favourite Screens')
          }
        }
      )
    }
  }

  deleteFavourite(path) {
    this.verticalNavService.deleteFavouriteScreen(path).subscribe(
      (resp: any) => {
        if (resp.status) {
          this.loadFavouriteList(true);
        }
      },
      (error: any) => {
        console.error('Error Deleting Favourite Screens', error)
      }
    )
  }

  // ===== MENU SEARCH RELATED FUNCTIONS ===== \\

  // Triggered on input click
  // onSearchClick() {
  //   this.activeIndex = -1;

  //   if (this.menusLoaded) {
  //     this.menuSearchDropdown.open();
  //   } else {
  //     this.fetchAllMenus(() => {
  //       this.menusLoaded = true;
  //       this.menuSearchResults = [...this.allMenus];
  //       this.menuSearchDropdown.open();
  //     });
  //   }
  // }

  // Fetch all menus and call callback after loading
  // fetchAllMenus(callback: () => void) {
  //   this.verticalNavService.getAllMenus().subscribe({
  //     next: (resp: any) => {
  //       if (resp.status) {
  //         this.allMenus = resp.data;
  //         callback();
  //       } else {
  //         this.appSettingsService.showError('Error loading menus');
  //       }
  //     },
  //     error: () => {
  //       this.appSettingsService.showError('Failed to fetch menus');
  //     }
  //   });
  // }


  //  on every keystroke filtering done here
  // searchMenu(event) {
  //   const searchText = event.target.value;
  //   if(!searchText || this.allMenus.length === 0){
  //     this.menuSearchResults = [...this.allMenus];
  //     this.activeIndex = -1;
  //     return;
  //   }
  //   this.menuSearchResults = this.allMenus.filter((menu:any) => menu.MenuName.toLowerCase().includes(searchText.toLowerCase()));
  //   this.activeIndex = -1;
  // }

  // For arrow key navigation 
  // onKeyDown(event: KeyboardEvent) {
  //   const max = this.menuSearchResults.length - 1;
  //   if (event.key === 'ArrowDown') {
  //     this.activeIndex = this.activeIndex < max ? this.activeIndex + 1 : 0;
  //     this.scrollToActive();
  //     event.preventDefault();
  //   } else if (event.key === 'ArrowUp') {
  //     this.activeIndex = this.activeIndex > 0 ? this.activeIndex - 1 : max;
  //     this.scrollToActive();
  //     event.preventDefault();
  //   } else if (event.key === 'Enter' && this.activeIndex !== -1) {
  //     const item = this.menuSearchResults[this.activeIndex];
  //     this.addToRecent(item);
  //     this.router.navigate([item.path]);
  //     this.clearSearch();
  //   }
  // }

  //  On click event
  // onClickEvent(event,menu){
  //   event.preventDefault();
  //   event.stopPropagation();
  //   this.addToRecent(menu);
  //   this.router.navigate([menu.path]);
  //   this.clearSearch();
  // }
  

  // resetMenuSearch(event: Event) {
  //   if (event instanceof KeyboardEvent) {
  //     return;
  //   }
  //   const element = (event.target) as HTMLInputElement;
  //   element.value = '';
  //   this.menuSearchResults = [...this.allMenus];
  //   this.activeIndex = -1;
  //   this.menuSearchDropdown.close();
  // }

  // clearSearch() {
  //   if(this.searchMenuInput){
  //     this.searchMenuInput.nativeElement.value = '';
  //     this.searchMenuInput.nativeElement.blur();
  //   }
  //   this.menuSearchResults = [...this.allMenus];
  //   this.activeIndex = -1;
  //   this.menuSearchDropdown.close();
  // }

  // onInputBlur(event: Event) {
  //   setTimeout(() => {
  //       this.clearSearch();
  //   }, 150);
  // }


  
  // auto scroll dropdown if arrow reaches end of menu list
  // private scrollToActive() {
  //   const items = this.menuItems?.toArray();
  //   if (items && this.activeIndex >= 0 && items[this.activeIndex]) {
  //     items[this.activeIndex].nativeElement.scrollIntoView({
  //       behavior: 'smooth',
  //       block: 'nearest',
  //     });
  //   }
  // }

  //  Add selected Menu to Recent List


  getMenusFromSideBar() {
    this.isLoadingMenu = true;

    this.verticalSidebarService.items$
      .subscribe(items => {
        if (!items || !Array.isArray(items)) {
          this.allMenus = [];
          this.isLoadingMenu = false;
          return;
        }

        const leafNodes: RouteInfo[] = [];

        const collectLeaves = (nodes: RouteInfo[] | undefined) => {
          if (!nodes || nodes.length === 0) return;

          for (const node of nodes) {
            const children = node.submenu || [];
            const isLeaf = children.length === 0;

            // Collect only leaves that have extralink === false
            if (isLeaf) {
                leafNodes.push(node);
            } else {
              // not a leaf -> traverse children
              collectLeaves(children);
            }
          }
        };

        collectLeaves(items);

        this.allMenus = leafNodes;
        this.menuSearchResults = [...this.allMenus];
        console.log('menu fetch results (leaf, extralink=false):', this.allMenus);
        this.isLoadingMenu = false;
      }, err => {
        console.error('Error reading sidebar items', err);
        this.menuSearchResults = [];
        this.isLoadingMenu = false;
      });
  }

  searchMenus(event : Event) : void {
    const input = event.target as HTMLInputElement;
    const searchTerm = input.value.trim();
    console.log("searching",{
      searchTerm ,
      menus : this.allMenus
    })
    this.menuSearchSubject.next(searchTerm);
    this.menuSearchResults = this.allMenus.filter((menu:any) => menu.title.toLowerCase().includes(searchTerm.toLowerCase()));
  }

  onMenuSearchKeyDown(event: KeyboardEvent) {
    const max = this.menuSearchResults.length - 1;
    if (event.key === 'ArrowDown') {
      this.menuActiveIndex = this.menuActiveIndex < max ? this.menuActiveIndex + 1 : 0;
      event.preventDefault();
    } else if (event.key === 'ArrowUp') {
      this.menuActiveIndex = this.menuActiveIndex > 0 ? this.menuActiveIndex - 1 : max;
      event.preventDefault();
    } else if (event.key === 'Enter' && this.menuActiveIndex !== -1) {
      const item = this.menuSearchResults[this.menuActiveIndex];
      this.addToRecent(item);
      this.router.navigate([item.path]);
      this.clearMenuSearch();
    }
  }

  navigateToMenu(item){
    this.addToRecent(item);
    this.clearMenuSearch();
    this.router.navigate([item.path]);
  }

  clearMenuSearch() {
    if(this.searchMenuInput){
      this.searchMenuInput.nativeElement.value = '';
      this.searchMenuInput.nativeElement.blur();
    }
    this.menuSearchResults = [];
    this.menuActiveIndex = -1;
    this.isLoadingMenu = false;
    this.menuSearchError = '';
    if(this.menuSearchDropdown){
      this.menuSearchDropdown.close();
    }
  }

  onMenuSearchBlur(event: Event): void {
    setTimeout(() => {
      if (this.menuSearchDropdown) {
        this.searchMenuInput.nativeElement.value = '';
        this.menuSearchDropdown.close();
      }
    }, 200);
  }

    addToRecent(menu){
    const newlyVisited = {
      MenuMasterSid : menu.MenuMasterSid || menu.id,
      path: menu.path,
      screenName: menu.MenuName || menu.title,
      createdOn: new Date()
    };

    console.log("Newly visited",newlyVisited)

    let recentlyVisited = JSON.parse(localStorage.getItem('recentlyVisited')) || [];
    const existingIndex = recentlyVisited.findIndex(item => item.path === newlyVisited.path);

    if (existingIndex !== -1) {
      recentlyVisited.splice(existingIndex, 1);
    }

    recentlyVisited.unshift(newlyVisited);

    if (recentlyVisited.length > 10) {
      recentlyVisited.pop();
    }

    localStorage.setItem('recentlyVisited', JSON.stringify(recentlyVisited));
    localStorage.setItem('currentMenuId',newlyVisited.MenuMasterSid);
  }
 

  // ------------ END OF MENU SEARCH RELATED FUNCTION ----------------- \\

  // ===== DOCUMENT SEARCH RELATED FUNCTIONS ===== \\

  private setupDocumentSearchSubscription(): void {
    this.docSearchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.unsubscribe$),
      switchMap(searchTerm => {
        if (!searchTerm || searchTerm.length < 3) {
          this.isSearchingDocs = false;
          return of([]);
        }

        this.isSearchingDocs = true;
        this.docSearchError = '';

        const companyData = this.getCompanyBranchIds();
        if (!companyData.CompanyMasterSid || !companyData.BranchMasterSid) {
          this.docSearchError = 'Please select a company and branch';
          this.isSearchingDocs = false;
          return of([]);
        }

        return this.verticalNavService.searchDocuments({
          search: searchTerm,
          CompanyMasterSid: companyData.CompanyMasterSid,
          BranchMasterSid: companyData.BranchMasterSid,
          limit: 10
        }).pipe(
          catchError(error => {
            console.error('Document search error:', error);
            this.docSearchError = 'Search failed. Please try again.';
            return of([]);
          })
        );
      })
    ).subscribe(results => {
      this.docSearchResults = results;
      this.isSearchingDocs = false;
      this.docActiveIndex = -1;
      this.cdr.detectChanges();
    });
  }

  private getCompanyBranchIds(): { CompanyMasterSid: number | null, BranchMasterSid: number | null } {
    try {
      const encryptedCompany = localStorage.getItem('selected-company');
      const encryptedBranch = localStorage.getItem('selected-branch');
      const company = encryptedCompany ? this.appSettingsService.decrypt(encryptedCompany) : null;
      const branch = encryptedBranch ? this.appSettingsService.decrypt(encryptedBranch) : null;

      return {
        CompanyMasterSid: company?.CompanyMasterSid || null,
        BranchMasterSid: branch?.BranchMasterSid || null
      };
    } catch (error) {
      console.error('Error getting company/branch IDs:', error);
      return { CompanyMasterSid: null, BranchMasterSid: null };
    }
  }

  searchDocuments(event: Event): void {
    const input = event.target as HTMLInputElement;
    const searchTerm = input.value.trim();
    this.docSearchSubject.next(searchTerm);
  }

  onDocSearchKeyDown(event: KeyboardEvent): void {
    const max = this.docSearchResults.length - 1;
    if (event.key === 'ArrowDown') {
      this.docActiveIndex = this.docActiveIndex < max ? this.docActiveIndex + 1 : 0;
      event.preventDefault();
    } else if (event.key === 'ArrowUp') {
      this.docActiveIndex = this.docActiveIndex > 0 ? this.docActiveIndex - 1 : max;
      event.preventDefault();
    } else if (event.key === 'Enter' && this.docActiveIndex !== -1) {
      const item = this.docSearchResults[this.docActiveIndex];
      this.navigateToDocument(item);
    } else if (event.key === 'Escape') {
      this.clearDocSearch();
    }
  }

  navigateToDocument(result: DocumentSearchResult): void {
    this.clearDocSearch();
    this.router.navigate([result.path]);
  }

  clearDocSearch(): void {
    if (this.docSearchInput) {
      this.docSearchInput.nativeElement.value = '';
      this.docSearchInput.nativeElement.blur();
    }
    this.docSearchResults = [];
    this.docActiveIndex = -1;
    this.isSearchingDocs = false;
    this.docSearchError = '';
    if (this.docSearchDropdown) {
      this.docSearchDropdown.close();
    }
  }

  onDocSearchBlur(event: Event): void {
    // Delay to allow click events on dropdown items to fire first
    setTimeout(() => {
      if (this.docSearchDropdown) {
        this.docSearchDropdown.close();
      }
    }, 200);
  }

  // ------------ END OF DOCUMENT SEARCH RELATED FUNCTION ----------------- \\

  // ------------- RECENT ACTIVITY RELATED FUNCTIONS ------------------ \\

    handleRecentClick(item){
    localStorage.setItem('currentMenuId',item.MenuMasterSid);
    this.router.navigate([`${item.path}`])
  }

  // ------------ END OF RECENT ACTIVITY RELATED FUNCTION ----------------- \\

  // This is for Notifications
  notifications: notifications[] = [
    {
      btn: 'btn-danger',
      icon: 'ti-link',
      title: 'Luanch Admin',
      subject: 'Just see the my new admin!',
      time: '9:30 AM'
    },
    {
      btn: 'btn-success',
      icon: 'ti-calendar',
      title: 'Event today',
      subject: 'Just a reminder that you have event',
      time: '9:10 AM'
    },
    {
      btn: 'btn-info',
      icon: 'ti-settings',
      title: 'Settings',
      subject: 'You can customize this template as you want',
      time: '9:08 AM'
    },
    {
      btn: 'btn-warning',
      icon: 'ti-user',
      title: 'Pavan kumar',
      subject: 'Just see the my admin!',
      time: '9:00 AM'
    }
  ];

  // This is for Mymessages
  mymessages: messages[] = [
    {
      useravatar: 'assets/images/users/user1.jpg',
      status: 'online',
      from: 'Pavan kumar',
      subject: 'Just see the my admin!',
      time: '9:30 AM'
    },
    {
      useravatar: 'assets/images/users/user2.jpg',
      status: 'busy',
      from: 'Sonu Nigam',
      subject: 'I have sung a song! See you at',
      time: '9:10 AM'
    },
    {
      useravatar: 'assets/images/users/user2.jpg',
      status: 'away',
      from: 'Arijit Sinh',
      subject: 'I am a singer!',
      time: '9:08 AM'
    },
    {
      useravatar: 'assets/images/users/user4.jpg',
      status: 'offline',
      from: 'Pavan kumar',
      subject: 'Just see the my admin!',
      time: '9:00 AM'
    }
  ];

  public selectedLanguage: any = {
    language: 'English',
    code: 'en',
    type: 'US',
    icon: 'us'
  }

  public languages: any[] = [{
    language: 'English',
    code: 'en',
    type: 'US',
    icon: 'us'
  },
  {
    language: 'Español',
    code: 'es',
    icon: 'es'
  },
  {
    language: 'Français',
    code: 'fr',
    icon: 'fr'
  },
  {
    language: 'German',
    code: 'de',
    icon: 'de'
  }]

  ngAfterViewInit() {

  }

  logout() {
    // Clear company settings to prevent API loops during logout
    this.companySettingsManager.clearCompanySettings();
    // Preserve remembered credentials
    const rememberedEmail = localStorage.getItem('rememberedEmail');
    const rememberedPassword = localStorage.getItem('rememberedPassword');
    const lastUsedFinancialYear = localStorage.getItem('current-year-id');

    // Clear all localStorage data
    localStorage.clear();

    // Restore remembered credentials
    if (rememberedEmail) {
      localStorage.setItem('rememberedEmail', rememberedEmail);
    }
    if (rememberedPassword) {
      localStorage.setItem('rememberedPassword', rememberedPassword);
    }
    if (lastUsedFinancialYear) {
      localStorage.setItem('current-year-id', lastUsedFinancialYear);
    }


    this.appSettingsService.sessionExpire().then(() => {
      location.href = location.protocol + '//' + location.host + '/auth'
    })
  }

  changeLanguage(lang: any) {
    this.translate.use(lang.code)
    this.selectedLanguage = lang;
  }

  navigateShortcut() {
    this.router.navigate(['shortcut']);
  }

  navigateToMaster() {
    this.router.navigate(['dashboard']);
  }
  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }
}
