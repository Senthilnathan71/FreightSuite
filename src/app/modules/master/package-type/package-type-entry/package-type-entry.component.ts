import { Component, OnInit } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MasterService } from '../../master.service';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-package-type-entry',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './package-type-entry.component.html',
  styleUrl: './package-type-entry.component.scss',
})
export class PackageTypeEntryComponent implements OnInit {
  inputForm: FormGroup;
  packageMasterSid: number;
  isEditMode: boolean;

  constructor(
    private masterService: MasterService,
    private currentUrl: ActivatedRoute,
    private route: Router
  ) { }
  ngOnInit(): void {
    this.initForm();
    this.currentUrl.paramMap.subscribe((param) => {
      this.packageMasterSid = Number(param.get('id'));
      if (this.packageMasterSid) {
        this.isEditMode = true;
        this.loadPackageType(this.packageMasterSid);
      }
    });
  }

  initForm() {
    this.inputForm = new FormGroup({
      CompanyMasterSid: new FormControl(2), // CompanyMasterId isnt in form
      PackageName: new FormControl('', [
        Validators.required,
        Validators.maxLength(100),
      ]),
      PackageCode: new FormControl('', [
        Validators.required,
        Validators.maxLength(3),
      ]),
      status: new FormControl('A'),
    });
  }

  loadPackageType(packageMasterSid: number) {
    this.masterService.getPackageTypeById(packageMasterSid).subscribe(
      (resp) => {
        this.inputForm.patchValue(resp);
      },
      (error) => {
        console.error('Error loading Package Type ', error);
      }
    );
  }

  savePackageType() {
    if (this.inputForm.invalid) {
      this.inputForm.markAllAsTouched(); // Force validation messages to show
      this.inputForm.updateValueAndValidity(); // Ensure validation is refreshed
      return;
    } else {
      if (this.isEditMode) {
        this.masterService
          .updatePackageTypeById(this.packageMasterSid, this.inputForm.value)
          .subscribe(
            (resp) => {
              this.route.navigateByUrl('master/package-type/list');
            },
            (error) => {
              console.error(
                'Error Occured on Package Type Updation',
                error.message
              );
            }
          );
      } else {
        this.masterService.createNewPackageType(this.inputForm.value).subscribe(
          (resp) => {
            this.route.navigate(['master/package-type/list']);
          },
          (error) => {
            console.error(
              'Error Occured on PackageType Creation',
              error.message
            );
          }
        );
      }
    }
  }
}
