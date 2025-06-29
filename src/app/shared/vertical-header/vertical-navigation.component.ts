import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { CommonModule } from '@angular/common';
import { Component, AfterViewInit, EventEmitter, Output, ViewChild, TemplateRef, NgModule, OnInit } from '@angular/core';
import { NgbAccordionModule, NgbCarouselModule, NgbDropdown, NgbDropdownModule,  NgbModalRef, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { TranslateService } from '@ngx-translate/core';
import { FeatherModule } from 'angular-feather';
import { NgScrollbarModule } from 'ngx-scrollbar';
import { Router, RouterModule } from '@angular/router';
import { VerticalNavService } from './vertical-navigation.service';
import { TimeAgoPipe } from 'src/app/core/pipes/timeAgo.pipe';

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
  imports: [NgbDropdownModule,RouterModule, FeatherModule, NgScrollbarModule, CommonModule, NgbAccordionModule, NgbCarouselModule,NgbModule,TimeAgoPipe],
  templateUrl: './vertical-navigation.component.html'
})
export class VerticalNavigationComponent implements OnInit,AfterViewInit {
  recentList : any[] = [];
  favouriteList : any[] = [];
  outside = 'outside'
  menuSearchResults : any[] =[];
  docSearchResults : any[] = [];
  @Output() toggleSidebar = new EventEmitter<void>();
  @ViewChild('menuSearchDropdown') menuSearchDropdown!: NgbDropdown;

  public showSearch = false;

  constructor(private router: Router, private appSettingsService: AppSettingsService, private translate: TranslateService,private verticalNavService:VerticalNavService) {

    // translate.setDefaultLang('en');

  }

  ngOnInit(): void {
    this.loadRecentList(true);
    this.loadFavouriteList(true);
  }


  loadRecentList(event : boolean) {
    if(event){
      this.verticalNavService.getAllRecentScreens().subscribe(
        (resp:any)=>{
          if(resp.status){
            this.recentList = resp.data;
            console.log('Recent',this.recentList)
          } else {
            this.appSettingsService.showError('Error loading Recent Screens')
          }
        }
      )
    }
  }
  loadFavouriteList(event : boolean) {
    if(event){
      this.verticalNavService.getAllFavouriteScreens().subscribe(
        (resp:any)=>{
          if(resp.status){
            this.favouriteList = resp.data;
            console.log('Favourite',this.favouriteList);
          } else {
            this.appSettingsService.showError('Error loading Favourite Screens')
          }
        }
      )
    }
  }

  deleteFavourite(path){
    this.verticalNavService.deleteFavouriteScreen(path).subscribe(
      (resp:any)=>{
        if(resp.status){
          this.loadFavouriteList(true);
        }
      },
      (error:any)=>{
        console.error('Error Deleting Favourite Screens',error)
      }
    )
  }

  searchMenu(event){
    const searchText = event.target.value;
    const payload = {
      searchType : 'MenuName',
      filterValue : searchText
    }
    this.verticalNavService.searchMenu(payload).subscribe(
      (resp:any)=>{
        if(resp){
          this.menuSearchResults = resp;
        }
      },
      (error:any)=>{
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

  searchDocuments(text){

  }

  openDocument(text){

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

 navigateShortcut(){
    this.router.navigate(['shortcut']);
 }
 
}
