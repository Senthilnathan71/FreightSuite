import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AppService {
  showErrorToast(errorMessage: string) {
    throw new Error('Method not implemented.');
  }
  showSuccessToast(arg0: string) {
    throw new Error('Method not implemented.');
  }
  private deviceDetectorSource = new BehaviorSubject<boolean>(false); // Default value
  deviceDetector$ = this.deviceDetectorSource.asObservable();
  
 
  constructor() { }

  // Method to update the value
   setDevice(value: boolean) {
    this.deviceDetectorSource.next(value);
  }

  // Method to get the current value (optional)
  getDevice(): boolean {
    return this.deviceDetectorSource.getValue();
  }
}
