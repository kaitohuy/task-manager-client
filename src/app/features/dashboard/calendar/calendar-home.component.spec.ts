import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CalendarHomeComponent } from './calendar-home.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';

describe('CalendarHomeComponent', () => {
  let component: CalendarHomeComponent;
  let fixture: ComponentFixture<CalendarHomeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        CalendarHomeComponent,
        HttpClientTestingModule,
        RouterTestingModule
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CalendarHomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
