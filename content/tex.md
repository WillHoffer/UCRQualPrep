<html lang="en">
    <head>
        <meta charset="utf-8"/>
        <title>Browser TeX</title>
        <link rel="stylesheet" type="text/css" href="../css/tex.css"/>
        <script src="../scripts/xmlImporter.js"></script>
        <script src="../scripts/jax.js"></script>
        <link rel="stylesheet" type="text/css" href="../css/xmlViewer.css"/>
        <script src="../scripts/xmlViewer.js"></script>
        <script src="../scripts/problems.js"></script>
        <script src="../scripts/tex.js" async defer></script>
    </head>
    <body>
        <div class="title">
            <h1>Browser \(\TeX\)</h1>
        </div>
        <p>Use this tool to write \(\LaTeX\) in the right format for use on this site. Read the <a href="../readmes/tex.html">readme</a> for an introduction.</p>
        <label for="qualName">This is for qual</label>
        <input type="text" id="qualName"/>
        <label for="loadedProblems">Loaded problems:</label>
        <select id="loadedProblems"></select>
        <div><button type="button" id="clearTex">Clear / New Problem</button></div>
        <div><button type="button" id="pairSolo">To Solo mode</button></div>
        <div id="metainformationTex">
            <details id="metainformation">
                <summary>Metainformation</summary>
                <p id="idP">Problem ID: <input type="text" id="problemID" list="idList"/><datalist id="idList"/></p>
                <div>
                    <label for="newMetatype">New Metatype:</label><input id="newMetatype" type="text"/>
                    <select id="newMetatypeType">
                        <option disabled="">Select Type</option>
                        <option>Checkbox</option>
                        <option>Radio</option>
                        <option>Scale</option>
                    </select>
                    <input id = "defaultOption" type="text" hide=""/>
                </div>
                <div id="putMetasHere"></div>
                <div><label>
                    Rename metainformation (hard)
                    <input id="renameMetainformation" type="text" placeholder="actually rename metainformation"/>
                    </label></div>
                <div><label>
                    Rename metainformation (display)
                    <input id="renameSoftMetainformation" type="text" placeholder="locally rename some tag"/>
                    </label></div>
            </details>
        </div>
        <label for="texProblem" pairOnly="">Problem:</label>
        <div><textarea class="texInput" id="texProblem" spellcheck="false"></textarea></div>
        <label for="texSolution" pairOnly="">Solution:</label>
        <div pairOnly=""><textarea class="texInput" id="texSolution" spellcheck="false"></textarea></div>
        <div id="texLiveOut"><p>Rendered TeX will go here</p></div>
        <button type="button" id="save">Save</button>
        <div><textarea id="codeOut" spellcheck="false">Formatted code will go here</textarea></div>
        <button type="button" id="saveAll">Save All (.zip)</button>
        <p id="errorOut"/>
        <div id="problemsSpot"/>
    </body>
</html>