import * as escodegen from 'escodegen';
import * as esprima from 'esprima';


export {parseCode,makeGraph,handleReturnStatement,getGraph,getCurrentName,handleBlockStatement,
    handleExpressionStatement,handleIfStatement,handleWhileStatement,
    reset,handleVariableDeclaration,getCurrentStr};

const parseCode = (codeToParse) => {
    return esprima.parseScript(codeToParse);
};


const func={
    'BlockStatement': handleBlockStatement,
    'ExpressionStatement' : handleExpressionStatement,
    'AssignmentExpression' : handleAssignmentExpression,
    'IfStatement' :handleIfStatement,
    'VariableDeclaration' : handleVariableDeclaration,
    'ReturnStatement' : handleReturnStatement,
    'WhileStatement' : handleWhileStatement
};


const val={
    'Literal': handleLiteralVal,
    'Identifier' : handleIdentifierVal,
    'BinaryExpression' : handleBinaryExpressionVal,
    'ArrayExpression' : handleArrayExpressionVal,
    'MemberExpression' : handleMemberExpressionVal,
    'UnaryExpression' : handleUnaryExpression,
    'LogicalExpression' :handleLogicalExpression
};

let graph;
let index;
let indexName;
let currentName;
let currentStr;
let beforeName;

function getGraph(){return graph;}
function getCurrentStr() {return currentStr;}
function getCurrentName() {return currentName;}

function createVertex(n,ispass,isCond,partOfCond){
    return{name: n, isPass: ispass,
        isCond:isCond,partOfCond:partOfCond};
}

function addCondEdge(){
    if (currentName.partOfCond)
    {
        graph=graph+beforeName.name+'(yes)->'+currentName.name+'\n';
    }
    else{
        graph=graph+beforeName.name+'(no)->'+currentName.name+'\n';
    }
}

function addCuurentNode(){
    if(currentName.isPass){
        graph=graph+currentName.name+'=>'+currentStr+'|right-path\n';
    }
    else{
        graph=graph+currentName.name+'=>'+currentStr+'\n';
    }
    if (beforeName.name!=='temp'){
        if (beforeName.isCond){
            addCondEdge();
        }
        else{
            graph=graph+beforeName.name+'->'+currentName.name+'\n';
        }
    }
}

function reset(){
    graph='';
    indexName=1;
    index=0;
    currentStr='';
    currentName=null;
    beforeName=createVertex('temp',true,false,false);
}

function makeGraph(myCode,input) {
    let code = parseCode(myCode);
    code=code.body[0];
    let env=makeInputArray(input,code.params);
    reset();

    func[code.body.type](code.body,env);
    return graph;

}

function handleBlockStatement(code,env){
    for (let i=0; i<code.body.length; i++){
        func[code.body[i].type](code.body[i],env);
    }
}

function handleVariableDeclaration(code,env){
    if (currentStr===''){
        currentName=createVertex('a'+index,beforeName.isPass,false,beforeName.partOfCond);
        currentStr='operation: -'+indexName+'-\n';
        index++; indexName++;
    }
    let str=escodegen.generate(code).replace(/\n/g,'');
    currentStr=currentStr+str.substr(4,str.length -5)+'\n';
    for (let i=0; i<code.declarations.length; i++){
        handleVariableDeclarator(code.declarations[i],env);
    }
}

function handleVariableDeclarator(code,env){
    if (code.init==null) {
        env[escodegen.generate(code.id).replace(/\n/g,'')] = null;
    }
    else {
        env[escodegen.generate(code.id).replace(/\n/g,'')]=val[code.init.type](code.init, env);
    }
}

function handleExpressionStatement(code,env){
    func[code.expression.type](code.expression,env);
}

function handleAssignmentExpression(code, env){
    if (currentStr===''){
        currentName=createVertex('a'+index,beforeName.isPass,false,beforeName.partOfCond);
        currentStr='operation: -'+indexName+'-\n';
        index++; indexName++;
    }
    let str=escodegen.generate(code).replace(/\n/g,'');
    str.replace('\n','');
    currentStr=currentStr+str+'\n';
    updateEnv(code,env);
}

function updateEnv(code,env){
    if (code.left.type ==='MemberExpression'){
        updateEnvMemberExp(code,env);
    }
    else{
        let left=escodegen.generate(code.left).replace(/\n/g,'');
        let right= val[code.right.type](code.right,env);
        env[left]=right;
    }
}

function updateEnvMemberExp(code,env){
    let loc=val[code.left.property.type](code.left.property,env);
    let right=val[code.right.type](code.right,env);
    let locValue=eval(loc);
    updateArrayInEnv(escodegen.generate(code.left.object).replace(/\n/g,''),locValue,env,right);
}

function updateArrayInEnv(arrayName,loc,env,newVal){
    let array=parseCode(env[arrayName]).body[0].expression.elements;
    let ans='[';
    for (let i=0; i<array.length; i++){
        if (i!==loc){
            ans=ans+escodegen.generate(array[i]).replace(/\n/g,'')+',';
        }
        else ans=ans+newVal+',';
    }
    ans=ans.substr(0,ans.length-1)+']';
    env[arrayName]=ans;
}

function handleReturnStatement(code){
    if (currentStr!==''){
        addCuurentNode();
        beforeName=currentName;
    }
    currentName=createVertex('a'+index,beforeName.isPass,false,beforeName.partOfCond);
    let str=escodegen.generate(code).replace(/\n/g,'');
    currentStr='operation: -'+indexName+'-\n'+str+'\n';
    index++;
    indexName++;
    addCuurentNode();
}

function handleIfStatement(code,env){
    let testVal = eval(val [code.test.type](code.test,env));
    if (currentStr!==''){ // create the before node if exist
        addCuurentNode();
        beforeName=currentName;
    }
    currentName=createVertex('a'+index,beforeName.isPass,true,beforeName.partOfCond); // create the if node
    let ifPassOrigin=currentName.isPass; let ifNode=currentName; index++;
    //current node is if cond
    let str=escodegen.generate(code.test).replace(/\n/g,'');
    currentStr='condition: -'+indexName+'-\n'+str+'\n';
    indexName++; addCuurentNode();
    beforeName=currentName; //before node is if
    currentStr='';
    //befor is if cond, current not define
    let endIfNode=createVertex('a'+index,beforeName.isPass ,false,true); //create the node of end if
    index++; let afterIfEnv=null;
    ifContinu1(code,env,ifNode,afterIfEnv,testVal,ifPassOrigin,endIfNode);
}

function ifContinu1(code,env,ifNode,afterIfEnv,testVal,ifPassOrigin,endIfNode){
    let ifEnv=Object.assign({}, env); //backup the env.
    ifNode.partOfCond=true; ifNode.isPass= ifPassOrigin && testVal;
    let Tside=handleIfconsequent(code,ifEnv);
    //beforeName=currentName;
    if (testVal) afterIfEnv=ifEnv;
    beforeName=ifNode; currentStr=''; ifEnv=Object.assign({}, env);
    ifContinu2(code,env,ifNode,ifPassOrigin,testVal,ifEnv,endIfNode,Tside);
    if (afterIfEnv==null) afterIfEnv=ifEnv;
    env=Object.assign(env, afterIfEnv);
    beforeName=currentName; currentStr='';
}

function ifContinu2(code,env,ifNode,ifPassOrigin,testVal,ifEnv,endIfNode,Tside){
    if (code.alternate!=null){
        ifNode.partOfCond=false; ifNode.isPass= ifPassOrigin && (!testVal);
        handleIfAlternate(code,ifEnv,endIfNode,Tside);
    }
    else{
        currentName=endIfNode;
        currentStr='start: null\n';
        beforeName=Tside;
        endIfNode.partOfCond=beforeName.partOfCond;
        addCuurentNode();
        graph=graph+ifNode.name+'(no)->'+currentName.name+'\n';
    }
}

function handleIfconsequent(code,ifEnv){
    func[code.consequent.type](code.consequent,ifEnv); //handle the if consequent
    //current is the last node of T part of if
    if (currentStr!==''){
        addCuurentNode();
    }

    return currentName;
}

function handleIfAlternate(code,ifEnv,endIfNode,Tside){
    func[code.alternate.type](code.alternate,ifEnv);
    let Fside=currentName;
    if (currentStr!==''){ // create the before node if exist
        addCuurentNode();
    }
    currentName=endIfNode; currentStr='start: null\n'; beforeName=Fside;
    endIfNode.partOfCond=beforeName.partOfCond;
    addCuurentNode();
    beforeName=Tside; endIfNode.partOfCond=beforeName.partOfCond;
    if (beforeName.isCond){
        addCondEdge();
    }
    else{
        graph=graph+beforeName.name+'->'+currentName.name+'\n';
    }
}

function handleWhileStatement(code,env){
    let testVal = eval(val [code.test.type](code.test,env));
    if (currentStr!==''){ // create the before node if exist
        addCuurentNode();
        beforeName=currentName;
    }
    currentName=createVertex('a'+index,beforeName.isPass,false,beforeName.partOfCond); // create the null vertex
    index++;
    currentStr='start: null\n';
    addCuurentNode();
    beforeName=currentName;

    let whileNullVertex=currentName;
    handleWhile1(code,env,testVal,whileNullVertex);
}

function handleWhile1(code,env,testVal,whileNullVertex){
    currentName=createVertex('a'+index,beforeName.isPass,true,beforeName.partOfCond); // create the while node
    let whilePassOrigin=currentName.isPass;
    let whileNode=currentName;
    index++; let str=escodegen.generate(code.test).replace(/\n/g,'');
    currentStr='condition: -'+indexName+'-\n'+str+'\n';
    indexName++;
    addCuurentNode();
    beforeName=currentName;
    currentStr='';
    handleWhile2(code,env,whileNode,whilePassOrigin,testVal,whileNullVertex);

}
function handleWhile2(code,env,whileNode,whilePassOrigin,testVal,whileNullVertex){
    let whileEnv=Object.assign({}, env); //backup the env.
    whileNode.partOfCond=true;
    whileNode.isPass= whilePassOrigin && testVal;
    handlewhileT(code,whileEnv);
    if (testVal) env=Object.assign(env, whileEnv);
    //current is the end of body node.
    beforeName=currentName; currentName=whileNullVertex;
    if (beforeName.isCond){
        addCondEdge();
    }
    else{
        graph=graph+beforeName.name+'->'+currentName.name+'\n';
    }
    whileNode.partOfCond=false; whileNode.isPass= whilePassOrigin;
    whileNode.isCond=true;
    currentName=whileNode;
    beforeName=currentName;
    currentStr='';
}


function handlewhileT(code, env){
    func[code.body.type](code.body,env); //handle while body
    if (currentStr!==''){
        addCuurentNode();
    }
}

function makeInputArray(input,params){
    let env={};
    if (input!=='') {
        let values = parseCode(input).body[0].expression;
        if (values.type === 'SequenceExpression'){
            let array = values.expressions;
            for (let i = 0; i < array.length; i++) {
                let str=escodegen.generate(array[i]).replace(/\n/g,'');
                env[params[i].name]=str;
            }
        }
        else{
            let str=escodegen.generate(values).replace(/\n/g,'');
            env[params[0].name]=str;
        }
    }
    return env;
}

/* val calc*/
function handleLiteralVal(code){
    return escodegen.generate(code).replace(/\n/g,'');
}

function handleUnaryExpression (code,env){
    return code.operator+''+val[code.argument.type](code.argument,env);
}

function handleIdentifierVal(code, env){
    //return 1;
    return env[escodegen.generate(code).replace(/\n/g,'')];
}

function handleLogicalExpression(code,env){
    let left = val[code.left.type](code.left,env);
    let right = val[code.right.type](code.right,env);
    let ans=escodegen.generate(parseCode('('+left+')' + code.operator + '(' + right +')')).replace(/\n/g,'');
    return ans.substr(0,ans.length-1);
}

function handleBinaryExpressionVal(code,env){
    let left = val[code.left.type](code.left,env);
    let right = val[code.right.type](code.right,env);

    let ans=escodegen.generate(parseCode('('+left+')' + code.operator + '(' + right +')')).replace(/\n/g,'');
    return ans.substr(0,ans.length-1);
}

function handleArrayExpressionVal(code,env){
    let ans='[';
    for (let i=0; i<code.elements.length; i++){
        ans=ans+val[code.elements[i].type](code.elements[i],env)+',';
    }
    ans=ans.substr(0,ans.length-1)+']';
    return ans;
}

function getArrayInLoc(arrayName,loc,env){
    let array=parseCode(env[arrayName]).body[0].expression.elements;
    return escodegen.generate(array[loc]).replace(/\n/g,'');
}

function handleMemberExpressionVal(code,env){
    let indexStr= val[code.property.type](code.property,env);
    let index=eval(indexStr);
    let arrayName=escodegen.generate(code.object).replace(/\n/g,'');
    return getArrayInLoc(arrayName,index,env);
}

