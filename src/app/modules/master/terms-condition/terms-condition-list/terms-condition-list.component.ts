import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { MasterService } from '../../master.service';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { MatDialog } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FeatherModule } from 'angular-feather';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { DeleteWarningComponent } from 'src/app/modules/crm-mobile/delete-warning.component';

@Component({
    selector: 'app-terms-condition-list',
    standalone: true,
    imports: [
        RouterModule,
        FormsModule,
        CommonModule,
        FeatherModule,
        NgbPaginationModule
    ],
    templateUrl: './terms-condition-list.component.html',
    styleUrl: './terms-condition-list.component.scss'
})
export class TermsConditionListComponent {

    searchType : string ='status';
    filterValue : any;
    TandCList : any[];
    slicedTandCList : any[];
    searchPerformed : boolean;

    page = 1;
    pageSize = 10;
    totalAmountOfCollections : number;

    constructor(
        private router: Router,
        private masterService:MasterService,
        private appSettingService:AppSettingsService,
        private dialog:MatDialog,
    ) { }


    onSearch(){
        const intFields=[
            "BranchMasterSid",
            "MenuMasterSid",
            "Carrier",
        ];
        const payload = {
            searchType : this.searchType,
            filterValue : intFields.includes(this.searchType) ? Number(this.filterValue) : this.filterValue
        }

        this.masterService.searchTandC(payload).subscribe(
            (resp:any)=>{
                if(resp.status){
                    this.searchPerformed = true;
                    this.TandCList = resp.data;
                    this.totalAmountOfCollections = this.TandCList.length;
                    this.updatePaginationData();
                }
                else{
                    this.appSettingService.showError('Error Searching Terms and Conditions');
                }
            },
            (error)=>{
                console.error('Error Searching Terms and Conditions',error);
            }
        )
    }

    deleteTandC(TermsAndConditionsMasterSid){
        const modalRef = this.dialog.open(DeleteWarningComponent);
        modalRef.afterClosed().subscribe(
            (res)=>{
                if(res){
                    this.masterService.deleteTandCById(TermsAndConditionsMasterSid).subscribe(
                        (resp:any)=>{
                            if(resp.status){
                                this.appSettingService.showSuccess('Terms and Conditions successfully deleted');
                                this.onSearch();
                            } else {
                                this.appSettingService.showError('Error Deleting Terms and Conditions')
                            }
                        },
                        (error)=>{
                            console.error('Error Deleting Terms and Conditions',error);
                        }
                    )
                }
            }
        )
    }

    updatePaginationData(){
        let start = (this.page - 1 ) * this.pageSize;
        let end = start + this.pageSize;
        this.slicedTandCList = this.TandCList.slice(start,end);
    }


    navigateTocreateTerms() {
        this.router.navigate(['master/terms-condition/entry'])
    }

    report(){

    }

    reset(){
        this.TandCList =[];
        this.totalAmountOfCollections = 0;
        this.searchPerformed = false;
    }
}
