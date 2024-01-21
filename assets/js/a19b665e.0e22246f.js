"use strict";(self.webpackChunkdocs=self.webpackChunkdocs||[]).push([[505],{3905:(e,t,n)=>{n.d(t,{Zo:()=>p,kt:()=>u});var a=n(7294);function o(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}function r(e,t){var n=Object.keys(e);if(Object.getOwnPropertySymbols){var a=Object.getOwnPropertySymbols(e);t&&(a=a.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),n.push.apply(n,a)}return n}function i(e){for(var t=1;t<arguments.length;t++){var n=null!=arguments[t]?arguments[t]:{};t%2?r(Object(n),!0).forEach((function(t){o(e,t,n[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(n)):r(Object(n)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(n,t))}))}return e}function l(e,t){if(null==e)return{};var n,a,o=function(e,t){if(null==e)return{};var n,a,o={},r=Object.keys(e);for(a=0;a<r.length;a++)n=r[a],t.indexOf(n)>=0||(o[n]=e[n]);return o}(e,t);if(Object.getOwnPropertySymbols){var r=Object.getOwnPropertySymbols(e);for(a=0;a<r.length;a++)n=r[a],t.indexOf(n)>=0||Object.prototype.propertyIsEnumerable.call(e,n)&&(o[n]=e[n])}return o}var s=a.createContext({}),c=function(e){var t=a.useContext(s),n=t;return e&&(n="function"==typeof e?e(t):i(i({},t),e)),n},p=function(e){var t=c(e.components);return a.createElement(s.Provider,{value:t},e.children)},d="mdxType",m={inlineCode:"code",wrapper:function(e){var t=e.children;return a.createElement(a.Fragment,{},t)}},v=a.forwardRef((function(e,t){var n=e.components,o=e.mdxType,r=e.originalType,s=e.parentName,p=l(e,["components","mdxType","originalType","parentName"]),d=c(n),v=o,u=d["".concat(s,".").concat(v)]||d[v]||m[v]||r;return n?a.createElement(u,i(i({ref:t},p),{},{components:n})):a.createElement(u,i({ref:t},p))}));function u(e,t){var n=arguments,o=t&&t.mdxType;if("string"==typeof e||o){var r=n.length,i=new Array(r);i[0]=v;var l={};for(var s in t)hasOwnProperty.call(t,s)&&(l[s]=t[s]);l.originalType=e,l[d]="string"==typeof e?e:o,i[1]=l;for(var c=2;c<r;c++)i[c]=n[c];return a.createElement.apply(null,i)}return a.createElement.apply(null,n)}v.displayName="MDXCreateElement"},3265:(e,t,n)=>{n.r(t),n.d(t,{contentTitle:()=>i,default:()=>p,frontMatter:()=>r,metadata:()=>l,toc:()=>s});var a=n(7462),o=(n(7294),n(3905));const r={title:"Development install"},i=void 0,l={unversionedId:"development",id:"development",title:"Development install",description:"This guide explains how to install covfee for development. This type of install is recommended for modifying covfee's Javascript code, including the implementation of custom tasks, covfee documentation, or the Pyton backend. A good understanding of Javascript and/or Python is recommended.",source:"@site/docs/development.mdx",sourceDirName:".",slug:"/development",permalink:"/covfee/docs/development",editUrl:"https://github.com/facebook/docusaurus/edit/master/website/docs/development.mdx",tags:[],version:"current",frontMatter:{title:"Development install"},sidebar:"docs",previous:{title:"Deploying to a server",permalink:"/covfee/docs/deployment"},next:{title:"Developing custom tasks",permalink:"/covfee/docs/custom_task"}},s=[{value:"Setup",id:"setup",children:[],level:2},{value:"Running a covfee project in dev mode",id:"running-a-covfee-project-in-dev-mode",children:[],level:2},{value:"Schemata updates",id:"schemata-updates",children:[],level:2}],c={toc:s};function p(e){let{components:t,...n}=e;return(0,o.kt)("wrapper",(0,a.Z)({},c,n,{components:t,mdxType:"MDXLayout"}),(0,o.kt)("p",null,"This guide explains how to install covfee for development. This type of install is recommended for modifying covfee's Javascript code, including the implementation of custom tasks, covfee documentation, or the Pyton backend. A good understanding of Javascript and/or Python is recommended."),(0,o.kt)("h2",{id:"setup"},"Setup"),(0,o.kt)("div",{className:"admonition admonition-caution alert alert--warning"},(0,o.kt)("div",{parentName:"div",className:"admonition-heading"},(0,o.kt)("h5",{parentName:"div"},(0,o.kt)("span",{parentName:"h5",className:"admonition-icon"},(0,o.kt)("svg",{parentName:"span",xmlns:"http://www.w3.org/2000/svg",width:"16",height:"16",viewBox:"0 0 16 16"},(0,o.kt)("path",{parentName:"svg",fillRule:"evenodd",d:"M8.893 1.5c-.183-.31-.52-.5-.887-.5s-.703.19-.886.5L.138 13.499a.98.98 0 0 0 0 1.001c.193.31.53.501.886.501h13.964c.367 0 .704-.19.877-.5a1.03 1.03 0 0 0 .01-1.002L8.893 1.5zm.133 11.497H6.987v-2.003h2.039v2.003zm0-3.004H6.987V5.987h2.039v4.006z"}))),"caution")),(0,o.kt)("div",{parentName:"div",className:"admonition-content"},(0,o.kt)("p",{parentName:"div"},"Covfee runs on ",(0,o.kt)("strong",{parentName:"p"},"Linux, Mac OS X and Windows"),", but you are more likely to encounter bugs on Windows. We recommend that you use ",(0,o.kt)("a",{parentName:"p",href:"https://docs.microsoft.com/en-us/windows/wsl/install"},"WSL")," on Windows."))),(0,o.kt)("p",null,"Covfee's frontend is built using ",(0,o.kt)("a",{parentName:"p",href:"https://webpack.js.org/"},"webpack"),", which has a convenient ",(0,o.kt)("a",{parentName:"p",href:"https://webpack.js.org/guides/development/"},"hot-reloading development server"),". The ",(0,o.kt)("a",{parentName:"p",href:"https://flask.palletsprojects.com/en/2.0.x/"},"Flask server")," used for the backend also supports reloading on changes. This guide will get you to run backend and frontend development servers:"),(0,o.kt)("ol",null,(0,o.kt)("li",{parentName:"ol"},"Install the latest version of ",(0,o.kt)("a",{parentName:"li",href:"https://nodejs.org/en/download/"},"node.js"),". Make sure that the ",(0,o.kt)("inlineCode",{parentName:"li"},"npm")," command is available in your terminal.")),(0,o.kt)("div",{className:"admonition admonition-tip alert alert--success"},(0,o.kt)("div",{parentName:"div",className:"admonition-heading"},(0,o.kt)("h5",{parentName:"div"},(0,o.kt)("span",{parentName:"h5",className:"admonition-icon"},(0,o.kt)("svg",{parentName:"span",xmlns:"http://www.w3.org/2000/svg",width:"12",height:"16",viewBox:"0 0 12 16"},(0,o.kt)("path",{parentName:"svg",fillRule:"evenodd",d:"M6.5 0C3.48 0 1 2.19 1 5c0 .92.55 2.25 1 3 1.34 2.25 1.78 2.78 2 4v1h5v-1c.22-1.22.66-1.75 2-4 .45-.75 1-2.08 1-3 0-2.81-2.48-5-5.5-5zm3.64 7.48c-.25.44-.47.8-.67 1.11-.86 1.41-1.25 2.06-1.45 3.23-.02.05-.02.11-.02.17H5c0-.06 0-.13-.02-.17-.2-1.17-.59-1.83-1.45-3.23-.2-.31-.42-.67-.67-1.11C2.44 6.78 2 5.65 2 5c0-2.2 2.02-4 4.5-4 1.22 0 2.36.42 3.22 1.19C10.55 2.94 11 3.94 11 5c0 .66-.44 1.78-.86 2.48zM4 14h5c-.23 1.14-1.3 2-2.5 2s-2.27-.86-2.5-2z"}))),"tip")),(0,o.kt)("div",{parentName:"div",className:"admonition-content"},(0,o.kt)("p",{parentName:"div"},(0,o.kt)("strong",{parentName:"p"},"We strongly recommend that you install covfee in a Python virtual environment"),". To create and activate one using ",(0,o.kt)("em",{parentName:"p"},"venv"),":"),(0,o.kt)("pre",{parentName:"div"},(0,o.kt)("code",{parentName:"pre"},"python3 -m venv ./env\nsource ./env/bin/activate\n")))),(0,o.kt)("ol",{start:2},(0,o.kt)("li",{parentName:"ol"},"Install the covfee Python package in editable mode:")),(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre"},"git clone git@github.com:josedvq/covfee.git\ncd covfee\npython3 -m pip install -e .\n")),(0,o.kt)("p",null,"The ",(0,o.kt)("inlineCode",{parentName:"p"},"covfee")," command should now be available in the terminal. Type ",(0,o.kt)("inlineCode",{parentName:"p"},"covfee --help")," to make sure."),(0,o.kt)("ol",{start:3},(0,o.kt)("li",{parentName:"ol"},"Install Javascript dependencies:")),(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre"},"yarn install\n")),(0,o.kt)("ol",{start:4},(0,o.kt)("li",{parentName:"ol"},"Generate schemata (for validation) and build webpack bundles:")),(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre"},"covfee-dev schemata\ncovfee-dev build\n")),(0,o.kt)("p",null,"The development install is ready."),(0,o.kt)("h2",{id:"running-a-covfee-project-in-dev-mode"},"Running a covfee project in dev mode"),(0,o.kt)("p",null,"Covfee requires a project folder with at least one ",(0,o.kt)("inlineCode",{parentName:"p"},".covfee.json")," file to run. Covfee provides sample projects, or see ",(0,o.kt)("a",{parentName:"p",href:"getting_started"},"Getting Started")," for instructions on how to create your own project folder and specification."),(0,o.kt)("p",null,"To run one of the covfee samples:"),(0,o.kt)("ol",null,(0,o.kt)("li",{parentName:"ol"},"Move to the sample project folder:")),(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre"},"cd samples/basic\ncovfee make . --no-launch\n")),(0,o.kt)("ol",{start:2},(0,o.kt)("li",{parentName:"ol"},"Start the webpack server from the same folder:")),(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre"},"covfee webpack\n")),(0,o.kt)("p",null,"This will start a ",(0,o.kt)("a",{parentName:"p",href:"https://webpack.js.org/guides/development/"},"Webpack development server")," with hot-reloading."),(0,o.kt)("ol",{start:3},(0,o.kt)("li",{parentName:"ol"},"In another terminal, at the same folder, start the flask server in dev mode. This will start the Python backend server with hot-reloading:")),(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre"},"covfee start --dev\n")),(0,o.kt)("p",null,"You should now be able to access the admin panel and open the covfee HITs. Any changes made to Python or Javascript code should be immediately hot-reloaded."),(0,o.kt)("h2",{id:"schemata-updates"},"Schemata updates"),(0,o.kt)("p",null,"The covfee schemata file created previously (",(0,o.kt)("inlineCode",{parentName:"p"},"covfee-dev schemata"),") is used by ",(0,o.kt)("inlineCode",{parentName:"p"},"covfee make")," for validating covfee specifications. Therefore, if you make changes to covfee's Typescript interfaces in ",(0,o.kt)("inlineCode",{parentName:"p"},"covfee/shared")," during development (by, for, example, adding a new task specification), the schemata file must be re-generated for covfee validate your new interfaces correctly. To regenerate covfee schemata run:"),(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre"},"covfee-dev schemata\n")),(0,o.kt)("p",null,"This command may also need to be called when switching branches if the Typescript specification differs between branches."))}p.isMDXComponent=!0}}]);