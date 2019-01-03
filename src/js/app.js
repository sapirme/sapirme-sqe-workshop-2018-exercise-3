import $ from 'jquery';
import {makeGraph} from './code-analyzer';

import * as flowchart from 'flowchart.js';

$(document).ready(function () {
    $('#codeSubmissionButton').click(() => {
        let codeToParse = $('#codePlaceholder').val();
        let input= $('#inputPlaceholder').val();

        let ans=makeGraph(codeToParse,input);
        var theDiv = document.getElementById('diagram');
        //theDiv.innerHTML=ans.replace(/\n/g, '<br />');
        theDiv.innerHTML='';
        showDiagram(ans);
    });
});
function showDiagram(ans){
    let diagram=flowchart.parse(ans);
    diagram.drawSVG('diagram', {
        'x': 0, 'y': 0,
        'line-width': 3, 'line-length': 50,
        'text-margin': 10,
        'font-size': 14, 'font-color': 'black',
        'line-color': 'black',
        'element-color': 'black',
        'fill': 'white',
        'yes-text': 'T',
        'no-text': 'F',
        'arrow-end': 'block',
        'scale': 1,
        'flowstate' : {
            'right-path' : {'fill' : '#58C4A3'}
        }
    });
}