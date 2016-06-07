interface String {
    trunc(length: number): String;
}

//    declare var String;

/**
 * Truncate the string.
 * @param n: string length
 */
String.prototype.trunc = function (n) {
    'use strict'
    // If n=6 and
    //   length > 6, substr(0,n-2) + ...
    return this.length <= n
        ? this.substr(0, n)
        : this.substr(0, n - 1) + '\u2026';
};

module TechRadar {
    'use strict'
    /**
      * Config
      */
    var moduleName = 'techRadar.techRadarChart';

    /**
      * Module
      */
    export var myModule;
    try {
        myModule = angular.module(moduleName);
    } catch (err) {
        // named module does not exist, so create one
        myModule = angular.module(moduleName, []);
    }

    export interface RenderOptions {
        time?: string;
        category?: string;
        prio?: { [prio: number]: boolean }
    }

    export interface ITechRadarChartScope extends ng.IScope {
        technologies: Technology[];
        options: RenderOptions;
        config: csComp.Services.SpreadsheetService;
        searchterm: string;
        prioritylevel: number;
        /**
         * Start angle in degrees (0 degrees is North).
         * @type {number}
         */
        startangle?: number;
        /**
         * End angle in degrees (0 degrees is North).
         * @type {[type]}
         */
        endangle?: number;
        radius?: number;
        innerradius?: number;
        margin?: { top: number; right: number; bottom: number; left: number; };
        render(config: csComp.Services.SpreadsheetService, renderOptions?: RenderOptions): void;
        setItemVisibility(technologies: Technology, isVisible: boolean): void;
    }

    /**
      * Directive to create a sparkline chart.
      *
      * @seealso: http://odiseo.net/angularjs/proper-use-of-d3-js-with-angular-directives
      * @seealso: http://cmaurer.github.io/angularjs-nvd3-directives/sparkline.chart.html
      * @seealso: http://www.tnoda.com/blog/2013-12-19
      */
    myModule
        .directive('techRadarChart', ['$filter', 'busService',
            ($filter: ng.IFilterService, bus: csComp.Services.MessageBusService): ng.IDirective => {

                return {
                    terminal: true,       // do not compile any other internal directives
                    restrict: 'EA',       // E = elements, other options are A=attributes and C=classes
                    transclude: true,
                    scope: {
                        config: '=',  // = means that we use angular to evaluate the expression,
                        options: '=',
                        searchterm: '=',
                        prioritylevel: '=',
                        startangle: '@',  // In degrees, 0 is north
                        endangle: '@',
                        radius: '@',  // the value is used as is
                        innerradius: '@',
                        margin: '@'
                    },
                    link: (scope: ITechRadarChartScope, element, attrs) => {

                        var c = scope.config;

                        var update = () => {
                            var screenWidth = window.innerWidth;

                            if (!scope.config.radial || !scope.config.horizontal) return;
                            var radial = scope.config.radial; // ["2016", "2017", "2018", "2019", "2020", "2021", "2022"];
                            var horizontal = ["very low", "low", "neutral", "high", "very high"];


                            var radius = 400; // radius of a circle
                            var thickness = 6; //thickness of a circle
                            var nr_of_segments = radial.length;
                            var nr_of_levels = horizontal.length;
                            var origin_x = 10; // distance to the right from left top
                            var origin_y = 1; // distance from the top from left top

                            var rings = d3.scale.linear().domain([0, horizontal.length + 1]).range([0, radius])
                            var padding_rings = rings(1); // distance between rings

                            var _outer_radius = radius;
                            var _inner_radius = radius - thickness;
                            var _start_angle = -0.5 * Math.PI;
                            var _end_angle = 0.5 * Math.PI;

                            var degrees = d3.scale.linear().domain([0, 180]).range([_start_angle, _end_angle]);

                            var start_angle = degrees(0);
                            var end_angle = degrees(180);

                            var _origin_x_offset = origin_x + radius;
                            var _origin_y_offset = origin_y + radius;
                            var segment = d3.scale.linear().domain([0, nr_of_segments]).range([start_angle, end_angle]);
                            // var width = _origin_x_offset * 2;
                            // var height = _origin_y_offset * 2;


                            var margin = { left: 20, top: 20, right: 20, bottom: 20 };
                            var width = Math.min(screenWidth, 1200) - margin.left - margin.right;
                            var height = Math.min(screenWidth, 1200) - margin.top - margin.bottom;

                            var svg = d3.select(element[0]).append("svg")
                                .attr("width", (width + margin.left + margin.right))
                                .attr("height", (height + margin.top + margin.bottom))
                                .append("g").attr("class", "wrapper")
                                .attr("transform", "translate(" + (width / 2 + margin.left) + "," + (height / 2 + margin.top) + ")");

                            var radial = scope.config.radial; // ["2016", "2017", "2018", "2019", "2020", "2021", "2022"];
                            var horizontal = scope.config.horizontal; //["very low", "low", "neutral", "high", "very high"];

                            var step = 180 / nr_of_segments;


                            var minDepth = 0.25;
                            var arcDepth = (0.95 - minDepth) / scope.config.horizontal.length;
                            var arcWidth = width / 2 / horizontal.length * (0.95 - minDepth);


                            var first = true;
                            var id = scope.config.horizontal.length;
                            var mycolor = d3.rgb("#eee");

                            scope.config.horizontal.forEach(h => {
                                var segmentData = [];
                                var start = 0;

                                scope.config.radial.forEach(r => {
                                    segmentData.push({ title: r, startAngle: start, endAngle: start + step, items: [] });
                                    start += step;
                                });

                                var items = [];
                                scope.config.items.forEach(i => {
                                    var horValue = i.getDimensionValue(scope.config.activeConfig.horizontalDimension);
                                    if (horValue === h) {
                                        var radValue = i.getDimensionValue(scope.config.activeConfig.radialDimension);
                                        var pos = scope.config.radial.indexOf(radValue);
                                        if (pos !== -1) {
                                            var segment = _.find(segmentData, (s => s.title === radValue));
                                            if (segment) {
                                                segment.items.push(i);
                                                i._segment = segment;
                                                i._segmentPos = pos;
                                                i._segmentItemPos = segment.items.length;
                                                items.push(i);
                                            }
                                        }
                                    }
                                });

                                var depth = ((arcDepth * id) + minDepth) / 2;

                                //Creates a function that makes SVG paths in the shape of arcs with the specified inner and outer radius 
                                var arc = d3.svg.arc()
                                    .innerRadius(width * depth - arcWidth)
                                    .outerRadius(width * depth);

                                //Creates function that will turn the month data into start and end angles
                                var pie = d3.layout.pie()
                                    .value((d) => { return d.endAngle - d.startAngle; })
                                    .startAngle(_start_angle)
                                    .endAngle(_end_angle)
                                    .sort(null);

                                //Draw the arcs themselves
                                svg.selectAll(".monthArc" + id)
                                    .data(pie(segmentData))
                                    .enter().append("path")
                                    .attr("class", "segmentArc")
                                    .attr("id", function (d, i) { return "monthArc_" + i; })
                                    .style("fill", mycolor.toString())
                                    .attr("d", arc);

                                items.forEach((i: csComp.Services.RadarInput) => {

                                    //console.log(i._segment.items.length);

                                    var difS = 0;
                                    var difE = 1;
                                    if (i._segment.items.length > 1) { difS = difE = (i._segmentItemPos / i._segment.items.length) * 0.9; }

                                    var segmentArc = d3.svg.arc()
                                        .innerRadius(width * depth - arcWidth)
                                        .outerRadius(width * depth)
                                        .startAngle(segment(i._segmentPos + difS))
                                        .endAngle(segment(i._segmentPos + difE));

                                    var pos = segmentArc.centroid();

                                    var circle = svg.append("circle")
                                        .attr("cx", pos[0])
                                        .attr("cy", pos[1])
                                        .attr("r", 10)
                                        .on("mousedown", () => {
                                            bus.publish('radarinput','selected',i);
                                        });

                                    var text = svg.append("text")
                                        .attr("x", pos[0])
                                        .attr("y", pos[1] + 20)
                                        .style("z-index", 100)
                                        .attr("text-anchor", "middle")
                                        .text(i.Technology);


                                });

                                if (first) {

                                    //Append the month names within the arcs
                                    svg.selectAll(".monthText")
                                        .data(segmentData)
                                        .enter().append("text")
                                        .attr("class", "radialText")
                                        .style("text-anchor", "left") //place the text halfway on the arc

                                        .attr("x", 5) //Move the text from the start angle of the arc
                                        .attr("dy", -11) //Move the text down
                                        .append("textPath")

                                        .attr("xlink:href", function (d, i) { return "#monthArc_" + i; })
                                        .text(function (d) { return d.title; });

                                    first = false;
                                }

                                //arcPos -= (1 / scope.config.horizontal.length);
                                mycolor = mycolor.darker(0.5 / scope.config.horizontal.length);


                                id -= 1;



                            });



                        }

                        bus.subscribe('filter', (a, e) => {
                            if (a === 'updated') update();
                        });


                    }
                }



            }
        ])
}



