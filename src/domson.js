/**
 * DOMson v1.0.1
 * (c) 2016 James, EV-Labs
 * License: MIT
 */

'use strict';

var DOMson = (function($, undefined) {
    var VERSION = '1.0.1';

    var _keywords = {
        exportKey: 'export-key',
        required: 'required',
        modified: 'modified'
    };

    var _options = {
        exportModifiedData: true
    };

    var _eventAttached = false;
    var _domObject = null;


    /**
     * Set up a custom configuration
     */
    function _setupConfig(config) {
        if (config === undefined) {
            return;
        }

        var keywords = config.keywords;

        if (keywords !== undefined) {
            _keywords = $.extend(_keywords, keywords);
        }

        var options = config.options;

        if (options !== undefined) {
            _options = $.extend(_options, options);
        }
    }


    /**
     * Attach an event handler for detecting value change of input
     */
    function _attachEvent(domElement) {
        if (domElement !== undefined) {
            _domObject = $(domElement);
        } else {
            _domObject = $('*');
        }

        _domObject.find(":input, select").on('change', function() {
            var type = $(this).attr('type');
            var dataKey = $(this).attr(_keywords.exportKey);

            if (dataKey !== undefined && dataKey !== '') {
                if (type === 'checkbox') {
                    $('[' + _keywords.exportKey + '=' + dataKey + ']').attr(_keywords.modified, true);
                } else {
                    $(this).attr(_keywords.modified, true);
                }
            }
        });

        _eventAttached = true;
    }


    /**
     * Detach an event handler
     */
    function _detachEvent() {
        if (_domObject !== null && _eventAttached) {
            _domObject.off('change');

            _domObject = null;
            _eventAttached = false;
        }
    }


    /**
     * Validate all elements that have an attribute data-required
     */
    function _validate() {
        var result = {};

        _domObject.find('[' + _keywords.required + ']').each(function(index, item) {
            var dataKey = $(item).attr(_keywords.exportKey);

            if (dataKey === undefined || dataKey === '') {
                return;
            }

            var dataRequired = $(item).attr(_keywords.required);
            var isDataRequired = (dataRequired !== undefined && dataRequired !== false);

            if (isDataRequired === false) {
                return;
            }

            if (item.value === undefined || item.value === '') {
                if (result[dataKey] === undefined) {
                    result[dataKey] = [];
                }

                if ($.inArray(result[dataKey], 'empty') === -1) {
                    result[dataKey].push('empty')
                }
            }
        });

        return result;
    }


    /**
     * Traverse attached DOM elements
     */
    function _traverse(current, output) {
        $(current).children().each(function(index, item) {
            var type = $(item).attr('type');
            var tagName = item['tagName'].toUpperCase();

            var dataKey = $(item).attr(_keywords.exportKey);
            var isDataKeyExists = (dataKey !== undefined && dataKey !== '');

            if (isDataKeyExists === false) {
                _traverse(item, output);
                return;
            }

            if (tagName === 'DIV') {
                var nextOutput = {};

                _traverse(item, nextOutput);

                if (Object.keys(nextOutput).length !== 0) {
                    if (output[dataKey] !== undefined) {
                        if (Array.isArray(output[dataKey]) === false) {
                            var legacyObject = output[dataKey];

                            output[dataKey] = [];
                            output[dataKey].push(legacyObject);
                        }
                        output[dataKey].push(nextOutput);

                    } else {
                        output[dataKey] = nextOutput;
                    }
                }
                return;
            }

            var dataModified = $(item).attr(_keywords.modified);
            var isDataModified = (dataModified !== undefined && dataModified !== false);

            if (isDataModified === false && _options.exportModifiedData) {
              return;
            }

            if (tagName === 'SELECT') {
                output[dataKey] = item.options[item.selectedIndex].value;

            } else if (tagName === 'INPUT') {
                if (type === 'checkbox') {
                    if (output[dataKey] === undefined) {
                        output[dataKey] = [];
                    }

                    var checked = $(item).prop('checked');

                    if (checked !== undefined && checked === true) {
                        output[dataKey].push(item.value);
                    }

                } else if (type === 'radio') {
                    output[dataKey] = '';

                    var checked = $(item).prop('checked');

                    if (checked !== undefined && checked === true) {
                        output[dataKey] = item.value;
                    }

                } else {
                    output[dataKey] = item.value;
                }
            }
        });
    }

    return {
        attach: function(domElement, config) {
            if (_eventAttached === true) {
                console.error('DOMson already attached');
                return;
            }

            _setupConfig(config);
            _attachEvent(domElement);

            return (_eventAttached === true);
        },

        detach: function() {
            _detachEvent();

            return (_eventAttached === false);
        },

        validate: function() {
            if (_domObject === null || _eventAttached === false) {
                console.error('DOMson is not attached');
                return;
            }

            return _validate();
        },

        export: function() {
            if (_domObject === null || _eventAttached === false) {
                console.error('DOMson is not attached');
                return;
            }

            var resultObject = {};
            _traverse(_domObject, resultObject);

            return resultObject;
        }
    }
})(jQuery);
