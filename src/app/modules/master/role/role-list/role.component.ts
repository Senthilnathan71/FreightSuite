import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { FeatherModule } from 'angular-feather';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { MasterService } from '../../master.service';
import { MatDialog } from '@angular/material/dialog';
import { DeleteWarningComponent } from 'src/app/modules/crm-mobile/delete-warning.component';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-role',
  standalone: true,
  imports: [FeatherModule,RouterModule,FormsModule,CommonModule,NgbPaginationModule],
  templateUrl: './role.component.html',
  styleUrl: './role.component.scss'
})
export class RoleComponent implements OnInit {

  searchType:string="UserRoleName";
  filterValue:any;
  searchPerformed : boolean;
  roleList : any[];
  searchResults : any[];
  companyList : any[];

  // Pagination Data
  page = 1;
  pageSize = 10;
  totalAmountOfCollection : number; 

  constructor(
    private masterService:MasterService,
    private appSettingService:AppSettingsService,
    private matdial : MatDialog,
    private route: Router
  ) { }

  ngOnInit(): void {
    this.getAllCompany();
  }

  onSearch(){
    const payload = {
      searchType : this.searchType,
      filterValue : this.filterValue
    }
    this.searchPerformed = true;
    this.masterService.searchRole(payload).subscribe(
      (resp:any)=>{
        if(resp.status){
          this.searchResults= resp.data;
          this.updatePaginationData();
          this.totalAmountOfCollection = this.searchResults.length;
        }
      }
    )
  }

  updatePaginationData(){
    let start = (this.page - 1) * this.pageSize;
    let end = start + this.pageSize;
    this.roleList = this.searchResults.slice(start,end);
  }

  deleteRoleById(RoleMasterSid:number){
    const matRef = this.matdial.open(DeleteWarningComponent);
    matRef.afterClosed().subscribe(
      (result)=>{
        if(result){
          this.masterService.deleteRoleById(RoleMasterSid).subscribe(
            (resp:any)=>{
              if(resp.status){
                this.appSettingService.showSuccess('Role Deleted');
                this.onSearch();
              } else {
                this.appSettingService.showError('Error Deleting Role');
              }
            },
            (error)=>{
              console.error('Error Deleting Role',error);
            }
          )
        }
      }
    )
  }

  getAllCompany(){
      this.masterService.getAllCompanies().subscribe(
        (resp)=>{
          this.companyList=resp;
        },
        (error)=>{
          console.error('Error Loading Companies',error);
        }
      )
  }

  getCompanyById(CompanyMasterSid){
    let company = this.companyList.find(company=> company.CompanyMasterSid === CompanyMasterSid);
    return company.companyName;
  }

  navigateToCreate() {
    this.route.navigate(['master/role/entry']);
  }

  reset(){
    this.searchPerformed = false;
    this.roleList = [];
    this.totalAmountOfCollection = 0;
  }

  report(){

  }
}
