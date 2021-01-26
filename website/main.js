const APIGATEWAY_URL = "https://n3z996amkk.execute-api.ap-south-1.amazonaws.com/dev";
const S3_WEBSITE_URL = "http://arxiv-analytics.s3-website.ap-south-1.amazonaws.com";

const PROCESSING = "processing"
const SUCCESS = "success"
const ERROR = "error"

const USER_INPUT_ENABLE = "enable"
const USER_INPUT_DISABLE = "disable"

const KEYWORD_INPUT = "#keywordInput"
const SUBMIT_BUTTON = "#submitButton"
const REQUEST_STATUS_IFRAME = "#requestStatusIframe"
const REQUEST_STATUS_ICON = "#requestStatusIcon"
const DARK_THEME = "#darkTheme"
const ALL_PAPERS = "#allPapers"
const YEAR_PLOT = "#yearPlot"
const AUTHOR_PLOT = "#authorPlot"
const CATEGORY_PLOT = "#categoryPlot"
const TOP_KEYWORDS = "#topKeywords"

//$(document).ajaxStop($.unblockUI);
$(document).ready(function () {

    if (localStorage.getItem(DARK_THEME) === "true") {
        $("body").addClass("dark-theme");
        $(DARK_THEME).prop("checked", true);
    }

    $(DARK_THEME).click(function () {
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

    $(KEYWORD_INPUT).keyup(function (event) {
        if (event.keyCode === 13) {
            this.blur();
            $(SUBMIT_BUTTON).click();
        }
    });

    $(SUBMIT_BUTTON).click(function () {
        this.blur();
        
        var inputVal = $(KEYWORD_INPUT).val();
        showProcessing();
        if (inputVal) {
            changeUserInputState(USER_INPUT_DISABLE);
            startRequest(inputVal);
        } else {
            $(REQUEST_STATUS_IFRAME).attr("src", "./empty_keyword_error.txt");
            showError();
        }
        
        // 
        // setTimeout(function() {
        //     $('#enterKeyword').prop('disabled', false);
        //     $(SUBMIT_BUTTON).prop('disabled', false);
        //     showAllElements();
        //     showProcessingLog();
        // }, 5000);
        
    });
});

function showAllElements() {
    $(REQUEST_STATUS_IFRAME).css("visibility", "visible");
    // $(STATUS).css("visibility", "visible");
}

function showProcessing() {
    $(REQUEST_STATUS_ICON).html('<i class="fas fa-circle-notch fa-spin"></i>')//.css("color", "#0d6efd");
    $(REQUEST_STATUS_ICON).show();
    $(REQUEST_STATUS_IFRAME).show();
}

function showSuccess() {
    $(REQUEST_STATUS_ICON).html('<i class="fas fa-check"></i>')//.css("color", "green");
}

function showError() {
    $(REQUEST_STATUS_ICON).html('<i class="fas fa-times"></i>')//.css("color", "red");
}

function showProcessingLog() {
    var showLogTimerId = setInterval(function() {
        $(REQUEST_STATUS_IFRAME).attr("src", "./text1.txt");
    }, 5000);

    var prevLastLine = "";
    var lastLineSameCount = 0;
    var readLogTImerId = setInterval(function() {
        var preTag = $(REQUEST_STATUS_IFRAME).contents().find("pre");
        if (preTag && preTag.html()) {
            logs = preTag.html().split("&gt; ");
            console.log(logs);
            if (logs && logs.length > 0) {
                curLastLine = logs[logs.length - 1].trim();

                if (curLastLine === SUCCESS) {
                    clearInterval(showLogTimerId);
                    clearInterval(readLogTImerId);
                    showSuccess();
                } else if (curLastLine === ERROR || lastLineSameCount > 10) {
                    clearInterval(showLogTimerId);
                    clearInterval(readLogTImerId);
                    showError();
                } else if (curLastLine === prevLastLine) {
                    lastLineSameCount++;
                } else {
                    prevLastLine = curLastLine;
                    lastLineSameCount = 0;
                }     
            }
        }
    }, 5000);
}

function getResults(keyword) {
    //showProcessing();
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
        });
}

// requestStatus=null;

// function task(requestId, i) {
//     setTimeout(function () {
//         $.get(`${S3_WEBSITE_URL}/request_status/${requestId}`)
//             .done(function (data, textStatus, jqXHR) {
//                 requestStatus = data;
//                 console.log(requestStatus);
//                 $("#response").html(requestStatus);
//             })
//             .fail(function (jqXHR, textStatus, errorThrown) {
//                 console.log(errorThrown);
//                 $("#response").html(errorThrown);
//             });
//     }, 2000 * i);
// }

function changeUserInputState(state) {
    if(state === USER_INPUT_ENABLE) {
        $(KEYWORD_INPUT).prop('disabled', false);
        $(SUBMIT_BUTTON).prop('disabled', false);
    } else {
        $(KEYWORD_INPUT).prop('disabled', true);
        $(SUBMIT_BUTTON).prop('disabled', true);
    }
}
//==========================================================
function startRequest(keyword) {
    //showProcessing();
    var keywordCleaned = keyword.toLowerCase().split(" ").join("_");
    var cached = canServeFromCache(keywordCleaned);
    if (cached) {
        updateAllResults(keywordCleaned);
        $(REQUEST_STATUS_IFRAME).attr("src", "./cache_info.txt");
        showSuccess();
        changeUserInputState(USER_INPUT_ENABLE);
    } else {
        $(REQUEST_STATUS_IFRAME).attr("src", "./under_construction.txt");
        showError();
        changeUserInputState(USER_INPUT_ENABLE);
    }
}

function updateAllResults(keyword) {
    fetchAndUpdateTopKeywords(keyword);
    fetchAndUpdateAllPlots(keyword);
    fetchAndUpdateAllPapers(keyword);
}
//==========================================================
function fetchAndUpdateAllPapers(keyword) {
    fileLink = `${S3_WEBSITE_URL}/results/${keyword}/allPapers.json`;
    $.get(fileLink)
        .done(function(data) {
            updateAllPapersArea(SUCCESS, data, fileLink);
        })
        .fail(function() {
            updateAllPapersArea(ERROR, "Error while fetching papers dump.. please retry again", null);
        });
}

function updateAllPapersArea(status, allPapersJson, fileLink) {
    var innerHtml = "";
    if(status === SUCCESS) {
        var papersCount = allPapersJson.length;
        innerHtml += `<div class="text-center"><h5>All Papers (count: ${papersCount}) <a href="${fileLink}">file</a></h5></div>
                    <ol>`;
        for (paper of allPapersJson) {
            innerHtml += getSinglePaperHtml(paper);
        }
        innerHtml += "</ol>";
    } else {
        innerHtml += `<h5>All Papers</h5>
                      <hr>
                      <p><b>`;
        innerHtml += (allPapersJson + "</b></p>");
    }
    $(ALL_PAPERS).html(innerHtml);
    $(ALL_PAPERS).show();
}

function getSinglePaperHtml(paperJson) {
    var html = "<hr><li>";
    html += (`<b>Title:</b> ${paperJson['title']}<br>`);
    html += (`<b>Authors:</b> ${paperJson['author'].join(', ')}<br>`);
    html += (`<b>Abstract:</b> ${paperJson['abstract']}<br>`);
    html += (`<b>Last Updated:</b> ${new Date(paperJson['lastUpdated']).toUTCString()}<br>`);
    html += (`<b>Categories:</b> ${paperJson['category'].join(', ')}<br>`);
    html += (`<b>Link:</b> <a href="${paperJson['url']}">${paperJson['url']}</a><br>`);
    return html + "</li>";
}
//==========================================================
function fetchAndUpdateTopKeywords(keyword) {
    $.get(`${S3_WEBSITE_URL}/results/${keyword}/topKeywords.json`)
        .done(function(data) {
            updateTopKeywordsArea(SUCCESS, data);
        })
        .fail(function() {
            updateTopKeywordsArea(ERROR, "Error while fetching top keywords list.. please retry again");
        });
}

function updateTopKeywordsArea(status, topKeywordsJson) {
    var innerHtml = `<h5>Top Keywords from Abstracts</h5>
                     <hr>
                     <p><b>`;
    if(status === SUCCESS) {
        var keywordArr = []; 
        for (k in topKeywordsJson) {
            keywordArr.push(k);
        }
        innerHtml += (keywordArr.join("</b> &mdash; <b>") + "</b></p>");
    } else {
        innerHtml += (topKeywordsJson + "</b></p>");
    }
    $(TOP_KEYWORDS).html(innerHtml);
    $(TOP_KEYWORDS).show();
}
//==========================================================
function fetchAndUpdateAllPlots(keyword) {
    var allPlots = [YEAR_PLOT, AUTHOR_PLOT, CATEGORY_PLOT];
    for (plotId of allPlots) {
        updatePlotArea(plotId, `./results/${keyword}/${plotId.substring(1)}.png`)
    }
    // updatePlotArea(YEAR_PLOT, "./results/blockchain/yearPlot.png");
    // updatePlotArea(AUTHOR_PLOT, "./results/blockchain/authorPlot.png");
    // updatePlotArea(CATEGORY_PLOT, "./results/blockchain/categoryPlot.png");
}

function updatePlotArea(plotId, plotImgPath) {
    $(plotId).html(`<img src="${plotImgPath}" alt="${plotId.substring(1)}"></img>`);
    $(plotId).show();
}
//==========================================================
function canServeFromCache(keyword) {
    var flag = false;
    $.ajaxSetup({async:false});
    $.get(`${S3_WEBSITE_URL}/results/${keyword}/lastProcessed.txt`)
        .done(function(data) {
            var lastProcessedDate = new Date(data.trim());
            var date = new Date();
            date.setDate(date.getDate() - 2);
            flag = (lastProcessedDate >= date);
        })
        .fail(function() {
            flag = false;
        });
    $.ajaxSetup({async:true});
    return flag;
}
//==========================================================
//$.get("http://arxiv-analytics.s3-website.ap-south-1.amazonaws.com/results/blockchain/lastProcessed.txt", function(data) {console.log(data)})
