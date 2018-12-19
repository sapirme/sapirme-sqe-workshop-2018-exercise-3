import * as escodegen from 'escodegen';
import * as esprima from 'esprima';

export {parseCode,symbolic_substitution,reset,makeInputArray,setArgEnv,
    handleFunctionDeclaration,handleIfStatement,handleWhileStatement,handleBinaryExpressionVal,newCode,argEnv};

const parseCode = (codeToParse) => {
    return esprima.parseScript(codeToParse);
};

function createCodeLine(line,color){
    return{
        Line: line,
        Color: color
    };
}

const func={
    'FunctionDeclaration' : handleFunctionDeclaration,
    'BlockStatement': handleBlockStatement,
    'ExpressionStatement' : handleExpressionStatement,
    'AssignmentExpression' : handleAssignmentExpression,
    'IfStatement' :handleIfStatement,
    'VariableDeclaration' : handleVariableDeclaration,
    'VariableDeclarator' : handleVariableDeclarator,
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

let newCode=[];
let inputArray=[];
let paramArray=[];
let argEnv={};
let calcParam=false;
let envIfNeed=null;

//for testing
function setArgEnv(env){
    argEnv=env;
}


function reset(){
    newCode=[];
    inputArray=[];
    paramArray=[];
    argEnv={};
    calcParam=false;
    envIfNeed=null;
}
function makeInputArray(input){
    if (input!=='') {
        let values = parseCode(input).body[0].expression;
        if (values.type === 'SequenceExpression'){
            let array = values.expressions;
            for (let i = 0; i < array.length; i++) {
                inputArray.push(escodegen.generate(array[i]));
            }
        }
        else{
            inputArray.push(escodegen.generate(values));
        }
    }
}

function symbolic_substitution(myCode,input){
    let code = parseCode(myCode);
    reset();
    makeInputArray(input);
    let env={};
    for (let i=0; i<code.body.length; i++ ){
        env=func[code.body[i].type](code.body[i],env);
    }
    return newCode;
}
function makeArgEnv(){
    for (let i=0; i< inputArray.length; i++ ){
        argEnv[paramArray[i]]= inputArray[i];
    }
}
function handleFunctionDeclaration(code, env){
    let funcEnv=Object.assign({}, env);
    let params='';
    for (let i=0; i<code.params.length; i++){
        paramArray.push(escodegen.generate(code.params[i]));//code.params[i].name);
        //funcEnv[code.params[i].name]= null;
        params=params+code.params[i].name+',';
    }
    makeArgEnv();
    params=params.substr(0, params.length-1);
    newCode.push(createCodeLine('function '+escodegen.generate(code.id)+'('+params+')',0));
    func[code.body.type](code.body,funcEnv);
    return env;
}

function handleBlockStatement(code, env){
    newCode.push(createCodeLine('{',0));
    for (let i=0; i<code.body.length; i++){
        env=func[code.body[i].type](code.body[i],env);
    }
    newCode.push(createCodeLine('}',0));
    return env;
}
function handleVariableDeclaration(code,env){
    for (let i=0; i<code.declarations.length; i++){
        env=func[code.declarations[i].type](code.declarations[i],env);
    }
    return env;
}

function handleReturnStatement(code,env){
    let retVal=val[code.argument.type](code.argument,env);
    newCode.push(createCodeLine('return '+retVal+' ;',0));
    return env;
}

function literalAssignmentExpression (code,env){
    if (escodegen.generate(code.left) in argEnv){
        let right=val[code.right.type](code.right,env);
        newCode.push(createCodeLine(escodegen.generate(code.left)+ code.operator + right+';',0));
    }
    else{
        let right=val[code.right.type](code.right,env);
        env[escodegen.generate(code.left)]=right;
    }
    return env;
}

function updateArrayInEnv(arrayName,loc,env,newVal){
    let array=parseCode(env[arrayName]).body[0].expression.elements;
    let ans='[';
    for (let i=0; i<array.length; i++){
        if (i!==loc){
            ans=ans+escodegen.generate(array[i])+',';
        }
        else ans=ans+newVal+',';
    }
    ans=ans.substr(0,ans.length-1)+']';
    env[arrayName]=ans;
    return env;
}

function arrayAssignmentExpressionElse(code,env){
    let loc=val[code.left.property.type](code.left.property,env);
    let right=val[code.right.type](code.right,env);
    try {
        let locValue=eval(loc);
        env=updateArrayInEnv(escodegen.generate(code.left.object),locValue,env,right);
        return env;
    }
    catch (e) {
        newCode.push(createCodeLine(escodegen.generate(code.left.object)+'['+loc +']'+ code.operator + right+';',0));
        let locValue=getFullVal(loc);
        env=updateArrayInEnv(escodegen.generate(code.left.object),locValue,env,right);
        return env;
    }
}

function getFullVal(str){
    let json=parseCode(str).body[0].expression;
    let update=val[json.type](json,argEnv)+'';
    return eval(update);
}

function arrayAssignmentExpression (code, env){
    if (escodegen.generate(code.left.object) in argEnv){
        let loc=val[code.left.property.type](code.left.property,env);
        let right=val[code.right.type](code.right,env);
        newCode.push(createCodeLine(escodegen.generate(code.left.object)+'['+loc +']'+ code.operator + right+';',0));
        let locValue=getFullVal(loc+'');
        let newVal=getFullVal(right+'');
        updateArrayInEnv(escodegen.generate(code.left.object),locValue,argEnv,newVal);
    }
    else{
        env=arrayAssignmentExpressionElse(code,env);
    }
    return env;
}

function handleAssignmentExpression(code, env){
    if (code.left.type === 'MemberExpression'){
        return arrayAssignmentExpression(code,env);
    }
    else return literalAssignmentExpression(code,env);
}

function handleExpressionStatement(code,env){
    return func[code.expression.type](code.expression,env);
}

function handleVariableDeclarator(code, env){
    if (code.init==null) {
        env[escodegen.generate(code.id)] = null;
    }
    else {
        env[escodegen.generate(code.id)]=val[code.init.type](code.init, env);
    }
    return env;
}

function updateEnv(oldEnv,newEnv){
    for (let key in oldEnv) {
        if ((key in newEnv) && (oldEnv[key]!==newEnv[key])){
            oldEnv[key]=null;
        }
    }
    return oldEnv;
}

function getColor(test){
    calcParam=true;
    let jsonTest=parseCode(test).body[0].expression;
    let updateTest=val[jsonTest.type](jsonTest,argEnv);
    calcParam=false;
    if (eval(updateTest)){
        return 1; //green
    }
    else return 2; //red
}

function handleIfStatement(code, env){
    let testVal = val [code.test.type](code.test,env);
    envIfNeed=env;
    let color= getColor(testVal);
    envIfNeed=null;
    newCode.push(createCodeLine('if ('+testVal+')',color));
    let ifEnv=Object.assign({}, env);
    let argIfEnv=Object.assign({}, argEnv);
    func[code.consequent.type](code.consequent,ifEnv);
    argEnv=argIfEnv;
    if (code.alternate!=null){
        handleElse(code,env);
    }
    env=updateEnv(env,ifEnv);
    return env;
}

function handleElse(code,env){
    let argIfEnv=Object.assign({}, argEnv);
    newCode.push(createCodeLine('else ',0));
    let elseEnv=Object.assign({}, env);
    func[code.alternate.type](code.alternate,elseEnv);
    env=updateEnv(env,elseEnv);
    argEnv=argIfEnv;
}

function handleWhileStatement(code,env){
    let testVal = val [code.test.type](code.test,env);
    newCode.push(createCodeLine('while ('+testVal+')',0));
    let whileEnv=Object.assign({}, env);
    func[code.body.type](code.body,whileEnv);
    return env;
}
/////////////////////////////////////////////////////////////////////
function handleLiteralVal(code){
    return escodegen.generate(code);
}

function handleUnaryExpression (code,env){
    return code.operator+''+val[code.argument.type](code.argument,env);
}

function handleIdentifierVal(code, env){
    if (calcParam)
        return env[code.name];
    if  ((code.name in env)&& env[code.name]!=null){
        return env[code.name];
    }
    return code.name;
}

function handleLogicalExpression(code,env){
    let left = val[code.left.type](code.left,env);
    let right = val[code.right.type](code.right,env);
    let ans=escodegen.generate(parseCode('('+left+')' + code.operator + '(' + right +')'));
    return ans.substr(0,ans.length-1);
}

function handleBinaryExpressionVal(code,env){
    let left = val[code.left.type](code.left,env);
    let right = val[code.right.type](code.right,env);
    let ans=escodegen.generate(parseCode('('+left+')' + code.operator + '(' + right +')'));
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
    return escodegen.generate(array[loc]);
}

function handleMemberExpressionValArrayParam(code,env){
    if (calcParam){
        let indexStr= val[code.property.type](code.property,env);
        let arrayName=escodegen.generate(code.object);
        return getArrayInLoc(arrayName,indexStr,env);
    }
    else{
        let indexStr= val[code.property.type](code.property,env);
        return escodegen.generate(code.object)+'['+indexStr+']';
    }
}

function handleMemberExpressionValArrayNotParam(code,env){
    try{ // if can calc index
        let indexStr= val[code.property.type](code.property,env);
        let index=eval(indexStr);
        let arrayName=escodegen.generate(code.object);
        return getArrayInLoc(arrayName,index,env);
    }
    catch (e) {
        let indexStr= val[code.property.type](code.property,env);
        if (calcParam){
            let arrayName=escodegen.generate(code.object);
            return getArrayInLoc(arrayName,indexStr,envIfNeed);
        }
        else
            return escodegen.generate(code.object)+'['+indexStr+']';
    }
}

function handleMemberExpressionVal(code,env){
    //array is param
    if (escodegen.generate(code.object) in argEnv){
        return handleMemberExpressionValArrayParam(code,env);
    }
    //array not Param
    else{
        return handleMemberExpressionValArrayNotParam(code,env);
    }
}