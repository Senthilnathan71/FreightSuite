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
  @ViewChild('menuSearchDropdown') menuSearchDropdown!: NgbDropdown;

  docSearchResults: any[] = [];

  constructor(private router: Router, private appSettingsService: AppSettingsService, private translate: TranslateService, private verticalNavService: VerticalNavService, private modalService: NgbModal, private cdr: ChangeDetectorRef) {

    // translate.setDefaultLang('en');

  }

ngOnInit(): void {
    this.appSettingsService.getUser().subscribe(user => {
      if (user) {
        this.userData = user;

        // Set default selected branch/company
        this.selectedBranchCompany =
          user.userBranchMaster?.find((b: any) => b.isDefault) ||
          user.userBranchMaster?.[0];

        if (this.selectedBranchCompany) {
          this.branchName =
            this.selectedBranchCompany.branchMaster?.branchName || '';
          this.companyName =
            this.selectedBranchCompany.companyMaster?.companyName || '';

          this.selectedCompanyId =
            this.selectedBranchCompany.companyMaster?.CompanyMasterSid;
          this.selectedBranchId =
            this.selectedBranchCompany.UserBranchMasterSid;
        }

        this.extractCompanies();
      }
    });
  }

  extractCompanies(): void {
    const allCompanies = this.userData?.userBranchMaster?.map(
      (b: any) => b.companyMaster
    );

    this.companyList = allCompanies
      ? allCompanies.filter(
          (company, index, self) =>
            index ===
            self.findIndex(
              (c: any) => c.CompanyMasterSid === company.CompanyMasterSid
            )
        )
      : [];
  }

  onCompanyChange(companyId: number): void {
    this.branchList = this.userData?.userBranchMaster?.filter(
      (b: any) => b.companyMaster?.CompanyMasterSid === +companyId
    ) || [];

    // Reset selectedBranchId if it's not in new list
    const exists = this.branchList.find(
      (b: any) => b.UserBranchMasterSid === this.selectedBranchId
    );
    if (!exists && this.branchList.length > 0) {
      this.selectedBranchId = this.branchList[0].UserBranchMasterSid;
    }
  }

  openBranchSwitchModal(content: TemplateRef<any>): void {
    if (this.selectedBranchCompany) {
      this.selectedCompanyId =
        this.selectedBranchCompany.companyMaster?.CompanyMasterSid;
      this.onCompanyChange(this.selectedCompanyId);
      this.selectedBranchId = this.selectedBranchCompany.UserBranchMasterSid;
    }

    this.modalRef = this.modalService.open(content, {
      centered: true,
      size: 'md',
      backdrop: 'static',
    });
  }

  onBranchChangeFromModal(selectedId: number | string, modalRef: NgbModalRef): void {
    const selectedBranch = this.userData?.userBranchMaster?.find(
      (b: any) => b.UserBranchMasterSid === +selectedId
    );

    if (selectedBranch) {
      this.selectedBranchId = selectedBranch.UserBranchMasterSid;
      this.selectedCompanyId =
        selectedBranch.companyMaster?.CompanyMasterSid;

      this.onCompanyChange(this.selectedCompanyId);

      this.selectedBranchCompany = selectedBranch;

      this.userData.branchMaster = selectedBranch.branchMaster;
      this.userData.companyMaster = selectedBranch.companyMaster;

      this.branchName = selectedBranch.branchMaster?.branchName || '';
      this.companyName = selectedBranch.companyMaster?.companyName || '';

      modalRef.close();
    } else {
      console.warn('Branch not found for selected ID:', selectedId);
    }
  }






onBranchChange(event: Event): void {
  const selectedId = (event.target as HTMLSelectElement).value;
  const selectedBranch = this.userData.userBranchMaster.find(
    (b: any) => b.UserBranchMasterSid == selectedId
  );

  if (selectedBranch) {
    this.selectedCompanyId = selectedBranch;

    console.log('Switched to Branch:', selectedBranch.branchMaster.branchName);
    console.log('Switched to Company:', selectedBranch.companyMaster.companyName);
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
      this.resetMenuSearch(event);
    }
  }

  //  On click event
  onClickEvent(event,menu){
    this.addToRecent(menu);
    this.resetMenuSearch(event);
  }
  

  resetMenuSearch(event) {
    const element = (event.target) as HTMLInputElement
    console.log(event);
    console.log(element)
    event.target.value = ''
    element.blur();
    this.menuSearchResults = [...this.allMenus];
    this.activeIndex = -1;
    this.menuSearchDropdown.close()
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
