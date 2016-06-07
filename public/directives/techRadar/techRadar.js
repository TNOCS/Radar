String.prototype.trunc = function (n) {
    'use strict';
    return this.length <= n
        ? this.substr(0, n)
        : this.substr(0, n - 1) + '\u2026';
};
var TechRadar;
(function (TechRadar) {
    'use strict';
    var moduleName = 'techRadar.techRadarChart';
    try {
        TechRadar.myModule = angular.module(moduleName);
    }
    catch (err) {
        TechRadar.myModule = angular.module(moduleName, []);
    }
    TechRadar.myModule
        .directive('techRadarChart', ['$filter', 'busService',
        function ($filter, bus) {
            return {
                terminal: true,
                restrict: 'EA',
                transclude: true,
                scope: {
                    config: '=',
                    options: '=',
                    searchterm: '=',
                    prioritylevel: '=',
                    startangle: '@',
                    endangle: '@',
                    radius: '@',
                    innerradius: '@',
                    margin: '@'
                },
                link: function (scope, element, attrs) {
                    var c10 = d3.scale.category10();
                    var c = scope.config;
                    var update = function () {
                        $(element[0]).empty();
                        var screenWidth = window.innerWidth;
                        var screenHeight = window.innerHeight;
                        if (!scope.config.radial || !scope.config.horizontal)
                            return;
                        var radial = scope.config.radial;
                        var horizontal = ["very low", "low", "neutral", "high", "very high"];
                        var radius = 400;
                        var thickness = 6;
                        var nr_of_segments = radial.length;
                        var nr_of_levels = horizontal.length;
                        var origin_x = 10;
                        var origin_y = 1;
                        var rings = d3.scale.linear().domain([0, horizontal.length + 1]).range([0, radius]);
                        var padding_rings = rings(1);
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
                        var margin = { left: 350, top: 200, right: 100, bottom: 50 };
                        var width = 1000;
                        var height = 900;
                        var svg = d3.select(element[0]).append("svg")
                            .attr("width", (width + margin.left + margin.right))
                            .attr("height", (height + margin.top + margin.bottom))
                            .append("g").attr("class", "wrapper")
                            .attr("transform", "translate(" + (width / 2 + margin.left) + "," + (height / 2 + margin.top) + ")");
                        var radial = scope.config.radial;
                        var horizontal = scope.config.horizontal;
                        var step = 180 / nr_of_segments;
                        var minDepth = 0.25;
                        var arcDepth = (0.95 - minDepth) / scope.config.horizontal.length;
                        var arcWidth = width / 2 / horizontal.length * (0.95 - minDepth);
                        var first = true;
                        var id = scope.config.horizontal.length;
                        var mycolor = d3.rgb("#eee");
                        scope.config.horizontal.forEach(function (h) {
                            var segmentData = [];
                            var start = 0;
                            scope.config.radial.forEach(function (r) {
                                segmentData.push({ title: r, startAngle: start, endAngle: start + step, items: [] });
                                start += step;
                            });
                            var items = [];
                            scope.config.items.forEach(function (i) {
                                var horValue = i.getDimensionValue(scope.config.activeConfig.horizontalDimension);
                                if (horValue === h) {
                                    var radValue = i.getDimensionValue(scope.config.activeConfig.radialDimension);
                                    var pos = scope.config.radial.indexOf(radValue);
                                    if (pos !== -1) {
                                        var segment = _.find(segmentData, (function (s) { return s.title === radValue; }));
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
                            var arc = d3.svg.arc()
                                .innerRadius(width * depth - arcWidth)
                                .outerRadius(width * depth);
                            var pie = d3.layout.pie()
                                .value(function (d) { return d.endAngle - d.startAngle; })
                                .startAngle(_start_angle)
                                .endAngle(_end_angle)
                                .sort(null);
                            svg.selectAll(".monthArc" + id)
                                .data(pie(segmentData))
                                .enter().append("path")
                                .attr("class", "segmentArc")
                                .attr("id", function (d, i) { return "monthArc_" + i; })
                                .style("fill", mycolor.toString())
                                .attr("d", arc);
                            items.forEach(function (i) {
                                var difS = 0;
                                var difE = 1;
                                if (i._segment.items.length > 1) {
                                    difS = difE = (i._segmentItemPos / i._segment.items.length) * 0.9;
                                }
                                var segmentArc = d3.svg.arc()
                                    .innerRadius(width * depth - arcWidth)
                                    .outerRadius(width * depth)
                                    .startAngle(segment(i._segmentPos + difS))
                                    .endAngle(segment(i._segmentPos + difE));
                                var pos = segmentArc.centroid();
                                var color = "black";
                                if (scope.config.activeConfig.colorDimension) {
                                    var colorValue = i.getDimensionValue(scope.config.activeConfig.colorDimension);
                                    if (colorValue && scope.config.colors.indexOf(colorValue) !== -1) {
                                        color = c10(scope.config.colors.indexOf(colorValue));
                                    }
                                }
                                var size = 10;
                                if (scope.config.activeConfig.sizeDimension && scope.config.activeConfig.sizeDimension !== "-none-") {
                                    var sizeValue = i.getDimensionValue(scope.config.activeConfig.sizeDimension);
                                    if (sizeValue && scope.config.size.indexOf(sizeValue) !== -1) {
                                        size = (20 / scope.config.size.length * scope.config.size.indexOf(sizeValue)) + 5;
                                    }
                                }
                                var circle = svg.append("circle")
                                    .attr("cx", pos[0])
                                    .attr("cy", pos[1])
                                    .attr("r", size)
                                    .style("fill", color.toString())
                                    .on("mousedown", function () {
                                    bus.publish('radarinput', 'selected', i);
                                });
                                var text = svg.append("text")
                                    .attr("x", pos[0])
                                    .attr("y", pos[1] + size + 15)
                                    .style("z-index", 100)
                                    .attr("text-anchor", "middle")
                                    .text(i.Technology);
                            });
                            if (first) {
                                svg.selectAll(".monthText")
                                    .data(segmentData)
                                    .enter().append("text")
                                    .attr("class", "radialText")
                                    .style("text-anchor", "left")
                                    .attr("x", 5)
                                    .attr("dy", -11)
                                    .append("textPath")
                                    .attr("xlink:href", function (d, i) { return "#monthArc_" + i; })
                                    .text(function (d) { return d.title; });
                                first = false;
                            }
                            mycolor = mycolor.darker(0.5 / scope.config.horizontal.length);
                            id -= 1;
                        });
                    };
                    bus.subscribe('filter', function (a, e) {
                        if (a === 'updated')
                            update();
                    });
                }
            };
        }
    ]);
})(TechRadar || (TechRadar = {}));
