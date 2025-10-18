import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { CommonModule } from '@angular/common';
import { Component, AfterViewInit, EventEmitter, Output, ViewChild, TemplateRef, NgModule, OnInit, ChangeDetectorRef, ViewChildren, QueryList, ElementRef } from '@angular/core';
import { NgbAccordionModule, NgbCarouselModule, NgbDropdown, NgbDropdownModule, NgbModal, NgbModalRef, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { TranslateService } from '@ngx-translate/core';
import { FeatherModule } from 'angular-feather';
import { NgScrollbarModule } from 'ngx-scrollbar';
import { Router, RouterModule } from '@angular/router';
import { VerticalNavService } from './vertical-navigation.service';
import { TimeAgoPipe } from 'src/app/core/pipes/timeAgo.pipe';
import { FormsModule } from '@angular/forms';
import { Branch } from 'src/app/modules/crm-mobile/Interfaces/branch.interface';
import { CompanySettingsManagerService } from 'src/app/core/services/company-settings-manager.service';

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
  imports: [NgbDropdownModule, RouterModule, FeatherModule, NgScrollbarModule, CommonModule, NgbAccordionModule, NgbCarouselModule, NgbModule, TimeAgoPipe, FormsModule],
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

  // Menu Search Related Variable Declaration
  activeIndex = -1;
  allMenus :any[] = [];
  menuSearchResults: any[] = [];
  menusLoaded = false;
  @ViewChildren('menuItem') menuItems!: QueryList<ElementRef>;
  @ViewChild('searchMenuInput') searchMenuInput!: ElementRef<HTMLInputElement>;
  @ViewChild('menuSearchDropdown') menuSearchDropdown!: NgbDropdown;

  docSearchResults: any[] = [];

  constructor(
    private router: Router,
    private appSettingsService: AppSettingsService,
    private translate: TranslateService,
    private verticalNavService: VerticalNavService,
    private modalService: NgbModal,
    private cdr: ChangeDetectorRef,
    private companySettingsManager: CompanySettingsManagerService
  ) {
    // translate.setDefaultLang('en');
  }
ngOnInit(): void {
  this.userData = this.appSettingsService.getDecryptedUserProfile();
  console.log('Decrypted userData:', this.userData);
  let storedCompany = null;
  let storedBranch = null;


  try {
    const encryptedCompany = localStorage.getItem('selected-company');
    const encryptedBranch = localStorage.getItem('selected-branch');
    storedCompany = encryptedCompany ? this.appSettingsService.decrypt(encryptedCompany) : null;
    storedBranch = encryptedBranch ? this.appSettingsService.decrypt(encryptedBranch) : null;
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
}



  extractCompanies(): void {
    const companyMasterList = this.userData?.userCompanyMaster || [];

    this.companyList = companyMasterList.map((ucm: any) => ucm.companyMaster);
    console.log('Extracted companies:', this.companyList);
  }

  onCompanyChange(companyId: number) {
  const selectedCompany = this.companyList.find(c => c.CompanyMasterSid === companyId);

  // Extract branch list from companyMaster.userBranchMaster
this.branchList = (selectedCompany?.companyMaster?.userBranchMaster || [])
  .filter(ubm => ubm.GiveAccess === 'Y'); // ✅ Only show GiveAccess = Y
  this.selectedBranchId = null;

  console.log('Selected Company:', selectedCompany);
  console.log('Branch List:', this.branchList);
}


 openBranchSwitchModal(content: TemplateRef<any>): void {
  if (this.selectedBranchCompany) {
    // Get company and branch SIDs from selectedBranchCompany
    const company = this.companyList.find(
      c => c.companyMaster.CompanyMasterSid === this.selectedBranchCompany.companyMaster.CompanyMasterSid
    );

    if (company) {
      this.selectedCompanyId = company.CompanyMasterSid;
      this.onCompanyChange(this.selectedCompanyId); // Load branch list
    }

    const branch = (company?.companyMaster?.userBranchMaster || []).find(
      b => b.branchMaster.BranchMasterSid === this.selectedBranchCompany.branchMaster.BranchMasterSid
    );

    if (branch) {
      this.selectedBranchId = branch.UserBranchMasterSid;
    }
  }

  this.modalRef = this.modalService.open(content, {
    centered: true,
    size: 'md',
    backdrop: 'static',
  });

  this.cdr.detectChanges(); // Ensure Angular detects updates before rendering modal
}


  onBranchChangeFromModal(branchId: number, modalRef: NgbModalRef): void {
  const selectedCompany = this.companyList.find(c => c.CompanyMasterSid === this.selectedCompanyId);
  const selectedBranch = this.branchList.find(b => b.UserBranchMasterSid === branchId);

  if (!selectedCompany || !selectedBranch) {
    this.appSettingsService.showError('Invalid company or branch selected');
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

  this.appSettingsService.showSuccess('Switched to new branch and company');

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
  onSearchClick() {
    this.activeIndex = -1;

    if (this.menusLoaded) {
      this.menuSearchDropdown.open();
    } else {
      this.fetchAllMenus(() => {
        this.menusLoaded = true;
        this.menuSearchResults = [...this.allMenus];
        this.menuSearchDropdown.open();
      });
    }
  }

  // Fetch all menus and call callback after loading
  fetchAllMenus(callback: () => void) {
    this.verticalNavService.getAllMenus().subscribe({
      next: (resp: any) => {
        if (resp.status) {
          this.allMenus = resp.data;
          callback();
        } else {
          this.appSettingsService.showError('Error loading menus');
        }
      },
      error: () => {
        this.appSettingsService.showError('Failed to fetch menus');
      }
    });
  }


  //  on every keystroke filtering done here
  searchMenu(event) {
    const searchText = event.target.value;
    if(!searchText || this.allMenus.length === 0){
      this.menuSearchResults = [...this.allMenus];
      this.activeIndex = -1;
      return;
    }
    this.menuSearchResults = this.allMenus.filter((menu:any) => menu.MenuName.toLowerCase().includes(searchText.toLowerCase()));
    this.activeIndex = -1;
  }

  // For arrow key navigation 
  onKeyDown(event: KeyboardEvent) {
    const max = this.menuSearchResults.length - 1;
    if (event.key === 'ArrowDown') {
      this.activeIndex = this.activeIndex < max ? this.activeIndex + 1 : 0;
      this.scrollToActive();
      event.preventDefault();
    } else if (event.key === 'ArrowUp') {
      this.activeIndex = this.activeIndex > 0 ? this.activeIndex - 1 : max;
      this.scrollToActive();
      event.preventDefault();
    } else if (event.key === 'Enter' && this.activeIndex !== -1) {
      const item = this.menuSearchResults[this.activeIndex];
      this.addToRecent(item);
      this.router.navigate([item.path]);
      this.clearSearch();
    }
  }

  //  On click event
  onClickEvent(event,menu){
    event.preventDefault();
    event.stopPropagation();
    this.addToRecent(menu);
    this.router.navigate([menu.path]);
    this.clearSearch();
  }
  

  resetMenuSearch(event: Event) {
    if (event instanceof KeyboardEvent) {
      return;
    }
    const element = (event.target) as HTMLInputElement;
    element.value = '';
    this.menuSearchResults = [...this.allMenus];
    this.activeIndex = -1;
    this.menuSearchDropdown.close();
  }

  clearSearch() {
    if(this.searchMenuInput){
      this.searchMenuInput.nativeElement.value = '';
      this.searchMenuInput.nativeElement.blur();
    }
    this.menuSearchResults = [...this.allMenus];
    this.activeIndex = -1;
    this.menuSearchDropdown.close();
  }

  onInputBlur(event: Event) {
    setTimeout(() => {
        this.clearSearch();
    }, 150);
  }


  
  // auto scroll dropdown if arrow reaches end of menu list
  private scrollToActive() {
    const items = this.menuItems?.toArray();
    if (items && this.activeIndex >= 0 && items[this.activeIndex]) {
      items[this.activeIndex].nativeElement.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }
  }

  //  Add selected Menu to Recent List
  addToRecent(menu){
    const newlyVisited = {
      MenuMasterSid : menu.MenuMasterSid,
      path: menu.path,
      screenName: menu.MenuName,
      createdOn: new Date()
    };

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
    localStorage.setItem('currentMenuId',menu.MenuMasterSid);
  }

  handleRecentClick(item){
    localStorage.setItem('currentMenuId',item.MenuMasterSid);
    this.router.navigate([`${item.path}`])
  }

  // ------------ END OF MENU SEARCH RELATED FUNCTION ----------------- \\

  searchDocuments(text) {

  }

  openDocument(text) {

  }


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
}
