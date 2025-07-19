import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { CommonModule } from '@angular/common';
import { Component, AfterViewInit, EventEmitter, Output, ViewChild, TemplateRef, NgModule, OnInit, ChangeDetectorRef } from '@angular/core';
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
  menuSearchResults: any[] = [];
  docSearchResults: any[] = [];
  @Output() toggleSidebar = new EventEmitter<void>();
  @ViewChild('menuSearchDropdown') menuSearchDropdown!: NgbDropdown;
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

  constructor(private router: Router, private appSettingsService: AppSettingsService, private translate: TranslateService, private verticalNavService: VerticalNavService, private modalService: NgbModal, private cdr: ChangeDetectorRef) {

    // translate.setDefaultLang('en');

  }

 ngOnInit(): void {
  this.appSettingsService.getUser().subscribe(user => {
    if (user) {
      this.userData = user;
      this.branchName = user?.userBranchMaster?.[0]?.branchMaster?.branchName || '';
      this.companyName = user?.userBranchMaster?.[0]?.companyMaster?.companyName || '';
    }
  });
  this.extractCompanies();
}

extractCompanies() {
  const uniqueCompanies = new Map();
  this.userData?.userBranchMaster?.forEach((item: any) => {
    const company = item.companyMaster;
    if (!uniqueCompanies.has(company.companyId)) {
      uniqueCompanies.set(company.companyId, company);
    }
  });

  this.companyList = Array.from(uniqueCompanies.values());
}

onCompanyChange(companyId: string) {
  this.selectedCompanyId = companyId;
  const selectedCompanyId = Number(companyId);

  console.log('Selected company ID:', selectedCompanyId);
  console.log('All user branches:', this.userData?.userBranchMaster);

  this.branchList = this.userData?.userBranchMaster?.filter(
    (branch: any) => branch.CompanyMasterSid === selectedCompanyId
  );

  console.log('Filtered branches:', this.branchList);
  this.selectedBranchId = null;
}



openBranchSwitchModal(content: TemplateRef<any>) {
  this.modalRef = this.modalService.open(content, { centered: true, size: 'md', backdrop: 'static'});
}


onBranchChangeFromModal(selectedId: string | number, modalRef: NgbModalRef): void {
  const selectedBranch = this.userData?.userBranchMaster?.find(
    (b: any) => b.UserBranchMasterSid == +selectedId
  );

  if (selectedBranch) {
    this.selectedBranchId = selectedBranch.UserBranchMasterSid;
    this.selectedCompanyId = selectedBranch.CompanyMasterSid;

    this.onCompanyChange(this.selectedCompanyId);

    // ✅ Update userData.branchMaster and companyMaster to reflect in HTML
    this.userData.branchMaster = selectedBranch.branchMaster;
    this.userData.companyMaster = selectedBranch.companyMaster;

    this.branchName = selectedBranch.branchMaster.branchName;
    this.companyName = selectedBranch.companyMaster.companyName;

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

  searchMenu(event) {
    const searchText = event.target.value;
    const payload = {
      searchType: 'MenuName',
      filterValue: searchText
    }
    this.verticalNavService.searchMenu(payload).subscribe(
      (resp: any) => {
        if (resp) {
          this.menuSearchResults = resp;
        }
      },
      (error: any) => {
        console.error('Error Searching Menus')
      }
    )
  }

  toggleMenuDropdown() {
    this.menuSearchDropdown.toggle();
  }

  ensureMenuDropdownOpen() {
    if (!this.menuSearchDropdown.isOpen()) {
      this.menuSearchDropdown.open();
    }
  }

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
