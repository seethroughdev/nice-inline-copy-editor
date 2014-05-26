## New Inline Copy Editor: Nice.

This is a javascript bookmarklet tool to edit the copy of websites inline.

Its mostly for prototyping and design.  And of course is only temporary.  (Just refresh to undo).

**To install, just drag this link up to your bookmarks bar:**


[NICE: Editor](javascript:var head = document.getElementsByTagName('head')[0];var script = document.createElement('script');script.src = 'https://seethroughtrees.github.io/inline-copy-editor/bundle.js';
script.async = true;head.appendChild(script))


### Usage

Once you are on the site you want to edit, just click the bookmark button in your browser.

A box should pop up in the top right of your screen.

You are now free to start editing any of the copy on your page.

*Keep in mind, this does manipulate the DOM, so inspecting source will not match a one-to-one with your original source.*

For more options, click the down arrow to expand **NICE**.


1.  The Arrow will collapse and expand the NICE: Editor.
2.  The Toggle button will toggle between your current edits and the original.
3.  The Diff button will pop up a diff of the changes you've made.  Perfect to copy and paste into an email or note taking application.
4.  The Power button will disable NICE, and return the DOM to the original structure while maintaining your changes.

**Note:  Lots of sites have a lot of javascript changing the current dom structure.  This
utility does the best it can to work around those, and show you the actual diff, however,
some sites will not work properly.  This goes the same for the toggle button.  Its best to
give it a shot and hope they work for you.

Regardless, the editable feature should always work.**

