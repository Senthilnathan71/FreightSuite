import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class UnsavedChangesService {
    private hasUnsavedChanges$ = new BehaviorSubject<boolean>(false);

    get unsavedChanges$(): Observable<boolean> {
        return this.hasUnsavedChanges$.asObservable();
    }

    setUnsavedChanges(value: boolean): void {
        this.hasUnsavedChanges$.next(value);
    }

    getUnsavedChanges(): boolean {
        return this.hasUnsavedChanges$.getValue();
    }

    reset(): void {
        this.hasUnsavedChanges$.next(false);
    }
}
