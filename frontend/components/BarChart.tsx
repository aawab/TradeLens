import React, { useRef, useEffect, useCallback, useState } from 'react';
import * as d3 from 'd3';
import type { BarChartProps, ChartDimensions } from '../types/index';
import { useAppStore } from '../stores/appStore';
import { dataService } from '../services/dataService';

// Fallback data for when API is unavailable
const fallbackMseData = [
  4192.208285950465, 2957.257034033883, 2482.2866645417175, 
  2092.231873076597, 1978.7127033802503, 1773.1183702411172, 
  1683.8174884991984, 1587.8448375236683, 1411.0062960787684, 
  1272.6786662918385
];

const fallbackOptimalK = 4;

const createTooltipHTML = (kValue: number, mse: number) => 
  `<strong>k = ${kValue}</strong><br/>MSE: ${(typeof mse === 'number' ? mse : 0).toFixed(2)}`;

const getResponsiveFontSizes = (dimensions: ChartDimensions) => ({
  axisText: Math.max(8, dimensions.width * 0.018),
  axisLabel: Math.max(10, dimensions.width * 0.022),
  valueLabel: Math.max(6, dimensions.width * 0.016),
  annotation: Math.max(8, dimensions.width * 0.02)
});

const BarChart: React.FC<BarChartProps> = () => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { k, setK } = useAppStore();
  const [mseData, setMseData] = useState<number[]>(fallbackMseData);
  const [optimalK, setOptimalK] = useState<number>(fallbackOptimalK);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [dimensions, setDimensions] = useState<ChartDimensions>({
    width: 400,
    height: 300,
    margin: { top: 30, right: 20, bottom: 60, left: 60 }
  });

  // Load MSE data from data service
  const loadMseData = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Ensure data service is loaded
      await dataService.loadAllData();
      
             // Get clustering data (use empty array if no data loaded yet)
       const countryData = dataService.getCsvData() || [];
       const result = await dataService.processDataForClustering(countryData, k);
      
      if (result.mseValues && result.mseValues.length > 0) {
        setMseData(result.mseValues);
        setOptimalK(result.optimalK);
      }
      
    } catch (error) {
      console.error('Failed to load MSE data:', error);
      // Keep fallback data on error
    } finally {
      setIsLoading(false);
    }
  }, [k]);

  // Load data on component mount
  useEffect(() => {
    loadMseData();
  }, [loadMseData]);

  // Update dimensions based on container size
  const updateDimensions = useCallback(() => {
    if (!containerRef.current) return;
    
    const { width: rectWidth, height: rectHeight } = containerRef.current.getBoundingClientRect();
    const w = Math.max(rectWidth, 250);
    const h = Math.max(rectHeight, 300);
    
    setDimensions({
      width: w,
      height: h,
      margin: { 
        top: Math.round(h * 0.05),
        right: Math.round(w * 0.05),
        bottom: Math.max(100, Math.round(h * 0.35)),
        left: Math.round(w * 0.15)
      }
    });
  }, []);

  // Handle window resize
  useEffect(() => {
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, [updateDimensions]);

  const chartWidth = dimensions.width - dimensions.margin.left - dimensions.margin.right;
  const chartHeight = dimensions.height - dimensions.margin.top - dimensions.margin.bottom;

  const drawChart = useCallback(() => {
    if (!svgRef.current || isLoading) return;

    // Ensure MSE data is properly formatted as numbers
    const validMseData = mseData.map(d => typeof d === 'number' ? d : parseFloat(d) || 0);
    
    // Clear previous content
    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3.select(svgRef.current)
      .attr("width", dimensions.width)
      .attr("height", dimensions.height);

    const chart = svg.append("g")
      .attr("transform", `translate(${dimensions.margin.left}, ${dimensions.margin.top})`);

    // Create scales
    const xScale = d3.scaleBand()
      .domain(validMseData.map((_, i) => (i + 1).toString()))
      .range([0, chartWidth])
      .padding(0.1);

    const yScale = d3.scaleLinear()
      .domain([0, d3.max(validMseData) as number])
      .range([chartHeight, 0])
      .nice();

    const fontSizes = getResponsiveFontSizes(dimensions);

    // Add axes with responsive styling
    chart.append("g")
      .attr("transform", `translate(0, ${chartHeight})`)
      .call(d3.axisBottom(xScale))
      .selectAll("text")
      .style("font-size", `${fontSizes.axisText}px`)
      .style("fill", "#374151")
      .style("font-weight", "500");

    chart.append("g")
      .call(d3.axisLeft(yScale))
      .selectAll("text")
      .style("font-size", `${fontSizes.axisText}px`)
      .style("fill", "#374151")
      .style("font-weight", "500");

    // Add axis labels
    const addAxisLabel = (text: string, x: number, y: number, transform?: string) => {
      const textElement = chart.append("text")
        .attr("x", x)
        .attr("y", y)
        .style("text-anchor", "middle")
        .style("font-size", `${fontSizes.axisLabel}px`)
        .style("font-weight", "600")
        .style("fill", "#1E3A8A")
        .style("letter-spacing", "0.5px")
        .text(text);
      
      if (transform) {
        textElement.attr("transform", transform);
      }
    };

    addAxisLabel("Number of Clusters (k)", chartWidth / 2, chartHeight + dimensions.margin.bottom * 0.5);
    addAxisLabel("Mean Squared Error (MSE)", -chartHeight / 2, -dimensions.margin.left * 0.65, "rotate(-90)");

    // Bar styling
    const barHoverOpacity = 0.8;
    const strokeWidth = Math.max(0.5, dimensions.width * 0.002);

    // Create bars
    const createBars = () => {
      return chart.selectAll(".bar")
        .data(validMseData)
        .enter()
        .append("rect")
        .attr("class", "bar")
        .attr("x", (_, i) => xScale((i + 1).toString()) ?? 0)
        .attr("y", d => yScale(d))
        .attr("width", xScale.bandwidth())
        .attr("height", d => chartHeight - yScale(d))
        .style("fill", (_, i) => (i + 1) === k ? "#EA580C" : "#1E3A8A")
        .style("stroke", "#374151")
        .style("stroke-width", strokeWidth)
        .style("cursor", "pointer");
    };

    // Create tooltip
    const createTooltip = () => {
      return d3.select("body")
        .append("div")
        .attr("class", "bar-tooltip")
        .style("position", "absolute")
        .style("background", "#1F2937")
        .style("color", "#FFFFFF")
        .style("border", "1px solid #9CA3AF")
        .style("border-radius", "8px")
        .style("padding", "10px")
        .style("font-size", `${Math.max(10, dimensions.width * 0.025)}px`)
        .style("pointer-events", "none")
        .style("opacity", 0)
        .style("box-shadow", "0 4px 20px rgba(30, 58, 138, 0.25)");
    };

    const bars = createBars();

    // Modern event handlers using arrow functions
    bars
      .on("mouseover", function(event, d) {
        d3.select(this)
          .style("opacity", barHoverOpacity)
          .style("stroke-width", strokeWidth * 2);
        
        const tooltip = createTooltip();
        const kValue = validMseData.indexOf(d) + 1;
        
        tooltip
          .html(createTooltipHTML(kValue, d))
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 10) + "px")
          .transition()
          .duration(200)
          .style("opacity", 1);
      })
      .on("mouseout", function() {
        d3.select(this)
          .style("opacity", 1)
          .style("stroke-width", strokeWidth);
        d3.selectAll(".bar-tooltip").remove();
      })
      .on("click", (event, d) => {
        const newK = validMseData.indexOf(d) + 1;
        setK(newK);
      });

    // Add refined value labels on bars
    chart.selectAll(".bar-label")
      .data(validMseData)
      .enter()
      .append("text")
      .attr("class", "bar-label")
      .attr("x", (_, i) => (xScale((i + 1).toString()) ?? 0) + xScale.bandwidth() / 2)
      .attr("y", d => yScale(d) - Math.max(4, dimensions.height * 0.015))
      .attr("text-anchor", "middle")
      .style("font-size", `${fontSizes.valueLabel}px`)
      .style("font-weight", "600")
      .style("fill", "#374151")
      .style("text-shadow", "0 1px 2px rgba(255, 255, 255, 0.8)")
      .text(d => (typeof d === 'number' ? d : 0).toFixed(0));

    // Add elbow indicator line with responsive styling
    const elbowX = (xScale(optimalK.toString()) ?? 0) + xScale.bandwidth() / 2;
    const dashArray = Math.max(3, dimensions.width * 0.008);
    
    chart.append("line")
      .attr("class", "elbow-line")
      .attr("x1", elbowX)
      .attr("y1", 0)
      .attr("x2", elbowX)
      .attr("y2", chartHeight)
      .style("stroke", "#EA580C")
      .style("stroke-width", Math.max(1.5, dimensions.width * 0.004))
      .style("stroke-dasharray", `${dashArray},${dashArray}`)
      .style("opacity", 0.8);

    // Enhanced elbow annotation with modern styling
    const annotationY = chartHeight * 0.15;
    
    chart.append("text")
      .attr("class", "elbow-annotation")
      .attr("x", elbowX + Math.max(8, dimensions.width * 0.02))
      .attr("y", annotationY)
      .style("font-size", `${fontSizes.annotation}px`)
      .style("font-weight", "600")
      .style("fill", "#EA580C")
      .style("letter-spacing", "0.3px")
      .text("Optimal");

    // Add subtle background gradient for visual appeal
    const defs = svg.append("defs");
    const gradient = defs.append("linearGradient")
      .attr("id", "chart-gradient")
      .attr("x1", "0%")
      .attr("x2", "0%")
      .attr("y1", "0%")
      .attr("y2", "100%");

    gradient.append("stop")
      .attr("offset", "0%")
      .attr("stop-color", "#F8FAFC")
      .attr("stop-opacity", 0.3);

    gradient.append("stop")
      .attr("offset", "100%")
      .attr("stop-color", "#F1F5F9")
      .attr("stop-opacity", 0.1);

    chart.insert("rect", ":first-child")
      .attr("width", chartWidth)
      .attr("height", chartHeight)
      .style("fill", "url(#chart-gradient)");

  }, [dimensions, k, setK, chartWidth, chartHeight, mseData, optimalK, isLoading]);

  // Redraw chart when dependencies change
  useEffect(() => {
    drawChart();
  }, [drawChart]);

  return (
    <div ref={containerRef} className="bar-chart-container">
      {isLoading && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          color: '#374151',
          fontSize: '14px'
        }}>
          Loading MSE data...
        </div>
      )}
      <svg ref={svgRef} className="responsive-svg" />
    </div>
  );
};

export default BarChart;