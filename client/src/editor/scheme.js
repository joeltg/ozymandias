// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: http://codemirror.net/LICENSE

/**
 * Author: Koh Zi Han, based on implementation by Koh Zi Chun
 * extended 17 July 2016 by joelg
 */

import CodeMirror from 'codemirror';
import {keywords, indented_keywords} from './keywords';

CodeMirror.defineMode('scheme', function() {
    const BUILTIN = 'builtin', COMMENT = 'comment', STRING = 'string', ATOM = 'atom', NUMBER = 'number', PAREN = 'paren', OBJECT = 'object';
    const INDENT_WORD_SKIP = 2;
    
    const binaryMatcher = new RegExp(/^(?:[-+]i|[-+][01]+#*(?:\/[01]+#*)?i|[-+]?[01]+#*(?:\/[01]+#*)?@[-+]?[01]+#*(?:\/[01]+#*)?|[-+]?[01]+#*(?:\/[01]+#*)?[-+](?:[01]+#*(?:\/[01]+#*)?)?i|[-+]?[01]+#*(?:\/[01]+#*)?)(?=[()\s;"]|$)/i);
    const octalMatcher = new RegExp(/^(?:[-+]i|[-+][0-7]+#*(?:\/[0-7]+#*)?i|[-+]?[0-7]+#*(?:\/[0-7]+#*)?@[-+]?[0-7]+#*(?:\/[0-7]+#*)?|[-+]?[0-7]+#*(?:\/[0-7]+#*)?[-+](?:[0-7]+#*(?:\/[0-7]+#*)?)?i|[-+]?[0-7]+#*(?:\/[0-7]+#*)?)(?=[()\s;"]|$)/i);
    const hexMatcher = new RegExp(/^(?:[-+]i|[-+][\da-f]+#*(?:\/[\da-f]+#*)?i|[-+]?[\da-f]+#*(?:\/[\da-f]+#*)?@[-+]?[\da-f]+#*(?:\/[\da-f]+#*)?|[-+]?[\da-f]+#*(?:\/[\da-f]+#*)?[-+](?:[\da-f]+#*(?:\/[\da-f]+#*)?)?i|[-+]?[\da-f]+#*(?:\/[\da-f]+#*)?)(?=[()\s;"]|$)/i);
    const decimalMatcher = new RegExp(/^(?:[-+]i|[-+](?:(?:(?:\d+#+\.?#*|\d+\.\d*#*|\.\d+#*|\d+)(?:[esfdl][-+]?\d+)?)|\d+#*\/\d+#*)i|[-+]?(?:(?:(?:\d+#+\.?#*|\d+\.\d*#*|\.\d+#*|\d+)(?:[esfdl][-+]?\d+)?)|\d+#*\/\d+#*)@[-+]?(?:(?:(?:\d+#+\.?#*|\d+\.\d*#*|\.\d+#*|\d+)(?:[esfdl][-+]?\d+)?)|\d+#*\/\d+#*)|[-+]?(?:(?:(?:\d+#+\.?#*|\d+\.\d*#*|\.\d+#*|\d+)(?:[esfdl][-+]?\d+)?)|\d+#*\/\d+#*)[-+](?:(?:(?:\d+#+\.?#*|\d+\.\d*#*|\.\d+#*|\d+)(?:[esfdl][-+]?\d+)?)|\d+#*\/\d+#*)?i|(?:(?:(?:\d+#+\.?#*|\d+\.\d*#*|\.\d+#*|\d+)(?:[esfdl][-+]?\d+)?)|\d+#*\/\d+#*))(?=[()\s;"]|$)/i);

    function makeKeywords(str) {
        const obj = {}, words = str.split(' ');
        for (let i = 0; i < words.length; ++i) obj[words[i]] = true;
        return obj;
    }

    const keys = makeKeywords(keywords.join(' '));
    const indentKeys = makeKeywords(indented_keywords.join(' '));

    function pushStack(state, indent, type) {
        state.indentStack = {indent, type, prev: state.indentStack};
    }

    function popStack(state) {
        state.indentStack = state.indentStack.prev;
    }

    function isBinaryNumber(stream) {
        return stream.match(binaryMatcher);
    }

    function isOctalNumber(stream) {
        return stream.match(octalMatcher);
    }

    function isDecimalNumber(stream, backup) {
        if (backup === true) stream.backUp(1);
        return stream.match(decimalMatcher);
    }

    function isHexNumber(stream) {
        return stream.match(hexMatcher);
    }

    return {
        startState() {
            return {
                indentStack: null,
                indentation: 0,
                mode: false,
                sExprComment: false,
                depth: 0,
                increment: false
            };
        },
        token(stream, state) {
            // update indentation, but only if indentStack is empty
            if (state.indentStack === null && stream.sol()) state.indentation = stream.indentation();
            // skip spaces
            if (stream.eatSpace()) return null;
            let returnType = null, escaped = false, maybeEnd = false, next;
            switch (state.mode) {
                case 'string': // multi-line string parsing mode
                    while ((next = stream.next()) != null) {
                        if (next === '"' && !escaped) {
                            state.mode = false;
                            break;
                        }
                        escaped = !escaped && next === '\\';
                    }
                    returnType = STRING; // continue on in scheme-string mode
                    break;
                case 'comment': // comment parsing mode
                    while ((next = stream.next()) != null) {
                        if (next == '#' && maybeEnd) {
                            state.mode = false;
                            break;
                        }
                        maybeEnd = (next === '|');
                    }
                    returnType = COMMENT;
                    break;
                case 's-expr-comment': // s-expr commenting mode
                    state.mode = false;
                    let peek = stream.peek();
                    if (peek === '(' || peek === '#' || peek === '"') {
                        // actually start scheme s-expr commenting mode
                        state.sExprComment = 0;
                        break;
                    } else {
                        // if not we just comment the entire of the next token
                        stream.eatWhile(/[^/s]/); // eat non spaces
                        returnType = COMMENT;
                        break;
                    }
                default: // default parsing mode
                    const ch = stream.next();
                    state.increment = state.increment && state.depth++ && false;
                    if (ch === '"') {
                        returnType = STRING;
                        state.mode = 'string';
                        while ((next = stream.next()) != null) {
                            if (next === '"' && !escaped) {
                                state.mode = false;
                                break;
                            }
                            escaped = !escaped && next === '\\';
                        }
                    } else if (ch === "'") {
                        stream.eatWhile(/[\w_\-!$%&*+.\/:<=>?@\^~]/);
                        returnType = ATOM;
                    } else if (ch === '#') {
                        if (stream.eat('|')) {                    // Multi-line comment
                            state.mode = 'comment'; // toggle to comment mode
                            returnType = COMMENT;
                        } else if (stream.eat(/[tf]/i)) {            // #t/#f (atom)
                            returnType = ATOM;
                        } else if (stream.eat(';')) {                // S-Expr comment
                            state.mode = 's-expr-comment';
                            returnType = COMMENT;
                        } else if (stream.eat('[')) {
                            stream.eatWhile(/[^\]]/);
                            stream.eat(']');
                            returnType = OBJECT;
                        } else {
                            let numTest = null, hasExactness = false, hasRadix = true;

                            if (stream.eat(/[ei]/i)) hasExactness = true;
                            else stream.backUp(1); // must be radix specifier

                            if (stream.match(/^#b/i)) numTest = isBinaryNumber;
                            else if (stream.match(/^#o/i)) numTest = isOctalNumber;
                            else if (stream.match(/^#x/i)) numTest = isHexNumber;
                            else if (stream.match(/^#d/i)) numTest = isDecimalNumber;
                            else if (stream.match(/^[-+0-9.]/, false)) {
                                hasRadix = false;
                                numTest = isDecimalNumber;
                            // re-consume the intial # if all matches failed
                            } else if (!hasExactness) stream.eat('#');

                            if (numTest !== null) { // consume optional exactness after radix
                                if (hasRadix && !hasExactness) stream.match(/^#[ei]/i);
                                if (numTest(stream)) returnType = NUMBER;
                            }
                        }
                    } else if (/^[-+0-9.]/.test(ch) && isDecimalNumber(stream, true)) { // match non-prefixed number, must be decimal
                        returnType = NUMBER;
                    } else if (ch === ';') { // comment
                        stream.skipToEnd(); // rest of the line is a comment
                        returnType = COMMENT;
                    } else if (ch === '(') {
                        let keyWord = '', indentTemp = stream.column(), letter;
                        /**
                        Either
                        (indent-word ..
                        (non-indent-word ..
                        (;something else, bracket, etc.
                        */
                        while ((letter = stream.eat(/[^\s(;)]/)) != null) keyWord += letter;

                        if (keyWord.length > 0 && indentKeys.propertyIsEnumerable(keyWord)) pushStack(state, indentTemp + INDENT_WORD_SKIP, ch); // indent-word
                        else { // non-indent word
                            // we continue eating the spaces
                            stream.eatSpace();
                            // nothing significant after
                            // we restart indentation 1 space after
                            if (stream.eol() || stream.peek() === ';') pushStack(state, indentTemp + 1, ch);
                            else pushStack(state, indentTemp + stream.current().length, ch); // else we match
                        }
                        stream.backUp(stream.current().length - 1); // undo all the eating

                        if (typeof state.sExprComment === 'number') state.sExprComment++;

                        returnType = PAREN;
                        state.increment = true;
                    } else if (ch === ')') {
                        returnType = PAREN;
                        if (state.indentStack !== null && state.indentStack.type === '(') {
                            state.depth--;
                            popStack(state);
                            if (typeof state.sExprComment === 'number' && --state.sExprComment == 0) {
                                returnType = COMMENT; // final closing bracket
                                state.sExprComment = false; // turn off s-expr commenting mode
                            }
                        }
                    } else {
                        stream.eatWhile(/[\w_\-!$%&*+.\/:<=>?@\^~]/);
                        if (keys && keys.propertyIsEnumerable(stream.current())) returnType = BUILTIN;
                        else returnType = 'variable';
                    }
            }
            return (typeof state.sExprComment === 'number') ? COMMENT : returnType;
        },

        indent (state) {
            if (state.indentStack === null) return state.indentation;
            return state.indentStack.indent;
        },

        closeBrackets: {pairs: '()[]""'},
        lineComment: ';;'
    };
});

CodeMirror.defineMIME("text/x-scheme", "scheme");
