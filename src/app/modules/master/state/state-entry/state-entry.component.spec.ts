import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StateEntryComponent } from './state-entry.component';
import { describe } from 'node:test';
import { beforeEach } from 'node:test';

describe('StateEntryComponent', () => {
  let component: StateEntryComponent;
  let fixture: ComponentFixture<StateEntryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StateEntryComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(StateEntryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

function expect(component: StateEntryComponent) {
  throw new Error('Function not implemented.');
}
