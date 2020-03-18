import "./../style/visual.less";

import powerbi from "powerbi-visuals-api";
import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import IVisual = powerbi.extensibility.visual.IVisual;
import IViewport = powerbi.IViewport

import DataView = powerbi.DataView;
import DataViewMetadata = powerbi.DataViewMetadata;
//import DataViewValueColumn = powerbi.DataViewValueColumn;
import DataViewCategorical = powerbi.DataViewCategorical;
import DataViewCategoricalColumn = powerbi.DataViewCategoricalColumn;
import DataViewCategoryColumn = powerbi.DataViewCategoryColumn;
import PrimitiveValue = powerbi.PrimitiveValue;
import IVisualHost = powerbi.extensibility.visual.IVisualHost;


//import IColorPalette = powerbi.extensibility.IColorPalette;
//import VisualObjectInstance = powerbi.VisualObjectInstance;
import VisualObjectInstanceEnumeration = powerbi.VisualObjectInstanceEnumeration;
import VisualObjectInstanceEnumerationObject = powerbi.VisualObjectInstanceEnumerationObject;
import EnumerateVisualObjectInstancesOptions = powerbi.EnumerateVisualObjectInstancesOptions;
import { axis } from "powerbi-visuals-utils-chartutils";

//for legend
import { legend, legendInterfaces } from 'powerbi-visuals-utils-chartutils';
import ILegend = legendInterfaces.ILegend;
import LegendData = legendInterfaces.LegendData
import LegendDataPoint = legendInterfaces.LegendDataPoint

import LegendPosition = legendInterfaces.LegendPosition;
import positionChartArea = legend.positionChartArea;
import createLegend = legend.createLegend;
import DataViewMetadataColumn = powerbi.DataViewMetadataColumn;
import IselectionBuilder = powerbi.visuals.ISelectionIdBuilder;
import ISelectionManager = powerbi.extensibility.ISelectionManager;
import ISelectionId = powerbi.visuals.ISelectionId;
import MarkerShape = legendInterfaces.MarkerShape;
import { valueFormatter as vf, textMeasurementService as tms, textMeasurementService, textUtil } from "powerbi-visuals-utils-formattingutils";
import IValueFormatter = vf.IValueFormatter;
import { VisualSettings } from "./settings";
import * as d3 from "d3";
import { TextProperties } from "powerbi-visuals-utils-formattingutils/lib/src/interfaces";
import { FontSize } from "powerbi-visuals-utils-chartutils/lib/label/units";
import { selectAll, selection } from "d3";
import { groupValues } from "powerbi-visuals-utils-dataviewutils/lib/dataViewTransform";
import { DisplayUnit } from "powerbi-visuals-utils-formattingutils/lib/src/displayUnitSystem/displayUnitSystem";
type Selection<T extends d3.BaseType> = d3.Selection<T, any, any, any>;
type DataSelection<T> = d3.Selection<d3.BaseType, T, any, any>;

export interface BarchartDataPoint{
    category: string;
    backBar: number;
    frontBar: number;
}

export interface BarchartViewModel{
    IsNotValid: boolean;
    DataPoints?:BarchartDataPoint[];
    LabelDisplayUnits?: number;
    LabelPrecision?: number;
    AxisDisplayUnits?: number;
    AxisPrecision?: number;
    Format?: string,
    SortBySize?: boolean;
    FrontTransparency?: number;
    ShowXAxis?: boolean;
    XAxisFontSize?: number;
    YAxisFontSize?: number;
    ShowYAxis?: boolean;
    LegendFontSize?: number;
    LabelFontSize?: number;
    ShowLabel?: boolean;
    FontFamily?: string;
    BackBarColor?: string;
    FrontBarColor?: string;
    BackBarSize?: number;
    FrontBarSize?: number;
    ColumnName?: string;
    MeasureName?: string;
    BackLabelFontColor?: string;
    FrontLabelFontColor?: string;
    LabelBackgroundColor?:string;
    LabelTransparency?:number;

}

export default interface IMeasure {
    metadata: DataViewMetadataColumn;
    formatter: IValueFormatter;
    stroke: string;
    selectionId: ISelectionId;
    strokeWidth: number;
    lineShape: string;
    lineStyle: string;
    showArea: boolean;
    backgroundTransparency: number;
}

export class Barchart implements IVisual {
    private svg: Selection<SVGElement>;
    private backBarContainer: Selection<SVGGElement>;
    private backLabelContainer: Selection<SVGGElement>;
    private backTextContainer: Selection<SVGGElement>;
    private backPlotBackground: Selection<SVGRectElement>;
    private backBarSelection: DataSelection<BarchartDataPoint>;
    private backLabelSelection: DataSelection<BarchartDataPoint>;
    private backTextSelection: DataSelection<BarchartDataPoint>;
    private xAxisContainer: Selection<SVGGElement>;
    private yAxisContainer: Selection<SVGGElement>;
    private frontBarContainer: Selection<SVGGElement>;
    private frontLabelContainer: Selection<SVGGElement>;
    private frontTextContainer: Selection<SVGGElement>;
    private frontPlotBackground: Selection<SVGRectElement>;
    private frontBarSelection: DataSelection<BarchartDataPoint>;
    private frontLabelSelection: DataSelection<BarchartDataPoint>;
    private frontTextSelection: DataSelection<BarchartDataPoint>;
    private host: IVisualHost;
    private selectionIdBuilder: IselectionBuilder
    private selectionManager: ISelectionManager;
    private settings: VisualSettings;
    private static margin = {
        top:20,
        right: 20,
        bottom: 30,
        left: 50,
    };

    //for legend
    private legend: ILegend;
    private target: HTMLElement;
    

    constructor(options: VisualConstructorOptions) {
        console.log("Creating visual...")
        this.target = options.element;

        this.selectionIdBuilder = options.host.createSelectionIdBuilder();
        this.selectionManager = options.host.createSelectionManager();

        /**Reserve element for legend */
        this.legend = createLegend(
            this.target,
            false,
            null,
            false,
            LegendPosition.BottomCenter
        );
    
        /** Assign visual host */
        this.host = options.host;

        /**create svg elements */
        this.svg = d3.select(this.target)
            .append('div')
            .append('svg')
            .classed('Barchart',true);

        this.backBarContainer = this.svg
            .append('g')
            .classed('backBarContainer', true);

        this.backPlotBackground = this.backBarContainer
            .append('rect')
            .classed('backPlotBackground', true);
            
        this.xAxisContainer = this.svg
            .append('g')
            .classed('xAxis', true);

        this.yAxisContainer = this.svg
            .append('g')
            .classed('yAxis', true);

        this.frontBarContainer = this.svg
            .append('g')
            .classed('frontBarContainer', true);

        this.frontPlotBackground = this.frontBarContainer
            .append('rect')
            .classed('frontPlotBackground', true);

        this.backLabelContainer = this.svg
            .append('g')
            .classed('backLabelContainer', true);

        this.backTextContainer = this.svg
            .append('g')
            .classed('backTextContainer', true);

        this.frontLabelContainer = this.svg
            .append('g')
            .classed('frontLabelContainer', true);

        this.frontTextContainer = this.svg
            .append('g')
            .classed('frontTextContainer', true);

        this.settings = VisualSettings.getDefault() as VisualSettings;
    }

    public update(options: VisualUpdateOptions) {       
        console.log("Updating visual...")

        /**turn the chart invisible/transparent if there is not front and back bar data*/
        if (Array.isArray(options.dataViews[0].categorical.values) == false || options.dataViews[0].categorical.values.length < 2){
            this.svg.selectAll("*").style("fill-opacity", "0%")
        }else{
            this.svg.selectAll("*").style("fill-opacity", "100%")
        }
        
        /**assigning variables */
        var dataView: DataView = options.dataViews[0]
        var viewModel: BarchartViewModel = this.createViewModel(options.dataViews[0], options.viewport.height);
        var dataPoints = viewModel.DataPoints

        if (viewModel.IsNotValid) {
            return;
        }

        /**create legend */
        var legendDataPoint: LegendDataPoint[] = [];

        legendDataPoint.push(
            {
                label: <string>dataView.categorical.values[0].source.displayName,
                color: <string>viewModel.BackBarColor,
                identity: this.host.createSelectionIdBuilder()
                    .withMeasure("Front Bar")
                    .createSelectionId(),
                selected: false,
                markerShape: MarkerShape.square
            },
            {
                label: <string>dataView.categorical.values[1].source.displayName,
                color: <string>viewModel.FrontBarColor,
                identity: this.host.createSelectionIdBuilder()
                    .withMeasure("Back Bar")
                    .createSelectionId(),
                selected: false,
                markerShape: MarkerShape.square
            },
        )

        this.legend.drawLegend(
            {
                fontSize: viewModel.LegendFontSize,
                fontFamily: viewModel.FontFamily,
                dataPoints: legendDataPoint
            },
            options.viewport
        );

        /**set height and width of root SVG element using viewport passed by Power BI host*/
        this.svg.attr("height",options.viewport.height);
        this.svg.attr("width", options.viewport.width);

        let marginLeft = Barchart.margin.left + viewModel.YAxisFontSize;
        let marginBottom = Barchart.margin.bottom + viewModel.XAxisFontSize + viewModel.LegendFontSize;
        let marginTop = Barchart.margin.top;

        let maxValueX: number = d3.max(
            viewModel.DataPoints,
            (dataPoint: BarchartDataPoint) =>
                // Get the higher of either measure per group
                +Math.max(dataPoint.backBar, dataPoint.frontBar)
        ); 

        /**create number formatter for labels */
        var labelValueFormatter = vf.create({
            format: viewModel.Format,
            precision: viewModel.LabelPrecision != null
                ? viewModel.LabelPrecision
                : null,
            value: viewModel.LabelDisplayUnits === 0
                ? maxValueX / 100
                : viewModel.LabelDisplayUnits,
            cultureSelector: this.host.locale
        });

        /**create number formatter for x-axis */
        var axisValueFormatter = vf.create({
            format: viewModel.Format,
            precision: viewModel.AxisPrecision != null
                ? viewModel.AxisPrecision
                : null,
            value: viewModel.AxisDisplayUnits === 0
                ? maxValueX / 100
                : viewModel.AxisDisplayUnits,
            cultureSelector: this.host.locale
        });

        /**assign variables for tick marks*/
        var leftTick: TextProperties = {
            text: axisValueFormatter.format(0),
            fontFamily: viewModel.FontFamily,
            fontSize: "" + viewModel.XAxisFontSize
        }

        var leftTickSize = textMeasurementService.measureSvgTextRect(leftTick).width

        var rightTick: TextProperties = {
            text: axisValueFormatter.format(maxValueX),
            fontFamily: viewModel.FontFamily,
            fontSize: "" + viewModel.XAxisFontSize
        }

        var rightTickSize = textMeasurementService.measureSvgTextRect(rightTick).width

        var plotArea = {
            x: Math.max(marginLeft, leftTickSize/2+5),
            y:marginTop,
            width: (options.viewport.width - (Math.max(marginLeft, leftTickSize / 2 + 5) + Math.max(Barchart.margin.right, rightTickSize / 2 + 5))),
            height: (options.viewport.height - (marginTop + marginBottom)),
        };

        let recommendedTicks = axis.getRecommendedNumberOfTicksForXAxis(plotArea.width);

        /**create the front and back containers */
        this.backBarContainer
            .attr("transform","translate(" + plotArea.x + "," + plotArea.y + ")")
            .attr("width",options.viewport.width)
            .attr("height", options.viewport.height);

        this.backLabelContainer
            .attr("transform", "translate(" + plotArea.x + "," + plotArea.y + ")")
            .attr("width", options.viewport.width)
            .attr("height", options.viewport.height);

        this.backTextContainer
            .attr("transform", "translate(" + plotArea.x + "," + plotArea.y + ")")
            .attr("width", options.viewport.width)
            .attr("height", options.viewport.height);

        this.backPlotBackground
            .attr("width", plotArea.width)
            .attr("height", plotArea.height)
            .style("fill","white");

        this.frontBarContainer
            .attr("transform", "translate(" + plotArea.x + "," + plotArea.y + ")")
            .attr("width", options.viewport.width)
            .attr("height", options.viewport.height);

        this.frontLabelContainer
            .attr("transform", "translate(" + plotArea.x + "," + plotArea.y + ")")
            .attr("width", options.viewport.width)
            .attr("height", options.viewport.height);

        this.frontTextContainer
            .attr("transform", "translate(" + plotArea.x + "," + plotArea.y + ")")
            .attr("width", options.viewport.width)
            .attr("height", options.viewport.height);

        this.frontPlotBackground
            .attr("width", plotArea.width)
            .attr("height", plotArea.height)
            .style("fill", "none");

        /**create the yAxis */
        var yScale = d3.scaleBand()
            .rangeRound([0, plotArea.height])
            .domain(viewModel.DataPoints.map((dataPoint: BarchartDataPoint) => dataPoint.category));

        this.yAxisContainer
            .attr("class", "yAxis")
            .attr("transform", "translate(" + plotArea.x + "," + plotArea.y + ")")
            .call(d3.axisLeft(yScale).tickSize(0));
        
        d3.select(".yAxis").selectAll("text")
            .style("font-size", viewModel.YAxisFontSize)
            .style("font-family", viewModel.FontFamily)
            .attr("y", viewModel.YAxisFontSize*1.5)
            .style("text-anchor","middle")
            .attr("transform","rotate(90)");

        /**create the xAxis */

        var xScale = d3.scaleLinear()
            .range([0, plotArea.width])
            .domain([0, maxValueX * 1.02]);

        /**only do this if the x-axis is showing */
        if(viewModel.ShowXAxis){
            /**adjusting the number of tick marks so there is no label overlapping */


            var m = 0

            do {
                var xAxis = d3.axisBottom(xScale)
                    .tickFormat((d) => axisValueFormatter.format(d))
                    .ticks(recommendedTicks);

                this.xAxisContainer
                    .attr("class", "xAxis")
                    .attr("transform", "translate(" + plotArea.x + "," + (plotArea.height + plotArea.y) + ")")
                    .call(xAxis)
                    .style("font-size", viewModel.XAxisFontSize)
                    .style("font-family", viewModel.FontFamily)

                var xTickCounter = 0
                var xTickSizeArray = []
                var labelWidth = 0
                var xMaxTickSize = 0
                d3.select(".xAxis").selectAll("text")
                    .each(function (d) {
                        let textProperties: TextProperties = {
                            text: axisValueFormatter.format(d),
                            fontFamily: viewModel.FontFamily,
                            fontSize: viewModel.XAxisFontSize + "px"
                        }
                        
                        let xTickSize = textMeasurementService.measureSvgTextWidth(textProperties)
                        xTickCounter++
                        xTickSizeArray.push(xTickSize)
                        xMaxTickSize = d3.max(xTickSizeArray)
                        labelWidth = ((xTickCounter - .5) * xMaxTickSize)
                    });                
                --recommendedTicks  
                ++m
                
            } while (m<100 && plotArea.width < labelWidth)
        }else{
            this.xAxisContainer.call(d3.axisBottom(xScale).ticks(0))
            d3.select(".xAxis").selectAll(".domain").remove()
        }

        /**create selection for all back and front bars*/
        this.backBarSelection = this.backBarContainer
            .selectAll('.bar')
            .data(viewModel.DataPoints);

        this.backLabelSelection = this.backLabelContainer
            .selectAll('.bar')
            .data(viewModel.DataPoints);

        this.backTextSelection = this.backTextContainer
            .selectAll('.bar')
            .data(viewModel.DataPoints);

        this.frontBarSelection = this.frontBarContainer
            .selectAll('.bar')
            .data(viewModel.DataPoints);

        this.frontLabelSelection = this.frontLabelContainer
            .selectAll('.bar')
            .data(viewModel.DataPoints);

        this.frontTextSelection = this.frontTextContainer
            .selectAll('.bar')
            .data(viewModel.DataPoints);

        /** create constants for the merged for both back and front bars and data labels */
        const backBarSelectionMerged = this.backBarSelection
            .enter()
            .append('rect')
            .merge(<any>this.backBarSelection)
            .classed('bar',true);

        const backLabelMerged = this.backLabelSelection
            .enter()
            .append('rect')
            .merge(<any>this.backLabelSelection)
            .classed('bar', true);

        const backLabelTextMerged = this.backTextSelection
            .enter()
            .append('text')
            .merge(<any>this.backTextSelection)
            .classed('bar', true);

        const frontBarSelectionMerged = this.frontBarSelection
            .enter()
            .append('rect')
            .merge(<any>this.frontBarSelection)
            .classed('bar', true);

        const frontLabelMerged = this.frontLabelSelection
            .enter()
            .append('rect')
            .merge(<any>this.frontLabelSelection)
            .classed('bar', true);

        const frontLabelTextMerged = this.frontTextSelection
            .enter()
            .append('text')
            .merge(<any>this.frontTextSelection)
            .classed('bar', true);

        /**back bar merged */
        backBarSelectionMerged
            .attr("y", (dataPoint: BarchartDataPoint) => yScale(dataPoint.category) + yScale.bandwidth() * viewModel.BackBarSize/2)
            .attr("x",0)
            .attr("height", yScale.bandwidth()*(1 - viewModel.BackBarSize))
            .attr("width", (dataPoint: BarchartDataPoint) => (xScale(Number(dataPoint.backBar))))
            .style("fill", viewModel.BackBarColor);

        /**front bar merged */
        frontBarSelectionMerged
            .attr("y", (dataPoint: BarchartDataPoint) => {
                return yScale(dataPoint.category) + yScale.bandwidth() * (0.5 * (1 - viewModel.FrontBarSize + viewModel.BackBarSize * viewModel.FrontBarSize));
            })
            .attr("x", 0)
            .attr("height", yScale.bandwidth() * viewModel.FrontBarSize * (1 - viewModel.BackBarSize))
            .attr("width", (dataPoint: BarchartDataPoint) => (xScale(Number(dataPoint.frontBar))))
            .style("fill", (dataPoint: BarchartDataPoint) => viewModel.FrontBarColor)
            .style("fill-opacity", (dataPoint: BarchartDataPoint) => (1 - (viewModel.FrontTransparency)));

/**this is where it gets interesting */
    /**Creating variables for all the attributes of the label texts and text boxes. 
     * This includes calculating if the labels are going to go off the y-axis or overlap each other
    */
    
    /**start by checking show label.  If it is false then don't do any of this label stuff.  If true, then do it all*/
        if(viewModel.ShowLabel){

        /**Initial assignement of BACK label TEXT variables */

            /**calculating font size for BACK label so it is not taller than the bar */
            console.log("Show Label:",viewModel.ShowLabel)
            var m = 0
            var backLabelfontSize = viewModel.LabelFontSize
            do {
                var backTextHeight = (dataPoint: BarchartDataPoint) => (textMeasurementService.measureSvgTextHeight(
                    {
                        text: labelValueFormatter.format(dataPoint.backBar),
                        fontFamily: viewModel.FontFamily,
                        fontSize: backLabelfontSize + "px"
                    }
                ))
                
                backLabelfontSize--
                m++
            } while (backTextHeight(viewModel.DataPoints[0]) > Number(backBarSelectionMerged.attr("height")) && m < 100)


            /**BACK label TEXT y position */
            var backLabelTextY = []
            for (let i = 0; i < dataPoints.length; i++) {
                backLabelTextY.push(
                    yScale(dataPoints[i].category)
                    + (yScale.bandwidth() / 2)
                    + (textMeasurementService.measureSvgTextHeight(
                        {
                            text: labelValueFormatter.format(dataPoints[i].backBar),
                            fontFamily: viewModel.FontFamily,
                            fontSize: backLabelfontSize + "px"
                        }
                    )
                    ) / 4
                )
            };

            /**BACK label TEXT x position */
            var backLabelTextX = []
            for (let i = 0; i < dataPoints.length; i++) {
                backLabelTextX.push(
                    xScale(Number(dataPoints[i].backBar))
                        - textMeasurementService.measureSvgTextWidth({
                            text: labelValueFormatter.format(dataPoints[i].backBar),
                            fontFamily: viewModel.FontFamily,
                            fontSize: backLabelfontSize + "px"
                        })
                        - 10
                )
                    
            };

            /**other BACK label TEXT variables */
            var backLabelTextFill = viewModel.BackLabelFontColor
            var backLabelTextText = []
            for (let i = 0; i < dataPoints.length; i++) {
                backLabelTextText.push(
                    labelValueFormatter.format(dataPoints[i].backBar)
                )
            };


        /**Initial assignement of BACK label BACKGROUND variables */

            /**BACK label BACKGROUND y position */
            var backLabelRectY = []
            for (let i = 0; i < dataPoints.length; i++) {
                backLabelRectY.push(
                    yScale(dataPoints[i].category)
                    + (yScale.bandwidth() / 2)
                    - (textMeasurementService.measureSvgTextHeight(
                        {
                            text: labelValueFormatter.format(dataPoints[i].backBar),
                            fontFamily: viewModel.FontFamily,
                            fontSize: backLabelfontSize + "px"
                        }
                    )
                    ) / 2
                )
            };

            /**BACK label BACKGROUND x position */
            var backLabelRectX = []
            for (let i = 0; i < dataPoints.length; i++) {
                backLabelRectX.push(
                    xScale(Number(dataPoints[i].backBar))
                    - textMeasurementService.measureSvgTextWidth({
                        text: labelValueFormatter.format(dataPoints[i].backBar),
                        fontFamily: viewModel.FontFamily,
                        fontSize: backLabelfontSize + "px"
                    })
                    - 15
                )

            };

            /**BACK label BACKGROUND height */
            var backLabelRectHeight = textMeasurementService.measureSvgTextHeight({
                text: labelValueFormatter.format(dataPoints[0].backBar),
                fontFamily: viewModel.FontFamily,
                fontSize: backLabelfontSize + "px"
                } )

            /**BACK label BACKGROUND width */
            var backLabelRectWidth = []
            for (let i = 0; i < dataPoints.length; i++) {
                backLabelRectWidth.push(
                    textMeasurementService.measureSvgTextWidth({
                        text: labelValueFormatter.format(dataPoints[i].backBar),
                        fontFamily: viewModel.FontFamily,
                        fontSize: backLabelfontSize + "px"
                    })
                    + 10
                )

            };

            /**BACK label BACKGROUND other variables*/
            var backLabelRectFill = viewModel.LabelBackgroundColor
            var backLabelRectOpacity = 1 - viewModel.LabelTransparency


        /**Initial assignement of FRONT variables */

            /**calculating font size for FRONT bar so it is not taller than the bar */
            m = 0
            var frontLabelfontSize = viewModel.LabelFontSize
            do {
                var frontTextHeight = (dataPoint: BarchartDataPoint) => (textMeasurementService.measureSvgTextHeight(
                    {
                        text: labelValueFormatter.format(dataPoint.frontBar),
                        fontFamily: viewModel.FontFamily,
                        fontSize: frontLabelfontSize + "px"
                    }
                ))
                frontLabelfontSize--
                m++
            } while (frontTextHeight(viewModel.DataPoints[0]) > Number(frontBarSelectionMerged.attr("height")) && m < 100)

            /**Initial assignement of FRONT label TEXT variables */

            /**FRONT label TEXT y position */
            var frontLabelTextY = []
            for (let i = 0; i < dataPoints.length; i++) {
                frontLabelTextY.push(
                    yScale(dataPoints[i].category)
                    + (yScale.bandwidth() / 2)
                    + (textMeasurementService.measureSvgTextHeight(
                        {
                            text: labelValueFormatter.format(dataPoints[i].frontBar),
                            fontFamily: viewModel.FontFamily,
                            fontSize: backLabelfontSize + "px"
                        }
                    )
                    ) / 4
                )
            };

            /**FRONT label TEXT x position */
            var frontLabelTextX = []
            for (let i = 0; i < dataPoints.length; i++) {
                frontLabelTextX.push(
                    xScale(Number(dataPoints[i].frontBar))
                    - textMeasurementService.measureSvgTextWidth({
                        text: labelValueFormatter.format(dataPoints[i].frontBar),
                        fontFamily: viewModel.FontFamily,
                        fontSize: frontLabelfontSize + "px"
                    })
                    - 10
                )

            };

            /**other FRONT label TEXT variables */
            var frontLabelTextFill = viewModel.FrontLabelFontColor
            var frontLabelTextText = []
            for (let i = 0; i < dataPoints.length; i++) {
                frontLabelTextText.push(
                    labelValueFormatter.format(dataPoints[i].frontBar)
                )
            };


            /**Initial assignement of FRONT label BACKGROUND variables */

            /**FRONT label BACKGROUND y position */
            var frontLabelRectY = []
            for (let i = 0; i < dataPoints.length; i++) {
                frontLabelRectY.push(
                    yScale(dataPoints[i].category)
                    + (yScale.bandwidth() / 2)
                    - (textMeasurementService.measureSvgTextHeight(
                        {
                            text: labelValueFormatter.format(dataPoints[i].frontBar),
                            fontFamily: viewModel.FontFamily,
                            fontSize: frontLabelfontSize + "px"
                        }
                    )
                    ) / 2
                )
            };

            /**FRONT label BACKGROUND x position */
            var frontLabelRectX = []
            for (let i = 0; i < dataPoints.length; i++) {
                frontLabelRectX.push(
                    xScale(Number(dataPoints[i].frontBar))
                    - textMeasurementService.measureSvgTextWidth({
                        text: labelValueFormatter.format(dataPoints[i].frontBar),
                        fontFamily: viewModel.FontFamily,
                        fontSize: frontLabelfontSize + "px"
                    })
                    - 15
                )

            };

            /**FRONT label BACKGROUND height */
            var frontLabelRectHeight = textMeasurementService.measureSvgTextHeight({
                text: labelValueFormatter.format(dataPoints[0].frontBar),
                fontFamily: viewModel.FontFamily,
                fontSize: frontLabelfontSize + "px"
            })

            /**FRONT label BACKGROUND width */
            var frontLabelRectWidth = []
            for (let i = 0; i < dataPoints.length; i++) {
                frontLabelRectWidth.push(
                    textMeasurementService.measureSvgTextWidth({
                        text: labelValueFormatter.format(dataPoints[i].frontBar),
                        fontFamily: viewModel.FontFamily,
                        fontSize: frontLabelfontSize + "px"
                    })
                    + 10
                )

            };

            /**FRONT label BACKGROUND other variables*/
            var frontLabelRectFill = viewModel.LabelBackgroundColor
            var frontLabelRectOpacity = 1 - viewModel.LabelTransparency

            console.log("frontLabelRectFill: ", frontLabelRectFill)
            console.log("frontLabelRectOpacity: ", frontLabelRectOpacity)

            /**
             * checking if adjustments need to be made to label variables 
            */

            /**checking if back labels are to the left of the y-axis and removing them if they are*/
            for(let i=0; i < backLabelRectX.length; i++){
                if(backLabelRectX[i]<=0){
                    backLabelTextText[i]=""
                    backLabelTextX[i] =0
                    backLabelRectX[i]=0
                    backLabelRectWidth[i]=0
                }
            }

            /**checking if front labels are to the left of the y-axis and removing them if they are*/
            for (let i = 0; i < frontLabelRectX.length; i++) {
                if (frontLabelRectX[i] <= 0) {
                    frontLabelTextText[i] = ""
                    frontLabelTextX[i] = 0
                    frontLabelRectX[i] = 0
                    frontLabelRectWidth[i] = 0
                }
            }

            /**checking if back label is to the left of front and overlaps with front - if it does, then move it to the left*/
            for (let i = 0; i < backLabelRectX.length; i++) {
                if (backLabelRectX[i] <= frontLabelRectX[i] && (backLabelRectX[i] + backLabelRectWidth[i]) >= frontLabelRectX[i]) {
                    let backXAdj = backLabelRectX[i] + backLabelRectWidth[i] - frontLabelRectX[i] +5
                    if (backLabelRectX[i] - backXAdj<0){
                        backLabelTextText[i] = ""
                        backLabelTextX[i] = 0
                        backLabelRectX[i] = 0
                        backLabelRectWidth[i] = 0                    
                    }else{
                        backLabelRectX[i] = backLabelRectX[i] - backXAdj
                        backLabelTextX[i] = backLabelTextX[i] - backXAdj
                    }
                }
            }


            /**checking if front label is to the left of back and overlaps with back - if it does, then move it to the left*/
            for (let i = 0; i < frontLabelRectX.length; i++) {
                if (frontLabelRectX[i] <= backLabelRectX[i] && (frontLabelRectX[i] + frontLabelRectWidth[i]) >= backLabelRectX[i]) {
                    let frontXAdj = frontLabelRectX[i] + frontLabelRectWidth[i] - backLabelRectX[i] + 5
                    if (frontLabelRectX[i] - frontXAdj < 0) {
                        frontLabelTextText[i] = ""
                        frontLabelTextX[i] = 0
                        frontLabelRectX[i] = 0
                        frontLabelRectWidth[i] = 0
                    } else {
                        frontLabelRectX[i] = frontLabelRectX[i] - frontXAdj
                        frontLabelTextX[i] = frontLabelTextX[i] - frontXAdj
                    }
                }
            }


            /**Create the BACK label text */
            backLabelTextMerged
                .attr("y", (_: BarchartDataPoint,i) => (backLabelTextY[i]))
                .attr("x", (_: BarchartDataPoint,i) => (backLabelTextX[i]))
                .style("fill", backLabelTextFill)
                .style("font-family", viewModel.FontFamily)
                .style("font-size", backLabelfontSize + "px")
                .text((_: BarchartDataPoint,i) => (backLabelTextText[i]))

            /**create the BACK label background */
            backLabelMerged
                .attr("y", (_: BarchartDataPoint, i) => (backLabelRectY[i]))
                .attr("x", (_: BarchartDataPoint, i) => (backLabelRectX[i]))
                .attr("height", backLabelRectHeight)
                .attr("rx", backLabelRectHeight * .2)
                .attr("width", (_: BarchartDataPoint, i) => (backLabelRectWidth[i]))
                .style("fill", backLabelRectFill)
                .style("fill-opacity", backLabelRectOpacity)
            
            /**create FRONT label text */
            frontLabelTextMerged
                .attr("y", (_: BarchartDataPoint, i) => (frontLabelTextY[i]))
                .attr("x", (_: BarchartDataPoint, i) => (frontLabelTextX[i]))
                .style("fill", frontLabelTextFill)
                .style("font-family", viewModel.FontFamily)
                .style("font-size", frontLabelfontSize + "px")
                .text((_: BarchartDataPoint, i) => (frontLabelTextText[i]))

            /**create FRONT label background */
            frontLabelMerged
                .attr("y", (_: BarchartDataPoint, i) => (frontLabelRectY[i]))
                .attr("x", (_: BarchartDataPoint, i) => (frontLabelRectX[i]))
                .attr("height", frontLabelRectHeight)
                .attr("rx", frontLabelRectHeight * .2)
                .attr("width", (_: BarchartDataPoint, i) => (frontLabelRectWidth[i]))
                .style("fill", frontLabelRectFill)
                .style("fill-opacity", frontLabelRectOpacity)
        }else{
            /**clearing out labels because they are turned off */
            backLabelTextMerged
                .attr("y", 0)
                .attr("x", 0)
                .text("")

            /**create the BACK label background */
            backLabelMerged
                .attr("y",0)
                .attr("x",0)
                .attr("height",0)
                .attr("width",0)

            /**create FRONT label text */
            frontLabelTextMerged
                .attr("y", 0)
                .attr("x", 0)
                .text("")

            /**create FRONT label background */
            frontLabelMerged
                .attr("y", 0)
                .attr("x", 0)
                .attr("height", 0)
                .attr("width", 0)
        }

        /**remove old elements */
        this.backLabelSelection
            .exit()
            .remove();

        this.backTextSelection
            .exit()
            .remove();

        this.backBarSelection
            .exit()
            .remove();
            
        this.frontBarSelection
            .exit()
            .remove();


        this.frontLabelSelection
            .exit()
            .remove();

        this.frontTextSelection
            .exit()
            .remove();
        
        this.xAxisContainer
            .exit()
            .remove();

    }

    public createViewModel(dataView: DataView, viewportHieght): BarchartViewModel{

        //handle case where categorical DataView is not valid
        if(typeof dataView === "undefined" ||
            typeof dataView.categorical === "undefined" ||
            typeof dataView.categorical.categories === "undefined" ||
            typeof dataView.categorical.values === "undefined"){
            return {IsNotValid: true};
        }


        this.settings=VisualSettings.parse(dataView) as VisualSettings;

        var categoricalDataView: DataViewCategorical = dataView.categorical;
        var categoryColumn: DataViewCategoricalColumn = categoricalDataView.categories[0];
        var categoryNames: PrimitiveValue[] = categoricalDataView.categories[0].values;
        var categoryValues: PrimitiveValue[] = categoricalDataView.values[0].values;

        //get persistent property values
        var showXAxis: boolean = this.settings.axisProperties.showXAxis
        var showYAxis: boolean = this.settings.axisProperties.showYAxis
        var showLabel: boolean = this.settings.labelProperties.show
        var SortBySize: boolean = this.settings.chartProperties.sortBySize;
        var labelDisplayUnits: number = this.settings.labelProperties.labelDisplayUnits;
        var labelPrecision: number = this.settings.labelProperties.labelPrecision;
        var axisDisplayUnits: number = (!showXAxis) ? null :this.settings.axisProperties.axisDisplayUnits;
        var axisPrecision: number = (!showXAxis) ? null :this.settings.axisProperties.axisPrecision;
        var xAxisFontSize: number = (!showXAxis) ? 0 :this.settings.axisProperties.xAxisFontSize;
        var yAxisFontSize: number = (!showYAxis) ? 0 : this.settings.axisProperties.yAxisFontSize;
        var legendFontSize: number = this.settings.chartProperties.legendFontSize;
        var labelFontSize: number = this.settings.labelProperties.labelFontSize;
        var fontFamily: string = this.settings.chartProperties.fontFamily;
        var frontTransparency: number = this.settings.barProperties.frontTransparency / 100;
        var backBarSize: number = (10 - this.settings.barProperties.backBarSize) / 10;
        var frontBarSize: number = this.settings.barProperties.frontBarSize / 10;
        var backBarColor: string = typeof (this.settings.barProperties.backBarColor) == "string" ?
            this.settings.barProperties.backBarColor :
            this.settings.barProperties.backBarColor.solid.color;
        var frontBarColor: string = typeof (this.settings.barProperties.frontBarColor) == "string" ?
            this.settings.barProperties.frontBarColor :
            this.settings.barProperties.frontBarColor.solid.color;
        var backLabelFontColor: string = typeof (this.settings.labelProperties.backLabelFontColor) == "string" ?
            this.settings.labelProperties.backLabelFontColor :
            this.settings.labelProperties.backLabelFontColor.solid.color;
        var frontLabelFontColor: string = typeof (this.settings.labelProperties.frontLabelFontColor) == "string" ?
            this.settings.labelProperties.frontLabelFontColor :
            this.settings.labelProperties.frontLabelFontColor.solid.color;
        var showBackground: boolean = this.settings.labelProperties.showBackground;
        var labelTransparency: number = (!showBackground) ? 1 : this.settings.labelProperties.labelTransparency/100;
        var labelBackgroundColor: string = typeof (this.settings.labelProperties.labelBackgroundColor) == "string" ?
            this.settings.labelProperties.labelBackgroundColor :
            this.settings.labelProperties.labelBackgroundColor.solid.color;
        

        

        var BarchartDataPoints: BarchartDataPoint[] = [];

        /** Iterate over the category values and push into the view model data points.
         * The index is the same across cateogries and measures.
         *      backBar = values[0]
         *      frontBar = values[1]
         */

            categoryNames.map((c,ci) => {/** c= category, ci = category array index*/
                let textProperties: TextProperties = {
                    text:""+c,
                    fontFamily: fontFamily,
                    fontSize: yAxisFontSize + "px"
                }

                let plotHeight = viewportHieght - (Barchart.margin.top + Barchart.margin.bottom * (xAxisFontSize / 10)+10)

                let bandwidth = plotHeight/3
                BarchartDataPoints.push({
                    category: <string>textMeasurementService.getTailoredTextOrDefault(textProperties, bandwidth),
                    backBar: <number>categoricalDataView.values[0].values[ci],
                    frontBar: <number>categoricalDataView.values[1].values[ci],
                });
            });

        //get formatting code for the field that is the measure
        var format: string = categoricalDataView.values[0].source.format
            
        //sort dataset rows by measure value instead of cateogry value
        if(SortBySize){
            BarchartDataPoints.sort((x,y) =>{return x.backBar - y.backBar})
        }

        //return view model to upate method
        return{
            IsNotValid: false,
            DataPoints: BarchartDataPoints,
            LabelDisplayUnits: labelDisplayUnits,
            LabelPrecision: labelPrecision,
            AxisDisplayUnits: axisDisplayUnits,
            AxisPrecision: axisPrecision,
            Format: format,
            SortBySize: SortBySize,
            BackBarColor: backBarColor,
            FrontBarColor: frontBarColor,
            FrontTransparency: frontTransparency,
            FontFamily: fontFamily,
            BackBarSize: backBarSize,
            FrontBarSize: frontBarSize,
            XAxisFontSize: xAxisFontSize,
            ShowXAxis: showXAxis,
            ShowYAxis: showYAxis,
            YAxisFontSize: yAxisFontSize,
            LegendFontSize: legendFontSize,
            ShowLabel: showLabel,
            LabelFontSize: labelFontSize,
            ColumnName: dataView.metadata.columns[1].displayName, 
            MeasureName:dataView.metadata.columns[0].displayName,
            BackLabelFontColor: backLabelFontColor,
            FrontLabelFontColor: frontLabelFontColor,
            LabelBackgroundColor: labelBackgroundColor,
            LabelTransparency: labelTransparency
        };
    }

    public enumerateObjectInstances(options: EnumerateVisualObjectInstancesOptions): VisualObjectInstanceEnumeration {

        var visualObjects: VisualObjectInstanceEnumerationObject = 
            <VisualObjectInstanceEnumerationObject>VisualSettings.enumerateObjectInstances(this.settings, options);
        
        visualObjects.instances[0].validValues = {
            xAxisFontSize:{numberRange:{min: 10, max:36}},
            yAxisFontSize: {numberRange: { min: 10, max: 36 } },
            legendFontSize: { numberRange: { min: 10, max: 36 } },
            labelFontSize: { numberRange: { min: 10, max: 36 } },
            frontTransparency: {numberRange: { min: 0, max: 90 } },
            backBarSize: {numberRange: { min: 1, max: 10 }},
            frontBarSize: {numberRange: { min: 1, max: 10 }},
            precision: { numberRange: { min: 0, max: 2 } },
            labelTransparency: { numberRange: { min: 0, max: 100 } },
        };

        let objectName = options.objectName;

        switch(objectName){
            case "axisProperties":{
                if(!this.settings.axisProperties.showYAxis){
                    delete visualObjects.instances[0].properties["yAxisFontSize"]
                }
                break;
            }
        }

        switch (objectName) {
            case "axisProperties": {
                if (!this.settings.axisProperties.showXAxis) {
                    delete visualObjects.instances[0].properties["axisDisplayUnits"]
                    delete visualObjects.instances[0].properties["axisPrecision"]
                    delete visualObjects.instances[0].properties["xAxisFontSize"]
                }
                break;
            }

        }

        switch (objectName) {
            case "labelProperties": {
                if (!this.settings.labelProperties.showBackground) {
                    delete visualObjects.instances[0].properties["labelBackgroundColor"]
                    delete visualObjects.instances[0].properties["labelTransparency"]
                }
                break;
            }

        }

        return visualObjects
    }
}
