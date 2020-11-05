// to do:
// metainformation should include where the problem came from / is used
// number scales for test viability

// DOM elements
var qualName = document.getElementById("qualName"),
    clearTexButton = document.getElementById("clearTex"),
    pairSoloButton = document.getElementById("pairSolo"),
    idInput = document.getElementById("problemID"),
    idList = document.getElementById("idList"),
    solutionFull = document.getElementById("solutionFull"),
    solutionPartial = document.getElementById("solutionPartial"),
    solutionNone = document.getElementById("solutionNone"),
    questionGreat = document.getElementById("greatQuestion"),
    questionGood = document.getElementById("goodQuestion"),
    questionBad = document.getElementById("badQuestion"),
    instructorsPlace = document.getElementById("instructors"),
    newInstructorButton = document.getElementById("newInstructor"),
    topicsPlace = document.getElementById("topics"),
    newTopicButton = document.getElementById("newTopicButton"),
    newTopicIn = document.getElementById("newTopic"),
    texProblem = document.getElementById("texProblem"),
    texSolution = document.getElementById("texSolution"),
    texLiveOut = document.getElementById("texLiveOut"),
    saveButton = document.getElementById("save"),
    codeOut = document.getElementById("codeOut"),
    saveAllButton = document.getElementById("saveAll"),
    errorOutP = document.getElementById("errorOut");
// script global variables
let pairMode = true, qual = "", serializer = new XMLSerializer(), topics = {}, instructors = [], problems = {}, problemsTags = {};

// these define the active problem
let doc = xmlImporter.newDocument(), id = "changeMe";

// set event listeners
{
    // fireblock in case something has an error
    function setListener(element, type, func) {try {element.addEventListener(type, func)} catch (e) {}}
    
    setListener(qualName, "change", loadQual);
    
    setListener(clearTexButton, "click", clearTex);
    
    setListener(pairSoloButton, "click", function() {
        pairSoloButton.firstChild.nodeValue = "To " + (pairMode? "Pair": "Solo") + " mode";
        pairMode = !pairMode;
        if (pairMode) for (let hideMe of document.querySelectorAll("[pairOnly]")) hideMe.removeAttribute("hide");
        else for (let hideMe of document.querySelectorAll("[pairOnly]")) hideMe.setAttribute("hide", "");
        resetDoc();
    })
    
    idInput.addEventListener("change", handleIdChange);
    idInput.addEventListener("blur", function() {idInput.value = id});
    
    for (let e of [solutionFull, solutionPartial, solutionNone, questionGreat, questionGood, questionBad]) setListener(e, "change", resetDoc);
    
    newInstructorButton.addEventListener("click", newInstructor);
    
    setListener(newTopicIn, "change", function() {
        let line = newTopicIn.value;
        if (!nodeNameScreen(line)) {
            if (line == "") return;
            return inputMessage(newTopicIn, "invalid name");
        }
        if (newTopicButton.checked) {
            try {
                removeTopic(line);
            } catch (e) {return inputMessage(newTopicIn, e.message)}
        } else {
            try {
                newTopic(line);
                newTopicIn.value="";
            } catch (e) {return inputMessage(newTopicIn, e.message)}
        }
    });
    
    for (let e of [texProblem, texSolution]) setListener(e, "input", resetDoc);

    for (let textarea of document.getElementsByTagName("textarea")) {
        setListener(textarea, "input", fixTextHeight);
        setListener(textarea, "change", fixTextHeight);
    }
    
    // take the value of codeOut and offer it as a file, named id.xml, to download
    setListener(saveButton, "click", function() {
        let file = new File([codeOut.value], id+".xml", {type: "text/xml"});
        let url = URL.createObjectURL(file);
        let a = xmlImporter.element("a", document.body, ["href", url, "download", ""]);
        xmlImporter.text("download link", a);
        a.click();
        document.body.removeChild(a);
    });
    
    setListener(saveAllButton, "click", saveAll);
}

// for auto-resizing textareas
function fixTextHeight(event) {
    event = event.target;
    while (event.nodeName.toLowerCase() != "textarea") event = event.parentNode;
    event.style.height = "5px";
    event.style.height = (event.scrollHeight)+"px";
}

// load all problems from a qual repository
function importRemoteQuestions(nameOfQual, finished = function() {}) {
    let exchange = refreshMathJax;
    refreshMathJax = function() {}
    xmlImporter.openTextFile("../quals/"+nameOfQual+"/problemsList.txt", null, function(list) {
        let lines = list.split(" "), numLines = lines.length;
        for (let problem of lines) if (problem != "changeMe") {
            let p = problem;
            if (problem in problems) errorOut("duplicate in problems list: " + problem);
            problems[problem] = undefined;
            problemsTags[problem] = xmlImporter.element("option", idList, ["value", problem]);
            xmlImporter.openXMLFile("../quals/"+nameOfQual+"/problems/"+p+".xml", null, function(problemDoc) {
                doc = problems[p] = problemDoc;
                outputFromDoc();
                if (--numLines == 0) {
                    clearTex();
                    refreshMathJax = exchange;
                    finished();
                }
            }, function() {
                errorOut("cannot find " + p);
            });
        }
    }, function() {
        inputMessage(qualName, "that qual has not been successfully initiated", 3000);
        refreshMathJax = exchange;
        window.setTimeout(function() {qualName.removeAttribute("disabled")}, 3000);
    });
}

// load all locally stored problems and set up for local autosaving
function initializeLocal(onDuplicate = function(problem) {errorOut("duplicate in problems list: " + problem)}) {
    let exchange = refreshMathJax;
    refreshMathJax = function() {}
    let list = Store.fetch("local problems list");
    if (!list) list = "";
    let lines = list.split(" ");
    for (let problem of lines) if (problem != "" && problem != "changeMe") {
        if (problem in problems) onDuplicate(problem);
        doc = problems[problem] = xmlImporter.parseDoc(Store.fetch("local " + problem));
        if (!(problem in problemsTags))problemsTags[problem] = xmlImporter.element("option", idList, ["value", problem]);
        outputFromDoc();
    }
    clearTex();
    qualName.value = "working locally";
    refreshMathJax = exchange;
    let button = xmlImporter.element("button", null, ["type", "button"]);
    qualName.parentElement.insertBefore(button, qualName.nextSibling);
    button.innerHTML = "Erase Local Storage";
    button.addEventListener("click", clearLocalQual);
}

// 3 successful cases: import qual, initialize local, or do both
function loadQual() {
    if (!nodeNameScreen(qualName.value)) {
        if (qualName.value.substring(0, 6) == "local ") {
            // import qual then initialize local autosaving
            qual = "local";
            let nameOfQual = qualName.value.substring(6);
            importRemoteQuestions(nameOfQual, function() {
                initializeLocal(function() {});
                qualName.value = "working locally on " + nameOfQual;
                qualName.setAttribute("disabled", "");
            });
            return;
        } else return inputMessage(qualName, "invalid name");
    }
    qual = qualName.value;
    qualName.value = "loading " + qual;
    qualName.setAttribute("disabled", "");
    // import qual or initialize local
    if (qual == "local") {
        initializeLocal();
    } else {
        importRemoteQuestions(qual, function() {
            qualName.value = "working on " + qual;
        })
    }
}

/*
    Two cases here, either opening an existing problem or renaming a problem.
    Renaming consists of deleting under the old name and rewriting under the new name.
    Loading consists of saving the old name (which is actually already saved, so just not deleting it) and then opening the existing problem
*/
function handleIdChange() {
    if (nodeNameScreen(idInput.value)) {
        let oldID = id;
        id = idInput.value;
        if (id in problems) {
            doc = problems[id];
            outputFromDoc();
        } else {
            delete (problems[oldID]);
            if (problemsTags[oldID]) {
                problemsTags[oldID].parentElement.removeChild(problemsTags[oldID]);
                delete problemsTags[oldID];
            }
            if (qual == "local") Store.erase("local " + oldID);
            resetDoc();
        }
    } else inputMessage(idInput, "invalid nodeName");
}

// update doc to represent what is present in the interface
function resetDoc() {
    while (doc.firstChild) doc.removeChild(doc.firstChild);
    let problem = xmlImporter.elementDoc(doc, "problem", xmlImporter.elementDoc(doc, id, doc), ["tex", texProblem.value]);
    if (pairMode) {
        problem.setAttribute("solutionCompleteness", solutionFull.checked? "full": solutionPartial.checked? "partial": "none");
        problem.setAttribute("questionViability", questionGreat.checked? "great": questionGood.checked? "good": "bad");
    }
    let instructorsNode = xmlImporter.elementDoc(doc, "instructors", problem);
    for (let instructor of instructors) if (instructor.checkbox.checked) xmlImporter.elementDoc(doc, instructor.id, instructorsNode);
    let topicsNode = xmlImporter.elementDoc(doc, "topics", problem);
    for (let topic in topics) if (topics[topic].checkbox.checked) xmlImporter.elementDoc(doc, topic, topicsNode);
    if (pairMode) xmlImporter.elementDoc(doc, "solution", problem, ["tex", texSolution.value]);
    outputFromDoc();
}
// this initializes doc in a new session
resetDoc();

// populate values in interface to match what is present in doc
function outputFromDoc() {
    idInput.value = id = xmlImporter.getRoot(doc).nodeName;
    problems[id] = doc;
    if (!(id in problemsTags)) problemsTags[id] = xmlImporter.element("option", idList, ["value", id]);
    let problem = doc.querySelector("problem"), solution = doc.querySelector("solution"), instructorsNode = doc.querySelector("instructors"), topicsNode = doc.querySelector("topics");
    ensureInstructors(instructorsNode);
    for (let i of instructors) i.checkbox.checked = false;
    if (instructorsNode) {
        let i = instructorsNode.firstChild;
        while (i) {
            getBy(instructors, "id", i.nodeName).checkbox.checked = true;
            i = i.nextSibling;
        }
    }
    ensureTopics(topicsNode);
    for (let topic in topics) topics[topic].checkbox.checked = false;
    if (topicsNode) {
        let topic = topicsNode.firstChild;
        while (topic) {
            topics[topic.nodeName].checkbox.checked = true;
            topic = topic.nextSibling;
        }
    }
    if (problem) texProblem.value = problem.getAttribute("tex");
    else texProblem.value = "";
    fixTextHeight({target: texProblem});
    if (pairMode) {
        if (solution) texSolution.value = solution.getAttribute("tex");
        else texSolution.value = "";
        fixTextHeight({target: texSolution});
    }
    if (problem) switch (problem.getAttribute("solutionCompleteness")) {
        case "full": solutionFull.checked = true; break;
        case "partial": solutionPartial.checked = true; break;
        default: solutionNone.checked = true;
    } else solutionNone.checked = true;
    if (problem) switch (problem.getAttribute("questionViability")) {
        case "great": questionGreat.checked = true; break;
        case "good": questionGood.checked = true; break;
        default: questionBad.checked = true;
    } else questionBad.checked = true;
    if (problem) {
        if (pairMode) texLiveOut.innerHTML = "<h4>Problem</h4><p>"+fixLineBreaksToP(problem.getAttribute("tex"))+"</p><h4>Solution</h4><p>"+fixLineBreaksToP(solution.getAttribute("tex"))+"</p>";
        else texLiveOut.innerHTML = "<p>"+fixLineBreaksToP(problem.getAttribute("tex"))+"</p>";
    } else {
        if (pairMode) texLiveOut.innerHTML = "<h4>Problem</h4><p></p><h4>Solution</h4><p></p>";
        else texLiveOut.innerHTML = "<h4>Problem</h4><p></p>";
    }
    codeOut.value = serializer.serializeToString(doc);
    refreshMathJax();
    if (qual == "local" && id != "changeMe") {
        Store.store("local " + id, codeOut.value);
        Store.store("local problems list", problemsListString());
    }
}

// get ids of all loaded problems
function problemsListString() {
    let returner = "";
    for (let problem in problems) if (problem != "changeMe") returner += " " + problem;
    return returner.substring(1);
}

function ensureInstructors(instructorsNode) {
    if (!instructorsNode) return;
    let i = instructorsNode.firstChild;
    while (i) {
        ensureInstructor(i.nodeName);
        i = i.nextSibling;
    }
}

function ensureInstructor(instructorID) {
    if (getBy(instructors, "id", instructorID)) return Store.fetchInstructorName(instructorID);
    for (let instructor of instructors) if (instructor.id == instructorID) return;
    try {while (newInstructor().id != instructorID);} catch (e) {errorOut(instructorID + " is not a working instructor ID")}
}

function ensureTopics(topicsNode) {
    if (!topicsNode) return;
    let t = topicsNode.firstChild;
    while (t) {
        ensureTopic(t.nodeName);
        t = t.nextSibling;
    }
}

function ensureTopic(topic) {
    if (topic in topics) return;
    newTopic(topic);
}

function refreshMathJax() {try {MathJax.Hub.Queue(["Typeset", MathJax.Hub])} catch (e) {}}

// processing of TeX to make it MathJax-ready
function fixLineBreaksToP(line) {
    let lines = line.split("$");
    line = "";
    let opening = false;
    for (let sub of lines) {
        line += sub + "\\" + ((opening = !opening)? "(": ")");
    }
    line = line.substring(0, line.length - 2);
    return line.replaceAll(/\n/g, "</p><p>");
}

// temporary message displayed in an input element
function inputMessage(input, message, time = 1000) {
    let line = input.value, able = !input.hasAttribute("disabled");
    window.setTimeout(function() {input.value = message}, 10); // delay is to let blur happen
    input.setAttribute("disabled", "");
    window.setTimeout(function() {
        input.value = line;
        if (able) input.removeAttribute("disabled");
    }, time);
}

function newTopic(topic) {
    if (topic in topics) errorOut("already a topic");
    let returner = {topic: topic};
    topics[topic] = returner;
    returner.div = xmlImporter.element("div", topicsPlace, ["class", "checkbox"]);
    returner.label = xmlImporter.element("label", returner.div, ["for", "topic"+topic]);
    xmlImporter.text(topic, returner.label);
    returner.checkbox = xmlImporter.element("input", returner.div, ["type", "checkbox", "id", "topic"+topic, "value", topic]);
    returner.checkbox.addEventListener("change", resetDoc);
    return returner;
}

function removeTopic(topic) {
    if (!(topic in topics)) errorOut("not a topic");
    let e = topics[topic];
    if (e.checkbox.checked) errorOut(topic + " must not be in use");
    delete topics[topic];
    e.div.parentElement.removeChild(e.div);
}

// characters of this string are all available instructor ids
let instructorLetters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
// get first unused instructor id and make an instructor with that id
function newInstructor() {
    if (instructors.length == instructorLetters.length) errorOut("too many instructors");
    let num = instructors.length, id = instructorLetters.charAt(num);
    let returner = {id: id};
    instructors[num] = returner;
    returner.div = xmlImporter.element("div", instructorsPlace, ["class", "checkbox"]);
    returner.label = xmlImporter.element("label", returner.div, ["for", "instructor_"+id]);
    xmlImporter.text(id, returner.label);
    returner.checkbox = xmlImporter.element("input", returner.div, ["type", "checkbox", "id", "instructor_"+id]);
    returner.checkbox.addEventListener("change", resetDoc);
    returner.nameIn = xmlImporter.element("input", null, ["type", "text"]);
    returner.label.addEventListener("click", function(e) {
        e.preventDefault();
        e.stopImmediatePropagation();
        returner.div.replaceChild(returner.nameIn, returner.label);
        returner.nameIn.focus();
    });
    returner.nameIn.addEventListener("change", function() {returner.setRealName(returner.nameIn.value)});
    returner.nameIn.addEventListener("blur", function() {if (returner.nameIn.parentElement) returner.div.replaceChild(returner.label, returner.nameIn)});
    returner.setRealName = function setRealName(realName) {
        returner.name = realName;
        returner.label.firstChild.nodeValue = realName;
        returner.nameIn.value = realName;
        Store.saveInstructor(id, realName);
        if (returner.nameIn.parentElement) returner.div.replaceChild(returner.label, returner.nameIn);
    };
    Store.fetchInstructorName(id);
    return returner;
}

// This should empty the interface and make doc a new problem document. This should not erase the active problem.
function clearTex() {
    doc = xmlImporter.newDocument();
    xmlImporter.elementDoc(doc, "changeMe", doc); // root node, required for xml files
    outputFromDoc();
}

// start a session with a blank slate
clearTex();

// in case you want to show TeX without MathJax rendering it
function noJax(line) {
    return line.replace(/&/g, "&amp;").replace(/\\/g, "\\<span\\>");
}

// this defines which strings are valid node names
function nodeNameScreen(line) {
    try {
        document.createElement(line); return true;
    } catch (e) {return false}
}

// return the first instance in array of an object which has a value of value in property prop
function getBy(array, prop, value) {
    for (let element of array) if (element[prop] == value) return element;
}

// show the error to users even if they don't have the console open
function errorOut(message) {
    errorOutP.innerHTML = message;
    throw Error(message);
}

// use JSZip magic to save all loaded problems in one .zip file/folder
let zip;
function saveAll() {
    // this url is where JSZip source code is available
    if (!zip) return xmlImporter.element("script", document.head, ["src", "https://stuk.github.io/jszip/dist/jszip.js"]).addEventListener("load", function() {
        zip = new JSZip();
        saveAll();
    });
    let folder = zip.folder("problems");
    for (let problem in problems) if (problem != "changeMe") folder.file(problem+".xml", serializer.serializeToString(problems[problem]));
    folder.generateAsync({type:"blob"}).then(function (file) {
        // rename file from some machine name to "problems.zip"
        file = new File([file.slice(0, file.size, "application/zip")], "problems.zip", {type: "application/zip"});
        // save problems.zip
        let url = URL.createObjectURL(file);
        let a = xmlImporter.element("a", document.body, ["href", url, "download", ""]);
        xmlImporter.text("download link", a);
        a.click();
        document.body.removeChild(a);
    });
}

// remove all locally stored problems
function clearLocalQual() {
    for (let problem of Store.fetch("local problems list").split(" ")) Store.erase("local " + problem);
    Store.erase("local problems list");
    // give up on trying to reinitialize a local session, force the user to refresh and start anew
    // not really necessary but I didn't want to work out a local refresh
    Store.canStore = function() {return false}
    document.body.innerHTML = "<p>Please refresh page now</p>";
}

// interact with browser local storage in a fail-safe way
var Store = {};

Store.canStore = function() {return typeof (Storage) !== "undefined"}

Store.fetchInstructorName = function fetchInstructorName(id) {if (Store.canStore()) {
    let realName = localStorage[qual + " instructor " + id];
    if (realName) getBy(instructors, "id", id).setRealName(realName);
}}

Store.saveInstructor = function saveInstructor(id, name) {if (Store.canStore()) {
    localStorage.setItem(qual + " instructor " + id, name);
}}

Store.fetch = function fetch(name) {
    if (Store.canStore()) return localStorage.getItem(name);
}

Store.store = function store(name, value) {
    if (Store.canStore()) localStorage.setItem(name, value);
}

Store.erase = function erase(name) {
    if (Store.canStore()) localStorage.removeItem(name);
}