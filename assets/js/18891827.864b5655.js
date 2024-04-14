"use strict";(self.webpackChunkdocs=self.webpackChunkdocs||[]).push([[235],{3473:(e,o,n)=>{n.r(o),n.d(o,{assets:()=>l,contentTitle:()=>r,default:()=>u,frontMatter:()=>a,metadata:()=>c,toc:()=>d});var t=n(4848),s=n(8453),i=n(6025);const a={title:"Overview",slug:"/"},r=void 0,c={id:"overview",title:"Overview",description:"What is covfee?",source:"@site/docs/overview.mdx",sourceDirName:".",slug:"/",permalink:"/covfee/docs/",draft:!1,unlisted:!1,editUrl:"https://github.com/facebook/docusaurus/edit/master/website/docs/overview.mdx",tags:[],version:"current",frontMatter:{title:"Overview",slug:"/"},sidebar:"docs",next:{title:"Installation",permalink:"/covfee/docs/installation"}},l={},d=[{value:"What is covfee?",id:"what-is-covfee",level:2},{value:"What covfee is not:",id:"what-covfee-is-not",level:4},{value:"The covfee workflow",id:"the-covfee-workflow",level:2},{value:"Continuous annotation",id:"continuous-annotation",level:2},{value:"Extending covfee",id:"extending-covfee",level:2},{value:"Contribute to covfee",id:"contribute-to-covfee",level:2}];function h(e){const o={a:"a",admonition:"admonition",code:"code",em:"em",h2:"h2",h4:"h4",li:"li",ol:"ol",p:"p",strong:"strong",ul:"ul",...(0,s.R)(),...e.components};return(0,t.jsxs)(t.Fragment,{children:[(0,t.jsx)(o.h2,{id:"what-is-covfee",children:"What is covfee?"}),"\n",(0,t.jsxs)(o.p,{children:["Covfee is an extensible web framework for (continuous) annotation, built for ",(0,t.jsx)(o.strong,{children:"crowd-sourcing"})," and other online uses. Covfee has ",(0,t.jsx)(o.strong,{children:"two main use cases"}),":"]}),"\n",(0,t.jsxs)(o.ul,{children:["\n",(0,t.jsxs)(o.li,{children:["\n",(0,t.jsxs)(o.p,{children:[(0,t.jsx)(o.strong,{children:"A tool for online (continuous) annotation"}),": Continuous annotation is when video files are annotated ",(0,t.jsx)(o.em,{children:"while you watch them"}),". Audio files can also be annotated while you listen to them, and time series in general may be continuously annotated. Some audiovisual continuous annotation tasks making use of mouse and keyboard for user feedback (see ",(0,t.jsx)(o.em,{children:"Playground"}),") are already coded, working, and tested in covfee. Preparing a continuous annotation process using these tasks amounts to preparing a JSON file specifying your HITs. Covfee also includes some non-continuous tasks for questionnaires and surveys that are provided for convenience. Using existing covfee tasks requires no coding."]}),"\n"]}),"\n",(0,t.jsxs)(o.li,{children:["\n",(0,t.jsxs)(o.p,{children:[(0,t.jsx)(o.strong,{children:"A platform for custom online human interaction data collection and annotation"}),": Covfee provides a framework for researchers with basic knowledge of web development in Javascript to prepare online (crowd-sourced) annotation processes and data collections. Implementing custom covfee tasks (continuous or not) has been boiled down to the writing of a single class (React component) which can make use of multiple helper classes for continuous data recording, input management and multiparty communication for tasks with multiple subjects. Client-server communication and access to the recorded data is abstracted away completely."]}),"\n"]}),"\n"]}),"\n",(0,t.jsx)(o.h4,{id:"what-covfee-is-not",children:"What covfee is not:"}),"\n",(0,t.jsxs)(o.ul,{children:["\n",(0,t.jsxs)(o.li,{children:[(0,t.jsx)(o.strong,{children:"A complete media annotation platform"}),'. Covfee specializes on continuous media and does not offer many "basic" features of image annotation like bounding box or polygon annotation which are hard to do continuously.']}),"\n",(0,t.jsxs)(o.li,{children:[(0,t.jsx)(o.strong,{children:"Enterprise-level software"}),". Covfee is meant to facilitate research and experimentation. It is not thoroughly tested and contains bugs."]}),"\n",(0,t.jsxs)(o.li,{children:[(0,t.jsx)(o.strong,{children:"Cross-browser compatible"}),". For the time being, covfee is meant to be used in desktop or laptop computers, not on mobile phones or tablets. Also, continuous video annotation specifically currently works only in Google Chrome due to its reliance on ",(0,t.jsx)(o.a,{href:"https://wicg.github.io/video-rvfc/",children:"requestVideoFrameCallback()"}),". This will probably improve with more browser support. That being said, with this exception covfee should work correctly on all modern desktop browsers."]}),"\n"]}),"\n",(0,t.jsx)(o.admonition,{type:"caution",children:(0,t.jsx)(o.p,{children:"Covfee is still in alpha stage and is not mature software."})}),"\n",(0,t.jsx)(o.h2,{id:"the-covfee-workflow",children:"The covfee workflow"}),"\n",(0,t.jsx)("img",{alt:"Docusaurus with Keytar",src:(0,i.A)("/img/covfee_main.png")}),"\n",(0,t.jsx)(o.p,{children:"Once covfee is installed, working with covfee as a requestor generally means following the three steps shown in the picture:"}),"\n",(0,t.jsxs)(o.ol,{children:["\n",(0,t.jsxs)(o.li,{children:["\n",(0,t.jsxs)(o.p,{children:["The requestor creates a project specification in a ",(0,t.jsx)(o.em,{children:".covfee.json"})," file, which completely specifies the annotation interface. This documentation, paticularly the ",(0,t.jsx)(o.em,{children:"Playground"})," is meant to help write the specification."]}),"\n"]}),"\n",(0,t.jsxs)(o.li,{children:["\n",(0,t.jsxs)(o.p,{children:["The requestor runs ",(0,t.jsx)(o.code,{children:"covfee make"}),", the script in charge of validating the specification and generating the covfee interface from it. The requestor can now enter the covfee admin panel and obtain anonymized links to each HIT in the specification. A CSV file with all the links can be downloaded to be uploaded to Amazon MTurk or otherwise shared with the annotators or study participants."]}),"\n"]}),"\n",(0,t.jsxs)(o.li,{children:["\n",(0,t.jsx)(o.p,{children:"The requestor may keep track of the annotation process using the admin panel. At any time it is possible to download the raw data in JSON and CSV files, which can then be processed locally."}),"\n"]}),"\n"]}),"\n",(0,t.jsxs)(o.p,{children:["For a step-by-step guide on how to work with covfee see ",(0,t.jsx)(o.a,{href:"docs/getting_started",children:"Getting Started"})]}),"\n",(0,t.jsx)(o.p,{children:"Some of the main features of covfee are:"}),"\n",(0,t.jsxs)(o.ul,{children:["\n",(0,t.jsxs)(o.li,{children:[(0,t.jsxs)(o.strong,{children:["Projects are fully specified in the ",(0,t.jsx)(o.em,{children:".covfee.json"})," file"]}),". This makes it easy to reproduce annotation processes on other datasets if a covfee specification is available."]}),"\n",(0,t.jsxs)(o.li,{children:[(0,t.jsx)(o.strong,{children:"Secure link hashes"})," Covfee automatically generates random hash links for each HIT. These hashes generated from a secret key are meant to offer protection against bots or scalping of the HIT links. Note that this form of protection is ",(0,t.jsx)(o.a,{href:"https://security.stackexchange.com/questions/67615/how-safe-is-to-secure-sensitive-content-by-url-with-md5-hash-and-no-other-author",children:"weaker under HTTP"}),"."]}),"\n"]}),"\n",(0,t.jsxs)(o.ul,{children:["\n",(0,t.jsxs)(o.li,{children:[(0,t.jsx)(o.strong,{children:"Forms support"})," ",(0,t.jsx)(o.em,{children:"Questionnaire"})," tasks can be used to request non-continuous feedback from participants via text boxes, buttons, sliders, and more ."]}),"\n",(0,t.jsxs)(o.li,{children:[(0,t.jsx)(o.strong,{children:"Support for automatic qualification tasks"}),". For continuous tasks, a HIT may be opened only if the annotator demonstrates certain level of ability in a qualification."]}),"\n",(0,t.jsxs)(o.li,{children:[(0,t.jsx)(o.strong,{children:"Admin panel"})," The admin panel helps keep track of progress and download results."]}),"\n"]}),"\n",(0,t.jsx)(o.h2,{id:"continuous-annotation",children:"Continuous annotation"}),"\n",(0,t.jsxs)(o.p,{children:["Covfee supports continuous annotation tasks in modern desktop browsers. Browsers implement animation and video frame callbacks (via ",(0,t.jsx)(o.a,{href:"https://developer.mozilla.org/en-US/docs/Web/API/window/requestAnimationFrame",children:"requestAnimationFrame()"})," and ",(0,t.jsx)(o.a,{href:"https://wicg.github.io/video-rvfc/",children:"requestVideoFrameCallback()"})," which are designed to run on each screen refresh. On most modern displays and browsers this is a rate of 60fps. This is not guaranteed and may be lower depending on the capacity and load of the user's machine but in practice we have observed consistent annotation rates of close to 60fps on most user machines."]}),"\n",(0,t.jsx)(o.h2,{id:"extending-covfee",children:"Extending covfee"}),"\n",(0,t.jsxs)(o.p,{children:["Particular emphasis has ben put on allowing covfee to be easily extensible. Implementing new covfee tasks like the ones in the ",(0,t.jsx)(o.code,{children:"Playground"})," is possible with only a basic knowledge of web development. Specifically, development of custom tasks requires at least a basic understanding of Javascript and ",(0,t.jsx)(o.a,{href:"https://reactjs.org/",children:"React"}),". Some useful resources to quickly get started:"]}),"\n",(0,t.jsxs)(o.ul,{children:["\n",(0,t.jsx)(o.li,{children:(0,t.jsx)(o.a,{href:"https://reactjs.org/tutorial/tutorial.html",children:"Official React tutorial"})}),"\n"]}),"\n",(0,t.jsx)(o.p,{children:"The main advantages of implementing a custom task as part of covfee are:"}),"\n",(0,t.jsxs)(o.ul,{children:["\n",(0,t.jsxs)(o.li,{children:[(0,t.jsx)(o.strong,{children:"Covfee takes care of the data recording"}),". For continuous tasks, the available ",(0,t.jsx)(o.code,{children:"buffer"})," class takes care of sending chunks of continuous data and logs to the server, and of reading them back for data visualization. All you need to do is call ",(0,t.jsx)(o.code,{children:"buffer.data()"})," for every collected data point and ",(0,t.jsx)(o.code,{children:"buffer.log()"})," to log any events of interest to you. For non-continuous tasks it's even more simple: calling the ",(0,t.jsx)(o.code,{children:"onSubmit()"})," method with the result of your custom task will send the results to the server."]}),"\n",(0,t.jsxs)(o.li,{children:[(0,t.jsx)(o.strong,{children:"Covfee's socket.io module"})," allows you to efficiently implement multiparty tasks, where multiple subjects are expected to take part in the task. The main use case for multiparty features is the recording of live online interactions (written, audio or audiovisual) with the ability to query subjects at any point or request their live feedback."]}),"\n",(0,t.jsxs)(o.li,{children:[(0,t.jsx)(o.strong,{children:"Covfee's key manager"})," makes it easy to attach event handlers to keyboard and gamepad key presses. This is specially important for continuous annotation."]}),"\n",(0,t.jsxs)(o.li,{children:[(0,t.jsx)(o.strong,{children:"Access to covfee's admin panel"})," will allow you to keep track of progress and download results easily."]}),"\n",(0,t.jsxs)(o.li,{children:[(0,t.jsx)(o.strong,{children:"Share your work"})," Covfee tasks are modular and configurable and could be incorporated as part of covfee to be reused by others. Feel free to create a pull request or ",(0,t.jsx)(o.a,{href:"mailto:josedvq@gmail.com",children:"contact me"})," if you have created a reusable covfee tasks."]}),"\n"]}),"\n",(0,t.jsxs)(o.p,{children:["See ",(0,t.jsx)(o.a,{href:"docs/custom_task",children:"Custom Tasks"})," for a step-by-step guide on how to write your custom tasks in covfee."]}),"\n",(0,t.jsx)(o.h2,{id:"contribute-to-covfee",children:"Contribute to covfee"}),"\n",(0,t.jsxs)(o.p,{children:["Since there is an unlimited number of tasks we can teach algorithms to perform, annotation and data collection tasks often require specific implementations. ",(0,t.jsx)(o.strong,{children:"Covfee has the long-term goal of dramatically improving the time and effort necessary to collect and annotate interaction data online"}),". It was born out of the need for an annotation platform that better satisfies the characteristics of in-the-wild interaction data, where the behavior of single subjects is annotated for long periods of time, but always with the goal of supporting a broad array of experiments. To achieve its goal, ",(0,t.jsx)(o.strong,{children:"covfee seeks to become a sufficient library of annotation task templates (covfee tasks)"}),", which researchers will be able to use as-is or to modify to satisfy their particular needs. You can contribute to our goal by contributing covfee tasks or ",(0,t.jsx)(o.a,{href:"mailto:josedvq@gmail.com",children:"contact me"})," if you are interested in other forms of collaboration."]})]})}function u(e={}){const{wrapper:o}={...(0,s.R)(),...e.components};return o?(0,t.jsx)(o,{...e,children:(0,t.jsx)(h,{...e})}):h(e)}},8453:(e,o,n)=>{n.d(o,{R:()=>a,x:()=>r});var t=n(6540);const s={},i=t.createContext(s);function a(e){const o=t.useContext(i);return t.useMemo((function(){return"function"==typeof e?e(o):{...o,...e}}),[o,e])}function r(e){let o;return o=e.disableParentContext?"function"==typeof e.components?e.components(s):e.components||s:a(e.components),t.createElement(i.Provider,{value:o},e.children)}}}]);