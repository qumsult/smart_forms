/// <reference path="../typings/sfGlobalTypings.d.ts" />
declare var sfRedNaoCreateFormElementByName:any;
var SmartFormsElementsTranslation:any={};
class SmartFormsEntries {
    public Grid:any;
    public formElementsOptions:any;
    public formElements:any;
    public entries:any;
    public currentEntryBeingEditted:number;
    public fakeFileUploader:any; 

    constructor() {
        rnJQuery('#cbDisplayType').change(()=> {
            this.FormatStartDate();
            this.FormatEndDate();
        });

        rnJQuery(".datePicker").datepicker({
            changeMonth: true,
            changeYear: true,
            dateFormat: 'MM/dd/yy',
            onClose: (dateText, inst)=> {

                var id = rnJQuery(this).attr('id');

                if (id == 'dpStartDate')
                    this.FormatStartDate();
                else
                    this.FormatEndDate();
            }
        });
        rnJQuery('#ui-datepicker-div').wrap('<div class="smartFormsSlider"></div>');
        rnJQuery('#btnExecute').click(()=>{this.ExecuteQuery()});
    }

    public FormatStartDate(): any {
        var dp = rnJQuery('#dpStartDate');
        var date = dp.datepicker('getDate');
        if (date == null)
            return;
        switch (rnJQuery('#cbDisplayType').val()) {
            case 'd':
                return;
            case 'w':
                dp.datepicker('setDate', new Date(date.setDate(date.getDate() - date.getDay())));
                break;
            case 'm':
                dp.datepicker('setDate', new Date(date.getFullYear(), date.getMonth(), 1));
                break;
            case 'y':
                dp.datepicker('setDate', new Date(date.getFullYear(), 0, 1));
                break;
        }
    }

    public FormatEndDate() {
        var dp = rnJQuery('#dpEndDate');
        var date = dp.datepicker('getDate');
        if (date == null)
            return;
        switch (rnJQuery('#cbDisplayType').val()) {
            case 'd':
                return;
            case 'w':
                dp.datepicker('setDate', new Date(date.setDate(date.getDate() + (6 - date.getDay()))));
                break;
            case 'm':
                date = new Date(date.getFullYear(), date.getMonth() + 1, 1);
                dp.datepicker('setDate', new Date(date.setDate(0)));
                break;
            case 'y':
                dp.datepicker('setDate', new Date(date.getFullYear(), 11, 31));
                break;
        }
    }

    public ExecuteQuery() {


        var startDate = rnJQuery.datepicker.formatDate('yy-mm-dd', rnJQuery('#dpStartDate').datepicker('getDate'));
        var endDate = rnJQuery.datepicker.formatDate('yy-mm-dd', rnJQuery('#dpEndDate').datepicker('getDate'));
        var form = rnJQuery('#cbForm').val();

        if (!startDate) {
            alert('Start Date is Mandatory');
            return;
        }


        if (!endDate) {
            alert('End Date is Mandatory');
            return;
        }


        if (!form) {
            alert('Campaign is mandatory');
            return;
        }


        var data = {
            action: "rednao_smart_forms_entries_list",
            startDate: startDate,
            endDate: endDate,
            form_id: form
        };


        rnJQuery.post(ajaxurl, data, (result:any)=> {
            var result = rnJQuery.parseJSON(result);
            this.ajaxCompleted(result)
        });
    }

    public ajaxCompleted(result) {
        this.formElementsOptions= result.formOptions;
        this.entries=result.entries;
        Promise.all([
                rnSystem.import('sfMain/formBuilder/sfAnalytics'),
                rnSystem.import('sfMain/formBuilder/fakeFileUploader')
            ]
        ).then((modules)=> {
            this.fakeFileUploader=modules[1].fakeFileUploader;
            this.LoadGrid(modules[0], this.formElementsOptions, this.entries);
        });
    }

    public  createActionButtons(colData:any,entryData:any){
        return `<div class="bootstrap-wrapper" data-entryid="${entryData.entry_id}">
                    <span class="glyphicon glyphicon-pencil editButton" onclick="smartFormsEditClicked(event)"></span>
                    <span class="glyphicon glyphicon-trash deleteButton" onclick="smartFormsDeleteClicked(event)"></span>
                </div>    
                `;
    }

    public LoadGrid(columnCreator, formOptions, entries) {
        var colmodel = [];
        colmodel.push({
            name: 'Actions', index: 'entry_id', width: 20, height: 120, editable: false, formatter: ((param1:any,colData:any,entryData:any)=>{
                return this.createActionButtons(colData,entryData);
            })
        });

        colmodel.push({
            "name": "date",
            "index": "date",
            "sorttype": "string",
            "key": false,
            "editable": true,
            hidden: false,
            width: 100
        });
        var i;
        for (i = 0; i < formOptions.length; i++) {
            var column = columnCreator.CreateColumn(formOptions[i]);
            if (column != null) {
                for (var t = 0; t < column.length; t++)
                    colmodel.push(column[t]);
            }
        }

        var max = 500;
        if (entries.length > 500)
            max = entries.length;

        colmodel.push({
            "name": "entry_id",
            "index": "entry_id",
            "sorttype": "int",
            "key": true,
            "editable": false,
            hidden: true
        });

        if (this.Grid != null)
            rnJQuery('#grid').jqGrid('GridUnload');

        this.Grid = rnJQuery('#grid').jqGrid({
            autowidth: false,
            "hoverrows": true,
            height: '100%',
            mtype: "POST",
            "viewrecords": true,
            "jsonReader": {"repeatitems": false, "subgrid": {"repeatitems": false}},
            "gridview": true,
            "editurl": ajaxurl + "?action=rednao_smart_forms_execute_op",
            "cellurl": ajaxurl + "?action=rednao_smart_donations_execute_analytics_op",
            "rowList": [50, 150, 300, max],
            "sortname": "TransactionId",
            "colModel": colmodel,
            "datatype": "local",
            "data": entries,
            "postData": {"oper": "grid"},
            "prmNames": {
                "page": "page",
                "rows": "rows",
                "sort": "sidx",
                "order": "sord",
                "search": "_search",
                "nd": "nd",
                "id": "TransactionId",
                "filter": "filters",
                "searchField": "searchField",
                "searchOper": "searchOper",
                "searchString": "searchString",
                "oper": "oper",
                "query": "grid",
                "addoper": "add",
                "editoper": "edit",
                "deloper": "del",
                "excel": "excel",
                "subgrid": "subgrid",
                "totalrows": "totalrows",
                "autocomplete": "autocmpl"
            }
            ,
            "loadError": function (xhr, status, err) {
                try {
                    if (xhr.responseText)
                        alert(xhr.responseText);
                } catch (e) {
                    alert(xhr.responseText);
                }
            },
            "pager": "#pager"
        });

        rnJQuery('#grid').jqGrid('navGrid', '#pager', {
                "add": false,
                "edit": false,
                "del": false,
                "search": false,
                "refresh": false,
                "view": false,
                "excel": false,
                "pdf": false,
                "csv": true,
                addtext: "",
                addtitle: "Add new row",
                "errorTextFormat": function (r) {
                    return r.responseText;
                }
            },
            {
                beforeSubmit: function () {
                    alert('eaea')
                }
            },
            {
                beforeSubmit: function () {
                    alert('eaea1')
                }
            },
            {
                beforeSubmit: function () {
                    if (!RedNaoLicensingManagerVar.LicenseIsValid("Sorry, you need a license to delete a record")) {
                        return [false, 'A license is required'];
                    }
                    {
                        return [true];
                    }
                },
                afterSubmit: function (response, postData) {
                    try {
                        var result:any = JSON.parse(response.responseText);
                        if (result.success == "0")
                            return [false, result.message];
                    } catch (exception) {
                        return [false, "An error occurred, please refresh and try again"];
                    }

                    return [true];

                }

            }
        );

        rnJQuery("#grid").jqGrid('navButtonAdd', '#pager', {
            caption: "Export to csv (pro)",
            onClickButton: function () {
                if (!RedNaoLicensingManagerVar.LicenseIsValid('Sorry, exporting to csv is only supported in the pro version')) {
                    return;
                }

                var startDate = rnJQuery.datepicker.formatDate('yy-mm-dd', rnJQuery('#dpStartDate').datepicker('getDate'));
                var endDate = rnJQuery.datepicker.formatDate('yy-mm-dd', rnJQuery('#dpEndDate').datepicker('getDate'));
                var form = rnJQuery('#cbForm').val();

                //window.location=smartFormsRootPath+"smart-forms-exporter.php?startdate="+startDate+"&enddate="+endDate+"&formid="+form;
                var totalOfRecords = rnJQuery("#grid").jqGrid('getGridParam', 'records');
                if (totalOfRecords > 1000000)
                    alert('Warning the export funcion can export up to 1,0000,000 records. Please export the data directly though the database');
                var rowNum = rnJQuery('#grid').getGridParam('rowNum');
                rnJQuery('#grid').setGridParam({rowNum: 1000000}).trigger("reloadGrid");
                var data:any = {};
                data.headers = {};
                for (var i = 0; i < formOptions.length; i++) {
                    if (typeof formOptions[i].Label == 'undefined')
                        continue;
                    data.headers[formOptions[i].Id] = formOptions[i].Label;
                }


                data.rowsInfo = rnJQuery("#grid").jqGrid('getRowData');
                for (var i = 0; i < data.rowsInfo.length; i++) {
                    delete data.rowsInfo[i].Actions;
                }
                var data:any = JSON.stringify(data);
                rnJQuery('#smartFormsExportData').val(data);
                rnJQuery('#exporterForm').submit();
                rnJQuery('#grid').setGridParam({rowNum: rowNum}).trigger("reloadGrid");

            }
        });

        this.Grid.on('jqGridAddEditAfterSubmit', function (a, b, c) {

        });
    }

    editForm(formId: number,rowId:string) {
        this.updateEditContainer(formId);
        var $dialog=rnJQuery('#editDialog').RNDialog({
            ButtonClick:(action,button)=>{
                if(action=='accept')
                {
                    this.SaveEdition(rowId);
                }
            },
            Width:'750px',
            Buttons:[
                {Label:'Cancel',Id:'dialogCancel',Style:'danger',Icon:'glyphicon glyphicon-remove',Action:'cancel'},
                {Label:'Submit',Id:'dialogAccept',Style:'success',Icon:'glyphicon glyphicon-ok',Action:'accept'}
            ]

        });

        $dialog.find('.modal-content').css('max-height',rnJQuery(window).height()*0.7);
        $dialog.RNDialog('Show');
    }

    deleteForm(formId: string,rowId:string) {
        rnJQuery.RNGetConfirmationDialog().ShowConfirmation('Are you sure you want to delete the row?','This is not reversible',
            function() {
                rnJQuery.ajax({
                    type: 'POST',
                    url: ajaxurl,
                    dataType: "json",
                    data: {
                        action: "rednao_smart_forms_execute_op",
                        TransactionId: formId,
                        oper: 'del'
                    },
                    success: (result)=> {
                        alert('Entry deleted successfully');
                        rnJQuery('#grid').jqGrid('delRowData',rowId);
                    }
                });
            });
    }

    private updateEditContainer(formId: number) {
        var entry=null;
        this.currentEntryBeingEditted=formId;
        for(var i=0;i<this.entries.length;i++)
        {
            if(this.entries[i].entry_id==formId) {
                entry = this.entries[i];
                break;
            }
        }


        var $container:any=rnJQuery('#editDialog');
        $container.empty();
        rnJQuery('#editDialog').RNDialog('Destroy');
        this.formElements=[];
        for(var formOptions of this.formElementsOptions)
        {
            var formElement:any;
            if(formOptions.ClassName=="sfFileUpload")
                formElement=new this.fakeFileUploader(formOptions);
            else
                formElement=sfRedNaoCreateFormElementByName(formOptions.ClassName,formOptions);
            if(formElement.StoresInformation()) {
                formElement.AppendElementToContainer($container);
                var value=entry.data[formElement.Id];
                formElement.SetData(value==undefined?{}:value);
                this.formElements.push(formElement);
            }
        }
    }

    private SaveEdition(rowId:string) {
        var formValues:any={};

        for(var formElement of this.formElements)
        {
            var value=formElement.GetValueString();
            formValues[formElement.Id]=value;
        }
        var me=this;
        rnJQuery.ajax({
            type:'POST',
            url:ajaxurl,
            dataType:"json",
            data:{
                action:"rednao_smart_forms_edit_form_values",
                entryId:this.currentEntryBeingEditted,
                entryString:JSON.stringify(formValues),
                elementOptions:JSON.stringify(this.formElementsOptions)
            },
            success:(result)=>{
                if(result.result) {
                    var currentEntry=null;
                    for(var entry of this.entries)
                    {
                        if(entry.entry_id==this.currentEntryBeingEditted)
                            currentEntry=entry;
                    }
                    currentEntry.data=formValues;
                    /*   var colModels=rnJQuery("#grid").jqGrid ('getGridParam', 'colModel');

                   var rowData=rnJQuery('#grid').jqGrid('getRowData', rowId);
                    for(var formValue in formValues) {
                        var currentColModel=null;
                        for(var colmodel of colModels)
                        {
                            if(colmodel.index==formValue)
                                currentColModel=colmodel;
                        }
                        rowData[formValue] = currentColModel.formatter('',{colModel:currentColModel},currentEntry);
                    }*/
                    var rowData=rnJQuery('#grid').jqGrid('getRowData', rowId);
                    rowData.data=currentEntry.data;
                    rnJQuery('#grid').jqGrid('setRowData', rowId,rowData);
                    rnJQuery('#editDialog').RNDialog('Hide');
                }
                else
                    alert('an error ocurred, please try again');
            },
            error:function(result) {
                alert('An error ocurred');
            }
        });
    }
}

var SmartFormsEntriesVar:SmartFormsEntries;
rnJQuery(function () {
    SmartFormsEntriesVar=new SmartFormsEntries();
});

function smartFormsEditClicked(event:any)
{
    if(!RedNaoLicensingManagerVar.LicenseIsValid("Sorry, you need a license to delete or edit a record"))
    {
        return [false,'Sorry, A license is required'];
    }
    var formId:number=rnJQuery(event.currentTarget).parent().data('entryid');
    var rowId=rnJQuery(event.currentTarget).closest('.jqgrow').attr('id');
    SmartFormsEntriesVar.editForm(formId,rowId);
}

function smartFormsDeleteClicked(event:any)
{
    var formId:string=rnJQuery(event.currentTarget).parent().data('entryid');
    var rowId=rnJQuery(event.currentTarget).closest('.jqgrow').attr('id');
    SmartFormsEntriesVar.deleteForm(formId,rowId);
}