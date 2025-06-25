import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GenerationListComponent } from './generation-list.component';

describe('GenerationListComponent', () => {
  let component: GenerationListComponent;
  let fixture: ComponentFixture<GenerationListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GenerationListComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(GenerationListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
