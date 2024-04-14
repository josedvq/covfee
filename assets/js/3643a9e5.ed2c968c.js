"use strict";(self.webpackChunkdocs=self.webpackChunkdocs||[]).push([[223],{8555:(e,o,n)=>{n.r(o),n.d(o,{assets:()=>d,contentTitle:()=>a,default:()=>h,frontMatter:()=>s,metadata:()=>r,toc:()=>c});var t=n(4848),i=n(8453);const s={title:"Reading the output"},a=void 0,r={id:"output",title:"Reading the output",description:"Downloading covfee annotations",source:"@site/docs/output.mdx",sourceDirName:".",slug:"/output",permalink:"/covfee/docs/output",draft:!1,unlisted:!1,editUrl:"https://github.com/facebook/docusaurus/edit/master/website/docs/output.mdx",tags:[],version:"current",frontMatter:{title:"Reading the output"}},d={},c=[{value:"Downloading covfee annotations",id:"downloading-covfee-annotations",level:2},{value:"About continuous annotations",id:"about-continuous-annotations",level:2},{value:"Annotation resolution",id:"annotation-resolution",level:3},{value:"Skipped data points",id:"skipped-data-points",level:3}];function l(e){const o={a:"a",admonition:"admonition",code:"code",h2:"h2",h3:"h3",li:"li",ol:"ol",p:"p",strong:"strong",ul:"ul",...(0,i.R)(),...e.components};return(0,t.jsxs)(t.Fragment,{children:[(0,t.jsx)(o.h2,{id:"downloading-covfee-annotations",children:"Downloading covfee annotations"}),"\n",(0,t.jsx)(o.p,{children:'Covfee annotations can be downloaded from the admin panel, either for the complete project ("Download results") or for a specific HIT using the buttons on the HIT\'s row.'}),"\n",(0,t.jsx)(o.h2,{id:"about-continuous-annotations",children:"About continuous annotations"}),"\n",(0,t.jsx)(o.h3,{id:"annotation-resolution",children:"Annotation resolution"}),"\n",(0,t.jsx)(o.p,{children:"Covfee records continuous annotations in a fixed-size array with a configurable resolution via an $fps$ variable (frames or annotations per second). Every index of this array is associated to a particular media time (eg. video time) via:"}),"\n",(0,t.jsx)(o.p,{children:"$$\ni = round(mediaTime * fps)\n$$"}),"\n",(0,t.jsx)(o.p,{children:"The process to record one data point in covfee is the following:"}),"\n",(0,t.jsxs)(o.ol,{children:["\n",(0,t.jsx)(o.li,{children:"Covfee reads the current $mediaTime$ (eg. video time) of the media being annotated."}),"\n",(0,t.jsx)(o.li,{children:"Covfee reads the annotated value. This may be the position of the cursor or whether a key is being pressed."}),"\n",(0,t.jsx)(o.li,{children:"Covfee calculates the index $i$ of the array corresponding to this $mediaTime$ (see above) and stores the data point in this position."}),"\n"]}),"\n",(0,t.jsx)(o.p,{children:"The $fps$ variable can be set separately for each continuous task."}),"\n",(0,t.jsxs)(o.ul,{children:["\n",(0,t.jsx)(o.li,{children:"For video tasks, we recommend to set $fps$ equal to the frame rate of the video, as covfee will attempt to record one annotation for every frame of the video (see next section). This also means that no rounding will be done by covfee as every $mediaTime$ will correspond exactly to a frame number."}),"\n"]}),"\n",(0,t.jsx)(o.admonition,{type:"tip",children:(0,t.jsx)(o.p,{children:"If $fps$ is not set for a video task, covfee will default to 60fps. This is because covfee cannot read the frame rate of the video on the fly. Make sure to set the $fps$ property of the task for optimal results."})}),"\n",(0,t.jsxs)(o.ul,{children:["\n",(0,t.jsxs)(o.li,{children:["\n",(0,t.jsx)(o.p,{children:"For other continuous tasks (eg. audio), fps can be set to any desired value. In practice, however, most browsers will not trigger events faster than 60fps. If $fps$ is not set, covfee defaults to 60fps."}),"\n"]}),"\n",(0,t.jsxs)(o.li,{children:["\n",(0,t.jsx)(o.p,{children:"In adition to the annotated value, covfee stores the value of $mediaTime$ for every data point. This may be used to test or eliminate the effect of rounding post-hoc."}),"\n"]}),"\n"]}),"\n",(0,t.jsx)(o.h3,{id:"skipped-data-points",children:"Skipped data points"}),"\n",(0,t.jsxs)(o.ul,{children:["\n",(0,t.jsxs)(o.li,{children:["For continuous annotation of videos in the browser, covfee tries to record a new data point on every frame of the video (via ",(0,t.jsx)(o.a,{href:"https://wicg.github.io/video-rvfc/",children:"requestVideoFrameCallback()"}),"). Therefore, in principle, continuous video annotations in covfee may have the same resolution as the input video. In practice, however, browsers may skip frames when playing a video, depending on the user machine's speed and load."]}),"\n"]}),"\n",(0,t.jsx)(o.admonition,{type:"info",children:(0,t.jsx)(o.p,{children:"In our experience it is rare to see more than one or two frames skipped in a row with 60fps video in most modern machines."})}),"\n",(0,t.jsxs)(o.ul,{children:["\n",(0,t.jsxs)(o.li,{children:["For other types of media covfee tries to record a data point on every screen refresh (via ",(0,t.jsx)(o.a,{href:"https://developer.mozilla.org/en-US/docs/Web/API/window/requestAnimationFrame",children:"requestAnimationFrame()"}),"), which is every 60Hz on most machines. In practice however, the browser may also skip calls depending on the computer's load."]}),"\n"]}),"\n",(0,t.jsxs)(o.p,{children:["Therefore, ",(0,t.jsx)(o.strong,{children:"it is possible that covfee skips continuous data points"})," regardless of the value of $fps$. It is possible however to know when a data point has been skipped as this will correspond to a row of zeroes in covfee's output:"]}),"\n",(0,t.jsx)(o.p,{children:"It is your choice whether to ignore or interpolate missing data points."}),"\n",(0,t.jsx)(o.admonition,{type:"info",children:(0,t.jsxs)(o.p,{children:["The way in which videos are processed in the browser may be hard to understand if you are used processing video in Python, C++ or other traditional environments. In the browser, there is no guarantee that a video can be played frame by frame, although it is possible to change a video's ",(0,t.jsx)(o.code,{children:"playbackRate"})," to speed it up or slow it down. The browser takes care of playing the video as close as possible to the desired ",(0,t.jsx)(o.code,{children:"playbackRate"})," but depending on the speed and load of the user's machine, the browser may skip frames of the video to meet the ",(0,t.jsx)(o.code,{children:"playbackRate"}),"."]})})]})}function h(e={}){const{wrapper:o}={...(0,i.R)(),...e.components};return o?(0,t.jsx)(o,{...e,children:(0,t.jsx)(l,{...e})}):l(e)}},8453:(e,o,n)=>{n.d(o,{R:()=>a,x:()=>r});var t=n(6540);const i={},s=t.createContext(i);function a(e){const o=t.useContext(s);return t.useMemo((function(){return"function"==typeof e?e(o):{...o,...e}}),[o,e])}function r(e){let o;return o=e.disableParentContext?"function"==typeof e.components?e.components(i):e.components||i:a(e.components),t.createElement(s.Provider,{value:o},e.children)}}}]);