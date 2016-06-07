var App;
(function (App) {
    var HomeCtrl = (function () {
        function HomeCtrl($scope, $timeout, busService, data) {
            var _this = this;
            this.$scope = $scope;
            this.$timeout = $timeout;
            this.busService = busService;
            this.data = data;
            this.isSliderInitialised = false;
            $scope.vm = this;
            $scope.leftPanelVisible = true;
            busService.subscribe('technologies', function (title) {
                if (title !== 'loaded')
                    return;
                _this.reload();
            });
            this.options = { prio: { 1: true, 2: true, 3: false } };
            busService.subscribe('technology', function (action, t) {
                switch (action) {
                    case 'selected':
                        _this.selectTechnology(t);
                        break;
                }
            });
            busService.subscribe('radarinput', function (action, ri) {
                switch (action) {
                    case 'selected':
                        _this.selectRadarInput(ri);
                        break;
                }
            });
            this.reload();
        }
        HomeCtrl.prototype.reload = function () {
            this.updateFilter();
            if (this.$scope.$root.$$phase !== '$apply' && this.$scope.$root.$$phase !== '$digest') {
                this.$scope.$apply();
            }
        };
        HomeCtrl.prototype.setExample = function (e) {
            this.activeExample = e;
        };
        HomeCtrl.prototype.selectRadarInput = function (ri) {
            console.log(ri);
        };
        HomeCtrl.prototype.selectTechnology = function (t) {
            this.activeFocus = t.id;
            this.$scope.selectedTechnology = t;
            this.$scope.rightPanelVisible = true;
        };
        HomeCtrl.prototype.getDimensions = function (dim) {
            var res = [];
            this.data.items.forEach(function (ri) {
                var s = _.find(ri.Scores, { Title: dim });
                if (s && s.Value !== '')
                    if (s && res.indexOf(s.Value) === -1)
                        res.push(s.Value);
            });
            return res;
        };
        HomeCtrl.prototype.DisableFilter = function (f) {
            f.Enabled = false;
            this.updateFilter();
        };
        HomeCtrl.prototype.updateFilter = function () {
            var _this = this;
            this.data.items = [];
            if (!this.data.sheets || !this.data.sheets.RadarInput)
                return;
            this.data.sheets.RadarInput.forEach(function (ri) {
                var match = true;
                _this.data.activeConfig.Filters.forEach(function (f) {
                    if (f.Enabled && f.Value && ri.getDimensionValue(f.Dimension) !== f.Value)
                        match = false;
                });
                if (match)
                    _this.data.items.push(ri);
            });
            this.data.activeConfig.Visualisation.forEach(function (f) {
                switch (f.Visual) {
                    case 'Horizontal':
                        _this.data.horizontal = _this.getDimensions(f.Dimension);
                        _this.data.activeConfig.horizontalDimension = f.Dimension;
                        break;
                    case 'Radial':
                        _this.data.radial = _this.getDimensions(f.Dimension);
                        _this.data.activeConfig.radialDimension = f.Dimension;
                        break;
                    case 'Color':
                        _this.data.colors = _this.getDimensions(f.Dimension);
                        _this.data.activeConfig.colorDimension = f.Dimension;
                        break;
                    case 'Size':
                        _this.data.size = _this.getDimensions(f.Dimension);
                        _this.data.activeConfig.sizeDimension = f.Dimension;
                        break;
                }
            });
            this.busService.publish('filter', 'updated');
        };
        HomeCtrl.prototype.focus = function (t) {
            this.busService.publish('technology', 'selected', t);
            this.selectTechnology(t);
        };
        HomeCtrl.prototype.showInfo = function (spreadsheet) {
            var index = 1;
            spreadsheet.forEach(function (row) {
                for (var header in row) {
                    if (!row.hasOwnProperty(header))
                        continue;
                }
            });
        };
        HomeCtrl.$inject = [
            '$scope',
            '$timeout',
            'busService',
            'sheetService'
        ];
        return HomeCtrl;
    }());
    App.HomeCtrl = HomeCtrl;
})(App || (App = {}));
