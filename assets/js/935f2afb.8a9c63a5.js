"use strict";(self.webpackChunkdocs=self.webpackChunkdocs||[]).push([[53],{1109:function(e){e.exports=JSON.parse('{"pluginId":"default","version":"current","label":"Next","banner":null,"badge":false,"className":"docs-version-current","isLast":true,"docsSidebars":{"docs":[{"type":"link","label":"Overview","href":"/covfee/docs/overview","docId":"overview"},{"type":"link","label":"Installation","href":"/covfee/docs/installation","docId":"installation"},{"type":"link","label":"Getting Started","href":"/covfee/docs/getting_started","docId":"getting_started"},{"type":"link","label":"Deploying to a server","href":"/covfee/docs/","docId":"deployment"},{"type":"category","label":"Playground","collapsed":false,"items":[{"type":"link","label":"Instructions","href":"/covfee/docs/tasks/instructions","docId":"tasks/instructions"},{"type":"link","label":"Questionnaires","href":"/covfee/docs/tasks/questionnaire","docId":"tasks/questionnaire"},{"type":"link","label":"Continuous 1D","href":"/covfee/docs/tasks/continuous_1d","docId":"tasks/continuous_1d"},{"type":"link","label":"Continuous Keypoint","href":"/covfee/docs/tasks/continuous_keypoint","docId":"tasks/continuous_keypoint"}],"collapsible":true},{"type":"category","label":"Advanced","collapsed":false,"items":[{"type":"link","label":"Development install","href":"/covfee/docs/development","docId":"development"},{"type":"link","label":"Developing custom tasks","href":"/covfee/docs/custom_task","docId":"custom_task"}],"collapsible":true}]},"docs":{"custom_task":{"id":"custom_task","title":"Developing custom tasks","description":"This guide explains how to install covfee for development. The most common reason to do so is to develop a custom task, but you may also wish to modify the Flask server.","sidebar":"docs"},"deployment":{"id":"deployment","title":"Deploying to a server","description":"Deploying covfee is necessary when you want to make your HITs available to others over the internet. We do not recommend developing your tasks in deployment mode. It is normally more convenient to create your HIT specifications locally, deploy covfee, and then run covfee make on the deployed instance to initialize your database.","sidebar":"docs"},"development":{"id":"development","title":"Development install","description":"This guide explains how to install covfee for development. This type of install is recommended for modifying covfee\'s Javascript code, including the implementation of custom tasks, covfee documentation, or the Pyton backend. A good understanding of Javascript and/or Python is recommended.","sidebar":"docs"},"getting_started":{"id":"getting_started","title":"Getting Started","description":"This guide takes you through the process of creating a simple covfee interface which gathers continuous data from subjects.","sidebar":"docs"},"installation":{"id":"installation","title":"Installation","description":"Covfee is a web application within a Python package, much like Jupyter notebooks.","sidebar":"docs"},"overview":{"id":"overview","title":"Overview","description":"What is covfee?","sidebar":"docs"},"roadmap":{"id":"roadmap","title":"About covfee and roadmap","description":""},"tasks/continuous_1d":{"id":"tasks/continuous_1d","title":"Continuous 1D","description":"This component was designed to capture the continuous annotation of a single one-dimensional variable, like arousal or valence in annotations of emotional expresion. The user controls the annotation interface via mouse or keyboard.","sidebar":"docs"},"tasks/continuous_keypoint":{"id":"tasks/continuous_keypoint","title":"Continuous Keypoint","description":"The continuous keypoint task was created for annotation of keypoints in a video. In the original application these keypoints corresponded to extremities of people in a social interaction. The task makes use of an optical flow video to play the video slower when the mouse cursor is close to moving parts, to aid annotators in the process. Skeletal keypoints were annotated one-by-one continuously, instead of traditional frame-based annotation in which some image frames are annotated to then be interpolated. In general, this task is especially useful when the target keypoint are visible for long periods of time.","sidebar":"docs"},"tasks/instructions":{"id":"tasks/instructions","title":"Instructions","description":"The instructions task was created as a way to provide a page with instructions for participants or annotators. This also includes consent forms and Thank you pages. An instructions tasks consists in a text document followed by an optional form, which can be used to request consent or ask for basic participant information.","sidebar":"docs"},"tasks/questionnaire":{"id":"tasks/questionnaire","title":"Questionnaires","description":"The questionnaire task was created to support basic the creation of static questionnaires. These can be used to collect subject information as in a typical survey. The task can include media, which supports the use case of thin-slice annotations of video or audio.","sidebar":"docs"}}}')}}]);