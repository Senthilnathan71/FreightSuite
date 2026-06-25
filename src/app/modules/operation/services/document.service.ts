// // src/app/services/document.service.ts
// import { Injectable } from '@angular/core';
// import { HttpClient, HttpErrorResponse, HttpEvent, HttpEventType } from '@angular/common/http';
// import { Observable, throwError, BehaviorSubject } from 'rxjs';
// import { catchError, map } from 'rxjs/operators';
// import { environment } from '../../../environments/environment';

// export interface BillOfLadingData {
//   shipper: string;
//   consignee: string;
//   portOfLoading: string;
//   portOfDischarge: string;
//   vesselVoyage: string;
//   cargoDetails: string;
//   containerDetails: string;
//   blNumber?: string;
//   dateOfIssue?: string;
//   confidence: number;
//   extractedText?: string;
// }

// export interface DocumentProcessResponse {
//   success: boolean;
//   data?: BillOfLadingData;
//   error?: string;
//   message?: string;
//   processingTime?: number;
// }

// export interface UploadProgress {
//   percentage: number;
//   stage: 'uploading' | 'processing' | 'complete' | 'error';
//   message: string;
// }

// @Injectable({
//   providedIn: 'root'
// })
// export class DocumentService {
//   private readonly apiUrl = environment.apiUrl || 'http://localhost:3000';
//   private uploadProgress$ = new BehaviorSubject<UploadProgress>({ 
//     percentage: 0, 
//     stage: 'uploading', 
//     message: 'Ready to upload' 
//   });

//   constructor(private http: HttpClient) {}

//   getUploadProgress(): Observable<UploadProgress> {
//     return this.uploadProgress$.asObservable();
//   }

//   uploadBillOfLading(file: File): Observable<BillOfLadingData> {
//     // Reset progress
//     this.uploadProgress$.next({ 
//       percentage: 0, 
//       stage: 'uploading', 
//       message: 'Starting upload...' 
//     });

//     const formData = new FormData();
//     formData.append('file', file);

//     return this.http.post<DocumentProcessResponse>(
//       `${this.apiUrl}api/documents/upload/bill-of-lading`, 
//       formData,
//       {
//         reportProgress: true,
//         observe: 'events'
//       }
//     ).pipe(
//       map((event: HttpEvent<DocumentProcessResponse>) => {
//         switch (event.type) {
//           case HttpEventType.UploadProgress:
//             if (event.total) {
//               const percentage = Math.round(100 * event.loaded / event.total);
//               this.uploadProgress$.next({
//                 percentage: Math.min(percentage, 90), // Cap at 90% for upload
//                 stage: 'uploading',
//                 message: `Uploading... ${percentage}%`
//               });
//             }
//             return null;

//           case HttpEventType.Response:
//             this.uploadProgress$.next({
//               percentage: 95,
//               stage: 'processing',
//               message: 'Processing document...'
//             });

//             const response = event.body;
            
//             if (response?.success && response.data) {
//               this.uploadProgress$.next({
//                 percentage: 100,
//                 stage: 'complete',
//                 message: `Processing complete! Confidence: ${Math.round(response.data.confidence * 100)}%`
//               });
//               return response.data;
//             } else {
//               this.uploadProgress$.next({
//                 percentage: 0,
//                 stage: 'error',
//                 message: response?.error || 'Processing failed'
//               });
//               throw new Error(response?.error || 'Failed to process document');
//             }

//           default:
//             return null;
//         }
//       }),
//       map(data => data as BillOfLadingData), // Filter out null values
//       catchError(this.handleError.bind(this))
//     );
//   }

//   testConnection(): Observable<any> {
//     return this.http.post(`${this.apiUrl}/api/documents/test`, {})
//       .pipe(catchError(this.handleError.bind(this)));
//   }

//   private handleError(error: HttpErrorResponse): Observable<never> {
//     let errorMessage = 'An error occurred while processing the document';
    
//     this.uploadProgress$.next({
//       percentage: 0,
//       stage: 'error',
//       message: 'Upload failed'
//     });

//     if (error.error instanceof ErrorEvent) {
//       // Client-side error
//       errorMessage = `Network error: ${error.error.message}`;
//     } else {
//       // Server-side error
//       switch (error.status) {
//         case 400:
//           errorMessage = error.error?.error || 'Invalid file format. Please upload a PDF file.';
//           break;
//         case 413:
//           errorMessage = 'File too large. Please upload a PDF file smaller than 10MB.';
//           break;
//         case 500:
//           errorMessage = 'Server error. Please try again later.';
//           break;
//         case 0:
//           errorMessage = 'Unable to connect to server. Please check your connection.';
//           break;
//         default:
//           if (error.error?.error) {
//             errorMessage = error.error.error;
//           } else if (error.error?.message) {
//             errorMessage = error.error.message;
//           }
//       }
//     }

//     console.error('Document service error:', error);
//     return throwError(() => new Error(errorMessage));
//   }
// }


export interface BillOfLadingData {
  shipper: string;
  shipperAddress: string;
  consignee: string;
  consigneeAddress: string;
  notifyParty: string;
  portOfLoading: string;
  portOfDischarge: string;
  placeOfReceipt: string;
  placeOfDelivery: string;
  vesselVoyage: string;
  cargoDetails: string;
  cargoDescription: string;
  numberOfPackages: string;
  packageType: string;
  grossWeight: string;
  measurement: string;
  containerDetails: string;
  consolNumber: string;
  blNumber?: string;
} 
  
  // src/app/services/document.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpEvent, HttpEventType } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';

export interface BillOfLadingData {
  // Document Information
  blNumber?: string;
  dateOfIssue?: string;
  placeOfIssue?: string;
  freightTerms?: string;
  
  // Shipper Information
  shipper: string;
  shipperAddress: string;
  
  // Consignee Information
  consignee: string;
  consigneeAddress: string;
  
  // Notify Party Information
  notifyParty: string;
  notifyPartyAddress: string;
  
  // Delivery Agent Information
  deliveryAgent: string;
  deliveryAgentAddress: string;
  
  // Ports and Places
  portOfLoading: string;
  portOfDischarge: string;
  placeOfReceipt: string;
  placeOfDelivery: string;
  
  // Vessel Information
  vesselVoyage: string;
  
  // Cargo Information
  cargoDetails: string;
  cargoDescription: string;
  marksAndNumbers: string;
  numberOfPackages: string;
  packageType: string;
  grossWeight: string;
  netWeight: string;
  measurement: string;

  // Container Information
  containerDetails: string;
  containerType?: string;
  consolNumber: string;
  sealNumber: string;

  // System Fields
  confidence: number;
  extractedText?: string;
}

export interface DocumentProcessResponse {
  success: boolean;
  data?: BillOfLadingData;
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
export class DocumentService {
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

  uploadBillOfLading(file: File): Observable<BillOfLadingData> {
    // Reset progress
    this.uploadProgress$.next({ 
      percentage: 0, 
      stage: 'uploading', 
      message: 'Starting upload...' 
    });

    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<DocumentProcessResponse>(
      `${this.apiUrl}api/documents/upload/bill-of-lading`, 
      formData,
      {
        reportProgress: true,
        observe: 'events'
      }
    ).pipe(
      map((event: HttpEvent<DocumentProcessResponse>) => {
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
              message: 'Processing document...'
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
              throw new Error(response?.error || 'Failed to process document');
            }

          default:
            return null;
        }
      }),
      map(data => data as BillOfLadingData), // Filter out null values
      catchError(this.handleError.bind(this))
    );
  }

  testConnection(): Observable<any> {
    return this.http.post(`${this.apiUrl}api/documents/test`, {})
      .pipe(catchError(this.handleError.bind(this)));
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An error occurred while processing the document';
    
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
          errorMessage = 'File too large. Please upload a PDF file smaller than 10MB.';
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

    console.error('Document service error:', error);
    return throwError(() => new Error(errorMessage));
  }
}
