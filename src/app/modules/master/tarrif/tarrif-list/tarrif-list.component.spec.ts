import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TarrifListComponent } from './tarrif-list.component';

describe('TarrifListComponent', () => {
  let component: TarrifListComponent;
  let fixture: ComponentFixture<TarrifListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TarrifListComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(TarrifListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
