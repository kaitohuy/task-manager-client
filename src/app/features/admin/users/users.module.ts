import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { UsersComponent } from './users.component';

const routes: Routes = [
  { path: '', component: UsersComponent }
];

@NgModule({
  imports: [UsersComponent, RouterModule.forChild(routes)]
})
export class UsersModule {}
