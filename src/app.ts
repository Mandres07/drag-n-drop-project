//#region ProjectType

enum ProjectStatus {
   Active,
   Finished
}

class Project {
   constructor(
      public id: string,
      public title: string,
      public description: string,
      public people: number,
      public status: ProjectStatus
   ) { }
}

//#endregion

//#region State Management

type Listener<T> = (items: T[]) => void;

class State<T> {
   protected listeners: Listener<T>[] = [];

   addListener(listenerFn: Listener<T>) {
      this.listeners.push(listenerFn);
   }
}

class ProjectState extends State<Project> {
   private projects: Project[] = [];
   private static instance: ProjectState;

   private constructor() {
      super();
   }

   static getInstance() {
      if (this.instance) {
         return this.instance;
      }
      this.instance = new ProjectState();
      return this.instance;
   }

   addProject(title: string, description: string, people: number) {
      const newProject = new Project(Math.random().toString(), title, description, people, ProjectStatus.Active);
      this.projects.push(newProject);
      for (const listenerFns of this.listeners) {
         listenerFns(this.projects.slice());
      }
   }
}

const projectState = ProjectState.getInstance();

//#endregion

//#region Decorators

//#region AutoBind 
function AutoBind(_: any, _1: string, descriptor: PropertyDescriptor) {
   const originalMethod = descriptor.value;
   const adjDescriptor: PropertyDescriptor = {
      configurable: true,
      get() {
         const boundFn = originalMethod.bind(this);
         return boundFn;
      }
   }
   return adjDescriptor;
}
//#endregion

//#endregion

//#region Validation

interface Validatable {
   value: string | number;
   required?: boolean,
   minLength?: number,
   maxLength?: number,
   min?: number,
   max?: number
}

function validate(input: Validatable): boolean {
   let isValid = true;
   if (input.required) {
      isValid = isValid && input.value.toString().trim().length !== 0;
   }
   if (input.minLength != null && typeof input.value === 'string') {
      isValid = isValid && input.value.trim().length >= input.minLength;
   }
   if (input.maxLength != null && typeof input.value === 'string') {
      isValid = isValid && input.value.trim().length <= input.maxLength;
   }
   if (input.min != null && typeof input.value === 'number') {
      isValid = isValid && input.value >= input.min;
   }
   if (input.max != null && typeof input.value === 'number') {
      isValid = isValid && input.value <= input.max;
   }
   return isValid;
}

//#endregion

//#region Component class

abstract class Component<T extends HTMLElement, U extends HTMLElement> {
   templateElement: HTMLTemplateElement;
   hostElement: T;
   element: U;

   constructor(templateId: string, hostElementId: string, insertAtStart: boolean, newElementId?: string) {
      this.templateElement = document.getElementById(templateId)! as HTMLTemplateElement;
      this.hostElement = document.getElementById(hostElementId)! as T;
      const importedNode = document.importNode(this.templateElement.content, true);
      this.element = importedNode.firstElementChild as U;
      if (newElementId) {
         this.element.id = newElementId;
      }
      this.attach(insertAtStart);
   }

   private attach(insertAtStart: boolean) {
      this.hostElement.insertAdjacentElement(insertAtStart ? 'afterbegin' : 'beforeend', this.element);
   }

   abstract configure(): void;
   abstract renderContent(): void;
}

//#endregion

//#region ProjectItem

class ProjectItem extends Component<HTMLUListElement, HTMLLIElement> {
   private project: Project;

   get persons() {
      if (this.project.people === 1) {
         return '1 person';
      }
      return `${this.project.people} persons`;
   }

   constructor(hostId: string, p: Project) {
      super('single-project', hostId, false, p.id);
      this.project = p;
      this.configure();
      this.renderContent();
   }

   configure(): void { }

   renderContent(): void {
      this.element.querySelector('h2')!.textContent = this.project.title;
      this.element.querySelector('h3')!.textContent = `${this.persons} assigned`;
      this.element.querySelector('p')!.textContent = this.project.description;
   }
}

//#endregion

//#region  ProjectList

class ProjectList extends Component<HTMLDivElement, HTMLElement> {
   assignedProjects: Project[];

   constructor(private type: 'active' | 'finished') {
      super('project-list', 'app', false, `${type}-projects`);
      this.assignedProjects = [];
      this.configure();
      this.renderContent();
   }

   configure(): void {
      projectState.addListener((projects: Project[]) => {
         const relevantProjects = projects.filter(prj => {
            if (this.type === 'active') {
               return prj.status === ProjectStatus.Active;
            }
            return prj.status === ProjectStatus.Finished;
         });
         this.assignedProjects = relevantProjects;
         this.renderProjects();
      });
   }

   renderContent() {
      const listId = `${this.type}-projects-list`;
      this.element.querySelector('ul')!.id = listId;
      this.element.querySelector('h2')!.textContent = this.type.toUpperCase() + ' PROJECTS';
   }

   private renderProjects() {
      const listEl = document.getElementById(`${this.type}-projects-list`) as HTMLUListElement;
      listEl.innerHTML = '';
      for (const item of this.assignedProjects) {
         new ProjectItem(this.element.querySelector('ul')!.id, item);
      }
   }
}

//#endregion

//#region ProjectInput

class ProjectInput extends Component<HTMLDivElement, HTMLFormElement> {
   titleInputElement: HTMLInputElement;
   descriptionInputElement: HTMLInputElement;
   peopleInputElement: HTMLInputElement;

   constructor() {
      super('project-input', 'app', true, 'user-input');
      this.titleInputElement = this.element.querySelector('#title')! as HTMLInputElement;
      this.descriptionInputElement = this.element.querySelector('#description')! as HTMLInputElement;
      this.peopleInputElement = this.element.querySelector('#people')! as HTMLInputElement;
      this.configure();
   }

   configure() {
      this.element.addEventListener('submit', this.submitHandler);
   }

   renderContent(): void {

   }

   private gatherUserInput(): [string, string, number] | void {
      const enteredTitle = this.titleInputElement.value;
      const enteredDescription = this.descriptionInputElement.value;
      const enteredPeople = this.peopleInputElement.value;

      const titleValidatable: Validatable = {
         value: enteredTitle,
         required: true
      };
      const descriptionValidatable: Validatable = {
         value: enteredDescription,
         required: true,
         minLength: 5
      };
      const peopleValidatable: Validatable = {
         value: +enteredPeople,
         required: true,
         min: 1,
         max: 5
      };

      if (!validate(titleValidatable) ||
         !validate(descriptionValidatable) ||
         !validate(peopleValidatable)) {
         alert('Invalid input, please try again.');
         return;
      }
      return [enteredTitle, enteredDescription, +enteredPeople];
   }

   private clearInputs() {
      this.titleInputElement.value = '';
      this.descriptionInputElement.value = '';
      this.peopleInputElement.value = '';
   }

   @AutoBind
   private submitHandler(event: Event) {
      event.preventDefault();
      const userInput = this.gatherUserInput();
      if (Array.isArray(userInput)) {
         const [title, description, people] = userInput;
         projectState.addProject(title, description, people);
         this.clearInputs();
      }
   }
}

//#endregion

const project = new ProjectInput();
const activeProjectList = new ProjectList('active');
const finishedProjectList = new ProjectList('finished');