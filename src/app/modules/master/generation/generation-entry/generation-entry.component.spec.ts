import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GenerationEntryComponent } from './generation-entry.component';

describe('GenerationEntryComponent', () => {
  let component: GenerationEntryComponent;
  let fixture: ComponentFixture<GenerationEntryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GenerationEntryComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(GenerationEntryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
