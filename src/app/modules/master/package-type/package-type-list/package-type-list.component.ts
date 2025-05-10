import { Component, OnInit } from '@angular/core';
import { FeatherModule } from 'angular-feather';
import { PackageType } from 'src/app/modules/crm-mobile/Interfaces/packageType.interface';
import { MasterService } from '../../master.service';
import { Router, RouterLink } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { DeleteWarningComponent } from 'src/app/modules/crm-mobile/delete-warning.component';

@Component({
  selector: 'app-package-type-list',
  standalone: true,
  imports: [FeatherModule, FormsModule, RouterLink],
  templateUrl: './package-type-list.component.html',
  styleUrl: './package-type-list.component.scss',
})
export class PackageTypeListComponent implements OnInit {
  allPackageTypes: PackageType[];
  filteredPackageTypes: PackageType[];
  allSearchTypes: string[] = ['name', 'code', 'status'];
  filterType: string;
  filterText: string;
  constructor(
    private masterService: MasterService,
    private route: Router,
    private dialog: MatDialog
  ) {}
  ngOnInit(): void {
    this.loadAllPackageTypes();
  }

  navigateToEntry() {
    this.route.navigate(['master/package-type/entry']);
  }

  onSearch() {
    // Type we choose
    let modifiedFilterType = this.filterType.toLowerCase().trim();

    // Text that we enter
    let modifiedFilterText = this.filterText.toLowerCase().trim();

    // Case 1:  Invalid filter type

    if (!this.allSearchTypes.includes(modifiedFilterType)) {
      // Invalid Filter Type with no Query
      if (!modifiedFilterText) {
        this.filteredPackageTypes = [...this.allPackageTypes];
      }

      // Invalid filter type with search Query
      else {
        this.filteredPackageTypes = this.allPackageTypes.filter(
          (packageType: PackageType) => {
            return (
              packageType.PackageCode.includes(modifiedFilterText) ||
              packageType.PackageName.includes(modifiedFilterText) ||
              packageType.status.includes(modifiedFilterText)
            );
          }
        );
      }
    }

    // Valid Search Type
    else {
      // Valid Search Type without Filter Text
      if (!modifiedFilterText) {
        this.filteredPackageTypes = [...this.allPackageTypes];
      } else {
        let index = this.allSearchTypes.indexOf(modifiedFilterType);
        this.filteredPackageTypes = this.allPackageTypes.filter(
          (packageType: PackageType) => {
            if (index === 0)
              return packageType.PackageName.toLowerCase().includes(
                modifiedFilterText
              );
            else if (index === 1)
              return packageType.PackageCode.toLowerCase().includes(
                modifiedFilterText
              );
            else if (index === 2)
              return packageType.status
                .toLowerCase()
                .includes(modifiedFilterText);
            else {
              return (this.filteredPackageTypes = []);
            }
          }
        );
      }
    }
  }

  async loadAllPackageTypes() {
    (await this.masterService.getAllPackageTypes()).subscribe(
      (resp) => {
        this.allPackageTypes = resp;
        this.filteredPackageTypes = resp;
      },
      (error) => {
        console.error(`PackageType Create failed :`, error);
      }
    );
  }

  // delete Package Type

  async deletePackageTypeById(id: number) {
    const dialogRef = this.dialog.open(DeleteWarningComponent);
    dialogRef.afterClosed().subscribe(async (res) => {
      if (res) {
        (await this.masterService.deletePackageById(id)).subscribe((res) => {
          this.loadAllPackageTypes();
        });
      }
    });
  }
}
