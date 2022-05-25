import _ from 'lodash';
import { ProjectInput } from './components/project-input';
import { ProjectList } from './components/project-list';

// declaring a global var or code that is available on a js script
declare var GLOBAL: any;

new ProjectInput();
new ProjectList('active');
new ProjectList('finished');

console.log(_.shuffle([1, 2, 3, 4, 5]));
console.log(GLOBAL);