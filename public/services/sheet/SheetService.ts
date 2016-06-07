//var _ = import('lodash');

module csComp.Services {
    declare var Tabletop;
    declare var CircularJSON;

    export class Vis {

        constructor(public Visual: 'Horizontal' | 'Radial' | 'Color' | 'Size', public Dimension: string, public Enabled: boolean) {

        }
    }

    export class Filter {

        public Options: string[];

        constructor(public Dimension: string, public Value: string, public Enabled: boolean) {

        }
    }

    export class Config {
        public Title: string;
        public Visualisation: Vis[];
        public Filters: Filter[];
        public horizontalDimension: string;
        public radialDimension: string;
        public colorDimension: string;
        public sizeDimension: string;
    }


    export class Sheets {

        public Years = [2016, 2018];

        Technologies: ITechnology[];
        Categories: ICategory[];
        SubCategories: ISubCategory[];
        RadarInput: RadarInput[];
        Examples: Example[] = [];
        Dimensions: string[] = ["-none-"];
    }

    export class InputScore {

        Title: string;
        Year: number;
        Score: string;
        Value: string;


        constructor(title: string, obj: any, sheet: Sheets) {
            var t = title.replace(' 2016', '');
            this.Title = t;
            this.Value = obj[title];
            if (sheet.Dimensions.indexOf(t) === -1) sheet.Dimensions.push(t);
        }

    }

    export class RadarInput {
        Technology: string;
        Users: string;
        Description: string;
        Scores: InputScore[];
        Examples: string;
        Remarks: string;
        _Technology: ITechnology;
        _Examples: Example[];
        _segment: any;
        _segmentPos: number;
        _segmentItemPos: number;

        constructor(input: any, sheet: Sheets) {
            this.Technology = input.Technology;
            this.Users = input.Users;
            this.Description = input.Description;
            this.Scores = [];
            this.Remarks = input.Remarks;
            this.Examples = input["Examples & Products"].trim();
            this.Scores.push(new InputScore("TRL 2016", input, sheet));
            this.Scores.push(new InputScore("Adoption 2016", input, sheet));
            this.Scores.push(new InputScore("Hype Cycle 2016", input, sheet));
            this.Scores.push(new InputScore("Potential Impact", input, sheet));
        }

        public getDimensionValue(title: string) {
            var score = _.find(this.Scores, s => { return s.Title === title; });
            if (score) return score.Value;
            return null;
        }


    }

    export interface IDomain {
        Title: string;
    }

    export interface ITechnology {
        id: string;
        Technology: string;
        Description: string;
        Category: string;
        SubCategory: string;
        Examples: Example[];

        _Category: ICategory;
        _SubCategory: ISubCategory;
        _RadarInput: RadarInput[];
    }

    export interface ICategory {
        Category: string;
        Domain: string;
        Description: string;
    }

    export interface ISubCategory {
        SubCategory: string;
        Category: string;
        _Category: ICategory;
        Description: string;
    }

    export interface ISpreadsheetRow {
        Category: string;
        Relevance: number;
        Thumbnail: string;
        TimeCategory: string;
        DeltaTime: string | number;
        ShortTitle: string;
        Title: string;
        Text: string;
        Subtitle: string;
        ContentType: string;
        Content: string;
    }

    export class Example {
        Name: string;
        Url: string;
        Icon: string;

        constructor(i: string) {
            var result = /(.*)\[(.*)\]/.exec(i);
            if (result && result.length > 2) {
                this.Name = result[1];
                this.Url = result[2];
            } else {
                this.Name = i;
            }

        }
    }

    /**
     * An service wrapper around the Tabletop javascript library.
     * See: https://github.com/jsoma/tabletop
     */
    export class SpreadsheetService {
        public technologies: TechRadar.Technology[];
        public sheets: Sheets;
        public activeConfig: Config;
        public presets: Config[];
        public horizontal: string[];
        public radial: string[];
        public colors: string[];
        public size: string[];
        public items: RadarInput[];

        public initConfig(config: Config) {

            config.Visualisation = [];
            config.Visualisation.push(new Vis("Horizontal", "Adoption", false));
            config.Visualisation.push(new Vis("Radial", "Category", false));
            config.Visualisation.push(new Vis("Color", "TRL", false));
            config.Visualisation.push(new Vis("Size", "TRL", false));
        }

        /** Load the technologies */
        public loadTechnologies(url: string, callback: () => void) {


            this.activeConfig = new Config();
            this.presets = [];
            this.presets.push(this.activeConfig);

            this.initConfig(this.activeConfig);

            var serialized = localStorage.getItem('backup');
            var r = CircularJSON.parse(serialized);
            this.parseTechnologies(r, callback);


            // this.loadSheet(url, (r) => {
            //     var serialized = CircularJSON.stringify(r);
            //     localStorage.setItem('backup', serialized);
            //     this.parseTechnologies(r, callback);
            // });
        }

        private parseTechnologies(r, callback) {
            this.sheets = new Sheets();
            this.sheets.Technologies = r.Technologies.elements;
            this.sheets.Categories = r.Categories.elements;
            this.sheets.SubCategories = r.SubCategories.elements;
            this.sheets.RadarInput = [];

            this.sheets.Technologies.forEach(t => {
                t._Category = _.find(this.sheets.Categories, (c) => c.Category === t.Category);
                t._SubCategory = _.find(this.sheets.SubCategories, (c) => c.SubCategory === t.SubCategory);
                t._RadarInput = [];
            });

            var lastTech = '';

            r['Radar Input'].elements.forEach(i => {
                var ri = new RadarInput(i, this.sheets);
                if (ri.Technology === '') ri.Technology = lastTech;
                lastTech = ri.Technology;
                ri._Examples = [];
                var examples = ri.Examples.split(',');
                examples.forEach(e => {
                    // create example
                    var example = new Example(e);

                    // look for existing example based on url

                    var existingExample = _.find(this.sheets.Examples, (ex) => ((ex.Url && example.Url && ex.Url.toLowerCase() === example.Url.toLowerCase()) || (!ex.Url && ex.Name && example.Name && ex.Name.toLowerCase() === example.Name.toLowerCase())));
                    if (existingExample) {
                        ri._Examples.push(existingExample);
                    } else {
                        this.sheets.Examples.push(example);
                        ri._Examples.push(example);
                    }


                });
                ri._Technology = _.find(this.sheets.Technologies, (t) => t.Technology === ri.Technology);
                if (ri._Technology && ri.Description) {
                    ri.Scores.push(new InputScore("Users", { "Users": ri.Users }, this.sheets));
                    if (ri._Technology) {
                        ri.Scores.push(new InputScore("Category", { "Category": ri._Technology.Category }, this.sheets));
                        ri.Scores.push(new InputScore("SubCategory", { "SubCategory": ri._Technology.SubCategory }, this.sheets));
                        if (ri._Technology._Category) {
                            ri.Scores.push(new InputScore("Domain", { "Domain": ri._Technology._Category.Domain }, this.sheets));
                        }
                    }
                    this.sheets.RadarInput.push(ri);
                }
                else {
                    console.log('Warning not found' + ri.Technology);
                }
                //if (ri._Technology) ri._Technology._RadarInput.push(ri);
            });

            // init filters
            this.activeConfig.Filters = [];
            this.sheets.Dimensions.forEach(d => {
                if (d !== "-none-") {
                    var f = new Filter(d, '', true);
                    f.Options = [];
                    this.sheets.RadarInput.forEach(ri => {
                        var v = ri.getDimensionValue(d);
                        if (v && f.Options.indexOf(v) === -1) f.Options.push(v);
                    });

                    this.activeConfig.Filters.push(f);
                }
            });



            callback();
        }

        /**
         * Load a worksheet.
         */
        private loadSheet(url: string, callback: (sheet: any) => void) {
            console.log('Initializing tabletop');
            Tabletop.init({
                key: url,
                callback: callback,
                singleton: true,
                simpleSheet: false,
                parseNumbers: true
            });
        }

    }

}
