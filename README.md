## About

Browser extension that saves tabs in group temporarily.

Have you ever opened too much tabs in your browser? When we are working, we will usually open many tabs that're about a single subject. Unfortunately, sometimes we can't finish the work at once and need to keep those tabs open. As the tabs accumulate, it becomes a mess. And this extention aims to solve this problem.

The new Edge browser has already have a built-in functionality called Collections, which I think is very practical. So this extension is pretty much referencing the Edge Collections.

## Contribute

Feel free to pull the repository

After pulling the repository run following command

```
npm i
```

To build the code, run

```
gulp build
```

Then you should get a build folder. Open your chrome browser and enter [chrome://extensions](chrome://extensions) and turn on **Developer mode**. Then click the **Load unpacked** button to load our build folder.

The developing experience isn't very good now. Build is needed for each tiny code modification. And the plugin also needs to be reloaded on the browser, also the page. If you have any idea to improve the work flow, you're very welcome to share your idea with me.

### Logo

As you can see, this plugin hasn't have a logo yet. If you're good at design and want to contribute to this project. You're very welcome to share your work. You can contact me on email.

## Issue

This plugin is using React and Material-UI components. Due to some technique unknown behaviors of MUI, if you're browsing a website which is also using MUI components, the website's CSS style is very likely to get broken by this plugin. The extent of the crash varies. Some site already known with severe problem(material-ui.com). If you get this problem, you can turn off the plugin temporarily.

I will get this issue fixed if this plugin get popular in the future and people are complaining about this pretty often.
