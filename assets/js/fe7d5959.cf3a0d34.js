"use strict";(self.webpackChunkdocs=self.webpackChunkdocs||[]).push([[90],{3905:(e,t,n)=>{n.d(t,{Zo:()=>c,kt:()=>m});var a=n(7294);function s(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}function o(e,t){var n=Object.keys(e);if(Object.getOwnPropertySymbols){var a=Object.getOwnPropertySymbols(e);t&&(a=a.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),n.push.apply(n,a)}return n}function i(e){for(var t=1;t<arguments.length;t++){var n=null!=arguments[t]?arguments[t]:{};t%2?o(Object(n),!0).forEach((function(t){s(e,t,n[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(n)):o(Object(n)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(n,t))}))}return e}function r(e,t){if(null==e)return{};var n,a,s=function(e,t){if(null==e)return{};var n,a,s={},o=Object.keys(e);for(a=0;a<o.length;a++)n=o[a],t.indexOf(n)>=0||(s[n]=e[n]);return s}(e,t);if(Object.getOwnPropertySymbols){var o=Object.getOwnPropertySymbols(e);for(a=0;a<o.length;a++)n=o[a],t.indexOf(n)>=0||Object.prototype.propertyIsEnumerable.call(e,n)&&(s[n]=e[n])}return s}var l=a.createContext({}),p=function(e){var t=a.useContext(l),n=t;return e&&(n="function"==typeof e?e(t):i(i({},t),e)),n},c=function(e){var t=p(e.components);return a.createElement(l.Provider,{value:t},e.children)},d="mdxType",h={inlineCode:"code",wrapper:function(e){var t=e.children;return a.createElement(a.Fragment,{},t)}},u=a.forwardRef((function(e,t){var n=e.components,s=e.mdxType,o=e.originalType,l=e.parentName,c=r(e,["components","mdxType","originalType","parentName"]),d=p(n),u=s,m=d["".concat(l,".").concat(u)]||d[u]||h[u]||o;return n?a.createElement(m,i(i({ref:t},c),{},{components:n})):a.createElement(m,i({ref:t},c))}));function m(e,t){var n=arguments,s=t&&t.mdxType;if("string"==typeof e||s){var o=n.length,i=new Array(o);i[0]=u;var r={};for(var l in t)hasOwnProperty.call(t,l)&&(r[l]=t[l]);r.originalType=e,r[d]="string"==typeof e?e:s,i[1]=r;for(var p=2;p<o;p++)i[p]=n[p];return a.createElement.apply(null,i)}return a.createElement.apply(null,n)}u.displayName="MDXCreateElement"},2598:(e,t,n)=>{n.r(t),n.d(t,{contentTitle:()=>r,default:()=>d,frontMatter:()=>i,metadata:()=>l,toc:()=>p});var a=n(7462),s=(n(7294),n(3905)),o=n(4996);const i={title:"Developing custom tasks"},r=void 0,l={unversionedId:"custom_task",id:"custom_task",title:"Developing custom tasks",description:"New custom tasks or HIT types can be added by implementing a React component meeting a few conditions. For some tasks, a Python base class must be sub-classed too. To be valid, task components must meet these conditions:",source:"@site/docs/custom_task.mdx",sourceDirName:".",slug:"/custom_task",permalink:"/covfee/docs/custom_task",editUrl:"https://github.com/facebook/docusaurus/edit/master/website/docs/custom_task.mdx",tags:[],version:"current",frontMatter:{title:"Developing custom tasks"},sidebar:"docs",previous:{title:"Development install",permalink:"/covfee/docs/development"}},p=[{value:"Types of tasks",id:"types-of-tasks",children:[],level:2},{value:"Task state",id:"task-state",children:[],level:2},{value:"Tutorial: developing your own task",id:"tutorial-developing-your-own-task",children:[{value:"Background",id:"background",children:[],level:3},{value:"Installation",id:"installation",children:[],level:3},{value:"The tutorial",id:"the-tutorial",children:[],level:3},{value:"Task props",id:"task-props",children:[],level:3},{value:"State",id:"state",children:[],level:3},{value:"React Component",id:"react-component",children:[],level:3},{value:"Importing the task",id:"importing-the-task",children:[],level:3}],level:2},{value:"Running the task",id:"running-the-task",children:[],level:2}],c={toc:p};function d(e){let{components:t,...n}=e;return(0,s.kt)("wrapper",(0,a.Z)({},c,n,{components:t,mdxType:"MDXLayout"}),(0,s.kt)("p",null,"New custom tasks or HIT types can be added by implementing a React component meeting a few conditions. For some tasks, a Python base class must be sub-classed too. To be valid, task components must meet these conditions:"),(0,s.kt)("h2",{id:"types-of-tasks"},"Types of tasks"),(0,s.kt)("p",null,"There are two main types of tasks in covfee:"),(0,s.kt)("ul",null,(0,s.kt)("li",{parentName:"ul"},"Tasks with shared state, or ",(0,s.kt)("em",{parentName:"li"},"multiplayer")," tasks are meant to be visited by multiple users at the same time. A chess game, or a collaborative live view form to be filled by multiple users at the same time is an example of a shared state task. Covfee internally manages state synchronization and persistence. A copy of the latest state is kept in the server. If the task is opened in multiple clients (windows/tabs), they will all be kept in sync and changes can be observed ",(0,s.kt)("em",{parentName:"li"},"live"),"."),(0,s.kt)("li",{parentName:"ul"},'Tasks without shared state, or "single player" tasks are meant to be visited by a single user. A standard form is a good example. If these tasks are opened in multiple clients (windows/tabs) they will not be kept in sync. Their state will diverge when multiple users make changes.')),(0,s.kt)("h2",{id:"task-state"},"Task state"),(0,s.kt)("p",null,'Covfee tasks are, in their most basic form, simply React components. In other words, copy-pasting any React component as a Covfee task would "work". However, in any type of online experiment we normally want to store the results of the task (eg. the answers to a questionnaire). '),(0,s.kt)("p",null,"In covfee, task components do not explicitly store or commit these results to the server. Instead, the state of the task is stored automatically by Covfee. To make use of this, any task state that should be persisted by Covfee must be managed in a central Redux store. In other words, ",(0,s.kt)("strong",{parentName:"p"},"implementing Covfee tasks boils down to implementing React components with a Redux state store")," in all cases. This means following the Redux design phylosophy by defining actions and reducers, which produce a new state given an action and the current state:"),(0,s.kt)("div",{style:{textAlign:"center"}},(0,s.kt)("img",{src:(0,o.Z)("/img/redux.png"),style:{width:"50%",maxWidth:"500px",textAlign:"center"}})),(0,s.kt)("p",null,"The React component's (Interface / view) job is simply to update the DOM according to the current state, and to dispatch actions in response to browser events."),(0,s.kt)("p",null,"State persistance and loading is managed internally by Covfee:"),(0,s.kt)("ul",null,(0,s.kt)("li",{parentName:"ul"},(0,s.kt)("p",{parentName:"li"},"For shared state tasks, Covfee will keep the most up-to-date state in the server, which will always represent the latest state of the task.")),(0,s.kt)("li",{parentName:"ul"},(0,s.kt)("p",{parentName:"li"},"For non-shared state tasks, the latest state is kept in the browser and persisted when necessary. Covfee submits and persists state whenever:"),(0,s.kt)("ul",{parentName:"li"},(0,s.kt)("li",{parentName:"ul"},"When a certain time has passed after the last state change. The default is 3s."),(0,s.kt)("li",{parentName:"ul"},"The user moves to the next or previous task or otherwise leaves the task. An exception is if the user abruptly closes the browser window/tab where the task is open. In this case the state may not sent to the server."),(0,s.kt)("li",{parentName:"ul"},'The user presses the "submit" button in the task.')))),(0,s.kt)("p",null,"State that does not need to be stored can be managed separately, for example using React's ",(0,s.kt)("inlineCode",{parentName:"p"},"useState"),"."),(0,s.kt)("h2",{id:"tutorial-developing-your-own-task"},"Tutorial: developing your own task"),(0,s.kt)("h3",{id:"background"},"Background"),(0,s.kt)("p",null,"This tutorial requires a basic understanding of Typescript, HTML, React and Redux. For progressing to more complex custom tasks the following is recommended:"),(0,s.kt)("ul",null,(0,s.kt)("li",{parentName:"ul"},"Typescript, Javascript, HTML, CSS. For more complex tasks, a good level of CSS might be necessary."),(0,s.kt)("li",{parentName:"ul"},"React: functional components, hooks (useState, useEffect, useContext, useRef, useMemo), custom hooks, fetching data. It's important to understand the nuances behind hooks and dependencies: when do hooks run?"),(0,s.kt)("li",{parentName:"ul"},"Redux, Redux toolkit. Important to understand how to think about application state and how to design the state, actions and reducers:")),(0,s.kt)("p",null,"In general, ",(0,s.kt)("strong",{parentName:"p"},"you should know how to design and write a React application using Redux for state management"),"."),(0,s.kt)("h3",{id:"installation"},"Installation"),(0,s.kt)("p",null,"Please start by following the ",(0,s.kt)("a",{parentName:"p",href:"development"},"development install instructions")," to install Covfee."),(0,s.kt)("h3",{id:"the-tutorial"},"The tutorial"),(0,s.kt)("p",null,"In this tutorial, we will create a simple contact form asking users for their name and email. Additionally, the task will have one boolean prop (",(0,s.kt)("inlineCode",{parentName:"p"},"showPhoneField"),") that, if true, will add a phone number field to the form. The answers to the form will be preserved in task state. "),(0,s.kt)("p",null,"We will place Typescript files for the task in ",(0,s.kt)("inlineCode",{parentName:"p"},"covfee/client/tasks"),", in the following structure:"),(0,s.kt)("pre",null,(0,s.kt)("code",{parentName:"pre"},"covfee\n    client\n        tasks\n            - my_task\n                - index.tsx       # the main React component\n                - slice.ts        # the state specification\n                - spec.ts         # the props for the task\n                ...               # any extra files needed\n")),(0,s.kt)("h3",{id:"task-props"},"Task props"),(0,s.kt)("p",null,"First, we place the specification for the task props in the ",(0,s.kt)("inlineCode",{parentName:"p"},"spec.ts")," file:"),(0,s.kt)("pre",null,(0,s.kt)("code",{parentName:"pre"},'import { BaseTaskSpec } from "@covfee-shared/spec/task"\n\n/**\n * @TJS-additionalProperties false\n */\nexport interface TutorialTaskSpec extends BaseTaskSpec {\n  /**\n   * @default "TutorialTask"\n   */\n  type: "TutorialTask"\n  /**\n   * Media file to be displayed.\n   */\n  showPhoneField?: boolean\n}\n')),(0,s.kt)("p",null,"These props will be parsed by Covfee so that they can be provided in Python when the task is created. They allow the user to configure the way a task is rendered to the user. In this case, we only provide two props. One is the name of the task. This will be the name of the task's Python class and is a constant value. The other one is our only true prop ",(0,s.kt)("inlineCode",{parentName:"p"},"showPhoneField"),", which we define to be boolean. The comments provided here will be parsed and will be available in Python when creating task objects. The line ",(0,s.kt)("inlineCode",{parentName:"p"},"TJS-additionalProperties false")," specifies that no additional properties should be allowed when the task is validated."),(0,s.kt)("h3",{id:"state"},"State"),(0,s.kt)("p",null,"Tasks in covfee specify their state by creating a Redux Toolkit slice. For our purposes a slice is just an object that encapsulates the initial state and the reducers for the task. In this case, we need the state to hold the user's name, email and phone number. Our ",(0,s.kt)("inlineCode",{parentName:"p"},"slice.ts")," file looks like this:"),(0,s.kt)("pre",null,(0,s.kt)("code",{parentName:"pre"},'import { createSlice } from "@reduxjs/toolkit"\n\nexport interface State {\n  name: string\n  email: string\n  phone: string\n}\n\nexport const initialState: State = {\n  name: "",\n  email: "",\n  phone: "",\n}\n\nexport const slice = createSlice({\n  name: "form",\n  initialState,\n  reducers: {\n    setName: (state, action) => {\n      state.name = action.payload\n    },\n    setEmail: (state, action) => {\n      state.email = action.payload\n    },\n    setPhone: (state, action) => {\n      state.phone = action.payload\n    },\n  },\n})\n\nexport const { actions, reducer } = slice\n')),(0,s.kt)("p",null,"Here we specified the type for the state, the initial state, and wrote separate reducers to set name, email and phone number. "),(0,s.kt)("h3",{id:"react-component"},"React Component"),(0,s.kt)("p",null,"Following React + Redux design philosophy, the main job of the React component is to sync state with the DOM (view), by reading the state and by calling Redux actions in response to user events. In this case we read the state variables using ",(0,s.kt)("inlineCode",{parentName:"p"},"useSelector")," in the same way it is used in Redux, and we call Redux actions whenever the content of the input elements changes. That's all!"),(0,s.kt)("pre",null,(0,s.kt)("code",{parentName:"pre"},'import React from "react"\nimport { slice, actions, State } from "./slice"\nimport { TaskExport } from "../../types/node"\nimport { CovfeeTaskProps } from "../base"\nimport type { TutorialTaskSpec } from "./spec"\nimport { AllPropsRequired } from "../../types/utils"\nimport { useDispatch } from "../../journey/state"\nimport { useSelector } from "react-redux"\n\ninterface Props extends CovfeeTaskProps<TutorialTaskSpec> {}\n\nconst TutorialTask: React.FC<Props> = (props) => {\n  // here we set the defaults for the task props\n  // we could use useMemo to avoid recomputing on every render\n  const args: AllPropsRequired<Props> = {\n    ...props,\n    spec: {\n      showPhoneField: true,\n      ...props.spec,\n    },\n  }\n\n  // we read the state using useSelector\n  const name = useSelector<State, string>((state) => state.name)\n  const email = useSelector<State, string>((state) => state.email)\n  const phoneNumber = useSelector<State, string>((state) => state.phone)\n\n  // this is a custom dispatch function provided by Covfee\n  const dispatch = useDispatch()\n\n  // and we render the component\n  return (\n    <form>\n      <div>\n        <label htmlFor="name">Name:</label>\n        <input\n          type="text"\n          id="name"\n          value={name}\n          onChange={(e) => dispatch(actions.setName(e.target.value))}\n          required\n        />\n      </div>\n      <div>\n        <label htmlFor="email">Email:</label>\n        <input\n          type="email"\n          id="email"\n          value={email}\n          onChange={(e) => dispatch(actions.setEmail(e.target.value))}\n          required\n        />\n      </div>\n      {args.spec.showPhoneField && (\n        <div>\n          <label htmlFor="phone">Phone:</label>\n          <input\n            type="tel"\n            id="phone"\n            value={phoneNumber}\n            onChange={(e) => dispatch(actions.setPhone(e.target.value))}\n          />\n        </div>\n      )}\n    </form>\n  )\n}\n\nexport default {\n  taskComponent: TutorialTask,\n  taskSlice: slice,\n  useSharedState: false,\n} as TaskExport\n\n')),(0,s.kt)("p",null,"Note the ",(0,s.kt)("em",{parentName:"p"},"export")," statement at the end of the file. Covfee expects every task to export a default object with these keys. ",(0,s.kt)("inlineCode",{parentName:"p"},"useSharedState")," should only be set to true for ",(0,s.kt)("em",{parentName:"p"},"multiplayer")," tasks."),(0,s.kt)("h3",{id:"importing-the-task"},"Importing the task"),(0,s.kt)("p",null,"Now that the task is created, the task should be imported into Covfee source files. To do this, modify the file at ",(0,s.kt)("inlineCode",{parentName:"p"},"/covfee/client/tasks/index.ts")," to import your custom task. Simply follow the same pattern as for the rest of the imports in the file. The task props specification (",(0,s.kt)("em",{parentName:"p"},"spec"),") should also be imported in ",(0,s.kt)("inlineCode",{parentName:"p"},"/covfee/shared/spec/task.ts"),"."),(0,s.kt)("p",null,"Now we are ready to create the auto-generated code that Covfee is designed to create. Covfee auto-generates two files using the tasks' props specification:"),(0,s.kt)("ul",null,(0,s.kt)("li",{parentName:"ul"},"/covfee/shared/schemata.json - JSON schemata. Each task props specification (spec) is translated into a JSON schema, used for validation and for generating the dataclasses."),(0,s.kt)("li",{parentName:"ul"},"/covfee/shared/task_dataclasses.py contains the dataclasses that can be used to create task objects in Python. These are simple objects that take the task props as constructor arguments. Covfee internally translates them into database entries to initialize its database on startup.")),(0,s.kt)("p",null,"These files may be useful for debugging purposes to eg. make sure that the dataclasses have the right arguments, types and comments."),(0,s.kt)("p",null,"To (re-)create both of these auto-generated files run:"),(0,s.kt)("pre",null,(0,s.kt)("code",{parentName:"pre"},"covfee-dev schemata\n")),(0,s.kt)("p",null,"After this step, it should be possible to manually verify that the dataclasses file contains a new class for our custom task."),(0,s.kt)("h2",{id:"running-the-task"},"Running the task"),(0,s.kt)("p",null,"The task is ready to be used. To do this in a dev environment, create a folder for the covfee project. This folder may be anywhere in the file system. The we will create the following structure:"),(0,s.kt)("pre",null,(0,s.kt)("code",{parentName:"pre"},"my_folder\n    - tutorial.py\n")),(0,s.kt)("p",null,"The naming is not relevant. Paste the following into the ",(0,s.kt)("inlineCode",{parentName:"p"},"tutorial.py"),":"),(0,s.kt)("pre",null,(0,s.kt)("code",{parentName:"pre"},'from covfee import tasks, HIT, Project\nfrom covfee.config import config\nfrom covfee.shared.dataclass import CovfeeApp\n\nconfig.load_environment("local")\n\nmy_task_1 = tasks.TutorialTaskSpec(name="My Task 1", showPhoneField=True)\nmy_task_2 = tasks.TutorialTaskSpec(name="My Task 2", showPhoneField=False)\n\nhit = HIT("Joint counter")\nj1 = hit.add_journey(nodes=[my_task_1, my_task_2])\n\nprojects = [Project("My Project", email="example@example.com", hits=[hit])]\napp = CovfeeApp(projects)   # we must always create an app object of class CovfeeApp\n')),(0,s.kt)("p",null,"Here we import the necessary classes, create two task objects using the same (auto-generated) ",(0,s.kt)("inlineCode",{parentName:"p"},"TutorialTaskSpec")," class, and link them together in a journey. We create a HIT with a single journey, and a project with a single HIT. Finally, we create the ",(0,s.kt)("inlineCode",{parentName:"p"},"app")," object. Covfee internally looks for this object by name (important that it is called ",(0,s.kt)("inlineCode",{parentName:"p"},"app"),") and uses it as starting point to read the specification."),(0,s.kt)("p",null,"We can now start covfee with:"),(0,s.kt)("pre",null,(0,s.kt)("code",{parentName:"pre"},"covfee make tutorial.py --force --dev\n")),(0,s.kt)("p",null,"This will parse the specification, create the database, and start the covfee server."),(0,s.kt)("p",null,"In development mode, we need to run the webpack server separately. To do it, in another terminal run:"),(0,s.kt)("pre",null,(0,s.kt)("code",{parentName:"pre"},"covfee webpack\n")),(0,s.kt)("p",null,"After this the Covfee admin panel should be accessible in the URL displayed when running the Covfee server (http://localhost:5000/admin# by default). The links to the Journey (with the two tasks) should be available in the admin panel (under ",(0,s.kt)("em",{parentName:"p"},"Journeys"),")."),(0,s.kt)("p",null,"With this development setup, any changes to the client or server will be hot-reloaded. Therefore it should be possible and convenient to edit the task's React component or the backend while running the app."))}d.isMDXComponent=!0}}]);