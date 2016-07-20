/**
 * DOMson v1.0.0
 * (c) 2016 James, EV-Labs
 * License: MIT
 */

'use strict';

var DOMson = (function($, undefined) {
    var VERSION = '1.0.0';

    var DATA_KEY = 'data-key';
    var DATA_REQUIRED = 'data-required';
    var DATA_MODIFIED = 'data-modified';


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
            var dataKey = keywords.dataKey;
            var dataRequired = keywords.dataRequired;
            var dataModified = keywords.dataModified;

            if (dataKey !== undefined && dataKey !== '') {
                DATA_KEY = dataKey;
            }

            if (dataRequired !== undefined && dataRequired !== '') {
                DATA_REQUIRED = dataRequired;
            }

            if (dataModified !== undefined && dataModified !== '') {
                DATA_MODIFIED = dataModified;
            }
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

        _domObject.find(":input").on('change', function() {
            var type = $(this).attr('type');
            var dataKey = $(this).attr(DATA_KEY);

            if (dataKey !== undefined && dataKey !== '') {
                if (type === 'checkbox') {
                    $('[' + DATA_KEY + '=' + dataKey + ']').attr(DATA_MODIFIED, true);
                } else {
                    $(this).attr(DATA_MODIFIED, true);
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

        _domObject.find('[' + DATA_REQUIRED + ']').each(function(index, item) {
            var dataKey = $(item).attr(DATA_KEY);

            if (dataKey === undefined || dataKey === '') {
                return;
            }

            var dataRequired = $(item).attr(DATA_REQUIRED);
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
            var tagName = item['tagName'];

            var dataKey = $(item).attr(DATA_KEY);
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
                        if (typeof output[dataKey] === typeof {}) {
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

            var dataModified = $(item).attr(DATA_MODIFIED);
            var isDataModified = (dataModified !== undefined && dataModified !== false);

            if (isDataModified) {
                if (type === 'checkbox') {
                    if (output[dataKey] === undefined) {
                        output[dataKey] = [];
                    }

                    var checked = $(item).prop('checked');

                    if (checked !== undefined && checked === true) {
                        output[dataKey].push(item.value);
                    }

                } else if (type === 'radio') {
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
