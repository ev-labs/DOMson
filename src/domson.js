/**
 * DOMson v1.1.0
 * (c) 2016 James, EV-Labs
 * License: MIT
 */

'use strict';

(function(window, $, undefined) {
    var VERSION = '1.1.0';

    var VALUE_TAGS = [
        'input',
        'select'
    ];

    var config = {
        keywords: {
            exportKey: 'export-key',
            exportTarget: 'export-target'
        },
        options: {
            exportOnlyTarget: true
        }
    }

    var self = window.DOMson || {};


    /**
     * Set up a custom configuration
     */
    function setupConfig(nextConfig) {
        if (nextConfig === undefined) {
            return;
        }
        config = $.extend(config, nextConfig);
    }


    /**
     * Attach an event handler for watching
     */
    function attachEvent(domElement, eventType) {
        var jqObject = $(domElement);
        var tagName = jqObject[0].tagName.toLowerCase();

        if (eventType === undefined) {
            eventType = 'change';
        }

        var selector = eventType + '.domson';

        if ($.inArray(tagName, VALUE_TAGS) !== -1) {
            jqObject.off(selector).one(selector, function() {
                var type = jqObject.attr('type');
                var exportKey = jqObject.attr(config.keywords.exportKey);

                if (exportKey !== undefined && exportKey !== '') {
                    if (type === 'checkbox') {
                        $('[' + config.keywords.exportKey + '=' + exportKey + ']').attr(config.keywords.exportTarget, true);
                    } else {
                        jqObject.attr(config.keywords.exportTarget, true);
                    }
                }
            });
        }

        var childrenSelector = VALUE_TAGS.join(',');

        if (jqObject.children().length > 0) {
            jqObject.find(childrenSelector).each(function() {
                attachEvent(this);
            });
        }
    }


    /**
     * Traverse DOM elements for export
     */
    function traverse(domElement, output) {
        var jqObject = $(domElement);
        var tagName = jqObject[0]['tagName'].toLowerCase();

        var exportKey = jqObject.attr(config.keywords.exportKey);
        var isExportKeyExists = (exportKey !== undefined && exportKey !== '');
        var isValueTag = ($.inArray(tagName, VALUE_TAGS) !== -1);

        var children = jqObject.children();

        if (children.length === 0 || isValueTag) {
            var type = jqObject.attr('type');

            var exportTarget = jqObject.attr(config.keywords.exportTarget);
            var isExportTarget = (exportTarget !== undefined && exportTarget !== false);

            if (isExportTarget === false && config.options.exportOnlyTarget) {
                return;
            }

            if (tagName === 'select') {
                output[exportKey] = domElement.options[domElement.selectedIndex].value;

            } else if (tagName === 'input') {
                if (type === 'checkbox') {
                    if (output[exportKey] === undefined) {
                        output[exportKey] = [];
                    }

                    var checked = jqObject.prop('checked');

                    if (checked !== undefined && checked === true) {
                        output[exportKey].push(domElement.value);
                    }

                } else if (type === 'radio') {
                    var checked = jqObject.prop('checked');

                    if (checked !== undefined && checked === true) {
                        output[exportKey] = domElement.value;
                    }

                } else {
                    if (output[exportKey] !== undefined) {
                        if (false === Array.isArray(output[exportKey])) {
                            var legacyObject = output[exportKey];

                            output[exportKey] = [];
                            output[exportKey].push(legacyObject);
                        }
                        output[exportKey].push(domElement.value);

                    } else {
                        output[exportKey] = domElement.value;
                    }
                }
            }
        } else {
            var outputOfChildren = isExportKeyExists ? {} : output;

            for (var i = 0; i < children.length; i++) {
                var child = children[i];
                traverse(child, outputOfChildren);
            }

            if (Object.keys(outputOfChildren).length === 0) {
                return;
            }

            if (false === isExportKeyExists) {
                return;
            }

            if (output[exportKey] !== undefined) {
                if (false === Array.isArray(output[exportKey])) {
                    var legacyObject = output[exportKey];

                    output[exportKey] = [];
                    output[exportKey].push(legacyObject);
                }
                output[exportKey].push(outputOfChildren);

            } else {
                output[exportKey] = outputOfChildren;
            }
        }
    }


    self.watch = function(domElement) {
        if (domElement === undefined) {
            domElement = document.body;
        }
        attachEvent(domElement);
    };


    self.export = function(domElement) {
        if (domElement === undefined) {
            domElement = document.body;
        }

        var resultObject = {};
        traverse(domElement, resultObject);

        return resultObject;
    };


    self.config = function(config) {
        setupConfig(config);
    };


    window.DOMson = self;

})(window, jQuery);
