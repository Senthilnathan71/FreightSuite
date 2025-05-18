import { Component, OnInit } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { FeatherModule } from 'angular-feather';
import { MasterService } from '../../master.service';

@Component({
  selector: 'app-zone-entry',
  standalone: true,
  imports: [FeatherModule, ReactiveFormsModule],
  templateUrl: './zone-entry.component.html',
  styleUrl: './zone-entry.component.scss',
})
export class ZoneEntryComponent implements OnInit {
  inputForm: FormGroup;
  zoneMasterSId: number;
  isEditMode: boolean;
  constructor(
    private currentRoute: ActivatedRoute,
    private masterService: MasterService,
    private route: Router
  ) {}
  ngOnInit(): void {
    this.initForm();
    this.currentRoute.paramMap.subscribe((params) => {
      this.zoneMasterSId = Number(params.get('id'));
      if (this.zoneMasterSId) {
        this.isEditMode = true;
        this.loadZoneById(this.zoneMasterSId);
      }
    });
  }

  initForm() {
    this.inputForm = new FormGroup({
      ZoneName: new FormControl('', [
        Validators.required,
        Validators.maxLength(100),
      ]),
      ZoneCode: new FormControl('', [
        Validators.required,
        Validators.maxLength(2),
      ]),
      status: new FormControl('A', [Validators.maxLength(1)]),
    });
  }

  loadZoneById(zoneMasterSId: number) {
    this.masterService.getZoneById(zoneMasterSId).subscribe(
      (resp) => {
        this.inputForm.patchValue(resp);
      },
      (error) => {
        console.error('Error loading Zone ', error);
      }
    );
  }

  saveZone() {
    if (this.inputForm.invalid) {
      this.inputForm.markAllAsTouched(); // Force validation messages to show
      this.inputForm.updateValueAndValidity(); // Ensure validation is refreshed
      return;
    } else {
      if (this.isEditMode) {
        this.masterService
          .updateZoneById(this.zoneMasterSId, this.inputForm.value)
          .subscribe(
            (resp) => {
              this.route.navigateByUrl('master/zone/list');
            },
            (error) => {
              console.error('Error Occured on Zone Updation', error.message);
            }
          );
      } else {
        this.masterService.createZone(this.inputForm.value).subscribe(
          (resp) => {
            this.route.navigate(['master/zone/list']);
          },
          (error) => {
            console.error('Error Occured on Zone Creation', error.message);
          }
        );
      }
    }
  }
     goBack() {
    history.back()
  }
}
