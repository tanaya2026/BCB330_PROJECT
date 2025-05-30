/**
 * @fileOverview AIV2, Arabidopsis Interactions Viewer Two. Main JS file that powers the front-end of AIV 2.0. Shows PPIs and PDIs and additional API data for a given gene(s).
 * @version 2.0, Jul2018
 * @author Vincent Lau (major additions, AJAX, polishing, CSS, SVGs, UX/UI, filters, exports, tables, tooltips) <vincente.lau@mail.utoronto.ca>
 * @author Asher Pasha (prototype base app, some logic of adding nodes & edges)
 * @copyright see MIT license on GitHub
 * @description please note that I seldom intentionally used data properties to nodes instead of classes as we cannot ( to my knowledge), select nodes by NOT having a class
 */
(function(window, $, _, cytoscape, alertify, undefined) {
    'use strict';

    /** @namespace {object} AIV */
    var AIV = {};

    /**
     * @namespace {object} AIV - Important hash tables to store state data and styling global data
     * @property {object} chromosomesAdded - Object property for 'state' of how many PDI chromosomes exist
     * @property {boolean} mapManLoadState - Boolean property representing if mapMan AJAX call was successful
     * @property {boolean} SUBA4LoadState - Boolean property representing if SUBA4 AJAX call was successful
     * @property {object} exprLoadState - State of the expression values the user has loaded for the current query genes
     * @property {number} nodeSize - "Global" default data such as default node size
     * @property {number} DNANodeSize - Important for adjusting the donut sizes
     * @property {number} searchNodeSize - Size for search genes
     * @property {string} nodeDefaultColor - hexcode for regular nodes by default (no expression data)
     * @property {string} searchNodeColor - hexcode for search genes background
     * @propery {object} locColorAssignments - the corresponding hexcodes for the localizations in the object keys
     * @property {Array.<string>} locCompoundNodes - this node will hopefully be filled with the parent nodes for localizations that exist on the app currently
     * @propery {boolean} coseParentNodesOnCyCore - state variable that stores whether compound nodes have been loaded onto the cy core app
     * @property {number} defaultZoom - contains a number for how much graph has been zoomed (after a layout has been ran)
     * @property {object} defaultPan - contains x and y properties for where the graph has been panned, useful for layouts
     * @property {object} miFilter - a list of unuseful mi terms that ideally would be filled out if a PPI/PDI does not have another meaningful name
     * @property {object} miTerms - a dictionary of frequently occuring (needs to be curated manually as EMBL doesn't have an API) MI terms that come from our dapseq ppi webservice
     * @property {object} mapManDefinitions - a dictionary of of MapMan terms (first number/hierarchical category)
     * @property {object} mapManOnDom - state variable dictionary that stores which MapMan BINs are in the app; used for when adding to the dropdown
     */
    AIV.chromosomesAdded = {};
    AIV.mapManLoadState = false;
    AIV.SUBA4LoadState = false;
    AIV.exprLoadState = {absolute: false, relative: false};
    AIV.nodeSize = 35;
    AIV.DNANodeSize = 55;
    AIV.searchNodeSize = 65;
    AIV.nodeDefaultColor = '#cdcdcd';
    AIV.searchNodeColor = '#ffffff';
    AIV.locColorAssignments = {
        cytoskeleton : "#572d21",
        cytosol      : "#e0498a",
        "endoplasmic reticulum" : "#d1111b",
        extracellular: "#ffd672",
        golgi        : "#a5a417",
        mitochondrion: "#41abf9",
        nucleus      : "#0032ff",
        peroxisome   : "#650065",
        "plasma membrane" : "#edaa27",
        plastid      : "#13971e",
        vacuole      : "#ecea3a",
    };
    AIV.locCompoundNodes = [];
    AIV.coseParentNodesOnCyCore  = false;
    AIV.defaultZoom = 1;
    AIV.defaultPan = {x: 0, y:0};
    AIV.miFilter =["0469" , "0463", "0467", "0190", "1014", "0915", "0914", "0407", "0686", "0045", "0462"];
    AIV.miTerms =
    {
        "0004" : "affinity chromotography technology",
        "0007" : "anti tag co-immunoprecipitation",
        "0018" : "two hybrid",
        "0019" : "coimmunoprecipitation",
        "0030" : "cross-linking study",
        "0045" : "experimental interaction detection",
        "0047" : "far western blotting",
        "0055" : "fluorescent resonance energy transfer",
        "0064" : "interologs mapping",
        "0065" : "isothermal titration calorimetry",
        "0067" : "tandem affinity purification",
        "0071" : "molecular sieving",
        "0084" : "phage display",
        "0085" : "phylogenetic profile",
        "0096" : "pull down",
        "0112" : "ubiquitin reconstruction",
        "0190" : "reactome",
        "0217" : "phosphorylation reaction",
        "0364" : "inferred by curator",
        "0397" : "two hybrid array",
        "0407" : "direct interaction",
        "432"  : "one hybrid", // error in the database, not a 4 digit num
        "0432" : "one hybrid",
        "0437" : "protein three hybrid",
        "0462" : "bind",
        "0463" : "biogrid",
        "0467" : "reactome",
        "0469" : "intact",
        "0686" : "unspecified method",
        "0809" : "bimolecular fluorescence complementation",
        "0914" : "association",
        "0915" : "physical association",
        "1014" : "string",
        "1178" : "sequence based prediction of binding of transcription factor to transcribed gene regulatory elements",
        "2189" : "avexis"
    };
    AIV.mapManDefinitions =
    {
        "0" : "Control",
        "1" : "PS",
        "2" : "Major CHO metabolism",
        "3" : "Minor CHO metabolism",
        "4" : "Glycolysis",
        "5" : "Fermentation",
        "6" : "Gluconeogensis",
        "7" : "OPP",
        "8" : "TCA/org. transformation",
        "9" : "Mitochondrial electron transport",
        "10": "Cell wall",
        "11": "Lipid Metabolism",
        "12": "N-metabolism",
        "13": "Amino acid metabolism",
        "14": "S-assimilation",
        "15": "Metal handling",
        "16": "Secondary metabolism",
        "17": "Hormone metabolism",
        "18": "Co-factor and vitamin metabolism",
        "19": "Tetrapyrrole synthesis",
        "20": "Stress",
        "21": "Redox",
        "22": "Polyamine metabolism",
        "23": "Nucleotide metabolsim",
        "24": "Biodegradation of xenobiotics",
        "25": "C1-metabolism",
        "26": "Misc.",
        "27": "RNA",
        "28": "DNA",
        "29": "Protein",
        "30": "Signalling",
        "31": "Cell",
        "32": "Micro RNA, natural antisense etc.",
        "33": "Development",
        "34": "Transport",
        "35": "Not assigned",
        "991": "Mineral nutrition"
    };
    AIV.mapManOnDom = {};

    /**
     * @namespace {object} AIV
     * @function initialize - Call bindUIEvents as the DOM has been prepared and add namespace variable
     */
    AIV.initialize = function() {
        // Set AIV namespace in window
        window.aivNamespace = {};
        window.aivNamespace.AIV = AIV;
        // Bind User events
        this.bindSubmit();
    };

    /**
     * @namespace {object} AIV
     * @function bindSubmit - Add functionality to buttons when DOM is loaded
     */
    AIV.bindSubmit = function() {
        // Submit button
        $('#submit').click(function(e) {
            // Stop system submit, unless needed later on
            e.preventDefault();

            // Get the list of genes
            let genes = $.trim($('#genes').val());
            genes = AIV.formatAGI(genes); //Format to keep "At3g10000" format when identifying unique nodes, i.e. don't mixup between AT3G10000 and At3g10000 and add a node twice
            let geneArr = genes.split('\n');
            let effectorArr = [...document.getElementById('effectorSelect').options].map(option => option.value);

            for (let i = 0; i < geneArr.length; i++) { // gene form input verification
                if(!geneArr[i].match(/^AT[1-5MC]G\d{5}$/i) && effectorArr.indexOf(geneArr[i]) === -1){
                    document.getElementById('errorModalBodyMsg').innerText = "Please check form value before adding effectors/submission! Genes should be delimited by newlines and follow the AGI format.";
                    $('#formErrorModal').modal('show');
                    throw new Error('wrong submission');
                }
            }

            if (genes !== '' && $('.form-chk-needed:checked').length > 0) {
                document.getElementById('loading').classList.remove('loaded'); //remove previous loading spinner
                let iconNode = document.createElement("i");
                iconNode.classList.add('fa');
                iconNode.classList.add('fa-spinner');
                iconNode.classList.add('fa-spin');
                document.getElementById('loading').appendChild(iconNode); // add loading spinner

                $('#formModal').modal('hide'); // hide modal

                AIV.genesList = geneArr;

                // Clear existing data
                AIV.resetUI();
                if (typeof AIV.cy !== 'undefined') {
                    AIV.cy.destroy(); //destroy cytoscape app instance
                    AIV.cy.contextMenus('get').destroy(); // delete bound right-click menus
                    AIV.resetState();
                }
                // cy.destroy() removes all child nodes in the #cy div, unfortunately we need one for the expr gradient, so reinstate it manually
                $('#cy').append('<canvas id="exprGradientCanvas" width="70" height="300"></canvas>');
                AIV.initializeCy(false);

                AIV.loadData();
            }
            else if ($('.form-chk-needed:checked').length <= 0) {
                document.getElementById('errorModalBodyMsg').innerText = "Please check a protein database!"
                $('#formErrorModal').modal('show');
                throw new Error('wrong submission');
            }
        });

    };

    /**
     * @namespace {object} AIV
     * @function resetState - Reset existing built-in state data from previous query
     */
    AIV.resetState = function() {
        this.chromosomesAdded = {};
        this.mapManLoadState = false;
        this.SUBA4LoadState = false;
        this.exprLoadState = {absolute: false, relative: false};
        this.coseParentNodesOnCyCore = false;
        this.locCompoundNodes = [];
        this.mapManOnDom = {};
        // clear memoized memory
        AIV.memoizedSanRefIDs.cache = new _.memoize.Cache;
        AIV.memoizedRetRefLink.cache = new _.memoize.Cache;
        AIV.memoizedPDITable.cache = new _.memoize.Cache;
    };

    /**
     * @namespace {object} AIV
     * @function resetUI - Reset UI features that are run once a query was executed
     */
    AIV.resetUI = function() {
        // reset the buttons
        $('.submit-reset').prop('checked', false);
        $(".fa-eye-slash").toggleClass('fa-eye fa-eye-slash');
        // Remove prior mapman definitions for that app state
        $('#bootstrapDropDownMM').empty();

        //remove existing interactions table except headers
        $("#csvTable").find("tr:gt(0)").remove();
        $(".inf").remove();

        //reset the reference filters for the next query
        $("#refCheckboxes").empty();
    };

    /**
     * @namespace {object} AIV
     * @function formatAGI - helper function that takes in a capitalized AGI into the one we use i.e. AT3G10000 to At3g10000
     * @param {string} AGI
     * @returns {string} - formmated AGI, i.e. At3g10000
     */
    AIV.formatAGI = function (AGI){
        AGI = AGI.replace(/T/g,'t');
        AGI = AGI.replace(/G/g, 'g');
        AGI = AGI.replace(/a/g, 'A');
        return AGI;
    };

    /**
     * @namespace {object} AIV
     * @function getCySpreadLayout - Returns spread layout for Cytoscape
     */
    AIV.getCySpreadLayout = function() {
        let layout = {};
        layout.name = 'cose';
        layout.nodeDimensionsIncludeLabels = true;
        // layout.padding = 1;
        if (AIV.cy.nodes().length > 750 && document.getElementById('circleLyChkbox').checked){
            layout.name = 'circle';
        }
        else if (AIV.cy.nodes().length < 375){
            layout.boundingBox = {x1:0 , y1:0, w:this.cy.width(), h: (this.cy.height() - this.DNANodeSize) }; //set boundaries to allow for clearer PDIs (DNA nodes are locked to start at x:50,y:0)
        }
        layout.stop = function(){ //this callback gets ran when layout is finished
            AIV.defaultZoom = AIV.cy.zoom();
            AIV.defaultPan = Object.assign({}, AIV.cy.pan()); //make a copy instead of takign reference
        };
        return layout;
    };

    /**
     * @namespace {object} AIV
     * @function getCyCOSEBilkentLayout - Returns layout for Cytoscape
     */
    AIV.getCyCOSEBilkentLayout = function(){
        let layout = {};
        layout.name = 'cose-bilkent';
        layout.padding = 5;
        layout.animate = 'end';
        layout.fit = true;
        layout.stop = function(){ //this callback gets ran when layout is finished
            AIV.defaultZoom = AIV.cy.zoom();
            AIV.defaultPan = Object.assign({}, AIV.cy.pan()); //make a copy instead of takign reference
            AIV.cy.style() // see removeAndAddNodesForCompoundNodes for rationale of re-updating stylesheet
                .selector('.filterByReference').style({'display': 'none'})
                .selector('.pearsonfilterEPPI').style({'display': 'none'})
                .selector('.pearsonAndInterologfilterPPPI').style({'display': 'none'})
                .update();
        };
        return layout;
    };

    /**
     * @namespace {object} AIV
     * @function getCyCerebralLayout - Returns layout for Cytoscape
     */
    AIV.getCyCerebralLayout = function (){
        AIV.defaultZoom = 1; // reset zoom
        AIV.defaultPan = {x: 0, y:0}; // reset pan
        return window.cerebralNamespace.options;
    };

    /**
     * @namespace {object} AIV
     * @function getCyStyle - Returns initial stylesheet of Cytoscape
     */
    AIV.getCyStyle = function() {
        return (
            cytoscape.stylesheet()
            .selector('node')
                .style({
                    'label': 'data(name)', //'label' is alias for 'content'
                    'font-size': 10,
                    'min-zoomed-font-size': 8,
                    'background-color': this.nodeDefaultColor,
                    "text-wrap": "wrap", //mulitline support
                    'height': this.nodeSize,
                    'width': this.nodeSize,
                    'border-style' : 'solid',
                    'border-width' : '1px',
                    'border-color' : '#979797'
                })
            .selector('node[?queryGene]') //If same properties as above, override them with these values for search genes
                .style({
                    'font-size': 14,
                    'min-zoomed-font-size': 0.00000000001,
                    'z-index': 100,
                    'height' : this.searchNodeSize,
                    'width'  : this.searchNodeSize,
                    'background-color': this.searchNodeColor,
                })
            .selector('.filteredChildNodes') //add/(remove) this class to nodes to (un)filter display
                .style({
                    'display' : 'none',
                })
            .selector('.hideMapManNodes') //add/(remove) this class to nodes to (un)display MapMan nodes with a specific MapMan number
                .style({
                    'display' : 'none',
                })
            .selector('.pearsonfilterEPPI') //to hide/unhide experimentally determined elements
                .style({
                    'display' : 'none',
                })
            .selector('.filterByReference') //to hide/unhide published elements via reference
                .style({
                    'display' : 'none',
                })
            .selector('.pearsonAndInterologfilterPPPI') //to hide/unhide predicted determined elements
                .style({
                    'display' : 'none',
                })
            .selector('.DNAfilter') // hide chromosomes
                .style({
                    'display' : 'none',
                })
            .selector('edge')
                .style({
                    'haystack-radius': 0,
                    'width': '11', // default, should be only for published interactions
                    'opacity': 0.666,
                    'line-style': 'dashed',
                })
            .selector('node[id ^= "DNA"]')
                .style({
                    'background-color': '#D3D3D3',
                    'font-size': '1.1em',
                    'min-zoomed-font-size': 0.00000000001,
                    "text-valign": "center",
                    "text-halign": "center",
                    "border-style": "solid",
                    "border-color": "#000000",
                    "border-width": "5px",
                    'shape': 'square',
                    'z-index': 101,
                    'height': this.DNANodeSize,
                    'width': this.DNANodeSize,
                })
            .selector('node[id ^= "Effector"]')
                .style({
                    'shape': 'hexagon',
                    'background-color': '#00FF00'
                })
            .selector('[?compoundNode]') //select for ALL compound nodes
                .style({
                    'shape': 'roundrectangle',
                    'font-size' : 18,
                    'font-family' : "Verdana, Geneva, sans-serif",
                })
            .selector('#cytoskeleton') //for compound nodes
                .style({
                    'background-color': '#e8e5e5',
                })
            .selector('#cytosol') //for compound nodes
                .style({
                    'background-color': '#ffe7ff',
                })
            .selector('[id="endoplasmic reticulum"]') //for compound nodes
                .style({
                    'background-color': '#ff8690',
                })
            .selector('#extracellular') //for compound nodes
                .style({
                    'background-color': '#ffffdb',
                })
            .selector('#golgi') //for compound nodes
                .style({
                    'background-color': '#ffff8f',
                })
            .selector('#mitochondrion') //for compound nodes
                .style({
                    'background-color': '#dfffff',
                })
            .selector('#nucleus') //for compound nodes
                .style({
                    'background-color': '#4f81ff',
                })
            .selector('#peroxisome') //for compound nodes
                .style({
                    'background-color': '#ce69ce',
                })
            .selector('[id="plasma membrane"]') //for compound nodes
                .style({
                    'background-color': '#ffd350',
                })
            .selector('#plastid') //for compound nodes
                .style({
                    'background-color': '#8bff96',
                })
            .selector('#vacuole') //for compound nodes
                .style({
                    'background-color': '#ffff70',
                })
            .selector('#unknown') //for compound nodes
                .style({
                    'background-color': '#fff',
                })
            .selector('.highlighted')
                .style({
                    'border-color' : '#979797',
                    'min-zoomed-font-size': 0.00000000001,
                    "text-background-opacity": 1,
                    "text-background-color": "yellow",
                    "text-background-shape": "roundrectangle",
                    "text-border-color": "#000",
                    "text-border-width": 1,
                    "text-border-opacity": 1,
                    "z-index": 102,
                    "font-size": 16
                })
            .selector('edge[target *= "Protein"]')
                .style({
                    'line-color' : '#acadb4'
                })
            .selector('edge[pearsonR > 0.5 ], edge[pearsonR < -0.5 ]')
                .style({
                    'line-color' : '#f5d363'
                })
            .selector('edge[pearsonR > 0.6 ], edge[pearsonR < -0.6 ]')
                .style({
                    'line-color' : '#ea801d'
                })
            .selector('edge[pearsonR > 0.7 ], edge[pearsonR < -0.7 ]')
                .style({
                    'line-color' : '#da4e2f'
                })
            .selector('edge[pearsonR > 0.8 ], edge[pearsonR < -0.8 ]')
                .style({
                    'line-color' : '#ac070e'
                })
            .selector('edge[?published]') // This is going to affect effectors too since they're all published
                .style({
                    'line-color' : '#99cc00',
                    'line-style' : 'solid'
                })
            .selector('edge[target *= "DNA"]')
                .style({
                    'line-color' : '#333435',
                    'target-arrow-shape': 'triangle',
                    'curve-style': 'unbundled-bezier',
                    'control-point-distances' : '50', // only for unbunlded-bezier edges (DNA edges)
                    'control-point-weights'   : '0.65',
                    'target-arrow-color' : '#333435',
                })
            .selector('edge[target *= "DNA"][interologConfidence = 0]') //i.e. published PDI
                .style({
                    'line-color' : '#557e00',
                    'target-arrow-color' : '#557e00',
                })
            .selector('edge[interologConfidence <= 2][interologConfidence > 0], edge[interologConfidence > -7203][interologConfidence <= -9605]')
                .style({
                    'width' : '1'
                })
            .selector('edge[interologConfidence > 2], edge[interologConfidence > -4802][interologConfidence <= -7203]')
                .style({
                    'width' : '3'
                })
            .selector('edge[interologConfidence > 5], edge[interologConfidence > -2401][interologConfidence <= -4802]')
                .style({
                    'width' : '5'
                })
            .selector('edge[interologConfidence > 10], edge[interologConfidence >= -1][interologConfidence <= -2401]')
                .style({
                    'width' : '7'
                })
        );
    };


    /**
     * @namespace {object} AIV
     * @function initializeCy - initialize Cytoscape with some default settings
     * @param {boolean} upload - boolean to determine how to initialize stylesheet based on if user is entering their own JSON
     */
    AIV.initializeCy = function(upload) {
        this.cy = cytoscape({
            container: document.getElementById('cy'),

            boxSelectionEnabled: false,

            autounselectify: true,

            style: upload ? [] : this.getCyStyle(),

            layout: {name: 'null'} //the init layout has 0 nodes so it doesn't matter what the layout is
        });
    };

    /**
     * @namespace {object} AIV
     * @function getWidth - Get PPI edge width based on interolog confidence
     * @description - not currently used, see stylesheet
     * @param {number} interolog_confidence - expects a interolog confidence value from the GET request
     */
    AIV.getWidth = function(interolog_confidence) {
        if (interolog_confidence > 10 || (interolog_confidence >= -1 && interolog_confidence <= -2401)){
            return '7';
        } else if (interolog_confidence > 5 || (interolog_confidence > -2401 && interolog_confidence <= -4802)) {
            return '5';
        } else if (interolog_confidence > 2 || (interolog_confidence > -4802 && interolog_confidence <= -7203)) {
            return '3';
        } else if (interolog_confidence <= 2 && interolog_confidence > 0 || (interolog_confidence > -7203 && interolog_confidence <= -9605)) {
            return '1';
        } else { //i.e. interlog confidence of '0',
            return '11';
        }
    };

    /**
     * @namespace {object} AIV
     * @function getEdgeColor - return the edge colour if the edge is a PDI/PPI, publish status and interolog confidence/correlation coefficient.
     * @description NOT USED CURRENTLY, chose to use cytoscape selectors instead
     * @param {number} correlation_coefficient
     * @param {boolean} published
     * @param {string} index
     * @param {number} interolog_confidence
     * @returns {string} - hexcode for color
     */
    AIV.getEdgeColor = function(correlation_coefficient, published, index, interolog_confidence) {
        correlation_coefficient = Math.abs(parseFloat(correlation_coefficient)); // Make the value positive
        if (index === '2') { //PDIs
            if (interolog_confidence === 0){
                return '#557e00'; // if e PDI, return dark green
            }
            else {
                return '#333435'; // if p PDI, return greyish
            }
        } else if (published) { //published PPIs but not published PDIs
            return '#99cc00';
        } else if (correlation_coefficient > 0.8) {
            return '#ac070e';
        } else if (correlation_coefficient > 0.7) {
            return '#da4e2f';
        } else if (correlation_coefficient > 0.6) {
            return '#ea801d';
        } else if (correlation_coefficient > 0.5) {
            return '#f5d363';
        } else {
            return '#acadb4';
        }
    };

    /**
     * @namespace {object} AIV
     * @function addNode - generic add nodes to cy core helper function
     * @param {string} node - as the name of the node, i.e. "At3g10000"
     * @param {string} type - as the type of node it is, i.e. "Protein"
     * @param {boolean} [searchGene=false] - optional parameter that signifies node is a search query gene, will be used directly as a true false value into the data properties of the node
     */
    AIV.addNode = function(node, type, searchGene = false) {
        let node_id = type + '_' + node;

        // Add the node
        this.cy.add([
            { group: "nodes", data: {id: node_id, name: node, queryGene : searchGene}} //nodes now have a property 'id' denoted as Protein_At5g20920 (if user inputed 'At5g20920' in the textarea)
        ]);
    };

    /**
     * @function addCompoundNode - generic function to add compound nodes to the cy core
     * @param idOfParent - id of compound node, 'id', example "nucleus"
     */
    AIV.addCompoundNode = function(idOfParent){
        AIV.cy.add({
            group: "nodes",
            data: {
                id : idOfParent,
                name: idOfParent,
                compoundNode: true, //data property used instead of a class because we cannot select nodes by NOT having a class
            },
        });
    };

    /**
     * @function addLocalizationCompoundNodes - specifically add compound nodes to cy core by going into our localization state variable
     */
    AIV.addLocalizationCompoundNodes = function(){
        for (let i = 0; i < this.locCompoundNodes.length; i++) {
            // console.log(this.locCompoundNodes[i]);
            this.addCompoundNode(this.locCompoundNodes[i]);
        }
        AIV.coseParentNodesOnCyCore = true; // we have added compound nodes, change the state variable
    };

    /**
     * @function removeLocalizationCompoundNodes - Remove compound nodes from cy core so we can make a nicer layout after the users clicks on cose-bilkent layout and then goes back to the spread layout for example.
     */
    AIV.removeLocalizationCompoundNodes = function(){
        if (!this.coseParentNodesOnCyCore){return} // exit if compound nodes not added yet
        this.cy.$('node[!compoundNode]').move({ parent : null }); //remove child nodes from parent nodes before removing parent nodes
        this.cy.$("node[?compoundNode]").remove();
        this.coseParentNodesOnCyCore = false;
    };

    /**
     * @function removeAndAddNodesForCompoundNodes - Unfortuantely cytoscapejs cannot add compound nodes on the fly so we have to remove old nodes and add them back on with a parent property, hence this function
     */
    AIV.removeAndAddNodesForCompoundNodes = function(){
        // console.log("removeAndAddNodesForCompoundNodes 1", this.cy.elements('node[ id ^= "Protein_"]').size());
        let oldEdges = this.cy.elements('edge');
        oldEdges.remove();
        let oldNodes = this.cy.elements('node[ id ^= "Protein_"], node[ id ^= "Effector_"]');
        oldNodes.remove();

        let newNodes = [];

        // the reasoning behind having this style being updated and then removed again in the layout.stop when the cose-bilkent layout is finished is because running the layout with hidden nodes does NOT manuever the nodes around nicely (i.e. they're all in one spot); this is a workaround
        this.cy.style()
            .selector('.filterByReference')
            .style({'display': 'element'})
            .selector('.pearsonfilterEPPI')
            .style({'display': 'element'})
            .selector('.pearsonAndInterologfilterPPPI')
            .style({'display': 'element'})
            .update(); // update the elements in the graph with the new style

        // console.log("removeAndAddNodesForCompoundNodes 2", oldNodes.size());
        oldNodes.forEach(function(oldNode){
            let newData = Object.assign({}, oldNode.data()); // let us make a copy of the previous object not directly mutate it. Hopefully the JS garbage collector will clear the memory "https://stackoverflow.com/questions/37352850/cytoscape-js-delete-node-from-memory"

            let filterClasses = "";
            if (oldNode.hasClass('filterByReference')){filterClasses += "filterByReference";}
            if (oldNode.hasClass('pearsonfilterEPPI')){filterClasses += " pearsonfilterEPPI ";}
            if (oldNode.hasClass('pearsonAndInterologfilterPPPI')){filterClasses += " pearsonAndInterologfilterPPPI";}
            newData.parent = oldNode.data("localization");
            newNodes.push({
                group: "nodes",
                data: newData,
                classes: filterClasses,
            });
        });

        this.cy.add(newNodes);
        oldEdges.restore();
    };

    /**
     * @namespace {object} AIV
     * @function addDNANodesToAIVObj - Take in an object (interaction) data and add it to the 'global' state
     * @param {object} DNAObjectData - as the interaction data as it comes in the GET request i.e.
     *                                 {source: .., target:.., index: 2, ..}
     */
    AIV.addDNANodesToAIVObj = function(DNAObjectData) {
        //console.log(DNAObjectData);
        var chrNum = DNAObjectData.target.charAt(2).toUpperCase(); //if it was At2g04880 then it'd '2'
        
        var name = chrNum; // Just for 'm' and 'c'

        if (chrNum === "M") {
            name = "Mitochondria";
        }
        else if (chrNum === "C"){
            name = "Chloroplast";
        }

        //console.log("TD~ addDNANodes", DNAObjectData, "chrNum" , chrNum);
        if (AIV.chromosomesAdded.hasOwnProperty(chrNum)){
            AIV.chromosomesAdded[chrNum].push(DNAObjectData);
        }
        else { // Adding chromosome to DOM as it does not exist on app yet
            AIV.addChromosomeToCytoscape(DNAObjectData, chrNum, name);
            AIV.chromosomesAdded[chrNum] = [];
            AIV.chromosomesAdded[chrNum].push(DNAObjectData); /*NB: The DNA data edge is stored here in the AIV object property (for each chr) instead of storing it in the edges themselves*/
        }
    };

    /**
     * This will add the chromosome nodes (that represent 1+ gene in them) to the cy core
     *
     * @param {object} DNAObject - as the JSON data in object form i.e. {source: .., target:.., index: 2, ..}
     * @param {string} chrNumber - as the chromosomal number i.e. "2" or "M"
     * @param {string} chrName - as the name of the chromsome i.e. "2" or "Mitochondria"
     */
    AIV.addChromosomeToCytoscape = function(DNAObject, chrNumber, chrName) {
        this.cy.add(
            {
                group: "nodes",
                data:
                    {
                        id: "DNA_Chr" + chrNumber,
                        name: "Chr-" + chrName,
                        localization: "nucleus"
                    },
                classes: 'DNA'
            }
        );
    };

    /**
     * @namespace {object} AIV
     * @function addEdges - Add edges to the cy core, need many params here to determine the edgestyling via some of these params
     * @param {string} source - as the source protein i.e. "At2g34970"
     * @param {string} typeSource - as the type of protein it is, i.e. "effector" or "protein"
     * @param {string} target - as the target protein i.e. "At3g05230"
     * @param {string} typeTarget - as the type of protein it is, i.e. "effector" or "protein"
     * @param {string} reference - as (if it exists) a published string of the DOI or Pubmed, etc. i.e. " "doi:10.1038/msb.2011.66"" or "None"
     * @param {boolean} published - to whether this is published interaction data i.e. true
     * @param {number | string} interologConfidence  - interolog confidence number, can be negative to positive, or zero (means experimentally validated prediction) i.e. -2121
     * @param {string} databaseSource - where did this edge come from ? i.e. "BAR"
     * @param {number | string | null} R - the correlation coefficient of the coexpression data (microarray)
     * @param {string} miTermsString - string of miTerms, can be delimited by a '|'
     */
    AIV.addEdges = function(source, typeSource, target, typeTarget, reference, published, interologConfidence, databaseSource, R, miTermsString) {
        // let edge_id = typeSource + '_' + source + '_' + typeTarget + '_' + target;
        source = typeSource + '_' + source;
        target = typeTarget + '_' + target;
        let edge_id = source + '_' + target;
        // process and format mi terms, specifically, look up via dictionary the annotations
        let mi = [];
        // console.log(target);
        // console.log(miTermsString);
        // need to do a check for where the database came from as it is parsed differently and that INTACT/BIOGRID already come with MI term annotations
        if (miTermsString !== null && miTermsString !== undefined && databaseSource === "BAR"){
            let miArray = miTermsString.split('|');
            miArray.forEach(function(miTerm){
                if (AIV.miTerms[miTerm] !== undefined){
                    mi.push(`${miTerm} (${AIV.miTerms[miTerm]})`);
                }
            });
        }
        else if (databaseSource === "INTACT" || databaseSource === "BioGrid") {
            mi.push(miTermsString.replace('"', ' ')); // replace for " inside '0018"(two hybrid)'
        }
        this.cy.add([
            {
                group: "edges",
                data:
                {
                    id: edge_id,
                    source: source,
                    target: target,
                    published: published,
                    reference: published ? reference : false,
                    interologConfidence: interologConfidence,
                    pearsonR: R,
                    miAnnotated: mi,
                },
            }
        ]);
    };

    /**
     * @namespace {object} AIV
     * @function addNumberOfPDIsToNodeLabel - This function will take the name property of a DNA Chr node and parse it nicely for display on the cy core
     */
    AIV.addNumberOfPDIsToNodeLabel = function () {
        for (let chr of Object.keys(this.chromosomesAdded)) {
            let prevName = this.cy.getElementById(`DNA_Chr${chr}`).data('name');
            this.cy.getElementById(`DNA_Chr${chr}`)
                .data('name', `${prevName + "\n" + this.chromosomesAdded[chr].length + "\n"} PDIs`);
        }
    };

    /**
     * @namespace {object} AIV
     * @function setDNANodesPosition - Lock the position of the DNA nodes at the bottom of the cy app
     */
    AIV.setDNANodesPosition = function () {
        let xCoord = 50;
        let viewportWidth = this.cy.width();
        this.cy.$("node[id ^='DNA_Chr']:locked").unlock(); //if locked (for example during hide settings, unlock)
        let numOfChromosomes = Object.keys(this.chromosomesAdded).length; //for A. th. the max would be 7
        for (let chr of Object.keys(this.chromosomesAdded)) {
            let chrNode = this.cy.getElementById(`DNA_Chr${chr}`);
            chrNode.position({x: xCoord, y: this.cy.height() - (this.DNANodeSize/2 + 5) });
            chrNode.lock(); //hardset the position of chr nodes to bottom
            xCoord += viewportWidth/numOfChromosomes;
        }
    };

    /**
     * @namespace {object} AIV
     * @function resizeEListener - Resize UI listener when app is loaded, i.e. reposition the chr nodes if the browser size changes
     */
    AIV.resizeEListener = function () {
        this.cy.on('resize', this.setDNANodesPosition.bind(AIV));
    };


    
    /**
     * @namespace {object} AIV
     * @function createPDITable - We need to return a nicely formatted HTML table to be shown in the DNA tooltip. Take in an array of DNA interactions to be parsed and put appropriately in table tags
     * @param {Array.<Object>} arrayPDIdata - array of interaction data i.e. [ {source: .., target:.., index: 2, ..}, {}, {}]
     * @returns {string} - a nicely parsed HTML table
     */
    AIV.createPDItable = function (arrayPDIdata) {
        //console.log('TD~',arrayPDIdata);
        let queryPDIsInChr = {};
        let targets = [];
        let pubmedRefHashTable = {};
        let pValueHashTable = {};
        let htmlTABLE = "<div class='pdi-table-scroll-pane'><table><tbody><tr><th></th>";
        arrayPDIdata.forEach(function(PDI){ //populate local data to be used in another loop
          // dDAP-seq Added Code: Tanaya Datar
        
          // Creating the header of the table; 

          // Check if bZIP1 exists
            if (PDI.bzip1 !== undefined) {

                // Creating the header of the new column;
                let dds_source = PDI.bzip1 + "+" + "\n"  + PDI.bzip2;

                // Create a cell for the target that has a interaction with the bZIP pair
                if (!queryPDIsInChr.hasOwnProperty(dds_source)) {
                    queryPDIsInChr[dds_source] = []; //create property with name of query/source gene
                }

                // Insert the target
                queryPDIsInChr[dds_source].push(PDI.target);    
                
                //To not repeat PDI for two queries with same PDI
                if (targets.indexOf(PDI.target) === -1) {
                    targets.push(PDI.target);
                }

            }
            // Create property with name of query/source gene
            else {
                if (!queryPDIsInChr.hasOwnProperty(PDI.source)) {
                    queryPDIsInChr[PDI.source] = []; //create property with name of query/source gene
                }
                queryPDIsInChr[PDI.source].push(PDI.target);
                if (targets.indexOf(PDI.target) === -1) {//To not repeat PDI for two queries with same PDI
                    targets.push(PDI.target);
                }
                pubmedRefHashTable[`${PDI.source}_${PDI.target}`] = PDI.reference;
                pValueHashTable[`${PDI.source}_${PDI.target}`] = PDI.interolog_confidence;
    
            }
        });
         
        for (let protein of Object.keys(queryPDIsInChr)) { //add query proteins to the header of table
            htmlTABLE += `<th>${protein}<br>(${queryPDIsInChr[protein].length} PDIs)</th>`;
        }
        
        // Inserting the dDAP-seq image and inserting the JBrowse Link only for targets of the dDAP-seq
        htmlTABLE += "</tr>";
        targets.forEach(function(targetDNAGene){ //process remaining rows for each target DNA gene
            htmlTABLE += `<tr><td>${targetDNAGene}</td>`;
            for (let queryGene of Object.keys(queryPDIsInChr)) { //recall the keys are the source (i.e. query genes)

              if (queryGene.includes("+")) {
                    let sources = queryGene.split('+')
                    let cellContent = '';

                    // Process the links for DDAP targets only
                    if (queryPDIsInChr[queryGene].includes(targetDNAGene)) {

                    
                       // Inserting the dDAP-seq image for the dDAP
                        cellContent += `<td style="background-color: #E8E8E8; text-align: center; width: 30px; height: 30px;">
                              <img src="./images/updated_dDAP_symbol.png"
                    
                                   style="max-width: 100%; max-height: 100%; display: block; margin: auto; cursor: pointer;"
                                   id='ddap' data-target_dna=${targetDNAGene} data-source_1_gene=${sources[0]} data-source_2_gene=${sources[1]}>
                                    </td>
                                   
                          `; 
                        // Add event listener for the image click
                       cellContent += `
                       <script>
                          
                             
document.addEventListener("click", function(event) {
                            if (event.target.id === "ddap") {
                             function getbZIP(agi) {
                            //console.log('TD~here')
                            const bZIP_AGI_Map = {
                              "At5g49450": "bZIP1",
                              "At4g02640": "bZIP10",
                              "At5g24800": "bZIP9",
                              "At4g34590": "bZIP11",
                              "At3g54620": "bZIP25",
                              "At5g28770": "bZIP63",
                              "At2g18160": "bZIP2",
                              "At1g75390": "bZIP44",
                              "At3g62420": "bZIP53"
                            };
                              return bZIP_AGI_Map[agi] || "AGI not found";
                            }
                               
                             let target_dna = event.target.dataset.target_dna
                             let  source_1_gene= event.target.dataset.source_1_gene
                             let  source_2_gene= event.target.dataset.source_2_gene
                             
                             // Obtaining the AGIs of bZIPs involved
                             AGI_bZIP1 = getbZIP(source_1_gene) 
                             AGI_bZIP2 = getbZIP(source_2_gene)
                             console.log('TD~target',target_dna,source_1_gene,source_2_gene,AGI_bZIP1,AGI_bZIP2); 
                             // Obtaining the chrnum,start and end nucleotide by calling API passing in targetgene
                             let serviceURL = 'https://bar.utoronto.ca/api/gene_information/single_gene_query/arabidopsis/' + target_dna;
                             console.log('TD~service',serviceURL)

                              $.ajax({
                                url: serviceURL,
                                type: 'GET',
                                success: function(res) {
                                  console.log('Success:', res);
                                  console.log('TD~target',target_dna)
                                  let returned_info = res["data"]
                                  for (let targetGene of Object.keys(returned_info)) {
                                    let locus_start = returned_info[targetGene]["start"]
                                    let locus_end = returned_info[targetGene]["end"]
                                    let chr_num = returned_info[targetGene]["chromosome"]
                                    let strand = returned_info[targetGene]["strand"]
                                    chr_num = chr_num.replace(/Chr/g,"")
                                    console.log("TD~start",locus_start,locus_end,chr_num,strand) 

                              // Generate the link based on row and column indices
                              // let generatedLink =   'http://hlab.bio.nyu.edu/?data=projects/bzip_code_jbrowse&loc='  + chr_num + ':' + locus_start + '..' + locus_end + '&tracks=gem_07_rep/bZIP..bZIP_rr/ps-' + AGI_bZIP1 + '..ph-' + AGI_bZIP2 + '_Col..h-B/nuc1_GEM_events,Araport11_Ensembl48_genes,bowtie2_23/bZIP..bZIP_rr/ps-' + AGI_bZIP1 + '..ph-' + AGI_bZIP2 + '_Col..h-B_p1,bowtie2_23/bZIP..bZIP_rr/ps-' + AGI_bZIP1 + '..ph-' +  AGI_bZIP2 + '_Col..h-B_p2&highlight='

  // http://hlab.bio.nyu.edu/?data=projects:bzip_code_jbrowse&loc=2:17927265..17928985&tracks=Araport11_Ensembl48_genes,gem_07_rep:bZIP..bZIP_rr:ps-bZIP11..ph-bZIP63_Col..h-B:nuc1_GEM_events,bowtie2_23:bZIP..bZIP_rr:ps-bZIP11..ph-bZIP63_Col..h-B_p1,bowtie2_23:bZIP..bZIP_rr:ps-bZIP11..ph-bZIP63_Col..h-B_p2&highlight=
                              // var baseUrl = 'http://hlab.bio.nyu.edu/?data=projects/bzip_code_jbrowse&loc=';
                              // var query = chr_num + ':' + locus_start + '..' + locus_end + '&tracks=Araport11_Ensembl48_genes,gem_07_rep' + ':' + 'bZIP..bZIP_rr:ps-' + AGI_bZIP1 + '..ph-' + AGI_bZIP2 + '_Col..h-B:nuc1_GEM_events,bowtie2_23:bZIP..bZIP_rr:ps-' + AGI_bZIP1 +'..ph-' + AGI_bZIP2 +'_Col..h-B_p2&highlight=';

                              // var completeUrl = baseUrl + encodeURIComponent(query);
                              var baseUrl = 'http://hlab.bio.nyu.edu/?data=projects%2Fbzip_code_jbrowse&loc=';



// var query = encodeURIComponent(chr_num) + '%3A' + encodeURIComponent(locus_start) + '..' + encodeURIComponent(locus_end) + 
//             '&tracks=Araport11_Ensembl48_genes%2Cgem_07_rep%2FbZIP..bZIP_rr%2Fps-' + 
//             encodeURIComponent(AGI_bZIP2) + '..ph-' + encodeURIComponent(AGI_bZIP1) + '_Col..h-B%2Fnuc1_GEM_events%2C' +
//             'bowtie2_23%2FbZIP..bZIP_rr%2Fps-' + encodeURIComponent(AGI_bZIP2) + '..ph-' + encodeURIComponent(AGI_bZIP1) + '_Col..h-B_p1%2C' +
//             'bowtie2_23%2FbZIP..bZIP_rr%2Fps-' + encodeURIComponent(AGI_bZIP2) + '..ph-' + encodeURIComponent(AGI_bZIP1) + '_Col..h-B_p2&highlight=';

// var completeUrl = baseUrl + query;

                        if (strand === "-") {

                          
var query = encodeURIComponent(chr_num) + '%3A' + encodeURIComponent(locus_end - 1000) + '..' + encodeURIComponent(locus_end + 1000) + 
            '&tracks=Araport11_Ensembl48_genes%2Cgem_07_rep%2FbZIP..bZIP_rr%2Fps-' + 
            encodeURIComponent(AGI_bZIP2) + '..ph-' + encodeURIComponent(AGI_bZIP1) + '_Col..h-B%2Fnuc1_GEM_events%2C' +
            'bowtie2_23%2FbZIP..bZIP_rr%2Fps-' + encodeURIComponent(AGI_bZIP2) + '..ph-' + encodeURIComponent(AGI_bZIP1) + '_Col..h-B_p1%2C' +
            'bowtie2_23%2FbZIP..bZIP_rr%2Fps-' + encodeURIComponent(AGI_bZIP2) + '..ph-' + encodeURIComponent(AGI_bZIP1) + '_Col..h-B_p2&highlight=';

var completeUrl = baseUrl + query;


                          console.log(locus_end - 1000, locus_end + 1000);

            } else {
             

var query = encodeURIComponent(chr_num) + '%3A' + encodeURIComponent(locus_start - 1000) + '..' + encodeURIComponent(locus_start + 1000) + 
            '&tracks=Araport11_Ensembl48_genes%2Cgem_07_rep%2FbZIP..bZIP_rr%2Fps-' + 
            encodeURIComponent(AGI_bZIP2) + '..ph-' + encodeURIComponent(AGI_bZIP1) + '_Col..h-B%2Fnuc1_GEM_events%2C' +
            'bowtie2_23%2FbZIP..bZIP_rr%2Fps-' + encodeURIComponent(AGI_bZIP2) + '..ph-' + encodeURIComponent(AGI_bZIP1) + '_Col..h-B_p1%2C' +
            'bowtie2_23%2FbZIP..bZIP_rr%2Fps-' + encodeURIComponent(AGI_bZIP2) + '..ph-' + encodeURIComponent(AGI_bZIP1) + '_Col..h-B_p2&highlight=';

var completeUrl = baseUrl + query;

                            console.log(locus_start - 1000, locus_start + 1000);
            }



                              console.log('TD~final',completeUrl);



                                // console.log('TD~final',generatedLink)
                                event.stopImmediatePropagation(); // Prevent other handlers
                                window.open(completeUrl, "_blank");
                                

                              } 
                    },// success res
        error: function(jqXHR, textStatus, errorThrown) {
            console.log('Error:', textStatus, errorThrown);
        }
    });// ajax
             
                    } // if ddap  
                          });// Event listener
                          
                       </script>
                    
                   `;  
                        //console.log('TD~ Cell content',targetDNAGene,cellContent)
                    }
                    else {
                        cellContent += '<td> '; 
                        //console.log('TD~ In else',targetDNAGene,cellContent)
                    }
                    
                    cellContent += '</td>'; 
                    //console.log("TD~ Cell:",cellContent);
                    htmlTABLE += cellContent;
                }
                else {
                    if (queryPDIsInChr[queryGene].indexOf(targetDNAGene) !== -1) { //indexOf returns -1 if not found
                        let cellContent = "<td>";
                        let fontawesome = '';
                        if (pValueHashTable[queryGene + '_' + targetDNAGene] === 0){ //i.e. experimental PDI
                           cellContent = "<td class='experimental-pdi-cell'>";
                           fontawesome = 'flask';
                           if (pubmedRefHashTable[queryGene + '_' + targetDNAGene] === "doi:10.1016/j.cell.2016.04.038"){ // TODO: change this to  DAP-Seq PMID once db is updated
                               fontawesome = 'dna';
                           }
                        }
                        else if (pValueHashTable[queryGene + '_' + targetDNAGene] > 0){ // i.e. predicted PDI
                            cellContent = "<td class='predicted-pdi-cell'>";
                            fontawesome = 'terminal';
                        }
                        AIV.memoizedSanRefIDs(pubmedRefHashTable[queryGene + '_' + targetDNAGene]).forEach(function(ref){
                            cellContent += AIV.memoizedRetRefLink(ref, targetDNAGene, queryGene).replace(/("_blank">).*/, "$1") + /* replace innerHTML text returned */
                                `<i class="fas fa-${fontawesome}"></i>` +
                                '</a>';
                        });
                        htmlTABLE += cellContent + '</td>';
                    }
                    else {
                        htmlTABLE += '<td></td>';
                    }
                }
            }
            htmlTABLE += "</tr>"; 
        });
        htmlTABLE += "</tbody></table></div>";
        // console.log("finished createPDITable function execution", queryPDIsInChr);
        return htmlTABLE;
    };

    /**
     * @namespace {object} AIV
     * @function addChrNodeQTips -  Add qTips (tooltips) to 'Chromosome' Nodes
     * Note we have to run a for loop on this to check where to add the qTips.
     * Moreover the text is created from another function which will nicely return a HTML table
     */
    AIV.addChrNodeQtips = function () {
        let that = this;
        AIV.memoizedPDITable = _.memoize(this.createPDItable);
        //console.log('TD~chradded',this.chromosomesAdded)
        for (let chr of Object.keys(this.chromosomesAdded)){
            // console.log(this.chromosomesAdded[chr], `chr${chr}`);
            this.cy.on('mouseover', `node[id^='DNA_Chr${chr}']`, function(event){
                var chrNode = event.target;
                chrNode.qtip(
                    {
                        content:
                            {
                                title :
                                    {
                                        text :`Chromosome ${chr}`,
                                        button: 'Close' //close button
                                    },
                                text: AIV.memoizedPDITable(that.chromosomesAdded[chr])
                            },
                        style    : { classes : 'qtip-light qtip-dna'},
                        show:
                            {
                                solo : true, //only one qTip at a time
                                event: `${event.type}`, // Same show event as triggered event handler
                                ready: true, // Show the tooltip immediately upon creation
                            },
                        hide : false // Don't hide on any event except close button
                    }
                );
            });
        }
    };

    /**
     * @namespace {object} AIV
     * @function - addProteinNodeQtips Add qTips (tooltips) to the protein nodes.
     *
     * Note the function definition as the text. This means that this function will be run when hovered
     * Namely we check the state of the AJAX call for that particular protein to decide whether to
     * make another AJAX call or to simply load the previously fetched data
     */
    AIV.addProteinNodeQtips = function() {
        this.cy.on('mouseover', 'node[id^="Protein"]', function(event) {
            let protein = event.target;
            let agiName = protein.data("name");
            let exprOverlayChkbox = document.getElementById('exprnOverlayChkbox');
            protein.qtip(
                {
                    overwrite: false, //make sure tooltip won't be overriden once created
                    content  : {
                                    title :
                                        {
                                            text : "Protein " + agiName,
                                            button: 'Close'
                                        },
                                    text :
                                        function(event, api) {
                                            let HTML = "";
                                            HTML += AIV.showDesc(protein);
                                            HTML += AIV.showSynonyms(protein);
                                            HTML += `<p>${AIV.showMapMan(protein)}</p>`;
                                            HTML += `<p>${AIV.displaySUBA4qTipData(protein)}</p>`;
                                            if (AIV.exprLoadState.absolute && exprOverlayChkbox.checked){
                                                HTML += `<p>Mean Expr: ${protein.data('absExpMn')}</p>
                                                         <p>SD Expr:   ${protein.data('absExpSd')}</p>`;
                                            }
                                            if (AIV.exprLoadState.relative && exprOverlayChkbox.checked){
                                                HTML += `<p>Log2 Expr: ${protein.data('relExpLog2')}</p>
                                                         <p>Fold Expr: ${protein.data('relExpFold')}</p>`;
                                            }
                                            return HTML;
                                        }
                                },
                    style    : { classes : 'qtip-light qtip-protein-node'},
                    show:
                        {
                            solo : true,
                            event: `${event.type}`, // Use the same show event as triggered event handler
                            ready: true, // Show the tooltip immediately upon creation
                            delay: 300 // Don't hammer the user with tooltips as s/he is scrollin over the graph
                        },
                    hide : false
                }
            );
        });
    };

    /**
     * @function parseProteinNodes - parse through every protein (non-effector) node that exists in the DOM and perform the callback function on each node
     * @param {function} cb -  callback function
     * @param {boolean} [needNodeRef=false] - optional boolean to determine if callback should be performed on node object reference
     */
    AIV.parseProteinNodes = function(cb, needNodeRef=false){
        this.cy.filter("node[id ^= 'Protein_At']").forEach(function(node){
            let nodeID = node.data('name');
            if (nodeID.match(/^AT[1-5MC]G\d{5}$/i)) { //only get AGI IDs, i.e. exclude effectors
                if (needNodeRef){
                    cb(node);
                }
                else{
                    cb(nodeID);
                }
            }
        });
    };

    /**
     * @function showALias - helper function to decide whether or not to show desc on protein qTip
     * @param {object} protein - reference to the particular protein which we are adding a qTip
     * @returns {string} - a nicely formmated HTML string
     */
    AIV.showDesc = function(protein) {
        let desc = protein.data('desc');
        if (!desc){ return ""; } //exit if undefined
        return `<p>Annotation: ${desc}</p>`;
    };

    /**
     * @function showSynonyms - helper function to decide whether or not to show alias on protein qTip
     * @param {object} protein - reference to the particular protein which we are adding a qTip
     * @returns {string} - a nicely formmated HTML string
     */
    AIV.showSynonyms = function(protein) {
        let syns = protein.data('synonyms');
        if (!syns){ return ""; } //exit if undefined
        return `<p>Synoynms: ${syns}</p> <hr>`;
    };

    /**
     * @function showMapMan - helper function to decide whether or not to show MapMan on protein qTip
     * @param {object} protein - reference to the particular protein which we are adding a qTip
     * @returns {string} - a nicely formmated HTML string of its mapman codes
     */
    AIV.showMapMan = function(protein) {
        let mapManNums = protein.data('numOfMapMans');
        if (!mapManNums){ return ""; } //exit if undefined
        let baseString = "";
        for (let i = 1; i < ( mapManNums + 1 ) ; i++) {
            baseString += `<p> MapMan Code ${i} : ` + protein.data('MapManCode' + i) + '</p>' + `<p> MapMan Annotation ${i} : ` + protein.data('MapManName' + i) + '</p>';
        }
        baseString += "<hr>";
        // console.log(baseString);
        return baseString;
    };

    /**
     * @function displaySUBA4qTipData - helper function to decide whether or not to show SUBA4 html table on protein qTip, if so it will add a data property to a node such that it will be ready for display via qTip
     * @param {object} protein - reference to the particular protein which we are adding a qTip
     * @returns {string} - a nicely formmated HTML string of a node's localizations in PCT form
     */
    AIV.displaySUBA4qTipData = function(protein) {
        let locData = protein.data('localizationData');
        if (!locData) {return "";} //exit if undefined
        let baseString = "";
        for (let i = 0; i < locData.length ;i++){
            let locPercent = Object.values(locData[i])[0];
            if (locPercent > 0) {
                baseString += `<p>${Object.keys(locData[i])[0]}: ${(locPercent*100).toFixed(1)}%</p>`;
            }
        }
        return baseString;
    };

    /**
     * @namespace {object} AIV
     * @function addEffectorNodeQtips - Add qTips (tooltips) to effector nodes, this should simply just show the name when hovered over
     */
    AIV.addEffectorNodeQtips = function() {
        this.cy.on('mouseover', 'node[id^="Effector"]', function(event) {
            var effector = event.target;
            effector.qtip(
                {
                    overwrite: false, //make sure tooltip won't be overriden once created
                    content  : {
                        title :
                            {
                                text : "Effector " + effector.data("name"),
                                button: 'Close'
                            },
                        text: " "
                    },
                    style    : { classes : 'qtip-light qtip-effector-node'},
                    show:
                        {
                            solo : true,
                            event: `${event.type}`, // Use the same show event as triggered event handler
                            ready: true, // Show the tooltip immediately upon creation
                        },
                    hide : false
                }
            );
        });
    };


    /**
     * @namespace {object} AIV
     * @function createPPIEdgeText - decides whether to show the docker link or not based on the interolog confidence (based on whether it is IFF the interolog confidence is negative). Then use the 3 params to create an external link elsewhere on the BAR.
     *
     * @param {string} source - as the source protein in AGI form i.e. "At3g10000"
     * @param {string} target - as the target protein in AGI form i.e. "At4g40000"
     * @param {string} reference - string of DOI or PMIDs, delimited by \n, i.e. "doi:10.1126/science.1203659 \ndoi:10.1126/science.1203877".. whatever came through the GET request via 'reference' prop
     * @param {number|string} interologConf - represents the interolog confidence value of the PPI, can be "NA" if the edge is from INTACT/BioGrid
     */
    AIV.createPPIEdgeText = (source, target, reference, interologConf) => {
        let modifyProString = string => string.replace(/PROTEIN_/gi, '').toUpperCase();

        var refLinks = "";
        if (reference) { //non-falsy value (we may have changed it to false in the addEdges() call)
            AIV.memoizedSanRefIDs( reference ).forEach(function(ref){
                refLinks += '<p> Ref: ' + AIV.memoizedRetRefLink(ref, target, source) + '</p>';
            });
        }

        if (interologConf >= 0 ) {
            return refLinks; //can be "" or have a bunch of links..., "NA" should return ""
        }
        else { //if interlog confidence is less than zero, show external docker link
            return "<p><a href='https://bar.utoronto.ca/protein_docker/?id1=" + modifyProString(source) + "&id2=" + modifyProString(target) + "' target='_blank'> " + "Predicted Structural Interaction " + "</a></p>" + refLinks;
        }
    };


    /**
     * @namespace {object} AIV
     * @function addPPIEdgeQtips - Add qTips (tooltips) to protein protein interaction edges, also adds qTips to protein-effector edges
     */
    AIV.addPPIEdgeQtips = function() {
        let that = this;
        this.cy.on('mouseover', 'edge[source^="Protein"][target^="Protein"], edge[source^="Protein"][target^="Effector"], edge[source^="Effector"][target^="Protein"]', function(event){
            let ppiEdge = event.target;
            let edgeData = ppiEdge.data();
            ppiEdge.qtip(
                {
                    content:
                        {
                            title:
                                {
                                    text: edgeData.source.replace("_", " ") + " to " + edgeData.target.replace("_", " "),
                                    button: "Close"
                                },
                            text : that.createPPIEdgeText( edgeData.source, edgeData.target, edgeData.reference, edgeData.interologConfidence ) +
                            (edgeData.interologConfidence >= 1 ? `<p>Interolog Confidence: ${edgeData.interologConfidence}</p>` : "") + //ternary operator return the interolog confidence value only not the SPPI rank
                            `<p>Correlation Coefficient: ${edgeData.pearsonR} </p>` +
                            (edgeData.miAnnotated.length > 0 ? `<p>MI Term(s): ${edgeData.miAnnotated.join(', ')} </p>` : ""),
                        },
                    style  : { classes : 'qtip-light qtip-ppi-edge' },
                    show:
                        {
                            solo : true,
                            event: `${event.type}`, // Use the same show event as triggered event handler
                            delay: 500
                        },
                    hide : false
                }
            );
        });
    };

    /**
     * @namespace {object} AIV
     * @function sanitizeReferenceIDs - Process the pubmed IDs and DOIs that come in from the interactions request. This will return an array of links (as strings). We have to check for empty strings before returning.
     *
     * @param {string} JSONReferenceString - as a string of links delimited by newlines "\n"
     */
    AIV.sanitizeReferenceIDs = function(JSONReferenceString) {
        //console.log('JSONRefString',JSONReferenceString)
        if (JSONReferenceString !== undefined) {
        let returnArray = JSONReferenceString.split("\n");
        returnArray = returnArray.filter(item => item !== '');
        // console.log("sanitized ,", returnArray);
        return returnArray;
        }
        return 
    };

    /**
     * @namespace {object} AIV
     * @function memoizedSanRefIDs - memoized version of the sanitizeReferenceIDs pure function for performance
     * @param {Function} AIV.returnReferenceLink - sanitizeReferenceIDs function defintiion
     */
    AIV.memoizedSanRefIDs = _.memoize(AIV.sanitizeReferenceIDs);

    /**
     * @namespace {object} AIV
     * @function returnReferenceLink -
     * This function expects to receive a string which either 'references' a
     * 1) PubMedID (PubMed)
     * 2) MINDID (Membrane based Interacome Network) ** We use AGIIdentifier for this as MIND search query does not go by Id.. **
     * 3) AI-1 ID (Arabidopsis interactome project)
     * 4) DOI reference hotlink
     * 5) BioGrid interaction ID
     * 6) BINDID (Biomolecular Interaction Network Database, NOTE: Not live as of Nov 2017)
     * @param {string} referenceStr - as the link given to the function that could be any the of above or none
     * @param {string} AGIIdentifier - is used for the biodb link (target gene)
     * @param {string} TF - AGI for query/TF gene, used for DAP-Seq link
     * @return {string} - a link from the above list
     */
    AIV.returnReferenceLink = function(referenceStr, AGIIdentifier, TF) {
        //console.trace(referenceStr, AGIIdentifier, TF);
        let regexGroup; //this variable necessary to extract parts from the reference string param
        let db = referenceStr.match(/^([A-Z]+)-*/i)[1] + " - ";
        if ( (regexGroup = referenceStr.match(/PubMed[:]?(\d+)$/i)) ) { //assign and evaluate if true immediately
            return `<a href="https://www.ncbi.nlm.nih.gov/pubmed/${regexGroup[1]}" target="_blank"> ${db} PMID ${regexGroup[1]}</a>`;
        }
        else if ( (regexGroup = referenceStr.match(/Mind(\d+)$/i)) ){
            return `<a href="http://biodb.lumc.edu/mind/search_results.php?text=${AGIIdentifier}&SubmitForm=Search&start=0&count=25&search=all" target="_blank"> ${db} MIND ID ${regexGroup[1]}</a>`;
        }
        else if ( (regexGroup = referenceStr.match(/AI-1.*$/i)) ){
            return `<a href="http://interactome.dfci.harvard.edu/A_thaliana/index.php" target="_blank"> ${db} (A. th. Interactome) ${referenceStr} </a>`;
        }
        else if ( (regexGroup = referenceStr.match(/doi:(.*)/i)) ){
            if (regexGroup[0] === "doi:10.1016/j.cell.2016.04.038"){
                console.log(regexGroup, AGIIdentifier, TF);
                return `<a href="https://bar.utoronto.ca/DAP-Seq-API?target=${AGIIdentifier}&tf=${TF}" target="_blank"> DAP-Seq (O'Malley 2016)</a>`
            }
            return `<a href="https://dx.doi.org/${regexGroup[1]}" target="_blank"> ${db} DOI ${regexGroup[1]} </a>`;
        }
        else if ( (regexGroup = referenceStr.match(/biogrid:(.*)/i)) ){
            return `<a href="https://thebiogrid.org/interaction/${regexGroup[1]}" target="_blank"> ${db} BioGrid ${regexGroup[1]}</a>`;
        }
        else if ( (regexGroup = referenceStr.match(/(\d+)/)) ) { //for BIND database (now closed)
            return `<a href="https://academic.oup.com/nar/article/29/1/242/1116175" target="_blank"> ${db} BIND ID ${referenceStr}</a>`;
        }
    };

    /**
     * @namespace {object} AIV
     * @function memoizedRetRefLink - memoized version of the returnReferenceLink pure function for performance
     * @param {Function} AIV.returnReferenceLink - returnReferenceLink function defintiion
     */
    AIV.memoizedRetRefLink = _.memoize(AIV.returnReferenceLink, function(){
        if (arguments[0] === "doi:10.1016/j.cell.2016.04.038"){ // TODO: change this to PMID of dap-seq paper
            return JSON.stringify(arguments)
        }
        else {
            return JSON.stringify(arguments[0])
        }
    });

    /**
     * @namespace {object} AIV
     * @function parseBARInteractionsData -
     * This function parses interactions for the BAR interactions API data, namely in these ways:
     * Create an outer for loop (run N times where N is the # of genes in the user form):
     * I  ) Assign dataSubset variable to be all the genes connected to a single form gene
     * II ) Then create an inner for loop to add the interacting nodes:
     * i  ) Add interactive node to the cy core.
     * ii ) Add the edges for all interactions
     * iia) Make sure not to double add edges and double add nodes
     * iib) Get the line styles, width and colours as well based on parameters such as correlation
     *      coefficient and interolog confidence that were returned in the request
     * iii) Filter based on the edges such to sort PDI and PPIs.
     * iv ) After all this is finished, we run a bunch of functions that add qTips and Styling
     * @param {object} data - response JSON we get from the get_interactions_dapseq PHP webservice at the BAR
     */
    AIV.parseBARInteractionsData = function(data) {
        //console.log('TD~ Sent data',data);
            
        let publicationsPPIArr = []; //local variable to store all unique publications that came from the JSON
        for (let geneQuery of Object.keys(data)) {
            //console.log('parseBar->geneQuery',geneQuery);
            if (geneQuery === 'Double_Dap_Seq') {
                continue
            }    
            let dataSubset = data[geneQuery]; //'[]' expression to access an object property
            //console.log('TD~Datasubset is:',dataSubset)
            // Add Nodes for each query
            for (let i = 0; i < dataSubset.length; i++) {
                let typeSource = '';
                let typeTarget = '';
                let width = '5'; // Default edge width
                let edgeData = dataSubset[i]; // Data from the PHP API comes in the form of an array of PPIs/PDIs hence this variable name
                let dbSrc = "BAR";

                let {index, source, target, reference, published, interolog_confidence, correlation_coefficient, mi} = edgeData;

                // Source, note that source is NEVER DNA
                if (source.match(/^AT[1-5MC]G\d{5}$/i)) {
                    typeSource = 'Protein';
                } else {
                    typeSource = 'Effector';
                }
                //console.log('TD~typeSource',typeSource)  
                // Target
                if (target.match(/^AT[1-5MC]G\d{5}$/i)) {
                    if (index === '2') {
                        typeTarget = 'DNA';
                    } else {
                        typeTarget = 'Protein';
                    }
                } else {
                    typeTarget = 'Effector';
                }
                //console.log('TD~typeTarget',typeTarget)
                //Build publication array for dropdown later
                if (publicationsPPIArr.indexOf(reference) === -1){
                    if (typeTarget === 'Protein' || typeTarget === 'Effector'){
                        publicationsPPIArr.push(reference);
                    }
                }
                // reformat the reference string to have the database name preappended to it with '-', keep newline delimiter
                reference = reference.split('\n').map(x => dbSrc + "-" + x).join('\n');

                // Coerce scientific notation to fixed decimal point number
                interolog_confidence = scientificToDecimal(interolog_confidence);

                if (typeTarget === "Protein" || typeTarget === "Effector") {
                    if ( AIV.cy.getElementById(`${typeSource}_${source}`).empty()) { //only add source node if not already on app, recall our ids follow the format Protein_At2g10000
                        this.addNode(source, typeSource);
                    }
                    if ( AIV.cy.getElementById(`${typeTarget}_${target}`).empty()) {
                        this.addNode(target, typeTarget);
                    }
                } else { //i.e. typeTarget === "DNA"
                    //console.log('TD~addDNA',edgeData)
                    //TD~Mar23 Check that source is in the geneList starts
                    if(this.genesList.includes(source)) {
                      this.addDNANodesToAIVObj(edgeData); //pass the DNA in the JSON format we GET on
                    }
                    //TD~Mar23 Check that source is in the geneList ends
                }

                if (index !== '2') { //i.e. PPI edge
                    let edgeSelector = `${typeSource}_${source}_${typeTarget}_${target}`;
                    if ( AIV.cy.$id(edgeSelector).empty() ) { //Check if edge already added from perhaps the PSICQUIC webservices
                        this.addEdges(source, typeSource, target, typeTarget, reference, published, interolog_confidence, dbSrc, correlation_coefficient, mi);
                    }
                    else { //PSICQUIC edges added first
                        if (mi !== null && mi !== undefined){
                            let tempMiArr = [];
                            let miArray = mi.split('|');
                            miArray.forEach(function(miTerm){
                                if (AIV.miTerms[miTerm] !== undefined){
                                    tempMiArr.push(`${miTerm} (${AIV.miTerms[miTerm]})`);
                                }
                            });
                            AIV.cy.$id(edgeSelector).data({'miAnnotated' : AIV.cy.$id(edgeSelector).data('miAnnotated').concat(tempMiArr)}); // append new miTerm to current arr
                        }
                        AIV.cy.$id(edgeSelector).data({
                            reference : reference,
                            interologConfidence : interolog_confidence,
                            pearsonR : correlation_coefficient,
                            published : true, // must be true if PSICQUIC edges loaded
                        });
                    }
                }
                else if ( index === '2') { // PDI edge
                    if (this.cy.getElementById(`${typeSource}_${source}_DNA_Chr${target.charAt(2)}`).length === 0){ // If we don't already have an edge from this gene to a chromosome
                        this.addEdges(source, typeSource, `Chr${target.charAt(2)}`, typeTarget /*DNA*/, reference, published, interolog_confidence, dbSrc, correlation_coefficient, mi);
                    }
                }
            }
        } //end of adding nodes and edges
            



        let filteredPubsArr = [].concat.apply([], publicationsPPIArr.map(function (innerArr) {
            return innerArr.split('\n').filter(function (item) {
                // if we have MIND/BIOGRID/BIND identifiers, filter them out as they're not really references for building our dropdown list
                if (!item.match(/biogrid:(.*)/i) && !item.match(/Mind(\d+)$/i) && !item.match(/^(\d+)$/i)){
                    return item;
                }
            });
        }));
        let uniquefilteredPubsArr = Array.from(new Set(filteredPubsArr)); // remove duplicates
        this.buildRefDropdown(uniquefilteredPubsArr);

        /**
         * @function scientificToDecimal - Helper function to turn scientific notation nums to integer form more nicely than using toFixed(), credits to https://gist.github.com/jiggzson/b5f489af9ad931e3d186
         * @param num - number
         * @return num - in integer form if num was originally in scientific notation
         */
        function scientificToDecimal(num) {
            //if the number is in scientific notation remove it
            if(/\d+\.?\d*e[\+\-]*\d+/i.test(num)) {
                let zero = '0',
                    parts = String(num).toLowerCase().split('e'), //split into coeff and exponent
                    e = parts.pop(),//store the exponential part
                    l = Math.abs(e), //get the number of zeros
                    sign = e/l,
                    coeff_array = parts[0].split('.');
                if(sign === -1) {
                    num = zero + '.' + new Array(l).join(zero) + coeff_array.join('');
                }
                else {
                    let dec = coeff_array[1];
                    if(dec) { l = l - dec.length }
                    num = coeff_array.join('') + new Array(l+1).join(zero);
                }
            }

            return num;
        }    
    //TD~Mar23add code for DDS
    let DDS_data = data.hasOwnProperty("Double_Dap_Seq")?data["Double_Dap_Seq"]:undefined;
      if(DDS_data != undefined) {    
        //console.log("DDS Data", DDS_data);
        for (let i = 0 ; i < DDS_data.length; i++) {

            //TD~Mar23~Check and change target gene case starts
            DDS_data[i].bzip1 = DDS_data[i].bzip1.charAt(0) + DDS_data[i].bzip1.substring(1).toLowerCase();
            
            DDS_data[i].bzip2 = DDS_data[i].bzip2.charAt(0) + DDS_data[i].bzip2.substring(1).toLowerCase();    

            DDS_data[i].target = DDS_data[i].target.charAt(0) + DDS_data[i].target.substring(1).toLowerCase();

            //find if bzip1 is in genesList
            //console.log("TD~GenesList",this.genesList)
            if (this.genesList.includes(DDS_data[i].bzip1) || this.genesList.includes(DDS_data[i].bzip2)) {
              let edgeData = DDS_data[i];
              let { bzip1, bzip2, target } = edgeData;
              this.addDNANodesToAIVObj(edgeData);
            }
            
            //TD~Mar23~Check and change target gene case ends
            
        }    
        //console.log('TD~ At the end data',AIV.Double_Dap_Seq)
      } // if dds_data ends
    };

    /**
     * @namespace {object} AIV
     * @function buildRefDropdown - helper function that will build the dynamic reference dropdown, take in an array of PPI ref strings
     * @param arrayOfPubs - an array of publications for ex, ["None", "PubMed19095804", ...]
     */
    AIV.buildRefDropdown = function(arrayOfPubs){
        let tempArrPubs = arrayOfPubs;
        let whereNoneIs = tempArrPubs.indexOf('None');
        if (whereNoneIs !== -1){ //remove "None" from our list of publications...
            tempArrPubs.splice(whereNoneIs, 1);
        }
        let inputsLabelsHTML = "";
        tempArrPubs.forEach(function(ref){
            if (! document.getElementById(`${ref}-checkbox`)){ // check if DOM node exists before appending
                let bindIDText = "";
                if (ref.match(/^\d+$/)){
                    bindIDText = "BIND ID ";
                }
                inputsLabelsHTML +=
                    `
                    <label for="${ref}-checkbox">
                        <input type="checkbox" id="${ref}-checkbox" class="ref-checkbox" value="${ref}" checked>
                        ${bindIDText + ref}
                    </label>
                    `;
            }
        });
        $('#refCheckboxes').append(inputsLabelsHTML);
    };

    /**
     * @namespace {object} AIV
     * @function - parsePSICQUICInteractionsData - Take in non-BAR PSICQUICdata param which is the text response we get back from the AJAX call and parse it via regex (based on whether it is from INTACT or BioGrid). Then add unique edges and nodes. NOTE: PSICQUIC data can have more than one entry/evidence for a single edge (resulting in multiple lines for single the interacting protein)
     * @param {string} PSICQUICdata - should be a bunch of PSICQUIC formatted text
     * @param {string} queryGeneAsAGI - should be something like "At3g10000"
     * @param {string} INTACTorBioGrid - should either be "INTACT" or "BioGrid"
     */
    AIV.parsePSICQUICInteractionsData = function(PSICQUICdata, queryGeneAsAGI, INTACTorBioGrid){
        // INTACT and BioGrid PPIs are experimentally validated by default hence these 3 colors, style, width

        let regex;
        if (INTACTorBioGrid === "INTACT") {
            // example uniprotkb:(?!At3g18130)(At\d[gcm]\d{5})\(locus.*psi-mi:"MI:(\d+"\(.*?\)).*(pubmed:\d+) WITH GI flags!
            regex = new RegExp("uniprotkb:(?!" + queryGeneAsAGI +")(At\\d[gcm]\\d{5})\\(locus.*psi-mi:\"MI:(\\d+\"\\(.*?\\)).*(pubmed:\\d+)", "gi");
        }
        else if (INTACTorBioGrid === "BioGrid"){
            // example \|entrez gene\/locuslink:(?!At3g18130)(At\d[gcm]\d{5})[\t|].*psi-mi:"MI:(\d+"\(.*?\)).*(pubmed:\d+) WITH GI flags!
            regex = new RegExp("\\|entrez gene\\/locuslink:(?!" + queryGeneAsAGI + ")(At\\d[gcm]\\d{5})[\\t|].*psi-mi:\"MI:(\\d+\"\\(.*?\\)).*(pubmed:\\d+)", "gi");
        }

        let match;
        let arrPPIsProteinsRaw = []; // array will be populated with ABI identifiers of genes that interact with the queryGeneAsAGI via regex...
        let miTermPSICQUIC = []; // array to be populated with MI terms with their annotations i.e. ['0018"(two hybrid)', ...]
        let pubmedIdArr = []; // array to store string of pubmed IDs

        /*
        Do not place the regular expression literal (or RegExp constructor) within the while condition or it will create an infinite loop if there is a match due to the lastIndex
        property being reset upon each iteration. Also be sure that the global flag is set or a loop will occur here also.

        We are looping through the entire returned response text string (tab delimited PSICQUIC format) and looking for matches via the builtin regex.exec method. When we find a match, specifically
        the second capturing group, we will push to a state array for further processing
         */
        while ((match = regex.exec(PSICQUICdata)) !== null) {
            // This is necessary to avoid infinite loops with zero-width matches
            if (match.index === regex.lastIndex) {
                regex.lastIndex++;
            }
            arrPPIsProteinsRaw.push( AIV.formatAGI ( match[1] ) ); // 1st captured group, i.e. "At2g10000"
            miTermPSICQUIC.push(match[2]); // push the 2nd group (i.e '0018"(two hybrid)', yes with '"'!)
            pubmedIdArr.push(match[3]); //look for third captured group (i.e. "23667124")
        }

        /*
        Loop through each PPI interaction and add the corresponding edge
        Need index to add PubMedID (as far as we know there is only one pubmed ID per interaction) so we can simply map out the index.
        Note we check if an edge already exists as there seems to be rarely a duplicate in the PSICQUIC response data
         */
        arrPPIsProteinsRaw.forEach(function(proteinItem, index){
            if ( AIV.cy.$id(`Protein_${proteinItem}`).empty()) { //Check if node already on cy core (don't need to do an array check as form nodes added in the then() after the Promise.all)
                AIV.addNode(proteinItem, "Protein");
            }

            let edgeSelector = `Protein_${queryGeneAsAGI}_Protein_${proteinItem}`;
            let preappendedRef = INTACTorBioGrid + "-" + pubmedIdArr[index];
            miTermPSICQUIC[index] = miTermPSICQUIC[index].replace('"', ' '); // replace for " inside '0018"(two hybrid)' to become '0018 (two hybrid)'
            if ( AIV.cy.$id(edgeSelector).empty() ) { //Check if edge already added from BAR
                    AIV.addEdges( queryGeneAsAGI, "Protein", proteinItem, "Protein", preappendedRef, true, 0, INTACTorBioGrid, null, miTermPSICQUIC[index] ); // 0 represents experimentally validated in our case and we leave R as null
            }
            else { // account for edges already added, we just have to edit some edge data (refs and miTERMs)
                let updatedRefData = AIV.cy.$id(edgeSelector).data('reference') + '\n' + preappendedRef;
                AIV.cy.$id(edgeSelector).data({
                    'reference': updatedRefData,
                    'published': true, // Note that we DON'T change the interolog confidence since the BAR actually has such data
                    'miAnnotated': AIV.cy.$id(edgeSelector).data('miAnnotated').concat([miTermPSICQUIC[index]]) // append new miTerm to current arr
                });
            }
        });

        let pubmedIdArrUnique = pubmedIdArr.filter(function(item, index, selfArr){ // delete duplicates
            return index === selfArr.indexOf(item);
        });
        this.buildRefDropdown(pubmedIdArrUnique);

    };

    /**
     * @function addTableRow - take in a bunch of params and add it to an HTML table row string, to be held in a state variable
     * @description - NO LONGER USED, here for reference as it was a base for the createTableFromEdges function
     * @param {string} intType - interaction type, protein-protein or protein-dna
     * @param {string} dbSource - database source, ex BAR
     * @param {string} sourceGene - AGI source gene
     * @param {string} targetGene - AGI target gene
     * @param {number|string} interoConf - interologconfidence, if it exists
     * @param {number|string} pearsonCC - pearson correlation coefficient
     * @param {string} ref - if a published interaction, pubmed or DOI or MIND etc
     * @param miTerm - MI term that describes what type of a experiment was performed
     */
    AIV.addTableRow = function(intType, dbSource, sourceGene, targetGene, interoConf, pearsonCC, ref, miTerm){
        //store in a state variable for performance boot rather than adding one row at a time to DOM

        /**
         * Some notes:
         * For interlog confidence it represents multiple things: FEMO score, interolog confidence, SPPI rank and experimentally determined
         * Talked with nick to represent '0' (experimentally determined) as 'N/A' hence the ternary operator
         * Parse mi terms for BAR/INTACT/BioGrid, then format nicely if more than one mi term
         * Also need a 'ppiOrPdi' to make ppis and pdis distinct for localization cells
         */
        let ppiOrPdi = "ppi";
        if (intType === "protein-DNA"){ ppiOrPdi = "pdi";}

        let referencesCleaned = "";
        this.memoizedSanRefIDs(ref).forEach(function(ref){
            referencesCleaned += `<p> ${AIV.memoizedRetRefLink(ref, targetGene, sourceGene)} </p>`;
        });

        let miFormattedHTML = "";
        if (miTerm !== null && miTerm !== undefined && dbSource === "BAR"){
            let miArray = miTerm.split('|');
            miArray.forEach(function(miTerm){
                if (AIV.miTerms[miTerm] !== undefined){
                    miFormattedHTML += `<p>${miTerm} (${AIV.miTerms[miTerm]})</p>`;
                }
            });
        }
        else if (dbSource === "INTACT" || dbSource === "BioGrid") {
            miFormattedHTML += `<p>${miTerm}</p>`;
        }

        this.tempHtmlTableStr +=
            `<tr>
                <td class="small-csv-column">${intType}</td>
                <td class="small-csv-column">${sourceGene}</td>
                <td class="small-csv-column">${targetGene}</td>
                <td class="${sourceGene}-annotate small-csv-column"></td>
                <td class="${targetGene}-annotate small-csv-column"></td>
                <td class="small-csv-column">${interoConf === 0 ? "N/A" : interoConf }</td>
                <td class="small-csv-column">${pearsonCC}</td>
                <td class="lg-csv-column">${referencesCleaned.match(/.*undefined.*/) ? "None" : referencesCleaned}</td>
                <td class="med-csv-column">${miFormattedHTML ? miFormattedHTML : "None"}</td>
                <td class="${sourceGene}-loc lg-csv-column">Fetching Data</td>
                <td class="${targetGene}-${ppiOrPdi}-loc lg-csv-column">${ppiOrPdi === "pdi" ? "Nucleus(assumed)" : "Fetching Data"}</td>
            </tr>`;
    };

    /**
     * @function createTableFromEdges - this funciton will scan through our recently added Cy PPI edges and then our state variable of chromosomes to build a neat HTML table to be appended to the #csvTable modal
     */
    AIV.createTableFromEdges = function (){
        let htmlString = "";

        // process PPI edges first
        this.cy.edges('[target *= "Protein"], [target *= "Effector"]').forEach(function(ppiEdge){
            let tempData = ppiEdge.data();

            let cleanRefs = "";
            let sourceGene = tempData.source.split('_')[1];
            let [typeTarget, targetGene] = tempData.target.split('_');
            if (tempData.reference){ //non-falsy value
                AIV.memoizedSanRefIDs(tempData.reference).forEach(function(ref){
                    cleanRefs += `<p> ${AIV.memoizedRetRefLink(ref, targetGene, sourceGene)} </p>`;
                });
            }

            htmlString +=
                `<tr>
                    <td class="small-csv-column">Protein-${typeTarget}</td>
                    <td class="small-csv-column">${sourceGene}</td>
                    <td class="small-csv-column">${targetGene}</td>
                    <td class="${sourceGene}-annotate small-csv-column"></td>
                    <td class="${targetGene}-annotate small-csv-column"></td>
                    <td class="small-csv-column">${tempData.interologConfidence === 0 ? "N/A" : tempData.interologConfidence }</td>
                    <td class="small-csv-column">${tempData.pearsonR}</td>
                    <td class="lg-csv-column">${cleanRefs.match(/.*undefined.*/) ? "None" : cleanRefs}</td>
                    <td class="med-csv-column">${tempData.miAnnotated}</td>
                    <td class="${sourceGene}-loc lg-csv-column">Fetching Data</td>
                    <td class="${targetGene}-ppi-loc lg-csv-column">Fetching Data</td>
                </tr>`;
        });

        // now process PDI edges (or rather the state data in memory)
        for (let chr of Object.keys(AIV.chromosomesAdded)) {
            for (let i = 0; i < AIV.chromosomesAdded[chr].length; i++) {
                let tempDNAData = AIV.chromosomesAdded[chr][i];

                let cleanRefs = "";
                let sourceGene = tempDNAData.source;
                let targetGene = tempDNAData.target;
                if (tempDNAData.reference){ //non-falsy value
                    AIV.memoizedSanRefIDs(tempDNAData.reference).forEach(function(ref){
                        cleanRefs += `<p> ${AIV.memoizedRetRefLink(ref, targetGene, sourceGene)} </p>`;
                    });
                }

                let miHTML = "";
                if (tempDNAData.mi !== null && tempDNAData.mi !== undefined){
                    let miArray = tempDNAData.mi.split('|');
                    miArray.forEach(function(miTerm){
                        if (AIV.miTerms[miTerm] !== undefined){
                            miHTML += `<p>${miTerm} (${AIV.miTerms[miTerm]})</p>`;
                        }
                    });
                }

                htmlString +=
                `<tr>
                    <td class="small-csv-column">Protein-DNA</td>
                    <td class="small-csv-column">${sourceGene}</td>
                    <td class="small-csv-column">${targetGene}</td>
                    <td class="${sourceGene}-annotate small-csv-column"></td>
                    <td class="${targetGene}-annotate small-csv-column"></td>
                    <td class="small-csv-column">${tempDNAData.interolog_confidence === 0 ? "N/A" : tempDNAData.interolog_confidence }</td>
                    <td class="small-csv-column">${tempDNAData.correlation_coefficient}</td>
                    <td class="lg-csv-column">${cleanRefs}</td>
                    <td class="med-csv-column">${miHTML}</td>
                    <td class="${sourceGene}-loc lg-csv-column">Fetching Data</td>
                    <td class="${targetGene}-pdi-loc lg-csv-column">Nucleus (assumed)</td>
                </tr>`;
            }
        }

        $('#csvTable').find("tbody").append(htmlString);
    };

    /**
     * @namespace {object} AIV
     * @function returnLocalizationPOSTJSON - Create and return SUBA URL string for AJAX call
     * @returns {Object} - an object with the string of AGIs and the predicted localizations
     */
    AIV.returnLocalizationPOSTJSON = function(){

        var reqJSON =
            {
                AGI_IDs : [],
            };
        this.parseProteinNodes(nodeID => reqJSON.AGI_IDs.push( nodeID ));

        reqJSON.include_predicted = $("#exprPredLocEye").hasClass('fa-eye');

        return reqJSON;
    };

    /**
     * @namespace {object} AIV
     * @function addLocalizationDataToNodes -
     * Run a forEach loop for every node with a valid ABI ID to attach SUBA data to the node to be later
     * shown via pie-chart background (built-in in cytoscapejs).
     * We chose to hard-code the cellular localizations versus checking them in the JSON structure as
     * the JSON structure does not return all cellular localizations when it does not have a score.
     * Also note that some of the property names had spaces in them...
     *
     * @param {object} SUBADATA as the response JSON we get from our SUBA4 backend (at the BAR)
     */
    AIV.addLocalizationDataToNodes = function(SUBADATA) {
        AIV.cy.startBatch();

        AIV.locCompoundNodes = [];

        Object.keys(SUBADATA).forEach(function(geneAGIName){
            let nodeID = geneAGIName; //AT1G04170 to At1g04170
            let geneSUBAData = SUBADATA[geneAGIName];
            if (Object.keys(geneSUBAData.data).length){ //For nodes with any localization data
                let majorityLoc = Object.keys(geneSUBAData.data[0])[0];
                AIV.cy.$('node[name = "' + nodeID + '"]')
                    .data({
                        predictedSUBA :  ( geneSUBAData.includes_predicted === "yes" ),
                        experimentalSUBA : ( geneSUBAData.includes_experimental === "yes" ),
                        localizationData: calcLocPcts( geneSUBAData.data),
                        localization : majorityLoc, //assign localization to highest loc score
                    });
                if (AIV.locCompoundNodes.indexOf(majorityLoc) === -1 ){
                    AIV.locCompoundNodes.push(majorityLoc); // append to our state variable which stores unique majority localizations, used to later make compound nodes
                }
            }
            else { //For nodes without any localization data
                AIV.cy.$('node[name = "' + nodeID + '"]')
                    .data({
                        predictedSUBA : false,
                        experimentalSUBA : false,
                        localizationData: [],
                        localization: "unknown"
                    });
                if (AIV.locCompoundNodes.indexOf("unknown") === -1 ){
                    AIV.locCompoundNodes.push("unknown"); // append to our state variable which stores unique majority localizations, used to later make compound nodes
                }
            }

        });

        AIV.cy.endBatch();

        function calcLocPcts(subaLocData){
            let retObj = [];
            let deno = 0;
            subaLocData.forEach(locScore => deno += Object.values(locScore)[0]); // use [0] because only one property is in the obj i.e. [{"nucleus": 20},{"cytosol": 10}]
            subaLocData.forEach(function(locScore){
                retObj.push({[Object.keys(locScore)[0]] : Object.values(locScore)[0]/deno});
            });
            return retObj;
        }
    };

    /**
     * @namespace {object} AIV
     * @function createSVGPIeDonutCartStr -
     * This function will take in all the location data properties that a node has (for example, 'nucleus')
     * to be used to create a SVG donut string which will be set as the background image. I intentionally
     * made this function based on the AIV.nodeSize property such that it can be more scalable (literally
     * and figuratively).
     *
     * @param {object} AGIGene - takes in a reference to a node, particularly a ABI gene to parse through its 'PCT' properties.
     *
     * Credits to: https://medium.com/@heyoka/scratch-made-svg-donut-pie-charts-in-html5-2c587e935d72
     */
    AIV.createSVGPieDonutCartStr = function(AGIGene) {
        let nodeData = AGIGene.data();
        let AGIGeneLocData = nodeData.localizationData ;
        let cyNodeSize = nodeData.queryGene ? this.searchNodeSize : this.nodeSize ;
        let SVGwidthheight = cyNodeSize + 10;
        let donutCxCy = SVGwidthheight/2;
        let radius, strokeWidth;
        radius = strokeWidth = cyNodeSize/2;
        let SVGstr = '<?xml version="1.0" encoding="UTF-8"?><!DOCTYPE svg>';
        SVGstr += `<svg width="${SVGwidthheight}" height="${SVGwidthheight}" class="donut" xmlns="http://www.w3.org/2000/svg">`;
        SVGstr += `<circle class="donut-hole" cx="${donutCxCy}" cy="${donutCxCy}" r="${radius}" fill="transparent"></circle>`;

        //The below donut segment will appear for genes without SUBA data... it will be all grey
        SVGstr += `<circle class="donut-unfilled-ring" cx="${donutCxCy}" cy="${donutCxCy}" r="${radius}" fill="transparent" stroke="#56595b" stroke-width="${strokeWidth}" display="block"></circle>`;

        // Figure out which 'PCT' properties are greater than zero and then programatically add them
        // as donut-segments. Note that some calculations are involved based
        // on the set node size (the example given on the tutorial is based on a 100px C and 15.91 radius)
        var scaling = radius/15.91549430918952;
        var pctAndColorArray = [];

        if (AGIGeneLocData.length > 0){ // need check as nodes without loc data with crash app
            AGIGeneLocData.forEach(function(locPercentage){
                pctAndColorArray.push({
                    pct : (Object.values(locPercentage)[0] * 100), //convert to % for easier parsing later
                    color : AIV.locColorAssignments[Object.keys(locPercentage)[0]]
                });
            });
        }

        // Now have pre-sorted pctAndColorArray based on the value of the 'pct' property, order greatest to least
        // Result: Show pie chart values from greatest to least starting from 12 oclock

        var initialOffset = 25 * scaling; // Bypass default donut parts start at 3 o'clock instead of 12
        var allSegsLength = 0;

        // Based on the sorted array we created above, let's add some 'donut segments' to the SVG string
        pctAndColorArray.forEach(function(pctAndColor){
            SVGstr += `<circle class="donut-segment" cx="${donutCxCy}" cy="${donutCxCy}" r="${radius}"  fill="transparent" stroke="${pctAndColor.color}" stroke-width="${strokeWidth}" stroke-dasharray="${pctAndColor.pct * scaling} ${(100 - pctAndColor.pct) * scaling}" stroke-dashoffset="${initialOffset}" display="block"></circle>`;

            allSegsLength += pctAndColor.pct;

            // (Circumference − All preceding segments’ total length + First segment’s offset = Current segment offset ) * scaling factor
            initialOffset = (100 - allSegsLength + 25) * scaling; // increase offset as we have just added a slice

        });

        SVGstr += '</svg>';
        SVGstr = 'data:image/svg+xml;utf8,' + encodeURIComponent(SVGstr); // Modify for CSS via cytoscape
        AGIGene.data('svgDonut', SVGstr); // Last, properly mutate the node with our made SVG string

    };

    /**
     * @namespace {object} AIV
     * @function returnBGImageSVGasCSS -
     * Return svg backgrounds as background images to all the protein nodes in the cy core
     * and add borders for those nodes which have experimental SUBA values
     * @returns {object} - a AIV css style update object ( not ran yet, it runs with update() )
     */
    AIV.returnBGImageSVGasCSS = function () {
        return (
            AIV.cy.style() //specifying style instead of stylesheet updates instead of replaces the cy CSS
                .selector('node[id ^= "Protein_At"]')
                    .css({
                        'background-image' : 'data(svgDonut)',
                    })
                .selector('node[?experimentalSUBA]') //select nodes such that experimentalSUBA is truthy
                    .css({
                        'border-style' : 'solid',
                        'border-width' : '3px',
                        'border-color' : '#99cc00',
                    })
        );
    };

    /**
     * @function transferLocDataToTable - parse every protein and effector node on the DOM and modify the 'csv' table accordingly (add an unordered list of localization percentage scores)
     */
    AIV.transferLocDataToTable = function() {
        this.parseProteinNodes(function(node){
            let ulString = "<ul>";
            let locData = node.data('localizationData');
            for (let i = 0; i < locData.length; i++) {
                let locPercent = Object.values(locData[i])[0];
                if (locPercent > 0){
                    ulString += `<li> ${Object.keys(locData[i])[0]}: ${(locPercent*100).toFixed(1)}% </li>`;
                }
            }
            ulString += "</ul>";
            // console.log(ulString);
            let nodeID = node.data('name');
            $(`.${nodeID}-loc`).html(ulString);
            $(`.${nodeID}-ppi-loc`).html(ulString); //only change ppis, pdis are assumed to be nuclear
        }, true);

        this.cy.filter("node[id ^= 'Effector']").forEach(function(effector){
            $(`.${effector.data('name')}-ppi-loc`).text("extracellular(assumed)");
        });
    };

    /**
     * @namespace {object} AIV
     * @function hideDonuts - un/hides donuts by changing display attribute inside the svg
     * @param {boolean} hide - boolean to determine if we are hiding or not
     */
    AIV.hideDonuts = function(hide) {
        this.cy.startBatch();
        this.cy.$('node[?svgDonut]').forEach(function(node){ //check for nodes with an SVG donut
            let newSVGString = decodeURIComponent(node.data('svgDonut'));
            newSVGString = newSVGString.replace('data:image/svg+xml;utf8,', "");
            if (hide){
                newSVGString = newSVGString.replace(/"block"/g, '"none"'); //change display attribute
            }
            else {
                newSVGString = newSVGString.replace(/"none"/g, '"block"');
            }
            newSVGString = 'data:image/svg+xml;utf8,' + encodeURIComponent(newSVGString);
            node.data('svgDonut', newSVGString);
        });
        this.cy.endBatch();
    };

    /**
     * @namespace {object} AIV
     * @function createGETMapManURL -
     * Create URL for get request for mapman information, namely for the codes (MapMan IDs).
     * Example: http://www.gabipd.org/services/rest/mapman/bin?request=[{"agi":"At4g36250"},{"agi":"At4g02070"}]
     * Data returned is an array of objects, MapMan code is nested inside "result[0].parent.code" for each AGI
     * @returns {string} - url for the HTTP request
     */
    AIV.createGETMapManURL = function () {
        let mapmanURL = "https://bar.utoronto.ca/interactions2/cgi-bin/bar_mapman.php?request=[";
        this.parseProteinNodes((nodeID) => mapmanURL +=`"${nodeID}",`);
        mapmanURL = mapmanURL.slice(0,-1); //remove last ','
        mapmanURL += "]";
        return mapmanURL;
    };

    /**
     * @namespace {object} AIV
     * @function processMapMan -
     * Take in the MapMan data from response JSON to be processed:
     * 1) Add MapMan code(s) and name(s) to node data to be displayed via qTip and on their donut centre
     *
     * @param {object} MapManJSON - the JSON response we receive from the MapMan API
     */
    AIV.processMapMan = function (MapManJSON) {
        if (!this.mapManLoadState) { //if MapMan data not yet fully parsed after API call, i.e. initial load
            MapManJSON.result.genes.forEach(function(geneMapMan) { // Iterate through each result item and inside however many annotations it has
                var particularGene = AIV.cy.$('node[id = "Protein_' + geneMapMan.identifier[0].toUpperCase() + geneMapMan.identifier.slice(1).toLowerCase() + '"]');
                particularGene.data("numOfMapMans", 1); //for use in the qTip
                var MapManCodeN = 'MapManCode' +  1; //i.e. MapManCode1
                var MapManNameN = 'MapManName' +  1; //i.e. MapManName1
                particularGene.data({ //Add this data to object to be called via the qTip
                    'MapManCode1' : chopMapMan(geneMapMan.bincode),
                    'MapManName1' : chopMapMan(geneMapMan.binname)
                });
                let mapManBIN = geneMapMan.bincode.split(".")[0]; // get MapMan BIN (leftmost number, i.e. get 29 from 29.12.3)
                particularGene.data('mapManOverlay', mapManBIN);
                modifySVGString(particularGene, mapManBIN);
                if (!AIV.mapManOnDom.hasOwnProperty(mapManBIN)){
                    AIV.mapManOnDom[mapManBIN] = 1;
                }
                else {
                    AIV.mapManOnDom[mapManBIN] = AIV.mapManOnDom[mapManBIN] + 1;
                }
            });
            // Last, use the mapManOnDom state variable to add the list of checkboxes to our #bootstrapDropDownMM
            // example li item <li><a href="#" class="small" data-value="27" tabIndex="-1"><input type="checkbox"/ checked="true"> MapMan 27 - RNA</a></li>
            // credits: https://codepen.io/bseth99/pen/fboKH
            let df = document.createDocumentFragment();
            for (let mapManNumKey of Object.keys(AIV.mapManOnDom)){
                let li = document.createElement('li');
                let a = document.createElement('a');
                AIV.helperSetAttributes(a, {
                    "data-value" : mapManNumKey,
                    "tabIndex"   : "-1",
                    "href"       : "#"
                });
                a.className = "small";
                let input = document.createElement('input');
                AIV.helperSetAttributes(input, {
                    'type' : 'checkbox',
                    'checked' : 'true'
                });
                a.append(input);
                a.insertAdjacentHTML("beforeend", ` ${mapManNumKey}-${AIV.mapManDefinitions[mapManNumKey]} (${AIV.mapManOnDom[mapManNumKey]})`);
                li.append(a);
                df.append(li);
            }
            document.getElementById('bootstrapDropDownMM').appendChild(df);
            AIV.mapManDropDown(AIV);
        }
        else {
           this.parseProteinNodes(function(proteinNode){
               modifySVGString(proteinNode, proteinNode.data('mapManOverlay'));
           }, true);
        }

        /**
         * @function chopMapman - decides whether or not to chop off MapMan Code/Name based on its detail/length (decided with discussion with Nick)
         * @param {string} nameOrCode - "27.2.1 or RNA.regulation.transcription" as an example
         */
        function chopMapMan(nameOrCode) {
            if ( (nameOrCode.match(/\./g)||[]).length > 3 ){ //If the MapMan is too detailed, remove the last occurence
                return nameOrCode.substr(0, nameOrCode.lastIndexOf("."));
            }
            return nameOrCode; //By default return unmodified string if it is not too detailed
        }

        /**
         * @namespace {object} AIV
         * @function modifySVGString - Expect a node as an object reference and modify its svgDonut string by adding a text tag
         * @param {object} geneNode - as a node object reference
         * @param {string} mapManNum - the first MapMan number (leftmost)
         */
        function modifySVGString(geneNode, mapManNum) {
            if (typeof mapManNum === "undefined") {return;}
            let newSVGString = decodeURIComponent(geneNode.data('svgDonut')).replace("</svg>", ""); //strip </svg> closing tag
            newSVGString = newSVGString.replace('data:image/svg+xml;utf8,', "");
            // console.log(newSVGString);
            let xPosition = mapManNum.length > 1 ? '32%' : '41%'; //i.e. check if single or double digit
            let fontSize = geneNode.data('queryGene') ? 22 : 13; //Determine whether gene is bigger or not (i.e. search gene or not)

            newSVGString += `<text x='${xPosition}' y='59%' font-size='${fontSize}' font-family="Verdana" visibility="visible">${mapManNum}</text></svg>`;
            newSVGString = 'data:image/svg+xml;utf8,' + encodeURIComponent(newSVGString);

            geneNode.data('svgDonut', newSVGString);
        }

    };

    /**
     * @namespace {object} AIV
     * @function hideMapMan - un/hides MapMan centre by un/enabling visibility attribute inside the svg
     * @param {boolean} hide - boolean to determine if we are hiding or not
     */
    AIV.hideMapMan = function(hide){
        this.cy.startBatch();
        this.cy.$('node[?MapManCode1]').forEach(function(node){ //check for nodes with a MapMan
            let newSVGString = decodeURIComponent(node.data('svgDonut'));
            newSVGString = newSVGString.replace('data:image/svg+xml;utf8,', "");
            if (hide){
                newSVGString = newSVGString.replace('"visible"', '"hidden"'); //change visbility attribute
            }
            else {
                newSVGString = newSVGString.replace('"hidden"', '"visible"');
            }
            newSVGString = 'data:image/svg+xml;utf8,' + encodeURIComponent(newSVGString);
            node.data('svgDonut', newSVGString);
        });
        this.cy.endBatch();
    };

    /**
     * @namespace {object} AIV
     * @function effectorsLocHouseCleaning - purpose of this function is to fill in the localization data for effectors as they do not undergo the same parsing as protein nodes. Specifically they belong to the extracellular matrix (ECM), so if one exists on the app, modify the compound state variable correctly if not added already
     */
    AIV.effectorsLocHouseCleaning = function(){
        let effectorSelector = this.cy.filter("node[id ^= 'Effector']");
        if (effectorSelector.length > 0){
            if (this.locCompoundNodes.indexOf('extracellular') === -1){
                this.locCompoundNodes.push("extracellular");
            }
            effectorSelector.forEach(function(effector){ //put effectors in ECM
                effector.data('localization' , 'extracellular');
            });
        }
    };

    /**
     * @namespace {object} AIV
     * @function loadData - Load data main function
     * @returns {boolean} - True if the data is laoded
     */
    AIV.loadData = function() {
        // Dynamically build an array of promises for the Promise.all call later
        var promisesArr = [];

        if ($('#queryBAR').is(':checked')) {
            promisesArr.push(this.createBARAjaxPromise());
        }
        if ($('#queryIntAct').is(':checked')) {
            promisesArr = promisesArr.concat(this.createINTACTAjaxPromise());
        }
        if ($('#queryBioGrid').is(':checked')) {
            promisesArr = promisesArr.concat(this.createBioGridAjaxPromise());
        }
        //console.log('PrmisesArray:',promisesArr);

        Promise.all(promisesArr)
            .then(function(promiseRes) {
                 //console.log("Response:", promiseRes);
                // Add Query node (user inputed in HTML form)
                for (let i = 0; i < AIV.genesList.length; i++) {
                    if (AIV.genesList[i].match(/^AT[1-5MC]G\d{5}$/i)) {
                        AIV.addNode(AIV.genesList[i], 'Protein', true);
                    }
                    else {
                        AIV.addNode(AIV.genesList[i], 'Effector', true);
                    }
                }
                //console.log('Before parsing bar data')
                // Parse data and make cy elements object
                for (let i = 0; i < promiseRes.length; i++) {
                    if (promiseRes[i].ajaxCallType === "BAR"){
                        //console.log('Processing ', promiseRes[i].res)
                        AIV.parseBARInteractionsData(promiseRes[i].res);
                        
                    }
                    else {
                        AIV.parsePSICQUICInteractionsData(promiseRes[i].res, promiseRes[i].queryGene, promiseRes[i].ajaxCallType);
                    }
                }

                // Update styling and add qTips as nodes have now been added to the cy core
                //console.log('Before creating table from edges')
                AIV.createTableFromEdges();
                // AIV.addInteractionRowsToDOM();
                // console.log(AIV.cy.nodes().length, 'nodes');
                // console.log(AIV.cy.edges().length, 'edges');
                //Below lines are to push to a temp array to make a POST for gene summaries
                let nodeAgiNames = [];
                AIV.parseProteinNodes((nodeID) => nodeAgiNames.push(nodeID));
                for (let chr of Object.keys(AIV.chromosomesAdded)) {
                    nodeAgiNames = nodeAgiNames.concat(AIV.chromosomesAdded[chr].map( prop => prop.target));
                }
                let uniqueNodeAgiNames = Array.from(new Set(nodeAgiNames)); // remove duplicates to make quicker requests
                //AIV.fetchGeneAnnoForTable(uniqueNodeAgiNames);
                AIV.addChrNodeQtips();
                AIV.addNumberOfPDIsToNodeLabel();
                AIV.addProteinNodeQtips();
                AIV.addPPIEdgeQtips();
                AIV.addEffectorNodeQtips();
                AIV.cy.style(AIV.getCyStyle()).update();
                AIV.setDNANodesPosition();
                AIV.resizeEListener();
                AIV.addContextMenus();
                AIV.cy.layout(AIV.getCySpreadLayout()).run();

                $('#refCheckboxes').prepend(
                    "<label for='allCheck'><input type='checkbox' id='allCheck'> Filter All/Reset</label>"
                );
                AIV.filterAllElistener(AIV);

                document.getElementById('loading').classList.add('loaded'); //hide loading spinner
                $('#loading').children().remove(); //delete the loading spinner divs
            })
            .catch(function(err){
                alertify.logPosition("top right");
                alertify.error(`Error during fetching interaction data, try BAR if using PSICQUIC services, status code: ${err.status}`);
            })
           // .then(AIV.returnSVGandMapManThenChain);

    };

    /**
     * @function returnSVGandMapManThenChain - Return a promise chain that makes two ajax calls to our SUBA4 localziation API and the MapMan API to draw the SVG piechart background-images. This chain contains some logic with the load state. This logic is for when the user selects the switch for 'predicted' localization data. Note that this implementation will make re-calls to the SUBA4 API when the user hits the switch (as opposed to saving the predicted and experimental data to memory).
     * @return {Promise.<TResult>}
     */
    AIV.returnSVGandMapManThenChain = function () {
        return $.ajax({
            url: "https://bar.utoronto.ca/interactions2/cgi-bin/suba4.php",
            type: "POST",
            data: JSON.stringify( AIV.returnLocalizationPOSTJSON() ),
            contentType : 'application/json',
            dataType: 'json'
        })
            .then(function(SUBAJSON){
                AIV.addLocalizationDataToNodes(SUBAJSON);

                //Loop through ATG protein nodes and add a SVG string property for bg-image css
                AIV.cy.startBatch();
                AIV.parseProteinNodes(AIV.createSVGPieDonutCartStr.bind(AIV), true);
                AIV.cy.endBatch();
                AIV.effectorsLocHouseCleaning();
                if (!AIV.SUBA4LoadState){
                    AIV.returnBGImageSVGasCSS().update();
                }

                //Update the HTML table with our SUBA data
                AIV.transferLocDataToTable();
                AIV.SUBA4LoadState = true;
            })
            .catch(function(err){
                alertify.logPosition("top right");
                alertify.error(`Error made when requesting to SUBA webservice, status code: ${err.status}`);
            })
            .then(function(){ // chain this AJAX call to the above as the mapman relies on the drawing of the SVG pie donuts, i.e. wait for above sync code to finish
                if (!AIV.mapManLoadState) { //don't make another ajax call if we already have MapMan data in our nodes (this logic is for our checkbox)
                    return $.ajax({
                        url: AIV.createGETMapManURL(),
                        type: 'GET',
                        dataType: 'json'
                    });
                }
            })
            .catch(function(err){
                alertify.logPosition("top right");
                alertify.error(`Error made when requesting to MapMan webservice (note: we cannot load more than 700 MapMan numbers), status code: ${err.status}`);
            })
            .then(function(resMapManJSON){
                if (typeof resMapManJSON !== 'undefined' && resMapManJSON.status === "fail"){ throw new Error ('MapMan server call failed!')}
                AIV.cy.startBatch();
                AIV.processMapMan(resMapManJSON);
                AIV.cy.endBatch();
                AIV.mapManLoadState = true;
            })
            .catch(function(err){
                alertify.logPosition("top right");
                alertify.error(`Error processing MapMan data; ${err}`);
            });
    };

    /**
     * @function createBARAJaxPromise - programatically figures out how to build the BAR URL get request
     * @returns {Promise.<{res: object, ajaxCallType: string}>|*}
     */
    AIV.createBARAjaxPromise = function() {
        // AGI IDs
        let postObj = {};
        postObj.loci = "";
        for (var i = 0; i < this.genesList.length; i++) {
            postObj.loci += this.genesList[i] + ",";
        }
        postObj.loci = postObj.loci.slice(0, -1);

        //Recursive
        postObj.recursive = $('#recursive').is(':checked');

        // Published
        postObj.published = $('#published').is(':checked');

        // DNA
        postObj.querydna = $('#queryDna').is(':checked');

        let serviceURL = 'https://bar.utoronto.ca/interactions2/cgi-bin/get_interactions_dapseq.php';

        /*return $.ajax({
            url: serviceURL,
            type: 'POST',
            data: JSON.stringify(postObj),
            contentType: "application/json",
            dataType: "json"
        })
            .then( res => ( {res: res, ajaxCallType: 'BAR'} )); */ 
        var res = {
            "At1g04880": [{
              "source": "At1g04880",
              "target": "At1g01060",
              "index": "1",
              "interolog_confidence": 0,
              "correlation_coefficient": -0.08,
              "published": true,
              "reference": "doi:10.1038\/nmeth.4343",
              "mi": "None"
            }, {
              "source": "At1g04880",
              "target": "At1g04880",
              "index": "0",
              "interolog_confidence": 0,
              "correlation_coefficient": 1,
              "published": true,
              "reference": "biogrid:1172859\npubmed:24923357",
              "mi": "0055"
            }, {
              "source": "At1g04880",
              "target": "At1g22130",
              "index": "0",
              "interolog_confidence": 0,
              "correlation_coefficient": 0.684,
              "published": true,
              "reference": "biogrid:1172858\npubmed:24923357",
              "mi": "0055"
            }, {
              "source": "At1g04880",
              "target": "At1g54330",
              "index": "0",
              "interolog_confidence": 0,
              "correlation_coefficient": 0.133,
              "published": true,
              "reference": "doi:10.1038\/nmeth.4343",
              "mi": "None"
            }, {
              "source": "At1g04880",
              "target": "At1g77980",
              "index": "0",
              "interolog_confidence": 0,
              "correlation_coefficient": 0.617,
              "published": true,
              "reference": "biogrid:1172857\npubmed:24923357",
              "mi": "0055"
            }, {
              "source": "At1g04880",
              "target": "At5g05120",
              "index": "0",
              "interolog_confidence": 0,
              "correlation_coefficient": "None",
              "published": true,
              "reference": "doi:10.1038\/nmeth.4343",
              "mi": "None"
            }, {
              "source": "At1g04880",
              "target": "At1g16410",
              "index": "2",
              "interolog_confidence": 0,
              "correlation_coefficient": -0.147,
              "published": true,
              "reference": "pubmed:25352272",
              "mi": "0432"
            }, {
              "source": "At1g04880",
              "target": "At1g18590",
              "index": "2",
              "interolog_confidence": 0,
              "correlation_coefficient": -0.206,
              "published": true,
              "reference": "pubmed:25352272",
              "mi": "0432"
            }, {
              "source": "At1g04880",
              "target": "At1g62540",
              "index": "2",
              "interolog_confidence": 0,
              "correlation_coefficient": -0.07,
              "published": true,
              "reference": "pubmed:25352272",
              "mi": "0432"
            }, {
              "source": "At1g04880",
              "target": "At1g62560",
              "index": "2",
              "interolog_confidence": 0,
              "correlation_coefficient": -0.135,
              "published": true,
              "reference": "pubmed:25352272",
              "mi": "0432"
            }, {
              "source": "At1g04880",
              "target": "At1g62570",
              "index": "2",
              "interolog_confidence": 0,
              "correlation_coefficient": -0.103,
              "published": true,
              "reference": "pubmed:25352272",
              "mi": "0432"
            }, {
              "source": "At1g04880",
              "target": "At1g65860",
              "index": "2",
              "interolog_confidence": 0,
              "correlation_coefficient": -0.128,
              "published": true,
              "reference": "pubmed:25352272",
              "mi": "0432"
            }, {
              "source": "At1g04880",
              "target": "At1g65880",
              "index": "2",
              "interolog_confidence": 0,
              "correlation_coefficient": -0.013,
              "published": true,
              "reference": "pubmed:25352272",
              "mi": "0432"
            }, {
              "source": "At1g04880",
              "target": "At1g71930",
              "index": "2",
              "interolog_confidence": 0,
              "correlation_coefficient": -0.01,
              "published": true,
              "reference": "pubmed:22037706",
              "mi": "0432"
            }, {
              "source": "At1g04880",
              "target": "At2g20610",
              "index": "2",
              "interolog_confidence": 0,
              "correlation_coefficient": -0.275,
              "published": true,
              "reference": "pubmed:25352272",
              "mi": "0432"
            }, {
              "source": "At1g04880",
              "target": "At2g25450",
              "index": "2",
              "interolog_confidence": 0,
              "correlation_coefficient": -0.211,
              "published": true,
              "reference": "pubmed:25352272",
              "mi": "0432"
            }, {
              "source": "At1g04880",
              "target": "At2g30860",
              "index": "2",
              "interolog_confidence": 0,
              "correlation_coefficient": -0.298,
              "published": true,
              "reference": "pubmed:25352272",
              "mi": "0432"
            }, {
              "source": "At1g04880",
              "target": "At2g31790",
              "index": "2",
              "interolog_confidence": 0,
              "correlation_coefficient": -0.21,
              "published": true,
              "reference": "pubmed:25352272",
              "mi": "0432"
            }, {
              "source": "At1g04880",
              "target": "At3g03190",
              "index": "2",
              "interolog_confidence": 0,
              "correlation_coefficient": -0.149,
              "published": true,
              "reference": "pubmed:25352272",
              "mi": "0432"
            }, {
              "source": "At1g04880",
              "target": "At3g19710",
              "index": "2",
              "interolog_confidence": 0,
              "correlation_coefficient": -0.207,
              "published": true,
              "reference": "pubmed:25352272",
              "mi": "0432"
            }, {
              "source": "At1g04880",
              "target": "At3g25710",
              "index": "2",
              "interolog_confidence": 0,
              "correlation_coefficient": -0.072,
              "published": true,
              "reference": "pubmed:22037706",
              "mi": "0432"
            }, {
              "source": "At1g04880",
              "target": "At3g43430",
              "index": "2",
              "interolog_confidence": 0,
              "correlation_coefficient": -0.107,
              "published": true,
              "reference": "pubmed:22037706",
              "mi": "0432"
            }, {
              "source": "At1g04880",
              "target": "At4g03060",
              "index": "2",
              "interolog_confidence": 0,
              "correlation_coefficient": -0.093,
              "published": true,
              "reference": "pubmed:25352272",
              "mi": "0432"
            }, {
              "source": "At1g04880",
              "target": "At4g12030",
              "index": "2",
              "interolog_confidence": 0,
              "correlation_coefficient": -0.163,
              "published": true,
              "reference": "pubmed:25352272",
              "mi": "0432"
            }, {
              "source": "At1g04880",
              "target": "At4g13770",
              "index": "2",
              "interolog_confidence": 0,
              "correlation_coefficient": -0.206,
              "published": true,
              "reference": "pubmed:25352272",
              "mi": "0432"
            }, {
              "source": "At1g04880",
              "target": "At4g37650",
              "index": "2",
              "interolog_confidence": 0,
              "correlation_coefficient": 0.008,
              "published": true,
              "reference": "pubmed:22037706",
              "mi": "0432"
            }, {
              "source": "At1g04880",
              "target": "At5g07470",
              "index": "2",
              "interolog_confidence": 0,
              "correlation_coefficient": 0.065,
              "published": true,
              "reference": "pubmed:25352272",
              "mi": "0432"
            }, {
              "source": "At1g04880",
              "target": "At5g07700",
              "index": "2",
              "interolog_confidence": 0,
              "correlation_coefficient": 0.107,
              "published": true,
              "reference": "pubmed:25352272",
              "mi": "0432"
            }, {
              "source": "At1g04880",
              "target": "At5g12870",
              "index": "2",
              "interolog_confidence": 0,
              "correlation_coefficient": 0.097,
              "published": true,
              "reference": "pubmed:22037706",
              "mi": "0432"
            }, {
              "source": "At1g04880",
              "target": "At5g23010",
              "index": "2",
              "interolog_confidence": 0,
              "correlation_coefficient": -0.182,
              "published": true,
              "reference": "pubmed:25352272",
              "mi": "0432"
            }, {
              "source": "At1g04880",
              "target": "At5g23020",
              "index": "2",
              "interolog_confidence": 0,
              "correlation_coefficient": -0.144,
              "published": true,
              "reference": "pubmed:25352272",
              "mi": "0432"
            }, {
              "source": "At1g04880",
              "target": "At5g61420",
              "index": "2",
              "interolog_confidence": 0,
              "correlation_coefficient": -0.194,
              "published": true,
              "reference": "pubmed:25352272",
              "mi": "0432"
            }],
            "At1g25420": [{
              "source": "At1g25420",
              "target": "At3g58750",
              "index": "0",
              "interolog_confidence": 0,
              "correlation_coefficient": 0.077,
              "published": true,
              "reference": "pubmed:21798944\nAI-1 MAIN\ndoi:10.1126\/science.1203877\nbiogrid:599001",
              "mi": "0018|0018"
            }, {
              "source": "At1g25420",
              "target": "At4g32190",
              "index": "0",
              "interolog_confidence": 0,
              "correlation_coefficient": 0.118,
              "published": true,
              "reference": "pubmed:21798944\nAI-1 MAIN\ndoi:10.1126\/science.1203659\ndoi:10.1126\/science.1203877\nbiogrid:596444",
              "mi": "0018|0018"
            }, {
              "source": "At1g25420",
              "target": "At5g45100",
              "index": "0",
              "interolog_confidence": 0,
              "correlation_coefficient": "None",
              "published": true,
              "reference": "doi:10.1126\/science.1203659",
              "mi": "None"
            }, {
              "source": "At1g25420",
              "target": "At1g04270",
              "index": "1",
              "interolog_confidence": 2,
              "correlation_coefficient": 0.613,
              "published": false,
              "reference": "None",
              "mi": "0064"
            }, {
              "source": "At1g25420",
              "target": "At1g48970",
              "index": "1",
              "interolog_confidence": 1,
              "correlation_coefficient": 0.8,
              "published": false,
              "reference": "None",
              "mi": "0064"
            }, {
              "source": "At1g25420",
              "target": "At1g53880",
              "index": "1",
              "interolog_confidence": 1,
              "correlation_coefficient": 0.786,
              "published": false,
              "reference": "None",
              "mi": "0064"
            }, {
              "source": "At1g25420",
              "target": "At1g72340",
              "index": "0",
              "interolog_confidence": 1,
              "correlation_coefficient": 0.556,
              "published": false,
              "reference": "None",
              "mi": "0064"
            }, {
              "source": "At1g25420",
              "target": "At1g73030",
              "index": "1",
              "interolog_confidence": 4,
              "correlation_coefficient": 0.679,
              "published": false,
              "reference": "None",
              "mi": "0064"
            }, {
              "source": "At1g25420",
              "target": "At2g06530",
              "index": "1",
              "interolog_confidence": 1,
              "correlation_coefficient": 0.648,
              "published": false,
              "reference": "None",
              "mi": "0064"
            }, {
              "source": "At1g25420",
              "target": "At2g19830",
              "index": "1",
              "interolog_confidence": 1,
              "correlation_coefficient": 0.46,
              "published": false,
              "reference": "None",
              "mi": "0064"
            }, {
              "source": "At1g25420",
              "target": "At2g25355",
              "index": "0",
              "interolog_confidence": 1,
              "correlation_coefficient": 0.681,
              "published": false,
              "reference": "None",
              "mi": "0064"
            }, {
              "source": "At1g25420",
              "target": "At2g27600",
              "index": "0",
              "interolog_confidence": 40,
              "correlation_coefficient": 0.817,
              "published": false,
              "reference": "None",
              "mi": "0064"
            }, {
              "source": "At1g25420",
              "target": "At2g34970",
              "index": "0",
              "interolog_confidence": 2,
              "correlation_coefficient": 0.754,
              "published": false,
              "reference": "None",
              "mi": "0064"
            }, {
              "source": "At1g25420",
              "target": "At2g45500",
              "index": "0",
              "interolog_confidence": 2,
              "correlation_coefficient": 0.761,
              "published": false,
              "reference": "None",
              "mi": "0064"
            }, {
              "source": "At1g25420",
              "target": "At3g07300",
              "index": "0",
              "interolog_confidence": 2,
              "correlation_coefficient": 0.775,
              "published": false,
              "reference": "None",
              "mi": "0064"
            }, {
              "source": "At1g25420",
              "target": "At3g20630",
              "index": "0",
              "interolog_confidence": 2,
              "correlation_coefficient": 0.413,
              "published": false,
              "reference": "None",
              "mi": "0064"
            }, {
              "source": "At1g25420",
              "target": "At3g23270",
              "index": "1",
              "interolog_confidence": 1,
              "correlation_coefficient": 0.177,
              "published": false,
              "reference": "None",
              "mi": "0064"
            }, {
              "source": "At1g25420",
              "target": "At3g43810",
              "index": "0",
              "interolog_confidence": 1,
              "correlation_coefficient": 0.563,
              "published": false,
              "reference": "None",
              "mi": "0064"
            }, {
              "source": "At1g25420",
              "target": "At4g29020",
              "index": "0",
              "interolog_confidence": 1,
              "correlation_coefficient": 0.482,
              "published": false,
              "reference": "None",
              "mi": "0064"
            }, {
              "source": "At1g25420",
              "target": "At4g32175",
              "index": "1",
              "interolog_confidence": 1,
              "correlation_coefficient": 0,
              "published": false,
              "reference": "None",
              "mi": "0064"
            }, {
              "source": "At1g25420",
              "target": "At5g04850",
              "index": "1",
              "interolog_confidence": 1,
              "correlation_coefficient": 0.801,
              "published": false,
              "reference": "None",
              "mi": "0064"
            }, {
              "source": "At1g25420",
              "target": "At5g14170",
              "index": "0",
              "interolog_confidence": 2,
              "correlation_coefficient": 0.818,
              "published": false,
              "reference": "None",
              "mi": "0064"
            }, {
              "source": "At1g25420",
              "target": "At5g20920",
              "index": "0",
              "interolog_confidence": 2,
              "correlation_coefficient": 0.718,
              "published": false,
              "reference": "None",
              "mi": "0064"
            }, {
              "source": "At1g25420",
              "target": "At5g21274",
              "index": "1",
              "interolog_confidence": 1,
              "correlation_coefficient": 0,
              "published": false,
              "reference": "None",
              "mi": "0064"
            }, {
              "source": "At1g25420",
              "target": "At5g22770",
              "index": "1",
              "interolog_confidence": 1,
              "correlation_coefficient": 0.699,
              "published": false,
              "reference": "None",
              "mi": "0064"
            }, {
              "source": "At1g25420",
              "target": "At5g37510",
              "index": "0",
              "interolog_confidence": 2,
              "correlation_coefficient": 0.71,
              "published": false,
              "reference": "None",
              "mi": "0064"
            }, {
              "source": "At1g25420",
              "target": "At5g38640",
              "index": "0",
              "interolog_confidence": 1,
              "correlation_coefficient": 0.086,
              "published": false,
              "reference": "None",
              "mi": "0064"
            }, {
              "source": "At1g25420",
              "target": "At5g49650",
              "index": "0",
              "interolog_confidence": 2,
              "correlation_coefficient": 0.893,
              "published": false,
              "reference": "None",
              "mi": "0064"
            }, {
              "source": "At1g25420",
              "target": "At5g52640",
              "index": "1",
              "interolog_confidence": 1,
              "correlation_coefficient": 0.022,
              "published": false,
              "reference": "None",
              "mi": "0064"
            }],
            "At2g34970": [{
              "source": "At2g34970",
              "target": "At1g04510",
              "index": "0",
              "interolog_confidence": 0,
              "correlation_coefficient": 0.592,
              "published": true,
              "reference": "pubmed:32191846",
              "mi": "2223"
            }, {
              "source": "At2g34970",
              "target": "At1g06220",
              "index": "0",
              "interolog_confidence": 0,
              "correlation_coefficient": 0.583,
              "published": true,
              "reference": "pubmed:32191846",
              "mi": "2223"
            }, {
              "source": "At2g34970",
              "target": "At1g53750",
              "index": "1",
              "interolog_confidence": 0,
              "correlation_coefficient": 0.494,
              "published": true,
              "reference": "pubmed:32191846",
              "mi": "2223"
            }, {
              "source": "At2g34970",
              "target": "At1g53780",
              "index": "1",
              "interolog_confidence": 0,
              "correlation_coefficient": 0.494,
              "published": true,
              "reference": "pubmed:32191846",
              "mi": "2223"
            }, {
              "source": "At2g34970",
              "target": "At1g60620",
              "index": "0",
              "interolog_confidence": 0,
              "correlation_coefficient": 0.334,
              "published": true,
              "reference": "pubmed:32191846",
              "mi": "2223"
            }, {
              "source": "At2g34970",
              "target": "At1g60850",
              "index": "0",
              "interolog_confidence": 0,
              "correlation_coefficient": 0.57,
              "published": true,
              "reference": "pubmed:32191846",
              "mi": "2223"
            }, {
              "source": "At2g34970",
              "target": "At1g62020",
              "index": "0",
              "interolog_confidence": 0,
              "correlation_coefficient": 0.39,
              "published": true,
              "reference": "pubmed:32191846",
              "mi": "2223"
            }, {
              "source": "At2g34970",
              "target": "At2g15400",
              "index": "0",
              "interolog_confidence": 0,
              "correlation_coefficient": 0.547,
              "published": true,
              "reference": "pubmed:32191846",
              "mi": "2223"
            }, {
              "source": "At2g34970",
              "target": "At2g15430",
              "index": "0",
              "interolog_confidence": 0,
              "correlation_coefficient": 0.547,
              "published": true,
              "reference": "pubmed:32191846",
              "mi": "2223"
            }, {
              "source": "At2g34970",
              "target": "At2g16200",
              "index": "1",
              "interolog_confidence": 0,
              "correlation_coefficient": 0.148,
              "published": true,
              "reference": "pubmed:32191846",
              "mi": "2223"
            }, {
              "source": "At2g34970",
              "target": "At2g20140",
              "index": "0",
              "interolog_confidence": 0,
              "correlation_coefficient": 0.638,
              "published": true,
              "reference": "pubmed:32191846",
              "mi": "2223"
            }, {
              "source": "At2g34970",
              "target": "At2g20580",
              "index": "0",
              "interolog_confidence": 0,
              "correlation_coefficient": 0.183,
              "published": true,
              "reference": "pubmed:32191846",
              "mi": "2223"
            }, {
              "source": "At2g34970",
              "target": "At2g21390",
              "index": "0",
              "interolog_confidence": 0,
              "correlation_coefficient": 0.447,
              "published": true,
              "reference": "pubmed:32191846",
              "mi": "2223"
            }, {
              "source": "At2g34970",
              "target": "At2g33340",
              "index": "0",
              "interolog_confidence": 0,
              "correlation_coefficient": 0.384,
              "published": true,
              "reference": "pubmed:32191846",
              "mi": "2223"
            }, {
              "source": "At2g34970",
              "target": "At2g39990",
              "index": "0",
              "interolog_confidence": 0,
              "correlation_coefficient": 0.603,
              "published": true,
              "reference": "pubmed:32191846",
              "mi": "2223"
            }, {
              "source": "At2g34970",
              "target": "At2g40660",
              "index": "1",
              "interolog_confidence": 0,
              "correlation_coefficient": 0.357,
              "published": true,
              "reference": "pubmed:32191846",
              "mi": "2223"
            }, {
              "source": "At2g34970",
              "target": "At2g44070",
              "index": "0",
              "interolog_confidence": 0,
              "correlation_coefficient": 0.349,
              "published": true,
              "reference": "pubmed:32191846",
              "mi": "2223"
            }, {
              "source": "At2g34970",
              "target": "At3g11270",
              "index": "0",
              "interolog_confidence": 0,
              "correlation_coefficient": 0.529,
              "published": true,
              "reference": "pubmed:32191846",
              "mi": "2223"
            }, {
              "source": "At2g34970",
              "target": "At3g23145",
              "index": "0",
              "interolog_confidence": 0,
              "correlation_coefficient": "None",
              "published": true,
              "reference": "pubmed:32191846",
              "mi": "2223"
            }, {
              "source": "At2g34970",
              "target": "At3g49830",
              "index": "0",
              "interolog_confidence": 0,
              "correlation_coefficient": 0.089,
              "published": true,
              "reference": "pubmed:32191846",
              "mi": "2223"
            }, {
              "source": "At2g34970",
              "target": "At4g08140",
              "index": "0",
              "interolog_confidence": 0,
              "correlation_coefficient": 0.235,
              "published": true,
              "reference": "pubmed:32191846",
              "mi": "2223"
            }, {
              "source": "At2g34970",
              "target": "At4g10320",
              "index": "0",
              "interolog_confidence": 0,
              "correlation_coefficient": "None",
              "published": true,
              "reference": "pubmed:32191846",
              "mi": "2223"
            }, {
              "source": "At2g34970",
              "target": "At4g19006",
              "index": "0",
              "interolog_confidence": 0,
              "correlation_coefficient": "None",
              "published": true,
              "reference": "pubmed:32191846",
              "mi": "2223"
            }, {
              "source": "At2g34970",
              "target": "At4g28470",
              "index": "0",
              "interolog_confidence": 0,
              "correlation_coefficient": "None",
              "published": true,
              "reference": "pubmed:32191846",
              "mi": "2223"
            }, {
              "source": "At2g34970",
              "target": "At4g29040",
              "index": "0",
              "interolog_confidence": 0,
              "correlation_coefficient": 0.372,
              "published": true,
              "reference": "pubmed:32191846",
              "mi": "2223"
            }, {
              "source": "At2g34970",
              "target": "At4g31480",
              "index": "0",
              "interolog_confidence": 0,
              "correlation_coefficient": 0.416,
              "published": true,
              "reference": "pubmed:32191846",
              "mi": "2223"
            }, {
              "source": "At2g34970",
              "target": "At4g31490",
              "index": "0",
              "interolog_confidence": 0,
              "correlation_coefficient": 0.416,
              "published": true,
              "reference": "pubmed:32191846",
              "mi": "2223"
            }, {
              "source": "At2g34970",
              "target": "At4g34450",
              "index": "1",
              "interolog_confidence": 0,
              "correlation_coefficient": 0.283,
              "published": true,
              "reference": "pubmed:32191846",
              "mi": "2223"
            }, {
              "source": "At2g34970",
              "target": "At5g05780",
              "index": "0",
              "interolog_confidence": 0,
              "correlation_coefficient": 0.41,
              "published": true,
              "reference": "pubmed:32191846",
              "mi": "2223"
            }, {
              "source": "At2g34970",
              "target": "At5g09900",
              "index": "0",
              "interolog_confidence": 0,
              "correlation_coefficient": 0.511,
              "published": true,
              "reference": "pubmed:32191846",
              "mi": "2223"
            }, {
              "source": "At2g34970",
              "target": "At5g20920",
              "index": "0",
              "interolog_confidence": 60,
              "correlation_coefficient": 0.537,
              "published": true,
              "reference": "pubmed:21798944\nAI-1 MAIN\ndoi:10.1126\/science.1203877\nbiogrid:597258",
              "mi": "0018|0018"
            }, {
              "source": "At2g34970",
              "target": "At5g25230",
              "index": "0",
              "interolog_confidence": 0,
              "correlation_coefficient": 0.583,
              "published": true,
              "reference": "pubmed:32191846",
              "mi": "2223"
            }, {
              "source": "At2g34970",
              "target": "At5g26710",
              "index": "1",
              "interolog_confidence": 0,
              "correlation_coefficient": 0.516,
              "published": true,
              "reference": "pubmed:32191846",
              "mi": "2223"
            }, {
              "source": "At2g34970",
              "target": "At5g45620",
              "index": "0",
              "interolog_confidence": 0,
              "correlation_coefficient": 0.481,
              "published": true,
              "reference": "pubmed:32191846",
              "mi": "2223"
            }, {
              "source": "At2g34970",
              "target": "At5g58290",
              "index": "1",
              "interolog_confidence": 0,
              "correlation_coefficient": 0.21,
              "published": true,
              "reference": "pubmed:32191846",
              "mi": "2223"
            }, {
              "source": "At2g34970",
              "target": "At5g64760",
              "index": "0",
              "interolog_confidence": 0,
              "correlation_coefficient": 0.567,
              "published": true,
              "reference": "pubmed:32191846",
              "mi": "2223"
            }, {
              "source": "At2g34970",
              "target": "At5g67630",
              "index": "0",
              "interolog_confidence": 0,
              "correlation_coefficient": 0.612,
              "published": true,
              "reference": "pubmed:32191846",
              "mi": "2223"
            }, {
              "source": "At2g34970",
              "target": "HARXLL429",
              "index": "0",
              "interolog_confidence": 0,
              "correlation_coefficient": "None",
              "published": true,
              "reference": "doi:10.1126\/science.1203659",
              "mi": "0018"
            }, {
              "source": "At2g34970",
              "target": "At1g03530",
              "index": "1",
              "interolog_confidence": 2,
              "correlation_coefficient": 0.754,
              "published": false,
              "reference": "None",
              "mi": "0064"
            }, {
              "source": "At2g34970",
              "target": "At1g04170",
              "index": "1",
              "interolog_confidence": 15,
              "correlation_coefficient": 0.847,
              "published": false,
              "reference": "None",
              "mi": "0064"
            }, {
              "source": "At2g34970",
              "target": "At1g25420",
              "index": "1",
              "interolog_confidence": 2,
              "correlation_coefficient": 0.754,
              "published": false,
              "reference": "None",
              "mi": "0064"
            }, {
              "source": "At2g34970",
              "target": "At1g29940",
              "index": "1",
              "interolog_confidence": 3,
              "correlation_coefficient": 0.773,
              "published": false,
              "reference": "None",
              "mi": "0064"
            }, {
              "source": "At2g34970",
              "target": "At1g48970",
              "index": "1",
              "interolog_confidence": 125,
              "correlation_coefficient": 0.759,
              "published": false,
              "reference": "None",
              "mi": "0064"
            }, {
              "source": "At2g34970",
              "target": "At1g49240",
              "index": "1",
              "interolog_confidence": 1,
              "correlation_coefficient": 0.395,
              "published": false,
              "reference": "None",
              "mi": "0064"
            }, {
              "source": "At2g34970",
              "target": "At1g53880",
              "index": "1",
              "interolog_confidence": 208,
              "correlation_coefficient": 0.757,
              "published": false,
              "reference": "None",
              "mi": "0064"
            }, {
              "source": "At2g34970",
              "target": "At1g72320",
              "index": "1",
              "interolog_confidence": 2,
              "correlation_coefficient": 0.803,
              "published": false,
              "reference": "None",
              "mi": "0064"
            }, {
              "source": "At2g34970",
              "target": "At1g72340",
              "index": "1",
              "interolog_confidence": 1,
              "correlation_coefficient": 0.563,
              "published": false,
              "reference": "None",
              "mi": "0064"
            }, {
              "source": "At2g34970",
              "target": "At2g19710",
              "index": "1",
              "interolog_confidence": 1,
              "correlation_coefficient": 0.321,
              "published": false,
              "reference": "None",
              "mi": "0064"
            }, {
              "source": "At2g34970",
              "target": "At2g34970",
              "index": "0",
              "interolog_confidence": 2,
              "correlation_coefficient": 1,
              "published": false,
              "reference": "None",
              "mi": "0064"
            }, {
              "source": "At2g34970",
              "target": "At2g40290",
              "index": "0",
              "interolog_confidence": 15,
              "correlation_coefficient": 0.814,
              "published": false,
              "reference": "None",
              "mi": "0064"
            }, {
              "source": "At2g34970",
              "target": "At3g07300",
              "index": "0",
              "interolog_confidence": 192,
              "correlation_coefficient": 0.886,
              "published": false,
              "reference": "None",
              "mi": "0064"
            }, {
              "source": "At2g34970",
              "target": "At3g11710",
              "index": "0",
              "interolog_confidence": 2,
              "correlation_coefficient": 0.848,
              "published": false,
              "reference": "None",
              "mi": "0064"
            }, {
              "source": "At2g34970",
              "target": "At3g12110",
              "index": "1",
              "interolog_confidence": 1,
              "correlation_coefficient": 0.385,
              "published": false,
              "reference": "None",
              "mi": "0064"
            }, {
              "source": "At2g34970",
              "target": "At5g19485",
              "index": "1",
              "interolog_confidence": 1,
              "correlation_coefficient": 0,
              "published": false,
              "reference": "None",
              "mi": "0064"
            }, {
              "source": "At2g34970",
              "target": "At5g38640",
              "index": "0",
              "interolog_confidence": 20,
              "correlation_coefficient": 0.116,
              "published": false,
              "reference": "None",
              "mi": "0064"
            }],
            "At5g28770": [{
              "source": "At5g28770",
              "target": "At1g22920",
              "index": "1",
              "interolog_confidence": 0,
              "correlation_coefficient": -0.169,
              "published": true,
              "reference": "pubmed:21798944\nAI-1 MAIN\ndoi:10.1126\/science.1203659\ndoi:10.1126\/science.1203877\nbiogrid:597083",
              "mi": "0018|0018"
            }, {
              "source": "At5g28770",
              "target": "At1g35490",
              "index": "1",
              "interolog_confidence": 0,
              "correlation_coefficient": -0.1,
              "published": true,
              "reference": "doi:10.1038\/nmeth.4343",
              "mi": "None"
            }, {
              "source": "At5g28770",
              "target": "At1g59530",
              "index": "1",
              "interolog_confidence": 0,
              "correlation_coefficient": -0.043,
              "published": true,
              "reference": "doi:10.1038\/nmeth.4343",
              "mi": "None"
            }, {
              "source": "At5g28770",
              "target": "At1g75390",
              "index": "0",
              "interolog_confidence": 1,
              "correlation_coefficient": -0.147,
              "published": true,
              "reference": "doi:10.1038\/nmeth.4343\npubmed:16709202\nbiogrid:337514\nbiogrid:337488",
              "mi": "0018|0018"
            }, {
              "source": "At5g28770",
              "target": "At2g18160",
              "index": "0",
              "interolog_confidence": 3,
              "correlation_coefficient": 0.31,
              "published": true,
              "reference": "doi:10.1038\/nmeth.4343\npubmed:16709202\nbiogrid:337509\nbiogrid:337484",
              "mi": "0018|0018"
            }, {
              "source": "At5g28770",
              "target": "At2g22850",
              "index": "1",
              "interolog_confidence": 0,
              "correlation_coefficient": 0.089,
              "published": true,
              "reference": "doi:10.1038\/nmeth.4343",
              "mi": "None"
            }, {
              "source": "At5g28770",
              "target": "At2g31070",
              "index": "1",
              "interolog_confidence": 0,
              "correlation_coefficient": 0.317,
              "published": true,
              "reference": "doi:10.1038\/nmeth.4343",
              "mi": "None"
            }, {
              "source": "At5g28770",
              "target": "At2g37120",
              "index": "1",
              "interolog_confidence": 0,
              "correlation_coefficient": -0.176,
              "published": true,
              "reference": "doi:10.1038\/nmeth.4343",
              "mi": "None"
            }, {
              "source": "At5g28770",
              "target": "At2g45680",
              "index": "1",
              "interolog_confidence": 0,
              "correlation_coefficient": 0.149,
              "published": true,
              "reference": "doi:10.1038\/nmeth.4343",
              "mi": "None"
            }, {
              "source": "At5g28770",
              "target": "At3g03800",
              "index": "1",
              "interolog_confidence": 0,
              "correlation_coefficient": -0.109,
              "published": true,
              "reference": "doi:10.1126\/science.1203659",
              "mi": "None"
            }, {
              "source": "At5g28770",
              "target": "At3g07650",
              "index": "1",
              "interolog_confidence": 0,
              "correlation_coefficient": 0.063,
              "published": true,
              "reference": "doi:10.1038\/nmeth.4343",
              "mi": "None"
            }, {
              "source": "At5g28770",
              "target": "At3g15030",
              "index": "1",
              "interolog_confidence": 0,
              "correlation_coefficient": 0.174,
              "published": true,
              "reference": "doi:10.1038\/nmeth.4343",
              "mi": "None"
            }, {
              "source": "At5g28770",
              "target": "At3g47620",
              "index": "1",
              "interolog_confidence": 0,
              "correlation_coefficient": 0.514,
              "published": true,
              "reference": "doi:10.1038\/nmeth.4343",
              "mi": "None"
            }, {
              "source": "At5g28770",
              "target": "At3g49760",
              "index": "1",
              "interolog_confidence": 0,
              "correlation_coefficient": 0.014,
              "published": true,
              "reference": "doi:10.1038\/nmeth.4343",
              "mi": "None"
            }, {
              "source": "At5g28770",
              "target": "At3g54390",
              "index": "1",
              "interolog_confidence": 0,
              "correlation_coefficient": -0.054,
              "published": true,
              "reference": "doi:10.1038\/nmeth.4343",
              "mi": "None"
            }, {
              "source": "At5g28770",
              "target": "At3g61910",
              "index": "1",
              "interolog_confidence": 0,
              "correlation_coefficient": -0.014,
              "published": true,
              "reference": "doi:10.1038\/nmeth.4343",
              "mi": "None"
            }, {
              "source": "At5g28770",
              "target": "At3g62420",
              "index": "0",
              "interolog_confidence": 3,
              "correlation_coefficient": 0.062,
              "published": true,
              "reference": "pubmed:16709202\nbiogrid:337485\nbiogrid:337482",
              "mi": "0018|0018"
            }, {
              "source": "At5g28770",
              "target": "At4g02640",
              "index": "0",
              "interolog_confidence": 1,
              "correlation_coefficient": -0.102,
              "published": true,
              "reference": "pubmed:16709202\nbiogrid:337534",
              "mi": "0064|0018|0018"
            }, {
              "source": "At5g28770",
              "target": "At4g18390",
              "index": "1",
              "interolog_confidence": 0,
              "correlation_coefficient": 0.169,
              "published": true,
              "reference": "doi:10.1038\/nmeth.4343",
              "mi": "None"
            }, {
              "source": "At5g28770",
              "target": "At4g34590",
              "index": "0",
              "interolog_confidence": 2,
              "correlation_coefficient": -0.128,
              "published": true,
              "reference": "doi:10.1038\/nmeth.4343\npubmed:16709202\nbiogrid:337511\nbiogrid:337486",
              "mi": "0018|0018"
            }, {
              "source": "At5g28770",
              "target": "At4g35550",
              "index": "1",
              "interolog_confidence": 0,
              "correlation_coefficient": 0.08,
              "published": true,
              "reference": "doi:10.1038\/nmeth.4343",
              "mi": "None"
            }, {
              "source": "At5g28770",
              "target": "At5g08410",
              "index": "1",
              "interolog_confidence": 0,
              "correlation_coefficient": 0.291,
              "published": true,
              "reference": "pubmed:21798944\nAI-1 MAIN\ndoi:10.1126\/science.1203877\nbiogrid:595541",
              "mi": "0018|0018"
            }, {
              "source": "At5g28770",
              "target": "At5g12980",
              "index": "1",
              "interolog_confidence": 0,
              "correlation_coefficient": -0.275,
              "published": true,
              "reference": "doi:10.1038\/nmeth.4343",
              "mi": "None"
            }, {
              "source": "At5g28770",
              "target": "At5g17800",
              "index": "1",
              "interolog_confidence": 0,
              "correlation_coefficient": 0.008,
              "published": true,
              "reference": "doi:10.1038\/nmeth.4343",
              "mi": "None"
            }, {
              "source": "At5g28770",
              "target": "At5g24050",
              "index": "1",
              "interolog_confidence": 0,
              "correlation_coefficient": "None",
              "published": true,
              "reference": "doi:10.1038\/nmeth.4343",
              "mi": "None"
            }, {
              "source": "At5g28770",
              "target": "At5g24800",
              "index": "0",
              "interolog_confidence": 1,
              "correlation_coefficient": 0.012,
              "published": true,
              "reference": "pubmed:16709202\nbiogrid:337532",
              "mi": "0064|0018|0018"
            }, {
              "source": "At5g28770",
              "target": "At5g28770",
              "index": "0",
              "interolog_confidence": 1,
              "correlation_coefficient": 1,
              "published": true,
              "reference": "pubmed:15469500",
              "mi": "0064|0090"
            }, {
              "source": "At5g28770",
              "target": "At5g43540",
              "index": "0",
              "interolog_confidence": 0,
              "correlation_coefficient": "None",
              "published": true,
              "reference": "doi:10.1038\/nmeth.4343",
              "mi": "None"
            }, {
              "source": "At5g28770",
              "target": "At5g49450",
              "index": "1",
              "interolog_confidence": 3,
              "correlation_coefficient": 0.333,
              "published": true,
              "reference": "doi:10.1038\/nmeth.4343\npubmed:16709202\nbiogrid:337487\nbiogrid:337506",
              "mi": "0018|0018"
            }, {
              "source": "At5g28770",
              "target": "At5g58080",
              "index": "1",
              "interolog_confidence": 0,
              "correlation_coefficient": -0.028,
              "published": true,
              "reference": "biogrid:1238138\npubmed:24948556",
              "mi": "0055"
            }, {
              "source": "At5g28770",
              "target": "At3g54620",
              "index": "0",
              "interolog_confidence": 1,
              "correlation_coefficient": 0.409,
              "published": false,
              "reference": "None",
              "mi": "0064"
            }, {
              "source": "At5g28770",
              "target": "At1g01140",
              "index": "2",
              "interolog_confidence": 4.67e-5,
              "correlation_coefficient": 0.202,
              "published": false,
              "reference": "pubmed:27117388",
              "mi": "1178"
            }, {
              "source": "At5g28770",
              "target": "At1g08190",
              "index": "2",
              "interolog_confidence": 1.29e-5,
              "correlation_coefficient": 0.157,
              "published": false,
              "reference": "pubmed:27117388",
              "mi": "1178"
            }, {
              "source": "At5g28770",
              "target": "At1g09210",
              "index": "2",
              "interolog_confidence": 2.16e-5,
              "correlation_coefficient": -0.195,
              "published": false,
              "reference": "pubmed:27117388",
              "mi": "1178"
            }, {
              "source": "At5g28770",
              "target": "At1g09540",
              "index": "2",
              "interolog_confidence": 4.45e-5,
              "correlation_coefficient": "None",
              "published": false,
              "reference": "pubmed:27117388",
              "mi": "1178"
            }, {
              "source": "At5g28770",
              "target": "At1g11890",
              "index": "2",
              "interolog_confidence": 8.16e-5,
              "correlation_coefficient": -0.098,
              "published": false,
              "reference": "pubmed:27117388",
              "mi": "1178"
            }, {
              "source": "At5g28770",
              "target": "At1g12200",
              "index": "2",
              "interolog_confidence": 2.16e-5,
              "correlation_coefficient": -0.038,
              "published": false,
              "reference": "pubmed:27117388",
              "mi": "1178"
            }, {
              "source": "At5g28770",
              "target": "At1g16290",
              "index": "2",
              "interolog_confidence": 9.36e-5,
              "correlation_coefficient": -0.135,
              "published": false,
              "reference": "pubmed:27117388",
              "mi": "1178"
            }, {
              "source": "At5g28770",
              "target": "At1g20070",
              "index": "2",
              "interolog_confidence": 1.25e-5,
              "correlation_coefficient": -0.142,
              "published": false,
              "reference": "pubmed:27117388",
              "mi": "1178"
            }, {
              "source": "At5g28770",
              "target": "At1g21060",
              "index": "2",
              "interolog_confidence": 9.86e-5,
              "correlation_coefficient": 0.24,
              "published": false,
              "reference": "pubmed:27117388",
              "mi": "1178"
            }, {
              "source": "At5g28770",
              "target": "At1g22160",
              "index": "2",
              "interolog_confidence": 4.48e-5,
              "correlation_coefficient": 0.039,
              "published": false,
              "reference": "pubmed:27117388",
              "mi": "1178"
            }, {
              "source": "At5g28770",
              "target": "At1g28140",
              "index": "2",
              "interolog_confidence": 2.06e-5,
              "correlation_coefficient": 0.153,
              "published": false,
              "reference": "pubmed:27117388",
              "mi": "1178"
            }, {
              "source": "At5g28770",
              "target": "At1g30520",
              "index": "2",
              "interolog_confidence": 1.46e-6,
              "correlation_coefficient": 0.258,
              "published": false,
              "reference": "pubmed:27117388",
              "mi": "1178"
            }, {
              "source": "At5g28770",
              "target": "At1g33060",
              "index": "2",
              "interolog_confidence": 4.14e-5,
              "correlation_coefficient": -0.223,
              "published": false,
              "reference": "pubmed:27117388",
              "mi": "1178"
            }, {
              "source": "At5g28770",
              "target": "At1g48330",
              "index": "2",
              "interolog_confidence": 1.67e-5,
              "correlation_coefficient": 0.04,
              "published": false,
              "reference": "pubmed:27117388",
              "mi": "1178"
            }, {
              "source": "At5g28770",
              "target": "At1g48840",
              "index": "2",
              "interolog_confidence": 2.06e-5,
              "correlation_coefficient": -0.264,
              "published": false,
              "reference": "pubmed:27117388",
              "mi": "1178"
            }, {
              "source": "At5g28770",
              "target": "At1g49870",
              "index": "2",
              "interolog_confidence": 9.59e-5,
              "correlation_coefficient": -0.158,
              "published": false,
              "reference": "pubmed:27117388",
              "mi": "1178"
            }, {
              "source": "At5g28770",
              "target": "At1g55740",
              "index": "2",
              "interolog_confidence": 4.36e-5,
              "correlation_coefficient": -0.139,
              "published": false,
              "reference": "pubmed:27117388",
              "mi": "1178"
            }, {
              "source": "At5g28770",
              "target": "At1g72500",
              "index": "2",
              "interolog_confidence": 3.89e-5,
              "correlation_coefficient": 0.254,
              "published": false,
              "reference": "pubmed:27117388",
              "mi": "1178"
            }, {
              "source": "At5g28770",
              "target": "At1g72640",
              "index": "2",
              "interolog_confidence": 6.86e-5,
              "correlation_coefficient": "None",
              "published": false,
              "reference": "pubmed:27117388",
              "mi": "1178"
            }, {
              "source": "At5g28770",
              "target": "At1g73170",
              "index": "2",
              "interolog_confidence": 8.43e-5,
              "correlation_coefficient": 0.423,
              "published": false,
              "reference": "pubmed:27117388",
              "mi": "1178"
            }, {
              "source": "At5g28770",
              "target": "At1g75450",
              "index": "2",
              "interolog_confidence": 3.61e-5,
              "correlation_coefficient": -0.155,
              "published": false,
              "reference": "pubmed:27117388",
              "mi": "1178"
            }, {
              "source": "At5g28770",
              "target": "At1g76020",
              "index": "2",
              "interolog_confidence": 9.43e-7,
              "correlation_coefficient": 0.167,
              "published": false,
              "reference": "pubmed:27117388",
              "mi": "1178"
            }, {
              "source": "At5g28770",
              "target": "At1g77710",
              "index": "2",
              "interolog_confidence": 4.95e-5,
              "correlation_coefficient": -0.187,
              "published": false,
              "reference": "pubmed:27117388",
              "mi": "1178"
            }, {
              "source": "At5g28770",
              "target": "At1g79110",
              "index": "2",
              "interolog_confidence": 8.81e-5,
              "correlation_coefficient": -0.127,
              "published": false,
              "reference": "pubmed:27117388",
              "mi": "1178"
            }, {
              "source": "At5g28770",
              "target": "At1g79310",
              "index": "2",
              "interolog_confidence": 6.96e-5,
              "correlation_coefficient": -0.031,
              "published": false,
              "reference": "pubmed:27117388",
              "mi": "1178"
            }, {
              "source": "At5g28770",
              "target": "At1g79650",
              "index": "2",
              "interolog_confidence": 4.14e-5,
              "correlation_coefficient": -0.275,
              "published": false,
              "reference": "pubmed:27117388",
              "mi": "1178"
            }, {
              "source": "At5g28770",
              "target": "At2g05070",
              "index": "2",
              "interolog_confidence": 3.4e-5,
              "correlation_coefficient": 0.567,
              "published": false,
              "reference": "pubmed:27117388",
              "mi": "1178"
            }, {
              "source": "At5g28770",
              "target": "At2g15695",
              "index": "2",
              "interolog_confidence": 4.68e-6,
              "correlation_coefficient": -0.118,
              "published": false,
              "reference": "pubmed:27117388",
              "mi": "1178"
            }, {
              "source": "At5g28770",
              "target": "At2g17700",
              "index": "2",
              "interolog_confidence": 1.46e-6,
              "correlation_coefficient": -0.14,
              "published": false,
              "reference": "pubmed:27117388",
              "mi": "1178"
            }, {
              "source": "At5g28770",
              "target": "At2g19810",
              "index": "2",
              "interolog_confidence": 3.12e-5,
              "correlation_coefficient": 0.031,
              "published": false,
              "reference": "pubmed:27117388",
              "mi": "1178"
            }, {
              "source": "At5g28770",
              "target": "At2g24130",
              "index": "2",
              "interolog_confidence": 1.44e-5,
              "correlation_coefficient": -0.034,
              "published": false,
              "reference": "pubmed:27117388",
              "mi": "1178"
            }, {
              "source": "At5g28770",
              "target": "At2g34450",
              "index": "2",
              "interolog_confidence": 6.86e-5,
              "correlation_coefficient": -0.186,
              "published": false,
              "reference": "pubmed:27117388",
              "mi": "1178"
            }, {
              "source": "At5g28770",
              "target": "At2g38060",
              "index": "2",
              "interolog_confidence": 2.38e-7,
              "correlation_coefficient": -0.143,
              "published": false,
              "reference": "pubmed:27117388",
              "mi": "1178"
            }, {
              "source": "At5g28770",
              "target": "At2g41790",
              "index": "2",
              "interolog_confidence": 1.44e-5,
              "correlation_coefficient": 0.065,
              "published": false,
              "reference": "pubmed:27117388",
              "mi": "1178"
            }, {
              "source": "At5g28770",
              "target": "At2g41830",
              "index": "2",
              "interolog_confidence": 8.75e-6,
              "correlation_coefficient": 0.008,
              "published": false,
              "reference": "pubmed:27117388",
              "mi": "1178"
            }, {
              "source": "At5g28770",
              "target": "At2g43000",
              "index": "2",
              "interolog_confidence": 5.22e-5,
              "correlation_coefficient": -0.009,
              "published": false,
              "reference": "pubmed:27117388",
              "mi": "1178"
            }, {
              "source": "At5g28770",
              "target": "At2g44500",
              "index": "2",
              "interolog_confidence": 4.68e-6,
              "correlation_coefficient": 0.26,
              "published": false,
              "reference": "pubmed:27117388",
              "mi": "1178"
            }, {
              "source": "At5g28770",
              "target": "At2g45910",
              "index": "2",
              "interolog_confidence": 6.43e-6,
              "correlation_coefficient": -0.12,
              "published": false,
              "reference": "pubmed:27117388",
              "mi": "1178"
            }, {
              "source": "At5g28770",
              "target": "At2g47760",
              "index": "2",
              "interolog_confidence": 4.72e-5,
              "correlation_coefficient": -0.023,
              "published": false,
              "reference": "pubmed:27117388",
              "mi": "1178"
            }, {
              "source": "At5g28770",
              "target": "At3g02710",
              "index": "2",
              "interolog_confidence": 2.71e-5,
              "correlation_coefficient": -0.164,
              "published": false,
              "reference": "pubmed:27117388",
              "mi": "1178"
            }, {
              "source": "At5g28770",
              "target": "At3g04890",
              "index": "2",
              "interolog_confidence": 8.6e-5,
              "correlation_coefficient": 0.088,
              "published": false,
              "reference": "pubmed:27117388",
              "mi": "1178"
            }, {
              "source": "At5g28770",
              "target": "At3g05440",
              "index": "2",
              "interolog_confidence": 9.09e-5,
              "correlation_coefficient": 0.034,
              "published": false,
              "reference": "pubmed:27117388",
              "mi": "1178"
            }, {
              "source": "At5g28770",
              "target": "At3g09660",
              "index": "2",
              "interolog_confidence": 6.01e-5,
              "correlation_coefficient": -0.146,
              "published": false,
              "reference": "pubmed:27117388",
              "mi": "1178"
            }, {
              "source": "At5g28770",
              "target": "At3g11450",
              "index": "2",
              "interolog_confidence": 3.78e-6,
              "correlation_coefficient": -0.225,
              "published": false,
              "reference": "pubmed:27117388",
              "mi": "1178"
            }, {
              "source": "At5g28770",
              "target": "At3g14180",
              "index": "2",
              "interolog_confidence": 4.68e-6,
              "correlation_coefficient": -0.299,
              "published": false,
              "reference": "pubmed:27117388",
              "mi": "1178"
            }, {
              "source": "At5g28770",
              "target": "At3g25160",
              "index": "2",
              "interolog_confidence": 1.9e-6,
              "correlation_coefficient": -0.181,
              "published": false,
              "reference": "pubmed:27117388",
              "mi": "1178"
            }, {
              "source": "At5g28770",
              "target": "At3g47500",
              "index": "2",
              "interolog_confidence": 7.57e-6,
              "correlation_coefficient": 0.375,
              "published": false,
              "reference": "pubmed:27117388",
              "mi": "1178"
            }, {
              "source": "At5g28770",
              "target": "At3g51990",
              "index": "2",
              "interolog_confidence": 5.48e-5,
              "correlation_coefficient": -0.18,
              "published": false,
              "reference": "pubmed:27117388",
              "mi": "1178"
            }, {
              "source": "At5g28770",
              "target": "At3g54180",
              "index": "2",
              "interolog_confidence": 2.52e-5,
              "correlation_coefficient": -0.115,
              "published": false,
              "reference": "pubmed:27117388",
              "mi": "1178"
            }, {
              "source": "At5g28770",
              "target": "At3g56350",
              "index": "2",
              "interolog_confidence": 1.9e-6,
              "correlation_coefficient": -0.286,
              "published": false,
              "reference": "pubmed:27117388",
              "mi": "1178"
            }, {
              "source": "At5g28770",
              "target": "At3g60220",
              "index": "2",
              "interolog_confidence": 8.49e-5,
              "correlation_coefficient": -0.06,
              "published": false,
              "reference": "pubmed:27117388",
              "mi": "1178"
            }, {
              "source": "At5g28770",
              "target": "At3g63060",
              "index": "2",
              "interolog_confidence": 7.74e-5,
              "correlation_coefficient": -0.053,
              "published": false,
              "reference": "pubmed:27117388",
              "mi": "1178"
            }, {
              "source": "At5g28770",
              "target": "At3g63080",
              "index": "2",
              "interolog_confidence": 2.58e-5,
              "correlation_coefficient": 0.06,
              "published": false,
              "reference": "pubmed:27117388",
              "mi": "1178"
            }, {
              "source": "At5g28770",
              "target": "At3g63440",
              "index": "2",
              "interolog_confidence": 2.09e-5,
              "correlation_coefficient": 0.123,
              "published": false,
              "reference": "pubmed:27117388",
              "mi": "1178"
            }, {
              "source": "At5g28770",
              "target": "At4g01800",
              "index": "2",
              "interolog_confidence": 1.1e-5,
              "correlation_coefficient": 0.413,
              "published": false,
              "reference": "pubmed:27117388",
              "mi": "1178"
            }, {
              "source": "At5g28770",
              "target": "At4g04640",
              "index": "2",
              "interolog_confidence": 1.46e-6,
              "correlation_coefficient": 0.531,
              "published": false,
              "reference": "pubmed:27117388",
              "mi": "1178"
            }, {
              "source": "At5g28770",
              "target": "At4g05010",
              "index": "2",
              "interolog_confidence": 6.09e-5,
              "correlation_coefficient": "None",
              "published": false,
              "reference": "pubmed:27117388",
              "mi": "1178"
            }, {
              "source": "At5g28770",
              "target": "At4g09020",
              "index": "2",
              "interolog_confidence": 7.16e-6,
              "correlation_coefficient": -0.169,
              "published": false,
              "reference": "pubmed:27117388",
              "mi": "1178"
            }, {
              "source": "At5g28770",
              "target": "At4g11570",
              "index": "2",
              "interolog_confidence": 7.03e-5,
              "correlation_coefficient": 0.182,
              "published": false,
              "reference": "pubmed:27117388",
              "mi": "1178"
            }, {
              "source": "At5g28770",
              "target": "At4g12130",
              "index": "2",
              "interolog_confidence": 7.16e-6,
              "correlation_coefficient": -0.3,
              "published": false,
              "reference": "pubmed:27117388",
              "mi": "1178"
            }, {
              "source": "At5g28770",
              "target": "At4g16660",
              "index": "2",
              "interolog_confidence": 4.68e-6,
              "correlation_coefficient": -0.153,
              "published": false,
              "reference": "pubmed:27117388",
              "mi": "1178"
            }, {
              "source": "At5g28770",
              "target": "At4g17530",
              "index": "2",
              "interolog_confidence": 2.8e-6,
              "correlation_coefficient": -0.04,
              "published": false,
              "reference": "pubmed:27117388",
              "mi": "1178"
            }, {
              "source": "At5g28770",
              "target": "At4g18340",
              "index": "2",
              "interolog_confidence": 6.22e-5,
              "correlation_coefficient": 0.249,
              "published": false,
              "reference": "pubmed:27117388",
              "mi": "1178"
            }, {
              "source": "At5g28770",
              "target": "At4g22540",
              "index": "2",
              "interolog_confidence": 2.92e-5,
              "correlation_coefficient": 0.283,
              "published": false,
              "reference": "pubmed:27117388",
              "mi": "1178"
            }, {
              "source": "At5g28770",
              "target": "At4g26200",
              "index": "2",
              "interolog_confidence": 6.86e-5,
              "correlation_coefficient": -0.051,
              "published": false,
              "reference": "pubmed:27117388",
              "mi": "1178"
            }, {
              "source": "At5g28770",
              "target": "At4g26940",
              "index": "2",
              "interolog_confidence": 8.16e-5,
              "correlation_coefficient": 0.043,
              "published": false,
              "reference": "pubmed:27117388",
              "mi": "1178"
            }, {
              "source": "At5g28770",
              "target": "At4g26970",
              "index": "2",
              "interolog_confidence": 1.27e-6,
              "correlation_coefficient": 0.093,
              "published": false,
              "reference": "pubmed:27117388",
              "mi": "1178"
            }, {
              "source": "At5g28770",
              "target": "At4g32950",
              "index": "2",
              "interolog_confidence": 2.52e-5,
              "correlation_coefficient": 0.014,
              "published": false,
              "reference": "pubmed:27117388",
              "mi": "1178"
            }, {
              "source": "At5g28770",
              "target": "At4g34530",
              "index": "2",
              "interolog_confidence": 7.16e-6,
              "correlation_coefficient": "None",
              "published": false,
              "reference": "pubmed:27117388",
              "mi": "1178"
            }, {
              "source": "At5g28770",
              "target": "At4g34860",
              "index": "2",
              "interolog_confidence": 2.82e-5,
              "correlation_coefficient": -0.369,
              "published": false,
              "reference": "pubmed:27117388",
              "mi": "1178"
            }, {
              "source": "At5g28770",
              "target": "At4g35760",
              "index": "2",
              "interolog_confidence": 6.43e-6,
              "correlation_coefficient": 0.407,
              "published": false,
              "reference": "pubmed:27117388",
              "mi": "1178"
            }, {
              "source": "At5g28770",
              "target": "At4g36010",
              "index": "2",
              "interolog_confidence": 3.96e-5,
              "correlation_coefficient": -0.085,
              "published": false,
              "reference": "pubmed:27117388",
              "mi": "1178"
            }, {
              "source": "At5g28770",
              "target": "At4g36790",
              "index": "2",
              "interolog_confidence": 4.14e-5,
              "correlation_coefficient": 0.079,
              "published": false,
              "reference": "pubmed:27117388",
              "mi": "1178"
            }, {
              "source": "At5g28770",
              "target": "At4g37710",
              "index": "2",
              "interolog_confidence": 3.2e-5,
              "correlation_coefficient": -0.041,
              "published": false,
              "reference": "pubmed:27117388",
              "mi": "1178"
            }, {
              "source": "At5g28770",
              "target": "At4g39730",
              "index": "2",
              "interolog_confidence": 1.46e-6,
              "correlation_coefficient": -0.023,
              "published": false,
              "reference": "pubmed:27117388",
              "mi": "1178"
            }, {
              "source": "At5g28770",
              "target": "At4g39800",
              "index": "2",
              "interolog_confidence": 2.16e-5,
              "correlation_coefficient": 0.159,
              "published": false,
              "reference": "pubmed:27117388",
              "mi": "1178"
            }, {
              "source": "At5g28770",
              "target": "At4g39900",
              "index": "2",
              "interolog_confidence": 1.15e-5,
              "correlation_coefficient": 0.176,
              "published": false,
              "reference": "pubmed:27117388",
              "mi": "1178"
            }, {
              "source": "At5g28770",
              "target": "At5g04900",
              "index": "2",
              "interolog_confidence": 8.04e-5,
              "correlation_coefficient": 0.043,
              "published": false,
              "reference": "pubmed:27117388",
              "mi": "1178"
            }, {
              "source": "At5g28770",
              "target": "At5g10500",
              "index": "2",
              "interolog_confidence": 1.58e-5,
              "correlation_coefficient": -0.137,
              "published": false,
              "reference": "pubmed:27117388",
              "mi": "1178"
            }, {
              "source": "At5g28770",
              "target": "At5g14640",
              "index": "2",
              "interolog_confidence": 1.29e-5,
              "correlation_coefficient": -0.12,
              "published": false,
              "reference": "pubmed:27117388",
              "mi": "1178"
            }, {
              "source": "At5g28770",
              "target": "At5g18450",
              "index": "2",
              "interolog_confidence": 9.74e-6,
              "correlation_coefficient": -0.258,
              "published": false,
              "reference": "pubmed:27117388",
              "mi": "1178"
            }, {
              "source": "At5g28770",
              "target": "At5g23050",
              "index": "2",
              "interolog_confidence": 9.59e-5,
              "correlation_coefficient": 0.01,
              "published": false,
              "reference": "pubmed:27117388",
              "mi": "1178"
            }, {
              "source": "At5g28770",
              "target": "At5g24880",
              "index": "2",
              "interolog_confidence": 1.53e-5,
              "correlation_coefficient": -0.125,
              "published": false,
              "reference": "pubmed:27117388",
              "mi": "1178"
            }, {
              "source": "At5g28770",
              "target": "At5g25540",
              "index": "2",
              "interolog_confidence": 2.8e-6,
              "correlation_coefficient": -0.062,
              "published": false,
              "reference": "pubmed:27117388",
              "mi": "1178"
            }, {
              "source": "At5g28770",
              "target": "At5g36170",
              "index": "2",
              "interolog_confidence": 1.46e-6,
              "correlation_coefficient": 0.313,
              "published": false,
              "reference": "pubmed:27117388",
              "mi": "1178"
            }, {
              "source": "At5g28770",
              "target": "At5g40382",
              "index": "2",
              "interolog_confidence": 4.36e-5,
              "correlation_coefficient": "None",
              "published": false,
              "reference": "pubmed:27117388",
              "mi": "1178"
            }, {
              "source": "At5g28770",
              "target": "At5g42800",
              "index": "2",
              "interolog_confidence": 5.22e-5,
              "correlation_coefficient": -0.127,
              "published": false,
              "reference": "pubmed:27117388",
              "mi": "1178"
            }, {
              "source": "At5g28770",
              "target": "At5g45660",
              "index": "2",
              "interolog_confidence": 3.31e-7,
              "correlation_coefficient": "None",
              "published": false,
              "reference": "pubmed:27117388",
              "mi": "1178"
            }, {
              "source": "At5g28770",
              "target": "At5g54530",
              "index": "2",
              "interolog_confidence": 4.93e-5,
              "correlation_coefficient": -0.048,
              "published": false,
              "reference": "pubmed:27117388",
              "mi": "1178"
            }, {
              "source": "At5g28770",
              "target": "At5g55700",
              "index": "2",
              "interolog_confidence": 3.31e-7,
              "correlation_coefficient": -0.08,
              "published": false,
              "reference": "pubmed:27117388",
              "mi": "1178"
            }, {
              "source": "At5g28770",
              "target": "At5g55810",
              "index": "2",
              "interolog_confidence": 8.29e-5,
              "correlation_coefficient": -0.011,
              "published": false,
              "reference": "pubmed:27117388",
              "mi": "1178"
            }, {
              "source": "At5g28770",
              "target": "At5g56180",
              "index": "2",
              "interolog_confidence": 3.4e-5,
              "correlation_coefficient": 0.057,
              "published": false,
              "reference": "pubmed:27117388",
              "mi": "1178"
            }, {
              "source": "At5g28770",
              "target": "At5g56970",
              "index": "2",
              "interolog_confidence": 5.22e-5,
              "correlation_coefficient": -0.153,
              "published": false,
              "reference": "pubmed:27117388",
              "mi": "1178"
            }, {
              "source": "At5g28770",
              "target": "At5g58870",
              "index": "2",
              "interolog_confidence": 1.9e-5,
              "correlation_coefficient": 0.505,
              "published": false,
              "reference": "pubmed:27117388",
              "mi": "1178"
            }, {
              "source": "At5g28770",
              "target": "At5g61790",
              "index": "2",
              "interolog_confidence": 1.1e-5,
              "correlation_coefficient": -0.258,
              "published": false,
              "reference": "pubmed:27117388",
              "mi": "1178"
            }, {
              "source": "At5g28770",
              "target": "At5g61940",
              "index": "2",
              "interolog_confidence": 8.49e-5,
              "correlation_coefficient": -0.122,
              "published": false,
              "reference": "pubmed:27117388",
              "mi": "1178"
            }, {
              "source": "At5g28770",
              "target": "At5g64180",
              "index": "2",
              "interolog_confidence": 9.59e-5,
              "correlation_coefficient": 0.041,
              "published": false,
              "reference": "pubmed:27117388",
              "mi": "1178"
            }, {
              "source": "At5g28770",
              "target": "At5g65430",
              "index": "2",
              "interolog_confidence": 1.9e-6,
              "correlation_coefficient": 0.152,
              "published": false,
              "reference": "pubmed:27117388",
              "mi": "1178"
            }, {
              "source": "At5g28770",
              "target": "At5g65440",
              "index": "2",
              "interolog_confidence": 1.9e-6,
              "correlation_coefficient": 0.091,
              "published": false,
              "reference": "pubmed:27117388",
              "mi": "1178"
            }, {
              "source": "At5g28770",
              "target": "At5g66120",
              "index": "2",
              "interolog_confidence": 5.01e-5,
              "correlation_coefficient": 0.227,
              "published": false,
              "reference": "pubmed:27117388",
              "mi": "1178"
            }, {
              "source": "At5g28770",
              "target": "At5g67280",
              "index": "2",
              "interolog_confidence": 8.35e-6,
              "correlation_coefficient": -0.094,
              "published": false,
              "reference": "pubmed:27117388",
              "mi": "1178"
            }],
            "At5g43700": [{
              "source": "At5g43700",
              "target": "At1g04100",
              "index": "1",
              "interolog_confidence": 0,
              "correlation_coefficient": -0.135,
              "published": true,
              "reference": "pubmed:21798944\npubmed:21734647\ndoi:10.1038\/nmeth.4343\nAI-1 REPEAT\nAI-1 MAIN\ndoi:10.1126\/science.1203659\ndoi:10.1126\/science.1203877\nbiogrid:1110338\nbiogrid:598091",
              "mi": "0018|0018|0018"
            }, {
              "source": "At5g43700",
              "target": "At1g04240",
              "index": "1",
              "interolog_confidence": 0,
              "correlation_coefficient": 0.468,
              "published": true,
              "reference": "pubmed:21734647\ndoi:10.1038\/nmeth.4343\nbiogrid:1110310",
              "mi": "0018"
            }, {
              "source": "At5g43700",
              "target": "At1g04250",
              "index": "1",
              "interolog_confidence": 0,
              "correlation_coefficient": 0.432,
              "published": true,
              "reference": "pubmed:21734647\ndoi:10.1038\/nmeth.4343\nbiogrid:1110331",
              "mi": "0018"
            }, {
              "source": "At5g43700",
              "target": "At1g04550",
              "index": "0",
              "interolog_confidence": 0,
              "correlation_coefficient": 0.017,
              "published": true,
              "reference": "biogrid:1110336\npubmed:21734647",
              "mi": "0018"
            }, {
              "source": "At5g43700",
              "target": "At1g15050",
              "index": "1",
              "interolog_confidence": 0,
              "correlation_coefficient": -0.229,
              "published": true,
              "reference": "pubmed:21734647\ndoi:10.1038\/nmeth.4343\nbiogrid:1110349",
              "mi": "0018"
            }, {
              "source": "At5g43700",
              "target": "At1g15580",
              "index": "1",
              "interolog_confidence": 0,
              "correlation_coefficient": 0.196,
              "published": true,
              "reference": "pubmed:21734647\ndoi:10.1038\/nmeth.4343\nbiogrid:1110341",
              "mi": "0018"
            }, {
              "source": "At5g43700",
              "target": "At1g15750",
              "index": "1",
              "interolog_confidence": 0,
              "correlation_coefficient": -0.054,
              "published": true,
              "reference": "biogrid:575221\npubmed:22065421",
              "mi": "0018"
            }, {
              "source": "At5g43700",
              "target": "At1g19220",
              "index": "1",
              "interolog_confidence": 0,
              "correlation_coefficient": 0.121,
              "published": true,
              "reference": "pubmed:21734647\ndoi:10.1038\/nmeth.4343\nbiogrid:1110669",
              "mi": "0018"
            }, {
              "source": "At5g43700",
              "target": "At1g19850",
              "index": "0",
              "interolog_confidence": 0,
              "correlation_coefficient": -0.094,
              "published": true,
              "reference": "pubmed:25566309\nbiogrid:1110531\npubmed:21734647\nbiogrid:1111770",
              "mi": "0018|0018"
            }, {
              "source": "At5g43700",
              "target": "At1g30330",
              "index": "0",
              "interolog_confidence": 0,
              "correlation_coefficient": -0.042,
              "published": true,
              "reference": "pubmed:25566309\nbiogrid:1110580\npubmed:21734647\nbiogrid:1111799",
              "mi": "0018|0018"
            }, {
              "source": "At5g43700",
              "target": "At1g34170",
              "index": "1",
              "interolog_confidence": 0,
              "correlation_coefficient": -0.064,
              "published": true,
              "reference": "biogrid:1110662\npubmed:21734647",
              "mi": "0018"
            }, {
              "source": "At5g43700",
              "target": "At1g51950",
              "index": "0",
              "interolog_confidence": 0,
              "correlation_coefficient": 0.205,
              "published": true,
              "reference": "biogrid:1110330\npubmed:21734647",
              "mi": "0018"
            }, {
              "source": "At5g43700",
              "target": "At1g52830",
              "index": "1",
              "interolog_confidence": 0,
              "correlation_coefficient": 0.218,
              "published": true,
              "reference": "doi:10.1038\/nmeth.4343",
              "mi": "None"
            }, {
              "source": "At5g43700",
              "target": "At1g61660",
              "index": "1",
              "interolog_confidence": 0,
              "correlation_coefficient": 0.271,
              "published": true,
              "reference": "doi:10.1038\/nmeth.4343",
              "mi": "None"
            }, {
              "source": "At5g43700",
              "target": "At1g68185",
              "index": "1",
              "interolog_confidence": 0,
              "correlation_coefficient": -0.298,
              "published": true,
              "reference": "biogrid:933471\npubmed:20855607",
              "mi": "0018"
            }, {
              "source": "At5g43700",
              "target": "At1g80390",
              "index": "1",
              "interolog_confidence": 0,
              "correlation_coefficient": "None",
              "published": true,
              "reference": "biogrid:1110333\npubmed:21734647",
              "mi": "0018"
            }, {
              "source": "At5g43700",
              "target": "At2g01200",
              "index": "1",
              "interolog_confidence": 0,
              "correlation_coefficient": "None",
              "published": true,
              "reference": "doi:10.1038\/nmeth.4343",
              "mi": "None"
            }, {
              "source": "At5g43700",
              "target": "At2g22670",
              "index": "1",
              "interolog_confidence": 0,
              "correlation_coefficient": 0.099,
              "published": true,
              "reference": "pubmed:21734647\ndoi:10.1038\/nmeth.4343\nbiogrid:1110340",
              "mi": "0018"
            }, {
              "source": "At5g43700",
              "target": "At2g33310",
              "index": "1",
              "interolog_confidence": 0,
              "correlation_coefficient": 0.087,
              "published": true,
              "reference": "pubmed:21734647\ndoi:10.1038\/nmeth.4343\nbiogrid:1110335",
              "mi": "0018"
            }, {
              "source": "At5g43700",
              "target": "At2g46990",
              "index": "0",
              "interolog_confidence": 0,
              "correlation_coefficient": -0.146,
              "published": true,
              "reference": "biogrid:1110353\npubmed:21734647",
              "mi": "0018"
            }, {
              "source": "At5g43700",
              "target": "At3g04730",
              "index": "1",
              "interolog_confidence": 0,
              "correlation_coefficient": 0.473,
              "published": true,
              "reference": "pubmed:21734647\ndoi:10.1038\/nmeth.4343\nbiogrid:1110332",
              "mi": "0018"
            }, {
              "source": "At5g43700",
              "target": "At3g15540",
              "index": "1",
              "interolog_confidence": 0,
              "correlation_coefficient": 0.266,
              "published": true,
              "reference": "pubmed:21734647\ndoi:10.1038\/nmeth.4343\nbiogrid:1110329",
              "mi": "0018"
            }, {
              "source": "At5g43700",
              "target": "At3g16500",
              "index": "1",
              "interolog_confidence": 0,
              "correlation_coefficient": 0.088,
              "published": true,
              "reference": "doi:10.1038\/nmeth.4343",
              "mi": "None"
            }, {
              "source": "At5g43700",
              "target": "At3g16830",
              "index": "1",
              "interolog_confidence": 0,
              "correlation_coefficient": -0.183,
              "published": true,
              "reference": "biogrid:575222\npubmed:22065421",
              "mi": "0018"
            }, {
              "source": "At5g43700",
              "target": "At3g23030",
              "index": "1",
              "interolog_confidence": 0,
              "correlation_coefficient": 0.373,
              "published": true,
              "reference": "pubmed:21734647\ndoi:10.1038\/nmeth.4343\nbiogrid:1110300",
              "mi": "0018"
            }, {
              "source": "At5g43700",
              "target": "At3g23050",
              "index": "1",
              "interolog_confidence": 0,
              "correlation_coefficient": 0.471,
              "published": true,
              "reference": "doi:10.1038\/nmeth.4343",
              "mi": "None"
            }, {
              "source": "At5g43700",
              "target": "At3g62100",
              "index": "1",
              "interolog_confidence": 0,
              "correlation_coefficient": -0.066,
              "published": true,
              "reference": "biogrid:1110350\npubmed:21734647",
              "mi": "0018"
            }, {
              "source": "At5g43700",
              "target": "At4g14550",
              "index": "1",
              "interolog_confidence": 0,
              "correlation_coefficient": 0.377,
              "published": true,
              "reference": "pubmed:21734647\ndoi:10.1038\/nmeth.4343\nbiogrid:1110334",
              "mi": "0018"
            }, {
              "source": "At5g43700",
              "target": "At4g14560",
              "index": "1",
              "interolog_confidence": 0,
              "correlation_coefficient": 0.526,
              "published": true,
              "reference": "pubmed:21734647\ndoi:10.1038\/nmeth.4343\n197410\ndoi:10.1126\/science.1203659\nbiogrid:1110265",
              "mi": "0018|0018|0018"
            }, {
              "source": "At5g43700",
              "target": "At4g23980",
              "index": "1",
              "interolog_confidence": 0,
              "correlation_coefficient": 0.207,
              "published": true,
              "reference": "biogrid:1110637\npubmed:21734647",
              "mi": "0018"
            }, {
              "source": "At5g43700",
              "target": "At4g26840",
              "index": "0",
              "interolog_confidence": 0,
              "correlation_coefficient": -0.199,
              "published": true,
              "reference": "biogrid:933605\npubmed:20855607",
              "mi": "0004"
            }, {
              "source": "At5g43700",
              "target": "At4g28640",
              "index": "1",
              "interolog_confidence": 0,
              "correlation_coefficient": 0.322,
              "published": true,
              "reference": "pubmed:21734647\ndoi:10.1038\/nmeth.4343\nbiogrid:1110337",
              "mi": "0018"
            }, {
              "source": "At5g43700",
              "target": "At4g29080",
              "index": "1",
              "interolog_confidence": 0,
              "correlation_coefficient": 0.155,
              "published": true,
              "reference": "pubmed:21734647\ndoi:10.1038\/nmeth.4343\nbiogrid:1110352",
              "mi": "0018"
            }, {
              "source": "At5g43700",
              "target": "At5g12980",
              "index": "1",
              "interolog_confidence": 0,
              "correlation_coefficient": -0.344,
              "published": true,
              "reference": "doi:10.1038\/nmeth.4343",
              "mi": "None"
            }, {
              "source": "At5g43700",
              "target": "At5g20730",
              "index": "0",
              "interolog_confidence": 0,
              "correlation_coefficient": 0.034,
              "published": true,
              "reference": "pubmed:25566309\nbiogrid:1110588\npubmed:21734647\nbiogrid:1111828",
              "mi": "0018|0018"
            }, {
              "source": "At5g43700",
              "target": "At5g25890",
              "index": "1",
              "interolog_confidence": 0,
              "correlation_coefficient": 0.157,
              "published": true,
              "reference": "pubmed:21734647\ndoi:10.1038\/nmeth.4343\nbiogrid:1110351",
              "mi": "0018"
            }, {
              "source": "At5g43700",
              "target": "At5g37020",
              "index": "1",
              "interolog_confidence": 0,
              "correlation_coefficient": -0.014,
              "published": true,
              "reference": "biogrid:1111856\npubmed:25566309",
              "mi": "0018"
            }, {
              "source": "At5g43700",
              "target": "At5g43700",
              "index": "0",
              "interolog_confidence": 0,
              "correlation_coefficient": 1,
              "published": true,
              "reference": "pubmed:21734647\ndoi:10.1126\/science.1203659\nbiogrid:1110317",
              "mi": "0018"
            }, {
              "source": "At5g43700",
              "target": "At5g52547",
              "index": "0",
              "interolog_confidence": 0,
              "correlation_coefficient": "None",
              "published": true,
              "reference": "pubmed:21798944\nAI-1 MAIN\ndoi:10.1126\/science.1203877\nbiogrid:600150",
              "mi": "0018|0018"
            }, {
              "source": "At5g43700",
              "target": "At5g55170",
              "index": "0",
              "interolog_confidence": 0,
              "correlation_coefficient": 0.249,
              "published": true,
              "reference": "biogrid:933561\npubmed:20855607",
              "mi": "0004"
            }, {
              "source": "At5g43700",
              "target": "At5g60450",
              "index": "1",
              "interolog_confidence": 0,
              "correlation_coefficient": -0.057,
              "published": true,
              "reference": "biogrid:1111741\npubmed:25566309",
              "mi": "0018"
            }, {
              "source": "At5g43700",
              "target": "At5g65670",
              "index": "0",
              "interolog_confidence": 0,
              "correlation_coefficient": 0.293,
              "published": true,
              "reference": "biogrid:1110339\npubmed:21734647",
              "mi": "0018"
            }, {
              "source": "At5g43700",
              "target": "HOPH1_group",
              "index": "0",
              "interolog_confidence": 0,
              "correlation_coefficient": "None",
              "published": true,
              "reference": "doi:10.1126\/science.1203659",
              "mi": "0018"
            }, {
              "source": "At5g43700",
              "target": "At2g34710",
              "index": "2",
              "interolog_confidence": 0,
              "correlation_coefficient": -0.087,
              "published": true,
              "reference": "pubmed:25533953",
              "mi": "0432"
            }, {
              "source": "At5g43700",
              "target": "At3g23090",
              "index": "2",
              "interolog_confidence": 0,
              "correlation_coefficient": -0.076,
              "published": true,
              "reference": "pubmed:25533953",
              "mi": "0432"
            }, {
              "source": "At5g43700",
              "target": "At4g35160",
              "index": "2",
              "interolog_confidence": 0,
              "correlation_coefficient": -0.251,
              "published": true,
              "reference": "pubmed:25533953",
              "mi": "0432"
            }, {
              "source": "At5g43700",
              "target": "At5g12870",
              "index": "2",
              "interolog_confidence": 0,
              "correlation_coefficient": 0.117,
              "published": true,
              "reference": "pubmed:22037706\npubmed:25533953",
              "mi": "0432"
            }, {
              "source": "At5g43700",
              "target": "At5g23020",
              "index": "2",
              "interolog_confidence": 0,
              "correlation_coefficient": 0.24,
              "published": true,
              "reference": "pubmed:25352272",
              "mi": "0432"
            }],
            "Double_Dap_Seq" : [
              {
                "bzip1": "AT5G28770",
                "bzip2": "AT4G34590",
                "target": "AT4G22590",
                "q-value": "999"
              },
              {
                "bzip1": "AT5G28770",
                "bzip2": "AT4G34590",
                "target": "AT4G22592",
                "q-value": "999"
              },
              {
                "bzip1": "AT5G28770",
                "bzip2": "AT4G34590",
                "target": "AT2G43120",
                "q-value": "999"
              },
              {
                "bzip1": "AT5G28770",
                "bzip2": "AT4G34590",
                "target": "AT4G01120",
                "q-value": "999"
              },
              {
                "bzip1": "AT5G28770",
                "bzip2": "AT4G34590",
                "target": "AT5G58650",
                "q-value": "999"
              },
              {
                "bzip1": "AT5G28770",
                "bzip2": "AT3G62420",
                "target": "AT1G69570",
                "q-value": "999"
              },
              {
                "bzip1": "AT5G28770",
                "bzip2": "AT3G62420",
                "target": "AT4G01120",
                "q-value": "999"
              },
              {
                "bzip1": "AT5G28770",
                "bzip2": "AT3G62420",
                "target": "AT5G62320",
                "q-value": "999"
              },
              {
                "bzip1": "AT5G28770",
                "bzip2": "AT3G62420",
                "target": "AT4G22590",
                "q-value": "999"
              }
            ]
          };
        //console.log('Before return');  
        return {res: res, ajaxCallType: 'BAR'} ;     
        //ajaxCallType for identifying when parsing Promise.all response array 
    };

    /**
     * @function createINTACTAjaxPromise - Parse through the gene form and create a bunch of AJAX requests to the INTACT PSICQUIC webservice
     * @returns {Array} - array of ajax promises that return objects when resolved
     */
    AIV.createINTACTAjaxPromise = function () {
        var returnArr = []; //return an array of AJAX promises to be concatenated later
        for (let i = 0; i < this.genesList.length; i++) {
            returnArr.push(
                $.ajax({
                    url: `https://bar.utoronto.ca/interactions2/cgi-bin/psicquic_intact_proxy.php?request=${this.genesList[i]}`,
                    type: 'GET',
                    dataType: 'text'
                })
                    .then( res => ( {res: res, ajaxCallType: 'INTACT', queryGene: this.genesList[i]} )) //ajaxCallType for identifying when parsing Promise.all response array
            );
        }
        return returnArr;
    };

    /**
     * @function createINTACTAjaxPromise - Parse through the gene form and create a bunch of AJAX requests to the BioGrid PSICQUIC webservice
     * @returns {Array} - array of ajax promises that return objects when resolved
     */
    AIV.createBioGridAjaxPromise = function () {
        var returnArr = []; //return an array of AJAX promises to be concatenated later
        for (let i = 0; i < this.genesList.length; i++) {
            returnArr.push(
                $.ajax({
                    url: `https://bar.utoronto.ca/interactions2/cgi-bin/psicquic_biogrid_proxy.php?request=${this.genesList[i]}`,
                    type: 'GET',
                    dataType: 'text'
                })
                    .then( res => ( {res: res, ajaxCallType: 'BioGrid', queryGene: this.genesList[i]} )) //ajaxCallType for identifying when parsing Promise.all response array
            );
        }
        return returnArr;
    };

    /**
     * @function fetchGeneAnnoForTable - Take an array of AGIs and perform an ajax call to get gene summaries... then modify the DOM directly
     * @param ABIsArr
     */
    AIV.fetchGeneAnnoForTable = function(ABIsArr) {
        // console.log(ABIsArr);
        this.createGeneSummariesAjaxPromise(ABIsArr)
            .then(res => {
                for(let gene of Object.keys(res)){
                    let desc = res[gene].brief_description || "";
                    let synonyms = res[gene].synonyms;
                    let firstSyn = synonyms[0];
                    let selector = this.cy.$(`#Protein_${gene}`);
                    if (firstSyn !== null){
                        $(`.${gene}-annotate`).text(firstSyn + " " + `${res[gene].brief_description}`);
                        if (selector.length > 0) { // only get proteins
                            selector.data({
                                'annotatedName': firstSyn + " "+ selector.data('name'),
                                'desc': desc,
                                'synonyms': synonyms,
                            });
                        }
                    }
                    else {
                        $(`.${gene}-annotate`).text(`${res[gene].brief_description}`);
                        if (selector.length > 0) { // only get proteins
                            selector.data({
                                'annotatedName': selector.data('name'),
                                'desc': desc,
                            });
                        }
                    }
                }
                this.cy.filter("node[id ^= 'Effector']").forEach(function(effector){
                    $(`.${effector.data('name')}-annotate`).text("null");
                });
                this.returnGeneNameCSS().update();
            })
            .catch(err => {
                alertify.logPosition("top right");
                alertify.error(`Error in gene summary fetching, ${err}`);
            });
    };

    /**
     * @function returnGeneNameCSS - return a style object such to change the labels
     * @return {Object} - cytoscape css object
     */
    AIV.returnGeneNameCSS = function(){
        return (this.cy.style()
                    .selector('node[id ^= "Protein_At"]')
                    .css({
                        'label' : 'data(annotatedName)',
                    })
        );
    };

    /**
     * @function createGeneSummariesAjaxPromise - Take in an array of AGIS and make a POST request to retrieve their gene annotations
     * @param {Array.<string>} ABIs - array of ABIs i.e. ["At5g04340","At4g30930"]
     * @returns {Object} - jQuery AJAX promise object
     */
    AIV.createGeneSummariesAjaxPromise = function(ABIs) {
        return $.ajax({
            url: "https://bar.utoronto.ca/interactions2/cgi-bin/gene_summaries_POST.php",
            type: "POST",
            data: JSON.stringify(ABIs),
            contentType: "application/json",
            dataType: "json"
        });
    };

    /**
     * @function addContextMenus - add a right click menu to the current nodes on the cy app
     */
    AIV.addContextMenus = function () {
        this.cy.contextMenus({
            menuItems: [
                {
                    id: 'remove',
                    content: '&nbsp; remove',
                    image: {src: "images/trash-can.svg", width: 12, height: 12, x: 6, y: 6},
                    selector: 'node',
                    onClickFunction: function (event) {
                        var target = event.target || event.cyTarget;
                        target.remove();
                    },
                }
            ]
        });
    };

    /**
     * @helper helperSetAttributes - helper function that sets multiple attributes in one line
     * @param {Object} el - DOM node
     * @param {Object} attrs - attribute object, eg {"src" : "www.google.ca", "data-value" : "kek"}
     */
    AIV.helperSetAttributes = function(el, attrs) {
        for(let key in attrs) {
            el.setAttribute(key, attrs[key]);
        }
    };

    // Ready to run
    $(function() {
        // Initialize AIV
        AIV.initialize();
    });
})(window, jQuery, _, cytoscape, alertify);
