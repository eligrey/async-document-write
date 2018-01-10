Asynchronous `document.write`
===========================

Asynchronous `document.write` (ADW) is a JavaScript library that enables the usage
of `document.write` in asynchronous scripts. After loading ADW, `document.write` may
be called by any script even after the page has completed loading. ADW is backwards
compatible with normal `document.write` and it also implements an asynchronous
`document.writeln` method.

ADW can be utilized by providers of HTML "emebedding" scripts to enable the scripts to
be included asynchronously (a la `<script async>`) when ADW is loaded. All you have to
do is add `eval(document.write.START);` to the start of the code and
`eval(document.write.END);` to the end. **If the target page does not have ADW loaded,
your code will behave as it would normally.** The evals simply do nothing and produce
no errors if ADW is not loaded.


Usage
-----

    eval(document.write.START);
    document.write(...);
    eval(document.write.END);

![Tracking image](https://in.getclicky.com/212712ns.gif)
