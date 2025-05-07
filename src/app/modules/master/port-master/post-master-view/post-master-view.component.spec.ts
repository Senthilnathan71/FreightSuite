import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PostMasterViewComponent } from './post-master-view.component';

describe('PostMasterViewComponent', () => {
  let component: PostMasterViewComponent;
  let fixture: ComponentFixture<PostMasterViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PostMasterViewComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PostMasterViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
