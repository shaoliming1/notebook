// QCodeCell stand for Question Code Cell
/**
 *
 *
 * @module qcodecell
 * @namespace qcodecell
 * @class QCodeCell
 */


define([
    'jquery',
    'base/js/namespace',
    'base/js/utils',
    'base/js/i18n',
    'base/js/keyboard',
    'base/js/dialog',
    'services/config',
    'notebook/js/codecell',
    'notebook/js/questionnumber',
    'notebook/js/outputarea',
    'notebook/js/completer',
    'notebook/js/celltoolbar',
    'codemirror/lib/codemirror',
    'codemirror/mode/python/python',
    'notebook/js/codemirror-ipython',
    '../../components/bootstrap-tour/build/js/bootstrap-tour'
    ],function (
        $,
        IPython,
        utils,
        i18n,
        keyboard,
        dialog,
        configmod,
        cell,
        questionnumber,
        outputarea,
        completer,
        celltoolbar,
        CodeMirror,
        Tour
    ) {
    "use strict";

    var CodeCell = cell.CodeCell;

    var QCodeCell = function (kernel,model, options) {
        /**
         * Constructor
         *
         * A Cell conceived to answer the question
         *
         * Parameters:
         *  kernel: Kernel instance
         *      The kernel doesn't have to be set at creation time, in that case
         *      it will be null and set_kernel has to be called later.
         * model: Model instance
         *      the model doesn't have to be set at creation time, in that case
         *      it will be null and set_model has to be called later.
         * options: dictionary
         *      Dictionary of keyword arguments.
         *      events: $(Events) instance
         *      config: dictionary
         *      keyboard_manager: KeyboardManager instance
         *      notebook: Notebook instance
         *      tooltip: Tooltip instance
         */
        this.model = model || null;
        console.log(options);
        CodeCell.apply(this, [kernel, options]);
        this.class_config = new configmod.ConfigWithDefaults(this.config,
                                            QCodeCell.options_default, 'QCodeCell');

        // Attributes we want to override in this subclass.
        this.cell_type = "qcode"


    }

    QCodeCell.options_default = CodeCell.options_default;
    QCodeCell.msg_cells = {};
    QCodeCell.prototype = Object.create(CodeCell.prototype);

    /** @method create_element */
    QCodeCell.prototype.create_element = function () {
        CodeCell.prototype.create_element.apply(this, arguments);
        var that = this;

        var cell = $('<div></div>').addClass('cell code_cell');
        cell.attr('tabindex','2');

        var input = $('<div></div>').addClass('input');

        this.input = input;

        var prompt_container = $('<div/>').addClass('prompt_container');

        var run_this_cell = $('<div></div>').addClass('run_this_cell');
        run_this_cell.prop('title', 'Run this cell');
        run_this_cell.append('<i class="fa-step-forward fa"></i>');
        run_this_cell.click(function (e) {
            e.stopImmediatePropagation();
            that.execute();
        });

        var prompt = $('<div/>').addClass('prompt input_prompt');

        var inner_cell = $('<div/>').addClass('inner_cell');
        this.celltoolbar = new celltoolbar.CellToolbar({
            cell:this,
            notebook: this.notebook});
        inner_cell.append(this.celltoolbar.element);
        var input_area = $('<div/>').addClass('input_area');
        this.code_mirror = new CodeMirror(input_area.get(0), this._options.cm_config);
        // In case of bugs that put the keyboard manager into an inconsistent state,
        // ensure KM is enabled when CodeMirror is focused:
        this.code_mirror.on('focus', function () {
            if (that.keyboard_manager) {
                that.keyboard_manager.enable();
            }

            that.code_mirror.setOption('readOnly', !that.is_editable());
        });
        this.code_mirror.on('keydown', $.proxy(this.handle_keyevent,this));
        $(this.code_mirror.getInputField()).attr("spellcheck", "false");
        //this.question_number = $('<div></div>').addClass('div.question_number');
        this.question_number = new questionnumber.QuestionNumber({
            config: this.config,
            selector: inner_cell,
            keyboard_manager: this.keyboard_manager,
        });
        //this.set_question_number();
        // 设置双击修改题目编号
        //this.question_number.dblclick();
        inner_cell.append(this.question_number).append(input_area);
        prompt_container.append(prompt).append(run_this_cell);
        input.append(prompt_container).append(inner_cell);

        var output = $('<div></div>');
        cell.append(input).append(output);
        this.element = cell;
        this.output_area = new outputarea.OutputArea({
            config: this.config,
            selector: output,
            prompt_area: true,
            events: this.events,
            keyboard_manager: this.keyboard_manager,
        });
        this.completer = new completer.Completer(this, this.events);

    };

    /** @method bind_events */
    QCodeCell.prototype.bind_events = function(){
        CodeCell.prototype.bind_events.apply(this, arguments);
        var that = this;

        this.events.on('execution_request.Kernel', function (e, options) {
            console.log("recv execution kernel request");
            console.log(options);
        })
    }


    // function modify_question_number(options){
    //     var that = this;
    //     var dialog_body = $('<div/>').append(
    //         $("<p/>").addClass("rename-message")
    //             .text(i18n.msg._('Enter a new question number:'))
    //     ).append(
    //         $("<br/>")
    //     ).append(
    //         $('<input/>').attr('type','text').attr('size','25').addClass('form-control')
    //         .val(options.notebook.question_number.)
    //     );
    //     var d = dialog.modal({
    //         title: i18n.msg._("Modify Question Number"),
    //         body:
    //         })
    // }


    // 从json中加载cell内容

    QCodeCell.prototype.fromJSON = function(data){
        CodeCell.prototype.fromJSON.apply(this, arguments);

        if (data.cell_type === "qcode") {
            this.set_text(data.source);
            this.question_number.set_question_number(data.question_number);
            // make this value the starting point, so that we can only undo
            // to this state, instead of a blank cell
            this.code_mirror.clearHistory();
            this.auto_highlight();
        }
        this.set_input_prompt(data.execution_count);
        this.output_area.trusted = data.metadata.trusted || false;
        this.output_area.fromJSON(data.outputs, data.metadata);
    };


    // save to JSON
    QCodeCell.prototype.toJSON = function () {
        var data = CodeCell.prototype.toJSON.apply(this);
        data.source = this.get_text();
        data.question_number = this.question_number.get_question_number();
        // is finite protect against undefined and '*' value
        if (isFinite(this.input_prompt_number)) {
            data.execution_count = this.input_prompt_number;
        } else {
            data.execution_count = null;
        }
        var outputs = this.output_area.toJSON();
        data.outputs = outputs;
        data.metadata.trusted = this.output_area.trusted;
        if (this.output_area.collapsed) {
            data.metadata.collapsed = this.output_area.collapsed;
        } else {
            delete data.metadata.collapsed;
        }
        if (this.output_area.scroll_state === 'auto') {
            delete data.metadata.scrolled;
        } else {
            data.metadata.scrolled = this.output_area.scroll_state;
        }
        return data;

    }
    QCodeCell.prototype.execute = function(stop_on_error){
        if (!this.kernel){
            console.log(i18n.msg._("Can't execute cell since kernel is not set"));
            return;
        }
        // if (!this.model){
        //     console.log(i18n.msg._("Can't execute cell since model is not set"));
        //     return;
        // }

        if (stop_on_error === undefined) {
            if (this.metadata !== undefined &&
                    this.metadata.tags !== undefined) {
                if (this.metadata.tags.indexOf('raises-exception') !== -1) {
                    stop_on_error = false;
                } else {
                    stop_on_error = true;
                }
            } else {
               stop_on_error = true;
            }
        }

        this.clear_output(false, true);
        var old_msg_id = this.last_msg_id;
        if(old_msg_id){
            this.kernel.clear_callbacks_for_msg(old_msg_id);
            delete QCodeCell.msg_cells[old_msg_id];
            this.last_msg_id = null;
        }

        if(this.get_text().trim().length === 0){
            // nothing to do
            this.set_input_prompt(null);
            return;
        }

        this.set_input_prompt('*');
        this.element.addClass("running");
        var callbacks = this.get_callbacks();

        var question_number = this.question_number.get_question_number();
        console.log(question_number);
        // not a number
        if(isNaN(question_number)){
            var body = $("<div>").append($("<p>")
            .text(i18n.msg._("For question code cell, you need specify a number of the question")));
            dialog.modal({
                    title: i18n.msg._("Warning"),
                    body: body,
                    buttons:
                        {
                            Ok: {}
                        }
                }
            );
            return;
        }

        this.last_msg_id = this.kernel.execute(this.get_text(), callbacks, {silent: false, store_history: true,
            stop_on_error : stop_on_error,
            question_number:question_number,
            });
        CodeCell.msg_cells[this.last_msg_id] = this;
        this.render();
        this.events.trigger('execute.QCodeCell', {cell: this});
        var that = this;
        function handleFinished(evt, data) {
            if (that.kernel.id === data.kernel.id && that.last_msg_id === data.msg_id) {
                    that.events.trigger('finished_execute.QCodeCell', {cell: that});
                that.events.off('finished_iopub.Kernel', handleFinished);
              }
        }
        this.events.on('finished_iopub.Kernel', handleFinished);


    };

    QCodeCell.prototype.get_callbacks = function () {
        var that = this;
        return {
            clear_on_done: false,
            shell : {
                reply : $.proxy(this._handle_execute_reply, this),
                payload : {
                    set_next_input : $.proxy(this._handle_set_next_input, this),
                    page : $.proxy(this._open_with_pager, this)
                }
            },
            iopub : {
                output : function() {
                    that.events.trigger('set_dirty.Notebook', {value: true});
                    that.output_area.handle_output.apply(that.output_area, arguments);
                    that.display_score.apply(that.output_area, arguments);

                },
                clear_output : function() {
                    that.events.trigger('set_dirty.Notebook', {value: true});
                    that.output_area.handle_clear_output.apply(that.output_area, arguments);
                },
            },
            input : $.proxy(this._handle_input_request, this),
        };
    };

    QCodeCell.prototype.display_score = function(msg){
        //if(msg.content.score !== undefined){
        //     var tour = new window.Tour({
        //     steps: [
        //     {
        //         //element: this,
        //         title: "Title of my step",
        //         content: "Content of my step"
        //     }
        // ]});
        //
        // // Initialize the tour
        // tour.init();
        //
        // // Start the tour
        // tour.start();
        //var notification = new Notification("sucess", {body:i18n.msg._("good ")})
          // 先检查浏览器是否支持
        if (!("Notification" in window)) {
            alert("This browser does not support desktop notification");
        }
        var title = 'sucess';
        var body  ="";
        if (msg['content'].error!==undefined)
        {
            title = 'fail';
            body = msg['content']['error'];
        }else if(msg['content'].success!==undefined){
            body = msg['content'].success;
        }else{
        return;
        }

        // 检查用户是否同意接受通知
        if (Notification.permission === "granted") {
            // If it's okay let's create a notification
        var notification = new Notification(title,{body:body});
        }
      // 否则我们需要向用户获取权限
      else if (Notification.permission !== 'denied') {
        Notification.requestPermission(function (permission) {
          // 如果用户同意，就可以向他们发送通知
          if (permission === "granted") {
            var notification = new Notification(title, {body:body });
          }
        });
      }

    };





    IPython.QCodeCell = QCodeCell;
    return {'QCodeCell':QCodeCell};

})