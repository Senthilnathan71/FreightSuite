import { CommonModule } from '@angular/common';
import { Component, EventEmitter, OnDestroy, OnInit, Output } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FeatherModule } from 'angular-feather';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { LeadService } from '../../Services/lead.service';

interface VoiceExtractionResult {
  extractedData: {
    // Header fields
    customerName?: string;
    expectedShipDate?: string;
    department?: string;
    serviceType?: string;

    // Route fields
    polPort?: string;
    podPort?: string;

    // Cargo fields - Core from voice
    cargoType?: string;
    cargoDescription?: string;
    product?: string;
    grossWeight?: number;
    qty?: number;

    // Cargo fields - Smart defaults
    packageType?: string;
    weightUnit?: string;
    netWeight?: number;
    terms?: string;
    cbm?: number;
    containerType?: string;
    additionalInfo?: string;
  };
  confidence: {
    [key: string]: number;
  };
  missingFields: string[];
  smartDefaults: { [key: string]: any };
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
  activeTab = 'header'; // Default active tab

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
      // Header mandatory fields
      'Customer Name': 'customerName',
      'Expected Shipment Date': 'expectedShipDate',
      'Department Name': 'serviceType', // Using serviceType for department validation

      // Route mandatory fields
      'Port of Loading (POL)': 'polPort',
      'Port of Discharge (POD)': 'podPort',

      // Cargo mandatory fields
      'Cargo Type': 'cargoType',
      'Cargo Description': 'cargoDescription',
      'Product': 'product',
      'Package Type': 'packageType',
      'Quantity': 'qty',
      'Weight Unit': 'weightUnit',
      'Gross Weight': 'grossWeight',
      'Net Weight': 'netWeight',
      'Terms (FCL/LCL)': 'terms',
      'CBM': 'cbm'
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

    // Find matching master data IDs with better matching logic
    const customer = this.customers.find(c => {
      if (!data.customerName) return false;
      const customerNameLower = data.customerName.toLowerCase();
      const customerDbNameLower = c.CustomerName.toLowerCase();
      return customerDbNameLower.includes(customerNameLower) ||
             customerNameLower.includes(customerDbNameLower);
    });

    // Improved port matching with common variations
    const polPort = this.ports.find(p => {
      if (!data.polPort) return false;
      const polLower = data.polPort.toLowerCase();
      const portNameLower = p.PortName.toLowerCase();
      const portCodeLower = p.PortCode.toLowerCase();

      // Check for exact matches first
      if (portNameLower === polLower || portCodeLower === polLower) return true;

      // Check for common port name variations
      if (polLower.includes('chennai') && (portNameLower.includes('chennai') || portCodeLower.includes('maa'))) return true;
      if (polLower.includes('mumbai') && (portNameLower.includes('mumbai') || portCodeLower.includes('bom'))) return true;
      if (polLower.includes('delhi') && (portNameLower.includes('delhi') || portCodeLower.includes('del'))) return true;
      if (polLower.includes('kolkata') && (portNameLower.includes('kolkata') || portCodeLower.includes('ccu'))) return true;
      if (polLower.includes('kochi') && (portNameLower.includes('kochi') || portCodeLower.includes('cok'))) return true;

      // General matching
      return portNameLower.includes(polLower) || portCodeLower.includes(polLower) ||
             polLower.includes(portNameLower) || polLower.includes(portCodeLower);
    });

    const podPort = this.ports.find(p => {
      if (!data.podPort) return false;
      const podLower = data.podPort.toLowerCase();
      const portNameLower = p.PortName.toLowerCase();
      const portCodeLower = p.PortCode.toLowerCase();

      // Check for exact matches first
      if (portNameLower === podLower || portCodeLower === podLower) return true;

      // Check for common port name variations
      if (podLower.includes('colombo') && (portNameLower.includes('colombo') || portCodeLower.includes('cmb'))) return true;
      if (podLower.includes('singapore') && (portNameLower.includes('singapore') || portCodeLower.includes('sin'))) return true;
      if (podLower.includes('dubai') && (portNameLower.includes('dubai') || portCodeLower.includes('dxb'))) return true;
      if (podLower.includes('hamburg') && (portNameLower.includes('hamburg') || portCodeLower.includes('ham'))) return true;
      if (podLower.includes('rotterdam') && (portNameLower.includes('rotterdam') || portCodeLower.includes('rtm'))) return true;

      // General matching
      return portNameLower.includes(podLower) || portCodeLower.includes(podLower) ||
             podLower.includes(portNameLower) || podLower.includes(portCodeLower);
    });

    // Better department matching based on service type
    const department = this.departments.find(d => {
      if (data.serviceType) {
        const serviceTypeLower = data.serviceType.toLowerCase();
        const deptTypeLower = d.departmentType?.toLowerCase();
        const deptNameLower = d.departmentName?.toLowerCase();

        // Direct service type matching
        if (serviceTypeLower === 'fcl' || serviceTypeLower === 'lcl') {
          return deptTypeLower === 'sea';
        }
        if (serviceTypeLower === 'air') {
          return deptTypeLower === 'air';
        }
        if (serviceTypeLower === 'road') {
          return deptTypeLower === 'road';
        }

        // Fallback matching
        return deptTypeLower?.includes(serviceTypeLower) ||
               deptNameLower?.includes(serviceTypeLower);
      }
      return false;
    });

    const containerType = this.containerTypes.find(ct => {
      if (!data.containerType) return false;
      return ct.ContainerName.toLowerCase().includes(data.containerType.toLowerCase());
    });

    // Build the enquiry data with proper field mapping
    return {
      CustomerMasterSid: customer?.CustomerMasterSid,
      customerName: data.customerName,
      DepartmentMasterSid: department?.DepartmentMasterSid,
      Segment: this.getSegmentFromServiceType(data.serviceType, department),
      shipmentDate: data.expectedShipDate ? new Date(data.expectedShipDate) : null,
      Email: '', // Can be filled later
      routes: [{
        POO: polPort?.PortMasterSid,
        POL: polPort?.PortMasterSid,
        POD: podPort?.PortMasterSid,
        FDC: podPort?.PortMasterSid,
        cargo: [{
          CargoType: data.cargoType || 'General',
          ProductName: data.product || data.cargoDescription,
          CargoDescription: data.cargoDescription,
          Qty: data.qty || 1,
          GrossWeight: data.grossWeight || data.weight, // Handle both field names
          NetWeight: data.netWeight,
          PackageType: data.packageType,
          WeightUnit: data.weightUnit || 'KG',
          ContainerType: containerType?.ContainerName,
          cbm: data.cbm || 1,
          Terms: data.terms || data.serviceType
        }]
      }],
      rawTranscription: this.finalTranscription,
      extractedFields: data,
      confidence: this.confidence,
      // Debug information
      debugInfo: {
        foundCustomer: !!customer,
        foundPOL: !!polPort,
        foundPOD: !!podPort,
        foundDepartment: !!department,
        polSearchTerm: data.polPort,
        podSearchTerm: data.podPort,
        serviceType: data.serviceType
      }
    };
  }

  private getSegmentFromServiceType(serviceType: string, department: any): string {
    if (!serviceType) return '';

    const serviceTypeLower = serviceType.toLowerCase();

    if (serviceTypeLower === 'fcl') return 'FCL';
    if (serviceTypeLower === 'lcl') return 'LCL';
    if (serviceTypeLower === 'air') return 'AIR';
    if (serviceTypeLower === 'road') return 'ROAD';

    // Fallback to department info
    if (department?.departmentType === 'Sea') {
      return department.FCLLCL || 'FCL';
    }

    return department?.departmentType?.toUpperCase() || serviceType.toUpperCase();
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

  // New methods for enhanced UI
  getMissingFieldsBySection(section: string): string[] {
    const sectionMappings = {
      'header': ['Customer Name', 'Expected Shipment Date', 'Department Name'],
      'route': ['Port of Loading (POL)', 'Port of Discharge (POD)'],
      'cargo': ['Cargo Type', 'Cargo Description', 'Product', 'Package Type', 'Quantity', 'Weight Unit', 'Gross Weight', 'Net Weight', 'Terms (FCL/LCL)', 'CBM']
    };

    return this.missingFields.filter(field => sectionMappings[section]?.includes(field));
  }

  getFieldIcon(field: string): string {
    if (this.confidence[field] >= 0.8) return 'check-circle';
    if (this.confidence[field] >= 0.5) return 'alert-triangle';
    if (this.confidence[field]) return 'x-circle';
    return 'edit-3'; // For manually entered fields
  }

  getFieldColorClass(field: string): string {
    if (this.confidence[field] >= 0.8) return 'text-success';
    if (this.confidence[field] >= 0.5) return 'text-warning';
    if (this.confidence[field]) return 'text-danger';
    return 'text-primary'; // For manually entered fields
  }

  getFieldSource(field: string): string {
    if (this.confidence[field] === 1.0 && this.extractedData[field]) {
      return 'Manual entry';
    } else if (this.confidence[field]) {
      return 'Voice extracted';
    }
    return 'Smart default';
  }

  isAutoFilled(field: string): boolean {
    // Check if field was auto-filled by smart defaults (no original confidence from voice)
    return this.extractedData[field] && !this.confidence[field];
  }

  updateNetWeight(): void {
    if (this.extractedData.grossWeight && !this.extractedData.netWeight) {
      this.extractedData.netWeight = Math.round(this.extractedData.grossWeight * 0.9 * 100) / 100;
      this.editField('netWeight', this.extractedData.netWeight);
    }
  }

  useTemplate(templateType: string): void {
    const templates = {
      'electronics': {
        transcription: 'Samsung India LCL shipment 2000 kg mobile phones Chennai to Colombo next week',
        description: 'Mobile electronics shipment'
      },
      'textile': {
        transcription: 'ABC Textiles FCL shipment 15000 kg cotton garments Mumbai to Dubai December 15th',
        description: 'Textile goods shipment'
      },
      'machinery': {
        transcription: 'Manufacturing Corp FCL shipment 8000 kg industrial machinery Kandla to Hamburg January 10th',
        description: 'Heavy machinery shipment'
      },
      'food': {
        transcription: 'Food Corp LCL shipment 3000 kg organic spices Kochi to New York next month',
        description: 'Food products shipment'
      }
    };

    const template = templates[templateType];
    if (template) {
      this.finalTranscription = template.transcription;
      this.transcription = template.transcription;
      this.processVoiceInput();
    }
  }

  switchTab(tabName: string): void {
    this.activeTab = tabName;
  }
}