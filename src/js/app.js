import $ from 'jquery';
import {symbolic_substitution} from './code-analyzer';

$(document).ready(function () {
    $('#codeSubmissionButton').click(() => {
        let codeToParse = $('#codePlaceholder').val();
        let input= $('#inputPlaceholder').val();
        var theDiv = document.getElementById('parsedCode');
        let dic=symbolic_substitution(codeToParse,input);
        theDiv.innerHTML=enterLine(dic);
    });
});

function enterLine(dic){
    let ans='';
    let tabs=0;
    for (var i = 0; i < dic.length; i++) {
        if (dic[i].Line.includes('}')) tabs--;
        ans=actualLine(dic,i,ans,tabs);
        if (dic[i].Line.includes('{')) tabs++;

    }
    return ans;
}
function actualLine(dic,i,ans,tabs){
    for (let j=0; j<tabs; j++) {
        ans=ans+'<span>&nbsp;&nbsp;&nbsp;</span>';
    }
    if (dic[i].Color===0) ans=ans+'<span>'+dic[i].Line+'</span><br>';
    else if(dic[i].Color===1) ans=ans+'<span style="color:green;">'+dic[i].Line+'</span><br>';
    else ans=ans+'<span style="color:red;">'+dic[i].Line+'</span><br>';
    return ans;
}