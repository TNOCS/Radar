var csComp;
(function (csComp) {
    var Services;
    (function (Services) {
        var Filter = (function () {
            function Filter(Visual, Dimension, Enabled) {
                this.Visual = Visual;
                this.Dimension = Dimension;
                this.Enabled = Enabled;
            }
            return Filter;
        }());
        Services.Filter = Filter;
        var Config = (function () {
            function Config() {
            }
            return Config;
        }());
        Services.Config = Config;
        var Sheets = (function () {
            function Sheets() {
                this.Years = [2016, 2018];
                this.Examples = [];
            }
            return Sheets;
        }());
        Services.Sheets = Sheets;
        var InputScore = (function () {
            function InputScore(title, obj) {
                var t = title.replace(' 2016', '');
                this.Title = t;
                this.Value = obj[title];
            }
            return InputScore;
        }());
        Services.InputScore = InputScore;
        var RadarInput = (function () {
            function RadarInput(input) {
                this.Technology = input.Technology;
                this.Users = input.Users;
                this.Description = input.Description;
                this.Scores = [];
                this.Remarks = input.Remarks;
                this.Examples = input["Examples & Products"].trim();
                this.Scores.push(new InputScore("TRL 2016", input));
                this.Scores.push(new InputScore("Adoption 2016", input));
                this.Scores.push(new InputScore("Hype Cycle 2016", input));
                this.Scores.push(new InputScore("Potential Impact", input));
            }
            return RadarInput;
        }());
        Services.RadarInput = RadarInput;
        var Example = (function () {
            function Example(i) {
                var result = /(.*)\[(.*)\]/.exec(i);
                if (result && result.length > 2) {
                    this.Name = result[1];
                    this.Url = result[2];
                }
                else {
                    this.Name = i;
                }
            }
            return Example;
        }());
        Services.Example = Example;
        var SpreadsheetService = (function () {
            function SpreadsheetService() {
            }
            SpreadsheetService.prototype.initConfig = function (config) {
                config.Filters = [];
                config.Filters.push(new Filter("Horizontal", "TRL", false));
                config.Filters.push(new Filter("Radial", "Category", false));
                config.Filters.push(new Filter("Color", "", false));
            };
            SpreadsheetService.prototype.loadTechnologies = function (url, callback) {
                var _this = this;
                this.activeConfig = new Config();
                this.presets = [];
                this.presets.push(this.activeConfig);
                this.initConfig(this.activeConfig);
                this.loadSheet(url, function (r) {
                    _this.sheets = new Sheets();
                    _this.sheets.Technologies = r.Technologies.elements;
                    _this.sheets.Categories = r.Categories.elements;
                    _this.sheets.SubCategories = r.SubCategories.elements;
                    _this.sheets.RadarInput = [];
                    _this.sheets.Technologies.forEach(function (t) {
                        t._Category = _.find(_this.sheets.Categories, function (c) { return c.Category === t.Category; });
                        t._SubCategory = _.find(_this.sheets.SubCategories, function (c) { return c.SubCategory === t.SubCategory; });
                        t._RadarInput = [];
                    });
                    var lastTech = '';
                    r['Radar Input'].elements.forEach(function (i) {
                        var ri = new RadarInput(i);
                        if (ri.Technology === '')
                            ri.Technology = lastTech;
                        lastTech = ri.Technology;
                        ri._Examples = [];
                        var examples = ri.Examples.split(',');
                        examples.forEach(function (e) {
                            var example = new Example(e);
                            var existingExample = _.find(_this.sheets.Examples, function (ex) { return ((ex.Url && example.Url && ex.Url.toLowerCase() === example.Url.toLowerCase()) || (!ex.Url && ex.Name && example.Name && ex.Name.toLowerCase() === example.Name.toLowerCase())); });
                            if (existingExample) {
                                ri._Examples.push(existingExample);
                            }
                            else {
                                _this.sheets.Examples.push(example);
                                ri._Examples.push(example);
                            }
                        });
                        ri._Technology = _.find(_this.sheets.Technologies, function (t) { return t.Technology === ri.Technology; });
                        if (ri._Technology && ri.Description) {
                            ri.Scores.push(new InputScore("Users", { "Users": ri.Users }));
                            if (ri._Technology) {
                                ri.Scores.push(new InputScore("Category", { "Category": ri._Technology.Category }));
                                ri.Scores.push(new InputScore("SubCategory", { "SubCategory": ri._Technology.SubCategory }));
                                if (ri._Technology._Category) {
                                    ri.Scores.push(new InputScore("Domain", { "Domain": ri._Technology._Category.Domain }));
                                }
                            }
                            _this.sheets.RadarInput.push(ri);
                        }
                        else {
                            console.log('Warning not found' + ri.Technology);
                        }
                    });
                    callback();
                });
            };
            SpreadsheetService.prototype.loadSheet = function (url, callback) {
                console.log('Initializing tabletop');
                Tabletop.init({
                    key: url,
                    callback: callback,
                    singleton: true,
                    simpleSheet: false,
                    parseNumbers: true
                });
            };
            return SpreadsheetService;
        }());
        Services.SpreadsheetService = SpreadsheetService;
    })(Services = csComp.Services || (csComp.Services = {}));
})(csComp || (csComp = {}));
