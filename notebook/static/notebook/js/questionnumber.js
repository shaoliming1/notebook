define([
    'jquery',
    "base/js/dialog",
    "base/js/i18n",
    ],function ($, dialog, i18n) {
    "use strict";

    /**
     * @class QuestionNumber
     *
     * @constructor
     */

    var QuestionNumber = function (options) {
        this.config = options.config;
        this.selector = options.selector;
        //this.events = options.events;
        this.keyboard_manager = options.keyboard_manager;
        this.wrapper = $(options.selector);

        this.create_element();
        this.bind_events();

    };
    QuestionNumber.prototype.create_element = function () {
        var element = this.element = $("<div />").addClass('div.question_number');
        // wrap element in safe trigger,
        // so that errors (e.g. in widget extensions) are logged instead of
        // breaking everything.
        this.element._original_trigger = this.element.trigger;
        this.element.trigger = function (name, data) {
            try {
                this._original_trigger.apply(this, arguments);
            } catch (e) {
                console.error("Exception in event handler for" + name, e, arguments);
            }
        }
        this.set_question_number();
        this.wrapper.append(this.element);
    };

    QuestionNumber.prototype.set_question_number = function(number){
        if(number === undefined){
            number = "*";
        }
        // TODO: maybe to do some security check
        if(!this.validate_question_number(number)){
            number = "*";
        }
        var question_number_html = "第"+'[' + number + ']题';

        this.element.html(question_number_html);
    };

    QuestionNumber.prototype.validate_question_number = function(number){
        return !isNaN(number) || number === "*";
    };

    QuestionNumber.prototype.get_question_number = function(number){
        var question_number_html = this.element.html();
        var right = question_number_html.split('[')[1];
        var number = right.split(']')[0];
        return number;
    };

    QuestionNumber.prototype.modify_question_number = function (options) {
        var that = this;
        var dialog_body = $('<div/>').append(
            $("<p/>").addClass("rename-message")
                .text(i18n.msg._('Enter a new question number:'))
        ).append(
            $("<br/>")
        ).append(
            $('<input/>').attr('type', 'text').attr('size', '25').addClass('form-control')
                .val(that.get_question_number())
        );
        var d = dialog.modal({
            title: i18n.msg._("Modify Question Number"),
            body: dialog_body,
            keyboard_manager: this.keyboard_manager,
            default_button: "Cancel",
            buttons: {
                "Cancel": {},
                "Modify": {
                    class: "btn-primary",
                    click: function () {
                        var new_number = d.find('input').val();
                        if (!that.validate_question_number(new_number)) {
                            d.find('.rename-message').text(i18n.msg._(
                                "Invalid question number")
                            );
                            return false;
                        } else {
                            that.set_question_number(new_number);
                        }
                    }
                }
            }

        });

    };

    QuestionNumber.prototype.bind_events = function () {
        var that = this;

        this.element.dblclick(function () {
            that.modify_question_number({keyboard_manager: that.keyboard_manager});
        });
    }


    return {"QuestionNumber": QuestionNumber};



});