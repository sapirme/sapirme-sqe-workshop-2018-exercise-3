import assert from 'assert';
import {symbolic_substitution,parseCode,reset,makeInputArray,setArgEnv,
    handleFunctionDeclaration,handleIfStatement,handleWhileStatement,handleBinaryExpressionVal,newCode,argEnv} from '../src/js/code-analyzer';


describe('Test handleFunctionDeclaration', () => {
    it('test handleFunctionDeclaration', () => {
        let str='function foo(x, y, z){\nlet a = x + 1;\nlet b = a + y;\n\nif (b < z) {\na = a + 5;\nreturn x + y + z +a;\n} else {\nb = b + x + 5;\nreturn x + y + z +b;\n}\n}';
        reset();
        makeInputArray('1,2,3');
        let code=parseCode(str).body[0],
            expectedNewCodeAraay=
            [{Line:'function foo(x,y,z)',Color: 0}, {Line:'{',Color: 0}, {Line:'if (x + 1 + y < z)',Color: 2}, {Line:'{',Color: 0},
                {Line:'return x + y + z + (x + 1 + 5) ;',Color: 0}, {Line:'}',Color: 0}, {Line:'else ',Color: 0}, {Line:'{',Color: 0}, {Line:'return x + y + z + (x + 1 + y + x + 5) ;',Color: 0},
                {Line:'}',Color: 0}, {Line:'}',Color: 0}];
        let ans=handleFunctionDeclaration(code,{});

        assert.deepEqual(ans,{});
        assert.deepEqual(newCode,expectedNewCodeAraay);
        assert.deepEqual(argEnv,{'x':1,'y':2,'z':3});
    });

});

describe('Test handleIfStatement', () => {
    it('test handleIfStatement', () => {
        let str='if (x[a]>0) y = x[a]+a;';
        reset();
        setArgEnv({'x':'[-1,100,4]'});
        let code=parseCode(str).body[0],
            expectedNewCodeAraay= [{Line:'if (x[1] > 0)',Color: 1}];
        let ans=handleIfStatement(code,{'a':'1','y':'0'});
        assert.deepEqual(ans,{'a': '1', 'y':null});
        assert.deepEqual(newCode,expectedNewCodeAraay);
    });

});


describe('Test handleWhileStatement', () => {
    it('test handleWhileStatement', () => {
        let str='while (x[y] > 1)\nx[y]=(y+a)*2;';
        reset();
        setArgEnv({'x':'[-1,100,4]'});
        let code=parseCode(str).body[0],
            expectedNewCodeAraay= [{Line:'while (x[0] > 1)',Color: 0},{Line :'x[0]=(0 + 1) * 2;', Color: 0}];
        let ans=handleWhileStatement(code,{'a':'1','y':'0'});
        assert.deepEqual(ans,{'a': '1', 'y':'0'});
        assert.deepEqual(newCode,expectedNewCodeAraay);
    });

});

describe('Test handleBinaryExpressionVal', () => {
    it('test handleBinaryExpressionVal', () => {
        let str='(x+2)/a';
        reset();
        setArgEnv({'x':'3'});
        let code=parseCode(str).body[0].expression;
        let ans=handleBinaryExpressionVal(code,{'a':'4','y':'0'});
        assert.deepEqual(ans,'(x + 2) / 4');
    });
});



describe('Test 1', () => {
    it('test 1', () => {
        assert.deepEqual(
            symbolic_substitution('function foo(x, y, z){\nlet a = x + 1;\nlet b = a + y;\nlet c = 0;\n\nif (b < z) {\nc = c + 5;\nreturn x + y + z + c;\n} else if (b < z * 2) {\nc = c + x + 5;\nreturn x + y + z + c;\n} else {\nc = c + z + 5;\nreturn x + y + z + c;\n}\n}\n','1,2,3'),
            [{Line:'function foo(x,y,z)',Color: 0}, {Line:'{',Color: 0}, {Line:'if (x + 1 + y < z)',Color: 2}, {Line:'{',Color: 0},
                {Line:'return x + y + z + (0 + 5) ;',Color: 0}, {Line:'}',Color: 0}, {Line:'else ',Color: 0}, {Line:'if (x + 1 + y < z * 2)',Color: 1},
                {Line:'{',Color: 0}, {Line:'return x + y + z + (0 + x + 5) ;',Color: 0}, {Line:'}',Color: 0}, {Line:'else ',Color: 0},
                {Line:'{',Color: 0}, {Line:'return x + y + z + (0 + z + 5) ;',Color: 0}, {Line:'}',Color: 0},{Line:'}',Color: 0}
            ]
        );
    });

});

describe('Test 2', () => {
    it('test 2', () => {
        assert.deepEqual(
            symbolic_substitution('function foo(x, y, z){\nlet a = x + 1;\nlet b = a + y;\nlet c = 0;\n\nwhile (a < z) {\nc = a + b;\nz = c * 2;\n}\n\nreturn z;\n}\n','1,2,3'),
            [{Line:'function foo(x,y,z)',Color: 0}, {Line:'{',Color: 0}, {Line:'while (x + 1 < z)',Color: 0}, {Line:'{',Color: 0},
                {Line:'z=(x + 1 + (x + 1 + y)) * 2;',Color: 0}, {Line:'}',Color: 0}, {Line:'return z ;',Color: 0},{Line:'}',Color: 0}
            ]
        );
    });

});

describe('Test 3', () => {
    it('test 3', () => {
        assert.deepEqual(
            symbolic_substitution('function foo(x){\n' + 'let a=[1,2,3];\n' + 'let b;\n' +
                'b=2;\n' + 'a[2]=100;\n' + 'if (a[x] > b ) return 0;\n' + 'return 6;\n' + '}','2'),
            [{Line:'function foo(x)',Color: 0}, {Line:'{',Color: 0}, {Line:'if (a[x] > 2)',Color: 1},
                {Line:'return 0 ;',Color: 0}, {Line:'return 6 ;',Color: 0},{Line:'}',Color: 0}
            ]
        );
    });

});

describe('Test 4', () => {
    it('test 4', () => {
        assert.deepEqual(
            symbolic_substitution('function foo(x,y){\n' + 'let a=[1,2,3];\n' + 'a[y]=100;\n' + 'if (a[0] > x[0] ) return 0;\n' +
                'return 7;\n' + '}','[4,5,6],1'),
            [{Line:'function foo(x,y)',Color: 0}, {Line:'{',Color: 0}, {Line:'a[y]=100;',Color: 0},
                {Line:'if (1 > x[0])',Color: 2},{Line:'return 0 ;',Color: 0}, {Line:'return 7 ;',Color: 0},{Line:'}',Color: 0}
            ]
        );
    });

});

describe('Test 5', () => {
    it('test 5', () => {
        assert.deepEqual(
            symbolic_substitution('function f(x,y){\nlet a=6;\nx[y]=a+2;\nif (x[y] == 8)\nreturn x[y];\nelse return -y;\n}'
                ,'[1,2,3],1'),
            [{Line:'function f(x,y)',Color: 0}, {Line:'{',Color: 0}, {Line:'x[y]=6 + 2;',Color: 0},
                {Line:'if (x[y] == 8)',Color: 1},{Line:'return x[y] ;',Color: 0},{Line:'else ',Color: 0},
                {Line:'return -y ;',Color: 0},{Line:'}',Color: 0}
            ]
        );
    });

});

describe('Test 6', () => {
    it('test 6', () => {
        assert.deepEqual(
            symbolic_substitution('function f(x){\nlet a=x;\nlet b=a+5;\nif (x>7 && (b-1)*2 <35) return 0;\n' +
                'else return 1;\n}','[1,2,3],1'),
            [{Line:'function f(x)',Color: 0}, {Line:'{',Color: 0}, {Line:'if (x > 7 && (x + 5 - 1) * 2 < 35)',Color: 2},
                {Line:'return 0 ;',Color: 0},{Line:'else ',Color: 0},
                {Line:'return 1 ;',Color: 0},{Line:'}',Color: 0}
            ]
        );
    });

});

describe('Test 7', () => {
    it('test 7', () => {
        assert.deepEqual(
            symbolic_substitution('function f(){\n' + 'let x=3;\n' + 'let y=15;\n' + 'let z=x+y;\n' +
                'if (x*2 < z) return true;\n' + 'else return false;\n' + '}',''),
            [{Line:'function f()',Color: 0}, {Line:'{',Color: 0}, {Line:'if (3 * 2 < 3 + 15)',Color: 1},
                {Line:'return true ;',Color: 0},{Line:'else ',Color: 0},
                {Line:'return false ;',Color: 0},{Line:'}',Color: 0}
            ]
        );
    });

});

describe('Test 8', () => {
    it('test 8', () => {
        assert.deepEqual(
            symbolic_substitution('let x=7;\n' + 'function f(y){\n' + 'let a=x+y;\n' +
                'if (a>6) return "a";\n' + '}','-2'),
            [{Line:'function f(y)',Color: 0}, {Line:'{',Color: 0}, {Line:'if (7 + y > 6)',Color: 2},
                {Line:'return \'a\' ;',Color: 0},{Line:'}',Color: 0}
            ]
        );
    });

});

describe('Test 9', () => {
    it('test 9', () => {
        assert.deepEqual(
            symbolic_substitution('function f(y){\n' + 'if (y==="test") return 1;\n' +
                'else return 9;\n' + '}','"test"'),
            [{Line:'function f(y)',Color: 0}, {Line:'{',Color: 0}, {Line:'if (y === \'test\')',Color: 1},
                {Line:'return 1 ;',Color: 0},{Line:'else ',Color: 0},
                {Line:'return 9 ;',Color: 0},{Line:'}',Color: 0}
            ]
        );
    });

});

describe('Test 10', () => {
    it('test 10', () => {
        assert.deepEqual(
            symbolic_substitution('function f(y){\n' + 'if (y==="test") return 1;\n' +
                'else return 9;\n' + '}','"test1"'),
            [{Line:'function f(y)',Color: 0}, {Line:'{',Color: 0}, {Line:'if (y === \'test\')',Color: 2},
                {Line:'return 1 ;',Color: 0},{Line:'else ',Color: 0},
                {Line:'return 9 ;',Color: 0},{Line:'}',Color: 0}
            ]
        );
    });

});