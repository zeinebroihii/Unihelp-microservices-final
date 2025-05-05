import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GroupAddComponent } from './group-add.component';

describe('GroupAddComponent', () => {
  let component: GroupAddComponent;
  let fixture: ComponentFixture<GroupAddComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [GroupAddComponent]
    });
    fixture = TestBed.createComponent(GroupAddComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
