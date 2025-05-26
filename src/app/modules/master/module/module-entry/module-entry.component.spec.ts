import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModuleEntryComponent } from './module-entry.component';

describe('ModuleEntryComponent', () => {
  let component: ModuleEntryComponent;
  let fixture: ComponentFixture<ModuleEntryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModuleEntryComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ModuleEntryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
