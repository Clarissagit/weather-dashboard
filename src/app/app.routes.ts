import { Routes } from '@angular/router';
import { Home } from './home/home';
import { Weather } from './weather/weather';
import { About } from './about/about';

export const routes: Routes = [
  { path: '', component: Home },
  { path: 'weather', component: Weather },
  { path: 'about', component: About },
  { path: '**', redirectTo: '' }
];