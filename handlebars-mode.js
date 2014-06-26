/* jslint devel:true */

(function() {
    'use strict';
  //console.log('hello from handlebar-mode');
  CodeMirror.defineMode("handlebars", function() {
        var mustacheOverlay = {
            startState: function() {
                return {
                    moustacheStack: [],
                    hasError: false,
                    errorTerminatesOn: null,
                    opening: false,
                    closing: false,
                    helperName: false
                };
            },
            token: function(stream, state) {
                /*jslint regexp:true */
                stream.eatSpace();
                if (!state.inHandlebar) {
                    if (stream.eat('{')) {
                        if (stream.eat('{')) {
                            stream.eatSpace();
                            state.inHandlebar = true;
                            state.helperName = true;
                            state.closing = false;
                            state.opening = false;
                            state.doNotEscape = false;
                            if (stream.eat('{')) {
                                //output HTML
                                state.doNotEscape = true;
                                stream.eatSpace();
                                return "operator";
                            }
                            if (stream.eat('#')) {
                                //tag start
                                state.opening = true;
                            } else if (stream.eat("/")) {
                                //tag end
                                state.closing = true;
                            }
                            stream.eatSpace();
                            return "bracket";
                        }
                    }
                    if (stream.next() === null && state.moustacheStack.length > 0) {
                        console.log("Unclosed tags: ", moustacheStack);
                        return "invalidchar";
                    }
                    return null;
                }
                if (state.helperName) {
                    state.helperName = false;
                    if (!state.opening && !state.closing && stream.match(/^[\w\d\-\_\$]+\s*\}\}/, false)) {
                        stream.match(/^[\w\d\-\_\$\.]+/, true);
                        stream.eatSpace();
                        return "variable";
                    }
                    if (stream.match(/^[\w\d\-\_\$]+/, false)) {
                        stream.match(/^[\w\d\-\_\$]+/, true);
                        state.helperName = false;
                        if (state.closing) {
                            state.closing = false;
                            state.endOnly = true;
                            if (state.moustacheStack.pop() !== stream.current()) {
                                console.log('Mismatched tags');
                                return "invalidchar";
                            }
                            return "tag";
                        }
                        if (state.opening) {
                            stream.opening = false;
                            state.moustacheStack.push(stream.current());
                        }
                        state.argumentList = true;
                        return "tag";
                    }
                    stream.next();
                    return "invalidchar";
                }
                if (state.endOnly) {
                    state.endOnly = false;
                    if (stream.match('}}', true)) {
                        stream.eatSpace();
                        state.inHandlebar = false;
                        return "bracket";
                    }
                    console.log("Bad end char");
                    stream.next();
                    return "invalidchar";
                }
                if (stream.match('}}', true)) {
                    state.argumentList = false;
                    state.inHandlebar = false;
                    return "bracket";
                }
                if (!state.attributeKeyword && !state.attributeAssignment && !state.attributeValue && stream.match(/^[\w\d\-\_\$]+\s*=/, false)) {
                    state.argumentList = false;
                    stream.match(/^[\w\d\-\_\$]+/, true);
                    if (/Binding$/.test(stream.current())) {
                        stream.backUp(7);
                        state.attributeKeyword = true;
                        return "number";
                    }
                    stream.eatSpace();
                    state.attributeAssignment = true;
                    return "number";
                }
                if (state.attributeKeyword) {
                    stream.skipTo("=");
                    state.attributeKeyword = false;
                    state.attributeAssignment = true;
                    return "keyword";
                }
                if (state.attributeAssignment) {
                    state.attributeAssignment = false;
                    state.attributeValue = true;
                    if (stream.next() !== '=') {
                        console.log("Expected =");
                        return "invalidchar";
                    }
                    return "operator";
                }
                if (state.attributeValue) {
                    state.attributeValue = false;
                    if (stream.match(/^"([^\\"]|\\\\|\\")*"/, false)) {
                        stream.match(/^"([^\\"]|\\\\|\\")*"/, true);
                        stream.eatSpace();
                        return "atom";
                    }
                    if (stream.match(/^'([^\\']|\\\\|\\')*'/, true)) {
                        stream.eatSpace();
                        return "atom";
                    }
                    stream.match(/^[^\s]+/, true);
                    console.log("Invalid attribute value");
                    return "invalidchar";
                }
                if (state.argumentList) {
                    if (stream.match(/^"([^\\"]|\\\\|\\")*"/, false)) {
                        stream.match(/^"([^\\"]|\\\\|\\")*"/, true);
                        stream.eatSpace();
                        return "atom";
                    }
                    if (stream.match(/^'([^\\']|\\\\|\\')*'/, true)) {
                        stream.eatSpace();
                        return "atom";
                    }
                    if (stream.match(/^[A-Za-z0-9\._$]+/, true)) {
                        stream.eatSpace();
                        return "variable";
                    }
                }
                console.log("Bad data: ", stream.next(), state);
                return "invalidchar";
            }
        };
        return mustacheOverlay;
    });
}());
