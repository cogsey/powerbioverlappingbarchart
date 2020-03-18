/*
 *  Power BI Visualizations
 *
 *  Copyright (c) Microsoft Corporation
 *  All rights reserved.
 *  MIT License
 *
 *  Permission is hereby granted, free of charge, to any person obtaining a copy
 *  of this software and associated documentation files (the ""Software""), to deal
 *  in the Software without restriction, including without limitation the rights
 *  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *  copies of the Software, and to permit persons to whom the Software is
 *  furnished to do so, subject to the following conditions:
 *
 *  The above copyright notice and this permission notice shall be included in
 *  all copies or substantial portions of the Software.
 *
 *  THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 *  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 *  THE SOFTWARE.
 */

"use strict";

import { dataViewObjectsParser } from "powerbi-visuals-utils-dataviewutils";
import DataViewObjectsParser = dataViewObjectsParser.DataViewObjectsParser;
import powerbi from "powerbi-visuals-api";
import Fill = powerbi.Fill;

export class VisualSettings extends DataViewObjectsParser {
  // public dataPoint: dataPointSettings = new dataPointSettings();
  public chartProperties: ChartProperties = new ChartProperties();
  public barProperties: BarProperties = new BarProperties();
  public axisProperties: AxisProperties = new AxisProperties();
  public labelProperties: LabelProperties = new LabelProperties();
}

export class ChartProperties {
  sortBySize: boolean = true;
  fontFamily: string = "Arial";
  legendFontSize: number = 20;
}

export class BarProperties {
  backBarColor: Fill = { "solid": { "color": "#8ea9db" } }; //default color is light blue
  frontBarColor: Fill = { "solid": { "color": "#0cad47" } }; //default color is green
  frontTransparency: number = 50;
  backBarSize: number = 5;
  frontBarSize: number = 5;
}

export class AxisProperties {
  showXAxis: boolean = true;
  xAxisFontSize: number = 25;
  axisDisplayUnits: number = 0;
  axisPrecision: number = 0;
  showYAxis: boolean = true;
  yAxisFontSize: number = 25;
}


export class LabelProperties {
  show:boolean = true;
  labelDisplayUnits: number = 0;
  labelPrecision: number = 0;
  labelFontSize: number = 25;
  backLabelFontColor: Fill = { "solid": { "color": "#8ea9db" } }; //default color is light blue
  frontLabelFontColor: Fill = { "solid": { "color": "#0cad47" } }; //default color is green
  showBackground: boolean = true;
  labelBackgroundColor: Fill = { "solid": { "color": "#000000" } }; //default color is black
  labelTransparency: number = 60
}



