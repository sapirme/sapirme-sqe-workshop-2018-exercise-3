import assert from 'assert';
import {parseCode,makeGraph,reset,handleReturnStatement,getGraph,getCurrentName,handleBlockStatement,
    handleExpressionStatement,handleIfStatement,handleWhileStatement,
    handleVariableDeclaration,getCurrentStr} from '../src/js/code-analyzer';

describe('Test full 9', () => {
    it('test full 9', () => {
        let str='function f(){\n' +
            'let x=0,b=8;\n' +
            'while (b==8 && x!=1){\n' +
            'while (x<1) {x=x+1; b=-b;}\n' +
            '}\n' +
            '\n' +
            'return -x;\n' +
            '}';
        reset();
        assert.equal(makeGraph(str,''),
            'a0=>operation: -1-\nx = 0, b = 8\n|right-path\na1=>start: null\n|right-path\na0->a1\na2=>condition: -2-\nb == 8 && x != 1\n|right-path\na1->a2\na3=>start: null\n|right-path\na2(yes)->a3\na4=>condition: -3-\nx < 1\n|right-path\na3->a4\na5=>operation: -4-\nx = x + 1\nb = -b\n|right-path\na4(yes)->a5\na5->a3\na4(no)->a1\na6=>operation: -5-\nreturn -x;\n|right-path\na2(no)->a6\n');
    });
});

describe('Test full 8', () => {
    it('test full 8', () => {
        let str='function f(){\n' +
            'let x=0;\n' +
            'if (x<4){\n' +
            'while (x<1) x=x+1;\n' +
            '}\n' +
            'else x=9;\n' +
            'return x;\n' +
            '}';
        reset();
        assert.equal(makeGraph(str,''),
            'a0=>operation: -1-\nx = 0\n|right-path\na1=>condition: -2-\nx < 4\n|right-path\na0->a1\na3=>start: null\n|right-path\na1(yes)->a3\na4=>condition: -3-\nx < 1\n|right-path\na3->a4\na5=>operation: -4-\nx = x + 1\n|right-path\na4(yes)->a5\na5->a3\na6=>operation: -5-\nx = 9\n\na1(no)->a6\na2=>start: null\n|right-path\na6->a2\na4(no)->a2\na7=>operation: -6-\nreturn x;\n|right-path\na2->a7\n');
    });
});

describe('Test full 7', () => {
    it('test full 7', () => {
        let str='function f(){\n' +
            '    let x=10;\n' +
            '    if (x==10)\n' +
            '    {\n' +
            '        while (x<1) x=x+1;\n' +
            '    }\n' +
            '    return 0;\n' +
            '}';
        reset();
        assert.equal(makeGraph(str,''),
            'a0=>operation: -1-\nx = 10\n|right-path\na1=>condition: -2-\nx == 10\n|right-path\na0->a1\na3=>start: null\n|right-path\na1(yes)->a3\na4=>condition: -3-\nx < 1\n|right-path\na3->a4\na5=>operation: -4-\nx = x + 1\n\na4(yes)->a5\na5->a3\na2=>start: null\n|right-path\na4(no)->a2\na1(no)->a2\na6=>operation: -5-\nreturn 0;\n|right-path\na2->a6\n');
    });
});

describe('Test full 6', () => {
    it('test full 6', () => {
        let str='function f(x){\n' +
            'let a=0, b=1;\n' +
            'if (x>2) \n' +
            'if (x<4) b=b+1;\n' +
            'return b;\n' +
            '}';
        reset();
        assert.equal(makeGraph(str,'3'),
            'a0=>operation: -1-\na = 0, b = 1\n|right-path\na1=>condition: -2-\nx > 2\n|right-path\na0->a1\na3=>condition: -3-\nx < 4\n|right-path\na1(yes)->a3\na5=>operation: -4-\nb = b + 1\n|right-path\na3(yes)->a5\na4=>start: null\n|right-path\na5->a4\na3(no)->a4\na2=>start: null\n|right-path\na4->a2\na1(no)->a2\na6=>operation: -5-\nreturn b;\n|right-path\na2->a6\n');
    });
});

describe('Test full 5', () => {
    it('test full 5', () => {
        let str='function f(x){\n' +
            'let a=0, b=1;\n' +
            'while (a<1){\n' +
            'if (x>2) {\n' +
            'b=b+x+a; \n' +
            'a=a+1;\n' + '}\n' +
            'else {\n' +
            'b=b+x;\n' +
            'a=a+1;\n' + '}\n' + '}\n' +
            'return b;\n' +
            '}';
        reset();
        assert.equal(makeGraph(str,'3'),
            'a0=>operation: -1-\na = 0, b = 1\n|right-path\na1=>start: null\n|right-path\na0->a1\na2=>condition: -2-\na < 1\n|right-path\na1->a2\na3=>condition: -3-\nx > 2\n|right-path\na2(yes)->a3\na5=>operation: -4-\nb = b + x + a\na = a + 1\n|right-path\na3(yes)->a5\na6=>operation: -5-\nb = b + x\na = a + 1\n\na3(no)->a6\na4=>start: null\n|right-path\na6->a4\na5->a4\na4->a1\na7=>operation: -6-\nreturn b;\n|right-path\na2(no)->a7\n');
    });
});



describe('Test full 4', () => {
    it('test full 4', () => {
        let str='function foo(x){\n' +
            '    let a = [9,7];\n' +
            '    let b = x[0] + a[1];\n' + '\n' +
            '    while (b<x[1]){\n' +
            '        if (b>2) b=b+5;\n' +
            '        else b=b-5;\n' +
            '    }\n' + '\n' +
            '    return b;\n' +
            '}';
        reset();
        assert.equal(makeGraph(str,'[1,2,3]'),
            'a0=>operation: -1-\na = [    9,    7]\nb = x[0] + a[1]\n|right-path\na1=>start: null\n|right-path\na0->a1\na2=>condition: -2-\nb < x[1]\n|right-path\na1->a2\na3=>condition: -3-\nb > 2\n\na2(yes)->a3\na5=>operation: -4-\nb = b + 5\n\na3(yes)->a5\na6=>operation: -5-\nb = b - 5\n\na3(no)->a6\na4=>start: null\n\na6->a4\na5->a4\na4->a1\na7=>operation: -6-\nreturn b;\n|right-path\na2(no)->a7\n');

    });
});

describe('Test full 3', () => {
    it('test full 3', () => {
        let str='function foo(x){\n' +
            '    let a = [9,7];\n' +
            '    let b = x[0] + a[1];\n' + '\n' +
            '    if (b < x[1]) {\n' +
            '        while (x[0]<2) x[0]=x[0]+1;\n' + '\n' +
            '    } \n' + '    \n' +
            '    return b;\n' + '}\n';
        reset();
        assert.equal(makeGraph(str,'[1,2,3]'),
            'a0=>operation: -1-\na = [    9,    7]\nb = x[0] + a[1]\n|right-path\na1=>condition: -2-\nb < x[1]\n|right-path\na0->a1\na3=>start: null\n\na1(yes)->a3\na4=>condition: -3-\nx[0] < 2\n\na3->a4\na5=>operation: -4-\nx[0] = x[0] + 1\n\na4(yes)->a5\na5->a3\na2=>start: null\n|right-path\na4(no)->a2\na1(no)->a2\na6=>operation: -5-\nreturn b;\n|right-path\na2->a6\n');

    });
});

describe('Test full 2', () => {
    it('test full 2', () => {
        let str='function f(x){\n' +
            'let a;\n' +
            'while (x<2)\n' +
            'a=x+2;\n' +
            'if (x==3) a=a*2;\n' +
            'return a;\n' +
            '}';
        reset();
        assert.equal(makeGraph(str,'2'),
            'a0=>operation: -1-\na\n|right-path\na1=>start: null\n|right-path\na0->a1\na2=>condition: -2-\nx < 2\n|right-path\na1->a2\na3=>operation: -3-\na = x + 2\n\na2(yes)->a3\na3->a1\na4=>condition: -4-\nx == 3\n|right-path\na2(no)->a4\na6=>operation: -5-\na = a * 2\n\na4(yes)->a6\na5=>start: null\n|right-path\na6->a5\na4(no)->a5\na7=>operation: -6-\nreturn a;\n|right-path\na5->a7\n');

    });

});

describe('Test full 1', () => {
    it('test full 1', () => {
        let str='function foo(x, y, z){\n' + '    let a = x + 1;\n' + '    let b = a + y;\n' +
            '    let c = 0;\n' + '    \n' + '    if (b < z) {\n' + '        c = c + 5;\n' +
            '    } else if (b < z * 2) {\n' + '        c = c + x + 5;\n' + '    } else {\n' +
            '        c = c + z + 5;\n' + '    }\n' + '    \n' + '    return c;\n' + '}\n';
        reset();
        assert.equal(makeGraph(str,'1,2,3'),
            'a0=>operation: -1-\na = x + 1\nb = a + y\nc = 0\n|right-path\na1=>condition: -2-\nb < z\n|right-path\na0->a1\na3=>operation: -3-\nc = c + 5\n\na1(yes)->a3\na4=>condition: -4-\nb < z * 2\n|right-path\na1(no)->a4\na6=>operation: -5-\nc = c + x + 5\n|right-path\na4(yes)->a6\na7=>operation: -6-\nc = c + z + 5\n\na4(no)->a7\na5=>start: null\n|right-path\na7->a5\na6->a5\na2=>start: null\n|right-path\na5->a2\na3->a2\na8=>operation: -7-\nreturn c;\n|right-path\na2->a8\n');
    });
});

describe('Test handleWhileStatement 1', () => {
    it('test handleWhileStatement 1', () => {
        let str='while (x<2)\na=x+1;';
        reset(); let env={'x':1, 'a':100};
        let code=parseCode(str).body[0];
        handleWhileStatement(code,env);
        assert.equal(getGraph(),'a0=>start: null\n|right-path\na1=>condition: -1-\nx < 2\n|right-path\na0->a1\na2=>operation: -2-\na = x + 1\n|right-path\na1(yes)->a2\na2->a0\n');
        assert.deepEqual(env,{'a':'1 + 1','x':1});
    });
    it('test handleWhileStatement 1', () => {
        let str='while (x<2)\na=x+1;';
        reset(); let env={'x':2, 'a':100};
        let code=parseCode(str).body[0];
        handleWhileStatement(code,env);
        assert.equal(getGraph(),'a0=>start: null\n|right-path\na1=>condition: -1-\nx < 2\n|right-path\na0->a1\na2=>operation: -2-\na = x + 1\n\na1(yes)->a2\na2->a0\n');
        assert.deepEqual(env,{'a':100,'x':2});
    });

});

describe('Test handleIfStatement 1', () => {
    it('test handleIfStatement 1', () => {
        let str='if (x>0) a=0;\nelse a=1;';
        reset(); let env={'x':1, 'a':100};
        let code=parseCode(str).body[0];
        handleIfStatement(code,env);
        assert.equal(getGraph(),'a0=>condition: -1-\nx > 0\n|right-path\na2=>operation: -2-\na = 0\n|right-path\na0(yes)->a2\na3=>operation: -3-\na = 1\n\na0(no)->a3\na1=>start: null\n|right-path\na3->a1\na2->a1\n');
        assert.deepEqual(env,{'a':0,'x':1});
    });
    it('test handleIfStatement 2', () => {
        let str = 'if (x>0) a=0;\nelse a=1;';
        reset();
        let env = {'x': -1, 'a': 100};
        let code = parseCode(str).body[0];
        handleIfStatement(code, env);
        assert.equal(getGraph(),'a0=>condition: -1-\nx > 0\n|right-path\na2=>operation: -2-\na = 0\n\na0(yes)->a2\na3=>operation: -3-\na = 1\n|right-path\na0(no)->a3\na1=>start: null\n|right-path\na3->a1\na2->a1\n');
        assert.deepEqual(env, {'x': -1, 'a': 1});
    });
});

describe('Test handleIfStatement no else 1', () => {
    it('test handleIfStatement no else 1', () => {
        let str='if (x>0) a=0;';
        reset(); let env={'x':1, 'a':100};
        let code=parseCode(str).body[0];
        handleIfStatement(code,env);
        assert.equal(getGraph(),'a0=>condition: -1-\nx > 0\n|right-path\na2=>operation: -2-\na = 0\n|right-path\na0(yes)->a2\na1=>start: null\n|right-path\na2->a1\na0(no)->a1\n');
        assert.deepEqual(env,{'a':0,'x':1});
    });
    it('test handleIfStatement no else 2', () => {
        let str = 'if (x>0) a=0;';
        reset();
        let env = {'x': -1, 'a': 100};
        let code = parseCode(str).body[0];
        handleIfStatement(code, env);
        assert.equal(getGraph(), 'a0=>condition: -1-\nx > 0\n|right-path\na2=>operation: -2-\na = 0\n\na0(yes)->a2\na1=>start: null\n|right-path\na2->a1\na0(no)->a1\n');
        assert.deepEqual(env, {'x': -1, 'a': 100});
    });
});


describe('Test handleBlockStatement 1', () => {
    it('test handleBlockStatement 1', () => {
        let str='function foo(x){\nlet a = 4;\nreturn x+a;\n}';
        reset(); let env={'x':1};
        let code=parseCode(str).body[0].body;//only block Statment
        handleBlockStatement(code,env);
        assert.equal(getGraph(),'a0=>operation: -1-\na = 4\n|right-path\na1=>operation: -2-\nreturn x + a;\n|right-path\na0->a1\n');
        assert.deepEqual(env,{'a':4,'x':1});
    });
});

describe('Test handleBlockStatement 2', () => {
    it('test handleBlockStatement 2', () => {
        let str='function foo(x){\nlet a = 4; \nx=a+1\nreturn x+a;\n}';
        reset(); let env={'x':1};
        let code=parseCode(str).body[0].body;//only block Statment
        handleBlockStatement(code,env);
        assert.equal(getGraph(),'a0=>operation: -1-\na = 4\nx = a + 1\n|right-path\na1=>operation: -2-\nreturn x + a;\n|right-path\na0->a1\n');
        assert.deepEqual(env,{'a':4,'x':'4 + 1'});
    });
});


describe('Test handleReturnStatement', () => {
    it('test handleReturnStatement 1', () => {
        let str='function foo(x){\nreturn x;\n}';
        reset();
        let code=parseCode(str).body[0].body.body[0];//only return statment
        handleReturnStatement(code,{'x':1});
        assert.equal(getGraph(),'a0=>operation: -1-\nreturn x;\n|right-path\n');
    });

    it('test handleReturnStatement 2', () => {
        let str='function foo(x){\nreturn (x+1)*2;\n}';
        reset();
        let code=parseCode(str).body[0].body.body[0];//only return statment
        handleReturnStatement(code,{'x':1});
        assert.equal(getGraph(),'a0=>operation: -1-\nreturn (x + 1) * 2;\n|right-path\n');
    });

});

describe('Test handleVariableDeclaration 1', () => {
    it('test handleVariableDeclaration 1', () => {
        let str='let a=5;'; let env={'x':1};
        reset();
        let code=parseCode(str).body[0];
        handleVariableDeclaration(code,env);
        assert.equal(getGraph(),'');
        assert.deepEqual(env,{'a':5,'x':1});
        assert.equal(getCurrentStr(),'operation: -1-\na = 5\n');
        assert.equal(getCurrentName().name,'a0');
        assert.equal(getCurrentName().isPass,true);
    });
});

describe('Test handleVariableDeclaration 2', () => {
    it('test handleVariableDeclaration 2', () => {
        let str='let a=x+3;'; let env={'x':1};
        reset();
        let code=parseCode(str).body[0];
        handleVariableDeclaration(code,env);
        assert.equal(getGraph(),'');
        assert.deepEqual(env,{'x':1, 'a':'1 + 3'});
        assert.equal(getCurrentStr(),'operation: -1-\na = x + 3\n');
        assert.equal(getCurrentName().name,'a0');
        assert.equal(getCurrentName().isPass,true);
    });
});

describe('Test ExpressionStatement 1', () => {
    it('test ExpressionStatement 1', () => {
        let str='a=x+3;'; let env={'x':1};
        reset();
        let code=parseCode(str).body[0];
        handleExpressionStatement(code,env);
        assert.equal(getGraph(),'');
        assert.deepEqual(env,{'x':1, 'a':'1 + 3'});
        assert.equal(getCurrentStr(),'operation: -1-\na = x + 3\n');
        assert.equal(getCurrentName().name,'a0');
        assert.equal(getCurrentName().isPass,true);
    });
});
