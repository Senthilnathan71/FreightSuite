import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpEvent, HttpEventType } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, map, filter } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface ContainerInfo {
  containerNumber: string;
  containerType: string;
  sealNumber: string;
  size: string;
  weight: string;
  measurement: string;
}

export interface ManifestData {
  masterJob: {
    manifestNumber: string;
    jobNumber: string;
    vesselName: string;
    voyageNumber: string;
    portOfLoading: string;
    portOfDischarge: string;
    dateOfDeparture: string;
    dateOfArrival: string;
    etd: string;
    eta: string;
    agent: string;
    carrier: string;
    totalContainers: number;
    totalWeight: string;
    totalVolume: string;
    containerList: ContainerInfo[];
  };
  houseJobs: Array<{
    hblNumber: string;
    shipper: string;
    shipperAddress: string;
    consignee: string;
    consigneeAddress: string;
    notifyParty: string;
    cargoDescription: string;
    numberOfPackages: string;
    packageType: string;
    grossWeight: string;
    netWeight: string;
    measurement: string;
    containerNumbers: string[];
    marksAndNumbers: string;
    freightTerms: string;
  }>;
  confidence: number;
}

export interface ManifestProcessResponse {
  success: boolean;
  data?: ManifestData;
  error?: string;
  message?: string;
  processingTime?: number;
}

export interface UploadProgress {
  percentage: number;
  stage: 'uploading' | 'processing' | 'complete' | 'error';
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class ManifestService {
  private readonly apiUrl = environment.apiUrl || 'http://localhost:3000';
  private uploadProgress$ = new BehaviorSubject<UploadProgress>({
    percentage: 0,
    stage: 'uploading',
    message: 'Ready to upload'
  });

  constructor(private http: HttpClient) {}

  getUploadProgress(): Observable<UploadProgress> {
    return this.uploadProgress$.asObservable();
  }

  uploadManifest(file: File): Observable<ManifestData> {
    // Reset progress
    this.uploadProgress$.next({
      percentage: 0,
      stage: 'uploading',
      message: 'Starting upload...'
    });

    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<ManifestProcessResponse>(
      `${this.apiUrl}api/manifestDoc/upload/manifest`,
      formData,
      {
        reportProgress: true,
        observe: 'events'
      }
    ).pipe(
      map((event: HttpEvent<ManifestProcessResponse>) => {
        switch (event.type) {
          case HttpEventType.UploadProgress:
            if (event.total) {
              const percentage = Math.round(100 * event.loaded / event.total);
              this.uploadProgress$.next({
                percentage: Math.min(percentage, 90), // Cap at 90% for upload
                stage: 'uploading',
                message: `Uploading... ${percentage}%`
              });
            }
            return null;

          case HttpEventType.Response:
            this.uploadProgress$.next({
              percentage: 95,
              stage: 'processing',
              message: 'Processing manifest document...'
            });

            const response = event.body;

            if (response?.success && response.data) {
              this.uploadProgress$.next({
                percentage: 100,
                stage: 'complete',
                message: `Processing complete! Confidence: ${Math.round(response.data.confidence * 100)}%`
              });
              return response.data;
            } else {
              this.uploadProgress$.next({
                percentage: 0,
                stage: 'error',
                message: response?.error || 'Processing failed'
              });
              throw new Error(response?.error || 'Failed to process manifest document');
            }

          default:
            return null;
        }
      }),
      filter(data => data !== null), // Filter out null values
      map(data => data as ManifestData),
      catchError(this.handleError.bind(this))
    );
  }

  testConnection(): Observable<any> {
    return this.http.post(`${this.apiUrl}api/manifestDoc/test`, {})
      .pipe(catchError(this.handleError.bind(this)));
  }

  resetProgress(): void {
    this.uploadProgress$.next({
      percentage: 0,
      stage: 'uploading',
      message: 'Ready to upload'
    });
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An error occurred while processing the manifest document';

    this.uploadProgress$.next({
      percentage: 0,
      stage: 'error',
      message: 'Upload failed'
    });

    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Network error: ${error.error.message}`;
    } else {
      // Server-side error
      switch (error.status) {
        case 400:
          errorMessage = error.error?.error || 'Invalid file format. Please upload a PDF file.';
          break;
        case 413:
          errorMessage = 'File too large. Please upload a PDF file smaller than 20MB.';
          break;
        case 500:
          errorMessage = 'Server error. Please try again later.';
          break;
        case 0:
          errorMessage = 'Unable to connect to server. Please check your connection.';
          break;
        default:
          if (error.error?.error) {
            errorMessage = error.error.error;
          } else if (error.error?.message) {
            errorMessage = error.error.message;
          }
      }
    }

    console.error('Manifest service error:', error);
    return throwError(() => new Error(errorMessage));
  }
}