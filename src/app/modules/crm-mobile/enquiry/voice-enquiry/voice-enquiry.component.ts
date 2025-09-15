import { CommonModule } from '@angular/common';
import { Component, EventEmitter, OnDestroy, OnInit, Output } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FeatherModule } from 'angular-feather';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { LeadService } from '../../Services/lead.service';

interface VoiceExtractionResult {
  extractedData: {
    customerName?: string;
    polPort?: string;
    podPort?: string;
    cargoType?: string;
    cargoDescription?: string;
    weight?: number;
    qty?: number;
    containerType?: string;
    expectedShipDate?: string;
    department?: string;
    serviceType?: string;
    additionalInfo?: string;
  };
  confidence: {
    [key: string]: number;
  };
  missingFields: string[];
  rawTranscription: string;
}

@Component({
  selector: 'app-voice-enquiry',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    FeatherModule
  ],
  templateUrl: './voice-enquiry.component.html',
  styleUrl: './voice-enquiry.component.scss'
})
export class VoiceEnquiryComponent implements OnInit, OnDestroy {
  @Output() enquiryCreated = new EventEmitter<any>();
  @Output() modalClosed = new EventEmitter<void>();

  // Voice recognition properties
  isRecording = false;
  isProcessing = false;
  transcription = '';
  recognition: any;
  interimTranscription = '';
  finalTranscription = '';

  // Extracted data properties
  extractedData: any = {};
  confidence: any = {};
  missingFields: string[] = [];
  processingStage = '';
  showResults = false;

  // Master data for validation
  customers: any[] = [];
  ports: any[] = [];
  departments: any[] = [];
  containerTypes: any[] = [];
  currentCompany: any;

  constructor(
    private appSettingsService: AppSettingsService,
    private leadService: LeadService
  ) {}

  ngOnInit(): void {
    this.initializeSpeechRecognition();
    this.loadMasterData();
    this.currentCompany = this.appSettingsService.decrypt(localStorage.getItem('selected-company'));
  }

  ngOnDestroy(): void {
    if (this.recognition) {
      this.recognition.stop();
    }
  }

  private initializeSpeechRecognition(): void {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      this.recognition = new SpeechRecognition();

      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-US';
      this.recognition.maxAlternatives = 1;

      this.recognition.onstart = () => {
        this.isRecording = true;
        this.processingStage = 'Listening...';
      };

      this.recognition.onresult = (event: any) => {
        let interim = '';
        let final = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            final += transcript;
          } else {
            interim += transcript;
          }
        }

        this.interimTranscription = interim;
        this.finalTranscription += final;
        this.transcription = this.finalTranscription + interim;
      };

      this.recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        this.isRecording = false;
        this.processingStage = 'Error: ' + event.error;
        this.appSettingsService.showError('Speech recognition failed: ' + event.error);
      };

      this.recognition.onend = () => {
        this.isRecording = false;
        if (this.finalTranscription.trim()) {
          this.processVoiceInput();
        }
      };
    } else {
      this.appSettingsService.showError('Speech recognition is not supported in this browser');
    }
  }

  private loadMasterData(): void {
    const CompanyMasterSid = this.currentCompany?.CompanyMasterSid;

    // Load all required master data
    this.leadService.getAllCustomers(CompanyMasterSid).subscribe(customers => {
      this.customers = customers;
    });

    this.leadService.getAllPorts().subscribe(ports => {
      this.ports = ports;
    });

    this.leadService.getAllDepartments(CompanyMasterSid).subscribe(departments => {
      this.departments = departments;
    });

    this.leadService.getAllContainerTypes().subscribe(containerTypes => {
      this.containerTypes = containerTypes;
    });
  }

  startRecording(): void {
    if (this.recognition) {
      this.transcription = '';
      this.finalTranscription = '';
      this.interimTranscription = '';
      this.showResults = false;
      this.recognition.start();
    }
  }

  stopRecording(): void {
    if (this.recognition && this.isRecording) {
      this.recognition.stop();
    }
  }

  private processVoiceInput(): void {
    if (!this.finalTranscription.trim()) {
      this.appSettingsService.showWarning('No speech detected. Please try again.');
      return;
    }

    this.isProcessing = true;
    this.processingStage = 'Processing speech...';

    const payload = {
      transcription: this.finalTranscription,
      masterData: {
        customers: this.customers.map(c => ({ id: c.CustomerMasterSid, name: c.CustomerName })),
        ports: this.ports.map(p => ({ id: p.PortMasterSid, name: p.PortName, code: p.PortCode })),
        departments: this.departments.map(d => ({ id: d.DepartmentMasterSid, name: d.departmentName, type: d.departmentType })),
        containerTypes: this.containerTypes.map(ct => ({ id: ct.ContainerTypeMasterSid, name: ct.ContainerName }))
      }
    };

    this.leadService.processVoiceEnquiry(payload).subscribe({
      next: (response: VoiceExtractionResult) => {
        this.extractedData = response.extractedData;
        this.confidence = response.confidence;
        // Use our own validation instead of backend response
        this.updateMissingFields();
        this.showResults = true;
        this.isProcessing = false;
        this.processingStage = 'Processing complete';
      },
      error: (error) => {
        console.error('Voice processing error:', error);
        this.isProcessing = false;
        this.processingStage = 'Processing failed';
        this.appSettingsService.showError('Failed to process voice input. Please try again.');
      }
    });
  }

  getConfidenceColor(field: string): string {
    const conf = this.confidence[field] || 0;
    if (conf >= 0.8) return 'text-success';
    if (conf >= 0.5) return 'text-warning';
    return 'text-danger';
  }

  getConfidenceIcon(field: string): string {
    const conf = this.confidence[field] || 0;
    if (conf >= 0.8) return 'check-circle';
    if (conf >= 0.5) return 'alert-triangle';
    return 'x-circle';
  }

  isMissingField(field: string): boolean {
    return this.missingFields.includes(field);
  }

  editField(field: string, newValue: any): void {
    this.extractedData[field] = newValue;

    // Set default confidence for manually entered fields
    if (!this.confidence[field]) {
      this.confidence[field] = 1.0; // Full confidence for manual entry
    }

    // Update missing fields list dynamically
    this.updateMissingFields();
  }

  private updateMissingFields(): void {
    const requiredFieldMapping = {
      'Customer Name': 'customerName',
      'Service Type': 'serviceType',
      'Port of Loading': 'polPort',
      'Port of Discharge': 'podPort',
      'Cargo Description': 'cargoDescription',
      'Expected Ship Date': 'expectedShipDate'
    };

    this.missingFields = [];

    for (const [label, key] of Object.entries(requiredFieldMapping)) {
      if (!this.extractedData[key] || this.extractedData[key] === '') {
        this.missingFields.push(label);
      }
    }
  }

  canCreateEnquiry(): boolean {
    // Update missing fields before checking
    this.updateMissingFields();
    return this.missingFields.length === 0;
  }

  createEnquiry(): void {
    if (!this.canCreateEnquiry()) {
      this.appSettingsService.showWarning('Please fill in all missing mandatory fields before creating the enquiry');
      return;
    }

    // Map extracted data to enquiry format
    const enquiryData = this.mapToEnquiryFormat();

    this.enquiryCreated.emit(enquiryData);
    this.close();
  }

  private mapToEnquiryFormat(): any {
    const data = this.extractedData;

    // Find matching master data IDs
    const customer = this.customers.find(c =>
      c.CustomerName.toLowerCase().includes(data.customerName?.toLowerCase())
    );

    const polPort = this.ports.find(p =>
      p.PortName.toLowerCase().includes(data.polPort?.toLowerCase()) ||
      p.PortCode.toLowerCase().includes(data.polPort?.toLowerCase())
    );

    const podPort = this.ports.find(p =>
      p.PortName.toLowerCase().includes(data.podPort?.toLowerCase()) ||
      p.PortCode.toLowerCase().includes(data.podPort?.toLowerCase())
    );

    const department = this.departments.find(d =>
      d.departmentName.toLowerCase().includes(data.department?.toLowerCase()) ||
      d.departmentType.toLowerCase().includes(data.serviceType?.toLowerCase())
    );

    const containerType = this.containerTypes.find(ct =>
      ct.ContainerName.toLowerCase().includes(data.containerType?.toLowerCase())
    );

    return {
      CustomerMasterSid: customer?.CustomerMasterSid,
      customerName: data.customerName,
      DepartmentMasterSid: department?.DepartmentMasterSid,
      Segment: department?.departmentType === 'Sea' ? department.FCLLCL : department?.departmentType?.toUpperCase(),
      shipmentDate: data.expectedShipDate ? new Date(data.expectedShipDate) : null,
      Email: '', // Can be filled later
      routes: [{
        POO: polPort?.PortMasterSid,
        POL: polPort?.PortMasterSid,
        POD: podPort?.PortMasterSid,
        FDC: podPort?.PortMasterSid,
        cargo: [{
          CargoType: data.cargoType || 'General',
          ProductName: data.cargoDescription,
          CargoDescription: data.cargoDescription,
          Qty: data.qty || 1,
          GrossWeight: data.weight,
          ContainerType: containerType?.ContainerName,
          cbm: 1
        }]
      }],
      rawTranscription: this.finalTranscription,
      extractedFields: data,
      confidence: this.confidence
    };
  }

  tryAgain(): void {
    this.showResults = false;
    this.transcription = '';
    this.finalTranscription = '';
    this.extractedData = {};
    this.confidence = {};
    this.missingFields = [];
  }

  close(): void {
    this.modalClosed.emit();
  }
}