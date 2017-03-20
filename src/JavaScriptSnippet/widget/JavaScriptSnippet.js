/*jslint -W061:false*/
define([
    "dojo/_base/declare",
    "mxui/widget/_WidgetBase",

    "mxui/dom",
    "dojo/dom-style",
    "dojo/dom-attr",
    "dojo/dom-construct",
    "dojo/_base/lang",
    "dijit/layout/LinkPane"
], function(declare, _WidgetBase, dom, domStyle, domAttr, domConstruct, lang, LinkPane) {
    "use strict";

    return declare("JavaScriptSnippet.widget.JavaScriptSnippet", [_WidgetBase], {

        _contextObj: null,

        _objectChangeHandler: null,

        postCreate: function() {
            logger.debug(this.id + ".postCreate");
            this._setupEvents();
        },        

        update: function(obj, callback) {
            logger.debug(this.id + ".update");
            this._contextObj = obj;

            this.executeCode();

            if (this.refreshOnContextUpdate) {
                if (this._objectChangeHandler !== null) {
                    this.unsubscribe(this._objectChangeHandler);
                }
                if (obj) {
                    this._objectChangeHandler = this.subscribe({
                        guid: obj.getGuid(),
                        callback: lang.hitch(this, function() {
                            this.executeCode();
                        })
                    });
                }
            }


            this._executeCallback(callback, "update");
        },

        executeCode: function() {
            logger.debug(this.id + ".executeCode");
            var external = this.contentsPath !== "" ? true : false;
            switch (this.contenttype) {
                case "html":
                    if (external) {
                        new LinkPane({
                            preload: true,
                            loadingMessage: "",
                            href: this.contentsPath,
                            onDownloadError: function() {
                                console.log("Error loading html path");
                            }
                        }).placeAt(this.domNode.id).startup();
                    } else {

                        mx.ui.action(this.contentsmf, {
                            params: {
                                applyto     : "selection",
                                guids       : [this._contextObj.getGuid()]
                            },
                            callback     : lang.hitch(this, function (returnedString) {
                                domStyle.set(this.domNode, {
                                    "height": "auto",
                                    "width": "100%",
                                    "outline": 0
                                });

                                domAttr.set(this.domNode, "style", this.style); // might override height and width
                                var domNode = domConstruct.create("div", {
                                    innerHTML: returnedString
                                });
                                domConstruct.place(domNode, this.domNode, "only");
                            }),
                            error        : lang.hitch(this, function(error) {
                                alert(error.description);
                            }),
                            onValidation : lang.hitch(this, function(validations) {
                                alert("There were " + validations.length + " validation errors");
                            })
                        }, this);   
                        
                        
                    }
                    break;

                case "js":
                case "jsjQuery":
                    if (external) {
                        var scriptNode = document.createElement("script"),
                            intDate = +new Date();

                        scriptNode.type = "text/javascript";
                        scriptNode.src = this.contentsPath + "?v=" + intDate.toString();

                        domConstruct.place(scriptNode, this.domNode, "only");
                    } else {
                        if (this.contenttype === "jsjQuery") {
                            require([
                                "HTMLSnippet/lib/jquery-1.11.3"
                            ], lang.hitch(this, this.evalJs));
                        } else {
                            this.evalJs();
                        }
                    }
                    break;
            }
        },

        _setupEvents: function() {
            logger.debug(this.id + "._setupEvents");
            if (this.onclickmf) {
                this.connect(this.domNode, "click", this._executeMicroflow);
            }
        },

        _executeMicroflow: function() {
            logger.debug(this.id + "._executeMicroflow");
            if (this.onclickmf) {
                mx.ui.action(this.onclickmf, {}, this);
            }
        },

        evalJs: function() {
            logger.debug(this.id + ".evalJS");
            mx.ui.action(this.contentsmf, {
                params: {
                    applyto     : "selection",
                    guids       : [this._contextObj.getGuid()]
                },
                callback     : lang.hitch(this, function (returnedString) {
                    try {
                        eval(returnedString + "\r\n//# sourceURL=" + this.id + ".js");
                    } catch (e) {
                        domConstruct.place("<div class=\"alert alert-danger\">Error while evaluating javascript input: " + e + "</div>", this.domNode, "only");
                    }
                }),
                error        : lang.hitch(this, function(error) {
                    alert(error.description);
                }),
                onValidation : lang.hitch(this, function(validations) {
                    alert("There were " + validations.length + " validation errors");
                })
            }, this);   
        },

        _executeCallback: function (cb, from) {
            logger.debug(this.id + "._executeCallback" + (from ? " from " + from : ""));
            if (cb && typeof cb === "function") {
                cb();
            }
        }
    });
});

require(["JavaScriptSnippet/widget/JavaScriptSnippet"]);
