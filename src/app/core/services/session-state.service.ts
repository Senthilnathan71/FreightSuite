import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SessionStateService {
  private readonly readOnlySubject = new BehaviorSubject<boolean>(false);
  readonly isReadOnly$: Observable<boolean> = this.readOnlySubject.asObservable();

  setReadOnly(value: boolean): void {
    this.readOnlySubject.next(value);
  }

  get isReadOnly(): boolean {
    return this.readOnlySubject.value;
  }

  clear(): void {
    this.readOnlySubject.next(false);
  }
}
