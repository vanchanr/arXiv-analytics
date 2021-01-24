const APIGATEWAY_URL = "https://n3z996amkk.execute-api.ap-south-1.amazonaws.com/dev";
const S3_WEBSITE_URL = "http://arxiv-analytics.s3-website.ap-south-1.amazonaws.com";
const DARK_THEME = "darkTheme";
const STATUS = "status";
const PROCESSING = "processing"
const SUCCESS = "success"
const ERROR = "error"

//$(document).ajaxStop($.unblockUI);
$(document).ready(function () {
    if (localStorage.getItem(DARK_THEME) === "true") {
        $("body").addClass("dark-theme");
        $("#" + DARK_THEME).prop("checked", true);
    }

    $("#enterKeyword").keyup(function (event) {
        if (event.keyCode === 13) {
            this.blur();
            $("#submitKeyword").click();
        }
    });

    $("#submitKeyword").click(function () {
        this.blur();
        getResults($("#enterKeyword").val());
    });

    $("#" + DARK_THEME).click(function () {
        this.blur();
        $("body").toggleClass("dark-theme");
        if (localStorage.getItem(DARK_THEME) !== "true") {
            localStorage.setItem(DARK_THEME, "true");
        } else {
            localStorage.setItem(DARK_THEME, "false");
        }
    });

    $(".trigger-modal").click(function () {
        $('#imgModalBody').html($(this).html());
        $('#imgModal').modal('show');
    });
});

function showLoading() {
    $("#" + STATUS).html('<i class="fas fa-circle-notch fa-spin"></i>').css("color", "#0d6efd");
};

function showSuccess() {
    $("#" + STATUS).html('<i class="fas fa-check"></i>').css("color", "green");
}

function showError() {
    $("#" + STATUS).html('<i class="fas fa-times"></i>').css("color", "red");
}

requestStatus=null;

function task(requestId, i) {
    setTimeout(function () {
        $.get(`${S3_WEBSITE_URL}/request_status/${requestId}`)
            .done(function (data, textStatus, jqXHR) {
                requestStatus = data;
                console.log(requestStatus);
                $("#response").html(requestStatus);
            })
            .fail(function (jqXHR, textStatus, errorThrown) {
                console.log(errorThrown);
                $("#response").html(errorThrown);
            });
    }, 2000 * i);
};

function getResults(keyword) {
    showLoading();
    //$.blockUI({ message: null });
    requestId = null;
    requestStatus = null;
    url = `${APIGATEWAY_URL}/keyword/${keyword}`;
    $.get(url)
        .done(function (data, textStatus, jqXHR) {
            showSuccess();
            console.log("Request SUCCESS for " + url);
            console.log(data, textStatus);
            requestId = jqXHR.getResponseHeader("x-amzn-requestid");

            // plots = ["yearPlot", "authorPlot", "categoryPlot"];
            // for (plot of plots) {
            //     $("#" + plot).attr("src", "data:image/png;base64," + responseBody[plot]);
            // }
            // $("#response").html(JSON.stringify(responseBody['papersDump'], null, 2));
            $("#response").html(requestId);
        })
        .fail(function (jqXHR, textStatus, errorThrown) {
            showError();
            console.log("An ERROR occured for " + url, textStatus, errorThrown);
            $("#response").html(textStatus + ". Please Retry Again..");
        })
        .always(function() {
            // if (requestId !== null) {
            //     console.log("entered here");
            //     i=1;
            //     while (requestStatus !== SUCCESS || requestStatus !== ERROR) {
            //         task(requestId, i);
            //         i++;
            //     }
            // }
        });
};
