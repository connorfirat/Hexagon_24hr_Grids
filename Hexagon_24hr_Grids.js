require([
    "esri/Map",
    "esri/views/SceneView",
    "esri/layers/SceneLayer",
    "esri/widgets/Expand",
    "esri/widgets/HistogramRangeSlider",
    "esri/renderers/smartMapping/statistics/histogram",
    "esri/core/promiseUtils"
], function(
    Map,
    SceneView,
    SceneLayer,
    Expand,
    HistogramRangeSlider,
    histogram,
    promiseUtils
) {
    const layer = new SceneLayer({
        portalItem: {
            id: "742dfd8ac1414dc9b6d7aac19296edfe",
            definitionExpression: "Int_Hour = 0"
        },
        popupEnabled: true
    });

    const map = new Map({
        basemap: "dark-gray-vector",
        layers: [layer],
        ground: "world-elevation"
    });

    const view = new SceneView({
        map: map,
        container: "viewDiv",
        camera: {
            position: {
                spatialReference: {
                    wkid: 4326
                },
                x: -85.25,
                y: 34.84,
                z: 38000 // meters
            },
            tilt: 35
        }
    });

    view.whenLayerView(layer).then(function(layerView) {
        const field = "Int_Hour";
        const min = 0;
        const max = 23;

        histogram({
            layer: layer,
            field: "Int_Hour",
            numBins: 23,
            minValue: min,
            maxValue: max
        }).then(function(histogramResponse) {
            const slider = new HistogramRangeSlider({
                bins: histogramResponse.bins,
                min: min,
                max: max,
                values: [min],
                excludedBarColor: "#524e4e",
                rangeLabelsVisible: true,
                labelsVisible: true,
                labelInputsEnabled: true,
                precision: 0,
                steps: 1,
                rangeType: "equal",
                container: document.getElementById("slider-container")
            });

            slider.labelFormatFunction = function(field){
                if(field == 0){
                    return (field + 12) + "am"
                }
                if(field >= 1 && field <= 11){
                    return (field) + "am"
                }
                if(field == 12){
                    return (field) + "pm"
                }
                if(field >= 13 && field <= 23){
                    return (field - 12) + "pm"
                }
            }

            slider.on(["thumb-change", "thumb-drag", "segment-drag"], function(
                event
            ) {
                filterByHistogramRange(field).catch(function(error) {
                    if (error.name !== "AbortError") {
                        console.error(error);
                    }
                });
            });
            const filterByHistogramRange = promiseUtils.debounce(function(
                field
            ) {
                layerView.filter = {
                    where: slider.generateWhereClause(field)
                };
            });
            const filterExpand = new Expand({
                view: view,
                content: document.getElementById("controls"),
                expandIconClass: "esri-icon-filter",
                expanded: true,
                mode: "floating"
            });


            // clear the view's default UI components if
            // app is used on a small device
            view.watch("heightBreakpoint, widthBreakpoint", function() {
                var ui = view.ui;

                if (
                    view.heightBreakpoint === "xsmall" ||
                    view.widthBreakpoint === "xsmall"
                ) {
                    ui.components = ["attribution", "compass"];
                } else {
                    ui.components = [
                        "attribution",
                        "navigation-toggle",
                        "compass",
                        "zoom"
                    ];
                }
            });

            view.ui.add(filterExpand, "bottom-left");
            view.ui.add("titleDiv", "top-right");
        });
    });
});