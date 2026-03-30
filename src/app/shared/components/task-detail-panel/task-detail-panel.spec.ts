import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TaskDetailPanel } from './task-detail-panel';

describe('TaskDetailPanel', () => {
  let component: TaskDetailPanel;
  let fixture: ComponentFixture<TaskDetailPanel>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TaskDetailPanel],
    }).compileComponents();

    fixture = TestBed.createComponent(TaskDetailPanel);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
