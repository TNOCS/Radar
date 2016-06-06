module App {
    import ISpreadsheetRow = csComp.Services.ISpreadsheetRow;
    
    export interface IHomeScope extends ng.IScope {
        vm: HomeCtrl; 
        leftPanelVisible : boolean;       
        rightPanelVisible : boolean;
        selected : csComp.Services.ITechnology; 
    }

    export class HomeCtrl {
    
        public options: TechRadar.RenderOptions;

        public filter: Function;
        private slider: any;
        private activeFocus: string;
        private isSliderInitialised = false;

        static $inject = [
            '$scope',
            '$timeout',
            'busService',
            'sheetService'
        ];

        // dependencies are injected via AngularJS $injector
        // controller's name is registered in Application.ts and specified from ng-controller attribute in index.html
        constructor(
            private $scope             : IHomeScope,
            private $timeout           : ng.ITimeoutService,
            private busService         : csComp.Services.MessageBusService,
            public data : csComp.Services.SpreadsheetService
            ) {
            $scope.vm = this;
            $scope.leftPanelVisible = true;
            
            
            this.options = { prio : { 1 : true, 2: true, 3:false} };
            busService.subscribe('technology', (action: string, t: csComp.Services.ITechnology) => {
                switch (action) {
                    case 'selected':
                        this.setFocus(t);
                        break;
                }
            });

            busService.subscribe('technologies', (title: string) => {
                if (title !== 'loaded') return;
                this.reload();
            });

            this.reload();
        }
        
        public addFilter()
        {
            this.data.activeConfig.Filters.push({Visual : "Horizontal", Dimension : "Category", Enabled:true });
            
        }
        
        /** reload new technologies */
        private reload() {
             if (this.$scope.$root.$$phase !== '$apply' && this.$scope.$root.$$phase !== '$digest') {                
                this.$scope.$apply();
             }            
        }

        public setFocus(t: csComp.Services.ITechnology) {
            // if (!this.isSliderInitialised) return;
            // this.technologies.forEach((ts) => ts.focus = false);
            // t.focus = true;
            // var est = $('#tech-' + t.id);
            // var list = $('#tslist');

            // this.slider.gotoSlide(t.id);
            this.activeFocus = t.id;
            this.$scope.selected = t;
            this.$scope.rightPanelVisible = true;

        }

        

        private focus(t: csComp.Services.ITechnology) {
            this.busService.publish('technology', 'selected', t);
            this.setFocus(t);
        }

        /**
         * Show info that is obtained from the Google sheet.
         */
        private showInfo(spreadsheet: ISpreadsheetRow[]) {
            var index = 1;
            spreadsheet.forEach((row) => {
                //console.log('Row ' + index++);
                for (var header in row) {
                    if (!row.hasOwnProperty(header)) continue;
                    //console.log(header + ': ' + row[header]);
                }
            });
        }

    }
}