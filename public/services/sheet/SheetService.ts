//var _ = import('lodash');

module csComp.Services {
    declare var Tabletop;

    export class Filter {

        constructor(public Visual: "Horizontal" | "Vertical" | "Color", public Dimension: string, public Enabled: boolean) {

        }
    }

    export class Config {
        public Title: string;
        public Filters: Filter[];
    }


    export class Sheets {

        public Years = [2016, 2018];

        Technologies: ITechnology[];
        Categories: ICategory[];
        SubCategories: ISubCategory[];
        RadarInput: RadarInput[];
    }

    export class InputScore {

        Title: string;
        Year: number;
        Score: string;
        Value: number;


        constructor(title: string, obj: any) {
            this.Title = title;
            this.Value = obj[title];
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

        constructor(input: any) {
            this.Technology = input.Technology;
            this.Users = input.Users;
            this.Description = input.Description;
            this.Scores = [];
            this.Remarks = input.Remarks;
            this.Examples = input["Examples & Products"];
            this.Scores.push(new InputScore("TRL 2016", input));
            this.Scores.push(new InputScore("Adoption 2016", input));
            this.Scores.push(new InputScore("Hype Cycle 2016", input));
            this.Scores.push(new InputScore("Potential Impact", input));


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
        _Category: ICategory;
        _SubCategory: ISubCategory;
        _RadarInput : RadarInput[];
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

    /**
     * An service wrapper around the Tabletop javascript library.
     * See: https://github.com/jsoma/tabletop
     */
    export class SpreadsheetService {
        public technologies: TechRadar.Technology[];
        public sheets: Sheets;
        public activeConfig: Config;
        public presets: Config[];

        public initConfig(config: Config) {

            config.Filters = [];
            config.Filters.push(new Filter("Horizontal", "", false));
            config.Filters.push(new Filter("Vertical", "", false));
            config.Filters.push(new Filter("Color", "", false));
        }

        /** Load the technologies */
        public loadTechnologies(url: string, callback: () => void) {

            this.activeConfig = new Config();
            this.presets = [];
            this.presets.push(this.activeConfig);

            this.initConfig(this.activeConfig);

            this.loadSheet(url, (r) => {
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

                r["Radar Input"].elements.forEach(i => {
                    var ri = new RadarInput(i);
                    ri._Technology = _.find(this.sheets.Technologies, (t) => t.Technology === ri.Technology);
                    ri.Scores.push(new InputScore("Users",{ "Users" : ri.Users}));                    
                    if (ri._Technology) {
                        ri.Scores.push(new InputScore("Category",{ "Category" : ri._Technology.Category}));
                        ri.Scores.push(new InputScore("SubCategory",{ "SubCategory" : ri._Technology.SubCategory}));
                        
                        if (ri._Technology._Category)
                        {
                            ri.Scores.push(new InputScore("Domain",{ "Domain" : ri._Technology._Category.Domain}));
                        }
                        
                    }                    
                    this.sheets.RadarInput.push(ri);
                    ri._Technology._RadarInput.push(ri);
                });




                // this.technologies = [];
                // var id = 1;
                // var page = 0;
                // var technology;
                // spreadsheet.forEach((row) => {
                //     // check if it's part of previous
                //     if (row.Category !== '') {

                //         //console.log(row.Category); 
                //         //console.log(row.Title);
                //         var deltaTimeString = row.DeltaTime;
                //         var priority = parseInt(row.Relevance.toString(), 10);
                //         var color;
                //         switch (priority) {
                //             case 1: color = '#F39092'; break;
                //             case 2: color = '#F5DC8F'; break;
                //             case 3: color = '#9EBACB'; break;
                //             case 4: color = '#DFE0DC'; break;
                //             default: color = 'white'; break;
                //         }
                //         var deltaTime = 0;
                //         if (typeof deltaTimeString === 'string') {
                //             deltaTime = +deltaTimeString.replace(',', '.');
                //         } else {
                //             deltaTime = deltaTimeString;
                //         }
                //         page = 0;
                //         technology = new TechRadar.Technology(
                //             id++,
                //             priority,
                //             row.Category,
                //             row.Thumbnail,
                //             row.TimeCategory,
                //             deltaTime,
                //             row.ShortTitle,
                //             row.Title,
                //             row.Subtitle,
                //             row.Text,
                //             color);
                //         this.technologies.push(technology);
                //     }

                //     if (row.ContentType === '') row.ContentType = 'markdown';
                //     if (row.Content !== '') {
                //         var c = new TechRadar.Content(page++, row.ContentType, row.Content, row.Subtitle);
                //         if (c.contentType.toLowerCase() === 'youtube') {
                //             c.videoUrl = c.content.indexOf('http') > 0
                //                 ? c.content
                //                 : 'http://www.youtube.com/embed/' + c.content + '?rel=0&autoplay=1';
                //             //console.log(c.videoUrl);
                //         };
                //         technology.content.push(c);
                //     }
                // });
                callback();
            });
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
