import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FeatherModule } from 'angular-feather';
import { AppService } from 'src/app/service/app.service';
import { LeadService } from '../Services/lead.service';
import { AbstractControl, FormArray, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-rate-request',
  standalone: true,
  imports: [
    FeatherModule,
    CommonModule,
    ReactiveFormsModule,
    FormsModule
  ],
  templateUrl: './rate-request.component.html',
  styleUrl: './rate-request.component.scss'
})
export class RateRequestComponent implements OnInit {
  selectedDepartment: any
  isMobile: boolean = false;
  rateRequestForm!: FormGroup;

  constructor(
    private appService: AppService,
    private appSettingsService: AppSettingsService,
    private leadService: LeadService,
    private cdr: ChangeDetectorRef,
    private router: Router,
    private fb: FormBuilder) { }

  minDate: string = '';
  ngOnInit(): void {
    this.isMobile = this.appService.getDevice();
    this.loadCustomers()
    this.loadDepartment()
    this.loadCargoTypes()
    this.loadPorts()
    this.initializeForm();
  }

  initializeForm() {
    this.rateRequestForm = this.fb.group({
      // Header Data
      customerName: ['', Validators.required],
      shipmentDate: ['', Validators.required],
      Segment: ['', Validators.required],
      status: ['A'], // Default

      // Routes (Multiple)
      routes: this.fb.array([]),
    });

    this.addRoute(); // Add at least one route by default
  }

  // Getters for Form Arrays
  get routes(): FormArray {
    return this.rateRequestForm.get('routes') as FormArray;
  }

  routeCargo(routeIndex: number): FormArray {
    return this.routes.at(routeIndex).get('cargo') as FormArray;
  }

  // Add New Route
  addRoute() {
    const routeForm = this.fb.group({
      POO: ['', Validators.required],
      POL: ['', Validators.required],
      POD: ['', Validators.required],
      FDC: ['', Validators.required],
      cargo: this.fb.array([]),
    });
    this.routes.push(routeForm);
    this.addCargo(this.routes.length - 1); // Add at least one cargo row by default
  }

  // Add New Cargo Row to a Route
  addCargo(routeIndex: number) {
    const cargoForm = this.fb.group({
      cargoType: ['', Validators.required],
      contentType: ['', Validators.required],
      product: ['', Validators.required],
      Qty: ['', Validators.required],
      Weight: ['', Validators.required],
      cbm: ['', Validators.required],
    });

    this.routeCargo(routeIndex).push(cargoForm);
  }

  // Remove a Route
  removeRoute(index: number) {
    this.routes.removeAt(index);
  }

  // Remove a Cargo Row from a Route
  removeCargo(routeIndex: number, cargoIndex: number) {
    this.routeCargo(routeIndex).removeAt(cargoIndex);
  }





  // Create a single row FormGroup
  createRow(): FormGroup {
    return this.fb.group({
      cargoType: ['', Validators.required],
      product: ['', Validators.required],
      Qty: ['', Validators.required],
      Weight: ['', Validators.required],
      Volume: ['', Validators.required],
      contentType: ['', Validators.required]
    });
  }
  // Access the cargoRoutes FormArray
  get cargoRoutes(): FormArray {
    return this.rateRequestForm.get('cargoRoutes') as FormArray;
  }


  getRows(routeIndex: number): FormArray {
    return this.routes.at(routeIndex).get('cargo') as FormArray;
  }


  get f(): { [key: string]: AbstractControl<any, any> } {
    return this.rateRequestForm.controls;
  }

  // getFormGroup(index: number): FormGroup {
  //   return this.cargoRoutes.at(index) as FormGroup;
  // }
  customers: any
  packageTypes: any
  ports: any
  departments: any
  enquiryForm: FormGroup;
  errorMessage: string = '';  // To store any error messages
  btnDisable: boolean = false;

  selectedFCLLCL: string = ''; // Store selected segment's FCL/LCL type
  getCurrentDateTime(): string {
    const now = new Date();
    return now.toISOString().slice(0, 16); // Format as 'YYYY-MM-DDTHH:mm'
  }



  onSegmentChange(event: Event) {
    const selectedDepartmentId = Number((event.target as HTMLSelectElement).value);
    const selectedDept = this.departments.find(dept => dept.DepartmentMasterSid === selectedDepartmentId);
    console.log(selectedDept)
    this.selectedDepartment = selectedDept?.departmentName
    this.selectedFCLLCL = selectedDept ? selectedDept.FCLLCL : 'LCL';
    setTimeout(() => {
      this.cdr.detectChanges(); // Ensure Angular detects the change
    }, 100);
  }
  loadCustomers(): void {
    this.leadService.getAllCustomers().subscribe(
      (resp: any) => {
        this.customers = resp
      });
  }

  loadDepartment(): void {
    this.leadService.getAllDepartments().subscribe(
      (resp: any) => {
        this.departments = resp
      });
  }


  loadCargoTypes(): void {
    this.leadService.getAllCargoTypes().subscribe(
      (resp: any) => {
        this.packageTypes = resp
      });
  }

  loadPorts(): void {
    this.leadService.getAllPorts().subscribe(
      (resp: any) => {
        this.ports = resp
      });
  }

  onSubmit() {
    const payload = {
      ...this.rateRequestForm.value,
      Segment: this.selectedDepartment // Add selectedDepartment properly
    };

    this.btnDisable = true;
    this.leadService.createEnquiry(payload).subscribe(
      resp => {
        if (resp.data && resp.status) {
          this.appSettingsService.showSuccess(resp.message);
          this.btnDisable = false;
          // this.rateRequestForm.patchValue(resp.data);
          this.router.navigate(['crm/rate-request/view'])
        } else {
          this.appSettingsService.showError(resp.message);
        }
      }
    )
    console.log('Update Meeting:', payload);
    this.btnDisable = false;
  }


  resetForm() {
    this.rateRequestForm.reset();
  }



  goBack() {
    this.router.navigate(['crm/rate-request/view'])
  }
}
